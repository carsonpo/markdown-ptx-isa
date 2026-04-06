/**
 * PTX ISA v9.2 MCP Server
 *
 * Implements the Model Context Protocol (JSON-RPC 2.0 over stdio) so that
 * coding agents can query NVIDIA PTX ISA documentation programmatically.
 *
 * Also exposes a minimal JSON API over HTTP on port 3000 (GET /api/list,
 * /api/read, /api/search, /docs/:slug) plus a POST /mcp endpoint for
 * HTTP-transport MCP clients.
 *
 * Run:  bun run index.ts
 */

import { AutoRouter, error, json } from "itty-router";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOCS_ROOT = import.meta.dir + "/..";
const HTTP_PORT = 3000;

// ---------------------------------------------------------------------------
// Bun-native filesystem helpers (node:fs resolves to Bun's built-in compat layer)
// ---------------------------------------------------------------------------
import { readdirSync, statSync, readFileSync } from "node:fs";

function bunReadText(absPath: string): string {
  return readFileSync(absPath, "utf8");
}

const WALK_SKIP = new Set(["node_modules", ".git", "mcp-server"]);

function bunWalk(dir: string): string[] {
  const results: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (WALK_SKIP.has(name)) continue;
    const full = `${dir}/${name}`;
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...bunWalk(full));
    } else if (name.endsWith(".md") && st.size > 0) {
      results.push(full);
    }
  }
  return results;
}

