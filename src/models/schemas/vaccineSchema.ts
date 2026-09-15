// src/models/schemas/vaccineSchema.ts
import { z } from "zod";
import { ObjectId } from "mongodb";

export const vaccineSchema = z.object({
	name: z.string().min(1, "Nome da vacina é obrigatório").max(50, "Nome da vacina não pode exceder 50 caracteres").trim(),

	description: z.string().max(500, "Descrição não pode exceder 500 caracteres").optional(),
});

export const updateVaccineSchema = vaccineSchema.partial();

const doseDateSchema = z.preprocess(
	(arg) => (typeof arg === "string" ? new Date(arg) : arg),
	z.date({
		required_error: "Data da dose é obrigatória",
		invalid_type_error: "Formato de data inválido",
	}),
);

const dosesSchema = z
	.array(doseDateSchema)
	.min(1, "É necessário informar ao menos uma dose")
	.refine((doses) => new Set(doses.map((date) => date.getTime())).size === doses.length, "Não pode haver doses com datas repetidas");

export const addVaccineToPetSchema = z.object({
	vaccineId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID da vacina inválido"),

	doses: dosesSchema,

	notes: z.string().max(1000, "Anotações não podem exceder 1000 caracteres").optional(),

	veterinarian: z.string().min(4, "Nome do veterinário deve ter pelo menos 4 caracteres").max(100, "Nome do veterinário não pode exceder 100 caracteres").optional(),

	clinic: z.string().min(3, "Nome da clínica deve ter pelo menos 3 caracteres").max(100, "Nome da clínica não pode exceder 100 caracteres").optional(),
});

export const updatePetVaccineSchema = z.object({
	doses: dosesSchema.optional(),

	notes: z.string().max(1000, "Anotações não podem exceder 1000 caracteres").optional(),

	veterinarian: z.string().min(4, "Nome do veterinário deve ter pelo menos 4 caracteres").max(100, "Nome do veterinário não pode exceder 100 caracteres").optional(),

	clinic: z.string().min(3, "Nome da clínica deve ter pelo menos 3 caracteres").max(100, "Nome da clínica não pode exceder 100 caracteres").optional(),
});

export interface PetVaccineDetails {
	_id: ObjectId;
	petId: ObjectId;
	vaccineId: ObjectId;
	doses: Date[];
	notes?: string;
	veterinarian?: string;
	clinic?: string;
	createdAt: Date;
	updatedAt: Date;
}

export type VaccineInput = z.infer<typeof vaccineSchema>;
export type UpdateVaccineInput = z.infer<typeof updateVaccineSchema>;
export type AddVaccineToPetInput = z.infer<typeof addVaccineToPetSchema>;
export type UpdatePetVaccineInput = z.infer<typeof updatePetVaccineSchema>;
