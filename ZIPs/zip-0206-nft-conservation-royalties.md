---
zip: 206
title: "NFT Conservation Royalties"
description: "Royalty standard directing a mandatory share of NFT secondary sale proceeds to conservation programs"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper sections 10 (Collateral-Backed NFTs) and 20 (NFT Liquidity Protocol)"
follow-on: [zoo-nft-liquidity-protocol]
created: 2025-01-15
tags: [nft, royalties, conservation, eip-2981, marketplace]
requires: [0, 100, 200, 500]
---

# ZIP-206: NFT Conservation Royalties

## Abstract

This ZIP defines an enforceable royalty standard for Zoo NFTs that mandates a minimum conservation allocation on every secondary sale. Unlike EIP-2981 which is advisory and easily bypassed, this standard enforces royalty collection at the transfer level by integrating with the Zoo marketplace contracts and implementing transfer hooks that escrow the conservation share before completing any sale. The standard supports split royalties between creators, conservation programs, and the Zoo DAO, with configurable ratios and verified conservation recipients from the ZIP-500 registry.

## Motivation

NFT royalties in the broader crypto ecosystem are failing. Major marketplaces have made royalties optional, and creator revenue from secondary sales has collapsed. For conservation-focused NFTs, this is catastrophic:

1. **Enforcement**: Advisory royalties (EIP-2981) are ignored by 60%+ of NFT volume. Conservation funding cannot depend on voluntary compliance.
2. **Transparency**: Current royalty systems are opaque. Buyers do not know where royalty payments go. On-chain conservation routing provides full auditability.
3. **Flexibility**: Different collections need different split structures. A photography collection may direct 50% of royalties to the photographer and 50% to conservation, while a generative art collection may direct 100% to conservation.
4. **Composability**: Royalties should integrate with other Zoo DeFi primitives. Conservation royalty income can be automatically deposited into yield vaults (ZIP-102) or streamed to projects (ZIP-112).

## Specification

### 1. Royalty Structure

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

struct RoyaltyConfig {
    uint16 totalRoyaltyBps;          // Total royalty (e.g., 750 = 7.5%)
    RoyaltySplit[] splits;
    bool enforced;                    // If true, transfer hook active
}

struct RoyaltySplit {
    address recipient;
    uint16 shareBps;                  // Share of royalty (bps, must sum to 10000)
    RecipientType recipientType;
    string conservationProgramId;     // ZIP-500 ID (if conservation type)
}

