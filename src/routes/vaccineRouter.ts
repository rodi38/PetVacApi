// src/routes/vaccineRouter.ts
import { FastifyInstance } from "fastify";
import { createVaccine, getAllVaccines, getVaccineById, updateVaccine, addVaccineToPet, getPetVaccinations } from "../controllers/vaccineController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	// Adicionar autenticação para todas as rotas
	fastify.addHook("preHandler", authenticate);

	// Rotas de vacinas
	fastify.post("/", createVaccine);
	fastify.get("/", getAllVaccines);
	fastify.get("/:id", getVaccineById);
	fastify.put("/:id", updateVaccine);

	// Rotas de vacinação de pets
	fastify.post("/pet", addVaccineToPet);
	fastify.get("/pet/:petId", getPetVaccinations);
}
