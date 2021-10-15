---
zip: 0000
title: Zoo Ecosystem Architecture & Framework
author: Zoo Team
type: Meta
status: Final
originated: 2021-10
traces-from: "Whitepaper sections 01 (Mission), 04 (Market), 06 (Foundation), 18 (Roadmap)"
follow-on: [zoo-foundation-mission, zoo-network-architecture]
created: 2024-12-20
updated: 2025-01-07
---

# ZIP-0: Zoo Ecosystem Architecture & Framework

## Abstract

This document specifies the Zoo ecosystem architecture, development framework, and the Zoo Improvement Proposal (ZIP) process. It is the canonical reference for Zoo's Lux-based EVM L2 infrastructure, DeFi stack, NFT marketplace, GameFi, and AI integrations.

## 1. Zoo Ecosystem Overview

Zoo is an EVM L2 appchain/rollup on Lux Network specialized for DeFi, gaming, and AI-powered NFTs, with an optional path to a sovereign L1 in the future:

- **Lux EVM L2**: Low-latency execution, inherited security; PQC-ready per Lux roadmap
- **DeFi-native**: First-class AMM, lending, vaults, liquid staking
- **AI-powered NFTs**: User-owned models as dynamic, tradable assets
- **GameFi**: On-chain games with personal AI agents
- **Metaverse**: User-owned economies
- **Native token**: ZOO for governance, gas/fees, and rewards

*Note: Architecture assumes Lux L2 today; if/when Zoo opts for a sovereign L1, consensus/bridging sections become active (see §2.3).*

## 2. Sovereignty & Network Architecture

### 2.1 Chain Type
- **Primary**: EVM L2 (Lux) appchain/rollup
- **Optional future**: Sovereign L1 via Lux Sovereign Chain Protocol (LP-25)

### 2.2 L2 Characteristics (target)
```yaml
Block time: ~1s
Finality: sub-second (rollup confirmation subject to Lux settlement)
Validators/Sequencers: Lux-aligned; PoL (Proof of Liquidity) semantics at L2 where applicable
Bridge: Native Lux↔Zoo canonical bridge
```

### 2.3 Optional Sovereign L1 (deferred)
```yaml
Consensus: DeFi-optimized PoL
Validators: Liquidity providers + stakers
Bridge: Native Lux↔Zoo
```

## 3. Architecture Components

```
zoo/
├── app/              # Next.js front-end
├── core/             # Core logic
├── contracts/        # Solidity (EVM)
├── sdk/              # TypeScript SDK
├── marketplace/      # NFT marketplace
├── gamefi/           # Game infra
└── ai/               # AI integration layer
```

**Stack**: Lux EVM, Solidity, Next.js/React/TS, Babylon.js/Unity SDK, Hanzo LLMs, IPFS/Arweave

**PQC**: Leverage Lux PQC roadmap (e.g., ML-KEM/ML-DSA when available)

## 4. Hamiltonian LLMs (HLLMs) for Zoo

- **HLLM-DeFi**: Financial analysis and strategy
- **HLLM-NFT**: Creative content generation
- **HLLM-Game**: Game mechanics and NPC behavior
- **HLLM-Gov**: Governance proposal analysis

## 5. Smart Contract Standards

- **ZRC-20**: Fungible token standard
- **ZRC-721**: NFT standard
- **ZRC-1155**: Multi-token standard
- **ZRC-4626**: Tokenized vault standard
- **ZRC-Gaming**: GameFi asset standard

## 6. ZIP Process

### Lifecycle
Idea → Draft → Review → Last Call (14d) → Final → Superseded

### Types
- **Standards Track**: Core / DeFi / Gaming / ZRC
- **Meta**: Process & governance
- **Informational**: Best practices

### Numbering Convention
- 0-99: Core/governance
- 100-199: DeFi protocols
- 200-299: NFT/marketplace
- 300-399: Gaming/metaverse
- 400-499: AI integration
- 500+: Application standards

## 7. Development Principles

- **User-first**: Intuitive, mobile-first, seamless Web3
- **AI-enhanced**: Recommendations, automation, adaptive gameplay
- **Economic sustainability**: Balanced tokenomics, anti-inflation, fair distribution
- **Security-by-default**: PQC-ready, multisig + timelocks, audits

## 8. Ecosystem Components

### 8.1 DeFi Suite
- **Core**: ZooSwap (AMM), ZooLend, ZooVault (4626), ZooStake (LST)
- **Advanced**: AI-assisted strategy, cross-chain liquidity, IL protection, flash-arb tools

### 8.2 NFT Marketplace
- AI-generated art/metadata
- Dynamic traits
- Fractionalization
- NFT-backed loans

### 8.3 GameFi
- Play-to-Earn / Move-to-Earn / Learn-to-Earn / Create-to-Earn
- AI NPCs, dynamic narrative, anti-cheat

### 8.4 Metaverse
- User land, avatars, social hubs, commerce
- In-world economy

## 9. Community Governance

- **ZOO**: Governance token
- **veZOO**: Vote-escrowed governance (optional)
- **Proposals**: On-chain voting
- **Treasury**: Community-directed (see §11)

