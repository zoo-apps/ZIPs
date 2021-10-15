---
zip: 602
title: "Citizen Science Contribution Protocol"
description: "Protocol for citizen scientists to contribute cryptographically attested observations with sybil-resistant reputation and token rewards."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
originated: 2021-10
traces-from: "Whitepaper section 24 (Partnerships)"
follow-on: [zoo-citizen-science]
created: 2025-01-15
tags: [citizen-science, reputation, attestation, sybil-resistance, incentives]
requires: [540, 600, 601]
---

# ZIP-602: Citizen Science Contribution Protocol

## Abstract

This ZIP defines a protocol for citizen scientists to contribute biodiversity observations and research data to the Zoo ecosystem. Contributions are cryptographically attested at the device level, validated through a multi-tier verification pipeline, and rewarded with ZOO tokens proportional to data quality and scientific value. The protocol implements sybil-resistant reputation using decentralized identifiers (DIDs) bound to verifiable credentials, preventing reward farming while maintaining contributor privacy.

## Motivation

Citizen science generates enormous volumes of biodiversity data. Programs like eBird (Cornell Lab) collect over 200 million observations annually from 800,000+ contributors. However, existing platforms suffer from limitations that blockchain-native protocols can address:

1. **No contributor ownership**: Observations submitted to centralized platforms become the property of the hosting institution. Contributors have no control over how their data is used or monetized.
2. **No quality incentives**: Beyond gamification badges, contributors receive no material reward for high-quality observations. There is no economic signal distinguishing a carefully documented rare species sighting from a casual backyard bird count.
3. **Sybil vulnerability**: Existing reputation systems (e.g., eBird reviewer status) rely on social trust and manual curation, which does not scale. Bad actors can create multiple accounts to inflate observation counts.
4. **No interoperability**: Data contributed to iNaturalist cannot be seamlessly used in eBird, and vice versa. Each platform maintains its own identity system, taxonomy, and quality standards.
5. **Centralized moderation**: A single platform operator decides what constitutes a valid observation. There is no transparent appeals process or decentralized consensus on data quality.

Zoo Labs Foundation aims to build the largest open biodiversity dataset for conservation AI. Citizen science contributions are essential to achieve geographic and taxonomic coverage that no institutional effort can match alone.

### Cross-Ecosystem Context

- **HIP-0075** (Hanzo OSS Contributor Payouts): Token-based compensation model for open-source contributions, adapted here for scientific data contributions.
- **LP-3093** (Lux Decentralized Identity): DID infrastructure for sybil-resistant identity without requiring personal information disclosure.
- **ZIP-540** (Research Ethics & Data Governance): Ethical framework governing how citizen science data is collected, stored, and used.

## Specification

### 1. Contributor Identity

#### 1.1 DID Registration

Each contributor registers a Decentralized Identifier (DID) conforming to the W3C DID specification:

```json
{
  "id": "did:zoo:contributor:<address>",
  "verificationMethod": [
    {
      "id": "did:zoo:contributor:<address>#keys-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:zoo:contributor:<address>",
      "publicKeyMultibase": "z..."
    }
  ],
  "authentication": ["did:zoo:contributor:<address>#keys-1"],
  "service": [
    {
      "id": "did:zoo:contributor:<address>#observations",
      "type": "BiodiversityContributor",
      "serviceEndpoint": "ipfs://<contributor-profile-cid>"
    }
  ]
}
```

#### 1.2 Sybil Resistance Tiers

| Tier | Verification | Capabilities | Reward Multiplier |
|------|-------------|--------------|-------------------|
| **Tier 0: Anonymous** | Wallet address only | Submit observations (unverified queue) | 0.25x |
| **Tier 1: Pseudonymous** | DID + email verification | Submit observations, participate in community verification | 0.5x |
| **Tier 2: Attested** | DID + verifiable credential from recognized institution | Full contribution capabilities, review flagged records | 1.0x |
| **Tier 3: Expert** | Tier 2 + domain expertise credential + 500+ verified observations | Expert verification, reviewer assignment, mentor role | 1.5x |

