# ZIP-0900: Zoo Version History — 1.0 / 2.0 / 3.0 / 4.0 / DEX Launch Canonical Chronology

| Field | Value |
|---|---|
| **Number** | 0900 |
| **Title** | Zoo Version History --- 1.0 / 2.0 / 3.0 / 4.0 / DEX Launch Canonical Chronology |
| **Status** | Final |
| **Type** | Informational |
| **Category** | Meta |
| **Author** | Antje Worring, Zach Kelling |
| **Created** | 2025-12-15 |
| **Updated** | 2026-04-20 |

## Abstract

This ZIP is the canonical chronology of the Zoo platform: the five
locked version milestones, their dates, the papers that document them,
and the cross-references to the relevant Lux Improvement Proposals
(LPs) and to the Liquidity Protocol adoption record. It exists so
that any future contributor or partner can answer the question "what
was Zoo and what did Zoo ship at version N?" with a single authoritative
source.

## Specification

### Canonical version table

| Version | Era | Date | Paper | Key milestone |
|---|---|---|---|---|
| **1.0** | BSC era (original) | **2021-10-31** | [`zoo-2021-original-whitepaper`](../../papers/zoo-2021-original-whitepaper) | Original Antje Worring vision; coined the term "NFT Liquidity Protocol"; wildlife conservation NFTs as productive collateral. |
| **2.0** | Lux L2 EVM PQ re-launch | **2024-10** | [`zoo-evm-l2-architecture`](../../papers/zoo-evm-l2-architecture) | Re-launch on the Lux Network as an EVM-compatible Layer 2; 20 native precompiles including NIST PQC standards (ML-DSA, SLH-DSA, ML-KEM); first-pass post-quantum stack. |
| **3.0** | Full PQ era | **2025-10-31** | [`zoo-3-0-full-pq`](../../papers/zoo-3-0-full-pq) | Complete post-quantum hardening: every signature, every commitment, every proof in PQ-safe schemes (Ringtail Ring-LWE + ML-DSA-65 + BLS12-381 fast path). Triple-cert inheritance from Lux Quasar 3.0 (LP-020). DAO migration, NFT Liquidity Protocol PQ, zLLM commitments PQ, bridge committee re-keying. |
| **4.0** | GPU-native sovereign L1 | **2026-02-14** | [`zoo-4-0-launch`](../../papers/zoo-4-0-launch) | Graduation from Lux L2 application to sovereign Lux L1 with its own validator set, Quasar-certified consensus, and independent economic security. 100% GPU-powered consensus, EVM, AMM matching, AI mining, and FHE. Quasar 4.0 inheritance. |
| **Zoo DEX** | Native securities + Liquidity Protocol | **2026-04-20** | [`zoo-dex-launch-2026-04-20`](../../papers/zoo-dex-launch-2026-04-20) | $113T digital-securities market access via tokenised equities, fixed income, RWA, and derivatives. Liquidity Protocol adoption (Liquidity.io launched it 2026-04-01; Lux/Hanzo/Zoo/Pars adopted it 2026-04-20). Robinhood-style retail UX with sub-1.1s T+0 settlement. |

### Per-version detail

#### 1.0 — BSC era (2021-10-31)

The October 31, 2021 Zoo whitepaper articulated the original vision of
Zoo as a wildlife-conservation platform on Binance Smart Chain. The
paper introduced the term "NFT Liquidity Protocol" --- a system in
which NFTs become productive collateral inside a yield-bearing on-chain
market that feeds back into species preservation. Cryptographic posture
was inherited from BSC (ECDSA over secp256k1, Ethereum-style Merkle
Patricia tries); no post-quantum guarantees.

**Paper:** `~/work/zoo/papers/zoo-2021-original-whitepaper`

The 1.0 era ended when the original BSC implementation suffered a
Logan-Paul-related rugpull / scam against the original community. The
remediation path was the Genesis Airdrop (ZIP-0002) to original-token
victims and the V4 rebuild that began as Zoo 2.0.

#### 2.0 — Lux L2 EVM PQ re-launch (2024-10)

Zoo re-launched on the Lux Network as a Layer 2 EVM. The 2.0
whitepaper documented:

