import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getDb, isMongoConnected } from "../config/mongo";

const indexRouter = async (fastify: FastifyInstance) => {
	fastify.route({
		method: "GET",
		url: "/healthcheck",
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			if (!isMongoConnected()) {
				return res.status(503).send({ success: false, data: null, error: { message: "Banco de dados indisponível" } });
			}

			try {
				await getDb().command({ ping: 1 });
				return res.status(200).send({ success: true, data: { status: "OK" }, error: null });
			} catch {
				return res.status(503).send({ success: false, data: null, error: { message: "Banco de dados indisponível" } });
			}
		},
	});
};

export { indexRouter };
