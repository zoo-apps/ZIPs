---
zip: 200
title: "ZRC-721: Wildlife NFT Standard"
description: "Non-fungible token standard for wildlife digital assets with species metadata, provenance tracking, and conservation funding"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper section 02 (Zoo Animal Utility)"
follow-on: [zoo-zrc-721]
created: 2025-01-15
tags: [nft, zrc-721, wildlife, provenance, conservation]
requires: [0, 100]
---

# ZIP-200: ZRC-721 Wildlife NFT Standard

## Abstract

This proposal defines ZRC-721, the canonical non-fungible token standard for the Zoo ecosystem. ZRC-721 extends the LRC-721 interface (LP-3721) with mandatory species metadata, on-chain provenance tracking, and an automatic conservation funding mechanism. Every ZRC-721 token carries a structured `SpeciesRecord` identifying the biological subject, a tamper-evident `ProvenanceChain` recording custody and observation history, and a configurable `ConservationSplit` that routes a percentage of every sale to verified conservation programs registered under ZIP-500.

## Motivation

Existing NFT standards treat tokens as opaque digital collectibles. For a conservation-focused ecosystem like Zoo, NFTs must encode verifiable biological data and direct economic value toward species protection:

1. **Species Identity**: Wildlife NFTs require structured taxonomy (kingdom, class, order, family, genus, species) and IUCN threat classification so downstream applications can filter, aggregate, and report on conservation status.
2. **Provenance Integrity**: Digital assets representing wildlife observations, camera-trap images, or AI-generated species art must carry an immutable chain of custody linking the token to its data source.
3. **Conservation Funding**: Without a protocol-level mechanism, conservation funding depends on voluntary donations. ZRC-721 embeds a mandatory minimum split so every secondary-market transaction contributes to wildlife protection.
4. **Interoperability**: Zoo contracts (Media.sol, Market.sol, Drop.sol) already handle NFTs. ZRC-721 formalizes the interface so all ecosystem contracts share a common type system.
5. **LP Alignment**: LP-3721 (LRC-721) provides the base NFT standard on Lux. ZRC-721 is a strict superset, ensuring cross-chain bridge compatibility via the Lux-Zoo bridge (ZIP-100).

## Specification

### Core Interface

