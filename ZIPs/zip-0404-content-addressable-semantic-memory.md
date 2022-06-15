---
zip: 0404
title: "Content-Addressable Semantic Memory System"
description: "Content-addressed storage for AI semantic memory with IPFS anchoring, enabling verifiable, deduplicable, and distributed knowledge graphs"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2022-03
traces-from: "ZIP-0401 / Whitepaper Section 08"
follow-on:
  - "zoo-ai-memory (2024)"
  - "zoo-data-commons (2023)"
  - "zen/papers/zen-embeddings-retrieval"
created: 2022-03-15
tags: [content-addressing, semantic-memory, ipfs, knowledge-graph, vector-store]
requires: [0401]
references: IPFS, CIDv1
repository: https://github.com/zooai/semantic-memory
license: CC BY 4.0
---

# ZIP-0404: Content-Addressable Semantic Memory System

## Abstract

This proposal extends the Experience Ledger (ZIP-0401) with content-addressable storage, where every piece of semantic knowledge is identified by its cryptographic hash rather than by location. This enables deduplication across agents (if two agents learn the same fact, it is stored once), verifiable provenance (the hash chain proves when knowledge was acquired and from what source), and efficient distributed retrieval. The system uses IPFS for storage and on-chain CID anchoring for tamper-proof provenance.

## Motivation

ZIP-0401 established that agents need persistent semantic memory. As the number of agents grows into the tens of thousands (one per NFT), naive per-agent storage becomes untenable. Many agents will learn overlapping facts: the IUCN status of a species, the temperature of a habitat, the outcome of a conservation event. Content addressing solves this by storing each unique fact exactly once and referencing it by hash from any number of agent memory graphs.

Additionally, content addressing provides the foundation for the DSO protocol (ZIP-0410): when agents share semantic gradients during decentralized training, they need to reference specific knowledge states, and CIDs provide a universal, tamper-proof way to do this.

## Specification

### Memory Object Format

```
MemoryObject {
  cid: CIDv1                  // self-describing content hash
  type: "episodic" | "semantic" | "procedural"
  content: {
    embedding: float[7680]    // semantic embedding (ZIP-0420)
    text: string              // human-readable representation
    entities: Entity[]        // extracted named entities
    relations: Relation[]     // entity-entity relationships
    confidence: float         // 0.0 to 1.0
    source: SourceRef         // provenance chain
  }
  metadata: {
    created: timestamp
    accessed: timestamp[]     // access log for decay computation
    decay_rate: float         // how quickly this memory fades
    agent_refs: AgentDID[]    // which agents reference this memory
  }
}
```

### Deduplication Strategy

1. Incoming knowledge is embedded using the Zen embedding model (7680 dimensions, ZIP-0420)
2. Approximate nearest-neighbor search finds existing memory objects within cosine similarity > 0.98
3. If a near-duplicate exists, the new observation is merged (confidence updated, source chain extended)
4. If no duplicate exists, a new MemoryObject is created and pinned to IPFS

### Retrieval Protocol

Agents retrieve memories via a two-phase process:
1. **Local cache**: Check agent's local memory graph (hot memories, recently accessed)
2. **Distributed lookup**: Query the content-addressed store by embedding similarity, filtered by agent's access permissions

### On-Chain Anchoring

Every 100 blocks, a Merkle root of all new MemoryObject CIDs is posted on-chain, providing:
- Timestamp proof: this knowledge existed at block N
- Batch verification: any single memory can be proven to be in the set via Merkle proof
- Cost efficiency: one transaction anchors thousands of memories

## Research Papers

- [zoo-ai-memory](~/work/zoo/papers/zoo-ai-memory/) -- AI memory architecture with content addressing (2024)
- [zoo-data-commons](~/work/zoo/papers/zoo-data-commons/) -- Open biodiversity data standard using content addressing (2023)
- [zen-embeddings-retrieval](~/work/zen/papers/zen-embeddings-retrieval.tex) -- Embedding and retrieval architecture for Zen models

## Implementation

- **hanzo/mcp**: MCP server tools with content-addressed memory access
- **hanzo/search**: AI-powered search with RAG using content-addressed knowledge
- **zoo/core**: Core application with distributed memory layer

## Timeline

- **Originated**: March 2022 (research extension of Experience Ledger)
- **Research**: `zoo-data-commons` published 2023, `zoo-ai-memory` published 2024
- **Implementation**: Content-addressed memory in Hanzo MCP and Search 2024
