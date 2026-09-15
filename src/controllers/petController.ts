import { FastifyRequest, FastifyReply } from "fastify";
import { PetService } from "../services/PetService";
import { petSchema, updatePetSchema, PetInput, UpdatePetInput } from "../models/schemas/petSchema";
import { paginationQuerySchema, toPaginatedResult } from "../models/schemas/paginationSchema";

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

// A idade não é mais armazenada — é derivada de birthDate a cada resposta, para não
// ficar desatualizada com o tempo.
function calculateAge(birthDate: Date): number {
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const hasHadBirthdayThisYear = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
	if (!hasHadBirthdayThisYear) {
		age--;
	}
	return age;
}

// Para pets com menos de 1 ano, `age` (em anos) não é informativo o suficiente,
// então também retornamos a idade em semanas ou meses.
function calculateAgeDetail(birthDate: Date, age: number): { unit: "weeks" | "months"; value: number } | null {
	if (age >= 1) {
		return null;
	}
	const today = new Date();
	const diffDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
	if (diffDays < 30) {
		return { unit: "weeks", value: Math.floor(diffDays / 7) };
	}
	let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
	if (today.getDate() < birthDate.getDate()) {
		months--;
	}
	return { unit: "months", value: months };
}

function toPetResponse(pet: Pet) {
	const age = calculateAge(pet.birthDate);
	return { ...pet, age, ageDetail: calculateAgeDetail(pet.birthDate, age) };
}

export const createPet = async (request: FastifyRequest, reply: FastifyReply) => {
	const petData = petSchema.parse(request.body) as PetInput;
	const pet = await petService.create({ ...petData, owner: request.authenticatedUser.userId });
	sendSuccess(reply, toPetResponse(pet), 201);
};

export const getAllPets = async (request: FastifyRequest, reply: FastifyReply) => {
	const pagination = paginationQuerySchema.parse(request.query);
	const { items, total } = await petService.getPetsByOwnerPaginated(request.authenticatedUser.userId.toString(), pagination.page, pagination.limit);
	sendSuccess(reply, toPaginatedResult(items.map(toPetResponse), total, pagination));
};

export const getAllPetsByOwner = async (request: FastifyRequest<{ Params: { ownerId: string } }>, reply: FastifyReply) => {
	const { ownerId } = request.params;
	if (request.authenticatedUser.userId.toString() !== ownerId) {
		throw new AppError("Não autorizado a acessar pets de outro usuário", 403, "FORBIDDEN");
	}
	const pagination = paginationQuerySchema.parse(request.query);
	const { items, total } = await petService.getPetsByOwnerPaginated(ownerId, pagination.page, pagination.limit);
	sendSuccess(reply, toPaginatedResult(items.map(toPetResponse), total, pagination));
};

export const getPetById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	const pet = await findOwnedPetOrThrow(id, request.authenticatedUser.userId);
	sendSuccess(reply, toPetResponse(pet));
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
	sendSuccess(reply, toPetResponse(updatedPet!));
};

export const deletePet = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const { id } = request.params;
	await findOwnedPetOrThrow(id, request.authenticatedUser.userId);

	await petService.delete(id);
	reply.code(204).send();
};
