/**
 * PTX ISA v9.2 — Combined MCP + Documentation Server
 *
 * Serves the human-readable Tailwind documentation browser at /
 * plus the MCP server (JSON-RPC 2.0 over stdio and POST /mcp),
 * and a REST API at /api/*.
 *
 * Run:  bun run server.ts
 */

import { AutoRouter, error, json } from "itty-router";
import { readdirSync, statSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DOCS_ROOT = import.meta.dir + "/docs";
const HTTP_PORT = parseInt(process.env.PORT ?? "3000", 10);

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function bunReadText(absPath: string): string {
  return readFileSync(absPath, "utf8");
}

function safeSlug(raw: string): string | null {
  const slug = raw.replace(/^\/+|\/+$/g, "").replace(/\.md$/, "");
  if (/(?:^|\/)\.\.|[\x00]/.test(slug)) return null;
  const resolved = `${DOCS_ROOT}/${slug}.md`;
  if (!resolved.startsWith(DOCS_ROOT + "/")) return null;
  return slug;
}

const WALK_SKIP = new Set(["node_modules", ".git"]);

function bunWalk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (WALK_SKIP.has(name)) continue;
    const full = `${dir}/${name}`;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...bunWalk(full));
    else if (name.endsWith(".md") && st.size > 0) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Document index
// ---------------------------------------------------------------------------

interface DocEntry {
  path: string;       // relative from DOCS_ROOT
  slug: string;       // path without .md
  title: string;
  section: string | null;
  crumbs: string[];   // slug parts for breadcrumb
}

function extractTitle(src: string, fallbackSlug?: string): { title: string; section: string | null } {
  const m = src.match(/^#{1,3}\s+(.+)$/m);
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
  .map((abs) => {
    const rel = abs.slice(DOCS_ROOT.length + 1).replace(/\\/g, "/");
    const slug = rel.replace(/\.md$/, "");
    const { title, section } = extractTitle(bunReadText(abs), slug);
    return { path: rel, slug, title, section, crumbs: slug.split("/") };
  });

const DOC_MAP = new Map<string, DocEntry>(ALL_DOCS.map((d) => [d.slug, d]));

// ---------------------------------------------------------------------------
// Search index — built once at startup for fast queries
// ---------------------------------------------------------------------------

interface SearchDoc {
  slug: string;
  title: string;
  section: string | null;
  content: string;
  lines: string[];           // original lines
  linesLower: string[];      // lowercased for matching
  tokens: Map<string, number>; // term → frequency
  totalTokens: number;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9_.]+/g) ?? [];
}

const SEARCH_DOCS: SearchDoc[] = [];
const IDF: Map<string, number> = new Map();

