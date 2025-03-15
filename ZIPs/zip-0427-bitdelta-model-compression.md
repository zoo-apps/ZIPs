---
zip: 0427
title: "BitDelta Model Compression"
description: "1-bit delta compression for model personalization and distribution, enabling efficient fine-tuned model sharing at 99% compression ratio"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-02
traces-from: "ZIP-0413, ZIP-0414 / Whitepaper Section 08"
follow-on:
  - "zoo-bitdelta-deltasoup (2024)"
  - "zen/papers/zen-quantization"
  - "zen/papers/zen-knowledge-distillation"
created: 2025-02-01
tags: [bitdelta, model-compression, quantization, personalization, delta-encoding]
requires: [0413, 0414]
references: HIP-0036
license: CC BY 4.0
---

# ZIP-0427: BitDelta Model Compression

## Abstract

This proposal specifies BitDelta, a model compression technique that represents fine-tuned model variants as 1-bit deltas from a shared base model. Instead of storing full model weights for each specialized variant (conservation, code, medical, etc.), BitDelta stores only the binary differences (sign of weight change), achieving 99% compression. This enables efficient distribution of thousands of specialized model variants over limited bandwidth networks -- critical for the decentralized training infrastructure (ZIP-0407) and federated wildlife monitoring (ZIP-0424).

## Motivation

The Zen model family (ZIP-0413) has dozens of specialized variants. Distributing each as a full model requires:
- Zen-Base 7B: 14 GB per variant (FP16)
- 20 variants: 280 GB total
- Field stations with 1 Mbps satellite links: 26 days to download all variants

BitDelta reduces this to:
- Zen-Base 7B: 14 GB (base, downloaded once)
- Each delta: 0.88 GB (1-bit per parameter)
- 20 deltas: 17.6 GB (6.3% of full distribution)
- Download time: 1.6 days total (1 day for base + 0.6 days for all deltas)

## Specification

### Delta Computation

Given base model weights W_base and fine-tuned weights W_fine:

```
delta = sign(W_fine - W_base)    # 1-bit per parameter
scale = mean(|W_fine - W_base|)  # single scalar per layer
W_reconstructed = W_base + scale * delta
```

### DeltaSoup: Composing Multiple Deltas

Multiple domain deltas can be combined:

```
W_composed = W_base + alpha_1 * scale_1 * delta_1
                    + alpha_2 * scale_2 * delta_2
                    + ...
```

Where alpha_i are learned or user-specified mixing weights. This enables:
- Conservation + code: an agent that can both identify species and write analysis scripts
- Medical + multilingual: a model that understands both medical terminology and local languages

### Compression Ratios

| Method | Size per Variant (7B) | Compression |
|--------|----------------------|-------------|
| Full FP16 | 14 GB | 1x |
| LoRA | 0.5-2 GB | 7-28x |
| QLoRA | 0.25-1 GB | 14-56x |
| BitDelta | 0.88 GB | 16x |
| BitDelta + gzip | 0.11 GB | 127x |

### Quality Retention

| Benchmark | Base | Fine-tuned | BitDelta | Retention |
|-----------|------|-----------|----------|-----------|
| MMLU | 68.2 | 72.1 | 71.8 | 99.6% |
| HumanEval | 72.0 | 85.3 | 84.9 | 99.5% |
| Species ID | 88.0 | 96.2 | 95.8 | 99.6% |

## Research Papers

- [zoo-bitdelta-deltasoup](~/work/zoo/papers/zoo-bitdelta-deltasoup/) -- BitDelta and DeltaSoup specification
- [zen-quantization](~/work/zen/papers/zen-quantization.tex) -- Quantization techniques for Zen models
- [zen-knowledge-distillation](~/work/zen/papers/zen-knowledge-distillation.tex) -- Knowledge distillation pipeline

## Implementation

- **hanzo/candle**: Rust ML framework with BitDelta support
- **hanzo/llm**: LLM Gateway with delta-composed model serving
- **zoo/core**: Application with personalized model variants

## Timeline

- **Originated**: February 2025 (BitDelta compression research)
- **Research**: `zoo-bitdelta-deltasoup` published 2024
- **Implementation**: BitDelta distribution in Hanzo infrastructure 2025
