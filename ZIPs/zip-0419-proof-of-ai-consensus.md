---
zip: 0419
title: "Proof of AI (PoAI)"
description: "Consensus mechanism where validators prove useful AI work (inference, embedding, training, data-sharing) to earn block rewards — one post-quantum, compute-bound proof system, one canonical contract, leaderless operator-LLM governance."
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Draft
type: Standards Track
category: AI
originated: 2024-06
traces-from: "ZIP-0403, ZIP-0407 / Whitepaper Section 08"
follow-on:
  - "zoo-poai-consensus (2024)"
  - "hanzo/papers/hanzo-consensus-ai"
  - "hanzo/papers/hanzo-aci"
  - "luxfi/standard contracts/ai (2026, canonical contract)"
  - "luxfi/crypto/poi (2026, canonical Go verifier)"
  - "hanzo/engine poi.rs (2026, prover core)"
created: 2024-06-15
amended: 2026-06-24
tags: [poai, proof-of-ai, consensus, validation, ai-compute, governance, post-quantum, blockchain]
requires: [403, 434]
references: ZIP-002
license: CC BY 4.0
---
# ZIP-0419: Proof of AI (PoAI)

## Abstract

This proposal specifies the **Proof of AI (PoAI)** consensus mechanism, where
blockchain validators earn block rewards by proving they performed useful AI
work -- inference serving, embedding, model training, or honest data-sharing --
rather than solving arbitrary cryptographic puzzles (PoW) or merely staking
tokens (PoS). PoAI turns the security budget of the blockchain into productive
AI compute, creating a self-reinforcing cycle: more validators means more AI
compute, better models attract more users, more users increase token value,
higher value attracts more validators.

The 2024 proposal (below) specifies *what* PoAI rewards and *how* the proofs are
spot-checked. The 2026 canon (§ Native Compute-Binding) closes the one gap the
2024 design left open -- the proofs attest to authorship and agreement, not to
the computation itself -- by binding every reward and every consensus action to
a verifiable **Proof of AI**: one post-quantum proof system, one canonical
contract implementation, and a leaderless operator-LLM governance-execution
layer.

## Motivation

Traditional consensus mechanisms waste energy (PoW) or rely on capital as a
proxy for trust (PoS). Neither produces anything useful beyond securing the
chain. PoAI reclaims the security budget by requiring validators to prove useful
AI contributions:

1. **Inference**: Validators serve model inference for conservation applications
2. **Embedding**: Validators produce embeddings for retrieval and search
3. **Training**: Validators contribute compute to DSO training rounds (ZIP-0410)
4. **Verification**: Validators verify the AI work of other validators

This aligns the blockchain's economic incentives with the Zoo mission: securing
the network directly improves the AI models that power conservation.

## Specification

### Work Types

| Work Type | Description | Verification | Reward Weight |
|-----------|-------------|--------------|---------------|
| Training | Contribute gradient updates to DSO | Gradient verification + spot-check recompute | 3x |
| Inference | Serve model inference with SLA | Response quality audit + latency check | 1x |
| Verification | Verify other validators' work | Meta-verification by committee | 2x |

### Proof Protocol

1. Validator commits to a work type and stake
2. Coordinator assigns work (training shard, inference queue, verification target)
3. Validator performs work and generates cryptographic proof:
   - **Training proof**: Hash of gradient + commitment to local data + compute attestation
   - **Inference proof**: Hash of (input, output, model_version) + latency measurement
   - **Verification proof**: Signed attestation of verified work's correctness
4. Proof is submitted to the chain
5. Random committee of verifiers spot-checks proofs
6. Valid proofs earn block rewards; invalid proofs are slashed

### Slashing Conditions

| Violation | Slash Amount | Description |
|-----------|-------------|-------------|
| Invalid gradient | 5% stake | Gradient fails verification |
| Inference hallucination | 2% stake | Response contradicts grounded facts |
| False verification | 10% stake | Approved provably-invalid work |
| Downtime | 0.1% stake/hour | Failed to serve assigned work |

### Hardware Requirements

| Tier | GPU | VRAM | Role |
|------|-----|------|------|
| Light | RTX 4060+ | 8 GB | Inference + verification |
| Standard | RTX 4090 / A4000 | 16-24 GB | Training + inference |
| Heavy | A100 / H100 | 40-80 GB | Full training + large model inference |

## Research Papers