// Build index at startup
(function buildSearchIndex() {
  const docFreq = new Map<string, number>();

  for (const entry of ALL_DOCS) {
    const content = bunReadText(`${DOCS_ROOT}/${entry.path}`);
    const lines = content.split("\n");
    const linesLower = lines.map(l => l.toLowerCase());
    const words = tokenize(content);
    const tokens = new Map<string, number>();
    for (const w of words) {
      tokens.set(w, (tokens.get(w) ?? 0) + 1);
    }
    // track which terms appear in which docs
    for (const term of tokens.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
    SEARCH_DOCS.push({
      slug: entry.slug,
      title: entry.title,
      section: entry.section,
      content,
      lines,
      linesLower,
      tokens,
      totalTokens: words.length,
    });
  }

  // Compute IDF for all terms
  const N = SEARCH_DOCS.length;
  for (const [term, df] of docFreq) {
    IDF.set(term, Math.log((N + 1) / (df + 1)) + 1);
  }
})();

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
  if (args.slug === "" || args.slug === "README" || args.slug === "overview") {
    return { slug: "README", title: "PTX ISA v9.2 Overview", content: README_CONTENT };
  }
  const slug = safeSlug(args.slug);
  if (!slug) return { error: "Invalid slug" };
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
  const maxResults = Math.min(args.max_results ?? 20, 50);
  const queryLower = args.query.toLowerCase();
  const queryTerms = tokenize(args.query);

  if (queryTerms.length === 0) return { error: "query contains no searchable terms" };

  const scored: Array<{
    slug: string;
    title: string;
    section: string | null;
    score: number;
    snippets: Array<{ line_number: number; text: string; }>;
  }> = [];

  for (const doc of SEARCH_DOCS) {
    // Phase 1: Check if document has any relevance
    const hasExactPhrase = doc.content.toLowerCase().includes(queryLower);
    const matchingTerms = queryTerms.filter(t => doc.tokens.has(t));
    if (matchingTerms.length === 0 && !hasExactPhrase) continue;

    // Phase 2: Score the document (TF-IDF inspired)
    let score = 0;

    // Exact phrase match bonus (huge weight)
    if (hasExactPhrase) score += 50;

    // Title match bonus
    const titleLower = doc.title.toLowerCase();
    if (titleLower.includes(queryLower)) score += 100;
    for (const t of queryTerms) {
      if (titleLower.includes(t)) score += 20;
    }

    // Section number match
    if (doc.section && queryLower.includes(doc.section)) score += 30;

    // TF-IDF score for each query term
    for (const t of matchingTerms) {
      const tf = (doc.tokens.get(t) ?? 0) / doc.totalTokens;
      const idf = IDF.get(t) ?? 1;
      score += tf * idf * 10;
    }

    // Term coverage bonus — reward docs that match more query terms
    score += (matchingTerms.length / queryTerms.length) * 15;

    // Phase 3: Extract contextual snippets
    const snippets: Array<{ line_number: number; text: string }> = [];
    const usedLines = new Set<number>();
    const CONTEXT = 1; // lines of context around match

    for (let i = 0; i < doc.linesLower.length && snippets.length < 5; i++) {
      const lineLower = doc.linesLower[i];
      const lineHasMatch = lineLower.includes(queryLower) ||
        queryTerms.some(t => lineLower.includes(t));

      if (lineHasMatch && !usedLines.has(i)) {
        // Gather context lines
        const start = Math.max(0, i - CONTEXT);
        const end = Math.min(doc.lines.length - 1, i + CONTEXT);
        const contextLines: string[] = [];
        for (let j = start; j <= end; j++) {
          usedLines.add(j);
          const trimmed = doc.lines[j].trim();
          if (trimmed) contextLines.push(trimmed);
        }
        if (contextLines.length > 0) {
          snippets.push({
            line_number: i + 1,
            text: contextLines.join("\n"),
          });
        }
      }
    }

    if (snippets.length > 0 || score > 30) {
      scored.push({ slug: doc.slug, title: doc.title, section: doc.section, score, snippets });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, maxResults);

  return {
    query: args.query,
    total: results.length,
    results: results.map(r => ({
      slug: r.slug,
      title: r.title,
      section: r.section,
      relevance: Math.round(r.score * 100) / 100,
      snippets: r.snippets,
    })),
  };
}

// ---------------------------------------------------------------------------
// MCP tool definitions
// ---------------------------------------------------------------------------

const MCP_TOOLS = [
  {
    name: "list_pages",
    description:
      "List all available PTX ISA v9.2 documentation pages. " +
      "Returns an array of {slug, title, section, path} for every page. " +
      "Use the optional filter parameter to narrow results by keyword matching against title, slug, or section number. " +
      "Use this to discover slugs before calling read_page.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Optional keyword to filter by. Matches against page title, slug, and section number. " +
            'Examples: "mma", "texture", "9.7.14", "floating-point".',
        },
      },
    },
  },
  {
    name: "read_page",
    description:
      "Read the full Markdown content of a specific PTX ISA documentation page. " +
      "Accepts a document slug (from list_pages or search results). " +
      "Supports fuzzy matching — if the exact slug isn't found, the closest match is returned. " +
      'Pass slug="overview" or slug="README" for the top-level ISA overview.',
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: 'Document slug, e.g. "09-instruction-set/01-integer-arithmetic/add", ' +
            '"04-syntax", "09-instruction-set/14-warp-level-mma/mma/ldmatrix". ' +
            "Get valid slugs from list_pages or search.",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "search",
    description:
      "Full-text search across all PTX ISA v9.2 documentation. " +
      "Returns relevance-ranked results with contextual snippets (surrounding lines). " +
      "Supports multi-word queries — results are scored by TF-IDF relevance, exact phrase matches, " +
      "and title matches. Each result includes the page slug, title, relevance score, and up to 5 snippets " +
      "with line numbers for precise referencing. " +
      'Examples: "shared memory fence", "wgmma async", "ldmatrix", "tensor descriptor".',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query — can be a single keyword, multi-word phrase, instruction name, " +
            'or concept. Examples: "atom.cas", "memory consistency", "tcgen05.st".',
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return (default 20, max 50).",
        },
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
// MCP dispatcher
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
        serverInfo: { name: "ptx-isa", version: "2.0.0" },
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
        case "list_pages":  result = toolList(args as { filter?: string }); break;
        case "read_page":   result = toolRead(args as { slug: string }); break;
        case "search":      result = toolSearch(args as { query: string; max_results?: number }); break;
        // Legacy names for backwards compat
        case "ptx_list":    result = toolList(args as { filter?: string }); break;
        case "ptx_read":    result = toolRead(args as { slug: string }); break;
        case "ptx_search":  result = toolSearch(args as { query: string; max_results?: number }); break;
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
// Web UI — Markdown renderer
// ---------------------------------------------------------------------------

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineHtml(raw: string): string {
  let s = escHtml(raw);
  s = s.replace(/`([^`]+)`/g, '<code class="bg-[#0d1a2d] text-cyan-300 border border-cyan-900/40 px-1.5 py-px rounded text-[0.88em] font-mono">$1</code>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  s = s.replace(/\*(.+?)\*/g, "<em class=\"italic\">$1</em>");
  // Images before links (![alt](url) vs [text](url))
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg border border-white/[0.06] my-4 max-w-full" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 transition-colors">$1</a>');
  return s;
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];

  let inCode = false, codeLang = "", codeLines: string[] = [];
  let inTable = false, tableHead: string[] | null = null, tableRows: string[][] = [];
  let inBq = false, bqLines: string[] = [];
  let inList = false, listOrdered = false, listItems: string[] = [];

  function flushCode() {
    if (!inCode) return;
    const lang = codeLang ? `<span class="absolute top-2 right-3 text-[0.65rem] text-cyan-700 font-mono select-none uppercase tracking-widest">${escHtml(codeLang)}</span>` : "";
    out.push(`<div class="relative my-5">${lang}<pre class="bg-[#060d1a] border border-cyan-900/30 rounded-lg p-5 overflow-x-auto text-[0.9rem] font-mono text-cyan-200 leading-relaxed shadow-[inset_0_1px_0_0_rgba(99,179,237,0.05)]"><code>${codeLines.map(escHtml).join("\n")}</code></pre></div>`);
    inCode = false; codeLang = ""; codeLines = [];
  }
  function flushTable() {
    if (!inTable) return;
    out.push('<div class="overflow-x-auto my-5 rounded-lg border border-white/[0.06]"><table class="w-full text-[0.9rem] border-collapse">');
    if (tableHead) {
      out.push("<thead><tr>");
      tableHead.forEach(c => out.push(`<th class="text-left px-4 py-2.5 bg-white/[0.04] text-[0.78rem] font-semibold uppercase tracking-widest text-slate-400 border-b border-white/[0.06]">${inlineHtml(c.trim())}</th>`));
      out.push("</tr></thead>");
    }
    out.push("<tbody>");
    tableRows.forEach((row) => {
      out.push('<tr class="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">');
      row.forEach(c => out.push(`<td class="px-4 py-2.5 text-slate-300 text-[0.9rem]">${inlineHtml(c.trim())}</td>`));
      out.push("</tr>");
    });
    out.push("</tbody></table></div>");
    inTable = false; tableHead = null; tableRows = [];
  }
  function flushBq() {
    if (!inBq) return;
    out.push('<blockquote class="border-l-[2px] border-cyan-500/30 pl-5 my-4 text-slate-400 italic text-[0.9rem] space-y-1 bg-cyan-500/[0.03] py-3 rounded-r-lg">');
    bqLines.forEach(l => out.push(`<p>${inlineHtml(l)}</p>`));
    out.push("</blockquote>");
    inBq = false; bqLines = [];
  }
  function flushList() {
    if (!inList) return;
    const tag = listOrdered ? "ol" : "ul";
    const cls = listOrdered
      ? 'class="list-decimal list-outside ml-5 my-3 space-y-1 text-slate-300"'
      : 'class="list-disc list-outside ml-5 my-3 space-y-1.5 text-slate-300 marker:text-cyan-700"';
    out.push(`<${tag} ${cls}>`);
    listItems.forEach(li => out.push(`<li class="leading-relaxed text-[0.9rem]">${inlineHtml(li)}</li>`));
    out.push(`</${tag}>`);
    inList = false; listOrdered = false; listItems = [];
  }

  const HEADING_CLS = [
    "",
    "text-2xl font-bold mt-10 mb-4 text-white border-b border-white/[0.08] pb-3 tracking-tight",
    "text-lg font-semibold mt-8 mb-3 text-slate-100 uppercase tracking-wide text-[0.75rem]",
    "text-base font-semibold mt-6 mb-2 text-slate-200",
    "text-sm font-semibold mt-5 mb-2 text-slate-300",
    "text-sm font-semibold mt-4 mb-1 text-slate-400",
    "text-xs font-medium mt-3 mb-1 text-slate-500 uppercase tracking-widest",
  ];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) { flushList(); flushTable(); flushBq(); inCode = true; codeLang = line.slice(3).trim(); }
      else flushCode();
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith("> ")) {
      flushList(); flushTable(); inBq = true; bqLines.push(line.slice(2)); continue;
    }
    if (inBq && line.trim() === "") { flushBq(); out.push(""); continue; }
    if (inBq) { bqLines.push(line.startsWith("> ") ? line.slice(2) : line); continue; }

    if (line.trim().startsWith("|") && line.includes("|")) {
      flushList();
      const cells = line.split("|").slice(1, -1);
      if (!inTable) { tableHead = cells; inTable = true; continue; }
      if (cells.every(c => /^[-: ]+$/.test(c))) continue;
      tableRows.push(cells); continue;
    }
    if (inTable && !line.trim().startsWith("|")) flushTable();

    const ulm = line.match(/^(\s*)([-*+])\s+(.+)$/);
    const olm = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ulm) {
      flushTable(); flushBq();
      if (!inList || listOrdered) { flushList(); inList = true; listOrdered = false; }
      listItems.push(ulm[3]); continue;
    }
    if (olm) {
      flushTable(); flushBq();
      if (!inList || !listOrdered) { flushList(); inList = true; listOrdered = true; }
      listItems.push(olm[3]); continue;
    }
    if (inList && line.trim() === "") { flushList(); out.push(""); continue; }
    if (inList) flushList();

    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushList(); flushTable(); flushBq();
      const lvl = hm[1].length;
      const text = hm[2].trim();
      const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      out.push(`<h${lvl} id="${id}" class="${HEADING_CLS[lvl]}">${inlineHtml(text)}</h${lvl}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushList(); flushTable(); flushBq();
      out.push('<hr class="border-white/[0.06] my-8">');
      continue;
    }

    if (line.trim() === "") { flushList(); flushTable(); flushBq(); out.push(""); continue; }

    // Block-level image on its own line
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushList(); flushTable(); flushBq();
      out.push(`<figure class="my-5"><img src="${escHtml(imgMatch[2])}" alt="${escHtml(imgMatch[1])}" class="rounded-lg border border-white/[0.06] max-w-full" loading="lazy"></figure>`);
      continue;
    }

    out.push(`<p class="my-2 text-slate-400 leading-relaxed text-[0.9rem]">${inlineHtml(line)}</p>`);
  }

  flushList(); flushTable(); flushBq(); flushCode();
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Nav groups
// ---------------------------------------------------------------------------

