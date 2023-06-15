---
zip: 0410
title: "Decentralized Semantic Optimization (DSO)"
description: "Privacy-preserving decentralized protocol for collaborative AI model training via semantic gradient sharing"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2023-09
traces-from: "ZIP-0407, ZIP-0409 / Whitepaper Section 08"
follow-on:
  - "zoo-experience-ledger (2021)"
  - "experience-ledger-dso (2025)"
  - "hanzo/papers/hanzo-dso"
  - "zen/papers/zen-dso-protocol"
created: 2023-09-01
tags: [dso, decentralized-training, semantic-gradients, differential-privacy, federated-learning]
requires: [0401, 0407, 0409]
references: HIP-0002, HIP-0067, LP-7000
repository: https://github.com/zooai/dso-protocol
license: CC BY 4.0
---

# ZIP-0410: Decentralized Semantic Optimization (DSO)

## Abstract

This proposal specifies the Decentralized Semantic Optimization (DSO) protocol, the distributed counterpart to ASO (ZIP-0409). DSO enables geographically dispersed nodes to collaboratively improve shared AI models by exchanging semantic gradients -- compressed, privacy-protected representations of local learning signals -- rather than raw data or full parameter updates. The protocol guarantees differential privacy at configurable (epsilon, delta) budgets, employs Byzantine-robust aggregation, and records all training contributions on an immutable ledger for provenance and royalty distribution. DSO is the foundational training protocol for all Zoo AI systems.

## Motivation

ASO (ZIP-0409) optimizes what a model learns; DSO optimizes how multiple parties collaborate on learning without compromising data privacy. This is critical because:

1. **Privacy**: Conservation organizations cannot share sensitive wildlife data (endangered species locations, poaching coordinates) without risking exposure
2. **Data sovereignty**: Data collected on indigenous lands or within national parks is subject to legal restrictions prohibiting export
3. **Compute democratization**: DSO enables small conservation groups to contribute to model training using their own hardware (ZIP-0407)
4. **Attribution**: Every training contribution is recorded on-chain, enabling fair credit and royalty distribution

## Specification

### System Architecture

```
+------------------+     +------------------+     +------------------+
|   DSO Node A     |     |   DSO Node B     |     |   DSO Node C     |
| (Camera Traps)   |     | (Acoustic Data)  |     | (Satellite Imgs) |
|                  |     |                  |     |                  |
| Local Data Store |     | Local Data Store |     | Local Data Store |
| Local Trainer    |     | Local Trainer    |     | Local Trainer    |
| Gradient Encoder |     | Gradient Encoder |     | Gradient Encoder |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                         |
         | Semantic Gradients      | Semantic Gradients      |
         | (encrypted, compressed) | (encrypted, compressed) |
         v                         v                         v
+------------------------------------------------------------------+
|                   DSO Aggregation Layer                            |
|  Byzantine-robust aggregation + differential privacy enforcement  |
+------------------------------------------------------------------+
         |
         v
+------------------+
| Updated Model    |
| (IPFS checkpoint)|
| (on-chain CID)   |
+------------------+
```

### Semantic Gradient Protocol

1. **Local training**: Each node trains on its local data for K steps
2. **Gradient encoding**: Full gradients are compressed into semantic gradients via:
   - Low-rank decomposition (rank r << model dimension)
   - Quantization to 4-bit representation
   - Differential privacy noise injection (calibrated to target epsilon)
3. **Transmission**: Encoded gradients are sent to the aggregation layer
4. **Aggregation**: Geometric median aggregation (Byzantine-robust)
5. **Model update**: Aggregated gradient applied to global model

### Privacy Guarantees

- Each round satisfies (epsilon, delta)-differential privacy
- Privacy budget is tracked cumulatively across rounds
- Nodes can set their own privacy level (stricter = more noise = less contribution weight)
- Composition theorem bounds total privacy loss over T rounds

### Contribution Tracking

Every gradient submission is recorded on-chain:
```
ContributionRecord {
  node_id: DID
  round: uint64
  gradient_cid: CID       // IPFS hash of semantic gradient
  data_summary: Hash      // commitment to local data statistics
  compute_proof: Proof    // verifiable compute attestation
  privacy_budget_used: float
  timestamp: uint64
}
```

## Research Papers

- [experience-ledger-dso](~/work/zoo/papers/experience-ledger-dso/) -- DSO protocol with Experience Ledger integration (2025)
- [hanzo-dso](~/work/hanzo/papers/hanzo-dso/) -- Hanzo DSO implementation specification
- [zen-dso-protocol](~/work/zen/papers/zen-dso-protocol.tex) -- DSO protocol for Zen model training
- [zen-distributed-training](~/work/zen/papers/zen-distributed-training.tex) -- Distributed training infrastructure

## Implementation

- **hanzo/node**: Blockchain/AI node with DSO protocol support
- **hanzo/candle**: Rust ML framework for gradient encoding/decoding
- **zoo/contracts**: On-chain contribution tracking contracts

## Timeline

- **Originated**: September 2023 (DSO protocol design, combining ZIP-0407 and ZIP-0409)
- **Research**: `hanzo-dso` published 2023, `zen-dso-protocol` published 2024, `experience-ledger-dso` published 2025
- **Implementation**: DSO protocol in Hanzo Node 2024
