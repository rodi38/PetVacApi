import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet } from "../controllers/petController";
import { authenticate } from "../middleware/authMiddleware";


export default async function (fastify: FastifyInstance) {

    fastify.addHook("preHandler", authenticate);

	fastify.post("/", createPet);
	fastify.get("/", getAllPets);
	fastify.get("/:id", getPetById);
	fastify.put("/:id", updatePet);
	fastify.delete("/:id", deletePet);
}
