import { FastifyInstance } from "fastify";
import { 
    createVaccine, 
    getAllVaccines, 
    getVaccineById,
    addPetToVaccine,
    removePetFromVaccine,
    updateVaccine, 
    deleteVaccine 
} from "../controllers/vaccineController";

export default async function (fastify: FastifyInstance) {
    fastify.post("/", createVaccine);
    fastify.get("/", getAllVaccines);
    fastify.get("/:id", getVaccineById);
    fastify.put("/:id", updateVaccine);
    fastify.delete("/:id", deleteVaccine);
    fastify.post("/:vaccineId/pets/:petId", addPetToVaccine);
    fastify.delete("/:vaccineId/pets/:petId", removePetFromVaccine);
}