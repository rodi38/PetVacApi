import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { env } from "../config/env";
import { getDb } from "../config/mongo";
import { User } from "../models/entities/User.Entity";

interface JWTPayload {
	userId: string;
	iat: number;
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			reply.code(401).send({ success: false, data: null, error: { message: "Autenticação necessária" } });
			return;
		}

		const [scheme, token] = authHeader.split(" ");
		if (!/^Bearer$/i.test(scheme)) {
			reply.code(401).send({ success: false, data: null, error: { message: "Formato de token inválido" } });
			return;
		}

		const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
		const userId = new ObjectId(payload.userId);

		// Um token emitido antes da última troca de senha não deve mais ser aceito.
		const user = await getDb().collection<User>("users").findOne({ _id: userId });
		if (!user || (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime())) {
			reply.code(401).send({ success: false, data: null, error: { message: "Token inválido ou expirado" } });
			return;
		}

		// Mudamos de request.user para request.authenticatedUser
		request.authenticatedUser = {
			userId,
		};
	} catch (error) {
		reply.code(401).send({ success: false, data: null, error: { message: "Token inválido ou expirado" } });
		return;
	}
};
