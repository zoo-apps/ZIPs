---
zip: 30
title: "On-Chain Species Registry"
description: "Immutable registry of species data linked to IUCN Red List with conservation status tracking"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 02 (Zoo Animal Utility)"
created: 2025-01-15
tags: [species, registry, iucn, biodiversity, conservation]
---

# ZIP-0030: On-Chain Species Registry

## Abstract

This proposal defines an immutable on-chain registry of species data on Zoo Network, linked to the IUCN Red List and other authoritative taxonomic databases. The registry stores species identifiers, conservation status, habitat data, population estimates, and threat assessments as structured on-chain records. It serves as the canonical reference for conservation smart contracts, impact measurement (ZIP-0020), grant targeting (ZIP-0023), and citizen science data submission.

## Motivation

Conservation blockchain applications need a shared, authoritative species database:

1. **Single source of truth**: Multiple Zoo contracts reference species data; a canonical registry prevents inconsistency
2. **Immutable history**: On-chain records create a permanent, tamper-proof history of conservation status changes
3. **Smart contract integration**: Conservation contracts can programmatically respond to status changes (e.g., auto-fund when a species is uplisted to Endangered)
4. **Citizen science anchor**: Citizen science observations (iNaturalist, eBird) can be linked to canonical species records
5. **Transparency**: Public registry enables anyone to verify conservation claims and track progress

## Specification

### Species Record Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SpeciesRegistry {
    struct Species {
        uint256 taxonId;           // IUCN taxon ID
        string scientificName;     // Binomial nomenclature
        string commonName;         // Primary common name
        Taxonomy taxonomy;
        ConservationStatus status;
        uint256 populationEstimate;
        uint256 lastAssessment;    // Timestamp of last IUCN assessment
        bytes32 habitatDataHash;   // IPFS hash of detailed habitat data
        bytes32 threatDataHash;    // IPFS hash of threat assessment
        bool verified;             // Verified by authorized curator
    }

    struct Taxonomy {
        string kingdom;
        string phylum;
        string class_;
        string order_;
        string family;
        string genus;
    }

    enum ConservationStatus {
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

    mapping(uint256 => Species) public species;       // taxonId => Species
    mapping(bytes32 => uint256) public nameToTaxon;   // nameHash => taxonId
    uint256 public totalSpecies;

    event SpeciesRegistered(uint256 indexed taxonId, string scientificName, ConservationStatus status);
    event StatusChanged(uint256 indexed taxonId, ConservationStatus oldStatus, ConservationStatus newStatus);
    event PopulationUpdated(uint256 indexed taxonId, uint256 oldEstimate, uint256 newEstimate);
}
```

### Registry Operations

```solidity
contract SpeciesRegistry {
    // ... (struct definitions above)

    mapping(address => bool) public curators;

    function registerSpecies(
        uint256 taxonId,
        string calldata scientificName,
        string calldata commonName,
        Taxonomy calldata taxonomy,
        ConservationStatus status,
        uint256 populationEstimate,
        bytes32 habitatDataHash,
        bytes32 threatDataHash
    ) external onlyCurator {
        require(species[taxonId].taxonId == 0, "already registered");
        species[taxonId] = Species({
            taxonId: taxonId,
            scientificName: scientificName,
            commonName: commonName,
            taxonomy: taxonomy,
            status: status,
            populationEstimate: populationEstimate,
            lastAssessment: block.timestamp,
            habitatDataHash: habitatDataHash,
            threatDataHash: threatDataHash,
            verified: true
        });
        nameToTaxon[keccak256(bytes(scientificName))] = taxonId;
        totalSpecies++;
        emit SpeciesRegistered(taxonId, scientificName, status);
    }

    function updateConservationStatus(
        uint256 taxonId,
        ConservationStatus newStatus,
        bytes32 assessmentHash
    ) external onlyCurator {
        Species storage s = species[taxonId];
        require(s.taxonId != 0, "species not found");
        ConservationStatus oldStatus = s.status;
        s.status = newStatus;
        s.lastAssessment = block.timestamp;
        emit StatusChanged(taxonId, oldStatus, newStatus);
    }

    function updatePopulation(
        uint256 taxonId,
        uint256 newEstimate,
        bytes32 evidenceHash
    ) external onlyCurator {
        Species storage s = species[taxonId];
        uint256 oldEstimate = s.populationEstimate;
        s.populationEstimate = newEstimate;
        emit PopulationUpdated(taxonId, oldEstimate, newEstimate);
    }
}
```

### Curator System

```yaml
curators:
  initial_set:
    - Zoo Labs Foundation (automated IUCN sync)
    - Partner NGOs (vetted by Foundation)
  appointment: DAO vote (ZIP-0017, Parameter type)
  removal: DAO vote or misconduct finding
  responsibilities:
    - Register new species from IUCN Red List
    - Update conservation status on IUCN assessment cycle
    - Verify community-submitted species data
    - Maintain habitat and threat data on IPFS
