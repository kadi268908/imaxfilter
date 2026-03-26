import "dotenv/config";

export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
export const DB_NAME = process.env.DB_NAME || "telegram_filter_bot";
export const SUPPORT_USERNAME = "@ImaxSupport1Bot";

export const SUPER_ADMINS = (process.env.SUPER_ADMINS || "")
  .split(",")
  .map((id) => id.trim())
  .filter((id) => /^\d+$/.test(id))
  .map(Number);

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set in .env");
  process.exit(1);
}