- 20 native precompiles including NIST PQC standards (ML-DSA-65 per
  FIPS 204, SLH-DSA, ML-KEM).
- Threshold signature precompiles (FROST, CGGMP21).
- Privacy primitives: FHE, zero-knowledge proofs, ring signatures.
- AI Mining precompile for proof-of-useful-computation consensus.

PQ primitives were available to applications via precompile, but
chain consensus, governance, bridge attestations, and the legacy 2021
NFT Liquidity Protocol commitments still ran on classical cryptography
for some edges. 2.0 was the *first-pass* post-quantum era.

**Paper:** `~/work/zoo/papers/zoo-evm-l2-architecture`

#### 3.0 — Full PQ era (2025-10-31)

Zoo 3.0 closed the remaining classical edges. By the end of 2025:

- **Consensus signatures** moved to triple cert ($BLS_{12-381}$ +
  Ringtail Ring-LWE + ML-DSA-65) inherited from Lux Quasar 3.0
  (LP-020).
- **Governance keys** migrated to threshold ML-DSA-65 + Ringtail.
- **Bridge attestations** moved to threshold ML-DSA on M-Chain
  (LP-016, LP-017).
- **zLLM commitments** for training artefacts, governance votes, and
  inference receipts adopted PQ-safe Merkle accumulators with
  ML-DSA-signed roots.
- **NFT Liquidity Protocol loans** are now Ringtail-signed loan
  agreements with PQ-attested liquidation oracles.
- **DAO key migration** rotated treasury custody, contract-upgrade
  authority, and proposal-signing keys to threshold PQ.
- **Wallet keys** dual-key (secp256k1 + ML-DSA-65) for backwards
  compatibility during the sunset window.

