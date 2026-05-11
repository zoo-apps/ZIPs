---
zip: 0811
title: "Q-Chain — Quasar Finality Block Standard (Zoo mirror of HIP-0079)"
description: "Zoo-side mirror of Hanzo HIP-0079. Pins the compact finality-block wire format for the Quasar consensus engine on Zoo Network. Single Pulsar-M-65 threshold sig per block; TupleHash256 transcript binding over 23 axes; Z-Chain roots anchored by hash. Heavy spec lives in HIP-0079."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0079
created: 2026-05-10
tags: [pq, q-chain, quasar, finality, pulsar-m, tuplehash256, mirror, hip-0079]
requires: [14, 15, 809, 810, 812]
related-lps: [LP-168, LP-169, LP-170, LP-171]
related-hips: [HIP-0077, HIP-0078, HIP-0079, HIP-0084]
---

# ZIP-0811: Q-Chain — Quasar Finality Block Standard

## Abstract

ZIP-0811 mirrors Hanzo HIP-0079 into Zoo Network. Q-Chain is the
**compact finality-block log** for the Quasar consensus engine on
Zoo Network. Each Q-Block carries a few hundred bytes of header +
roots (anchored to Z-Chain per ZIP-0810) plus a single ~3.3 KB
Pulsar-M-65 threshold signature (ZIP-0812). Per-block bandwidth is
O(1) in committee size; adding validators makes Z-Chain heavier,
not Q-Chain.

The full Q-Block wire schema, the canonical transcript-binding
function (TupleHash256 over 23 axes with customisation
`PULSAR-M-Q-BLOCK-V1`), and the 11-clause acceptance rule live in
HIP-0079. ZIP-0811 pins the Zoo-side facts.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
ProofPolicyID:       STARK_FRI_SHA3_PQ        (0x10)
AllowedBackends:     SP1_COMPRESSED_STARK, RISC0_SUCCINCT_STARK,
                     P3Q_PLONKY3_STARK_FRI, STONE_CAIRO_STARK_CPP,
                     STWO_CIRCLE_STARK
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidTrustedSetup:  true
ForbidClassicalSNARKs: true
ForbidDevProofs:     true
ForbidFallbacks:     true
```

`ProfileZooStrictPQ = 0x04`. The profile hash is pinned at Zoo
genesis and bound into `Certificate.TranscriptHash()` so a flipped
byte breaks signature verification, not a string-equality check.

## Production defaults (Zoo Network)

| parameter            | value                          |
|----------------------|--------------------------------|
| `version`            | `0x0001`                       |
| `proof_system_id`    | `0x10` (STARK_FRI_SHA3_PQ)     |
| `hash_suite_id`      | `0x01` (SHA3_NIST)             |
| `sig_scheme_id`      | `0x52` (Pulsar-M-65)           |
| committee size `n`   | 64                             |
| BFT fault bound `f`  | 21                             |
| threshold `t`        | 43-of-64                       |
| epoch length         | network-configurable; start 1h |

High-value Zoo operations (conservation-bond redemption, ZRC-721
wildlife-NFT royalty disbursement at scale, DAO treasury moves
under ZIP-0018) MAY upgrade `sig_scheme_id` to `0x53 Pulsar-M-87`
for the duration of the operation. Devnet / CI may use `0x51
Pulsar-M-44`; Zoo Network refuses `0x51`.

## Zoo-specific bindings

- **Wire encoder** reused from `luxfi/consensus/pkg/wire/qblock.go`
  — one canonical encoder across Lux and Zoo, no Zoo-specific fork.
- **Driver** reused from `luxfi/consensus/protocol/quasar/`; Zoo's
  Quasar driver runs the same `WitnessSet.Run` pipeline.
- **VM.** Q-Chain VM for Zoo lives at `zooai/node/chains/quasarvm`
  (planned location); implements the 11-clause acceptance rule
  against the latest accepted Z-Chain `EpochCommitment`
  (ZIP-0810).
- **Test vectors** cross-validate against `luxfi/consensus/qblock-vectors/`
  modulo the `ProfileID` byte.

## Compliance

A Zoo node MUST reject any Q-Block whose `proof_system_id` is a
forbidden marker (`0x80` / `0x81`), whose `hash_suite_id` is not
`0x01 SHA3_NIST`, or whose `sig_scheme_id` is not in the
configured network allowlist. Rejection MUST happen before
threshold-signature verification.

A Q-Block carrying full validator ML-DSA-65 pubkeys, per-validator
ML-DSA signatures, full DKG ceremony messages, per-validator
attestation blobs, or non-epoch-boundary Z-Chain proof bytes
violates the spec and MUST be rejected.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process. Activation requires sibling activation of ZIP-0809 /
0810 / 0812.

## References

- HIP-0079 — canonical spec.
- ZIP-0809 / 0810 / 0812 — sibling Zoo mirrors.
- LP-170 — Lux-side mirror.
- `luxfi/consensus/pkg/wire/qblock.go` — shared wire reference.
- `luxfi/consensus/protocol/quasar/round_digest.go` — transcript binding.
