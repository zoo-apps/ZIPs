---
zip: 102
title: "Impact Yield Vaults"
description: "Yield vaults where profits are directed to conservation DAOs"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [vaults, yield, conservation, erc4626, dao]
requires: [0, 100, 101]
---

# ZIP-102: Impact Yield Vaults

## Abstract

This ZIP defines Impact Yield Vaults -- LP-5626 (ERC-4626) compliant tokenized vaults that split generated yield between depositors and conservation DAOs according to a configurable impact ratio. Unlike ZIP-101 conservation bonds where 100% of yield goes to conservation, Impact Yield Vaults allow depositors to earn competitive returns while automatically directing a portion of profits to wildlife protection and DeSci research. The vault architecture supports multiple yield strategies (lending, LP fees, staking rewards) and integrates with the Zoo DEX infrastructure on chain 200200.

## Motivation

Pure philanthropy (ZIP-101 bonds) attracts mission-driven capital but cannot compete with yield-maximizing DeFi for total capital deployed. The majority of DeFi liquidity is profit-seeking. Impact Yield Vaults capture this liquidity by offering market-competitive returns with an embedded conservation contribution.

Key problems addressed:

1. **DeFi liquidity is conservation-neutral**: Billions in DeFi TVL generate zero conservation impact. A 10-20% yield redirect from even a fraction of DeFi TVL would exceed most conservation grant programs.
2. **Impact investing lacks DeFi composability**: Traditional ESG funds are illiquid, opaque, and have high minimums. LP-5626 vaults are composable primitives usable across the Zoo DeFi stack.
3. **Conservation DAOs need sustainable funding**: One-time donations are unpredictable. Continuous yield streams from locked vault TVL provide baseline operational funding.
4. **Depositor alignment**: Many DeFi participants would accept modestly lower yields if the difference funded verifiable conservation outcomes.

This proposal references LP-5626 (tokenized vault standard), LP-9000 (DEX specifications), and LP-9018 (liquidity mining) for underlying yield strategies.

## Specification

### 1. Vault Architecture

```
                      ┌─────────────────────────┐
  Depositor ──────────│   ImpactYieldVault      │
  (deposit ZUSD)      │   (LP-5626 compliant)   │
                      │                         │
                      │  ┌───────────────────┐  │
                      │  │  Strategy Manager  │  │
                      │  │  (yield farming)   │  │
                      │  └────────┬──────────┘  │
                      │           │              │
                      │     Yield Split          │
                      │    ┌──────┴──────┐       │
                      │    │             │       │
                      │  Depositor   Conservation│
                      │  (80-90%)    DAO (10-20%)│
                      └─────────────────────────┘
```

### 2. Core Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

interface IImpactYieldVault {
    /// @notice Impact ratio in basis points (e.g., 1000 = 10%)
    function impactRatioBps() external view returns (uint16);

    /// @notice Conservation DAO receiving yield
    function conservationDAO() external view returns (address);

    /// @notice Total yield directed to conservation since inception
    function totalConservationYield() external view returns (uint256);

    /// @notice Total yield earned by depositors since inception
    function totalDepositorYield() external view returns (uint256);

    /// @notice Harvest yield from strategy and split
    function harvest() external returns (uint256 depositorShare, uint256 conservationShare);

    /// @notice Current pending unharvested yield
    function pendingYield() external view returns (uint256);

    event YieldSplit(
        uint256 totalYield,
        uint256 depositorShare,
        uint256 conservationShare,
        address indexed conservationDAO
    );

