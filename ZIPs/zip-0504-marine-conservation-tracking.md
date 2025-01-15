---
zip: 504
title: "Marine Conservation Tracking"
description: "IoT and blockchain integration standard for tracking and verifying marine species conservation data"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Wildlife
created: 2025-01-15
tags: [wildlife, marine, iot, tracking, ocean, conservation]
requires: [0, 500, 501, 502, 510]
---

# ZIP-504: Marine Conservation Tracking

## Abstract

This proposal defines a standard for integrating IoT sensor networks with blockchain verification for marine species conservation. Marine environments present unique challenges: vast areas, limited connectivity, harsh conditions, and three-dimensional movement patterns. The standard specifies data schemas for underwater acoustic tags, satellite-linked buoys, autonomous underwater vehicles (AUVs), and shore-based monitoring stations. Data from these sources is aggregated, validated through cross-sensor correlation, and anchored on-chain for impact verification. The protocol handles intermittent connectivity through store-and-forward mechanisms, ensuring data integrity even when sensors are offline for extended periods.

## Motivation

Marine ecosystems face accelerating threats (overfishing, ocean acidification, plastic pollution, shipping traffic) but receive a fraction of the monitoring investment that terrestrial ecosystems do:

1. **Coverage gap**: Less than 8% of the ocean is monitored for biodiversity. Marine corridors, spawning grounds, and feeding areas are largely unmapped for most species.
2. **Connectivity challenge**: Underwater sensors cannot transmit data in real time. Satellite uplinks from buoys are expensive and low-bandwidth. Conservation data often arrives weeks or months late.
3. **Verification difficulty**: Marine conservation claims (fish stock recovery, coral restoration, marine protected area effectiveness) are difficult to verify independently. On-chain anchoring of sensor data enables third-party verification.
4. **Cross-jurisdictional species**: Marine species cross national boundaries. A standardized, open data format enables international collaboration without trusting any single government's reporting.

## Specification

### 1. Sensor Data Schemas

```typescript
interface AcousticTagData {
  tagId: string;
  species: string;
  animalId: string;
  detections: AcousticDetection[];
}

interface AcousticDetection {
  receiverId: string;              // Hydrophone receiver ID
  timestamp: string;               // ISO 8601
  signalStrength: number;          // dB
  depth: number;                   // Meters
  temperature: number;             // Celsius (from tag sensor)
  location: GeoPoint;              // Receiver location
  estimatedAnimalPosition?: GeoPoint;  // Triangulated if 3+ receivers
}

interface BuoyTelemetry {
  buoyId: string;
  location: GeoPoint;
  timestamp: string;
  sensors: {
    waterTemperature: number;      // Celsius at surface
    salinity: number;              // PSU
    dissolvedOxygen: number;       // mg/L
    pH: number;
    chlorophyll: number;           // ug/L
    turbidity: number;             // NTU
    currentSpeed: number;          // m/s
    currentDirection: number;      // Degrees
  };
  biologicalDetections: {
    acousticSpeciesDetections: string[];  // Species identified by hydrophone
    surfaceSightings: string[];    // Visual species (camera-equipped buoys)
  };
}

interface AUVSurvey {
  vehicleId: string;
  missionId: string;
  startTime: string;
  endTime: string;
  trackline: GeoPoint[];           // [lng, lat, depth]
  observations: MarineObservation[];
  environmentalData: EnvironmentalSample[];
}

interface MarineObservation {
  timestamp: string;
  location: GeoPoint;
  depth: number;
  observationType: "species_sighting" | "habitat_assessment"
                  | "pollution_event" | "substrate_mapping";
  species?: string;
  count?: number;
  imageCid?: string;              // IPFS CID of underwater image
  confidence: number;
}
```

### 2. Store-and-Forward Protocol

Marine sensors operate with intermittent connectivity:

```
Phase 1: COLLECT
  Sensor collects data continuously.
  Data is timestamped, signed, and stored locally.
  Local storage: minimum 90 days at full sampling rate.

Phase 2: BUFFER
  When connectivity is unavailable, data accumulates in a
  signed buffer with sequential hashes:
  H(n) = hash(H(n-1) || data(n) || timestamp(n))

Phase 3: SYNC
  When connectivity is restored (satellite uplink, AUV retrieval,
  shore station proximity):
  - Transmit buffered data with hash chain
  - Receiving node verifies hash chain continuity
  - Gaps in the chain indicate data loss or tampering

Phase 4: ANCHOR
  Validated data is batched and anchored on-chain:
  - Daily Merkle roots for each sensor
  - Full data stored on IPFS
```

