---
zip: 505
title: "Reforestation Verification"
description: "Satellite-verified on-chain protocol for tracking and validating reforestation project progress"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Wildlife
created: 2025-01-15
tags: [wildlife, reforestation, satellite, verification, carbon]
requires: [0, 500, 501, 520]
---

# ZIP-505: Reforestation Verification

## Abstract

This proposal defines a protocol for satellite-verified, on-chain tracking of reforestation project progress. Reforestation is a cornerstone of habitat restoration, carbon sequestration, and wildlife corridor creation, but verification of claims is notoriously unreliable. This standard uses multi-temporal satellite imagery analysis (NDVI, canopy cover, biomass estimation) combined with ground-truth sampling and community attestation to produce verifiable progress records anchored on-chain. Each reforestation project registers target metrics, and progress is measured against those targets at defined intervals. Milestone-based fund release (ZIP-501) is triggered by verified satellite data rather than self-reported project updates.

## Motivation

Reforestation is among the most funded conservation activities, yet verification is its weakest link:

1. **Greenwashing**: Organizations claim millions of trees planted with no independent verification. Studies show 20-40% of reforestation claims fail to produce surviving forests within 5 years.
2. **Survival rates**: Planting a seedling is not reforestation. A seedling that dies within a year has zero conservation value. Verification must track long-term survival and growth, not just planting events.
3. **Monoculture risk**: Planting rows of a single fast-growing species (e.g., eucalyptus) satisfies tree-count metrics but degrades biodiversity. Verification must assess species diversity and ecological function.
4. **Carbon credit integrity**: Reforestation carbon credits are only credible if backed by verified, ongoing forest growth. On-chain verification provides the auditability that carbon markets demand.
5. **Funder confidence**: Conservation donors and DAO treasuries (ZIP-104) need objective evidence that funds produce results. Satellite verification replaces trust with proof.

## Specification

### 1. Project Registration

```typescript
interface ReforestationProject {
  projectId: string;
  name: string;
  location: GeoPolygon;            // Project boundary
  areaHectares: number;
  startDate: string;
  targetMetrics: TargetMetrics;
  species: PlantingSpec[];
  methodology: string;             // e.g., "natural regeneration", "active planting"
  baselineData: BaselineAssessment;
  verificationSchedule: VerificationInterval[];
  fundingSource: string;           // ZIP-104 treasury or external
}

interface TargetMetrics {
  canopyCoverPercent: number;      // Target at maturity
  speciesDiversity: number;        // Shannon diversity index target
  biomassTonnesPerHa: number;      // Target above-ground biomass
  survivalRatePercent: number;     // Minimum acceptable survival
  timeToMaturityYears: number;     // Expected years to target
}

interface PlantingSpec {
  species: string;                 // Scientific name
  percentageOfTotal: number;
  nativeToRegion: boolean;
  ecologicalRole: string;          // Canopy, understory, pioneer, etc.
}

interface BaselineAssessment {
  date: string;
  ndvi: number;                    // Normalized Difference Vegetation Index
  canopyCoverPercent: number;
  existingBiomass: number;
  soilCondition: string;
  satelliteImageCid: string;       // IPFS CID of baseline imagery
}
```

### 2. Satellite Verification

Progress is measured through automated satellite imagery analysis:

```typescript
interface SatelliteVerification {
  verificationId: string;
  projectId: string;
  date: string;
  satelliteSource: "sentinel-2" | "landsat-9" | "planet" | "maxar";
  resolution: number;              // Meters per pixel
  metrics: MeasuredMetrics;
  comparisonToBaseline: MetricDelta;
  comparisonToTarget: MetricProgress;
  imageCid: string;                // IPFS CID of analysis imagery
  analysisModelId: string;         // ZIP-406 attested analysis model
  confidence: number;
}

interface MeasuredMetrics {
  ndvi: number;
  canopyCoverPercent: number;
  estimatedBiomass: number;        // Tonnes per hectare
  greenAreaHectares: number;
  spectralnDiversityIndex: number; // Proxy for species diversity
}

interface MetricProgress {
  canopyCoverProgress: number;     // 0.0 - 1.0 (fraction of target)
  biomassProgress: number;
  overallProgress: number;         // Weighted composite
  onTrack: boolean;                // Meeting expected growth curve
}
```

Verification occurs at intervals defined in the project registration (typically quarterly for the first 2 years, then annually).

### 3. Ground-Truth Sampling

Satellite data is validated by periodic ground-truth surveys:

