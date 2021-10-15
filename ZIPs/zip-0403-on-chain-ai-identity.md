---
zip: 0403
title: "On-Chain AI Identity"
description: "Framework for AI agents as first-class blockchain citizens with verifiable identity, economic agency, and governance rights"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2021-10
traces-from: "ZIP-0402 / Whitepaper Sections 08, 19, 21"
follow-on:
  - "zoo-identity-chain (2024)"
  - "zoo-poai-consensus (2024)"
  - "hanzo/papers/hanzo-aci"
created: 2021-10-15
tags: [ai-identity, on-chain-agents, autonomous-agents, ai-governance, did]
requires: [0400, 0402]
references: HIP-0004, DID-Core
repository: https://github.com/hanzoai/aci
license: CC BY 4.0
---

# ZIP-0403: On-Chain AI Identity

## Abstract

This proposal establishes a framework for AI agents as first-class citizens on blockchain networks. Rather than treating AI as a backend service that humans invoke, this ZIP defines how AI agents can have verifiable on-chain identities, own assets, participate in governance, enter into agreements, and interact autonomously with other agents and humans. The concept traces to the October 2021 whitepaper's vision of Zoo animals as autonomous digital entities with economic agency, and extends to the broader Hanzo ACI (AI Chain Infrastructure) vision.

## Motivation

The October 2021 whitepaper described Zoo animal agents that could:
- Hold and manage assets (staking rewards, breeding fees) via their token-bound accounts
- Vote in DAO governance (Section 19) based on owner delegation or autonomous judgment
- Represent their species in conservation decisions
- Interact with other agents in metaverse social spaces (Section 12)

For all of this to work trustlessly, agents need identity -- not just an API key, but a cryptographically verifiable on-chain identity that:

1. **Proves authenticity**: Anyone can verify that Agent X is the legitimate agent bound to NFT Y
2. **Establishes reputation**: An agent's on-chain history (transactions, votes, interactions) is public and auditable
3. **Enables accountability**: Actions taken by an agent can be attributed and, if necessary, disputed
4. **Supports delegation**: Owners can grant agents specific permissions (spend up to N tokens, vote on proposals of type T)

## Specification

### Identity Structure

```
AI Agent DID
├── did:zoo:<chain-id>:<contract-address>:<token-id>
├── Verification Method: Ed25519 key pair (agent-controlled)
├── Authentication: Challenge-response via signed messages
├── Delegation: Owner-signed capability tokens
└── Recovery: NFT owner can rotate agent keys
```

### Capability System

Agents operate under a capability-based security model:

| Capability | Description | Granularity |
|-----------|-------------|-------------|
| `asset:hold` | Hold tokens in token-bound account | Always granted |
| `asset:transfer` | Transfer tokens | Per-token, amount-limited |
| `governance:vote` | Vote in DAO proposals | Per-proposal-type |
| `social:interact` | Engage with other agents | Always granted |
| `conservation:act` | Execute conservation actions | Per-action-type |
| `breeding:initiate` | Propose breeding with another NFT | Cooldown-limited |

### Agent Transaction Format

Transactions initiated by agents carry additional metadata:

```json
{
  "from": "0x...agent-tba",
  "agentDid": "did:zoo:1:0x...:42",
  "delegationProof": "0x...owner-signature",
  "reasoning": "IPFS hash of agent's decision explanation",
  "confidence": 0.87
}
```

The `reasoning` field is critical for accountability: the agent must publish a human-readable explanation of why it took the action, stored on IPFS and referenced on-chain.

### Proof of AI (PoAI) Integration

Agent identity is foundational to the Proof of AI consensus mechanism (ZIP-0419). Validators must prove they are running legitimate AI workloads by presenting:
- Valid agent DID
- Signed inference attestation
- Verifiable compute proof

## Research Papers

- [zoo-identity-chain](~/work/zoo/papers/zoo-identity-chain/) -- On-chain identity protocol for agents (2024)
- [zoo-poai-consensus](~/work/zoo/papers/zoo-poai-consensus/) -- PoAI consensus leveraging agent identity (2024)
- [hanzo-aci](~/work/hanzo/papers/hanzo-aci/) -- Hanzo AI Chain Infrastructure with agent identity layer

## Implementation

- **hanzo/aci**: AI Chain Infrastructure with DID-based agent identity
- **hanzo/rust-sdk**: Rust SDK with DID and cryptographic agent identity
- **zoo/contracts**: Smart contracts for agent capability delegation

## Timeline

- **Originated**: October 2021 (Whitepaper Sections 08, 19, 21 -- agents as autonomous actors)
- **Research**: `zoo-identity-chain` published 2024, `zoo-poai-consensus` published 2024
- **Implementation**: Hanzo ACI with agent identity deployed 2025
