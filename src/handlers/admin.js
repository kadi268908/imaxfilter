import { SUPPORT_USERNAME } from "../config.js";
import {
  isAdmin,
  isSuperAdmin,
  addAdmin,
  removeAdmin,
  listAdmins,
} from "../services/adminService.js";

/**
 * @param {import("grammy").Bot} bot
 */
export function registerAdminHandlers(bot) {
  bot.command("start", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    await ctx.reply(
      `👋 <b>Welcome, Admin!</b>\n\n` +
        `<b>Commands:</b>\n` +
        `/c &lt;group_id&gt; — Connect a group\n` +
        `/c — List connected groups\n` +
        `/filter &lt;keyword&gt; — Add a filter\n` +
        `/del &lt;keyword&gt; — Delete a filter\n` +
        `/filters — List all filters\n` +
        `/delall — Delete all filters\n` +
        `/addadmin &lt;user_id&gt; — Add admin (super only)\n` +
        `/removeadmin &lt;user_id&gt; — Remove admin (super only)\n` +
        `/admins — List all admins`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("addadmin", async (ctx) => {
    if (!isSuperAdmin(ctx.from.id)) {
      return ctx.reply("⛔ Only super admins can use this command.");
    }
    const arg = ctx.match?.trim();
    if (!arg || !/^\d+$/.test(arg)) {
      return ctx.reply("Usage: /addadmin <user_id>");
    }
    const userId = Number(arg);
    await addAdmin(userId);
    await ctx.reply(`✅ Admin added: <code>${userId}</code>`, { parse_mode: "HTML" });
  });

  bot.command("removeadmin", async (ctx) => {
    if (!isSuperAdmin(ctx.from.id)) {
      return ctx.reply("⛔ Only super admins can use this command.");
    }
    const arg = ctx.match?.trim();
    if (!arg || !/^\d+$/.test(arg)) {
      return ctx.reply("Usage: /removeadmin <user_id>");
    }
    const userId = Number(arg);
    const removed = await removeAdmin(userId);
    if (removed) {
      await ctx.reply(`✅ Admin removed: <code>${userId}</code>`, { parse_mode: "HTML" });
    } else {
      await ctx.reply("❌ User was not an admin.");
    }
  });

  bot.command("admins", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(`If you need help contact ${SUPPORT_USERNAME}`);
    }
    const admins = await listAdmins();
    if (admins.length === 0) return ctx.reply("No admins found.");
    const lines = admins.map((id) => `• <code>${id}</code>`).join("\n");
    await ctx.reply(`👥 <b>Admins:</b>\n${lines}`, { parse_mode: "HTML" });
  });
}
