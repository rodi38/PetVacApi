// src/middleware/errorMiddleware.ts
import { FastifyInstance } from "fastify";
import { handleError } from "../utils/errorHandler";

export function registerErrorHandler(app: FastifyInstance) {
	app.setErrorHandler((error, request, reply) => {
		handleError(error, reply);
	});

	app.setNotFoundHandler((request, reply) => {
		reply.code(404).send({ success: false, data: null, error: { message: "Route not found" } });
	});
}
