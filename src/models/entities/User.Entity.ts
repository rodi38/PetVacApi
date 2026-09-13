import { ObjectId } from "mongodb";

import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity("users")
class User {
	@ObjectIdColumn()
	_id!: ObjectId;

	@Column({ type: "text" })
	username!: string;

	@Column({ type: "text" })
	password!: string;

	@Unique(["email"])
	@Column({ type: "text" })
	email!: string;

	// Usado para invalidar tokens JWT emitidos antes da troca de senha (ver authMiddleware).
	@Column({ type: "date", nullable: true })
	passwordChangedAt?: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

export { User };
