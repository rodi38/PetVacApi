import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet, getAllPetsByOwner } from "../controllers/petController";
import { authenticate } from "../middleware/authMiddleware";

export default async function (fastify: FastifyInstance) {
	fastify.addHook("preHandler", authenticate);

	const schema = { tags: ["pets"], security: [{ bearerAuth: [] }] };

	fastify.post("/", { schema }, createPet);
	fastify.get("/", { schema }, getAllPets);
	fastify.get("/owner/:ownerId", { schema }, getAllPetsByOwner);
	fastify.get("/:id", { schema }, getPetById);
	fastify.put("/:id", { schema }, updatePet);
	fastify.delete("/:id", { schema }, deletePet);
}
