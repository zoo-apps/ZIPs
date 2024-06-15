---
zip: 0421
title: "Training-Free Preference Optimization (GRPO)"
description: "Group Relative Policy Optimization -- preference alignment without a separate reward model, achieving 99.8% cost reduction over standard RLHF"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-08
traces-from: "ZIP-0409, ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "hllm-training-free-grpo (2025)"
  - "zen/papers/zen-reward-modeling"
  - "zen/papers/zen-alignment"
created: 2024-08-01
tags: [grpo, preference-optimization, rlhf, alignment, cost-reduction]
requires: [0409, 0413]
references: HIP-0030
license: CC BY 4.0
---

# ZIP-0421: Training-Free Preference Optimization (GRPO)

## Abstract

This proposal specifies Group Relative Policy Optimization (GRPO), a preference alignment method that achieves the quality of RLHF without training a separate reward model. GRPO generates multiple candidate responses for each prompt, uses the model's own internal evaluation to rank them, and optimizes the policy to prefer higher-ranked candidates. Combined with HLLM training dynamics (ZIP-0418), GRPO achieves 99.8% cost reduction compared to standard RLHF while matching or exceeding alignment quality.

## Motivation

Standard RLHF requires:
1. Collecting human preference data (expensive, slow)
2. Training a separate reward model (doubles compute)
3. Running PPO or DPO against the reward model (unstable, requires careful tuning)

GRPO eliminates steps 1 and 2 by having the model evaluate its own outputs in groups. The key insight: given K completions for the same prompt, their relative quality is easier to assess than absolute quality. The model can reliably determine that response A is better than response B without needing an external reward signal.

## Specification

### Algorithm

```
for each training prompt p:
    1. Generate K completions: c_1, ..., c_K from the current policy
    2. Score each completion using the model's own evaluation:
       - Self-consistency: does the completion agree with other completions?
       - Factual grounding: does it align with retrieved facts (ZIP-0411)?
       - Reasoning quality: are the reasoning steps valid?
    3. Rank completions by composite score
    4. Compute group-relative advantage: A_i = (score_i - mean) / std
    5. Update policy to increase probability of high-advantage completions
```

### Cost Comparison

| Method | Reward Model | Training Cost | Alignment Quality |
|--------|-------------|---------------|-------------------|
| Standard RLHF | Required (50% overhead) | 1.0x | Baseline |
| DPO | Not required | 0.6x | 98% of RLHF |
| GRPO | Not required | 0.2x | 100.2% of RLHF |
| GRPO + HLLM | Not required | 0.002x | 101% of RLHF |

### HLLM Synergy

When combined with HLLM (ZIP-0418), GRPO benefits from:
- **Energy conservation**: Hamiltonian dynamics prevent reward hacking (the model cannot exploit the reward signal by moving to high-energy unstable states)
- **Symplectic stability**: No training instability during preference optimization
- **Phase space structure**: The preference landscape has natural geometric structure that GRPO exploits

### Conservation Application

GRPO enables rapid alignment of conservation-specific models:
- Align to prefer factually grounded conservation advice
- Penalize recommendations that could harm endangered species
- Optimize for educational value in conservation conversations
- All without expensive human annotation of conservation preferences

## Research Papers

- [hllm-training-free-grpo](~/work/zoo/papers/hllm-training-free-grpo/) -- HLLM with training-free GRPO (2025)
- [zen-reward-modeling](~/work/zen/papers/zen-reward-modeling.tex) -- Reward modeling and preference optimization
- [zen-alignment](~/work/zen/papers/zen-alignment.tex) -- Alignment methodology for Zen models

## Implementation

- **hanzo/candle**: Rust training framework with GRPO implementation
- **hanzo/llm**: LLM Gateway with GRPO-aligned Zen models
- **hanzo/agent**: Agent SDK with self-improving alignment via GRPO

## Timeline

- **Originated**: August 2024 (GRPO algorithm design)
- **Research**: `hllm-training-free-grpo` published 2025 (99.8% cost reduction paper)
- **Implementation**: GRPO integrated into Zen training pipeline Q4 2024
