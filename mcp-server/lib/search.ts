/**
 * Section-level BM25F search over the PTX ISA pages, with PTX-aware
 * tokenisation and byte-budgeted hotspot snippets.
 */

import { ALL_DOCS, parseHeading, type DocEntry, type DocSection } from "./docs";

// ---------------------------------------------------------------------------
// Tokenisation
// ---------------------------------------------------------------------------

/** Matches PTX-ish identifiers: `cp.async.bulk.tensor`, `.shared::cluster`, `%tid.x`, `m64n128k16`, `9.7.18.10` */
const IDENT_RE = /[%.]?[A-Za-z0-9_]+(?:(?:\.|::)[A-Za-z0-9_]+)*/g;

const STOP = new Set([
  "the", "a", "an", "of", "and", "or", "to", "in", "is", "are", "for", "on", "with", "by", "as", "be",
  "that", "this", "it", "its", "if", "at", "from", "which", "not", "can", "may", "must", "than", "then",
  "when", "where", "into", "each", "all", "any", "will", "has", "have", "was", "were", "been", "also",
]);

/**
 * Expand one identifier into index tokens:
 *   cp.async.bulk.tensor → [cp.async.bulk.tensor, cp.async.bulk, cp.async, cp, async, bulk, tensor]
 *   .shared::cluster     → [shared::cluster, shared, cluster]
 *   %tid.x               → [tid.x, tid, x]
 */
export function expandIdent(raw: string): string[] {
  let s = raw.toLowerCase().replace(/^[%.]+/, "");
  if (!s) return [];
  const parts = s.split(/\.|::/).filter(Boolean);
  const out = new Set<string>();
  out.add(s);
  if (parts.length > 1) {
    // dotted prefixes
    const seps = s.match(/\.|::/g) ?? [];
    let acc = parts[0];
    for (let i = 1; i < parts.length - 1; i++) {
      acc += seps[i - 1] + parts[i];
      out.add(acc);
    }
    for (const p of parts) out.add(p);
  }
  return [...out].filter((t) => !STOP.has(t));
}

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(IDENT_RE)) out.push(...expandIdent(m[0]));
  return out;
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

interface Chunk {
  doc: DocEntry;
  sec: DocSection;
  /** term → tf (body) */
  tf: Map<string, number>;
  /** term → tf (heading path + page title) */
  tfTitle: Map<string, number>;
  len: number;
  textLower: string;
}

const CHUNKS: Chunk[] = [];
const DF = new Map<string, number>();
let AVG_LEN = 1;

function countTerms(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Text used for indexing and snippets: drop image links, table rules and horizontal rules. */
export function cleanBody(body: string): string {
  return body
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")                 // images (caption stays as its own paragraph)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")                 // links: keep the text, drop the target
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, "") // table separator rows
    .replace(/^\s*-{3,}\s*$/gm, "")                            // horizontal rules
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

(function build() {
  let total = 0;
  for (const doc of ALL_DOCS) {
    for (const sec of doc.sections) {
      sec.body = cleanBody(sec.body);
      const bodyTokens = tokenize(sec.body);
      const titleTokens = tokenize([doc.title, ...sec.path].join(" "));
      const tf = countTerms(bodyTokens);
      const tfTitle = countTerms(titleTokens);
      const chunk: Chunk = { doc, sec, tf, tfTitle, len: bodyTokens.length, textLower: sec.body.toLowerCase() };
      CHUNKS.push(chunk);
      total += bodyTokens.length;
      const seen = new Set<string>([...tf.keys(), ...tfTitle.keys()]);
      for (const t of seen) DF.set(t, (DF.get(t) ?? 0) + 1);
    }
  }
  AVG_LEN = Math.max(1, total / Math.max(1, CHUNKS.length));
})();

const K1 = 1.2;
const B = 0.75;
const TITLE_WEIGHT = 2.5;

