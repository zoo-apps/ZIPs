---
zip: 0005
title: Post-Quantum Security for DeFi & NFTs
author: Zoo Team
type: Standards Track
category: Security
status: Final
created: 2024-12-20
requires: LP-100, HIP-5
---

# ZIP-5: Post-Quantum Security for DeFi & NFTs

## Abstract

This proposal mandates Post-Quantum Cryptography for all Zoo ecosystem components, including DeFi protocols, NFT marketplace, and gaming infrastructure. Building on Lux Network's PQC implementation (LP-100) and Hanzo's AI security (HIP-5), this ensures quantum-resistant protection for user assets and transactions.

## Motivation

The Zoo ecosystem manages significant value through:

1. **DeFi Protocols**: Billions in TVL requiring long-term security
2. **NFT Assets**: Unique digital assets with perpetual value
3. **Gaming Assets**: In-game items and currencies
4. **User Wallets**: Private keys needing quantum resistance
5. **Smart Contracts**: Immutable code requiring future-proof signatures

Quantum computers threaten all current cryptographic protections. Zoo must implement PQC before quantum threats materialize.

## Specification

### PQC Integration Stack

```
Zoo Application Layer
├── Smart Contracts (PQC signatures)
├── NFT Metadata (PQC encryption)
├── Game Assets (PQC protected)
└── User Wallets (PQC keys)
    ↓
Lux Network (LP-100)
├── ML-KEM-768 (Key encapsulation)
├── ML-DSA-65 (Digital signatures)
└── Hybrid Mode (Defense-in-depth)
```

### Smart Contract Security

#### PQC-Enhanced Contracts
```solidity
contract PQCSecureVault {
    // Quantum-resistant signature verification
    mapping(address => bytes) public mlDsaPublicKeys;
    
    modifier requiresPQCSignature(
        bytes memory signature,
        bytes32 messageHash
    ) {
        require(
            verifyMLDSA(msg.sender, messageHash, signature),
            "Invalid PQC signature"
        );
        _;
    }
    
    function deposit(
        uint256 amount,
        bytes memory pqcSignature
    ) external requiresPQCSignature(
        pqcSignature,
        keccak256(abi.encode(amount, nonce[msg.sender]))
    ) {
        // Deposit logic
    }
}
```

### NFT Protection

#### Quantum-Safe NFT Standard (ZRC-721-PQC)
```json
{
  "name": "Quantum Resistant NFT",
  "description": "NFT with PQC protection",
  "image": "ipfs://...",
  "pqc_metadata": {
    "encrypted_attributes": "ML-KEM encrypted data",
    "creator_signature": {
      "algorithm": "ML-DSA-65",
      "public_key": "0x...",
      "signature": "0x..."
    },
    "provenance_chain": [
      {
        "owner": "0x...",
        "timestamp": 1703001234,
        "pqc_signature": "0x..."
      }
    ]
  }
}
```

### DeFi Protocol Updates

#### Yield Vault with PQC
```solidity
interface IPQCYieldVault {
    // Deposit with quantum-resistant authorization
    function depositWithPQC(
        uint256 amount,
        bytes calldata mlKemPublicKey,
        bytes calldata mlDsaSignature
    ) external;
    
    // Withdraw with PQC verification
    function withdrawWithPQC(
        uint256 shares,
        bytes calldata pqcProof
    ) external;
    
    // Emergency withdrawal with multi-sig PQC
    function emergencyWithdraw(
        bytes[] calldata pqcSignatures
    ) external;
}
```

### Wallet Integration

#### Quantum-Safe Wallet Structure
```typescript
interface PQCWallet {
  // Classical keys (for compatibility)
  classicalAddress: string;
  classicalPrivateKey: string;
  
  // PQC keys
  mlKemKeyPair: {
    public: Uint8Array;
    secret: Uint8Array;
  };
  
  mlDsaKeyPair: {
    public: Uint8Array;
    secret: Uint8Array;
  };
  
  // Hybrid mode enabled
  hybridMode: boolean;
}
```

### Gaming Asset Security

#### Secure Game Items
```typescript
class PQCGameItem {
  id: string;
  owner: string;
  attributes: EncryptedData;  // ML-KEM encrypted
  signature: MLDSASignature;   // Authenticity proof
  
  transfer(newOwner: string, pqcAuth: PQCAuthorization) {
    // Verify PQC authorization
    if (!verifyPQC(pqcAuth)) {
      throw new Error("Invalid PQC authorization");
    }
    
    // Transfer with quantum-resistant proof
    this.owner = newOwner;
    this.signature = signWithMLDSA(this);
  }
}
```

