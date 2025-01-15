---
zip: 107
title: "Impact Lending Protocol"
description: "Lending and borrowing protocol with conservation collateral discounts and impact-weighted interest rates"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [lending, borrowing, defi, conservation, collateral]
requires: [0, 100, 101]
---

# ZIP-107: Impact Lending Protocol

## Abstract

This ZIP defines an overcollateralized lending protocol where borrowers who post conservation-linked collateral (conservation bonds, impact attestations, carbon credits) receive reduced collateral requirements and preferential interest rates. The protocol uses a dual-rate model: a base rate determined by utilization and an impact discount proportional to the verified conservation value of the borrower's collateral portfolio. Lenders earn yield from borrower interest, with a protocol-level conservation reserve funded by a fraction of liquidation penalties.

## Motivation

Traditional DeFi lending treats all collateral as purely financial. The Zoo ecosystem holds substantial conservation-linked value in the form of ZIP-101 bonds, ZIP-102 vault shares, ZIP-105 carbon credits, and ZRC-721 wildlife NFTs. A lending protocol that recognizes this value creates a positive feedback loop:

1. **Conservation premium**: Users are incentivized to hold conservation assets because they unlock cheaper borrowing, increasing demand for impact tokens.
2. **Capital efficiency**: Conservation bond holders can borrow against their locked principal without breaking the bond term, improving capital efficiency.
3. **Liquidation buffer**: Conservation assets tend to have lower volatility than speculative tokens, reducing systemic liquidation risk.
4. **Treasury growth**: The conservation reserve accumulates from liquidation events, providing countercyclical funding during market downturns when conservation programs need it most.

## Specification

### 1. Collateral Tiers

| Tier | Assets | Base LTV | Impact Discount | Max LTV |
|------|--------|----------|-----------------|---------|
| Standard | ZOO, ZUSD, WZOO | 75% | 0% | 75% |
| Conservation | ZIP-101 bonds, ZIP-102 vault shares | 75% | +5% | 80% |
| Carbon | ZIP-105 carbon credits | 70% | +7% | 77% |
| Wildlife NFT | ZRC-721 (floor price oracle) | 50% | +5% | 55% |

Impact discount is applied additively to the base loan-to-value ratio for verified conservation collateral.

### 2. Interest Rate Model

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

contract ImpactInterestModel {
    uint256 public constant BASE_RATE = 2e16;        // 2% base annual rate
    uint256 public constant SLOPE_1 = 4e16;           // 4% slope below kink
    uint256 public constant SLOPE_2 = 75e16;          // 75% slope above kink
    uint256 public constant KINK = 80e16;             // 80% utilization kink
    uint256 public constant MAX_IMPACT_DISCOUNT = 30; // 30% max rate reduction

    function getBorrowRate(
        uint256 utilization,
        uint256 impactScore       // 0-100, based on conservation collateral %
    ) external pure returns (uint256 rate) {
        if (utilization <= KINK) {
            rate = BASE_RATE + (SLOPE_1 * utilization) / 1e18;
        } else {
            rate = BASE_RATE + (SLOPE_1 * KINK) / 1e18
                 + (SLOPE_2 * (utilization - KINK)) / 1e18;
        }

        // Apply impact discount
        uint256 discount = (rate * impactScore * MAX_IMPACT_DISCOUNT) / (100 * 100);
        rate = rate - discount;
    }
}
```

### 3. Core Lending Pool

```solidity
contract ImpactLendingPool {
    struct Market {
        address asset;
        uint256 totalDeposits;
        uint256 totalBorrows;
        uint256 reserveFactor;          // Fraction to protocol reserve
        uint256 conservationReserveBps; // Fraction of reserve to conservation
        address conservationDAO;
    }

    struct Position {
        mapping(address => uint256) collateral;
        uint256 borrowed;
        uint256 impactScore;
    }

    mapping(address => Market) public markets;
    mapping(address => Position) public positions;

    event Borrowed(address indexed user, uint256 amount, uint256 impactScore, uint256 rate);
    event ConservationReserveFunded(address indexed dao, uint256 amount);

    function deposit(address asset, uint256 amount) external {
        // Standard deposit into lending pool
        markets[asset].totalDeposits += amount;
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
    }

    function borrow(address asset, uint256 amount) external {
        Position storage pos = positions[msg.sender];
        uint256 impactScore = _calculateImpactScore(msg.sender);
        pos.impactScore = impactScore;

        uint256 maxBorrow = _maxBorrowable(msg.sender, impactScore);
        require(pos.borrowed + amount <= maxBorrow, "EXCEEDS_LTV");

        pos.borrowed += amount;
        markets[asset].totalBorrows += amount;
        IERC20(asset).transfer(msg.sender, amount);

        emit Borrowed(msg.sender, amount, impactScore, _currentRate(asset, impactScore));
    }

    function _calculateImpactScore(address user) internal view returns (uint256) {
        // Score 0-100 based on fraction of collateral that is conservation-linked
        // Conservation bonds, carbon credits, and wildlife NFTs contribute
        // Score = (conservation_collateral_value / total_collateral_value) * 100
        return 0; // Placeholder
    }
}
```

### 4. Liquidation and Conservation Reserve

When a position is liquidated:
1. Liquidator receives collateral at a discount (standard 5% bonus).
2. A liquidation penalty (3% of collateral) is split:
   - 60% to the lending pool reserve (protocol solvency).
   - 40% to the conservation reserve, forwarded to the pool's `conservationDAO`.

This ensures conservation funding is countercyclical -- liquidation events that typically signal market stress also generate conservation capital.

### 5. Oracle Requirements

| Collateral Type | Oracle Source | Update Frequency |
|----------------|--------------|------------------|
| ZOO, ZUSD | Zoo AMM TWAP (ZIP-106) | Every block |
| Conservation bonds | Bond face value + accrued yield | Hourly |
| Carbon credits | ZIP-105 DEX TWAP | Every block |
| ZRC-721 NFTs | Floor price oracle (ZIP-200) | 15 minutes |

## Rationale

**Why impact-weighted rates?** Flat rates ignore the risk-reduction and positive externality of conservation collateral. Impact weighting creates a market signal that conservation assets are systemically valuable, not just speculative.

**Why a 30% maximum discount?** The cap prevents over-subsidization. Even with maximum conservation collateral, borrowers still pay meaningful interest to compensate lenders.

**Why countercyclical conservation funding?** Market downturns are precisely when conservation programs face funding cuts. Drawing from liquidation penalties provides automatic stabilization.

## Security Considerations

### Bad Debt
Conservation collateral with illiquid secondary markets (NFTs, long-term bonds) may be difficult to liquidate. The protocol should maintain a buffer reserve and restrict NFT collateral to pools with sufficient liquidity depth.

### Impact Score Manipulation
The impact score is computed from on-chain collateral composition. Flash-loan attacks that temporarily inflate conservation collateral are mitigated by requiring collateral to be deposited for a minimum duration (1 epoch / 7 days) before impacting the score.

### Oracle Failure
If any oracle feed fails, the affected collateral type is automatically assigned LTV = 0 until the oracle resumes, preventing borrowing against stale prices.

### Cascading Liquidations
A sharp decline in conservation asset prices could trigger cascading liquidations. Circuit breakers pause liquidations if more than 20% of total collateral is liquidated within a single epoch.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-105: Carbon Credit DEX](./zip-0105-carbon-credit-dex.md)
5. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
6. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
7. [Compound Finance Whitepaper](https://compound.finance/documents/Compound.Whitepaper.pdf)
8. [Aave V3 Technical Paper](https://github.com/aave/aave-v3-core)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
