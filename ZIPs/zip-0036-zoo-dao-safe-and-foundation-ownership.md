---
zip: 0036
title: "Zoo DAO Safe & Zoo Z Safe — Foundation Ownership"
author: Zoo Labs Foundation (@zeekay), Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2026-07-02
requires: [35, 37]
tags: [safe, dao, foundation, ownership, multisig, treasury, staged]
---
# ZIP-0036: Zoo DAO Safe & Zoo Z Safe — Foundation Ownership

## Abstract

Zoo deploys **two Gnosis Safes on Zoo EVM (chainId 200200)**, mirroring
Lux exactly:

- **Zoo DAO Safe** — the Zoo Labs Foundation's DAO. Holds **50% of ZOO**
  (ZIP-0035) and is the **on-chain owner/controller of the Zoo Labs
  Foundation**.
- **Zoo Z (Team) Safe** — holds the non-Foundation remainder and receives
  all **unclaimed** migration balances (ZIP-0039).

Both Safes are **1-of-1 with owner
`0x9011E888251AB053B7bD1cdB598Db4f9DEd94714`** at bootstrap. Real signers
are onboarded post-launch via `safe.lux.network`. This ZIP stages the Safe
funding and the Foundation-ownership reassignment; **it executes
nothing** — every move is owner-gated.

## Motivation

The 50/50 split (ZIP-0035) needs concrete on-chain custodians. Lux uses a
DAO Safe (Foundation governance + 50%) and a Z/Team Safe (the rest). Zoo
adopts the identical two-Safe topology so:

1. The Foundation's assets are DAO-governed, not owner-held.
2. Team and Foundation funds are cleanly separated (separation of
   concerns).
3. The same Safe/Zodiac/Azorius tooling audits both ecosystems.

## Specification

### Safe addresses

Both Safes are deployed by the multi-org Safe-deploy coordinator on Zoo
EVM 200200, 1-of-1, owner `0x9011`. They are Zodiac-compatible so Azorius
sub-DAOs (ZIP-0037) can attach as modules.

```yaml
chain: zoo-evm-mainnet
chainId: 200200
status: STAGED           # Zoo EVM not yet bootstrapped (crash-loop); repaired by consensus v1.32.11
zoo_dao_safe:            "0x5232991515a671f745d3530A996E3503783E2939"   # Foundation DAO, 50% ZOO
zoo_z_safe:              "0x3Be393fb0cDFc9BC5a11fDb4F1eA6bD7e4C815B5"   # Team, non-Foundation remainder
zoo_foundation_timelock: "0x45389804C25b3575b710474a948128C69e5B423f"  # OZ TimelockController, minDelay 86400
bootstrap_owner:         "0x9011E888251AB053B7bD1cdB598Db4f9DEd94714"   # 1/1 owner of both Safes at bootstrap
threshold: 1                                                            # 1-of-1 at bootstrap
pattern: "SafeL2 v1.5.0 + SafeProxyFactory + CompatibilityFallbackHandler + MultiSendCallOnly"
proxy_create2: "createProxyWithNonce, salt = keccak(saltString)"
predict_verify: "~/work/lux/standard/script/predict_org_safes.sh (proven: reproduces live Lux DAO/Team)"
deploy: "~/work/lux/standard/script/deploy_org_safes.sh (MODE=full, EXECUTE=yes)"
record: "~/work/lux/standard/deployments/org-safes/zoo-200200.json"
manifest: "~/work/zoo/universe/manifests/safes.yaml"
```

These addresses are **CREATE2-deterministic**, predicted by the shared
multi-org Safe pipeline (`predict_org_safes.sh`, proven to reproduce the
live Lux DAO/Team Safes). They are valid **only if the clean-nonce
deployer `0x9011` deploys the shared singleton/factory/handler/multisend
set** exactly as recorded in the multi-org topology; the deploy is
**additive** (new contracts, no genesis funds moved) so it does not
violate the preserve-genesis rule.

The **Zoo Labs Foundation** is realized on chain as an **OpenZeppelin
`TimelockController`** (`0x45389804…423f`, `minDelay = 86400s`), with the
**Zoo DAO Safe as proposer + canceller** and open execution — identical to
the Lux Foundation timelock. "Zoo DAO Safe owns the Foundation" = the DAO
Safe is the sole proposer/canceller of the Foundation timelock.

### Funding (STAGED — owner-gated)

From the genesis owner `0x9011` (holder of the full 2T, ZIP-0035):

