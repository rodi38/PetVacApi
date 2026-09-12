// src/routes/authRouter.ts
import { FastifyInstance } from "fastify";
import { registerUser, loginUser, updateUser } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { registerUserSchema, loginUserSchema, updateUserSchema } from "../models/schemas/userSchema";
import { toSwaggerSchema, objectIdParam } from "../utils/swaggerSchemas";

export default async function (fastify: FastifyInstance) {
	fastify.post("/register", {
		schema: {
			tags: ["auth"],
			summary: "Cria um novo usuário",
			body: toSwaggerSchema(registerUserSchema),
		},
		attachValidation: true,
		handler: registerUser,
	});

	fastify.post("/login", {
		schema: {
			tags: ["auth"],
			summary: "Autentica um usuário e retorna um token JWT",
			body: toSwaggerSchema(loginUserSchema),
		},
		attachValidation: true,
		handler: loginUser,
	});

	fastify.put("/users/:userId", {
		preHandler: authenticate,
		schema: {
			tags: ["auth"],
			summary: "Atualiza os dados do próprio usuário autenticado",
			security: [{ bearerAuth: [] }],
			params: objectIdParam("userId", "ID do usuário"),
			body: toSwaggerSchema(updateUserSchema),
		},
		attachValidation: true,
		handler: updateUser,
	});
}
