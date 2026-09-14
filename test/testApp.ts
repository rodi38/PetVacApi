import { MongoMemoryServer } from "mongodb-memory-server";

// Cada arquivo de teste chama setupTestEnv() uma vez, no beforeAll, para subir um
// MongoDB descartável em memória e só então importar o app — os módulos de config
// (src/config/env.ts) leem as variáveis de ambiente na primeira importação, então
// elas precisam estar setadas antes de qualquer import (direto ou indireto) do app.
//
// Um MongoMemoryServer standalone (sem replica set) não suporta transação — o driver
// rejeita com "Transaction numbers are only allowed on a replica set member or mongos".
// withTransaction() (config/mongo.ts) detecta esse erro e cai para execução sequencial,
// então os testes rodam aqui sem atomicidade real, mas a transação de verdade continua
// valendo em produção (a conta do Atlas do projeto é sempre um replica set). Um
// MongoMemoryReplSet foi tentado para testar a transação de ponta a ponta, mas a etapa
// de iniciar o replica set trava com "Missing required sub-document 'driver' in the
// client metadata document" neste ambiente — parece uma incompatibilidade do
// mongodb-memory-server-core com esta versão do Node, não algo do código da aplicação.
export async function setupTestEnv() {
	const mongod = await MongoMemoryServer.create();

	process.env.MONGO_URI = mongod.getUri("petvacapi_test");
	process.env.MONGO_DATABASE = "petvacapi_test";
	process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
	process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

	const { app } = await import("../src/app");
	const { connectMongo, disconnectMongo } = await import("../src/config/mongo");
	const { ensureIndexes } = await import("../src/config/ensureIndexes");

	await connectMongo();
	await ensureIndexes();
	await app.ready();

	return {
		app,
		async teardown() {
			await app.close();
			await disconnectMongo();
			await mongod.stop();
		},
	};
}

export type TestApp = Awaited<ReturnType<typeof setupTestEnv>>;
