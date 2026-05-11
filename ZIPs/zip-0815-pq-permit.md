---
zip: 0815
title: "PQ Permit — Zoo mirror of HIP-0087"
description: "Zoo-side mirror of Hanzo HIP-0087. ML-DSA-65 typed-data permit replacing EIP-2612 for ZRC-20 approvals under ZOO_STRICT_PQ. TupleHash256 transcript bound by PERMIT-V1 cust string. Heavy spec lives in HIP-0087."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0087
created: 2026-05-11
tags: [pq, ml-dsa, permit, eip-2612, mirror, hip-0087]
requires: [14, 813, 814]
related-lps: [LP-174, LP-179]
related-hips: [HIP-0085, HIP-0086, HIP-0087, HIP-0104]
---

# ZIP-0815: PQ Permit

## Abstract

ZIP-0815 mirrors HIP-0087 into Zoo Network. The PQ Permit replaces
EIP-2612 for ZRC-20-style off-chain approval flows on Zoo Network under
`ZOO_STRICT_PQ`. A permit is an ML-DSA-65 (FIPS 204) signature over a
TupleHash256 (SP 800-185) transcript bound by the cust string
`PERMIT-V1` and committing to `(profile_id, chain_id,
verifying_contract, owner_account_id, spender_account_id, value,
nonce, deadline)`. Contracts verify via the precompile pair from
ZIP-0820.

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

- `luxfi/consensus/protocol/auth/permit.go` is reused.
- Zoo ZRC-20 token contracts expose only the PQ Permit method on
  `ZOO_STRICT_PQ`; classical EIP-2612 paths are disabled at profile
  activation.
- Per-owner nonce mirrors EIP-2612 to minimise contract migration
  surface.
- KAT vectors reused from
  `luxfi/consensus/protocol/auth/testdata/permit_v1.json`.

## Compliance

A Zoo ZRC-20 deployment on `ZOO_STRICT_PQ` MUST refuse classical
EIP-2612 permits. The PQ Permit precompile path (ZIP-0820) is the only
auth route.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process.

## References

- EIP-2612 — superseded baseline.
- HIP-0087 — canonical source of truth.
- LP-174 — Lux-side mirror.
- ZIP-0813 — AccountID.
- ZIP-0820 — contract-auth precompiles.
- NIST FIPS 204, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/protocol/auth/permit.go`.
