import { ObjectId } from "mongodb";
import { setupTestEnv, TestApp } from "./testApp";
import { registerAndLogin } from "./helpers";
import type { Pet } from "../src/models/entities/Pet.Entity";
import type { PetVaccine } from "../src/models/entities/PetVaccine.Entity";

describe("Soft-delete (histórico preservado)", () => {
	let ctx: TestApp;

	beforeAll(async () => {
		ctx = await setupTestEnv();
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	it("apaga um pet pela API mas mantém o documento no banco, marcado com deletedAt", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "softdelete-pet@example.com" });

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Mel", petType: "dog", breed: "beagle", gender: "female", birthDate: new Date("2020-05-01").toISOString() },
		});
		const petId = createResponse.json().data._id as string;

		const deleteResponse = await ctx.app.inject({
			method: "DELETE",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(deleteResponse.statusCode).toBe(204);

		// A API não deve mais enxergar o pet apagado.
		const getResponse = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(getResponse.statusCode).toBe(404);

		// Mas o documento continua no banco, só marcado.
		const { getDb } = await import("../src/config/mongo");
		const rawPet = await getDb().collection<Pet>("pets").findOne({ _id: new ObjectId(petId) });

		expect(rawPet).not.toBeNull();
		expect(rawPet!.deletedAt).toBeInstanceOf(Date);
	});

	it("apaga o registro de vacinação pela API mas preserva o histórico no banco", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "softdelete-vaccination@example.com" });

		const petResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Duque", petType: "dog", breed: "pastor alemão", gender: "male", birthDate: new Date("2018-02-20").toISOString() },
		});
		const petId = petResponse.json().data._id as string;

		const vaccineResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/vaccines",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Antirrábica" },
		});
		const vaccineId = vaccineResponse.json().data._id as string;

		await ctx.app.inject({
			method: "POST",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${token}` },
			payload: { vaccineId, doses: [new Date("2023-05-01").toISOString()] },
		});

		const deleteResponse = await ctx.app.inject({
			method: "DELETE",
			url: `/api/v1/pets/${petId}/vaccinations/${vaccineId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(deleteResponse.statusCode).toBe(204);

		// A listagem via API não deve mais mostrar o registro apagado.
		const listResponse = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(listResponse.json().data.total).toBe(0);

		// Mas o registro de vacinação continua no banco, preservando o histórico.
		const { getDb } = await import("../src/config/mongo");
		const rawRecord = await getDb().collection<PetVaccine>("pet_vaccines").findOne({ petId: new ObjectId(petId), vaccineId: new ObjectId(vaccineId) });

		expect(rawRecord).not.toBeNull();
		expect(rawRecord!.deletedAt).toBeInstanceOf(Date);
	});
});
