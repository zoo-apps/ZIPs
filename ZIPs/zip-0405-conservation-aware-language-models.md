---
zip: 0405
title: "Conservation-Aware Language Models"
description: "Methodology for training and fine-tuning language models with conservation domain expertise, species knowledge, and ecological reasoning"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2022-06
traces-from: "ZIP-0400 / Whitepaper Sections 03, 08"
follow-on:
  - "zoo-conservation-ai (2022)"
  - "zoo-species-classification (2024)"
  - "zen/papers/zen-finetuning"
  - "zen/papers/zen-training-methodology"
created: 2022-06-01
tags: [conservation-ai, species-models, ecological-reasoning, domain-llm, fine-tuning]
requires: [0400]
references: IUCN-Red-List
repository: https://github.com/zooai/conservation-llm
license: CC BY 4.0
---

# ZIP-0405: Conservation-Aware Language Models

## Abstract

This proposal defines the methodology for creating language models with deep conservation domain expertise. Rather than relying on general-purpose models that treat conservation as one of many topics, this ZIP specifies how to build models that understand species taxonomy, ecological relationships, conservation status, habitat dynamics, and threat assessment at an expert level. The approach combines curated conservation corpora, species-specific fine-tuning, ecological reasoning chains, and factual grounding via the IUCN Red List and other authoritative databases.

## Motivation

General-purpose language models trained on internet data have superficial knowledge of conservation: they can state that tigers are endangered but cannot explain the specific genetic bottlenecks in the South China tiger population, predict how habitat fragmentation in Sumatra affects orangutan migration corridors, or recommend evidence-based interventions for a specific conservation scenario.

The whitepaper (Sections 03 and 08) envisioned AI agents that serve as genuine conservation experts -- capable of answering questions that currently require consulting multiple scientific papers, understanding the cascading effects of ecological interventions, and providing actionable, location-specific conservation advice.

## Specification

### Conservation Corpus

A curated training corpus containing:

| Source | Records | Type |
|--------|---------|------|
| IUCN Red List | 150,000+ species assessments | Structured conservation status |
| GBIF | 2.1B occurrence records | Species observation data |
| Conservation journals | 500,000+ papers | Scientific literature |
| Field reports | 100,000+ reports | Ground-truth observations |
| Indigenous knowledge | Curated oral histories | Traditional ecological knowledge |

### Fine-Tuning Pipeline

1. **Base model**: Start from Zen Base (ZIP-0413) pre-trained model
2. **Domain adaptation**: Continue pre-training on conservation corpus (50B tokens)
3. **Instruction tuning**: 100K conservation Q&A pairs from expert-annotated dataset
4. **RLHF**: Reward model trained on conservation expert preferences
5. **Factual grounding**: RAG integration with IUCN database for real-time accuracy

### Ecological Reasoning

The model must support multi-step ecological reasoning:

```
Q: "If we restore the wolf population in Yellowstone, what happens to the elk?"
Chain:
1. Wolves are apex predators of elk
2. Wolf reintroduction creates "ecology of fear" -- elk avoid open meadows
3. Reduced elk browsing allows willow and aspen regeneration
4. Riparian vegetation recovery stabilizes stream banks
5. Beaver populations recover (food source restored)
6. Beaver dams create wetland habitats
7. Biodiversity increases in cascade
A: "Wolf restoration triggers a trophic cascade..."
```

### Evaluation Metrics

- Species identification accuracy (top-1, top-5)
- Conservation status correctness (exact match with IUCN)
- Ecological reasoning validity (expert-rated chain correctness)
- Harmful advice detection (never recommend actions that harm species)

## Research Papers

- [zoo-conservation-ai](~/work/zoo/papers/zoo-conservation-ai/) -- AI-driven conservation monitoring (2022)
- [zoo-species-classification](~/work/zoo/papers/zoo-species-classification/) -- ML pipeline for species detection (2024)
- [zen-finetuning](~/work/zen/papers/zen-finetuning.tex) -- Fine-tuning methodology for Zen models
- [zen-training-methodology](~/work/zen/papers/zen-training-methodology.tex) -- Training methodology for the Zen family

## Implementation

- **hanzo/jin**: Multimodal LLM with conservation domain fine-tuning
- **hanzo/llm**: LLM Gateway serving conservation-tuned Zen models
- **zoo/core**: Application with species knowledge graph integration

## Timeline

- **Originated**: June 2022 (early conservation AI research)
- **Research**: `zoo-conservation-ai` published 2022, `zoo-species-classification` published 2024
- **Implementation**: Zen models with conservation fine-tuning available via Hanzo LLM Gateway 2024
