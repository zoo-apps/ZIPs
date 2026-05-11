---
zip: 0819
title: "Governance / Upgrade Keys — Zoo mirror of HIP-0098"
description: "Zoo-side mirror of Hanzo HIP-0098. Routine governance uses Pulsar-M-87 (threshold ML-DSA-87, FIPS 204). Cold-root upgrade keys use SLH-DSA-256s (FIPS 205) under k-of-n with k >= ceil(2n/3)+1. Heavy spec lives in HIP-0098."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0098
created: 2026-05-11
tags: [pq, governance, upgrade, ml-dsa-87, slh-dsa, mirror, hip-0098]
requires: [14, 17, 27, 812]
related-lps: [LP-070, LP-071, LP-171, LP-178]
related-hips: [HIP-0084, HIP-0098]
---

# ZIP-0819: Governance / Upgrade Keys

## Abstract

ZIP-0819 mirrors HIP-0098 into Zoo Network. Routine Zoo DAO governance
authorisations (ZIP-0017 proposals, ZIP-0018 treasury moves, ZIP-0019
validator-reward conservation splits) are issued via Pulsar-M-87
threshold ML-DSA-87 (FIPS 204, NIST PQ Cat 5). Cold-root upgrade
authorisations (network upgrades, ZIP-0027 emergency governance,
slashing-pause) are issued via SLH-DSA-256s (FIPS 205) under a
`k-of-n` multi-signature scheme with `k ≥ ⌈2n/3⌉ + 1` and `n ≥ 5` on
Zoo mainnet.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
GovernanceSchemeID:  ML_DSA_87                (0x43)
ColdRootSchemeID:    SLH_DSA_256S             (0x70)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidTrustedSetup:  true
ForbidClassicalSNARKs: true
ForbidFallbacks:     true
```

## Zoo-specific bindings

- `luxfi/consensus/protocol/auth/governance.go` is reused.
- ZIP-0017 (Zoo DAO Governance) and ZIP-0018 (Treasury Management) are
  re-deployed against the HIP-0098 / ZIP-0819 verifier before
  `ZOO_STRICT_PQ` activation.
- ZIP-0027 (Emergency Governance Protocol) is rooted in the cold-root
  SLH-DSA-256s `k-of-n` quorum.
- Cold-root rotation cadence: at least every 4 years.
- KAT vectors reused from
  `luxfi/consensus/protocol/auth/testdata/governance_v1.json`.

## Compliance

A Zoo validator on `ZOO_STRICT_PQ` MUST refuse any governance action
not authorised under ZIP-0819's warm-or-cold path. The pre-strict-PQ
classical ZIP-0017 / ZIP-0018 paths are not deployed on `ZOO_STRICT_PQ`.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process. The activation of `ZOO_STRICT_PQ` itself REQUIRES the
cold-root quorum specified in this ZIP.

## References

- HIP-0098 — canonical source of truth.
- LP-178 — Lux-side mirror.
- ZIP-0017, ZIP-0018, ZIP-0019, ZIP-0027 — Zoo governance baseline.
- NIST FIPS 204, FIPS 205, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/protocol/auth/governance.go`.
