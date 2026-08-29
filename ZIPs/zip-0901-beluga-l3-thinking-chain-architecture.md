---
zip: 901
title: "Beluga L3 Thinking-Chain Architecture"
description: "Beluga (BLG), Zoo's L3, as the first Thinking Chain: a deterministic chain plus a verifiable cognitive layer, running Tier-1 in-consensus int8 inference and consuming Tier-2 off-chain provider-quorum Proof-of-Thought receipts, under binding constitutional rules"
author: "Zoo Labs Foundation"
status: Draft
type: "Standards Track"
category: "Core"
created: 2026-06-21
requires: [15, 804, 902]
---
# ZIP-0901: Beluga L3 Thinking-Chain Architecture

## Abstract

Beluga (ticker **BLG**) is Zoo's Layer-3 app-chain and the first **Thinking
Chain** prototype in the Lux/Zoo/Hanzo ecosystem. A Thinking Chain is a
*deterministic chain plus a verifiable cognitive layer*: thought informs state
but never mutates consensus directly. Beluga runs two inference tiers under one
chain. **Tier 1** is deterministic int8 in-consensus inference — small models
(zen-nano, a Qwen3-0.6B port) executed byte-identically by every validator
through the `0x0303` inference precompile, no GPU, suitable for in-block
governance classifiers and embeddings. **Tier 2** is large-model inference run
*off-chain* by a bonded provider quorum on the Lux A-Chain (AIVM), settled back
to Beluga as **Proof-of-Thought (PoT) receipts** (ZIP-0902). Beluga's contract
layer (C-role) reaches A-Chain only through the `aivmbridge` precompile, never
via a live query. Zoo governance (G-role) consumes Governance Thought Receipts
under defined human-in-the-loop levels.

This ZIP is the normative specification for the Beluga chain. The economic
design (BLG supply, inference pool, training bounties, DEX liquidity) is
specified in the *Beluga L3 Whitepaper* (Zoo Labs Foundation) and is **not**
restated here. This ZIP specifies chain position, the two tiers, the bridge law,
quorum parameters, the constitutional rules as binding, governance integration,
and the concrete precompile/VM substrate.

## Motivation

Putting "AI in consensus" naively breaks the one property a chain must keep:
determinism. A live LLM call is nondeterministic across hardware, nondeterministic
across model versions, and unbounded in latency and cost — any of which forks the
network. Prior art either (a) runs the model fully off-chain and trusts an oracle,
or (b) runs a tiny model on-chain and is stuck with toy capability. Neither gives
a chain that can *reason* and still *agree*.

The Thinking Chain pattern resolves this by separating two things that are usually
braided: **what the cognition produces** and **when the chain is allowed to act on
it**. Cognition produces *structured outputs* (a class label, a vote+confidence, an
embedding, a receipt) — never prose used as a state input. The chain acts only on
outputs that are *already committed and certified*. Small, cheap, fully
deterministic cognition (Tier 1) can run in-consensus because every validator
computes the identical bytes. Large cognition (Tier 2) runs off-chain and returns
a *settlement object* (a PoT receipt) whose validity is checkable by re-deriving a
hash, not by re-running a model.

Beluga is the concrete instantiation. Zoo needs in-block governance classifiers
(is this proposal spam? which category? is this transfer anomalous?) and
large-model judgments (summarize a 200-page impact report; rank grant
applications) that settle into governance decisions with auditable provenance.
Beluga delivers both on one chain without ever making consensus depend on a live
query.

This ZIP is one of four sibling artifacts authored in parallel, sharing one canon:

- **Lux** — *Thinking Chains* (Lux Proposal, the L0/consensus-layer primitive and
  the bridge precompiles).
- **Hanzo** — *Cognitive Sidecar / Hanzo Engine Provider* (Hanzo Improvement
  Proposal, the off-chain Tier-2 provider runtime and ModelSpec registration).
- **Zoo** — *Thinking Chains* (Zoo paper, the conceptual treatment and
  Subsampled Cognitive Consensus analysis).
- **Zoo** — *Proof-of-Thought Receipts on Zoo* (ZIP-0902, the settlement object
  this chain consumes).

Beluga is the **first prototype** that wires all four together.

## Specification

The keywords MUST, MUST NOT, SHALL, SHOULD, MAY are used per RFC 2119.

### 1. Chain position

