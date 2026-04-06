/**
 * PTX ISA v9.2 — Human-readable documentation browser
 *
 * A clean, Tailwind-styled single-page app for browsing the PTX ISA docs.
 * Renders Markdown to HTML in-process. No build step, no extra npm deps.
 *
 * Run:  bun run web.ts
 *       bun run web.ts --port 4000
 */

import { AutoRouter, error } from "itty-router";
import { readdirSync, statSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DOCS_ROOT = import.meta.dir + "/docs";
const port = (() => {
  const i = process.argv.indexOf("--port");
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : 4000;
})();

// ---------------------------------------------------------------------------
// Filesystem helpers (Bun's node:fs compat — no npm fs dep)
// ---------------------------------------------------------------------------

function bunReadText(absPath: string): string {
  return readFileSync(absPath, "utf8");
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
  // Match first heading of any level (H1 preferred, fall back to H2/H3)
  const m = src.match(/^#{1,3}\s+(.+)$/m);
  if (!m) {
    // Derive from filename slug: strip leading digits/dashes, replace dashes with spaces, title-case
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

const ALL_DOCS: DocEntry[] = bunWalk(DOCS_ROOT).map((abs) => {
  const rel = abs.slice(DOCS_ROOT.length + 1).replace(/\\/g, "/");
  const slug = rel.replace(/\.md$/, "");
  const { title, section } = extractTitle(bunReadText(abs), slug);
  return { path: rel, slug, title, section, crumbs: slug.split("/") };
});

const DOC_MAP = new Map<string, DocEntry>(ALL_DOCS.map((d) => [d.slug, d]));

// ---------------------------------------------------------------------------
// Lightweight Markdown → HTML renderer (zero deps)
// ---------------------------------------------------------------------------

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineHtml(raw: string): string {
  let s = escHtml(raw);
  s = s.replace(/`([^`]+)`/g, '<code class="bg-[#0d1a2d] text-cyan-300 border border-cyan-900/40 px-1.5 py-px rounded text-[0.82em] font-mono">$1</code>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  s = s.replace(/\*(.+?)\*/g, "<em class=\"italic\">$1</em>");
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
    out.push(`<div class="relative my-5">${lang}<pre class="bg-[#060d1a] border border-cyan-900/30 rounded-lg p-5 overflow-x-auto text-[0.82rem] font-mono text-cyan-200 leading-relaxed shadow-[inset_0_1px_0_0_rgba(99,179,237,0.05)]"><code>${codeLines.map(escHtml).join("\n")}</code></pre></div>`);
    inCode = false; codeLang = ""; codeLines = [];
  }
  function flushTable() {
    if (!inTable) return;
    out.push('<div class="overflow-x-auto my-5 rounded-lg border border-white/[0.06]"><table class="w-full text-sm border-collapse">');
    if (tableHead) {
      out.push("<thead><tr>");
      tableHead.forEach(c => out.push(`<th class="text-left px-4 py-2.5 bg-white/[0.04] text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400 border-b border-white/[0.06]">${inlineHtml(c.trim())}</th>`));
      out.push("</tr></thead>");
    }
    out.push("<tbody>");
    tableRows.forEach((row) => {
      out.push('<tr class="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">');
      row.forEach(c => out.push(`<td class="px-4 py-2.5 text-slate-300 text-sm">${inlineHtml(c.trim())}</td>`));
      out.push("</tr>");
    });
    out.push("</tbody></table></div>");
    inTable = false; tableHead = null; tableRows = [];
  }
  function flushBq() {
    if (!inBq) return;
    out.push('<blockquote class="border-l-[2px] border-cyan-500/30 pl-5 my-4 text-slate-400 italic text-sm space-y-1 bg-cyan-500/[0.03] py-3 rounded-r-lg">');
    bqLines.forEach(l => out.push(`<p>${inlineHtml(l)}</p>`));
    out.push("</blockquote>");
    inBq = false; bqLines = [];
  }
  function flushList() {
    if (!inList) return;
    const tag = listOrdered ? "ol" : "ul";
    const cls = listOrdered
      ? 'class="list-decimal list-outside ml-5 my-3 space-y-1 text-slate-300"'
      : 'class="list-disc list-outside ml-5 my-3 space-y-1 text-slate-300 marker:text-cyan-700"';
    out.push(`<${tag} ${cls}>`);
    listItems.forEach(li => out.push(`<li class="leading-relaxed">${inlineHtml(li)}</li>`));
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
    // Code fence
    if (line.startsWith("```")) {
      if (!inCode) { flushList(); flushTable(); flushBq(); inCode = true; codeLang = line.slice(3).trim(); }
      else flushCode();
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList(); flushTable(); inBq = true; bqLines.push(line.slice(2)); continue;
    }
    if (inBq && line.trim() === "") { flushBq(); out.push(""); continue; }
    if (inBq) { bqLines.push(line.startsWith("> ") ? line.slice(2) : line); continue; }

    // Table
    if (line.trim().startsWith("|") && line.includes("|")) {
      flushList();
      const cells = line.split("|").slice(1, -1);
      if (!inTable) { tableHead = cells; inTable = true; continue; }
      if (cells.every(c => /^[-: ]+$/.test(c))) continue;
      tableRows.push(cells); continue;
    }
    if (inTable && !line.trim().startsWith("|")) flushTable();

    // Lists
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

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushList(); flushTable(); flushBq();
      const lvl = hm[1].length;
      const text = hm[2].trim();
      const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      out.push(`<h${lvl} id="${id}" class="${HEADING_CLS[lvl]}">${inlineHtml(text)}</h${lvl}>`);
      continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) {
      flushList(); flushTable(); flushBq();
      out.push('<hr class="border-white/[0.06] my-8">');
      continue;
    }

    // Empty line
    if (line.trim() === "") { flushList(); flushTable(); flushBq(); out.push(""); continue; }

    // Paragraph
    out.push(`<p class="my-2 text-slate-400 leading-relaxed text-sm">${inlineHtml(line)}</p>`);
  }

  flushList(); flushTable(); flushBq(); flushCode();
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Nav groups
// ---------------------------------------------------------------------------

interface NavGroup { label: string; items: DocEntry[]; }

const NAV_GROUPS: NavGroup[] = [
  { label: "Core Chapters",            items: ALL_DOCS.filter(d => !d.path.startsWith("09-instruction-set/") && d.path !== "README.md") },
  { label: "Chapter 9 — Instruction Set", items: ALL_DOCS.filter(d => d.path.startsWith("09-instruction-set/") && d.crumbs.length === 2) },
  { label: "Warp-Level MMA  §9.7.14",  items: ALL_DOCS.filter(d => d.path.includes("14-warp-level-mma/")) },
  { label: "wgmma  §9.7.15",           items: ALL_DOCS.filter(d => d.path.includes("15-wgmma/")) },
  { label: "tcgen05  §9.7.16",         items: ALL_DOCS.filter(d => d.path.includes("16-tcgen05/")) },
];

// ---------------------------------------------------------------------------
// HTML shell with Tailwind CDN
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
      return `<a href="/docs/${d.slug}" class="flex items-start py-[4px] pr-3 text-[0.75rem] leading-snug transition-all duration-150 ${bg}">${sec}<span class="truncate">${escHtml(d.title)}</span></a>`;
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

    /* Animated gradient background */
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

    /* Sidebar */
    .sidebar {
      background: rgba(7, 13, 26, 0.85);
      border-right: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.2); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(99,179,237,0.4); }

    /* Card hover glow */
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

    /* Prose area */
    .prose-area { max-width: 820px; }

    /* Section label style */
    .section-label {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(148,163,184,0.5);
    }
  </style>
