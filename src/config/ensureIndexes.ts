import { AppDataSource } from "./typeorm";
import { User } from "../models/entities/User.Entity";

// O driver MongoDB do TypeORM ignora "synchronize" e não roda migrations reais,
// então o índice único de @Unique(["email"]) nunca é criado no banco de verdade.
// Criamos aqui manualmente para fechar a corrida de cadastro com e-mail duplicado.
export async function ensureIndexes(): Promise<void> {
	await AppDataSource.getMongoRepository(User).createCollectionIndex("email", { unique: true });
}
