import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet, getAllPetsByOwner } from "../controllers/petController";
import { authenticate } from "../middleware/authMiddleware";
import { petSchema, updatePetSchema } from "../models/schemas/petSchema";
import { toSwaggerSchema, objectIdParam, successEnvelopeSchema, errorEnvelopeSchema } from "../utils/swaggerSchemas";

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
}
