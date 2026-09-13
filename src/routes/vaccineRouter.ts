// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, deleteVaccine, updateVaccine, addVaccineToPet, getPetVaccinations, getPetVaccinesCount, getVaccineDetails, deletePetVaccine } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";
import { vaccineSchema, updateVaccineSchema, addVaccineToPetSchema } from "../models/schemas/vaccineSchema";
import { toSwaggerSchema, objectIdParam, objectIdParams } from "../utils/swaggerSchemas";

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

	// Rotas de relacionamento pet-vacina — ordem consistente: quando os dois IDs
	// aparecem na URL, vaccineId sempre vem antes de "pets/:petId".
	fastify.get("/pets/:petId", {
		schema: { ...base, summary: "Lista as vacinações de um pet", params: objectIdParam("petId", "ID do pet") },
		handler: getPetVaccinations,
	});

	fastify.get("/pets/:petId/count", {
		schema: { ...base, summary: "Retorna a quantidade de vacinações de um pet", params: objectIdParam("petId", "ID do pet") },
		handler: getPetVaccinesCount,
	});

	fastify.post("/pets", {
		schema: { ...base, summary: "Registra a aplicação de uma vacina em um pet", body: toSwaggerSchema(addVaccineToPetSchema) },
		attachValidation: true,
		handler: addVaccineToPet,
	});

	const vaccinePetParams = objectIdParams([
		{ name: "vaccineId", description: "ID do tipo de vacina" },
		{ name: "petId", description: "ID do pet" },
	]);

	fastify.get("/:vaccineId/pets/:petId", {
		schema: { ...base, summary: "Busca os detalhes de uma vacinação de um pet", params: vaccinePetParams },
		handler: getVaccineDetails,
	});

	fastify.delete("/:vaccineId/pets/:petId", {
		schema: { ...base, summary: "Remove o registro de vacinação de um pet", params: vaccinePetParams },
		handler: deletePetVaccine,
	});
}
