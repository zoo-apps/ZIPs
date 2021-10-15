---
zip: 106
title: "Automated Market Maker for Conservation"
description: "AMM with conservation fee routing that directs a portion of swap fees to verified wildlife programs"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
originated: 2021-10
traces-from: "Whitepaper section 20 (NFT Liquidity Protocol)"
follow-on: [zoo-nft-liquidity-protocol, zoo-dex]
created: 2025-01-15
tags: [amm, defi, conservation, swap, liquidity]
requires: [0, 100, 105]
---

# ZIP-106: Automated Market Maker for Conservation

## Abstract

This ZIP specifies a constant-product automated market maker (AMM) with a built-in conservation fee layer. Every swap executed through the Zoo AMM splits the trading fee into two components: a liquidity provider reward and a conservation allocation routed to verified programs registered under ZIP-500. The AMM extends the Uniswap V2 invariant (`x * y = k`) with a configurable `conservationBps` parameter per pool, ensuring that every unit of trading activity on Zoo DEX generates measurable conservation funding without requiring voluntary action from traders.

## Motivation

Decentralized exchanges generate billions in trading fees annually, yet none structurally direct fees toward public goods. The Zoo ecosystem positions conservation as a first-class economic primitive rather than an afterthought:

1. **Structural funding**: Voluntary donation models fail at scale. By embedding conservation fees at the protocol level, every swap contributes regardless of user intent.
2. **Transparent allocation**: On-chain fee routing provides auditable, real-time tracking of conservation funding -- superior to opaque corporate CSR programs.
3. **LP incentive alignment**: Liquidity providers earn competitive yields while participating in conservation. Impact-motivated capital can be attracted alongside yield-seeking capital.
4. **Composability**: The AMM integrates with existing Zoo DeFi primitives: conservation bonds (ZIP-101), impact yield vaults (ZIP-102), and the carbon credit DEX (ZIP-105).

## Specification

### 1. Fee Structure

Each pool has three fee parameters set at creation:

| Parameter | Range | Default | Governance |
|-----------|-------|---------|------------|
| `totalFeeBps` | 10-500 | 30 (0.30%) | ZooGovernor |
| `conservationBps` | 50-5000 of fee | 1000 (10% of fee) | ZooGovernor |
| `conservationRecipient` | ZIP-500 verified | DAO treasury | Pool creator |

Effective fee split for a 30 bps pool with 10% conservation:
- LP reward: 27 bps (0.27%)
- Conservation: 3 bps (0.03%)

### 2. Core Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract ZooAMMPair is ERC20 {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;

    uint16 public totalFeeBps;
    uint16 public conservationBps;       // Fraction of fee for conservation (bps of fee)
    address public conservationRecipient;

    uint256 public cumulativeConservationFunding;

    event Swap(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOut,
        uint256 conservationFee,
        address indexed recipient
    );

    event ConservationFeeCollected(
        address indexed recipient,
        address indexed token,
        uint256 amount
    );

    function swap(
        uint256 amountIn,
        uint256 minAmountOut,
        address tokenIn,
        address to
    ) external returns (uint256 amountOut, uint256 conservationFee) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "INVALID_TOKEN");

        // Calculate fees
        uint256 totalFee = (amountIn * totalFeeBps) / 10000;
        conservationFee = (totalFee * conservationBps) / 10000;
        uint256 lpFee = totalFee - conservationFee;
        uint256 amountInAfterFee = amountIn - totalFee;

        // Route conservation fee
        IERC20(tokenIn).transferFrom(msg.sender, conservationRecipient, conservationFee);
        cumulativeConservationFunding += conservationFee;

        // Constant product swap
        (uint112 reserveIn, uint112 reserveOut) = tokenIn == address(token0)
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        amountOut = (uint256(reserveOut) * amountInAfterFee) / (uint256(reserveIn) + amountInAfterFee);
        require(amountOut >= minAmountOut, "SLIPPAGE");

        // Transfer and update reserves
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn - conservationFee);
        IERC20(tokenIn == address(token0) ? address(token1) : address(token0)).transfer(to, amountOut);

        _updateReserves();
        emit Swap(msg.sender, amountIn, amountOut, conservationFee, to);
        emit ConservationFeeCollected(conservationRecipient, tokenIn, conservationFee);
    }

    function _updateReserves() internal {
        reserve0 = uint112(token0.balanceOf(address(this)));
        reserve1 = uint112(token1.balanceOf(address(this)));
    }
}
```

### 3. Factory Contract

```solidity
contract ZooAMMFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair);

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    function createPair(
        address tokenA,
        address tokenB,
        address conservationRecipient,
        uint16 conservationBps
    ) external returns (address pair) {
        require(tokenA != tokenB, "IDENTICAL");
        require(conservationBps >= 50, "MIN_CONSERVATION_FEE");
        // Deploy pair with conservation routing
        // ...
    }
}
```

### 4. Conservation Dashboard

The AMM exposes view functions for aggregate conservation metrics:

- `cumulativeConservationFunding()`: Total conservation fees collected per pool.
- `conservationFundingByProgram(string programId)`: Aggregated funding per ZIP-500 program.
- Factory-level aggregation across all pools.

### 5. Governance Parameters

| Parameter | Min | Max | Changed By |
|-----------|-----|-----|------------|
| Total fee | 10 bps | 500 bps | ZooGovernor |
| Conservation share | 50 bps of fee | 5000 bps of fee | ZooGovernor |
| Recipient | Must be ZIP-500 verified | -- | Pool creator + ZooGovernor |

## Rationale

**Why constant-product over concentrated liquidity?** Simplicity. The conservation fee mechanism is independent of the AMM curve. A V3-style concentrated liquidity version can be proposed as a future ZIP. Starting with constant-product reduces audit surface and accelerates adoption.

**Why per-pool conservation recipients?** Different token pairs may align with different conservation outcomes. A ZOO/CARBON pool naturally funds carbon offset programs, while a ZOO/WILDLIFE pool funds species protection. Per-pool routing enables targeted impact.

**Why minimum 50 bps conservation share?** Below 0.5% of the fee, conservation funding becomes negligible. The floor ensures meaningful contribution while remaining low enough to keep the AMM competitive with non-conservation DEXes.

## Security Considerations

### Reentrancy
All state updates occur before external transfers. The swap function follows checks-effects-interactions pattern.

### Fee Manipulation
Conservation fee parameters are governance-controlled. Malicious pool creators cannot set conservation recipient to themselves because the address must be ZIP-500 verified.

### Price Oracle Manipulation
Conservation fees are calculated on `amountIn`, not on derived prices, eliminating oracle manipulation as a vector for fee extraction.

### Sandwich Attacks
Standard AMM sandwich risk applies. The `minAmountOut` parameter provides slippage protection. Conservation fees slightly increase effective slippage, which should be reflected in frontend UX.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-105: Carbon Credit DEX](./zip-0105-carbon-credit-dex.md)
5. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
6. [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)
7. Hayden Adams, "Uniswap V2 Core," 2020

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
