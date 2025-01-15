---
zip: 110
title: "Conservation DAO Treasury Yield"
description: "Automated yield strategies for DAO treasury funds with mandatory conservation allocation floors"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [dao, treasury, yield, conservation, strategy]
requires: [0, 100, 101, 102, 104]
---

# ZIP-110: Conservation DAO Treasury Yield

## Abstract

This ZIP defines an automated treasury management protocol for Zoo conservation DAOs. The protocol deploys idle treasury capital across Zoo DeFi primitives -- yield vaults (ZIP-102), conservation bonds (ZIP-101), AMM liquidity (ZIP-106), and lending pools (ZIP-107) -- subject to risk constraints and a mandatory conservation allocation floor. A rules engine enforced on-chain ensures that at least a configurable percentage of treasury yield is directed to active conservation programs, while the remainder compounds to grow the treasury's capital base.

## Motivation

Zoo conservation DAOs (ZIP-104) hold treasuries denominated in ZOO, ZUSD, and other ecosystem tokens. These assets sit idle between grant disbursements, losing purchasing power to inflation:

1. **Capital preservation**: Yield strategies protect treasury purchasing power, ensuring conservation funding is not eroded over time.
2. **Sustainable funding**: Compounding treasury yield creates a self-sustaining endowment model where principal generates perpetual conservation funding.
3. **Risk management**: Automated diversification across multiple yield sources reduces concentration risk compared to manual treasury management.
4. **Accountability**: On-chain strategy execution with mandatory conservation floors provides transparent, auditable treasury governance.

## Specification

### 1. Treasury Vault Architecture

```
Treasury DAO
  |
  v
TreasuryManager (this contract)
  |
  ├── ConservationBondAllocator  (ZIP-101)
  ├── YieldVaultAllocator        (ZIP-102)
  ├── AMMliquidityAllocator      (ZIP-106)
  └── LendingPoolAllocator       (ZIP-107)
```

