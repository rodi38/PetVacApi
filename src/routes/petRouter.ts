import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet, getAllPetsByOwner } from "../controllers/petController";
import { authenticate } from "../middleware/authMiddleware";
import { petSchema, updatePetSchema } from "../models/schemas/petSchema";
import { toSwaggerSchema, objectIdParam } from "../utils/swaggerSchemas";

export default async function (fastify: FastifyInstance) {
	fastify.addHook("preHandler", authenticate);

	const base = { tags: ["pets"], security: [{ bearerAuth: [] }] };

	fastify.post("/", {
		schema: { ...base, summary: "Cria um novo pet", body: toSwaggerSchema(petSchema) },
		attachValidation: true,
		handler: createPet,
	});

	fastify.get("/", {
		schema: { ...base, summary: "Lista todos os pets" },
		handler: getAllPets,
	});

	fastify.get("/owner/:ownerId", {
		schema: { ...base, summary: "Lista os pets de um dono", params: objectIdParam("ownerId", "ID do dono") },
		handler: getAllPetsByOwner,
	});

	fastify.get("/:id", {
		schema: { ...base, summary: "Busca um pet pelo ID", params: objectIdParam("id", "ID do pet") },
		handler: getPetById,
	});

	fastify.put("/:id", {
		schema: {
			...base,
			summary: "Atualiza um pet (campos parciais)",
			params: objectIdParam("id", "ID do pet"),
			body: toSwaggerSchema(updatePetSchema),
		},
		attachValidation: true,
		handler: updatePet,
	});

	fastify.delete("/:id", {
		schema: { ...base, summary: "Apaga um pet e suas vacinações", params: objectIdParam("id", "ID do pet") },
		handler: deletePet,
	});
}
