---
zip: 0702
title: "ZRC-1155: Multi-Token Standard"
description: "Multi-token standard for batch operations supporting conservation badges, in-game items, and multi-asset portfolios"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-01-15
tags: [multi-token, batch, conservation, gaming, badges, zrc-1155]
requires: [15, 100, 700, 701]
---

# ZIP-0702: ZRC-1155 Multi-Token Standard

## Abstract

This proposal defines ZRC-1155, the multi-token standard for the Zoo L2 chain. ZRC-1155 extends the Lux LRC-1155 standard (LP-2155) and is fully ERC-1155 compatible. It supports fungible, non-fungible, and semi-fungible tokens within a single contract, enabling gas-efficient batch operations for conservation badges, in-game wildlife items, research data bundles, and multi-asset conservation portfolios. The standard adds token-level conservation categorization, batch impact tracking, and a collection-wide donation mechanism.

## Motivation

The Zoo ecosystem has several use cases that require multiple token types managed by a single contract:

1. **Conservation Badges**: Soulbound achievement badges (semi-fungible) awarded for donations, field work, citizen science participation, and governance activity. Hundreds of badge types with varying supply.
2. **GameFi Items**: In-game items for Zoo gaming experiences (ZIP-0004) -- tools, habitats, consumables -- that are fungible within type but distinct across types.
3. **Research Data Bundles**: Collections of satellite imagery, sensor data, and field observations packaged as multi-asset bundles for DeSci markets.
4. **Conservation Portfolios**: Baskets of conservation tokens representing diversified impact across species, habitats, and regions.

Deploying separate ERC-20/ERC-721 contracts for each of these is gas-prohibitive and management-intensive. ERC-1155 batch operations reduce gas costs by up to 90% for multi-token transfers.

## Specification

### Core Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";

/**
 * @title IZRC1155
 * @notice Zoo ecosystem multi-token standard with conservation categorization and batch impact.
 * @dev Extends ERC-1155 + LRC-1155 (LP-2155).
 */
interface IZRC1155 is IERC1155, IERC1155MetadataURI {

    // ──────────────────────────────────────────────
    // Token Type Management
    // ──────────────────────────────────────────────

    enum TokenCategory {
        FUNGIBLE,           // Stackable, divisible (like ERC-20)
        NON_FUNGIBLE,       // Unique, supply of 1
        SEMI_FUNGIBLE,      // Fungible within type, limited supply (badges)
        SOULBOUND           // Non-transferable (achievements, credentials)
    }

    enum ConservationCategory {
        NONE,               // No conservation classification
        SPECIES,            // Tied to a specific species
        HABITAT,            // Tied to a habitat region
        RESEARCH,           // Scientific data or output
        IMPACT,             // Conservation impact proof
        GAMING              // In-game item with conservation tie-in
    }

    struct TokenTypeInfo {
        TokenCategory tokenCategory;
        ConservationCategory conservationCategory;
        uint256 maxSupply;          // 0 = unlimited
        uint256 currentSupply;
        bool transferable;          // false for SOULBOUND
        string speciesId;           // Empty if not species-specific
        address conservationFund;   // Fund for this token type (address(0) = collection default)
        uint16 donationBasisPoints; // Per-transfer donation (0 = collection default)
    }

    /**
     * @notice Returns metadata for a token type.
     */
    function tokenTypeInfo(uint256 id) external view returns (TokenTypeInfo memory);

    /**
     * @notice Creates a new token type. Only callable by collection admin.
     */
    function createTokenType(
        uint256 id,
        TokenCategory tokenCategory,
        ConservationCategory conservationCategory,
        uint256 maxSupply,
        bool transferable,
        string calldata speciesId
    ) external;

    event TokenTypeCreated(
        uint256 indexed id,
        TokenCategory tokenCategory,
        ConservationCategory conservationCategory,
        uint256 maxSupply
    );

    // ──────────────────────────────────────────────
    // Batch Impact Tracking
    // ──────────────────────────────────────────────

    /**
     * @notice Returns cumulative conservation impact credits for the entire collection.
     */
    function totalCollectionImpact() external view returns (uint256);

    /**
     * @notice Returns conservation impact credits attributed to a token type.
     */
    function tokenTypeImpact(uint256 id) external view returns (uint256);

    /**
     * @notice Returns impact credits attributed to an account across all token types.
     */
    function accountImpact(address account) external view returns (uint256);

    event ImpactRecorded(
        uint256 indexed tokenId,
        address indexed account,
        uint256 creditsAdded,
        uint256 totalCredits
    );

    // ──────────────────────────────────────────────
    // Collection-Wide Donation
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the default conservation fund for the collection.
     */
    function defaultConservationFund() external view returns (address);

    /**
     * @notice Returns the default donation rate in basis points.
     */
    function defaultDonationBasisPoints() external view returns (uint16);

    /**
     * @notice Updates the default conservation fund. Governance only.
     */
    function setDefaultConservationFund(address fund) external;

    /**
     * @notice Updates the default donation rate. Governance only. Max 500 bps.
     */
    function setDefaultDonationBasisPoints(uint16 bps) external;

    event CollectionDonation(
        address indexed from,
        uint256[] ids,
        uint256[] amounts,
        uint256 totalDonationValue
    );

    // ──────────────────────────────────────────────
    // Batch Minting
    // ──────────────────────────────────────────────

    /**
     * @notice Mints a batch of tokens with conservation metadata.
     */
    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external;