### 2. Core Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract TreasuryManager {
    struct Strategy {
        address target;           // Vault, bond, AMM, or lending pool
        uint16 allocationBps;     // Target allocation (bps of total)
        uint16 maxAllocationBps;  // Hard cap
        StrategyType strategyType;
        bool active;
    }

    enum StrategyType { YieldVault, ConservationBond, AMMLiquidity, LendingPool }

    struct TreasuryConfig {
        uint16 conservationFloorBps;  // Min % of yield to conservation (e.g., 3000 = 30%)
        uint16 rebalanceThresholdBps; // Rebalance when allocation drifts by this much
        uint256 rebalanceCooldown;    // Min seconds between rebalances
        address conservationDAO;      // Where conservation yield is sent
    }

    TreasuryConfig public config;
    Strategy[] public strategies;
    uint256 public lastRebalance;
    uint256 public totalConservationYield;

    event Rebalanced(uint256 timestamp, uint256[] allocations);
    event YieldHarvested(uint256 totalYield, uint256 conservationShare, uint256 compounded);
    event ConservationFloorEnforced(uint256 required, uint256 actual);

    function rebalance() external {
        require(
            block.timestamp >= lastRebalance + config.rebalanceCooldown,
            "COOLDOWN"
        );

        uint256 totalAssets = _totalManagedAssets();

        for (uint256 i = 0; i < strategies.length; i++) {
            if (!strategies[i].active) continue;

            uint256 targetAllocation = (totalAssets * strategies[i].allocationBps) / 10000;
            uint256 currentAllocation = _strategyBalance(i);

            if (currentAllocation < targetAllocation) {
                _deposit(i, targetAllocation - currentAllocation);
            } else if (currentAllocation > targetAllocation) {
                _withdraw(i, currentAllocation - targetAllocation);
            }
        }

        lastRebalance = block.timestamp;
    }

    function harvestYield() external {
        uint256 totalYield = _calculateAccruedYield();
        require(totalYield > 0, "NO_YIELD");

        uint256 conservationShare = (totalYield * config.conservationFloorBps) / 10000;
        uint256 compoundShare = totalYield - conservationShare;

        // Route conservation share
        _transferToConservation(conservationShare);
        totalConservationYield += conservationShare;

        // Compound remainder back into strategies
        _compoundYield(compoundShare);

        emit YieldHarvested(totalYield, conservationShare, compoundShare);
    }

    function _transferToConservation(uint256 amount) internal {
        // Transfer ZUSD to conservation DAO
        IERC20(zusd).transfer(config.conservationDAO, amount);
    }

    function _totalManagedAssets() internal view returns (uint256) { return 0; }
    function _strategyBalance(uint256 i) internal view returns (uint256) { return 0; }
    function _calculateAccruedYield() internal view returns (uint256) { return 0; }
    function _deposit(uint256 i, uint256 amount) internal {}
    function _withdraw(uint256 i, uint256 amount) internal {}
    function _compoundYield(uint256 amount) internal {}
}
```

### 3. Strategy Allocation Constraints

| Constraint | Value | Governance |
|------------|-------|------------|
| Conservation yield floor | 20-50% of yield | ZooGovernor |
| Max single strategy allocation | 40% of treasury | ZooGovernor |
| Min diversification (active strategies) | 3 | ZooGovernor |
| Rebalance cooldown | 24 hours | ZooGovernor |
| Drift threshold for rebalance | 500 bps | ZooGovernor |

### 4. Risk Framework

Each strategy is scored on three dimensions:

- **Smart contract risk** (1-5): Audit status, time in production, TVL.
- **Market risk** (1-5): Volatility of underlying assets, impermanent loss exposure.
- **Liquidity risk** (1-5): Time to withdraw without slippage.

The aggregate portfolio risk score must remain below a governance-set ceiling. Adding a high-risk strategy requires reducing allocation to other high-risk positions.

### 5. Reporting

The TreasuryManager emits comprehensive events for off-chain dashboards:
- Daily NAV snapshots.
- Per-strategy performance attribution.
- Conservation funding flow tracking.
- Risk score evolution.

## Rationale

**Why automated over manual?** DAO governance is slow. Automated rebalancing with pre-approved parameters executes in real-time while maintaining DAO oversight over the parameter space.

**Why a conservation yield floor?** Without an enforced floor, governance pressure to maximize returns could erode conservation funding. The floor makes conservation a protocol-level guarantee, not a discretionary decision.

**Why minimum 3 strategies?** Diversification is non-negotiable for treasury management. A single strategy failure should not threaten the treasury's conservation mandate.

## Security Considerations

### Strategy Exploit
If a downstream vault or pool is exploited, the treasury could lose the allocated capital. Maximum per-strategy allocation caps (40%) limit blast radius. Emergency withdrawal via ZooGovernor multisig can pull funds from a compromised strategy.

### Governance Capture
An attacker who captures ZooGovernor could lower the conservation floor to 0. A time-locked minimum (e.g., 15% floor that requires a 30-day timelock to change) provides a safety net.

### Rebalance Front-Running
Large rebalance transactions could be front-run on the AMM. Using private mempools or commit-reveal rebalancing mitigates this risk.

### Yield Calculation Manipulation
The `harvestYield` function depends on accurate yield accounting. Each strategy adapter must implement `accruedYield()` using the underlying protocol's native accounting (e.g., `vault.convertToAssets` for ERC-4626 vaults) rather than external price feeds.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
3. [ZIP-102: Impact Yield Vaults](./zip-0102-impact-yield-vaults.md)
4. [ZIP-104: Research Funding DAO Treasury](./zip-0104-research-funding-dao-treasury.md)
5. [ZIP-106: AMM for Conservation](./zip-0106-automated-market-maker-for-conservation.md)
6. [ZIP-107: Impact Lending Protocol](./zip-0107-impact-lending-protocol.md)
7. Yearn Finance, "Vault Strategies V3," 2023
8. [ERC-4626: Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
