---
zip: 33
title: "Zoo Decentralized Identification Service (DID)"
description: "Decentralized identity for Zoo DAO members; binds XP, KEEPER level, KYC tier, and reputation attestations to a chain-native DID"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 11 (Zoo DAO — Decentralized Identification Services / DIS)"
follow-on: [zoo-identity-chain]
created: 2025-12-15
tags: [did, identity, dao, kyc, reputation]
cross-refs:
  lux: [LP-060]
  zoo-zips: [ZIP-0017, ZIP-0026, ZIP-0034]
---

# ZIP-0033: Zoo Decentralized Identification Service (DID)

## Abstract

Zoo's October 31, 2021 whitepaper named "Decentralized Identification
Services (DIS)" as the on-chain identity primitive that bounds XP and
KEEPER token issuance and gates participation in higher-level
governance. This ZIP formalizes that primitive as **Zoo DID**, an
extension of the Lux base-layer DID specification (LP-060) with
Zoo-specific attestation types for conservation contribution, quest
completion, and DAO reputation.

## Motivation

The 2021 paper §11 explicitly says:

> *"XP tokens are non-transferable and strictly tied to our
> Decentralized Identification Services (DIS) and comprehensive KYC
> procedures, preserving the integrity of the system."*

Without a formal DID layer, XP and KEEPER are vulnerable to Sybil
attacks, KYC tier cannot be enforced on-chain, and reputation cannot
be portable across Zoo surfaces (NFT marketplace, DEX, governance
forum, Desktop app).

## Specification

### Resolver

Zoo DID extends Lux LP-060. Method-specific identifier:

```
did:zoo:<base32-checksum-of-A-Chain-pubkey>
```

Resolution returns a DID Document anchored on **A-Chain** (Lux LP-134),
which provides TEE-attested identity rooted in hardware enclaves.

### DID Document Schema

```json
{
  "id": "did:zoo:abcd1234efgh5678",
  "controller": "did:zoo:abcd1234efgh5678",
  "verificationMethod": [
    {"id": "#sig", "type": "Bls12381G2Key2020", "publicKeyMultibase": "..."}
  ],
  "service": [
    {"id": "#zoo-profile", "type": "ZooProfile", "serviceEndpoint": "..."},
    {"id": "#zoo-vault", "type": "ZooKMS", "serviceEndpoint": "..."}
  ],
  "zoo": {
    "kycTier": 0 | 1 | 2 | 3,
    "level": <derived from XP via ZIP-0034>,
    "xp": <uint256>,
    "keeperBalance": <uint256>,
    "reputationScore": <uint256>,
    "joinedAt": <uint64 unix>,
    "attestations": [<credential-hash>, ...]
  }
}
```

### KYC Tiers

| Tier | Verification | Privileges |
|---|---|---|
| 0 | Self-asserted (anon) | Read-only DAO; basic NFT mint; no KEEPER |
| 1 | Email + phone + ZK age proof | XP earn; quest participation; KEEPER stake |
| 2 | Doc-verified (KYC) | Treasury proposal; pool listing; cross-chain bridge |
| 3 | KYC + accredited | Securities-track features (via Liquidity perimeter, see LP-134) |

KYC verification happens off-chain through partnered providers; the
resulting credential hash is anchored on-chain as a verifiable
credential. Privacy-preserving disclosure via ZK proofs (Z-Chain,
LP-134).

### Attestation Types

| Type | Source | Purpose |
|---|---|---|
| `QuestCompletion` | Zoo DAO contract | XP earn (ZIP-0034) |
| `ConservationGrant` | Treasury contract | Verified non-profit recipient |
| `ResearchContribution` | DeSci protocol (ZIP-0600) | Researcher reputation |
| `BadgeOfHonor` | DAO multisig | Special recognition |
| `KYCCredential` | Partnered provider | Tier upgrade |

### Anti-Sybil

- TEE-rooted attestation through A-Chain; one DID per attested
  hardware identity.
- KEEPER token transfer is locked to DIDs of equivalent or higher KYC
  tier.
- XP is non-transferable (soulbound to the DID).
- Reputation drift is bounded by ZIP-0026 (Ecosystem Reputation
  System).

### Recovery

Standard DID recovery via threshold M-of-N social recovery list
declared in the DID document. Custody of the recovery key shares lives
on M-Chain MPC (LP-019).

## Backwards Compatibility

Existing 2021–2024 holders without DID are auto-issued a Tier 0 DID
on first interaction with Zoo L1 (2025-12-25 cutover). XP earned in
prior off-chain DAO surfaces is migrated via signed snapshot.

## Security Considerations

- DID-based KYC tiers concentrate trust in the verification provider
  set. Mitigated by multi-provider quorum and rotating audits.
- Soulbound nature of XP prevents trade but creates a permanent
  reputational trail; users must be informed before earning their
  first attestation.
- Privacy: DID document fields beyond minimal verification methods
  are written through Z-Chain selective disclosure (LP-134), not
  plaintext.

## Activation

DID issuance live with Zoo L1 genesis on 2025-12-25. Tier 1
verification provider integrations sequenced post-mainnet; KYC
providers TBD by ZIP-0017 vote.

## References

- Lux LP-060 (DID Specification).
- Lux LP-134 (Lux Chain Topology — A-Chain attestation).
- ZIP-0017 (DAO Governance Framework).
- ZIP-0026 (Ecosystem Reputation System).
- ZIP-0034 (Zoo XP & Quests).
- 2021 Whitepaper §11 (Zoo DAO).
