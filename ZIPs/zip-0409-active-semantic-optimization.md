---
zip: 0409
title: "Active Semantic Optimization (ASO)"
description: "Protocol for continuous model improvement through active learning, semantic feedback loops, and human-in-the-loop optimization"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2023-06
traces-from: "ZIP-0401 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-aso"
  - "zen/papers/zen-aso-protocol"
  - "zen/papers/zen-reward-modeling"
created: 2023-06-01
tags: [aso, active-learning, semantic-optimization, reward-modeling, rlhf]
requires: [0401, 0405]
references: HIP-0002
repository: https://github.com/hanzoai/aso
license: CC BY 4.0
---

# ZIP-0409: Active Semantic Optimization (ASO)

## Abstract

This proposal specifies the Active Semantic Optimization (ASO) protocol, a framework for continuous model improvement that combines active learning, semantic feedback loops, and human-in-the-loop optimization. ASO enables models to identify their own knowledge gaps, actively seek the most informative training signals, and incorporate human expert feedback in a sample-efficient manner. ASO is the centralized counterpart to DSO (ZIP-0410) -- where DSO distributes training across nodes, ASO optimizes what each node learns.

## Motivation

Traditional model training follows a batch paradigm: collect data, train model, deploy, repeat. This has three problems for conservation AI:

1. **Distribution shift**: Conservation data changes constantly (species migrate, habitats degrade, new threats emerge). A batch-trained model becomes stale within months.
2. **Sample inefficiency**: Not all data is equally informative. A model that has seen 10,000 photos of common sparrows gains little from the 10,001st, but a single photo of an ivory-billed woodpecker could update its entire species status assessment.
3. **Expert scarcity**: Conservation domain experts are rare and expensive. Their feedback must be directed to the samples where it has maximum impact.

ASO solves these by having the model actively select what to learn next, prioritizing samples that would maximally reduce its uncertainty.

## Specification

### Protocol Flow

```
1. Model generates predictions on new incoming data
2. Uncertainty estimator identifies high-uncertainty predictions
3. Active selector picks the most informative samples
4. Expert labeler (human or automated) labels selected samples
5. Semantic optimizer updates the model using labeled data
6. Memory system (ZIP-0401) records what was learned and why
7. Loop continues indefinitely
```

### Uncertainty Estimation

Three complementary uncertainty signals:

| Signal | Measures | Method |
|--------|----------|--------|
| Epistemic | Model's knowledge gaps | MC Dropout / ensemble disagreement |
| Aleatoric | Inherent data noise | Predicted variance |
| Semantic | Conceptual novelty | Distance from known semantic clusters (ZIP-0404) |

### Active Selection Strategies

1. **Maximum uncertainty**: Select samples where model is least confident
2. **Maximum information gain**: Select samples that would maximally reduce total uncertainty
3. **Conservation priority**: Weight selection by conservation urgency (endangered species get priority)
4. **Diversity**: Ensure selected batch covers diverse species, habitats, and threat types

### Semantic Feedback Loop

When a human expert corrects the model, ASO does not just update on that single sample. It:
1. Identifies all semantically similar samples in the memory system (ZIP-0404)
2. Propagates the correction through the semantic neighborhood
3. Updates confidence scores for related knowledge
4. Records the correction provenance for audit trail

## Research Papers

- [hanzo-aso](~/work/hanzo/papers/hanzo-aso/) -- Active Semantic Optimization protocol specification
- [zen-aso-protocol](~/work/zen/papers/zen-aso-protocol.tex) -- ASO implementation for Zen models
- [zen-reward-modeling](~/work/zen/papers/zen-reward-modeling.tex) -- Reward modeling for RLHF in ASO loops

## Implementation

- **hanzo/llm**: LLM Gateway with ASO feedback integration
- **hanzo/agent**: Agent SDK with active learning capabilities
- **hanzo/python-sdk**: Python SDK for ASO pipeline construction

## Timeline

- **Originated**: June 2023 (ASO protocol design)
- **Research**: `hanzo-aso` published 2023, `zen-aso-protocol` published 2024
- **Implementation**: ASO integrated into Hanzo LLM Gateway 2024
