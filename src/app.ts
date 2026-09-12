import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { AppDataSource } from "./config/typeorm";

import authRouter from "./routes/authRouter";
import { indexRouter } from "./routes/indexRouter";
import petRouter from "./routes/petRouter";
import vaccineRouter from "./routes/vaccineRouter";

const app = Fastify();
const PORT = Number(process.env.PORT) || 5000;

app.register(jwt, {
	secret: process.env.JWT_SECRET || "fallback_secret",
});

app.register(swagger, {
	openapi: {
		info: {
			title: "PetVacApi",
			description: "API for managing pets and their vaccination records",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		tags: [
			{ name: "auth", description: "Authentication endpoints" },
			{ name: "pets", description: "Pet management endpoints" },
			{ name: "vaccines", description: "Vaccine management endpoints" },
		],
	},
});

app.register(swaggerUi, {
	routePrefix: "/docs",
});

AppDataSource.initialize()
	.then(() => {
		console.log("Data Source has been initialized!");
	})
	.catch((err) => {
		console.error("Error during Data Source initialization:", err);
	});

app.register(authRouter, { prefix: "/auth" });
app.register(petRouter, { prefix: "/pets" });
app.register(vaccineRouter, { prefix: "/vaccines" });
app.register(indexRouter);

const start = async () => {
	try {
		await app.listen({ port: PORT, host: "0.0.0.0" });
		console.log(`Server started on http://localhost: ${PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
