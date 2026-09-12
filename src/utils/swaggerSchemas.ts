// src/utils/swaggerSchemas.ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Converte um schema Zod para JSON Schema usado apenas pela documentação do Swagger.
// additionalProperties: true evita que o serializer de resposta do Fastify
// remova campos não listados (a validação/parse "de verdade" continua sendo feita pelo Zod nos controllers).
export function toSwaggerSchema(schema: z.ZodTypeAny) {
	const jsonSchema = zodToJsonSchema(schema, { target: "jsonSchema7", $refStrategy: "none" }) as Record<string, unknown>;
	delete jsonSchema.$schema;
	if (jsonSchema.type === "object") {
		jsonSchema.additionalProperties = true;
	}
	return jsonSchema;
}

export function objectIdParam(name: string, description: string) {
	return {
		type: "object",
		properties: {
			[name]: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description },
		},
		required: [name],
	};
}
