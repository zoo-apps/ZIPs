---
zip: 0039
title: "ZOO Migration and Re-Mint Mechanism"
author: Zach Kelling (@zeekay), Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2026-07-02
requires: ZIP-0035, ZIP-0036, ZIP-0038
references: ZIP-0002
tags: [migration, snapshot, merkle, claim, re-mint, preserve-genesis, staged]
---

# ZIP-0039: ZOO Migration and Re-Mint Mechanism

## Abstract

This ZIP specifies how BSC ZOO holders (and, if the owner elects,
old-mainnet holders) are **made whole on Zoo EVM (chainId 200200)**
without re-genesis. Approach: a **frozen holder snapshot** → a **Merkle
claim contract** on 200200 funded from the non-Foundation half (pool `P`,
ZIP-0035) → **unclaimed balances sweep to the Zoo Z (Team) Safe**
(`0x3Be393fb0cDFc9BC5a11fDb4F1eA6bD7e4C815B5`). This is the lux.town
NFT-re-mint pattern applied to a fungible token. **Nothing executes until
Zoo EVM 200200 is repaired and bootstrapped** (currently crash-looping);
all steps are staged and owner-gated.

## Motivation

ZIP-0038 establishes that ~18,680 addresses hold ZOO on BSC and that
< 0.7% ever completed the V3 migration. The current 200200 genesis mints
the full 2T to a single bootstrap key (`0x9011`), **not** to the historic
holders — so on-chain, holders have not been made whole. This ZIP closes
that gap while honoring two hard constraints:

1. **Preserve Zoo EVM genesis** (owner ruling): no re-genesis, no rewrite
   of the imported 800-block history. Make-whole is **additive** (a new
   claim contract funded by a transfer), never a genesis edit.
2. **Respect the 50/50 split** (ZIP-0035): claims are funded from the
   non-Foundation half only; the Foundation's 1T is untouched.

## Specification

### Step 1 — Freeze the snapshot (fresh, at a fixed block)

The 2024-11 cache is **evidence, not the execution snapshot** (ZIP-0038
§1). Regenerate fresh:

```yaml
sources:                       # BSC ZOO (ZIP-0038 §1)
  v1: "0x8e7788ee2b1d3e5451e182035d6b2b566c2fe997"
  v2: "0x19263f2b4693da0991c4Df046E4bAA5386F5735E"
  v3: "0x7fFC1243232da3Ac001994208E2002816b57c669"
exclude:
  - "0x6D392eF5EE135EE40B83e1Dd3f68A40aF20c5023"   # V3 reserve EOA (not a holder)
  - burn/zero addresses, LP/router contracts (enumerate + tag before freeze)
snapshot_block_bsc: "<FIXED_BSC_BLOCK>"            # FLAG: owner/governance picks the block
canonical_balance_rule: "see Step 2"
regenerate_with: "~/work/zoo/token-holder-analysis/token_holder_analysis.py (full Transfer replay)"
output: "snapshot.json  (address -> balance),  merkle_root"
```

> **FLAG (owner decision — canonical source & block):** ZIP-0038 §1 shows
> peak-across-versions sums to ~2.14T, which **double-counts** addresses
> that churned across V1/V2/V3. Pick ONE canonical rule before freezing:
> - **(A) V2 at a fixed pre-migration block** — widest genuine holder base
>   (17,231), single contract, no double-count. *Recommended.*
> - **(B) Dedup union** V1∪V2∪V3, per-address **max**, governance-ratified.
> Also fix `<FIXED_BSC_BLOCK>`. This ZIP does not invent either.

> **FLAG (old-mainnet):** if the imported 800-block old-mainnet state
> (ZIP-0038 §3) carries per-holder balances that differ from BSC, merge
> them into `snapshot.json` before freezing the Merkle root. Their alloc
> was not decoded in this pass.

### Step 2 — Compute pro-rata credits within pool `P`

Because the snapshot total exceeds available supply, credit is **pro-rata**,
never nominal 1:1:

```
credit(addr) = floor( P * snapshot_balance(addr) / snapshot_total )
```

- `P` = migration claim pool (ZIP-0035, owner-gated; default `P = 1T`, the
  whole non-Foundation half).
- This makes every holder whole **proportionally** and fits exactly within
  `P` (Σ credit ≤ P). It is the same math as ZIP-0002 (`proportion × new
  supply`).
- Sanity invariant: `Σ credit(addr) ≤ P ≤ 1,000,000,000,000`.

### Step 3 — Deploy + fund the Merkle claim contract (STAGED, additive)

