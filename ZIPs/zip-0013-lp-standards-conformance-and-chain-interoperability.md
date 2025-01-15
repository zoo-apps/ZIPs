---
zip: 0013
title: LP Standards Conformance and Chain Interoperability
author: Zoo Labs Foundation
type: Standards Track
category: Core
status: Final
created: 2025-01-09
requires: ZIP-12
supersedes: ZIP-2, ZIP-5
repository: https://github.com/zooai/lp-standards-conformance
---

# ZIP-13: LP Standards Conformance and Chain Interoperability

## Abstract

This proposal establishes Zoo (Chain ID: 122) as the canonical LP-R (Registry) implementation in the Lux ecosystem, ensuring full conformance with LP standards and seamless interoperability with Lux (120) and Hanzo (121). It defines how Zoo implements required Ethereum standards (ERC-20, ERC-721, ERC-1155, ERC-4337), extends them for AI use cases, and bridges them across chains.

## Motivation

The three-chain ecosystem requires precise coordination:
- **Lux (120)**: Settlement layer with Avalanche consensus
- **Hanzo (121)**: Compute layer with GPU orchestration  
- **Zoo (122)**: Registry layer with user interfaces

Without strict standards alignment, we risk:
- Incompatible implementations across chains
- Broken cross-chain workflows
- Inconsistent user experiences
- Security vulnerabilities at boundaries

## Specification

### Chain Configuration

```typescript
const CHAIN_CONFIG = {
  lux: {
    chainId: 120,
    name: "Lux Network",
    role: "Settlement & Finality",
    consensus: "Avalanche (Snow)",
    vm: "Multiple (C-Chain EVM compatible)",
    nativeCurrency: { name: "LUX", symbol: "LUX", decimals: 18 },
    rpcUrls: ["https://api.lux.network"],
    blockExplorerUrls: ["https://explorer.lux.network"]
  },
  hanzo: {
    chainId: 121,
    name: "Hanzo Compute",
    role: "LP-C (Compute)",
    consensus: "AI Consensus",
    vm: "ACI (AI Compute Infrastructure)",
    nativeCurrency: { name: "HANZO", symbol: "HANZO", decimals: 18 },
    rpcUrls: ["https://api.hanzo.ai"],
    blockExplorerUrls: ["https://explorer.hanzo.ai"]
  },
  zoo: {
    chainId: 122,
    name: "Zoo Network",
    role: "LP-R (Registry)",
    consensus: "Delegated Proof of Stake",
    vm: "EVM",
    nativeCurrency: { name: "KEEPER", symbol: "KEEPER", decimals: 18 },
    rpcUrls: ["https://api.zoo.fund"],
    blockExplorerUrls: ["https://explorer.zoo.fund"]
  }
}
```

### ERC Standards Implementation

#### ERC-20: Fungible Tokens
```solidity
// Zoo's extended ERC-20 for AI tokens
contract ZooERC20 is ERC20, ILPRoyalties {
    mapping(string => uint256) public luxIdBalances;  // did:lux:122:0x...
    
    function transfer(string calldata toLuxId, uint256 amount) external {
        address to = resolveLuxId(toLuxId);
        _transfer(msg.sender, to, amount);
        emit TransferToLuxId(msg.sender, toLuxId, amount);
    }
    
    // LP-106 royalty distribution
    function distributeRoyalties(
        bytes32 modelHash,
        uint256 amount
    ) external override {
        RoyaltyMap memory royalties = getRoyaltyMap(modelHash);
        for (uint i = 0; i < royalties.contributorLuxIds.length; i++) {
            uint256 share = (amount * royalties.shares[i]) / 10000;
            luxIdBalances[royalties.contributorLuxIds[i]] += share;
        }
    }
}
```

#### ERC-721: NFTs with AI Models
```solidity
contract ZooModelNFT is ERC721, ILPJob {
    struct ModelNFT {
        string modelLuxId;      // did:lux:122:0x...
        bytes32 modelHash;      // IPFS CID
        uint256 parameterCount; // 72B, 32B, 3B
        string[] capabilities;  // ["multimodal", "behavioral"]
        RoyaltyMap royalties;   // LP-106
    }
    
    mapping(uint256 => ModelNFT) public models;
    
    function mintModel(
        string calldata creatorLuxId,
        ModelNFT calldata model,
        bytes calldata computeReceipt  // LP-105
    ) external returns (uint256 tokenId) {
        require(verifyComputeReceipt(computeReceipt), "Invalid receipt");
        tokenId = _mint(resolveLuxId(creatorLuxId));
        models[tokenId] = model;
        emit ModelMinted(tokenId, model.modelLuxId, model.modelHash);
    }
}
```

