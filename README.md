# postwire-mcp

**Your agent writes the post, picks the right shape for each network, and publishes it.**

An [MCP](https://modelcontextprotocol.io) server for [PostWire](https://postwire.io/?utm_source=github&utm_medium=readme&utm_campaign=postwire_mcp). Give Claude, Cursor, or any agent one idea and it publishes a *native* post to TikTok, Instagram, Facebook Pages, YouTube, LinkedIn, Bluesky, Mastodon, Telegram and Discord — not the same text pasted nine times. (X and Reddit are **not** available yet.)

```
you:    "post the demo video — we shipped scheduling today"
agent:  → YouTube  title + description + tags, 16:9
        → TikTok   hook in the first line, 4 tags
        → LinkedIn no link in the body, link in the first comment
        → Bluesky  under 300 characters, link as a card
        published. 4/4.
```

## Hosted (no install)

PostWire also runs as a remote MCP server at `https://postwire.io/api/mcp` (Streamable HTTP, OAuth 2.1 sign-in or `Authorization: Bearer pw_live_…`), with 15 tools including `plan_week`, `schedule_post` and `create_upload_link`.

- **Claude**: listed in Claude's connector directory — [add PostWire to Claude](https://claude.ai/directory/bc01e7da-eba7-4754-9e88-6cacae80f000), or paste the URL as a custom connector.
- **Claude Code**: `claude mcp add --transport http postwire https://postwire.io/api/mcp`
- Official MCP Registry: `io.github.Perufitlife/postwire-mcp`.

## Quick start (local, npm)

1. Get a free API key at **[postwire.io/dashboard.html](https://postwire.io/dashboard.html?utm_source=github&utm_medium=readme&utm_campaign=quickstart)** and connect an account. One OAuth click — PostWire already holds the platform approvals, so there is no app review to wait for.
2. Add it to your MCP client:

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

Client-specific setup: [Claude Desktop](https://postwire.io/mcp/claude-desktop/) · [Claude Code](https://postwire.io/mcp/claude-code/) · [Cursor](https://postwire.io/mcp/cursor/) · [VS Code](https://postwire.io/mcp/vscode/) · [Windsurf](https://postwire.io/mcp/windsurf/)

No key yet? `list_platforms` still answers, so you can see what is supported before signing up.

## Tools

| Tool | What it does |
|---|---|
| `generate_posts` | **Smart Distribute.** One prompt → a draft written for each platform: character limits, hashtag conventions, YouTube SEO title+tags, hook-first captions for TikTok, link-in-comment for LinkedIn. Returns drafts for you to review. |
| `post_to_social` | Publishes. Takes one text for all, or `per_platform` drafts from `generate_posts`. |
| `get_post_status` | Publish state for platforms that report one back (TikTok and YouTube process asynchronously). |
| `list_platforms` | Every supported network and the fields it needs. Works without a key. |
| `my_account` | Plan, posts used this month, which accounts are connected. |

Failures are refused up front rather than half-published: a video network with no video, text over a platform's limit, or an account that was never connected all come back as a clear error *before* anything goes out. A four-network post never leaves you with two live and two silently missing.

## Platforms

**One OAuth click** — TikTok · Instagram · Facebook Pages · YouTube · LinkedIn (personal profiles)
**Token or webhook** — Bluesky · Mastodon · Telegram · Discord
**Not available yet** — X · Reddit

You connect your accounts to PostWire's already-approved apps (TikTok Direct Post audit, Meta App Review, Google verification of `youtube.upload`), so you never need your own developer app.

## Pricing

Per **brand**, never per network. Connect a business once and every one of its accounts is included.

| | Brands | Posts/month | |
|---|---|---|---|
| **Free** | 1 | 30 | no card |
| **Starter** | 3 | 300 | $9/mo |
| **Pro** | 10 | 2,000 | $29/mo |
| **Agency** | 50 | 15,000 | $99/mo |
| **Scale** | 200 | unlimited | $299/mo |

A post counts once per network. Ten client businesses on five networks each is **$29 here**; Buffer bills per channel. Paid plans have a 14-day refund. Current prices: [postwire.io/pricing](https://postwire.io/pricing/?utm_source=github&utm_medium=readme&utm_campaign=pricing).

## REST too

Everything the MCP server does is a plain HTTP call, if you would rather not run an MCP client:

```bash
curl -X POST https://postwire.io/api/post \
  -H "Authorization: Bearer $POSTWIRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"platforms":["bluesky","mastodon"],"text":"shipped."}'
```

Docs: [postwire.io](https://postwire.io/?utm_source=github&utm_medium=readme&utm_campaign=docs)

MIT © PostWire
