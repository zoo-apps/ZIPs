---
zip: 0417
title: "Real-Time Conversational AI (Zen-Live)"
description: "Zen-Live -- low-latency streaming model for real-time voice conversation, live video understanding, and interactive tutoring"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-05
traces-from: "ZIP-0400, ZIP-0408 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-live_whitepaper"
  - "zen/papers/zen-audio-architecture"
  - "zen/papers/zen-voice-clone"
created: 2024-05-01
tags: [real-time-ai, zen-live, voice-conversation, streaming, low-latency]
requires: [0400, 0408, 0413]
references: HIP-0024
license: CC BY 4.0
---

# ZIP-0417: Real-Time Conversational AI (Zen-Live)

## Abstract

This proposal specifies Zen-Live, the real-time conversational variant of the Zen model family. Zen-Live enables sub-200ms latency voice conversations with AI agents, live video understanding (e.g., pointing a camera at a bird and asking "what species is this?"), and interactive tutoring sessions. The model uses speculative decoding, streaming output, and an optimized audio codec to achieve real-time performance while maintaining the quality of the Zen-Pro model.

## Motivation

The whitepaper's vision (Section 08) of conversational AI companions requires real-time interaction -- not the multi-second latency typical of API-based LLM calls. When a user is on a nature walk with their Zoo companion app, they need:

1. Instant voice responses (< 200ms end-to-end latency)
2. Live video understanding (identify species from camera feed)
3. Interruptible conversation (user can speak while agent is responding)
4. Emotional expressiveness (tone of voice conveys excitement about a rare sighting)

## Specification

### Architecture

```
Microphone ─> Audio Codec ─> Token Encoder ─> ┐
Camera ─> Frame Sampler ─> Vision Encoder ─> ─┤
Text Input ─> Tokenizer ─────────────────────> ├─> Zen-Live Model ─> Streaming Output
                                               │     (speculative    ├─> Audio Codec ─> Speaker
                                               │      decoding)      ├─> Text Stream
                                               └─────────────────────└─> Video Annotations
```

### Latency Budget

| Component | Budget |
|-----------|--------|
| Audio capture + encoding | 20ms |
| Network (edge inference) | 10ms |
| Model inference (first token) | 80ms |
| Audio synthesis (first chunk) | 40ms |
| Network (return) | 10ms |
| Audio playback buffer | 40ms |
| **Total end-to-end** | **< 200ms** |

### Speculative Decoding

Zen-Live uses a small draft model (1.5B params) to generate candidate continuations, which the main model (7B+ params) verifies in a single forward pass. This achieves 3-4x throughput improvement for real-time streaming.

### Audio Codec

Custom neural audio codec with:
- 24kHz sample rate, 16-bit depth
- 1.5 kbps encoding rate (extremely efficient for voice)
- Emotional encoding: tone, pace, emphasis encoded as separate streams
- Speaker identity preservation for consistent agent voice

### Capabilities

- **Voice conversation**: Natural back-and-forth voice dialogue
- **Live video QA**: Real-time visual question answering from camera feed
- **Interruption handling**: Graceful handling of user interruptions mid-response
- **Multilingual voice**: Real-time conversation in 30+ languages
- **Emotional expression**: Agent voice conveys appropriate emotions

## Research Papers

- [zen-live_whitepaper](~/work/zen/papers/zen-live_whitepaper.tex) -- Zen-Live real-time model whitepaper
- [zen-audio-architecture](~/work/zen/papers/zen-audio-architecture.tex) -- Audio encoder/decoder architecture
- [zen-voice-clone](~/work/zen/papers/zen-voice-clone.tex) -- Voice cloning and synthesis technology

## Implementation

- **hanzo/jin**: Jin multimodal framework with real-time streaming
- **hanzo/llm**: LLM Gateway with streaming inference support
- **hanzo/chat**: Chat interface with voice conversation mode

## Timeline

- **Originated**: May 2024 (Zen-Live architecture)
- **Research**: `zen-live_whitepaper` published Q3 2024
- **Implementation**: Zen-Live deployed via Hanzo LLM Gateway Q4 2024
