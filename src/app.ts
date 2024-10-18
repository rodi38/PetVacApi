import * as dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import "reflect-metadata";

import { AppDataSource } from "./config/typeorm";
import authRouter from "./routes/authRouter";
import { indexRouter } from "./routes/indexRouter";
import petRouter from "./routes/petRouter";

const app = Fastify();

AppDataSource.initialize()
	.then(() => {
		console.log("Data Source has been initialized!");
	})
	.catch((err) => {
		console.error("Error during Data Source initialization:", err);
	});

    app.register(authRouter, { prefix: "/auth" });
    app.register(petRouter, { prefix: "/pets" });
    app.register(indexRouter);

const start = async () => {
	try {
		await app.listen({ port: 3000 });
		console.log("Server started on http://localhost:3000");
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
