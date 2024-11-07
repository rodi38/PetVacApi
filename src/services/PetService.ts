import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { Pet } from "../models/entities/Pet.Entity";
import { ObjectId } from "mongodb";

export class PetService {
	private petRepository: MongoRepository<Pet>;

	constructor() {
		this.petRepository = AppDataSource.getMongoRepository(Pet);
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
		const result = await this.petRepository.delete(id);
		return result.affected !== 0;
	}

	async getAllPetsByOwner(ownerId: string): Promise<Pet[]> {
		return this.petRepository.find({
			where: {
				owner: new ObjectId(ownerId),
			},
		});
	}
}
