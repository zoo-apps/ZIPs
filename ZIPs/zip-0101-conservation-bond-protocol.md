---
zip: 101
title: "Conservation Bond Protocol"
description: "On-chain conservation bonds funding wildlife projects with yield from DeFi"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [conservation, bonds, defi, yield, wildlife]
requires: [0, 100]
---

# ZIP-101: Conservation Bond Protocol

## Abstract

This ZIP specifies an on-chain conservation bond protocol that channels yield from tokenized vault positions into wildlife conservation projects managed by the Zoo Labs Foundation. Conservation bonds are ERC-20 tokens representing a fixed-term capital commitment. Principal is deposited into LP-5626-compliant vaults, and the yield generated over the bond term is irrevocably directed to verified conservation outcomes. Bondholders receive their principal at maturity plus a non-transferable impact attestation (soulbound NFT). The protocol bridges traditional impact investing with DeFi composability on the Zoo L2 chain.

## Motivation

Wildlife conservation faces a persistent funding gap estimated at USD 598-824 billion annually (Paulson Institute, 2020). Traditional conservation bonds exist in TradFi markets but suffer from high issuance costs, low liquidity, opaque impact reporting, and minimum ticket sizes that exclude retail participants.

The Zoo ecosystem already deploys ERC-4626 tokenized vaults (ZooVault) and AMM infrastructure (Uniswap V2/V3 on Zoo chain 200200). By layering a bond abstraction on top of these yield sources, Zoo can:

1. **Democratize impact investing**: Bonds with no minimum deposit, instant settlement, and 24/7 liquidity before maturity via secondary markets.
2. **Guarantee conservation funding**: Yield is programmatically locked to conservation DAOs -- no intermediary can divert funds.
3. **Create verifiable impact**: On-chain attestations tied to ZIP-501 conservation impact measurement, auditable by anyone.
4. **Align DeFi incentives**: Liquidity providers earn yield AND generate conservation impact, attracting mission-aligned capital.

This proposal draws on LP-5626 (tokenized vault standard) for vault integration and HIP-0008 (Hamiltonian Market Maker) for yield optimization strategies.

## Specification

### 1. Bond Lifecycle

```
Issuance → Active (yield accruing) → Maturity → Redemption
   │                                       │
   └── Early Exit (secondary market) ──────┘
```

**States:**
- `ISSUED`: Bond minted, principal deposited into vault.
- `ACTIVE`: Yield accruing; yield harvested periodically to conservation fund.
- `MATURED`: Bond term expired; principal redeemable.
- `REDEEMED`: Principal returned to holder; impact attestation minted.

### 2. Core Contracts

#### 2.1 ConservationBondFactory

