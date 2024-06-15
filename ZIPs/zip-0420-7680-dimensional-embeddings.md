---
zip: 0420
title: "7680-Dimensional Embeddings (Zen-Reranker)"
description: "High-dimensional embedding model and reranker optimized for semantic search, retrieval, and cross-modal similarity at 7680 dimensions"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-07
traces-from: "ZIP-0404, ZIP-0411 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-reranker"
  - "zen/papers/zen-embeddings-retrieval"
  - "zen/papers/zen3-embedding_whitepaper"
  - "zoo/papers/embedding-7680"
created: 2024-07-01
tags: [embeddings, reranker, semantic-search, vector-search, 7680-dim, retrieval]
requires: [0404, 0411]
references: HIP-0025
license: CC BY 4.0
---

# ZIP-0420: 7680-Dimensional Embeddings (Zen-Reranker)

## Abstract

This proposal specifies the Zen-Reranker embedding model, a 7680-dimensional embedding system optimized for semantic search, document retrieval, and cross-modal similarity. The unusually high dimensionality (compared to standard 768 or 1536-dimensional embeddings) provides superior separation of fine-grained semantic distinctions -- critical for conservation applications where the difference between closely related species, similar habitats, or related conservation threats must be captured precisely.

## Motivation

Standard embedding models (768-1536 dimensions) collapse fine-grained distinctions that matter for conservation:
- "African forest elephant" vs "African savanna elephant" (different species, different conservation status)
- "Habitat fragmentation" vs "habitat degradation" (different threats, different interventions)
- "Population declining" vs "population stable but range contracting" (different urgency levels)

At 7680 dimensions, the embedding space has enough capacity to maintain separation between these subtle but consequential distinctions while still enabling efficient approximate nearest-neighbor search.

## Specification

### Architecture

- **Base**: Zen Base 7B encoder backbone
- **Embedding dimension**: 7680
- **Pooling**: Mean pooling over last hidden layer with learned projection
- **Normalization**: L2-normalized output for cosine similarity
- **Matryoshka**: Supports truncation to 1024, 2048, 4096 dimensions with graceful degradation

### Training

1. **Contrastive pre-training**: 1B text pairs with hard negatives
2. **Conservation domain tuning**: 10M species/habitat/threat description pairs
3. **Cross-modal alignment**: Image-text pairs for vision-language retrieval
4. **Reranker fine-tuning**: Cross-encoder reranking on relevance-labeled data

### Benchmarks

| Benchmark | Zen-Reranker (7680d) | Best 1536d | Improvement |
|-----------|---------------------|------------|-------------|
| MTEB (avg) | 72.3 | 68.1 | +4.2 |
| BEIR (avg) | 58.7 | 54.2 | +4.5 |
| Species retrieval | 96.2% | 89.1% | +7.1 |
| Conservation QA retrieval | 94.8% | 87.3% | +7.5 |

### Matryoshka Dimensions

The model supports progressive dimension truncation:

| Dimensions | Quality (MTEB) | Storage | Use Case |
|-----------|----------------|---------|----------|
| 7680 | 72.3 | Full | Maximum quality retrieval |
| 4096 | 71.8 | 53% | High-quality with reduced storage |
| 2048 | 70.1 | 27% | Balanced quality/efficiency |
| 1024 | 67.9 | 13% | Mobile and edge deployment |

## Research Papers

- [zen-reranker](~/work/zen/papers/zen-reranker.tex) -- Zen-Reranker architecture and benchmarks
- [zen-embeddings-retrieval](~/work/zen/papers/zen-embeddings-retrieval.tex) -- Embedding and retrieval system
- [zen3-embedding_whitepaper](~/work/zen/papers/zen3-embedding_whitepaper.tex) -- Zen3 embedding model whitepaper
- [embedding-7680](~/work/zoo/papers/embedding-7680/) -- 7680-dimensional embedding research

## Implementation

- **hanzo/search**: AI-powered search using 7680-dim embeddings
- **hanzo/llm**: LLM Gateway serving embedding and reranking endpoints
- **hanzo/python-sdk**: Python SDK with embedding and search functions

## Timeline

- **Originated**: July 2024 (7680-dim embedding architecture)
- **Research**: `zen-reranker` published Q3 2024, `embedding-7680` published 2024
- **Implementation**: Zen-Reranker deployed via Hanzo LLM Gateway Q3 2024
