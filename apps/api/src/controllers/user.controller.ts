import { FastifyRequest, FastifyReply } from "fastify";
import { UserModel } from "@models/user.model";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3client, env } from "@config/index.config";
import { generateToken, setToken } from "@utils/jwt";
import {
  LoginSchema,
  SignupSchema,
  UpdateAvatarSchema,
  UploadFileSchema,
} from "@metaverse/shared/schema";
import { MAX_FILE_SIZE } from "@metaverse/shared/enum";

export const signupUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const parsedData = SignupSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).send({ message: "Parsing failed" });
    const { username, email, password } = parsedData.data;

    const check = await UserModel.countDocuments({ email });
    if (check) {
      return res.status(409).send({ message: "Account aldready exists" });
    }

    const checkUsername = await UserModel.countDocuments({ username });
    if (checkUsername) {
      return res.status(409).send({ message: "Username already taken" });
    }

    const user = await UserModel.create({
      email: email,
      username: username,
      password: password,
    });

    return res.status(201).send({ message: "Account created successfully", userId: user._id });
  } catch (error: unknown) {
    req.log.error(error);
    return res.status(500).send({ message: "Failed to Create Account" });
  }
};

export const loginUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const parsedData = LoginSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).send({ message: "Parsing failed" });
    const { email, password } = parsedData.data;

    const user = await UserModel.findOne({ email }).lean();
    if (!user) return res.status(404).send({ message: "Account does not exists" });

    const isValid = await UserModel.comparePassword(password, user.password);
    if (!isValid) return res.status(401).send({ message: "Incorrect Password Entered" });

    const accessToken = await generateToken(user);
    if (!accessToken) return res.status(500).send({ message: "Error generating token" });

    await setToken(res, accessToken);
    return res.status(200).send({ token: accessToken, message: "User Login success" });
  } catch (error: unknown) {
    req.log.error(error);
    return res.status(500).send({ message: "Failed to Sign In User" });
  }
};

export const logoutUser = (_: FastifyRequest, res: FastifyReply) => {
  res.clearCookie("accessToken").send({ message: "Logout successful", user: null });
};

export const updateUserAvatar = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const parsedData = UpdateAvatarSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).send({ message: "Zod parsing failed" });
    }
    const { avatar, userId } = parsedData.data;

    const user = await UserModel.countDocuments({ _id: userId });
    if (!user) return res.status(404).send({ message: "User not found" });

    await UserModel.updateOne({ _id: userId }, { avatar });

    return res.status(200).send({ message: "Account created successfully" });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "Error updating avatar" });
  }
};

export const getAllArchives = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: env.AWS_BUCKET_NAME,
      Prefix: "notes/",
      StartAfter: "notes/",
    });

    const result = await s3client.send(command);
    return res.status(200).send(result.Contents);
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "Error fetching archives" });
  }
};
// select binary body (Postman) for testing
export const generatePutObjectSignedUrl = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const parsedData = UploadFileSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).send({ message: "Validation failed" });
    }
    const { contentType, fileName, fileSize } = parsedData.data;

    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).send({ message: "File size cannot be larger than 20MB" });
    }

    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: `notes/${fileName}`,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3client, command);
    return res.status(200).send({ message: "Generated upload URL", signedUrl });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({ message: "Error generating upload URL" });
  }
};
