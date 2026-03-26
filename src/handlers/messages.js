import { findMatchingFilter } from "../services/filterService.js";
import { buildInlineKeyboard, isRateLimited } from "../utils/helpers.js";

const WORD_RE = /[a-zA-Z0-9_]+/g;

/**
 * @param {import("grammy").Bot} bot
 */
export function registerMessageHandlers(bot) {
  bot.on("message", async (ctx, next) => {
    const chatType = ctx.chat?.type;
    if (chatType !== "group" && chatType !== "supergroup") return next();

    const content = (ctx.message.text ?? ctx.message.caption ?? "").toLowerCase();
    const words = content.match(WORD_RE);
    if (!words || words.length === 0) return next();

    const groupId = ctx.chat.id;
    const matched = await findMatchingFilter(groupId, words);
    if (!matched) return next();

    const userId = ctx.from?.id ?? 0;
    if (isRateLimited(userId)) return;

    const { type, text, file_id, buttons } = matched.response;
    const replyMarkup = buildInlineKeyboard(buttons);

    try {
      if (type === "sticker" && file_id) {
        await ctx.replyWithSticker(file_id);
      } else if (type === "photo" && file_id) {
        await ctx.replyWithPhoto(file_id, {
          caption: text || undefined,
          reply_markup: replyMarkup ?? undefined,
        });
      } else if (type === "text") {
        // If the admin saved only button lines (no extra message text),
        // `text` can be empty. Still send something so buttons show up.
        const body = text?.trim() ? text : "Choose an option:";
        await ctx.reply(body, {
          parse_mode: "HTML",
          reply_markup: replyMarkup ?? undefined,
        });
      }
    } catch (err) {
      console.error(`Failed to send filter response in group ${groupId}:`, err.message);
    }
  });
}
