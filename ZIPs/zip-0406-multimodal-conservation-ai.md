---
zip: 0406
title: "Multi-Modal Conservation AI"
description: "Unified vision + NLP architecture for species identification, habitat assessment, and conservation monitoring across image, audio, and text modalities"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2022-09
traces-from: "ZIP-0405 / Whitepaper Sections 03, 08, 09"
follow-on:
  - "zoo-species-classification (2024)"
  - "zoo-satellite-ecology (2025)"
  - "zen/papers/zen-multimodal-architecture"
  - "zen/papers/zen-vision-architecture"
created: 2022-09-01
tags: [multimodal-ai, computer-vision, species-identification, acoustic-monitoring, satellite-imagery]
requires: [0405]
references: eBird, Merlin
repository: https://github.com/zooai/multimodal-conservation
license: CC BY 4.0
---

# ZIP-0406: Multi-Modal Conservation AI

## Abstract

This proposal defines a unified multimodal AI architecture for conservation that processes camera trap images, satellite imagery, acoustic recordings, and text-based field reports through a single model. Rather than maintaining separate specialized models for each modality, this ZIP specifies how a single architecture can identify species from photographs, detect deforestation from satellite data, classify bird calls from audio, and extract conservation-relevant information from text -- all within one inference pass. This became the precursor to the Jin multimodal architecture (ZIP-0408) and the Zen-VL vision-language models (ZIP-0416).

## Motivation

Conservation monitoring generates data across multiple modalities:

- **Camera traps**: 15 million images per year from the TEAM Network alone
- **Acoustic sensors**: Continuous audio from rain forests, coral reefs, and grasslands
- **Satellite imagery**: Daily global coverage at sub-meter resolution
- **Field reports**: Thousands of unstructured text reports from rangers and researchers

Each modality was traditionally processed by separate ML pipelines with no cross-modal reasoning. But ecological questions are inherently multimodal: "Is the species seen in this camera trap image the same one heard in this audio recording from the same location?"

## Specification

### Unified Architecture

```
Input Encoders          Fusion Layer          Output Heads
┌─────────────┐
│ Vision Enc.  │──┐
│ (ViT-based)  │  │     ┌──────────────┐    ┌─────────────────┐
└─────────────┘  ├────>│  Cross-Modal  │───>│ Species ID      │
┌─────────────┐  │     │  Attention    │    │ Habitat Status  │
│ Audio Enc.   │──┤     │  Transformer  │    │ Threat Detection│
│ (Whisper-d)  │  │     └──────────────┘    │ Population Est. │
└─────────────┘  │                          │ Text Generation │
┌─────────────┐  │                          └─────────────────┘
│ Text Enc.    │──┤
│ (Zen Base)   │  │
└─────────────┘  │
┌─────────────┐  │
│ Satellite    │──┘
│ Enc. (SAM-d) │
└─────────────┘
```

### Modality-Specific Processing

**Camera Trap Images**:
- Species identification across 50,000+ species
- Individual animal re-identification (stripe/spot patterns)
- Behavior classification (feeding, mating, resting, fleeing)
- Empty frame detection (false triggers)

**Acoustic Data**:
- Bird call identification (10,000+ species via spectrograms)
- Megafauna detection (elephant infrasound, whale calls)
- Chainsaw/gunshot detection for anti-poaching (ZIP-0503)
- Biodiversity index estimation from acoustic complexity

**Satellite Imagery**:
- Deforestation detection (change detection at 10m resolution)
- Habitat fragmentation analysis
- Water body monitoring (drought, flooding)
- Urban encroachment tracking

**Text Reports**:
- Entity extraction (species, locations, dates, threats)
- Sentiment analysis for conservation urgency
- Cross-reference with camera trap and satellite data

### Cross-Modal Reasoning

The fusion layer enables queries like:
- "Show me all camera trap images from locations where satellite data shows recent deforestation"
- "Correlate acoustic biodiversity index with habitat fragmentation maps"
- "Identify species in this photo and find all acoustic recordings of the same species within 50km"

## Research Papers

- [zoo-species-classification](~/work/zoo/papers/zoo-species-classification/) -- ML pipeline for species detection (2024)
- [zoo-satellite-ecology](~/work/zoo/papers/zoo-satellite-ecology/) -- Satellite-based ecological monitoring (2025)
- [zen-multimodal-architecture](~/work/zen/papers/zen-multimodal-architecture.tex) -- Zen unified multimodal architecture
- [zen-vision-architecture](~/work/zen/papers/zen-vision-architecture.tex) -- Zen vision encoder architecture

## Implementation

- **hanzo/jin**: Multimodal LLM with vision, audio, and text processing
- **hanzo/candle**: Rust ML framework for efficient multimodal inference
- **zoo/core**: Application with multimodal conservation dashboard

## Timeline

- **Originated**: September 2022 (multimodal conservation research)
- **Research**: `zoo-species-classification` published 2024, `zoo-satellite-ecology` published 2025
- **Implementation**: Jin multimodal architecture deployed 2023, Zen-VL models 2024
