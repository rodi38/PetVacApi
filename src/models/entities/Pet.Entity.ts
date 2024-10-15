import { ObjectId } from "mongodb";

import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectIdColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("pets")
class Pet {
  @ObjectIdColumn({})
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

  @Column({ type: "timestamp" })
  createdAt: Date;

  @Column({ type: "timestamp" })
  updatedAt: Date;
}

export { Pet };
