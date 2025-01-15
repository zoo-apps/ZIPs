---
zip: 0012
title: LP (Lux Proposals) Integration - Chain-Agnostic AI Standards
author: Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2025-01-09
requires: ZIP-7, ZIP-8, ZIP-9, ZIP-10, ZIP-11
implements: LP-100 through LP-205
repository: https://github.com/zooai/lp-integration
license: CC BY 4.0
---

# ZIP-12: LP (Lux Proposals) Integration - Chain-Agnostic AI Standards

## Abstract

This proposal integrates the LP (Lux Proposals) standard family into Zoo's AI infrastructure, establishing chain-agnostic types and flows for AI jobs, verifiable receipts, royalties, personas, training campaigns, and DAO-run model releases. Zoo serves as the primary Registry (LP-R) role, while coordinating with Hanzo (LP-C for compute) and sovereign AI L1s (LP-D for DAO LLMs), all anchored to Lux for finality and settlement. The proposal also implements Lux ID (did:lux) as the universal identity system across the ecosystem.

## Motivation

Current AI infrastructure lacks standardization across chains, leading to:
- **Fragmented Identity**: Different identity systems per chain
- **No Verifiable Compute**: Cannot prove AI computations were performed correctly
- **Missing Royalty Rails**: No standard for AI model royalties
- **Isolated Training**: Training campaigns cannot span chains
- **Opaque Inference**: No receipts or citations for AI outputs

LP standards solve these by providing:
- **Lux ID**: Universal DID method (did:lux) with web aliases
- **Verifiable Receipts**: TEE/ZK proofs for compute integrity
- **Royalty Infrastructure**: EIP-2981 compatible AI royalties
- **Cross-Chain Training**: Coordinated training campaigns
- **Transparent AI**: Citations, confidence, and personas

## Role Definitions

### Zoo as LP-R (Registry Role)
```solidity
contract ZooRegistry is ILPRegistry {
    // Model/Agent registries
    mapping(bytes32 => ModelRecord) public models;
    mapping(string => AgentRecord) public agents;  // Lux ID → Agent
    
    // Royalty management
    mapping(bytes32 => RoyaltyMap) public royalties;
    
    // Persona credentials
    mapping(string => PersonaCredential) public personas;  // Lux ID → Persona
    
    // DeltaSoup governance
    mapping(bytes32 => DeltaSoupRecord) public soups;
    
    // Transparency logs
    event CitationRecorded(bytes32 indexed outputHash, Citation[] citations);
    event ConfidenceRecorded(bytes32 indexed outputHash, uint8 confidence);
}
```

### Hanzo as LP-C (Compute Role)
```solidity
contract HanzoCompute is ILPCompute {
    // GPU scheduler
    mapping(uint256 => GPUSlot) public slots;
    
    // TEE/ZK verification
    ITEEVerifier public teeVerifier;
    IZKVerifier public zkVerifier;
    
    // ComputeReceipt emission
    event ReceiptEmitted(uint256 jobId, ComputeReceipt receipt);
    
    // FBA auctions for GPU
    IAuction public gpuAuction;
}
```

### DAO LLM Chains as LP-D
```solidity
contract DAOLLMChain is ILPDAO {
    // Training campaigns
    mapping(uint256 => TrainingCampaign) public campaigns;
    
    // Evaluation board
    IEvalBoard public evalBoard;
    
    // Shared Validated Model releases
    mapping(bytes32 => SVM) public releases;
    
    // Inference pools
    mapping(uint256 => InferencePool) public pools;
}
```

## Lux ID Implementation

### LP-200: Lux ID Method (did:lux)

```typescript
class LuxIDMethod implements DIDMethod {
    method = "lux";
    
    // Canonical DID format: did:lux:<chainId>:<address>
    create(chainId: number, address: string): string {
        return `did:lux:${chainId}:${address}`;
    }
    
    // Key-based form for off-chain: did:lux:key:<multibase>
    createKey(publicKey: Uint8Array): string {
        const multibase = base58btc.encode(publicKey);
        return `did:lux:key:${multibase}`;
    }
    
    // Resolve to DID Document
    async resolve(did: string): Promise<DIDDocument> {
        const [method, type, identifier] = did.split(":");
        
        if (type === "key") {
            return this.resolveKey(identifier);
        } else {
            const chainId = parseInt(type);
            return this.resolveOnChain(chainId, identifier);
        }
    }
    
    // Web alias: did:web:lux.id/<chainId>/<address>
    getWebAlias(did: string): string {
        const [_, chainId, address] = did.split(":");
        return `did:web:lux.id/${chainId}/${address}`;
    }
}
```

