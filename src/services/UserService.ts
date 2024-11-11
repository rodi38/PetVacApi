import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { User } from "../models/entities/User.Entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errorHandler";
import { ObjectId } from "mongodb";
import { UpdateUserInput } from "../models/schemas/userSchema";
import { log } from "console";

export class UserService {
	private userRepository: MongoRepository<User>;

	constructor() {
		this.userRepository = AppDataSource.getMongoRepository(User);
	}

	async register(username: string, email: string, password: string): Promise<User> {
		const existingUser = await this.userRepository.findOne({
			where: { email },
		});
		if (existingUser) {
			throw new AppError("User with this email already exists", 400, "USER_EXISTS");
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = this.userRepository.create({
			username,
			email,
			password: hashedPassword,
		});

		return this.userRepository.save(user);
	}

	async login(email: string, password: string): Promise<{ user: User; token: string }> {
		const user = await this.userRepository.findOne({ where: { email } });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			throw new Error("Invalid credentials");
		}

		const token = this.generateToken(user._id.toString());

		return { user, token };
	}

	async update(userId: string, updateData: UpdateUserInput): Promise<User> {
		const user = await this.userRepository.findOneBy({ _id: new ObjectId(userId) });
		console.log(user);

		if (!user) {
			throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
		}

		// Verifica email único se estiver sendo atualizado
		if (updateData.email && updateData.email !== user.email) {
			const existingUser = await this.userRepository.findOne({
				where: { email: updateData.email },
			});

			if (existingUser) {
				throw new AppError("Email já está em uso", 400, "EMAIL_IN_USE");
			}
		}

		// Criar objeto de atualização
		let updateFields: Partial<User> = {};

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
		}

		// Atualiza o usuário
		await this.userRepository.update({ _id: new ObjectId(userId) }, updateFields);

		// Retorna o usuário atualizado
		return this.userRepository.findOneBy({ _id: new ObjectId(userId) }) as Promise<User>;
	}

	private generateToken(userId: string): string {
		return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret", {
			expiresIn: process.env.JWT_EXPIRES_IN || "1h",
		});
	}
}