ZRC-721 extends LRC-721 with three additional interfaces: species metadata, provenance, and conservation splits.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IZRC721 {
    /// @notice Emitted when a new wildlife token is minted
    event WildlifeMinted(
        uint256 indexed tokenId,
        address indexed minter,
        bytes32 speciesHash,
        uint256 conservationBps
    );

    /// @notice Emitted when provenance is appended
    event ProvenanceRecorded(
        uint256 indexed tokenId,
        address indexed recorder,
        bytes32 dataHash,
        uint64 timestamp
    );

    /// @notice Emitted when conservation funds are distributed
    event ConservationFunded(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Returns the species record for a token
    function speciesOf(uint256 tokenId) external view returns (SpeciesRecord memory);

    /// @notice Returns the full provenance chain for a token
    function provenanceOf(uint256 tokenId) external view returns (ProvenanceEntry[] memory);

    /// @notice Returns the conservation split configuration
    function conservationSplitOf(uint256 tokenId) external view returns (ConservationSplit memory);

    /// @notice Appends a provenance entry (authorized recorders only)
    function recordProvenance(
        uint256 tokenId,
        bytes32 dataHash,
        string calldata dataURI,
        ProvenanceType entryType
    ) external;
}
```

### Species Metadata

Every ZRC-721 token MUST carry a `SpeciesRecord` set at mint time. The record is immutable after creation.

```solidity
struct SpeciesRecord {
    string commonName;          // e.g. "African Elephant"
    string scientificName;      // e.g. "Loxodonta africana"
    string kingdom;             // "Animalia"
    string phylum;              // "Chordata"
    string class_;              // "Mammalia" (class is reserved keyword)
    string order_;              // "Proboscidea"
    string family;              // "Elephantidae"
    string genus;               // "Loxodonta"
    string species;             // "africana"
    IUCNStatus iucnStatus;      // Threat classification
    bytes32 taxonomyHash;       // keccak256 of canonical taxonomy record
    string habitatRegion;       // ISO 3166-1 alpha-3 country codes, comma-separated
    uint64 observationDate;     // UNIX timestamp of original observation
}

enum IUCNStatus {
    NotEvaluated,       // NE
    DataDeficient,      // DD
    LeastConcern,       // LC
    NearThreatened,     // NT
    Vulnerable,         // VU
    Endangered,         // EN
    CriticallyEndangered, // CR
    ExtinctInWild,      // EW
    Extinct             // EX
}
```

### Provenance Chain

Provenance entries form an append-only log per token. Only addresses with the `RECORDER_ROLE` may append entries.

```solidity
enum ProvenanceType {
    Observation,        // Field observation or camera trap
    AIGeneration,       // AI-generated artwork or reconstruction
    ScientificRecord,   // Peer-reviewed data reference
    CustodyTransfer,    // Physical specimen or data custody change
    Verification        // Third-party verification of data
}

struct ProvenanceEntry {
    address recorder;       // Who recorded this entry
    bytes32 dataHash;       // Hash of underlying data (image, dataset, paper)
    string dataURI;         // IPFS or Arweave URI to data
    ProvenanceType entryType;
    uint64 timestamp;       // Block timestamp at recording
    uint256 blockNumber;    // Block number for anchoring
}
```

### Conservation Split

A minimum of 5% (500 basis points) of every secondary sale MUST be routed to a conservation recipient. The split is configured at mint time and the recipient must be a verified conservation program under ZIP-500/ZIP-550.

```solidity
struct ConservationSplit {
    address recipient;          // Conservation program address
    uint16 basisPoints;         // Minimum 500 (5%)
    string programId;           // ZIP-500 registered program identifier
    bool verified;              // Set by ConservationRegistry
}

interface IConservationRegistry {
    function isVerifiedProgram(string calldata programId) external view returns (bool);
    function programRecipient(string calldata programId) external view returns (address);
}
```

### Reference Implementation

```solidity
contract ZRC721Wildlife is ERC721, AccessControl, IZRC721 {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint16 public constant MIN_CONSERVATION_BPS = 500; // 5% minimum

    IConservationRegistry public conservationRegistry;

    mapping(uint256 => SpeciesRecord) private _species;
    mapping(uint256 => ProvenanceEntry[]) private _provenance;
    mapping(uint256 => ConservationSplit) private _splits;

    uint256 private _nextTokenId;

    constructor(
        address registry
    ) ERC721("Zoo Wildlife", "ZWILD") {
        conservationRegistry = IConservationRegistry(registry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mintWildlife(
        address to,
        SpeciesRecord calldata record,
        string calldata programId,
        uint16 conservationBps
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(conservationBps >= MIN_CONSERVATION_BPS, "Below minimum conservation split");
        require(conservationRegistry.isVerifiedProgram(programId), "Unverified program");
        require(bytes(record.scientificName).length > 0, "Scientific name required");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _species[tokenId] = record;
        _splits[tokenId] = ConservationSplit({
            recipient: conservationRegistry.programRecipient(programId),
            basisPoints: conservationBps,
            programId: programId,
            verified: true
        });

        // Record initial provenance
        _provenance[tokenId].push(ProvenanceEntry({
            recorder: msg.sender,
            dataHash: record.taxonomyHash,
            dataURI: "",
            entryType: ProvenanceType.Observation,
            timestamp: uint64(block.timestamp),
            blockNumber: block.number
        }));

        emit WildlifeMinted(tokenId, to, record.taxonomyHash, conservationBps);
        return tokenId;
    }

    function recordProvenance(
        uint256 tokenId,
        bytes32 dataHash,
        string calldata dataURI,
        ProvenanceType entryType
    ) external onlyRole(RECORDER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        _provenance[tokenId].push(ProvenanceEntry({
            recorder: msg.sender,
            dataHash: dataHash,
            dataURI: dataURI,
            entryType: entryType,
            timestamp: uint64(block.timestamp),
            blockNumber: block.number
        }));

        emit ProvenanceRecorded(tokenId, msg.sender, dataHash, uint64(block.timestamp));
    }

    function speciesOf(uint256 tokenId) external view returns (SpeciesRecord memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _species[tokenId];
    }

    function provenanceOf(uint256 tokenId) external view returns (ProvenanceEntry[] memory) {
        return _provenance[tokenId];
    }

    function conservationSplitOf(uint256 tokenId) external view returns (ConservationSplit memory) {
        return _splits[tokenId];
    }

    /// @notice EIP-2981 royalty info routing conservation split
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        ConservationSplit memory split = _splits[tokenId];
        return (split.recipient, (salePrice * split.basisPoints) / 10000);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### Metadata JSON Schema

ZRC-721 tokens MUST serve metadata conforming to the following schema at their `tokenURI`:

```json
{
  "name": "African Elephant #42",
  "description": "Camera-trap observation from Amboseli National Park",
  "image": "ipfs://QmSpeciesImage...",
  "animation_url": "ipfs://QmSpeciesVideo...",
  "external_url": "https://zoo.ngo/wildlife/42",
  "species": {
    "common_name": "African Elephant",
    "scientific_name": "Loxodonta africana",
    "taxonomy": {
      "kingdom": "Animalia",
      "phylum": "Chordata",
      "class": "Mammalia",
      "order": "Proboscidea",
      "family": "Elephantidae",
      "genus": "Loxodonta",
      "species": "africana"
    },
    "iucn_status": "EN",
    "habitat_region": "KEN,TZA",
    "observation_date": "2025-01-10T08:30:00Z"
  },
  "conservation": {
    "program_id": "amboseli-elephant-trust",
    "split_bps": 1000,
    "recipient": "0x..."
  },
  "provenance": [
    {
      "type": "Observation",
      "data_hash": "0x...",
      "data_uri": "ipfs://QmRawData...",
      "recorder": "0x...",
      "timestamp": 1736496600
    }
  ]
}
```

## Rationale

- **Mandatory species metadata** ensures every wildlife NFT is machine-readable and queryable by taxonomy, enabling ecosystem-wide conservation dashboards.
- **Append-only provenance** rather than mutable metadata prevents tampering with observation records while allowing new verifications to be added over time.
- **5% minimum conservation split** is chosen as a floor that is meaningful for funding yet low enough to not discourage market activity. Projects may set higher splits.
- **EIP-2981 compatibility** via `royaltyInfo` ensures existing marketplaces (including Zoo Market.sol per ZIP-100) can enforce conservation funding without custom integration.
- **LP-3721 superset** design means ZRC-721 tokens can be bridged to Lux and handled by any LRC-721-compliant contract.

## Backwards Compatibility

ZRC-721 is a strict superset of ERC-721 and LRC-721 (LP-3721). Existing Zoo contracts (Media.sol, Market.sol, Auction.sol) that operate on ERC-721 tokens will continue to function. The additional species, provenance, and conservation interfaces are opt-in for consumers. The `royaltyInfo` function follows EIP-2981 (LP-7981), ensuring marketplace compatibility.

## Security Considerations

1. **Taxonomy Integrity**: The `taxonomyHash` field anchors species data to an off-chain canonical record. Consumers SHOULD verify this hash against a trusted taxonomy database before displaying IUCN status.
2. **Recorder Authorization**: Only `RECORDER_ROLE` holders can append provenance. This role MUST be granted only to verified field researchers, AI pipelines with TEE attestation, or DAO-approved oracles.
3. **Conservation Recipient Validation**: The `ConservationRegistry` contract MUST be governed by the Zoo DAO to prevent routing funds to unauthorized addresses.
4. **Metadata Immutability**: Species records are immutable after minting. If taxonomic reclassification occurs, a new provenance entry of type `ScientificRecord` should be appended rather than modifying the original record.
5. **Bridge Security**: When bridging ZRC-721 tokens to Lux via the Zoo bridge (ZIP-100), the species metadata and provenance chain MUST be included in the bridge payload to prevent data loss.

## References

1. [LP-3721: LRC-721 NFT Standard](https://github.com/luxfi/lps/blob/main/LPs/lp-3721.md)
2. [LP-7981: NFT Royalties](https://github.com/luxfi/lps/blob/main/LPs/lp-7981.md)
3. [LP-9102: NFT Marketplace](https://github.com/luxfi/lps/blob/main/LPs/lp-9102.md)
4. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
5. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
6. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
7. [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
8. [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
9. [IUCN Red List Categories](https://www.iucnredlist.org/resources/categories-and-criteria)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