- [zoo-poai-consensus](~/work/zoo/papers/zoo-poai-consensus/) -- PoAI consensus specification (2024)
- [hanzo-consensus-ai](~/work/hanzo/papers/hanzo-consensus-ai/) -- AI-integrated consensus mechanisms
- [hanzo-aci](~/work/hanzo/papers/hanzo-aci/) -- AI Chain Infrastructure with PoAI validation

## Implementation

- **hanzo/aci**: AI Chain Infrastructure with PoAI consensus
- **hanzo/node**: Blockchain/AI node with PoAI validation
- **zoo/contracts**: PoAI validator registration and slashing contracts

## Timeline

- **Originated**: June 2024 (PoAI protocol design)
- **Research**: `zoo-poai-consensus` published Q3 2024
- **Implementation**: PoAI consensus integrated into Hanzo ACI 2025
- **Canon**: compute-bound PoAI + governance-execution + PQ stack, 2026

## Native Compute-Binding Implementation (2026 — FINAL CANON)

The 2024 proposal above specifies *what* PoAI rewards and *how* the proofs are
spot-checked by committee. It left one gap open: the proofs of 2024 attest to
authorship and agreement, not to the computation itself. As PoAI moved from a
consensus design to a settlement primitive that mints, that gap became
economically exploitable. This section records the **final canon** that closes
it: PoAI is now a verifiable, execution-level mechanism with one proof system,
one canonical contract, and a leaderless governance layer. The original protocol
above is unchanged; compute-binding sits underneath it as the proof that a
validator's claimed work was actually done.

### The guess-to-mint gap it closes

A digital signature proves *authorship* -- that a specific key produced a result.
Plurality across a quorum proves *agreement* -- that enough validators reported
the same result. Neither proves *computation*. Under the 2024 protocol, the
cheapest attack on an inference or verification reward was never to run the
model: a validator could emit a roughly 1-bit modal yes/no guess, join the
plurality of honest validators who *did* run it, pass the agreement check, and be
minted. The work was never performed; the guess merely rode the honest majority.
Compute-binding closes this by making each reward contingent on a proof that the
claimed forward (or backward) pass was actually executed on the claimed inputs.

### One proof system over a computation graph

PoAI generalizes to **inference, embedding, training, and data-sharing** because
all of the compute-bearing ones are the same object -- a **computation graph
whose load-bearing nodes are matrix multiplications** -- so a single check
verifies all of them. There is **one verification path**; a `workloadType`
discriminant selects the binding, not a separate algorithm:

| Proof | `workloadType` | What it binds |
|-------|----------------|---------------|
| **PoE** -- Proof of Embedding | embedding | the embedding GEMMs produced the claimed vector for the claimed input |
| **PoI** -- Proof of Inference | inference | the forward pass produced the claimed output tokens for the claimed prompt |
| **PoT** -- Proof of Training | training | the training step ran -- backpropagation is *also* matmul (`dX = dY·Wᵀ`, `dW = Xᵀ·dY`), so the same check applies to the backward pass |
| **PoC** -- Proof of Contribution | contribution | PoT, **plus** a proof-of-improvement that the contributed gradient helped, with contributor privacy preserved via DeltaSoup aggregation |

**Data-sharing is orthogonal.** It is not a matmul to check; it is a
read-authorization question -- *who is allowed to decrypt which prompt* --
handled by the post-quantum confidentiality envelope (X-Wing promptseal, below),
entirely separate from the Freivalds core. The matmul check answers "was it
computed"; the envelope answers "who may see it"; the two never braid. This
collapses the 2024 work-type taxonomy onto one verifiable computational core: the
reward weight and slashing tables above are unchanged, but each row is now backed
by the same matmul-binding proof.

### The core check: Freivalds over the exact integer accumulator

An LLM forward pass is approximately 95% matrix multiplication -- the result of a
layer is `C = A·B`. Verifying a single matmul by recomputing it is `O(n^3)`.
Freivalds' algorithm (1977) instead samples a random challenge vector `r` and
checks

```
A · (B · r) == C · r
```

which is `O(n^2)`: two matrix-vector products and one comparison, no full
recompute. A fabricated `C` survives a single challenge with probability at most
`1/p`, so the check catches a forged result with probability at least `1 − 1/p`
per challenge vector, and the soundness error shrinks geometrically with
independent challenges.