#### ERC-1155: Multi-Token for BitDelta Adapters
```solidity
contract BitDeltaMultiToken is ERC1155, ILPPersona {
    // Token IDs encode: [modelHash:32][userAddress:20][version:12]
    
    function mintBitDelta(
        string calldata userLuxId,
        bytes32 modelHash,
        BitDeltaAdapter calldata adapter,
        bytes calldata teeAttestation  // LP-103
    ) external returns (uint256 tokenId) {
        require(verifyTEE(teeAttestation), "Invalid TEE");
        
        tokenId = encodeBitDeltaId(modelHash, userLuxId);
        _mint(resolveLuxId(userLuxId), tokenId, 1, adapter.data);
        
        // Apply persona constraints (LP-107)
        PersonaCredential memory persona = getPersona(userLuxId);
        applyPersonaConstraints(adapter, persona);
        
        emit BitDeltaMinted(userLuxId, modelHash, tokenId);
    }
}
```

#### ERC-4337: Account Abstraction for Agents
```solidity
contract AgentAccount is IAccount, ILPJob {
    string public agentLuxId;  // did:lux:122:0x...
    
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        // Validate with agent's active inference logic
        JobSpec memory job = JobSpec({
            chainId: 122,
            modelHash: getAgentModelHash(),
            requesterLuxId: agentLuxId,
            functionCall: "validateOperation",
            inputData: abi.encode(userOp)
        });
        
        bytes32 jobId = submitJob(job);
        ComputeReceipt memory receipt = waitForReceipt(jobId);
        
        require(receipt.confidence > 70, "Low confidence");
        return receipt.approved ? 0 : 1;
    }
}
```

### Cross-Chain Bridge Channels

```solidity
contract ZooBridge {
    // LP-401: Lux Bridge Protocol implementation
    
    mapping(bytes32 => Channel) public channels;
    
    constructor() {
        // Required LP channels
        channels[keccak256("lp.jobs")] = Channel({
            name: "Job Submission",
            sourceChains: [120, 121, 122],
            targetChains: [120, 121, 122],
            messageType: MessageType.JobSpec
        });
        
        channels[keccak256("lp.receipts")] = Channel({
            name: "Compute Receipts",
            sourceChains: [121],  // Hanzo primary
            targetChains: [120, 122],
            messageType: MessageType.ComputeReceipt
        });
        
        channels[keccak256("lp.settlement")] = Channel({
            name: "LX Settlement",
            sourceChains: [120],  // Lux primary
            targetChains: [121, 122],
            messageType: MessageType.TokenTransfer
        });
        
        channels[keccak256("lp.royalties")] = Channel({
            name: "Royalty Distribution",
            sourceChains: [122],  // Zoo primary
            targetChains: [120, 121],
            messageType: MessageType.RoyaltyMap
        });
    }
    
    function sendMessage(
        bytes32 channelId,
        uint256 targetChain,
        bytes calldata message
    ) external {
        Channel memory channel = channels[channelId];
        require(isValidRoute(channel, block.chainid, targetChain), "Invalid route");
        
        // EIP-712 signing
        bytes32 messageHash = hashTypedData(channelId, targetChain, message);
        
        emit MessageSent(channelId, targetChain, messageHash, message);
    }
}
```

### UI/UX Conformance

```typescript
class ZooUI implements LPUIRequirements {
    // LP-501: Citation Rendering
    renderCitations(response: AIResponse): JSX.Element {
        return (
            <CitationPanel>
                {response.citations.map(c => (
                    <Citation
                        key={c.id}
                        source={c.source}
                        confidence={c.confidence}
                        luxId={c.authorLuxId}
                    />
                ))}
            </CitationPanel>
        )
    }
    
    // LP-502: Confidence Display
    displayConfidence(confidence: number): JSX.Element {
        const level = confidence < 30 ? 'low' : 
                     confidence < 70 ? 'medium' : 'high'
        
        return (
            <ConfidenceIndicator level={level}>
                {confidence < 30 && <AbstainWarning />}
                <ProgressBar value={confidence} max={100} />
            </ConfidenceIndicator>
        )
    }
    
    // LP-503: Persona Consent
    async requestPersonaConsent(userLuxId: string): Promise<boolean> {
        const modal = await showModal({
            title: "AI Personalization",
            content: <PersonaConsentForm luxId={userLuxId} />,
            actions: ["Allow", "Deny"]
        })
        
        if (modal.action === "Allow") {
            await saveConsent(userLuxId, true)
            return true
        }
        return false
    }
    
    // LP-504: WCAG Compliance
    ensureAccessibility(): void {
        // Automatic checks on mount
        enforceAriaLabels()
        ensureKeyboardNavigation()
        checkColorContrast()
        provideScreenReaderSupport()
    }
    
    // LP-505: Bibliodiversity
    showBibliodiversity(sources: Source[]): JSX.Element {
        const metrics = calculateDiversityMetrics(sources)
        
        return (
            <DiversityDashboard>
                <GeographicMap distribution={metrics.geographic} />
                <PublisherChart publishers={metrics.publishers} />
                <TimelineView temporal={metrics.temporal} />
            </DiversityDashboard>
        )
    }
}
```

