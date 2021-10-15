---
zip: 208
title: "Endangered Species Collection"
description: "Curated NFT collection tied to IUCN Red List with dynamic metadata reflecting real-time conservation status"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper sections 02 (Zoo Animal Utility) and 15 (Gen 0 NFT Drop)"
created: 2025-01-15
tags: [nft, endangered, iucn, collection, dynamic]
requires: [0, 100, 200, 204, 501]
---

# ZIP-208: Endangered Species Collection

## Abstract

This ZIP defines a curated NFT collection where each token represents a species listed on the IUCN Red List as Vulnerable (VU), Endangered (EN), Critically Endangered (CR), or Extinct in the Wild (EW). The collection implements dynamic metadata (ZIP-204) that updates in real-time to reflect the species' current conservation status, population estimates, and habitat range changes. A fixed supply of tokens is minted per species -- one per known population estimate at launch -- creating inherent scarcity that mirrors real-world rarity. All primary sale proceeds and a minimum 85% of secondary royalties fund the specific conservation program for that species.

## Motivation

The IUCN Red List catalogs over 44,000 threatened species, yet most people cannot name more than a handful. This collection creates a direct, personal connection between NFT holders and endangered species:

1. **Awareness**: Each NFT serves as a living dashboard for its species, surfacing population data, threats, and conservation actions in real-time.
2. **Scarcity alignment**: Token supply mirrors estimated population, so a Sumatran Rhino NFT (population ~80) is genuinely rarer than a Polar Bear NFT (population ~26,000).
3. **Direct funding**: Near-total (85%+) royalty allocation to species-specific conservation maximizes impact per transaction.
4. **Status tracking**: Dynamic metadata means an NFT's visual appearance changes as its species' conservation status changes -- improving status brightens the art, declining status dims it.

## Specification

### 1. Collection Structure

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ZRC721Wildlife} from "./ZRC721Wildlife.sol";

