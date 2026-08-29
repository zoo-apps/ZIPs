---
zip: 0035
title: "ZOO Supply and the 50/50 Foundation Split"
author: Zach Kelling (@zeekay), Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2026-07-02
requires: [16, 36]
tags: [tokenomics, zoo-token, foundation, dao, supply, canonical]
---
# ZIP-0035: ZOO Supply and the 50/50 Foundation Split

## Abstract

This ZIP is the **canonical** statement of the ZOO total supply and its
top-level allocation. It supersedes the conflicting supply figures in
ZIP-0016 (1B), ZIP-0002 (10B), and the retired dev genesis (10B), and
fixes the canonical total at the value **actually minted at the Zoo EVM
mainnet genesis (chainId 200200)**: **2,000,000,000,000 ZOO (2 trillion,
18 decimals)**. This preserves the Binance Smart Chain (BSC) ZOO supply
1:1 (see ZIP-0038 for the on-chain evidence).

The supply is split, mirroring Lux exactly:

- **50% → Zoo DAO Safe (the Zoo Labs Foundation's DAO)** = 1,000,000,000,000 ZOO.
- **50% → everything else**, distributed via the holder/burn migration
  (ZIP-0039) with the **remainder and all unclaimed balances → Zoo Z
  (Team) Safe**.

Both Safes are 1-of-1, owner `0x9011E888251AB053B7bD1cdB598Db4f9DEd94714`
at bootstrap (ZIP-0036).

## Motivation

Three prior documents disagree on the ZOO supply. Left unreconciled, the
migration (ZIP-0039), the Safe funding (ZIP-0036), and the LZOO
reconciliation (ZIP-0038) cannot be executed deterministically. This ZIP
picks the **single source of truth** — the on-chain genesis of the chain
the owner has mandated we preserve — and derives everything from it.

The Lux model is the template: the Lux DAO Safe holds 50% of LUX and the
Lux Foundation is governed by it; the Lux "Z" (team) Safe holds the rest.
Zoo adopts the identical shape so the two ecosystems are structurally
symmetric and auditable by the same tooling.

## Specification

### Canonical supply

```yaml
token: ZOO
decimals: 18
total_supply: 2_000_000_000_000            # 2 trillion ZOO
canonical_source: "Zoo EVM mainnet genesis, chainId 200200"
genesis_mint_to: "0x9011E888251AB053B7bD1cdB598Db4f9DEd94714"   # bootstrap owner
preserves: "BSC ZOO supply 1:1 (ZIP-0038)"
no_inflation_at_genesis: true              # emissions, if any, governed later by DAO
```

The full 2T is minted at genesis to the bootstrap owner `0x9011`. The Zoo
EVM genesis and its imported history (800-block RLP of the prior Zoo
mainnet, ZIP-0038 §3) **MUST be preserved** — no re-genesis. All
allocation below is achieved by **transfers/claim-contract funding from
`0x9011`**, not by rewriting genesis.

### Top-level split

| Tranche | Share | Amount (ZOO) | Destination | Controls |
|---|---|---|---|---|
| Foundation (DAO) | 50% | 1,000,000,000,000 | **Zoo DAO Safe** | Owns Zoo Labs Foundation (ZIP-0036) |
| Non-Foundation | 50% | 1,000,000,000,000 | Migration claim pool + **Zoo Z (Team) Safe** | Holder make-whole (ZIP-0039); remainder + unclaimed → Z Safe |

### Non-Foundation 50% — internal split (OWNER-GATED)

The non-Foundation 1,000,000,000,000 ZOO is further divided into:

```
non_foundation (1T) = migration_claim_pool (P)  +  team_permanent (1T − P)
unclaimed_from_P  ──────────────────────────────►  Zoo Z (Team) Safe
```

- **`P` (migration claim pool)** funds the make-whole claim contract for
  BSC + old-mainnet holders (ZIP-0039). Because the eligible snapshot sum
  (~2.14T peak, ZIP-0038 §4) **exceeds** the 1T available, claims are
  **pro-rata within `P`**, never nominal 1:1.
- **`team_permanent`** is the portion of the 50% the Team Safe keeps
  outright, independent of claims.
- **Unclaimed** balances in `P` after the claim window revert to the Zoo
  Z (Team) Safe.

> **FLAG (owner decision required):** the split of the 50% between
> `migration_claim_pool P` and `team_permanent` is **not** fixed by any
> existing document. The owner spec says only "50% Foundation; the rest
> minus holder/burn migrations → Z Safe; unclaimed → Z Safe." Two clean
> defaults, pick one:
>
> 1. **`P = 1T` (whole non-Foundation half is the claim pool):** maximizes
>    make-whole; team keeps only what holders leave unclaimed. Most
>    generous to migrants; team allocation is residual.
> 2. **`P = <owner value>` with `team_permanent = 1T − P` reserved
>    up-front:** team gets a guaranteed allocation; holders share `P`
>    pro-rata; unclaimed `P` still → Z Safe.
>
> This ZIP does not invent the number. Set `P` before executing ZIP-0039.

### Foundation ownership

The **Zoo DAO Safe** is the on-chain controller of the **Zoo Labs
Foundation** (501(c)(3)). The Foundation's on-chain assets, admin roles,
and upgrade authority are reassigned from `0x9011` to the Zoo DAO Safe
(staged in ZIP-0036). This mirrors Lux, where the Lux DAO Safe governs the
Lux Foundation.

## Rationale

- **Why 2T and not 1B/10B:** the only figure that is *on-chain and
  mandated-preserved* is the 200200 genesis mint (2T), which also equals
  the BSC ZOO supply. Choosing anything else would require re-genesis
  (forbidden) or a redenomination that breaks the 1:1 BSC preservation.
  The legacy 1B/10B numbers were pre-launch drafts; they are superseded.
- **Why 50/50:** direct mirror of Lux. Simple, symmetric, auditable.
- **Why pro-rata migration:** the honest eligible sum exceeds the
  available half; a nominal 1:1 credit is arithmetically impossible
  without consuming the Foundation's half. Pro-rata makes every holder
  whole *proportionally* and is exactly the mechanism ZIP-0002 already
  used (proportion × new supply).

## Security Considerations

- Genesis is preserved; no re-genesis risk to the imported 800-block
  history (ZIP-0038 §3).
- All money moves are **staged and owner-gated** (ZIP-0036, ZIP-0039);
  this ZIP authorizes no execution.
- Both Safes bootstrap 1-of-1 on a single owner key — a deliberate
  single point of control at launch, remediated by onboarding real
  signers via `safe.lux.network` immediately post-launch (ZIP-0036
  §"Signer onboarding").

## References

- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md) — superseded on supply figure
- [ZIP-0036: Zoo DAO Safe & Zoo Z Safe — Foundation Ownership](./zip-0036-zoo-dao-safe-and-foundation-ownership.md)
- [ZIP-0037: Azorius Sub-DAO Structure](./zip-0037-azorius-sub-dao-structure.md)
- [ZIP-0038: ZOO Token History Reconciliation](./zip-0038-zoo-token-history-reconciliation.md)
- [ZIP-0039: ZOO Migration and Re-Mint Mechanism](./zip-0039-zoo-migration-and-re-mint-mechanism.md)
- [ZIP-0002: Genesis Airdrop](./zip-0002-genesis-airdrop-to-original-zoo-token-victims.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
