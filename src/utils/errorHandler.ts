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
            error: { message: "Validation error", details: formattedErrors },
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

    // Erros genéricos
    if (error instanceof Error) {
        // Log do erro para debugging
        console.error(error);

        return reply.code(400).send({
            success: false,
            data: null,
            error: { message: error.message },
        });
    }

    // Erros desconhecidos
    console.error('Unknown error:', error);
    return reply.code(500).send({
        success: false,
        data: null,
        error: { message: "An unexpected error occurred" },
    });
}