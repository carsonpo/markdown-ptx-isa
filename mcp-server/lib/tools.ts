/**
 * MCP tool implementations and definitions for the PTX ISA server.
 */

import {
  ALL_DOCS, DOC_MAP, README_CONTENT, resolvePages, findSection, sectionText, parseHeading,
  type DocEntry,
} from "./docs";
import { search, renderSearchText } from "./search";

export const ISA_VERSION = "9.4";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pageLine(d: DocEntry): string {
  const num = d.section ? `§${d.section} ` : "";
  return `${d.slug}  —  ${num}${d.title}`;
}

function candidateList(cands: DocEntry[], ref: string): string {
  const lines = cands.slice(0, 40).map((d) => `- ${pageLine(d)}`);
  const more = cands.length > 40 ? `\n… and ${cands.length - 40} more; narrow the name or use search_ptx_isa.` : "";
  return `"${ref}" matches ${cands.length} pages. Pick one and call read_ptx_isa_page with its slug:\n${lines.join("\n")}${more}`;
}

// ---------------------------------------------------------------------------
// search_ptx_isa
// ---------------------------------------------------------------------------

export interface SearchArgs { query: string; max_results?: number; max_bytes?: number; scope?: string }

export function toolSearchText(args: SearchArgs): string {
  if (!args.query?.trim()) return "Error: query is required.";
  const res = search(args.query, { maxResults: args.max_results ?? 8, scope: args.scope });
  return renderSearchText(args.query, res, args.max_bytes ?? 4096);
}

