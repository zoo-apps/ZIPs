---
zip: 0433
title: "Spatial Web Active Inference"
description: "Framework for AI agents that operate in spatial environments (AR, VR, physical world) using active inference for navigation, interaction, and decision-making"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-08
traces-from: "ZIP-0402, ZIP-0408 / Whitepaper Sections 09, 12"
follow-on:
  - "zoo-spatial-web-agents (2024)"
  - "zen/papers/zen-3d"
  - "zen/papers/zen-world"
created: 2025-08-01
tags: [spatial-web, active-inference, ar, vr, embodied-ai, world-model]
requires: [0402, 0408]
references: HSTP, W3C-XR
license: CC BY 4.0
---

# ZIP-0433: Spatial Web Active Inference

## Abstract

This proposal specifies a framework for AI agents that operate in spatial environments -- augmented reality, virtual reality, and the physical world -- using active inference for navigation, interaction, and decision-making. The whitepaper (Sections 09 and 12) envisioned an AR application where Zoo animal companions exist in the user's physical environment and metaverse companions that inhabit virtual worlds. This ZIP formalizes the spatial reasoning and active inference mechanisms that make this possible.

## Motivation

The whitepaper described two spatial experiences:
1. **AR App (Section 09)**: Point your phone at a park and see your Zoo animal companion exploring it, identifying real species, and teaching you about the local ecosystem
2. **Metaverse Companion (Section 12)**: Your Zoo animal lives in a virtual habitat, interacts with other animals, and can be visited in VR

Both require agents that understand 3D space, can navigate environments, interact with objects and other agents, and make spatial decisions. Active inference provides the theoretical framework: agents maintain a generative model of the world, predict the consequences of actions, and choose actions that minimize surprise (free energy).

## Specification

### Active Inference Framework

```
Agent State = (Beliefs, Preferences, Policies)

Loop:
  1. Observe: receive sensory input (camera, depth, audio, GPS)
  2. Update: update beliefs about world state (Bayesian inference)
  3. Predict: generate predictions about future states for each policy
  4. Evaluate: score policies by expected free energy (surprise + preference mismatch)
  5. Act: execute the policy with lowest expected free energy
  6. Learn: update generative model based on prediction errors
```

### World Model

The agent maintains a generative model of its environment:

| Component | Representation | Updates |
|-----------|---------------|---------|
| Geometry | Neural radiance field (NeRF) or 3D Gaussian splatting | Continuous from visual input |
| Semantics | 3D semantic map (what is each point in space?) | From Zen-VL inference |
| Dynamics | Physics engine + learned dynamics model | From observation of motion |
| Agents | Other agents' positions, states, predicted behaviors | From social inference |
| Objects | Graspable/interactable objects with affordances | From vision + common sense |

### Spatial Interactions

| Interaction | Description | Technology |
|------------|-------------|------------|
| Navigation | Move through 3D space toward goals | Pathfinding + active inference |
| Object interaction | Pick up, examine, use objects | Affordance detection + physics |
| Social interaction | Communicate with other agents | NLP + gesture + spatial proximity |
| Teaching | Guide user to interesting species/features | POI detection + pedagogical planning |
| Exploration | Autonomously explore and map environment | Curiosity-driven active inference |

## Research Papers

- [zoo-spatial-web-agents](~/work/zoo/papers/zoo-spatial-web-agents/) -- Spatial Web agent architecture (2024)
- [zen-3d](~/work/zen/papers/zen-3d.tex) -- 3D understanding and generation for Zen
- [zen-world](~/work/zen/papers/zen-world.tex) -- World model architecture for spatial AI

## Implementation

- **hanzo/jin**: Jin multimodal framework with 3D/spatial input
- **zoo/app**: AR application with spatial agent rendering
- **zoo/core**: Metaverse companion system with virtual habitats

## Timeline

- **Originated**: August 2025 (spatial web active inference specification)
- **Research**: `zoo-spatial-web-agents` published 2024, `zen-3d` and `zen-world` published 2025
- **Implementation**: AR companion app with spatial agents deployed 2025
