// src/controllers/userController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import { z } from "zod";

const userService = new UserService();

const userSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userData = userSchema.parse(request.body);
    const user = await userService.register(
      userData.username,
      userData.email,
      userData.password
    );
    reply.code(201).send(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User with this email already exists") {
        reply.code(409).send({ error: "User with this email already exists" });
      } else {
        reply.code(400).send({ error: "Failed to register user" });
      }
    } else {
      reply.code(500).send({ error: "Internal server error" });
    }
  }
};

export const loginUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const loginData = loginSchema.parse(request.body);
    const { user, token } = await userService.login(
      loginData.email,
      loginData.password
    );
    console.log(user, token);

    reply.code(200).send({ user, token });
  } catch (error) {
    reply.code(400).send({ error: "Invalid credentials" });
  }
};
// Add other user-related controller functions here
