# NVIDIA PTX ISA v9.2 — Markdown Reference

Community-maintained Markdown conversion of the [NVIDIA Parallel Thread Execution ISA v9.2](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html).

> **Disclaimer:** This is an unofficial reformatting for readability and tooling integration.
> The authoritative source is always [NVIDIA's official documentation](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html).

---

## MCP Server & Documentation Browser

**Hosted at [ptx.poole.ai](https://ptx.poole.ai)**

| | URL |
|---|---|
| Documentation browser | **[ptx.poole.ai](https://ptx.poole.ai)** |
| MCP endpoint (HTTP) | `https://ptx.poole.ai/mcp` |
| REST API | `https://ptx.poole.ai/api/` |

### Use the hosted MCP server

Add to your MCP client config (e.g. `~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ptx-isa": {
      "type": "http",
      "url": "https://ptx.poole.ai/mcp"
    }
  }
}
```

For stdio-based clients (Claude Code, etc.):

```json
{
  "mcpServers": {
    "ptx-isa": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://ptx.poole.ai/mcp"]
    }
  }
}
```

**MCP tools:**

| Tool | Description |
|---|---|
| `ptx_list` | List all pages, optionally filtered by keyword |
| `ptx_read` | Read a page's full Markdown by slug |
| `ptx_search` | Full-text search across all pages |

MCP resources are also exposed as `ptx://docs/<slug>` URIs.

**REST API** (for direct HTTP access):

```
GET https://ptx.poole.ai/api/list?filter=<keyword>
GET https://ptx.poole.ai/api/read?slug=<slug>
GET https://ptx.poole.ai/api/search?q=<query>&max=<n>
GET https://ptx.poole.ai/docs/<slug>          # raw Markdown
```

---

### Self-hosting

The [`mcp-server/`](mcp-server/) directory contains two Bun servers:

| File | Purpose | Default port |
|---|---|---|
| [`index.ts`](mcp-server/index.ts) | MCP server (JSON-RPC 2.0 over **stdio**) + REST API | 3000 |
| [`web.ts`](mcp-server/web.ts) | Documentation browser | 4000 |

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.0

```bash
cd mcp-server
bun install
bun run start   # MCP + API on :3000
bun run web     # browser on :4000
```

For local MCP config pointing at your own instance:

```json
{
  "mcpServers": {
    "ptx-isa": {
      "command": "bun",
      "args": ["run", "/path/to/markdown-ptx-isa/mcp-server/index.ts"]
    }
  }
}
```

## License

The content of this repository is derived from NVIDIA's PTX ISA documentation.
All rights belong to NVIDIA Corporation. See [NVIDIA's notices](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html#notices).