function relPath(absPath: string): string {
  return absPath.slice(DOCS_ROOT.length + 1).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// Document index — built once at startup
// ---------------------------------------------------------------------------

interface DocEntry {
  /** Relative path from DOCS_ROOT, e.g. "09-instruction-set/14-warp-level-mma/mma/ldmatrix.md" */
  path: string;
  /** Slug for lookup: path without .md extension */
  slug: string;
  /** Human-readable title extracted from first # heading */
  title: string;
  /** Section number prefix if present (e.g. "9.7.14.3") */
  section: string | null;
}

function extractTitle(content: string, fallbackSlug?: string): { title: string; section: string | null } {
  // Match first heading of any level (H1 preferred, fall back to H2/H3)
  const m = content.match(/^#{1,3}\s+(.+)$/m);
  if (!m) {
    if (fallbackSlug) {
      const name = fallbackSlug.split("/").pop() ?? fallbackSlug;
      const label = name.replace(/^\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      return { title: label, section: null };
    }
    return { title: "(untitled)", section: null };
  }
  const raw = m[1].trim();
  const sm = raw.match(/^(\d+(?:\.\d+)*\.?)\s+(.+)$/);
  if (sm) return { title: sm[2].trim(), section: sm[1].replace(/\.$/, "") };
  return { title: raw, section: null };
}

const README_CONTENT = bunReadText(`${DOCS_ROOT}/README.md`);

const ALL_DOCS: DocEntry[] = bunWalk(DOCS_ROOT)
  .filter((p) => !p.endsWith("/README.md"))
  .map((absPath) => {
    const rel = relPath(absPath);
    const slug = rel.replace(/\.md$/, "");
    const content = bunReadText(absPath);
    const { title, section } = extractTitle(content, slug);
    return { path: rel, slug, title, section };
  });

const DOC_MAP = new Map<string, DocEntry>(ALL_DOCS.map((d) => [d.slug, d]));

// ---------------------------------------------------------------------------
// MCP tool implementations
// ---------------------------------------------------------------------------

function toolList(args: { filter?: string }): object {
  const filter = args.filter?.toLowerCase();
  const docs = filter
    ? ALL_DOCS.filter(
        (d) =>
          d.title.toLowerCase().includes(filter) ||
          d.slug.toLowerCase().includes(filter) ||
          (d.section ?? "").includes(filter)
      )
    : ALL_DOCS;
  return {
    total: docs.length,
    documents: docs.map((d) => ({ slug: d.slug, title: d.title, section: d.section, path: d.path })),
  };
}

function toolRead(args: { slug: string }): object {
  if (!args.slug) return { error: "slug is required" };
  const slug = args.slug.replace(/^\/+|\/+$/g, "").replace(/\.md$/, "");
  if (slug === "" || slug === "README" || slug === "overview") {
    return { slug: "README", title: "PTX ISA v9.2 Overview", content: README_CONTENT };
  }
  const entry = DOC_MAP.get(slug);
  if (!entry) {
    const candidate = ALL_DOCS.find(
      (d) => d.slug.includes(slug) || d.title.toLowerCase().includes(slug.toLowerCase())
    );
    if (candidate) {
      const content = bunReadText(`${DOCS_ROOT}/${candidate.path}`);
      return { slug: candidate.slug, title: candidate.title, content, fuzzy_match: true };
    }
    return { error: `No document found for slug "${args.slug}"` };
  }
  const content = bunReadText(`${DOCS_ROOT}/${entry.path}`);
  return { slug: entry.slug, title: entry.title, section: entry.section, content };
}

function toolSearch(args: { query: string; max_results?: number }): object {
  if (!args.query) return { error: "query is required" };
  const query = args.query.toLowerCase();
  const maxResults = args.max_results ?? 20;
  const results: Array<{ slug: string; title: string; matches: string[] }> = [];
  for (const entry of ALL_DOCS) {
    if (results.length >= maxResults) break;
    const content = bunReadText(`${DOCS_ROOT}/${entry.path}`);
    const matchingLines: string[] = [];
    for (const line of content.split("\n")) {
      if (line.toLowerCase().includes(query)) {
        matchingLines.push(line.trim());
        if (matchingLines.length >= 5) break;
      }
    }
    if (matchingLines.length > 0) {
      results.push({ slug: entry.slug, title: entry.title, matches: matchingLines });
    }
  }
  return { query: args.query, total: results.length, results };
}

// ---------------------------------------------------------------------------
// MCP tool definitions
// ---------------------------------------------------------------------------

const MCP_TOOLS = [
  {
    name: "ptx_list",
    description:
      "List all PTX ISA documentation pages. Optionally filter by keyword. " +
      "Returns slug, title, section number, and file path for each page.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Optional keyword to filter documents by title or slug." },
      },
    },
  },
  {
    name: "ptx_read",
    description:
      "Read the full Markdown content of a PTX ISA documentation page by its slug. " +
      "Use ptx_list first to discover available slugs. " +
      'Pass slug="README" or slug="overview" for the top-level overview.',
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: 'Document slug, e.g. "09-instruction-set/14-warp-level-mma/mma/ldmatrix".',
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "ptx_search",
    description:
      "Full-text search across all PTX ISA documentation pages. " +
      "Returns matching documents with up to 5 snippet lines per document.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword or phrase." },
        max_results: { type: "number", description: "Maximum number of documents to return (default 20)." },
      },
      required: ["query"],
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

type JsonRpcId = string | number | null;

const rpcResult = (id: JsonRpcId, result: unknown) =>
  JSON.stringify({ jsonrpc: "2.0", id, result });

const rpcError = (id: JsonRpcId, code: number, message: string) =>
  JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });

// ---------------------------------------------------------------------------
// MCP dispatcher (shared by stdio and HTTP transports)
// ---------------------------------------------------------------------------

