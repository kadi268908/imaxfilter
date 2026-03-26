import { getDB } from "../database/mongo.js";

export async function connectGroup(userId, groupId, title) {
  const db = getDB();
  await db.collection("user_groups").updateOne(
    { user_id: userId },
    {
      $addToSet: { groups: { group_id: groupId, title } },
      $set: { active_group: groupId },
    },
    { upsert: true }
  );
}

export async function setActiveGroup(userId, groupId) {
  const db = getDB();
  const doc = await db
    .collection("user_groups")
    .findOne({ user_id: userId, "groups.group_id": groupId });
  if (!doc) return false;
  await db
    .collection("user_groups")
    .updateOne({ user_id: userId }, { $set: { active_group: groupId } });
  return true;
}

export async function getActiveGroup(userId) {
  const db = getDB();
  const doc = await db.collection("user_groups").findOne({ user_id: userId });
  return doc?.active_group ?? null;
}

export async function listUserGroups(userId) {
  const db = getDB();
  const doc = await db.collection("user_groups").findOne({ user_id: userId });
  return doc?.groups ?? [];
}
