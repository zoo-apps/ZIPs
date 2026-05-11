---
zip: 0818
title: "Bridge PQ-Only Profile — Zoo mirror of HIP-0103"
description: "Zoo-side mirror of Hanzo HIP-0103. Bridge contracts under ZOO_STRICT_PQ refuse all inbound state that is not finalised under a strict-PQ profile, with field-byte equality on the counterparty profile and Pulsar-M-65 verification. Heavy spec lives in HIP-0103."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0103
created: 2026-05-11
tags: [pq, bridge, profile, strict-pq, mirror, hip-0103]
requires: [14, 42, 800, 808, 819]
related-lps: [LP-170, LP-171, LP-177, LP-178]
related-hips: [HIP-0079, HIP-0084, HIP-0098, HIP-0101, HIP-0102, HIP-0103]
---

# ZIP-0818: Bridge PQ-Only Profile

## Abstract

ZIP-0818 mirrors HIP-0103 into Zoo Network. Zoo bridge contracts
(ZIP-0042 cross-chain mint, ZIP-0800 omnichain router, ZIP-0808 Zoo
bridge) running under `ZOO_STRICT_PQ` refuse any inbound state root
that does not carry a strict-PQ profile byte (`0x01`, `0x04`, `0x05`)
and pass a field-byte-equality check on the counterparty's canonical
profile fields. Counterparty finality is verified by checking a
Pulsar-M-65 threshold ML-DSA-65 signature (FIPS 204) over a remote
Q-Chain block transcript (ZIP-0811). High-value transfers above the
per-asset cap require a HIP-0098 / ZIP-0819 governance authorisation
signed by Pulsar-M-87.

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

- `luxfi/consensus/protocol/auth/bridge_profile.go` is reused. Zoo
  bridge contracts (ZIP-0042, ZIP-0800, ZIP-0808) are extended with
  the strict-PQ profile-equality precondition.
- High-value cap default: 100,000 ZOO. Above-cap inbound transfers
  REQUIRE the ZIP-0819 governance-auth path.
- Counterparty `group_public_key_hash` is pinned at first bridge sync.
- KAT vectors reused from
  `luxfi/consensus/protocol/auth/testdata/bridge_profile_v1.json`.

## Compliance

A Zoo bridge instance on `ZOO_STRICT_PQ` MUST refuse any inbound state
whose `counterparty_profile` is not in `{0x01, 0x04, 0x05}` or whose
canonical fields disagree byte-for-byte with the strict-PQ template.
Operators who need to bridge to a permissive-profile chain MUST run a
separate bridge instance under a permissive profile.

## Governance

Zoo Labs Foundation owns this ZIP via the canonical zips.zoo.ngo
process.

## References

- HIP-0103 — canonical source of truth.
- LP-177 — Lux-side mirror.
- ZIP-0042, ZIP-0800, ZIP-0808 — Zoo bridge baseline.
- ZIP-0811, ZIP-0812 — Q-Chain, Pulsar-M.
- ZIP-0819 — governance-auth for high-value transfers.
- NIST FIPS 204, FIPS 202, SP 800-185.
- `luxfi/consensus/protocol/auth/bridge_profile.go`.
