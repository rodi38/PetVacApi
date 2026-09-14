import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet, getAllPetsByOwner } from "../controllers/petController";
import { addVaccineToPet, updatePetVaccine, getPetVaccinations, getPetVaccinesCount, getVaccineDetails, deletePetVaccine } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";
import { petSchema, updatePetSchema } from "../models/schemas/petSchema";
import { addVaccineToPetSchema, updatePetVaccineSchema } from "../models/schemas/vaccineSchema";
import { toSwaggerSchema, objectIdParam, objectIdParams, successEnvelopeSchema, errorEnvelopeSchema } from "../utils/swaggerSchemas";

export default async function (fastify: FastifyInstance) {
	fastify.addHook("preHandler", authenticate);

	const base = { tags: ["pets"], security: [{ bearerAuth: [] }] };
	const authResponses = { 401: errorEnvelopeSchema };

	fastify.post("/", {
		schema: {
			...base,
			summary: "Cria um novo pet",
			body: toSwaggerSchema(petSchema),
			response: { 201: successEnvelopeSchema(), 400: errorEnvelopeSchema, ...authResponses },
		},
		handler: createPet,
	});

	fastify.get("/", {
		schema: { ...base, summary: "Lista todos os pets", response: { 200: successEnvelopeSchema(), ...authResponses } },
		handler: getAllPets,
	});

	fastify.get("/owner/:ownerId", {
		schema: {
			...base,
			summary: "Lista os pets de um dono",
			params: objectIdParam("ownerId", "ID do dono"),
			response: { 200: successEnvelopeSchema(), ...authResponses },
		},
		handler: getAllPetsByOwner,
	});

	fastify.get("/:id", {
		schema: {
			...base,
			summary: "Busca um pet pelo ID",
			params: objectIdParam("id", "ID do pet"),
			response: { 200: successEnvelopeSchema(), 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: getPetById,
	});

	fastify.put("/:id", {
		schema: {
			...base,
			summary: "Atualiza um pet (campos parciais)",
			params: objectIdParam("id", "ID do pet"),
			body: toSwaggerSchema(updatePetSchema),
			response: { 200: successEnvelopeSchema(), 400: errorEnvelopeSchema, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: updatePet,
	});

	fastify.delete("/:id", {
		schema: {
			...base,
			summary: "Apaga um pet e suas vacinações",
			params: objectIdParam("id", "ID do pet"),
			response: { 204: { type: "null" }, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: deletePet,
	});

	// Vacinações aplicadas a um pet — recurso aninhado sob o próprio pet,
	// em vez de espalhado sob a raiz de /vaccines.
	fastify.get("/:petId/vaccinations", {
		schema: {
			...base,
			summary: "Lista as vacinações de um pet",
			params: objectIdParam("petId", "ID do pet"),
			response: { 200: successEnvelopeSchema(), ...authResponses },
		},
		handler: getPetVaccinations,
	});

	fastify.get("/:petId/vaccinations/count", {
		schema: {
			...base,
			summary: "Retorna a quantidade de vacinações de um pet",
			params: objectIdParam("petId", "ID do pet"),
			response: { 200: successEnvelopeSchema(), ...authResponses },
		},
		handler: getPetVaccinesCount,
	});

	fastify.post("/:petId/vaccinations", {
		schema: {
			...base,
			summary: "Registra a aplicação de uma vacina em um pet",
			params: objectIdParam("petId", "ID do pet"),
			body: toSwaggerSchema(addVaccineToPetSchema),
			response: { 201: successEnvelopeSchema(), 400: errorEnvelopeSchema, ...authResponses },
		},
		handler: addVaccineToPet,
	});

	const petVaccinationParams = objectIdParams([
		{ name: "petId", description: "ID do pet" },
		{ name: "vaccineId", description: "ID do tipo de vacina" },
	]);

	fastify.get("/:petId/vaccinations/:vaccineId", {
		schema: {
			...base,
			summary: "Busca os detalhes de uma vacinação de um pet",
			params: petVaccinationParams,
			response: { 200: successEnvelopeSchema(), 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: getVaccineDetails,
	});

	fastify.put("/:petId/vaccinations/:vaccineId", {
		schema: {
			...base,
			summary: "Atualiza um registro de vacinação de um pet (campos parciais)",
			params: petVaccinationParams,
			body: toSwaggerSchema(updatePetVaccineSchema),
			response: { 200: successEnvelopeSchema(), 400: errorEnvelopeSchema, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: updatePetVaccine,
	});

	fastify.delete("/:petId/vaccinations/:vaccineId", {
		schema: {
			...base,
			summary: "Remove o registro de vacinação de um pet",
			params: petVaccinationParams,
			response: { 204: { type: "null" }, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: deletePetVaccine,
	});
}
