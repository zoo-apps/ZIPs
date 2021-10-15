---
zip: 600
title: "DeSci Protocol Framework"
description: "Core decentralized science coordination framework for on-chain research proposals, peer review, funding, and publication."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
originated: 2021-10
traces-from: "Whitepaper sections 23 (Open Source) and 05 (Supporting Non-Profits)"
follow-on: [zoo-desci-platform]
created: 2025-01-15
tags: [desci, research, governance, funding, peer-review]
requires: [0, 540]
---

# ZIP-600: DeSci Protocol Framework

## Abstract

This ZIP defines the foundational Decentralized Science (DeSci) protocol for the Zoo ecosystem. It establishes on-chain primitives for the full research lifecycle: proposal submission, peer review coordination, funding allocation, milestone tracking, data publication, and reproducibility verification. The protocol creates a permissionless, transparent, and incentive-aligned system for scientific research that preserves academic rigor while removing gatekeepers from the funding and publication pipeline.

## Motivation

Traditional scientific research suffers from well-documented structural failures:

1. **Funding bottlenecks**: Grant agencies reject 75-85% of proposals, and review cycles take 6-18 months. Early-career researchers and non-institutional scientists are systematically disadvantaged.
2. **Publication bias**: Journals favor positive results, creating a replication crisis. Negative results and null findings are rarely published despite their scientific value.
3. **Opaque review**: Peer review is closed, slow, and inconsistent. Reviewers receive no compensation or reputation credit for quality work.
4. **Data silos**: Research data is locked behind institutional paywalls and proprietary formats, hindering reproducibility and meta-analysis.
5. **Misaligned incentives**: Researchers optimize for publication count and impact factor rather than scientific truth and reproducibility.

Zoo Labs Foundation, as a 501(c)(3) focused on open AI research and conservation science, requires a protocol-level framework that aligns incentives toward reproducible, open, and impactful research. This ZIP provides that framework, building on the ethical foundations of ZIP-540 (Research Ethics & Data Governance) and integrating with the broader Zoo governance system defined in ZIP-0 (Ecosystem Architecture).

### Cross-Ecosystem Context

This proposal draws on governance patterns from:

- **HIP-0066** (Hanzo Data Governance): Data classification, access control, and lifecycle management primitives.
- **HIP-0045** (Hanzo Documentation Framework): Structured metadata and versioning for technical artifacts.
- **LP-8800 through LP-8805** (Lux DAO Governance Platform): On-chain proposal lifecycle, voting mechanics, and treasury integration.

## Specification

### 1. Research Proposal Lifecycle

A research proposal is an on-chain object with the following state machine:

```
DRAFT --> SUBMITTED --> UNDER_REVIEW --> FUNDED --> ACTIVE --> COMPLETED
                |              |            |          |
                v              v            v          v
            WITHDRAWN      REJECTED    CANCELLED    FAILED
```

#### 1.1 Proposal Schema

```json
{
  "proposalId": "bytes32",
  "version": "uint16",
  "title": "string",
  "abstract": "string",
  "ipfsCid": "string",
  "principalInvestigator": "address",
  "coInvestigators": ["address"],
  "institution": "string",
  "category": "enum(CONSERVATION, AI, BIODIVERSITY, CLIMATE, SOCIAL)",
  "fundingRequested": "uint256",
  "currency": "address",
  "milestones": [
    {
      "description": "string",
      "deliverables": ["string"],
      "fundingPortion": "uint16",
      "deadline": "uint64"
    }
  ],
  "ethicsReviewStatus": "enum(EXEMPT, EXPEDITED, FULL)",
  "dataManagementPlan": "string",
  "openAccessCommitment": "bool",
  "createdAt": "uint64",
  "updatedAt": "uint64"
}
```

#### 1.2 Submission Requirements

| Field | Requirement |
|-------|-------------|
| **Full proposal document** | IPFS-pinned PDF/Markdown with methodology, budget, timeline |
| **Ethics classification** | Self-assessed per ZIP-540 categories (Exempt/Expedited/Full) |
| **Data management plan** | Per ZIP-540 FAIR/CARE principles |
| **Open access commitment** | All outputs CC-BY or CC0 unless restricted per ZIP-540 |
| **Milestone breakdown** | Minimum 2 milestones; each with measurable deliverables |
| **Conflict of interest** | Disclosed affiliations and funding sources |

