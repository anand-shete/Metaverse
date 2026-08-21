import { Socket } from "socket.io";
import { verifyToken } from "@utils/jwt";

export const verifySocketUserMiddleware = async (
  socket: Socket,
  next: (
    err?:
      | {
          data?: unknown;
          name: string;
          message: string;
          stack?: string;
          cause?: unknown;
        }
      | undefined,
  ) => void,
) => {
  try {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      const error = new Error("Authentication error: No cookies found");
      return next(error);
    }

    const accessToken = Object.fromEntries(cookieHeader.split("; ").map(c => c.split("=")))[
      "accessToken"
    ];
    if (!accessToken) {
      const error = new Error("Authentication error: Missing access token");
      return next(error);
    }

    const decoded = await verifyToken(accessToken);
    if (!decoded) {
      const error = new Error("Authentication error: Invalid token");
      return next(error);
    }

    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error("Socket middleware errored", error);
    return next(new Error("Authentication error"));
  }
};
