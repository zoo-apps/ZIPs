---
zip: 0407
title: "Decentralized AI Training Architecture"
description: "Architecture for distributed AI model training across heterogeneous nodes, the precursor to the Zoo Gym protocol and DSO"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2022-11
traces-from: "ZIP-0400 / Whitepaper Section 08"
follow-on:
  - "zoo-gym-protocol (2024)"
  - "zoo-gym-compute-proof (2024)"
  - "zoo-gym-orchestrator (2024)"
  - "zen/papers/zen-distributed-training"
created: 2022-11-15
tags: [decentralized-training, distributed-compute, gym-protocol, training-infrastructure]
requires: [0401]
references: HIP-0067
repository: https://github.com/zooai/gym
license: CC BY 4.0
---

# ZIP-0407: Decentralized AI Training Architecture

## Abstract

This proposal defines the architecture for training AI models across a decentralized network of heterogeneous compute nodes. Rather than requiring a single datacenter with thousands of homogeneous GPUs, this system enables conservation organizations, universities, and individual contributors to pool their compute resources for collaborative model training. The architecture handles node heterogeneity (different GPU types, network speeds, availability patterns), provides Byzantine fault tolerance, and rewards contributors proportionally to their verified compute contributions. This is the precursor to the Zoo Gym protocol and later the Decentralized Semantic Optimization protocol (ZIP-0410).

## Motivation

Training conservation-aware language models (ZIP-0405) and multimodal systems (ZIP-0406) requires significant compute resources. However:

1. Conservation organizations have limited budgets for cloud GPU rental
2. University research labs have GPUs that sit idle outside business hours
3. Individual supporters have gaming GPUs willing to contribute idle cycles
4. No single entity should control the training process for a public-good AI

Decentralized training solves all four problems by creating a network where anyone can contribute compute and earn rewards, while the resulting model remains a public good.

## Specification

### Network Architecture

```
Coordinator (on-chain smart contract)
├── Task Registry: available training tasks with specs
├── Node Registry: registered compute nodes with capabilities
├── Assignment Engine: matches tasks to nodes
├── Verification: validates completed work
└── Reward Distribution: pays contributors

Compute Nodes (off-chain, heterogeneous)
├── GPU Worker: executes training steps
├── Prover: generates compute proofs
├── Reporter: submits results and proofs
└── Syncer: downloads/uploads model checkpoints
```

### Training Protocol

1. **Task Creation**: Training coordinator posts a task (model architecture, dataset CID, hyperparameters, required compute)
2. **Node Registration**: Compute providers register their hardware capabilities (GPU model, VRAM, bandwidth)
3. **Assignment**: Coordinator assigns data shards to nodes based on capability matching
4. **Execution**: Nodes train on their assigned shard, producing gradient updates
5. **Verification**: A subset of nodes re-execute random shards to verify correctness (ZIP-0419 PoAI)
6. **Aggregation**: Verified gradients are aggregated using Byzantine-robust aggregation
7. **Checkpoint**: Updated model checkpoint is stored on IPFS and CID recorded on-chain
8. **Reward**: Contributors receive ZOO tokens proportional to verified compute (ZIP-0016)

### Node Heterogeneity Handling

| GPU Class | Min VRAM | Role | Reward Multiplier |
|-----------|----------|------|-------------------|
| Consumer (RTX 3060-4090) | 8 GB | Data-parallel training on small batches | 1.0x |
| Professional (A4000-A6000) | 16 GB | Standard training shards | 1.5x |
| Datacenter (A100, H100) | 40-80 GB | Large batch training, model surgery | 3.0x |
| Apple Silicon (M1-M4) | Unified memory | Inference validation, lightweight fine-tuning | 0.8x |

### Fault Tolerance

- Nodes can go offline at any time; their assigned shard is reassigned after timeout
- Byzantine nodes (submitting bad gradients) are detected by verification and slashed
- Network partitions are handled by allowing independent training on partitions, then reconciliation

## Research Papers

- [zoo-gym-protocol](~/work/zoo/papers/zoo-gym-protocol/) -- Gym decentralized training protocol (2024)
- [zoo-gym-compute-proof](~/work/zoo/papers/zoo-gym-compute-proof/) -- Compute proof protocol for verifiable training (2024)
- [zoo-gym-orchestrator](~/work/zoo/papers/zoo-gym-orchestrator/) -- Training orchestration system (2024)
- [zen-distributed-training](~/work/zen/papers/zen-distributed-training.tex) -- Distributed training for Zen model family

## Implementation

- **hanzo/node**: Blockchain/AI node with libp2p networking for decentralized training
- **hanzo/candle**: Rust ML framework used by training nodes
- **zoo/core**: Gym training platform interface

## Timeline

- **Originated**: November 2022 (decentralized training research)
- **Research**: `zoo-gym-protocol` published 2024, `zoo-gym-compute-proof` published 2024
- **Implementation**: Zoo Gym training infrastructure deployed 2024
