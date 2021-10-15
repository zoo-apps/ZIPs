---
zip: 0701
title: "ZRC-721: Non-Fungible Token Standard"
description: "Conservation NFT standard with species metadata, provenance chain, and royalties directed to conservation funds"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
originated: 2021-10
traces-from: "Whitepaper section 02 (Zoo Animal Utility)"
follow-on: [zoo-zrc-721]
created: 2025-01-15
tags: [nft, non-fungible, conservation, wildlife, zrc-721, provenance]
requires: [15, 100, 700]
---

# ZIP-0701: ZRC-721 Non-Fungible Token Standard

## Abstract

This proposal defines ZRC-721, the non-fungible token standard for the Zoo L2 chain. ZRC-721 extends the Lux LRC-721 standard (LP-3721) and is fully ERC-721 compatible. It adds three conservation-specific features: structured species metadata following IUCN taxonomy, an immutable provenance chain recording the lifecycle of wildlife-related assets, and a royalty mechanism (EIP-2981) where secondary sale royalties are directed to verified conservation funds. ZRC-721 is the foundation for wildlife adoption certificates, habitat deeds, and research data NFTs across the Zoo ecosystem.

## Motivation

Wildlife conservation requires verifiable digital ownership primitives that:

1. **Carry Scientific Metadata**: Each NFT representing a species, habitat, or research output must embed standardized taxonomic and geospatial data.
2. **Maintain Provenance**: The full history of an asset -- minting, ownership, conservation actions, field observations -- must be on-chain and auditable.
3. **Fund Conservation**: Secondary market activity must direct royalties to conservation, not just creators.
4. **Bridge Across Chains**: Wildlife NFTs must be portable between Zoo L2 and Lux C-Chain per LP-3800.
5. **Support Token-Bound Accounts**: Each NFT must be compatible with ZIP-0703 (TBA) so wildlife NFTs can own assets.

Existing ERC-721 standards lack structured metadata schemas for ecological data and have no mechanism for directing royalties to mission-aligned causes.

## Specification

### Core Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title IZRC721
 * @notice Zoo ecosystem NFT standard with species metadata, provenance, and conservation royalties.
 * @dev Extends ERC-721 + ERC-2981 + LRC-721 (LP-3721).
 */
interface IZRC721 is IERC721, IERC721Metadata, IERC2981 {

    // ──────────────────────────────────────────────
    // Species Metadata
    // ──────────────────────────────────────────────

    struct SpeciesMetadata {
        string scientificName;      // e.g. "Panthera tigris"
        string commonName;          // e.g. "Bengal Tiger"
        string iucnStatus;          // CR, EN, VU, NT, LC, DD, NE
        string taxonomyClass;       // Mammalia, Aves, Reptilia, etc.
        string taxonomyOrder;       // Carnivora, Passeriformes, etc.
        string taxonomyFamily;      // Felidae, Accipitridae, etc.
        int64 latitude;             // Fixed-point (6 decimals) * 1e6
        int64 longitude;            // Fixed-point (6 decimals) * 1e6
        string habitatType;         // Tropical forest, Coral reef, etc.
        string region;              // Geographic region / country
        uint256 populationEstimate; // Best current estimate (0 = unknown)
    }

    /**
     * @notice Returns the species metadata for a given token.
     */
    function speciesMetadata(uint256 tokenId) external view returns (SpeciesMetadata memory);

    /**
     * @notice Sets species metadata. Only callable by token minter or authorized role.
     */
    function setSpeciesMetadata(uint256 tokenId, SpeciesMetadata calldata metadata) external;

    // ──────────────────────────────────────────────
    // Provenance Chain
    // ──────────────────────────────────────────────

    struct ProvenanceRecord {
        uint256 timestamp;
        address recorder;
        string action;         // "minted", "observed", "transferred", "conserved", "verified"
        string details;        // IPFS CID or UTF-8 description
        bytes32 evidenceHash;  // keccak256 of supporting evidence
    }

    /**
     * @notice Returns the full provenance chain for a token.
     */
    function provenanceChain(uint256 tokenId) external view returns (ProvenanceRecord[] memory);

