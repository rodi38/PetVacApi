import { FastifyRequest, FastifyReply } from "fastify";
import { VaccineService } from "../services/VaccineService";
import { vaccineSchema, updateVaccineSchema, addVaccineToPetSchema, VaccineInput, UpdateVaccineInput, AddVaccineToPetInput } from "../models/schemas/vaccineSchema";
import { handleError, AppError, sendSuccess } from "../utils/errorHandler";
import { log } from "console";

const vaccineService = new VaccineService();

export const getAllVaccines = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const vaccines = await vaccineService.findAll();
		sendSuccess(reply, vaccines);
	} catch (error) {
		handleError(error, reply);
	}
};

export const createVaccine = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const vaccineData = vaccineSchema.parse(request.body) as VaccineInput;
		const vaccine = await vaccineService.create(vaccineData);
		sendSuccess(reply, vaccine, 201);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getVaccineById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const vaccine = await vaccineService.findById(id);
		if (vaccine) {
			sendSuccess(reply, vaccine);
		} else {
			throw new AppError("Vaccine not found", 404, "VACCINE_NOT_FOUND");
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
			sendSuccess(reply, updatedVaccine);
		} else {
			throw new AppError("Vaccine not found", 404, "VACCINE_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const addVaccineToPet = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const data = addVaccineToPetSchema.parse(request.body) as AddVaccineToPetInput;

		const result = await vaccineService.addVaccineToPet(data.vaccineId, data.petId, {
			vaccinationDate: data.vaccinationDate,
			notes: data.notes,
			veterinarian: data.veterinarian,
			clinic: data.clinic,
			nextDoseDate: data.nextDoseDate,
		});

		sendSuccess(reply, result, 201);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getVaccineDetails = async (
	request: FastifyRequest<{
		Params: {
			vaccineId: string;
			petId: string;
		};
	}>,
	reply: FastifyReply,
) => {
	try {
		const { vaccineId, petId } = request.params;

		const details = await vaccineService.getVaccineDetails(vaccineId, petId);
		sendSuccess(reply, details);
	} catch (error) {
		handleError(error, reply);
	}
};

export const getPetVaccinations = async (request: FastifyRequest<{ Params: { petId: string } }>, reply: FastifyReply) => {
	try {
		const { petId } = request.params;
		const vaccinations = await vaccineService.findByPet(petId);
		sendSuccess(reply, {
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
		sendSuccess(reply, { count });
	} catch (error) {
		handleError(error, reply);
	}
};

export const deletePetVaccine = async (
	request: FastifyRequest<{
		Params: {
			vaccineId: string;
			petId: string;
		};
	}>,
	reply: FastifyReply,
) => {
	try {
		const { vaccineId, petId } = request.params;
		const success = await vaccineService.deletePetVaccine(vaccineId, petId);

		if (success) {
			reply.code(204).send();
		} else {
			throw new AppError("Vaccination record not found", 404, "VACCINATION_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};

export const deleteVaccine = async (
	request: FastifyRequest<{
		Params: { id: string };
	}>,
	reply: FastifyReply,
) => {
	try {
		const { id } = request.params;
		const success = await vaccineService.deleteVaccine(id);

		if (success) {
			reply.code(204).send();
		} else {
			throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
		}
	} catch (error) {
		handleError(error, reply);
	}
};
