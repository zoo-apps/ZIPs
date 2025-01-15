---
zip: 202
title: "Conservation Badge Standard"
description: "Soulbound token (SBT) badges for non-transferable proof of conservation impact and achievement"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
created: 2025-01-15
tags: [nft, soulbound, sbt, badges, conservation, impact]
requires: [200, 500, 501]
---

# ZIP-202: Conservation Badge Standard

## Abstract

This proposal defines the Zoo Conservation Badge Standard, a soulbound token (SBT) framework for issuing non-transferable, on-chain proof of conservation achievements and impact milestones. Badges are permanently bound to a holder's address and cannot be transferred, sold, or burned by the holder. They serve as verifiable credentials attesting to specific conservation actions -- species adoptions, habitat funding, research contributions, community participation, and field work. The standard references LP-4192 (Soulbound Tokens) for the non-transferability mechanism and integrates with the Zoo Conservation Impact Measurement framework (ZIP-501).

## Motivation

Conservation work produces intangible outcomes that are difficult to credential. Existing systems rely on PDF certificates, email confirmations, or social media posts -- none of which are verifiable, composable, or persistent. The Zoo ecosystem needs:

1. **Verifiable Impact Credentials**: Provable on-chain records of conservation contributions that cannot be fabricated or inflated.
2. **Non-Transferability**: Unlike collectible NFTs, conservation badges must be earned, not bought. Soulbound binding prevents badge markets that would devalue genuine achievement.
3. **Composable Reputation**: Badges should function as building blocks for governance weight (ZIP-0/ZIP-4), grant eligibility, and community standing.
4. **Milestone Tracking**: Progressive badge tiers incentivize sustained engagement rather than one-time contributions.
5. **Cross-Organization Recognition**: Multiple conservation organizations can issue badges through a unified standard, creating a portable conservation reputation.

## Specification

### Soulbound Token Interface

The core SBT interface prevents all transfers after minting. This follows LP-4192 (Soulbound Tokens).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IZRC5192 {
    /// @notice Emitted when a token is locked (bound to holder)
    event Locked(uint256 indexed tokenId);

    /// @notice Returns true if the token is soulbound (always true for badges)
    function locked(uint256 tokenId) external view returns (bool);
}
```

### Badge Interface

```solidity
interface IConservationBadge is IZRC5192 {
    /// @notice Emitted when a badge is issued
    event BadgeIssued(
        uint256 indexed badgeId,
        address indexed recipient,
        BadgeType badgeType,
        BadgeTier tier,
        bytes32 evidenceHash
    );

    /// @notice Emitted when a badge is revoked (only by issuer, for fraud)
    event BadgeRevoked(
        uint256 indexed badgeId,
        address indexed revoker,
        string reason
    );

    /// @notice Issue a conservation badge to a recipient
    function issueBadge(
        address recipient,
        BadgeType badgeType,
        BadgeTier tier,
        bytes32 evidenceHash,
        string calldata evidenceURI,
        string calldata description
    ) external returns (uint256 badgeId);

    /// @notice Revoke a badge for cause (fraud, data error)
    function revokeBadge(uint256 badgeId, string calldata reason) external;

    /// @notice Get badge details
    function badgeDetails(uint256 badgeId) external view returns (Badge memory);

    /// @notice Get all badges held by an address
    function badgesOf(address holder) external view returns (uint256[] memory);

    /// @notice Get badge count by type for an address
    function badgeCountByType(address holder, BadgeType badgeType) external view returns (uint256);

    /// @notice Calculate reputation score for an address
    function reputationScore(address holder) external view returns (uint256);
}
```

### Badge Types and Tiers

```solidity
enum BadgeType {
    Adoption,           // Sponsored an animal via ZIP-201
    HabitatFunding,     // Funded habitat conservation via ZIP-203
    ResearchContrib,    // Contributed to DeSci research
    FieldWork,          // Participated in field conservation
    CommunityAction,    // Organized or participated in community events
    DataContribution,   // Contributed biodiversity data or observations
    GovernanceParticip, // Participated in Zoo DAO governance
    EducationOutreach,  // Conservation education activities
    TechContribution,   // Contributed code, tools, or infrastructure
    SpecialRecognition  // Exceptional service to conservation
}

enum BadgeTier {
    Bronze,             // Entry level achievement
    Silver,             // Sustained contribution
    Gold,               // Significant impact
    Platinum,           // Outstanding commitment
    Diamond             // Exceptional, rare recognition
}

