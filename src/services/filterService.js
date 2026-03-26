import { getDB } from "../database/mongo.js";

export async function saveFilter(groupId, keyword, response) {
  const db = getDB();
  await db.collection("filters").updateOne(
    { group_id: groupId, keyword },
    { $set: { response } },
    { upsert: true }
  );
}

export async function deleteFilter(groupId, keyword) {
  const db = getDB();
  const result = await db.collection("filters").deleteOne({ group_id: groupId, keyword });
  return result.deletedCount > 0;
}

export async function deleteAllFilters(groupId) {
  const db = getDB();
  const result = await db.collection("filters").deleteMany({ group_id: groupId });
  return result.deletedCount;
}

export async function listFilters(groupId) {
  const db = getDB();
  const docs = await db
    .collection("filters")
    .find({ group_id: groupId }, { projection: { keyword: 1 } })
    .toArray();
  return docs.map((d) => d.keyword);
}

export async function findMatchingFilter(groupId, words) {
  const db = getDB();
  return db.collection("filters").findOne({ group_id: groupId, keyword: { $in: words } });
}