The check is performed over a finite field `F_p` with the Mersenne prime
`p = 2^61 − 1`, evaluated on the **exact int8 accumulator** of the quantized
model rather than on dequantized floats. Because the accumulator is
integer-exact and the field arithmetic is exact, the verification is bit-exact
and exhibits **zero false-reject across heterogeneous hardware** -- the prover's
GPU and the verifier's CPU agree to the bit. Soundness error is `1/p ≈ 2^-61`
per challenge vector; `k = 2` vectors give `≤ 2^-122`. Critically, the soundness
argument is **information-theoretic** -- it holds against an *unbounded*
adversary -- so it is **post-quantum by construction**: a quantum computer gives
no advantage in guessing a uniformly-random `r`. This is what makes the check
usable as a settlement gate that survives a future quantum adversary, and what
makes an honest prover never slashed for a hardware rounding difference.

### The tier matrix (not naive fp-Freivalds)

Freivalds over `F_p` is exact only when the computation is integer-exact. A naive
attempt to run Freivalds directly on floating-point activations is **unsound and
false-rejecting** -- floating-point is non-associative and non-deterministic
across hardware, so honest provers would be slashed and a crafted error could
slip under the rounding tolerance. Floating point is therefore handled *by tier*,
not by forcing one check onto every workload:

| Tier | Mechanism | When used |
|------|-----------|-----------|
| **T0** | zkML proof | Small models where a succinct proof is cheap |
| **T1** | M-of-N confidential-compute TEE attestation | High-value workloads needing hardware-rooted trust |
| **T2** | Single confidential-compute attestation, or optimistic Freivalds | Quantized workloads where the exact int8 accumulator makes Freivalds sound |
| **T3** | Redundancy + plurality (the 2024 path) | CPU and liveness-critical workloads where availability dominates |

One **profile gate** governs all tiers with a single policy: **no proof → no
mint, no settle, no act.** Quantized models route to exact Freivalds (T2);
native-floating-point models route to deterministic-fp recompute or a TEE; small
models route to zkML (T0). The tier is a property of the workload and its
hardware, and the gate enforces that *some* valid proof at the required tier
exists before any reward is paid or any consensus action is taken.

### The reportData binding

A proof must not be replayable, splice-able, or repointable to a different model
or input. Each attestation carries a `reportData` field containing a keccak hash
chain that binds, in order, the **challenge → model → input → output**. The model
identity is a `modelSpecHash` measured over the *loaded quantized bytes* -- the
exact weights resident in memory, not a claimed model name -- so an attestation
produced for one model or one prompt cannot be replayed against another, and an
honest attestation cannot be spliced onto a different output. The activation
trace is committed as a keccak Merkle Mountain Range (RFC-6962 lone-node
promotion, not the malleable Bitcoin duplicate-last); on dispute a challenger
opens a single beacon-selected layer and Freivalds-verifies it, with sparse
cheats pinned by `O(log L)` bisection. The binding is what makes a single valid
attestation non-transferable.

### One canonical contract -- consumed everywhere

There is **one** on-chain implementation of PoAI, and it is shared across the
whole ecosystem. It lives in **`luxfi/standard` at `contracts/ai/`** and
is consumed by every Lux-descended chain -- Zoo included -- via
`@luxfi/standard/ai`. There is **no second implementation** to drift
against. Zoo's PoAI validator/slashing contracts compose these, they do not fork
them. The load-bearing pieces:

- **`ComputeWitnessLib.sol`** -- the on-chain Freivalds + Merkle-inclusion
  witness check. `provesFraud` returns true iff an opened matmul was committed
  under the root *and* its output is fabricated; an honest pass has no such
  matmul, so an honest validator can never be slashed.
- **`AIComputeRegistry.sol`** -- the **global no-double-mint** ledger, keyed on
  the chain-independent `keccak(DOMAIN ‖ modelSpec ‖ promptHash ‖ outputHash)`
  (`DOMAIN = "hanzo/poi/compute-claim/v1"`). First-correct-proof wins; a second
  claim from any miner on any chain reverts, so one unit of work mints once
  network-wide.
- **`AChainRootOracle.sol`** -- the trustless, permissionless, **post-quantum**
  relay of A-Chain (aivm) state to any EVM. A validator quorum signs `(root,
  height)` with ML-DSA (the scheme `luxfi/warp` carries as `MLDSACertSet`);
  anyone may relay; the oracle verifies the quorum on-chain via the ML-DSA
  precompile. Forging a root requires breaking ML-DSA or corrupting the quorum.
- **`MinerStakeRegistry.sol`** -- bond/slash: a validator bonds in proportion to
  declared capacity, a proven discrepancy slashes automatically (the math, not a
  vote), a cooldown stops exit-before-fraud-proof.
