## Telegram Filter Bot (Node.js + grammY + MongoDB)

A Telegram bot that lets admins connect a group and define **keyword → auto-reply** filters. Filters can respond with **text**, **photo**, or **sticker**, and can include **inline buttons**.

## Features

- **Per-group filters**: store filters per Telegram group (`group_id`)
- **Admin gated**: only configured admins can manage filters
- **Group connection**: admins connect a group and set it as “active”
- **Response types**: text / photo / sticker
- **Inline buttons**: simple markup parser for button definitions
- **MongoDB storage**: filters, admins, and user-group connections persisted in MongoDB

## Requirements

- **Node.js**: 18+ recommended (works with newer versions too)
- **MongoDB**:
  - Local MongoDB (e.g. `mongodb://localhost:27017`), or
  - MongoDB Atlas (recommended for production)

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` (copy from `.env.example`):

```bash
copy .env.example .env
```

Then fill in `.env`:

```env
BOT_TOKEN=your_telegram_bot_token
MONGO_URI=mongodb://localhost:27017
DB_NAME=telegram_filter_bot
SUPER_ADMINS=123456789,987654321
```

### Notes about `MONGO_URI` (Atlas + Windows DNS)

If you see errors like `querySrv ECONNREFUSED _mongodb._tcp...`, your network/DNS may be blocking SRV lookups.

- Prefer the **Standard connection string** (`mongodb://...`) from Atlas instead of `mongodb+srv://...`
- Ensure Atlas **Network Access** allows your IP

## Run

### Local (foreground)

```bash
npm start
```

### Dev (auto-reload)

```bash
npm run dev
```

## Run with PM2 (recommended for production)

This repo includes a PM2 config for projects using ESM (`"type": "module"`):

- Use `ecosystem.config.cjs`

Start:

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs telegram-filter-bot
```

Update env and restart:

```bash
pm2 restart telegram-filter-bot --update-env
```

Persist process list (optional):

```bash
pm2 save
```

## Bot commands

These commands are intended for the bot’s **private chat** (admin panel):

- **`/start`**: show admin commands (admins only)
- **`/c <group_id>`**: connect a group and set as active (you must be an admin of that group)
- **`/c`**: list your connected groups and select active group
- **`/filter <keyword>`**: add/update a filter for the active group  
  After running the command, send the response message (text/photo/sticker) in private chat.
- **`/del <keyword>`**: delete a filter from the active group
- **`/filters`**: list filters for the active group
- **`/delall`**: delete all filters for the active group
- **`/addadmin <user_id>`**: add an admin (**super admins only**)
- **`/removeadmin <user_id>`**: remove an admin (**super admins only**)
- **`/admins`**: list admins

### How to get a `group_id`

Supergroups typically look like `-1001234567890`. You can:

- Add the bot to the group, then
- Use any “get chat id” bot or a small script to print `ctx.chat.id`, then
- Connect with `/c -100...` in private chat

## Inline button syntax

When creating a filter response (text or photo caption), you can add button lines like:

```
[Google](buttonurl#primary://https://google.com)
[Support](buttonurl#danger://https://t.me/your_support)
```

Supported colors: `primary`, `success`, `danger`.

Note: Telegram inline keyboard buttons **cannot be rendered with custom colors** via the Bot API. The `#primary/#success/#danger` tag is accepted by this bot’s parser, but it does not change the button’s UI color in Telegram.

## Data model (MongoDB collections)

- **`filters`**: `{ group_id, keyword, response: { type, text, file_id, buttons } }`
- **`admins`**: admin user IDs
- **`user_groups`**: per-user connected groups + active group

## Security

- Never commit `.env` (already ignored via `.gitignore`)
- If you ever paste tokens/passwords in chat or logs, **rotate them immediately**

