import { FastifyRequest, FastifyReply } from "fastify";
import { VaccineService } from "../services/VaccineService";
import { vaccineSchema, updateVaccineSchema, addVaccineToPetSchema, VaccineInput, UpdateVaccineInput, AddVaccineToPetInput } from "../models/schemas/vaccineSchema";
import { AppError, sendSuccess } from "../utils/errorHandler";

const vaccineService = new VaccineService();

export const getAllVaccines = async (request: FastifyRequest, reply: FastifyReply) => {
	const vaccines = await vaccineService.findAll();
	sendSuccess(reply, vaccines);
};

export const createVaccine = async (request: FastifyRequest, reply: FastifyReply) => {
	const vaccineData = vaccineSchema.parse(request.body) as VaccineInput;
	const vaccine = await vaccineService.create(vaccineData);
	sendSuccess(reply, vaccine, 201);
};

export const getVaccineById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	const vaccine = await vaccineService.findById(id);
	if (vaccine) {
		sendSuccess(reply, vaccine);
	} else {
		throw new AppError("Vaccine not found", 404, "VACCINE_NOT_FOUND");
	}
};

export const updateVaccine = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	const updateData = updateVaccineSchema.parse(request.body) as UpdateVaccineInput;
	const updatedVaccine = await vaccineService.update(id, updateData);
	if (updatedVaccine) {
		sendSuccess(reply, updatedVaccine);
	} else {
		throw new AppError("Vaccine not found", 404, "VACCINE_NOT_FOUND");
	}
};

export const addVaccineToPet = async (request: FastifyRequest, reply: FastifyReply) => {
	const data = addVaccineToPetSchema.parse(request.body) as AddVaccineToPetInput;

	const result = await vaccineService.addVaccineToPet(data.vaccineId, data.petId, {
		vaccinationDate: data.vaccinationDate,
		notes: data.notes,
		veterinarian: data.veterinarian,
		clinic: data.clinic,
		nextDoseDate: data.nextDoseDate,
	});

	sendSuccess(reply, result, 201);
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
	const { vaccineId, petId } = request.params;

	const details = await vaccineService.getVaccineDetails(vaccineId, petId);
	sendSuccess(reply, details);
};

export const getPetVaccinations = async (request: FastifyRequest<{ Params: { petId: string } }>, reply: FastifyReply) => {
	const { petId } = request.params;
	const vaccinations = await vaccineService.findByPet(petId);
	sendSuccess(reply, {
		petId,
		vaccinations,
		totalVaccinations: vaccinations.length,
	});
};

export const getPetVaccinesCount = async (request: FastifyRequest<{ Params: { petId: string } }>, reply: FastifyReply) => {
	const { petId } = request.params;
	const count = await vaccineService.getPetVaccinesCount(petId);
	sendSuccess(reply, { count });
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
	const { vaccineId, petId } = request.params;
	const success = await vaccineService.deletePetVaccine(vaccineId, petId);

	if (success) {
		reply.code(204).send();
	} else {
		throw new AppError("Vaccination record not found", 404, "VACCINATION_NOT_FOUND");
	}
};

export const deleteVaccine = async (
	request: FastifyRequest<{
		Params: { id: string };
	}>,
	reply: FastifyReply,
) => {
	const { id } = request.params;
	const success = await vaccineService.deleteVaccine(id);

	if (success) {
		reply.code(204).send();
	} else {
		throw new AppError("Vacina não encontrada", 404, "VACCINE_NOT_FOUND");
	}
};