### 3. Cross-Sensor Validation

Marine data achieves higher trust through cross-sensor correlation:

| Validation Type | Sources Required | Trust Level |
|----------------|-----------------|-------------|
| Single sensor | 1 | Low |
| Temporal correlation | 2+ sensors, same time window | Medium |
| Spatial triangulation | 3+ receivers, position estimate | High |
| Multi-modal | Acoustic + visual + environmental | Verified |

### 4. On-Chain Registry

```solidity
contract MarineDataRegistry {
    struct DataAnchor {
        bytes32 sensorId;
        bytes32 dailyMerkleRoot;
        uint32 recordCount;
        uint64 dateStart;
        uint64 dateEnd;
        string ipfsCid;
        uint8 validationLevel;
        address submitter;
    }

    mapping(bytes32 => DataAnchor[]) public sensorData;

    function anchorDailyData(
        bytes32 sensorId,
        bytes32 merkleRoot,
        uint32 recordCount,
        uint64 dateStart,
        uint64 dateEnd,
        string calldata ipfsCid
    ) external onlyAuthorizedSubmitter {
        sensorData[sensorId].push(DataAnchor({
            sensorId: sensorId,
            dailyMerkleRoot: merkleRoot,
            recordCount: recordCount,
            dateStart: dateStart,
            dateEnd: dateEnd,
            ipfsCid: ipfsCid,
            validationLevel: 1,
            submitter: msg.sender
        }));
        emit DataAnchored(sensorId, merkleRoot, dateStart, dateEnd);
    }
}
```

### 5. Marine Protected Area Effectiveness

The standard includes metrics for evaluating marine protected area (MPA) effectiveness:

```typescript
interface MPAEffectivenessReport {
  mpaId: string;
  reportPeriod: { start: string; end: string };
  metrics: {
    speciesRichness: number;       // Count of detected species
    biomassIndex: number;          // Relative biomass estimate
    coralCoverPercent?: number;    // For reef MPAs
    illegalActivityDetections: number;
    complianceRate: number;        // 0.0 - 1.0
  };
  trend: "improving" | "stable" | "declining";
  dataSourceCount: number;
  onChainVerificationHash: string;
}
```

## Rationale

- **Store-and-forward with hash chains**: Marine sensors cannot guarantee continuous connectivity. Hash chains detect data gaps and tampering without requiring real-time anchoring. This is the only practical approach for deep-sea and remote pelagic monitoring.
- **Daily Merkle roots**: Anchoring individual sensor readings on-chain is prohibitively expensive. Daily Merkle roots provide a balance between verification granularity and cost. Any individual reading can be proven against the daily root.
- **Multi-modal validation**: Underwater conditions (murky water, ambient noise) degrade individual sensor accuracy. Cross-modal validation compensates for per-modality weaknesses.
- **MPA effectiveness metrics**: Conservation funders and policymakers need standardized metrics. This standard enables objective comparison across MPAs worldwide.

## Security Considerations

1. **Sensor compromise**: Physical access to underwater sensors is difficult to prevent. A compromised sensor could submit false data. Mitigation: hash chain continuity checks detect firmware replacement; cross-sensor validation catches outlier readings.
2. **Fishing vessel interference**: Commercial fishing interests may tamper with monitoring equipment in MPAs. Mitigation: tamper-detection hardware with alert capability; GPS tracking of sensor positions.
3. **Species location sensitivity**: Location data for endangered marine species (sea turtles, whale sharks) is valuable to illegal fisheries. Mitigation: ZIP-510 coordinate obfuscation applies; real-time position data is never publicly available.
4. **Data volume**: Marine sensors generate large datasets. Mitigation: on-chain storage is limited to Merkle roots; raw data is stored on IPFS with content addressing; archival tiers allow cold storage after 1 year.
5. **Jurisdictional conflicts**: Data collected in disputed waters could have legal implications. Mitigation: the protocol records raw coordinates without jurisdictional claims; governance is left to international agreements.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
3. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
4. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
5. Hussey, N.E. et al. "Aquatic animal telemetry: A panoramic window into the underwater world." Science 348(6240), 2015.
6. Jetz, W. et al. "Biological Earth observation with animal sensors." Trends in Ecology & Evolution 37(4), 2022.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