### Migration Strategy

#### Phase 1: Dual Support (Current)
- Support both classical and PQC
- New contracts PQC-enabled
- Gradual user migration

#### Phase 2: PQC Default (Q2 2025)
- PQC becomes default
- Classical marked deprecated
- Migration incentives

#### Phase 3: PQC Only (Q4 2025)
- Classical support removed
- Full quantum resistance
- Legacy bridge for old assets

### Privacy Tiers

| Tier | Application | Protection Level |
|------|------------|------------------|
| 0 | Public data | Basic PQC |
| 1 | User assets | + Encrypted storage |
| 2 | High-value NFTs | + TEE verification |
| 3 | Treasury ops | + Multi-sig PQC |
| 4 | Critical infrastructure | + Full TEE-I/O |

## Rationale

### Why Now?

- **Quantum Timeline**: Threats expected within 5-10 years
- **Asset Longevity**: NFTs and DeFi positions held long-term
- **First Mover**: Competitive advantage in security
- **User Trust**: Demonstrates commitment to security

### Why These Algorithms?

- **ML-KEM-768**: Optimal balance of security and performance
- **ML-DSA-65**: Reasonable signature sizes for blockchain
- **Hybrid Mode**: Protection against both quantum and classical attacks

## Security Considerations

### Threat Model
- **Quantum Attacks**: Shor's algorithm breaks ECDSA
- **Retroactive Attacks**: "Harvest now, decrypt later"
- **Smart Contract Risks**: Immutable code needs future-proof security
- **Cross-chain Risks**: Bridge security critical

### Risk Mitigation
- **Regular Audits**: Continuous security assessment
- **Bug Bounties**: Incentivize vulnerability discovery
- **Insurance Fund**: Coverage for potential issues
- **Gradual Rollout**: Phased implementation

## Implementation

### Completed
- Lux Network PQC (LP-100)
- Core library integration
- Initial testing

### Q1 2025
- Smart contract templates
- Wallet SDK updates
- NFT standard finalization

### Q2 2025
- DeFi protocol migration
- Gaming integration
- User migration tools

### Q3 2025
- Full ecosystem coverage
- Performance optimization
- Documentation complete

## Testing

### Security Tests
- Quantum attack simulation
- Side-channel analysis
- Formal verification

### Integration Tests
- Cross-chain compatibility
- Wallet integration
- Gas optimization

### Performance Benchmarks
- Transaction throughput
- Signature verification time
- Storage requirements

## Reference Implementation

**Repository**: [zooai/pqc](https://github.com/zooai/pqc)

**Key Files**:
- `/crypto/ml_dsa.rs` - ML-DSA (FIPS 204) implementation
- `/crypto/ml_kem.rs` - ML-KEM (FIPS 203) implementation
- `/crypto/slh_dsa.rs` - SLH-DSA (FIPS 205) implementation
- `/contracts/PQCWallet.sol` - Post-quantum wallet contract
- `/contracts/PQCSignatureVerifier.sol` - On-chain signature verification
- `/contracts/PQCERC721.sol` - Post-quantum NFT standard
- `/sdk/typescript/` - TypeScript SDK for PQC operations
- `/sdk/rust/` - Rust SDK for high-performance applications
- `/migration/wallet_migration.py` - Tool for migrating existing wallets
- `/migration/contract_migration.sol` - Contract upgrade patterns
- `/tests/quantum_attack_sim.py` - Quantum attack simulation tests
- `/tests/performance_benchmarks.rs` - Performance testing suite
- `/docs/migration_guide.md` - Step-by-step migration instructions

**Status**: Implemented (Based on LP-100 integration)

**Reference Standards**:
- NIST FIPS 203 (ML-KEM)
- NIST FIPS 204 (ML-DSA)
- NIST FIPS 205 (SLH-DSA)
- Lux LP-200 (Post-Quantum Cryptography Suite)

**Integration with Lux**:
- Shares crypto primitives with Lux Network LP-200
- Compatible with Lux post-quantum precompiles
- Cross-chain PQC message verification

## References

1. [LP-100: NIST PQC Integration for Lux](https://github.com/luxfi/lps/blob/main/LPs/lp-100.md)
2. [HIP-5: Post-Quantum Security for AI](https://github.com/hanzoai/hips/blob/main/HIPs/hip-5.md)
3. [NIST PQC Standards](https://csrc.nist.gov/projects/post-quantum-cryptography)
4. [ZIP-0: Zoo Ecosystem Architecture](./zip-0.md)
5. [ZIP-1: HLLMs for Zoo](./zip-1.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).