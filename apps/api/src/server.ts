import dotenv from "dotenv";
import { env, connectDB, envToLogger } from "@config/index.config";
dotenv.config({ path: env.NODE_ENV === "development" ? ".env" : ".env.production" });

import cors from "@fastify/cors";
import * as Routes from "@routes/index.routes";
import fastifyCookie from "@fastify/cookie";
import Formbody from "@fastify/formbody";
import { Server } from "socket.io";
import { initSockets } from "@sockets/init";
import Fastify from "fastify";

const fastify = Fastify({
  logger: envToLogger[env.NODE_ENV],
  disableRequestLogging: true,
});
const PORT = Number(env.PORT) || 3000;

const start = async () => {
  await connectDB(fastify);
  // TODO try to make peerjs connection ending instant
  // add system design diagram
  const io = new Server(fastify.server, {
    cors: {
      origin: [env.FRONTEND_URI1, env.FRONTEND_URI2],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Add to Fastify decorate, access using 'fastify.io'
  fastify.decorate("io", io);

  await fastify.register(cors, {
    origin: [env.FRONTEND_URI1, env.FRONTEND_URI2],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  });

  await fastify.register(Formbody);
  await fastify.register(fastifyCookie);

  await fastify.register(Routes.baseRoutes, { prefix: "/api/v1" });
  await fastify.register(Routes.userRoutes, { prefix: "/api/v1/user" });

  await initSockets(fastify);

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    fastify.log.info(`Server started on http://localhost:${PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
