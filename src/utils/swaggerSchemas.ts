// src/utils/swaggerSchemas.ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Converte um schema Zod para JSON Schema usado apenas pela documentação do Swagger.
// additionalProperties: true evita que o serializer de resposta do Fastify
// remova campos não listados (a validação/parse "de verdade" continua sendo feita pelo Zod nos controllers).
export function toSwaggerSchema(schema: z.ZodTypeAny) {
	const jsonSchema = zodToJsonSchema(schema as any, { target: "jsonSchema7", $refStrategy: "none" }) as Record<string, unknown>;
	delete jsonSchema.$schema;
	if (jsonSchema.type === "object") {
		jsonSchema.additionalProperties = true;
	}
	return jsonSchema;
}

// Schemas de resposta usados só pela documentação do Swagger, refletindo o
// envelope { success, data, error } que toda rota da API de fato retorna.
export const errorEnvelopeSchema = {
	type: "object",
	properties: {
		success: { type: "boolean", enum: [false] },
		data: { type: "null" },
		error: {
			type: "object",
			properties: {
				message: { type: "string" },
				code: { type: "string" },
				details: {
					type: "array",
					items: {
						type: "object",
						properties: {
							field: { type: "string" },
							message: { type: "string" },
						},
					},
				},
			},
			required: ["message"],
		},
	},
};

export function successEnvelopeSchema(data: Record<string, unknown> = {}) {
	return {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [true] },
			data,
			error: { type: "null" },
		},
	};
}

export function objectIdParam(name: string, description: string) {
	return objectIdParams([{ name, description }]);
}

export function objectIdParams(params: { name: string; description: string }[]) {
	return {
		type: "object",
		properties: Object.fromEntries(params.map(({ name, description }) => [name, { type: "string", pattern: "^[0-9a-fA-F]{24}$", description }])),
		required: params.map(({ name }) => name),
	};
}