struct Badge {
    uint256 badgeId;
    address holder;
    address issuer;             // Conservation org that issued the badge
    BadgeType badgeType;
    BadgeTier tier;
    bytes32 evidenceHash;       // Hash of evidence supporting the badge
    string evidenceURI;         // IPFS/Arweave link to evidence
    string description;         // Human-readable description of achievement
    uint64 issuedAt;            // Timestamp of issuance
    bool revoked;               // Whether badge has been revoked
    string revocationReason;    // Reason if revoked
}
```

### Reputation Scoring

Badges contribute to a composite reputation score used for governance weight and grant eligibility.

```solidity
struct ReputationWeights {
    uint256[10] typeWeights;    // Weight per BadgeType (index = enum value)
    uint256[5] tierMultipliers; // Multiplier per BadgeTier
}

contract ConservationBadge is ERC721, AccessControl, IConservationBadge, IZRC5192 {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    mapping(uint256 => Badge) private _badges;
    mapping(address => uint256[]) private _holderBadges;
    mapping(address => mapping(BadgeType => uint256)) private _badgeCounts;

    uint256 private _nextBadgeId;

    // Reputation weights (configurable by DAO)
    ReputationWeights public weights;

    constructor() ERC721("Zoo Conservation Badge", "ZBADGE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Default type weights (base points per badge type)
        weights.typeWeights[uint256(BadgeType.Adoption)] = 100;
        weights.typeWeights[uint256(BadgeType.HabitatFunding)] = 150;
        weights.typeWeights[uint256(BadgeType.ResearchContrib)] = 200;
        weights.typeWeights[uint256(BadgeType.FieldWork)] = 250;
        weights.typeWeights[uint256(BadgeType.CommunityAction)] = 100;
        weights.typeWeights[uint256(BadgeType.DataContribution)] = 120;
        weights.typeWeights[uint256(BadgeType.GovernanceParticip)] = 80;
        weights.typeWeights[uint256(BadgeType.EducationOutreach)] = 100;
        weights.typeWeights[uint256(BadgeType.TechContribution)] = 150;
        weights.typeWeights[uint256(BadgeType.SpecialRecognition)] = 500;

        // Tier multipliers (basis points: 10000 = 1x)
        weights.tierMultipliers[uint256(BadgeTier.Bronze)] = 10000;   // 1x
        weights.tierMultipliers[uint256(BadgeTier.Silver)] = 20000;   // 2x
        weights.tierMultipliers[uint256(BadgeTier.Gold)] = 50000;     // 5x
        weights.tierMultipliers[uint256(BadgeTier.Platinum)] = 100000; // 10x
        weights.tierMultipliers[uint256(BadgeTier.Diamond)] = 250000;  // 25x
    }

    /// @notice Soulbound: prevent all transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0)) and prevent all transfers
        require(from == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function locked(uint256 tokenId) external pure returns (bool) {
        return true; // All badges are permanently locked
    }

    function issueBadge(
        address recipient,
        BadgeType badgeType,
        BadgeTier tier,
        bytes32 evidenceHash,
        string calldata evidenceURI,
        string calldata description
    ) external onlyRole(ISSUER_ROLE) returns (uint256 badgeId) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(evidenceURI).length > 0, "Evidence required");

        badgeId = _nextBadgeId++;
        _safeMint(recipient, badgeId);

        _badges[badgeId] = Badge({
            badgeId: badgeId,
            holder: recipient,
            issuer: msg.sender,
            badgeType: badgeType,
            tier: tier,
            evidenceHash: evidenceHash,
            evidenceURI: evidenceURI,
            description: description,
            issuedAt: uint64(block.timestamp),
            revoked: false,
            revocationReason: ""
        });

        _holderBadges[recipient].push(badgeId);
        _badgeCounts[recipient][badgeType]++;

        emit Locked(badgeId);
        emit BadgeIssued(badgeId, recipient, badgeType, tier, evidenceHash);

        return badgeId;
    }

    function revokeBadge(uint256 badgeId, string calldata reason) external onlyRole(REVOKER_ROLE) {
        Badge storage badge = _badges[badgeId];
        require(!badge.revoked, "Already revoked");

        badge.revoked = true;
        badge.revocationReason = reason;
        _badgeCounts[badge.holder][badge.badgeType]--;

        emit BadgeRevoked(badgeId, msg.sender, reason);
    }

    function reputationScore(address holder) external view returns (uint256) {
        uint256[] memory badges = _holderBadges[holder];
        uint256 score = 0;

        for (uint256 i = 0; i < badges.length; i++) {
            Badge memory badge = _badges[badges[i]];
            if (!badge.revoked) {
                uint256 baseWeight = weights.typeWeights[uint256(badge.badgeType)];
                uint256 multiplier = weights.tierMultipliers[uint256(badge.tier)];
                score += (baseWeight * multiplier) / 10000;
            }
        }

        return score;
    }

    function badgeDetails(uint256 badgeId) external view returns (Badge memory) {
        return _badges[badgeId];
    }

    function badgesOf(address holder) external view returns (uint256[] memory) {
        return _holderBadges[holder];
    }

    function badgeCountByType(address holder, BadgeType badgeType) external view returns (uint256) {
        return _badgeCounts[holder][badgeType];
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### Automated Badge Issuance

Certain badges can be issued automatically when on-chain conditions are met.

```solidity
interface IBadgeAutomation {
    /// @notice Trigger rules that check if a user qualifies for a badge
    struct TriggerRule {
        BadgeType badgeType;
        BadgeTier tier;
        TriggerCondition condition;
        uint256 threshold;          // Condition-specific threshold
        string description;
    }

    enum TriggerCondition {
        AdoptionCount,              // Number of active adoptions (ZIP-201)
        HabitatFunded,              // Total ETH funded to habitats (ZIP-203)
        GovernanceVotes,            // Number of governance votes cast
        DataSubmissions,            // Number of biodiversity data submissions
        ConsecutiveRenewals         // Consecutive sponsorship renewals
    }

    /// @notice Check and issue eligible badges for an address
    function checkAndIssue(address candidate) external returns (uint256[] memory issuedBadgeIds);
}
```

### Metadata Schema

```json
{
  "name": "Gold Field Work Badge",
  "description": "Awarded for 100+ hours of verified field conservation work with the Serengeti Wildlife Foundation",
  "image": "ipfs://QmBadgeArtwork...",
  "external_url": "https://zoo.ngo/badges/42",
  "soulbound": true,
  "badge": {
    "type": "FieldWork",
    "tier": "Gold",
    "issuer": "Serengeti Wildlife Foundation",
    "issuer_address": "0x...",
    "issued_at": "2025-01-15T00:00:00Z",
    "evidence": {
      "hash": "0x...",
      "uri": "ipfs://QmEvidence...",
      "description": "Field logs and GPS tracks from 12 conservation patrols"
    },
    "revoked": false
  },
  "reputation": {
    "base_weight": 250,
    "tier_multiplier": 5,
    "effective_score": 1250
  }
}
```

## Rationale

- **Soulbound binding** is essential to prevent badge markets. If badges could be traded, the system would measure wealth rather than conservation effort.
- **Evidence-linked issuance** requires every badge to point to verifiable evidence (GPS tracks, photographs, transaction hashes, research papers). This prevents sybil attacks where fake identities accumulate badges.
- **Revocation capability** is necessary for fraud correction but restricted to a dedicated `REVOKER_ROLE` with DAO oversight to prevent censorship.
- **Weighted reputation scoring** allows the Zoo DAO to adjust incentives over time. Field work and research carry higher base weights than passive activities, aligning incentives with high-impact conservation.
- **Automated issuance** reduces the governance overhead of manual badge distribution while ensuring badges are earned through verifiable on-chain actions.

## Backwards Compatibility

Conservation Badges implement ERC-721 with transfer restrictions per LP-4192. Wallets and explorers that support ERC-721 will display badges correctly. The `locked()` function signals non-transferability to marketplaces that respect LP-4192, preventing listing attempts. Marketplaces that do not check `locked()` will have transfer calls revert.

## Security Considerations

1. **Sybil Resistance**: Automated badge triggers MUST incorporate anti-sybil measures. For adoption-based badges, the threshold should be high enough that splitting across wallets is uneconomical given gas costs.
2. **Issuer Compromise**: If an `ISSUER_ROLE` key is compromised, fraudulent badges could be minted. Mitigation: multi-sig issuer wallets, time-locked issuance with DAO veto period.
3. **Reputation Gaming**: Users may attempt to accumulate low-tier badges rather than fewer high-tier ones. The tier multiplier system (Bronze=1x, Diamond=25x) makes this inefficient.
4. **Evidence Availability**: Evidence stored on IPFS may become unavailable if not pinned. Badge issuers SHOULD use Arweave for permanent storage or maintain IPFS pinning infrastructure.
5. **Privacy**: Field work GPS tracks and personal contribution data linked to badges may reveal sensitive information. Evidence URIs SHOULD point to redacted summaries rather than raw data. Precise locations of endangered species MUST be omitted per ZIP-510.

## References

1. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
2. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
3. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
4. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
5. [LP-4192: Soulbound Tokens](https://github.com/luxfi/lps/blob/main/LPs/lp-4192.md)
6. [LP-3721: LRC-721 NFT Standard](https://github.com/luxfi/lps/blob/main/LPs/lp-3721.md)
7. [EIP-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
8. [Decentralized Society: Finding Web3's Soul (Weyl, Ohlhaver, Buterin)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
