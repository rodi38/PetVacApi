import { ObjectId } from "mongodb";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from "typeorm";

@Entity("pets")
class Pet {
	@ObjectIdColumn()
	_id!: ObjectId;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text" })
	petType!: string;

	@Column({ type: "text" })
	breed!: string;

	@Column({ type: "text" })
	gender!: string;

	@Column({ type: "number" })
	age!: number;

	@Column("objectId")
	owner!: ObjectId;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

export { Pet };