export function toolSearchJson(args: SearchArgs): object {
  if (!args.query?.trim()) return { error: "query is required" };
  const res = search(args.query, { maxResults: args.max_results ?? 8, scope: args.scope });
  return {
    query: args.query,
    terms: res.terms,
    total_matches: res.totalMatches,
    results: res.hits.map((h) => ({
      slug: h.slug,
      page_title: h.title,
      page_section: h.section,
      heading: h.heading,
      section: h.headingNumber,
      anchor: h.anchor,
      line: h.line,
      score: h.score,
      snippet: h.snippet,
      url: `/docs/${h.slug}${h.anchor ? "#" + h.anchor : ""}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// read_ptx_isa_page
// ---------------------------------------------------------------------------

export interface ReadArgs { slug: string; section?: string }

export function toolRead(args: ReadArgs): { text: string; slug?: string; error?: string } {
  const ref = (args.slug ?? "").trim();
  if (!ref) return { text: "Error: slug is required.", error: "slug is required" };
  if (ref === "README" || ref === "overview" || ref === "index") {
    return { text: README_CONTENT, slug: "README" };
  }
  const { exact, candidates } = resolvePages(ref);
  if (!exact) {
    if (!candidates.length) {
      return { text: `No page found for "${ref}". Use search_ptx_isa or list_ptx_isa_pages to find a slug.`, error: "not found" };
    }
    return { text: candidateList(candidates, ref), error: "ambiguous" };
  }
  const doc = exact;
  if (args.section?.trim()) {
    const sec = findSection(doc, args.section);
    if (!sec) {
      const avail = doc.sections.filter((s) => s.heading).map((s) => `- ${s.number ? s.number + " " : ""}${parseHeading(s.heading).title}`).join("\n");
      return { text: `Section "${args.section}" not found in ${doc.slug}. Available sections:\n${avail}`, error: "section not found" };
    }
    const header = `<!-- ${doc.slug} › ${sec.heading} (lines ${sec.line}–) -->\n`;
    return { text: header + sectionText(doc, sec), slug: doc.slug };
  }
  const header = `<!-- slug: ${doc.slug} | PTX ISA ${ISA_VERSION} -->\n`;
  return { text: header + doc.content, slug: doc.slug };
}

// ---------------------------------------------------------------------------
// lookup_ptx_instruction
// ---------------------------------------------------------------------------

export function toolLookup(args: { name: string }): string {
  const ref = (args.name ?? "").trim();
  if (!ref) return "Error: name is required.";
  const { exact, candidates } = resolvePages(ref);
  if (!candidates.length) return `No page documents "${ref}". Try search_ptx_isa("${ref}") for free-text matches.`;
  const head = exact
    ? `"${ref}" → ${exact.slug}\n  ${exact.section ? "§" + exact.section + " " : ""}${exact.title}\n  Sections: ${exact.sections.filter((s) => s.heading && s.level <= 2).map((s) => parseHeading(s.heading).title).join(" · ")}\n`
    : "";
  const others = candidates.filter((d) => d !== exact);
  const rest = others.length
    ? `${exact ? "Related pages:" : `"${ref}" matches ${candidates.length} pages:`}\n${others.slice(0, 40).map((d) => `- ${pageLine(d)}`).join("\n")}`
    : "";
  return [head, rest].filter(Boolean).join("\n") + `\n\nRead a page with read_ptx_isa_page(slug).`;
}

// ---------------------------------------------------------------------------
// list_ptx_isa_pages
// ---------------------------------------------------------------------------

export interface ListArgs { filter?: string; prefix?: string; depth?: number }

export function toolListText(args: ListArgs): string {
  const filter = args.filter?.toLowerCase().trim();
  const prefix = args.prefix?.replace(/^\/+|\/+$/g, "").toLowerCase();
  let docs = ALL_DOCS;
  if (prefix) docs = docs.filter((d) => d.slug.toLowerCase().startsWith(prefix));
  if (filter) {
    docs = docs.filter((d) =>
      d.title.toLowerCase().includes(filter) ||
      d.slug.toLowerCase().includes(filter) ||
      (d.section ?? "").startsWith(filter) ||
      d.names.some((n) => n.toLowerCase().includes(filter))
    );
  }
  if (!docs.length) return `No pages match${prefix ? ` prefix "${prefix}"` : ""}${filter ? ` filter "${filter}"` : ""}.`;

  // Without a filter or prefix, show a directory outline so the response stays small.
  if (!filter && !prefix) {
    const groups = new Map<string, DocEntry[]>();
    for (const d of docs) {
      const parts = d.slug.split("/");
      const key = parts.length > 2 ? parts.slice(0, 2).join("/") : (parts.length === 2 ? parts[0] : "");
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    const lines: string[] = [`PTX ISA ${ISA_VERSION}: ${docs.length} pages. Outline (call again with prefix=<dir> to list a directory, filter=<text> to search titles/names):`];
    for (const [key, items] of groups) {
      if (key === "") {
        for (const d of items) lines.push(`- ${pageLine(d)}`);
      } else {
        const readme = items.find((d) => d.slug.endsWith("/README"));
        const label = readme ? `§${readme.section ?? ""} ${readme.title}`.trim() : key;
        lines.push(`- ${key}/  (${items.length} pages)  ${label}`);
      }
    }
    return lines.join("\n");
  }
  const lines = docs.slice(0, 300).map((d) => `- ${pageLine(d)}`);
  const more = docs.length > 300 ? `\n… ${docs.length - 300} more; narrow with prefix or filter.` : "";
  return `${docs.length} pages:\n${lines.join("\n")}${more}`;
}

export function toolListJson(args: ListArgs): object {
  const filter = args.filter?.toLowerCase().trim();
  const prefix = args.prefix?.replace(/^\/+|\/+$/g, "").toLowerCase();
  let docs = ALL_DOCS;
  if (prefix) docs = docs.filter((d) => d.slug.toLowerCase().startsWith(prefix));
  if (filter) {
    docs = docs.filter((d) =>
      d.title.toLowerCase().includes(filter) || d.slug.toLowerCase().includes(filter) ||
      (d.section ?? "").startsWith(filter) || d.names.some((n) => n.toLowerCase().includes(filter))
    );
  }
  return { total: docs.length, documents: docs.map((d) => ({ slug: d.slug, title: d.title, section: d.section, names: d.names, path: d.path })) };
}

// ---------------------------------------------------------------------------
// MCP tool definitions
// ---------------------------------------------------------------------------

const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const MCP_TOOLS = [
  {
    name: "search_ptx_isa",
    title: "Search the PTX ISA",
    description:
      `Full-text search over the NVIDIA PTX ISA ${ISA_VERSION} reference (every instruction, directive, special register, ` +
      "memory-model and tensor-core section). BM25 ranking at the section level with PTX-aware tokenisation: " +
      "dotted names like `cp.async.bulk.tensor`, qualifiers like `.shared::cluster` or `scale_vec::4X`, and section " +
      "numbers like `9.7.18.10` all work. Returns a compact list of hits, each with the page slug, the section heading, " +
      "and a snippet in which the matched terms are marked «like this». The whole response stays under max_bytes " +
      "(default 4096). Follow up with read_ptx_isa_page(slug, section) to read a hit. " +
      'Examples: "tcgen05.mma kind::mxf4", "mbarrier try_wait phase parity", "wgmma matrix descriptor swizzle", "fence.proxy.async".',
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words, instruction names, qualifiers or a section number. Multi-word queries are OR-ed with coverage weighting; phrases that occur verbatim rank higher." },
        max_results: { type: "integer", description: "Maximum hits to return (default 8, max 50)." },
        max_bytes: { type: "integer", description: "Byte budget for the whole response (default 4096, max 65536). Hits beyond the budget are dropped." },
        scope: { type: "string", description: 'Optional slug prefix to restrict the search, e.g. "09-instruction-set/18-tcgen05" or "11-directives".' },
      },
      required: ["query"],
    },
    annotations: { ...RO, title: "Search the PTX ISA" },
  },
  {
    name: "read_ptx_isa_page",
    title: "Read a PTX ISA page",
    description:
      "Return the Markdown of one PTX ISA page, or of a single section inside it. `slug` accepts a page slug from " +
      "search/list results, an instruction, directive or special-register name (`tcgen05.mma`, `.maxntid`, `%laneid`), " +
      "a file name (`cp-async-bulk-tensor`), or a section number (`9.7.15.16.19`). If the name is ambiguous " +
      "(e.g. `add` exists for integer, float, half and mixed precision) the candidate pages are listed instead. " +
      "`section` narrows the result to one heading by number (`9.7.18.10.7.1`), by name (`Syntax`, `Target ISA Notes`) " +
      'or by anchor; the section is returned with all of its sub-sections. Pass slug="README" for the overview.',
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: 'Page slug, instruction/directive/register name, file name or section number. Examples: "09-instruction-set/10-data-movement-conversion/cvt", "mbarrier.try_wait", "%clock64", "9.7.17.5.1.2.2".' },
        section: { type: "string", description: 'Optional heading inside the page: a section number, heading text (e.g. "Syntax", "Examples", "PTX ISA Notes") or anchor.' },
      },
      required: ["slug"],
    },
    annotations: { ...RO, title: "Read a PTX ISA page" },
  },
  {
    name: "lookup_ptx_instruction",
    title: "Look up a PTX instruction, directive or register",
    description:
      "Resolve an instruction, directive, special-register or pragma name to its documentation page(s) without a " +
      "full-text search. Exact names return the page and its section list; prefixes return the family " +
      "(`mbarrier` → every mbarrier.* page, `cp.async.bulk` → the bulk-copy family, `tcgen05` → all tcgen05 pages). " +
      "Use this when you already know the mnemonic; use search_ptx_isa for concepts or qualifiers.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: 'Mnemonic such as "ldmatrix", "cp.reduce.async.bulk.tensor", ".reqntid", "%globaltimer", "mma_throughput".' },
      },
      required: ["name"],
    },
    annotations: { ...RO, title: "Look up a PTX instruction, directive or register" },
  },
  {
    name: "list_ptx_isa_pages",
    title: "List PTX ISA pages",
    description:
      "Browse the page tree. With no arguments returns a compact outline of chapters and directories with page counts. " +
      "`prefix` lists every page under a directory (e.g. \"09-instruction-set/15-parallel-sync-communication\"); " +
      "`filter` matches against titles, slugs, section numbers and instruction names.",
    inputSchema: {
      type: "object",
      properties: {
        prefix: { type: "string", description: 'Slug prefix (directory) to list, e.g. "10-special-registers" or "09-instruction-set/18-tcgen05/mma".' },
        filter: { type: "string", description: 'Keyword matched against title, slug, section number and instruction names, e.g. "mma", "9.7.15", "fence".' },
      },
    },
    annotations: { ...RO, title: "List PTX ISA pages" },
  },
];

export const MCP_SERVER_INSTRUCTIONS =
  `This server exposes the NVIDIA PTX ISA ${ISA_VERSION} reference as Markdown pages (${ALL_DOCS.length} pages: ` +
  "syntax, state spaces, memory consistency model, every instruction incl. mma/wgmma/tcgen05/fabric, special registers, " +
  "directives, pragmas, release notes). Typical flow: search_ptx_isa(query) → read_ptx_isa_page(slug, section). " +
  "If you already know a mnemonic, lookup_ptx_instruction(name) or read_ptx_isa_page(name) resolves it directly. " +
  "Pages are small and section-addressable; prefer reading a section over a whole page when you only need Syntax or Examples.";

export { DOC_MAP };
