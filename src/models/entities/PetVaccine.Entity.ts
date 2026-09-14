import { ObjectId } from "mongodb";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from "typeorm";

@Entity("pet_vaccines")
class PetVaccine {
	@ObjectIdColumn()
	_id!: ObjectId;

	@Column("objectId")
	petId!: ObjectId;

	@Column("objectId")
	vaccineId!: ObjectId;

	@Column({ type: "date" })
	vaccinationDate!: Date;

	@Column({ type: "text", nullable: true })
	notes?: string;

	// Opcional: adicionar campos extras úteis
	@Column({ type: "text", nullable: true })
	veterinarian?: string;

	@Column({ type: "text", nullable: true })
	clinic?: string;

	@Column({ type: "date", nullable: true })
	nextDoseDate?: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// Soft-delete manual: ver comentário equivalente em Vaccine.Entity.ts.
	// Aqui isso preserva o histórico de vacinação mesmo depois de "apagado".
	@Column({ type: "date", nullable: true })
	deletedAt?: Date | null;
}

export { PetVaccine };
