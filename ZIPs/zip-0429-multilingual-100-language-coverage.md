---
zip: 0429
title: "Multilingual 100+ Language Coverage"
description: "Native multilingual support across 100+ languages for Zen models, with emphasis on languages spoken in biodiversity hotspot regions"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-04
traces-from: "ZIP-0400, ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-multilingual"
  - "zen/papers/zen-translator"
  - "zen/papers/zen-translator_whitepaper"
created: 2025-04-01
tags: [multilingual, language-coverage, translation, conservation-languages, low-resource]
requires: [0413]
references: HIP-0038
license: CC BY 4.0
---

# ZIP-0429: Multilingual 100+ Language Coverage

## Abstract

This proposal specifies the multilingual strategy for the Zen model family, covering 100+ languages with particular emphasis on languages spoken in biodiversity hotspot regions. Conservation is a global effort, and the AI assistants envisioned in the whitepaper (ZIP-0400) must communicate with communities in their native languages -- including low-resource languages like Malay, Quechua, Swahili, and Bahasa Indonesia that are poorly served by existing LLMs.

## Motivation

The world's 36 biodiversity hotspots are predominantly in regions where English is not the primary language:
- Sundaland (Indonesia, Malaysia): Bahasa Indonesia, Malay
- Tropical Andes (Peru, Ecuador, Colombia): Spanish, Quechua
- Eastern Afromontane (Kenya, Tanzania, Ethiopia): Swahili, Amharic
- Indo-Burma (Myanmar, Thailand, Vietnam): Burmese, Thai, Vietnamese
- Madagascar: Malagasy, French

Conservation agents (ZIP-0400) that can only communicate in English are useless in these regions. Effective conservation AI must speak the local language.

## Specification

### Language Tiers

| Tier | Languages | Data Volume | Quality Target |
|------|-----------|------------|----------------|
| Tier 1 (high-resource) | English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Russian, Arabic | 10T+ tokens | SOTA |
| Tier 2 (medium-resource) | Hindi, Indonesian, Thai, Vietnamese, Turkish, Polish, Dutch, Swedish, Czech, Romanian, + 30 more | 100B-1T tokens | 90% of Tier 1 |
| Tier 3 (conservation-critical) | Swahili, Quechua, Malagasy, Burmese, Khmer, Lao, Nepali, Sinhala, + 30 more | 1B-100B tokens | 80% of Tier 1 |
| Tier 4 (emerging) | Endangered and indigenous languages | < 1B tokens | Basic capability |

### Training Strategy

1. **Tokenizer**: Byte-level BPE with 152K vocabulary, ensuring all languages have efficient tokenization (max 1.5x token expansion vs English)
2. **Pre-training**: Multilingual web data with language-balanced sampling (upweight low-resource languages)
3. **Cross-lingual transfer**: Leverage high-resource languages to improve low-resource performance via shared representations
4. **Translation alignment**: Parallel corpus training for cross-lingual consistency
5. **Domain-specific**: Conservation terminology in local languages (species names, habitat terms, threat descriptions)

### Conservation Glossary

Maintain a multilingual conservation glossary:
- Scientific species names mapped to local common names
- Conservation status terms in local language
- Habitat descriptions in locally meaningful terms
- Threat descriptions using local context (e.g., "slash-and-burn" in local terminology)

### Evaluation

- MMLU-multilingual across all Tier 1-3 languages
- Translation quality (BLEU, COMET) for conservation-specific content
- Species name recognition in local languages
- Community feedback from pilot deployments in 10 biodiversity hotspots

## Research Papers

- [zen-multilingual](~/work/zen/papers/zen-multilingual.tex) -- Multilingual architecture and training
- [zen-translator](~/work/zen/papers/zen-translator.tex) -- Zen-Translator neural machine translation
- [zen-translator_whitepaper](~/work/hanzo/papers/zen/zen-translator_whitepaper.tex) -- Zen-Translator model whitepaper

## Implementation

- **hanzo/llm**: LLM Gateway with multilingual model serving
- **hanzo/chat**: Chat interface with 100+ language support
- **zoo/core**: Application with multilingual conservation content

## Timeline

- **Originated**: April 2025 (multilingual strategy)
- **Research**: `zen-multilingual` published Q2 2025
- **Implementation**: 100+ language coverage in Zen models deployed Q3 2025