**Decision Mechanisms**: Token-weighted + optional quadratic; timelocks; emergency procedures

**Incentives**: Staking, proposer/reviewer rewards, participation bonuses, long-term locks

## 10. 501(c)(3) Non-Profit Legal Framework

**Purpose**: Zoo operates zoo.fund as a decentralized funding platform under a U.S. 501(c)(3) wrapper. This enables tax-deductible donations, legal clarity, and liability protection while preserving decentralized decision-making (board retains limited compliance veto).

### 10.1 Structural Model (Primary)

- **501(c)(3) Corporation** hosts the DAO platform as a charitable program; board oversees compliance and mission
- **Token-governed decisions**: Community votes; board generally executes results unless a vote would violate law/mission (board retains discretion & control, an IRS expectation in fiscal sponsorship contexts)
- **Sub-DAOs**: Treated as fiscally sponsored projects (Model A/C as appropriate)

### 10.2 Alternative/Sovereign Wrappers (Spin-Outs)

A sub-DAO may "spin out" to its own wrapper:
- **New 501(c)(3)** (after determination)
- **Alternate fiscal sponsor** (Model C)
- **Wyoming DUNA** (Decentralized Unincorporated Nonprofit Association), a nonprofit DAO legal structure enacted in 2024

**Spin-out mechanics**: Board resolution; Exit/Transfer Agreement moving restricted assets with charitable-use covenants; update Safe signers and on-chain pointers; publish exit hash for auditability. (Common in sponsorship exits.)

### 10.3 Examples/Precedents (reference)
- **Big Green DAO**: Nonprofit-led decentralized grantmaking
- **Endaoment**: On-chain 501(c)(3) enabling crypto donations with high transparency

## 11. Treasury & Donation Flows

### 11.1 Donation Paths
- **Using Zoo wrapper (tax-deductible)**: Funds flow to nonprofit-controlled wallets/Smart Treasury (project-restricted). Receipts issued by Zoo.
- **Sovereign sub-DAO (no wrapper)**: Donations flow to the sub-DAO's treasury; no tax receipt from Zoo.

### 11.2 Platform/Admin Fee
Zoo may retain 5-10% of donations as an admin/platform fee for audits, compliance, infra—standard in fiscal sponsorships when disclosed. Implement split in contracts; disclose on receipts/UX.

### 11.3 Yield & UBIT
Staking/reward income is taxable income when received (Rev. Rul. 2023-14); for an exempt org may be UBIT if unrelated—consider a taxable subsidiary to house yield operations and upstream net to the nonprofit.

## 12. Token Compliance Framework

### 12.1 ZOO (Governance/Utility)
- **Rights**: Vote, access features; no equity, dividends, or profit rights; not marketed as investment

### 12.2 KEEPER (Donor Governance)
- **Acquisition**: Issued upon charitable donation to Zoo treasury (project-restricted)
- **Nature**: Non-transferable (soulbound) governance weight; no financial rights; intended FMV de minimis for receipt purposes (facts/circumstances control)
- **Disclosure**: Receipts state that KEEPER has no monetary value and conveys only governance rights

**Quid-pro-quo**: If a donor receives goods/services (e.g., a Beluga NFT), Zoo must provide a written disclosure when the payment exceeds $75, and the donor's deduction is reduced by the FMV of the premium. Keep KEEPER separate from premiums.

## 13. NFTs, Premiums & Appraisals

### 13.1 Beluga NFT (Donor Premium) Pattern
- Donor gives (e.g., $10,000); receives Beluga NFT with FMV (e.g., $300) as a premium; KEEPER also issued (no FMV)
- Receipt shows donation and FMV of NFT; deductible amount = donation − FMV; include standard quid-pro-quo disclosure (>$75 rule)
- **Yield handling**: If Beluga NFT or associated position produces yield, route all yield to the nonprofit treasury (not to the donor) to avoid private benefit; plan for UBIT or use a taxable subsidiary for yield ops

### 13.2 Donating Crypto/NFTs (as property)
Crypto/NFT donations ≥ $5,000 require a qualified appraisal for donor deductions; exchange price alone does not replace an appraisal. (Attach Form 8283.)

## 14. For-Profit vs. Non-Profit Recipients

- **Non-profit recipients**: Standard grants aligned to mission
- **For-profit recipients**: Allowed only via restricted charitable grants with open/public-benefit deliverables (e.g., open data, open-source, non-excludable conservation outputs), reporting, and clawbacks. No equity/returns to donors or Zoo—not investment placements.

## 15. Board Governance Integration

**Principle**: Community votes advise/drive execution; board retains a narrow compliance veto (law/mission/donor-restriction).

### Policy Extract

> The Board adopts on-chain advisory voting for program funds. The Board retains discretion to decline any voted action that would violate law, Articles, charitable purpose, or donor restrictions. Otherwise, the organization executes voted actions as-is.

### On-chain Hooks (pseudocode)

