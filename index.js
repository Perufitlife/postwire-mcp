#!/usr/bin/env node
// PostWire MCP server — connects any AI agent to https://postwire.io.
// Usage: POSTWIRE_API_KEY=pw_live_... npx postwire-mcp
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API = process.env.POSTWIRE_API_BASE || "https://postwire.io";
const KEY = process.env.POSTWIRE_API_KEY || "";

async function api(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}), ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `PostWire API ${r.status}`);
  return j;
}

const server = new Server({ name: "postwire", version: "0.1.0" }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: "post_to_social",
    description: "Publish a post (optionally with a photo or video) to one or more social platforms via PostWire. " +
      "Connect accounts first at https://postwire.io/dashboard.html. Returns per-platform results.",
    inputSchema: {
      type: "object",
      properties: {
        platforms: { type: "array", items: { type: "string" }, description: "e.g. ['x','tiktok','bluesky']" },
        text: { type: "string", description: "post text / caption" },
        video_url: { type: "string", description: "optional public URL of a video" },
        photo_url: { type: "string", description: "optional public URL of a photo" },
      },
      required: ["platforms", "text"],
    },
  },
  { name: "list_platforms", description: "List the social platforms PostWire supports and the fields each needs.", inputSchema: { type: "object", properties: {} } },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;
  try {
    if (!KEY) throw new Error("Set POSTWIRE_API_KEY (get one free at https://postwire.io/dashboard.html)");
    if (name === "list_platforms") return text(await api("/api/platforms"));
    if (name === "post_to_social")
      return text(await api("/api/post", { method: "POST", body: JSON.stringify({ platforms: a.platforms, text: a.text, video_url: a.video_url, photo_url: a.photo_url }) }));
    throw new Error("unknown tool " + name);
  } catch (e) { return { content: [{ type: "text", text: "ERROR: " + String(e.message || e) }], isError: true }; }
});
const text = (o) => ({ content: [{ type: "text", text: JSON.stringify(o, null, 2) }] });

await server.connect(new StdioServerTransport());
console.error("PostWire MCP server running (stdio) →", API);