</head>
<body class="h-full text-slate-300 antialiased">
<div class="bg-animated"></div>

<div class="relative z-10 flex h-screen overflow-hidden">

  <!-- Sidebar -->
  <aside class="sidebar w-[15.5rem] flex-shrink-0 flex flex-col overflow-hidden">
    <div class="flex-shrink-0 px-5 py-5 border-b border-white/[0.06]">
      <a href="/" class="block group">
        <div class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-slate-600 mb-1">NVIDIA</div>
        <div class="text-white font-bold text-[0.95rem] tracking-tight leading-none group-hover:text-cyan-300 transition-colors">PTX ISA <span class="text-cyan-400">v9.2</span></div>
        <div class="text-[0.6rem] text-slate-600 mt-1 uppercase tracking-widest">Reference</div>
      </a>
    </div>
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <a href="/" class="flex items-center gap-2 px-3 pl-[12px] py-[5px] text-[0.75rem] text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-l-2 border-transparent hover:border-cyan-700 transition-all duration-150 mb-4">
        <svg class="w-3 h-3 flex-shrink-0 opacity-50" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
        Overview
      </a>
      ${nav}
    </nav>
  </aside>

  <!-- Content -->
  <main class="flex-1 overflow-y-auto">
    <div class="prose-area mx-auto px-10 py-10">
      ${body}
    </div>
  </main>

</div>
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
        <div class="text-[0.82rem] text-slate-300 group-hover:text-white font-medium leading-snug">${escHtml(d.title)}</div>
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
    <header class="mb-12">
      <div class="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cyan-700 mb-3">NVIDIA / PTX ISA</div>
      <h1 class="text-[2.2rem] font-bold text-white tracking-tight leading-none mb-1">
        PTX ISA <span class="text-cyan-400">v9.2</span>
      </h1>
      <div class="text-[0.6rem] uppercase tracking-[0.15em] text-slate-600 mb-5">Parallel Thread Execution Instruction Set Architecture</div>
      <p class="text-slate-500 text-sm max-w-xl leading-relaxed">
        Community Markdown reference — ${ALL_DOCS.length} pages covering the full PTX instruction set including warp-level MMA, wgmma (Hopper), and TensorCore Gen5 tcgen05 (Blackwell).
      </p>
    </header>
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
// Router
// ---------------------------------------------------------------------------

const router = AutoRouter();

router.get("/", () => new Response(renderIndex(), { headers: { "Content-Type": "text/html; charset=utf-8" } }));

router.get("/docs/*", (req) => {
  const slug = new URL(req.url).pathname.replace(/^\/docs\//, "").replace(/\.md$/, "");
  return renderDoc(slug);
});

router.all("*", () => error(404, "Page not found"));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

Bun.serve({ port, fetch: router.fetch });

console.log(`[ptx-isa-web] http://localhost:${port}`);
