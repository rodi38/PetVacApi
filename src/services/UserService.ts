import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/mongo";
import { User } from "../models/entities/User.Entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errorHandler";
import { UpdateUserInput } from "../models/schemas/userSchema";
import { env } from "../config/env";

export class UserService {
	private get collection(): Collection<User> {
		return getDb().collection<User>("users");
	}

	async register(username: string, email: string, password: string): Promise<User> {
		const existingUser = await this.collection.findOne({ email });
		if (existingUser) {
			throw new AppError("Usuário com este email já existe", 400, "USER_EXISTS");
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const now = new Date();
		const user: User = {
			_id: new ObjectId(),
			username,
			email,
			password: hashedPassword,
			createdAt: now,
			updatedAt: now,
		};

		try {
			await this.collection.insertOne(user);
			return user;
		} catch (error) {
			// Se duas requisições passarem pelo findOne acima ao mesmo tempo, o índice
			// único de "email" (ver ensureIndexes) rejeita a segunda inserção aqui.
			if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
				throw new AppError("Usuário com este email já existe", 400, "USER_EXISTS");
			}
			throw error;
		}
	}

	async login(email: string, password: string): Promise<{ user: User; token: string }> {
		const user = await this.collection.findOne({ email });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
		}

		const token = this.generateToken(user._id.toString());

		return { user, token };
	}

	async update(userId: string, updateData: UpdateUserInput): Promise<User> {
		const _id = new ObjectId(userId);
		const user = await this.collection.findOne({ _id });

		if (!user) {
			throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
		}

		// Verifica email único se estiver sendo atualizado
		if (updateData.email && updateData.email !== user.email) {
			const existingUser = await this.collection.findOne({ email: updateData.email });

			if (existingUser) {
				throw new AppError("Email já está em uso", 400, "EMAIL_IN_USE");
			}
		}

		// Criar objeto de atualização
		const updateFields: Partial<User> = { updatedAt: new Date() };

		// Copiar campos básicos se existirem
		if (updateData.username) updateFields.username = updateData.username;
		if (updateData.email) updateFields.email = updateData.email;

		// Tratar atualização de senha separadamente
		if (updateData.newPassword) {
			const isPasswordValid = await bcrypt.compare(updateData.currentPassword!, user.password);

			if (!isPasswordValid) {
				throw new AppError("Senha atual incorreta", 401, "INVALID_PASSWORD");
			}

			// Adicionar nova senha hash ao objeto de atualização
			updateFields.password = await bcrypt.hash(updateData.newPassword, 10);
			// Invalida tokens JWT emitidos antes desta troca (ver authMiddleware).
			updateFields.passwordChangedAt = new Date();
		}

		// Atualiza o usuário
		await this.collection.updateOne({ _id }, { $set: updateFields });

		// Retorna o usuário atualizado
		return (await this.collection.findOne({ _id }))!;
	}

	private generateToken(userId: string): string {
		return jwt.sign({ userId }, env.JWT_SECRET, {
			expiresIn: env.JWT_EXPIRES_IN,
		});
	}
}