By the spec freeze date (2025-10-31, the founder's anniversary), the
Zoo stack was end-to-end harvest-now-decrypt-later resistant.

**Paper:** `~/work/zoo/papers/zoo-3-0-full-pq`

#### 4.0 — GPU-native sovereign L1 (2026-02-14)

Zoo 4.0 graduated Zoo from a Lux L2 application to a sovereign Lux L1
with its own validator set, Quasar-certified consensus, and
independent economic security. Activation alongside Lux Quasar 4.0
on 2026-02-14.

The 4.0 contract: every primitive whose latency matters at validator
scale runs on the GPU device for the duration of a block.

- **Triple-consensus signature verification** ($BLS_{12-381}$
  aggregate + Ringtail threshold + ML-DSA-65 identity) as fused GPU
  kernels per the QuasarGPU adapter (LP-132).
- **EVM bytecode interpreter** as a fiber VM with 256-bit U256
  arithmetic implemented as device-resident SIMD (LP-009).
- **AMM matching** (V2 constant product, V3 concentrated liquidity)
  on the GPU.
- **AI mining attestations** binding compute to receipts via
  TEE-attested H100 / SEV-SNP / TDX containers, with A-Chain anchoring
  per LP-134.
- **GPU-Residency Invariant** (LP-137): no host bounce on the hot
  path.

Zoo 4.0 inherited the full PQ stack from 3.0 unchanged; the 4.0 work
was graduating execution to GPU-native, not re-doing PQ.

**Paper:** `~/work/zoo/papers/zoo-4-0-launch`

#### Zoo DEX — Native securities + Liquidity Protocol (2026-04-20)

The Zoo DEX launches 2026-04-20 with native trading of equities,
fixed income, real-world assets, and tokenised derivatives. The DEX
is a milestone within the 4.x line, not a separate version number;
it is a new-paper-generating event because of the scope of the
launch.

Headline properties:

- **Native securities.** Tokenised equities (fractional shares),
  corporate bonds, treasuries, REITs, commodities, private equity,
  perpetual futures, dated futures, European options. All settle on
  Zoo D-Chain (a white-label resell of the Lux D-Chain template per
  LP-134) with sub-1.1s Quasar 4.0 finality.
- **Liquidity Protocol integration.** Liquidity.io launched the
  formal Liquidity Protocol on 2026-04-01 with a soundness proof
  alongside; Lux, Hanzo, Zoo, and Pars adopted it on 2026-04-20.
  Zoo's adoption document is at
  `~/work/zoo/proofs/zoo-adopts-liquidity-protocol.tex`.
  Compliance-by-construction is enforced via a chain precompile.
- **Robinhood-style retail UX.** Zero commission, fractional shares,
  24/7 markets, instant T+0 settlement.
- **Quantum-secure trading.** Every trade settles under triple-cert
  finality.
- **Privacy.** Optional FHE-encrypted orderflow via F-Chain (LP-013);
  ZK selective disclosure via Z-Chain (LP-063).
- **Top-2 NFT migration.** The DEX is the migration destination for
  the top NFT collections in conservation, AI/agent, and metaverse
  categories. It is the realisation of the original 2021 "NFT
  Liquidity Protocol" coinage.
- **Operator economics.** Zoo D-Chain validators stake $ZOO; rewards
  in trading-fee share + $AI from Hanzo AI Chain compute proofs;
  $10\%$ of taker fees flow to the conservation allocation per Zoo
  Labs Foundation 501(c)(3) mission.

**Paper:** `~/work/zoo/papers/zoo-dex-launch-2026-04-20`

## Cross-references

### Related Lux Improvement Proposals (LPs)

- **LP-009** --- GPU-Native EVM (Zoo 4.0 substrate).
- **LP-013** --- F-Chain FHE-Protected Inference and Confidential Compute.
- **LP-016** --- B-Chain Bridge VM (Zoo Bridge PQ rekeying in 3.0).
- **LP-017** --- Threshold Bridge Committee Key Schedule.
- **LP-020** --- Quasar Consensus 3.0 (triple cert: BLS + Ringtail + ML-DSA).
- **LP-063** --- Z-Chain Zero-Knowledge Rollup and ZKP Registry.
- **LP-070** --- ML-DSA-65 Identity Proof Lane.
- **LP-073** --- Ringtail Ring-LWE Threshold Signature.
- **LP-075** --- BLS12-381 Aggregate Signature Lane.
- **LP-105** --- Quasar Consensus Family Specification (Photon, Wave, Focus, Nova, Nebula).
- **LP-132** --- QuasarGPU Execution Adapter.
- **LP-133** --- Quasar-Native App Stack for Sovereign Appchains.
- **LP-134** --- Lux Chain Topology and White-Label D-Chain Template (P/C/X/Q/Z/A/B/M/F/D-Chains).
- **LP-137** --- GPU-Residency Invariant.

### Liquidity Protocol adoption chronology

The Liquidity Protocol adoption chronology referenced by the Zoo DEX
paper:

| Date | Actor | Action |
|---|---|---|
| **2026-04-01** | Liquidity.io | Formal launch of the Liquidity Protocol with soundness proof. |
| **2026-04-20** | Lux | Adopts the Liquidity Protocol on Lux C-Chain and Lux D-Chain. |
| **2026-04-20** | Hanzo | Adopts the Liquidity Protocol on Hanzo AI Chain marketplace flow. |
| **2026-04-20** | Zoo | Adopts the Liquidity Protocol on Zoo D-Chain via the Liquidity precompile. |
| **2026-04-20** | Pars | Adopts the Liquidity Protocol on Pars's regulated markets. |

The proof artifact for Zoo's specific adoption is at
`~/work/zoo/proofs/zoo-adopts-liquidity-protocol.tex`. The
Liquidity.io formal proof of the protocol itself is at
`~/work/liquidity/proofs/`.

### Related ZIPs

- **ZIP-0002** --- Genesis Airdrop to Original Zoo Token Victims
  (1.0 → 2.0 transition).
- **ZIP-0005** --- Post-Quantum Security for DeFi/NFTs (2.0 → 3.0 frame).
- **ZIP-0015** --- Zoo L2 Chain Architecture (2.0 era).
- **ZIP-0017** --- DAO Governance Framework (3.0 PQ migration).
- **ZIP-0042** --- Cross-Ecosystem Interoperability Standard.
- **ZIP-0700** --- ZRC-20 Fungible Token Standard.
- **ZIP-0701** --- ZRC-721 NFT Standard.
- **ZIP-0703** --- Token-Bound Accounts for Wildlife.
- **ZIP-0800** --- Zoo↔Lux Bridge Protocol.
- **ZIP-0801** --- Zoo↔Hanzo Settlement Integration.
- **ZIP-0804** --- Zoo L1 Graduation (4.0 era).
- **ZIP-0805** --- Zoo DEX (4.0 → 4/20 DEX launch frame).

## Versioning policy

Zoo version numbers track the substrate change, not the product
release cadence:

- A new major version (1.0 → 2.0 → 3.0 → 4.0) signals a substrate
  change: chain location, cryptographic posture, or execution
  substrate.
- A new minor version (4.0 → 4.1 → 4.2) signals a feature increment
  on the existing substrate.
- The Zoo DEX is a 4.x feature within the 4.0 substrate; its launch
  is a milestone, not a version bump.

This policy is itself a Final ZIP commitment as of 2026-04-20.

## Backwards compatibility

This ZIP supersedes any earlier informal chronology. Where a previous
document or wiki page disagrees with this table, this ZIP is
authoritative.

## Security considerations

This ZIP is informational; it does not change any chain behaviour and
has no direct security implications. Indirectly, it serves the
security goal of providing a single authoritative source for the
Zoo version history that audit teams, security researchers, and
incident responders can reference.

## Zoo Chain Set (4.0)

Zoo 4.0 is a sovereign L1 with a chain set strictly **broader** than
the financial-rail core. It inherits most of Lux's primary chains
(P, C, X, Q, F per LP-134), runs a white-labeled D-Chain DEX, and
adds Zoo-specific chains (per-LLM chains, conservation chains,
experience-ledger DSO chain). Zoo L1 also natively hosts L2/L3/L4
tenants (per ZIP-0804). Zoo is **not** a triumvirate-only network;
the triumvirate framing is reserved for Hanzo 4.0, where DEX+EVM+FHE
*is* the entire chain set.

Zoo's financial-rail core (the same DEX+EVM+FHE subset Hanzo carries
as its triumvirate):

