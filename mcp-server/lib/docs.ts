/**
 * Document index: walks the docs tree, parses titles/section numbers,
 * splits pages into heading-delimited sections, and resolves names.
 */

import { readdirSync, statSync, readFileSync } from "node:fs";

export const DOCS_ROOT = import.meta.dir + "/../docs";

export interface DocSection {
  /** Heading text without the leading #s, e.g. "9.7.1.1. Integer Arithmetic Instructions: add" */
  heading: string;
  level: number;
  /** Section number parsed from the heading, e.g. "9.7.1.1" (no trailing dot), or null */
  number: string | null;
  /** GitHub-style anchor id */
  anchor: string;
  /** 1-based line of the heading in the page */
  line: number;
  /** Body text of the section, exclusive of nested sub-headings' bodies */
  body: string;
  /** Full heading path, outermost first */
  path: string[];
}

export interface DocEntry {
  path: string;        // relative from DOCS_ROOT, with .md
  slug: string;        // path without .md
  title: string;       // heading text without the section number
  section: string | null;
  dir: string;         // directory part of slug ("" for root)
  crumbs: string[];
  /** Names this page documents: instruction / directive / register names, e.g. ["cp.async.bulk.tensor"] */
  names: string[];
  content: string;
  sections: DocSection[];
  sortKey: Array<number | string>;
}

const WALK_SKIP = new Set(["node_modules", ".git"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (WALK_SKIP.has(name) || name.startsWith(".")) continue;
    const full = `${dir}/${name}`;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".md") && st.size > 0) out.push(full);
  }
  return out;
}

export function readText(absPath: string): string {
  return readFileSync(absPath, "utf8");
}

/** GitHub-compatible heading anchor. */
export function anchorFor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N} \-]/gu, "")
    .replace(/ /g, "-");
}

const SECTION_RE = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/;

export function parseHeading(raw: string): { title: string; number: string | null } {
  const text = raw.trim();
  const m = text.match(SECTION_RE);
  if (m) return { title: m[2].trim(), number: m[1] };
  return { title: text, number: null };
}

/** "Integer Arithmetic Instructions: add" → ["add"]; "Special Registers: %clock, %clock_hi" → ["%clock","%clock_hi"] */
export function namesFromTitle(title: string): string[] {
  const idx = title.lastIndexOf(":");
  if (idx < 0) return [];
  const tail = title.slice(idx + 1).trim();
  if (!tail) return [];
  return tail
    .split(/\s*(?:,|\/|\band\b)\s*/)
    .map((s) => s.replace(/\(.*?\)/g, "").trim())
    .filter((s) => s.length > 0 && /^[%.\w@{}:]+$/.test(s));
}

export function splitSections(content: string): DocSection[] {
  const lines = content.split("\n");
  const sections: DocSection[] = [];
  const stack: Array<{ level: number; heading: string }> = [];
  let inCode = false;
  let current: DocSection | null = null;
  const bodies: string[][] = [];

  const push = (sec: DocSection) => {
    sections.push(sec);
    bodies.push([]);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) inCode = !inCode;
    const hm = !inCode ? line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/) : null;
    if (hm) {
      const level = hm[1].length;
      const heading = hm[2].trim();
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, heading });
      const { number } = parseHeading(heading);
      current = {
        heading,
        level,
        number,
        anchor: anchorFor(heading),
        line: i + 1,
        body: "",
        path: stack.map((s) => s.heading),
      };
      push(current);
      continue;
    }
    if (!current) {
      // Preamble before any heading
      current = { heading: "", level: 0, number: null, anchor: "", line: 1, body: "", path: [] };
      push(current);
    }
    bodies[bodies.length - 1].push(line);
  }
  for (let i = 0; i < sections.length; i++) sections[i].body = bodies[i].join("\n").trim();
  return sections.filter((s) => s.heading !== "" || s.body !== "");
}

function sectionTuple(num: string | null): number[] {
  return num ? num.split(".").map((n) => parseInt(n, 10)) : [];
}

function compareKeys(a: Array<number | string>, b: Array<number | string>): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (typeof x === "number" && typeof y === "number") { if (x !== y) return x - y; continue; }
    if (typeof x === "number") return -1;
    if (typeof y === "number") return 1;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function buildIndex(): DocEntry[] {
  const docs: DocEntry[] = [];
  for (const abs of walk(DOCS_ROOT)) {
    const rel = abs.slice(DOCS_ROOT.length + 1).replace(/\\/g, "/");
    if (rel === "README.md") continue; // the site/overview README is served separately
    const slug = rel.replace(/\.md$/, "");
    const content = readText(abs);
    const sections = splitSections(content);
    const first = sections.find((s) => s.level === 1) ?? sections.find((s) => s.heading);
    const base = slug.split("/").pop() ?? slug;
    let title: string, section: string | null;
    if (first) ({ title, number: section } = parseHeading(first.heading));
    else { title = base.replace(/^\d+-/, "").replace(/-/g, " "); section = null; }
    const dir = slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : "";
    const names = first ? namesFromTitle(parseHeading(first.heading).title) : [];
    // Pages whose file name is an instruction name (dots→hyphens) also answer to that name.
    if (base !== "README" && !/^\d+-/.test(base)) {
      const fromFile = base.replace(/-/g, ".");
      if (!names.includes(fromFile)) names.push(fromFile);
    }
    const isReadme = base === "README";
    const sortKey: Array<number | string> = [
      ...dir.split("/").filter(Boolean).map((p) => p),
      isReadme ? -1 : 0,
      ...sectionTuple(section),
      base,
    ];
    docs.push({ path: rel, slug, title, section, dir, crumbs: slug.split("/"), names, content, sections, sortKey });
  }
  docs.sort((a, b) => compareKeys(a.sortKey, b.sortKey));
  return docs;
}