    event ImpactRatioUpdated(uint16 oldRatio, uint16 newRatio);
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
}
```

### 3. ImpactYieldVault Implementation

```solidity
contract ImpactYieldVault is ERC4626, IImpactYieldVault {
    uint16  public impactRatioBps;      // Conservation share (basis points)
    address public conservationDAO;
    address public strategy;            // Yield strategy contract
    address public governance;          // ZooGovernor timelock

    uint256 public totalConservationYield;
    uint256 public totalDepositorYield;
    uint256 public lastHarvestTimestamp;

    uint256 private _lastTotalAssets;   // Snapshot for yield calculation

    uint16 public constant MIN_IMPACT_RATIO = 500;   // 5% minimum
    uint16 public constant MAX_IMPACT_RATIO = 5000;   // 50% maximum

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address conservationDAO_,
        uint16 impactRatioBps_,
        address strategy_,
        address governance_
    ) ERC4626(asset_) ERC20(name_, symbol_) {
        require(impactRatioBps_ >= MIN_IMPACT_RATIO, "RATIO_TOO_LOW");
        require(impactRatioBps_ <= MAX_IMPACT_RATIO, "RATIO_TOO_HIGH");
        conservationDAO = conservationDAO_;
        impactRatioBps = impactRatioBps_;
        strategy = strategy_;
        governance = governance_;
    }

    /// @notice Harvest yield and split between depositors and conservation
    function harvest() external returns (uint256 depositorShare, uint256 conservationShare) {
        uint256 currentTotal = totalAssets();
        uint256 yield_ = currentTotal > _lastTotalAssets
            ? currentTotal - _lastTotalAssets
            : 0;

        if (yield_ == 0) return (0, 0);

        conservationShare = (yield_ * impactRatioBps) / 10_000;
        depositorShare = yield_ - conservationShare;

        // Transfer conservation share to DAO
        if (conservationShare > 0) {
            IERC20(asset()).transfer(conservationDAO, conservationShare);
            totalConservationYield += conservationShare;
        }

        totalDepositorYield += depositorShare;
        _lastTotalAssets = totalAssets();
        lastHarvestTimestamp = block.timestamp;

        emit YieldSplit(yield_, depositorShare, conservationShare, conservationDAO);
    }

    function pendingYield() external view returns (uint256) {
        uint256 currentTotal = totalAssets();
        return currentTotal > _lastTotalAssets ? currentTotal - _lastTotalAssets : 0;
    }

    /// @notice Update impact ratio (governance only)
    function setImpactRatio(uint16 newRatio) external {
        require(msg.sender == governance, "NOT_GOVERNANCE");
        require(newRatio >= MIN_IMPACT_RATIO, "RATIO_TOO_LOW");
        require(newRatio <= MAX_IMPACT_RATIO, "RATIO_TOO_HIGH");
        emit ImpactRatioUpdated(impactRatioBps, newRatio);
        impactRatioBps = newRatio;
    }

    /// @notice Update yield strategy (governance only)
    function setStrategy(address newStrategy) external {
        require(msg.sender == governance, "NOT_GOVERNANCE");
        require(newStrategy != address(0), "ZERO_STRATEGY");
        emit StrategyUpdated(strategy, newStrategy);
        strategy = newStrategy;
    }
}
```

### 4. Yield Strategies

Each vault delegates asset deployment to a pluggable strategy contract.

#### 4.1 Strategy Interface

```solidity
interface IYieldStrategy {
    /// @notice Deploy assets into yield-generating positions
    function deploy(uint256 amount) external;

    /// @notice Withdraw assets from positions
    function withdraw(uint256 amount) external returns (uint256 actual);

    /// @notice Total assets managed by this strategy
    function totalDeployed() external view returns (uint256);

    /// @notice Estimated APY in basis points
    function estimatedAPY() external view returns (uint256);

