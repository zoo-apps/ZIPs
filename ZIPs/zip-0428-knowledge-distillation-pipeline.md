---
zip: 0428
title: "Knowledge Distillation Pipeline"
description: "Systematic pipeline for distilling large Zen models into smaller, deployment-efficient variants while preserving domain expertise"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-03
traces-from: "ZIP-0413, ZIP-0414 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-knowledge-distillation"
  - "zen/papers/zen-quantization"
  - "zen/papers/zen3-nano_whitepaper"
  - "zen/papers/zen4-mini_whitepaper"
created: 2025-03-01
tags: [distillation, knowledge-transfer, model-compression, small-models, edge-deployment]
requires: [0413, 0414]
references: HIP-0037
license: CC BY 4.0
---

# ZIP-0428: Knowledge Distillation Pipeline

## Abstract

This proposal specifies the knowledge distillation pipeline used to create smaller Zen model variants (Nano, Mini) from larger teacher models (Pro, Max, Ultra). The pipeline preserves domain expertise through progressive distillation, where each stage transfers specific knowledge types (factual, reasoning, coding, conservation) with targeted loss functions. This enables deployment of high-quality Zen models on edge devices, mobile phones, and resource-constrained field stations.

## Motivation

Conservation field stations, ranger smartphones, and camera trap edge processors cannot run 72B parameter models. But they need the intelligence of large models for species identification, threat detection, and conservation guidance. Knowledge distillation bridges this gap by compressing the knowledge of a 72B model into a 1.5B model that runs on a smartphone.

## Specification

### Distillation Pipeline

```
Teacher: Zen-Pro 72B (or Zen-Max 235B)
    │
    │ Stage 1: Logit Distillation
    │ (match teacher's output distribution)
    v
Intermediate: 14B → 7B
    │
    │ Stage 2: Feature Distillation
    │ (match teacher's hidden representations)
    v
Intermediate: 7B → 3B
    │
    │ Stage 3: Task-Specific Distillation
    │ (match teacher on domain-specific tasks)
    v
Student: Zen-Nano 1.5B (or Zen-Mini 600M)
```

### Stage Details

**Stage 1 -- Logit Distillation**:
- Temperature-scaled KL divergence between teacher and student logits
- 100B tokens of diverse web data
- Student architecture: same as target but with fewer layers

**Stage 2 -- Feature Distillation**:
- Linear projection from student hidden states to teacher hidden states
- Layer mapping: student layer i maps to teacher layer f(i) (learned mapping)
- 50B tokens of high-quality data

**Stage 3 -- Task-Specific Distillation**:
- Domain-specific data (code, conservation, reasoning)
- Teacher generates synthetic training data that captures its expertise
- Student trains on this synthetic data with task-specific loss

### Quality Targets

| Student | Teacher | Target Quality | Achieved |
|---------|---------|---------------|----------|
| Zen-Nano 1.5B | Zen-Pro 72B | 80% of teacher | 82.1% |
| Zen-Mini 3B | Zen-Pro 72B | 85% of teacher | 87.3% |
| Zen-Base 7B | Zen-Max 235B | 90% of teacher | 91.8% |

### Edge Deployment Targets

| Model | Device | Memory | Latency | Battery |
|-------|--------|--------|---------|---------|
| Zen-Nano 1.5B | Smartphone (8GB) | 1.2 GB | 50 tok/s | 4h continuous |
| Zen-Mini 3B | Tablet (16GB) | 2.4 GB | 30 tok/s | 3h continuous |
| Zen-Base 7B | Laptop (32GB) | 5.6 GB | 20 tok/s | 2h continuous |

## Research Papers

- [zen-knowledge-distillation](~/work/zen/papers/zen-knowledge-distillation.tex) -- Knowledge distillation methodology
- [zen-quantization](~/work/zen/papers/zen-quantization.tex) -- Post-training quantization for deployment
- [zen3-nano_whitepaper](~/work/zen/papers/zen3-nano_whitepaper.tex) -- Zen3-Nano distilled model
- [zen4-mini_whitepaper](~/work/zen/papers/zen4-mini_whitepaper.tex) -- Zen4-Mini distilled model

## Implementation

- **hanzo/candle**: Rust inference engine optimized for small models
- **hanzo/llm**: LLM Gateway serving distilled model variants
- **zoo/core**: Mobile application with on-device inference

## Timeline

- **Originated**: March 2025 (distillation pipeline design)
- **Research**: `zen-knowledge-distillation` published Q1 2025
- **Implementation**: Zen-Nano and Zen-Mini deployed Q2 2025
