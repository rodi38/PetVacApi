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
	vaccinationDate: z.string().or(z.date()),
	notes: z.string().optional(),
	veterinarian: z.string().optional(),
	clinic: z.string().optional(),
	nextDoseDate: z.string().or(z.date()).optional(),
});

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
