import { ClientSession, Db, MongoClient } from "mongodb";
import { env } from "./env";

// Driver nativo do mongodb, sem TypeORM: o driver do TypeORM para Mongo não suportava
// transações nem migrations reais (ver ensureIndexes.ts), então a camada de persistência
// passou a falar diretamente com o driver que já rodava por baixo dele.
export const mongoClient = new MongoClient(env.MONGO_URI, { authSource: env.MONGO_ADMIN });

let db: Db | undefined;

export async function connectMongo(): Promise<Db> {
	await mongoClient.connect();
	db = mongoClient.db(env.MONGO_DATABASE);
	return db;
}

export async function disconnectMongo(): Promise<void> {
	await mongoClient.close();
	db = undefined;
}

export function isMongoConnected(): boolean {
	return db !== undefined;
}

export function getDb(): Db {
	if (!db) {
		throw new Error("MongoDB não conectado — chame connectMongo() no boot antes de usar getDb().");
	}
	return db;
}

// A conta do Atlas do projeto é sempre um replica set (mesmo no tier gratuito), então
// transações reais funcionam em produção. Cascatas de soft-delete (pet + suas vacinações,
// vacina + seus registros) usam isso para não deixar um dos dois apagado sozinho.
//
// Um MongoDB standalone (sem replica set) rejeita transações. Em vez de exigir um
// replica set também para rodar localmente/nos testes — o que se mostrou instável no
// mongodb-memory-server neste ambiente —, cai de volta para execução sequencial sem
// atomicidade real quando o servidor não suporta transação. `fn` recebe `session`
// como `undefined` nesse caso; passar `{ session: undefined }` para o driver equivale
// a não passar sessão nenhuma.
const TRANSACTIONS_UNSUPPORTED = /Transaction numbers are only allowed on a replica set member or mongos/;

export async function withTransaction<T>(fn: (session: ClientSession | undefined) => Promise<T>): Promise<T> {
	const session = mongoClient.startSession();
	try {
		let result: T | undefined;
		try {
			await session.withTransaction(async () => {
				result = await fn(session);
			});
			return result as T;
		} catch (error) {
			if (error instanceof Error && TRANSACTIONS_UNSUPPORTED.test(error.message)) {
				return await fn(undefined);
			}
			throw error;
		}
	} finally {
		await session.endSession();
	}
}