### LP-205: Lux ID Registry

```solidity
contract LuxIDRegistry {
    struct IDRecord {
        bytes32 docHash;          // IPFS hash of DID Document
        address[] controllers;     // Current controllers
        uint256 nonce;            // For key rotation
        bool revoked;             // Revocation flag
        uint256 lastUpdated;      // Block timestamp
    }
    
    // Lux ID → Record
    mapping(string => IDRecord) public registry;
    
    // Events
    event IDCreated(string indexed luxId, bytes32 docHash);
    event IDRotated(string indexed luxId, bytes32 newDocHash, uint256 nonce);
    event IDRevoked(string indexed luxId);
    
    function createID(
        string memory luxId,
        bytes32 docHash,
        address[] memory controllers
    ) external {
        require(registry[luxId].docHash == 0, "ID exists");
        
        registry[luxId] = IDRecord({
            docHash: docHash,
            controllers: controllers,
            nonce: 0,
            revoked: false,
            lastUpdated: block.timestamp
        });
        
        emit IDCreated(luxId, docHash);
    }
    
    function rotateKeys(
        string memory luxId,
        bytes32 newDocHash,
        bytes memory signature
    ) external {
        IDRecord storage record = registry[luxId];
        require(!record.revoked, "ID revoked");
        require(verifyControllers(luxId, signature), "Invalid signature");
        
        record.docHash = newDocHash;
        record.nonce++;
        record.lastUpdated = block.timestamp;
        
        emit IDRotated(luxId, newDocHash, record.nonce);
    }
}
```

## LP Type Implementations

### LP-101: JobSpec with Zoo Integration

```solidity
struct JobSpec {
    uint256 chainId;          // Zoo chain ID (122)
    bytes32 modelHash;        // Eco-1, Coder-1, or Nano-1
    bytes32 deltaHash;        // BitDelta adapter
    bytes32 inputCommit;      // Input commitment
    uint256 maxPrice;         // In LX tokens
    bool requireGPUCC;        // GPU-CC requirement
    uint64 deadline;          // Execution deadline
    bytes privacy;            // DP epsilon, retention
    bytes extra;              // Additional options
    string requesterLuxId;    // did:lux:122:0x...
}

contract ZooJobSubmitter {
    function submitJob(JobSpec memory spec) external returns (uint256 jobId) {
        // Validate Lux ID
        require(isValidLuxId(spec.requesterLuxId), "Invalid Lux ID");
        
        // Lock payment
        LX.transferFrom(msg.sender, address(this), spec.maxPrice);
        
        // Bridge to compute chain (Hanzo)
        bytes memory envelope = abi.encode(spec);
        bridge.send("lp.jobs", HANZO_CHAIN_ID, envelope);
        
        // Store job
        jobs[jobId] = spec;
        
        emit JobSubmitted(jobId, spec.requesterLuxId, spec);
        
        return jobId;
    }
}
```

### LP-105: ComputeReceipt with Citations

```solidity
struct ComputeReceipt {
    uint256 srcChainId;       // Zoo (122)
    uint256 dstChainId;       // Hanzo (121)
    uint256 jobId;            // Job identifier
    bytes32 modelHash;        // Model used
    bytes32 deltaHash;        // Adapter used
    bytes32 outputCommit;     // Output hash
    TEEQuote tee;             // TEE attestation
    ZKReceipt zk;             // Optional ZK proof
    uint64 startedAt;         // Start timestamp
    uint64 finishedAt;        // End timestamp
    bytes metering;           // Resource usage
    Citation[] citations;     // Source citations
    string workerLuxId;       // did:lux:121:0x...
    string requesterLuxId;    // did:lux:122:0x...
}

struct Citation {
    string source;            // Source identifier
    string title;             // Document title
    string author;            // Author/publisher
    uint256 confidence;       // Confidence score (0-100)
    string region;            // Geographic origin
    string license;           // License type
}
```

### LP-107: PersonaCredential for Avatars

