---
zip: 0416
title: "Vision-Language Models (Zen-VL)"
description: "Zen-VL -- vision-language models that natively understand images, charts, documents, and video alongside text"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-04
traces-from: "ZIP-0408, ZIP-0413 / Whitepaper Sections 08, 09"
follow-on:
  - "zen/papers/zen-vl_whitepaper"
  - "zen/papers/zen-vision-architecture"
  - "zen/papers/zen3-vl_whitepaper"
created: 2024-04-01
tags: [vision-language, zen-vl, multimodal, image-understanding, document-ai]
requires: [0408, 0413]
references: HIP-0023
license: CC BY 4.0
---

# ZIP-0416: Vision-Language Models (Zen-VL)

## Abstract

This proposal specifies Zen-VL, the vision-language variant of the Zen model family. Zen-VL extends the Zen Base language model (ZIP-0413) with a vision encoder that enables native understanding of images, charts, diagrams, documents, screenshots, and video frames alongside text. The model uses the Jin unified architecture (ZIP-0408) where visual tokens are interleaved with text tokens in a single attention pass, enabling fine-grained cross-modal reasoning.

## Motivation

Conservation applications require visual understanding: camera trap images for species identification (ZIP-0406), satellite imagery for habitat monitoring, document understanding for research papers, and chart interpretation for conservation status reports. Zen-VL provides this capability as a production model deployable through the Hanzo LLM Gateway.

## Specification

### Architecture

Zen-VL extends Zen Base with:
1. **Vision Encoder**: ViT-based encoder producing visual tokens at dynamic resolution
2. **Visual Adapter**: MLP projecting vision tokens into the language model's embedding space
3. **Interleaved Attention**: Visual and text tokens attend to each other in every transformer layer

### Dynamic Resolution

Unlike fixed-resolution approaches that resize all images to 224x224:
- Images are divided into tiles at their native resolution
- Each tile produces a fixed number of visual tokens
- Total visual tokens scale with image resolution
- High-res images (4K camera trap photos) retain full detail

### Training

1. **Stage 1 -- Alignment**: Train visual adapter on 500M image-text pairs (vision encoder and LLM frozen)
2. **Stage 2 -- Joint training**: Unfreeze all components, train on 50M high-quality vision-language tasks
3. **Stage 3 -- Instruction tuning**: 2M visual instruction-following examples

### Capabilities

| Task | Description | Benchmark |
|------|-------------|-----------|
| Species ID | Identify species from camera trap photos | 94.2% top-1 |
| OCR | Extract text from documents and screenshots | 96.8% accuracy |
| Chart reading | Answer questions about charts and graphs | 88.5% accuracy |
| Video QA | Answer questions about video content | 82.1% accuracy |
| Spatial reasoning | Understand spatial relationships in images | 79.3% accuracy |

## Research Papers

- [zen-vl_whitepaper](~/work/zen/papers/zen-vl_whitepaper.tex) -- Zen-VL architecture and training
- [zen-vision-architecture](~/work/zen/papers/zen-vision-architecture.tex) -- Vision encoder architecture
- [zen3-vl_whitepaper](~/work/zen/papers/zen3-vl_whitepaper.tex) -- Zen3-VL next generation

## Implementation

- **hanzo/jin**: Jin multimodal framework with Zen-VL models
- **hanzo/llm**: LLM Gateway serving Zen-VL for image+text queries
- **hanzo/chat**: Chat interface with image upload and vision understanding

## Timeline

- **Originated**: April 2024 (Zen-VL architecture)
- **Research**: `zen-vl_whitepaper` published Q2 2024, `zen3-vl_whitepaper` published 2025
- **Implementation**: Zen-VL deployed via Hanzo LLM Gateway Q3 2024
