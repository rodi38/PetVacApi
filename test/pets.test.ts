import { setupTestEnv, TestApp } from "./testApp";
import { registerAndLogin } from "./helpers";

describe("Idade do pet (derivada de birthDate)", () => {
	let ctx: TestApp;

	beforeAll(async () => {
		ctx = await setupTestEnv();
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	it("calcula a idade a partir da data de nascimento em vez de armazenar um número fixo", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "idade@example.com" });

		const today = new Date();
		const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate() - 1);

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Thor", petType: "dog", breed: "labrador", gender: "male", birthDate: fiveYearsAgo.toISOString() },
		});

		expect(createResponse.statusCode).toBe(201);
		const created = createResponse.json().data;
		expect(created.age).toBe(5);
		expect(created.birthDate).toBeDefined();

		const getResponse = await ctx.app.inject({
			method: "GET",
			url: `/api/v1/pets/${created._id}`,
			headers: { authorization: `Bearer ${token}` },
		});
		expect(getResponse.json().data.age).toBe(5);
	});

	it("informa a idade em meses quando o pet tem menos de 1 ano", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "filhote-meses@example.com" });

		const today = new Date();
		const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Bidu", petType: "dog", breed: "poodle", gender: "male", birthDate: threeMonthsAgo.toISOString() },
		});

		expect(createResponse.statusCode).toBe(201);
		const created = createResponse.json().data;
		expect(created.age).toBe(0);
		expect(created.ageDetail).toEqual({ unit: "months", value: 3 });
	});

	it("informa a idade em semanas quando o pet tem menos de 1 mês", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "filhote-semanas@example.com" });

		const today = new Date();
		const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Mel", petType: "cat", breed: "vira-lata", gender: "female", birthDate: twoWeeksAgo.toISOString() },
		});

		expect(createResponse.statusCode).toBe(201);
		const created = createResponse.json().data;
		expect(created.age).toBe(0);
		expect(created.ageDetail).toEqual({ unit: "weeks", value: 2 });
	});

	it("não informa ageDetail quando o pet tem 1 ano ou mais", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "adulto@example.com" });

		const today = new Date();
		const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate() - 1);

		const createResponse = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Rex", petType: "dog", breed: "vira-lata", gender: "male", birthDate: fiveYearsAgo.toISOString() },
		});

		expect(createResponse.statusCode).toBe(201);
		expect(createResponse.json().data.ageDetail).toBeNull();
	});

	it("rejeita data de nascimento no futuro", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "futuro@example.com" });

		const nextYear = new Date();
		nextYear.setFullYear(nextYear.getFullYear() + 1);

		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
			payload: { name: "Nino", petType: "cat", breed: "siamês", gender: "female", birthDate: nextYear.toISOString() },
		});

		expect(response.statusCode).toBe(400);
	});
});
