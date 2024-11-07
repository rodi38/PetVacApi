import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Vaccine } from "../models/entities/Vaccine.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";
import { ObjectId } from "mongodb";
import { AppError } from "../utils/errorHandler";

export class VaccineService {
	private vaccineRepository: MongoRepository<Vaccine>;
	private petRepository: MongoRepository<Pet>;
	private petVaccineRepository: MongoRepository<PetVaccine>;

	constructor() {
		this.vaccineRepository = AppDataSource.getMongoRepository(Vaccine);
		this.petRepository = AppDataSource.getMongoRepository(Pet);
		this.petVaccineRepository = AppDataSource.getMongoRepository(PetVaccine);
	}

	async create(data: Omit<Vaccine, "_id" | "createdAt" | "updatedAt">): Promise<Vaccine> {
		const vaccine = this.vaccineRepository.create(data);
		return this.vaccineRepository.save(vaccine);
	}

	async findAll(): Promise<Vaccine[]> {
		return this.vaccineRepository.find();
	}

	async findById(id: string): Promise<Vaccine | null> {
		return this.vaccineRepository.findOneBy({ _id: new ObjectId(id) });
	}

	async update(id: string, data: Partial<Vaccine>): Promise<Vaccine | null> {
		await this.vaccineRepository.update(id, data);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.vaccineRepository.delete(id);
		return result.affected !== 0;
	}

	async addVaccineToPet(vaccineId: string, petId: string, vaccinationDate: Date, notes?: string): Promise<PetVaccine> {
		const pet = await this.petRepository.findOneBy({ _id: new ObjectId(petId) });
		if (!pet) {
			throw new AppError("Pet not found", 404, "PET_NOT_FOUND");
		}

		const vaccine = await this.vaccineRepository.findOneBy({ _id: new ObjectId(vaccineId) });
		if (!vaccine) {
			throw new AppError("Vaccine not found", 404, "VACCINE_NOT_FOUND");
		}

		// Verificar se a vacina já foi aplicada neste pet
		const existingVaccination = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
			},
		});

		if (existingVaccination) {
			throw new AppError("This vaccine is already registered for this pet", 400, "VACCINE_ALREADY_REGISTERED");
		}

		// Criar novo registro de vacinação
		const petVaccine = this.petVaccineRepository.create({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			vaccinationDate,
			notes,
		});

		return this.petVaccineRepository.save(petVaccine);
	}

	async findByPet(petId: string): Promise<
		{
			vaccine: Vaccine;
			vaccinationDate: Date;
			notes?: string;
		}[]
	> {
		// Verificar se o pet existe
		const pet = await this.petRepository.findOneBy({ _id: new ObjectId(petId) });
		if (!pet) {
			throw new AppError("Pet not found", 404, "PET_NOT_FOUND");
		}

		// Buscar todas as vacinações do pet
		const petVaccinations = await this.petVaccineRepository.find({
			where: { petId: new ObjectId(petId) },
		});

		// Buscar os detalhes de cada vacina
		const vaccinations = await Promise.all(
			petVaccinations.map(async (pv) => {
				const vaccine = await this.vaccineRepository.findOneBy({
					_id: pv.vaccineId,
				});

				return {
					vaccine: vaccine!,
					vaccinationDate: pv.vaccinationDate,
					notes: pv.notes,
				};
			}),
		);

		return vaccinations;
	}

	async getPetVaccinesCount(petId: string): Promise<number> {
		const count = await this.petVaccineRepository.count({
			where: {
				petId: new ObjectId(petId),
			},
		});
		return count;
	}
}
