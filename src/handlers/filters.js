import { isAdmin } from "../services/adminService.js";
import { getActiveGroup } from "../services/groupService.js";
import {
  saveFilter,
  deleteFilter,
  deleteAllFilters,
  listFilters,
} from "../services/filterService.js";
import { parseButtons } from "../utils/parser.js";
import { SUPPORT_USERNAME } from "../config.js";

// Simple FSM: userId -> { keyword, groupId }
const pendingFilter = new Map();

/**
 * @param {import("grammy").Bot} bot
 */
export function registerFilterHandlers(bot) {
  // /filter <keyword>
  bot.command("filter", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    const activeGroup = await getActiveGroup(ctx.from.id);
    if (!activeGroup) {
      return ctx.reply("❌ No active group. Use /c <group_id> to connect a group first.");
    }
    const keyword = ctx.match?.trim().toLowerCase();
    if (!keyword) {
      return ctx.reply("Usage: /filter <keyword>");
    }
    pendingFilter.set(ctx.from.id, { keyword, groupId: activeGroup });
    await ctx.reply(
      `📝 Now send the response for keyword: <code>${keyword}</code>\n` +
        `Accepted: text, photo, sticker (buttons syntax supported)`,
      { parse_mode: "HTML" }
    );
  });

  // /del <keyword>
  bot.command("del", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    const activeGroup = await getActiveGroup(ctx.from.id);
    if (!activeGroup) return ctx.reply("❌ No active group.");
    const keyword = ctx.match?.trim().toLowerCase();
    if (!keyword) return ctx.reply("Usage: /del <keyword>");
    const deleted = await deleteFilter(activeGroup, keyword);
    if (deleted) {
      await ctx.reply(`✅ Filter <code>${keyword}</code> deleted.`, { parse_mode: "HTML" });
    } else {
      await ctx.reply(`❌ Filter <code>${keyword}</code> not found.`, { parse_mode: "HTML" });
    }
  });

  // /filters
  bot.command("filters", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    const activeGroup = await getActiveGroup(ctx.from.id);
    if (!activeGroup) return ctx.reply("❌ No active group.");
    const keywords = await listFilters(activeGroup);
    if (keywords.length === 0) return ctx.reply("No filters found for this group.");
    const lines = keywords
      .sort()
      .map((kw) => `• <code>${kw}</code>`)
      .join("\n");
    await ctx.reply(`📋 <b>Filters for group <code>${activeGroup}</code>:</b>\n${lines}`, {
      parse_mode: "HTML",
    });
  });

  // /delall
  bot.command("delall", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    const activeGroup = await getActiveGroup(ctx.from.id);
    if (!activeGroup) return ctx.reply("❌ No active group.");
    const count = await deleteAllFilters(activeGroup);
    await ctx.reply(
      `🗑 Deleted <b>${count}</b> filter(s) from group <code>${activeGroup}</code>.`,
      { parse_mode: "HTML" }
    );
  });

  // Catch-all for pending filter responses (private chat only)
  bot.on("message", async (ctx, next) => {
    // Only handle private chats for filter input
    if (ctx.chat.type !== "private") return next();
    if (!pendingFilter.has(ctx.from.id)) return next();

    const { keyword, groupId } = pendingFilter.get(ctx.from.id);
    pendingFilter.delete(ctx.from.id);

    let response;

    if (ctx.message.sticker) {
      response = {
        type: "sticker",
        file_id: ctx.message.sticker.file_id,
        text: "",
        buttons: [],
      };
    } else if (ctx.message.photo) {
      const fileId = ctx.message.photo.at(-1).file_id;
      const caption = ctx.message.caption ?? "";
      const { cleanText, buttons } = parseButtons(caption);
      response = { type: "photo", file_id: fileId, text: cleanText, buttons };
    } else if (ctx.message.text) {
      const { cleanText, buttons } = parseButtons(ctx.message.text);
      if (!cleanText && buttons.length === 0) {
        return ctx.reply("❌ Empty response. Filter not saved.");
      }
      response = { type: "text", file_id: "", text: cleanText, buttons };
    } else {
      return ctx.reply("❌ Unsupported message type. Send text, photo, or sticker.");
    }

    await saveFilter(groupId, keyword, response);
    await ctx.reply(
      `✅ Filter saved!\nGroup: <code>${groupId}</code>\nKeyword: <code>${keyword}</code>`,
      { parse_mode: "HTML" }
    );
  });
}
