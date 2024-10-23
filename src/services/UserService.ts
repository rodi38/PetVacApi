import { MongoRepository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { User } from "../models/entities/User.Entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
			throw new Error("User with this email already exists");
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

	private generateToken(userId: string): string {
		return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret", {
			expiresIn: process.env.JWT_EXPIRES_IN || "1h",
		});
	}

    
}
