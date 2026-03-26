import { InlineKeyboard } from "grammy";

// Simple in-memory rate limiter
const cooldowns = new Map();
const COOLDOWN_MS = 2000;

/**
 * @param {number} userId
 * @returns {boolean}
 */
export function isRateLimited(userId) {
  const now = Date.now();
  const last = cooldowns.get(userId) ?? 0;
  if (now - last < COOLDOWN_MS) return true;
  cooldowns.set(userId, now);
  return false;
}

/**
 * @param {Array<{text: string, url: string}>} buttons
 * @returns {InlineKeyboard|null}
 */
export function buildInlineKeyboard(buttons) {
  if (!buttons || buttons.length === 0) return null;
  const kb = new InlineKeyboard();
  for (const btn of buttons) {
    const url = String(btn.url ?? "").trim();
    // Telegram requires valid URLs with a scheme (http/https). Normalize common short links.
    const normalizedUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url) ? url : `https://${url}`;
    kb.url(String(btn.text ?? ""), normalizedUrl).row();
  }
  return kb;
}
