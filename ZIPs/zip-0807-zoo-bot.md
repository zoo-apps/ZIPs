---
zip: 0807
title: "zoo-bot — Pure-Go Agentic Bot Framework"
description: "Pure-Go re-write of the Hanzo OpenClaw bot framework: smaller binary, lower memory, faster cold start, narrower attack surface"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-12-15
activation: 2025-12-25
tags: [bot, agent, mcp, go, openclaw, sandbox]
related-papers: [zoo-3-0-launch, hanzo-ai-chain]
---

# ZIP-0807: zoo-bot

## Abstract

`zoo-bot` is a pure-Go re-write of Hanzo's OpenClaw agentic bot framework (`~/work/hanzo/bot`). It preserves the OpenClaw skill manifest format and MCP wire protocol so skills written for OpenClaw run on `zoo-bot` via a compatibility shim, while replacing the TypeScript/Node runtime with a single static Go binary. Goals: smaller binary (< 50 MB), lower idle memory (< 80 MB), faster cold start (< 100 ms), narrower attack surface (no npm dependency tree).

## Motivation

OpenClaw is good. Its Node runtime is appropriate for front-end-style workloads, less appropriate for continuous-loop server agents:

- npm dependency tree exposes transitive supply chain risk.
- Node runtime + TypeScript JIT carry several hundred MB of overhead.
- Cold start is multi-second.
- Sandboxing is cooperative.

A Go re-write addresses all four with a different tradeoff: less dynamism (no runtime npm install of tools) in exchange for the operational properties above.

## Specification

### Runtime

- Single static binary (Go 1.x).
- SQLite or Postgres persistence; SQLite by default for local dev.
- Embedded MCP server and client.

### Skill interface

```go
type Skill interface {
    Name() string
    Plan(ctx context.Context, goal string) (*Plan, error)
    Execute(ctx context.Context, plan *Plan) (*Result, error)
    Observe(ctx context.Context, result *Result) error
}
```

Each skill is a Go module satisfying this interface. Skills are compiled into the binary (no runtime plugin loading) for reproducibility and supply-chain safety.

### OpenClaw compatibility shim

A compatibility layer reads OpenClaw skill manifests (`skill.json`) and translates them to Go skill descriptors. Skills declared in TypeScript run via an embedded V8 isolate as a fallback path; new skills should be authored in Go directly.

### Adapters

- Discord, Slack, Matrix, generic webhook.
- Zoo L1 RPC adapter for on-chain trigger streams.
- Lux RPC adapter for cross-chain triggers.
- A-Chain attestation feed adapter.

### Sandbox

Each skill runs in a Goroutine with capability-bounded enforcement:

- Linux: `seccomp-bpf` profile.
- macOS: `sandbox_init()` profile.
- Windows: AppContainer integrity level.

Capabilities declared in the skill manifest:

```json
{
  "name": "leaderboard-poster",
  "filesystem": ["/var/zoo-bot/cache"],
  "network": ["api.discord.com:443"],
  "rpc": ["lux:zoo-l1:rpc"]
}
```

A skill cannot escape its declared capabilities without source modification + re-deploy.

### Use cases

- Agentic workflows (per-LLM chain leaderboards, attribution graph visualisations).
- Content automation (A-Chain provenance feed publication).
- On-chain triggers (NFT price alerts, training receipt notifications).
- Validator-side automation (mempool anomaly paging).

## Rationale

A re-write rather than a fork keeps the OpenClaw upstream maintainable for Hanzo's TypeScript ecosystem. The shared MCP wire protocol means a `zoo-bot` agent can call OpenClaw tools and vice versa; no ecosystem fragmentation.

## Reference Implementation

`~/work/zoo/bot` (planned). Existing Hanzo OpenClaw at `~/work/hanzo/bot`.

## Security Considerations

- Skills are statically compiled into the binary; no runtime code load reduces dynamic supply-chain risk.
- The OS-level sandbox is not optional; skills cannot be deployed without a manifest declaring capabilities.
- Persistence is encrypted at rest.

## References

- `zoo-3-0-launch` paper §6 (zoo-bot)
- Hanzo OpenClaw: `~/work/hanzo/bot`
- MCP specification (`~/work/hanzo/mcp`)