```

### IUCN Data Synchronization

An automated pipeline syncs data from the IUCN Red List API:

```yaml
iucn_sync:
  api: https://apiv3.iucnredlist.org/
  frequency: quarterly (aligned with IUCN assessment cycle)
  scope: all assessed species (~150,000)
  process:
    1. Fetch latest IUCN assessments via API
    2. Compare with on-chain records
    3. Generate update transactions for changed species
    4. Curator reviews and signs batch update
    5. Batch submitted to registry contract
  gas_optimization: batch updates (up to 100 species per transaction)
```

### Status Change Hooks

Other Zoo contracts can subscribe to species status changes:

```solidity
interface IStatusChangeListener {
    function onStatusChange(
        uint256 taxonId,
        SpeciesRegistry.ConservationStatus oldStatus,
        SpeciesRegistry.ConservationStatus newStatus
    ) external;
}
```

Example automated responses:

| Status Change | Automated Action |
|--------------|-----------------|
| Any -> Critically Endangered | Trigger emergency conservation grant (ZIP-0027 DEFCON 2) |
| Any -> Endangered | Increase conservation fund allocation for species |
| Endangered -> Vulnerable | Publish success report to impact dashboard |
| Any -> Extinct in Wild | Activate maximum conservation response |

### Query Interface

```solidity
function getSpeciesByStatus(ConservationStatus status)
    external view returns (uint256[] memory taxonIds);

function getSpeciesByFamily(string calldata family)
    external view returns (uint256[] memory taxonIds);

function getSpeciesCount(ConservationStatus status)
    external view returns (uint256);

function isThreatenedSpecies(uint256 taxonId) external view returns (bool) {
    ConservationStatus s = species[taxonId].status;
    return s == ConservationStatus.Vulnerable
        || s == ConservationStatus.Endangered
        || s == ConservationStatus.CriticallyEndangered;
}
```

### Off-Chain Data (IPFS)

Detailed data stored on IPFS, referenced by hash in the registry:

| Data Type | Format | Content |
|-----------|--------|---------|
| Habitat data | GeoJSON | Geographic range polygons, habitat type classifications |
| Threat assessment | JSON | Threat categories, severity, scope per IUCN threat classification |
| Population trend | JSON | Historical population data points, trend direction |
| Conservation actions | JSON | Active conservation programs, funding sources |
| Media | JPEG/PNG | Reference images for species identification |

### Initial Seed Data

The registry launches with priority species:

- All Critically Endangered mammals (~250 species)
- All Critically Endangered birds (~230 species)
- All Critically Endangered amphibians (~600 species)
- CITES Appendix I species (~1,000 species)
- Species covered by active Zoo conservation grants

Total initial seed: approximately 2,000 species.

## Rationale

Using IUCN taxon IDs as the primary key ensures compatibility with the world's most authoritative conservation database. The quarterly sync cycle matches IUCN's assessment rhythm, keeping data current without excessive update frequency.

On-chain storage is limited to essential fields (identifiers, status, population estimates) with detailed data on IPFS. This balances verifiability (status changes are immutably recorded) with cost efficiency (geographic data sets are too large for on-chain storage).

The status change hook mechanism enables Zoo Network to automatically respond to conservation crises, making the registry an active participant in conservation rather than a passive data store.

## Security Considerations

- **Curator authority**: Curators can register and update species data; a compromised curator could insert false data. Mitigation: multi-curator review for sensitive changes (status downgrades)
- **IUCN API availability**: If the IUCN API is unavailable, sync pauses; existing on-chain data remains valid
- **Data integrity**: All IUCN-sourced data includes the original assessment citation hash, enabling independent verification
- **Automated response abuse**: Status change hooks that trigger fund releases use the emergency governance thresholds (ZIP-0027) as guardrails
- **Taxonomic disputes**: When taxonomic revisions split or merge species, curators create new records and deprecate old ones with cross-references
- **Endangered species location**: Geographic data is aggregated to IUCN range polygons (not precise GPS) to prevent poaching use

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0020: Impact Metric Oracle](./zip-0020-impact-metric-oracle.md)
- [ZIP-0024: Data Availability Layer](./zip-0024-data-availability-layer.md)
- [ZIP-0601: Open Biodiversity Database Standard](./zip-0601-open-biodiversity-database-standard.md)
- [IUCN Red List API v3](https://apiv3.iucnredlist.org/)
- [CITES Species Database](https://speciesplus.net/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