Beluga is **Zoo's L3**: an application-specific chain with its own block
production, state, and gas token (BLG), settling into Zoo and through Zoo into
Lux. Validators that run the Zoo node binary (`zood`) validate Beluga blocks via
the same process used for other Zoo app-chains; **no new validator set and no new
node binary are introduced** by this ZIP.

```
Lux Network (L0)   — Quasar consensus, P-Chain validators, Warp messaging
   └── Zoo (L1/L2) — AI-research chain, ZOO gas; settles into Lux (ZIP-0804/0015)
         └── Beluga (L3) — Thinking Chain, BLG gas; the subject of this ZIP
```

Chain parameters (BLG economics per the Beluga L3 Whitepaper):

| Parameter | Value |
|-----------|-------|
| Chain ID | 420420 |
| Gas token | BLG (18 decimals) |
| Block time | 500 ms |
| Settlement | Zoo (Warp/Teleport), thence Lux |
| Validator set | inherited from Zoo |
| Cognitive layer | Tier 1 (in-consensus) + Tier 2 (A-Chain PoT) |

### 2. The Thinking Chain definition (binding)

A **Thinking Chain** is the pair *(deterministic chain, verifiable cognitive
layer)* such that:

1. The state transition function is deterministic and reproducible by any
   validator from committed inputs alone.
2. Cognition (Tier 1 or Tier 2) MAY produce inputs to the state transition, but
   only *structured, hash-addressed* outputs that are themselves committed.
3. No state transition reads a live, uncommitted cognitive result.

Thought *informs* state; thought never *is* the consensus mechanism.

### 3. Two inference tiers

#### 3.1 Tier 1 — deterministic in-consensus inference

Tier 1 runs a small model byte-identically inside block execution.

- **Substrate**: the `0x0303` inference precompile — a pure-Go (CGO=0) int8
  transformer evaluator (Reference Implementation §10).
- **Model**: zen-nano (Qwen3-0.6B port), the Beluga "brain", registered in the
  ModelSpec registry by weight-commitment hash (§6).
- **Determinism**: int8 quantization with fixed rounding; every validator
  computes the identical `output_hash` / `embedding_hash`. No floating-point
  nondeterminism, no GPU.
- **Use on Beluga**: in-block governance classifiers (proposal categorization,
  spam/abuse gating), anomaly flags on transfers, and `7680`-dim-class embeddings
  for on-chain semantic routing. These outputs are consensus-safe inputs to the
  state transition because they are reproducible.
- **Bounds**: Tier-1 calls are gas-metered and depth/budget-bounded
  (constitutional rule C8). A Tier-1 call MUST NOT recursively invoke Tier 2
  within the same transaction.

Tier 1 is the *only* inference that may directly produce a state-transition input,
precisely because it is deterministic.

#### 3.2 Tier 2 — off-chain provider quorum

Tier 2 runs large models that cannot be made byte-identical on-chain.

- **Where**: off-chain, on the Lux **A-Chain (AIVM)** provider set — a bonded
  registry of operators running the Hanzo Engine provider runtime (Reference
  Implementation §10).
- **How it reaches Beluga**: Beluga contracts (C-role) call the `aivmbridge`
  precompile to *submit an intent* (Pattern A) and later to *verify a committed
  receipt* (Pattern B). Beluga consensus never reads or mutates A-Chain live.
- **Settlement**: the quorum's structured result is settled as a
  **Proof-of-Thought receipt** committed under an A-Chain `receipt_root`; Beluga
  imports it by Merkle proof against that committed root (ZIP-0902).
- **Use on Beluga**: large-model governance judgments (long-document
  summarization, grant ranking, multi-criteria proposal analysis) and any task
  exceeding Tier-1 capability. The *structured* output (e.g. a vote+confidence
  bucket, a ranked list of IDs, a class label) settles; the model's prose
  rationale is **evidence only**, hash-addressed, never a consensus input.

### 4. The Bridge Law (binding)

> **C-Chain consensus state MUST NOT depend on a live query whose result is not
> already committed and certified.**

Here "C-Chain" denotes the contract/escrow/bridge execution domain (the C-role;
on Beluga, its EVM contract layer). The law is enforced by a two-pattern bridge,
never a synchronous cross-chain read:

- **Pattern A — submit deterministic intent.** A Beluga contract calls
  `aivmbridge.SubmitInferenceIntent(...)`. This stages an intent in a
  deterministic outbox keyed by `intent_id` (§5). It performs **no** A-Chain read
  and **no** A-Chain mutation; it only records, under Beluga consensus, that an
  intent exists. The A-Chain later imports this committed intent under its own
  consensus.
