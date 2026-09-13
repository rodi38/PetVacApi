import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Vaccine } from "../models/entities/Vaccine.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";
import { ObjectId } from "mongodb";
import { AppError } from "../utils/errorHandler";
import { AddVaccineToPetInput, UpdatePetVaccineInput } from "../models/schemas/vaccineSchema";
import { logger } from "../config/logger";

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

	private async findOwnedPetOrThrow(petId: string, ownerId: ObjectId): Promise<Pet> {
		const pet = await this.petRepository.findOneBy({ _id: new ObjectId(petId) });
		if (!pet || !pet.owner.equals(ownerId)) {
			// 404 em ambos os casos para não revelar a existência de pets de outros usuários (IDOR).
			throw new AppError("Pet não encontrado", 404, "PET_NOT_FOUND");
		}
		return pet;
	}

	async addVaccineToPet(vaccineId: string, petId: string, ownerId: ObjectId, data: Omit<AddVaccineToPetInput, "petId" | "vaccineId">): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const vaccine = await this.vaccineRepository.findOneBy({ _id: new ObjectId(vaccineId) });
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Verificar se a vacina já foi aplicada neste pet
		const existingVaccination = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
			},
		});

		if (existingVaccination) {
			throw new AppError("Esta vacina já está registrada para este pet", 400, "VACCINE_ALREADY_REGISTERED");
		}

		// Processar as datas
		const vaccinationDate = new Date(data.vaccinationDate);
		const nextDoseDate = data.nextDoseDate ? new Date(data.nextDoseDate) : undefined;

		// Criar novo registro de vacinação com todos os campos
		const petVaccine = this.petVaccineRepository.create({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			vaccinationDate,
			notes: data.notes,
			veterinarian: data.veterinarian,
			clinic: data.clinic,
			nextDoseDate,
		});

		return this.petVaccineRepository.save(petVaccine);
	}

	async getVaccineDetails(vaccineId: string, petId: string, ownerId: ObjectId): Promise<{ vaccine: Vaccine; petVaccine: PetVaccine } | null> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		// Busca a vacina
		const vaccine = await this.vaccineRepository.findOneBy({
			_id: new ObjectId(vaccineId),
		});
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Busca os detalhes específicos da vacinação do pet
		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
			},
		});
		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado para este pet", 404, "VACCINATION_NOT_FOUND");
		}

		return {
			vaccine,
			petVaccine,
		};
	}

	async findByPet(
		petId: string,
		ownerId: ObjectId,
	): Promise<
		{
			vaccine: Vaccine;
			vaccinationDate: Date;
			notes?: string;
		}[]
	> {
		await this.findOwnedPetOrThrow(petId, ownerId);

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

	async getPetVaccinesCount(petId: string, ownerId: ObjectId): Promise<number> {
		await this.findOwnedPetOrThrow(petId, ownerId);
		const count = await this.petVaccineRepository.countBy({
			petId: new ObjectId(petId),
		});
		return count;
	}

	async updatePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId, data: UpdatePetVaccineInput): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
			},
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		await this.petVaccineRepository.update(petVaccine._id, data);

		return (await this.petVaccineRepository.findOneBy({ _id: petVaccine._id }))!;
	}

	async deletePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId): Promise<boolean> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		// Verificar se o registro existe
		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
			},
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		const result = await this.petVaccineRepository.deleteOne({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
		});

		return result.deletedCount > 0;
	}

	async deleteVaccine(id: string): Promise<boolean> {
		try {
			// Verificar se a vacina existe
			const vaccine = await this.vaccineRepository.findOneBy({
				_id: new ObjectId(id),
			});

			if (!vaccine) {
				throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
			}

			// Primeiro deletar todos os registros de PetVaccine relacionados
			const deleteVaccinationsResult = await this.petVaccineRepository.deleteMany({
				vaccineId: new ObjectId(id),
			});

			logger.info(`Deleted ${deleteVaccinationsResult.deletedCount} vaccination records`);

			// Depois deletar a vacina
			const deleteVaccineResult = await this.vaccineRepository.deleteOne({
				_id: new ObjectId(id),
			});

			return deleteVaccineResult.deletedCount > 0;
		} catch (error) {
			logger.error(error, "Error deleting vaccine and related records");
			throw error;
		}
	}
}
