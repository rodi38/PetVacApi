import { FastifyInstance } from "fastify";
import { createPet, getAllPets, getPetById, updatePet, deletePet } from "../controllers/petController";

export default async function (fastify: FastifyInstance) {
	fastify.post("/", createPet);
	fastify.get("/", getAllPets);
	fastify.get("/:id", getPetById);
	fastify.put("/:id", updatePet);
	fastify.delete("/:id", deletePet);
}
