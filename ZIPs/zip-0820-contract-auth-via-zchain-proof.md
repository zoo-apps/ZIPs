---
zip: 0820
title: "Contract Auth via Z-Chain Proof — Zoo mirror of HIP-0104"
description: "Zoo-side mirror of Hanzo HIP-0104. Two precompiles at 0x13 (Z-Chain auth proof) and 0x14 (direct ML-DSA-65 verify) provide the contract-side strict-PQ auth surface on Zoo Network. Heavy spec lives in HIP-0104."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0104
created: 2026-05-11
tags: [pq, contract-auth, precompile, z-chain, mirror, hip-0104]
requires: [14, 810, 813, 814]
related-lps: [LP-169, LP-172, LP-173, LP-174, LP-179]
related-hips: [HIP-0078, HIP-0085, HIP-0086, HIP-0087, HIP-0104]
---

# ZIP-0820: Contract Auth via Z-Chain Proof

## Abstract

ZIP-0820 mirrors HIP-0104 into Zoo Network. Two precompiles expose the
strict-PQ contract-auth surface to EVM-compatible contracts on Zoo
Network:

- `0x13` — `ZCHAIN_AUTH_PROOF` verifier, accepts a format-byte-`0x10`
  STARK_FRI_SHA3_PQ proof from ZIP-0810 / HIP-0078 and returns the
  authenticated 48-byte `AccountID` and `verified_at_height`.
- `0x14` — direct ML-DSA-65 verifier, returns success/failure under
  unmodified FIPS 204.

Contracts call these via standard EVM `staticcall`. `ecrecover` is
refused under `ZOO_STRICT_PQ`.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
ProofPolicyID:       STARK_FRI_SHA3_PQ        (0x10)
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

## Zoo-specific bindings

- `luxfi/consensus/protocol/auth/precompile.go` is reused; the Zoo
  EVM imports `luxfi/coreth/core/vm/contracts_pq.go` directly.
- Gas schedule mirrors LP-179: 1,270,000 gas for `0x13`, 800,000 gas
  for `0x14`.
- ZRC-20/721/1155 standard tokens migrating from classical `ecrecover`
  paths use `0x14` for direct verify of HIP-0087 / ZIP-0815 permits.
- KAT vectors reused from
  `luxfi/coreth/core/vm/testdata/precompile_pq_v1.json`.

## Compliance

A Zoo EVM contract calling `ecrecover` under `ZOO_STRICT_PQ` reverts
with `ErrEcrecoverRefused`. Contracts MUST migrate to
`staticcall(0x13)` or `staticcall(0x14)` before profile activation.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process.

## References

- HIP-0104 — canonical source of truth.
- LP-179 — Lux-side mirror.
- LP-070 — ML-DSA primitive.
- ZIP-0810 — Z-Chain proof system.
- ZIP-0813, ZIP-0814, ZIP-0815 — AccountID, TxAuthEnvelope, PQ Permit.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- NIST FIPS 204, FIPS 202, SP 800-185.
- `luxfi/consensus/protocol/auth/precompile.go`.
- `luxfi/coreth/core/vm/contracts_pq.go`.
