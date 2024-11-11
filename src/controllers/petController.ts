import { FastifyRequest, FastifyReply } from "fastify";
import { PetService } from "../services/PetService";
import { petSchema, updatePetSchema, PetInput, UpdatePetInput } from "../models/schemas/petSchema";
import { ZodError } from "zod";

import { handleError, AppError } from "../utils/errorHandler";
import { ObjectId } from "mongodb";
import { Pet } from "models/entities/Pet.Entity";

const petService = new PetService();

export const createPet = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const petData = petSchema.parse(request.body) as PetInput;
		const pet = await petService.create({ ...petData, owner: new ObjectId(petData.owner) });
		reply.code(201).send(pet);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getAllPets = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const pets = await petService.findAll();
		reply.send(pets);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getAllPetsByOwner = async (request: FastifyRequest<{ Params: { ownerId: string } }>, reply: FastifyReply) => {
	try {
		const { ownerId } = request.params;
		const pets = await petService.getAllPetsByOwner(ownerId);
		reply.send(pets);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getPetById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const pet = await petService.findById(id);
		if (pet) {
			reply.send(pet);
		} else {
			reply.code(404).send({ error: "Pet not found" });
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
			reply.send(updatedPet);
		} else {
			reply.code(404).send({ error: "Pet não encontrado" });
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
			reply.code(404).send({ error: "Pet not found" });
		}
	} catch (error) {
		handleError(error, reply);
	}
};