- **Pattern B — verify committed receipt.** Once the A-Chain quorum settles and
  exports a `receipt_root`, a Beluga contract calls
  `aivmbridge.VerifyInferenceReceipt(receipt, proof)`, which checks a
  keccak/Merkle proof of `receipt_hash` against the **committed** `receipt_root`.
  Only on a valid proof may downstream state change (release escrow, record a
  governance decision, mint provenance).

The law's slogan, identical across all four artifacts:

> **ZAP transports; proofs commit; receipts settle; VMs execute.**

A Beluga transaction MUST NOT block on, or branch on, an uncommitted A-Chain
value. Intent submission and receipt verification are separate transactions in
separate blocks.

### 5. Wire identifiers

The intent identifier binds an inference request to its originating call so the
receipt is replay-protected and non-malleable:

```
intent_id = keccak(
    DOMAIN_INTENT || c_chain_id || a_chain_id || c_tx_hash || call_index ||
    caller || model_spec_hash || prompt_hash || N || threshold || fee )
```

The settled receipt and its hash are specified normatively in **ZIP-0902**
(`AInferenceReceipt{...}`, `receipt_hash = keccak(DOMAIN_RECEIPT || canonical
fixed-width)`). Beluga uses ZIP-0902 receipts unchanged; this ZIP does not
redefine them.

### 6. Quorum parameters (Tier 2)

Beluga's Tier-2 requests use the canonical quorum defaults (full normative
treatment in ZIP-0902):

- **N = 5** providers per task; **threshold = 3** agreeing structured outputs
  (**4** for high-value tasks, e.g. treasury-affecting governance).
- **Eligible-set margin E ≥ N + max(2, N/2)** — the beacon selects from a pool
  strictly larger than the committee so withholders cannot deterministically pin
  membership.
- **Deterministic beacon selection** of the committee from the eligible set
  (replayable by any verifier).
- **MinProviderBond** enforced; **slash withholders, NOT honest dissenters** — a
  provider whose structured output is a minority-but-honest answer keeps its bond;
  a provider that fails to answer is slashed. Agreement is over **structured
  outputs only**, never prose.

### 7. Subsampled Cognitive Consensus

Confidence in a Tier-2 judgment is established by **Subsampled Cognitive
Consensus**: repeated random committee sampling over **structured outputs**
(class labels, vote+confidence buckets, embeddings/hashes), never over prose. The
preserved consensus object for a governance judgment is the preimage
`{vote, confidence_bucket}`; the rationale is excluded from the consensus preimage
and retained as hash-addressed evidence. The full confidence/dissent distribution
is preserved (constitutional rule C9), not collapsed to a single label.

### 8. Constitutional rules (binding)

Every Beluga client MUST enforce the following. A block violating any rule is
invalid.

- **C1 — Deterministic consensus.** The state transition is deterministic and
  reproducible from committed inputs alone.
- **C2 — No live thought in state transition.** No state transition reads a live,
  uncommitted inference result (the Bridge Law, §4).
- **C3 — Cross-chain effects require committed proofs.** Any effect derived from
  another chain's cognition requires a verified proof against a committed root
  (Pattern B).
- **C4 — Structured outputs only.** Consensus inputs are structured and
  hash-addressed. Prose is evidence only, never a consensus input.
- **C5 — Bounded recursion.** Cognitive calls are bounded by recursion depth and
  resource budget; unbounded or self-triggering chains of thought are rejected.
- **C6 — Replay-protected receipts.** Receipts are bound to `intent_id` and a
  settlement height; a receipt is consumable at most once.
- **C7 — Authority expansion gated.** Expanding the chain's autonomy (raising a
  human-loop level, §9; widening a model's permitted actions) requires a
  human/DAO decision plus timelock.
- **C8 — Bounded cognition budget.** Tier-1 in-consensus inference is
  gas-metered and depth-bounded; Tier-2 requests carry an explicit fee and
  committee budget.
- **C9 — Preserve dissent.** The confidence and dissent distribution of a
  cognitive judgment is preserved on-chain, not collapsed to a single value.
- **C10 — Governance models registered.** Any model used for a governance
  decision MUST be ModelSpec-registered by weight-commitment hash; an
  unregistered model cannot produce a consensus input.
