// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, updateVaccine, addVaccineToPet, getPetVaccinations, getPetVaccinesCount, getVaccineDetails } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	// Adicionar autenticação para todas as rotas
	fastify.addHook("preHandler", authenticate);

	// Rotas de vacinas
	fastify.post("/", createVaccine);
	fastify.get("/", getAllVaccines);
	fastify.get("/:id", getVaccineById);
	fastify.put("/:id", updateVaccine);

	// Rotas de relacionamento pet-vacina
	fastify.get("/pet/:petId", getPetVaccinations);
	fastify.get("/pet/:petId/count", getPetVaccinesCount);
	fastify.post("/pet/add", addVaccineToPet);
	fastify.get("/details/:vaccineId/pet/:petId", getVaccineDetails);
}
