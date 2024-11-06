// src/models/schemas/vaccineSchema.ts
import { z } from "zod";
import { ObjectId } from "mongodb";

export const vaccineSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
	pets: z.array(z.instanceof(ObjectId)).optional(),
});

export const updateVaccineSchema = vaccineSchema.partial();

export const addVaccineToPetSchema = z.object({
	petId: z.string(),
	vaccineId: z.string(),
	vaccinationDate: z.string().or(z.date()), // Aceita string ou objeto Date
	notes: z.string().optional(),
});

export type VaccineInput = z.infer<typeof vaccineSchema>;
export type UpdateVaccineInput = z.infer<typeof updateVaccineSchema>;
export type AddVaccineToPetInput = z.infer<typeof addVaccineToPetSchema>;
