---
zip: 606
title: "Reproducibility Attestation"
description: "On-chain attestation protocol for verifying that scientific research results are independently reproducible"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
created: 2025-01-15
tags: [desci, reproducibility, attestation, verification, science]
requires: [0, 540, 600, 604, 605]
---

# ZIP-606: Reproducibility Attestation

## Abstract

This proposal defines an on-chain attestation protocol for certifying that published scientific research results (ZIP-605) have been independently reproduced. Reproducing parties run the original analysis using the archived code and data, compare their outputs against the published results, and submit a reproducibility attestation recording the degree of agreement. Attestations are classified as "fully reproduced," "partially reproduced," or "not reproduced," with detailed discrepancy reports. The protocol creates a public, tamper-proof record of which research has been independently verified, addressing the replication crisis that undermines scientific credibility. Reproducing parties earn ZOO token rewards and Research DAO reputation for their verification work.

## Motivation

The replication crisis is among the most serious challenges facing modern science:

1. **Failure rates**: Landmark replication studies found that 60-70% of published results in psychology, biomedical sciences, and economics failed to replicate. Conservation science has not been systematically tested but likely faces similar issues.
2. **No incentive to reproduce**: Reproducing others' work earns no academic credit, no citations, and no grant funding. Rational researchers focus on novel results instead. This ZIP provides economic incentives for verification.
3. **No standard for reproducibility claims**: When someone does reproduce a study, there is no structured way to record and share the outcome. Informal blog posts and Twitter threads are the current state of the art.
4. **Computational reproducibility**: Many modern studies depend on complex software pipelines. Without archived code, exact software versions, and containerized environments, computational reproduction is often impossible.
5. **Trust in conservation policy**: Conservation policy decisions are based on published research. If that research is unreproducible, policy may be misguided. On-chain reproducibility attestations give policymakers a trust signal.

## Specification

### 1. Reproducibility Attestation Schema

```typescript
interface ReproducibilityAttestation {
  attestationId: string;
  publicationId: string;           // ZIP-605 manuscript ID
  reproducer: Reproducer;
  environment: ComputeEnvironment;
  results: ReproductionResults;
  verdict: ReproducibilityVerdict;
  timestamp: number;
  signature: string;               // Reproducer's cryptographic signature
}

interface Reproducer {
  luxId: string;
  orcid?: string;
  affiliation: string;
  qualifications: string[];        // Relevant domain expertise
  independenceDeclaration: boolean; // No COI with original authors
}

interface ComputeEnvironment {
  containerImage?: string;         // Docker/OCI image used
  hardwareSpec: string;
  osVersion: string;
  softwareVersions: Record<string, string>;  // Package -> version
  randomSeeds: Record<string, number>;       // Seeds used
  executionTimeHours: number;
  environmentHash: string;         // Hash of full environment spec
}

interface ReproductionResults {
  originalResults: ResultSet;      // Claimed results from publication
  reproducedResults: ResultSet;    // Results obtained by reproducer
  comparisonMetrics: ComparisonMetric[];
  discrepancies: Discrepancy[];
  fullReportCid: string;           // IPFS CID of detailed report
}

interface ComparisonMetric {
  metricName: string;              // e.g., "primary_effect_size"
  originalValue: number;
  reproducedValue: number;
  tolerance: number;               // Acceptable deviation
  withinTolerance: boolean;
  relativeError: number;           // |original - reproduced| / |original|
}

type ReproducibilityVerdict =
  | "fully_reproduced"             // All primary results within tolerance
  | "partially_reproduced"         // Some results reproduced, some not
  | "not_reproduced"               // Primary results not reproduced
  | "methodology_issue"            // Insufficient info to attempt reproduction
  | "inconclusive";                // Could not determine due to stochasticity

interface Discrepancy {
  metric: string;
  originalValue: number;
  reproducedValue: number;
  possibleCause: string;
  severity: "minor" | "moderate" | "major";
}
```

### 2. Attestation Contract

```solidity
contract ReproducibilityRegistry {
    struct Attestation {
        bytes32 attestationId;
        bytes32 publicationId;
        address reproducer;
        uint8 verdict;              // 0-4 matching enum
        bytes32 reportHash;
        string reportCid;
        uint64 attestedAt;
        bool challenged;
    }

    mapping(bytes32 => Attestation[]) public attestations;
    mapping(bytes32 => uint8) public publicationReproducibilityScore;

    event ReproducibilityAttested(
        bytes32 indexed publicationId,
        bytes32 attestationId,
        uint8 verdict,
        address reproducer
    );

    function submitAttestation(
        bytes32 publicationId,
        bytes32 attestationId,
        uint8 verdict,
        bytes32 reportHash,
        string calldata reportCid,
        bytes calldata signature
    ) external {
        require(
            verifySignature(msg.sender, attestationId, signature),
            "Invalid signature"
        );
        require(
            verifyIndependence(msg.sender, publicationId),
            "COI detected"
        );

        attestations[publicationId].push(Attestation({
            attestationId: attestationId,
            publicationId: publicationId,
            reproducer: msg.sender,
            verdict: verdict,
            reportHash: reportHash,
            reportCid: reportCid,
            attestedAt: uint64(block.timestamp),
            challenged: false
        }));

        updateReproducibilityScore(publicationId);
        emit ReproducibilityAttested(publicationId, attestationId, verdict, msg.sender);
    }
}
```