export const ALL_DOCS: DocEntry[] = buildIndex();
export const DOC_MAP = new Map<string, DocEntry>(ALL_DOCS.map((d) => [d.slug, d]));
export const README_CONTENT: string = (() => {
  try { return readText(`${DOCS_ROOT}/README.md`); } catch { return "# PTX ISA\n"; }
})();

export function safeSlug(raw: string): string | null {
  const slug = raw.replace(/^\/+|\/+$/g, "").replace(/\.md$/, "");
  if (/(?:^|\/)\.\.(?:\/|$)|\x00/.test(slug)) return null;
  return slug;
}

/**
 * Resolve a user-supplied reference (slug, file name, instruction/directive/register name,
 * or section number) to candidate pages, best first.
 */
export function resolvePages(ref: string): { exact: DocEntry | null; candidates: DocEntry[] } {
  const q = ref.trim();
  if (!q) return { exact: null, candidates: [] };
  const slug = safeSlug(q);
  if (slug && DOC_MAP.has(slug)) return { exact: DOC_MAP.get(slug)!, candidates: [DOC_MAP.get(slug)!] };

  const lower = q.toLowerCase().replace(/^\/+/, "");
  const bare = lower.replace(/^[.%@]+/, "");

  // Section number ("9.7.18.10.10.1")
  if (/^\d+(\.\d+)*\.?$/.test(lower)) {
    const num = lower.replace(/\.$/, "");
    const exact = ALL_DOCS.find((d) => d.section === num) ?? null;
    const withSection = ALL_DOCS.filter((d) => d.sections.some((s) => s.number === num));
    const prefix = ALL_DOCS.filter((d) => d.section?.startsWith(num + "."));
    const candidates = uniq([...(exact ? [exact] : []), ...withSection, ...prefix]);
    return { exact: exact ?? (withSection.length === 1 ? withSection[0] : null), candidates };
  }

  // Instruction / directive / register name: exact match on page names
  const nameMatches = ALL_DOCS.filter((d) =>
    d.names.some((n) => n.toLowerCase() === lower || n.toLowerCase().replace(/^[.%@]+/, "") === bare)
  );
  if (nameMatches.length) {
    // Also surface the family (cp.async.bulk → cp.async.bulk.tensor, …) as related candidates.
    const family = ALL_DOCS.filter((d) =>
      !nameMatches.includes(d) &&
      d.names.some((n) => { const nl = n.toLowerCase().replace(/^[%.]+/, ""); return nl.startsWith(bare + ".") || nl.startsWith(bare + "::"); })
    );
    return { exact: nameMatches.length === 1 ? nameMatches[0] : null, candidates: [...nameMatches, ...family] };
  }

  // Slug suffix / basename match ("18-tcgen05/tcgen05-mma", "tcgen05-mma")
  const dashed = bare.replace(/\./g, "-").replace(/::/g, "-");
  const tailMatches = ALL_DOCS.filter((d) => d.slug.toLowerCase() === lower || d.slug.toLowerCase().endsWith("/" + lower) || d.slug.toLowerCase().endsWith("/" + dashed));
  if (tailMatches.length) return { exact: tailMatches.length === 1 ? tailMatches[0] : null, candidates: tailMatches };

  // Prefix of a name ("mbarrier" → all mbarrier.* pages; "cp.async.bulk" → bulk family)
  const prefixMatches = ALL_DOCS.filter((d) =>
    d.names.some((n) => {
      const nl = n.toLowerCase().replace(/^[.%@]+/, "");
      return nl.startsWith(bare + ".") || nl.startsWith(bare + "::") || nl.startsWith(bare + "_") || nl === bare;
    })
  );
  if (prefixMatches.length) return { exact: null, candidates: prefixMatches };

  // Loose: slug or title contains the query
  const loose = ALL_DOCS.filter((d) => d.slug.toLowerCase().includes(dashed) || d.title.toLowerCase().includes(lower));
  return { exact: loose.length === 1 ? loose[0] : null, candidates: loose.slice(0, 25) };
}

function uniq<T>(xs: T[]): T[] {
  const seen = new Set<T>();
  return xs.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
}

/** Find a section inside a page by number, anchor, or heading text. */
export function findSection(doc: DocEntry, ref: string): DocSection | null {
  const q = ref.trim().toLowerCase().replace(/^#/, "");
  if (!q) return null;
  const num = q.replace(/\.$/, "");
  return (
    doc.sections.find((s) => s.number === num) ??
    doc.sections.find((s) => s.anchor === q) ??
    doc.sections.find((s) => s.heading.toLowerCase() === q) ??
    doc.sections.find((s) => parseHeading(s.heading).title.toLowerCase() === q) ??
    doc.sections.find((s) => s.heading.toLowerCase().includes(q)) ??
    null
  );
}

/** Markdown text of a section including all of its nested sub-sections. */
export function sectionText(doc: DocEntry, sec: DocSection): string {
  const lines = doc.content.split("\n");
  const start = sec.line - 1;
  let end = lines.length;
  let inCode = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    const hm = line.match(/^(#{1,6})\s+/);
    if (hm && hm[1].length <= sec.level) { end = i; break; }
  }
  return lines.slice(start, end).join("\n").trim();
}
