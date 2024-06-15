---
zip: 0413
title: "Foundation Language Model Architecture (Zen Base)"
description: "Architecture specification for the Zen Base foundation model family, from 600M to 480B parameters, using dense transformer with grouped-query attention"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-01
traces-from: "ZIP-0405, ZIP-0408 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-base_whitepaper"
  - "zen/papers/zen-pro_whitepaper"
  - "zen/papers/zen-max_whitepaper"
  - "zen/papers/zen4_whitepaper"
created: 2024-01-15
tags: [foundation-model, zen-base, dense-transformer, gqa, language-model]
requires: [0405, 0408]
references: HIP-0020
repository: https://github.com/hanzoai/zen
license: CC BY 4.0
---

# ZIP-0413: Foundation Language Model Architecture (Zen Base)

## Abstract

This proposal specifies the architecture of the Zen Base foundation language model family, the core LLM powering all Hanzo and Zoo AI systems. Zen Base models range from 600M to 480B parameters, use dense transformer architecture with grouped-query attention (GQA), RoPE positional encoding, SwiGLU activations, and RMSNorm normalization. The family provides the foundation upon which all specialized Zen models (Code, VL, Live, Guard) are built through continued pre-training and domain-specific fine-tuning.

## Motivation

The conservation AI (ZIP-0405) and multimodal systems (ZIP-0408) required a strong language backbone. Rather than relying on third-party models with licensing restrictions, usage limits, and no control over training data or architecture, Zoo and Hanzo co-developed the Zen model family as an open-weight foundation that can be:

1. Fine-tuned for any domain (conservation, code, medical, legal)
2. Deployed without per-token costs on self-hosted infrastructure
3. Trained with conservation-specific data that commercial providers reject
4. Extended with multimodal capabilities via the Jin architecture (ZIP-0408)

## Specification

### Architecture

| Component | Design |
|-----------|--------|
| Architecture | Dense transformer (decoder-only) |
| Attention | Grouped-Query Attention (GQA) with 8 KV heads |
| Positional Encoding | RoPE (Rotary Position Embedding) |
| Activation | SwiGLU (SiLU-gated linear unit) |
| Normalization | RMSNorm (pre-norm) |
| Vocabulary | 152K tokens (byte-level BPE, 100+ languages) |
| Context | 32K base, extensible to 1M (ZIP-0426) |

### Model Scale

| Variant | Parameters | Hidden Dim | Layers | Heads | Context |
|---------|-----------|------------|--------|-------|---------|
| Zen-Nano | 600M | 1024 | 24 | 16 | 32K |
| Zen-Mini | 1.5B | 1536 | 28 | 24 | 32K |
| Zen-Base | 7B | 4096 | 32 | 32 | 128K |
| Zen-Pro | 72B | 8192 | 80 | 64 | 128K |
| Zen-Max | 235B | 12288 | 96 | 96 | 256K |
| Zen-Ultra | 480B | 16384 | 120 | 128 | 1M |

### Training

1. **Pre-training**: 15T tokens of multilingual web data, books, code, scientific papers
2. **Annealing**: Learning rate decay with high-quality data mixture
3. **SFT**: Supervised fine-tuning on 2M instruction-following examples
4. **RLHF/GRPO**: Preference optimization using GRPO (ZIP-0421)

### Key Innovations

- **Zen MoDE**: Mixture of Diverse Experts architecture for efficient scaling (ZIP-0414)
- **YaRN-extended context**: Native 128K context with YaRN extension to 1M (ZIP-0426)
- **Multilingual from pre-training**: 100+ languages supported natively, not through fine-tuning

## Research Papers

- [zen-base_whitepaper](~/work/zen/papers/zen-base_whitepaper.tex) -- Zen Base architecture whitepaper
- [zen-pro_whitepaper](~/work/zen/papers/zen-pro_whitepaper.tex) -- Zen-Pro 72B model whitepaper
- [zen-max_whitepaper](~/work/zen/papers/zen-max_whitepaper.tex) -- Zen-Max 235B model whitepaper
- [zen4_whitepaper](~/work/zen/papers/zen4_whitepaper.tex) -- Zen4 next-generation architecture
- [zen-training-methodology](~/work/zen/papers/zen-training-methodology.tex) -- Training methodology

## Implementation

- **hanzo/llm**: LLM Gateway serving all Zen Base variants
- **hanzo/candle**: Rust inference engine for Zen models
- **hanzo/chat**: Chat interface with 14 Zen model variants

## Timeline

- **Originated**: January 2024 (Zen Base architecture design)
- **Research**: `zen-base_whitepaper` published Q1 2024, `zen4_whitepaper` published 2025
- **Implementation**: Zen Base family deployed via Hanzo LLM Gateway 2024
