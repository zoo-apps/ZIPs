---
zip: 105
title: "Carbon Credit DEX"
description: "Decentralized exchange for tokenized carbon credits with conservation-grade verification"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
originated: 2021-10
traces-from: "Whitepaper section 03 (Sustainability)"
follow-on: [zoo-carbon-credits]
created: 2025-01-15
tags: [carbon, dex, amm, climate, credits, trading]
requires: [0, 100]
---

# ZIP-105: Carbon Credit DEX

## Abstract

This ZIP specifies a decentralized exchange (DEX) optimized for trading tokenized carbon credits on the Zoo L2 chain. The exchange extends the LP-9000 DEX architecture with carbon-specific features: credit vintage tracking, retirement permanence, registry bridging, and a Hamiltonian Market Maker (HIP-0008) curve tuned for illiquid environmental assets. Tokenized credits from major registries (Verra VCS, Gold Standard, ACR, CAR) are bridged on-chain as ERC-1155 tokens with embedded metadata (vintage, methodology, project type, location). The DEX supports spot trading, batch auctions for large retirements, and a retirement burn mechanism that permanently removes credits from circulation while minting verifiable retirement certificates as soulbound NFTs.

## Motivation

The voluntary carbon market (VCM) reached USD 2 billion in 2023 but suffers from structural problems that blockchain can address:

1. **Fragmentation**: Credits from different registries are incompatible and trade on separate OTC desks. A unified on-chain DEX creates a single liquidity venue.
2. **Opacity**: OTC pricing is opaque. On-chain AMM provides transparent, continuous price discovery.
3. **Double-counting**: Credits can be sold multiple times across registries. On-chain tokenization with retirement burn eliminates double-counting.
4. **Illiquidity**: Many credit types are thinly traded. The Hamiltonian Market Maker (HIP-0008) provides liquidity for long-tail assets without requiring deep LP pools.
5. **Greenwashing**: Companies buy low-quality credits for marketing. On-chain quality scoring and transparent methodology metadata let buyers make informed choices.
6. **Conservation alignment**: Zoo Labs Foundation can integrate carbon market revenue with conservation funding (ZIP-101, ZIP-102, ZIP-104), creating a closed loop between carbon markets and biodiversity protection.

This proposal references LP-9000 (DEX specifications), LP-9400 (AMM with privacy), and HIP-0008 (Hamiltonian Market Maker).

## Specification

### 1. Carbon Credit Token Standard

Carbon credits are tokenized as ERC-1155 tokens with structured metadata.