Tier advancement is non-reversible (cannot be downgraded for inactivity), but reputation score within a tier can decrease.

#### 1.3 Verifiable Credentials

Tier 2+ contributors present verifiable credentials (VCs) issued by:

| Issuer Type | Examples | Credential |
|-------------|----------|------------|
| **Academic institution** | University, research institute | Researcher affiliation |
| **Conservation organization** | WWF, IUCN, local NGOs | Conservation practitioner |
| **Government agency** | Fish & Wildlife, national parks | Professional biologist |
| **Zoo ecosystem** | Zoo Labs Foundation | Trained citizen scientist (completion of Zoo training program) |
| **Peer attestation** | 3+ Tier 3 contributors | Domain expertise endorsement |

Credentials are verified on-chain without revealing the issuer's identity to other contributors, using selective disclosure.

### 2. Observation Submission

#### 2.1 Submission Flow

```
Contributor opens Zoo app (mobile/web)
    |
    v
Device captures observation:
  - GPS coordinates (from device)
  - Timestamp (from device clock + NTP verification)
  - Media (photo/audio/video)
  - Species identification (AI-assisted suggestion)
  - Additional metadata (count, behavior, habitat notes)
    |
    v
Device signs attestation package:
  - Observation data hash
  - Device fingerprint (hardware attestation where available)
  - GPS accuracy metric
  - Contributor DID signature
    |
    v
Attestation submitted to Zoo L2
    |
    v
Full observation data uploaded to IPFS
    |
    v
On-chain index updated (per ZIP-601)
```

#### 2.2 Attestation Schema

```json
{
  "attestationId": "bytes32",
  "contributorDid": "string",
  "observationHash": "bytes32",
  "device": {
    "fingerprint": "bytes32",
    "platform": "string",
    "gpsAccuracy": "uint16",
    "hasHardwareAttestation": "bool"
  },
  "temporal": {
    "deviceTimestamp": "uint64",
    "ntpOffset": "int32",
    "blockTimestamp": "uint64"
  },
  "signature": "bytes",
  "previousAttestationHash": "bytes32"
}
```

The `previousAttestationHash` creates a contributor-specific hash chain, making it possible to detect if a contributor's attestation history has been tampered with.

### 3. Verification Pipeline

#### 3.1 Automated Checks

| Check | Method | Failure Action |
|-------|--------|----------------|
| **GPS plausibility** | Velocity check against previous observation | Flag for review |
| **Timestamp consistency** | NTP offset within 60 seconds | Reject |
| **Species range** | Known range map lookup | Flag for review |
| **AI species match** | Zoo species ID model confidence > 0.7 | Auto-verify; below 0.7 flag for community |
| **Duplicate detection** | Spatiotemporal fuzzy match | Merge or reject |
| **Media authenticity** | EXIF validation, deepfake detection | Flag for review |

#### 3.2 Community Verification

Observations that pass automated checks but fall below auto-verify thresholds enter community verification:

```
Observation enters community queue
    |
    v
3 independent community verifiers vote:
  - AGREE (species ID correct, data plausible)
  - DISAGREE (species ID wrong, suggest correction)
  - UNCERTAIN (insufficient evidence)
    |
    v
Consensus rules:
  - 3/3 AGREE: Verified
  - 2/3 AGREE: Verified with note
  - 2/3 DISAGREE: Sent to expert review
  - All UNCERTAIN: Sent to expert review
  - Mixed: Sent to expert review
```

Community verifiers earn reputation for accurate verification (aligned with eventual expert determination).

#### 3.3 Expert Verification

Expert review is required for:

- New species range records (first observation of species in a region)
- Observations of IUCN Red List species (Vulnerable or above)
- Genetic samples
- Records flagged by community verification
- Records from Tier 0 contributors

