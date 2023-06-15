---
zip: 0408
title: "Unified Multimodal Architecture (Jin)"
description: "Jin -- a unified architecture processing vision, language, audio, and 3D within a single transformer, enabling cross-modal reasoning and generation"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2023-03
traces-from: "ZIP-0406 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-aci"
  - "zen/papers/zen-multimodal-architecture"
  - "zen/papers/zen-vl_whitepaper"
  - "zen/papers/zen3-omni_whitepaper"
created: 2023-03-01
tags: [multimodal, jin, vision-language, audio, unified-transformer, cross-modal]
requires: [0406]
references: HIP-0010
repository: https://github.com/hanzoai/jin
license: CC BY 4.0
---

# ZIP-0408: Unified Multimodal Architecture (Jin)

## Abstract

This proposal specifies Jin, a unified multimodal AI architecture that processes vision, language, audio, and 3D data through a single transformer backbone. Unlike pipeline approaches that chain separate vision and language models, Jin uses modality-specific encoders feeding into a shared cross-attention transformer that reasons natively across all modalities simultaneously. Jin is the architectural foundation for the Zen multimodal model family (Zen-VL, Zen-Omni, Zen-Live) and the broader Hanzo AI infrastructure.

## Motivation

ZIP-0406 (Multi-Modal Conservation AI) identified the need for cross-modal reasoning but relied on separate encoder pipelines with a late fusion layer. This approach has fundamental limitations:

1. **Information bottleneck**: Each modality is compressed independently before fusion, losing cross-modal correlations
2. **Sequential processing**: Vision must complete before language can reference visual features
3. **Scaling**: Adding a new modality requires retraining the fusion layer
4. **Generation**: The pipeline can classify but cannot generate across modalities (e.g., describe an image, generate an image from text)

Jin solves these by treating all modalities as token sequences processed by a single transformer:

- Images become visual token sequences via a ViT encoder
- Audio becomes acoustic token sequences via a Whisper-derived encoder
- Text remains as standard token sequences
- 3D scenes become spatial token sequences via a point cloud encoder
- All token types share the same attention mechanism and positional encoding

## Specification

### Architecture

```
                    Shared Transformer Backbone
                    (N layers, cross-attention)
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────┴───────┐ ┌───┴───┐ ┌───────┴───────┐
    │ Vision Tokens │ │ Text  │ │ Audio Tokens  │
    │ (ViT encoder) │ │Tokens │ │ (Whisper enc.)│
    └───────────────┘ └───────┘ └───────────────┘
            │              │              │
    ┌───────┴───────┐ ┌───┴───┐ ┌───────┴───────┐
    │ Image/Video   │ │ Text  │ │ Audio/Speech  │
    │ Input         │ │ Input │ │ Input         │
    └───────────────┘ └───────┘ └───────────────┘
```

### Key Design Decisions

1. **Modality tokens share the same embedding space**: Visual tokens, text tokens, and audio tokens are all projected into the same d-dimensional space before entering the transformer.

2. **Interleaved attention**: Unlike approaches that process each modality separately then concatenate, Jin interleaves tokens from all modalities in a single sequence, allowing cross-modal attention from the first layer.

3. **Modality-specific heads**: Output heads are modality-specific (text generation, image generation, audio synthesis) but share the same backbone representations.

4. **Dynamic resolution**: Vision inputs can be any resolution (variable number of visual tokens). Audio inputs can be any duration. The transformer handles variable-length mixed-modality sequences natively.

### Model Scale

| Variant | Parameters | Context | Modalities |
|---------|-----------|---------|------------|
| Jin-Nano | 1.5B | 32K | Vision + Language |
| Jin-Base | 7B | 128K | Vision + Language + Audio |
| Jin-Pro | 72B | 256K | All (Vision + Language + Audio + 3D) |
| Jin-Max | 480B | 1M | All + Generation |

### Training

1. **Stage 1**: Modality alignment -- train encoders to produce compatible token representations using paired data (image-text, audio-text)
2. **Stage 2**: Joint pre-training -- train the full model on interleaved multimodal web data
3. **Stage 3**: Instruction tuning -- fine-tune on multimodal instruction-following tasks
4. **Stage 4**: Domain specialization -- conservation, medical, code, etc.

## Research Papers

- [zen-multimodal-architecture](~/work/zen/papers/zen-multimodal-architecture.tex) -- Technical architecture of Zen multimodal models
- [zen-vl_whitepaper](~/work/zen/papers/zen-vl_whitepaper.tex) -- Zen-VL vision-language model whitepaper
- [zen3-omni_whitepaper](~/work/zen/papers/zen3-omni_whitepaper.tex) -- Zen3-Omni full multimodal model
- [zen-vision-architecture](~/work/zen/papers/zen-vision-architecture.tex) -- Vision encoder architecture

## Implementation

- **hanzo/jin**: Production Jin multimodal framework (Python, PyTorch)
- **hanzo/candle**: Rust inference engine for Jin models
- **hanzo/llm**: LLM Gateway serving Jin/Zen multimodal models

## Timeline

- **Originated**: March 2023 (Jin architecture design)
- **Research**: `zen-multimodal-architecture` published 2024, `zen-vl_whitepaper` published 2024
- **Implementation**: Jin framework deployed 2023, Zen-VL and Zen-Omni models 2024-2025
