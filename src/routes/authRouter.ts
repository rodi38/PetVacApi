// src/routes/authRouter.ts
import { FastifyInstance } from "fastify";
import { registerUser, loginUser, updateUser } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	fastify.post("/register", registerUser);

	fastify.post("/login", loginUser);

	fastify.put("/users/:userId", {
		preHandler: authenticate,
		handler: updateUser,
	});
}
