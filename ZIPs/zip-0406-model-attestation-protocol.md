---
zip: 406
title: "Model Attestation Protocol"
description: "On-chain attestation protocol for verifying AI model integrity, provenance, and training data lineage"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
created: 2025-01-15
tags: [ai, attestation, integrity, provenance, verification]
requires: [0, 1, 400, 402]
---

# ZIP-406: Model Attestation Protocol

## Abstract

This proposal defines an on-chain attestation protocol for AI model integrity verification. Every model deployed on the Zoo network registers a cryptographic attestation containing: a hash of model weights, training data provenance metadata, training configuration fingerprint, and benchmark results. Attestations are signed by the training operator and optionally co-signed by independent auditors. Consumers of AI inference can verify that the model serving their request matches its registered attestation, preventing weight tampering, unauthorized fine-tuning, and model substitution attacks. The protocol integrates with ZIP-402 (Proof of AI) for consensus-level model validation.

## Motivation

AI models are opaque by nature. A user sending inference requests has no way to verify that the model weights being executed match what was advertised. This creates several risks:

1. **Weight tampering**: A malicious operator could modify model weights to produce biased or harmful outputs while advertising an unmodified model.
2. **Model substitution**: A cheaper, lower-quality model could be served while charging for a premium model's inference. The user cannot distinguish between models from outputs alone.
3. **Training data opacity**: Models trained on poisoned or unlicensed data are indistinguishable from clean models at inference time. Downstream users bear legal and ethical risk.
4. **Reproducibility**: Without a record of exact training configuration, model behavior cannot be reproduced for auditing or debugging.

Existing ML model registries (MLflow, Hugging Face Hub) provide metadata storage but no cryptographic integrity guarantees. This ZIP bridges that gap with on-chain attestation.

## Specification

### 1. Attestation Structure

```solidity
struct ModelAttestation {
    bytes32 modelId;                // Unique model identifier
    bytes32 weightsHash;            // SHA-256 of serialized model weights
    bytes32 configHash;             // Hash of training configuration
    bytes32 dataProvenanceHash;     // Merkle root of training data sources
    bytes32 benchmarkHash;          // Hash of benchmark results
    address trainer;                // Address of training operator
    address[] auditors;             // Co-signing auditors
    uint64 attestedAt;              // Timestamp
    uint16 version;                 // Model version
    string metadataUri;             // IPFS CID of full metadata document
}
```

### 2. Attestation Registry Contract

```solidity
contract ModelAttestationRegistry {
    mapping(bytes32 => ModelAttestation) public attestations;
    mapping(address => bool) public registeredAuditors;

    event ModelAttested(
        bytes32 indexed modelId,
        bytes32 weightsHash,
        address indexed trainer,
        uint16 version
    );

    function attest(
        ModelAttestation calldata attestation,
        bytes calldata trainerSignature,
        bytes[] calldata auditorSignatures
    ) external {
        require(attestation.trainer == msg.sender, "Not trainer");
        require(
            verifySignature(attestation.trainer, attestation, trainerSignature),
            "Invalid trainer signature"
        );

        for (uint i = 0; i < auditorSignatures.length; i++) {
            require(
                registeredAuditors[attestation.auditors[i]],
                "Unregistered auditor"
            );
            require(
                verifySignature(
                    attestation.auditors[i],
                    attestation,
                    auditorSignatures[i]
                ),
                "Invalid auditor signature"
            );
        }

        attestations[attestation.modelId] = attestation;
        emit ModelAttested(
            attestation.modelId,
            attestation.weightsHash,
            attestation.trainer,
            attestation.version
        );
    }

    function verify(
        bytes32 modelId,
        bytes32 weightsHash
    ) external view returns (bool) {
        return attestations[modelId].weightsHash == weightsHash;
    }
}
```

### 3. Training Data Provenance

Training data sources are recorded as a Merkle tree:

```typescript
interface DataProvenanceRecord {
  datasetId: string;
  source: string;              // URL or identifier
  license: string;             // SPDX license identifier
  hash: string;                // SHA-256 of dataset contents
  recordCount: number;
  dateCollected: string;
  consentVerified: boolean;    // GDPR/consent compliance
  conservationRelevance?: string;  // Link to conservation purpose
}
```

The Merkle root of all provenance records is stored in the attestation. Any party can request the full provenance tree (stored on IPFS) and verify individual dataset inclusion against the root.

### 4. Inference Verification

Inference nodes prove they are running an attested model by generating a runtime attestation:

```typescript
interface RuntimeAttestation {
  modelId: string;
  weightsHash: string;         // Hash of loaded weights
  nodeId: string;              // Inference node identifier
  teeReport?: string;          // TEE attestation report (if available)
  timestamp: number;
  signature: string;           // Node operator signature
}
```

Clients can request a runtime attestation before or alongside inference. The client verifies that `weightsHash` matches the on-chain attestation for the requested model.

### 5. Auditor Requirements

Registered auditors must:
- Hold a valid Lux ID with verified identity
- Stake a minimum of 1000 ZOO tokens (slashable for false attestations)
- Complete the Zoo AI Auditor certification
- Maintain an accuracy rate above 95% on challenge audits

## Rationale

- **On-chain over off-chain registry**: Off-chain registries (MLflow, W&B) require trusting the registry operator. On-chain attestation is trustless and immutable.
- **Weight hashing over model encryption**: Hashing is sufficient to detect tampering without the computational overhead of homomorphic encryption or the key management burden of model encryption.
- **Merkle tree for data provenance**: Allows selective disclosure. A trainer can prove a specific dataset was included without revealing the entire training corpus.
- **Optional TEE attestation**: Not all inference nodes run in TEEs. TEE reports provide stronger guarantees when available but are not required to avoid excluding commodity hardware.

## Security Considerations

1. **Hash collision attacks**: SHA-256 is collision-resistant under current assumptions. If a pre-image attack becomes feasible (e.g., via quantum computing), the hash algorithm must be upgraded. The contract supports versioned hash functions.
2. **Auditor collusion**: Auditors could co-sign false attestations. Mitigation: auditor stake is slashable; challenge audits randomly re-verify a percentage of attestations; auditors found colluding are permanently banned and slashed.
3. **Stale attestations**: A model could be modified after attestation. Mitigation: inference nodes must produce fresh runtime attestations; clients should reject runtime attestations older than a configurable threshold.
4. **Metadata spoofing**: The IPFS metadata document could be replaced if the CID is not pinned. Mitigation: the CID is stored on-chain; IPFS content is immutable once addressed by CID.
5. **Training data falsification**: A trainer could claim clean data provenance while actually training on poisoned data. Mitigation: auditors verify a sample of training data records; challenge audits request evidence of dataset access.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-1: Hamiltonian LLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
3. [ZIP-400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
4. [ZIP-402: Proof of AI Consensus](./zip-0402-proof-of-ai-consensus.md)
5. Mitchell, M. et al. "Model Cards for Model Reporting." FAT* 2019.
6. Gebru, T. et al. "Datasheets for Datasets." CACM 2021.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
