import { setupTestEnv, TestApp } from "./testApp";
import { validPassword, registerAndLogin } from "./helpers";

describe("Autenticação", () => {
	let ctx: TestApp;

	beforeAll(async () => {
		ctx = await setupTestEnv();
	}, 60000);

	afterAll(async () => {
		await ctx.teardown();
	});

	it("registra um novo usuário com senha válida", async () => {
		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/register",
			payload: { username: "novo_usuario", email: "novo@example.com", password: validPassword },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.success).toBe(true);
		expect(body.data.email).toBe("novo@example.com");
		expect(body.data.password).toBeUndefined();
	});

	it("rejeita senha fraca no registro", async () => {
		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/register",
			payload: { username: "senha_fraca", email: "fraca@example.com", password: "123456" },
		});

		expect(response.statusCode).toBe(400);
		const body = response.json();
		expect(body.success).toBe(false);
		expect(Array.isArray(body.error.details)).toBe(true);
	});

	it("rejeita cadastro com e-mail já usado", async () => {
		await registerAndLogin(ctx.app, { email: "duplicado@example.com" });

		const response = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/register",
			payload: { username: "outro_usuario", email: "duplicado@example.com", password: validPassword },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.message).toMatch(/já existe/i);
	});

	it("autentica com credenciais corretas e rejeita senha errada", async () => {
		const { email } = await registerAndLogin(ctx.app, { email: "login@example.com" });

		const wrongLogin = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: { email, password: "senhaErrada123!" },
		});
		expect(wrongLogin.statusCode).toBe(401);

		const rightLogin = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: { email, password: validPassword },
		});
		expect(rightLogin.statusCode).toBe(200);
		expect(rightLogin.json().data.token).toBeDefined();
	});

	it("bloqueia rota protegida sem token", async () => {
		const response = await ctx.app.inject({ method: "GET", url: "/api/v1/pets" });
		expect(response.statusCode).toBe(401);
	});

	it("bloqueia rota protegida com token inválido", async () => {
		const response = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets",
			headers: { authorization: "Bearer token-invalido" },
		});
		expect(response.statusCode).toBe(401);
	});

	it("aceita rota protegida com token válido", async () => {
		const { token } = await registerAndLogin(ctx.app, { email: "valido@example.com" });

		const response = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
		});
		expect(response.statusCode).toBe(200);
	});

	it("invalida o token antigo depois de trocar a senha", async () => {
		const { token, userId, email } = await registerAndLogin(ctx.app, { email: "trocasenha@example.com" });

		const updateResponse = await ctx.app.inject({
			method: "PUT",
			url: `/api/v1/auth/users/${userId}`,
			headers: { authorization: `Bearer ${token}` },
			payload: { currentPassword: validPassword, newPassword: "NovaSenha$9" },
		});
		expect(updateResponse.statusCode).toBe(200);

		const withOldToken = await ctx.app.inject({
			method: "GET",
			url: "/api/v1/pets",
			headers: { authorization: `Bearer ${token}` },
		});
		expect(withOldToken.statusCode).toBe(401);

		const newLogin = await ctx.app.inject({
			method: "POST",
			url: "/api/v1/auth/login",
			payload: { email, password: "NovaSenha$9" },
		});
		expect(newLogin.statusCode).toBe(200);
	});
});