#### 1.3 Proposal Bond

Submitters deposit a bond of 100 ZOO (configurable by governance) to prevent spam. The bond is returned upon completion or if the proposal reaches UNDER_REVIEW regardless of outcome. Bonds are slashed only for proposals found to violate ZIP-540 ethics standards.

### 2. Peer Review Coordination

Peer review is managed on-chain with off-chain review content stored on IPFS.

#### 2.1 Reviewer Assignment

```
1. Proposal enters SUBMITTED state
2. Review coordinator (elected per ZIP-603) assigns 3-5 reviewers
3. Reviewers are selected from the Reviewer Registry based on:
   - Domain expertise tags
   - Reputation score (see Section 2.3)
   - Absence of conflict of interest (see ZIP-603)
   - Availability and recent workload
4. Reviewers accept or decline within 7 days
5. Declined slots are reassigned automatically
```

#### 2.2 Review Schema

```json
{
  "reviewId": "bytes32",
  "proposalId": "bytes32",
  "reviewer": "address",
  "ipfsCid": "string",
  "scores": {
    "scientificMerit": "uint8(1-10)",
    "methodology": "uint8(1-10)",
    "feasibility": "uint8(1-10)",
    "impact": "uint8(1-10)",
    "ethics": "uint8(1-10)"
  },
  "recommendation": "enum(FUND, REVISE, REJECT)",
  "confidenceLevel": "uint8(1-5)",
  "submittedAt": "uint64"
}
```

#### 2.3 Reviewer Reputation

Reviewers accumulate reputation through a staking and scoring mechanism:

| Action | Reputation Effect |
|--------|-------------------|
| **Complete review on time** | +10 base points |
| **Review quality score > 8/10** | +5 bonus points |
| **Review cited by other reviewers** | +3 per citation |
| **Review overturned by appeal** | -15 points |
| **Missed deadline** | -10 points |
| **Conflict of interest violation** | -50 points, temporary suspension |

Reputation decays at 5% per quarter to incentivize continued participation.

### 3. Funding Mechanism

#### 3.1 Funding Sources

| Source | Mechanism |
|--------|-----------|
| **Zoo Treasury** | Direct allocation via ZIP-603 governance |
| **Quadratic Funding Rounds** | Community-matched donations per ZIP-603 |
| **Earmarked Grants** | Donor-restricted funds per ZIP-0 Section 11 |
| **Retroactive Public Goods** | Post-completion rewards for high-impact research |

#### 3.2 Milestone-Based Disbursement

Funds are held in escrow and released per milestone:

```
Milestone submitted by PI
        |
        v
Milestone reviewed by 2+ reviewers (7-day window)
        |
        v
Milestone approved (majority vote)
        |
        v
Funds released to PI address
```

Failed milestones trigger a 30-day remediation period. Two consecutive failed milestones move the proposal to FAILED state and remaining funds return to the treasury.

#### 3.3 Escrow Contract Interface

```solidity
interface IResearchEscrow {
    function depositFunds(bytes32 proposalId) external payable;
    function releaseMilestone(bytes32 proposalId, uint16 milestoneIndex) external;
    function failMilestone(bytes32 proposalId, uint16 milestoneIndex, string calldata reason) external;
    function cancelProposal(bytes32 proposalId) external;
    function getProposalBalance(bytes32 proposalId) external view returns (uint256);
}
```

### 4. Publication and Data Registry

#### 4.1 Publication Record

All funded research must produce a publication record on-chain:

| Field | Description |
|-------|-------------|
| **proposalId** | Link to original proposal |
| **ipfsCid** | Full paper/report on IPFS |
| **datasetCids** | Associated datasets on IPFS |
| **codeCid** | Analysis code repository hash |
| **license** | CC-BY-4.0, CC0, or approved alternative |
| **peerReviewCids** | Post-publication review records |
| **reproducibilityStatus** | VERIFIED, UNVERIFIED, FAILED |

#### 4.2 Reproducibility Verification

Independent researchers may submit reproducibility reports:

