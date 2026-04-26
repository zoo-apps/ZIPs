---
zip: 34
title: "Zoo XP & Quests Protocol"
description: "Experience-point system, quest engine, level progression, and weighted DAO governance integration"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 11 (Zoo DAO — XP, KEEPER, Quests)"
follow-on: [zoo-dao-reputation-system]
created: 2025-12-15
tags: [xp, quests, gamification, dao, governance]
cross-refs:
  lux: [LP-133]
  zoo-zips: [ZIP-0017, ZIP-0026, ZIP-0033]
---

# ZIP-0034: Zoo XP & Quests Protocol

## Abstract

Formalizes the XP and Quest systems described in §11 of the
October 31, 2021 founder whitepaper. XP is soulbound (tied to the
holder's DID under ZIP-0033). Quests are on-chain or off-chain tasks
with verifiable completion that mint XP and (optionally) KEEPER. Level
follows the canonical 2021 formula: `level = (XP + 500) / 300`. Level
gates eligibility for higher-tier governance under the weighted-vote
formula in the 2021 paper §28 and ZIP-0017.

## Motivation

The 2021 paper says quests vary in complexity, "with higher-level
tasks requiring more substantial contributions to the community and
yielding more XP." Without a formalized quest contract, this remains
a marketing concept. This ZIP makes it executable.

## Specification

### Level Formula (canonical 2021 formula)

```
level(xp) = (xp + 500) / 300       // integer division
```

| Level | XP threshold | Privileges (via ZIP-0017) |
|---|---|---|
| 1 | 0 | Vote on Parameter Change proposals |
| 2 | 100 | Submit Parameter Change proposals |
| 3 | 400 | Vote on Treasury Spend |
| 5 | 1000 | Submit Treasury Spend; vote on emergency proposals |
| 10 | 2500 | Submit non-financial proposals; sit on review committees |
| 20 | 5500 | Sit on multisig advisory; chair sub-DAO |
| 50 | ~14500 | Foundation board nomination eligibility |

### Quest Object

```solidity
struct Quest {
    bytes32 id;
    string title;
    string descriptor;       // off-chain JSON
    uint256 xpReward;
    uint256 keeperReward;    // 0 if XP-only
    uint8 minLevel;          // gate
    uint64 deadline;         // 0 = no deadline
    bytes32 verificationKind; // "ON_CHAIN" | "ATTESTATION" | "MULTISIG"
    address verifier;        // contract or attester
}
```

### Quest Lifecycle

1. **Author**: Quest is authored under ZIP-0017 (DAO Parameter Change
   for the Quest Registry, level ≥ 5 to author).
2. **Listed**: Live in `QuestRegistry` on Zoo L1.
3. **Accepted**: Member calls `accept(questId)`; contract records
   `acceptedAt`. Gate: DID Tier ≥ Quest's required tier; level ≥
   `minLevel`.
4. **Completed**: Verifier emits `QuestCompletion` attestation
   referencing the member's DID.
5. **Claimed**: Member calls `claim(questId)`; contract mints XP
   (soulbound to DID) + KEEPER (transferable).

### Quest Categories (initial)

| Category | Examples | XP range |
|---|---|---|
| Education | "Complete the Zoo Tutorial," "Answer 10 species-ID quizzes" | 10–100 |
| Conservation | "Donate to Foundation treasury," "Submit citizen-science observation (ZIP-0602)" | 50–500 |
| Code | "Merge a PR to a Zoo OSS repo," "Audit a contract" | 100–1000 |
| DAO | "Vote on N proposals," "Author an accepted ZIP" | 50–2000 |
| Research | "Reproduce a paper attestation (ZIP-0606)," "Peer-review (ZIP-0604)" | 200–2000 |
| AR / Spatial | "Visit a real-world conservation site (geo-attest)," "Spot a species in AR" | 50–500 |

### Verification Modes

- **ON_CHAIN**: Verifier is a contract reading event logs. Trustless.
- **ATTESTATION**: TEE-attested oracle through A-Chain (LP-134).
- **MULTISIG**: 2-of-3 quest-curator multisig signs completion. Used
  for off-chain tasks lacking machine-verifiable evidence.

### Anti-Cheating

- Per-quest cap on completions per DID per epoch.
- Anti-bot: minimum DID Tier 1 (KYC) for KEEPER-bearing quests.
- Drift detection: ZIP-0026 reputation system flags anomalous
  completion velocity for review.
- Slashing: confirmed cheating burns the cheating DID's XP and removes
  level for one year.

### Governance Coupling (Weighted Voting)

Per the 2021 paper §28 and ZIP-0017, voting weight is

```
weight(p) = α·a_p + β·i_p + γ·c_p + δ·s_p
```

with default `(α, β, γ, δ) = (0.20, 0.30, 0.40, 0.10)` and token
stake `s_p` capped at 10% of weight. Mapping:

- `i_p` (involvement) — derived from XP / max(XP per epoch).
- `c_p` (contribution) — derived from quest completion in the
  contribution category, with category-specific multipliers.
- `a_p` (advocacy) — derived from social attestations on
  attestation-rooted platforms.
- `s_p` (stake) — KEEPER + $ZOO time-weighted balance.

Higher level acts as a *gate* (proposal eligibility, committee seats);
weighted vote acts as the *tally*. The two systems are independent
levers, exactly as the 2021 paper described.

## Reference Implementation

Solidity contracts: `contracts/src/governance/QuestRegistry.sol`,
`contracts/src/governance/XPManager.sol` (to be implemented). Both
inherit from a shared `DIDGated` base under ZIP-0033.

## Backwards Compatibility

Pre-2025 community contributions from Discord, GitHub, and the legacy
DAO forum are migrated via signed snapshot at genesis. Snapshot is
auditable and ratified by ZIP-0017 vote prior to issuance.

## Activation

Quest Registry and XP Manager live with Zoo L1 genesis on 2025-12-25.
Initial quest catalogue (the "Founders' Quests") is seeded by Zoo Labs
Foundation board.

## References

- 2021 Whitepaper §11 (Zoo DAO — XP, quests, KEEPER, level formula).
- 2021 Whitepaper §28 (2025 update — weighted voting axes).
- ZIP-0017 (DAO Governance Framework).
- ZIP-0026 (Ecosystem Reputation System).
- ZIP-0033 (Zoo DID).
- Lux LP-133 (Quasar-Native App Stack).
