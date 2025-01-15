---
zip: 104
title: "Research Funding DAO Treasury"
description: "DAO treasury protocol for funding DeSci research proposals with on-chain grant disbursement"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [dao, treasury, desci, research, grants, governance]
requires: [0, 100]
---

# ZIP-104: Research Funding DAO Treasury

## Abstract

This ZIP specifies a DAO treasury protocol purpose-built for funding decentralized science (DeSci) research proposals within the Zoo ecosystem. The protocol manages a multi-asset treasury, accepts research proposals through a structured on-chain submission and review process, disburses grants in milestone-based tranches, and enforces accountability through clawback mechanisms. It integrates with ZooGovernor for voting, ZIP-101/102 yield sources for treasury growth, and HIP-0066 data governance standards for research output management. The treasury operates under Zoo Labs Foundation's 501(c)(3) framework (ZIP-0 sections 10-14), ensuring grants comply with charitable purpose requirements.

## Motivation

DeSci (Decentralized Science) is a core pillar of the Zoo Labs Foundation. However, traditional research funding suffers from:

1. **Slow disbursement**: NIH/NSF grants take 12-18 months from application to first payment. On-chain treasury can disburse in days.
2. **Opaque allocation**: Peer review is centralized and prone to bias. On-chain voting and transparent criteria enable accountable allocation.
3. **No accountability after funding**: Traditional grants have weak enforcement. Milestone-based on-chain disbursement with clawback ensures deliverables.
4. **Siloed outputs**: Research funded by public money often ends behind paywalls. Zoo-funded research must be open-access under HIP-0066 data governance.
5. **Limited funding sources**: Traditional funding relies on government budgets. Zoo treasury grows from DeFi yield (ZIP-101, ZIP-102), staking rewards (ZIP-103), and direct donations.

The protocol addresses all five problems by combining DeFi treasury management with structured research governance.

## Specification

### 1. Treasury Architecture

```
                            ┌──────────────────────────┐
                            │   ResearchTreasury       │
   Revenue Sources          │   (Multi-asset Gnosis    │
   ─────────────────        │    Safe + Smart Contract) │
   ZIP-101 Bond yield ─────>│                          │──── Grant Disbursement
   ZIP-102 Vault yield ────>│   Assets:                │     (milestone-based)
   ZIP-103 Staking fees ───>│   - ZOO                  │
   Direct donations ───────>│   - ZUSD                 │──── Operating Expenses
   Protocol fees ──────────>│   - WZOO                 │     (capped at 10%)
                            │   - ZLUX                 │
                            └──────┬───────────────────┘
                                   │
                            ZooGovernor
                            (proposal voting)
```

### 2. Core Contracts

#### 2.1 ResearchTreasury

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

