import { ObjectId } from "mongodb";

import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectIdColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
class User {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "text" })
  username!: string;

  @Column({ type: "text" })
  password!: string;

  @Column({ type: "text" })
  email!: string;

  @Column()
  owner: ObjectId;

  @Column()
  vaccines: ObjectId[]

  @Column({ type: "timestamp" })
  createdAt: Date;

  @Column({ type: "timestamp" })
  updatedAt: Date;
}

export { User };
