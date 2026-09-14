import { setupTestEnv, TestApp } from "./testApp";
import { registerAndLogin } from "./helpers";

describe("Checagem de posse (IDOR)", () => {
	let ctx: TestApp;

	beforeAll(async () => {
		ctx = await setupTestEnv();
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	async function createPet(token: string) {
		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Rex", petType: "dog", breed: "vira-lata", gender: "male", birthDate: new Date("2021-01-01").toISOString() },
		});
		return response.json().data._id as string;
	}

	it("um usuário não vê pets de outro em GET /pets", async () => {
		const userA = await registerAndLogin(ctx.app, { email: "dono-a@example.com" });
		const userB = await registerAndLogin(ctx.app, { email: "dono-b@example.com" });

		await createPet(userA.token);

		const response = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${userB.token}` },
		});

		expect(response.json().data.items).toHaveLength(0);
	});

	it("um usuário recebe 404 (não 403) ao buscar pet de outro pelo ID", async () => {
		const userA = await registerAndLogin(ctx.app, { email: "dono-c@example.com" });
		const userB = await registerAndLogin(ctx.app, { email: "dono-d@example.com" });

		const petId = await createPet(userA.token);

		const response = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${userB.token}` },
		});

		expect(response.statusCode).toBe(404);
	});

	it("um usuário não consegue editar nem apagar pet de outro", async () => {
		const userA = await registerAndLogin(ctx.app, { email: "dono-e@example.com" });
		const userB = await registerAndLogin(ctx.app, { email: "dono-f@example.com" });

		const petId = await createPet(userA.token);

		const updateResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${userB.token}` },
			payload: { name: "Nome trocado" },
		});
		expect(updateResponse.statusCode).toBe(404);

		const deleteResponse = await ctx.app.inject({
			method: "DELETE",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${userB.token}` },
		});
		expect(deleteResponse.statusCode).toBe(404);

		const stillThere = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}`,
			headers: { authorization: `Bearer ${userA.token}` },
		});
		expect(stillThere.statusCode).toBe(200);
	});

	it("ignora um 'owner' enviado no corpo da requisição ao criar pet", async () => {
		const userA = await registerAndLogin(ctx.app, { email: "dono-g@example.com" });
		const someoneElseId = "507f1f77bcf86cd799439011";

		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${userA.token}` },
			payload: { name: "Bidu", petType: "dog", breed: "poodle", gender: "male", birthDate: new Date("2022-06-15").toISOString(), owner: someoneElseId },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data.owner).toBe(userA.userId);
	});

	it("um usuário não acessa vacinação registrada no pet de outro", async () => {
		const userA = await registerAndLogin(ctx.app, { email: "dono-h@example.com" });
		const userB = await registerAndLogin(ctx.app, { email: "dono-i@example.com" });
		const petId = await createPet(userA.token);

		const response = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${petId}/vaccinations`,
			headers: { authorization: `Bearer ${userB.token}` },
		});

		// findByPet lança 404 via findOwnedPetOrThrow quando o pet não pertence ao chamador.
		expect(response.statusCode).toBe(404);
	});
});
