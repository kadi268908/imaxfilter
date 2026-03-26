import { InlineKeyboard } from "grammy";
import { isAdmin } from "../services/adminService.js";
import { connectGroup, listUserGroups, setActiveGroup } from "../services/groupService.js";
import { SUPPORT_USERNAME } from "../config.js";

/**
 * @param {import("grammy").Bot} bot
 */
export function registerConnectHandlers(bot) {
  bot.command("c", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }

    const arg = ctx.match?.trim();

    // Case 2: No argument → list groups
    if (!arg) {
      const groups = await listUserGroups(ctx.from.id);
      if (groups.length === 0) {
        return ctx.reply("No connected groups. Use /c <group_id> to connect one.");
      }
      const kb = new InlineKeyboard();
      for (const g of groups) {
        kb.text(g.title, `setgroup:${g.group_id}`).row();
      }
      return ctx.reply("📋 <b>Your connected groups:</b>\nSelect to set as active:", {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    }

    // Case 1: Argument → connect group
    if (!/^-?\d+$/.test(arg)) {
      return ctx.reply("❌ Invalid group ID. Example: /c -1001234567890");
    }

    const groupId = Number(arg);

    // Check user is admin of that group
    let member;
    try {
      member = await ctx.api.getChatMember(groupId, ctx.from.id);
    } catch {
      return ctx.reply("❌ Could not access that group. Make sure the bot is a member.");
    }

    if (!["administrator", "creator"].includes(member.status)) {
      return ctx.reply("❌ You are not an admin of that group.");
    }

    // Check bot is in the group
    try {
      const botMember = await ctx.api.getChatMember(groupId, ctx.me.id);
      if (!["administrator", "member"].includes(botMember.status)) {
        return ctx.reply("❌ Bot is not a member of that group. Add the bot first.");
      }
    } catch {
      return ctx.reply("❌ Bot is not in that group. Add the bot first.");
    }

    let title = String(groupId);
    try {
      const chat = await ctx.api.getChat(groupId);
      title = chat.title ?? title;
    } catch {}

    await connectGroup(ctx.from.id, groupId, title);
    await ctx.reply(
      `✅ Connected to <b>${title}</b> (<code>${groupId}</code>) and set as active group.`,
      { parse_mode: "HTML" }
    );
  });

  // Callback: set active group
  bot.callbackQuery(/^setgroup:(-?\d+)$/, async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.answerCallbackQuery({ text: "Access denied.", show_alert: true });
    }
    const groupId = Number(ctx.match[1]);
    const ok = await setActiveGroup(ctx.from.id, groupId);
    if (ok) {
      await ctx.editMessageText(`✅ Active group set to <code>${groupId}</code>`, {
        parse_mode: "HTML",
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.answerCallbackQuery({ text: "❌ Group not found in your list.", show_alert: true });
    }
  });
}
