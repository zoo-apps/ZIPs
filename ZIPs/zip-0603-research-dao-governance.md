---
zip: 603
title: "Research DAO Governance"
description: "DAO governance for research funding allocation with quadratic voting, milestone-based disbursement, and conflict of interest detection."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
created: 2025-01-15
tags: [dao, governance, quadratic-voting, grants, funding]
requires: [0, 540, 600]
---

# ZIP-603: Research DAO Governance

## Abstract

This ZIP defines the governance framework for Zoo's Research DAO, a purpose-built decentralized autonomous organization for allocating research funding. The DAO uses quadratic voting to amplify the voice of individual community members over large token holders, milestone-based grant disbursement to ensure accountability, and an on-chain conflict of interest detection system to prevent self-dealing. The Research DAO operates within the legal structure of Zoo Labs Foundation (501(c)(3)) as described in ZIP-0 Sections 10-18, with the Foundation board retaining a narrow compliance veto.

## Motivation

Research funding allocation has historically been controlled by small committees of grant program officers at agencies like NSF, NIH, and the European Research Council. While peer review provides quality control, this centralized model has well-documented biases:

1. **Conservatism**: Panels favor incremental research over high-risk, high-reward proposals. Breakthrough ideas are systematically underfunded.
2. **Network effects**: Researchers with existing institutional connections and track records receive disproportionate funding. Early-career researchers and those from underrepresented institutions are disadvantaged.
3. **Geographic bias**: Funding is concentrated in wealthy nations. Conservation research in biodiversity-rich developing nations is chronically underfunded despite having the greatest impact potential.
4. **Slow cycle times**: Traditional grant cycles take 6-18 months from submission to funding decision. Conservation emergencies (disease outbreaks, habitat destruction events) cannot wait.
5. **Opacity**: Funding decisions are opaque. Rejected applicants receive minimal feedback. There is no public record of why one proposal was funded over another.

Zoo Labs Foundation requires a funding mechanism that is transparent, community-driven, bias-resistant, and fast enough to respond to conservation emergencies. The Research DAO provides this mechanism while remaining compliant with 501(c)(3) requirements for charitable fund deployment.

### Cross-Ecosystem Context

- **LP-8800 through LP-8805** (Lux DAO Governance Platform): On-chain proposal lifecycle, voting mechanics, and treasury integration patterns.
- **LP-8993** (Lux Community Development Grants): Milestone-based grant disbursement and community evaluation framework.
- **HIP-0066** (Hanzo Data Governance): Conflict of interest detection and data access control patterns.

## Specification

### 1. DAO Structure

#### 1.1 Governance Hierarchy

```
Zoo Labs Foundation Board (501(c)(3) compliance veto)
    |
    v
Research DAO Council (elected, 7-11 members)
    |
    +-- Funding Committee (reviews proposals, recommends allocation)
    +-- Ethics Committee (reviews COI, ensures ZIP-540 compliance)
    +-- Technical Committee (reviews methodology, feasibility)
    |
    v
ZOO Token Holders (vote on proposals, elect council)
    |
    v
KEEPER Token Holders (donor governance weight, non-transferable)
```

#### 1.2 Council Election

| Parameter | Value |
|-----------|-------|
| **Council size** | 7 members (expandable to 11 by governance vote) |
| **Term length** | 6 months |
| **Election method** | Ranked-choice voting, ZOO + KEEPER weighted |
| **Eligibility** | 1000+ ZOO staked for 90+ days OR 500+ KEEPER |
| **Minimum voter turnout** | 10% of circulating ZOO |
| **Seat reserve** | At least 2 seats for contributors from Global South institutions |

#### 1.3 Council Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Proposal triage** | Assign proposals to review committees |
| **Reviewer assignment** | Select peer reviewers per ZIP-600 Section 2 |
| **Emergency funding** | Authorize emergency grants up to 5,000 ZOO without full vote |
| **Parameter adjustment** | Propose changes to governance parameters |
| **Dispute resolution** | Final arbiter for funding disputes |
| **Compliance reporting** | Quarterly report to Foundation board |

### 2. Proposal Process

#### 2.1 Proposal Types

