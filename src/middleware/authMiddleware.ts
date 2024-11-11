// import { FastifyRequest, FastifyReply } from "fastify";
// import jwt from "jsonwebtoken";
// import { ObjectId } from "mongodb";

// interface JWTPayload {
// 	userId: string;
// }

// declare module "fastify" {
// 	interface FastifyRequest {
// 		User?: {
// 			userId: ObjectId;
// 		};
// 	}
// }

// export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
// 	try {
// 		// Get the token from the Authorization header
// 		const authHeader = request.headers.authorization;
// 		if (!authHeader) {
// 			reply.code(401).send({ error: "Authentication required" });
// 			return;
// 		}

// 		// Check if the header follows the Bearer scheme
// 		const [scheme, token] = authHeader.split(" ");
// 		if (!/^Bearer$/i.test(scheme)) {
// 			reply.code(401).send({ error: "Invalid token format" });
// 			return;
// 		}

// 		// Verify the token
// 		const secret = process.env.JWT_SECRET || "fallback_secret";
// 		const payload = jwt.verify(token, secret) as JWTPayload;

// 		// Add the user ID to the request object
// 		request.user = {
// 			userId: new ObjectId(payload.userId),
// 		};
// 	} catch (error) {
// 		reply.code(401).send({ error: "Invalid or expired token" });
// 		return;
// 	}
// };

// src/middleware/authMiddleware.ts
// import { FastifyRequest, FastifyReply } from "fastify";
// import jwt from "jsonwebtoken";
// import { ObjectId } from "mongodb";

// interface JWTPayload {
// 	userId: string;
// }

// export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
// 	try {
// 		// Get the token from the Authorization header
// 		const authHeader = request.headers.authorization;
// 		if (!authHeader) {
// 			reply.code(401).send({ error: "Authentication required" });
// 			return;
// 		}

// 		// Check if the header follows the Bearer scheme
// 		const [scheme, token] = authHeader.split(" ");
// 		if (!/^Bearer$/i.test(scheme)) {
// 			reply.code(401).send({ error: "Invalid token format" });
// 			return;
// 		}

// 		// Verify the token
// 		const secret = process.env.JWT_SECRET || "fallback_secret";
// 		const payload = jwt.verify(token, secret) as JWTPayload;

// 		// Add the user ID to the request object
// 		request.user = {
// 			userId: new ObjectId(payload.userId),
// 		};
// 	} catch (error) {
// 		reply.code(401).send({ error: "Invalid or expired token" });
// 		return;
// 	}
// };

// src/middleware/authMiddleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

declare module "fastify" {
	interface FastifyRequest {
		authenticatedUser: {
			userId: ObjectId;
		};
	}
}

interface JWTPayload {
	userId: string;
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			reply.code(401).send({ error: "Authentication required" });
			return;
		}

		const [scheme, token] = authHeader.split(" ");
		if (!/^Bearer$/i.test(scheme)) {
			reply.code(401).send({ error: "Invalid token format" });
			return;
		}

		const secret = process.env.JWT_SECRET || "fallback_secret";
		const payload = jwt.verify(token, secret) as JWTPayload;

		// Mudamos de request.user para request.authenticatedUser
		request.authenticatedUser = {
			userId: new ObjectId(payload.userId),
		};
	} catch (error) {
		reply.code(401).send({ error: "Invalid or expired token" });
		return;
	}
};
