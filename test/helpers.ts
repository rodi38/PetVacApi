import { FastifyInstance } from "fastify";

export const validPassword = "Sup3r$ecret";

export async function registerAndLogin(app: FastifyInstance, overrides: { username?: string; email?: string; password?: string } = {}) {
	const email = overrides.email ?? `${Math.random().toString(36).slice(2)}@example.com`;
	const username = overrides.username ?? `user_${Math.random().toString(36).slice(2, 10)}`;
	const password = overrides.password ?? validPassword;

	await app.inject({
		method: "POST",
		url: "/api/v1/auth/register",
		payload: { username, email, password },
	});

	const loginResponse = await app.inject({
		method: "POST",
		url: "/api/v1/auth/login",
		payload: { email, password },
	});

	const body = loginResponse.json();
	return {
		email,
		password,
		userId: body.data.user._id as string,
		token: body.data.token as string,
	};
}
