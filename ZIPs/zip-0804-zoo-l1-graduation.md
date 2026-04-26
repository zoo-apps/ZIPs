---
zip: 0804
title: "Zoo L1 Graduation"
description: "Graduate Zoo from a Lux L2 application chain to a sovereign Quasar-certified L1 with native validator set, triple-consensus finality, and chain-local privacy precompiles"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-12-15
activation: 2025-12-25
tags: [l1, sovereignty, quasar, validator-set, consensus, lux-topology]
requires: [800]
related-lps: [LP-020, LP-105, LP-132, LP-133, LP-134, LP-137]
related-papers: [zoo-3-0-launch, zoo-per-llm-chains]
---

# ZIP-0804: Zoo L1 Graduation

## Abstract

This proposal graduates the Zoo chain from a Lux L2 application (Chain ID 200200, settling state commitments to Lux C-Chain) to a sovereign Lux L1 with its own validator set, Quasar 3.0 triple-consensus finality (BLS + Ringtail + ML-DSA per LP-020), and independent economic security backed by `$ZOO` and `$AI` staking. The graduation follows the Quasar-Native App Stack pattern (LP-133) and embeds Zoo L1 in the Lux chain topology (LP-134) alongside P/C/X/Q/Z/A/B/M/F-Chains. Activation: 2025-12-25.

## Motivation

1. **Determinism for AI workloads.** Per-LLM chain workloads (training receipts, attribution graph updates, inference rollups) require chain-local mempool and finality semantics tuned for AI; running these as L2 transactions inside a generic sequencer is solvable but suboptimal.
2. **Native confidential compute.** F-Chain FHE (LP-013) and Z-Chain ZKP (LP-063) become first-class precompiles on Zoo L1, eliminating the cross-domain message tax incurred under the L2 model.
3. **Sovereign tokenomics.** Validator subsidy schedule, fee burn policy, and `$ZOO`/`$AI` dual-asset gas semantics become governance variables under the Zoo DAO rather than constants inherited from upstream.
4. **Brand independence.** A sovereign chain ID, sovereign block explorer, sovereign RPC namespace.

## Specification

### Validator set

- Minimum stake: `1,000,000 $ZOO` per validator slot (configurable by DAO).
- Optional bonded `$AI` for AI-mining validators that participate in A-Chain attestation submission.
- Maximum active set: 200 validators at activation.
- Selection: Photon committee selection per LP-105.

### Consensus

- Triple-consensus per LP-020: BLS12-381 (classical fast path), Ringtail (post-quantum threshold), ML-DSA-65 (post-quantum identity).
- Default mode: all three layers active. `IsTripleMode()` returns true.
- Block time target: 1 second (matching Lux C-Chain).
- Finality: local Quasar finality on cert emission.

### Topology embedding

Zoo L1 is a Quasar-Native App Stack chain (LP-133) with the following cross-chain dependencies:

| External chain | Role |
|---|---|
| Q-Chain (QVM) | Ringtail DKG ceremonies for Zoo validator key material |
| A-Chain (AIVM) | TEE attestation anchoring for AI mining receipts |
| B-Chain (BVM) | bridge messaging via Zoo Bridge (ZIP-0805) |
| F-Chain (FVM) | confidential compute precompile (Confidential ERC-20, FHE inference) |
| Z-Chain (ZVM) | zero-knowledge precompile (Groth16/Halo2/Plonky2 verification) |
| M-Chain (MVM) | MPC ceremonies for bridge committee threshold signing |

### Slashing

- Double-sign: 100% slash + permanent ejection. Enforced by Q-Chain double-sign detection.
- Liveness: 5% slash per epoch with >10% missed attestation rate. Enforced by A-Chain attestation gap detection.

### Migration from L2

- Existing L2 state (Chain ID 200200) is snapshotted at activation block.
- L1 genesis state mirrors the snapshot.
- L2 sequencer continues to accept transactions for a 30-day deprecation window in receive-only mode for in-flight transfers.
- L2 chain ID is retired post-deprecation; L1 receives a new chain ID assignment.

## Rationale

This proposal does not invent the L1 graduation pattern. The Quasar-Native App Stack (LP-133) defines exactly how a sovereign appchain settles into Lux topology. Zoo L1 is the canonical first deployment of that pattern, alongside the per-LLM chain framework (zoo-per-llm-chains paper).

## Backwards Compatibility

L2 contracts migrate 1:1 to L1 with no bytecode changes; the GPU-native EVM (LP-009) is binary-compatible with the upstream Geth EVM at the bytecode level. Existing L2 transactions in flight at the activation block are settled by the L2 sequencer in the 30-day deprecation window.

## Reference Implementation

`~/work/zoo/node` — the Zoo L1 node binary. Settlement chain selector becomes `lux-l1` (default) replacing the prior `lux-l2-rollup` mode.

## Security Considerations

- Validator set is small at activation (≤200) and grows under DAO control. Smaller sets have higher per-validator influence; the triple-consensus model mitigates classical-key compromise.
- The 30-day L2 deprecation window is the only period during which both chains are active; no double-spend window exists because the L2 sequencer accepts only inbound/in-flight transfers.

## References

- LP-020 — Quasar Consensus 3.0
- LP-105 — Quasar Consensus Family Specification
- LP-132 — QuasarGPU Execution Adapter
- LP-133 — Quasar-Native App Stack
- LP-134 — Lux Chain Topology
- LP-137 — GPU-Residency Invariant
- `zoo-3-0-launch` paper (Zoo Labs Foundation, 2025-12-15)
- `zoo-per-llm-chains` paper (Zoo Labs Foundation, 2025-12-15)