contract ResearchTreasury {
    enum ProposalStatus {
        Draft,
        Submitted,
        UnderReview,
        Approved,
        Active,
        MilestoneReview,
        Completed,
        Rejected,
        Clawback
    }

    struct ResearchProposal {
        uint256 id;
        address principalInvestigator;   // Lead researcher
        string  title;
        bytes32 proposalHash;            // IPFS CID of full proposal
        address paymentToken;            // ZOO, ZUSD, etc.
        uint256 totalBudget;
        uint256 disbursed;
        uint256 submittedAt;
        ProposalStatus status;
        uint256 governorProposalId;      // ZooGovernor proposal ID
        string  researchField;           // e.g., "conservation-biology"
        string  speciesTag;              // Target species/ecosystem
    }

    struct Milestone {
        uint256 proposalId;
        uint8   milestoneIndex;
        string  description;
        uint256 amount;                  // Payment for this milestone
        uint256 deadline;
        bytes32 deliverableHash;         // IPFS CID of deliverable
        bool    submitted;
        bool    approved;
        uint8   reviewerApprovals;
    }

    // State
    mapping(uint256 => ResearchProposal) public proposals;
    mapping(uint256 => Milestone[]) public milestones;
    mapping(uint256 => mapping(uint8 => mapping(address => bool))) public reviewerVotes;
    uint256 public nextProposalId;

    address public governance;            // ZooGovernor timelock
    address public multisig;              // Board multisig (3/5)
    uint256 public operatingBudgetBps;    // Max % for ops (default 1000 = 10%)
    uint256 public totalGranted;
    uint256 public totalDisbursed;

    // Reviewer registry
    mapping(address => bool) public reviewers;
    uint8 public constant REVIEW_QUORUM = 3;

    event ProposalSubmitted(uint256 indexed id, address indexed pi, uint256 budget);
    event ProposalApproved(uint256 indexed id, uint256 governorProposalId);
    event ProposalRejected(uint256 indexed id, string reason);
    event MilestoneSubmitted(uint256 indexed proposalId, uint8 milestoneIndex);
    event MilestoneApproved(uint256 indexed proposalId, uint8 milestoneIndex, uint256 amount);
    event FundsClawedBack(uint256 indexed proposalId, uint256 amount, string reason);
    event TreasuryDeposit(address indexed token, uint256 amount, string source);

    /// @notice Submit a new research proposal
    function submitProposal(
        string  calldata title,
        bytes32 proposalHash,
        address paymentToken,
        uint256 totalBudget,
        string  calldata researchField,
        string  calldata speciesTag,
        string[] calldata milestoneDescs,
        uint256[] calldata milestoneAmounts,
        uint256[] calldata milestoneDeadlines
    ) external returns (uint256 id) {
        require(milestoneDescs.length == milestoneAmounts.length, "LENGTH_MISMATCH");
        require(milestoneDescs.length == milestoneDeadlines.length, "LENGTH_MISMATCH");
        require(milestoneDescs.length >= 2, "MIN_2_MILESTONES");
        require(milestoneDescs.length <= 10, "MAX_10_MILESTONES");

        uint256 totalMilestoneAmount;
        for (uint256 i; i < milestoneAmounts.length; i++) {
            totalMilestoneAmount += milestoneAmounts[i];
        }
        require(totalMilestoneAmount == totalBudget, "BUDGET_MISMATCH");

        id = nextProposalId++;
        proposals[id] = ResearchProposal({
            id: id,
            principalInvestigator: msg.sender,
            title: title,
            proposalHash: proposalHash,
            paymentToken: paymentToken,
            totalBudget: totalBudget,
            disbursed: 0,
            submittedAt: block.timestamp,
            status: ProposalStatus.Submitted,
            governorProposalId: 0,
            researchField: researchField,
            speciesTag: speciesTag
        });

        for (uint256 i; i < milestoneDescs.length; i++) {
            milestones[id].push(Milestone({
                proposalId: id,
                milestoneIndex: uint8(i),
                description: milestoneDescs[i],
                amount: milestoneAmounts[i],
                deadline: milestoneDeadlines[i],
                deliverableHash: bytes32(0),
                submitted: false,
                approved: false,
                reviewerApprovals: 0
            }));
        }

        emit ProposalSubmitted(id, msg.sender, totalBudget);
    }

    /// @notice Governor approves proposal after on-chain vote
    function approveProposal(uint256 id, uint256 governorProposalId) external {
        require(msg.sender == governance, "NOT_GOVERNANCE");
        ResearchProposal storage p = proposals[id];
        require(p.status == ProposalStatus.Submitted ||
                p.status == ProposalStatus.UnderReview, "INVALID_STATUS");

        p.status = ProposalStatus.Active;
        p.governorProposalId = governorProposalId;
        totalGranted += p.totalBudget;

        emit ProposalApproved(id, governorProposalId);
    }

    /// @notice Researcher submits milestone deliverable
    function submitMilestone(uint256 proposalId, uint8 milestoneIndex, bytes32 deliverableHash) external {
        ResearchProposal storage p = proposals[proposalId];
        require(msg.sender == p.principalInvestigator, "NOT_PI");
        require(p.status == ProposalStatus.Active, "NOT_ACTIVE");

        Milestone storage m = milestones[proposalId][milestoneIndex];
        require(!m.submitted, "ALREADY_SUBMITTED");
        require(block.timestamp <= m.deadline, "PAST_DEADLINE");

        m.deliverableHash = deliverableHash;
        m.submitted = true;
        p.status = ProposalStatus.MilestoneReview;

        emit MilestoneSubmitted(proposalId, milestoneIndex);
    }

    /// @notice Reviewer approves a milestone deliverable
    function approveMilestone(uint256 proposalId, uint8 milestoneIndex) external {
        require(reviewers[msg.sender], "NOT_REVIEWER");
        require(!reviewerVotes[proposalId][milestoneIndex][msg.sender], "ALREADY_VOTED");

        Milestone storage m = milestones[proposalId][milestoneIndex];
        require(m.submitted, "NOT_SUBMITTED");
        require(!m.approved, "ALREADY_APPROVED");

        reviewerVotes[proposalId][milestoneIndex][msg.sender] = true;
        m.reviewerApprovals++;

        if (m.reviewerApprovals >= REVIEW_QUORUM) {
            m.approved = true;
            ResearchProposal storage p = proposals[proposalId];
            p.status = ProposalStatus.Active;

            // Disburse milestone payment
            IERC20(p.paymentToken).transfer(p.principalInvestigator, m.amount);
            p.disbursed += m.amount;
            totalDisbursed += m.amount;

            emit MilestoneApproved(proposalId, milestoneIndex, m.amount);

            // Check if all milestones complete
            bool allDone = true;
            for (uint256 i; i < milestones[proposalId].length; i++) {
                if (!milestones[proposalId][i].approved) { allDone = false; break; }
            }
            if (allDone) {
                p.status = ProposalStatus.Completed;
            }
        }
    }

    /// @notice Clawback undisbursed funds from abandoned/failed proposal
    function clawback(uint256 proposalId, string calldata reason) external {
        require(msg.sender == governance || msg.sender == multisig, "NOT_AUTHORIZED");
        ResearchProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Active ||
                p.status == ProposalStatus.MilestoneReview, "INVALID_STATUS");

        uint256 remaining = p.totalBudget - p.disbursed;
        p.status = ProposalStatus.Clawback;
        totalGranted -= remaining;

        emit FundsClawedBack(proposalId, remaining, reason);
    }
}
```

### 3. Proposal Lifecycle

```
Researcher                    Reviewers              ZooGovernor           Treasury
───────────                   ─────────              ───────────           ────────
1. Submit proposal
   (IPFS + on-chain)
                              2. Technical review
                                 (off-chain + score)
                                                     3. On-chain vote
                                                        (ZOO holders)
                                                                          4. Proposal approved
                                                                             Budget reserved
