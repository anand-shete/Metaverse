import "dotenv/config";
import { z } from "zod/v4";

const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production"]),
  MONGO_URI: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URI1: z.string(),
  FRONTEND_URI2: z.string(),
  GROQ_API_KEY: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
});

const validate = envSchema.safeParse(process.env);

if (!validate.success) {
  console.error("Error parsing env variables", JSON.parse(validate.error.message));
  process.exit(1);
}

export const env = validate.data;
