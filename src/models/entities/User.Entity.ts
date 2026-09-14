import { ObjectId } from "mongodb";

export interface User {
	_id: ObjectId;
	username: string;
	password: string;
	email: string;
	// Usado para invalidar tokens JWT emitidos antes da troca de senha (ver authMiddleware).
	passwordChangedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
