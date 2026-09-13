import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppDataSource } from "../config/typeorm";

const indexRouter = async (fastify: FastifyInstance) => {
	fastify.route({
		method: "GET",
		url: "/healthcheck",
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			if (!AppDataSource.isInitialized) {
				return res.status(503).send({ success: false, data: null, error: { message: "Banco de dados indisponível" } });
			}

			try {
				await AppDataSource.mongoManager.mongoQueryRunner.databaseConnection.db(AppDataSource.options.database as string).command({ ping: 1 });
				return res.status(200).send({ success: true, data: { status: "OK" }, error: null });
			} catch {
				return res.status(503).send({ success: false, data: null, error: { message: "Banco de dados indisponível" } });
			}
		},
	});
};

export { indexRouter };
