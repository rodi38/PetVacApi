import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/entities/User.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { Vaccine } from "../models/entities/Vaccine.Entity";
import { PetVaccine } from "../models/entities/PetVaccine.Entity";
import { env } from "./env";

export const AppDataSource = new DataSource({
	type: "mongodb",
	url: env.MONGO_URI,
	database: env.MONGO_DATABASE,
	authSource: env.MONGO_ADMIN,
	entities: [User, Pet, Vaccine, PetVaccine],
	logging: true,
	synchronize: false, // Set this to false
});
