import { verifyToken } from "@utils/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import mongoose from "mongoose";

export const healthCheck = async (req: FastifyRequest, res: FastifyReply) => {
  return res.status(200).send({ message: "🎉 Metaverse API Healthcheck passed 🚀" });
};

export const dbHealthCheck = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const mongoOk = mongoose.connection.readyState === 1;
    if (!mongoOk) {
      return res.status(503).send({ message: "MongoDB disconnected" });
    }

    const ping = await mongoose.connection.db?.admin().ping();
    if (!ping || ping.ok !== 1) {
      return res.status(503).send({ message: "MongoDB ping invalid response" });
    }

    return res.status(200).send({ message: "MongoDB database server up and healthy" });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "MongoDB database ping failed" });
  }
};

export const authCheck = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const token = req.cookies["accessToken"];
    if (!token) return res.status(401).send({ message: "Token not found" });

    const decode = await verifyToken(token);
    if (!decode) return res.status(401).send({ message: "Invalid token" });

    const { username, avatar, id } = decode;
    return res.status(200).send({
      message: "User authentication success",
      payload: { username, avatar, id },
    });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "Error getting user data" });
  }
};
