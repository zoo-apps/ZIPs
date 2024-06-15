---
zip: 0419
title: "Proof of AI Consensus (PoAI)"
description: "Consensus mechanism where validators prove useful AI work (training, inference, verification) to earn block rewards"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-06
traces-from: "ZIP-0403, ZIP-0407 / Whitepaper Section 08"
follow-on:
  - "zoo-poai-consensus (2024)"
  - "hanzo/papers/hanzo-consensus-ai"
  - "hanzo/papers/hanzo-aci"
created: 2024-06-15
tags: [poai, proof-of-ai, consensus, validation, ai-compute, blockchain]
requires: [0403, 0407]
references: ZIP-002
repository: https://github.com/zooai/poai
license: CC BY 4.0
---

# ZIP-0419: Proof of AI Consensus (PoAI)

## Abstract

This proposal specifies the Proof of AI (PoAI) consensus mechanism, where blockchain validators earn block rewards by proving they performed useful AI work -- model training, inference serving, or verification -- rather than solving arbitrary cryptographic puzzles (PoW) or merely staking tokens (PoS). PoAI turns the security budget of the blockchain into productive AI compute, creating a self-reinforcing cycle: more validators means more AI compute, better models attract more users, more users increase token value, higher value attracts more validators.

## Motivation

Traditional consensus mechanisms waste energy (PoW) or rely on capital as a proxy for trust (PoS). Neither produces anything useful beyond securing the chain. PoAI reclaims the security budget by requiring validators to prove useful AI contributions:

1. **Training**: Validators contribute compute to DSO training rounds (ZIP-0410)
2. **Inference**: Validators serve model inference for conservation applications
3. **Verification**: Validators verify the AI work of other validators

This aligns the blockchain's economic incentives with the Zoo mission: securing the network directly improves the AI models that power conservation.

## Specification

### Work Types

| Work Type | Description | Verification | Reward Weight |
|-----------|-------------|--------------|---------------|
| Training | Contribute gradient updates to DSO | Gradient verification + spot-check recompute | 3x |
| Inference | Serve model inference with SLA | Response quality audit + latency check | 1x |
| Verification | Verify other validators' work | Meta-verification by committee | 2x |

### Proof Protocol

1. Validator commits to a work type and stake
2. Coordinator assigns work (training shard, inference queue, verification target)
3. Validator performs work and generates cryptographic proof:
   - **Training proof**: Hash of gradient + commitment to local data + compute attestation
   - **Inference proof**: Hash of (input, output, model_version) + latency measurement
   - **Verification proof**: Signed attestation of verified work's correctness
4. Proof is submitted to the chain
5. Random committee of verifiers spot-checks proofs
6. Valid proofs earn block rewards; invalid proofs are slashed

### Slashing Conditions

| Violation | Slash Amount | Description |
|-----------|-------------|-------------|
| Invalid gradient | 5% stake | Gradient fails verification |
| Inference hallucination | 2% stake | Response contradicts grounded facts |
| False verification | 10% stake | Approved provably-invalid work |
| Downtime | 0.1% stake/hour | Failed to serve assigned work |

### Hardware Requirements

| Tier | GPU | VRAM | Role |
|------|-----|------|------|
| Light | RTX 4060+ | 8 GB | Inference + verification |
| Standard | RTX 4090 / A4000 | 16-24 GB | Training + inference |
| Heavy | A100 / H100 | 40-80 GB | Full training + large model inference |

## Research Papers

- [zoo-poai-consensus](~/work/zoo/papers/zoo-poai-consensus/) -- PoAI consensus specification (2024)
- [hanzo-consensus-ai](~/work/hanzo/papers/hanzo-consensus-ai/) -- AI-integrated consensus mechanisms
- [hanzo-aci](~/work/hanzo/papers/hanzo-aci/) -- AI Chain Infrastructure with PoAI validation

## Implementation

- **hanzo/aci**: AI Chain Infrastructure with PoAI consensus
- **hanzo/node**: Blockchain/AI node with PoAI validation
- **zoo/contracts**: PoAI validator registration and slashing contracts

## Timeline

- **Originated**: June 2024 (PoAI protocol design)
- **Research**: `zoo-poai-consensus` published Q3 2024
- **Implementation**: PoAI consensus integrated into Hanzo ACI 2025
