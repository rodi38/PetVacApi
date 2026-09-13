import "reflect-metadata";

import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { AppDataSource } from "./config/typeorm";
import { env } from "./config/env";
import { registerErrorHandler } from "./middleware/errorMiddleware";

import authRouter from "./routes/authRouter";
import { indexRouter } from "./routes/indexRouter";
import petRouter from "./routes/petRouter";
import vaccineRouter from "./routes/vaccineRouter";

const app = Fastify({
	// A validação de entrada "de verdade" é feita via Zod nos controllers;
	// os schemas nas rotas servem apenas para documentação no Swagger,
	// então desativamos coerção/remoção automática de propriedades do Ajv.
	ajv: {
		customOptions: {
			coerceTypes: false,
			removeAdditional: false,
			useDefaults: false,
		},
	},
});
const PORT = env.PORT;

registerErrorHandler(app);

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

const API_PREFIX = "/api/v1";

app.register(authRouter, { prefix: `${API_PREFIX}/auth` });
app.register(petRouter, { prefix: `${API_PREFIX}/pets` });
app.register(vaccineRouter, { prefix: `${API_PREFIX}/vaccines` });
app.register(indexRouter, { prefix: API_PREFIX });

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