```
ZooMigrationClaim (on 200200)
  merkleRoot        = <root of address→credit>
  token             = ZOO (200200)
  owner             = Zoo DAO Safe 0x5232991515a671f745d3530A996E3503783E2939
  sweepRecipient    = Zoo Z Safe   0x3Be393fb0cDFc9BC5a11fDb4F1eA6bD7e4C815B5
  claimWindow       = <owner-set, e.g. 24 months; ZIP-0002 precedent = perpetual>
fund: transfer P ZOO  0x9011 ──► ZooMigrationClaim   # additive, genesis untouched
claim(amount, proof): verify leaf keccak(addr,amount) ∈ merkleRoot → transfer ZOO
sweepUnclaimed(): after claimWindow → transfer remaining balance → sweepRecipient (Z Safe)
```

- Deploying + funding a **new contract by transfer preserves genesis**:
  the 200200 genesis alloc and the 800-block history are never modified.
- Contract is `Ownable` → **owner = Zoo DAO Safe** so the DAO governs
  claim params and the unclaimed sweep (ties into ZIP-0036 Foundation
  ownership).
- Reference implementation mirrors ZIP-0002's `ZooGenesisAirdrop`
  (Merkle-proof claim) — reuse, don't re-invent.

### Step 4 — LZOO reconciliation (see ZIP-0038 §5)

The ~7.6B LZOO in the Lux DAO Safe `0x51284dC2133e8d3a8e213DCa6a6FA768cf
DfcCce2` routes per the pending Lux-side answer (denomination unknown).
Two staged options, decided once denomination is confirmed:
- **1:1 claim:** LZOO → bridge-burn → equivalent ZOO minted/transferred to
  the **Zoo DAO Safe** on 200200 (Foundation ZOO).
- **Redenominated:** convert at the confirmed ratio, then same destination.

Held as a flag in ZIP-0038 §5 until the Lux tokenomics agent confirms the
LZOO contract address, balance, and denomination.

### Execution gate

```
BLOCKED until ALL true:
  [ ] Zoo EVM 200200 bootstrapped & healthy (consensus v1.32.11 repair)
  [ ] canonical source + FIXED_BSC_BLOCK chosen (Step 1 flag)
  [ ] P chosen (ZIP-0035 flag)
  [ ] old-mainnet balances merged-or-excluded (Step 1 flag)
  [ ] Safes deployed & verified at predicted addrs (ZIP-0036)
  [ ] LZOO denomination confirmed (ZIP-0038 §5)
  [ ] owner sign-off on merkle_root + funding batch
```

## Fork-proof (preserve-genesis guarantee)

The migration introduces **no** consensus-level change:

- **No genesis edit:** `genesis.json` (2T → `0x9011`) is unchanged; the
  Merkle contract is deployed as an ordinary transaction *after* genesis.
- **No state-root discontinuity at genesis:** block 0 hash and the
  imported 800-block history are byte-identical before and after; the
  claim contract only appends new blocks.
- **Chain-continuity check (run post-repair, pre-fund):**
  ```
  eth_getBlockByNumber(0)  hash  == recorded genesis hash   # unchanged
  imported tip (block 799) hash  == recorded RLP tip hash    # unchanged
  eth_chainId                    == 0x30dc8 (200200)
  ```
- **Conservation invariant:** `foundation(1T) + P + team_permanent(1T−P) =
  2T` and `Σ credits ≤ P` — no ZOO is minted beyond the 2T genesis; all
  distribution is transfers from `0x9011`.

## Rationale

- **Snapshot + Merkle claim** (pull, not push) scales to ~18k addresses,
  costs the Foundation no gas per holder, and lets non-migrators claim
  on their own schedule — exactly ZIP-0002's proven design.
- **Pro-rata** is the only arithmetic that fits the make-whole into the
  50% while keeping the Foundation's 50% intact.
- **Unclaimed → Z Safe** matches the owner spec and avoids stranded
  supply.

## Security Considerations

- **Snapshot integrity:** freeze at a fixed BSC block; publish `snapshot.
  json` + `merkle_root` to IPFS; anyone can recompute from the public
  replay script.
- **Contract-address exclusion:** LP pools, routers, CEX hot wallets, and
  the V3 reserve EOA must be tagged and excluded (or handled per owner
  policy) so credits go to real users, not pools.
- **Claim contract:** standard Merkle-airdrop risks — double-claim
  guarded by `claimed[]`; reentrancy-safe transfer; owner (DAO Safe) is
  the only party that can sweep, only after the window.
- **Staged:** no funds move until the execution gate clears and the owner
  signs. This ZIP authorizes no execution.

## References

- [ZIP-0035: ZOO Supply and the 50/50 Foundation Split](./zip-0035-zoo-supply-and-the-50-50-foundation-split.md)
- [ZIP-0036: Zoo DAO Safe & Zoo Z Safe](./zip-0036-zoo-dao-safe-and-foundation-ownership.md)
- [ZIP-0038: ZOO Token History Reconciliation](./zip-0038-zoo-token-history-reconciliation.md)
- [ZIP-0002: Genesis Airdrop](./zip-0002-genesis-airdrop-to-original-zoo-token-victims.md) — reference claim contract
- `~/work/zoo/token-holder-analysis/` — snapshot replay tooling

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
