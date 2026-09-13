import * as dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export const env = {
	PORT: Number(process.env.PORT) || 5000,
	JWT_SECRET: required("JWT_SECRET"),
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
	MONGO_URI: required("MONGO_URI"),
	MONGO_DATABASE: required("MONGO_DATABASE"),
	MONGO_ADMIN: process.env.MONGO_ADMIN || "admin",
};
