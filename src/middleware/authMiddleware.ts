import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { env } from "../config/env";

interface JWTPayload {
	userId: string;
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			reply.code(401).send({ success: false, data: null, error: { message: "Authentication required" } });
			return;
		}

		const [scheme, token] = authHeader.split(" ");
		if (!/^Bearer$/i.test(scheme)) {
			reply.code(401).send({ success: false, data: null, error: { message: "Invalid token format" } });
			return;
		}

		const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

		// Mudamos de request.user para request.authenticatedUser
		request.authenticatedUser = {
			userId: new ObjectId(payload.userId),
		};
	} catch (error) {
		reply.code(401).send({ success: false, data: null, error: { message: "Invalid or expired token" } });
		return;
	}
};
