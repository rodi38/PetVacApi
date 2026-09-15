import { setupTestEnv, TestApp } from "./testApp";
import { registerAndLogin } from "./helpers";

describe("Vacinações de um pet (/pets/:petId/vaccinations)", () => {
	let ctx: TestApp;
	let token: string;
	let petId: string;
	let vaccineId: string;

	beforeAll(async () => {
		ctx = await setupTestEnv();

		({ token } = await registerAndLogin(ctx.app, { email: "vacinacao@example.com" }));

		const petResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Amora", petType: "cat", breed: "siamês", gender: "female", birthDate: new Date("2019-03-10").toISOString() },
		});
		petId = petResponse.json().data._id;

		const vaccineResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/vaccines",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "V10", description: "Vacina múltipla" },
		});
		vaccineId = vaccineResponse.json().data._id;
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	it("registra, busca, atualiza e remove uma vacinação do pet", async () => {
		const createResponse = await ctx.app.inject({
			method: "POST",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${token}` },
			payload: { vaccineId, doses: [new Date("2024-01-10").toISOString()], clinic: "Clínica Central" },
		});
		expect(createResponse.statusCode).toBe(201);

		const listResponse = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(listResponse.json().data.total).toBe(1);

		const detailsResponse = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}/vaccinations/${vaccineId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(detailsResponse.statusCode).toBe(200);
		expect(detailsResponse.json().data.petVaccine.clinic).toBe("Clínica Central");

		const updateResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}/vaccinations/${vaccineId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: { clinic: "Clínica Nova" },
		});
		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().data.clinic).toBe("Clínica Nova");

		const deleteResponse = await ctx.app.inject({
			method: "DELETE",
			url: `/api/v1/pets/${petId}/vaccinations/${vaccineId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(deleteResponse.statusCode).toBe(204);

		const afterDelete = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}/vaccinations/${vaccineId}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(afterDelete.statusCode).toBe(404);
	});

	it("permite múltiplas doses (série + reforços), edição e remoção de doses", async () => {
		const secondVaccineResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/vaccines",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Antirrábica" },
		});
		const secondVaccineId = secondVaccineResponse.json().data._id;

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${token}` },
			payload: {
				vaccineId: secondVaccineId,
				doses: [new Date("2024-01-10").toISOString(), new Date("2024-02-10").toISOString()],
			},
		});
		expect(createResponse.statusCode).toBe(201);
		expect(createResponse.json().data.doses).toHaveLength(2);

		const updateResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}/vaccinations/${secondVaccineId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: {
				doses: [new Date("2024-01-10").toISOString(), new Date("2025-01-10").toISOString()],
			},
		});
		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().data.doses).toHaveLength(2);
		expect(new Date(updateResponse.json().data.doses[1]).toISOString()).toBe(new Date("2025-01-10").toISOString());

		const singleDoseResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}/vaccinations/${secondVaccineId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: { doses: [new Date("2024-01-10").toISOString()] },
		});
		expect(singleDoseResponse.statusCode).toBe(200);
		expect(singleDoseResponse.json().data.doses).toHaveLength(1);

		const emptyDosesResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}/vaccinations/${secondVaccineId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: { doses: [] },
		});
		expect(emptyDosesResponse.statusCode).toBe(400);

		const duplicateDoseResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}/vaccinations/${secondVaccineId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: { doses: [new Date("2024-01-10").toISOString(), new Date("2024-01-10").toISOString()] },
		});
		expect(duplicateDoseResponse.statusCode).toBe(400);
	});
});
