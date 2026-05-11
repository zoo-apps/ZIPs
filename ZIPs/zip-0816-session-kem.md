---
zip: 0816
title: "Session KEM — Zoo mirror of HIP-0088"
description: "Zoo-side mirror of Hanzo HIP-0088. Locks ML-KEM-768 (default) and ML-KEM-1024 (high-value) as the PQ session KEM under ZOO_STRICT_PQ. Classical X25519 refused. KMAC256 KDF over TupleHash256 transcript. Heavy spec lives in HIP-0088."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0088
created: 2026-05-11
tags: [pq, ml-kem, kem, session, handshake, zap, mirror, hip-0088]
requires: [14, 809]
related-lps: [LP-022, LP-072, LP-175]
related-hips: [HIP-0077, HIP-0088]
---

# ZIP-0816: Session KEM

## Abstract

ZIP-0816 mirrors HIP-0088 into Zoo Network. The Zoo ZAP handshake under
`ZOO_STRICT_PQ` performs an `ML-KEM-768` (FIPS 203 NIST PQ Cat 3,
default) or `ML-KEM-1024` (Cat 5, high-value) encapsulation, with
mutual ML-DSA-65 signatures over the handshake transcript. The derived
shared secret is run through KMAC256 (SP 800-185) to produce a 256-bit
AEAD key.

## Mirrored profile

```
ProfileID:           0x04  (ProfileZooStrictPQ)
ProfileName:         ZOO_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
KEMSchemeIDDefault:  ML_KEM_768               (0x01)
KEMSchemeIDHighValue: ML_KEM_1024             (0x02)
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

- Canonical KEM ID registry: `luxfi/consensus/config/pq_mode.go`
  (`KeyExchangeID`). Re-exported by `luxfi/consensus/protocol/auth/scheme_ids.go`
  via type alias.
- KEM session primitives: `luxfi/node/network/kem/scheme.go`. Handshake
  state machine: `luxfi/node/network/peer/handshake.go`.
- Zoo validator-to-validator gossip on `ZOO_STRICT_PQ` MUST use
  ML-KEM-768 minimum; conservation-oracle MPC, treasury, and
  cross-ecosystem bridge sessions use ML-KEM-1024.
- Session key rotation: 1 hour or 2^28 records.
- Classical X25519 is refused under `ZOO_STRICT_PQ`.

## Compliance

A Zoo node on `ZOO_STRICT_PQ` MUST NOT negotiate X25519 or ECDH. The
KEM scheme byte is bound into the handshake transcript and into the
AEAD-key derivation; substitution is detected at the TupleHash256
binding step.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process.

## References

- HIP-0088 — canonical source of truth.
- LP-175 — Lux-side mirror.
- LP-022 — ZAP wire baseline.
- LP-072 — ML-KEM primitive.
- ZIP-0014 — Zoo KMS Integration via Lux KMS.
- NIST FIPS 203, FIPS 204, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/config/pq_mode.go` — canonical `KeyExchangeID`.
- `luxfi/node/network/kem/`, `luxfi/node/network/peer/handshake.go`.
