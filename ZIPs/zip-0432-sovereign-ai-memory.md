---
zip: 0432
title: "Sovereign AI Memory"
description: "User-sovereign AI memory system where all agent knowledge is owned, controlled, and portable by the user -- never locked to a platform"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-07
traces-from: "ZIP-0401, ZIP-0404 / Whitepaper Section 08"
follow-on:
  - "zoo-ai-memory (2024)"
  - "zoo-web5-local-first"
  - "zen/papers/zen-context-extension"
created: 2025-07-01
tags: [sovereign-memory, user-ownership, data-portability, local-first, self-sovereign]
requires: [0401, 0404]
references: Web5, DID-Core
license: CC BY 4.0
---

# ZIP-0432: Sovereign AI Memory

## Abstract

This proposal specifies a user-sovereign AI memory system where all knowledge accumulated by AI agents is owned and controlled by the user, stored locally first with optional encrypted cloud backup, and fully portable between platforms and providers. When a user switches from one AI service to another, their agent's complete memory (conversation history, learned preferences, accumulated knowledge) transfers with them. No vendor lock-in. No data hostage.

## Motivation

Current AI assistants trap user data in proprietary silos. If you've spent years training ChatGPT on your preferences, switching to Claude means starting over. This is fundamentally wrong: your conversations, your preferences, your agent's learned knowledge about you -- that data belongs to you, not the AI provider.

The Zoo whitepaper (Section 08) envisioned agents that grow alongside their owners over years. For this to work across platform changes, the memory must be sovereign: owned by the user, stored locally, portable anywhere.

## Specification

### Ownership Model

```
User owns:
├── Conversation history (all messages, both directions)
├── Learned preferences (communication style, topics, tone)
├── Knowledge graph (facts learned about user and their interests)
├── Agent personality evolution (how the agent adapted to the user)
└── Encryption keys (user holds all keys, no escrow)

Platform has:
├── Read access (only during active session, revocable)
├── Write access (only to append new memories, user-approved)
└── No delete access (user's data, user's decision)
```

### Storage Architecture

```
Local Storage (user's device)
├── SQLite database (primary, always available)
├── Encrypted backup (user's cloud, user's key)
└── IPFS pin (optional, for decentralized availability)

Sync Protocol
├── CRDTs for conflict-free merge across devices
├── End-to-end encryption (platform cannot read)
└── Selective sync (user chooses what to share with each platform)
```

### Portability

Export format: standard JSON-LD with schema.org + Zoo-specific extensions
```json
{
  "@context": "https://schema.zoo.ngo/memory/v1",
  "owner": "did:zoo:user:abc123",
  "created": "2024-01-15T00:00:00Z",
  "memories": [...],
  "preferences": {...},
  "knowledge_graph": {...}
}
```

Any compliant AI platform can import this format and immediately resume the agent relationship where it left off.

### Integration with Experience Ledger

Sovereign AI Memory is the user-facing implementation of the Experience Ledger (ZIP-0401). The Experience Ledger defines the data structures; Sovereign Memory defines the ownership, storage, and portability model.

## Research Papers

- [zoo-ai-memory](~/work/zoo/papers/zoo-ai-memory/) -- AI memory architecture (2024)
- [zoo-web5-local-first](~/work/zoo/papers/zoo-web5-local-first.tex) -- Web5 local-first architecture
- [zen-context-extension](~/work/zen/papers/zen-context-extension.tex) -- Long context for complete memory access

## Implementation

- **hanzo/agent**: Agent SDK with sovereign memory support
- **hanzo/mcp**: MCP memory tools with local-first storage
- **hanzo/chat**: Chat interface with memory export/import

## Timeline

- **Originated**: July 2025 (sovereign memory specification)
- **Research**: `zoo-ai-memory` published 2024, `zoo-web5-local-first` published 2025
- **Implementation**: Sovereign memory in Hanzo Agent SDK 2025
