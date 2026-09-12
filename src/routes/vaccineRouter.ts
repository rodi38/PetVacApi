// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, deleteVaccine, updateVaccine, addVaccineToPet, getPetVaccinations, getPetVaccinesCount, getVaccineDetails, deletePetVaccine } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	// Adicionar autenticação para todas as rotas
	fastify.addHook("preHandler", authenticate);

	const schema = { tags: ["vaccines"], security: [{ bearerAuth: [] }] };

	// Rotas de vacinas
	fastify.post("/", { schema }, createVaccine);
	fastify.get("/", { schema }, getAllVaccines);
	fastify.get("/:id", { schema }, getVaccineById);
	fastify.put("/:id", { schema }, updateVaccine);
	fastify.delete("/:id", { schema }, deleteVaccine);

	// Rotas de relacionamento pet-vacina
	fastify.get("/pet/:petId", { schema }, getPetVaccinations);
	fastify.get("/pet/:petId/count", { schema }, getPetVaccinesCount);
	fastify.post("/pet/add", { schema }, addVaccineToPet);
	fastify.get("/details/:vaccineId/pet/:petId", { schema }, getVaccineDetails);

	fastify.delete("/pet/:petId/vaccine/:vaccineId", { schema }, deletePetVaccine);
}
