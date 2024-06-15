---
zip: 0414
title: "Mixture of Distilled Experts (MoDE)"
description: "Zen MoDE architecture -- efficient scaling through mixture of diverse, distilled expert sub-networks with dynamic routing"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-02
traces-from: "ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-mixture-of-experts"
  - "zen/papers/zen-knowledge-distillation"
  - "zen/papers/zen-inference-optimization"
created: 2024-02-15
tags: [moe, mode, mixture-of-experts, distillation, efficient-scaling, sparse-models]
requires: [0413]
references: HIP-0021
license: CC BY 4.0
---

# ZIP-0414: Mixture of Distilled Experts (MoDE)

## Abstract

This proposal specifies the Zen MoDE (Mixture of Diverse Experts) architecture, a sparse mixture-of-experts approach where each expert is a distilled specialist trained on a specific domain (code, math, language, vision, reasoning). Unlike standard MoE that uses identical expert architectures with different weights, MoDE uses diverse expert architectures -- each optimized for its domain -- with a learned router that dynamically selects the most relevant experts for each input token. This achieves the quality of a dense model at a fraction of the inference cost.

## Motivation

Dense models scale by adding parameters uniformly across all layers. This is wasteful: a model answering a coding question does not need its poetry knowledge active, and vice versa. Standard MoE addresses this with a router that selects K of N experts per token, but all experts have identical architecture, differing only in weights.

MoDE goes further: each expert has architecture optimized for its domain:
- Code experts use larger FFN layers (more memorization capacity for APIs and syntax)
- Reasoning experts use deeper attention (more reasoning hops)
- Language experts use wider vocabulary embeddings (better multilingual coverage)
- Vision experts use spatial attention patterns (grid-structured features)

## Specification

### Architecture

```
Input Token
    │
    v
┌──────────────┐
│   Router     │ (learned, top-K selection)
│   Network    │
└──────┬───────┘
       │ selects K of N experts
       │
┌──────┴──────┬──────────────┬──────────────┬──────────────┐
│ Code Expert │ Math Expert  │ Lang Expert  │ Reason Expert│
│ (wide FFN)  │ (deep attn)  │ (wide vocab) │ (deep attn)  │
│ 14B params  │ 14B params   │ 14B params   │ 14B params   │
└──────┬──────┴──────┬───────┴──────┬───────┴──────┬───────┘
       │             │              │              │
       v             v              v              v
┌──────────────────────────────────────────────────────────┐
│                Weighted Combination                       │
│                (router weights)                           │
└──────────────────────────────────────────────────────────┘
       │
       v
   Output Token
```

### Expert Distillation

Each expert is created through knowledge distillation from the dense Zen model:
1. Train a dense 72B model on all domains
2. Identify domain-specific attention patterns and parameter subsets
3. Distill each domain into a specialized expert architecture
4. Train the router to select experts based on input tokens

### Routing Strategy

- **Top-2 routing**: Each token activates 2 of N experts (typically N=8)
- **Load balancing loss**: Auxiliary loss prevents expert collapse (all tokens routed to same expert)
- **Expert capacity**: Each expert processes at most C tokens per batch (overflow tokens use fallback expert)

### Efficiency Gains

| Model | Total Params | Active Params | FLOPs vs Dense | Quality vs Dense |
|-------|-------------|---------------|----------------|------------------|
| Zen-Base MoDE | 14B | 3.5B | 0.25x | 98.5% |
| Zen-Pro MoDE | 110B | 28B | 0.25x | 99.2% |
| Zen-Max MoDE | 480B | 120B | 0.25x | 99.8% |

## Research Papers

- [zen-mixture-of-experts](~/work/zen/papers/zen-mixture-of-experts.tex) -- MoDE architecture specification
- [zen-knowledge-distillation](~/work/zen/papers/zen-knowledge-distillation.tex) -- Knowledge distillation pipeline for expert creation
- [zen-inference-optimization](~/work/zen/papers/zen-inference-optimization.tex) -- Inference optimization for MoDE models

## Implementation

- **hanzo/llm**: LLM Gateway with MoDE-optimized serving
- **hanzo/candle**: Rust inference engine with expert routing
- **hanzo/jin**: Jin multimodal models using MoDE backbone

## Timeline

- **Originated**: February 2024 (MoDE architecture design)
- **Research**: `zen-mixture-of-experts` published Q2 2024
- **Implementation**: Zen MoDE models deployed via Hanzo LLM Gateway Q3 2024