#### 1.1 CarbonCredit (ERC-1155)

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract CarbonCredit is ERC1155 {
    struct CreditMetadata {
        string  registry;           // "verra", "gold-standard", "acr", "car"
        string  methodology;        // e.g., "VM0015" (avoided deforestation)
        string  projectId;          // Registry project identifier
        string  projectName;
        uint16  vintage;            // Year of emission reduction (e.g., 2024)
        string  country;            // ISO 3166-1 alpha-2
        string  projectType;        // "forestry", "renewable", "methane", etc.
        uint256 totalSupply;        // Total tonnes CO2e for this token ID
        bool    retired;            // True if all credits in this batch retired
        bytes32 registryProofHash;  // Hash of off-chain registry serialization proof
    }

    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(uint256 => uint256) public retiredAmount;  // Per token ID
    uint256 public nextTokenId;

    address public bridge;          // Registry bridge operator
    address public governance;

    event CreditsMinted(uint256 indexed tokenId, uint256 amount, string registry, uint16 vintage);
    event CreditsRetired(
        uint256 indexed tokenId,
        address indexed retiree,
        uint256 amount,
        string  beneficiary,
        string  retirementReason
    );

    /// @notice Bridge operator mints credits from off-chain registry
    function mintFromRegistry(
        CreditMetadata calldata metadata,
        uint256 amount,
        address recipient
    ) external returns (uint256 tokenId) {
        require(msg.sender == bridge, "NOT_BRIDGE");
        require(amount > 0, "ZERO_AMOUNT");

        tokenId = nextTokenId++;
        creditMetadata[tokenId] = metadata;
        creditMetadata[tokenId].totalSupply = amount;

        _mint(recipient, tokenId, amount, "");
        emit CreditsMinted(tokenId, amount, metadata.registry, metadata.vintage);
    }

    /// @notice Permanently retire credits (burn)
    function retire(
        uint256 tokenId,
        uint256 amount,
        string calldata beneficiary,
        string calldata reason
    ) external {
        require(balanceOf(msg.sender, tokenId) >= amount, "INSUFFICIENT_BALANCE");

        _burn(msg.sender, tokenId, amount);
        retiredAmount[tokenId] += amount;

        if (retiredAmount[tokenId] >= creditMetadata[tokenId].totalSupply) {
            creditMetadata[tokenId].retired = true;
        }

        // Mint retirement certificate (separate contract)
        emit CreditsRetired(tokenId, msg.sender, amount, beneficiary, reason);
    }
}
```

#### 1.2 RetirementCertificate (Soulbound ERC-721)

```solidity
contract RetirementCertificate is ERC721 {
    struct Certificate {
        address retiree;
        uint256 creditTokenId;
        uint256 amount;             // Tonnes CO2e
        string  registry;
        uint16  vintage;
        string  projectName;
        string  beneficiary;
        string  reason;
        uint256 retiredAt;
    }

    mapping(uint256 => Certificate) public certificates;
    uint256 public nextCertificateId;
    uint256 public totalTonnesRetired;

    // Soulbound: override transfer
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0), "SOULBOUND");
        return super._update(to, tokenId, auth);
    }
}
```

### 2. DEX Architecture

The Carbon Credit DEX uses a hybrid AMM model combining constant-product pools for liquid pairs and a Hamiltonian Market Maker for illiquid pairs.

#### 2.1 Pool Types

| Pool Type | Use Case | Pricing | Reference |
|-----------|----------|---------|-----------|
| **Standard AMM** | High-volume credits (VCS REDD+) | Constant product (x*y=k) | LP-9000 |
| **HMM Pool** | Illiquid/niche credits | Hamiltonian energy surface | HIP-0008 |
| **Batch Auction** | Large retirements (>10,000 tCO2e) | Uniform price clearing | LP-9000 |

#### 2.2 CarbonDEX Router

```solidity
contract CarbonDEXRouter {
    address public immutable factory;
    address public immutable carbonCredit;   // ERC-1155 contract
    address public immutable zusd;           // Quote asset

    struct SwapParams {
        uint256 tokenIdIn;           // Carbon credit token ID to sell
        uint256 tokenIdOut;          // Carbon credit token ID to buy (or 0 for ZUSD)
        uint256 amountIn;
        uint256 minAmountOut;
        address recipient;
        uint256 deadline;
    }

    /// @notice Swap carbon credits or buy/sell for ZUSD
    function swap(SwapParams calldata params) external returns (uint256 amountOut) {
        require(block.timestamp <= params.deadline, "EXPIRED");

        address pool = ICarbonDEXFactory(factory).getPool(
            params.tokenIdIn,
            params.tokenIdOut
        );
        require(pool != address(0), "NO_POOL");

        // Transfer input credits to pool
        IERC1155(carbonCredit).safeTransferFrom(
            msg.sender, pool, params.tokenIdIn, params.amountIn, ""
        );

        amountOut = ICarbonPool(pool).swap(
            params.tokenIdIn,
            params.amountIn,
            params.minAmountOut,
            params.recipient
        );

        require(amountOut >= params.minAmountOut, "SLIPPAGE");
    }

    /// @notice Retire credits directly through DEX (buy + burn in one tx)
    function retireViaSwap(
        uint256 zusdAmount,
        uint256 targetTokenId,
        uint256 minCredits,
        string calldata beneficiary,
        string calldata reason
    ) external returns (uint256 creditsRetired) {
        // Buy credits with ZUSD
        IERC20(zusd).transferFrom(msg.sender, address(this), zusdAmount);

        // Swap ZUSD -> carbon credits
        creditsRetired = _swapZUSDForCredits(targetTokenId, zusdAmount, minCredits);

        // Retire immediately
        CarbonCredit(carbonCredit).retire(targetTokenId, creditsRetired, beneficiary, reason);
    }
}
```

#### 2.3 HMM Pool for Carbon Credits

The Hamiltonian Market Maker (HIP-0008) is adapted for carbon credit pricing. The energy surface accounts for:

- **Vintage decay**: Older vintages trade at a discount. The Hamiltonian potential includes a time-dependent term.
- **Quality scoring**: Credits with higher quality scores (based on methodology rigor) have tighter spreads.
- **Supply constraints**: As credits are retired, remaining supply decreases, naturally increasing price.

```solidity
contract CarbonHMMPool {
    // Hamiltonian energy function for pricing
    // H(q, p) = T(p) + V(q) + W(vintage, quality)
    //
    // T(p) = kinetic energy (momentum/volatility)
    // V(q) = potential energy (reserve ratio)
    // W    = carbon-specific modifier

    uint256 public reserveCredits;     // Carbon credit reserves
    uint256 public reserveZUSD;        // ZUSD reserves
    uint16  public vintage;            // Credit vintage year
    uint256 public qualityScore;       // 0-10000

    function getPrice(uint256 creditAmount) public view returns (uint256 zusdAmount) {
        uint256 basePrice = _hamiltonianPrice(creditAmount);
        uint256 vintageDiscount = _vintageDiscount(vintage);
        uint256 qualityPremium = _qualityPremium(qualityScore);

        zusdAmount = (basePrice * (10000 - vintageDiscount + qualityPremium)) / 10000;
    }

    function _vintageDiscount(uint16 v) internal view returns (uint256) {
        uint16 currentYear = uint16(block.timestamp / 365 days + 1970);
        uint16 age = currentYear - v;
        // 2% discount per year of vintage age, max 30%
        return age > 15 ? 3000 : age * 200;
    }

    function _qualityPremium(uint256 score) internal pure returns (uint256) {
        // 0-5% premium based on quality score
        return (score * 500) / 10000;
    }
}
```

### 3. Quality Scoring

Each carbon credit token ID receives a quality score based on objective criteria:

| Criterion | Weight | Scoring |
|-----------|--------|---------|
| Methodology rigor | 25% | Registry methodology tier (A/B/C) |
| Additionality evidence | 25% | Third-party validation strength |
| Permanence risk | 20% | Buffer pool size, reversal risk |
| Co-benefits | 15% | Biodiversity, community, SDG alignment |
| Monitoring frequency | 15% | Annual, biannual, continuous |

Quality scores are set by governance-approved rating agencies and stored on-chain.

### 4. Registry Bridge

```
Off-chain Registry          Bridge Operator           Zoo L2 Chain
(Verra, Gold Standard)      (MPC multisig)           (CarbonCredit ERC-1155)
─────────────────          ────────────────           ─────────────────────
1. Credits issued           2. Verify serialization
   in registry              3. Lock in registry
                            4. Submit proof hash
                                                      5. Mint ERC-1155 tokens
                                                      6. Available for trading

