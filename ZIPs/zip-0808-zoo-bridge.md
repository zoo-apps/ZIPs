---
zip: 0808
title: "Zoo Bridge — Cross-Ecosystem Bridge for Zoo L1"
description: "Cross-ecosystem bridge for Zoo L1 ZRC-20/721/1155 assets and native $ZOO. Built on Lux B-Chain (BVM) with M-Chain MPC threshold signing, preserving conservation metadata and token-bound account state across chains"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-12-15
activation: 2025-12-25
tags: [bridge, b-chain, m-chain, mpc, threshold-signing, ringtail, asset-migration]
requires: [700, 701, 702, 800, 804]
related-lps: [LP-018, LP-019, LP-073, LP-134]
related-papers: [zoo-3-0-launch]
---

# ZIP-0808: Zoo Bridge

## Abstract

Zoo Bridge is the cross-ecosystem bridge for Zoo L1 assets. It supports ZRC-20 fungibles, ZRC-721 NFTs (with conservation metadata and token-bound account state preserved), ZRC-1155 multi-tokens, and native `$ZOO`. Lock-and-mint operations require a 2-of-3 threshold supermajority across the Zoo bridge committee, signed via M-Chain (MVM) MPC ceremonies (CGGMP21 / FROST) with Ringtail (LP-073) post-quantum threshold proofs. The bridge VM substrate is Lux B-Chain (BVM, LP-134); Zoo Bridge is the Zoo-specific message and asset model layered on top. ZIP-0808 supersedes ZIP-0800 for Zoo 3.0 L1 operations.

## Motivation

ZIP-0800 specified the Zoo L2 to Lux Network bridge. With L1 graduation (ZIP-0804), the bridge becomes a Zoo L1 to multi-chain bridge:

1. **Multi-chain reach.** Zoo L1 must transfer assets to Lux C/X/B/Z-Chains, Ethereum mainnet, Polygon, BSC (legacy), and arbitrary EVM chains.
2. **Metadata preservation.** Wildlife NFTs carry provenance chains, conservation contributions, token-bound account balances, and on-chain achievements that generic bridges destroy.
3. **Yield-bearing custody.** Locked `$ZOO` backing a wrapped token can stake; yield accrues to the depositor (LP-018 pattern).
4. **Post-quantum security.** Ringtail threshold layer (LP-073) ensures no classical-key compromise can forge a release.

## Specification

### Architecture

```
Zoo L1 ─┐
        ├──→ Zoo Bridge contract (lock)
        │      │
        │      └──→ B-Chain (BVM) message bus
        │              │
        │              ├──→ Lux C/X/B/Z-Chain adapters
        │              ├──→ Ethereum adapter
        │              ├──→ Polygon adapter
        │              ├──→ BSC adapter (inbound only — legacy 2021 migration)
        │              └──→ Generic EVM adapter
        │
        └──← M-Chain (MVM) threshold sign ceremony
                │
                ├── CGGMP21 / FROST classical signature
                └── Ringtail (LP-073) post-quantum threshold proof
```

### Bridge committee

- Size: 7 members at activation (DAO-controlled).
- Threshold: 2-of-3 supermajority (5/7).
- Membership: Zoo DAO appointment with rotation.
- Ceremony cadence: per-message threshold sign.

### Asset adapters

| Chain | Direction | Notes |
|---|---|---|
| Lux C-Chain | both | native EVM, fastest |
| Lux X-Chain | both | UTXO assets |
| Lux B-Chain | both | native bridge VM |
| Lux Z-Chain | both | ZK-rollup-bound assets |
| Ethereum mainnet | both | wrapped $ZOO, NFT migration |
| BSC | inbound only | legacy 2021 Zoo migration |
| Polygon | both | retail wallets and tooling |
| Arbitrary EVM | both | generic adapter, slower path |

### Conservation metadata

A wildlife ZRC-721 carries:

- Provenance chain (pedigree hash chain).
- Conservation contributions (cumulative donation history).
- Token-bound account balances (per ERC-6551).
- On-chain achievements (gym, breeding, feeding state).

Zoo Bridge encodes these into the lock event payload and replays them on the mint side. A bridged NFT arrives identical to the source, not a synthetic wrapper.

### Yield-bearing bookkeeping (LP-018)

When `$ZOO` sits on a foreign side as wrapped, the locked backing on Zoo L1 stakes into the validator set. Per-deposit yield accumulators track accrual. On burn-and-unlock, depositor receives principal plus accumulated yield.

### BSC migration

The BSC adapter is one-way: existing 2021 Zoo BSC holders can migrate their BSC ZRC-20/721 to Zoo L1. The BSC contract is escrowed under the bridge committee; native equivalents mint on L1 to the same wallet address. Post-migration, the BSC contract is locked.

## Rationale

Generic bridges (LayerZero, Wormhole, etc.) lack support for conservation metadata, provenance chains, and token-bound account state. A purpose-built bridge ensures Zoo primitives survive cross-chain transfers intact. Building on B-Chain (LP-134) rather than rolling our own bridge VM avoids duplicating the Lux ecosystem's bridge security model.

## Reference Implementation

`~/work/zoo/bridge` — Go binary plus contract suite. Bridge committee tooling at `~/work/zoo/bridge/committee/`.

## Security Considerations

- 2-of-3 threshold ceremony with Ringtail (LP-073) post-quantum proof: forgery requires both classical compromise and post-quantum compromise.
- Replay protection via per-message nonces anchored to B-Chain.
- Adapter contracts on foreign chains are immutable post-deploy; upgrades require deploying new adapters and migrating per-asset.

## Backwards Compatibility

ZIP-0800 (Zoo L2 to Lux bridge) is superseded but remains active for the 30-day L2 deprecation window post-L1 activation. Subsequently retired.

## References

- LP-018 — Yield-Bearing Bridge
- LP-019 — Threshold MPC
- LP-073 — Ringtail Threshold Proofs
- LP-134 — Lux Chain Topology (B-Chain BVM)
- `zoo-3-0-launch` paper §7 (Zoo Bridge)
- ZIP-0800 — Zoo-Lux Bridge Protocol (superseded)