    /// @notice Emergency withdraw all assets
    function emergencyWithdraw() external returns (uint256);
}
```

#### 4.2 Initial Strategies

| Strategy | Description | Source | Risk |
|----------|-------------|--------|------|
| **LendingStrategy** | Supply to Zoo lending markets | LP-9401 confidential lending | Low |
| **LPFeeStrategy** | Provide liquidity on Zoo DEX, earn swap fees | LP-9000 DEX | Medium |
| **StakingStrategy** | Stake WZOO/ZLUX for network rewards | Zoo staking contracts | Low |
| **HMMStrategy** | Deploy via Hamiltonian Market Maker | HIP-0008 | Medium |
| **CompoundStrategy** | Multi-strategy compounding | All above | Medium |

### 5. Vault Registry

A global registry tracks all Impact Yield Vaults for discoverability and governance.

```solidity
contract ImpactVaultRegistry {
    struct VaultInfo {
        address vault;
        address asset;
        uint16  impactRatioBps;
        string  speciesTag;       // Conservation focus
        uint256 totalTVL;
        bool    active;
    }

    mapping(address => VaultInfo) public vaults;
    address[] public allVaults;

    event VaultRegistered(address indexed vault, address asset, uint16 impactRatio);
    event VaultDeactivated(address indexed vault);

    function registerVault(address vault) external;
    function deactivateVault(address vault) external;
    function getActiveVaults() external view returns (address[] memory);
    function getTotalImpactTVL() external view returns (uint256);
}
```

### 6. Depositor Incentives

Beyond standard yield, depositors receive:

1. **KEEPER tokens**: Non-transferable governance weight per ZIP-0 section 12.2, proportional to deposit size and duration.
2. **Impact score**: On-chain reputation metric tracking cumulative conservation contribution.
3. **Boosted LP mining**: LP-9018 liquidity mining rewards boosted for Impact Yield Vault LP token holders.

### 7. Governance Parameters

| Parameter | Default | Range | Governor |
|-----------|---------|-------|----------|
| Impact ratio | 1000 (10%) | 500-5000 bps | ZooGovernor |
| Harvest cooldown | 1 hour | 0-24 hours | ZooGovernor |
| Strategy whitelist | -- | Audited only | ZooGovernor |
| Conservation DAO | -- | Registered DAOs | ZooGovernor |
| Emergency pause | false | true/false | Multisig (3/5) |

### 8. Accounting and Reporting

Each vault emits `YieldSplit` events enabling off-chain aggregation of:

- Total conservation funding per vault, per species tag, per time period.
- Depositor effective APY (net of conservation split).
- TVL trends and capital flow analysis.

Impact reports are published quarterly as IPFS-pinned JSON documents with hashes stored on-chain, per ZIP-501 measurement standards.

## Rationale

**Why LP-5626 (ERC-4626)?** The tokenized vault standard enables composability with the entire Zoo DeFi stack. Vault shares can be used as collateral in lending (LP-9401), traded on DEX (LP-9000), or staked in liquidity mining (LP-9018). This composability maximizes TVL, which maximizes conservation funding.

**Why a minimum 5% impact ratio?** Below 5%, the conservation contribution becomes negligible relative to gas costs and operational overhead. The minimum ensures every vault makes a meaningful impact.

**Why pluggable strategies?** Yield sources evolve. The strategy pattern allows governance to migrate capital to higher-yielding or lower-risk positions without requiring depositor action.

**Why not use ZIP-101 bonds instead?** Bonds require full yield commitment. Vaults attract profit-motivated capital by offering competitive (though slightly reduced) returns. The two instruments are complementary: bonds for impact-maximizers, vaults for yield-seekers with impact alignment.

## Security Considerations

### Strategy Risk
- Each strategy is an attack surface. Only governance-whitelisted, audited strategies may be deployed.
- Emergency withdrawal function allows multisig to pull all assets from a compromised strategy.

### Yield Manipulation
- An attacker could deposit large amounts, trigger harvest, then withdraw -- capturing yield that should have been split. Mitigation: yield is calculated on time-weighted average balances, and harvest has a cooldown period.

### Conservation DAO Compromise
- If a conservation DAO address is compromised, only future yield from that specific vault is at risk. Governance can update the DAO address. Past yield is already disbursed and spent.

### Flash Loan Attacks
- Deposit and immediate withdrawal in the same block could manipulate share pricing. Mitigation: standard ERC-4626 share inflation protection (virtual shares/assets) and per-block deposit limits.

### Regulatory
- Vault shares may constitute securities depending on jurisdiction. Zoo Labs Foundation operates vaults as a nonprofit charitable program. Depositors should consult local counsel. Structure follows ZIP-0 sections 10-14.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
5. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
6. [LP-5626: Tokenized Vault Standard](https://lps.lux.network/lp-5626)
7. [LP-9000: DEX Specifications](https://lps.lux.network/lp-9000)
8. [LP-9018: Liquidity Mining](https://lps.lux.network/lp-9018)
9. [LP-9401: Confidential Lending](https://lps.lux.network/lp-9401)
10. [HIP-0008: Hamiltonian Market Maker](https://hips.hanzo.ai/hip-0008)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
