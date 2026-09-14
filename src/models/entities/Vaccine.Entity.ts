// src/models/entities/Vaccine.Entity.ts
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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Soft-delete manual: o driver MongoDB do TypeORM não suporta o softDelete()
    // nativo (baseado em QueryBuilder), então o filtro precisa ser aplicado à mão
    // em cada consulta (ver VaccineService). Presença de valor = registro apagado.
    @Column({ type: "date", nullable: true })
    deletedAt?: Date | null;
}

export { Vaccine };