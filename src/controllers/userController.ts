import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import { registerUserSchema, loginUserSchema, RegisterUserInput, LoginUserInput, UpdateUserInput, updateUserSchema } from "../models/schemas/userSchema";
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
export const updateUser = async (
	request: FastifyRequest<{
		Params: { userId: string };
		Body: UpdateUserInput;
	}>,
	reply: FastifyReply,
) => {
	try {
		console.log(request.params);
		console.log(request.body);

		const { userId } = request.params;
		const updateData = updateUserSchema.parse(request.body);
		console.log(updateData);

		// Agora usando authenticatedUser ao invés de user
		if (request.authenticatedUser.userId.toString() !== userId) {
			return reply.code(403).send({
				error: "Não autorizado a atualizar outro usuário",
			});
		}

		const updatedUser = await userService.update(userId, updateData);
		const { password, ...userWithoutPassword } = updatedUser;
		reply.send(userWithoutPassword);
	} catch (error) {
		handleError(error, reply);
	}
};