- **C11 — Inspectable without an LLM.** Every committed cognitive input is
  verifiable by re-deriving a hash or checking a Merkle proof — a validator or
  auditor can confirm validity **without running any model**.

These restate the shared canon verbatim and are binding on Beluga.

### 9. Governance integration and human-in-the-loop levels

Zoo governance (the **G-role**) consumes **Governance Thought Receipts**: PoT
receipts (ZIP-0902) whose structured output is a governance preimage
`{vote, confidence_bucket}`. A Beluga governance action records the receipt by
Pattern B and acts on the structured field only.

Autonomy is bounded by an explicit **human-in-the-loop level** attached to each
governance pathway. Raising a level requires C7 (human/DAO + timelock).

| Level | Name | Meaning on Beluga |
|-------|------|-------------------|
| 0 | Observe | Cognition is recorded as evidence; no on-chain effect. |
| 1 | Recommend | A receipt produces an on-chain recommendation; a human/DAO must enact. |
| 2 | Bounded local autonomy | The chain may act within a pre-approved, bounded local policy (e.g. auto-categorize, auto-flag) with no external value movement. |
| 3 | Policy-gated tx | The chain may execute a transaction that satisfies a registered policy predicate (e.g. route a sub-threshold grant). |
| 4 | Human approval | A receipt triggers a transaction that requires explicit human approval before execution. |
| 5 | Constitutional governance | Changes to the constitution/levels themselves — DAO vote + timelock, never autonomous. |

Tier-1 classifiers default to Level 2 (bounded local autonomy: classification and
flagging carry no value movement). Tier-2 governance judgments default to Level 1
(recommend) and MAY be raised to Level 3 for registered, bounded policies under
C7.

### 10. Reference Implementation (the Beluga substrate)

Beluga is built on already-implemented Lux and Hanzo packages. This ZIP does not
re-derive them; it specifies their composition into the first Thinking Chain.

| Component | Package | Role on Beluga |
|-----------|---------|----------------|
| Tier-1 inference precompile (`0x0303`) | `lux/precompile/inference` | Deterministic int8 transformer, pure Go (CGO=0), on-consensus; runs zen-nano (the Beluga brain). |
| C→A bridge precompile (`0x0300`…`0004`) | `lux/precompile/aivmbridge` | `SubmitInferenceIntent` (Pattern A) / `VerifyInferenceReceipt` (Pattern B, keccak/Merkle vs committed `receipt_root`); staged outbox; no live A read/mutate. |
| A-Chain VM | `lux/chains/aivm` | Provider registry + stake/slash, beacon selection with eligible-set margin, commit-reveal quorum, settlement + receipt export under `receipt_root`, import of committed C-intent under A consensus. |
| Model registry | `lux/precompile/modelregistry` | ModelSpec registry keyed by weight-commitment hash (C10). |
| Off-chain provider runtime (Tier 2) | `hanzo/engine` (FFI surface `hanzo-engine-ffi`: `hanzo_ffi_infer` / `hanzo_ffi_embed`) | Large-model execution behind the A-Chain quorum; operator-bound commit; `output_hash` / `embedding_hash` (int8 quant); governance consensus preimage `{vote, confidence_bucket}` (rationale excluded). |

**Precompile namespace note for reviewers.** The `0x03xx` addresses in the
*Beluga L3 Whitepaper* are **Beluga app-level** precompiles (`0x0300` inference
*pricing*, `0x0301` marketplace, `0x0302` bounty). The `0x0303` Tier-1 inference
and `0x0300`…`0004` `aivmbridge` addresses in this ZIP are **Lux
consensus-level** precompiles in the Lux precompile address space. They live in
distinct namespaces (app EVM vs Lux precompile registry) and do not collide; a
Beluga client maps the Lux precompile registry independently of its app-level
`0x03xx` contracts. This is the one place the two documents' address numbering
must be read together.

## Rationale

**Why L3, not a new L1.** Beluga inherits Zoo's validator set and settles through
Zoo into Lux (ZIP-0015, ZIP-0804). The Thinking-Chain property is orthogonal to
where the chain sits in the stack; reusing Zoo validators is the smallest change
that delivers a working prototype, and keeps cognition economics (BLG) isolated in
their own gas domain.

