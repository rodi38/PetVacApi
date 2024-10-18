// src/routes/authRoutes.ts
import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "../controllers/userController";

export default async function (fastify: FastifyInstance) {
	fastify.post("/register", registerUser);
	fastify.post("/login", loginUser);
}
