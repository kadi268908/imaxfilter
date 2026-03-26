import { MongoClient } from "mongodb";
import { MONGO_URI, DB_NAME } from "../config.js";

let client;
let db;

export async function connectDB() {
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);

  // Ensure indexes
  await db.collection("filters").createIndex(
    { group_id: 1, keyword: 1 },
    { unique: true }
  );
  await db.collection("admins").createIndex({ user_id: 1 }, { unique: true });
  await db.collection("user_groups").createIndex({ user_id: 1 }, { unique: true });

  console.log("✅ MongoDB connected");
}

export async function closeDB() {
  if (client) await client.close();
  console.log("MongoDB connection closed");
}

export function getDB() {
  if (!db) throw new Error("DB not connected. Call connectDB() first.");
  return db;
}
