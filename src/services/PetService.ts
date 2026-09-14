import { Collection, ObjectId } from "mongodb";
import { getDb, withTransaction } from "../config/mongo";
import { Pet } from "../models/entities/Pet.Entity";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";

export class PetService {
	private get petCollection(): Collection<Pet> {
		return getDb().collection<Pet>("pets");
	}

	private get petVaccineCollection(): Collection<PetVaccine> {
		return getDb().collection<PetVaccine>("pet_vaccines");
	}

	async create(petData: Omit<Pet, "_id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Pet> {
		const now = new Date();
		const pet: Pet = { ...petData, _id: new ObjectId(), createdAt: now, updatedAt: now };
		await this.petCollection.insertOne(pet);
		return pet;
	}

	async findById(id: string): Promise<Pet | null> {
		return this.petCollection.findOne({ _id: new ObjectId(id), deletedAt: null });
	}

	async update(id: string, petData: Partial<Pet>): Promise<Pet | null> {
		const _id = new ObjectId(id);
		await this.petCollection.updateOne({ _id }, { $set: { ...petData, updatedAt: new Date() } });
		return this.findById(id);
	}

	// Soft-delete: mantém o pet e suas vacinações no banco (histórico de saúde animal),
	// só marcados com deletedAt. As duas coleções são atualizadas numa transação —
	// a conta do Atlas do projeto é um replica set, então isso funciona de verdade
	// (ver comentário em config/mongo.ts).
	async delete(id: string): Promise<boolean> {
		const petId = new ObjectId(id);

		return withTransaction(async (session) => {
			const deletedAt = new Date();

			await this.petVaccineCollection.updateMany({ petId }, { $set: { deletedAt } }, { session });

			const result = await this.petCollection.updateOne({ _id: petId, deletedAt: null }, { $set: { deletedAt } }, { session });

			return result.matchedCount > 0;
		});
	}

	async getPetsByOwnerPaginated(ownerId: string, page: number, limit: number): Promise<{ items: Pet[]; total: number }> {
		const filter = { owner: new ObjectId(ownerId), deletedAt: null };
		const [items, total] = await Promise.all([
			this.petCollection
				.find(filter)
				.skip((page - 1) * limit)
				.limit(limit)
				.toArray(),
			this.petCollection.countDocuments(filter),
		]);
		return { items, total };
	}
}
