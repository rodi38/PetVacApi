import { FastifyRequest, FastifyReply } from "fastify";
import { PetService } from "../services/PetService";
import { petSchema, updatePetSchema, PetInput, UpdatePetInput } from "../models/schemas/petSchema";
import { ZodError } from "zod";
import { ObjectId } from "mongodb";

const petService = new PetService();

export const createPet = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const petData = petSchema.parse(request.body) as PetInput;
		const pet = await petService.create(petData);
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

export const updatePet = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const updateData = updatePetSchema.parse(request.body) as UpdatePetInput;
		const updatedPet = await petService.update(id, updateData);
		if (updatedPet) {
			reply.send(updatedPet);
		} else {
			reply.code(404).send({ error: "Pet not found" });
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

function handleError(error: unknown, reply: FastifyReply) {
	if (error instanceof ZodError) {
		const formattedErrors = error.errors.map((err) => ({
			field: err.path.join("."),
			message: err.message,
		}));
		reply.code(400).send({ errors: formattedErrors });
	} else if (error instanceof Error) {
		reply.code(400).send({ error: error.message });
	} else {
		reply.code(500).send({ error: "An unexpected error occurred" });
	}
}
