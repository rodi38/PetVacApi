import { FastifyRequest, FastifyReply } from "fastify";
import { VaccineService } from "../services/VaccineService";
import { vaccineSchema, updateVaccineSchema, VaccineInput, UpdateVaccineInput } from "../models/schemas/vaccineSchema";
import { ZodError } from "zod";

const vaccineService = new VaccineService();

export const createVaccine = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const vaccineData = vaccineSchema.parse(request.body) as VaccineInput;
        const vaccine = await vaccineService.create(vaccineData);
        reply.code(201).send(vaccine);
    } catch (error) {
        handleError(error, reply);
    }
};

export const addPetToVaccine = async (
    request: FastifyRequest<{ 
        Params: { vaccineId: string; petId: string } 
    }>, 
    reply: FastifyReply
) => {
    try {
        const { vaccineId, petId } = request.params;
        const vaccine = await vaccineService.addPetToVaccine(vaccineId, petId);
        reply.send(vaccine);
    } catch (error) {
        handleError(error, reply);
    }
};

export const removePetFromVaccine = async (
    request: FastifyRequest<{ 
        Params: { vaccineId: string; petId: string } 
    }>, 
    reply: FastifyReply
) => {
    try {
        const { vaccineId, petId } = request.params;
        await vaccineService.removePetFromVaccine(vaccineId, petId);
        reply.code(204).send();
    } catch (error) {
        handleError(error, reply);
    }
};
