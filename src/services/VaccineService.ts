import { MongoRepository, FindOptionsWhere } from "typeorm";
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

	async findAllPaginated(page: number, limit: number): Promise<{ items: Vaccine[]; total: number }> {
		const [items, total] = await this.vaccineRepository.findAndCount({
			where: { deletedAt: null },
			skip: (page - 1) * limit,
			take: limit,
		});
		return { items, total };
	}

	async findById(id: string): Promise<Vaccine | null> {
		return this.vaccineRepository.findOneBy({ _id: new ObjectId(id), deletedAt: null });
	}

	async update(id: string, data: Partial<Vaccine>): Promise<Vaccine | null> {
		await this.vaccineRepository.update(id, data);
		return this.findById(id);
	}

	// Soft-delete: ver comentário na entidade Vaccine.
	async delete(id: string): Promise<boolean> {
		const result = await this.vaccineRepository.update({ _id: new ObjectId(id), deletedAt: null } as unknown as FindOptionsWhere<Vaccine>, { deletedAt: new Date() });
		return result.affected !== 0;
	}

	private async findOwnedPetOrThrow(petId: string, ownerId: ObjectId): Promise<Pet> {
		const pet = await this.petRepository.findOneBy({ _id: new ObjectId(petId), deletedAt: null });
		if (!pet || !pet.owner.equals(ownerId)) {
			// 404 em ambos os casos para não revelar a existência de pets de outros usuários (IDOR).
			throw new AppError("Pet não encontrado", 404, "PET_NOT_FOUND");
		}
		return pet;
	}

	async addVaccineToPet(vaccineId: string, petId: string, ownerId: ObjectId, data: Omit<AddVaccineToPetInput, "petId" | "vaccineId">): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const vaccine = await this.vaccineRepository.findOneBy({ _id: new ObjectId(vaccineId), deletedAt: null });
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Verificar se a vacina já foi aplicada neste pet
		const existingVaccination = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
				deletedAt: null,
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
			deletedAt: null,
		});
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Busca os detalhes específicos da vacinação do pet
		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
				deletedAt: null,
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
		page: number,
		limit: number,
	): Promise<{
		items: { vaccine: Vaccine; vaccinationDate: Date; notes?: string }[];
		total: number;
	}> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const [petVaccinations, total] = await this.petVaccineRepository.findAndCount({
			where: { petId: new ObjectId(petId), deletedAt: null },
			skip: (page - 1) * limit,
			take: limit,
		});

		// Buscar os detalhes de cada vacina
		const items = await Promise.all(
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

		return { items, total };
	}

	async getPetVaccinesCount(petId: string, ownerId: ObjectId): Promise<number> {
		await this.findOwnedPetOrThrow(petId, ownerId);
		const count = await this.petVaccineRepository.countBy({
			petId: new ObjectId(petId),
			deletedAt: null,
		});
		return count;
	}

	async updatePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId, data: UpdatePetVaccineInput): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
				deletedAt: null,
			},
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		await this.petVaccineRepository.update(petVaccine._id, data);

		return (await this.petVaccineRepository.findOneBy({ _id: petVaccine._id }))!;
	}

	// Soft-delete: preserva o histórico de vacinação do pet. Ver comentário na entidade PetVaccine.
	async deletePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId): Promise<boolean> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		// Verificar se o registro existe
		const petVaccine = await this.petVaccineRepository.findOne({
			where: {
				petId: new ObjectId(petId),
				vaccineId: new ObjectId(vaccineId),
				deletedAt: null,
			},
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		const result = await this.petVaccineRepository.update({ _id: petVaccine._id, deletedAt: null } as unknown as FindOptionsWhere<PetVaccine>, { deletedAt: new Date() });

		return result.affected !== 0;
	}

	// Soft-delete: a vacina e seus registros de vacinação continuam no banco,
	// só marcados com deletedAt (ver comentário nas entidades Vaccine e PetVaccine).
	async deleteVaccine(id: string): Promise<boolean> {
		// Verificar se a vacina existe
		const vaccine = await this.vaccineRepository.findOneBy({
			_id: new ObjectId(id),
			deletedAt: null,
		});

		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		const deletedAt = new Date();

		const updateVaccinationsResult = await this.petVaccineRepository.updateMany({ vaccineId: new ObjectId(id) }, { $set: { deletedAt } });
		logger.info(`Soft-deleted ${updateVaccinationsResult.modifiedCount} vaccination records`);

		const updateVaccineResult = await this.vaccineRepository.update({ _id: new ObjectId(id), deletedAt: null } as unknown as FindOptionsWhere<Vaccine>, { deletedAt });

		return updateVaccineResult.affected !== 0;
	}
}
