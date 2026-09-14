// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, deleteVaccine, updateVaccine } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";
import { vaccineSchema, updateVaccineSchema } from "../models/schemas/vaccineSchema";
import { toSwaggerSchema, objectIdParam, successEnvelopeSchema, errorEnvelopeSchema } from "../utils/swaggerSchemas";

// Catálogo de tipos de vacina. O relacionamento pet↔vacina (registrar, listar,
// atualizar e apagar uma vacinação aplicada) mora em petRouter.ts, sob /pets/:petId/vaccinations.
export default async function (fastify: FastifyInstance) {
	// Adicionar autenticação para todas as rotas
	fastify.addHook("preHandler", authenticate);

	const base = { tags: ["vaccines"], security: [{ bearerAuth: [] }] };
	const authResponses = { 401: errorEnvelopeSchema };

	fastify.post("/", {
		schema: {
			...base,
			summary: "Cria um novo tipo de vacina",
			body: toSwaggerSchema(vaccineSchema),
			response: { 201: successEnvelopeSchema(), 400: errorEnvelopeSchema, ...authResponses },
		},
		handler: createVaccine,
	});

	fastify.get("/", {
		schema: { ...base, summary: "Lista todos os tipos de vacina", response: { 200: successEnvelopeSchema(), ...authResponses } },
		handler: getAllVaccines,
	});

	fastify.get("/:id", {
		schema: {
			...base,
			summary: "Busca um tipo de vacina pelo ID",
			params: objectIdParam("id", "ID do tipo de vacina"),
			response: { 200: successEnvelopeSchema(), 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: getVaccineById,
	});

	fastify.put("/:id", {
		schema: {
			...base,
			summary: "Atualiza um tipo de vacina (campos parciais)",
			params: objectIdParam("id", "ID do tipo de vacina"),
			body: toSwaggerSchema(updateVaccineSchema),
			response: { 200: successEnvelopeSchema(), 400: errorEnvelopeSchema, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: updateVaccine,
	});

	fastify.delete("/:id", {
		schema: {
			...base,
			summary: "Apaga um tipo de vacina e seus registros de vacinação",
			params: objectIdParam("id", "ID do tipo de vacina"),
			response: { 204: { type: "null" }, 404: errorEnvelopeSchema, ...authResponses },
		},
		handler: deleteVaccine,
	});
}
