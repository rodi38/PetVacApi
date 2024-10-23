import { z } from "zod";
import { ObjectId } from "mongodb";


export const petSchema = z.object({
	name: z.string().min(1).max(50),
	petType: z.string().min(1).max(50),
	breed: z.string().min(1).max(50),
	gender: z.enum(["male", "female", "other"]),
	age: z.number().int().positive(),
	owner: z.instanceof(ObjectId),
});

export const updatePetSchema = petSchema.partial().extend({
	id: z.instanceof(ObjectId),
});

export type PetInput = z.infer<typeof petSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
