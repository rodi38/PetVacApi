import { ObjectId } from "mongodb";

export interface PetVaccine {
	_id: ObjectId;
	petId: ObjectId;
	vaccineId: ObjectId;
	// Datas de cada dose aplicada ou agendada (ordem cronológica crescente).
	// Permite representar séries de doses e reforços de uma mesma vacina.
	doses: Date[];
	notes?: string;
	veterinarian?: string;
	clinic?: string;
	createdAt: Date;
	updatedAt: Date;
	// Soft-delete manual: ver comentário equivalente em Vaccine.Entity.ts.
	// Aqui isso preserva o histórico de vacinação mesmo depois de "apagado".
	deletedAt?: Date | null;
}
