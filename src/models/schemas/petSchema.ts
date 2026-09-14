import { z } from "zod";

export const petSchema = z.object({
	name: z.string().min(1, "Nome do pet é obrigatório").max(50, "Nome do pet não pode exceder 50 caracteres").trim(),

	petType: z.string().min(1, "Tipo do pet é obrigatório").max(50, "Tipo do pet não pode exceder 50 caracteres").trim(),

	breed: z.string().min(1, "Raça é obrigatória").max(50, "Raça não pode exceder 50 caracteres").trim(),

	gender: z.enum(["male", "female", "other"], {
		errorMap: () => ({ message: "Gênero deve ser 'male', 'female' ou 'other'" }),
	}),

	birthDate: z.preprocess(
		(arg) => (typeof arg === "string" ? new Date(arg) : arg),
		z
			.date({
				required_error: "Data de nascimento é obrigatória",
				invalid_type_error: "Formato de data inválido",
			})
			.max(new Date(), "Data de nascimento não pode ser no futuro")
			.min(new Date(new Date().setFullYear(new Date().getFullYear() - 50)), "Por favor, verifique a data de nascimento"),
	),
});

// export const updatePetSchema = petSchema.partial().extend({
// 	id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
// });
export const updatePetSchema = petSchema.partial();

export type PetInput = z.infer<typeof petSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
