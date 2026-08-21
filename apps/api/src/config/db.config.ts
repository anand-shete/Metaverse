import mongoose from "mongoose";
import { env } from "./env.config";
import { FastifyInstance } from "fastify";

export const connectDB = async (fastify: FastifyInstance) => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      appName: "metaverse",
      minPoolSize: 2,
      maxPoolSize: 15,
    });
    fastify.log.info("MongoDB connected");
  } catch (error) {
    fastify.log.error(`MongoDB connection error ${error}`);
    process.exit(1);
  }
};
