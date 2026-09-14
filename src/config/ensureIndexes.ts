import { getDb } from "./mongo";

// Índices que o schema não cria sozinho (o driver nativo do mongodb, assim como o
// driver do TypeORM antes dele, não roda migrations — precisa ser feito à mão no boot).
export async function ensureIndexes(): Promise<void> {
	await getDb().collection("users").createIndex("email", { unique: true });
}
