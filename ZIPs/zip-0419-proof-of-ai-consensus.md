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
  - "luxfi/crypto/poi (2026, canonical Go verifier)"
  - "hanzoai/engine poi.rs (2026, prover-mirror)"
  - "luxdao/contracts (2026, on-chain enforcement)"
created: 2024-06-15
amended: 2026-06-23
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

## Native Compute-Binding Implementation (2026)

The 2024 proposal above specifies *what* PoAI rewards (training, inference, verification) and *how* the proofs are spot-checked by committee. It left one gap open: the proofs of 2024 attest to authorship and agreement, not to the computation itself. As PoAI moved from a consensus design to a settlement primitive that mints, that gap became economically exploitable. This section records that the gap is now closed by a **compute-binding** layer that is BUILT and LIVE across the stack, turning PoAI from a consensus proposal into a verifiable, execution-level mechanism. The original protocol above is unchanged; compute-binding sits underneath it as the proof that a validator's claimed work was actually done.

### The guess-to-mint gap it closes

A digital signature proves *authorship* — that a specific key produced a result. Plurality across a quorum proves *agreement* — that enough validators reported the same result. Neither proves *computation*. Under the 2024 protocol, the cheapest attack on an inference or verification reward was never to run the model: a validator could emit a roughly 1-bit modal yes/no guess, join the plurality of honest validators who *did* run it, pass the agreement check, and be minted. The work was never performed; the guess merely rode the honest majority. Compute-binding closes this by making each reward contingent on a proof that the claimed forward (or backward) pass was actually executed on the claimed inputs.

### The core check: Freivalds over the exact integer accumulator

An LLM forward pass is approximately 95% matrix multiplication — the result of a layer is `C = A·B`. Verifying a single matmul by recomputing it is `O(n^3)`. Freivalds' algorithm (1977) instead samples a random challenge vector `r` and checks

```
A · (B · r) == C · r
```

which is `O(n^2)`: two matrix-vector products and one comparison, no full recompute. A fabricated `C` survives a single challenge with probability at most `1/p`, so the check catches a forged result with probability at least `1 − 1/p` per challenge vector, and the soundness error shrinks geometrically with independent challenges.

The check is performed over a finite field `F_p` with the Mersenne prime `p = 2^61 − 1`, evaluated on the **exact int8 accumulator** of the quantized model rather than on dequantized floats. Because the accumulator is integer-exact and the field arithmetic is exact, the verification is bit-exact and exhibits **zero false-reject across heterogeneous hardware** — the prover's GPU and the verifier's CPU agree to the bit. This is what makes the check usable as a settlement gate: an honest prover is never slashed for a hardware rounding difference.

### Four execution proofs over one primitive

All four proof types are instances of a single primitive, discriminated by a `workloadType` field. There is one verification path; the workload tag selects the binding, not a separate algorithm:

| Proof | `workloadType` | What it binds |
|-------|----------------|---------------|
| **PoE** — Proof of Embedding | embedding | The embedding matmuls produced the claimed vector for the claimed input |
| **PoI** — Proof of Inference | inference | The forward pass produced the claimed output tokens for the claimed prompt |
| **PoT** — Proof of Training | training | The training step was executed — backpropagation is also matmul, so the same Freivalds check applies to the backward pass |
| **PoC** — Proof of Contribution | contribution | PoT, plus a proof-of-improvement that the contributed gradient helped, with contributor privacy preserved via DeltaSoup aggregation |

This collapses the 2024 work-type taxonomy onto one verifiable computational core: the reward weight and slashing tables above are unchanged, but each row is now backed by the same matmul-binding proof.

### The tier matrix (not naive fp-Freivalds)

Freivalds over `F_p` is exact only when the computation is integer-exact. A naive attempt to run Freivalds directly on floating-point activations is **unsound and false-rejecting** — floating-point is non-associative and non-deterministic across hardware, so honest provers would be slashed and a crafted error could slip under the rounding tolerance. Floating point is therefore handled *by tier*, not by forcing one check onto every workload:

| Tier | Mechanism | When used |
|------|-----------|-----------|
| **T0** | zkML proof | Small models where a succinct proof is cheap |
| **T1** | M-of-N confidential-compute TEE attestation | High-value workloads needing hardware-rooted trust |
| **T2** | Single confidential-compute attestation, or optimistic Freivalds | Quantized workloads where the exact int8 accumulator makes Freivalds sound |
| **T3** | Redundancy + plurality (the 2024 path) | CPU and liveness-critical workloads where availability dominates |

One **profile gate** governs all tiers with a single policy: **no proof → no mint, no settle.** Quantized models route to exact Freivalds (T2); native-floating-point models route to deterministic-fp recompute or a TEE; small models route to zkML (T0). The tier is a property of the workload and its hardware, and the gate enforces that *some* valid proof at the required tier exists before any reward is paid.

### The reportData binding

A proof must not be replayable, splice-able, or repointable to a different model or input. Each attestation carries a `reportData` field containing a keccak hash chain that binds, in order, the **challenge → model → input → output**. The model identity is a `modelSpecHash` measured over the *loaded quantized bytes* — the exact weights resident in memory, not a claimed model name — so an attestation produced for one model or one prompt cannot be replayed against another, and an honest attestation cannot be spliced onto a different output. The binding is what makes a single valid attestation non-transferable.

### Where it is live

Compute-binding is implemented and tested across three layers. Versions are pinned so the chain and the prover agree on the proof format:

- **Canonical verifier (the one the chain consumes):** `luxfi/crypto/poi` **v1.19.23** — the Go implementation of the Freivalds-over-`F_p` check and the `reportData` binding. This is the authoritative verifier; consensus accepts what it accepts.
- **Prover-mirror:** `hanzoai/engine`, `hanzo-engine/src/poi.rs` **v1.2.5** — the Rust prover that emits proofs in the format the Go verifier checks, plus the determinism prerequisites a proof requires: lowest-id argmax (deterministic tie-breaking) and canonical MoE top-k selection, which together cover all of the MoE-based zen models. 8 tests green.
- **On-chain enforcement:** `luxdao/contracts` **v2.1.0** — `ComputeProofLib` performs the proof binding on-chain, `ComputeProfile` is the per-workload tier gate, and the settlement path accepts both optimistic and confidential-compute evidence. Two minters (the optimistic and CC paths) share a single capped AICoin supply, so compute-binding cannot inflate issuance. 230/230 forge tests green.

The theory and soundness are documented in the Zoo PoAI consensus paper (`zooai/papers/zoo-poai-consensus`) and its soundness companion (`zooai/proofs/proof-of-inference-soundness.tex`), which proves the tiering is necessary and that naive fp-Freivalds is unsound.

### Honest status

To be precise about what is and is not live:

- **PROVEN and TESTED:** the Freivalds-over-`F_p` core check, the four-proof primitive, the tier matrix, and the `reportData` binding — across all three layers, with passing test suites (8 in the prover, 230/230 on-chain).
- **ENFORCED:** the chain refuses to mint or settle a reward without a valid proof at the required tier — the profile gate is live in `luxdao/contracts`.
- **NEXT BUILD SLICE (design merged, not yet live):** end-to-end proof *emission* from a running zen model — a forward pass that streams an activation-trace MMR transcript which a challenger can open at a random layer and Freivalds-verify against the bound `reportData`. The verifier, the on-chain gate, and the proof format are in place; wiring a live zen-model forward pass to emit the transcript is the remaining work. This is **not** claimed as live.
