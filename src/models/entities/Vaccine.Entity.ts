import { ObjectId } from "mongodb";

import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity("vaccines")
class Vaccine {
	@ObjectIdColumn({})
	_id!: ObjectId;

	@Column({ type: "text" })
	name!: string;

	@Column()
	pet: ObjectId;

	@Column({ type: "timestamp" })
	createdAt: Date;

	@Column({ type: "timestamp" })
	updatedAt: Date;
}

export { Vaccine };
