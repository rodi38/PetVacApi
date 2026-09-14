import { ObjectId } from "mongodb";

export interface Pet {
	_id: ObjectId;
	name: string;
	petType: string;
	breed: string;
	gender: string;
	birthDate: Date;
	owner: ObjectId;
	createdAt: Date;
	updatedAt: Date;
	// Soft-delete manual: ver comentário equivalente em Vaccine.Entity.ts.
	deletedAt?: Date | null;
}
