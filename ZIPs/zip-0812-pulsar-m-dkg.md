---
zip: 0812
title: "Pulsar-M — Threshold ML-DSA DKG & Signing (Zoo mirror of HIP-0084)"
description: "Zoo-side mirror of Hanzo HIP-0084. Pins Pulsar-M-65 as the threshold ML-DSA primitive consumed by Q-Chain finality on Zoo Network. Epoch-cadence DKG, identifiable abort, no BLS fallback. Threshold-aggregated signature verifies under unmodified FIPS 204 ML-DSA.Verify. Heavy spec lives in HIP-0084 and the NIST MPTC submission package."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0084
created: 2026-05-10
tags: [pq, pulsar-m, ml-dsa, threshold, dkg, mirror, hip-0084, nist-mptc]
requires: [14, 15, 809, 810, 811]
related-lps: [LP-168, LP-169, LP-170, LP-171]
related-hips: [HIP-0077, HIP-0078, HIP-0079, HIP-0084]
---

# ZIP-0812: Pulsar-M — Threshold ML-DSA DKG & Signing

## Abstract

ZIP-0812 mirrors Hanzo HIP-0084 into Zoo Network. Pulsar-M is the
**threshold ML-DSA primitive** consumed by Q-Chain finality
(ZIP-0811) on Zoo Network. It produces signatures byte-equal to
single-party FIPS 204 ML-DSA — the threshold-aggregated output
verifies under the unmodified FIPS 204 ML-DSA.Verify routine, with
no Zoo-specific verifier extension and no BLS fallback path.

Pulsar-M targets NIST MPTC Class N1 (signing) + N4 (ML keygen /
DKG) per NIST IR 8214C. ZIP-0812 is the **deployment contract**
between Zoo's Q-Chain (consumer) and Pulsar-M (producer); the
cryptographic spec lives in HIP-0084 and the NIST MPTC submission
package at `luxfi/pulsar-m/spec/pulsar-m.tex`. Zoo reuses the Lux
implementation directly (per ZIP-0014's "no custom extensions
needed" principle); one Pulsar-M reference across the Lux + Zoo
trees.

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

`ProfileZooStrictPQ = 0x04`. Field values are byte-identical to
`LUX_STRICT_PQ`; the ProfileID byte distinguishes the chain.

## Production defaults (Zoo Network)

| parameter             | value                                |
|-----------------------|--------------------------------------|
| sig scheme            | `0x52 Pulsar-M-65` (NIST PQ Cat 3)   |
| hash family           | `0x01 SHA3_NIST`                     |
| committee size `n`    | 64                                   |
| BFT fault bound `f`   | 21                                   |
| threshold `t`         | 43                                   |
| corruption model      | honest majority at threshold layer   |
| DKG cadence           | once per epoch                       |
| epoch length          | network-configurable; default 1h     |
| online signing        | preprocessing-enabled                |
| abort handling        | identifiable abort, signed evidence  |

High-value roots use `0x53 Pulsar-M-87` (NIST PQ Cat 5). Zoo
Network refuses `0x51 Pulsar-M-44`.

## Zoo-specific bindings

- **Reference implementation** reused from `luxfi/pulsar-m/ref/go/`.
  KAT cross-validation against the FIPS 204 reference is performed
  in the Lux test suite; the Zoo node imports the same primitive
  binding and runs the same KATs on Zoo CI.
- **DKG flow.** DKG transcripts post to Zoo's Z-Chain (ZIP-0810)
  via the identity-registry path; participants are bound to
  `committee_root` per ZIP-0811 acceptance-rule clause 4.
- **Group public key.** Pulsar-M DKG output is a valid FIPS 204
  ML-DSA-65 public key, indistinguishable from a single-party
  `ML-DSA.KeyGen` output. Bound into Q-Chain by
  `group_public_key_hash`.
- **Identifiable abort.** Complaints post to Zoo's Z-Chain with
  ML-DSA-signed evidence. A valid complaint with quorum
  attribution slashes the deviating party's stake per Zoo's
  slashing protocol (ZIP-0019 framework).
- **Cross-ecosystem bridges** (ZIP-0042, ZIP-0808) verify that the
  counterpart chain's Pulsar-M signatures verify under unmodified
  FIPS 204 ML-DSA.Verify — interchangeability is the headline
  guarantee that makes Lux ↔ Zoo finality bridging cheap.

## Compliance

A Zoo validator MUST NOT silently substitute raw ML-DSA-65 or
Ringtail for the Pulsar-M-65 production profile on Zoo Network.
The fallback profiles are explicit operator opt-ins gated through
`PQMode` selection (`mldsa` / `ringtail`) and refused by the Zoo
mainnet acceptance rule.

A Pulsar-M ceremony whose participants do not match the
Z-Chain-anchored `committee_root` is rejected by Q-Chain
acceptance (ZIP-0811 clause 4). A signature against a group key
not in `group_public_key_hash` is refused (clause 6).

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process. Activation requires sibling activation of ZIP-0809 /
0810 / 0811.

## References

- HIP-0084 — canonical deployment contract.
- HIP-0078 / ZIP-0810 — Z-Chain identity-rollup.
- HIP-0079 / ZIP-0811 — Q-Chain consumer.
- LP-171 — Lux-side mirror.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- `luxfi/pulsar-m/spec/pulsar-m.tex` — NIST MPTC submission.
- NIST IR 8214C — First Call for Multi-Party Threshold Schemes.
- FIPS 204 — verification target.
