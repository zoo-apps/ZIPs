---
zip: 0431
title: "Neural Machine Translation (Zen-Translator)"
description: "Zen-Translator -- high-quality neural machine translation across 100+ languages with conservation domain specialization"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-06
traces-from: "ZIP-0429 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-translator"
  - "zen/papers/zen-translator_whitepaper"
  - "zen/papers/zen-dub_whitepaper"
  - "zen/papers/zen-dub-live_whitepaper"
created: 2025-06-01
tags: [translation, nmt, zen-translator, dubbing, localization]
requires: [0429]
references: HIP-0040
license: CC BY 4.0
---

# ZIP-0431: Neural Machine Translation (Zen-Translator)

## Abstract

This proposal specifies Zen-Translator, a neural machine translation system that provides high-quality translation across 100+ languages with conservation domain specialization. Beyond text translation, Zen-Translator powers Zen-Dub (audio dubbing) and Zen-Dub-Live (real-time interpretation), enabling conservation content to reach global audiences in their native language. The system maintains conservation-specific terminology accuracy (species names, habitat terms, conservation status) across all language pairs.

## Motivation

Conservation research is published predominantly in English, but conservation action happens in local languages. A field ranger in the Congo needs anti-poaching protocols in Lingala. A community conservation program in Peru needs educational materials in Quechua. Zen-Translator bridges this language gap with domain-aware translation that correctly handles conservation terminology.

## Specification

### Architecture

- **Base**: Zen-Pro 72B encoder-decoder adapted for translation
- **Languages**: 100+ language pairs
- **Domain adaptation**: Conservation corpus fine-tuning for each language pair
- **Terminology engine**: Conservation glossary enforcement during translation

### Translation Quality

| Language Pair | BLEU | COMET | Conservation Accuracy |
|--------------|------|-------|----------------------|
| EN -> ES | 42.1 | 0.891 | 97.2% |
| EN -> ZH | 38.5 | 0.872 | 95.8% |
| EN -> SW | 35.2 | 0.843 | 93.1% |
| EN -> ID | 39.7 | 0.878 | 96.4% |
| EN -> QU | 28.3 | 0.801 | 89.5% |

### Zen-Dub (Audio Dubbing)

1. **Transcription**: Source audio transcribed via Zen-Live (ZIP-0417)
2. **Translation**: Text translated via Zen-Translator
3. **Voice synthesis**: Translated text synthesized in speaker's voice style
4. **Timing alignment**: Dubbed audio aligned to original video timing

### Zen-Dub-Live (Real-Time Interpretation)

- Latency: < 2 seconds end-to-end
- Simultaneous interpretation: translates as speaker talks (not waiting for sentence end)
- Conservation mode: holds back translation until species names are fully recognized

## Research Papers

- [zen-translator](~/work/zen/papers/zen-translator.tex) -- Zen-Translator architecture
- [zen-translator_whitepaper](~/work/hanzo/papers/zen/zen-translator_whitepaper.tex) -- Zen-Translator model whitepaper
- [zen-dub_whitepaper](~/work/zen/papers/zen-dub_whitepaper.tex) -- Zen-Dub audio dubbing
- [zen-dub-live_whitepaper](~/work/zen/papers/zen-dub-live_whitepaper.tex) -- Zen-Dub-Live real-time interpretation

## Implementation

- **hanzo/llm**: LLM Gateway with translation endpoints
- **hanzo/jin**: Jin multimodal framework for audio dubbing
- **hanzo/chat**: Chat interface with inline translation

## Timeline

- **Originated**: June 2025 (Zen-Translator architecture)
- **Research**: `zen-translator` published Q2 2025, dubbing papers Q3 2025
- **Implementation**: Zen-Translator deployed via Hanzo LLM Gateway Q3 2025
