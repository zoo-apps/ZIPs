---
zip: 109
title: "Wildlife Insurance Protocol"
description: "Parametric insurance protocol for conservation projects triggered by verifiable environmental data"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [insurance, parametric, conservation, oracle, wildlife]
requires: [0, 100, 501]
---

# ZIP-109: Wildlife Insurance Protocol

## Abstract

This ZIP specifies a parametric insurance protocol that provides financial protection to conservation projects against adverse environmental events. Unlike traditional insurance that requires claims adjustment, parametric policies pay out automatically when pre-defined trigger conditions are met, as verified by on-chain oracles. Triggers include deforestation rate thresholds, temperature anomalies, poaching incident counts, and wildlife population declines detected by the Zoo AI species detection pipeline (ZIP-401). Premium pools are funded by conservation DAOs, philanthropic capital, and DeFi yield from the Zoo ecosystem.

## Motivation

Conservation projects face catastrophic risks -- wildfires, floods, disease outbreaks, sudden habitat loss -- with no access to affordable insurance. Traditional insurers lack data models for environmental risk, and claim processes take months:

1. **Speed**: Parametric payouts execute within hours of trigger detection, providing emergency funding when it matters most.
2. **Objectivity**: Oracle-verified triggers eliminate subjective claim disputes.
3. **Accessibility**: DeFi-native underwriting pools accept capital from anyone, democratizing risk sharing beyond traditional reinsurers.
4. **Data-driven**: Zoo's AI pipelines (ZIP-401, ZIP-403) provide real-time environmental monitoring data that can serve as oracle inputs.

## Specification

### 1. Policy Structure

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

contract WildlifeInsurancePool {
    enum TriggerType {
        DeforestationRate,   // Hectares lost per period
        TemperatureAnomaly,  // Degrees above baseline
        PoachingIncidents,   // Count per period
        PopulationDecline,   // Percentage below baseline
        WildfireArea,        // Hectares burned
        FloodLevel           // Water level above threshold
    }

    struct Policy {
        address beneficiary;         // Conservation project
        TriggerType triggerType;
        int256 triggerThreshold;     // Value that activates payout
        uint256 coverageAmount;      // Maximum payout in ZUSD
        uint256 premiumRate;         // Annual premium as bps of coverage
        uint256 startTime;
        uint256 endTime;
        string region;               // Geographic identifier
        string speciesTag;           // Target species (optional)
        bool active;
        bool triggered;
    }

    struct OracleReport {
        TriggerType triggerType;
        int256 observedValue;
        uint256 timestamp;
        string dataSource;
        bytes signature;
    }

    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;
    uint256 public totalCoverage;
    uint256 public totalPremiums;
    uint256 public totalPayouts;

    event PolicyCreated(uint256 indexed policyId, address indexed beneficiary, uint256 coverage);
    event PolicyTriggered(uint256 indexed policyId, int256 observedValue, uint256 payout);
    event PremiumPaid(uint256 indexed policyId, uint256 amount);
}
```

### 2. Underwriting Pool

Capital providers deposit ZUSD into underwriting pools segmented by risk category:

| Pool | Risk Category | Target APY | Max Leverage |
|------|--------------|------------|--------------|
| Low | Temperature, flood | 4-6% | 5x |
| Medium | Deforestation, wildfire | 8-12% | 3x |
| High | Poaching, population decline | 15-25% | 2x |

Leverage ratio = total coverage / pool capital. Pools cannot issue new policies if leverage would exceed the maximum.

### 3. Oracle Network

Trigger verification requires a 3-of-5 oracle consensus from approved data providers:

| Data Source | Trigger Types | Update Frequency |
|-------------|---------------|------------------|
| Zoo AI Pipeline (ZIP-401) | Population decline, poaching | Daily |
| Global Forest Watch API | Deforestation | Weekly |
| NOAA/Copernicus | Temperature, flood | Hourly |
| NASA FIRMS | Wildfire area | 6 hours |
| Ground sensor network | All (where deployed) | Real-time |

### 4. Payout Mechanism

When oracle consensus confirms a trigger:

```
Oracle report submitted
  -> 3-of-5 consensus verified
  -> Policy.triggered = true
  -> Payout = min(coverageAmount, poolBalance * policyShare)
  -> ZUSD transferred to beneficiary
  -> Event emitted for audit trail
```

Payouts are proportional if the pool is underfunded (multiple simultaneous triggers). Pro-rata distribution ensures no single policy drains the entire pool.

### 5. Premium Calculation

Premiums are calculated using a simplified actuarial model:

```
annualPremium = coverageAmount * basePremiumRate * riskMultiplier * regionFactor
```

Where:
- `basePremiumRate`: Set per trigger type (200-800 bps).
- `riskMultiplier`: Historical frequency of trigger events (1.0-3.0).
- `regionFactor`: Geographic risk weighting (0.5-2.0).

Premiums are paid monthly from the beneficiary's account or from DAO treasury allocations.

### 6. Governance Parameters

| Parameter | Value | Changed By |
|-----------|-------|------------|
| Oracle quorum | 3 of 5 | ZooGovernor |
| Maximum leverage per pool | 2x-5x by risk tier | ZooGovernor |
| Premium rate bounds | 200-800 bps | ZooGovernor |
| Minimum policy term | 90 days | ZooGovernor |
| Maximum policy term | 1095 days (3 years) | ZooGovernor |

## Rationale

**Why parametric over indemnity?** Indemnity insurance requires on-ground loss assessment, which is impractical for remote conservation sites. Parametric triggers are objectively measurable from satellite and sensor data, enabling automated payouts.

**Why risk-tiered pools?** Different environmental risks have vastly different probability distributions. Tiered pools allow capital providers to choose their risk-return profile, attracting deeper liquidity than a single undifferentiated pool.

**Why Zoo AI as an oracle source?** The Zoo AI species detection pipeline (ZIP-401) already monitors wildlife populations for conservation purposes. Repurposing this data for insurance triggers creates a natural synergy and reduces oracle cost.

## Security Considerations

### Oracle Manipulation
A compromised oracle could trigger false payouts. The 3-of-5 quorum with diverse data sources (satellite, AI, ground sensors) reduces this risk. A 48-hour challenge period after trigger detection allows community dispute before payout execution.

### Pool Insolvency
Correlated events (e.g., widespread wildfire season) could trigger multiple policies simultaneously. Maximum leverage ratios and pro-rata payout distribution prevent complete pool drain. The protocol maintains a 10% reserve buffer inaccessible to payouts.

### Adverse Selection
Beneficiaries with private information about imminent risks could purchase large policies. Minimum 30-day waiting period after policy creation before trigger activation mitigates this.

### Data Latency
Environmental data may have delays. The protocol uses the oracle report timestamp, not the on-chain submission time, for trigger evaluation. Policies include a `reportingWindow` parameter to define acceptable data freshness.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
4. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
5. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
6. [Global Forest Watch](https://www.globalforestwatch.org/)
7. [NASA FIRMS Fire Information](https://firms.modaps.eosdis.nasa.gov/)
8. Clement et al., "Parametric Insurance for Climate Resilience," World Bank, 2021

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
