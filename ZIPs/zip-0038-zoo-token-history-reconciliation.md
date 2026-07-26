---
zip: 0038
title: "ZOO Token History Reconciliation (BSC, Old Mainnet, Zoo EVM, LZOO)"
author: Zach Kelling (@zeekay), Zoo Labs Foundation
type: Informational
category: Core
status: Draft
created: 2026-07-02
requires: ZIP-0035
references: ZIP-0002, ZIP-0039
tags: [reconciliation, bsc, migration, lzoo, holders, evidence, on-chain]
---

# ZIP-0038: ZOO Token History Reconciliation

## Abstract

This ZIP is the **evidence record** for every place ZOO has existed, so
the migration (ZIP-0039) can be executed from facts, not folklore. It
documents, with **live on-chain evidence**, the three BSC ZOO contracts,
the prior Zoo mainnet (imported as history into the current chain), the
current Zoo EVM (chainId 200200), and the LZOO position on Lux. Every
unverifiable item is explicitly flagged.

All BSC figures below were **verified live on 2026-07-02** against
`https://bsc-dataseed.binance.org/` (`eth_call` for `symbol()`,
`totalSupply()`, `eth_getCode`) and cross-checked against a full
`Transfer`-event balance replay cached 2024-11-15
(`~/work/zoo/token-holder-analysis/state.pkl`,
`token_holder_analysis.py`).

## 1. BSC ZOO — three contracts, one 2-trillion lineage

There was **one canonical ZOO on Binance Smart Chain**, redeployed twice
(V1 → V2 → V3). All three are live, all three report `symbol() = "ZOO"`
(ASCII `0x5a4f4f`), all three carry ~2 trillion supply:

| Ver | Address | `symbol()` | Live `totalSupply()` (2026-07-02) | Holders (2024-11 replay) |
|---|---|---|---|---|
| V1 | `0x8e7788ee2b1d3e5451e182035d6b2b566c2fe997` | ZOO | 1,999,922,331,343 | 11,067 |
| V2 | `0x19263f2b4693da0991c4Df046E4bAA5386F5735E` | ZOO | 1,998,500,000,000 | 17,231 |
| V3 | `0x7fFC1243232da3Ac001994208E2002816b57c669` | ZOO | 1,999,646,746,397 |    933 |

**Migration reality (important — not a burn):**

- The intended path was V1 → V2 → V3, each a fresh 2T deployment.
- V3's supply sits almost entirely in **one EOA**,
  `0x6D392eF5EE135EE40B83e1Dd3f68A40aF20c5023` (verified `eth_getCode =
  0x`, i.e. **not a contract**), holding exactly **2,000,000,000,000
  ZOO** — the V3 mint reserve.
- Only **932 real addresses** actually pulled V3, totaling **~12.4
  billion ZOO** — i.e. **< 0.7%** of holders completed the move to V3.
- **No burn-address activity was found.** `0x…dEaD` and `0x0` hold zero on
  all three. The "migration" was redeploys with a manual/reserve pull, not
  a burn-and-mint bridge. **FLAG:** the owner's framing "people burned ZOO
  on BNB to migrate" is **not corroborated by a burn sink** on V1/V2/V3;
  if a burn/bridge contract exists it is not among these addresses and
  must be provided by the owner for inclusion.

### Who is owed (canonical eligible set)

Computed from the union of V1/V2/V3 holder balances, per-address **max**
(peak stake across versions), excluding the V3 reserve EOA and sub-1-ZOO
dust:

```
eligible addresses           : 18,680
eligible peak-balance sum     : 2,141,174,408,643 ZOO   (~2.14 trillion)
net-new vs existing V3 credit : 2,128,726,627,983 ZOO
```

For reference, the narrower `missing_in_v3.txt` artifact (10,998 rows,
sum 2,000,000,583,028 ≈ exactly the V2 supply) is the **V2-holders-not-
in-V3** cut only; the 18,680-address union above is the correct
canonical set.

> **FLAG (double-count):** the peak-sum (2.14T) **exceeds** both the BSC
> per-contract supply (2T) and the 200200 genesis (2T). This is expected —
> an address that sold V1 then re-accumulated V2 is counted at its peak in
> each. The migration (ZIP-0039) therefore **cannot** credit peak 1:1; it
> must (a) fix **one** canonical source (recommend V2 at a fixed
> pre-migration block — the widest genuine holder base) or a governance-
> ratified dedup union, and (b) **pro-rata** into the migration pool `P`.
> The snapshot MUST be regenerated fresh at a fixed block before use; the
> 2024-11 cache is evidence, not the execution snapshot.

## 2. Ethereum "CryptoZoo" (Logan Paul) — a DIFFERENT token

ZIP-0002 references `0x09e0df4ae51111ca27d6b85708cfb3f1f7cae982` on
**Ethereum** as the "original ZOO." That is the **Logan Paul CryptoZoo**
token — a separate lineage from Zoo Labs Foundation's BSC ZOO (§1).

