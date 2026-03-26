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
    const match = BUTTON_REGEX.exec(line);
    if (match) {
      const [, btnText, color, url] = match;
      const emoji = COLOR_EMOJI[color.toLowerCase()] ?? "🔵";
      buttons.push({
        text: `${emoji} ${btnText.trim()}`,
        url: url.trim(),
        color: color.toLowerCase(),
      });
    } else {
      cleanLines.push(line);
    }
  }

  return {
    cleanText: cleanLines.join("\n").trim(),
    buttons,
  };
}
