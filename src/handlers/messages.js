import { findMatchingFilter } from "../services/filterService.js";
import { buildInlineKeyboard, isRateLimited } from "../utils/helpers.js";

const WORD_RE = /[a-zA-Z0-9_]+/g;

function looksLikeMarkdown(text) {
  // Simple heuristic: if user is using markdown-style links or emphasis.
  return (
    /\[[^\]]+]\((https?:\/\/|t\.me|www\.)/i.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /(^|[^*])\*[^*]+\*(?!\*)/.test(text)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeHref(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Converts a small subset of Markdown into Telegram-friendly HTML.
 * Supported:
 * - Links: [text](https://example.com)
 * - Bold: **text**
 * - Italic: *text*
 */
function renderMarkdownToHtml(text) {
  if (!text) return "";

  const linkRe = /\[([^\]]+)]\(([^)]+)\)/g;
  const boldRe = /\*\*([^*]+)\*\*/g;
  const italicRe = /(^|[^*])\*([^*]+)\*(?!\*)/g;

  const tokens = new Map(); // token -> html
  let tokenIndex = 0;

  const makeToken = (kind) => `__MD_${kind}_${tokenIndex++}__`;

  // 1) Markdown links
  let out = text.replace(linkRe, (full, label, url) => {
    const token = makeToken("LINK");
    const href = escapeHref(url.trim());
    const safeLabel = escapeHtml(label.trim());
    tokens.set(token, `<a href="${href}">${safeLabel}</a>`);
    return token;
  });

  // 2) Bold
  out = out.replace(boldRe, (full, label) => {
    const token = makeToken("B");
    tokens.set(token, `<b>${escapeHtml(String(label).trim())}</b>`);
    return token;
  });

  // 3) Italic
  out = out.replace(italicRe, (full, prefix, label) => {
    const token = makeToken("I");
    tokens.set(token, `${escapeHtml(String(prefix))}<i>${escapeHtml(String(label).trim())}</i>`);
    return token;
  });

  // 4) Escape remaining content, then restore tokens as HTML
  out = escapeHtml(out);
  for (const [token, html] of tokens.entries()) {
    out = out.split(token).join(html);
  }

  return out;
}

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
        const captionText = text ?? "";
        const renderedCaption = looksLikeMarkdown(captionText)
          ? renderMarkdownToHtml(captionText)
          : captionText;
        await ctx.replyWithPhoto(file_id, {
          caption: renderedCaption || undefined,
          parse_mode: "HTML",
          reply_markup: replyMarkup ?? undefined,
        });
      } else if (type === "text") {
        // If the admin saved only button lines (no extra message text),
        // `text` can be empty. Still send something so buttons show up.
        const body = text?.trim() ? text : "Choose an option:";
        const renderedBody = looksLikeMarkdown(body) ? renderMarkdownToHtml(body) : body;
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