> **FLAG:** ZIP-0002 conflates two distinct restitution populations:
> (a) Zoo Labs' own BSC ZOO holders (§1, the real migration), and
> (b) CryptoZoo victims on Ethereum. Keep them separate. The ZIP-0039
> make-whole targets **(a)**. Whether CryptoZoo victims **(b)** are
> included is an owner/legal decision, not assumed here (ZIP-0002 says
> "not affiliated with Logan Paul; voluntary").

## 3. Old Zoo mainnet — imported as history into 200200

The prior Zoo mainnet is **not a separate live chain**; its state was
imported **once** into the current Zoo EVM and its history is preserved:

```yaml
old_chain_blockchainID: 2wbPWcyuNUimWW7YMq3gymTTpHjP9Lsm7GpmcyWimEs9kyTAAH
imported_into:          Zoo EVM chainId 200200
rlp:                    exports/zoo-mainnet-200200/blocks.rlp  (800 blocks, 0..799)
imported_via:           admin_importChain
importedAt:             2026-05-25T23:01:33Z
current_blockchainID:   4HBM17czc7zFQMPrd9CVZ6YbABm1jecf99iwvFw8Gbo6gFaU3
status:                 RLP import RETIRED 2026-06-16 → native ZAP snapshot
                        (s3: zoo/mainnet/zaprepl); includeRlpExports=false
```

The 800-block history is now carried in the native snapshot stream. This
is the genesis+history the owner mandates we **preserve** (ZIP-0035,
ZIP-0039). **FLAG:** the per-holder alloc *inside* those 800 blocks was
not decoded in this pass; if old-mainnet balances differ from the BSC
snapshot they must be reconciled before the ZIP-0039 snapshot is frozen.

## 4. Current Zoo EVM (chainId 200200)

```yaml
chainId: 200200
type: L2 validated by the Lux Primary Network (networkID 1); own EVM (NOT C-Chain)
blockchainID: 4HBM17czc7zFQMPrd9CVZ6YbABm1jecf99iwvFw8Gbo6gFaU3
vmID: mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6
genesis_alloc (canonical, universe/configs/genesis/mainnet/genesis.json):
  "0x9011E888251AB053B7bD1cdB598Db4f9DEd94714": 2_000_000_000_000 ZOO   # full supply
  "0x02...05" (precompile): 0
```

- The full **2 trillion ZOO** is minted at genesis to `0x9011`
  (bootstrap owner; ZIP-0035). This **preserves the BSC 2T supply 1:1**.
- `0x9011` **never held BSC ZOO** (verified zero on V1/V2/V3) — it is a
  fresh Zoo-EVM key, the bootstrap custodian of both Safes (ZIP-0036).
- **FLAG (conflicting genesis file):** `~/work/zoo/node/genesis.json`
  mints only **10,000,000,000** to `0x9011` (a stale/dev file). The
  **canonical mainnet genesis is the `universe/` 2T file** (matches
  `chain.yaml`, `imageTag v1.30.6`, the live 200200 deploy). The node/
  dev file is superseded and should be aligned or removed.

## 5. LZOO on Lux — ~7.6B in the Lux DAO Safe

~7.6 billion **LZOO** currently sits in the Lux DAO Safe
`0x51284dC2...` on Lux C-Chain (from the Lux treasury sweep). LZOO is
Zoo's token represented/bridged on Lux.

> **FLAG (coordination pending — Lux tokenomics agent):** this author
> could not reach the Lux tokenomics agent synchronously. Unresolved and
> required before writing LZOO into ZIP-0039:
> - exact LZOO ERC-20 **contract address** on Lux C-Chain,
> - exact **balance** held by `0x51284dC2`,
> - denomination: is LZOO a **1:1** claim on Zoo ZOO or an independent
>   Lux-side representation? (~7.6B LZOO vs 2T ZOO on 200200 is a **~263×
>   gap** — strongly implies LZOO tracks a redenominated ~10B-scale
>   supply, NOT the 2T. This must be confirmed, not assumed.)
>
> **Proposed routing (to be ratified by both sides):** the LZOO in the
> Lux DAO Safe → bridge-burn / Safe-to-Safe transfer to the **Zoo DAO
> Safe** on 200200, i.e. it becomes Foundation ZOO on Zoo's own chain
> rather than remaining on Lux. Whether it lands as additional Foundation
> ZOO or offsets the migration pool depends on the denomination answer.

## Sources (evidence)

1. Live BSC `eth_call` — `https://bsc-dataseed.binance.org/`, 2026-07-02
   (`symbol`, `totalSupply`, `eth_getCode`).
2. `~/work/zoo/token-holder-analysis/token_holder_analysis.py` + `state.pkl`
   (full `Transfer` replay, cached 2024-11-15).
3. `~/work/zoo/token-holder-analysis/missing_in_v3.txt`,
   `missing_in_v2.txt`.
4. `~/work/zoo/universe/configs/genesis/mainnet/genesis.json`,
   `~/work/zoo/universe/chain.yaml`.
5. `~/work/zoo/universe/k8s/zoo-mainnet/luxd-rlp-import.yaml`,
   `.../raw-bootstrap/zoo-chain.yaml`, `.../snapshot-native/`.
6. `~/work/zoo/zips/ZIPs/zip-0002-...` (CryptoZoo lineage, Ethereum
   contract).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