| Type | Funding Range | Approval Mechanism | Timeline |
|------|---------------|-------------------|----------|
| **Micro-grant** | 1-500 ZOO | Council approval (simple majority) | 7 days |
| **Standard grant** | 501-10,000 ZOO | Quadratic vote + council ratification | 30 days |
| **Major grant** | 10,001-100,000 ZOO | Quadratic vote + council supermajority + board non-veto | 60 days |
| **Emergency grant** | 1-5,000 ZOO | Council emergency approval (5/7 minimum) | 48 hours |
| **Retroactive reward** | 1-50,000 ZOO | Quadratic vote | 30 days |

#### 2.2 Proposal Submission

Proposals follow the ZIP-600 schema with additional governance fields:

```json
{
  "proposalId": "bytes32",
  "proposalType": "enum(MICRO, STANDARD, MAJOR, EMERGENCY, RETROACTIVE)",
  "title": "string",
  "abstract": "string",
  "fullProposalCid": "string",
  "principalInvestigator": "address",
  "fundingRequested": "uint256",
  "milestones": [...],
  "conflictDisclosure": {
    "affiliations": ["string"],
    "priorFunding": ["string"],
    "relationships": ["string"],
    "financialInterests": ["string"]
  },
  "impactStatement": {
    "conservationOutcome": "string",
    "communityBenefit": "string",
    "openScienceCommitment": "string"
  }
}
```

#### 2.3 Proposal Lifecycle

```
DRAFT
  |
  v
SUBMITTED (bond deposited per ZIP-600)
  |
  v
TRIAGE (council assigns to committee, 3 days max)
  |
  v
REVIEW (peer review per ZIP-600 Section 2, committee evaluation)
  |
  v
COI_CHECK (automated + manual conflict screening, see Section 4)
  |
  v
VOTING (quadratic vote for Standard/Major/Retroactive)
  |
  v
RATIFICATION (council ratification for Standard; council + board non-veto for Major)
  |
  v
FUNDED (escrow created, first milestone unlocked)
  |
  v
ACTIVE (milestones tracked per ZIP-600 Section 3)
  |
  v
COMPLETED (final report submitted, remaining funds released)
```

### 3. Quadratic Voting

#### 3.1 Voting Mechanism

Quadratic voting (QV) ensures that the cost of additional votes increases quadratically, preventing whale dominance:

```
VotingPower = sqrt(tokensAllocated)

Example:
  1 ZOO   = 1.0 vote
  4 ZOO   = 2.0 votes
  9 ZOO   = 3.0 votes
  100 ZOO = 10.0 votes
  10000 ZOO = 100.0 votes
```

#### 3.2 Voice Credits

Each voting epoch, participants receive voice credits based on their governance weight:

```
VoiceCredits = BaseCredits + StakingBonus + KeeperBonus

Where:
  BaseCredits   = 100 (equal for all participants)
  StakingBonus  = min(100, sqrt(staked_ZOO))
  KeeperBonus   = min(50, sqrt(KEEPER_balance))
```

Voice credits are non-transferable and expire at the end of each voting epoch (30 days). Unused credits do not carry over.

#### 3.3 Vote Options

| Option | Description |
|--------|-------------|
| **YES** | Fund the proposal |
| **NO** | Do not fund the proposal |
| **ABSTAIN** | Counted for quorum, not for outcome |

#### 3.4 Approval Thresholds

| Proposal Type | Quorum (% of active voice credits) | Approval (YES / (YES + NO)) |
|---------------|-------------------------------------|------------------------------|
| **Standard** | 15% | > 50% |
| **Major** | 25% | > 60% |
| **Retroactive** | 15% | > 50% |

#### 3.5 Matching Funds (Quadratic Funding)

For Standard and Major grants, community YES votes trigger matching funds from the Research Treasury:

```
MatchingAmount = (sum(sqrt(individual_contribution_i)))^2 - sum(individual_contribution_i)
```

This is the standard quadratic funding formula (Buterin, Hitzig, Weyl 2018). The matching pool is capped at the treasury allocation for the current epoch.

### 4. Conflict of Interest Detection

#### 4.1 Automated Screening

The protocol performs automated COI screening at proposal submission and before each vote:

