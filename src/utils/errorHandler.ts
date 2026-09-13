import { FastifyReply } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 400,
        public errorCode?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode: number = 200) {
    return reply.code(statusCode).send({ success: true, data, error: null });
}

export function handleError(error: unknown, reply: FastifyReply) {
    // Erros de validação do Zod
    if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }));
        return reply.code(400).send({
            success: false,
            data: null,
            error: { message: "Erro de validação", details: formattedErrors },
        });
    }

    // Erros personalizados da aplicação
    if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
            success: false,
            data: null,
            error: { message: error.message, code: error.errorCode },
        });
    }

    // Erros conhecidos do próprio Fastify/plugins (rate-limit, payload/JSON malformado,
    // etc.) já vêm com um statusCode de cliente (4xx) e mensagem segura para expor.
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
        const message = error instanceof Error ? error.message : "Requisição inválida";
        return reply.code(statusCode).send({
            success: false,
            data: null,
            error: { message },
        });
    }

    // Erros genéricos/inesperados (driver do Mongo, TypeORM, etc.): nunca ecoar
    // error.message ao cliente, pois pode vazar detalhes internos de implementação,
    // e sempre como 500 — não é uma falha do cliente.
    console.error(error);
    return reply.code(500).send({
        success: false,
        data: null,
        error: { message: "Ocorreu um erro inesperado" },
    });
}