---
zip: 502
title: "Wildlife Corridor Mapping"
description: "Blockchain-verified data standard for wildlife corridor geospatial data with multi-source validation"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Wildlife
originated: 2021-10
traces-from: "Whitepaper section 03 (Sustainability)"
follow-on: [zoo-wildlife-tracking, zoo-satellite-ecology]
created: 2025-01-15
tags: [wildlife, corridors, geospatial, mapping, conservation]
requires: [0, 500, 501, 510]
---

# ZIP-502: Wildlife Corridor Mapping

## Abstract

This proposal defines a blockchain-verified data standard for recording, sharing, and validating wildlife corridor geospatial data. Wildlife corridors -- the routes animals use to move between habitat patches -- are critical for species survival but poorly mapped. This standard specifies a schema for corridor data that combines GPS tracking, satellite imagery, camera trap sightings, and community observations into a unified, content-addressed dataset. Each corridor record is anchored on-chain with its data hash, contributor attribution, and validation status. Multi-source validation requires agreement from at least two independent data sources before a corridor is marked as verified.

## Motivation

Wildlife corridors are among the most important and least documented features of global ecosystems:

1. **Fragmentation crisis**: 70% of remaining wildlife habitat is within 1km of a human-modified edge. Corridors connecting fragments are the lifeline for genetic exchange and population viability.
2. **Data scarcity**: Most corridor data exists in isolated research databases, unpublished field notes, or indigenous community knowledge. There is no global, open, interoperable corridor dataset.
3. **Development conflict**: Infrastructure projects (roads, pipelines, fences) routinely sever corridors because the corridors are not mapped in planning databases. Verified corridor data in an open registry can inform land-use decisions.
4. **Climate adaptation**: As climate shifts habitat suitability, animals must move to survive. Mapping current corridors is essential for predicting and protecting future movement routes.

## Specification

### 1. Corridor Data Schema

```typescript
interface CorridorRecord {
  corridorId: string;               // Deterministic hash of core data
  name: string;                     // Human-readable corridor name
  species: string[];                // Species using this corridor
  geometry: CorridorGeometry;
  dataSources: DataSource[];
  validationStatus: ValidationStatus;
  metadata: CorridorMetadata;
  onChainAnchor: {
    txHash: string;
    dataHash: string;               // SHA-256 of serialized record
    blockNumber: number;
    timestamp: number;
  };
}

interface CorridorGeometry {
  type: "LineString" | "Polygon";   // GeoJSON geometry type
  coordinates: number[][];          // [lng, lat, elevation?]
  widthMeters: number;              // Average corridor width
  lengthKm: number;
  connectedHabitats: [string, string];  // Habitat patch IDs
  terrainProfile: TerrainPoint[];
}

interface DataSource {
  sourceType: "gps_tracking" | "satellite_imagery" | "camera_trap"
             | "acoustic_sensor" | "community_observation" | "literature";
  sourceId: string;
  contributor: string;              // Lux ID of data contributor
  collectionDate: string;
  sampleSize: number;               // Number of observations
  methodology: string;
  dataHash: string;                 // Hash of raw source data
  ipfsCid: string;                  // Raw data on IPFS
}

type ValidationStatus = "unverified" | "single_source" | "multi_source_verified"
                       | "field_verified" | "disputed";
```

### 2. Multi-Source Validation

A corridor reaches "multi_source_verified" status when:

```
Rule 1: At least 2 independent data sources confirm the corridor.
Rule 2: Sources must use different methodologies (e.g., GPS + camera trap).
Rule 3: Spatial overlap between sources >= 60% of corridor length.
Rule 4: Temporal relevance: at least 1 source from the last 3 years.
```

Field verification upgrades status further when a qualified ecologist physically surveys the corridor and submits a signed attestation.

### 3. On-Chain Registry

