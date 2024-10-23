import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Vaccine } from "../models/entities/Vaccine.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { ObjectId } from "mongodb";

export class VaccineService {
    private vaccineRepository: MongoRepository<Vaccine>;
    private petRepository: MongoRepository<Pet>;

    constructor() {
        this.vaccineRepository = AppDataSource.getMongoRepository(Vaccine);
        this.petRepository = AppDataSource.getMongoRepository(Pet);
    }

    async create(data: VaccineInput): Promise<Vaccine> {
        const vaccine = this.vaccineRepository.create(data);
        return this.vaccineRepository.save(vaccine);
    }

    async addPetToVaccine(vaccineId: string, petId: string): Promise<Vaccine> {
        const vaccine = await this.vaccineRepository.findOneBy({ 
            _id: new ObjectId(vaccineId) 
        });
        
        if (!vaccine) {
            throw new Error("Vaccine not found");
        }

        const pet = await this.petRepository.findOneBy({ 
            _id: new ObjectId(petId) 
        });

        if (!pet) {
            throw new Error("Pet not found");
        }

        // Adiciona o pet à vacina se ainda não estiver
        if (!vaccine.pets.some(id => id.toString() === petId)) {
            await this.vaccineRepository.updateOne(
                { _id: vaccine._id },
                { $push: { pets: new ObjectId(petId) } }
            );

            // Adiciona a vacina ao pet
            await this.petRepository.updateOne(
                { _id: pet._id },
                { $push: { vaccines: vaccine._id } }
            );
        }

        return this.vaccineRepository.findOneBy({ _id: vaccine._id }) as Promise<Vaccine>;
    }

    async removePetFromVaccine(vaccineId: string, petId: string): Promise<void> {
        await this.vaccineRepository.updateOne(
            { _id: new ObjectId(vaccineId) },
            { $pull: { pets: new ObjectId(petId) } }
        );

        await this.petRepository.updateOne(
            { _id: new ObjectId(petId) },
            { $pull: { vaccines: new ObjectId(vaccineId) } }
        );
    }

    async findByPet(petId: string): Promise<Vaccine[]> {
        return this.vaccineRepository.find({
            where: {
                pets: new ObjectId(petId)
            }
        });
    }

    async findAll(): Promise<Vaccine[]> {
        return this.vaccineRepository.find();
    }

    async findById(id: string): Promise<Vaccine | null> {
        return this.vaccineRepository.findOneBy({ _id: new ObjectId(id) });
    }

    async update(id: string, data: UpdateVaccineInput): Promise<Vaccine | null> {
        await this.vaccineRepository.update(id, data);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.vaccineRepository.delete(id);
        return result.affected !== 0;
    }
}