enum RecipientType {
    Creator,
    Conservation,
    DAOTreasury,
    Community
}
```

### 2. Enforced Transfer Hook

```solidity
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ConservationRoyaltyNFT is ERC721 {
    mapping(uint256 => RoyaltyConfig) private _royalties;
    address public marketplace;
    IERC20 public paymentToken;

    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount,
        RecipientType recipientType
    );

    event ConservationRoyaltyPaid(
        uint256 indexed tokenId,
        string programId,
        uint256 amount
    );

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "ONLY_MARKETPLACE");
        _;
    }

    /// @notice Execute sale with enforced royalties
    function executeSale(
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 salePrice
    ) external onlyMarketplace {
        RoyaltyConfig storage config = _royalties[tokenId];
        require(config.enforced, "NOT_ENFORCED");

        uint256 totalRoyalty = (salePrice * config.totalRoyaltyBps) / 10000;
        uint256 sellerProceeds = salePrice - totalRoyalty;

        // Collect payment from buyer
        paymentToken.transferFrom(buyer, address(this), salePrice);

        // Distribute royalties
        for (uint256 i = 0; i < config.splits.length; i++) {
            RoyaltySplit storage split = config.splits[i];
            uint256 amount = (totalRoyalty * split.shareBps) / 10000;

            paymentToken.transfer(split.recipient, amount);
            emit RoyaltyPaid(tokenId, split.recipient, amount, split.recipientType);

            if (split.recipientType == RecipientType.Conservation) {
                emit ConservationRoyaltyPaid(tokenId, split.conservationProgramId, amount);
            }
        }

        // Pay seller
        paymentToken.transfer(seller, sellerProceeds);

        // Transfer NFT
        _transfer(seller, buyer, tokenId);
    }

    /// @notice EIP-2981 compatibility (returns total royalty to primary recipient)
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external view returns (address receiver, uint256 royaltyAmount)
    {
        RoyaltyConfig storage config = _royalties[tokenId];
        royaltyAmount = (salePrice * config.totalRoyaltyBps) / 10000;
        // Return first conservation recipient as primary
        for (uint256 i = 0; i < config.splits.length; i++) {
            if (config.splits[i].recipientType == RecipientType.Conservation) {
                receiver = config.splits[i].recipient;
                break;
            }
        }
    }
}
```

### 3. Recommended Royalty Templates

| Collection Type | Total Royalty | Creator | Conservation | DAO |
|----------------|-------------|---------|--------------|-----|
| Photography (ZIP-205) | 10% | 50% | 40% | 10% |
| Generative Art | 7.5% | 30% | 60% | 10% |
| Species Adoption (ZIP-201) | 5% | 0% | 90% | 10% |
| Breeding Sim (ZIP-207) | 7.5% | 20% | 70% | 10% |
| Endangered Collection (ZIP-208) | 10% | 0% | 85% | 15% |

### 4. Yield Routing

Conservation royalty income can be automatically routed to DeFi primitives:

```
Sale occurs -> Royalty collected -> Conservation share
  |
  ├── Direct: Send to conservation DAO wallet
  ├── Vault: Deposit into ZIP-102 yield vault
  ├── Stream: Create ZIP-112 stream to project
  └── Bond: Purchase ZIP-101 conservation bond
```

The routing is configurable per collection and changeable by governance.

### 5. Reporting

The contract maintains cumulative statistics:
- Total royalties collected per collection.
- Total conservation funding per ZIP-500 program.
- Per-token lifetime royalty generation.
- Monthly/quarterly aggregates for impact reporting.

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum total royalty | 250 bps (2.5%) | ZooGovernor |
| Minimum conservation share | 2000 bps of royalty (20%) | ZooGovernor |
| Maximum total royalty | 2000 bps (20%) | ZooGovernor |
| Enforcement toggle | Default on, cannot disable for conservation collections | ZooGovernor |

## Rationale

**Why enforce at transfer level?** Advisory royalties fail because marketplaces can bypass them. By routing all sales through the NFT contract's `executeSale` function and restricting direct transfers for listed tokens, royalties become unavoidable.

**Why split royalties?** A single royalty recipient is too rigid. Creators need compensation to keep producing, conservation programs need funding, and the DAO treasury needs protocol sustainability. Splits balance all three.

**Why 20% minimum conservation share?** Below 20%, the conservation component becomes a marketing veneer rather than meaningful funding. The floor ensures conservation is a genuine beneficiary, not an afterthought.

## Security Considerations

### Royalty Bypass
Direct peer-to-peer transfers (not through marketplace) bypass royalties. The contract can restrict transfers to approved marketplace contracts only, or implement a transfer tax that collects conservation fees on all transfers. The trade-off is reduced composability with external protocols.

### Recipient Address Change
Conservation program addresses must be verified via ZIP-500 registry. A compromised registry could redirect royalties. The registry contract should be governed by a multisig with timelock.

### Accumulation Attack
If royalty percentages are very high, attackers could create wash trades to drain buyer funds through royalty payments to addresses they control. The maximum royalty cap (20%) and conservation recipient verification mitigate this.

### Price Manipulation
Sellers could list at artificially low prices and receive side payments to reduce royalty obligations. Minimum price floors per collection (set by governance) and monitoring for statistical outliers address this.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
4. [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
5. [LP-7981: NFT Royalties (Lux)](https://github.com/luxfi/lps/blob/main/LPs/lp-7981.md)
6. Galaxy Digital, "State of NFT Royalties," 2024

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
