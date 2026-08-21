import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { env } from "../config/env.config";
import { CustomJwtPayload } from "./interface";
import { FastifyReply } from "fastify";

export const generateToken = async (user: User): Promise<string> => {
  const payload: CustomJwtPayload = {
    id: user._id,
    username: user.username,
    avatar: user.avatar,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = async (token: string): Promise<CustomJwtPayload | undefined> => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as CustomJwtPayload;
  } catch (error) {
    console.error("Error verifying token", error);
    return;
  }
};

export const setToken = async (res: FastifyReply, token: string) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    path: "/",
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24, // @fastify/cookie uses maxAge in seconds instead of ms
  });
};