- **`AICoin.sol` / `AIMiner.sol`** -- the **fair-mined** coin:
  `MAX_SUBSIDY = 1,000,000,000` AI, no pre-mine, supply from zero, the emission
  slope **halving every four years**, the geometric sum equal to exactly `MAX`.
  Multiple verified-cognition mint paths share **one** cap; a minter is always a
  proof-enforcing contract, never an EOA.

### Leaderless operator-LLM governance and execution

PoAI lets verified AI **govern and act** on-chain, not just earn rewards. Two
decision primitives over one bonded operator set, plus a three-tier execution
surface -- all in `contracts/ai/`, all leaderless:

- **`AIGovernor.sol`** decides a categorical **policy**: bonded
  node-operator LLMs emit `{vote, confidence}`, secp256k1-sign the canonical
  preimage `keccak256(abi.encodePacked(modelSpecHash, vote, confidenceBucket))`
  (byte-identical to the Go operator), and on a strict majority the contract
  records a canonical `Vote.Yes`/`Vote.No` on-chain.
- **`AIParams.sol`** decides a continuous **value**: each operator's
  LLM proposes a number in `[lo, hi]`; the chain settles to the **median** of a
  sortition-sampled quorum -- *unweighted* (one operator, one proposal), the
  Byzantine-robust regime against any minority `< 50%`. The live value is the
  loop-closing read `valueOf(spec, knobKey)`.
- **`AIExecute.sol`** is the one surface consensus uses to read and act:
  **READ** any getter and hand back a *typed* value; **ENACT** (Tier 1) a decided
  knob via `target.selector(value)` with no timelock (the value *is* the
  consensus output); **EXECUTE** (Tier 2/3) an *arbitrary* approved operation
  gated by a **timelock window + predecessor ordering + one-shot + guardian veto
  + policy guard**. `hashOperation` binds `chainId + address(this)`, so an
  approval is non-replayable across chains/instances; `execute` is permissionless
  (the approval is the authority, not the caller).
- **`AIApproval.sol`** binds `AIExecute` to the real quorum by a single identity:
  **a Thought's `promptHash` IS the operation hash**. `confirm(taskId)` requires
  the Thought is `Settled` *and* `Yes`, then stamps the approval at the current
  block time (the timelock anchor). `confirm` is permissionless and one-shot,
  with **no admin, no owner, no override** -- the only path to an approval is a
  real quorum YES.
- **`AIPolicy.sol`** is an orthogonal defense-in-depth guard (target/selector
  allowlists, value cap, rate limit), governed by a Safe or the timelock -- so a
  compromised quorum still cannot reach outside the envelope a deployment set.

### Post-quantum stack

PoAI is post-quantum end to end. Freivalds soundness is information-theoretic and
keccak commitments are PQ-secure; all keyed crypto uses NIST PQ schemes (grounded
in `luxfi/node`):

- **X-Wing KEM promptseal** -- `crypto/promptseal` seals a prompt to an
  operator's registered key (hybrid X25519 + ML-KEM-768 over HPKE, domain
  `hanzo/poi/prompt-seal/v1`, `intentID` bound as AAD), so the prompt is never
  plaintext on the wire; X-Wing precompile at `0x…2221`.
- **ML-DSA precompile (44/65/87)** at `0x…012202` -- NIST Levels 2/3/5; validator
  and A-Chain-root quorums sign with ML-DSA.
- **SLH-DSA** precompile at `0x…012203` -- conservative hash-based PQ signatures.
- **P3Q precompile** at slot **`0x012205`** -- a new PQ-proof primitive at its own
  slot, orthogonal to the classical ZK/Pulsar precompiles.
- **Warp `MLDSACertSet`** -- `luxfi/warp` `EnvelopeV2` carries an optional ML-DSA
  attestation lane, so cross-chain PoAI attestation travels post-quantum.

### Canon properties

PoAI is **public** (verifier, contracts, and every decision open and on-chain),
**leaderless** (no proposer or privileged caller; `confirm`/`execute`
permissionless), **decentralized** (one bonded operator set, sortition makes
committee share track population share), **operator-safe** (each operator runs
its own LLM and signs its own verdict; bit-exact integer arithmetic + lowest-id
argmax + canonical MoE top-k mean an honest operator is never slashed; guardian
veto + policy guard bound a compromised quorum), and **post-quantum /
nation-state-proof** (information-theoretic Freivalds, keccak commitments,
X-Wing/ML-DSA/SLH-DSA/P3Q).

