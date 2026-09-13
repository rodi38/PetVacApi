import pino from "pino";

// Logger compartilhado para código fora do ciclo de request (services, error handler),
// onde o `request.log`/`app.log` do Fastify não está disponível.
export const logger = pino({ level: process.env.LOG_LEVEL || "info" });