```solidity
contract BoardGovernance {
    mapping(uint256 => bool) public vetoed;

    function recordVoteResult(uint256 proposalId, bytes calldata decisionHash) external {
        // store decision and timestamp (off-chain system later executes)
    }

    function veto(uint256 proposalId, string calldata reason) external /* onlyBoard */ {
        vetoed[proposalId] = true;
    }
}
```

## 16. Treasury Management (contracts & ops)

### Smart Treasury (nonprofit-controlled)

```solidity
contract NonProfitTreasury {
    address public nonprofitSafe; // Gnosis Safe controlled by nonprofit
    uint16  public adminFeeBps = 500; // 5%, configurable

    event Donation(address indexed donor, uint256 amount, bytes32 projectId);
    event KeeperIssued(address indexed donor, uint256 amount, bytes32 projectId);

    function donate(bytes32 projectId) external payable {
        uint256 fee = (msg.value * adminFeeBps) / 10_000;
        uint256 net = msg.value - fee;
        // forward to nonprofit Safe with project memo
        // issue KEEPER via separate token contract (non-transferable)
        emit Donation(msg.sender, msg.value, projectId);
        emit KeeperIssued(msg.sender, msg.value, projectId);
    }
}
```

**Compliance note**: Dollar thresholds (e.g., $75, $5,000) and receipt math are handled off-chain in the receipt service referencing current IRS guidance (Pub. 1771, Form 8283, etc.).

## 17. Sub-DAO Sovereignty Model

### 17.1 Launch (using Zoo wrapper)
- Safe per sub-DAO (nonprofit signers included for custody of charitable assets)
- Donation router splits X% to project, Y% to Zoo ops; issues tax receipt + KEEPER
- Governance: sub-DAO votes; nonprofit executes unless veto for compliance

### 17.2 Exit / Spin-out
- Sub-DAO forms successor wrapper (its own 501(c)(3), another sponsor, or Wyoming DUNA)
- Exit/Transfer: move restricted balance with charitable-use covenants; update dApp pointers; publish on-chain exit hash

### 17.3 Fully Sovereign (no wrapper)
- Donations go directly to sub-DAO Safe; no Zoo receipts; Zoo does not control funds
- Optional listing on zoo.fund (infra only; no tax advantage)

## 18. Compliance & Risk (operational checklist)

- **Quid-pro-quo (> $75)**: Written disclosure to donors when they receive premiums; reduce deduction by FMV
- **Qualified appraisal (> $5k crypto/NFT)**: Required for donor deduction (Form 8283)
- **Staking/yield**: Taxable when received (Rev. Rul. 2023-14); consider taxable subsidiary for yield ops
- **Charitable solicitation (web)**: Follow Charleston Principles; expect multistate registration for nationwide wallet-connect fundraising
- **AML/sanctions**: Screen large/flagged addresses; reserve right to reject/refund
- **Conflicts**: Apply COI policy; board recusal where insiders are implicated
- **Transparency**: Publish treasury addresses, grant agreements, and vote outcomes (Endaoment/Big Green show benefits)

## 19. Security Architecture

- **Smart contracts**: Multisig, timelocks, upgrade gates, emergency pause
- **PQC**: Track Lux PQC rollout; adopt ML-KEM/ML-DSA endpoints when ready
- **Economic**: Anti-manipulation, oracle redundancy, slashing, insurance funds

## 20. Implementation Requirements

**ZIP authors**: Problem, economic impact, security, timeline, community benefit

**Developers**: Spec adherence, tests, gas optimization, audit readiness

## 21. Roadmap (2025)

- **Q1**: HLLM integration; AI-optimized AMM; NFT marketplace v2
- **Q2**: GameFi beta; cross-chain bridge; mobile app
- **Q3**: Metaverse alpha; advanced DeFi strategies; DAO v2
- **Q4**: Full integration; enterprise partners; global expansion

## 22. References

1. **IRS Pub 1771** – Substantiation & disclosure (quid-pro-quo) and receipts
2. **IRS CCA 202302012** – Qualified appraisal required for crypto donations > $5k
3. **Rev. Rul. 2023-14** – Staking rewards taxable when donor has dominion/control
4. **Charleston Principles** – Internet charitable solicitation guidance
5. **Fiscal sponsorship models (Model A/C)** – Nonprofit Law Blog (Takagi/NEO)
6. **Wyoming DUNA** – 2024 legislation enabling decentralized nonprofit DAOs
7. **Endaoment / Big Green DAO** – On-chain nonprofit & decentralized grantmaking precedent
8. [Zoo Documentation](https://docs.zoo.ai)
9. [Lux Network](https://lux.network)
10. [Hanzo AI](https://hanzo.ai)

## 23. Implementation Notes

1. **Receipts & thresholds**: Keep all IRS dollar thresholds (e.g., $75 quid-pro-quo disclosure; appraisal thresholds) out of chain code. Resolve them in a Receipt Service that references current IRS publications at runtime.

2. **Yield ops**: If you proceed with yield strategies, set up a taxable C-corp subsidiary now so accounting/UBIT is clean when volumes grow (standard nonprofit pattern).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).