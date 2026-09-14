import { Collection, ObjectId } from "mongodb";
import { getDb, withTransaction } from "../config/mongo";
import { Vaccine } from "../models/entities/Vaccine.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";
import { AppError } from "../utils/errorHandler";
import { AddVaccineToPetInput, UpdatePetVaccineInput } from "../models/schemas/vaccineSchema";
import { logger } from "../config/logger";

export class VaccineService {
	private get vaccineCollection(): Collection<Vaccine> {
		return getDb().collection<Vaccine>("vaccines");
	}

	private get petCollection(): Collection<Pet> {
		return getDb().collection<Pet>("pets");
	}

	private get petVaccineCollection(): Collection<PetVaccine> {
		return getDb().collection<PetVaccine>("pet_vaccines");
	}

	async create(data: Omit<Vaccine, "_id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Vaccine> {
		const now = new Date();
		const vaccine: Vaccine = { ...data, _id: new ObjectId(), createdAt: now, updatedAt: now };
		await this.vaccineCollection.insertOne(vaccine);
		return vaccine;
	}

	async findAllPaginated(page: number, limit: number): Promise<{ items: Vaccine[]; total: number }> {
		const filter = { deletedAt: null };
		const [items, total] = await Promise.all([
			this.vaccineCollection
				.find(filter)
				.skip((page - 1) * limit)
				.limit(limit)
				.toArray(),
			this.vaccineCollection.countDocuments(filter),
		]);
		return { items, total };
	}

	async findById(id: string): Promise<Vaccine | null> {
		return this.vaccineCollection.findOne({ _id: new ObjectId(id), deletedAt: null });
	}

	async update(id: string, data: Partial<Vaccine>): Promise<Vaccine | null> {
		const _id = new ObjectId(id);
		await this.vaccineCollection.updateOne({ _id }, { $set: { ...data, updatedAt: new Date() } });
		return this.findById(id);
	}

	// Soft-delete: ver comentário na entidade Vaccine.
	async delete(id: string): Promise<boolean> {
		const result = await this.vaccineCollection.updateOne({ _id: new ObjectId(id), deletedAt: null }, { $set: { deletedAt: new Date() } });
		return result.matchedCount > 0;
	}

	private async findOwnedPetOrThrow(petId: string, ownerId: ObjectId): Promise<Pet> {
		const pet = await this.petCollection.findOne({ _id: new ObjectId(petId), deletedAt: null });
		if (!pet || !pet.owner.equals(ownerId)) {
			// 404 em ambos os casos para não revelar a existência de pets de outros usuários (IDOR).
			throw new AppError("Pet não encontrado", 404, "PET_NOT_FOUND");
		}
		return pet;
	}

	async addVaccineToPet(vaccineId: string, petId: string, ownerId: ObjectId, data: Omit<AddVaccineToPetInput, "petId" | "vaccineId">): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const vaccine = await this.vaccineCollection.findOne({ _id: new ObjectId(vaccineId), deletedAt: null });
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Verificar se a vacina já foi aplicada neste pet
		const existingVaccination = await this.petVaccineCollection.findOne({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			deletedAt: null,
		});

		if (existingVaccination) {
			throw new AppError("Esta vacina já está registrada para este pet", 400, "VACCINE_ALREADY_REGISTERED");
		}

		// Processar as datas
		const vaccinationDate = new Date(data.vaccinationDate);
		const nextDoseDate = data.nextDoseDate ? new Date(data.nextDoseDate) : undefined;

		const now = new Date();
		const petVaccine: PetVaccine = {
			_id: new ObjectId(),
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			vaccinationDate,
			notes: data.notes,
			veterinarian: data.veterinarian,
			clinic: data.clinic,
			nextDoseDate,
			createdAt: now,
			updatedAt: now,
		};

		await this.petVaccineCollection.insertOne(petVaccine);
		return petVaccine;
	}

	async getVaccineDetails(vaccineId: string, petId: string, ownerId: ObjectId): Promise<{ vaccine: Vaccine; petVaccine: PetVaccine } | null> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		// Busca a vacina
		const vaccine = await this.vaccineCollection.findOne({ _id: new ObjectId(vaccineId), deletedAt: null });
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		// Busca os detalhes específicos da vacinação do pet
		const petVaccine = await this.petVaccineCollection.findOne({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			deletedAt: null,
		});
		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado para este pet", 404, "VACCINATION_NOT_FOUND");
		}

		return { vaccine, petVaccine };
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

		const filter = { petId: new ObjectId(petId), deletedAt: null };
		const [petVaccinations, total] = await Promise.all([
			this.petVaccineCollection
				.find(filter)
				.skip((page - 1) * limit)
				.limit(limit)
				.toArray(),
			this.petVaccineCollection.countDocuments(filter),
		]);

		// Buscar os detalhes de cada vacina. Sem filtro de deletedAt aqui de propósito:
		// mesmo que o tipo de vacina tenha sido apagado depois, o histórico do pet
		// continua mostrando qual vacina foi aplicada.
		const items = await Promise.all(
			petVaccinations.map(async (pv) => {
				const vaccine = await this.vaccineCollection.findOne({ _id: pv.vaccineId });

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
		return this.petVaccineCollection.countDocuments({ petId: new ObjectId(petId), deletedAt: null });
	}

	async updatePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId, data: UpdatePetVaccineInput): Promise<PetVaccine> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const petVaccine = await this.petVaccineCollection.findOne({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			deletedAt: null,
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		await this.petVaccineCollection.updateOne({ _id: petVaccine._id }, { $set: { ...data, updatedAt: new Date() } });

		return (await this.petVaccineCollection.findOne({ _id: petVaccine._id }))!;
	}

	// Soft-delete: preserva o histórico de vacinação do pet. Ver comentário na entidade PetVaccine.
	async deletePetVaccine(vaccineId: string, petId: string, ownerId: ObjectId): Promise<boolean> {
		await this.findOwnedPetOrThrow(petId, ownerId);

		const petVaccine = await this.petVaccineCollection.findOne({
			petId: new ObjectId(petId),
			vaccineId: new ObjectId(vaccineId),
			deletedAt: null,
		});

		if (!petVaccine) {
			throw new AppError("Registro de vacinação não encontrado", 404, "VACCINATION_NOT_FOUND");
		}

		const result = await this.petVaccineCollection.updateOne({ _id: petVaccine._id, deletedAt: null }, { $set: { deletedAt: new Date() } });

		return result.matchedCount > 0;
	}

	// Soft-delete: a vacina e seus registros de vacinação continuam no banco, só marcados
	// com deletedAt, numa transação (ver comentário em PetService.delete e config/mongo.ts).
	async deleteVaccine(id: string): Promise<boolean> {
		const vaccineId = new ObjectId(id);

		const vaccine = await this.vaccineCollection.findOne({ _id: vaccineId, deletedAt: null });
		if (!vaccine) {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}

		return withTransaction(async (session) => {
			const deletedAt = new Date();

			const updateVaccinationsResult = await this.petVaccineCollection.updateMany({ vaccineId }, { $set: { deletedAt } }, { session });
			logger.info(`Soft-deleted ${updateVaccinationsResult.modifiedCount} vaccination records`);

			const updateVaccineResult = await this.vaccineCollection.updateOne({ _id: vaccineId, deletedAt: null }, { $set: { deletedAt } }, { session });

			return updateVaccineResult.matchedCount > 0;
		});
	}
}