function handleMcpRequest(req: {
  jsonrpc?: string;
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}): string {
  const id = req.id ?? null;
  const params = req.params ?? {};

  switch (req.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "ptx-isa-mcp", version: "1.0.0" },
        capabilities: { tools: {}, resources: {} },
      });

    case "notifications/initialized":
      return "";

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: MCP_TOOLS });

    case "tools/call": {
      const toolName = params.name as string;
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      let result: object;
      switch (toolName) {
        case "ptx_list":   result = toolList(args as { filter?: string }); break;
        case "ptx_read":   result = toolRead(args as { slug: string }); break;
        case "ptx_search": result = toolSearch(args as { query: string; max_results?: number }); break;
        default: return rpcError(id, -32601, `Unknown tool: ${toolName}`);
      }
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    }

    case "resources/list":
      return rpcResult(id, {
        resources: ALL_DOCS.map((d) => ({
          uri: `ptx://docs/${d.slug}`,
          name: d.title,
          description: d.section ? `Section ${d.section}` : undefined,
          mimeType: "text/markdown",
        })),
      });

    case "resources/read": {
      const uri = params.uri as string;
      const slug = uri.replace(/^ptx:\/\/docs\//, "");
      const entry = DOC_MAP.get(slug);
      if (!entry) return rpcError(id, -32602, `Unknown resource: ${uri}`);
      const content = bunReadText(`${DOCS_ROOT}/${entry.path}`);
      return rpcResult(id, { contents: [{ uri, mimeType: "text/markdown", text: content }] });
    }

    default:
      return rpcError(id, -32601, `Method not found: ${req.method}`);
  }
}

// ---------------------------------------------------------------------------
// Stdio transport
// ---------------------------------------------------------------------------

function startStdioTransport() {
  // Bun-native line reader
  const decoder = new TextDecoder();
  let buf = "";

  process.stdin.on("data", (chunk: Buffer) => {
    buf += decoder.decode(chunk);
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: ReturnType<typeof JSON.parse>;
      try { parsed = JSON.parse(trimmed); }
      catch { process.stdout.write(rpcError(null, -32700, "Parse error") + "\n"); continue; }
      const resp = handleMcpRequest(parsed);
      if (resp) process.stdout.write(resp + "\n");
    }
  });

  process.stdin.on("end", () => process.exit(0));
}