contract EndangeredSpeciesCollection is ZRC721Wildlife {
    struct SpeciesEdition {
        string iucnId;               // IUCN Red List taxon ID
        string scientificName;
        string commonName;
        IUCNStatus currentStatus;
        uint256 populationEstimate;  // At collection launch
        uint256 maxSupply;           // Capped to population estimate
        uint256 minted;
        uint256 primaryPrice;        // In ZUSD
        address conservationProgram;
        string conservationProgramId;
        bool active;
    }

    mapping(bytes32 => SpeciesEdition) public editions;  // keccak256(iucnId)
    mapping(uint256 => bytes32) public tokenEdition;     // tokenId -> edition hash

    uint256 public totalSpecies;
    uint256 public totalConservationFunding;

    event SpeciesAdded(string iucnId, string commonName, uint256 maxSupply);
    event StatusUpdated(string iucnId, IUCNStatus oldStatus, IUCNStatus newStatus);
    event ConservationFunded(string iucnId, address program, uint256 amount);

    function addSpecies(
        string calldata iucnId,
        string calldata scientificName,
        string calldata commonName,
        IUCNStatus status,
        uint256 populationEstimate,
        uint256 primaryPrice,
        address conservationProgram,
        string calldata programId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 editionHash = keccak256(abi.encodePacked(iucnId));
        require(!editions[editionHash].active, "ALREADY_EXISTS");
        require(uint8(status) >= uint8(IUCNStatus.Vulnerable), "NOT_THREATENED");

        editions[editionHash] = SpeciesEdition({
            iucnId: iucnId,
            scientificName: scientificName,
            commonName: commonName,
            currentStatus: status,
            populationEstimate: populationEstimate,
            maxSupply: populationEstimate,
            minted: 0,
            primaryPrice: primaryPrice,
            conservationProgram: conservationProgram,
            conservationProgramId: programId,
            active: true
        });

        totalSpecies++;
        emit SpeciesAdded(iucnId, commonName, populationEstimate);
    }

    function mint(string calldata iucnId) external returns (uint256 tokenId) {
        bytes32 editionHash = keccak256(abi.encodePacked(iucnId));
        SpeciesEdition storage edition = editions[editionHash];
        require(edition.active, "INACTIVE");
        require(edition.minted < edition.maxSupply, "SOLD_OUT");

        // Collect payment
        IERC20(zusd).transferFrom(msg.sender, address(this), edition.primaryPrice);

        // 100% of primary sale to conservation
        IERC20(zusd).transfer(edition.conservationProgram, edition.primaryPrice);
        totalConservationFunding += edition.primaryPrice;

        edition.minted++;
        // Mint ZRC-721 with species metadata
        // tokenId = ... (standard ZRC-721 mint)

        tokenEdition[tokenId] = editionHash;
        emit ConservationFunded(iucnId, edition.conservationProgram, edition.primaryPrice);
        return tokenId;
    }

    function updateStatus(
        string calldata iucnId,
        IUCNStatus newStatus,
        uint256 newPopulationEstimate
    ) external onlyRole(RECORDER_ROLE) {
        bytes32 editionHash = keccak256(abi.encodePacked(iucnId));
        SpeciesEdition storage edition = editions[editionHash];
        IUCNStatus oldStatus = edition.currentStatus;

        edition.currentStatus = newStatus;
        edition.populationEstimate = newPopulationEstimate;

        emit StatusUpdated(iucnId, oldStatus, newStatus);
    }
}
```

### 2. Dynamic Metadata

Token metadata updates reflect real-time conservation status:

| Conservation Trend | Visual Effect | Metadata Change |
|-------------------|---------------|-----------------|
| Improving (status upgrade) | Art brightens, habitat expands | `status` field updated |
| Stable | Standard presentation | No change |
| Declining (status downgrade) | Art dims, habitat shrinks | `status` field updated, alert added |
| Extinct in Wild | Greyscale, memorial border | `extinct_in_wild: true` |

The metadata URI points to a dynamic renderer that reads on-chain status:

```json
{
  "name": "Sumatran Rhino #42",
  "description": "One of approximately 80 remaining Dicerorhinus sumatrensis",
  "image": "https://api.zoo.ngo/endangered/render/42",
  "attributes": [
    { "trait_type": "Species", "value": "Sumatran Rhino" },
    { "trait_type": "IUCN Status", "value": "CR" },
    { "trait_type": "Population", "value": 80 },
    { "trait_type": "Edition", "value": "42 of 80" },
    { "trait_type": "Trend", "value": "Declining" },
    { "trait_type": "Primary Threat", "value": "Habitat loss" }
  ],
  "conservation": {
    "program": "International Rhino Foundation",
    "program_id": "irf-sumatran",
    "total_funded_usd": 15420,
    "last_status_update": "2025-01-10"
  }
}
```

### 3. Supply Model

| IUCN Status | Population Estimate | Max Supply | Primary Price |
|-------------|-------------------|------------|---------------|
| Vulnerable (VU) | >10,000 | 10,000 cap | 10 ZUSD |
| Endangered (EN) | 2,500-10,000 | Actual estimate | 25 ZUSD |
| Critically Endangered (CR) | <2,500 | Actual estimate | 50 ZUSD |
| Extinct in Wild (EW) | 0 wild | Captive population | 100 ZUSD |

### 4. Launch Species (Initial 20)

| Species | Status | Est. Population | Max Supply |
|---------|--------|----------------|------------|
| Sumatran Rhino | CR | 80 | 80 |
| Vaquita | CR | 10 | 10 |
| Amur Leopard | CR | 100 | 100 |
| Mountain Gorilla | EN | 1,063 | 1,063 |
| Snow Leopard | VU | 4,000 | 4,000 |
| African Wild Dog | EN | 6,600 | 6,600 |
| ... | ... | ... | ... |

### 5. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Primary sale conservation allocation | 100% | Immutable |
| Secondary royalty total | 10% (1000 bps) | ZooGovernor |
| Secondary conservation share | 85% of royalty | ZooGovernor |
| Status update frequency | Quarterly minimum | RECORDER_ROLE |
| Maximum species in collection | 500 | ZooGovernor |

## Rationale

**Why tie supply to population?** This creates a direct experiential link between digital scarcity and biological scarcity. Owning 1-of-10 Vaquita NFTs viscerally communicates the species' critical state in a way that statistics alone cannot.

**Why 100% primary sale to conservation?** The collection's credibility depends on maximizing conservation impact. Creator costs are covered by secondary royalty shares and DAO treasury allocation.

**Why dynamic metadata?** Static NFTs lose relevance over time. Dynamic metadata that tracks real conservation status keeps holders engaged and creates emotional stakes in the species' survival.

**Why minimum Vulnerable status?** The collection focuses on species facing extinction risk. Least Concern species, while valuable, do not have the urgency that justifies the scarcity-based funding model.

## Security Considerations

### Status Oracle Integrity
Conservation status updates must be accurate. Only RECORDER_ROLE addresses verified by the Zoo DAO can update status. Cross-referencing with the IUCN Red List API provides a secondary verification layer.

### Supply Inflation
Once a species edition is created, `maxSupply` cannot be increased. Population estimate changes update metadata but do not mint new tokens.

### Emotional Manipulation
A species status downgrade could be used to manipulate market prices (increased scarcity perception). The 48-hour notice period before status changes take effect and public data sources mitigate this.

### Extinction Event
If a species becomes extinct, the NFTs become memorials. The conservation program allocation shifts to closely related species or habitat restoration. Governance determines reallocation via ZooGovernor vote.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-204: Dynamic Metadata Living NFTs](./zip-0204-dynamic-metadata-living-nfts.md)
4. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
5. [IUCN Red List of Threatened Species](https://www.iucnredlist.org/)
6. IUCN SSC, "Guidelines for Application of IUCN Red List Criteria at Regional and National Levels," 2012

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