```solidity
contract CorridorRegistry {
    struct Corridor {
        bytes32 corridorId;
        bytes32 dataHash;
        uint8 sourceCount;
        uint8 validationStatus;     // 0-4 matching enum
        address submitter;
        uint64 createdAt;
        uint64 lastUpdated;
        string metadataUri;         // IPFS CID
    }

    mapping(bytes32 => Corridor) public corridors;

    event CorridorRegistered(bytes32 indexed corridorId, bytes32 dataHash);
    event CorridorValidated(bytes32 indexed corridorId, uint8 newStatus);

    function registerCorridor(
        bytes32 corridorId,
        bytes32 dataHash,
        string calldata metadataUri
    ) external {
        require(corridors[corridorId].createdAt == 0, "Already exists");
        corridors[corridorId] = Corridor({
            corridorId: corridorId,
            dataHash: dataHash,
            sourceCount: 1,
            validationStatus: 1,    // single_source
            submitter: msg.sender,
            createdAt: uint64(block.timestamp),
            lastUpdated: uint64(block.timestamp),
            metadataUri: metadataUri
        });
        emit CorridorRegistered(corridorId, dataHash);
    }

    function addValidation(
        bytes32 corridorId,
        bytes32 sourceHash,
        bytes calldata proof
    ) external {
        require(corridors[corridorId].createdAt > 0, "Not found");
        require(verifySourceProof(corridorId, sourceHash, proof), "Invalid");
        corridors[corridorId].sourceCount++;
        if (corridors[corridorId].sourceCount >= 2) {
            corridors[corridorId].validationStatus = 2;
            emit CorridorValidated(corridorId, 2);
        }
        corridors[corridorId].lastUpdated = uint64(block.timestamp);
    }
}
```

### 4. Integration Points

- **ZIP-405 MigrationAgent**: Corridor data feeds migration pattern analysis.
- **ZIP-501 Impact Measurement**: Corridor connectivity metrics contribute to conservation impact scores.
- **ZIP-300 Virtual Habitats**: Verified corridors are rendered in virtual habitat simulations.
- **External**: Data is exportable as GeoJSON for use in QGIS, Google Earth Engine, and land-use planning tools.

## Rationale

- **Multi-source validation**: Single-source corridor data has high false-positive rates. GPS tracks from one animal may represent individual behavior, not a population-level corridor. Requiring independent confirmation filters noise.
- **On-chain anchoring over centralized database**: Corridor data is politically sensitive (it can block development projects). Immutable on-chain records prevent data suppression.
- **GeoJSON compatibility**: GeoJSON is the universal standard for geospatial data interchange. Native compatibility ensures corridor data is immediately usable in existing conservation GIS tools.
- **Content-addressed storage**: Storing raw data on IPFS with on-chain hash verification ensures data integrity without storing large geospatial datasets on-chain.

## Security Considerations

1. **Location sensitivity**: Corridor data for critically endangered species could be used by poachers to set traps along known routes. Mitigation: species with IUCN status >= "Endangered" have coordinates obfuscated in public queries per ZIP-510; full-resolution data requires authorized access.
2. **Data poisoning**: False corridor data could divert conservation resources. Mitigation: multi-source validation requires independent confirmation; disputed corridors are flagged and excluded from impact calculations until resolved.
3. **Political manipulation**: Actors with development interests could submit false data disputing legitimate corridors. Mitigation: dispute resolution requires field verification by a qualified ecologist; disputants must stake ZOO tokens that are slashed for frivolous disputes.
4. **Contributor privacy**: Contributors (especially indigenous communities) may not want their identity linked to corridor data. Mitigation: contributors can use pseudonymous Lux IDs; attribution is optional.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
3. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
4. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
5. Hilty, J. et al. "Guidelines for Conserving Connectivity through Ecological Networks and Corridors." IUCN 2020.
6. Brennan, A. et al. "Towards Global Connectivity Maps." Conservation Biology 36(4), 2022.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
