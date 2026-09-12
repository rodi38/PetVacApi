// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, deleteVaccine, updateVaccine, addVaccineToPet, getPetVaccinations, getPetVaccinesCount, getVaccineDetails, deletePetVaccine } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";
import { vaccineSchema, updateVaccineSchema, addVaccineToPetSchema } from "../models/schemas/vaccineSchema";
import { toSwaggerSchema, objectIdParam } from "../utils/swaggerSchemas";

export default async function (fastify: FastifyInstance) {
	// Adicionar autenticação para todas as rotas
	fastify.addHook("preHandler", authenticate);

	const base = { tags: ["vaccines"], security: [{ bearerAuth: [] }] };

	// Rotas de vacinas
	fastify.post("/", {
		schema: { ...base, summary: "Cria um novo tipo de vacina", body: toSwaggerSchema(vaccineSchema) },
		attachValidation: true,
		handler: createVaccine,
	});

	fastify.get("/", {
		schema: { ...base, summary: "Lista todos os tipos de vacina" },
		handler: getAllVaccines,
	});

	fastify.get("/:id", {
		schema: { ...base, summary: "Busca um tipo de vacina pelo ID", params: objectIdParam("id", "ID do tipo de vacina") },
		handler: getVaccineById,
	});

	fastify.put("/:id", {
		schema: {
			...base,
			summary: "Atualiza um tipo de vacina (campos parciais)",
			params: objectIdParam("id", "ID do tipo de vacina"),
			body: toSwaggerSchema(updateVaccineSchema),
		},
		attachValidation: true,
		handler: updateVaccine,
	});

	fastify.delete("/:id", {
		schema: { ...base, summary: "Apaga um tipo de vacina e seus registros de vacinação", params: objectIdParam("id", "ID do tipo de vacina") },
		handler: deleteVaccine,
	});

	// Rotas de relacionamento pet-vacina
	fastify.get("/pet/:petId", {
		schema: { ...base, summary: "Lista as vacinações de um pet", params: objectIdParam("petId", "ID do pet") },
		handler: getPetVaccinations,
	});

	fastify.get("/pet/:petId/count", {
		schema: { ...base, summary: "Retorna a quantidade de vacinações de um pet", params: objectIdParam("petId", "ID do pet") },
		handler: getPetVaccinesCount,
	});

	fastify.post("/pet/add", {
		schema: { ...base, summary: "Registra a aplicação de uma vacina em um pet", body: toSwaggerSchema(addVaccineToPetSchema) },
		attachValidation: true,
		handler: addVaccineToPet,
	});

	fastify.get("/details/:vaccineId/pet/:petId", {
		schema: {
			...base,
			summary: "Busca os detalhes de uma vacinação de um pet",
			params: {
				type: "object",
				properties: {
					vaccineId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description: "ID do tipo de vacina" },
					petId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description: "ID do pet" },
				},
				required: ["vaccineId", "petId"],
			},
		},
		handler: getVaccineDetails,
	});

	fastify.delete("/pet/:petId/vaccine/:vaccineId", {
		schema: {
			...base,
			summary: "Remove o registro de vacinação de um pet",
			params: {
				type: "object",
				properties: {
					petId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description: "ID do pet" },
					vaccineId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description: "ID do tipo de vacina" },
				},
				required: ["petId", "vaccineId"],
			},
		},
		handler: deletePetVaccine,
	});
}
