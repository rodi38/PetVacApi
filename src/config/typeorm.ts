import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/entities/User.Entity";
import { Pet } from "../models/entities/Pet.Entity";
import { Vaccine } from "../models/entities/Vaccine.Entity";

export const AppDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_URI,
  database: process.env.MONGO_DATABASE,
  authSource: process.env.MONGO_ADMIN,
  entities: [User, Pet, Vaccine],
  logging: true,
  synchronize: false, // Set this to false
});
