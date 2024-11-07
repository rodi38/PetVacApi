import { FastifyRequest, FastifyReply } from "fastify";
import { VaccineService } from "../services/VaccineService";
import { vaccineSchema, updateVaccineSchema, addVaccineToPetSchema, VaccineInput, UpdateVaccineInput, AddVaccineToPetInput } from "../models/schemas/vaccineSchema";
import { handleError } from "../utils/errorHandler";

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

export const getVaccineById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const vaccine = await vaccineService.findById(id);
		if (vaccine) {
			reply.send(vaccine);
		} else {
			reply.code(404).send({ error: "Vaccine not found" }); // Corrigido a mensagem de erro
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const updateVaccine = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const updateData = updateVaccineSchema.parse(request.body) as UpdateVaccineInput;
		const updatedVaccine = await vaccineService.update(id, updateData);
		if (updatedVaccine) {
			reply.send(updatedVaccine);
		} else {
			reply.code(404).send({ error: "Vaccine not found" }); // Corrigido a mensagem de erro
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const addVaccineToPet = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const data = addVaccineToPetSchema.parse(request.body) as AddVaccineToPetInput;
		const vaccinationDate = new Date(data.vaccinationDate);

		const result = await vaccineService.addVaccineToPet(data.vaccineId, data.petId, vaccinationDate, data.notes);

		reply.code(201).send({
			// Mudado para 201 pois estamos criando um novo recurso
			message: "Vaccine successfully registered to pet",
			vaccination: result,
		});
	} catch (error) {
		handleError(error, reply);
	}
};

export const getPetVaccinations = async (request: FastifyRequest<{ Params: { petId: string } }>, reply: FastifyReply) => {
	try {
		const { petId } = request.params;
		const vaccinations = await vaccineService.findByPet(petId);
		reply.send({
			petId,
			vaccinations,
			totalVaccinations: vaccinations.length,
		});
	} catch (error) {
		handleError(error, reply);
	}
};

export const getPetVaccinesCount = async (request: FastifyRequest<{ Params: { petId: string } }>, reply: FastifyReply) => {
	try {
		const { petId } = request.params;
		const count = await vaccineService.getPetVaccinesCount(petId);
		reply.send({ count });
	} catch (error) {
		handleError(error, reply);
	}
};
