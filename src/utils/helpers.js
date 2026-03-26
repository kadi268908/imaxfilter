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
    kb.url(btn.text, btn.url).row();
  }
  return kb;
}
