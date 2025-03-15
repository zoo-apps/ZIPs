---
zip: 0430
title: "AI Safety Framework (Zen-Guard)"
description: "Comprehensive AI safety framework including content filtering, guardrails, jailbreak prevention, and conservation-specific safety constraints"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-05
traces-from: "ZIP-0400, ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-ai-safety"
  - "zen/papers/zen-safety-evaluation"
  - "zen/papers/zen3-guard_whitepaper"
  - "zen/papers/zen-guard-gen_whitepaper"
  - "zen/papers/zen-guard-stream_whitepaper"
created: 2025-05-01
tags: [ai-safety, guardrails, content-filter, zen-guard, jailbreak-prevention]
requires: [0413]
references: HIP-0039
license: CC BY 4.0
---

# ZIP-0430: AI Safety Framework (Zen-Guard)

## Abstract

This proposal specifies Zen-Guard, a comprehensive AI safety framework providing content filtering, guardrails, jailbreak prevention, and domain-specific safety constraints for all Zen models. Zen-Guard operates as both a standalone classifier model and a set of runtime constraints integrated into the Hanzo LLM Gateway. For conservation applications, Zen-Guard includes species-specific safety rules (never reveal endangered species locations, never recommend actions that could harm wildlife).

## Motivation

Conservation AI has unique safety requirements beyond standard content filtering:

1. **Location secrecy**: Never reveal GPS coordinates of critically endangered species
2. **Intervention safety**: Never recommend conservation actions without expert review
3. **Cultural sensitivity**: Respect indigenous knowledge protocols and data sovereignty
4. **Emotional safety**: Conservation conversations can involve distressing content (poaching, extinction); agents must handle this sensitively
5. **Factual safety**: Conservation misinformation (e.g., incorrect species status) can lead to misallocated resources

## Specification

### Architecture

```
User Input
    │
    v
┌──────────────┐
│ Zen-Guard    │ ← Pre-filter (block harmful inputs)
│ Input Filter │
└──────┬───────┘
       │ (safe inputs pass through)
       v
┌──────────────┐
│ Zen Model    │ ← Main model generates response
│ (inference)  │
└──────┬───────┘
       │
       v
┌──────────────┐
│ Zen-Guard    │ ← Post-filter (block harmful outputs)
│ Output Filter│
└──────┬───────┘
       │
       v
┌──────────────┐
│ Zen-Guard    │ ← Streaming filter (real-time monitoring)
│ Stream Guard │
└──────┬───────┘
       │ (safe response delivered)
       v
User Response
```

### Guard Models

| Model | Parameters | Latency | Purpose |
|-------|-----------|---------|---------|
| Zen-Guard | 1.5B | 10ms | General content classification |
| Zen-Guard-Gen | 7B | 30ms | Generation-specific safety |
| Zen-Guard-Stream | 600M | 5ms | Real-time streaming filter |

### Conservation Safety Rules

| Rule | Severity | Action |
|------|----------|--------|
| Endangered species location | Critical | Block + alert |
| Poaching technique | Critical | Block + report |
| Incorrect conservation status | High | Correct + cite source |
| Harmful intervention advice | High | Block + suggest expert consultation |
| Cultural protocol violation | High | Block + explain protocol |
| Age-inappropriate content | Medium | Redirect |
| Unverified conservation claim | Low | Flag + request citation |

### Evaluation

- Red-team adversarial testing with conservation-specific attack vectors
- Automated jailbreak detection (prompt injection, role-play attacks)
- Human evaluation by conservation domain experts
- Continuous monitoring of production conversations for safety violations

## Research Papers

- [hanzo-ai-safety](~/work/hanzo/papers/hanzo-ai-safety/) -- Hanzo AI safety framework
- [zen-safety-evaluation](~/work/zen/papers/zen-safety-evaluation.tex) -- Safety evaluation methodology
- [zen3-guard_whitepaper](~/work/zen/papers/zen3-guard_whitepaper.tex) -- Zen3-Guard model whitepaper
- [zen-guard-gen_whitepaper](~/work/zen/papers/zen-guard-gen_whitepaper.tex) -- Zen-Guard-Gen model
- [zen-guard-stream_whitepaper](~/work/zen/papers/zen-guard-stream_whitepaper.tex) -- Zen-Guard-Stream model

## Implementation

- **hanzo/llm**: LLM Gateway with Zen-Guard integration
- **hanzo/chat**: Chat interface with safety guardrails
- **hanzo/agent**: Agent SDK with safety constraints

## Timeline

- **Originated**: May 2025 (Zen-Guard design)
- **Research**: `zen-safety-evaluation` published Q2 2025, guard model whitepapers Q3 2025
- **Implementation**: Zen-Guard deployed in Hanzo LLM Gateway Q2 2025
