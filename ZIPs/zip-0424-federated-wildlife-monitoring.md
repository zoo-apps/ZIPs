---
zip: 0424
title: "Federated Wildlife Monitoring"
description: "Federated learning system for wildlife monitoring that trains on distributed camera trap, acoustic, and satellite data without centralizing sensitive location data"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-11
traces-from: "ZIP-0406, ZIP-0410, ZIP-0423 / Whitepaper Section 03"
follow-on:
  - "zoo-federated-wildlife (2025)"
  - "zen/papers/zen-privacy-federated"
created: 2024-11-01
tags: [federated-learning, wildlife-monitoring, camera-traps, distributed-training, conservation]
requires: [0406, 0410, 0423]
references: TEAM-Network
repository: https://github.com/zooai/federated-wildlife
license: CC BY 4.0
---

# ZIP-0424: Federated Wildlife Monitoring

## Abstract

This proposal specifies a federated learning system for wildlife monitoring that trains species identification, population estimation, and threat detection models across a distributed network of conservation field stations, national parks, and research institutions. Each node trains on its local camera trap images, acoustic recordings, and satellite data without sharing raw data, using the DSO protocol (ZIP-0410) for gradient exchange and FHE (ZIP-0423) for additional privacy when needed. The system produces globally accurate wildlife models while respecting data sovereignty of each participating organization.

## Motivation

Wildlife monitoring data is distributed across hundreds of organizations worldwide:
- 150+ TEAM Network field stations with camera traps
- National parks with acoustic monitoring arrays
- Universities with satellite imagery analysis programs
- NGOs with field survey databases

Each organization is reluctant to share raw data due to:
- Species location sensitivity (poaching risk)
- Legal data sovereignty requirements
- Institutional IP concerns
- Network bandwidth limitations (camera traps in remote locations)

Federated learning enables these organizations to collaboratively train a global model without sharing any raw data.

## Specification

### Federation Architecture

```
Central Coordinator (Zoo Labs Foundation)
├── Model Registry: current global model versions
├── Round Manager: orchestrates training rounds
├── Aggregator: DSO gradient aggregation (ZIP-0410)
└── Quality Monitor: detects model drift and poisoning

Field Stations (distributed worldwide)
├── Local Data Store: camera trap / acoustic / satellite data
├── Local Trainer: trains on local data
├── Privacy Engine: FHE or differential privacy (ZIP-0423)
└── DSO Client: semantic gradient exchange (ZIP-0410)
```

### Training Protocol

1. **Model distribution**: Coordinator sends current global model to all participating nodes
2. **Local training**: Each node trains on its local data for E epochs
3. **Gradient encoding**: Local model updates encoded as semantic gradients (ZIP-0410)
4. **Privacy protection**: Gradients optionally encrypted via FHE (ZIP-0423)
5. **Aggregation**: Coordinator aggregates using Byzantine-robust median
6. **Global update**: Updated global model distributed to all nodes
7. **Evaluation**: Holdout test set at each node measures global model quality

### Heterogeneity Handling

Field stations have vastly different data distributions:
- Tropical stations: thousands of species, dense vegetation
- Arctic stations: few species, clear visibility
- Marine stations: underwater imagery, acoustic-dominant

The system handles this through:
- **Personalization layers**: Station-specific fine-tuning layers on top of global model
- **Contribution weighting**: Stations with rarer species get higher aggregation weight
- **Asynchronous participation**: Stations with intermittent connectivity can participate when available

## Research Papers

- [zoo-federated-wildlife](~/work/zoo/papers/zoo-federated-wildlife/) -- Federated learning for wildlife monitoring (2025)
- [zen-privacy-federated](~/work/zen/papers/zen-privacy-federated.tex) -- Privacy-preserving federated training

## Implementation

- **hanzo/candle**: Rust ML framework with federated learning support
- **hanzo/node**: AI node with federated training client
- **zoo/core**: Application with federated monitoring dashboard

## Timeline

- **Originated**: November 2024 (federated wildlife monitoring design)
- **Research**: `zoo-federated-wildlife` published 2025
- **Implementation**: Federated monitoring network deployed 2025
