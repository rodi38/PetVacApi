// src/models/schemas/userSchema.ts
import { z } from "zod";

export const registerUserSchema = z.object({
	username: z
		.string({
			required_error: "Nome de usuário é obrigatório",
			invalid_type_error: "Nome de usuário deve ser um texto",
		})
		.min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
		.max(50, "Nome de usuário não pode exceder 50 caracteres")
		.trim()
		.regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário pode conter apenas letras, números e underscores"),

	email: z
		.string({
			required_error: "Email é obrigatório",
			invalid_type_error: "Formato de email inválido",
		})
		.email("Formato de email inválido")
		.toLowerCase(),

	password: z
		.string({
			required_error: "Senha é obrigatória",
		})
		.min(6, "Senha deve ter pelo menos 6 caracteres")
		.max(100, "Senha não pode exceder 100 caracteres")
		.regex(/[0-9]/, "Senha deve conter pelo menos um número"),
});

export const updateUserSchema = z
	.object({
		username: z
			.string()
			.min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
			.max(50, "Nome de usuário não pode exceder 50 caracteres")
			.regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário pode conter apenas letras, números e underscores")
			.optional(),

		email: z.string().email("Formato de email inválido").optional(),

		currentPassword: z.string().optional(),

		newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres").regex(/[0-9]/, "Nova senha deve conter pelo menos um número").optional(),
	})
	.refine(
		(data) => {
			// Valida se currentPassword está presente quando newPassword é fornecido
			if (data.newPassword && !data.currentPassword) {
				return false;
			}
			return true;
		},
		{
			message: "Senha atual é necessária para definir uma nova senha",
			path: ["currentPassword"],
		},
	);

export const loginUserSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
