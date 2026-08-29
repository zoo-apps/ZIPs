---
zip: 902
title: "Proof-of-Thought Receipts on Zoo"
description: "Proof-of-Thought (PoT) receipts — the settlement object for off-chain cognitive work — specifying the AInferenceReceipt structure, canonical wire hashing, the commit-reveal provider-quorum lifecycle, eligible-set/beacon selection, slashing, and Subsampled Cognitive Consensus over structured outputs"
author: "Zoo Labs Foundation"
status: Draft
type: "Standards Track"
category: "Core"
created: 2026-06-21
requires: [804]
---
# ZIP-0902: Proof-of-Thought Receipts on Zoo

## Abstract

A **Proof-of-Thought (PoT) receipt** is the settlement object for cognitive work
performed off-chain by a provider quorum. It lets a deterministic chain *act on*
large-model judgments without ever running the model or trusting a single oracle:
the receipt commits a *structured* result, the quorum's agreement is established
by **Subsampled Cognitive Consensus** over structured outputs (never prose), and
any verifier confirms validity by re-deriving a hash and checking a Merkle proof
against a committed `receipt_root`. This ZIP specifies the receipt structure
(`AInferenceReceipt`), its canonical wire hashing, the intent→commit→reveal→settle
lifecycle, eligible-set and beacon selection, quorum/slashing parameters, and the
governance preimage. It is the object consumed by Beluga (ZIP-0901) and is
chain-agnostic across Zoo app-chains.

## Motivation

ZIP-0901 establishes the **Bridge Law**: a chain's consensus state must not depend
on a live, uncommitted query. That law needs a concrete *object* to settle
against — something that (a) carries a verifiable structured result, (b) is bound
to its originating request so it cannot be replayed or swapped, (c) records who
answered and how confidently, and (d) is checkable without re-running any model.
That object is the PoT receipt.

PoT separates two concerns that naive AI-oracle designs braid together: the
*work* (large-model inference, inherently off-chain and nondeterministic) and the
*settlement* (a small, canonical, hash-addressed fact the chain commits). The work
happens in the Hanzo Engine provider runtime on the Lux A-Chain; the settlement is
this receipt. This ZIP specifies only the settlement object and its lifecycle; the
chain that consumes it (Beluga) is ZIP-0901, and the provider runtime is the Hanzo
*Cognitive Sidecar / Hanzo Engine Provider* HIP.

## Specification

The keywords MUST, MUST NOT, SHALL, SHOULD, MAY are used per RFC 2119. All hashing
is keccak-256. "Structured output" means a fixed-shape value (class label, ranked
ID list, vote+confidence bucket, or fixed-width embedding/hash) — **never prose**.

### 1. Roles

PoT is defined in terms of chain *roles*, some of which are VMs or modules rather
than separate chains:

| Role | Meaning |
|------|---------|
| C | contracts / escrow / bridge (the requesting domain) |
| A | AI inference / quorum / model-registry (the settling domain) |
| D | DEX / market |
| S | simulation |
| R | reputation |
| G | governance |
| M | memory |

PoT receipts settle from **A** to **C**. Governance Thought Receipts are PoT
receipts consumed by **G**.

### 2. Intent identifier

A request is named by an `intent_id` binding it to its originating call so the
eventual receipt is non-malleable and replay-protected:

```
intent_id = keccak(
    DOMAIN_INTENT || c_chain_id || a_chain_id || c_tx_hash || call_index ||
    caller || model_spec_hash || prompt_hash || N || threshold || fee )
```

- `c_chain_id`, `a_chain_id` — requesting (C) and settling (A) chain ids.
- `c_tx_hash`, `call_index` — the exact C transaction and call that submitted the
  intent.
- `caller` — the C-side requester address.
- `model_spec_hash` — the registered ModelSpec (weight-commitment hash). The model
  used MUST be registered; an unregistered model cannot produce a settleable
  receipt.
- `prompt_hash` — hash of the canonicalized prompt/input. The prompt itself is
  off-chain evidence; only its hash binds the intent.
- `N`, `threshold`, `fee` — quorum size, agreement threshold, and fee for this
  request (§5).

`DOMAIN_INTENT` is a fixed domain-separation tag.

### 3. The receipt structure