    /**
     * @notice Returns the number of provenance records for a token.
     */
    function provenanceCount(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Appends a provenance record. Callable by token owner or authorized verifiers.
     */
    function addProvenanceRecord(
        uint256 tokenId,
        string calldata action,
        string calldata details,
        bytes32 evidenceHash
    ) external;

    event ProvenanceRecorded(
        uint256 indexed tokenId,
        address indexed recorder,
        string action,
        uint256 timestamp
    );

    // ──────────────────────────────────────────────
    // Conservation Royalties
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the conservation fund receiving royalties for a token.
     */
    function conservationFund(uint256 tokenId) external view returns (address);

    /**
     * @notice Returns the royalty split: (conservationBps, creatorBps).
     *         Total of both MUST equal the ERC-2981 royalty fraction.
     */
    function royaltySplit(uint256 tokenId) external view returns (uint16 conservationBps, uint16 creatorBps);

    /**
     * @notice Sets the conservation fund and royalty split for a token.
     *         Conservation share MUST be >= 50% of total royalty.
     */
    function setConservationRoyalty(
        uint256 tokenId,
        address fund,
        uint16 conservationBps,
        uint16 creatorBps
    ) external;

    event ConservationRoyaltySet(
        uint256 indexed tokenId,
        address indexed fund,
        uint16 conservationBps,
        uint16 creatorBps
    );
}
```

### Metadata Schema (JSON)

ZRC-721 tokens MUST return a `tokenURI` that resolves to JSON conforming to the following schema. This extends ERC-721 Metadata JSON Schema with Zoo-specific fields.

```json
{
  "name": "Bengal Tiger #42",
  "description": "Adoption certificate for a tracked Bengal tiger in Sundarbans.",
  "image": "ipfs://Qm.../tiger-42.jpg",
  "external_url": "https://zoo.ngo/wildlife/42",
  "attributes": [
    { "trait_type": "Scientific Name", "value": "Panthera tigris" },
    { "trait_type": "IUCN Status", "value": "EN" },
    { "trait_type": "Taxonomy Class", "value": "Mammalia" },
    { "trait_type": "Habitat", "value": "Mangrove Forest" },
    { "trait_type": "Region", "value": "Bangladesh" },
    { "trait_type": "Population Estimate", "value": 106 },
    { "display_type": "number", "trait_type": "Conservation Credits Generated", "value": 2500 }
  ],
  "zoo": {
    "speciesId": "panthera-tigris",
    "provenanceCID": "ipfs://Qm.../provenance.json",
    "conservationFund": "0x1234...abcd",
    "latitude": 21.9497,
    "longitude": 89.1833,
    "dataSource": "Wildlife Conservation Society",
    "lastObservation": "2025-01-10T08:30:00Z"
  }
}
```

### Provenance Chain Rules

1. The first provenance record is automatically created at mint time with action `"minted"`.
2. Provenance records are append-only. No record may be deleted or modified.
3. Authorized verifiers (registered in ZIP-0100 Contract Registry) may add records with action `"verified"`.
4. The token owner may add records with actions `"observed"` or `"conserved"`.
5. On transfer, a `"transferred"` provenance record is automatically appended.
6. `evidenceHash` MUST be `keccak256(abi.encodePacked(evidenceCID))` where `evidenceCID` is the IPFS content identifier of supporting media.

### Royalty Distribution

ZRC-721 implements ERC-2981 (`royaltyInfo`). The returned royalty is split between the conservation fund and the original creator:

- Conservation share MUST be at least 50% of the total royalty.
- Default total royalty is 7.5% (750 basis points): 5% conservation, 2.5% creator.
- Marketplaces querying `royaltyInfo` receive the total amount and fund address. The contract internally splits and forwards via a `RoyaltySplitter` contract.

### Bridgeable Extension

```solidity
interface IZRC721Bridgeable is IZRC721 {
    function bridge() external view returns (address);
    function lockForBridge(uint256 tokenId, bytes32 destinationChainId) external;
    function mintFromBridge(
        address to, uint256 tokenId,
        SpeciesMetadata calldata metadata,
        bytes32 sourceChainTxHash
    ) external;
    event BridgeLock(uint256 indexed tokenId, bytes32 indexed destChainId);
    event BridgeMint(uint256 indexed tokenId, bytes32 indexed sourceTxHash);
}
```

When bridging, species metadata and the latest provenance snapshot are included in the bridge message. The full provenance chain is stored on IPFS and referenced by CID.

## Rationale

**Why structured on-chain metadata instead of just tokenURI?** Off-chain metadata can disappear. On-chain species data ensures the conservation identity of an NFT survives even if IPFS gateways or centralized hosting fail.

**Why append-only provenance?** Immutability is essential for trust. Conservation donors need assurance that the history of a wildlife NFT cannot be retroactively altered.

**Why require >= 50% royalty to conservation?** The Zoo ecosystem's primary purpose is conservation (ZIP-0500). Requiring majority royalty allocation to conservation ensures NFT markets generate sustained funding regardless of creator incentives.

**Why ERC-2981?** It is the established royalty standard with broad marketplace support (OpenSea, Blur, LooksRare). Using a custom royalty mechanism would reduce adoption.

## Backwards Compatibility

ZRC-721 is fully backwards compatible with ERC-721 (EIP-721) and ERC-2981 (EIP-2981). Standard NFT wallets, marketplaces, and indexers will function correctly. The species metadata, provenance, and conservation royalty interfaces use novel function selectors that do not conflict with existing standards. ERC-165 `supportsInterface` MUST return `true` for `IZRC721`, `IERC721`, `IERC721Metadata`, `IERC2981`, and `IERC165`.

## Security Considerations

1. **Provenance Spam**: Rate-limiting provenance record additions prevents storage bloat attacks. Implementations SHOULD cap records per token or charge gas proportional to storage.
2. **Verifier Authorization**: Only addresses registered in the Zoo Contract Registry (ZIP-0100) with the `VERIFIER_ROLE` may add `"verified"` provenance records.
3. **Royalty Enforcement**: On-chain royalties are not enforceable at the protocol level on all marketplaces. Implementations SHOULD use operator filter registries where available.
4. **Metadata Immutability**: Once species metadata is set and a `"verified"` provenance record exists, metadata SHOULD be locked to prevent retroactive changes.
5. **Bridge Replay**: `mintFromBridge` MUST track processed `sourceChainTxHash` values to prevent duplicate minting.
6. **Geolocation Privacy**: Exact coordinates of endangered species could aid poachers. Implementations SHOULD truncate coordinates to 0.1-degree precision for publicly visible metadata and store precise coordinates in encrypted off-chain storage accessible only to authorized researchers.

## References

- [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [LP-3721: LRC-721 Non-Fungible Token Standard](https://lux.network/lps/lp-3721)
- [LP-3800: Bridged Asset Standard](https://lux.network/lps/lp-3800)
- [IUCN Red List Categories](https://www.iucnredlist.org/resources/categories-and-criteria)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0703: Token-Bound Accounts for Wildlife](./zip-0703-token-bound-accounts-for-wildlife.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
