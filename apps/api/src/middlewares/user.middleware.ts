import { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "@utils/jwt";

export const userHook = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const token = req.cookies["accessToken"];
    if (!token) {
      return res.status(401).send({ message: "Token not found" });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).send({ message: "Invalid token" });
    }

    req.user = user;
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "Error getting user data" });
  }
};
