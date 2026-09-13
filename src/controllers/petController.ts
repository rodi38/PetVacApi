import { FastifyRequest, FastifyReply } from "fastify";
import { PetService } from "../services/PetService";
import { petSchema, updatePetSchema, PetInput, UpdatePetInput } from "../models/schemas/petSchema";
import { ZodError } from "zod";

import { handleError, AppError, sendSuccess } from "../utils/errorHandler";
import { ObjectId } from "mongodb";
import { Pet } from "models/entities/Pet.Entity";

const petService = new PetService();

export const createPet = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const petData = petSchema.parse(request.body) as PetInput;
		const pet = await petService.create({ ...petData, owner: new ObjectId(petData.owner) });
		sendSuccess(reply, pet, 201);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getAllPets = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const pets = await petService.findAll();
		sendSuccess(reply, pets);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getAllPetsByOwner = async (request: FastifyRequest<{ Params: { ownerId: string } }>, reply: FastifyReply) => {
	try {
		const { ownerId } = request.params;
		const pets = await petService.getAllPetsByOwner(ownerId);
		sendSuccess(reply, pets);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getPetById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const pet = await petService.findById(id);
		if (pet) {
			sendSuccess(reply, pet);
		} else {
			throw new AppError("Pet not found", 404, "PET_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const updatePet = async (
	request: FastifyRequest<{
		Params: { id: string };
		Body: UpdatePetInput;
	}>,
	reply: FastifyReply,
) => {
	try {
		const { id } = request.params;
		const updateData = updatePetSchema.parse(request.body);

		// Verifica se owner está presente no updateData antes de tentar converter para ObjectId
		const updatedData = {
			...updateData,
			...(updateData.owner && { owner: new ObjectId(updateData.owner) }),
		};

		const updatedPet = await petService.update(id, updatedData as Partial<Pet>);

		if (updatedPet) {
			sendSuccess(reply, updatedPet);
		} else {
			throw new AppError("Pet não encontrado", 404, "PET_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const deletePet = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const success = await petService.delete(id);
		if (success) {
			reply.code(204).send();
		} else {
			throw new AppError("Pet not found", 404, "PET_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};
