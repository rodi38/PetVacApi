// src/routes/authRouter.ts
import { FastifyInstance } from "fastify";
import { registerUser, loginUser, updateUser } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	fastify.post("/register", { schema: { tags: ["auth"] } }, registerUser);

	fastify.post("/login", { schema: { tags: ["auth"] } }, loginUser);

	fastify.put("/users/:userId", {
		preHandler: authenticate,
		schema: { tags: ["auth"], security: [{ bearerAuth: [] }] },
		handler: updateUser,
	});
}