```
# Phase 1 — Foundation half
transfer  1_000_000_000_000 ZOO   0x9011 ──► Zoo DAO Safe

# Phase 2 — non-Foundation half
transfer  P                  ZOO   0x9011 ──► ZooMigrationClaim (ZIP-0039)
transfer  (1_000_000_000_000 − P) 0x9011 ──► Zoo Z (Team) Safe
# unclaimed from P, after claim window ──► Zoo Z (Team) Safe
```

`P` is the owner-gated migration-pool size (ZIP-0035). All three
transfers are staged as a single owner-signed batch; nothing is
auto-executed.

### Foundation ownership reassignment (STAGED)

The **Zoo DAO Safe becomes the owner of the Zoo Labs Foundation**. On
chain this means every Foundation-controlled contract's admin/owner/
upgrade role currently held by `0x9011` (or a legacy Foundation multisig)
is transferred to the Zoo DAO Safe:

```yaml
reassign_to: "0x5232991515a671f745d3530A996E3503783E2939"   # Zoo DAO Safe
foundation_timelock: "0x45389804C25b3575b710474a948128C69e5B423f"  # DAO Safe = proposer+canceller
targets:            # enumerate real Foundation-owned contracts before execution
  - ZOO token admin / minter role (if any post-genesis mint authority exists)
  - ZooMigrationClaim owner (ZIP-0039) — so the DAO governs claim params & sweeps
  - Foundation treasury / grant contracts
  - Any Ownable/AccessControl contract currently owned by 0x9011 on 200200
method:
  - Ownable:        transferOwnership(ZOO_DAO_SAFE)
  - AccessControl:  grantRole(DEFAULT_ADMIN_ROLE, ZOO_DAO_SAFE); renounce from 0x9011
  - Proxy admin:    changeProxyAdmin / set to ZOO_DAO_SAFE
off_chain:
  - 501(c)(3) governing documents reference the Zoo DAO Safe as the
    on-chain governance body (legal, out of scope for on-chain execution)
```

> **FLAG:** the exact list of Foundation-owned contracts on 200200 must be
> enumerated from the live chain before execution (this ZIP does not
> fabricate the set). The migration claim contract (ZIP-0039) does not yet
> exist; its owner is set to the Zoo DAO Safe at deployment.

### Signer onboarding (post-launch)

1-of-1 on a single key is a launch expedient, not the end state.
Immediately post-launch, via `safe.lux.network`:

```
addOwnerWithThreshold(signer_i, new_threshold)   # for each real signer
# converge to an M-of-N appropriate to Foundation governance
# (recommend ≥ 3-of-5 for the DAO Safe, matching ZIP-0016 conservation-multisig guidance)
```

This is a normal Safe owner-management flow; no contract redeploy.

## Rationale

- **Two Safes, not one:** separation of concerns — Foundation vs team
  funds never commingle.
- **1-of-1 bootstrap:** lets the owner deploy, fund, and wire everything
  deterministically before distributing signing authority; identical to
  the Lux bootstrap.
- **DAO Safe owns Foundation:** puts the 501(c)(3)'s on-chain surface
  under DAO governance (Azorius, ZIP-0037), not a personal key.

## Security Considerations

- **Single-key window:** between bootstrap and signer onboarding, `0x9011`
  is a single point of failure. Onboard real signers *before* funding the
  DAO Safe with the full 1T if operationally feasible, or immediately
  after. Track as a launch-blocking checklist item.
- **Address confusion:** funding the wrong (placeholder) address would be
  unrecoverable. Execution is gated on real addresses replacing the
  `<...>` placeholders and an owner double-check.
- **Ownership renounce ordering:** when reassigning `AccessControl` roles,
  grant to the DAO Safe and verify before renouncing from `0x9011`, never
  the reverse (avoid orphaning admin).

## References

- [ZIP-0035: ZOO Supply and the 50/50 Foundation Split](./zip-0035-zoo-supply-and-the-50-50-foundation-split.md)
- [ZIP-0037: Azorius Sub-DAO Structure](./zip-0037-azorius-sub-dao-structure.md)
- [ZIP-0039: ZOO Migration and Re-Mint Mechanism](./zip-0039-zoo-migration-and-re-mint-mechanism.md)
- [ZIP-0017: DAO Governance Framework](./zip-0017-dao-governance-framework.md)
- Lux DAO Governance Framework (Azorius / Zodiac / Safe); `safe.lux.network`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
