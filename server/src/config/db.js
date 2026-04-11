import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let memoryServer;

function isLocalMongoUri(uri) {
  return (
    uri.startsWith("mongodb://127.") ||
    uri.startsWith("mongodb://localhost") ||
    uri.includes("127.0.0.1") ||
    uri.includes("localhost")
  );
}

function isConnectionRefusedError(err) {
  return (
    err?.name === "MongooseServerSelectionError" ||
    err?.message?.includes("ECONNREFUSED") ||
    err?.cause?.code === "ECONNREFUSED"
  );
}

async function getMemoryServerUri() {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: "task_management",
      },
    });
  }

  return memoryServer.getUri();
}

export async function resolveMongoUri() {
  const configuredUri = process.env.MONGODB_URI?.trim();
  if (!configuredUri) {
    return getMemoryServerUri();
  }

  return configuredUri;
}

export async function connectDB() {
  const configuredUri = process.env.MONGODB_URI?.trim();
  const uri = configuredUri || (await getMemoryServerUri());

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(
      configuredUri ? "MongoDB connected" : "MongoDB connected using in-memory fallback"
    );
    return uri;
  } catch (err) {
    if (!configuredUri || (isLocalMongoUri(configuredUri) && isConnectionRefusedError(err))) {
      console.warn(
        "Configured local MongoDB is not available. Starting an in-memory MongoDB instance instead."
      );
      const fallbackUri = await getMemoryServerUri();
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
      process.env.MONGODB_URI = fallbackUri;
      console.log("MongoDB connected using in-memory fallback");
      return fallbackUri;
    }

    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
