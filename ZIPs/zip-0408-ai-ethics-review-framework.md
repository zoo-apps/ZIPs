---
zip: 408
title: "AI Ethics Review Framework"
description: "Mandatory ethics review process for AI models deployed on the Zoo network ensuring safety, fairness, and conservation alignment"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
created: 2025-01-15
tags: [ai, ethics, review, safety, fairness]
requires: [0, 1, 400, 406, 540]
---

# ZIP-408: AI Ethics Review Framework

## Abstract

This proposal establishes a mandatory ethics review process for all AI models before deployment on the Zoo network. Every model must undergo evaluation across five dimensions: safety, fairness, privacy, environmental impact, and conservation alignment. Reviews are conducted by a rotating Ethics Review Board composed of conservation scientists, AI safety researchers, and community representatives. Models that fail review cannot be deployed. Models that pass receive an on-chain ethics attestation (extending ZIP-406) with an expiration date, requiring periodic re-review as model behavior and societal context evolve.

## Motivation

AI models deployed in conservation contexts carry significant ethical weight. A species recognition model with racial bias in its training data could discriminate against indigenous communities. A poaching prediction model could be repurposed for surveillance. A population estimation model with systematic errors could lead to misallocation of conservation funds.

1. **Safety**: Models that produce harmful outputs (misinformation about endangered species, dangerous wildlife interaction advice) must be caught before deployment.
2. **Fairness**: Models trained predominantly on Western datasets may perform poorly for ecosystems and communities in the Global South, where conservation need is greatest.
3. **Privacy**: Wildlife monitoring models that incidentally capture human activity must handle personal data responsibly.
4. **Environmental impact**: Training large models has a carbon footprint. Models deployed on the Zoo network should justify their environmental cost against their conservation benefit.
5. **Conservation alignment**: Models must demonstrably serve Zoo's conservation mission. A model that could be used to locate endangered species for poachers fails this criterion regardless of its technical quality.

## Specification

### 1. Ethics Review Dimensions

```typescript
interface EthicsReview {
  modelId: string;                  // ZIP-406 model ID
  reviewId: string;
  reviewer: string;                 // Ethics Board member Lux ID
  dimensions: {
    safety: DimensionScore;
    fairness: DimensionScore;
    privacy: DimensionScore;
    environmentalImpact: DimensionScore;
    conservationAlignment: DimensionScore;
  };
  overallVerdict: "approved" | "conditional" | "rejected";
  conditions?: string[];            // Required changes for conditional approval
  validUntil: number;               // Attestation expiration timestamp
}

interface DimensionScore {
  score: number;                    // 1-10
  findings: string[];               // Specific observations
  risks: Risk[];                    // Identified risks
  mitigations: string[];            // Required or recommended mitigations
}

interface Risk {
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "unlikely" | "possible" | "likely";
  affectedGroups: string[];         // Who is at risk
}
```

### 2. Review Process

```
Step 1: SUBMISSION
  Model developer submits review request with:
  - ZIP-406 attestation (model hash, training data provenance)
  - Model card (intended use, limitations, known biases)
  - Evaluation results on standard benchmarks
  - Conservation impact statement

Step 2: ASSIGNMENT (3 days)
  Ethics Review Board assigns 3 reviewers:
  - 1 conservation domain expert
  - 1 AI safety/fairness researcher
  - 1 community representative from affected region

Step 3: REVIEW (14 days)
  Each reviewer independently evaluates all 5 dimensions.
  Reviewers may request additional evaluations or red-teaming.

Step 4: DELIBERATION (7 days)
  Reviewers discuss findings and reach consensus verdict.
  Majority vote determines outcome.

Step 5: ATTESTATION
  If approved: on-chain ethics attestation issued (valid 12 months).
  If conditional: developer has 30 days to address conditions.
  If rejected: developer receives detailed feedback for revision.
```

### 3. Ethics Attestation Contract

