import { FastifyRequest, FastifyReply } from "fastify";
import { PetService } from "../services/PetService";
import { petSchema, updatePetSchema, PetInput, UpdatePetInput } from "../models/schemas/petSchema";

import { AppError, sendSuccess } from "../utils/errorHandler";
import { ObjectId } from "mongodb";
import { Pet } from "../models/entities/Pet.Entity";

const petService = new PetService();

async function findOwnedPetOrThrow(id: string, ownerId: ObjectId): Promise<Pet> {
	const pet = await petService.findById(id);
	if (!pet || !pet.owner.equals(ownerId)) {
		// 404 em ambos os casos para não revelar a existência de pets de outros usuários (IDOR).
		throw new AppError("Pet não encontrado", 404, "PET_NOT_FOUND");
	}
	return pet;
}

export const createPet = async (request: FastifyRequest, reply: FastifyReply) => {
	const petData = petSchema.parse(request.body) as PetInput;
	const pet = await petService.create({ ...petData, owner: request.authenticatedUser.userId });
	sendSuccess(reply, pet, 201);
};

export const getAllPets = async (request: FastifyRequest, reply: FastifyReply) => {
	const pets = await petService.getAllPetsByOwner(request.authenticatedUser.userId.toString());
	sendSuccess(reply, pets);
};

export const getAllPetsByOwner = async (request: FastifyRequest<{ Params: { ownerId: string } }>, reply: FastifyReply) => {
	const { ownerId } = request.params;
	if (request.authenticatedUser.userId.toString() !== ownerId) {
		throw new AppError("Não autorizado a acessar pets de outro usuário", 403, "FORBIDDEN");
	}
	const pets = await petService.getAllPetsByOwner(ownerId);
	sendSuccess(reply, pets);
};

export const getPetById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	const pet = await findOwnedPetOrThrow(id, request.authenticatedUser.userId);
	sendSuccess(reply, pet);
};

export const updatePet = async (
	request: FastifyRequest<{
		Params: { id: string };
		Body: UpdatePetInput;
	}>,
	reply: FastifyReply,
) => {
	const { id } = request.params;
	const updateData = updatePetSchema.parse(request.body);

	await findOwnedPetOrThrow(id, request.authenticatedUser.userId);

	const updatedPet = await petService.update(id, updateData as Partial<Pet>);
	sendSuccess(reply, updatedPet);
};

export const deletePet = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	await findOwnedPetOrThrow(id, request.authenticatedUser.userId);

	await petService.delete(id);
	reply.code(204).send();
};