Expert verifiers are Tier 3 contributors with domain-relevant expertise. See ZIP-600 reviewer reputation system for expert qualification.

### 4. Reputation System

#### 4.1 Reputation Score Components

```
ReputationScore = BaseScore + QualityBonus + ConsistencyBonus - Penalties

Where:
  BaseScore       = count(verified_observations) * tier_multiplier
  QualityBonus    = sum(quality_score_per_observation) / count
  ConsistencyBonus = streak_days * 0.5 (max 180 days = 90 points)
  Penalties       = sum(rejected_observations * 5) + sum(sybil_flags * 50)
```

#### 4.2 Quality Score Per Observation

| Factor | Points | Description |
|--------|--------|-------------|
| **Media evidence** | +3 | Photo, audio, or video attached |
| **High-confidence AI match** | +2 | AI confidence > 0.9 |
| **Expert-verified** | +5 | Confirmed by Tier 3 expert |
| **Rare species** | +5 | IUCN Red List species |
| **Under-surveyed area** | +3 | Region with < 100 records in database |
| **Genetic sample** | +10 | DNA barcode or eDNA submitted |
| **Habitat survey data** | +5 | Associated habitat survey completed |

#### 4.3 Anti-Gaming Measures

| Measure | Implementation |
|---------|----------------|
| **Velocity limits** | Max 50 observations per contributor per day |
| **Geographic dispersion** | Observations from identical coordinates within 1 hour are deduplicated |
| **AI-generated media detection** | Deepfake detection model on submitted images |
| **Reputation decay** | 2% monthly decay for inactive contributors |
| **Stake-weighted verification** | Verifiers must stake ZOO proportional to their verification volume |
| **Graph analysis** | Social graph analysis to detect coordinated sybil rings |

### 5. Token Rewards

#### 5.1 Reward Calculation

Rewards are distributed from a dedicated Citizen Science Pool funded by Zoo Treasury allocation (per ZIP-603 governance vote).

```
ObservationReward = BaseReward * QualityMultiplier * TierMultiplier * ScarcityMultiplier

Where:
  BaseReward         = 1 ZOO (governance-adjustable)
  QualityMultiplier  = quality_score / max_quality_score (range 0.1 to 2.0)
  TierMultiplier     = {T0: 0.25, T1: 0.5, T2: 1.0, T3: 1.5}
  ScarcityMultiplier = max(1.0, 5.0 - log10(region_observation_count))
```

#### 5.2 Reward Distribution

```solidity
interface ICitizenScienceRewards {
    function claimReward(bytes32 observationId) external;
    function batchClaim(bytes32[] calldata observationIds) external;
    function getRewardAmount(bytes32 observationId) external view returns (uint256);
    function getContributorStats(address contributor) external view returns (
        uint256 totalRewards,
        uint256 pendingRewards,
        uint256 reputationScore,
        uint256 observationCount
    );
}
```

Rewards vest linearly over 30 days after verification to prevent claim-and-dump behavior. Contributors with reputation scores below 10 have a 90-day vesting period.

#### 5.3 Verification Rewards

Community and expert verifiers also earn rewards:

| Role | Reward | Condition |
|------|--------|-----------|
| **Community verifier** | 0.1 ZOO per verification | Vote aligned with consensus |
| **Expert verifier** | 0.5 ZOO per verification | Expert review completed |
| **Dispute resolver** | 1.0 ZOO per resolution | Successfully resolved community disagreement |

### 6. Smart Contract Architecture

```
CitizenScienceHub
    |
    +-- ContributorRegistry
    |       DID registration, tier management, credential verification
    |
    +-- AttestationValidator
    |       Validates submission attestations, checks device signatures
    |
    +-- VerificationEngine
    |       Manages verification queues, consensus, escalation
    |
    +-- ReputationTracker
    |       Calculates and stores reputation scores
    |
    +-- RewardsDistributor
            Computes rewards, manages vesting, processes claims
```

