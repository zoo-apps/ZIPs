---
zip: 605
title: "Open Access Publication Protocol"
description: "Decentralized open-access science publishing with on-chain provenance and community-funded peer review"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
created: 2025-01-15
tags: [desci, open-access, publishing, peer-review, science]
requires: [0, 600, 603, 604]
---

# ZIP-605: Open Access Publication Protocol

## Abstract

This proposal defines a decentralized, open-access scientific publication protocol that eliminates publisher intermediaries. Authors submit manuscripts to a smart contract that manages the full publication lifecycle: submission, peer review (ZIP-604), revision, acceptance, and permanent archival. Published papers are stored on IPFS with on-chain provenance records, DOI-equivalent persistent identifiers, and citation tracking. The protocol is funded by the Research DAO (ZIP-603) rather than author publication charges or reader paywalls, making it free to publish and free to read. Priority is established by submission timestamp, and versioning is handled natively through on-chain revision chains.

## Motivation

Scientific publishing is broken by perverse incentives and artificial scarcity:

1. **Paywall exclusion**: The average journal article costs $30-50 to access. Researchers in developing nations (where conservation need is greatest) are systematically excluded from the literature.
2. **Author-pays model**: Open-access charges ($2,000-11,000 per paper) exclude researchers without grant funding. Conservation field research, often conducted by small NGOs, is disproportionately affected.
3. **Publisher extraction**: Five publishers control over 50% of all published research. Their combined profit margins exceed 30%, built on donated peer review labor and publicly funded research.
4. **Priority disputes**: Submission dates are controlled by journal systems. Priority claims have no independent verification. Blockchain timestamps provide immutable priority proof.
5. **Version fragmentation**: Preprints, submitted versions, accepted manuscripts, and published versions exist in disconnected systems. Citation counts are split across versions. A unified versioning chain solves this.

## Specification

### 1. Manuscript Submission

```typescript
interface Manuscript {
  manuscriptId: string;            // Deterministic hash of content
  title: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  discipline: string[];            // Subject classification
  contentCid: string;              // IPFS CID of full manuscript (PDF + source)
  supplementaryCids: string[];     // IPFS CIDs of supplementary materials
  dataAvailability: DataStatement;
  version: number;
  previousVersion?: string;        // Links to prior version's manuscriptId
  submittedAt: number;             // On-chain timestamp (priority proof)
}

interface Author {
  name: string;
  luxId: string;                   // Lux DID for attribution
  orcid?: string;                  // ORCID for interoperability
  affiliation: string;
  contributionRoles: string[];     // CRediT taxonomy
  correspondingAuthor: boolean;
}

interface DataStatement {
  dataAvailable: boolean;
  dataCid?: string;                // IPFS CID of open dataset
  codeAvailable: boolean;
  codeCid?: string;                // IPFS CID of analysis code
  restrictions?: string;           // If not fully open, explain why
}
```

### 2. Publication Lifecycle

```
SUBMITTED -> UNDER_REVIEW -> REVISION_REQUESTED -> RESUBMITTED
    |             |                                      |
    |             v                                      v
    |         ACCEPTED -> PUBLISHED              UNDER_REVIEW (cycle)
    |
    v
  REJECTED (with reviews published per ZIP-604)
```

State transitions are recorded on-chain. Each transition includes a timestamp, the acting party (author, reviewer coordinator, DAO), and a reason hash.

### 3. Publication Contract

```solidity
contract PublicationRegistry {
    struct Publication {
        bytes32 manuscriptId;
        bytes32 contentHash;
        string contentCid;
        address submitter;
        uint64 submittedAt;
        uint64 publishedAt;
        uint8 status;               // Lifecycle state
        uint16 version;
        bytes32 previousVersion;
        bytes32 reviewRecordId;      // ZIP-604 review record
    }

    mapping(bytes32 => Publication) public publications;
    mapping(bytes32 => bytes32[]) public citedBy;   // Forward citations

    event ManuscriptSubmitted(
        bytes32 indexed manuscriptId,
        address submitter,
        uint64 timestamp
    );

    event ManuscriptPublished(
        bytes32 indexed manuscriptId,
        string contentCid,
        uint64 timestamp
    );

    function submit(
        bytes32 manuscriptId,
        bytes32 contentHash,
        string calldata contentCid,
        bytes32 previousVersion
    ) external {
        require(publications[manuscriptId].submittedAt == 0, "Exists");
        publications[manuscriptId] = Publication({
            manuscriptId: manuscriptId,
            contentHash: contentHash,
            contentCid: contentCid,
            submitter: msg.sender,
            submittedAt: uint64(block.timestamp),
            publishedAt: 0,
            status: 1,               // SUBMITTED
            version: previousVersion == bytes32(0) ? 1 : publications[previousVersion].version + 1,
            previousVersion: previousVersion,
            reviewRecordId: bytes32(0)
        });
        emit ManuscriptSubmitted(manuscriptId, msg.sender, uint64(block.timestamp));
    }

    function publish(
        bytes32 manuscriptId,
        bytes32 reviewRecordId
    ) external onlyResearchDAO {
        require(publications[manuscriptId].status == 4, "Not accepted");
        publications[manuscriptId].publishedAt = uint64(block.timestamp);
        publications[manuscriptId].status = 5;   // PUBLISHED
        publications[manuscriptId].reviewRecordId = reviewRecordId;
        emit ManuscriptPublished(
            manuscriptId,
            publications[manuscriptId].contentCid,
            uint64(block.timestamp)
        );
    }
}
```