```solidity
struct PersonaCredential {
    string subjectLuxId;      // did:lux:122:0x... (user)
    int16 O;                  // Openness (-100 to 100)
    int16 C;                  // Conscientiousness
    int16 E;                  // Extraversion
    int16 A;                  // Agreeableness
    int16 N;                  // Neuroticism
    bytes32 policyHash;       // Consent policy
    bytes endorsements;       // VC bundle
    uint64 issuedAt;          // Issue time
    uint64 expiresAt;         // Expiry time
}

contract ZooPersonaManager {
    mapping(string => PersonaCredential) public personas;
    
    function issuePersona(
        string memory subjectLuxId,
        int16[5] memory ocean,
        bytes32 policyHash
    ) external {
        require(hasConsent(subjectLuxId, policyHash), "No consent");
        
        personas[subjectLuxId] = PersonaCredential({
            subjectLuxId: subjectLuxId,
            O: ocean[0], C: ocean[1], E: ocean[2],
            A: ocean[3], N: ocean[4],
            policyHash: policyHash,
            endorsements: "",
            issuedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + 365 days)
        });
        
        emit PersonaIssued(subjectLuxId, ocean);
    }
}
```

### LP-108: TrainingCampaign for Eco-1

```solidity
struct TrainingCampaign {
    uint256 chainId;          // Zoo chain
    bytes32 baseModelHash;    // Eco-1 base
    uint64 startAt;           // Campaign start
    uint64 endAt;             // Campaign end
    uint256 budget;           // Total LX budget
    address token;            // LX token address
    bytes32 policyHash;       // Training policy
    bytes evalRefs;           // Evaluation criteria
    string sponsorLuxId;      // did:lux:122:0x...
}

contract Eco1TrainingCampaign {
    function launchCampaign(
        TrainingCampaign memory campaign
    ) external returns (uint256 campaignId) {
        // Validate sponsor
        require(isValidLuxId(campaign.sponsorLuxId), "Invalid sponsor");
        
        // Lock budget
        IERC20(campaign.token).transferFrom(
            msg.sender,
            address(this),
            campaign.budget
        );
        
        // Store campaign
        campaigns[campaignId] = campaign;
        
        // Bridge to DAO LLM chain
        bridge.send("lp.training", DAO_CHAIN_ID, abi.encode(campaign));
        
        emit CampaignLaunched(campaignId, campaign);
        
        return campaignId;
    }
}
```

## Bridge Integration

### Lux Bridge Channels

```solidity
contract ZooLuxBridge {
    // Channel definitions
    string constant JOBS_CHANNEL = "lp.jobs";
    string constant RECEIPTS_CHANNEL = "lp.receipts";
    string constant SETTLEMENT_CHANNEL = "lp.settlement";
    
    // Checkpoint to Lux Q-Chain every 10 minutes
    uint256 constant CHECKPOINT_INTERVAL = 600;
    uint256 lastCheckpoint;
    
    function checkpoint() external {
        require(
            block.timestamp >= lastCheckpoint + CHECKPOINT_INTERVAL,
            "Too soon"
        );
        
        // Gather state root
        bytes32 stateRoot = computeStateRoot();
        
        // Submit to Lux Q-Chain
        luxQChain.submitCheckpoint(block.chainid, stateRoot);
        
        lastCheckpoint = block.timestamp;
        
        emit CheckpointSubmitted(stateRoot, block.timestamp);
    }
}
```

## UI/UX Invariants (LP-W)

### Wallet Requirements

```typescript
interface LPWallet {
    // MUST render citations
    renderCitations(receipt: ComputeReceipt): UIElement;
    
    // MUST show confidence
    renderConfidence(confidence: number): UIElement;
    
    // MUST handle abstention
    handleLowConfidence(threshold: number): void;
    
    // MUST get persona consent
    requestPersonaConsent(credential: PersonaCredential): Promise<boolean>;
    
    // MUST label AI outputs
    labelAIContent(content: string): UIElement;
    
    // MUST support accessibility
    ensureWCAG(): ValidationResult;
    
    // MUST show bibliodiversity
    showBibliodiversity(citations: Citation[]): DiversityMetrics;
}

class ZooWallet implements LPWallet {
    renderCitations(receipt: ComputeReceipt): UIElement {
        return (
            <CitationPanel>
                {receipt.citations.map(cite => (
                    <Citation
                        key={cite.source}
                        title={cite.title}
                        author={cite.author}
                        confidence={cite.confidence}
                        region={cite.region}
                        license={cite.license}
                    />
                ))}
            </CitationPanel>
        );
    }
    
    renderConfidence(confidence: number): UIElement {
        const level = confidence > 90 ? "high" :
                     confidence > 70 ? "medium" : "low";
        
        return (
            <ConfidenceIndicator level={level}>
                {confidence}% confident
                {confidence < 70 && <AbstainOption />}
            </ConfidenceIndicator>
        );
    }
}
```

