// src/types/fastify.d.ts
import { ObjectId } from "mongodb";
import fastify from "fastify";

declare module "fastify" {
	interface FastifyRequest {
		user: {
			userId: ObjectId;
		};
	}
}
