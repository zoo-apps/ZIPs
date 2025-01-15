---
zip: 604
title: "Decentralized Peer Review"
description: "Blind peer review protocol using ZK proofs for reviewer anonymity, reputation staking, review quality scoring, and anti-collusion mechanisms."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
created: 2025-01-15
tags: [peer-review, zero-knowledge, reputation, anti-collusion, open-science]
requires: [540, 600, 603]
---

# ZIP-604: Decentralized Peer Review

## Abstract

This ZIP specifies a decentralized peer review protocol that preserves double-blind anonymity using zero-knowledge proofs while enabling on-chain reputation tracking, quality scoring, and economic incentives for reviewers. The protocol eliminates the conflicts inherent in journal-controlled peer review (where publishers profit from free reviewer labor) and replaces them with a transparent, incentive-aligned system. Reviewers stake reputation tokens to accept assignments, earn rewards for quality reviews, and face slashing for negligent or collusive behavior. Anti-collusion mechanisms based on commitment schemes prevent authors and reviewers from coordinating to manipulate outcomes.

## Motivation

Peer review is the cornerstone of scientific quality control, yet the current system is broken in several ways:

1. **Uncompensated labor**: Reviewers work for free. Elsevier's profit margin exceeds 30%, built on unpaid reviewer labor. Reviewers have no economic incentive to prioritize quality or timeliness.
2. **Slow turnaround**: Average review times range from 3-12 months across disciplines. Conservation research with time-sensitive implications (species decline, habitat destruction) cannot afford these delays.
3. **Identity bias**: Single-blind review (where reviewers know authors' identities) introduces well-documented biases based on institutional prestige, gender, nationality, and career stage.
4. **No accountability**: Reviewers face no consequences for low-quality reviews, missed deadlines, or biased recommendations. Review quality varies enormously.
5. **Opaque process**: Authors receive reviews but have no insight into reviewer selection, no access to inter-reviewer discussion, and no public record of the review process.
6. **Collusion**: Authors can identify likely reviewers in small fields and lobby for favorable treatment. Reviewers can demand citations to their own work or delay competing research.

Zoo Labs Foundation's DeSci Protocol (ZIP-600) requires a peer review system that is fast, fair, transparent, and economically sustainable. This ZIP provides that system, designed specifically for conservation science and open AI research but applicable to any scientific domain.

### Cross-Ecosystem Context

- **HIP-0076** (Hanzo Open AI Protocol): Open and transparent evaluation mechanisms for AI-generated outputs, adapted here for scientific peer review.
- **LP-3093** (Lux Decentralized Identity): DID infrastructure supporting privacy-preserving reviewer identity management.
- **ZIP-540** (Research Ethics & Data Governance): Ethical review requirements that this protocol integrates with.

## Specification

### 1. Zero-Knowledge Reviewer Anonymity

#### 1.1 Double-Blind Architecture

The protocol achieves double-blind review without a trusted intermediary:

```
Author submits proposal (ZIP-600)
    |
    v
Review Coordinator smart contract:
  1. Strips author identity from proposal metadata
  2. Assigns anonymized proposal ID
  3. Selects eligible reviewers by expertise + reputation
    |
    v
Reviewer receives anonymized proposal
  - Cannot see author identity
  - Cannot see other reviewers' identities
    |
    v
Reviewer submits review with ZK proof of eligibility
  - Proves: "I am a registered reviewer with reputation >= threshold
             AND expertise in [domain] AND no COI with this proposal"
  - Without revealing: reviewer address, exact reputation, identity
    |
    v
Author receives anonymized reviews
  - Cannot see reviewer identities
  - Can see review quality scores (after cycle completes)
```

#### 1.2 ZK Circuit Specification

The ZK proof circuit (implemented in Circom/Noir) proves the following statement:

```
PUBLIC INPUTS:
  - proposalId: bytes32
  - domainTag: uint8
  - minimumReputation: uint256
  - coiMerkleRoot: bytes32  (Merkle root of COI exclusion set)

PRIVATE INPUTS:
  - reviewerAddress: address
  - reputation: uint256
  - domainCredential: bytes
  - coiMerkleProof: bytes  (proof of non-membership in COI set)

CONSTRAINTS:
  1. reputation >= minimumReputation
  2. domainCredential is valid for domainTag
  3. reviewerAddress is NOT in the COI exclusion set (Merkle non-membership proof)
  4. reviewerAddress is in the active reviewer registry (Merkle membership proof)
```

The ZK proof is verified on-chain before the review is accepted. The reviewer's identity is never revealed to the smart contract, the author, or other reviewers.

#### 1.3 Anonymity Guarantees

| Property | Mechanism |
|----------|-----------|
| **Reviewer identity hidden from author** | ZK proof of eligibility, no address revealed |
| **Author identity hidden from reviewer** | Proposal metadata stripped, anonymized ID |
| **Reviewer identities hidden from each other** | Each reviewer interacts only with the contract |
| **Review-identity linkage** | Reviewers use ephemeral keys per review cycle |
| **Post-review de-anonymization** | Optional, reviewer-initiated only (for credit) |

### 2. Reputation Staking

#### 2.1 Reputation Token (REP)

REP is a non-transferable (soulbound) token representing a reviewer's accumulated peer review reputation:

```solidity
interface IReviewerReputation {
    function getReputation(address reviewer) external view returns (uint256);
    function getStake(address reviewer, bytes32 proposalId) external view returns (uint256);
    function getDomain(address reviewer) external view returns (uint8[] memory);
    function isActive(address reviewer) external view returns (bool);
}
```

REP cannot be bought, sold, or transferred. It can only be earned through quality review work and lost through slashing.

#### 2.2 Staking Mechanism

When a reviewer accepts a review assignment, they stake REP:

| Action | Stake Required | Lock Duration |
|--------|---------------|---------------|
| **Accept standard review** | 10 REP | Until review submitted + 30-day dispute window |
| **Accept expedited review** | 20 REP | Until review submitted + 14-day dispute window |
| **Accept expert review** | 30 REP | Until review submitted + 60-day dispute window |

Staked REP is locked and cannot be used for other reviews during the lock period. This limits the number of concurrent reviews a reviewer can accept, preventing overcommitment.

#### 2.3 REP Earning and Slashing

| Event | REP Change |
|-------|-----------|
| **Complete review on time** | +10 |
| **Review quality score >= 8/10** | +5 bonus |
| **Review cited in author revision** | +3 |
| **Successful appeal against review** | -20 (reviewer whose review was overturned) |
| **Missed deadline (no extension)** | -15 |
| **Collusion detected** | -100 + temporary ban |
| **Conflict of interest violation** | -50 + temporary ban |
| **Low quality review (score < 3/10)** | -10 |

#### 2.4 REP Decay

REP decays at 3% per quarter for inactive reviewers (no completed reviews in the quarter). Active reviewers face no decay. This prevents reputation hoarding and ensures the reviewer pool reflects current participation.

### 3. Review Quality Scoring

#### 3.1 Quality Dimensions

Each review is scored on five dimensions by a meta-review panel:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Thoroughness** | 25% | Addresses all aspects of the proposal (methodology, feasibility, impact) |
| **Constructiveness** | 25% | Provides actionable feedback for improvement, not just criticism |
| **Technical accuracy** | 20% | Scientific claims in the review are correct |
| **Timeliness** | 15% | Submitted within deadline |
| **Clarity** | 15% | Well-written, organized, free of ambiguity |

#### 3.2 Meta-Review Process

After reviews are submitted, a meta-review panel scores them:

```
Reviews submitted for proposal P
    |
    v
Meta-review panel selected:
  - 2 council members from Technical Committee (ZIP-603)
  - 1 randomly selected Tier 3 reviewer (not assigned to P)
    |
    v
Each meta-reviewer independently scores each review (1-10 per dimension)
    |
    v
Final score = median of meta-reviewer scores per dimension, weighted
    |
    v
Scores published (anonymized) after proposal decision is finalized
```

#### 3.3 Quality Score Contract

```solidity
struct ReviewQuality {
    bytes32 reviewId;
    uint8 thoroughness;    // 1-10
    uint8 constructiveness; // 1-10
    uint8 technicalAccuracy; // 1-10
    uint8 timeliness;      // 1-10
    uint8 clarity;         // 1-10
    uint8 overallScore;    // Weighted composite, 1-10
    uint64 scoredAt;
}

interface IReviewQuality {
    function submitMetaReview(bytes32 reviewId, ReviewQuality calldata quality, bytes calldata zkProof) external;
    function getReviewScore(bytes32 reviewId) external view returns (uint8);
    function getReviewerAverageScore(address reviewer) external view returns (uint8);
}
```

### 4. Anti-Collusion Mechanisms

#### 4.1 Threat Model

| Threat | Description |
|--------|-------------|
| **Author-reviewer collusion** | Author identifies reviewer and negotiates favorable review |
| **Reviewer-reviewer collusion** | Reviewers coordinate to approve/reject |
| **Review ring** | Group of researchers agree to review each other favorably |
| **Citation coercion** | Reviewer demands citation to their work |
| **Retaliatory review** | Reviewer identifies author and reviews negatively due to personal conflict |

#### 4.2 Commitment Scheme

Reviews use a commit-reveal scheme to prevent coordination:

```
Phase 1: COMMIT (7 days)
  - Reviewers submit hash(review + salt) on-chain
  - No review content is visible
  - Prevents reviewers from copying each other

Phase 2: REVEAL (3 days)
  - Reviewers reveal review content
  - Contract verifies hash matches commitment
  - All reviews become visible simultaneously

Phase 3: DISCUSSION (optional, 7 days)
  - Reviewers may submit supplementary comments
  - Author may submit rebuttal
  - All communication is anonymized
```

Simultaneous reveal prevents a reviewer from adjusting their review based on what others wrote.

#### 4.3 Statistical Collusion Detection

The protocol runs statistical analysis on review patterns:

| Signal | Detection Method | Threshold |
|--------|-----------------|-----------|
| **Score clustering** | Variance of scores across reviewer pairs | If reviewer pair consistently agrees (r > 0.95 over 10+ reviews), flag |
| **Text similarity** | NLP similarity of review text | Cosine similarity > 0.8 for independent reviews, flag |
| **Timing correlation** | Commit timestamps | If same-minute commits across multiple proposals, flag |
| **Reciprocal review** | Graph analysis | A reviews B's proposal, B reviews A's proposal within 6 months, flag |
| **Citation coercion** | Citation analysis | If reviewer cites their own work in > 50% of reviews, flag |

#### 4.4 Collusion Response

| Severity | Evidence | Response |
|----------|----------|----------|
| **Suspected** | Statistical flags only | Increased monitoring, no penalty |
| **Probable** | Multiple flags + circumstantial evidence | Ethics Committee investigation |
| **Confirmed** | Direct evidence or investigation finding | REP slashing (-100), temporary ban (6 months), review annulled |
| **Repeat** | Second confirmed offense | Permanent ban, all historical reviews flagged |

### 5. Review Compensation

#### 5.1 Payment Structure

Reviewers receive ZOO tokens for completed reviews:

| Review Type | Base Payment | Quality Bonus | Maximum |
|-------------|-------------|---------------|---------|
| **Standard** | 5 ZOO | +0.5 ZOO per quality point above 5 | 7.5 ZOO |
| **Expedited** | 10 ZOO | +1.0 ZOO per quality point above 5 | 15 ZOO |
| **Expert** | 15 ZOO | +1.5 ZOO per quality point above 5 | 22.5 ZOO |
| **Meta-review** | 3 ZOO | Flat rate | 3 ZOO |

#### 5.2 Payment Flow

```solidity
interface IReviewPayment {
    function calculatePayment(bytes32 reviewId) external view returns (uint256);
    function claimPayment(bytes32 reviewId, bytes calldata zkProof) external;
    function getReviewerEarnings(address reviewer) external view returns (uint256);
}
```

Payment is claimed after the dispute window closes. The ZK proof ensures the reviewer can claim payment without revealing which specific review they authored (preventing post-review de-anonymization through payment tracking).

#### 5.3 Funding Source

Review compensation is funded from the Research Treasury (ZIP-603) as an operational expense. The total review budget is set per epoch by the Research DAO Council.

### 6. Post-Review Transparency

#### 6.1 Published After Decision

Once a proposal reaches a terminal state (FUNDED, REJECTED, COMPLETED, FAILED), the following are published:

| Record | Timing | Anonymization |
|--------|--------|---------------|
| **Full review text** | After decision | Reviewer identity removed |
| **Review quality scores** | After decision | Reviewer identity removed |
| **Author rebuttals** | After decision | Author identity visible (proposal is public) |
| **Decision rationale** | After decision | Council members named |
| **Aggregate statistics** | Quarterly | Fully anonymized |

#### 6.2 Optional Reviewer De-Anonymization

Reviewers may choose to reveal their identity post-review for academic credit:

```
Reviewer calls revealIdentity(reviewId, zkProof)
    |
    v
Contract verifies reviewer authored the review (ZK proof of authorship)
    |
    v
Review record updated with reviewer DID
    |
    v
Reviewer receives +5 REP bonus for transparency
```

De-anonymization is permanent and irrevocable. It is entirely optional and reviewer-initiated.

### 7. Protocol Parameters

| Parameter | Default | Governance-Adjustable |
|-----------|---------|----------------------|
| **Reviewers per proposal** | 3 | Yes (2-5) |
| **Commit phase duration** | 7 days | Yes |
| **Reveal phase duration** | 3 days | Yes |
| **Discussion phase duration** | 7 days | Yes |
| **REP stake (standard)** | 10 REP | Yes |
| **REP decay rate** | 3% / quarter | Yes |
| **Base payment (standard)** | 5 ZOO | Yes |
| **Minimum REP to review** | 20 REP | Yes |
| **Collusion detection threshold** | r > 0.95 over 10+ reviews | Yes |
| **Dispute window** | 30 days | Yes |

### 8. Smart Contract Architecture

```
PeerReviewHub (upgradeable proxy)
    |
    +-- ReviewAssignment
    |       Selects reviewers, manages assignments, verifies ZK eligibility proofs
    |
    +-- CommitReveal
    |       Manages commit-reveal phases, verifies commitments
    |
    +-- ReputationStaking
    |       Manages REP stakes, earning, slashing, decay
    |
    +-- QualityScoring
    |       Stores meta-review scores, computes aggregates
    |
    +-- CollusionDetector
    |       On-chain statistical analysis, flag management
    |
    +-- ReviewPayment
            Calculates and distributes reviewer compensation
```

All contracts are deployed behind UUPS proxies with a 48-hour timelock, controlled by the Zoo governance multisig.

## Rationale

1. **ZK proofs over trusted intermediary**: Traditional double-blind review relies on journal editors to maintain anonymity. A compromised or biased editor breaks the system. ZK proofs provide cryptographic anonymity guarantees without any trusted party.
2. **Soulbound REP**: Reputation must be non-transferable to prevent a market for reviewer credentials. A reviewer must build their own reputation through demonstrated quality work.
3. **Commit-reveal**: Simultaneous review revelation is critical for independence. Without it, reviewers who submit late can adjust their reviews to match or contradict earlier submissions.
4. **Statistical detection over prevention**: It is impossible to prevent all collusion in any system (including traditional peer review). Statistical detection with meaningful penalties creates a strong deterrent without requiring invasive surveillance.
5. **Compensated review**: The current system of uncompensated review is unsustainable and inequitable. Compensating reviewers professionalizes the role and enables participation from researchers who cannot afford to donate their time (particularly those in developing nations).
6. **Optional de-anonymization**: Some reviewers want credit for their review work. Making de-anonymization optional and reviewer-initiated preserves the default anonymity guarantee while enabling voluntary transparency.

## Security Considerations

- **ZK circuit soundness**: The eligibility proof circuit must be formally verified. A bug in the circuit could allow ineligible reviewers to submit proofs or enable identity leakage. The circuit should be audited by at least two independent ZK security firms.
- **Timing side channels**: Even with commit-reveal, timing patterns (when a reviewer commits relative to assignment) could leak information about reviewer identity in small fields. The protocol adds random delay (0-24 hours) to commitment publication.
- **Linkability across reviews**: If a reviewer uses the same ephemeral key for multiple reviews, those reviews can be linked. The protocol requires fresh ephemeral keys per review assignment.
- **Meta-reviewer bias**: Meta-reviewers score review quality and therefore influence reputation. A biased meta-reviewer could systematically penalize specific reviewers. The use of multiple meta-reviewers and median scoring mitigates this risk.
- **REP inflation**: If earning REP is too easy relative to slashing, the reviewer pool may become saturated with low-quality participants. The decay mechanism and quality-weighted earning prevent unbounded accumulation.
- **Payment de-anonymization**: On-chain payment claims could be linked to reviewer identity through timing or amount analysis. The ZK-protected claim mechanism and batched payment processing (weekly) reduce this risk.
- **Quantum threat**: ZK proofs based on elliptic curve cryptography are vulnerable to quantum computers. When Lux Network deploys post-quantum primitives (per ZIP-0 Section 19), the ZK circuits should be migrated to lattice-based proof systems.

## References

- [ZIP-540](zip-0540-research-ethics-data-governance.md): Research Ethics & Data Governance
- [ZIP-600](zip-0600-desci-protocol-framework.md): DeSci Protocol Framework
- [ZIP-603](zip-0603-research-dao-governance.md): Research DAO Governance
- HIP-0076: Hanzo Open AI Protocol
- LP-3093: Lux Decentralized Identity (DID)
- Groth, J. "On the Size of Pairing-Based Non-interactive Arguments." EUROCRYPT 2016.
- Buterin, V. "Minimal Anti-Collusion Infrastructure (MACI)." https://github.com/privacy-scaling-explorations/maci
- Tennant, J. P. et al. "A multi-disciplinary perspective on emergent and future innovations in peer review." F1000Research 6:1151 (2017).
- Ross-Hellauer, T. "What is open peer review? A systematic review." F1000Research 6:588 (2017).

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
