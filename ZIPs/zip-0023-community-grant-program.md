---
zip: 23
title: "Community Grant Program"
description: "On-chain grant proposal, review, and funding mechanism for conservation researchers and builders"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 24 (Partnerships)"
follow-on: [zoo-dao-grants-program]
created: 2025-01-15
tags: [grants, funding, research, community]
---

# ZIP-0023: Community Grant Program

## Abstract

This proposal defines an on-chain grant program for funding conservation research, open-source development, citizen science, and community initiatives on Zoo Network. The system supports proposal submission, peer review, milestone-based funding, and impact-based evaluation using the Impact Metric Oracle (ZIP-0020). Grant funds are drawn from the Grants Fund (ZIP-0018) and new token emissions (ZIP-0016).

## Motivation

Decentralized science (DeSci) and conservation require accessible funding mechanisms:

1. **Researcher access**: Traditional grant processes are slow, opaque, and biased toward established institutions
2. **Global participation**: On-chain grants enable researchers anywhere to apply without institutional gatekeeping
3. **Accountability**: Milestone-based disbursement ensures funds are used effectively
4. **Transparency**: All proposals, reviews, and disbursements are publicly auditable
5. **Impact-driven**: Tying follow-on funding to measured outcomes (ZIP-0020) optimizes for results

## Specification

### Grant Categories

| Category | Max Award (ZOO) | Duration | Review Panel |
|----------|----------------|----------|-------------|
| Conservation Research | 500,000 | 12 months | Science Council |
| Open Source Development | 250,000 | 6 months | Technical Council |
| Citizen Science | 100,000 | 6 months | Community Council |
| Education & Outreach | 50,000 | 3 months | Community Council |
| Emergency Conservation | 200,000 | 1 month | Fast-track (3 reviewers) |

### Proposal Lifecycle

```
Submit → Screen (3 days) → Review (14 days) → Vote (7 days) → Fund → Milestones → Report
```

```yaml
lifecycle:
  submission:
    required_fields:
      - title
      - abstract (500 words max)
      - team (with qualifications)
      - budget_breakdown
      - milestones (min 2, max 6)
      - impact_metrics (from ZIP-0020 metric types)
      - timeline
    deposit: 1000 ZOO  # Refunded if proposal passes screening
  screening:
    duration: 3 days
    screeners: 2 council members
    criteria: [completeness, relevance, feasibility]
  review:
    duration: 14 days
    reviewers: 3-5 domain experts
    scoring: 1-10 on [impact, feasibility, team, budget, innovation]
    minimum_score: 6.0 average
  voting:
    duration: 7 days
    quorum: 5% of ZOO supply
    approval: >50%
  funding:
    method: milestone-based
    initial_disbursement: 20% of total
    milestone_disbursement: per milestone schedule
    final_disbursement: 10% held until final report
```

### Grant Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooGrantProgram {
    struct Grant {
        uint256 id;
        address grantee;
        uint256 totalAmount;
        uint256 disbursed;
        uint8 currentMilestone;
        uint8 totalMilestones;
        GrantStatus status;
    }

    enum GrantStatus { Proposed, Screening, Review, Voting, Active, Completed, Revoked }

    mapping(uint256 => Grant) public grants;
    mapping(uint256 => mapping(uint8 => Milestone)) public milestones;

    struct Milestone {
        string description;
        uint256 amount;
        uint256 deadline;
        bytes32 evidenceHash;
        bool approved;
    }

    event GrantProposed(uint256 indexed grantId, address grantee, uint256 amount);
    event MilestoneSubmitted(uint256 indexed grantId, uint8 milestone, bytes32 evidenceHash);
    event MilestoneApproved(uint256 indexed grantId, uint8 milestone, uint256 disbursed);
    event GrantCompleted(uint256 indexed grantId, uint256 impactScore);

    function submitMilestone(
        uint256 grantId,
        bytes32 evidenceHash
    ) external onlyGrantee(grantId) {
        Grant storage grant = grants[grantId];
        Milestone storage ms = milestones[grantId][grant.currentMilestone];
        require(block.timestamp <= ms.deadline, "milestone overdue");
        ms.evidenceHash = evidenceHash;
        emit MilestoneSubmitted(grantId, grant.currentMilestone, evidenceHash);
    }

    function approveMilestone(uint256 grantId) external onlyReviewCouncil {
        Grant storage grant = grants[grantId];
        Milestone storage ms = milestones[grantId][grant.currentMilestone];
        ms.approved = true;
        uint256 amount = ms.amount;
        grant.disbursed += amount;
        grant.currentMilestone++;
        IERC20(zooToken).transfer(grant.grantee, amount);
        emit MilestoneApproved(grantId, grant.currentMilestone - 1, amount);
    }
}
```

### Review Councils

| Council | Members | Selection | Term |
|---------|---------|-----------|------|
| Science Council | 7 | 3 Foundation + 4 DAO-elected | 1 year |
| Technical Council | 5 | 2 Foundation + 3 DAO-elected | 1 year |
| Community Council | 5 | All DAO-elected | 6 months |

Council members receive 500 ZOO per review completed. Reviewers must disclose conflicts of interest and recuse from conflicted proposals.

### Impact-Based Follow-On Funding

Completed grants with Impact Oracle scores (ZIP-0020) above 700/1000 are eligible for automatic follow-on funding:

- **Score 700-799**: Eligible for 50% of original grant as follow-on
- **Score 800-899**: Eligible for 75% of original grant
- **Score 900+**: Eligible for 100% of original grant (fast-tracked, no re-review)

### Reporting Requirements

- **Quarterly progress**: Brief update posted to governance forum
- **Milestone reports**: Detailed report with evidence, uploaded to IPFS
- **Final report**: Comprehensive report including impact metrics, lessons learned, and data outputs
- **Open access**: All grant-funded research must be published under CC-BY-4.0 or equivalent open license

## Rationale

Milestone-based disbursement protects the treasury from non-performing grants while providing grantees with sufficient working capital (20% upfront). The 10% holdback until final report incentivizes proper documentation and knowledge sharing.

The council structure balances domain expertise (Foundation appointees) with community representation (DAO-elected). Overlapping terms ensure institutional memory.

Impact-based follow-on funding creates a virtuous cycle: successful projects automatically receive continued support, reducing grant application overhead for proven teams.

## Security Considerations

- **Sybil grants**: Deposit requirement and council screening prevent spam proposals
- **Reviewer collusion**: Reviews are blinded during scoring; conflicts must be disclosed
- **Fund misuse**: Milestone evidence is publicly auditable; community can flag suspicious disbursements
- **Council capture**: Mixed appointment (Foundation + DAO) and term limits prevent entrenchment
- **Budget overruns**: Each grant has a fixed maximum; no mechanism for unilateral budget increases

## References

- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0018: Treasury Management Protocol](./zip-0018-treasury-management-protocol.md)
- [ZIP-0020: Impact Metric Oracle](./zip-0020-impact-metric-oracle.md)
- [ZIP-0104: Research Funding DAO Treasury](./zip-0104-research-funding-dao-treasury.md)
- [Gitcoin Grants Protocol](https://docs.gitcoin.co/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
