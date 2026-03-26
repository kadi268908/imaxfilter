import { getDB } from "../database/mongo.js";
import { SUPER_ADMINS } from "../config.js";

export function isSuperAdmin(userId) {
  return SUPER_ADMINS.includes(userId);
}

export async function isAdmin(userId) {
  if (isSuperAdmin(userId)) return true;
  const db = getDB();
  const doc = await db.collection("admins").findOne({ user_id: userId });
  return !!doc;
}

export async function addAdmin(userId) {
  const db = getDB();
  await db
    .collection("admins")
    .updateOne({ user_id: userId }, { $set: { user_id: userId } }, { upsert: true });
}

export async function removeAdmin(userId) {
  const db = getDB();
  const result = await db.collection("admins").deleteOne({ user_id: userId });
  return result.deletedCount > 0;
}

export async function listAdmins() {
  const db = getDB();
  const docs = await db.collection("admins").find({}, { projection: { user_id: 1 } }).toArray();
  return docs.map((d) => d.user_id);
}
