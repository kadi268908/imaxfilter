// Parses button definitions from message text:
// [Button Text](buttonurl#color://URL)

const BUTTON_REGEX = /\[([^\]]+)\]\(buttonurl#(\w+):\/\/([^)]+)\)/g;

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

  for (const line of text.split("\n")) {
    BUTTON_REGEX.lastIndex = 0;
    let hasButton = false;
    let match;
    while ((match = BUTTON_REGEX.exec(line)) !== null) {
      hasButton = true;
      const [, btnText, color, url] = match;
      buttons.push({
        // Telegram inline keyboard buttons don't support true colors.
        // Keep text clean; we still parse `color` for potential future use.
        text: btnText.trim(),
        url: url.trim(),
        color: color.toLowerCase(),
      });
    }
    if (!hasButton) cleanLines.push(line);
  }

  return {
    cleanText: cleanLines.join("\n").trim(),
    buttons,
  };
}