### Node Configuration

```yaml
# zoo-node-config.yaml
network:
  chainId: 122
  role: LP-R
  
consensus:
  type: DPoS
  validators: 21
  blockTime: 3s
  
interop:
  lux:
    endpoint: wss://api.lux.network
    chainId: 120
    bridgeContract: "0x..."
    
  hanzo:
    endpoint: wss://api.hanzo.ai
    chainId: 121
    computeEndpoint: grpc://compute.hanzo.ai:7550
    
identity:
  method: did:lux
  registry: "0x..."  # LP-205 Registry
  
standards:
  evm:
    - ERC-20
    - ERC-721
    - ERC-1155
    - ERC-4337
    - EIP-712
    - EIP-1559
    - EIP-2981
    
  lp:
    - LP-101  # JobSpec
    - LP-105  # ComputeReceipt
    - LP-106  # RoyaltyMap
    - LP-107  # PersonaCredential
    - LP-200  # Lux ID
    - LP-205  # Registry
    - LP-401  # Bridge
    - LP-501  # Citations
    - LP-502  # Confidence
    - LP-503  # Consent
    - LP-504  # Accessibility
    - LP-505  # Bibliodiversity
```

## Testing

### Standards Compliance Tests
```typescript
describe("LP Standards Conformance", () => {
    it("should use Lux ID for all identities", async () => {
        const luxId = "did:lux:122:0xAbc123..."
        const resolved = await registry.resolve(luxId)
        expect(resolved.chainId).toBe(122)
        expect(resolved.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
    
    it("should emit LP-105 receipts for all compute", async () => {
        const job = await submitJob(jobSpec)
        const receipt = await waitForReceipt(job.id)
        
        expect(receipt).toHaveProperty('computeProof')
        expect(receipt).toHaveProperty('citations')
        expect(receipt).toHaveProperty('confidence')
    })
    
    it("should bridge messages to all chains", async () => {
        const message = encodeJobSpec(testJob)
        
        // Test to Lux
        await bridge.sendMessage("lp.jobs", 120, message)
        
        // Test to Hanzo
        await bridge.sendMessage("lp.jobs", 121, message)
        
        // Verify receipts
        const receipts = await bridge.getReceipts(message)
        expect(receipts).toHaveLength(2)
    })
})
```

## Security Considerations

1. **Cross-chain replay protection**: Chain ID in all signatures
2. **Bridge security**: 2/3 validator signatures required
3. **TEE verification**: Only accept Hanzo-attested receipts
4. **Identity verification**: Resolve all Lux IDs on-chain

## Migration Path

### From ZIP-2 (Genesis Airdrop)
- Airdrop recipients get Lux IDs automatically
- Legacy addresses mapped to did:lux:122:...

### From ZIP-5 (Post-Quantum)
- Dilithium keys supported in Lux ID
- Gradual migration as quantum threat emerges

## Reference Implementation

**Repository**: [zooai/lp-standards-conformance](https://github.com/zooai/lp-standards-conformance)

**Key Files**:
- `/contracts/ZooERC20.sol` - Extended ERC-20 with Lux ID support
- `/contracts/ZooModelNFT.sol` - ERC-721 for AI models
- `/contracts/BitDeltaMultiToken.sol` - ERC-1155 for BitDelta adapters
- `/contracts/AgentAccount.sol` - ERC-4337 account abstraction for agents
- `/contracts/ZooBridge.sol` - LP-401 bridge implementation
- `/src/ZooUI.tsx` - LP UI/UX conformance implementation
- `/tests/` - Standards compliance test suite

**Status**: Implemented

**Integration Points**:
- Chain ID: 122 (Zoo Network)
- Bridge to Lux (120) and Hanzo (121)
- Implements LP-101, LP-105, LP-106, LP-107, LP-200, LP-205, LP-401, LP-501-505

## References

1. [Canonical Standards Matrix](/CANONICAL_STANDARDS.md)
2. [LP-000: Lux Proposals Index](/lp-spec/LP-000.md)
3. [HIP-000: Hanzo Proposals Index](/HIPs/HIP-000.md)
4. [Lux ID Specification](/luxid/README.md)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).