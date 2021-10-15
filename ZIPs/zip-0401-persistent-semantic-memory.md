---
zip: 0401
title: "Persistent Semantic Memory"
description: "Experience Ledger -- a persistent semantic memory system enabling AI agents to learn, remember, and evolve across interactions"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2021-10
traces-from: "ZIP-0400 / Whitepaper Section 08 (AI Assistant)"
follow-on:
  - "zoo-experience-ledger (2021)"
  - "zoo-ai-memory (2024)"
  - "experience-ledger-dso (2025)"
  - "zen/papers/zen-context-extension"
created: 2021-10-15
tags: [semantic-memory, experience-ledger, ai-memory, persistent-state, knowledge-graph]
requires: [0400]
references: HIP-0002
repository: https://github.com/zooai/experience-ledger
license: CC BY 4.0
---

# ZIP-0401: Persistent Semantic Memory

## Abstract

This proposal specifies the Experience Ledger, a persistent semantic memory system that enables AI agents to accumulate knowledge across interactions, sessions, and time. Unlike stateless chatbots that forget everything between conversations, the Experience Ledger provides agents with a growing, structured memory of every interaction, observation, and learned fact. This concept, articulated in the October 2021 whitepaper, predates the "memory" features now common in commercial AI assistants by over two years.

## Motivation

The October 2021 whitepaper described AI agents bound to Zoo NFTs that would grow and evolve alongside their owners. For this to work, agents needed memory -- not just conversation history, but semantic understanding that persists and compounds.

Key requirements identified in the whitepaper:

1. **Continuity**: An agent that remembers a user said they care about marine conservation should surface ocean-related content in future sessions.
2. **Growth**: The agent's knowledge should expand over time as it interacts with more users and receives conservation updates.
3. **Provenance**: Every piece of learned knowledge must be traceable to its source (user interaction, scientific database update, field observation) for trust and auditability.
4. **Decentralization**: Memory cannot live in a single centralized database -- it must be distributed and user-sovereign.

## Specification

### Memory Architecture

```
Experience Ledger
├── Episodic Memory (conversation transcripts, timestamped)
├── Semantic Memory (extracted facts, relationships, concepts)
├── Procedural Memory (learned behavioral patterns)
└── Meta-Memory (memory about memory: confidence, recency, relevance)
```

### Semantic Extraction Pipeline

1. **Observation**: Raw interaction data (user messages, agent responses, environmental signals)
2. **Extraction**: NLP pipeline extracts entities, relationships, sentiments, and conservation-relevant facts
3. **Embedding**: Extracted knowledge is embedded in a high-dimensional semantic space (see ZIP-0420 for 7680-dim embeddings)
4. **Indexing**: Embeddings are stored in a vector database with metadata (source, timestamp, confidence, decay rate)
5. **Consolidation**: Periodic consolidation merges redundant memories, strengthens frequently-accessed paths, and decays stale information

### On-Chain Anchoring

Memory hashes are periodically anchored on-chain to provide:
- Tamper-proof provenance of when knowledge was acquired
- Verifiable proof that an agent's knowledge state at time T included fact F
- Foundation for the DSO protocol (ZIP-0410) which uses memory states for decentralized training

### Retrieval

At inference time, the agent's context window is augmented with relevant memories via:
1. Query embedding of the current conversation context
2. Approximate nearest-neighbor search over the semantic memory space
3. Temporal weighting (recent memories ranked higher)
4. Relevance filtering (conservation context prioritized)

## Research Papers

- [zoo-experience-ledger](~/work/zoo/papers/zoo-experience-ledger/) -- Original Experience Ledger specification (2021)
- [zoo-ai-memory](~/work/zoo/papers/zoo-ai-memory/) -- AI memory architecture deep-dive (2024)
- [experience-ledger-dso](~/work/zoo/papers/experience-ledger-dso/) -- DSO protocol built on Experience Ledger (2025)
- [zen-context-extension](~/work/zen/papers/zen-context-extension.tex) -- 1M token context extension for long-term memory (2025)

## Implementation

- **hanzo/agent**: Multi-agent SDK with memory systems for persistent state
- **hanzo/mcp**: MCP server tools that leverage persistent memory for context-aware tool use
- **zoo/core**: Core application with episodic memory for NFT-bound agents

## Timeline

- **Originated**: October 2021 (Whitepaper Section 08, companion paper `zoo-experience-ledger`)
- **Research**: `zoo-ai-memory` published 2024, `experience-ledger-dso` published 2025
- **Implementation**: Hanzo Agent SDK with memory systems deployed 2024