```
1. Claim a publication for reproducibility verification
2. Execute methodology using published data and code
3. Submit reproducibility report with results comparison
4. Report reviewed by original reviewers + 1 independent
5. Publication record updated with reproducibility status
```

Successful reproducibility verification earns both the original PI and the verifier reputation and token rewards.

### 5. Smart Contract Architecture

```
ResearchRegistry (upgradeable proxy)
    |
    +-- ProposalManager
    |       Manages proposal lifecycle and state transitions
    |
    +-- ReviewCoordinator
    |       Assigns reviewers, collects reviews, computes scores
    |
    +-- FundingEscrow
    |       Holds funds, releases per milestone approval
    |
    +-- PublicationRegistry
    |       Records outputs, tracks reproducibility
    |
    +-- ReputationTracker
            Manages reviewer and PI reputation scores
```

All contracts are deployed behind UUPS proxies with a 48-hour timelock on upgrades, controlled by the Zoo governance multisig.

### 6. Protocol Parameters

| Parameter | Default | Governance-Adjustable |
|-----------|---------|----------------------|
| **Proposal bond** | 100 ZOO | Yes |
| **Review period** | 30 days | Yes |
| **Reviewers per proposal** | 3 | Yes (min 2, max 7) |
| **Milestone review window** | 7 days | Yes |
| **Remediation period** | 30 days | Yes |
| **Reputation decay rate** | 5% / quarter | Yes |
| **Minimum reputation to review** | 50 points | Yes |

## Rationale

1. **On-chain state machine**: Embedding the proposal lifecycle on-chain provides an immutable audit trail and enables trustless milestone disbursement. Off-chain alternatives lack the transparency required for a 501(c)(3) operating in public.
2. **IPFS for content**: Full proposals, reviews, and publications are too large for on-chain storage. IPFS provides content-addressed, decentralized storage with the on-chain CID serving as a tamper-proof reference.
3. **Reputation over identity**: The reviewer reputation system avoids requiring real-world identity verification (which conflicts with reviewer anonymity goals in ZIP-604) while still providing sybil resistance through staking and decay.
4. **Milestone-based funding**: Lump-sum grants create moral hazard. Milestone-based disbursement aligns incentives and gives the community early exit if research goes off track.
5. **Retroactive funding**: Including retroactive public goods funding acknowledges that the most impactful research is often only recognized after completion.

## Security Considerations

- **Sybil attacks on review**: Mitigated by minimum reputation thresholds, stake requirements, and conflict-of-interest detection (ZIP-603). A single entity controlling multiple reviewer identities would need to accumulate reputation independently for each.
- **Proposal spam**: The bond mechanism prices out low-effort submissions. Governance can adjust the bond amount in response to spam volume.
- **Escrow risk**: Funds in escrow are at smart contract risk. Contracts must undergo formal verification and at least two independent audits before deployment. Emergency pause functionality is included.
- **IPFS availability**: Content pinning is required by the protocol. Zoo Labs operates pinning infrastructure and requires funded projects to use at least two independent pinning services.
- **Oracle manipulation**: Milestone approval is human-driven (reviewer votes), not oracle-dependent, reducing attack surface. Score aggregation uses median rather than mean to resist outlier manipulation.
- **Governance capture**: Protocol parameter changes require a 48-hour timelock and supermajority vote per ZIP-603, preventing rapid parameter manipulation.

## References

- [ZIP-0](zip-0000-zoo-ecosystem-architecture-framework.md): Zoo Ecosystem Architecture & Framework
- [ZIP-540](zip-0540-research-ethics-data-governance.md): Research Ethics & Data Governance
- [ZIP-560](zip-0560-evidence-locker-index.md): Evidence Locker Index
- [ZIP-603](zip-0603-research-dao-governance.md): Research DAO Governance
- [ZIP-604](zip-0604-decentralized-peer-review.md): Decentralized Peer Review
- HIP-0066: Hanzo Data Governance
- HIP-0045: Hanzo Documentation Framework
- LP-8800 through LP-8805: Lux DAO Governance Platform
- DeSci Foundation. "Decentralized Science Manifesto." 2022.
- Buterin, V. "Retroactive Public Goods Funding." 2021.

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
