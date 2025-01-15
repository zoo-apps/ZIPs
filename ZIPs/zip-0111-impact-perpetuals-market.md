---
zip: 111
title: "Impact Perpetuals Market"
description: "Perpetual futures on conservation outcome indices enabling hedging and speculation on environmental metrics"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [perpetuals, futures, defi, conservation, indices]
requires: [0, 100, 109, 501]
---

# ZIP-111: Impact Perpetuals Market

## Abstract

This ZIP specifies a perpetual futures exchange for conservation outcome indices. Traders can take long or short positions on standardized indices that track measurable conservation metrics: species population trends, deforestation rates, ocean health scores, and carbon sequestration rates. Perpetuals use a funding rate mechanism to keep the mark price aligned with the index value. A fraction of all trading fees is directed to the conservation programs whose outcomes the indices track, creating a direct financial link between market activity and conservation impact.

## Motivation

Conservation outcomes are not currently tradable, meaning:

1. **No hedging**: Conservation organizations cannot hedge against the risk of project failure. A perpetual on population indices would allow them to short their own index as a hedge.
2. **No price signal**: Markets aggregate information. A liquid conservation index market would surface the collective assessment of conservation project quality and trajectory.
3. **No incentive alignment**: Traders who profit from conservation improvement (long positions) have a natural interest in supporting the underlying programs.
4. **Revenue generation**: Trading fees on conservation perpetuals provide a novel, sustainable funding stream that scales with market activity.

## Specification

### 1. Conservation Indices

| Index | Components | Data Source | Update |
|-------|-----------|-------------|--------|
| ZOO-POP | Aggregate population index of 50 tracked species | ZIP-401 AI pipeline | Daily |
| ZOO-FOREST | Global forest cover index (baseline 2020 = 1000) | Global Forest Watch | Weekly |
| ZOO-OCEAN | Composite ocean health (temperature, pH, biodiversity) | NOAA + Zoo sensors | Weekly |
| ZOO-CARBON | Net carbon sequestration rate (tCO2e/day) | ZIP-108 on-chain data | Daily |

Each index is normalized to a base value of 1000 at launch.

### 2. Perpetual Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

contract ImpactPerpetual {
    struct Position {
        int256 size;             // Positive = long, negative = short
        uint256 margin;          // Collateral in ZUSD
        uint256 entryPrice;      // Average entry index value
        uint256 lastFundingTime;
    }

    struct Market {
        bytes32 indexId;
        uint256 markPrice;
        uint256 indexPrice;
        int256 fundingRate;        // Hourly funding rate (scaled 1e18)
        uint256 openInterest;
        uint256 maxOpenInterest;
        uint16 conservationFeeBps; // Fraction of trading fees to conservation
        address conservationDAO;
    }

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => Position)) public positions;

    uint256 public totalConservationFees;

    event PositionOpened(bytes32 indexed indexId, address indexed trader, int256 size, uint256 margin);
    event PositionClosed(bytes32 indexed indexId, address indexed trader, int256 pnl);
    event FundingPaid(bytes32 indexed indexId, int256 fundingRate, uint256 timestamp);

    function openPosition(
        bytes32 indexId,
        int256 size,
        uint256 margin
    ) external {
        Market storage market = markets[indexId];
        require(market.openInterest + abs(size) <= market.maxOpenInterest, "OI_CAP");

        uint256 tradingFee = (abs(size) * market.markPrice * 5) / 1000000; // 5 bps
        uint256 conservationFee = (tradingFee * market.conservationFeeBps) / 10000;

        IERC20(zusd).transferFrom(msg.sender, address(this), margin + tradingFee);
        IERC20(zusd).transfer(market.conservationDAO, conservationFee);
        totalConservationFees += conservationFee;

        positions[indexId][msg.sender] = Position({
            size: size,
            margin: margin,
            entryPrice: market.markPrice,
            lastFundingTime: block.timestamp
        });

        market.openInterest += abs(size);
        emit PositionOpened(indexId, msg.sender, size, margin);
    }

    function abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }
}
```

### 3. Funding Rate Mechanism

The funding rate aligns mark price with the index value:

```
fundingRate = (markPrice - indexPrice) / indexPrice * fundingInterval
```

- If mark > index: longs pay shorts (market is overpriced).
- If mark < index: shorts pay longs (market is underpriced).
- Funding is settled every 8 hours.
- Maximum funding rate: +/- 0.1% per 8-hour period.

### 4. Oracle Requirements

| Index | Primary Oracle | Secondary Oracle | Dispute Window |
|-------|---------------|-----------------|----------------|
| ZOO-POP | Zoo AI (ZIP-401) | IUCN data feed | 24 hours |
| ZOO-FOREST | Global Forest Watch | Copernicus | 48 hours |
| ZOO-OCEAN | NOAA | Zoo marine sensors | 24 hours |
| ZOO-CARBON | ZIP-108 on-chain | Verra registry | 48 hours |

### 5. Risk Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Maximum leverage | 10x | ZooGovernor |
| Maintenance margin | 5% | ZooGovernor |
| Liquidation penalty | 2.5% | ZooGovernor |
| Insurance fund target | 5% of OI | ZooGovernor |
| Conservation fee share | 20% of trading fees | ZooGovernor |
| Position size limit | 10% of max OI per address | ZooGovernor |

### 6. Insurance Fund

An insurance fund absorbs negative PnL from bankrupt positions (liquidated below zero margin). Funded by:
- 50% of liquidation penalties.
- Overflow from trading fees above the conservation allocation.
- Direct contributions from the Zoo DAO treasury (ZIP-110).

## Rationale

**Why perpetuals over dated futures?** Perpetuals provide continuous exposure without roll costs, are simpler for retail participants, and maintain a single liquidity pool per index rather than fragmenting across expiry dates.

**Why conservation outcome indices?** Novel markets on novel underlyings attract speculative interest, which generates the trading volume and fees that fund conservation. Traditional crypto perpetuals on BTC/ETH do not serve this mission.

**Why 20% conservation fee share?** The fee is high enough to generate meaningful conservation funding but low enough to keep the exchange competitive. At 5 bps total fee and 20% conservation share, the effective conservation cost per trade is 1 bps -- negligible for most traders.

## Security Considerations

### Index Manipulation
Conservation indices are harder to manipulate than token prices because they track real-world metrics. However, an attacker who compromises the oracle could move the index and profit. The 24-48 hour dispute window allows community challenge before settlement.

### Cascading Liquidations
A sharp index movement could trigger cascading liquidations. The insurance fund and auto-deleveraging (ADL) mechanism cap the protocol's exposure. ADL reduces profitable counter-positions proportionally if the insurance fund is depleted.

### Moral Hazard
Short positions profit from conservation failure. This is an inherent property of any two-sided market. Mitigation: conservation fee routing ensures short traders still contribute to conservation funding with every trade.

### Low Liquidity
Niche indices may have thin order books. The protocol should bootstrap liquidity with DAO-funded market makers (ZIP-110 treasury strategies) and consider minimum liquidity thresholds before enabling leverage above 5x.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-109: Wildlife Insurance Protocol](./zip-0109-wildlife-insurance-protocol.md)
4. [ZIP-401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
5. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
6. [dYdX Protocol V4 Architecture](https://dydx.exchange/blog/v4-technical-architecture)
7. Shiller, R., "Macro Markets: Creating Institutions for Managing Society's Largest Economic Risks," 1993

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
