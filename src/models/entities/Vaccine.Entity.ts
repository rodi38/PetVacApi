// src/models/entities/Vaccine.Entity.ts
import { ObjectId } from "mongodb";

export interface Vaccine {
	_id: ObjectId;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	// Soft-delete manual: sem QueryBuilder (driver nativo do mongodb), o filtro de
	// "não apagado" precisa ser aplicado à mão em cada consulta (ver VaccineService).
	// Presença de valor = registro apagado.
	deletedAt?: Date | null;
}
