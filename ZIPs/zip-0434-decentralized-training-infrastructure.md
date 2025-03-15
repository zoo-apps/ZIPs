---
zip: 0434
title: "Decentralized Training Infrastructure"
description: "Production infrastructure for decentralized AI training combining DSO, PoAI, and federated learning into a unified training platform (Zoo Gym)"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2025-09
traces-from: "ZIP-0407, ZIP-0410, ZIP-0419, ZIP-0424 / Whitepaper Section 08"
follow-on:
  - "zoo-gym-protocol (2024)"
  - "zoo-gym-compute-proof (2024)"
  - "zoo-gym-orchestrator (2024)"
  - "zoo-gym-tokenomics (2024)"
  - "zoo-gym-grpo-continuous (2024)"
  - "zen/papers/zen-distributed-training"
created: 2025-09-01
tags: [decentralized-training, gym, training-infrastructure, distributed-compute, orchestration]
requires: [0407, 0410, 0419, 0424]
references: ZIP-001
repository: https://github.com/zooai/gym
license: CC BY 4.0
---

# ZIP-0434: Decentralized Training Infrastructure

## Abstract

This proposal specifies Zoo Gym, the production infrastructure that unifies all previously-specified decentralized training components -- DSO (ZIP-0410), PoAI (ZIP-0419), federated learning (ZIP-0424), and GRPO (ZIP-0421) -- into a single, deployable training platform. Zoo Gym is the "gym" where AI models train: a decentralized network of compute nodes that collaboratively improve Zen models, earn ZOO token rewards, and produce verifiable training proofs anchored on-chain.

## Motivation

The preceding ZIPs specified individual components:
- ZIP-0407: Decentralized training architecture (theory)
- ZIP-0410: DSO protocol (gradient exchange)
- ZIP-0419: PoAI consensus (validation)
- ZIP-0421: GRPO (preference optimization)
- ZIP-0424: Federated wildlife monitoring (conservation-specific)

Zoo Gym combines these into a production system that conservation organizations, researchers, and AI enthusiasts can actually run, managing the complexity of node registration, task assignment, gradient routing, verification, reward distribution, and model checkpoint management.

## Specification

### System Architecture

```
Zoo Gym Platform
├── Coordinator Layer (smart contracts)
│   ├── NodeRegistry.sol: node registration and staking
│   ├── TaskManager.sol: training task lifecycle
│   ├── RewardDistributor.sol: ZOO token rewards
│   └── ModelRegistry.sol: model version tracking
│
├── Training Layer (off-chain, distributed)
│   ├── DSO Engine: semantic gradient exchange (ZIP-0410)
│   ├── GRPO Engine: preference optimization (ZIP-0421)
│   ├── Federated Engine: federated learning (ZIP-0424)
│   └── Continuous Training: ongoing model improvement
│
├── Verification Layer (hybrid)
│   ├── PoAI Validators: AI work verification (ZIP-0419)
│   ├── Compute Proofs: cryptographic work attestation
│   └── Spot Checking: random recomputation of training steps
│
└── Orchestration Layer (off-chain)
    ├── Task Scheduler: matches tasks to nodes
    ├── Checkpoint Manager: model version control on IPFS
    ├── Metrics Dashboard: training progress monitoring
    └── Health Monitor: node uptime and quality tracking
```

### Training Task Types

| Task | Description | Reward | Duration |
|------|-------------|--------|----------|
| Pre-training | Continue pre-training on new data | 10 ZOO/step | Days-weeks |
| Fine-tuning | Domain-specific fine-tuning | 5 ZOO/step | Hours-days |
| GRPO | Preference optimization round | 8 ZOO/round | Hours |
| Federated | Wildlife monitoring model update | 3 ZOO/round | Minutes-hours |
| Evaluation | Benchmark evaluation of new checkpoint | 2 ZOO/eval | Minutes |

### Node Economics

```
Revenue per node per month (estimated):
├── Training rewards: 500-5000 ZOO (hardware-dependent)
├── Inference serving: 200-2000 ZOO (traffic-dependent)
├── Verification: 100-500 ZOO (assignment-dependent)
└── Staking yield: 3-5% APY on staked ZOO
```

### Deployment

Node operators run a single binary:
```bash
zoo-gym start \
  --stake 10000 \
  --gpu auto \
  --tasks training,inference,verification \
  --region us-east
```

## Research Papers

- [zoo-gym-protocol](~/work/zoo/papers/zoo-gym-protocol/) -- Gym protocol specification (2024)
- [zoo-gym-compute-proof](~/work/zoo/papers/zoo-gym-compute-proof/) -- Compute proof protocol (2024)
- [zoo-gym-orchestrator](~/work/zoo/papers/zoo-gym-orchestrator/) -- Training orchestration (2024)
- [zoo-gym-tokenomics](~/work/zoo/papers/zoo-gym-tokenomics/) -- Gym token economics (2024)
- [zoo-gym-grpo-continuous](~/work/zoo/papers/zoo-gym-grpo-continuous/) -- Continuous GRPO training (2024)
- [zen-distributed-training](~/work/zen/papers/zen-distributed-training.tex) -- Distributed training for Zen

## Implementation

- **hanzo/node**: Blockchain/AI node with Gym training support
- **hanzo/candle**: Rust ML framework for training workloads
- **zoo/contracts**: Gym smart contracts for coordination and rewards
- **zoo/core**: Gym dashboard and monitoring interface

## Timeline

- **Originated**: September 2025 (Zoo Gym production design)
- **Research**: Gym paper series published 2024 (protocol, compute proof, orchestrator, tokenomics, continuous GRPO)
- **Implementation**: Zoo Gym network launched 2025