| Check | Method | Action |
|-------|--------|--------|
| **Self-funding** | PI address matches voter address | Auto-recusal from vote |
| **Institutional affiliation** | DID credential matching | Flag, require disclosure |
| **Co-authorship history** | On-chain publication graph (ZIP-600) | Flag if co-authored within 3 years |
| **Prior funding relationship** | Proposal history matching | Flag if PI reviewed voter's proposal |
| **Token transfer history** | On-chain transfer graph analysis | Flag if direct transfer within 90 days |
| **Shared multi-sig membership** | Gnosis Safe co-signer detection | Flag, require disclosure |

#### 4.2 COI Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **NONE** | No detected conflicts | Normal voting |
| **MINOR** | Indirect relationship (same institution, no direct collaboration) | Must disclose, may vote |
| **MODERATE** | Direct collaboration history, shared funding | Must disclose, vote weight halved |
| **SEVERE** | Financial interest, direct relationship with PI | Mandatory recusal |
| **CRITICAL** | Self-dealing or undisclosed severe conflict | Recusal + reputation penalty |

#### 4.3 COI Appeals

Contributors flagged for COI may appeal:

1. Submit written explanation to Ethics Committee.
2. Ethics Committee rules within 7 days.
3. Appeal to full Council if Ethics Committee ruling is disputed.
4. Council decision is final.

#### 4.4 Smart Contract Interface

```solidity
interface IConflictDetector {
    function checkConflict(address voter, bytes32 proposalId) external view returns (
        uint8 severityLevel,
        string[] memory reasons
    );
    function declareConflict(bytes32 proposalId, string calldata disclosure) external;
    function recuse(bytes32 proposalId) external;
    function appealConflict(bytes32 proposalId, string calldata justification) external;
}
```

### 5. Milestone-Based Disbursement

#### 5.1 Milestone Evaluation

Each milestone is evaluated by the Technical Committee:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Deliverable completion** | 40% | All stated deliverables produced |
| **Data quality** | 20% | Data meets ZIP-601 quality standards |
| **Open access compliance** | 15% | All outputs published as committed |
| **Timeline adherence** | 10% | Delivered within deadline (grace period: 14 days) |
| **Budget compliance** | 15% | Spending within 20% of budgeted amounts |

Score >= 60%: Milestone approved, funds released.
Score 40-59%: Conditional approval, remediation plan required within 14 days.
Score < 40%: Milestone failed, remediation period per ZIP-600.

#### 5.2 Disbursement Schedule

```
Proposal funded (total: N ZOO)
    |
    v
Milestone 1 (X% of N): Released upon M1 approval
    |
    v
Milestone 2 (Y% of N): Released upon M2 approval
    |
    ...
    v
Final milestone (Z% of N): Released upon completion + final report
    |
    v
Holdback (10% of N): Released 90 days after completion if no disputes
```

The 10% holdback incentivizes researchers to remain responsive for post-completion questions and data requests.

### 6. Treasury Management

#### 6.1 Research Treasury

The Research Treasury is a dedicated allocation from the Zoo Treasury:

| Allocation | Source | Governance |
|------------|--------|------------|
| **Core research fund** | Zoo Treasury allocation (quarterly) | DAO vote per ZIP-0 Section 9 |
| **Quadratic matching pool** | Dedicated matching fund | Sized per epoch by Council |
| **Emergency fund** | 5% of core fund, ring-fenced | Council access only |
| **Retroactive fund** | 10% of core fund | DAO vote for retroactive awards |

#### 6.2 Fund Accounting

All disbursements are tracked on-chain with per-proposal accounting:

```solidity
interface IResearchTreasury {
    function getEpochBudget() external view returns (uint256);
    function getMatchingPool() external view returns (uint256);
    function getEmergencyFund() external view returns (uint256);
    function getProposalDisbursed(bytes32 proposalId) external view returns (uint256);
    function getEpochDisbursed() external view returns (uint256);
}
```

### 7. 501(c)(3) Compliance

#### 7.1 Board Veto

Per ZIP-0 Section 15, the Foundation board retains a narrow compliance veto:

```
Proposal approved by DAO
    |
    v
Board review (Major grants only, 7-day window)
    |
    v
Board action:
  - NO ACTION (default): Proposal proceeds
  - VETO (with published reason): Only for law/mission/donor-restriction violation
```

