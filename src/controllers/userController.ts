import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import { registerUserSchema, loginUserSchema, RegisterUserInput, LoginUserInput } from "../models/schemas/userSchema";
import { handleError, AppError } from "../utils/errorHandler";

import { ZodError } from "zod";

const userService = new UserService();

export const registerUser = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userData = registerUserSchema.parse(request.body) as RegisterUserInput;
		const user = await userService.register(userData.username, userData.email, userData.password);
		reply.code(201).send(user);
	} catch (error) {
		handleError(error, reply);
	}
};

export const loginUser = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const loginData = loginUserSchema.parse(request.body) as LoginUserInput;
		const { user, token } = await userService.login(loginData.email, loginData.password);
		reply.code(200).send({ user, token });
	} catch (error) {
		handleError(error, reply);
	}
};