// ---------------------------------------------------------------------------
// HTTP transport — minimal JSON API
// ---------------------------------------------------------------------------

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSectionGroups(): Map<string, DocEntry[]> {
  const groups = new Map<string, DocEntry[]>();
  for (const entry of ALL_DOCS) {
    const parts = entry.path.split("/");
    const key =
      parts.length === 1 ? "Core Chapters"
      : parts[0] !== "09-instruction-set" ? "Core Chapters"
      : parts.length === 2 ? "Chapter 9 — Instruction Set"
      : parts[1] === "14-warp-level-mma" ? "Ch 9 — Warp-Level MMA (§9.7.14)"
      : parts[1] === "15-wgmma" ? "Ch 9 — wgmma (§9.7.15)"
      : parts[1] === "16-tcgen05" ? "Ch 9 — tcgen05 (§9.7.16)"
      : "Chapter 9 — Instruction Set";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return groups;
}

function renderHtmlIndex(): string {
  const groups = buildSectionGroups();
  const groupHtml = Array.from(groups.entries()).map(([name, docs]) => {
    const items = docs.map((d) => {
      const sec = d.section ? `<span class="sec">${d.section}</span> ` : "";
      return `<li>${sec}<a href="/docs/${d.slug}">${escHtml(d.title)}</a> <code class="slug">${escHtml(d.slug)}</code></li>`;
    }).join("\n        ");
    return `<section><h2>${escHtml(name)}</h2><ul>${items}</ul></section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>NVIDIA PTX ISA v9.2 — MCP Server</title>
  <style>
    :root{--accent:#76b900;--bg:#111;--surface:#1a1a1a;--text:#e0e0e0;--muted:#888}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font:15px/1.6 system-ui,sans-serif;background:var(--bg);color:var(--text);padding:2rem;max-width:960px;margin:0 auto}
    header{border-bottom:2px solid var(--accent);padding-bottom:1rem;margin-bottom:2rem}
    header h1{font-size:1.6rem;color:var(--accent)}
    header p{color:var(--muted);margin-top:.3rem}
    section{margin-bottom:2rem}
    h2{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);margin-bottom:.5rem}
    ul{list-style:none}
    li{padding:.2rem 0;border-bottom:1px solid #222;display:flex;align-items:baseline;gap:.5rem;flex-wrap:wrap}
    a{color:#8ecae6;text-decoration:none}
    a:hover{text-decoration:underline}
    .sec{color:var(--muted);font-size:.78rem;min-width:5rem;flex-shrink:0;font-variant-numeric:tabular-nums}
    .slug{font-size:.7rem;color:#555;background:#1e1e1e;padding:.1rem .35rem;border-radius:3px;font-family:monospace}
    .api{background:var(--surface);border:1px solid #333;border-radius:6px;padding:1rem 1.4rem;margin-bottom:2rem}
    .api h2{margin-bottom:.4rem}
    pre{background:#0d0d0d;border:1px solid #2a2a2a;border-radius:4px;padding:.7rem 1rem;overflow-x:auto;font-size:.78rem;line-height:1.5;color:#a8e6a3;margin-top:.5rem}
    code{font-family:monospace;font-size:.82em;color:var(--accent);background:#1e1e1e;padding:.1rem .3rem;border-radius:3px}
  </style>
</head>
<body>
  <header>
    <h1>NVIDIA PTX ISA v9.2 — MCP Server</h1>
    <p>Coding-agent MCP server &bull; ${ALL_DOCS.length} pages &bull; JSON-RPC 2.0 over stdio</p>
  </header>

  <div class="api">
    <h2>API Quick Reference</h2>
    <p>Start: <code>bun run index.ts</code> — stdio MCP on <em>stdin/stdout</em>, HTTP on <strong>:${HTTP_PORT}</strong></p>
    <pre>
# MCP tools (via stdio or POST /mcp)
ptx_list   { filter?: string }
ptx_read   { slug: string }
ptx_search { query: string, max_results?: number }

# REST shortcuts
GET /api/list?filter=ldmatrix
GET /api/read?slug=09-instruction-set/14-warp-level-mma/mma/ldmatrix
GET /api/search?q=wmma.load&amp;max=10
GET /docs/:slug          ← raw markdown</pre>
  </div>

  ${groupHtml}
</body>
</html>`;
}

function startHttpServer() {
  const router = AutoRouter();

  router.get("/", () => new Response(renderHtmlIndex(), { headers: { "Content-Type": "text/html; charset=utf-8" } }));

  router.get("/api/list", (req) => {
    const filter = new URL(req.url).searchParams.get("filter") ?? undefined;
    return json(toolList({ filter }));
  });

  router.get("/api/read", (req) => {
    const slug = new URL(req.url).searchParams.get("slug") ?? "";
    return json(toolRead({ slug }));
  });

  router.get("/api/search", (req) => {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") ?? "";
    const max_results = parseInt(url.searchParams.get("max") ?? "20", 10);
    if (!query) return json({ error: "q parameter required" }, { status: 400 });
    return json(toolSearch({ query, max_results }));
  });

  router.get("/docs/*", (req) => {
    const slug = new URL(req.url).pathname.replace(/^\/docs\//, "").replace(/\.md$/, "");
    const result = toolRead({ slug }) as Record<string, unknown>;
    if (result.error) return new Response(result.error as string, { status: 404 });
    return new Response(result.content as string, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
  });

  router.post("/mcp", async (req) => {
    const body = await req.json();
    const resp = handleMcpRequest(body);
    if (!resp) return new Response(null, { status: 204 });
    return json(JSON.parse(resp));
  });

  router.all("*", () => error(404, "Not found"));

  Bun.serve({ port: HTTP_PORT, fetch: router.fetch });
  console.error(`[ptx-isa-mcp] HTTP → http://localhost:${HTTP_PORT}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

startHttpServer();

if (process.argv.includes("--http")) {
  console.error("[ptx-isa-mcp] HTTP-only mode.");
} else if (process.stdin.isTTY) {
  console.error("[ptx-isa-mcp] stdin is a TTY — stdio MCP skipped. Pass input via pipe or use --http.");
} else {
  console.error("[ptx-isa-mcp] stdio MCP transport active.");
  startStdioTransport();
}
