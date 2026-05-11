---
zip: 0813
title: "Wallet PQ Account Type — Zoo mirror of HIP-0085"
description: "Zoo-side mirror of Hanzo HIP-0085. Adopts the 48-byte ML-DSA-65-derived AccountID and BIP-32 path m/44'/9000'/nid'/0/n under the canonical ZOO_STRICT_PQ profile. Heavy spec lives in HIP-0085."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0085
created: 2026-05-11
tags: [pq, ml-dsa, wallet, account, hd-derivation, mirror, hip-0085]
requires: [14, 809, 810]
related-lps: [LP-168, LP-169, LP-172]
related-hips: [HIP-0077, HIP-0078, HIP-0084, HIP-0085]
---

# ZIP-0813: Wallet PQ Account Type

## Abstract

ZIP-0813 mirrors Hanzo HIP-0085 into Zoo Network. The native PQ wallet
account on Zoo Network is identified by a 48-byte `AccountID` derived
as `SHA3-384("LUX-ACCOUNT-V1" || mldsa_pubkey)` (the cust string is
shared across the strict-PQ family for byte equality). HD derivation
follows the canonical Lux path `m/44'/9000'/nid'/0/n`, where `nid'` is
the Zoo Network id. EVM-compat 20-byte addresses are emitted only as
read-side projections.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
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

`ProfileZooStrictPQ = 0x04`. Field values are byte-identical to
`LUX_STRICT_PQ`; only the ProfileID byte distinguishes the chain.

## Zoo-specific bindings

- `luxfi/wallet/pq/account.go` is reused directly; one wallet binding
  across Lux + Zoo per ZIP-0014's "no custom extensions needed"
  principle.
- Zoo ZRC-721 token-bound accounts (ZIP-0006) derive their on-chain
  identity from the same 48-byte AccountID; the token-id is bound into
  a Zoo-specific derivation index above 200.
- KAT vectors reused from `luxfi/consensus/protocol/auth/testdata/account_v1.json`.

## Compliance

A Zoo wallet on `ZOO_STRICT_PQ` MUST NOT use the 20-byte EVM-form
address as the primary identifier. ZRC-20/721/1155 indexers MAY emit
EVM-form addresses for backward-compatible block-explorer surfaces.

## References

- HIP-0085 — canonical source of truth.
- LP-172 — Lux-side mirror.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- `luxfi/consensus/protocol/auth/account.go`.
- NIST FIPS 204, FIPS 202, SP 800-185, SP 800-57.
