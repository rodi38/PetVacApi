// src/routes/authRouter.ts
import { FastifyInstance } from "fastify";
import { registerUser, loginUser, updateUser } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { registerUserSchema, loginUserSchema, updateUserSchema } from "../models/schemas/userSchema";
import { toSwaggerSchema, objectIdParam, successEnvelopeSchema, errorEnvelopeSchema } from "../utils/swaggerSchemas";

export default async function (fastify: FastifyInstance) {
	const bruteForceLimit = { rateLimit: { max: 5, timeWindow: "1 minute" } };

	fastify.post("/register", {
		config: bruteForceLimit,
		schema: {
			tags: ["auth"],
			summary: "Cria um novo usuário",
			body: toSwaggerSchema(registerUserSchema),
			response: {
				201: successEnvelopeSchema(),
				400: errorEnvelopeSchema,
			},
		},
		handler: registerUser,
	});

	fastify.post("/login", {
		config: bruteForceLimit,
		schema: {
			tags: ["auth"],
			summary: "Autentica um usuário e retorna um token JWT",
			body: toSwaggerSchema(loginUserSchema),
			response: {
				200: successEnvelopeSchema(),
				400: errorEnvelopeSchema,
				401: errorEnvelopeSchema,
			},
		},
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
			response: {
				200: successEnvelopeSchema(),
				400: errorEnvelopeSchema,
				401: errorEnvelopeSchema,
				403: errorEnvelopeSchema,
			},
		},
		handler: updateUser,
	});
}