```
AInferenceReceipt {
    Version            uint16     // receipt schema version
    IntentID           bytes32    // = intent_id (§2)
    TaskID             bytes32    // A-Chain task identifier
    CChainID           uint64     // requesting chain
    AChainID           uint64     // settling chain
    Requester          address    // C-side requester
    ModelSpecHash      bytes32    // registered model (weight commitment)
    PromptHash         bytes32    // canonical prompt hash
    CanonicalOutputHash bytes32   // hash of the agreed structured output
    Status             uint8      // settled | failed | timed-out
    N                  uint16     // committee size used
    Threshold          uint16     // agreement threshold used
    WinnersRoot        bytes32    // Merkle root of agreeing providers
    OperatorsRoot      bytes32    // Merkle root of the full committee
    FeePaid            uint256
    SettledAtHeight    uint64     // A-Chain height at settlement
}
```

`CanonicalOutputHash` is the hash of the *structured* result (e.g. the
int8-quantized `output_hash` / `embedding_hash`, or the governance preimage of
§7). The model's prose rationale is **not** in the receipt; it is retained as
hash-addressed evidence only.

### 4. Canonical wire hashing

The receipt hash is taken over canonical, fixed-width serialization (each field
encoded big-endian at its declared width, in struct order):

```
receipt_hash = keccak( DOMAIN_RECEIPT || <canonical fixed-width AInferenceReceipt> )
```

`DOMAIN_RECEIPT` is a fixed domain-separation tag, distinct from
`DOMAIN_INTENT`. Fixed-width canonical encoding (no variable-length fields, no
RLP ambiguity) guarantees every verifier derives the identical `receipt_hash`.

