---
zip: 0810
title: "Z-Chain — Post-Quantum Identity & Attestation Rollup (Zoo mirror of HIP-0078)"
description: "Zoo-side mirror of Hanzo HIP-0078. Pins Z-Chain as the Zoo PQ identity / DKG-transcript / attestation rollup under the canonical ZOO_STRICT_PQ profile. STARK / FRI / SHA-3 only; Groth16 / BN254 and KZG are explicit refusal markers on the Zoo wire. Heavy spec lives in HIP-0078."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0078
created: 2026-05-10
tags: [pq, z-chain, stark, fri, sha3, ml-dsa, identity-rollup, mirror, hip-0078]
requires: [14, 15, 809, 811, 812]
related-lps: [LP-168, LP-169, LP-170, LP-171]
related-hips: [HIP-0077, HIP-0078, HIP-0079, HIP-0084]
---

# ZIP-0810: Z-Chain — Post-Quantum Identity & Attestation Rollup

## Abstract

ZIP-0810 mirrors Hanzo HIP-0078 into Zoo Network. Z-Chain is the
**identity rollup** for Zoo Network: validator registry, ML-DSA-65
pubkey commitments, revocation set, stake weights, DKG transcripts,
and committee selection state, all proven by STARK / FRI over a
SHA-3 (cSHAKE256) Merkle commitment. Pairing-based proof systems
(Groth16 / BN254, KZG) are **forbidden** on the Zoo wire — the
strict-PQ verifier refuses any cert whose `proof_system_id` maps
to `0x80` or `0x81`.

Z-Chain is the identity layer for Zoo. Q-Chain (ZIP-0811) is the
finality layer. Pulsar-M (ZIP-0812) is the threshold-signing
primitive Q-Chain consumes. ML-DSA-65 identity material does **not**
enter every finality block; Z-Chain holds the bulky state and
Q-Chain references its roots by hash.

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

`ProfileZooStrictPQ = 0x04` is the dedicated Zoo Network profile
byte; field values match `LUX_STRICT_PQ` (0x01) bit-for-bit so the
Zoo and Lux NIST-PQ tracks are coherent. The profile hash is pinned
into Zoo genesis and bound into every Q-Chain cert (ZIP-0811).

## Zoo-specific bindings

- **EpochCommitment** records (per HIP-0078) post to Z-Chain via
  the Zoo identity VM. Each commitment binds `hash_suite_id =
  0x01`, `sig_scheme_id ∈ {0x52, 0x53}`, `proof_system_id =
  0x10`.
- **Reference prover** reused from `luxfi/plonky3-pq` (Plonky3
  fork with cSHAKE256 Merkle + Fiat-Shamir) — one implementation
  across the Lux + Zoo trees, per ZIP-0014's "no custom extensions
  needed" principle.
- **Anchor.** Q-Chain finality (ZIP-0811) MUST anchor to the
  latest accepted Z-Chain `EpochCommitment` — every Q-Block's
  `zchain_state_root`, `validator_set_root`, `committee_root`,
  `dkg_transcript_root`, and `group_public_key_hash` equal the
  corresponding fields in the EpochCommitment for that epoch.
- **Conservation-state extension.** Zoo's species registry
  (ZIP-0030), conservation badge ledger (ZIP-0202), and impact
  oracle (ZIP-0501) MAY post additional Merkle roots into
  Z-Chain's identity tree as separate root fields; this is a Zoo
  use-case extension, not a deviation from the locked profile.

## Compliance

A Zoo validator MUST refuse any `EpochCommitment` whose
`proof_system_id` is `0x80
GROTH16_BN254_CLASSICAL_FORBIDDEN_IN_PQ` or `0x81
KZG_CLASSICAL_FORBIDDEN_IN_PQ`, and MUST refuse any non-strict
backend on Zoo Network. End-to-end security is bounded by
`min(Pulsar-M-65, Z-Chain proof configuration)`; Z-Chain prover
parameters MUST achieve ≥ 128-bit classical and ≥ NIST PQ Cat 3
to match ZIP-0812.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process. Activation requires sibling activation of ZIP-0809,
ZIP-0811, ZIP-0812.

## References

- HIP-0078 — canonical spec.
- ZIP-0809 / 0811 / 0812 — sibling Zoo mirrors.
- LP-169 — Lux-side mirror.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- `luxfi/consensus/config/profiles.go` — locked profile reference.
- `luxfi/plonky3-pq` — strict-PQ prover (planned).
