# postwire-mcp

**Let your AI agent post to social media.** An [MCP](https://modelcontextprotocol.io) server for [PostWire](https://postwire.io) — give Claude, Cursor, or any agent the ability to publish to **TikTok, Instagram, YouTube, X, LinkedIn, Bluesky, Telegram, Mastodon & Discord** with one tool call.

## Quick start

1. Get a free API key at **https://postwire.io/dashboard.html** and connect your accounts.
2. Add to your MCP client (e.g. Claude Desktop / Cursor):

```json
{
  "mcpServers": {
    "postwire": {
      "command": "npx",
      "args": ["-y", "postwire-mcp"],
      "env": { "POSTWIRE_API_KEY": "pw_live_your_key" }
    }
  }
}
```

Now your agent has two tools:

- **`post_to_social`** — `{ platforms: ["x","tiktok"], text, video_url?, photo_url? }`
- **`list_platforms`** — list supported networks.

## Why PostWire
One API + a real MCP server to post everywhere. Flat per-brand pricing (50 brands for $99 — vs Ayrshare's ~$779). Free tier, no card.

MIT © PostWire · https://postwire.io
