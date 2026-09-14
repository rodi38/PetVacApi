import { ObjectId } from "mongodb";

export interface PetVaccine {
	_id: ObjectId;
	petId: ObjectId;
	vaccineId: ObjectId;
	vaccinationDate: Date;
	notes?: string;
	veterinarian?: string;
	clinic?: string;
	nextDoseDate?: Date;
	createdAt: Date;
	updatedAt: Date;
	// Soft-delete manual: ver comentário equivalente em Vaccine.Entity.ts.
	// Aqui isso preserva o histórico de vacinação mesmo depois de "apagado".
	deletedAt?: Date | null;
}
