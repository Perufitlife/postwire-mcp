#!/usr/bin/env node
// PostWire MCP server — connects any AI agent to https://postwire.io.
// Usage: POSTWIRE_API_KEY=pw_live_... npx postwire-mcp
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";

const API = process.env.POSTWIRE_API_BASE || "https://postwire.io";
const KEY = process.env.POSTWIRE_API_KEY || "";

async function api(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-PostWire-Source": "mcp-local", ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}), ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `PostWire API ${r.status}`);
  return j;
}

// Shown when POSTWIRE_API_KEY is missing. An agent relays this to its user verbatim, so it has to
// read as instructions a person can follow, not as a stack trace.
const NO_KEY = {
  error: "no_api_key",
  what_to_do: "PostWire needs a free API key before it can post. Ask the user to get one — it takes about a minute.",
  steps: [
    "1. Open https://postwire.io/dashboard.html and sign up (email + password).",
    "2. Connect a social account — one OAuth click, no app review needed.",
    "3. Copy the API key shown on that page.",
    "4. Set POSTWIRE_API_KEY in this MCP server's env and restart it.",
  ],
  cost: "Free plan: 1 brand, every network it connects, 30 posts a month. No card. Starter is $9/month for 3 brands and 300 posts.",
  meanwhile: "list_platforms works without a key — call it to show which networks are supported and what each one needs.",
};

const server = new Server({ name: "postwire", version: JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: "generate_posts", annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    description: "Smart Distribute — PostWire's native AI writer. Give ONE prompt (and optional media) and it writes the BEST NATIVE post for EACH platform: correct character limits, hashtag rules, SEO title+tags for YouTube, hook-first captions for TikTok/Reels, professional framing for LinkedIn (link-in-comment), thread-friendly text for X (link-in-reply), CamelCase tags for Mastodon, and more. It does NOT send the same text everywhere — each platform gets its own optimized draft. Returns { drafts: { <platform>: { text, title?, tags? } } }. Review/edit, then pass to post_to_social as per_platform.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "What you want to say / the idea to communicate. More detail = better output." },
        platforms: { type: "array", items: { type: "string" }, description: "platforms to write for, e.g. ['youtube','tiktok','linkedin','x','bluesky','mastodon']" },
        media_url: { type: "string", description: "optional public URL of the photo/video the post is about" },
      },
      required: ["prompt", "platforms"],
    },
  },
  {
    name: "post_to_social", annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    description: "Publish to one or more social platforms via PostWire, in parallel. For best results, first call generate_posts to get a NATIVE draft per platform, then pass them here as `per_platform` (PostWire never just copies the same text everywhere). Or pass a single `text` for a quick same-everywhere post. Connect accounts first at https://postwire.io/dashboard.html. Returns per-platform results (each has an id you can pass to get_post_status).",
    inputSchema: {
      type: "object",
      properties: {
        platforms: { type: "array", items: { type: "string" }, description: "e.g. ['tiktok','youtube','bluesky'] — posts to all in one call" },
        text: { type: "string", description: "post text / caption (shared fallback if a platform has no per_platform draft)" },
        per_platform: { type: "object", description: "native drafts from generate_posts, e.g. { youtube:{text,title,tags}, x:{text} }" },
        title: { type: "string", description: "optional title (used by YouTube)" },
        video_url: { type: "string", description: "optional public URL of a video (required for TikTok/YouTube)" },
        photo_url: { type: "string", description: "optional public URL of a photo" },
        privacy: { type: "string", description: "optional: private | public | unlisted (YouTube)" },
      },
      required: ["platforms"],
    },
  },
  {
    name: "get_post_status", annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    description: "Check the processing/publish status of a post previously created with post_to_social.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", description: "e.g. 'tiktok' or 'youtube'" },
        id: { type: "string", description: "the post id returned by post_to_social" },
      },
      required: ["platform", "id"],
    },
  },
  { name: "list_platforms", annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }, description: "List the social platforms PostWire supports and the fields each needs.", inputSchema: { type: "object", properties: {} } },
  { name: "my_account", annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }, description: "Show the PostWire account: plan, monthly usage, and connected platforms.", inputSchema: { type: "object", properties: {} } },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;
  try {
    // The catalogue is public: answer it even with no key so the agent can show what PostWire
    // does before anyone signs up.
    if (name === "list_platforms") return text(await api("/api/platforms"));
    if (!KEY) return text(NO_KEY);
    if (name === "my_account") return text(await api("/api/me"));
    if (name === "generate_posts")
      return text(await api("/api/generate", { method: "POST", body: JSON.stringify({ prompt: a.prompt, platforms: a.platforms, media_url: a.media_url }) }));
    if (name === "post_to_social")
      return text(await api("/api/post", { method: "POST", body: JSON.stringify({ platforms: a.platforms, text: a.text, per_platform: a.per_platform, title: a.title, video_url: a.video_url, photo_url: a.photo_url, privacy: a.privacy }) }));
    if (name === "get_post_status")
      return text(await api(`/api/post/status?platform=${encodeURIComponent(a.platform)}&id=${encodeURIComponent(a.id)}`));
    throw new Error("unknown tool " + name);
  } catch (e) { return { content: [{ type: "text", text: "ERROR: " + String(e.message || e) }], isError: true }; }
});
const text = (o) => ({ content: [{ type: "text", text: JSON.stringify(o, null, 2) }] });

await server.connect(new StdioServerTransport());
console.error("PostWire MCP server running (stdio) →", API);
