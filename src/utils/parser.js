// Parses button definitions from message text:
// Simple syntax:
// [Button Text](buttonurl://URL)
// Colored-tag syntax (color is currently not used for UI):
// [Button Text](buttonurl#color://URL)

// Groups:
// 1) button text
// 2) optional color tag (e.g. primary/success/danger)
// 3) url
const BUTTON_REGEX = /\[([^\]]+)\]\(buttonurl(?:#(\w+))?:\/\/([^)]+)\)/g;

const COLOR_EMOJI = {
  success: "🟢",
  danger: "🔴",
  primary: "🔵",
};

/**
 * @param {string} text
 * @returns {{ cleanText: string, buttons: Array<{text: string, url: string, color: string}> }}
 */
export function parseButtons(text) {
  const buttons = [];
  const cleanLines = [];

  const hasScheme = (value) => /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value);

  for (const line of text.split("\n")) {
    BUTTON_REGEX.lastIndex = 0;
    let hasButton = false;
    let match;
    while ((match = BUTTON_REGEX.exec(line)) !== null) {
      hasButton = true;
      const [, btnText, color, rawUrl] = match;
      let url = rawUrl.trim();

      // Allow using `t.me/...` without `https://`
      if (!hasScheme(url)) url = `https://${url}`;

      buttons.push({
        // Telegram inline keyboard buttons don't support true colors.
        // Keep text clean; we still parse `color` for potential future use.
        text: btnText.trim(),
        url,
        color: (color ?? "").toLowerCase(),
      });
    }
    if (!hasButton) cleanLines.push(line);
  }

  return {
    cleanText: cleanLines.join("\n").trim(),
    buttons,
  };
}
