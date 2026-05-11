---
zip: 0814
title: "TxAuthEnvelope — Zoo mirror of HIP-0086"
description: "Zoo-side mirror of Hanzo HIP-0086. Pins the typed PQ transaction-signing envelope under ZOO_STRICT_PQ. ML-DSA-65 signature over a TupleHash256 transcript bound by cust string TX-AUTH-V1; verifier is unmodified FIPS 204. Heavy spec lives in HIP-0086."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0086
created: 2026-05-11
tags: [pq, ml-dsa, tx-auth, envelope, tuple-hash, mirror, hip-0086]
requires: [14, 813]
related-lps: [LP-168, LP-170, LP-173]
related-hips: [HIP-0077, HIP-0079, HIP-0085, HIP-0086]
---

# ZIP-0814: TxAuthEnvelope

## Abstract

ZIP-0814 mirrors HIP-0086 into Zoo Network. Every Zoo strict-PQ
transaction is signed via a `TxAuthEnvelope` whose transcript is built
using TupleHash256 (SP 800-185) with cust string `TX-AUTH-V1` over
`(profile_id, chain_id, account_id, nonce, payload_hash,
identity_scheme_id, hash_suite_id)`. Signature is ML-DSA-65; the
verifier is unmodified FIPS 204 `ML-DSA.Verify`.

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

## Zoo-specific bindings

- `luxfi/consensus/protocol/auth/tx_envelope.go` is reused; Zoo
  imports the same canonical encoder/decoder.
- Zoo mainnet acceptance: a transaction lacking a valid
  `TxAuthEnvelope` is rejected at mempool admission. No secp256k1 RLP
  fallback on `ZOO_STRICT_PQ`.
- ZRC-20/721/1155 transfer flows construct TxAuthEnvelopes via the
  same wallet bindings as Lux.
- KAT vectors reused from
  `luxfi/consensus/protocol/auth/testdata/tx_envelope_v1.json`.

## Compliance

A Zoo validator on `ZOO_STRICT_PQ` MUST refuse transactions that do
not carry a valid `TxAuthEnvelope`. Cross-ecosystem bridges (ZIP-0042,
ZIP-0808) MAY accept Lux-signed envelopes when the profile-byte-equality
check passes per ZIP-0818.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process. Activation requires sibling activation of ZIP-0809 / 0810 /
0811 / 0812 and ZIP-0813.

## References

- HIP-0086 — canonical source of truth.
- LP-173 — Lux-side mirror.
- ZIP-0813 — AccountID.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- NIST FIPS 204, FIPS 202, SP 800-185.
- `luxfi/consensus/protocol/auth/tx_envelope.go`.