Deploys new bond series with configurable parameters.

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract ConservationBondFactory {
    struct BondParams {
        address vault;          // LP-5626 compliant vault
        uint256 termDays;       // Bond duration (e.g., 90, 180, 365)
        address conservationDAO; // Yield recipient
        uint256 minDeposit;     // Minimum deposit (can be 0)
        string  speciesTag;     // Conservation target identifier
    }

    event BondSeriesCreated(
        uint256 indexed seriesId,
        address bondToken,
        address vault,
        uint256 termDays
    );

    mapping(uint256 => address) public bondSeries;
    uint256 public nextSeriesId;

    function createSeries(BondParams calldata params)
        external
        returns (uint256 seriesId, address bondToken)
    {
        require(params.vault != address(0), "ZERO_VAULT");
        require(params.conservationDAO != address(0), "ZERO_DAO");
        require(params.termDays >= 7, "TERM_TOO_SHORT");

        seriesId = nextSeriesId++;
        bondToken = address(new ConservationBond(
            params.vault,
            params.termDays,
            params.conservationDAO,
            params.minDeposit,
            params.speciesTag,
            seriesId
        ));
        bondSeries[seriesId] = bondToken;
        emit BondSeriesCreated(seriesId, bondToken, params.vault, params.termDays);
    }
}
```

#### 2.2 ConservationBond (ERC-20)

Each bond series is an ERC-20 token. One bond token equals one unit of the vault's underlying asset deposited.

```solidity
contract ConservationBond is ERC20 {
    IERC4626 public immutable vault;
    uint256  public immutable termDays;
    address  public immutable conservationDAO;
    uint256  public immutable seriesId;
    string   public speciesTag;

    uint256 public totalPrincipal;       // Sum of all deposits
    uint256 public totalSharesMinted;    // Vault shares held
    uint256 public yieldHarvested;       // Cumulative yield sent to DAO
    uint256 public maturityTimestamp;     // Set on first deposit

    mapping(address => uint256) public depositTimestamp;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event YieldHarvested(uint256 amount, address indexed dao);
    event Redeemed(address indexed user, uint256 principal);

    function deposit(uint256 amount) external {
        require(amount >= minDeposit, "BELOW_MIN");
        require(block.timestamp < maturityTimestamp || maturityTimestamp == 0, "MATURED");

        if (maturityTimestamp == 0) {
            maturityTimestamp = block.timestamp + (termDays * 1 days);
        }

        IERC20(vault.asset()).transferFrom(msg.sender, address(this), amount);
        IERC20(vault.asset()).approve(address(vault), amount);
        uint256 shares = vault.deposit(amount, address(this));

        totalPrincipal += amount;
        totalSharesMinted += shares;
        depositTimestamp[msg.sender] = block.timestamp;

        _mint(msg.sender, amount);
        emit Deposited(msg.sender, amount, shares);
    }

    function harvestYield() external {
        uint256 totalAssets = vault.convertToAssets(totalSharesMinted);
        uint256 yield_ = totalAssets > totalPrincipal
            ? totalAssets - totalPrincipal
            : 0;

        if (yield_ > 0) {
            uint256 shares = vault.withdraw(yield_, conservationDAO, address(this));
            totalSharesMinted -= shares;
            yieldHarvested += yield_;
            emit YieldHarvested(yield_, conservationDAO);
        }
    }

    function redeem(uint256 bondAmount) external {
        require(block.timestamp >= maturityTimestamp, "NOT_MATURED");
        require(balanceOf(msg.sender) >= bondAmount, "INSUFFICIENT_BONDS");

        _burn(msg.sender, bondAmount);
        uint256 shares = vault.withdraw(bondAmount, msg.sender, address(this));
        totalPrincipal -= bondAmount;
        totalSharesMinted -= shares;

        // Mint soulbound impact attestation
        _mintImpactAttestation(msg.sender, bondAmount);
        emit Redeemed(msg.sender, bondAmount);
    }
}
```

#### 2.3 ImpactAttestation (Soulbound ERC-721)

Non-transferable NFT recording the holder's conservation contribution.

```solidity
contract ImpactAttestation is ERC721 {
    struct Attestation {
        uint256 seriesId;
        uint256 principal;
        uint256 yieldGenerated;
        string  speciesTag;
        uint256 termDays;
        uint256 maturityDate;
    }

    mapping(uint256 => Attestation) public attestations;

    // Override transfer to make soulbound
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0), "SOULBOUND"); // Only mint, no transfer
        return super._update(to, tokenId, auth);
    }
}
```

### 3. Yield Sources

Conservation bonds accept any LP-5626-compliant vault. Initial supported vaults:

| Vault | Underlying | Strategy | Expected APY |
|-------|-----------|----------|--------------|
| ZooVault-ZUSD | ZUSD | Lending + LP fees | 4-8% |
| ZooVault-WZOO | WZOO | Staking + governance rewards | 6-12% |
| ZooVault-ZLUX | ZLUX | Bridge fees + staking | 5-10% |

### 4. Conservation DAO Integration

Yield is sent to conservation DAOs registered in the ZIP-100 contract registry. Each DAO must:

1. Be registered via `DAOFactory.sol` (see ZIP-100).
2. Have an active conservation mandate aligned with ZIP-500 ESG principles.
3. Publish quarterly impact reports on-chain (IPFS hash stored in attestation contract).
4. Undergo annual audit by an independent verifier.

### 5. Secondary Market

Bond tokens are standard ERC-20 and trade on Zoo DEX infrastructure (Uniswap V2/V3 on chain 200200). Price will naturally discount or premium based on:

- Time to maturity
- Underlying vault yield rate
- Conservation project reputation

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum term | 7 days | ZooGovernor |
| Maximum term | 1825 days (5 years) | ZooGovernor |
| Harvest frequency | Callable anytime | Permissionless |
| Early exit penalty | None (sell on DEX) | N/A |
| Factory admin | ZooGovernor timelock | On-chain vote |

## Rationale

**Why ERC-4626 vaults?** LP-5626 provides a standardized interface for yield-bearing positions. This makes the bond protocol vault-agnostic -- any conforming vault can serve as a yield source, maximizing composability.

**Why soulbound attestations?** Impact attestations must be non-transferable to prevent impact-washing (buying attestations to claim conservation credit without actual capital commitment). This follows the KEEPER token precedent in ZIP-0 section 12.2.

**Why no early exit penalty?** Bond tokens trade freely on DEX. The market naturally prices in time-to-maturity discount, making explicit penalties unnecessary and improving capital efficiency.

**Why permissionless harvest?** Anyone can call `harvestYield()` to flush accrued yield to the conservation DAO. This eliminates reliance on keepers and ensures yield flows continuously.

## Security Considerations

### Smart Contract Risk
- Vault composability introduces dependency on underlying vault security. Only vaults that have passed audit may be whitelisted by ZooGovernor.
- Reentrancy: `deposit`, `harvestYield`, and `redeem` follow checks-effects-interactions pattern.

### Economic Risk
- **Impermanent loss**: Vaults using LP strategies may experience IL. Bond principal is denominated in the vault's underlying asset, not USD. Depositors bear asset-price risk.
- **Vault insolvency**: If a vault suffers exploit, bond principal may be lost. The factory should support circuit-breaker pause via ZooGovernor.

### Oracle Risk
- Yield calculation uses `vault.convertToAssets()` which is internal to the vault. No external oracle dependency.

### Governance Risk
- Conservation DAO addresses are set at series creation and are immutable for that series. A compromised DAO cannot retroactively redirect yield from other series.

### Regulatory Considerations
- Conservation bonds issued by Zoo Labs Foundation (501c3) for charitable purposes. Yield directed to conservation is a charitable grant, not investor return. Legal structure follows ZIP-0 sections 10-14 regarding nonprofit operations and UBIT considerations.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
4. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
5. [LP-5626: Tokenized Vault Standard](https://lps.lux.network/lp-5626)
6. [HIP-0008: Hamiltonian Market Maker](https://hips.hanzo.ai/hip-0008)
7. Paulson Institute, "Financing Nature: Closing the Global Biodiversity Financing Gap," 2020
8. [ERC-4626: Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
