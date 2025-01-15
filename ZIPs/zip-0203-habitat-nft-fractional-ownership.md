---
zip: 203
title: "Habitat NFT Fractional Ownership"
description: "Fractional ownership of habitat conservation NFTs enabling community co-ownership of protected areas"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
created: 2025-01-15
tags: [nft, fractional, habitat, conservation, community]
requires: [0, 200]
---

# ZIP-203: Habitat NFT Fractional Ownership

## Abstract

This proposal defines a fractional ownership standard for habitat conservation NFTs on the Zoo ecosystem. Each habitat NFT represents a real-world protected area (wildlife corridor, marine reserve, forest parcel). Fractional ownership divides a single habitat NFT into fungible shares using the ERC-3525 semi-fungible token pattern, enabling communities to collectively fund, govern, and benefit from conservation areas. Share holders vote on habitat management decisions with weight proportional to their ownership stake. The standard integrates with ZIP-200 (ZRC-721 Wildlife NFT) for the underlying habitat token and ZIP-0 (Ecosystem Architecture) for governance hooks.

## Motivation

Habitat conservation is capital-intensive. Purchasing and maintaining a 10,000-hectare wildlife corridor in East Africa costs $2-5M upfront plus $200K/year in operational costs. Today, this funding comes from a small number of large donors or institutional grants, creating concentration risk and excluding grassroots supporters.

1. **Accessibility**: A single habitat NFT priced at $2M is beyond individual reach. Fractionalizing it into 100,000 shares at $20 each makes conservation accessible to anyone.
2. **Community Governance**: Stakeholders closest to the habitat -- local communities, researchers, rangers -- should have governance voice proportional to their stake, not just large donors.
3. **Liquidity**: Whole habitat NFTs are illiquid. Fractional shares can be traded on secondary markets, letting supporters enter and exit positions without disrupting the underlying conservation commitment.
4. **Transparent Funding**: On-chain share ownership provides an auditable record of who funded what, eliminating the opacity of traditional conservation finance.
5. **Composable Impact**: Fractional habitat shares integrate with ZIP-202 (Conservation Badges) for reputation scoring and ZIP-101 (Conservation Bond Protocol) for yield generation.

## Specification

### Semi-Fungible Token Interface

The fractional ownership model uses the ERC-3525 semi-fungible pattern: each habitat NFT is a "slot" containing fungible shares. Shares within the same slot are interchangeable; shares across different slots (habitats) are not.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title IFractionalHabitat
/// @notice Fractional ownership of habitat conservation NFTs
interface IFractionalHabitat {
    /// @notice Emitted when a habitat NFT is fractionalized
    event HabitatFractionalized(
        uint256 indexed habitatId,
        uint256 totalShares,
        uint256 pricePerShare
    );

    /// @notice Emitted when shares are purchased
    event SharesPurchased(
        uint256 indexed habitatId,
        address indexed buyer,
        uint256 shares,
        uint256 totalCost
    );

    /// @notice Emitted when shares are redeemed for underlying value
    event SharesRedeemed(
        uint256 indexed habitatId,
        address indexed redeemer,
        uint256 shares,
        uint256 valuePaid
    );