1. **DEX** --- Zoo DEX V2 (constant product) and V3 (concentrated
   liquidity) with V4 as a precompile interface to the Lux DEX
   (lx/dex). April 20, 2026 native securities launch with Liquidity
   Protocol integration. Reference: ZIP-0805 Zoo DEX, paper
   `zoo-dex-launch-2026-04-20`.
2. **EVM** --- GPU-native EVM (LP-009) with Zoo-specific precompiles
   for confidential ERC-20 (LP-067), NFT-fractional vault aggregator,
   and DAO holographic-consensus weight evaluation. Reference: paper
   `zoo-4-0-launch` section "GPU-native execution".
3. **FHE** --- F-Chain (LP-013) reached natively. Confidential NFT
   bids, private DAO voting on conservation grants, confidential
   ERC-20 transfers. Reference: paper `zoo-4-0-launch` section 8
   (Privacy).

Zoo-specific chains (beyond the financial-rail core):

- **Per-LLM chains** --- one chain per frontier model; weights are
  commitments, inference is block production. Reference: paper
  `zoo-per-llm-chains`.
- **Conservation chains** --- domain-specific subchains for wildlife
  NFTs, carbon credits, and impact bonds, with the 1--3% sustainability
  tax routed to the Foundation Treasury per ZIP-0017 / ZIP-0034.
- **Experience-Ledger DSO chain** --- the curated experience library
  backing training-free model adaptation.

Zoo L1 does NOT run M-Chain (MPC), B-Chain (Bridge), A-Chain
(Attestation/AI), or Z-Chain (ZK rollups); those remain Lux-primary
infrastructure that Zoo accesses **natively** via the Lux primary
network — same Quasar cert lanes, same subject-binding, same
finality, no wrapped assets, no cross-chain hop tax. The boundary
between Zoo's chain set and Lux primary is cert-lane subject-binding,
not a bridge.

Cross-reference: LP-900 (Lux chronology), HIP-900 (Hanzo chronology),
PIP-900 (Pars chronology). All four networks co-activated their 4.0
(Pars 2.0) major version on 2026-02-14.

## Copyright

Copyright Zoo Labs Foundation 2025-2026, released under the Zoo OSS
license terms.