### 7. Protocol Parameters

| Parameter | Default | Governance-Adjustable |
|-----------|---------|----------------------|
| **Base reward** | 1 ZOO | Yes |
| **Daily observation limit** | 50 | Yes |
| **Community verifiers required** | 3 | Yes (min 2, max 5) |
| **Verification reward** | 0.1 ZOO | Yes |
| **Reputation decay rate** | 2% / month | Yes |
| **Reward vesting period** | 30 days | Yes |
| **Citizen Science Pool size** | Set per epoch by governance | Yes |

## Rationale

1. **DID-based identity**: DIDs provide sybil resistance without requiring KYC. Contributors retain privacy while proving uniqueness through verifiable credentials from trusted issuers (adapted from LP-3093).
2. **Tiered access**: Lower tiers have reduced rewards but no barriers to entry. This enables broad participation while concentrating high-value rewards on verified, expert contributions.
3. **Device attestation**: Hardware attestation (where available on modern mobile devices) provides a strong signal that observations originate from a physical device at a real location, not from a script.
4. **Multi-stage verification**: Automated, community, and expert verification layers balance throughput with accuracy. Most observations are auto-verified by AI, reducing the load on human reviewers.
5. **Scarcity multiplier**: Higher rewards for under-surveyed areas incentivize geographic coverage rather than easy observations in well-studied areas.
6. **Vesting**: Token vesting prevents hit-and-run contribution patterns and aligns contributor incentives with long-term data quality.

## Security Considerations

- **GPS spoofing**: Mobile devices can report false coordinates. The protocol uses velocity checks (impossible travel speed between observations), device hardware attestation, and cross-referencing with satellite imagery to detect spoofing. Spoofed observations that pass automated checks are caught by community/expert review.
- **Sybil attacks**: A single actor creating multiple DIDs to farm rewards is mitigated by requiring verifiable credentials for Tier 2+ (where meaningful rewards begin). Tier 0/1 rewards are too low to be economically attractive for farming. Graph analysis detects coordinated activity.
- **Deepfake media**: AI-generated images of species are becoming convincing. The protocol runs deepfake detection on submitted media and requires EXIF metadata consistency. Flagged media requires expert review with original device verification.
- **Reward manipulation**: The scarcity multiplier could be gamed by submitting observations in remote areas with low verification coverage. The velocity limit, vesting period, and expert review for unusual range records mitigate this.
- **Privacy**: Contributor location history could reveal home addresses or daily patterns. The protocol stores only observation locations, not contributor locations. Contributors can opt to fuzz their observation coordinates at a personal-data level (separate from the species-sensitivity fuzzing in ZIP-601).
- **Credential forgery**: Verifiable credentials from institutional issuers are cryptographically signed. The protocol maintains a registry of trusted issuers. Compromised issuer keys can be revoked through governance.

## References

- [ZIP-540](zip-0540-research-ethics-data-governance.md): Research Ethics & Data Governance
- [ZIP-600](zip-0600-desci-protocol-framework.md): DeSci Protocol Framework
- [ZIP-601](zip-0601-open-biodiversity-database-standard.md): Open Biodiversity Database Standard
- HIP-0075: Hanzo OSS Contributor Payouts
- LP-3093: Lux Decentralized Identity (DID)
- W3C. "Decentralized Identifiers (DIDs) v1.0." https://www.w3.org/TR/did-core/
- W3C. "Verifiable Credentials Data Model v2.0." https://www.w3.org/TR/vc-data-model-2.0/
- Sullivan, B. L. et al. "eBird: A citizen-based bird observation network." Biological Conservation 142(10), 2282-2292 (2009).
- Bonney, R. et al. "Citizen Science: A Developing Tool for Expanding Science Knowledge and Scientific Literacy." BioScience 59(11), 977-984 (2009).

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
