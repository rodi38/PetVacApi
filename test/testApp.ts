import { MongoMemoryServer } from "mongodb-memory-server";

// Cada arquivo de teste chama setupTestEnv() uma vez, no beforeAll, para subir um
// MongoDB descartável em memória e só então importar o app — os módulos de config
// (src/config/env.ts) leem as variáveis de ambiente na primeira importação, então
// elas precisam estar setadas antes de qualquer import (direto ou indireto) do app.
export async function setupTestEnv() {
	const mongod = await MongoMemoryServer.create();

	process.env.MONGO_URI = mongod.getUri("petvacapi_test");
	process.env.MONGO_DATABASE = "petvacapi_test";
	process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
	process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

	const { app } = await import("../src/app");
	const { AppDataSource } = await import("../src/config/typeorm");
	const { ensureIndexes } = await import("../src/config/ensureIndexes");

	await AppDataSource.initialize();
	await ensureIndexes();
	await app.ready();

	return {
		app,
		async teardown() {
			await app.close();
			await AppDataSource.destroy();
			await mongod.stop();
		},
	};
}

export type TestApp = Awaited<ReturnType<typeof setupTestEnv>>;