### 3. Reproducibility Score

Each publication accumulates a reproducibility score based on attestations:

| Condition | Score |
|-----------|-------|
| No attestations | Unrated |
| 1+ "fully_reproduced" and 0 "not_reproduced" | Gold (verified) |
| Mixed verdicts | Silver (partially verified) |
| Majority "not_reproduced" | Bronze (disputed) |
| Only "not_reproduced" or "methodology_issue" | Red (failed) |

Scores are updated on-chain and queryable by any party. They are displayed alongside publications in the ZIP-605 registry.

### 4. Incentive Structure

Reproducers earn rewards from the Research DAO:

| Action | Reward | REP Earned |
|--------|--------|-----------|
| Submit reproduction attempt (any verdict) | 10 ZOO | +15 REP |
| First reproduction of high-impact publication | 25 ZOO | +25 REP |
| Detailed discrepancy report accepted by DAO | 15 ZOO | +10 REP |
| False or negligent attestation (challenged and overturned) | Slashed | -30 REP |

Rewards are funded from the Research DAO treasury (ZIP-603). The DAO council sets the reproduction budget per epoch.

### 5. Challenge Process

Original authors or third parties can challenge an attestation:

```
1. Challenger submits challenge with stake (20 ZOO) and evidence.
2. Challenge panel (3 Technical Committee members from ZIP-603) reviews.
3. If challenge upheld: attestation marked as challenged; reproducer REP slashed.
4. If challenge rejected: challenger loses stake; attestation stands.
5. Resolution within 30 days.
```

### 6. Computational Reproducibility Requirements

Publications seeking Gold reproducibility scores must provide:

- Archived code with exact version tags
- Containerized execution environment (Docker/OCI image on IPFS)
- All input data with persistent identifiers
- Random seeds for stochastic processes
- Expected output hashes for deterministic portions

## Rationale

- **Economic incentives for reproduction**: The replication crisis exists because reproduction is unrewarded. Token rewards and REP make verification economically rational for the first time.
- **On-chain verdicts over informal reports**: Structured, on-chain attestations create a queryable database of reproducibility outcomes. This is superior to scattered blog posts and enables systematic analysis of reproducibility across fields.
- **Independence verification**: Self-reproduction is meaningless. The protocol verifies that reproducers have no conflict of interest with original authors through the Lux DID graph.
- **Tolerance-based comparison**: Exact numerical reproduction is often impossible due to floating-point nondeterminism and hardware differences. Tolerance thresholds allow for acceptable variation while catching genuine discrepancies.
- **Challenge mechanism**: Incorrect attestations (whether from incompetence or malice) must be correctable. The stake-based challenge process deters frivolous challenges while enabling legitimate corrections.

## Security Considerations

1. **Collusion between reproducer and author**: An author could arrange for a collaborator to "independently" reproduce their work. Mitigation: independence declaration is cryptographically signed; the DID graph is analyzed for co-authorship, shared affiliations, and co-funding within the past 5 years.
2. **Result fabrication**: A reproducer could claim reproduction without actually running the analysis. Mitigation: reproducers must submit the full compute environment and output files; random audits re-execute a subset of reproductions on trusted infrastructure.
3. **Selective reproduction**: A reproducer could reproduce only the parts that work and ignore failures. Mitigation: the attestation schema requires comparison of all primary results; partial reproduction is explicitly categorized.
4. **Stochastic disagreement**: Legitimate results may vary across runs due to stochasticity. Mitigation: tolerance thresholds are defined per metric; publications must declare which results are deterministic and which are stochastic.
5. **Compute cost**: Reproducing large-scale studies (genomics, climate models) requires significant compute. Mitigation: the Research DAO can allocate compute credits (ZIP-407 distributed training network) for high-priority reproductions.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-540: Research Ethics & Data Governance](./zip-0540-research-ethics-data-governance.md)
3. [ZIP-600: DeSci Protocol Framework](./zip-0600-desci-protocol-framework.md)
4. [ZIP-604: Decentralized Peer Review](./zip-0604-decentralized-peer-review.md)
5. [ZIP-605: Open Access Publication Protocol](./zip-0605-open-access-publication-protocol.md)
6. Open Science Collaboration. "Estimating the reproducibility of psychological science." Science 349(6251), 2015.
7. Nosek, B.A. et al. "Replicability, Robustness, and Reproducibility in Psychological Science." Annual Review of Psychology 73, 2022.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
