import { z } from "zod";
import { ObjectId } from "mongodb";

export const petSchema = z.object({
	name: z.string().min(1, "Nome do pet é obrigatório").max(50, "Nome do pet não pode exceder 50 caracteres").trim(),

	petType: z.string().min(1, "Tipo do pet é obrigatório").max(50, "Tipo do pet não pode exceder 50 caracteres").trim(),

	breed: z.string().min(1, "Raça é obrigatória").max(50, "Raça não pode exceder 50 caracteres").trim(),

	gender: z.enum(["male", "female", "other"], {
		errorMap: () => ({ message: "Gênero deve ser 'male', 'female' ou 'other'" }),
	}),

	age: z
		.number({
			required_error: "Idade é obrigatória",
			invalid_type_error: "Idade deve ser um número",
		})
		.int("Idade deve ser um número inteiro")
		.positive("Idade deve ser positiva")
		.max(50, "Por favor, verifique o valor da idade"),

	owner: z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID do proprietário inválido"),
});

// export const updatePetSchema = petSchema.partial().extend({
// 	id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
// });
export const updatePetSchema = petSchema.partial();

export type PetInput = z.infer<typeof petSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