    /// @notice Emitted when a governance vote is cast
    event VoteCast(
        uint256 indexed habitatId,
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    /// @notice Fractionalize a habitat NFT into shares
    /// @param habitatId The ZRC-721 token ID of the habitat NFT
    /// @param totalShares Number of fungible shares to create
    /// @param pricePerShare Initial price per share in wei
    /// @param metadataURI IPFS URI for habitat conservation plan
    function fractionalize(
        uint256 habitatId,
        uint256 totalShares,
        uint256 pricePerShare,
        string calldata metadataURI
    ) external;

    /// @notice Purchase shares of a fractionalized habitat
    /// @param habitatId The habitat to purchase shares in
    /// @param shares Number of shares to purchase
    function share(uint256 habitatId, uint256 shares) external payable;

    /// @notice Redeem shares for proportional value from the habitat treasury
    /// @param habitatId The habitat to redeem shares from
    /// @param shares Number of shares to redeem
    function redeem(uint256 habitatId, uint256 shares) external;

    /// @notice Cast a governance vote weighted by share ownership
    /// @param habitatId The habitat this proposal concerns
    /// @param proposalId The proposal to vote on
    /// @param support True for yes, false for no
    function vote(uint256 habitatId, uint256 proposalId, bool support) external;

    /// @notice Get the share balance of an address for a habitat
    function sharesOf(address owner, uint256 habitatId) external view returns (uint256);

    /// @notice Get total shares for a habitat
    function totalShares(uint256 habitatId) external view returns (uint256);

    /// @notice Get the governance voting power of an address for a habitat
    function votingPower(address owner, uint256 habitatId) external view returns (uint256);
}
```

### Core Data Structures

```solidity
struct HabitatInfo {
    uint256 habitatId;          // ZRC-721 token ID from ZIP-200
    address originalOwner;      // Organization that created the habitat NFT
    uint256 totalShares;        // Total supply of fractional shares
    uint256 sharesAvailable;    // Shares remaining for purchase
    uint256 pricePerShare;      // Current price per share in wei
    uint256 treasuryBalance;    // Accumulated funds for conservation ops
    string metadataURI;         // IPFS URI: conservation plan, GPS bounds, species list
    HabitatStatus status;       // Active, Paused, or Dissolved
    uint64 fractionalizedAt;    // Timestamp of fractionalization
}

enum HabitatStatus {
    Active,     // Shares can be purchased; governance is live
    Paused,     // Temporary halt (dispute, legal review)
    Dissolved   // Habitat NFT returned to original owner; shares redeemable
}

struct Proposal {
    uint256 proposalId;
    uint256 habitatId;
    address proposer;
    string description;         // Human-readable proposal text
    string executionURI;        // IPFS link to detailed execution plan
    uint256 votesFor;
    uint256 votesAgainst;
    uint64 deadline;
    bool executed;
    ProposalType proposalType;
}

enum ProposalType {
    FundingAllocation,   // Allocate treasury funds to conservation activity
    ManagementChange,    // Change habitat management organization
    SharePriceAdjust,    // Adjust price for new share issuance
    EmergencyAction,     // Urgent response (poaching, fire, flood)
    Dissolution          // Dissolve fractional structure
}
```

### Implementation

```solidity
contract FractionalHabitat is AccessControl, IFractionalHabitat {
    bytes32 public constant HABITAT_MANAGER_ROLE = keccak256("HABITAT_MANAGER_ROLE");

    IERC721 public immutable habitatNFT;  // ZIP-200 ZRC-721 contract

    mapping(uint256 => HabitatInfo) public habitats;
    mapping(uint256 => mapping(address => uint256)) public shares;
    mapping(uint256 => Proposal[]) public proposals;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    uint256 public constant MIN_SHARES = 100;
    uint256 public constant MAX_SHARES = 10_000_000;
    uint256 public constant QUORUM_BPS = 2000;       // 20% quorum
    uint256 public constant VOTE_DURATION = 7 days;

    constructor(address _habitatNFT) {
        habitatNFT = IERC721(_habitatNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function fractionalize(
        uint256 habitatId,
        uint256 totalShares_,
        uint256 pricePerShare_,
        string calldata metadataURI_
    ) external {
        require(totalShares_ >= MIN_SHARES && totalShares_ <= MAX_SHARES, "Invalid share count");
        require(pricePerShare_ > 0, "Price must be positive");
        require(habitatNFT.ownerOf(habitatId) == msg.sender, "Not habitat owner");

        // Transfer habitat NFT into this contract as collateral
        habitatNFT.transferFrom(msg.sender, address(this), habitatId);

        habitats[habitatId] = HabitatInfo({
            habitatId: habitatId,
            originalOwner: msg.sender,
            totalShares: totalShares_,
            sharesAvailable: totalShares_,
            pricePerShare: pricePerShare_,
            treasuryBalance: 0,
            metadataURI: metadataURI_,
            status: HabitatStatus.Active,
            fractionalizedAt: uint64(block.timestamp)
        });

        emit HabitatFractionalized(habitatId, totalShares_, pricePerShare_);
    }

    function share(uint256 habitatId, uint256 shareCount) external payable {
        HabitatInfo storage info = habitats[habitatId];
        require(info.status == HabitatStatus.Active, "Habitat not active");
        require(shareCount > 0 && shareCount <= info.sharesAvailable, "Invalid share count");

        uint256 cost = shareCount * info.pricePerShare;
        require(msg.value >= cost, "Insufficient payment");

        info.sharesAvailable -= shareCount;
        shares[habitatId][msg.sender] += shareCount;
        info.treasuryBalance += cost;

        // Refund overpayment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit SharesPurchased(habitatId, msg.sender, shareCount, cost);
    }

    function redeem(uint256 habitatId, uint256 shareCount) external {
        HabitatInfo storage info = habitats[habitatId];
        require(shares[habitatId][msg.sender] >= shareCount, "Insufficient shares");
        require(shareCount > 0, "Must redeem at least 1 share");

        // Calculate proportional value from treasury
        uint256 totalIssued = info.totalShares - info.sharesAvailable;
        uint256 value = (info.treasuryBalance * shareCount) / totalIssued;

        shares[habitatId][msg.sender] -= shareCount;
        info.sharesAvailable += shareCount;
        info.treasuryBalance -= value;

        payable(msg.sender).transfer(value);

        emit SharesRedeemed(habitatId, msg.sender, shareCount, value);
    }

    function vote(uint256 habitatId, uint256 proposalId, bool support) external {
        require(shares[habitatId][msg.sender] > 0, "No shares held");
        require(!hasVoted[habitatId][proposalId][msg.sender], "Already voted");

        Proposal storage proposal = proposals[habitatId][proposalId];
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!proposal.executed, "Already executed");

        uint256 weight = shares[habitatId][msg.sender];
        hasVoted[habitatId][proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        emit VoteCast(habitatId, proposalId, msg.sender, support, weight);
    }

    function createProposal(
        uint256 habitatId,
        string calldata description,
        string calldata executionURI,
        ProposalType proposalType
    ) external returns (uint256) {
        require(shares[habitatId][msg.sender] > 0, "No shares held");

        uint256 proposalId = proposals[habitatId].length;

        proposals[habitatId].push(Proposal({
            proposalId: proposalId,
            habitatId: habitatId,
            proposer: msg.sender,
            description: description,
            executionURI: executionURI,
            votesFor: 0,
            votesAgainst: 0,
            deadline: uint64(block.timestamp + VOTE_DURATION),
            executed: false,
            proposalType: proposalType
        }));

        return proposalId;
    }

    function sharesOf(address owner, uint256 habitatId) external view returns (uint256) {
        return shares[habitatId][owner];
    }

    function totalShares(uint256 habitatId) external view returns (uint256) {
        return habitats[habitatId].totalShares;
    }

    function votingPower(address owner, uint256 habitatId) external view returns (uint256) {
        return shares[habitatId][owner];
    }
}
```

### Metadata Schema

```json
{
  "name": "Serengeti Wildlife Corridor - Section A7",
  "description": "10,000-hectare corridor connecting Serengeti NP to Ngorongoro CA",
  "image": "ipfs://QmHabitatSatelliteImage...",
  "external_url": "https://zoo.ngo/habitats/serengeti-a7",
  "habitat": {
    "type": "Wildlife Corridor",
    "area_hectares": 10000,
    "gps_bounds": {
      "nw": [-2.1234, 34.5678],
      "se": [-2.5678, 35.1234]
    },
    "biome": "Tropical Savanna",
    "key_species": ["Panthera leo", "Loxodonta africana", "Connochaetes taurinus"],
    "threat_level": "High",
    "managing_org": "Serengeti Wildlife Foundation",
    "conservation_plan_uri": "ipfs://QmConservationPlan..."
  },
  "fractional": {
    "total_shares": 100000,
    "price_per_share_usd": 20,
    "shares_sold": 78500,
    "treasury_balance_usd": 1570000,
    "annual_ops_cost_usd": 200000
  }
}
```

## Rationale

- **ERC-3525 semi-fungible pattern** is chosen over ERC-20 vault wrapping because it preserves the identity of each habitat as a distinct slot. Wrapping a habitat NFT into generic ERC-20 tokens loses the per-habitat governance context.
- **On-chain governance by share weight** ensures that funding contribution and decision-making authority are aligned. This prevents situations where large donors have no voice or where non-contributors control management decisions.
- **Treasury-backed redemption** provides a floor price for shares and an exit mechanism. Unlike speculative NFT fractionalization, the treasury is funded by real conservation contributions and yields from ZIP-101 Conservation Bonds.
- **Minimum 20% quorum** prevents low-participation governance captures while remaining achievable for community-driven habitats.
- **7-day voting period** balances urgency with inclusivity across time zones. Emergency proposals (poaching, fire) can be flagged as `EmergencyAction` for expedited governance via a separate fast-track mechanism.

## Backwards Compatibility

FractionalHabitat holds ZIP-200 ZRC-721 tokens as collateral. It does not modify the underlying NFT standard. Shares are tracked in internal mappings rather than as separate ERC-20 tokens, avoiding token proliferation. Wallets and explorers that support ERC-721 will see the habitat NFT held by the FractionalHabitat contract address. A future ZIP may introduce an ERC-1155 view layer to expose share balances to standard wallet interfaces.

## Security Considerations

1. **Rug Pull Prevention**: The habitat NFT is locked in the contract and can only be released through a Dissolution proposal that passes governance. The original owner cannot unilaterally reclaim it.
2. **Treasury Drainage**: Redemptions are proportional to shares held. A whale redeeming 50% of shares receives exactly 50% of treasury, not more. The contract uses checks-effects-interactions to prevent reentrancy.
3. **Governance Attacks**: A single entity accumulating >50% of shares could control all governance votes. Mitigation: optional per-habitat caps on maximum share ownership (configurable by the HABITAT_MANAGER_ROLE) and time-locked execution for high-impact proposals.
4. **Oracle Dependence**: Share pricing is set on-chain and does not depend on external oracles. Real-world habitat valuation is handled off-chain by the managing organization and reflected in the initial pricePerShare.
5. **Legal Compliance**: Fractional habitat shares may constitute securities in some jurisdictions. Implementations MUST consult legal counsel and may need to restrict share transfers to KYC-verified addresses via an allowlist.
6. **Smart Contract Risk**: The contract holds significant value as both the habitat NFT and treasury funds. Formal verification and third-party audits are REQUIRED before mainnet deployment.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-202: Conservation Badge Standard](./zip-0202-conservation-badge-standard.md)
5. [ERC-3525: Semi-Fungible Token](https://eips.ethereum.org/EIPS/eip-3525)
6. [ERC-4626: Tokenized Vaults](https://eips.ethereum.org/EIPS/eip-4626)
7. [Fractional Art Protocol](https://fractional.art/protocol)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
