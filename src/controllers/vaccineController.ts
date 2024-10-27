import { FastifyRequest, FastifyReply } from "fastify";
import { VaccineService } from "../services/VaccineService";
import { vaccineSchema, updateVaccineSchema, VaccineInput, UpdateVaccineInput } from "../models/schemas/vaccineSchema";
import { ZodError } from "zod";
import { handleError, AppError } from "../utils/errorHandler";

const vaccineService = new VaccineService();

export const getAllVaccines = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const vaccines = await vaccineService.findAll();
		reply.send(vaccines);
	} catch (error) {
		handleError(error, reply);
	}
};

export const createVaccine = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const vaccineData = vaccineSchema.parse(request.body) as VaccineInput;
		const vaccine = await vaccineService.create(vaccineData);
		reply.code(201).send(vaccine);
	} catch (error) {
		handleError(error, reply);
	}
};

// export const addPetToVaccine = async (request: FastifyRequest<{ Params: { vaccineId: string; petId: string } }>, reply: FastifyReply) => {
// 	try {
// 		const { vaccineId, petId } = request.params;
// 		const vaccine = await vaccineService.addPetToVaccine(vaccineId, petId);
// 		reply.send(vaccine);
// 	} catch (error) {
// 		handleError(error, reply);
// 	}
// };

// export const removePetFromVaccine = async (
// 	request: FastifyRequest<{
// 		Params: { vaccineId: string; petId: string };
// 	}>,
// 	reply: FastifyReply,
// ) => {
// 	try {
// 		const { vaccineId, petId } = request.params;
// 		await vaccineService.removePetFromVaccine(vaccineId, petId);
// 		reply.code(204).send();
// 	} catch (error) {
// 		handleError(error, reply);
// 	}
// };

export const getVaccineById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const pet = await vaccineService.findById(id);
		if (pet) {
			reply.send(pet);
		} else {
			reply.code(404).send({ error: "Pet not found" });
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const updateVaccine = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const updateData = updateVaccineSchema.parse(request.body) as UpdateVaccineInput;
		const updatedPet = await vaccineService.update(id, updateData);
		if (updatedPet) {
			reply.send(updatedPet);
		} else {
			reply.code(404).send({ error: "Pet not found" });
		}
	} catch (error) {
		handleError(error, reply);
	}
};

// export const deleteVaccine = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
// 	try {
// 		const { id } = request.params;
// 		const success = await VaccineService.delete(id);
// 		if (success) {
// 			reply.code(204).send();
// 		} else {
// 			reply.code(404).send({ error: "Pet not found" });
// 		}
// 	} catch (error) {
// 		handleError(error, reply);
// 	}
// };
