import { MongoRepository, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Pet } from "../models/entities/Pet.Entity";
import { ObjectId } from "mongodb";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";
import { logger } from "../config/logger";

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
		return this.petRepository.findOneBy({ _id: new ObjectId(id), deletedAt: null });
	}

	async update(id: string, petData: Partial<Pet>): Promise<Pet | null> {
		await this.petRepository.update(id, petData);
		return this.findById(id);
	}

	// Soft-delete: mantém o pet e suas vacinações no banco (histórico de saúde
	// animal), só marcados com deletedAt. Ver comentário na entidade Pet.
	async delete(id: string): Promise<boolean> {
		try {
			const deletedAt = new Date();

			await this.petVaccineRepository.updateMany({ petId: new ObjectId(id) }, { $set: { deletedAt } });

			const result = await this.petRepository.update({ _id: new ObjectId(id), deletedAt: null } as unknown as FindOptionsWhere<Pet>, { deletedAt });
			return result.affected !== 0;
		} catch (error) {
			logger.error(error, "Error deleting pet and related records");
			throw error;
		}
	}

	async getPetsByOwnerPaginated(ownerId: string, page: number, limit: number): Promise<{ items: Pet[]; total: number }> {
		const [items, total] = await this.petRepository.findAndCount({
			where: { owner: new ObjectId(ownerId), deletedAt: null },
			skip: (page - 1) * limit,
			take: limit,
		});
		return { items, total };
	}
}
