---
zip: 0817
title: "DRBG / Randomness Beacon — Zoo mirror of HIP-0089"
description: "Zoo-side mirror of Hanzo HIP-0089. Hash-DRBG over SHA3-384 per NIST SP 800-90A as the canonical randomness beacon under ZOO_STRICT_PQ. QRNG entropy + Pulsar-M aggregation reseed each epoch. Heavy spec lives in HIP-0089."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0089
created: 2026-05-11
tags: [pq, drbg, randomness, beacon, sp-800-90a, mirror, hip-0089]
requires: [14, 811, 812]
related-lps: [LP-149, LP-170, LP-171, LP-176]
related-hips: [HIP-0073, HIP-0079, HIP-0084, HIP-0089]
---

# ZIP-0817: DRBG / Randomness Beacon

## Abstract

ZIP-0817 mirrors HIP-0089 into Zoo Network. Under `ZOO_STRICT_PQ` the
randomness beacon is a Hash-DRBG over SHA3-384 per NIST SP 800-90A
Rev. 1 §10.1.1, reseeded each epoch from a HIP-0073 QRNG entropy
source XORed with a Pulsar-M (ZIP-0812) aggregated contribution. The
per-block beacon output is bound into the Q-Block transcript
(ZIP-0811) and signed by the Pulsar-M-65 finality cert.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
DRBGConstruction:    HASH_DRBG_SHA3_384       (0x90)
DRBGSecurityStrength: 256
ReseedCadence:       EPOCH_OR_2POW48
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidClassicalSNARKs: true
ForbidFallbacks:     true
```

## Zoo-specific bindings

- `luxfi/consensus/protocol/auth/beacon.go` is reused.
- Conservation-impact NFT mints, ZIP-0020 oracle commits, ZIP-0023
  community grants drawn at random, and ZRC-721 random-trait
  selections all consume the PQ beacon under cust strings
  `IMPACT-V1`, `ORACLE-V1`, `GRANT-V1`, `TRAIT-V1`.
- LP-131 ECVRF-Ed25519 is refused under `ZOO_STRICT_PQ`.
- KAT vectors reused from
  `luxfi/consensus/protocol/auth/testdata/hash_drbg_v1.json`.

## Compliance

A Zoo validator on `ZOO_STRICT_PQ` MUST source on-chain randomness
from the Hash-DRBG beacon. Contracts calling `block.difficulty` /
RANDAO opcodes receive the PQ beacon output under the strict-PQ
profile.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process.

## References

- HIP-0089 — canonical source of truth.
- LP-176 — Lux-side mirror.
- NIST SP 800-90A Rev. 1, SP 800-90B.
- NIST FIPS 202 + SP 800-185.
- ZIP-0811, ZIP-0812 — Q-Chain, Pulsar-M binding.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- `luxfi/consensus/protocol/auth/beacon.go`.
