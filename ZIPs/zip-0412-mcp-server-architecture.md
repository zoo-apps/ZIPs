---
zip: 0412
title: "MCP Server Architecture"
description: "Model Context Protocol server architecture enabling AI models to use 260+ tools for code, data, web, and infrastructure interaction"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2023-12
traces-from: "ZIP-0400 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-agent-sdk"
  - "zen/papers/zen-agent-framework"
  - "zen/papers/zen-agent"
created: 2023-12-01
tags: [mcp, tool-use, agent-tools, model-context-protocol, function-calling]
requires: [0400, 0408]
references: MCP-Spec
repository: https://github.com/hanzoai/mcp
license: CC BY 4.0
---

# ZIP-0412: MCP Server Architecture

## Abstract

This proposal defines the architecture for Hanzo's Model Context Protocol (MCP) server infrastructure, providing 260+ tools that AI models can invoke to interact with code, data, web services, and infrastructure. MCP transforms language models from passive text generators into active agents capable of reading files, executing code, querying databases, browsing the web, managing containers, and orchestrating complex multi-step workflows. This is the tool-use infrastructure that powers all Hanzo agent systems.

## Motivation

The conversational AI system (ZIP-0400) and agent framework (ZIP-0402) require models to take actions in the world, not just generate text. When a conservation agent identifies that a species range has shifted, it needs to:

1. Query the latest satellite imagery (tool: fetch)
2. Run a habitat analysis model (tool: exec)
3. Update the species database (tool: write)
4. Notify relevant conservation organizations (tool: email)
5. Create a conservation alert (tool: api)

Without standardized tool access, each of these would require custom integration code. MCP provides a universal protocol for model-tool interaction.

## Specification

### Architecture

```
AI Model (Zen family)
    │
    │ MCP Protocol (JSON-RPC over stdio/SSE/WebSocket)
    v
┌──────────────────────┐
│ MCP Server           │
│                      │
│ Tool Registry        │
│ ├── Code Tools       │ read, write, exec, ast, git, lsp
│ ├── Data Tools       │ fetch, search, jq, sql, vector
│ ├── Web Tools        │ browser, curl, wget, scrape
│ ├── Infra Tools      │ docker, k8s, deploy, monitor
│ ├── AI Tools         │ llm, embed, generate, transcribe
│ └── Domain Tools     │ conservation, species, habitat
│                      │
│ Permission Layer     │
│ Context Manager      │
│ Rate Limiter         │
└──────────────────────┘
```

### Tool Categories

| Category | Tools | Count | Description |
|----------|-------|-------|-------------|
| Code | read, write, edit, exec, ast, git, lsp, refactor, review | 40+ | Source code manipulation |
| Data | fetch, search, jq, sql, vector, csv, json | 30+ | Data retrieval and transformation |
| Web | browser, curl, wget, scrape, screenshot | 20+ | Web interaction |
| Infrastructure | docker, k8s, deploy, monitor, logs | 25+ | DevOps and infrastructure |
| AI | llm, embed, generate, transcribe, translate | 15+ | AI model invocation |
| Communication | email, slack, webhook, notify | 10+ | External communication |
| Conservation | species, habitat, iucn, satellite, camera-trap | 20+ | Domain-specific |
| Utility | think, memory, todo, mode, version | 100+ | Agent utilities |

### Protocol

MCP uses JSON-RPC 2.0 over three transport options:
1. **stdio**: For local tool execution (lowest latency)
2. **SSE**: For server-sent events (streaming results)
3. **WebSocket**: For bidirectional real-time communication

### Permission Model

Tools are gated by a capability-based permission system:
- **Read-only tools**: Available to all agents by default
- **Write tools**: Require explicit user consent per session
- **Destructive tools**: Require per-invocation approval
- **Infrastructure tools**: Require org-level authorization

### Context Management

MCP manages the model's context window by:
1. Compressing tool outputs that exceed token budgets
2. Caching frequently-used tool results
3. Prefetching likely-needed context based on conversation trajectory

## Research Papers

- [hanzo-agent-sdk](~/work/hanzo/papers/hanzo-agent-sdk/) -- Agent SDK with MCP integration
- [zen-agent-framework](~/work/zen/papers/zen-agent-framework.tex) -- Zen agent framework architecture
- [zen-agent](~/work/zen/papers/zen-agent.tex) -- Zen-Agent model with native tool use

## Implementation

- **hanzo/mcp**: Production MCP server with 260+ tools (`npm install -g @hanzo/mcp`)
- **hanzo/agent**: Multi-agent SDK with MCP client integration
- **hanzo/operative**: Computer use framework built on MCP (ZIP-0422)
- **hanzo/chat**: Chat interface with MCP tool invocation

## Timeline

- **Originated**: December 2023 (MCP protocol design)
- **Research**: `hanzo-agent-sdk` published 2024
- **Implementation**: Hanzo MCP server with 260+ tools deployed 2024
