import { z } from "zod";
import { ObjectId } from "mongodb";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const petSchema = z.object({
	name: z.string().min(1).max(50),
	petType: z.string().min(1).max(50),
	breed: z.string().min(1).max(50),
	gender: z.enum(["male", "female", "other"]),
	age: z.number().int().positive(),
	owner: z.string().regex(objectIdRegex, "Invalid ObjectId"),
});

export const updatePetSchema = petSchema.partial().extend({
	id: z.string().regex(objectIdRegex, "Invalid ObjectId"),
});

export type PetInput = z.infer<typeof petSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
