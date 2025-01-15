---
zip: 20
title: "Impact Metric Oracle"
description: "On-chain oracle system for measuring and verifying real-world conservation impact"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-01-15
tags: [oracle, conservation, impact, measurement]
---

# ZIP-0020: Impact Metric Oracle

## Abstract

This proposal defines an on-chain oracle system for ingesting, verifying, and publishing conservation impact metrics on Zoo Network. The oracle aggregates data from field sensors, satellite imagery, partner NGOs, and citizen science platforms, producing standardized impact scores that can be consumed by smart contracts for reward distribution, grant evaluation, and donor reporting.

## Motivation

Conservation funding is plagued by difficulty in measuring outcomes:

1. **Accountability**: Donors and governance need verifiable proof that funds create real impact
2. **Incentive alignment**: Impact-based reward distribution creates feedback loops that optimize for outcomes
3. **Grant evaluation**: On-chain impact data enables objective evaluation of grant-funded projects
4. **Regulatory compliance**: 501(c)(3) organizations must demonstrate charitable purpose; quantified impact satisfies this
5. **Composability**: Other protocols and DApps can build on standardized impact data

## Specification

### Oracle Architecture

```
┌─────────────────────────────────────────────────┐
│                Data Sources                      │
├──────────┬────────────┬────────────┬────────────┤
│ Satellite│ IoT Sensors│ NGO Reports│ Citizen Sci│
│ (MODIS,  │ (camera    │ (IUCN,     │ (iNaturali-│
│  Landsat)│  traps,    │  WWF,      │  st, eBird)│
│          │  acoustic) │  WCS)      │            │
└────┬─────┴─────┬──────┴──────┬─────┴──────┬─────┘
     └───────────┴──────┬──────┴────────────┘
                        ▼
              ┌─────────────────┐
              │  Oracle Network  │
              │  (5+ operators)  │
              ├─────────────────┤
              │  Aggregation    │
              │  Verification   │
              │  Consensus      │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  Zoo Network    │
              │  Impact Registry│
              └─────────────────┘
```

### Impact Metric Types

| Metric ID | Name | Unit | Source | Update Frequency |
|-----------|------|------|--------|-----------------|
| IMP-001 | Species Population | Count estimate | Camera traps, surveys | Monthly |
| IMP-002 | Habitat Area Protected | Hectares | Satellite imagery | Quarterly |
| IMP-003 | Deforestation Prevented | Hectares | MODIS/Landsat diff | Monthly |
| IMP-004 | Species Sightings | Count | Citizen science | Weekly |
| IMP-005 | Water Quality Index | 0-100 score | IoT sensors | Daily |
| IMP-006 | Carbon Sequestered | Tonnes CO2e | Remote sensing + models | Quarterly |
| IMP-007 | Anti-Poaching Patrols | Km covered | GPS trackers | Weekly |
| IMP-008 | Community Engagement | Participants | Platform analytics | Monthly |

### Oracle Operator Requirements

```yaml
operator:
  stake: 50000 ZOO          # Minimum stake to operate
  slashing:
    deviation_threshold: 20%  # Max deviation from median
    penalty: 10%              # Of staked amount
    cooldown: 30 days         # Before re-entry after slash
  rewards:
    per_report: 100 ZOO      # Per accepted data submission
    bonus_accuracy: 1.5x     # For consistently accurate reporters
  minimum_operators: 5        # Quorum for data acceptance
  consensus: median           # Aggregation method
```

### Impact Registry Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ImpactOracle {
    struct ImpactReport {
        bytes32 metricId;
        uint256 value;
        uint256 timestamp;
        bytes32 evidenceHash;  // IPFS hash of supporting data
        uint8 confidence;      // 0-100 confidence score
    }

    mapping(bytes32 => ImpactReport) public latestMetrics;
    mapping(bytes32 => ImpactReport[]) public metricHistory;

    event ImpactRecorded(
        bytes32 indexed metricId,
        uint256 value,
        uint8 confidence,
        bytes32 evidenceHash
    );

    function submitReport(
        bytes32 metricId,
        uint256 value,
        bytes32 evidenceHash,
        uint8 confidence
    ) external onlyOperator {
        // Aggregate with other operator submissions
        // Accept when quorum reached
    }

    function getImpactScore(bytes32 projectId) external view returns (uint256) {
        // Compute weighted composite score across all metrics for a project
    }
}
```

### Evidence Layer

All raw evidence is stored on IPFS/Arweave with content-addressed hashes recorded on-chain:

- **Satellite images**: GeoTIFF files with metadata
- **Sensor readings**: JSON time-series data
- **Survey reports**: PDF documents signed by field researchers
- **Photo evidence**: Geotagged camera trap images

### Composite Impact Score

Projects receive a composite score (0-1000) calculated as:

```
score = sum(metric_weight[i] * normalized_value[i] * confidence[i]) / sum(metric_weight[i])
```

Default weights: Species Population (30%), Habitat Protected (25%), Deforestation Prevented (20%), Community Engagement (15%), Carbon (10%).

## Rationale

A median-based consensus mechanism is chosen over mean to resist outlier manipulation. The 5-operator minimum quorum ensures sufficient redundancy while keeping operational costs manageable. Slashing for deviation exceeding 20% from median prevents lazy or malicious operators from corrupting data.

The evidence layer on IPFS provides verifiable proof while keeping on-chain storage costs minimal. Only hashes and aggregated metrics live on-chain; full data is retrievable off-chain.

## Security Considerations

- **Data manipulation**: Multiple independent operators with different data sources reduce the risk of coordinated manipulation
- **Stale data**: Metrics have defined update frequencies; consumers should check timestamps before relying on values
- **Sybil resistance**: Operator stake requirement (50,000 ZOO) makes Sybil attacks expensive
- **Oracle front-running**: Report submissions are committed in a commit-reveal scheme to prevent copying
- **Data source compromise**: If a primary data source is compromised, governance can update source weights and add alternative sources
- **Privacy**: GPS coordinates of endangered species are aggregated to grid cells (10km resolution) to prevent poaching

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0018: Treasury Management Protocol](./zip-0018-treasury-management-protocol.md)
- [ZIP-0501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [IUCN Red List API](https://apiv3.iucnredlist.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
