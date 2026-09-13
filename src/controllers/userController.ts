import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import { registerUserSchema, loginUserSchema, RegisterUserInput, LoginUserInput, UpdateUserInput, updateUserSchema } from "../models/schemas/userSchema";
import { AppError, sendSuccess } from "../utils/errorHandler";
import { User } from "../models/entities/User.Entity";

const userService = new UserService();

function toSafeUser(user: User) {
	const { password, ...safeUser } = user;
	return safeUser;
}

export const registerUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const userData = registerUserSchema.parse(request.body) as RegisterUserInput;
	const user = await userService.register(userData.username, userData.email, userData.password);
	sendSuccess(reply, toSafeUser(user), 201);
};

export const loginUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const loginData = loginUserSchema.parse(request.body) as LoginUserInput;
	const { user, token } = await userService.login(loginData.email, loginData.password);
	sendSuccess(reply, { user: toSafeUser(user), token });
};
export const updateUser = async (
	request: FastifyRequest<{
		Params: { userId: string };
		Body: UpdateUserInput;
	}>,
	reply: FastifyReply,
) => {
	const { userId } = request.params;
	const updateData = updateUserSchema.parse(request.body);

	// Agora usando authenticatedUser ao invés de user
	if (request.authenticatedUser.userId.toString() !== userId) {
		throw new AppError("Não autorizado a atualizar outro usuário", 403, "FORBIDDEN");
	}

	const updatedUser = await userService.update(userId, updateData);
	sendSuccess(reply, toSafeUser(updatedUser));
};
