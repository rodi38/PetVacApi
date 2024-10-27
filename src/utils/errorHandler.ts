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

export function handleError(error: unknown, reply: FastifyReply) {
    // Erros de validação do Zod
    if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }));
        return reply.code(400).send({ 
            error: 'Validation error', 
            details: formattedErrors 
        });
    }

    // Erros personalizados da aplicação
    if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ 
            error: error.message,
            code: error.errorCode 
        });
    }

    // Erros genéricos
    if (error instanceof Error) {
        // Log do erro para debugging
        console.error(error);
        
        return reply.code(400).send({ 
            error: error.message 
        });
    }

    // Erros desconhecidos
    console.error('Unknown error:', error);
    return reply.code(500).send({ 
        error: "An unexpected error occurred" 
    });
}