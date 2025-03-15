---
zip: 0426
title: "1M Token Context Extension"
description: "YaRN-based context window extension enabling Zen models to process 1 million tokens in a single inference pass"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-01
traces-from: "ZIP-0401, ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-context-extension"
  - "zen/papers/zen-inference-optimization"
  - "zen/papers/zen-hardware-optimization"
created: 2025-01-15
tags: [context-extension, long-context, yarn, million-tokens, rope-scaling]
requires: [0413]
references: HIP-0035
license: CC BY 4.0
---

# ZIP-0426: 1M Token Context Extension

## Abstract

This proposal specifies the methodology for extending Zen model context windows from 128K to 1 million tokens using YaRN (Yet another RoPE extensioN) scaling combined with attention optimization techniques. A 1M token context enables processing entire codebases, complete research paper collections, full species databases, and extensive conversation histories in a single inference pass -- critical for the Experience Ledger (ZIP-0401) which requires agents to reason over their complete memory.

## Motivation

The Experience Ledger (ZIP-0401) accumulates knowledge over months and years of interaction. A conservation agent that has been active for one year may have:
- 100K tokens of conversation history
- 200K tokens of species knowledge
- 300K tokens of field report summaries
- 400K tokens of cross-referenced scientific literature

At 128K context, the agent must aggressively summarize and discard information. At 1M context, it can reason over its complete memory.

## Specification

### Extension Method

**YaRN Scaling**:
1. Segment RoPE dimensions into low-frequency and high-frequency groups
2. Low-frequency: linear interpolation (preserves long-range dependencies)
3. High-frequency: no scaling (preserves local pattern matching)
4. Boundary: learned via attention entropy analysis

### Training Pipeline

1. **Base model**: Zen Base trained at 128K context (ZIP-0413)
2. **Progressive extension**: 128K -> 256K -> 512K -> 1M in three stages
3. **Per-stage training**: 1B tokens at each context length
4. **Long-document data**: Books, codebases, paper collections, conversation logs
5. **Needle-in-haystack evaluation**: Verify retrieval accuracy at all context positions

### Attention Optimization

1M token context requires O(n^2) attention optimization:

| Technique | Description | Memory Reduction |
|-----------|-------------|-----------------|
| FlashAttention-3 | Tiled attention with I/O optimization | 4x |
| Ring attention | Distributed attention across multiple GPUs | Linear in GPUs |
| Sliding window | Local attention for most layers, global for every 4th | 8x |
| KV-cache quantization | 4-bit KV cache compression | 4x |

### Needle-in-Haystack Results

| Context Length | Retrieval Accuracy | Latency (first token) |
|---------------|-------------------|----------------------|
| 128K | 99.8% | 0.5s |
| 256K | 99.6% | 1.1s |
| 512K | 99.2% | 2.3s |
| 1M | 98.5% | 4.8s |

## Research Papers

- [zen-context-extension](~/work/zen/papers/zen-context-extension.tex) -- Context extension methodology
- [zen-inference-optimization](~/work/zen/papers/zen-inference-optimization.tex) -- Inference optimization for long context
- [zen-hardware-optimization](~/work/zen/papers/zen-hardware-optimization.tex) -- Hardware-specific optimizations

## Implementation

- **hanzo/llm**: LLM Gateway with 1M context model serving
- **hanzo/candle**: Rust inference engine with ring attention support
- **hanzo/chat**: Chat interface with extended context conversations

## Timeline

- **Originated**: January 2025 (1M context research)
- **Research**: `zen-context-extension` published Q1 2025
- **Implementation**: Zen models with 1M context deployed via Hanzo LLM Gateway Q2 2025
