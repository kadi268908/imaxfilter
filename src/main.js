import { Bot } from "grammy";
import { BOT_TOKEN } from "./config.js";
import { connectDB, closeDB } from "./database/mongo.js";
import { registerAdminHandlers } from "./handlers/admin.js";
import { registerConnectHandlers } from "./handlers/connect.js";
import { registerFilterHandlers } from "./handlers/filters.js";
import { registerMessageHandlers } from "./handlers/messages.js";

const bot = new Bot(BOT_TOKEN);

// Register all handlers
registerAdminHandlers(bot);
registerConnectHandlers(bot);
registerFilterHandlers(bot);
registerMessageHandlers(bot);

// Global error handler
bot.catch((err) => {
  console.error("Bot error:", err.message);
});

// Startup
async function start() {
  await connectDB();
  console.log("🤖 Bot starting (long polling)...");
  await bot.start({
    allowed_updates: ["message", "callback_query"],
    onStart: (info) => console.log(`✅ Bot @${info.username} is running`),
  });
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await bot.stop();
  await closeDB();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
