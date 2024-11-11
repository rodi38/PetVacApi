// src/models/schemas/vaccineSchema.ts
import { z } from "zod";
import { ObjectId } from "mongodb";

export const vaccineSchema = z.object({
	name: z.string().min(1, "Nome da vacina é obrigatório").max(50, "Nome da vacina não pode exceder 50 caracteres").trim(),

	description: z.string().max(500, "Descrição não pode exceder 500 caracteres").optional(),

	pets: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID do pet inválido")).optional(),
});

export const updateVaccineSchema = vaccineSchema.partial();

export const addVaccineToPetSchema = z
	.object({
		petId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID do pet inválido"),

		vaccineId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID da vacina inválido"),

		vaccinationDate: z.preprocess(
			(arg) => (typeof arg === "string" ? new Date(arg) : arg),
			z
				.date({
					required_error: "Data de vacinação é obrigatória",
					invalid_type_error: "Formato de data inválido",
				})
				.max(new Date(), "Data de vacinação não pode ser no futuro"),
		),

		notes: z.string().max(1000, "Anotações não podem exceder 1000 caracteres").optional(),

		veterinarian: z.string().min(4, "Nome do veterinário deve ter pelo menos 4 caracteres").max(100, "Nome do veterinário não pode exceder 100 caracteres").optional(),

		clinic: z.string().min(3, "Nome da clínica deve ter pelo menos 3 caracteres").max(100, "Nome da clínica não pode exceder 100 caracteres").optional(),

		nextDoseDate: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().min(new Date(), "Data da próxima dose deve ser no futuro").optional()),
	})
	.refine(
		(data) => {
			if (data.nextDoseDate) {
				return data.nextDoseDate > data.vaccinationDate;
			}
			return true;
		},
		{
			message: "Data da próxima dose deve ser posterior à data de vacinação",
			path: ["nextDoseDate"],
		},
	);
export interface PetVaccineDetails {
	_id: ObjectId;
	petId: ObjectId;
	vaccineId: ObjectId;
	vaccinationDate: Date;
	notes?: string;
	veterinarian?: string;
	clinic?: string;
	nextDoseDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type VaccineInput = z.infer<typeof vaccineSchema>;
export type UpdateVaccineInput = z.infer<typeof updateVaccineSchema>;
export type AddVaccineToPetInput = z.infer<typeof addVaccineToPetSchema>;
