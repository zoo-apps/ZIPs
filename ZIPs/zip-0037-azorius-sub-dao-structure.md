---
zip: 0037
title: "Azorius Sub-DAO Structure"
author: Zach Kelling (@zeekay), Zoo Labs Foundation
type: Standards Track
category: Governance
status: Draft
created: 2026-07-02
requires: ZIP-0036
references: ZIP-0017, LP (Lux) DAO Governance Framework, Zodiac, Azorius (Fractal), Hats Protocol
tags: [dao, sub-dao, azorius, zodiac, governance, holographic]
---

# ZIP-0037: Azorius Sub-DAO Structure

## Abstract

This ZIP defines Zoo's **sub-DAO topology**: the Zoo DAO Safe (ZIP-0036)
is the parent ("meta-DAO"); specialized **Azorius sub-DAOs** attach as
Zodiac modules on child Safes, each owning a scoped budget and mandate.
It concretizes the "holographic consensus DAO" sketch already in ZIP-0017
(2025-12-15 update) using the exact Azorius/Zodiac/Safe stack Lux uses, so
the two ecosystems share governance tooling and audits.

## Motivation

The 2021 whitepaper's ZOO DAO (XP levels, KEEPER "betting", quests, DIS/
KYC-gated voting) and ZIP-0017's holographic update both call for
**nested, self-similar governance**: sub-DAOs for per-LLM chains,
research verticals, and regional chapters that "inherit the meta-DAO
topology and are structurally a small copy of the whole." That needs a
concrete contract framework. Azorius (Zodiac module on a Safe) is that
framework, and it is what Lux already runs — so Zoo mirrors it.

## Specification

### Topology

```
                    Zoo DAO Safe  (parent / meta-DAO, 50% of ZOO)
                    owns Zoo Labs Foundation
                          │  (Zodiac: enables child modules,
                          │   funds child Safes, can freeze)
        ┌─────────────────┼─────────────────┬───────────────────┐
        ▼                 ▼                 ▼                   ▼
  Conservation        Research          Per-LLM-Chain       Regional
   Sub-DAO            (DeSci)            Sub-DAO(s)          Chapter
  (child Safe +       Sub-DAO           (child Safe +        Sub-DAO(s)
   Azorius module)    (child Safe +      Azorius)            (child Safe +
                       Azorius)                               Azorius)
```

Each sub-DAO = **a child Gnosis Safe + a ModuleAzorius instance + a
voting strategy**. The parent Zoo DAO Safe:

- funds each child Safe from the Foundation half,
- holds the **freeze / veto** authority over children (Zodiac guard),
- ratifies cross-sub-DAO (meta) proposals.

This is the "holographic" property: every child is a small copy of the
parent's (Safe + Azorius + strategy) shape.

### Azorius components (mirrors Lux)

| Component | Role |
|---|---|
| **Gnosis Safe** | Treasury + execution surface (per DAO / sub-DAO) |
| **ModuleAzorius** (Zodiac) | Proposal manager: submission, timelock, execution window, partial execution |
| **Voting strategy** | Pluggable: token-weighted, or the ZIP-0017 weighted formula |
| **Zodiac guard / freeze** | Parent can freeze a child sub-DAO |
| **Hats Protocol (optional)** | Role hats (Top Hat = Zoo DAO Safe) for proposer/executor roles |

The proposal lifecycle (submission → voting → timelock → execution
window → `execTransactionFromModule`) and **partial execution** are taken
verbatim from the Lux Azorius framework — no Zoo-specific fork of the
module contracts.

### Voting strategy (from ZIP-0017)

Sub-DAOs default to the ZIP-0017 weighted strategy, bounding plutocracy:

```
weight(p) = α·advocacy + β·involvement + γ·contribution + δ·token_stake
α=0.20  β=0.30  γ=0.40  δ=0.10   (δ token-stake capped at 10%)
```

A sub-DAO MAY instead use pure token-weighted Azorius (LinearERC20Voting)
for treasury-only mandates. The strategy is a per-sub-DAO parameter set at
creation, governed by the parent.

### Initial sub-DAOs (proposed)

Traceable to whitepaper + existing ZIPs; **the exact set and budgets are
owner/DAO-gated**, not fixed here:

1. **Conservation Sub-DAO** — the 501(c)(3) conservation mission
   (whitepaper "Conservation x Education"; ZIP-0016 conservation fund;
   ZIP-0104 research-funding treasury).
2. **Research / DeSci Sub-DAO** — `papers/zoo-dao-governance` DeSci
   funding model (VitaDAO/Molecule-style).
3. **Per-LLM-Chain Sub-DAO(s)** — one per Zoo AI model chain
   (`papers/zoo-per-llm-chains`; ZIP-0017 "per-LLM chain").
4. **Regional Chapter Sub-DAO(s)** — geographic chapters (ZIP-0017
   "regional chapter"; whitepaper regional ambassadors).

> **FLAG:** initial sub-DAO budgets are carved from the Foundation's 50%
> by DAO vote; this ZIP does not assign amounts.

### Creation (STAGED — owner/DAO-gated)

```
# For each sub-DAO, executed by the Zoo DAO Safe (post signer onboarding):
1. deploy child Safe (Zodiac-ready)
2. deploy ModuleAzorius + voting strategy, enable module on child Safe
3. set Zoo DAO Safe as freeze/guard authority (parent control)
4. fund child Safe from Foundation half (DAO-voted budget)
5. (optional) mint role Hats; Top Hat = Zoo DAO Safe
```

No sub-DAO is created at bootstrap; creation follows DAO signer
onboarding (ZIP-0036).

## Rationale

- **Reuse, don't fork:** Zoo uses the *same* Azorius/Zodiac/Safe contracts
  as Lux. One framework, audited once, two ecosystems.
- **Self-similarity = composability:** every sub-DAO is the same shape, so
  a new vertical is a template instantiation, not a bespoke build.
- **Parent freeze = safety:** the meta-DAO can halt a captured or
  compromised sub-DAO without touching the others.

## Security Considerations

- **Freeze authority** must rest only with the parent Zoo DAO Safe; a
  misconfigured guard that lets a child self-liberate breaks the model.
- **Budget isolation:** a sub-DAO can only spend its funded child-Safe
  balance; it cannot draw on the parent or siblings.
- **Strategy pinning:** voting power is snapshotted at proposal creation
  (flash-loan resistance), inherited from Azorius.

## References

- [ZIP-0017: DAO Governance Framework](./zip-0017-dao-governance-framework.md)
- [ZIP-0036: Zoo DAO Safe & Zoo Z Safe](./zip-0036-zoo-dao-safe-and-foundation-ownership.md)
- [ZIP-0104: Research Funding DAO Treasury](./zip-0104-research-funding-dao-treasury.md)
- `papers/zoo-dao-governance`, `papers/zoo-per-llm-chains`
- Lux DAO Governance Framework (Azorius framework architecture); Zodiac; Hats Protocol

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
