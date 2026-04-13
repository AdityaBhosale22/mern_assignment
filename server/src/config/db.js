import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let memoryServer;

async function fixLegacyUserIndexes() {
  const usersCollection = mongoose.connection.collection("users");

  try {
    const indexes = await usersCollection.indexes();
    const legacyUsernameIndex = indexes.find(
      (idx) => idx?.name === "username_1" || idx?.key?.username === 1
    );

    if (legacyUsernameIndex) {
      await usersCollection.dropIndex(legacyUsernameIndex.name);
      console.log(`Dropped legacy MongoDB index: ${legacyUsernameIndex.name}`);
    }
  } catch (err) {
    // Ignore missing namespace errors when the collection has not been created yet.
    if (err?.codeName !== "NamespaceNotFound" && err?.code !== 26) {
      throw err;
    }
  }

  // Ensure current schema indexes are aligned (for example, unique email index).
  await User.syncIndexes();
}

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
    await fixLegacyUserIndexes();
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
      await fixLegacyUserIndexes();
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
