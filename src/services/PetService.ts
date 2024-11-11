import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Pet } from "../models/entities/Pet.Entity";
import { ObjectId } from "mongodb";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";

export class PetService {
	private petRepository: MongoRepository<Pet>;
	private petVaccineRepository: MongoRepository<PetVaccine>;

	constructor() {
		this.petRepository = AppDataSource.getMongoRepository(Pet);
		this.petVaccineRepository = AppDataSource.getMongoRepository(PetVaccine);
	}

	async create(petData: Omit<Pet, "_id" | "vaccines" | "createdAt" | "updatedAt">): Promise<Pet> {
		const pet = this.petRepository.create(petData);
		return this.petRepository.save(pet);
	}

	async findAll(): Promise<Pet[]> {
		return this.petRepository.find();
	}

	async findById(id: string): Promise<Pet | null> {
		return this.petRepository.findOneBy({ _id: new ObjectId(id) });
	}

	async update(id: string, petData: Partial<Pet>): Promise<Pet | null> {
		await this.petRepository.update(id, petData);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		try {
			// Primeiro, deletamos todos os registros de vacinas relacionados
			await this.petVaccineRepository.deleteMany({
				petId: new ObjectId(id),
			});

			// Depois, deletamos o pet
			const result = await this.petRepository.delete(id);
			return result.affected !== 0;
		} catch (error) {
			console.error("Error deleting pet and related records:", error);
			throw error;
		}
	}

	async getAllPetsByOwner(ownerId: string): Promise<Pet[]> {
		return this.petRepository.find({
			where: {
				owner: new ObjectId(ownerId),
			},
		});
	}
}
