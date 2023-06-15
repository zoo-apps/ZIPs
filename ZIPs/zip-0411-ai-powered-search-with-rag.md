---
zip: 0411
title: "AI-Powered Search with RAG"
description: "Retrieval-Augmented Generation architecture for grounding AI responses in authoritative conservation data and real-time knowledge bases"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2023-10
traces-from: "ZIP-0404, ZIP-0405 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-search"
  - "hanzo/papers/hanzo-vector-search"
  - "zen/papers/zen-embeddings-retrieval"
  - "zen/papers/zen-reranker"
created: 2023-10-01
tags: [rag, search, retrieval-augmented-generation, vector-search, knowledge-grounding]
requires: [0404, 0405]
references: HIP-0015
repository: https://github.com/hanzoai/search
license: CC BY 4.0
---

# ZIP-0411: AI-Powered Search with RAG

## Abstract

This proposal defines the Retrieval-Augmented Generation (RAG) architecture for grounding AI responses in authoritative, up-to-date knowledge. Rather than relying solely on parametric knowledge (what the model learned during training), RAG retrieves relevant documents from a curated knowledge base at inference time and includes them in the model's context window. This ensures factual accuracy for conservation data, species status, and scientific findings that change faster than model retraining cycles.

## Motivation

Conservation AI (ZIP-0405) must be factually grounded. Species conservation statuses change (IUCN Red List is updated annually), new scientific discoveries invalidate old assumptions, and local conditions (weather, poaching incidents, habitat status) change daily. A model trained in January cannot accurately answer questions about conditions in June.

RAG solves this by separating the model's reasoning capability (parametric knowledge) from its factual knowledge (retrieved documents). The model can reason about any conservation topic, and RAG ensures it has the latest data to reason about.

## Specification

### Architecture

```
User Query
    │
    v
┌──────────────┐    ┌───────────────────┐
│ Query Encoder │───>│ Vector Database   │
│ (Zen Embed)   │    │ (7680-dim, ZIP-0420)│
└──────────────┘    │ - IUCN Red List   │
                    │ - Scientific papers│
                    │ - Field reports    │
                    │ - Zoo papers/ZIPs  │
                    └────────┬──────────┘
                             │ Top-K results
                             v
                    ┌──────────────────┐
                    │ Reranker         │
                    │ (Zen-Reranker)   │
                    └────────┬─────────┘
                             │ Reranked results
                             v
                    ┌──────────────────┐
User Query ────────>│ LLM (Zen family)  │───> Grounded Response
                    │ + Retrieved Context│
                    └──────────────────┘
```

### Retrieval Pipeline

1. **Query encoding**: User query is encoded to a 7680-dimensional embedding using the Zen embedding model (ZIP-0420)
2. **Approximate nearest-neighbor search**: Top-K (K=20) documents retrieved by cosine similarity
3. **Reranking**: Retrieved documents re-scored by the Zen-Reranker model for query relevance
4. **Context construction**: Top-N (N=5) reranked documents inserted into the LLM context
5. **Generation**: LLM generates response grounded in retrieved context
6. **Citation**: Response includes citations linking claims to source documents

### Knowledge Base Curation

| Source | Update Frequency | Documents |
|--------|-----------------|-----------|
| IUCN Red List | Annual | 150K species assessments |
| Zoo papers | As published | 79 research papers |
| Zoo ZIPs | As ratified | 100+ proposals |
| Field reports | Daily | Continuous stream |
| Satellite data summaries | Weekly | Global coverage |
| Conservation news | Real-time | RSS aggregation |

### Generative UI

Search results are presented with generative UI components:
- Species cards with conservation status indicators
- Interactive maps showing species range and habitat
- Timeline visualizations of population trends
- Citation panels with source reliability scores

## Research Papers

- [hanzo-search](~/work/hanzo/papers/hanzo-search/) -- Hanzo AI-powered search architecture
- [hanzo-vector-search](~/work/hanzo/papers/hanzo-vector-search.tex) -- Vector search infrastructure
- [zen-embeddings-retrieval](~/work/zen/papers/zen-embeddings-retrieval.tex) -- Zen embedding and retrieval models
- [zen-reranker](~/work/zen/papers/zen-reranker.tex) -- Zen-Reranker 7680-dimensional model

## Implementation

- **hanzo/search**: Production AI-powered search with generative UI (Next.js, Supabase)
- **hanzo/llm**: LLM Gateway serving RAG-augmented inference
- **hanzo/mcp**: MCP tools with RAG-backed knowledge access

## Timeline

- **Originated**: October 2023 (RAG architecture design)
- **Research**: `hanzo-search` published 2024, `zen-reranker` published 2024
- **Implementation**: Hanzo Search deployed 2024 with Zen embeddings and reranker
