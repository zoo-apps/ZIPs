---
zip: 0805
title: "Zoo DEX (V2/V3 Native, V4 Lux DEX Precompile)"
description: "Native Uniswap-style AMM V2 (constant product) and V3 (concentrated liquidity) on Zoo L1, plus V4 implemented as a precompile to the Lux DEX for cross-chain routing"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-12-15
activation: 2025-12-25
tags: [dex, amm, uniswap, concentrated-liquidity, precompile, lux-dex, gpu-native]
requires: [700, 701, 702, 804]
related-lps: [LP-009, LP-132, LP-134, LP-137]
related-papers: [zoo-3-0-launch]
---

# ZIP-0805: Zoo DEX

## Abstract

Zoo L1 ships a native AMM DEX in three versions:

- **V2** — constant product (`x*y=k`) AMM, Uniswap V2 surface.
- **V3** — concentrated liquidity, Uniswap V3 surface, multi-fee-tier pools (5 / 30 / 100 bps).
- **V4** — *not a separate AMM*: a precompile interface that routes swaps to the Lux DEX (`~/work/lx/dex`) via B-Chain messaging.

All curve evaluation, tick-crossing math, and order matching execute as GPU kernels on the Zoo L1 validator (LP-009 + LP-132). The optional `Local DEX` precompile mirrors the Lux DEX matching primitives against Zoo-local order books for chain-internal CLOB use cases.

## Motivation

1. **Zoo-native trading pairs need on-chain liquidity.** Per-LLM tokens, ZRC-721 fractional pools, and DAO governance pools should not require a cross-chain hop to trade.
2. **Composability.** Existing Uniswap V2/V3 tooling (analytics, audit checklists, indexers) translates directly.
3. **Latency.** GPU-native curve math gives Zoo block-level swap throughput materially higher than CPU-EVM peers.
4. **Cross-chain depth.** V4 plugs into the Lux DEX router so Zoo users can access the canonical Lux ecosystem liquidity venue without leaving their wallet.

## Specification

### V2 (constant product)

- Factory contract creates pools for `(ZRC-20, ZRC-20)` pairs.
- LP shares are minted as ZRC-20 receipt tokens.
- Default fee: 30 bps. Per-pool override allowed under DAO governance.
- Standard Uniswap V2 router interface (`swapExactTokensForTokens`, `addLiquidity`, etc.) for tooling compatibility.

### V3 (concentrated liquidity)

- Tick spacing: configurable per fee tier (1 / 60 / 200 ticks for 5 / 30 / 100 bps respectively).
- Range positions: ERC-721 NFTs per the Uniswap V3 NonfungiblePositionManager pattern.
- Fee accumulation: per-position growth in fee numerators, claimed via `collect`.

### V4 (Lux DEX precompile)

- Precompile address: `0x0000000000000000000000000000000000000A04` (illustrative; final address assigned at activation).
- Interface: `route(srcToken, dstToken, amountIn, minOut, recipient)` -> `amountOut`.
- Implementation: B-Chain message to Lux DEX, response handled inline.
- Use V4 when: deepest book is on Lux, cross-chain routing required, institutional CLOB semantics needed.

### Local DEX precompile (optional)

- Precompile address: `0x0000000000000000000000000000000000000A05` (illustrative).
- Implements the same matching primitives as Lux DEX but against Zoo-local order books.
- Shares kernel implementation with Lux DEX so behaviour is identical; only venue and gas accounting differ.

### Per-LLM token markets

Per-LLM chain tokens (per `zoo-per-llm-chains`) trade against `$ZOO` and against each other on V2/V3. Inference revenue routed through per-LLM chain attribution graphs settles into the relevant V3 pool, providing price discovery for model quality.

### NFT fractional pools

ZRC-721 NFTs migrated to Zoo L1 (per ZIP-0807) can be wrapped into ERC-4626 vault shares and traded as concentrated-liquidity V3 positions. Combined with F-Chain FHE (LP-013), fractional positions can trade with confidential balances.

## Rationale

V2 and V3 cover the dominant AMM patterns. V4 as a precompile (rather than a third AMM) avoids fragmenting Zoo-local liquidity and centralises cross-chain routing on the canonical Lux DEX venue. Reusing the Uniswap surface guarantees tooling compatibility without semantic risk.

## Versioning Policy

- V2 and V3 are stable.
- V4 tracks the Lux DEX interface contract. Breaking changes to Lux DEX require a corresponding V4 revision with a deprecation window of at least one Quasar epoch.
- There is no separate "Zoo V4 AMM"; V4 is the precompile, full stop.

## Reference Implementation

- V2/V3 contracts: `~/work/zoo/contracts/dex/`
- V4 precompile: `~/work/zoo/node/precompile/dex/`

## Security Considerations

- V2/V3 inherit the Uniswap audit history at the algorithmic level; on-chain implementations are re-audited for GPU-native execution semantics.
- V4 precompile validates B-Chain message signatures end-to-end; a compromised B-Chain validator cannot forge V4 swap results because the response carries a Lux DEX QuasarCert.

## References

- LP-009 — GPU-Native EVM
- LP-132 — QuasarGPU Execution Adapter
- LP-134 — Lux Chain Topology
- `zoo-3-0-launch` paper §4 (Zoo DEX)
- Adams, H., et al. "Uniswap v3 Core" (2021)
- Lux DEX: `~/work/lx/dex`
