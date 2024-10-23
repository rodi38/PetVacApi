import { ObjectId } from "mongodb";

import { Column, CreateDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from "typeorm";

@Entity("vaccines")
class Vaccine {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "text" })
    description?: string;

    @Column({ type: "array" })
    pets!: ObjectId[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

export { Vaccine };
