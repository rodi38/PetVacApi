import "reflect-metadata";

import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { AppDataSource } from "./config/typeorm";
import { env } from "./config/env";
import { registerErrorHandler } from "./middleware/errorMiddleware";
import { ensureIndexes } from "./config/ensureIndexes";

import authRouter from "./routes/authRouter";
import { indexRouter } from "./routes/indexRouter";
import petRouter from "./routes/petRouter";
import vaccineRouter from "./routes/vaccineRouter";

const app = Fastify({
	logger: process.env.NODE_ENV !== "test",
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

app.register(helmet);
// Desativado nos testes: os limites de tentativa (5/min em auth, 100/min global)
// já foram verificados manualmente e, em uma suíte que registra/loga vários
// usuários em sequência, disparariam 429 sem relação com o que está sendo testado.
if (process.env.NODE_ENV !== "test") {
	app.register(rateLimit, {
		max: 100,
		timeWindow: "1 minute",
	});
}

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

const API_PREFIX = "/api/v1";

app.register(authRouter, { prefix: `${API_PREFIX}/auth` });
app.register(petRouter, { prefix: `${API_PREFIX}/pets` });
app.register(vaccineRouter, { prefix: `${API_PREFIX}/vaccines` });
app.register(indexRouter, { prefix: API_PREFIX });

const start = async () => {
	try {
		// Falha rápido no boot se o Mongo não estiver acessível, em vez de subir
		// o servidor e só falhar depois, em cada requisição, silenciosamente.
		await AppDataSource.initialize();
		app.log.info("Data Source has been initialized!");

		try {
			await ensureIndexes();
		} catch (err) {
			// Não derruba o servidor por isso: normalmente indica dado duplicado
			// pré-existente que precisa ser limpo manualmente antes de reforçar o índice.
			app.log.error(err, "Failed to ensure database indexes");
		}

		await app.listen({ port: PORT, host: "0.0.0.0" });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

async function shutdown(signal: string) {
	app.log.info(`Received ${signal}, shutting down gracefully`);
	await app.close();
	if (AppDataSource.isInitialized) {
		await AppDataSource.destroy();
	}
	process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Evita subir o servidor de verdade quando este módulo é importado (ex.: pelos testes),
// em vez de executado diretamente.
if (require.main === module) {
	start();
}

export { app };