## Example Flow: Avatar Tutor with LP

```typescript
async function avatarTutorSession() {
    // 1. User creates Lux ID
    const userLuxId = await createLuxId(chainId, userAddress);
    // "did:lux:122:0xUser123..."
    
    // 2. Issue persona credential for avatar
    const persona = await issuePersona(userLuxId, {
        O: 70,  // Open to new experiences
        C: 85,  // Conscientious teacher
        E: 60,  // Moderately extraverted
        A: 90,  // Very agreeable
        N: 20   // Low neuroticism (calm)
    });
    
    // 3. Submit learning job
    const jobSpec: JobSpec = {
        chainId: 122,  // Zoo
        modelHash: ECO1_HASH,
        deltaHash: STUDENT_BITDELTA_HASH,
        inputCommit: hash(question),
        maxPrice: parseEther("0.1"),  // 0.1 LX
        requireGPUCC: true,
        deadline: Date.now() + 3600,
        privacy: encodeDP(1.0),  // epsilon = 1.0
        extra: encode({ subject: "biology" }),
        requesterLuxId: userLuxId
    };
    
    const jobId = await submitJob(jobSpec);
    
    // 4. Bridge to Hanzo for compute
    // (Automatic via bridge.send("lp.jobs", HANZO_CHAIN_ID, jobSpec))
    
    // 5. Hanzo executes with TEE
    const receipt = await waitForReceipt(jobId);
    
    // 6. Verify receipt and show output
    if (verifyTEE(receipt.tee)) {
        // Show answer with citations
        showAnswer(receipt.output);
        renderCitations(receipt.citations);
        renderConfidence(receipt.confidence);
        
        // 7. Pay royalties via LP-106
        await distributeRoyalties(receipt.modelHash, receipt.deltaHash);
    }
}
```

## Migration from Previous Standards

### From ZIPs to LP Integration

```typescript
// Before: Zoo-specific types
interface ZooJob {
    model: string;
    input: string;
    user: address;
}

// After: LP-compliant types
interface JobSpec {
    chainId: number;
    modelHash: bytes32;
    inputCommit: bytes32;
    requesterLuxId: string;  // Lux ID instead of address
    // ... full LP-101 spec
}

// Before: Simple addresses
const user = "0x123...";

// After: Lux IDs
const userLuxId = "did:lux:122:0x123...";
```

## Implementation Roadmap

### Phase 1: LP Core (Q1 2025)
- Deploy LP-200/205 Lux ID registry on Lux mainnet
- Implement LP-101 through LP-112 types in Zoo contracts
- Set up Lux Bridge channels (lp.jobs, lp.receipts, lp.settlement)

### Phase 2: Identity Migration (Q1 2025)
- Migrate all user addresses to Lux IDs
- Issue persona credentials for existing avatars
- Update wallets with LP-W requirements

### Phase 3: Compute Integration (Q2 2025)
- Connect Hanzo as LP-C provider
- Implement TEE/ZK verification
- Deploy ComputeReceipt infrastructure

### Phase 4: Full Ecosystem (Q2-Q3 2025)
- Launch training campaigns with LP-108
- Enable cross-chain model releases (LP-110)
- Activate inference pools (LP-111)

## Security Considerations

1. **Identity Security**: Lux ID controllers must be protected; support key rotation
2. **Bridge Security**: EIP-712 signatures on all bridge messages; timeout mechanisms
3. **TEE Verification**: Validate attestation certificates against known roots
4. **Privacy**: Enforce DP budgets; honor retention=0 for ephemeral compute
5. **Royalty Security**: Escrow funds before distribution; audit split calculations

## References

1. LP Specification Repository: https://github.com/luxfi/lp-spec
2. Lux ID Method: https://lux.id/did-method
3. EIP-712: Typed Data Signing
4. EIP-2981: NFT Royalty Standard
5. W3C DID Core: https://www.w3.org/TR/did-core/
6. Zoo Implementation: https://github.com/zooai/lp-integration

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

*"LP brings order to the multi-chain AI chaos. With Lux ID as identity and LX as settlement, Zoo orchestrates a symphony of verifiable, transparent, and economically sustainable AI across all chains." - LP Integration Vision*