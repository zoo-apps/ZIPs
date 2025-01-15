---
zip: 24
title: "Data Availability Layer"
description: "Data availability layer for AI model weights, biodiversity datasets, and conservation records"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-01-15
tags: [data-availability, storage, ai-models, biodiversity]
---

# ZIP-0024: Data Availability Layer

## Abstract

This proposal defines a data availability (DA) layer for Zoo Network that provides verifiable, censorship-resistant storage for AI model weights, biodiversity datasets, satellite imagery, and conservation records. The DA layer uses erasure coding and data availability sampling (DAS) to ensure data can be reconstructed even if a majority of storage nodes go offline, while keeping on-chain costs proportional to data commitments rather than full data size.

## Motivation

Zoo Network's dual mission (AI and conservation) generates large datasets that need verifiable availability:

1. **AI model provenance**: Model weights for Zoo's AI systems (ZIP-0400 series) must be verifiably available for audit and reproducibility
2. **Biodiversity data**: Species observations, camera trap images, and genomic data need persistent, censorship-resistant storage
3. **Conservation records**: Grant reports, impact evidence, and audit documents must remain available long-term
4. **Regulatory compliance**: 501(c)(3) record retention requirements demand reliable data persistence
5. **Cost efficiency**: Storing full datasets on-chain is prohibitively expensive; DA commitments provide verifiability at a fraction of the cost

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Zoo DA Layer                        │
├─────────────────────────────────────────────────────┤
│  Commitment Layer (on-chain)                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  KZG Commitments  │  Data Root Hashes       │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  Sampling Layer (light nodes)                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  DAS Queries  │  Erasure Code Verification  │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  Storage Layer (full nodes)                         │
│  ┌─────────────────────────────────────────────┐    │
│  │  IPFS  │  Arweave  │  Zoo Storage Nodes     │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Data Types and Retention

| Data Type | Max Size | Retention | Redundancy | Fee Multiplier |
|-----------|----------|-----------|-----------|---------------|
| AI Model Weights | 10 GB | 5 years | 3x erasure | 2.0x |
| Biodiversity Datasets | 1 GB | Permanent | 5x erasure | 1.5x |
| Camera Trap Images | 100 MB | 10 years | 3x erasure | 1.0x |
| Conservation Records | 50 MB | Permanent | 5x erasure | 1.0x |
| Grant Evidence | 200 MB | 10 years | 3x erasure | 1.0x |
| Genomic Data | 5 GB | Permanent | 5x erasure | 3.0x |

### Erasure Coding

Data is encoded using Reed-Solomon erasure codes:

```yaml
erasure_coding:
  scheme: reed-solomon
  original_chunks: k
  total_chunks: 2k       # 2x expansion (can reconstruct from any k of 2k)
  biodiversity_data:
    original_chunks: k
    total_chunks: 3k     # Higher redundancy for permanent data
  chunk_size: 512 KB
```

### Data Availability Sampling

Light nodes verify data availability without downloading full datasets:

```
sampling:
  queries_per_block: 16          # Number of random chunk queries
  confidence_target: 99.9%       # Probability data is available
  sample_size: 30 chunks         # Sufficient for confidence target
  challenge_period: 48 hours     # Window to prove unavailability
```

### DA Commitment Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooDataAvailability {
    struct DataCommitment {
        bytes32 dataRoot;         // Merkle root of erasure-coded chunks
        bytes48 kzgCommitment;    // KZG polynomial commitment
        uint256 dataSize;
        uint256 expiry;
        DataType dType;
        address submitter;
    }

    enum DataType { ModelWeights, Biodiversity, CameraTrap, ConservationRecord, Grant, Genomic }

    mapping(bytes32 => DataCommitment) public commitments;

    event DataCommitted(bytes32 indexed commitmentId, DataType dType, uint256 size);
    event DataChallenged(bytes32 indexed commitmentId, address challenger);
    event DataVerified(bytes32 indexed commitmentId);

    function commitData(
        bytes32 dataRoot,
        bytes48 kzgCommitment,
        uint256 dataSize,
        DataType dType
    ) external payable returns (bytes32 commitmentId) {
        uint256 fee = calculateFee(dataSize, dType);
        require(msg.value >= fee, "insufficient fee");
        commitmentId = keccak256(abi.encodePacked(dataRoot, block.number));
        uint256 retention = getRetention(dType);

        commitments[commitmentId] = DataCommitment({
            dataRoot: dataRoot,
            kzgCommitment: kzgCommitment,
            dataSize: dataSize,
            expiry: block.timestamp + retention,
            dType: dType,
            submitter: msg.sender
        });

        emit DataCommitted(commitmentId, dType, dataSize);
    }

    function challengeAvailability(bytes32 commitmentId) external {
        // Initiate DAS challenge; storage nodes must respond within 48h
        emit DataChallenged(commitmentId, msg.sender);
    }
}
```

### Storage Node Incentives

```yaml
storage_nodes:
  minimum_stake: 25000 ZOO
  rewards:
    per_gb_month: 50 ZOO
    availability_bonus: 1.2x   # For 99.9%+ uptime
  slashing:
    failed_challenge: 5% of stake
    downtime_24h: 1% of stake
  minimum_nodes: 20
```

### Integration with Existing Storage

The DA layer acts as a coordination and verification layer on top of existing storage backends:

- **IPFS**: Default storage for datasets under 1 GB
- **Arweave**: Permanent storage for biodiversity and conservation records
- **Zoo Storage Nodes**: High-performance nodes for AI model weights with GPU-accessible storage

## Rationale

KZG commitments are chosen over Merkle proofs for data availability because they enable constant-size proofs and efficient DAS verification. The 2x erasure expansion for standard data and 3x for permanent data balances storage cost with availability guarantees.

The 48-hour challenge period provides sufficient time for storage nodes to respond while keeping data availability confirmation fast enough for dependent operations (grant evidence submission, model verification).

Tiered retention periods match the actual needs of each data type. AI model weights may be superseded in 5 years, while biodiversity data has permanent scientific value.

## Security Considerations

- **Data withholding attacks**: DAS with 16 random samples per block provides 99.9% confidence that data is available
- **Storage node collusion**: Erasure coding means any k of 2k nodes can reconstruct data; collusion requires majority compromise
- **Cost attacks**: Fee multipliers prevent attackers from cheaply filling storage with junk data
- **Censorship**: Commitments on Zoo L2 inherit Lux primary network censorship resistance
- **Data integrity**: KZG commitments are binding; submitters cannot change data after commitment without detection
- **Privacy**: Sensitive location data (endangered species GPS) must be encrypted before commitment; the DA layer stores ciphertext

## References

- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0020: Impact Metric Oracle](./zip-0020-impact-metric-oracle.md)
- [ZIP-0400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [Danksharding Specification](https://ethereum.org/en/roadmap/danksharding/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