### 4. Persistent Identifiers

Each published manuscript receives a Zoo Publication Identifier (ZPI):

```
Format: ZPI-<discipline>-<year>-<sequence>
Example: ZPI-CONSERVATION-2025-00142
```

ZPIs are registered on-chain and resolve to the latest version's IPFS CID. A resolver service maps ZPIs to content, analogous to DOI resolution but without requiring a centralized registration authority.

### 5. Citation Graph

Citations are recorded on-chain when a new manuscript references a published ZPI:

```solidity
function recordCitations(
    bytes32 citingManuscript,
    bytes32[] calldata citedManuscripts
) external {
    require(publications[citingManuscript].submitter == msg.sender, "Not author");
    for (uint i = 0; i < citedManuscripts.length; i++) {
        citedBy[citedManuscripts[i]].push(citingManuscript);
    }
    emit CitationsRecorded(citingManuscript, citedManuscripts.length);
}
```

This creates a transparent, tamper-proof citation graph. Citation metrics are computed directly from on-chain data without relying on proprietary databases (Scopus, Web of Science).

### 6. Funding Model

Publication costs are covered by the Research DAO treasury (ZIP-603):
- Peer review compensation: per ZIP-604
- IPFS pinning: long-term storage costs
- Infrastructure: resolver services, indexing

No fees are charged to authors or readers. The Research DAO allocates a publication budget per epoch, governed by the DAO council.

## Rationale

- **Zero-cost to authors and readers**: Both author-pays and reader-pays models create barriers. DAO funding eliminates both, funded by the Zoo ecosystem's conservation economy.
- **On-chain timestamps for priority**: Scientific priority disputes are resolved by who published first. Blockchain timestamps are immutable and millisecond-precise, superior to journal submission systems.
- **Version chains over separate preprint/postprint systems**: A single on-chain version chain links all versions of a manuscript, preventing citation fragmentation and making the revision history transparent.
- **CRediT taxonomy for contributions**: Authorship disputes are common. Recording specific contributions (per CRediT) on-chain provides clear, immutable attribution.

## Security Considerations

1. **Content permanence**: IPFS content requires pinning to remain available. Mitigation: the Research DAO funds a pinning service; content is replicated across multiple IPFS nodes; Filecoin archival is used for long-term guarantee.
2. **Spam submissions**: Without a submission fee, the system could be flooded with low-quality manuscripts. Mitigation: submitters must hold a Lux ID with minimum Research DAO reputation; manuscripts undergo basic automated checks (plagiarism, format) before entering review.
3. **Pseudonymous authorship abuse**: Authors could create fake Lux IDs to inflate author counts. Mitigation: ORCID linking is strongly encouraged; institutions can verify author affiliations through the Lux DID system.
4. **Citation manipulation**: Authors could cite their own work excessively. Mitigation: self-citation rates are tracked and published; citation metrics exclude self-citations by default.
5. **Censorship resistance**: On-chain publication cannot be retracted by a publisher. Mitigation: the protocol supports "retraction notices" linked to the original publication, but the original content remains accessible for transparency. The retraction process requires Research DAO approval.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-600: DeSci Protocol Framework](./zip-0600-desci-protocol-framework.md)
3. [ZIP-603: Research DAO Governance](./zip-0603-research-dao-governance.md)
4. [ZIP-604: Decentralized Peer Review](./zip-0604-decentralized-peer-review.md)
5. Tennant, J.P. et al. "The academic, economic and societal impacts of Open Access." F1000Research 5:632, 2016.
6. Hoy, M.B. "An Introduction to DeSci: Decentralized Science." Medical Reference Services Quarterly 42(2), 2023.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
