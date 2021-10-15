---
zip: 26
title: "Ecosystem Reputation System"
description: "Soulbound reputation tokens for tracking and rewarding conservation contributor engagement"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 19 (Zoo DAO) -- reputation component"
follow-on: [zoo-dao-reputation-system]
created: 2025-01-15
tags: [reputation, soulbound, identity, contributors]
---

# ZIP-0026: Ecosystem Reputation System

## Abstract

This proposal defines a soulbound token (SBT) based reputation system for Zoo Network. Non-transferable reputation tokens are issued to contributors based on verified conservation activities, governance participation, grant completion, and ecosystem development. Reputation scores unlock governance weight multipliers, grant eligibility tiers, and ecosystem privileges without creating tradeable financial instruments.

## Motivation

Token-weighted governance alone is plutocratic; reputation adds a merit dimension:

1. **Merit recognition**: Active conservationists and researchers should have outsized influence regardless of token holdings
2. **Sybil resistance**: Reputation earned through verified activities is harder to fake than purchased tokens
3. **Long-term alignment**: Non-transferable tokens reward sustained contribution, not speculative trading
4. **Grant credibility**: Reputation provides signal for grant review councils evaluating applicant track records
5. **KEEPER alignment**: Complements the KEEPER donor governance token (ZIP-0000 Section 12.2) with an activity-based counterpart

## Specification

### Reputation Token (ZOO-REP)

```yaml
token:
  name: Zoo Reputation
  symbol: ZOO-REP
  standard: ERC-5192 (Soulbound)
  transferable: false
  burnable: false (except by governance for misconduct)
  decimal: false (integer scores)
```

### Reputation Sources

| Activity | Points | Frequency | Verification |
|----------|--------|-----------|-------------|
| Governance vote cast | 1 | Per vote | On-chain |
| Grant proposal reviewed | 5 | Per review | Council attestation |
| Grant completed (score 700+) | 50 | Per grant | Impact Oracle (ZIP-0020) |
| Conservation data submitted | 2 | Per dataset | Oracle operator validation |
| Bug bounty (critical) | 100 | Per finding | Security council |
| Bug bounty (medium) | 25 | Per finding | Security council |
| Code contribution merged | 10 | Per PR | Technical council |
| Citizen science observation | 1 | Per verified obs. | iNaturalist/eBird API |
| Community education event | 15 | Per event | Community council |
| Oracle operator (good standing) | 5 | Per month | Automated |

### Reputation Tiers

| Tier | Points Required | Benefits |
|------|----------------|----------|
| Observer | 0-49 | Basic governance participation |
| Contributor | 50-199 | 1.2x governance weight, grant eligibility |
| Steward | 200-499 | 1.5x governance weight, council nomination eligibility |
| Guardian | 500-999 | 2.0x governance weight, expedited grant review |
| Elder | 1000+ | 2.5x governance weight, council appointment eligibility |

### Reputation Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ZooReputation is ERC721 {
    struct ReputationData {
        uint256 totalPoints;
        uint256 lastActivityTimestamp;
        mapping(bytes32 => uint256) categoryPoints;
    }

    mapping(address => ReputationData) public reputation;
    mapping(address => bool) public authorizedIssuers;

    event ReputationAwarded(address indexed account, bytes32 category, uint256 points);
    event TierReached(address indexed account, Tier newTier);

    enum Tier { Observer, Contributor, Steward, Guardian, Elder }

    function awardReputation(
        address account,
        bytes32 category,
        uint256 points,
        bytes32 evidenceHash
    ) external onlyAuthorizedIssuer {
        reputation[account].totalPoints += points;
        reputation[account].categoryPoints[category] += points;
        reputation[account].lastActivityTimestamp = block.timestamp;
        emit ReputationAwarded(account, category, points);
    }

    function getGovernanceWeight(address account) external view returns (uint256) {
        Tier tier = getTier(account);
        if (tier == Tier.Elder) return 250;      // 2.5x
        if (tier == Tier.Guardian) return 200;   // 2.0x
        if (tier == Tier.Steward) return 150;    // 1.5x
        if (tier == Tier.Contributor) return 120; // 1.2x
        return 100;                               // 1.0x (base)
    }

    // Soulbound: disable transfers
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address) {
        require(auth == address(0) || to == address(0), "soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }
}
```

### Decay Mechanism

Reputation decays slowly to ensure continued activity:

```yaml
decay:
  rate: 5% per year            # Applied continuously
  minimum: 0                   # Can decay to zero
  activity_reset: true         # Any qualifying activity resets decay timer
  grace_period: 6 months       # No decay for first 6 months of inactivity
  category_specific: false     # Decay applies to total, not per-category
```

### Cross-Reference with Governance

Reputation multipliers are applied when casting governance votes (ZIP-0017):

```
effective_votes = token_balance * reputation_multiplier
```

This means an Elder with 1,000 ZOO has the same governance power as an Observer with 2,500 ZOO, rewarding active participation.

### Misconduct and Revocation

Reputation can be reduced or revoked by governance for:
- Submitting fraudulent conservation data
- Conflicts of interest in grant reviews (undisclosed)
- Malicious governance proposals
- Security violations

Revocation requires a DAO vote with 10% quorum and >66% approval.

## Rationale

Soulbound tokens are chosen because transferable reputation would be captured by markets, defeating the purpose of merit-based governance. The ERC-5192 standard provides wallet compatibility while enforcing non-transferability.

The 5% annual decay rate ensures that reputation reflects current engagement rather than historical one-time contributions. The 6-month grace period accommodates seasonal researchers and intermittent contributors.

The governance weight multiplier (up to 2.5x) is meaningful but capped to prevent reputation holders from completely overriding token-weighted votes. This creates a balanced system where both economic stake and merit matter.

## Security Considerations

- **Reputation farming**: Point values are calibrated to require genuine effort; automated Sybil detection monitors for patterns
- **Issuer compromise**: Multiple authorized issuers with different scopes; no single issuer can award more than 100 points per month
- **Gaming governance**: The 2.5x cap prevents reputation from dominating token weight entirely
- **Privacy**: Reputation scores are public; users who need privacy can use a pseudonymous address (not linked to real identity)
- **Centralization risk**: Foundation-appointed issuers could be biased; the path to full community control is progressive decentralization of issuer authority

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0017: DAO Governance Framework](./zip-0017-dao-governance-framework.md)
- [ZIP-0020: Impact Metric Oracle](./zip-0020-impact-metric-oracle.md)
- [ZIP-0023: Community Grant Program](./zip-0023-community-grant-program.md)
- [EIP-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
