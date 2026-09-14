import { setupTestEnv, TestApp } from "./testApp";
import { registerAndLogin } from "./helpers";

describe("Paginação", () => {
	let ctx: TestApp;

	beforeAll(async () => {
		ctx = await setupTestEnv();
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	it("pagina a listagem de pets do dono", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "paginacao@example.com" });

		for (let i = 0; i < 5; i++) {
			await ctx.app.inject({
				method: "POST",
				url: "/api/v1/pets",
				headers: { authorization: `Bearer ${token}` },
				payload: { name: `Pet ${i}`, petType: "dog", breed: "vira-lata", gender: "male", birthDate: new Date("2020-01-01").toISOString() },
			});
		}

		const firstPage = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets?page=1&limit=2",
			headers: { authorization: `Bearer ${token}` },
		});
		const firstBody = firstPage.json().data;
		expect(firstBody.items).toHaveLength(2);
		expect(firstBody.total).toBe(5);
		expect(firstBody.totalPages).toBe(3);
		expect(firstBody.page).toBe(1);

		const secondPage = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets?page=2&limit=2",
			headers: { authorization: `Bearer ${token}` },
		});
		const secondBody = secondPage.json().data;
		expect(secondBody.items).toHaveLength(2);

		const firstIds = firstBody.items.map((p: { _id: string }) => p._id);
		const secondIds = secondBody.items.map((p: { _id: string }) => p._id);
		expect(firstIds).not.toEqual(secondIds);
	});

	it("usa page=1 e limit=20 como padrão quando nada é informado", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "paginacao-default@example.com" });

		const response = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/vaccines",
			headers: { authorization: `Bearer ${token}` },
		});

		const body = response.json().data;
		expect(body.page).toBe(1);
		expect(body.limit).toBe(20);
	});

	it("rejeita limit acima de 100", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "paginacao-limite@example.com" });

		const response = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets?limit=500",
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
	});
});