interface NavGroup { label: string; items: DocEntry[]; }

const NAV_GROUPS: NavGroup[] = [
  { label: "Core Chapters",               items: ALL_DOCS.filter(d => !d.path.startsWith("09-instruction-set/") && d.path !== "README.md") },
  { label: "Chapter 9 — Instruction Set", items: ALL_DOCS.filter(d => d.path.startsWith("09-instruction-set/") && d.crumbs.length === 2) },
  { label: "Warp-Level MMA  §9.7.14",     items: ALL_DOCS.filter(d => d.path.includes("14-warp-level-mma/")) },
  { label: "wgmma  §9.7.15",              items: ALL_DOCS.filter(d => d.path.includes("15-wgmma/")) },
  { label: "tcgen05  §9.7.16",            items: ALL_DOCS.filter(d => d.path.includes("16-tcgen05/")) },
];

// ---------------------------------------------------------------------------
// HTML shell
// ---------------------------------------------------------------------------

function shell(pageTitle: string, body: string, activeSlug = ""): string {
  const nav = NAV_GROUPS.map(g => {
    if (!g.items.length) return "";
    const links = g.items.map(d => {
      const active = d.slug === activeSlug;
      const bg = active
        ? "bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400 pl-[10px]"
        : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-l-2 border-transparent pl-[10px]";
      const sec = d.section ? `<span class="text-slate-700 text-[0.6rem] font-mono mr-1.5 flex-shrink-0 tabular-nums">${escHtml(d.section)}</span>` : "";
      return `<a href="/docs/${d.slug}" class="flex items-start py-[4px] pr-3 text-[0.8rem] leading-snug transition-all duration-150 ${bg}">${sec}<span>${escHtml(d.title)}</span></a>`;
    }).join("\n");
    return `<div class="mb-5">
      <p class="px-3 mb-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-slate-600">${escHtml(g.label)}</p>
      ${links}
    </div>`;
  }).join("\n");

  const BASE_URL = "https://ptx.poole.ai";
  const canonicalUrl = activeSlug ? `${BASE_URL}/docs/${activeSlug}` : BASE_URL;
  const ogType = activeSlug ? "article" : "website";
  const description = activeSlug
    ? `PTX ISA v9.2 reference: ${escHtml(pageTitle)}. Community Markdown conversion of the NVIDIA Parallel Thread Execution ISA specification.`
    : "Community Markdown reference for the NVIDIA PTX ISA v9.2 — full instruction set including warp-level MMA, wgmma (Hopper), and TensorCore Gen5 tcgen05 (Blackwell).";
  const twitterDesc = activeSlug
    ? `PTX ISA v9.2 reference: ${escHtml(pageTitle)}.`
    : "Community Markdown reference for the NVIDIA PTX ISA v9.2 — warp-level MMA, wgmma, tcgen05, and more.";

  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(pageTitle)} — PTX ISA v9.2</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#070d1a">

  <!-- Open Graph -->
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="PTX ISA v9.2 Reference">
  <meta property="og:title" content="${escHtml(pageTitle)} — PTX ISA v9.2">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${BASE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(pageTitle)} — PTX ISA v9.2">
  <meta name="twitter:description" content="${twitterDesc}">
  <meta name="twitter:image" content="${BASE_URL}/og-image.png">

  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={darkMode:'class',theme:{extend:{fontFamily:{mono:['JetBrains Mono','Fira Code','ui-monospace','monospace']}}}}</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

    html { color-scheme: dark; }
    body { background: #070d1a; }

    .bg-animated {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 80% 60% at 20% 10%, rgba(14,57,100,0.55) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 50% at 80% 90%, rgba(6,40,80,0.45) 0%, transparent 55%),
                  radial-gradient(ellipse 50% 40% at 60% 40%, rgba(10,30,70,0.3) 0%, transparent 50%),
                  #070d1a;
      animation: gradshift 18s ease-in-out infinite alternate;
    }
    @keyframes gradshift {
      0%   { background-position: 20% 10%, 80% 90%, 60% 40%; }
      33%  { background-position: 30% 20%, 70% 80%, 50% 50%; }
      66%  { background-position: 15% 5%,  85% 85%, 65% 35%; }
      100% { background-position: 25% 15%, 75% 85%, 55% 45%; }
    }

    .sidebar {
      background: rgba(7, 13, 26, 0.85);
      border-right: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
    }

    /* Mobile sidebar overlay */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; inset: 0; z-index: 50;
        width: 100% !important; max-width: 300px;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        border-right: 1px solid rgba(99,179,237,0.15);
      }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay {
        position: fixed; inset: 0; z-index: 49;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(2px);
        opacity: 0; pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .sidebar-overlay.active { opacity: 1; pointer-events: all; }
    }
    @media (min-width: 769px) {
      .sidebar-overlay { display: none; }
      .mobile-header { display: none !important; }
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.2); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(99,179,237,0.4); }

    .doc-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      transition: all 0.2s ease;
    }
    .doc-card:hover {
      background: rgba(99,179,237,0.07);
      border-color: rgba(99,179,237,0.25);
      box-shadow: 0 0 20px rgba(99,179,237,0.08);
      transform: translateY(-1px);
    }

    .prose-area { max-width: 820px; }
    @media (max-width: 768px) {
      .prose-area { padding-left: 1.25rem !important; padding-right: 1.25rem !important; padding-top: 1.25rem !important; }
    }

    .section-label {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(148,163,184,0.5);
    }

    /* Search modal */
    .search-backdrop {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.15s ease;
      pointer-events: none;
    }
    .search-backdrop.active { opacity: 1; pointer-events: all; }

    .search-modal {
      position: fixed; z-index: 101;
      top: 12vh; left: 50%; transform: translateX(-50%);
      width: min(640px, 90vw);
      max-height: 70vh;
      background: #0a1220;
      border: 1px solid rgba(99, 179, 237, 0.2);
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 179, 237, 0.08);
      display: flex; flex-direction: column;
      opacity: 0; transform: translateX(-50%) scale(0.97);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: none;
    }
    .search-modal.active { opacity: 1; transform: translateX(-50%) scale(1); pointer-events: all; }
    @media (max-width: 768px) {
      .search-modal {
        top: 0; left: 0; right: 0; bottom: 0;
        width: 100%; max-width: 100%; max-height: 100%;
        border-radius: 0; border: none;
        transform: translateY(20px);
      }
      .search-modal.active { transform: translateY(0); }
      .search-footer { display: none; }
    }

    .search-input-wrap {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .search-input-wrap svg { flex-shrink: 0; color: rgba(99,179,237,0.5); }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: #e2e8f0; font-size: 0.95rem; font-family: inherit;
    }
    .search-input::placeholder { color: rgba(148,163,184,0.35); }
    .search-kbd {
      font-size: 0.6rem; color: rgba(148,163,184,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 4px; padding: 2px 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .search-results {
      flex: 1; overflow-y: auto; padding: 6px;
    }
    .search-empty {
      padding: 40px 20px; text-align: center;
      color: rgba(148,163,184,0.35); font-size: 0.82rem;
    }
    .search-result-item {
      display: block; padding: 10px 14px;
      border-radius: 8px; cursor: pointer;
      transition: background 0.1s ease;
      text-decoration: none;
      border: 1px solid transparent;
    }
    .search-result-item:hover, .search-result-item.selected {
      background: rgba(99, 179, 237, 0.08);
      border-color: rgba(99, 179, 237, 0.15);
    }
    .search-result-title {
      font-size: 0.82rem; color: #e2e8f0; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .search-result-section {
      font-size: 0.6rem; color: rgba(99,179,237,0.5);
      font-family: 'JetBrains Mono', monospace;
    }
    .search-result-snippet {
      font-size: 0.72rem; color: rgba(148,163,184,0.5);
      margin-top: 4px; line-height: 1.5;
      font-family: 'JetBrains Mono', monospace;
      white-space: pre-wrap;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .search-result-snippet mark {
      background: rgba(99, 179, 237, 0.25);
      color: #93c5fd;
      border-radius: 2px;
      padding: 0 1px;
    }
    .search-result-score {
      font-size: 0.55rem; color: rgba(148,163,184,0.25);
      font-family: 'JetBrains Mono', monospace;
    }
    .search-footer {
      padding: 8px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; gap: 12px;
      font-size: 0.6rem; color: rgba(148,163,184,0.3);
      font-family: 'JetBrains Mono', monospace;
    }
    .search-footer kbd {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 3px; padding: 1px 5px;
    }
  </style>
</head>
<body class="h-full text-slate-300 antialiased">
<div class="bg-animated"></div>

<div class="relative z-10 flex h-screen overflow-hidden">

  <!-- Mobile header -->
  <div class="mobile-header fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]" style="background:rgba(7,13,26,0.92);backdrop-filter:blur(12px);">
    <button onclick="toggleSidebar()" aria-label="Menu" class="p-1.5 -ml-1 rounded-lg hover:bg-white/[0.06] transition-colors">
      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <a href="/" class="flex items-baseline gap-1.5">
      <span class="text-white font-bold text-sm tracking-tight">PTX ISA</span>
      <span class="text-cyan-400 font-bold text-sm">v9.2</span>
    </a>
    <div class="flex-1"></div>
    <button onclick="openSearch()" aria-label="Search" class="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
      <svg class="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
    </button>
  </div>

  <!-- Sidebar overlay (mobile) -->
  <div id="sidebar-overlay" class="sidebar-overlay" onclick="closeSidebar()"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="sidebar w-[19rem] flex-shrink-0 flex flex-col overflow-hidden">
    <div class="flex-shrink-0 px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
      <a href="/" class="block group">
        <div class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-slate-600 mb-1">NVIDIA</div>
        <div class="text-white font-bold text-[0.95rem] tracking-tight leading-none group-hover:text-cyan-300 transition-colors">PTX ISA <span class="text-cyan-400">v9.2</span></div>
        <div class="text-[0.6rem] text-slate-600 mt-1 uppercase tracking-widest">Reference</div>
      </a>
      <button onclick="closeSidebar()" class="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors -mr-2" aria-label="Close menu">
        <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <button onclick="openSearch(); closeSidebar();" class="w-full flex items-center gap-2 px-3 pl-[12px] py-[7px] text-[0.75rem] text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.06] hover:border-cyan-800/50 rounded-lg transition-all duration-150 mb-3 group">
        <svg class="w-3 h-3 flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
        <span class="flex-1 text-left">Search docs...</span>
        <kbd class="hidden sm:inline text-[0.55rem] text-slate-700 border border-white/[0.06] rounded px-1.5 py-px font-mono">\u2318F</kbd>
      </button>
      <a href="/" class="flex items-center gap-2 px-3 pl-[12px] py-[5px] text-[0.75rem] text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-l-2 border-transparent hover:border-cyan-700 transition-all duration-150 mb-4">
        <svg class="w-3 h-3 flex-shrink-0 opacity-50" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
        Overview
      </a>
      ${nav}
    </nav>
  </aside>

  <!-- Content -->
  <main id="main-content" class="flex-1 overflow-y-auto">
    <div class="prose-area mx-auto px-10 py-10">
      ${body}
    </div>
  </main>

</div>

<script>
(function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mainContent = document.getElementById('main-content');

  // Add top padding on mobile for fixed header
  function applyMobilePadding() {
    if (window.innerWidth <= 768) {
      mainContent.style.paddingTop = '56px';
    } else {
      mainContent.style.paddingTop = '';
    }
  }
  applyMobilePadding();
  window.addEventListener('resize', applyMobilePadding);

  window.toggleSidebar = function() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
  };
  window.closeSidebar = function() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close sidebar on nav link click (mobile)
  sidebar.querySelectorAll('a[href]').forEach(function(a) {
    a.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // Swipe to open/close
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical swipe
    if (dx > 60 && touchStartX < 40 && !sidebar.classList.contains('open')) {
      toggleSidebar();
    } else if (dx < -60 && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  }, { passive: true });
})();
</script>

<!-- Search modal -->
<div id="search-backdrop" class="search-backdrop" onclick="closeSearch()"></div>
<div id="search-modal" class="search-modal">
  <div class="search-input-wrap">
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
    <input id="search-input" class="search-input" type="text" placeholder="Search PTX ISA docs..." autocomplete="off" spellcheck="false">
    <span class="search-kbd">esc</span>
  </div>
  <div id="search-results" class="search-results">
    <div class="search-empty">Type to search across all documentation</div>
  </div>
  <div class="search-footer">
    <span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> navigate</span>
    <span><kbd>enter</kbd> open</span>
    <span><kbd>esc</kbd> close</span>
  </div>
</div>

<script>
(function() {
  const backdrop = document.getElementById('search-backdrop');
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  let isOpen = false;
  let debounceTimer = null;
  let selectedIdx = -1;
  let resultItems = [];

  window.openSearch = function() {
    if (isOpen) return;
    isOpen = true;
    backdrop.classList.add('active');
    modal.classList.add('active');
    input.value = '';
    resultsEl.innerHTML = '<div class="search-empty">Type to search across all documentation</div>';
    selectedIdx = -1;
    resultItems = [];
    requestAnimationFrame(() => input.focus());
  };

  window.closeSearch = function() {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('active');
    modal.classList.remove('active');
    input.blur();
  };

  // Cmd/Ctrl+F override
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeSearch();
    }
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (resultItems.length > 0) {
        selectedIdx = Math.min(selectedIdx + 1, resultItems.length - 1);
        updateSelection();
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (resultItems.length > 0) {
        selectedIdx = Math.max(selectedIdx - 1, 0);
        updateSelection();
      }
    }
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      if (selectedIdx >= 0 && selectedIdx < resultItems.length) {
        resultItems[selectedIdx].click();
      }
    }
  });

  function updateSelection() {
    resultItems.forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIdx);
    });
    if (selectedIdx >= 0 && resultItems[selectedIdx]) {
      resultItems[selectedIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  function highlightText(text, query) {
    if (!query) return escH(text);
    const escaped = escH(text);
    const qLower = query.toLowerCase();
    const terms = qLower.split(/\\s+/).filter(Boolean);
    let result = escaped;
    // First try exact phrase
    const idx = result.toLowerCase().indexOf(qLower);
    if (idx !== -1 && query.includes(' ')) {
      const before = result.slice(0, idx);
      const match = result.slice(idx, idx + query.length);
      const after = result.slice(idx + query.length);
      return before + '<mark>' + match + '</mark>' + after;
    }
    // Then highlight individual terms
    for (const term of terms) {
      if (term.length < 2) continue;
      const re = new RegExp('(' + term.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    }
    return result;
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  input.addEventListener('input', function() {
    const q = input.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!q) {
      resultsEl.innerHTML = '<div class="search-empty">Type to search across all documentation</div>';
      selectedIdx = -1;
      resultItems = [];
      return;
    }
    debounceTimer = setTimeout(() => doSearch(q), 150);
  });

  async function doSearch(q) {
    try {
      const resp = await fetch('/api/search?q=' + encodeURIComponent(q) + '&max=30');
      const data = await resp.json();
      if (input.value.trim() !== q) return; // stale
      if (!data.results || data.results.length === 0) {
        resultsEl.innerHTML = '<div class="search-empty">No results for &ldquo;' + escH(q) + '&rdquo;</div>';
        selectedIdx = -1;
        resultItems = [];
        return;
      }
      let html = '';
      for (const r of data.results) {
        const sectionBadge = r.section
          ? '<span class="search-result-section">&sect;' + escH(r.section) + '</span>'
          : '';
        const snippet = r.snippets && r.snippets.length > 0
          ? '<div class="search-result-snippet">' + highlightText(r.snippets[0].text, q) + '</div>'
          : '';
        html += '<a href="/docs/' + escH(r.slug) + '" class="search-result-item" onclick="closeSearch()">'
          + '<div class="search-result-title">' + highlightText(r.title, q) + sectionBadge + '</div>'
          + snippet
          + '</a>';
      }
      resultsEl.innerHTML = html;
      resultItems = Array.from(resultsEl.querySelectorAll('.search-result-item'));
      selectedIdx = 0;
      updateSelection();
    } catch(e) {
      resultsEl.innerHTML = '<div class="search-empty">Search error</div>';
    }
  }
})();
</script>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

function renderIndex(): string {
  const cards = NAV_GROUPS.map(g => {
    if (!g.items.length) return "";
    const grid = g.items.map(d => `
      <a href="/docs/${d.slug}" class="doc-card block p-4 rounded-lg">
        ${d.section ? `<div class="section-label mb-1.5">${escHtml(d.section)}</div>` : ""}
        <div class="text-[0.88rem] text-slate-300 group-hover:text-white font-medium leading-snug">${escHtml(d.title)}</div>
      </a>`).join("\n");
    return `<section class="mb-10">
      <div class="flex items-center gap-3 mb-3">
        <h2 class="section-label">${escHtml(g.label)}</h2>
        <div class="flex-1 h-px bg-white/[0.05]"></div>
        <span class="text-[0.6rem] text-slate-700 tabular-nums">${g.items.length}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${grid}</div>
    </section>`;
  }).join("\n");

  const body = `
    <header class="mb-10">
      <div class="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cyan-700 mb-3">NVIDIA / PTX ISA</div>
      <h1 class="text-[1.5rem] sm:text-[2.2rem] font-bold text-white tracking-tight leading-none mb-1">
        PTX ISA <span class="text-cyan-400">v9.2</span>
      </h1>
      <div class="text-[0.6rem] uppercase tracking-[0.15em] text-slate-600 mb-5">Parallel Thread Execution Instruction Set Architecture</div>
      <p class="text-slate-500 text-sm max-w-xl leading-relaxed">
        Community Markdown reference — ${ALL_DOCS.length} pages covering the full PTX instruction set including warp-level MMA, wgmma (Hopper), and TensorCore Gen5 tcgen05 (Blackwell).
      </p>
    </header>

    <!-- MCP Quickstart -->
    <section class="mb-12">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="section-label">MCP Quickstart</h2>
        <div class="flex-1 h-px bg-white/[0.05]"></div>
      </div>
      <p class="text-slate-500 text-sm mb-5 leading-relaxed max-w-xl">
        Add the hosted MCP server to your AI client to let it query PTX ISA docs directly.
      </p>

      <!-- Tabs -->
      <div x-data="{ tab: 'http' }" class="space-y-3">

        <!-- Tab buttons -->
        <div class="flex flex-wrap gap-1.5 mb-1">
          <button onclick="showTab('http', this)" id="tab-btn-http"
            class="tab-btn active px-3 py-1.5 text-[0.7rem] font-mono rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 transition-all">
            HTTP (Claude Desktop)
          </button>
          <button onclick="showTab('stdio', this)" id="tab-btn-stdio"
            class="tab-btn px-3 py-1.5 text-[0.7rem] font-mono rounded border border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/[0.15] transition-all">
            stdio via mcp-remote (Claude Code)
          </button>
          <button onclick="showTab('local', this)" id="tab-btn-local"
            class="tab-btn px-3 py-1.5 text-[0.7rem] font-mono rounded border border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/[0.15] transition-all">
            Self-hosted
          </button>
        </div>

        <!-- Tab panels -->
        <div id="tab-http" class="tab-panel">
          <p class="text-[0.78rem] text-slate-600 mb-2 font-mono">~/.claude/claude_desktop_config.json</p>
          <div class="relative">
            <button onclick="copyCode('code-http')" class="absolute top-2.5 right-3 text-[0.62rem] text-slate-600 hover:text-slate-300 font-mono transition-colors">copy</button>
            <pre id="code-http" class="bg-[#060d1a] border border-cyan-900/30 rounded-lg px-5 py-4 text-[0.84rem] font-mono text-cyan-200 leading-relaxed overflow-x-auto">{
  "mcpServers": {
    "ptx-isa": {
      "type": "http",
      "url": "https://ptx.poole.ai/mcp"
    }
  }
}</pre>
          </div>
        </div>

        <div id="tab-stdio" class="tab-panel hidden">
          <p class="text-[0.78rem] text-slate-600 mb-2 font-mono">~/.claude.json  (or claude mcp add)</p>
          <div class="relative">
            <button onclick="copyCode('code-stdio')" class="absolute top-2.5 right-3 text-[0.62rem] text-slate-600 hover:text-slate-300 font-mono transition-colors">copy</button>
            <pre id="code-stdio" class="bg-[#060d1a] border border-cyan-900/30 rounded-lg px-5 py-4 text-[0.84rem] font-mono text-cyan-200 leading-relaxed overflow-x-auto">{
  "mcpServers": {
    "ptx-isa": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://ptx.poole.ai/mcp"]
    }
  }
}</pre>
          </div>
        </div>

        <div id="tab-local" class="tab-panel hidden">
          <p class="text-[0.78rem] text-slate-600 mb-2 font-mono">Run locally with Bun, point your client at it</p>
          <div class="relative">
            <button onclick="copyCode('code-local')" class="absolute top-2.5 right-3 text-[0.62rem] text-slate-600 hover:text-slate-300 font-mono transition-colors">copy</button>
            <pre id="code-local" class="bg-[#060d1a] border border-cyan-900/30 rounded-lg px-5 py-4 text-[0.84rem] font-mono text-cyan-200 leading-relaxed overflow-x-auto">cd mcp-server
bun install &amp;&amp; bun run sync-docs
bun run start   # http://localhost:3000

# MCP config:
{
  "mcpServers": {
    "ptx-isa": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-server/server.ts"]
    }
  }
}</pre>
          </div>
        </div>
      </div>

      <!-- Tools reference -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div class="doc-card rounded-lg p-3.5">
          <div class="text-cyan-400 font-mono text-[0.75rem] font-semibold mb-1">list_pages</div>
          <div class="text-slate-500 text-[0.78rem] leading-snug">List all pages, optionally filtered by keyword</div>
        </div>
        <div class="doc-card rounded-lg p-3.5">
          <div class="text-cyan-400 font-mono text-[0.75rem] font-semibold mb-1">read_page</div>
          <div class="text-slate-500 text-[0.78rem] leading-snug">Read a page&apos;s full Markdown by slug</div>
        </div>
        <div class="doc-card rounded-lg p-3.5">
          <div class="text-cyan-400 font-mono text-[0.75rem] font-semibold mb-1">search</div>
          <div class="text-slate-500 text-[0.78rem] leading-snug">Relevance-ranked full-text search with contextual snippets</div>
        </div>
      </div>
    </section>

    <script>
      function showTab(name, btn) {
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active', 'border-cyan-500/40', 'bg-cyan-500/10', 'text-cyan-300');
          b.classList.add('border-white/[0.08]', 'bg-white/[0.03]', 'text-slate-500');
        });
        document.getElementById('tab-' + name).classList.remove('hidden');
        btn.classList.add('active', 'border-cyan-500/40', 'bg-cyan-500/10', 'text-cyan-300');
        btn.classList.remove('border-white/[0.08]', 'bg-white/[0.03]', 'text-slate-500');
      }
      function copyCode(id) {
        const text = document.getElementById(id).innerText;
        navigator.clipboard.writeText(text).then(() => {
          const btn = event.target;
          const orig = btn.innerText;
          btn.innerText = 'copied!';
          setTimeout(() => btn.innerText = orig, 1500);
        });
      }
    </script>

    ${cards}
    <footer class="mt-16 pt-6 border-t border-white/[0.05] text-[0.65rem] text-slate-700 uppercase tracking-widest">
      Unofficial reformatting &mdash;
      <a href="https://docs.nvidia.com/cuda/parallel-thread-execution/index.html" class="text-slate-600 hover:text-slate-400 underline transition-colors">NVIDIA official docs</a>
    </footer>`;

  return shell("Overview", body);
}

// ---------------------------------------------------------------------------
// Doc page
// ---------------------------------------------------------------------------

function renderDoc(slug: string): Response {
  const entry = DOC_MAP.get(slug);
  if (!entry) return new Response("Not found", { status: 404 });

  const raw = bunReadText(`${DOCS_ROOT}/${entry.path}`);
  const html = mdToHtml(raw);

  const breadcrumb = entry.crumbs.map((part, i) => {
    if (i === entry.crumbs.length - 1)
      return `<span class="text-slate-400">${escHtml(part)}</span>`;
    const partSlug = entry.crumbs.slice(0, i + 1).join("/");
    return `<a href="/docs/${partSlug}" class="text-slate-700 hover:text-slate-400 transition-colors">${escHtml(part)}</a>`;
  }).join('<span class="text-slate-800 mx-1.5">/</span>');

  const body = `
    <nav class="text-[0.65rem] font-mono mb-8 flex items-center flex-wrap gap-0.5 uppercase tracking-wider text-slate-700">${breadcrumb}</nav>
    <article class="pb-4">${html}</article>
    <footer class="mt-14 pt-5 border-t border-white/[0.05] text-[0.62rem] text-slate-800 font-mono uppercase tracking-widest">${escHtml(entry.path)}</footer>`;

  return new Response(shell(entry.title, body, slug), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const router = AutoRouter();

// Web UI
router.get("/", () => new Response(renderIndex(), { headers: { "Content-Type": "text/html; charset=utf-8" } }));

router.get("/docs/*", (req) => {
  const raw = new URL(req.url).pathname.replace(/^\/docs\//, "");
  const slug = safeSlug(raw);
  if (!slug) return new Response("Invalid path", { status: 400 });
  return renderDoc(slug);
});

// REST API
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

// Static assets
const STATIC_ROOT = import.meta.dir + "/static";
router.get("/static/*", (req) => {
  const rel = new URL(req.url).pathname.replace(/^\/static\//, "");
  // basic path traversal guard
  if (/(?:^|\/)\.\./.test(rel) || rel.includes("\x00")) return new Response("Invalid path", { status: 400 });
  const absPath = `${STATIC_ROOT}/${rel}`;
  try {
    const file = Bun.file(absPath);
    return new Response(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

// og-image.png shortcut at root level
router.get("/og-image.png", () => {
  try {
    return new Response(Bun.file(`${STATIC_ROOT}/og-image.png`));
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

// Raw markdown
router.get("/raw/*", (req) => {
  const raw = new URL(req.url).pathname.replace(/^\/raw\//, "");
  const slug = safeSlug(raw);
  if (!slug) return new Response("Invalid path", { status: 400 });
  const result = toolRead({ slug }) as Record<string, unknown>;
  if (result.error) return new Response(result.error as string, { status: 404 });
  return new Response(result.content as string, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
});

// MCP over HTTP — streamable HTTP transport (MCP spec 2024-11-05)
// GET → 405 (we are stateless, no SSE session needed)
// POST → respond with JSON or SSE stream depending on Accept header
router.get("/mcp", () =>
  new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST", "Access-Control-Allow-Origin": "*" },
  })
);

router.post("/mcp", async (req) => {
  const body = await req.json();
  const resp = handleMcpRequest(body);
  if (!resp) return new Response(null, { status: 204 });

  const accept = req.headers.get("Accept") ?? "";

  // If client accepts SSE, wrap in an SSE stream (streamable HTTP transport)
  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: message\ndata: ${resp}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Plain JSON response
  return new Response(resp, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

router.all("*", () => error(404, "Not found"));

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Bun.serve({ port: HTTP_PORT, fetch: router.fetch });
console.error(`[ptx-isa] http://localhost:${HTTP_PORT}`);

// Stdio MCP transport — skip on Railway or when --http flag is passed
const httpOnly = process.argv.includes("--http") || !!process.env.PORT;

if (httpOnly) {
  console.error("[ptx-isa] HTTP-only mode (stdio MCP disabled).");
} else if (process.stdin.isTTY) {
  console.error("[ptx-isa] stdin is a TTY — stdio MCP skipped. Pipe input or use --http.");
} else {
  console.error("[ptx-isa] stdio MCP transport active.");
  startStdioTransport();
}