**Why two tiers, not one.** A single tier forces a false choice: either everything
is deterministic-but-toy (Tier 1 only) or everything is capable-but-trusted (Tier
2 only). Splitting them lets the chain use the *strongest mechanism each kind of
cognition allows* — byte-identical execution where possible, bonded-quorum
settlement where not — without ever weakening C1.

**Why structured-outputs-only.** Prose is not reproducible, not comparable, and
not safely hashable into a decision. Constraining consensus inputs to structured
outputs (and demoting prose to hash-addressed evidence) is what makes both
Subsampled Cognitive Consensus and C11 (inspectable without an LLM) possible.

**Why the two-pattern bridge.** A synchronous cross-chain read would make Beluga
consensus depend on A-Chain liveness and on a value that is not yet committed —
violating C2. Submit-intent / verify-receipt is the minimal decomposition that
keeps each chain advancing under its own consensus while still composing
(Pattern A commits the ask; Pattern B commits the answer).

**Why slash withholders, not dissenters.** Honest disagreement is signal (it is
preserved by C9 as the dissent distribution). Punishing dissent would collapse the
confidence distribution and incentivize herding; punishing withholding targets the
only behavior that actually denies the chain an answer.

**Decomplecting.** This ZIP separates *what cognition produces* (structured
output) from *when the chain may act on it* (committed + level-gated). The two
were braided in naive "AI-on-chain" designs; separating them is what makes the
chain simple (one deterministic transition) rather than merely easy.

## Security Considerations

- **Determinism is the safety boundary.** Tier 1's security rests entirely on
  byte-identical int8 execution. The `0x0303` precompile MUST be CGO-free and use
  fixed-point rounding; any nondeterminism is a consensus fork. Tier-1 models MUST
  be ModelSpec-pinned (C10) so a silent weight change cannot diverge validators.
- **No live-query dependence (C2).** The Bridge Law eliminates the classic oracle
  failure mode: Beluga cannot stall or fork because A-Chain is slow or returns a
  yet-uncommitted value. The worst case is a *pending* intent with no receipt,
  which leaves state unchanged.
- **Replay and malleability.** `intent_id` binds chain ids, originating tx,
  call index, model hash, prompt hash, and quorum params; the ZIP-0902
  `receipt_hash` is over canonical fixed-width fields. C6 makes receipts
  single-consume. A receipt for one intent cannot be replayed against another.
- **Quorum capture.** The eligible-set margin (E ≥ N + max(2, N/2)) plus a
  deterministic beacon prevents a colluding subset from guaranteeing committee
  membership; MinProviderBond + withholder-slashing makes denial costly. Raising
  threshold to 4 for high-value tasks tolerates one additional malicious provider.
- **Authority creep.** C7 + the human-loop levels prevent the chain from silently
  expanding its own autonomy. Any level increase or model-permission widening is a
  DAO action with timelock.
- **Auditability without trust in models (C11).** Every committed cognitive input
  is re-derivable as a hash or checkable as a Merkle proof. A validator or auditor
  never has to trust — or run — an LLM to verify the chain.
- **Prose-as-evidence boundary.** Because prose never enters a consensus input,
  prompt-injection or jailbreak content in a rationale cannot alter state; at most
  it pollutes off-chain evidence, which is hash-addressed and not consensus-bearing.

## References

- *Beluga L3 Whitepaper* — Zoo Labs Foundation (`~/work/zoo/papers/beluga-l3-whitepaper`). BLG token economics, earning mechanisms, app-level `0x03xx` precompiles.
- ZIP-0902 — *Proof-of-Thought Receipts on Zoo* (the settlement object Beluga consumes).
- ZIP-0015 — *Zoo L2 Chain Architecture*.
- ZIP-0804 — *Zoo L1 Graduation*.
- *Thinking Chains* — Lux Proposal (L0 cognitive primitive and bridge precompiles; sibling artifact, number assigned in parallel).
- *Cognitive Sidecar / Hanzo Engine Provider* — Hanzo Improvement Proposal (off-chain Tier-2 provider runtime and ModelSpec registration; sibling artifact, number assigned in parallel).
- *Thinking Chains* — Zoo paper (conceptual treatment and Subsampled Cognitive Consensus; sibling artifact).
- Reference implementations: `lux/precompile/inference` (0x0303), `lux/precompile/aivmbridge` (0x0300…0004), `lux/chains/aivm`, `lux/precompile/modelregistry`, `hanzo/engine` (`hanzo-engine-ffi`).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