5. Execute research
6. Submit milestone 1
   deliverable (IPFS)
                              7. Review deliverable
                                 (quorum: 3/5)
                                                                          8. Disburse tranche 1
9. Submit milestone 2...
   [repeat until complete]
                                                                          10. Mark completed
                                                                              Publish outputs
```

### 4. Proposal Requirements

All proposals must include (in the IPFS document referenced by `proposalHash`):

| Section | Description | Required |
|---------|-------------|----------|
| Abstract | 250-word summary | Yes |
| Background | Prior work and literature | Yes |
| Methodology | Detailed research plan | Yes |
| Conservation Impact | Expected ecological outcomes per ZIP-501 | Yes |
| Budget Breakdown | Per-milestone cost justification | Yes |
| Timeline | Milestone schedule with deadlines | Yes |
| Team | PI and co-investigator qualifications | Yes |
| Data Governance | Open-access plan per HIP-0066 | Yes |
| Ethics | IRB/IACUC approval if applicable | Conditional |
| Species Focus | Target species and habitat | Recommended |

### 5. Research Fields

Proposals must declare a primary research field:

| Field ID | Name | Description |
|----------|------|-------------|
| `conservation-biology` | Conservation Biology | Species population, habitat, genetics |
| `ecological-monitoring` | Ecological Monitoring | Sensor networks, satellite, acoustic |
| `anti-poaching` | Anti-Poaching Technology | Detection, deterrence, forensics |
| `climate-adaptation` | Climate Adaptation | Species migration, resilience |
| `marine-conservation` | Marine Conservation | Ocean ecosystems, fisheries |
| `desci-infrastructure` | DeSci Infrastructure | Tools, protocols, standards |
| `ai-ecology` | AI for Ecology | ML models for ecological analysis |
| `community-conservation` | Community Conservation | Indigenous knowledge, FPIC |

### 6. Treasury Management

#### 6.1 Asset Allocation

| Asset | Target Allocation | Purpose |
|-------|-------------------|---------|
| ZUSD | 40% | Grant disbursement (stable) |
| ZOO | 30% | Governance weight + staking |
| WZOO | 15% | DeFi yield generation |
| ZLUX | 10% | Cross-chain bridge reserves |
| Other | 5% | Diversification buffer |

#### 6.2 Revenue Streams

| Source | Expected Annual | Mechanism |
|--------|----------------|-----------|
| ZIP-101 bond yield overflow | Variable | Conservation bond yield exceeding allocation |
| ZIP-102 vault conservation share | 10-20% of vault yield | Automatic from Impact Yield Vaults |
| ZIP-103 staking conservation split | 10-50% of staker rewards | Per tier commitment |
| Direct donations | Variable | 501(c)(3) tax-deductible |
| Protocol fees | 5% of Zoo DEX volume | LP-9000 fee routing |

#### 6.3 Operating Budget

Operating expenses (infrastructure, reviewers, legal) are capped at 10% of treasury inflows per quarter. This aligns with fiscal sponsorship norms (ZIP-0 section 11.2).

### 7. Data Governance (HIP-0066 Integration)

All research outputs funded by this treasury must comply with HIP-0066:

1. **Open access**: Publications under CC-BY-4.0 or CC0.
2. **Open data**: Datasets published to Zoo data registry within 12 months of collection.
3. **Open code**: Analysis code published under Apache-2.0 or MIT.
4. **Metadata**: Standard metadata schema for discoverability.
5. **Archival**: IPFS-pinned with redundant storage.

Non-compliance triggers milestone rejection and potential clawback.

### 8. Governance Parameters

| Parameter | Default | Range | Governor |
|-----------|---------|-------|----------|
| Review quorum | 3 | 2-7 | ZooGovernor |
| Max proposal budget | 500,000 ZUSD | 10,000-5,000,000 | ZooGovernor |
| Operating budget cap | 10% | 5-15% | ZooGovernor |
| Milestone deadline extension | 30 days | 0-90 days | Multisig |
| Clawback authority | Governor + Multisig | -- | Hardcoded |

## Rationale

**Why milestone-based disbursement?** Lump-sum grants have no accountability mechanism. Milestones ensure researchers deliver before receiving subsequent tranches. This protects treasury funds and aligns incentives.

**Why on-chain proposal submission?** Transparency is a core Zoo value. Every proposal, vote, review, and disbursement is auditable on-chain. This builds trust with donors and the broader DeSci community.

**Why a reviewer quorum instead of pure token voting?** Research quality assessment requires domain expertise. Token-weighted voting alone could approve low-quality proposals backed by large holders. The hybrid model uses token voting for budget approval and expert reviewers for milestone quality assessment.

**Why clawback?** Zoo Labs Foundation has fiduciary obligations under 501(c)(3) law. Funds granted for charitable purposes must be used for those purposes. Clawback is the enforcement mechanism, following ZIP-0 section 14 guidelines for restricted charitable grants.

**Why HIP-0066 mandatory?** Zoo-funded research must serve the public good. Paywalled outputs contradict the Foundation's charitable mission. Open-access requirements ensure funded research benefits the global conservation community.

## Security Considerations

### Treasury Drain
- All disbursements are milestone-gated and require reviewer quorum. No single transaction can drain the treasury.
- Maximum per-proposal budget is governance-controlled.

### Reviewer Collusion
- Minimum 3 reviewers from at least 2 distinct research fields must approve each milestone. Reviewers are governance-registered and stake ZOO tokens.

### Proposal Spam
- Proposals require a refundable deposit (returned on approval). This deters spam without excluding legitimate researchers.

### PI Identity
- Principal investigators must verify identity through Zoo IAM (hanzo.id) to prevent pseudonymous grant fraud while maintaining researcher privacy where appropriate.

### Smart Contract Upgrade
- The treasury contract is behind a transparent proxy with ZooGovernor timelock (48-hour delay). Emergency pause requires 3/5 multisig.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-102: Impact Yield Vaults](./zip-0102-impact-yield-vaults.md)
5. [ZIP-103: Green Staking Mechanism](./zip-0103-green-staking-mechanism.md)
6. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
7. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
8. [ZIP-540: Research Ethics & Data Governance](./zip-0540-research-ethics-data-governance.md)
9. [HIP-0066: Data Governance](https://hips.hanzo.ai/hip-0066)
10. [HIP-0018: Payment Processing](https://hips.hanzo.ai/hip-0018)
11. [LP-9000: DEX Specifications](https://lps.lux.network/lp-9000)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