### Where it is live

Compute-binding is implemented and tested across three byte-parity layers:

- **Canonical verifier (the one the chain consumes):** `luxfi/crypto/poi` -- the
  Go implementation of the Freivalds-over-`F_p` check, the transcript, and the
  wire format (`freivalds.go`, `transcript.go`, `wire.go`). This is the
  authoritative verifier; consensus accepts what it accepts. **22 `Test*`
  functions** across `freivalds_test.go`, `transcript_test.go`, `wire_test.go`,
  `scale_test.go`, `adversarial_test.go`.
- **Prover core:** `hanzo/engine` `hanzo-engine/src/poi.rs` (+ `poi_transcript.rs`,
  `poi_graph.rs`, `poi_forward.rs`) -- the Rust prover that emits proofs in the
  format the Go verifier checks, plus the determinism prerequisites a proof
  requires: lowest-id argmax (deterministic tie-breaking) and canonical MoE top-k
  selection, which together cover all of the MoE-based zen models. **14 `#[test]`
  functions** (honest `A·B` passes; a single tampered entry -- including
  signed/negative -- is caught; deterministic challenge derivation; wrong
  dimensions fail closed; a deep one-entry cheat in a larger random matmul is
  caught; keccak golden-parity with the chain).
- **On-chain enforcement:** `luxfi/standard` `contracts/ai/` --
  `ComputeWitnessLib` performs the proof binding on-chain; `ComputeProfile` is
  the per-workload tier gate; the settlement path accepts optimistic and
  confidential-compute evidence; minters share a single capped AICoin supply, so
  compute-binding cannot inflate issuance. The Solidity Freivalds (`P = 2^61 −
  1`, `DOMAIN_MATMUL_LEAF = "hanzo/poi/matmul-leaf/v1"`) is byte-identical to the
  Rust prover and the Go verifier, so an opening that verifies in the engine
  verifies on-chain unchanged.

The theory and soundness are documented in the Zoo PoAI consensus paper
(`zooai/papers/zoo-poai-consensus`) and its soundness companion
(`zooai/proofs/proof-of-inference-soundness.tex`), which proves the tiering is
necessary and that naive fp-Freivalds is unsound.

### Ecosystem license (LP-0012)

The canonical PoAI work -- the Rust prover core, the Go verifier, and the
Solidity contracts in `luxfi/standard` `contracts/ai/` -- is licensed
**BSD-3-Clause** (the per-file SPDX header is authoritative) **extended by the
LP-0012 ecosystem grant**: production use is granted to chains **descending from
the Lux primary network** (Zoo, Hanzo, Pars, and other Lux-descended L1s/L2s/L3s).
Zoo runs PoAI under this grant. Commercial licensing beyond these terms is by
arrangement -- contact **lux.network**. (This ZIP's own text remains CC BY 4.0;
the grant governs the *code*, see LP-0012 and `luxfi/standard` `LICENSING.md`.)

### Honest status

To be precise about what is and is not live:

- **BUILT and TESTED:** the Freivalds-over-`F_p` core check, the four-proof
  primitive (PoE/PoI/PoT/PoC), the tier matrix, and the `reportData` binding --
  across all three byte-parity layers, with passing suites (14 `#[test]` in the
  prover, 22 `Test*` in the Go verifier, the Solidity `ComputeWitnessLib`).
- **ENFORCED:** the chain refuses to mint, settle, or act on a reward without a
  valid proof at the required tier -- the profile gate is live in `luxfi/standard`
  `contracts/ai/`, with the global no-double-mint registry, the trustless
  PQ root oracle, bond/slash, and the fair-mined capped/halving coin.
- **GOVERNANCE-EXECUTION:** `AIGovernor` + `AIParams` settle
  canonical YES/NO + knob medians on-chain from the operator-LLM quorum;
  `AIExecute` + `AIApproval` + `AIPolicy` let consensus read any state typed and
  execute arbitrary approved operations under the multi-control timelock.
- **PQ stack:** X-Wing promptseal + precompile, ML-DSA (44/65/87) + SLH-DSA + P3Q
  (`0x012205`) precompiles, warp `MLDSACertSet`.

End-to-end proof *emission* from a running zen model -- a forward pass that
streams the activation-trace transcript a challenger opens and Freivalds-verifies
against the bound `reportData` -- is the increment that wires a live zen-model
forward pass to the (already-built and tested) verifier, on-chain gate, and proof
format. The proof system itself is canonical and enforced today.