Veto reasons are recorded on-chain and must cite specific legal or policy grounds. The board cannot veto based on scientific disagreement.

#### 7.2 Charitable Purpose Alignment

All funded proposals must advance Zoo Labs Foundation's charitable purposes:

- Conservation science and wildlife protection
- Open AI research for environmental benefit
- Environmental education and community science
- Decentralized science infrastructure as public good

### 8. Protocol Parameters

| Parameter | Default | Governance-Adjustable |
|-----------|---------|----------------------|
| **Council size** | 7 | Yes (7-11) |
| **Council term** | 6 months | Yes (3-12 months) |
| **Base voice credits** | 100 | Yes |
| **Voting epoch** | 30 days | Yes |
| **Micro-grant ceiling** | 500 ZOO | Yes |
| **Standard grant ceiling** | 10,000 ZOO | Yes |
| **Emergency grant ceiling** | 5,000 ZOO | Yes |
| **Milestone holdback** | 10% | Yes (5-20%) |
| **Holdback release delay** | 90 days | Yes |
| **Board veto window** | 7 days | Yes (3-14 days) |

## Rationale

1. **Quadratic voting**: QV is chosen over simple token-weighted voting because research funding decisions should reflect community breadth, not capital concentration. A whale should not be able to single-handedly fund a project that benefits their own portfolio.
2. **Council layer**: Pure direct democracy is too slow and lacks domain expertise for research evaluation. The elected Council provides fast triage and emergency response while community votes control major decisions.
3. **Mandatory COI detection**: Self-dealing is the primary governance attack vector in DAO-funded research. Automated on-chain detection catches obvious conflicts; the Ethics Committee handles nuanced cases.
4. **Milestone disbursement**: Adapted from LP-8993 (Lux Community Development Grants). Milestone-based release with holdback is standard practice in both traditional grants and crypto ecosystem grants (Optimism RPGF, Gitcoin).
5. **501(c)(3) board veto**: The narrow veto preserves the legal structure required for tax-deductible donations while minimizing centralized control. The board cannot override community decisions on scientific grounds.

## Security Considerations

- **Governance attacks**: A well-funded attacker could acquire ZOO tokens to influence voting. Quadratic voting significantly increases the cost of such attacks (cost grows quadratically with desired influence). The Council ratification layer provides a human check.
- **Collusion**: Voters could coordinate to concentrate quadratic funding matching on a specific proposal. The COI detection system flags unusual voting patterns and shared financial relationships. Anti-collusion mechanisms from MACI (Minimal Anti-Collusion Infrastructure) may be adopted in a future ZIP.
- **Council capture**: Council members could collude to approve self-serving micro-grants that bypass community voting. The 5,000 ZOO emergency ceiling, public on-chain records, and Foundation board oversight mitigate this risk.
- **Vote buying**: Off-chain vote buying (paying someone to vote YES) is difficult to detect. Future integration with MACI would make vote buying provably ineffective by allowing voters to change votes privately after the buying agreement.
- **Treasury drain**: A sustained attack of many small proposals could drain the treasury without triggering Major grant oversight. Epoch-based budgets cap total disbursement per period. The Council monitors aggregate spending.
- **Flash loan voting**: ZOO acquired via flash loan could be used to vote. The protocol requires tokens to be staked for the full voting period (30 days minimum), making flash loan attacks economically infeasible.

## References

- [ZIP-0](zip-0000-zoo-ecosystem-architecture-framework.md): Zoo Ecosystem Architecture & Framework (Sections 9-18)
- [ZIP-540](zip-0540-research-ethics-data-governance.md): Research Ethics & Data Governance
- [ZIP-600](zip-0600-desci-protocol-framework.md): DeSci Protocol Framework
- LP-8800 through LP-8805: Lux DAO Governance Platform
- LP-8993: Lux Community Development Grants
- HIP-0066: Hanzo Data Governance
- Buterin, V., Hitzig, Z., Weyl, E. G. "A Flexible Design for Funding Public Goods." Management Science 65(11), 5171-5187 (2019).
- Optimism Collective. "Retroactive Public Goods Funding." https://community.optimism.io/docs/citizen-house/
- Gitcoin. "Quadratic Funding." https://wtfisqf.com/

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