function idf(term: string): number {
  const n = CHUNKS.length;
  const df = DF.get(term) ?? 0;
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export interface SearchHit {
  slug: string;
  title: string;
  section: string | null;
  heading: string;
  headingNumber: string | null;
  anchor: string;
  line: number;
  score: number;
  snippet: string;
}

export interface SearchOptions {
  maxResults?: number;
  maxBytes?: number;
  scope?: string;         // slug prefix filter
  snippetChars?: number;
}

interface QueryInfo {
  /** Tokens actually used for scoring (full identifiers + their parts) */
  terms: string[];
  /** The full identifiers typed by the user (highest weight) */
  full: string[];
  phrase: string;
  /** Set when the query is a bare section number such as "9.7.18.10" */
  sectionNumber: string | null;
}

function parseQuery(q: string): QueryInfo {
  const full: string[] = [];
  const terms = new Set<string>();
  for (const m of q.matchAll(IDENT_RE)) {
    const toks = expandIdent(m[0]);
    if (!toks.length) continue;
    full.push(toks[0]);
    for (const t of toks) terms.add(t);
  }
  const trimmed = q.trim();
  const sectionNumber = /^\d+(\.\d+)*\.?$/.test(trimmed) ? trimmed.replace(/\.$/, "") : null;
  return { terms: [...terms], full, phrase: trimmed.toLowerCase(), sectionNumber };
}

function scoreChunk(c: Chunk, qi: QueryInfo): { score: number; matched: number } {
  let score = 0;
  let matched = 0;
  const norm = K1 * (1 - B + B * (c.len / AVG_LEN));
  for (const t of qi.terms) {
    const tfb = c.tf.get(t) ?? 0;
    const tft = c.tfTitle.get(t) ?? 0;
    if (!tfb && !tft) continue;
    matched++;
    const tfw = tfb + TITLE_WEIGHT * tft;
    const w = idf(t) * ((tfw * (K1 + 1)) / (tfw + norm));
    // Full identifiers typed by the user matter more than their components.
    score += qi.full.includes(t) ? w * 1.6 : w;
  }
  return { score, matched };
}

export function search(query: string, opts: SearchOptions = {}): { hits: SearchHit[]; totalMatches: number; terms: string[] } {
  const qi = parseQuery(query);
  if (!qi.terms.length) return { hits: [], totalMatches: 0, terms: [] };
  const scope = opts.scope?.replace(/^\/+|\/+$/g, "").toLowerCase();
  const maxResults = Math.max(1, Math.min(opts.maxResults ?? 8, 50));

  const scored: Array<{ c: Chunk; score: number }> = [];
  for (const c of CHUNKS) {
    if (scope && !c.doc.slug.toLowerCase().startsWith(scope)) continue;
    const { score, matched } = scoreChunk(c, qi);
    if (!score) continue;
    let s = score * (0.4 + 0.6 * (matched / qi.terms.length));
    if (qi.phrase.length > 2 && (c.textLower.includes(qi.phrase) || c.sec.heading.toLowerCase().includes(qi.phrase))) s *= 1.35;
    // Page-level name match (the page documents exactly this instruction)
    if (c.doc.names.some((n) => qi.full.includes(n.toLowerCase().replace(/^[%.]+/, "")))) s *= 1.25;
    // Section-number queries are navigational: the section itself, then its children in order.
    if (qi.sectionNumber) {
      const n = c.sec.number ?? "";
      if (n === qi.sectionNumber) s = 1e6;
      else if (n.startsWith(qi.sectionNumber + ".")) s = 1e5 - n.split(".").length * 1e3 - (parseInt(n.slice(qi.sectionNumber.length + 1), 10) || 0);
      else if (c.doc.section === qi.sectionNumber || c.doc.section?.startsWith(qi.sectionNumber + ".")) s = 1e4 + s;
      else continue;
    }
    // Link lists ("## Pages") are navigation, not content.
    if (/^pages$/i.test(c.sec.heading)) s *= 0.35;
    scored.push({ c, score: s });
  }
  scored.sort((a, b) => b.score - a.score);

  // Diversify: at most 3 sections per page in the top results.
  const perPage = new Map<string, number>();
  const picked: Array<{ c: Chunk; score: number }> = [];
  for (const s of scored) {
    const n = perPage.get(s.c.doc.slug) ?? 0;
    if (n >= 3) continue;
    perPage.set(s.c.doc.slug, n + 1);
    picked.push(s);
    if (picked.length >= maxResults) break;
  }

  const hits = picked.map(({ c, score }) => ({
    slug: c.doc.slug,
    title: c.doc.title,
    section: c.doc.section,
    heading: c.sec.heading,
    headingNumber: c.sec.number,
    anchor: c.sec.anchor,
    line: c.sec.line,
    score: Math.round(score * 100) / 100,
    snippet: makeSnippet(c, qi, opts.snippetChars ?? 230),
  }));
  return { hits, totalMatches: scored.length, terms: qi.terms };
}

// ---------------------------------------------------------------------------
// Snippets with hotspots
// ---------------------------------------------------------------------------

interface Hit { start: number; end: number; term: string; }

function findHits(text: string, qi: QueryInfo): Hit[] {
  const want = new Set(qi.terms);
  const hits: Hit[] = [];
  for (const m of text.matchAll(IDENT_RE)) {
    const toks = expandIdent(m[0]);
    const hit = toks.find((t) => want.has(t));
    if (hit) hits.push({ start: m.index!, end: m.index! + m[0].length, term: toks[0] });
  }
  return hits;
}

/** Collapse whitespace while keeping table pipes and code readable. */
function squash(s: string): string {
  return s.replace(/```\w*/g, " ").replace(/\s*\n\s*/g, " ⏎ ").replace(/[ \t]+/g, " ").replace(/(?: ⏎ ){2,}/g, " ⏎ ").trim();
}

export function makeSnippet(c: Chunk, qi: QueryInfo, width: number): string {
  const text = c.sec.body;
  if (!text) return "";
  const hits = findHits(text, qi);
  if (!hits.length) {
    return squash(text.slice(0, width)) + (text.length > width ? "…" : "");
  }
  // Choose the window that covers the most distinct query identifiers, then most hits.
  let best = { start: 0, distinct: 0, count: 0 };
  for (let i = 0; i < hits.length; i++) {
    const start = Math.max(0, hits[i].start - Math.floor(width * 0.25));
    const end = start + width;
    const inWin = hits.filter((h) => h.start >= start && h.end <= end);
    const distinct = new Set(inWin.map((h) => h.term)).size;
    if (distinct > best.distinct || (distinct === best.distinct && inWin.length > best.count)) {
      best = { start, distinct, count: inWin.length };
    }
  }
  let start = best.start;
  let end = Math.min(text.length, start + width);
  // Snap to word boundaries
  if (start > 0) { const sp = text.lastIndexOf(" ", start + 12); if (sp > start - 12 && sp >= 0) start = sp + 1; }
  if (end < text.length) { const sp = text.indexOf(" ", end - 12); if (sp !== -1 && sp < end + 12) end = sp; }

  // Mark hotspots inside the window
  let out = "";
  let cursor = start;
  for (const h of hits) {
    if (h.start < start || h.end > end) continue;
    out += text.slice(cursor, h.start) + "«" + text.slice(h.start, h.end) + "»";
    cursor = h.end;
  }
  out += text.slice(cursor, end);
  return (start > 0 ? "…" : "") + squash(out) + (end < text.length ? "…" : "");
}

// ---------------------------------------------------------------------------
// Compact text rendering for LLM consumption (byte-budgeted)
// ---------------------------------------------------------------------------

export function renderSearchText(query: string, res: ReturnType<typeof search>, maxBytes: number): string {
  const enc = new TextEncoder();
  const budget = Math.max(512, Math.min(maxBytes, 65536));
  const lines: string[] = [];
  const header = res.hits.length
    ? `PTX ISA 9.4 search "${query}": showing ${res.hits.length} of ${res.totalMatches} matching sections. ` +
      `Hotspots are marked «like this». Read a hit with read_ptx_isa_page(slug, section=<heading number>).`
    : `PTX ISA 9.4 search "${query}": no matching sections. Try an instruction name (e.g. "tcgen05.mma"), a qualifier ("scale_vec::4X"), or a concept ("async proxy fence").`;
  lines.push(header);
  let used = enc.encode(header).length + 1;
  let shown = 0;
  for (let i = 0; i < res.hits.length; i++) {
    const h = res.hits[i];
    const where = h.headingNumber ? `§${h.headingNumber} ` : h.section ? `§${h.section} ` : "";
    const headTitle = parseHeading(h.heading).title;
    const pageTitle = parseHeading(h.title).title;
    const ctx = headTitle === pageTitle ? headTitle : `${pageTitle} › ${headTitle}`;
    const secArg = h.headingNumber ?? (headTitle !== pageTitle ? headTitle : "");
    const entry = `${i + 1}. ${h.slug}${secArg ? `  section="${secArg}"` : ""}\n   [${where}${ctx}]\n   ${h.snippet}`;
    const bytes = enc.encode(entry).length + 1;
    if (used + bytes > budget && shown > 0) {
      lines.push(`… ${res.hits.length - shown} more hits omitted to stay under ${budget} bytes; raise max_bytes or narrow the query/scope.`);
      break;
    }
    lines.push(entry);
    used += bytes;
    shown++;
  }
  return lines.join("\n");
}