```solidity
contract EthicsAttestationRegistry {
    struct EthicsAttestation {
        bytes32 modelId;
        bytes32 reviewId;
        uint8 safetyScore;
        uint8 fairnessScore;
        uint8 privacyScore;
        uint8 envImpactScore;
        uint8 conservationScore;
        uint8 verdict;              // 0=rejected, 1=conditional, 2=approved
        uint64 issuedAt;
        uint64 expiresAt;
        address[] reviewers;
    }

    mapping(bytes32 => EthicsAttestation) public attestations;

    function isApproved(bytes32 modelId) external view returns (bool) {
        EthicsAttestation memory a = attestations[modelId];
        return a.verdict == 2 && block.timestamp < a.expiresAt;
    }

    function issueAttestation(
        EthicsAttestation calldata attestation,
        bytes[] calldata reviewerSignatures
    ) external onlyEthicsBoard {
        require(
            reviewerSignatures.length >= 2,
            "Minimum 2 reviewer signatures"
        );
        attestations[attestation.modelId] = attestation;
        emit EthicsAttestationIssued(
            attestation.modelId,
            attestation.verdict,
            attestation.expiresAt
        );
    }
}
```

### 4. Minimum Standards

Models must meet these minimum thresholds to receive approval:

| Dimension | Minimum Score | Automatic Rejection Criteria |
|-----------|--------------|------------------------------|
| Safety | 6/10 | Any critical risk without mitigation |
| Fairness | 6/10 | Accuracy disparity > 15% across demographic groups |
| Privacy | 7/10 | Stores PII without explicit consent mechanism |
| Environmental Impact | 5/10 | Training carbon exceeds 10x conservation benefit |
| Conservation Alignment | 7/10 | No demonstrated conservation use case |

### 5. Expedited Review

Models that are minor updates (version increments with < 5% weight change) to previously approved models may request expedited review (7 days, 1 reviewer) if the original ethics attestation has not expired.

## Rationale

- **Mandatory over voluntary**: Voluntary ethics review creates a race to the bottom where developers skip review to deploy faster. Mandatory review ensures all models meet baseline standards.
- **Expiring attestations**: AI ethics standards evolve. A model approved in 2025 may not meet 2026 standards. Annual re-review ensures ongoing compliance.
- **Multi-stakeholder board**: Conservation scientists catch domain-specific risks; AI safety researchers catch technical risks; community representatives catch impacts invisible to both.
- **Conservation alignment as a dimension**: Unlike general AI ethics frameworks, Zoo models must serve conservation. A technically safe and fair model with no conservation purpose should not consume network resources.

## Security Considerations

1. **Review board capture**: Industry actors could influence board members to approve unsafe models. Mitigation: board members serve 2-year rotating terms; conflicts of interest require recusal; all reviews are published (reviewer-anonymized) for community scrutiny.
2. **Gaming evaluations**: Developers could optimize models to pass review criteria while behaving differently in production. Mitigation: post-deployment monitoring compares production behavior against review-time evaluations; significant divergence triggers automatic review suspension.
3. **Review bottleneck**: Mandatory review could delay legitimate model deployments. Mitigation: expedited review for minor updates; the board maintains a 14-day SLA; overflow capacity from qualified community reviewers.
4. **Dual-use models**: A species recognition model could be repurposed for poaching targeting. Mitigation: conservation alignment review explicitly evaluates dual-use risk; high-risk models require access controls and usage auditing per ZIP-540.
5. **Reviewer bias**: Reviewers may have cultural or institutional biases. Mitigation: diverse board composition; structured scoring rubric reduces subjective judgment; appeal process for developers who disagree with outcomes.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-1: Hamiltonian LLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
3. [ZIP-406: Model Attestation Protocol](./zip-0406-model-attestation-protocol.md)
4. [ZIP-540: Research Ethics & Data Governance](./zip-0540-research-ethics-data-governance.md)
5. Jobin, A. et al. "The global landscape of AI ethics guidelines." Nature Machine Intelligence 1, 389-399 (2019).
6. Raji, I.D. et al. "Closing the AI Accountability Gap." FAT* 2020.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