Retirement flow (reverse):
                                                      7. User retires on-chain
                            8. Observe retirement
                            9. Cancel in registry     10. Certificate minted
```

Bridge operators are a 3-of-5 MPC multisig of trusted registry participants. Bridge fees fund the conservation treasury (ZIP-104).

### 5. Fee Structure

| Fee Type | Rate | Recipient |
|----------|------|-----------|
| Swap fee | 30 bps (0.3%) | 70% LPs, 20% conservation treasury, 10% protocol |
| Retirement fee | 10 bps (0.1%) | 100% conservation treasury |
| Bridge fee | 50 bps (0.5%) | 80% bridge operators, 20% conservation treasury |
| Listing fee | 100 ZUSD per credit type | 100% conservation treasury |

### 6. Conservation Integration

The Carbon Credit DEX integrates with the broader Zoo conservation DeFi stack:

1. **Treasury funding**: Swap fees and retirement fees flow to the Research Funding DAO Treasury (ZIP-104).
2. **Impact Yield Vaults**: LP positions in carbon pools can be deposited into Impact Yield Vaults (ZIP-102) for additional conservation-directed yield.
3. **Green Staking**: Carbon credit LPs receive boosted staking multipliers under ZIP-103.
4. **Conservation Bonds**: Carbon credit pools can serve as yield sources for Conservation Bonds (ZIP-101).

### 7. Governance Parameters

| Parameter | Default | Range | Governor |
|-----------|---------|-------|----------|
| Swap fee | 30 bps | 10-100 bps | ZooGovernor |
| Retirement fee | 10 bps | 0-50 bps | ZooGovernor |
| Bridge operators | 3/5 MPC | 2/3 to 5/7 | ZooGovernor |
| Quality raters | Governance-approved | -- | ZooGovernor |
| Vintage discount rate | 2%/year | 0-5%/year | ZooGovernor |
| Max vintage age | 15 years | 5-20 years | ZooGovernor |

## Rationale

**Why ERC-1155 instead of ERC-20?** Carbon credits are heterogeneous -- a 2024 VCS REDD+ credit from Brazil is fundamentally different from a 2020 Gold Standard cookstove credit from Kenya. ERC-1155 multi-token standard allows each credit type/vintage/project to have its own token ID while sharing a single contract, reducing deployment costs and simplifying accounting.

**Why Hamiltonian Market Maker?** Standard constant-product AMMs require deep liquidity to avoid excessive slippage. Many carbon credit types are thinly traded. The HMM (HIP-0008) energy surface adapts to low-liquidity conditions, providing tighter spreads with less capital. The physics-inspired approach also naturally models carbon-specific dynamics like vintage decay.

**Why soulbound retirement certificates?** Retirement must be permanent and non-transferable. If retirement certificates were tradeable, companies could "rent" environmental claims. Soulbound certificates ensure the retiring entity permanently holds the proof of their climate action.

**Why on-chain quality scoring?** Quality scoring removes information asymmetry that enables greenwashing. Buyers can filter by quality score, and the AMM naturally prices higher-quality credits at a premium. This creates market incentives for high-integrity offset projects.

**Why bridge rather than native issuance?** The voluntary carbon market operates through established registries (Verra, Gold Standard). Bridging from these registries ensures credits are legitimate and avoids double-counting. Native issuance could be explored in the future for Zoo-originated conservation projects, but bridging existing supply is the pragmatic first step.

## Security Considerations

### Bridge Operator Collusion
- Bridge operators could mint unbacked credits. Mitigation: 3/5 MPC threshold, operator staking with slashing, and on-chain proof hashes verified against registry serial numbers.

### Quality Score Manipulation
- Compromised quality raters could inflate scores for low-quality credits. Mitigation: multiple raters required, governance approval, and stake-based accountability.

### Vintage Spoofing
- Minting credits with false vintage metadata. Mitigation: bridge operator verification against registry records; registry proof hash enables off-chain auditing.

### Oracle-Free Design
- Carbon pricing uses on-chain AMM state, not external oracles. This eliminates oracle manipulation risk at the cost of price lag relative to OTC markets. Arbitrageurs close the gap.

### Retirement Finality
- Once retired on-chain, credits cannot be un-retired. The bridge operator must cancel the corresponding serial numbers in the off-chain registry. If the bridge fails to cancel, the on-chain retirement is still valid but the off-chain credit remains active -- this is a bridge liveness failure, not a protocol failure.

### Regulatory
- Tokenized carbon credits may be classified as commodities or financial instruments depending on jurisdiction. Zoo Labs Foundation operates the DEX infrastructure as a charitable program facilitating environmental markets. Trading participants should assess their own regulatory obligations. LP-9400 privacy features are not enabled by default for carbon pools to maintain transparency.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-102: Impact Yield Vaults](./zip-0102-impact-yield-vaults.md)
5. [ZIP-103: Green Staking Mechanism](./zip-0103-green-staking-mechanism.md)
6. [ZIP-104: Research Funding DAO Treasury](./zip-0104-research-funding-dao-treasury.md)
7. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
8. [LP-9000: DEX Specifications](https://lps.lux.network/lp-9000)
9. [LP-9400: AMM with Privacy](https://lps.lux.network/lp-9400)
10. [HIP-0008: Hamiltonian Market Maker](https://hips.hanzo.ai/hip-0008)
11. [HIP-0018: Payment Processing](https://hips.hanzo.ai/hip-0018)
12. Verra, "Verified Carbon Standard Program Guide," v4.5, 2024
13. ICVCM, "Core Carbon Principles," 2023

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