A settled receipt is committed under the A-Chain `receipt_root` (a Merkle root over
the block's settled receipts). A consumer (e.g. a C-role contract) verifies a
receipt by checking a Merkle proof of `receipt_hash` against the committed
`receipt_root` — **without running any model** (the inspectability rule from the
shared canon).

### 5. Quorum parameters

- **N = 5** providers per task; **threshold = 3** agreeing structured outputs.
- **High-value tasks**: **threshold = 4** (tolerates one additional malicious
  provider). What counts as high-value is policy-defined by the consuming chain
  (e.g. treasury-affecting governance on Beluga).
- **Eligible-set margin**: the beacon selects the committee from an eligible set of
  size **E ≥ N + max(2, N/2)** — strictly larger than the committee, so no
  withholding subset can deterministically pin membership.
- **MinProviderBond**: every committee member MUST post at least `MinProviderBond`;
  unbonded or under-bonded operators are ineligible.
- **Deterministic beacon selection**: the committee is selected from the eligible
  set by a deterministic, replayable beacon (any verifier reproduces the same
  committee), keyed to `intent_id` and an A-Chain randomness source.

### 6. Lifecycle (intent → commit → reveal → settle)

1. **Submit (Pattern A).** A C-role contract submits an intent; the bridge stages
   it deterministically under `intent_id` (no live A read). The A-Chain imports the
   committed intent under its own consensus.
2. **Select.** The beacon selects the committee from the eligible set (§5).
3. **Commit.** Each selected provider runs the registered model and commits
   `keccak(operator || CanonicalOutputHash || salt)` — an operator-bound
   commitment that hides the output until reveal, preventing copying.
4. **Reveal.** Providers reveal `(CanonicalOutputHash, salt)`. The A-Chain checks
   each reveal against its commit and against the committing operator.
5. **Tally (Subsampled Cognitive Consensus).** Agreement is computed over the
   revealed **structured** outputs. If ≥ `threshold` providers reveal the identical
   `CanonicalOutputHash`, that output wins; agreeing providers form `WinnersRoot`,
   the full committee forms `OperatorsRoot`.
6. **Settle (Pattern B).** The A-Chain builds the `AInferenceReceipt`, computes
   `receipt_hash`, and includes it under the block's `receipt_root`. The consuming
   chain verifies the Merkle proof and acts on `CanonicalOutputHash` only.
7. **Reward / slash.** Fee is paid to agreeing providers; withholders are slashed
   (§8). On failure to reach threshold, `Status = failed`; no structured output
   settles and the consuming chain's state is unchanged.

A receipt is consumable **at most once** per `intent_id` (replay protection).

### 7. Governance preimage and Subsampled Cognitive Consensus

For governance judgments (Governance Thought Receipts consumed by the G-role), the
structured output committed in `CanonicalOutputHash` is the **governance
preimage**:

```
governance_preimage = { vote, confidence_bucket }     // rationale EXCLUDED
```

- `vote` — the structured decision (e.g. approve/reject, or a category/rank).
- `confidence_bucket` — a coarse, fixed bucket of model confidence.
- The free-text rationale is **excluded** from the preimage; it is hash-addressed
  evidence only.

**Subsampled Cognitive Consensus** is the repeated random-committee sampling over
these structured preimages. The full confidence/dissent distribution across the
committee MUST be preserved (recorded on-chain), not collapsed to a single label —
honest dissent is signal, and consumers (e.g. human-loop levels in ZIP-0901) may
gate on the distribution.

### 8. Slashing

- **Withholding is slashed.** A selected provider that fails to commit, fails to
  reveal, or reveals a value inconsistent with its commit is slashed against its
  bond.
- **Honest dissent is NOT slashed.** A provider whose structured output is a
  minority answer — but who committed and revealed honestly — keeps its bond. Its
  dissent is preserved in the distribution (§7).
- The distinction is enforced over **structured outputs only**: an output is
  "agreeing" or "dissenting" by exact `CanonicalOutputHash` equality, never by
  judging prose.

### 9. ModelSpec binding

Every receipt's `ModelSpecHash` MUST reference a model registered by
weight-commitment hash in the model registry. This guarantees the consuming chain
knows *exactly which weights* produced the settled output, and that a silent model
swap cannot pass as the same registered model. Provider commitments are
operator-bound to prevent free-riding on another operator's output.

## Rationale

**Why a fixed-width canonical hash.** Variable-length or RLP-ambiguous encodings
let two honest verifiers derive different hashes for the "same" receipt. Fixed
big-endian field widths in struct order make `receipt_hash` unambiguous, which is
the precondition for trustless Merkle verification.

**Why commit-reveal.** Without commitment, providers could copy the first revealed
output and collect rewards without doing work, collapsing the quorum's
independence. Operator-bound commit-then-reveal forces each provider to compute
before seeing others.

**Why structured-only agreement.** Two correct prose answers are almost never
byte-identical; two correct *structured* outputs are. Defining agreement over
structured outputs is what makes a threshold meaningful and what lets `≥ threshold`
exact matches stand for "the quorum agrees."

**Why preserve dissent.** Collapsing the committee to one label discards
calibration information and incentivizes herding. Preserving the distribution lets
the consumer decide how much autonomy a given confidence warrants (ZIP-0901
human-loop levels), and makes honest minority answers safe to give.

**Why slash withholders, not dissenters.** The only behavior that denies the chain
an answer is withholding; that is what carries economic risk. Penalizing dissent
would corrupt the very distribution the protocol exists to measure.

**Separation of concerns.** This ZIP is *only* the settlement object and its
lifecycle. The chain that consumes it (ZIP-0901) and the runtime that produces it
(the Hanzo HIP) are specified separately, so the receipt can be reused by any Zoo
app-chain without re-specifying either.

## Security Considerations

- **Replay / malleability.** `intent_id` binds chain ids, originating tx, call
  index, model hash, prompt hash, and quorum params; `receipt_hash` is over
  canonical fixed-width fields; receipts are single-consume per `intent_id`. A
  receipt cannot be replayed or rebound to a different request.
- **Quorum capture.** Eligible-set margin (E ≥ N + max(2, N/2)) + deterministic
  beacon prevents a colluding subset from guaranteeing committee seats;
  MinProviderBond + withholder slashing makes denial costly; threshold = 4 for
  high-value tasks tolerates one extra malicious member.
- **Output copying.** Operator-bound commit-reveal prevents copying another
  provider's structured output.
- **Silent model swap.** ModelSpec weight-commitment binding (§9) ensures the
  settled output is attributable to exact registered weights.
- **Verifier trust.** A consumer verifies a receipt by hash re-derivation + Merkle
  proof against a committed `receipt_root`; it never runs or trusts a model. A
  failed quorum settles `Status = failed` and changes no consumer state — the safe
  default.
- **Confidence laundering.** Because the dissent distribution is preserved and the
  rationale is excluded from the preimage, a single provider cannot inflate
  apparent agreement, and prose-level manipulation (injection/jailbreak) cannot
  enter a consensus input.

## References

- ZIP-0901 — *Beluga L3 Thinking-Chain Architecture* (the chain that consumes PoT receipts).
- ZIP-0804 — *Zoo L1 Graduation*.
- *Thinking Chains* — Lux Proposal (bridge precompiles `aivmbridge` and the consensus-layer primitive; sibling artifact, number assigned in parallel).
- *Cognitive Sidecar / Hanzo Engine Provider* — Hanzo Improvement Proposal (provider runtime producing PoT receipts; sibling artifact, number assigned in parallel).
- *Thinking Chains* — Zoo paper (Subsampled Cognitive Consensus analysis; sibling artifact).
- Reference implementations: `lux/chains/aivm` (commit-reveal quorum, beacon selection, settlement under `receipt_root`), `lux/precompile/aivmbridge` (Pattern A/B), `lux/precompile/modelregistry` (ModelSpec), `hanzo/engine` (`hanzo-engine-ffi`: `hanzo_ffi_infer` / `hanzo_ffi_embed`).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