    /**
     * @notice Mints a soulbound badge to a recipient. Non-transferable after mint.
     */
    function mintSoulbound(
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;
}
```

### Token ID Encoding

ZRC-1155 uses a structured token ID encoding to enable efficient on-chain queries:

```
Token ID (uint256):
┌──────────────────┬────────────────┬───────────────────────────┐
│ Category (8 bits) │ Type (48 bits) │ Serial Number (200 bits)  │
└──────────────────┴────────────────┴───────────────────────────┘

Bits 255-248: ConservationCategory enum value
Bits 247-200: Token type identifier
Bits 199-0:   Serial number (0 for fungible, unique for NFTs)
```

Helper functions for encoding/decoding:

```solidity
library ZRC1155TokenId {
    function encode(
        ConservationCategory category,
        uint48 typeId,
        uint200 serial
    ) internal pure returns (uint256) {
        return (uint256(category) << 248) | (uint256(typeId) << 200) | uint256(serial);
    }

    function category(uint256 id) internal pure returns (ConservationCategory) {
        return ConservationCategory(uint8(id >> 248));
    }

    function typeId(uint256 id) internal pure returns (uint48) {
        return uint48(id >> 200);
    }

    function serial(uint256 id) internal pure returns (uint200) {
        return uint200(id);
    }
}
```

### Metadata URI Schema

The `uri(id)` function returns a template URI per ERC-1155:

```
https://api.zoo.ngo/metadata/1155/{id}.json
```

Resolved JSON:

```json
{
  "name": "Rainforest Guardian Badge",
  "description": "Awarded for protecting 100 hectares of tropical rainforest.",
  "image": "ipfs://Qm.../rainforest-badge.png",
  "properties": {
    "tokenCategory": "SEMI_FUNGIBLE",
    "conservationCategory": "HABITAT",
    "transferable": false,
    "maxSupply": 10000,
    "speciesId": "",
    "habitatType": "Tropical Rainforest",
    "impactCreditsPerUnit": 100,
    "requirements": "Donate >= 1000 ZOO to rainforest conservation fund"
  }
}
```

### Soulbound Transfer Restrictions

Tokens with `transferable = false` enforce the following:

1. `safeTransferFrom` and `safeBatchTransferFrom` MUST revert for soulbound token IDs.
2. `setApprovalForAll` grants no transfer rights for soulbound tokens.
3. Soulbound tokens CAN be burned by the holder (voluntary credential revocation).
4. The contract emits standard `TransferSingle`/`TransferBatch` events on mint and burn for indexer compatibility.

### Donation on Batch Transfer

When `safeBatchTransferFrom` is called with fungible token types that have `donationBasisPoints > 0`:

1. For each token ID in the batch, compute the donation amount.
2. Transfer donation amounts to the respective conservation fund (token-specific or collection default).
3. Transfer remaining amounts to the recipient.
4. Emit a single `CollectionDonation` event with the aggregated donation data.

Soulbound and non-fungible tokens are exempt from donation deduction.

## Rationale

**Why a single multi-token contract?** The Zoo ecosystem needs hundreds of token types (badges, items, certificates). Deploying individual contracts for each is economically infeasible on any EVM chain. ERC-1155 batch operations provide 5-10x gas savings.

**Why structured token ID encoding?** On-chain categorization without additional storage reads. Indexers and subgraphs can decode the conservation category directly from the token ID, enabling efficient filtering of wildlife tokens, habitat tokens, and research tokens.

**Why soulbound support?** Conservation badges and achievement credentials lose meaning if tradeable. Soulbound tokens ensure that a "100 Species Protector" badge represents genuine participation, not a marketplace purchase.

**Why collection-level and token-level donation?** Flexibility. A collection can set a default 1% donation rate, while high-impact token types (e.g., species adoption bundles) can override with a higher rate.

## Backwards Compatibility

ZRC-1155 is fully backwards compatible with ERC-1155 (EIP-1155). Standard wallets (MetaMask, Rainbow), marketplaces, and indexers will display ZRC-1155 tokens correctly. Soulbound tokens will appear as non-transferable in wallet UIs that check transfer permissions. The structured token ID encoding is transparent to ERC-1155 consumers -- they see a standard `uint256` token ID.

## Security Considerations

1. **Supply Overflow**: `mintBatch` MUST check that `currentSupply + amount <= maxSupply` for each capped token type. Revert atomically if any type overflows.
2. **Soulbound Bypass**: Ensure `_beforeTokenTransfer` hooks enforce transferability checks. Do not rely solely on external wrappers.
3. **Batch Gas Limits**: Extremely large batch operations may exceed block gas limits. Implementations SHOULD set a maximum batch size (e.g., 100 token IDs per call).
4. **Token ID Collisions**: The `createTokenType` function MUST revert if a token type ID already exists. Encoding scheme ensures uniqueness when used correctly.
5. **Reentrancy**: `safeTransferFrom` calls `onERC1155Received` on the recipient. Implementations MUST use reentrancy guards.
6. **Donation Griefing**: An attacker could create many small transfers to cause rounding-to-zero donations. Implementations SHOULD skip donation for amounts below a minimum threshold.

## References

- [EIP-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [LP-2155: LRC-1155 Multi-Token Standard](https://lux.network/lps/lp-2155)
- [ZIP-0004: Gaming Standards for Zoo Ecosystem](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0701: ZRC-721 NFT Standard](./zip-0701-zrc-721-nft-standard.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
