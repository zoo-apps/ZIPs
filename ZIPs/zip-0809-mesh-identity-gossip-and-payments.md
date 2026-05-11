---
zip: 0809
title: "Mesh Identity, Gossip & Payments (PQ) — Zoo mirror of HIP-0077"
description: "Zoo-side mirror of Hanzo HIP-0077. Adopts ML-DSA-65 mesh identity, Lux-consensus-backed gossip, and on-chain receipt payments on Zoo Network under the canonical ZOO_STRICT_PQ profile. Heavy spec lives in HIP-0077; this ZIP pins Zoo's ProfileID, gossip namespace, and integration surface."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
network: Zoo Network
mirrors: HIP-0077
created: 2026-05-10
tags: [pq, ml-dsa, mesh, identity, gossip, payments, mirror, hip-0077]
requires: [14, 800, 804]
related-lps: [LP-168, LP-169, LP-170, LP-171]
related-hips: [HIP-0077, HIP-0078, HIP-0079, HIP-0084]
---

# ZIP-0809: Mesh Identity, Gossip & Payments (PQ)

## Abstract

ZIP-0809 mirrors Hanzo HIP-0077 into Zoo Network. Every Zoo-attached
device, MCP endpoint, validator, conservation oracle, indexer, and
ZRC-721 token-bound account runtime derives its keypair from one HD
mnemonic; the signing key is **ML-DSA-65** (FIPS 204), reused from
the existing `luxfi/crypto/mldsa` primitive (one implementation in
the tree, per ZIP-0014). mDNS TXT carries the 20-byte ML-DSA
address; the ZAP handshake carries the full pubkey plus a fresh
signature over the server-supplied nonce; cross-LAN propagation
rides on the shared consensus mesh under the canonical
`ZOO_STRICT_PQ` profile. Conservation-impact payments and
ZRC-20/721/1155 receipt settlement use the same ML-DSA-signed
promise/receipt pairs.

**This ZIP does not redefine the protocol.** The wire format,
derivation paths, gossip namespace shape, and receipt schema live
in HIP-0077. ZIP-0809 pins Zoo-specific facts.

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

`ProfileID = 0x04 ProfileZooStrictPQ` is reserved for Zoo Network
in the canonical `config.ProfileID` registry alongside Lux's
`0x01`. Profile fields are byte-identical to `LuxStrictPQProfile`;
the ProfileID distinguishes the chain, the field values pin the
NIST-PQ track.

## Zoo-specific bindings

- **Key derivation.** Reuses the Lux SLIP-44 derivation path
  (`m / 44' / 9000' / nid' / 0 / n` for ML-DSA identity,
  `.../1/n` for the chain account), with `nid' = 122'` (Zoo
  Network chain ID per ZIP-0015) for the Zoo primary chain.
- **Gossip namespace.** `zoo/mesh/v1/<nid>/<org>` published over
  the shared consensus subscription channel; records expire ≤ 5
  min; jurisdiction-neutral per Zoo Labs Foundation governance.
- **Token-bound accounts.** ZRC-721 wildlife NFTs with
  ZIP-0703-style token-bound accounts MAY publish a `role=tba`
  gossip record; receipts attach to the conservation-impact
  oracle (ZIP-0501).
- **Auto-funding.** ZRC-20 `$ZOO` pre-allocation to the first 200
  `LIGHT_MNEMONIC` indices is **devnet only**. The Zoo production
  network MUST NOT pre-allocate from any public mnemonic.

## Compliance

A Zoo node MUST refuse ZAP handshakes whose advertised profile is
not `ProfileZooStrictPQ` or a strict superset, and MUST refuse
gossip records whose `proof_system_id` is a forbidden marker
(`0x80`, `0x81`).

Cross-ecosystem bridging (ZIP-0042, ZIP-0800, ZIP-0808) MUST verify
the counterpart chain's profile fields are byte-equal to
`ZOO_STRICT_PQ` modulo the `ProfileID` byte before accepting an
inbound transfer. Lux's `LUX_STRICT_PQ` (`0x01`) qualifies; any
profile that differs in `ForbidPairings`, `ForbidKZG`,
`ForbidTrustedSetup`, `ForbidClassicalSNARKs`,
`MinSoundnessBits`, or `MinHashOutputBits` does not.

## Governance

ZIPs are governed by Zoo Labs Foundation via the canonical process at
zips.zoo.ngo. Activation of ZIP-0809 requires sibling activation of
ZIP-0810 / 0811 / 0812 (the Z-Chain / Q-Chain / Pulsar-M-DKG
mirrors).

## References

- HIP-0077 — canonical spec.
- ZIP-0810 / 0811 / 0812 — sibling Zoo mirrors of HIP-0078 / 0079 / 0084.
- LP-168 — Lux-side mirror.
- ZIP-0014 — Zoo KMS integration via Lux KMS (reuses ML-DSA primitive).
- ZIP-0015 — Zoo L1 chain architecture.