```typescript
interface GroundTruthSample {
  sampleId: string;
  projectId: string;
  date: string;
  surveyorId: string;             // Lux ID of field surveyor
  plotLocation: GeoPoint;
  plotSize: number;                // Square meters
  measurements: {
    treeCount: number;
    speciesList: string[];
    averageHeight: number;         // Meters
    averageDbh: number;            // Diameter at breast height, cm
    survivalRate: number;          // Proportion alive
    canopyClosure: number;         // 0.0 - 1.0
  };
  photos: string[];                // IPFS CIDs with GPS EXIF
  attestation: string;             // Surveyor signature
}
```

A minimum of 3 ground-truth plots per 100 hectares is required. Ground-truth data is compared against satellite estimates to calibrate remote sensing accuracy.

### 4. On-Chain Progress Registry

```solidity
contract ReforestationRegistry {
    struct ProgressRecord {
        bytes32 projectId;
        bytes32 verificationHash;
        uint16 progressBasisPoints;   // 0-10000 (0% - 100%)
        uint8 verificationType;       // 1=satellite, 2=ground, 3=both
        uint64 verificationDate;
        bool milestoneReached;
    }

    mapping(bytes32 => ProgressRecord[]) public progress;

    event ProgressRecorded(
        bytes32 indexed projectId,
        uint16 progressBasisPoints,
        uint64 verificationDate
    );

    event MilestoneReached(
        bytes32 indexed projectId,
        uint8 milestoneIndex,
        uint16 progressBasisPoints
    );

    function recordProgress(
        bytes32 projectId,
        bytes32 verificationHash,
        uint16 progressBasisPoints,
        uint8 verificationType
    ) external onlyVerifiedOracle {
        progress[projectId].push(ProgressRecord({
            projectId: projectId,
            verificationHash: verificationHash,
            progressBasisPoints: progressBasisPoints,
            verificationType: verificationType,
            verificationDate: uint64(block.timestamp),
            milestoneReached: checkMilestone(projectId, progressBasisPoints)
        }));
        emit ProgressRecorded(projectId, progressBasisPoints, uint64(block.timestamp));
    }
}
```

### 5. Milestone-Based Fund Release

Projects define milestones that trigger fund releases from conservation pools:

| Milestone | Trigger | Typical Fund Release |
|-----------|---------|---------------------|
| Planting complete | Ground survey confirms planting density | 25% |
| Year 1 survival | Satellite shows >= 80% canopy persistence | 25% |
| Year 3 growth | Biomass progress >= 40% of target | 25% |
| Year 5 maturity | Canopy cover and diversity targets met | 25% |

Funds are held in escrow (ZIP-101) and released automatically when the on-chain progress record confirms milestone achievement.

## Rationale

- **Satellite-first verification**: Satellite imagery is objective, repeatable, and scalable. It eliminates reliance on self-reporting and covers vast areas at low marginal cost. Ground-truth sampling calibrates but does not replace satellite data.
- **Multi-year tracking**: Reforestation value accrues over years, not at planting time. The 5-year verification timeline with milestone-based releases ensures projects are maintained, not abandoned after initial planting.
- **Spectral diversity as biodiversity proxy**: Direct species identification from satellite imagery is limited, but spectral diversity indices correlate with plant species diversity. This enables biodiversity monitoring at landscape scale.
- **NDVI as primary metric**: NDVI is the most widely used and validated vegetation index. It works across satellite platforms and has decades of calibration data.

## Security Considerations

1. **Imagery manipulation**: Satellite imagery could be doctored to show false progress. Mitigation: verification uses imagery from public satellite platforms (Sentinel-2, Landsat-9) with verifiable acquisition timestamps; analysis model is ZIP-406 attested.
2. **Boundary gaming**: A project could register a boundary that includes existing forest to inflate baseline metrics. Mitigation: baseline assessment uses historical imagery (5-year lookback) to detect pre-existing canopy.
3. **Monoculture evasion**: A project could plant monoculture and still achieve canopy cover targets. Mitigation: spectral diversity index must exceed minimum threshold; ground-truth sampling verifies species composition.
4. **Ground-truth collusion**: Surveyors could falsify ground-truth data. Mitigation: surveyors must be registered with verified credentials; photo evidence includes GPS EXIF and timestamps; random audits by independent surveyors.
5. **Cloud cover interference**: Persistent cloud cover in tropical regions can prevent satellite verification. Mitigation: verification windows extend by 30 days if cloud cover exceeds 80%; radar-based alternatives (Sentinel-1 SAR) provide cloud-penetrating backup.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
3. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
4. [ZIP-520: Habitat Conservation](./zip-0520-habitat-conservation.md)
5. Fagan, M.E. et al. "Mapping forest restoration with satellite remote sensing." Conservation Biology 36(1), 2022.
6. Chazdon, R.L. et al. "When is a forest a forest?" Forest Ecology and Management 297, 2013.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
