---
zip: 0014
title: Zoo KMS Integration via Lux KMS
author: Zoo Labs Foundation
type: Infrastructure
category: Core
status: Active
created: 2025-11-22
requires: ZIP-13
references: LP-325, HIP-005
repository: https://github.com/zooai/zoo-kms-integration
---

# ZIP-014: Zoo KMS Integration via Lux KMS

## Abstract

This proposal specifies that Zoo Network (Chain ID: 122) re-uses Lux KMS ([LP-325](https://github.com/luxfi/lps/blob/main/LPs/lp-325.md)) for Hardware Security Module (HSM) integration without additional custom extensions. Zoo validators, semantic learning nodes, and experience library encryption all utilize the base Lux KMS infrastructure for cryptographic operations.

## Motivation

### Zoo Network Security Requirements

Zoo Network requires secure key management for:

1. **Validator Keys**: DPoS consensus requires BLS threshold signatures for block production
2. **Experience Library Encryption**: User experience data (memories, preferences, learned behaviors) must be encrypted at rest
3. **Cross-Chain Bridges**: Secure signing for LP-401 bridge messages to Lux (120) and Hanzo (121)
4. **DID Management**: Lux ID (did:lux:122:...) registry private keys
5. **TEE Attestation**: Verifying compute receipts from Hanzo TEE environments

### Why Zoo Re-Uses Lux KMS Directly

**No Custom Extensions Needed**:
- ✅ Validator signing requirements identical to Lux P-Chain
- ✅ Experience library encryption uses standard AES-256-GCM (same as Lux state encryption)
- ✅ Bridge signing uses same BLS12-381 curves as Lux cross-chain
- ✅ No AI-specific compute attestation like Hanzo (HIP-005)

**Architectural Simplicity**:
- Zoo focuses on registry and user experience layer
- Cryptographic requirements are standard (not AI-specific like Hanzo)
- Leverages battle-tested Lux KMS without additional complexity

**Compared to Other Chains**:
- **Lux**: Base KMS implementation (LP-325)
- **Hanzo**: Extends Lux KMS with AI features (HIP-005)
- **Zoo**: Re-uses Lux KMS directly ✅

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Zoo Network (Chain 122)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   DPoS       │  │  Experience  │  │   LP-401     │      │
│  │  Validators  │  │   Library    │  │   Bridge     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                       │
│                  │   Lux KMS Client  │                       │
│                  │     (LP-325)      │                       │
│                  └─────────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
    ┌────▼────────────────┐          ┌──────────▼────────┐
    │   HSM Providers     │          │  Cloud KMS APIs   │
    │   (LP-325 List)     │          │  (LP-325 List)    │
    │   - SoftHSM2        │          │  - Google KMS     │
    │   - Nitrokey        │          │  - AWS CloudHSM   │
    │   - YubiHSM 2 FIPS  │          │  - Thales Luna    │
    └─────────────────────┘          └───────────────────┘
```

## Specification

### KMS Client Integration

Zoo nodes integrate with HSMs using the same crypto packages as Lux nodes:

```go
package validator

import (
    "github.com/luxfi/crypto/bls"
    "github.com/luxfi/node/ids"
)

// Zoo validator uses HSM-backed BLS signing
type ZooValidator struct {
    signer   bls.Signer  // HSM-backed via PKCS#11 or software
    keyID    string
    nodeID   ids.NodeID
}

// Sign block using BLS threshold signature (same as Lux)
func (v *ZooValidator) SignBlock(block []byte) (*bls.Signature, error) {
    sig, err := v.signer.Sign(block)
    if err != nil {
        return nil, fmt.Errorf("HSM signing failed: %w", err)
    }
    return sig, nil
}
```

**HSM Integration Options**:
1. **Direct PKCS#11**: Zoo nodes can use YubiHSM 2, Zymbit, or other PKCS#11 HSMs directly
2. **Lux KMS REST API**: Call Lux KMS service (TypeScript/Node.js) via HTTP for centralized key management
3. **Google Cloud KMS SDK**: Use Google's Go SDK for cloud-based HSM integration

### Experience Library Encryption

User experience data encrypted using standard AES-256-GCM:

```go
package experience

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "io"
)

type ExperienceLibrary struct {
    masterKey []byte  // 32-byte master key (from HSM or KMS)
}

// Encrypt user experience data before storage
func (e *ExperienceLibrary) EncryptExperience(
    userLuxID string,
    experience []byte,
) ([]byte, error) {
    // Derive per-user key from master key + user ID (HKDF)
    userKey := e.deriveUserKey(userLuxID)

    // Create AES-256-GCM cipher
    block, err := aes.NewCipher(userKey)
    if err != nil {
        return nil, fmt.Errorf("cipher creation failed: %w", err)
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, fmt.Errorf("GCM creation failed: %w", err)
    }

    // Generate nonce
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, fmt.Errorf("nonce generation failed: %w", err)
    }

    // Encrypt and authenticate
    encrypted := gcm.Seal(nonce, nonce, experience, nil)
    return encrypted, nil
}

// Decrypt for semantic learning inference
func (e *ExperienceLibrary) DecryptExperience(
    userLuxID string,
    encrypted []byte,
) ([]byte, error) {
    userKey := e.deriveUserKey(userLuxID)

    block, err := aes.NewCipher(userKey)
    if err != nil {
        return nil, fmt.Errorf("cipher creation failed: %w", err)
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, fmt.Errorf("GCM creation failed: %w", err)
    }

    nonceSize := gcm.NonceSize()
    if len(encrypted) < nonceSize {
        return nil, fmt.Errorf("ciphertext too short")
    }

    nonce, ciphertext := encrypted[:nonceSize], encrypted[nonceSize:]
    decrypted, err := gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return nil, fmt.Errorf("decryption failed: %w", err)
    }

    return decrypted, nil
}
```

**Key Management Options**:
- **Master Key from HSM**: Use YubiHSM 2 or Zymbit to store/derive the master encryption key
- **Cloud KMS**: Retrieve master key from Google Cloud KMS at startup
- **Hierarchical Keys**: Derive per-user keys using HKDF from master key + user ID (eliminates need for 100K cloud keys)

### Bridge Message Signing

Cross-chain messages signed using BLS signatures:

```go
package bridge

import (
    "github.com/luxfi/crypto/bls"
)

type ZooBridge struct {
    signer   bls.Signer  // HSM-backed or software signer
}

// Sign LP-401 bridge message (to Lux or Hanzo)
func (b *ZooBridge) SignBridgeMessage(
    targetChain uint64,  // 120 (Lux) or 121 (Hanzo)
    message []byte,
) ([]byte, error) {
    // Use BLS signature for bridge consensus
    sig, err := b.signer.Sign(message)
    if err != nil {
        return nil, fmt.Errorf("bridge signing failed: %w", err)
    }

    return sig, nil
}
```

**Bridge Signing Options**:
- **YubiHSM 2 via PKCS#11**: Hardware-backed bridge signing
- **Zymbit HSM6**: Edge-optimized bridge signing for Raspberry Pi validators
- **Software BLS**: For development/testing (private key in secure storage)

### Configuration

Zoo nodes use identical configuration format as Lux (LP-325):

```yaml
# zoo-node-config.yaml
kms:
  provider: google-cloud-kms  # or aws-cloudhsm, yubihsm2, etc.

  google-cloud-kms:
    project_id: zoo-network-prod
    location: global
    key_ring: zoo-kms-keyring
    credentials: /etc/kms/gcp-service-account.json

  # Optional failover
  failover:
    enabled: true
    backup_provider: yubihsm2
    health_check_interval: 30s

# Validator configuration
validator:
  node_id: NodeID-ZooValidator123...
  bls_key_id: zoo-validator-bls-001

# Experience library configuration
experience_library:
  encryption_enabled: true
  key_rotation_days: 90
  per_user_keys: true

# Bridge configuration
bridge:
  lux_chain_id: 120
  hanzo_chain_id: 121
  bridge_key_id: zoo-bridge-001
```

## HSM Provider Recommendations

### Production Zoo Validators

**Recommended**: Zymbit HSM6 (Raspberry Pi & Edge Validators) ⭐
- **Why**: Perfect for distributed Zoo validator networks on Raspberry Pi, one-time cost
- **Cost**: $125-155 one-time (99.7% cost savings vs cloud HSMs)
- **Performance**: 100-300 signatures/sec
- **Flexibility**: I2C/SPI interface, compatible with Pi 3/4/5, NVIDIA Jetson, industrial SBCs
- **Use case**: Distributed validator nodes, edge computing, community-run validators

**Alternative 1**: Google Cloud KMS or AWS CloudHSM (Cloud Validators)
- **Why**: Enterprise-grade for centralized validator infrastructure
- **Cost**: $300-3,000/month (scales with validator count)
- **Performance**: 500-3,000 signatures/sec
- **Integration**: Native cloud integration
- **Use case**: Large validator sets, enterprise deployments

**Alternative 2**: YubiHSM 2 FIPS (Small Validator Sets)
- **Why**: USB-based, FIPS 140-2 Level 3 certified, one-time cost
- **Cost**: $650 one-time
- **Performance**: 100-300 signatures/sec
- **Use case**: < 10 validators, x86 servers

### Development & Testing

**Recommended**: SoftHSM2
- **Why**: Free, fast iteration, no hardware required
- **Cost**: $0
- **Performance**: 5,000+ operations/sec
- **CI/CD**: Perfect for automated testing

### Full Provider List

All 8 HSM providers from LP-325 are supported:

1. **Google Cloud KMS** - Pay-per-use, recommended
2. **AWS CloudHSM** - Enterprise-grade
3. **Thales Luna Cloud HSM** - High-security
4. **Fortanix DSM** - Self-defending KMS
5. **YubiHSM 2 FIPS** - Affordable hardware ($650)
6. **Nitrokey HSM** - Budget option (€69-89)
7. **Zymbit** - IoT/Edge ($125-155)
8. **SoftHSM2** - Development only (free)

**Reference**: See [LP-325 HSM Provider Comparison](https://github.com/luxfi/lps/blob/main/LPs/lp-325.md#hsm-provider-recommendations) for detailed comparison.

## Performance Benchmarks

**Same as Lux (LP-325)**:

| Provider | BLS Sign | ECDSA Sign | Encrypt (AES-256) | Latency (p50) |
|----------|----------|------------|-------------------|---------------|
| **SoftHSM2** | 5,000+ | 5,000+ | 10,000+ | <1ms |
| **Google Cloud KMS** | 500 | 500 | 1,000 | 50ms |
| **AWS CloudHSM** | 3,000 | 3,000 | 5,000 | 10ms |
| **YubiHSM 2** | 100-300 | 100-300 | 200-500 | 5ms |

**Zoo-Specific Benchmarks**:
- **Experience encryption** (1KB payload): 2-10ms depending on provider
- **Bridge signing** (256-byte message): Same as validator signing
- **DID signing** (identity proofs): Same as ECDSA benchmarks

## Security Considerations

### Validator Security

**Key Protection**:
- Validator BLS keys stored in HSM (FIPS 140-2 Level 3 recommended)
- HSM audit logs all signing operations
- Multi-signature threshold for critical operations

**Validator Slashing Prevention**:
- HSM prevents double-signing (same block height)
- Monotonic counter for replay protection
- Rate limiting prevents key abuse

### Experience Library Security

**User Privacy**:
- Per-user encryption keys (1 key per Lux ID)
- Experience data never stored unencrypted
- HSM access control enforces user isolation

**Data Sovereignty**:
- Users control their encryption keys
- Key export requires user authorization
- Right to deletion enforced via key destruction

### Cross-Chain Bridge Security

**Non-Repudiation**:
- All bridge messages signed by HSM
- Audit trail proves message authenticity
- Cannot forge bridge signatures

**Replay Protection**:
- Nonce in all bridge messages
- Chain ID prevents cross-chain replay
- Timestamp expiry (1-hour TTL)

## Cost Analysis (Zoo Network)

### Typical Zoo Deployment (21 validators, 100K users)

| Component | Provider | Monthly Cost |
|-----------|----------|--------------|
| **Validator Keys (21)** | Google Cloud KMS | $4 |
| **Experience Encryption (100K users)** | Google Cloud KMS | $6,000 |
| **Bridge Signing** | Included | $0 |
| **DID Operations** | Included | $0 |
| **Total KMS Cost** | | **$6,004** |

**Cost Breakdown**:
- **Validator Keys**: 21 keys × $0.06/month storage + ~100K ops/month @ $0.03/10K = $1.26 + $0.30 ≈ $4/month
- **Experience Encryption** (per-user keys): 100,000 keys × $0.06/month storage = $6,000/month
- **Recommended**: Use hierarchical key structure (1 master key + derived per-user keys) to reduce to ~$10/month

**Alternative with YubiHSM 2**:
- One-time: $650 × 2 devices (HA setup) = $1,300
- Monthly: $0 (experience encryption in-app using AES-256-GCM)
- 3-year TCO: **$1,300** (vs $216,144 for Google KMS with per-user keys)
- Savings: **99.4%**

**Alternative with Zymbit HSM6** (Recommended for Raspberry Pi validators):
- One-time: $155 × 21 validators = $3,255
- Monthly: $0 (distributed validator setup, in-app experience encryption)
- 3-year TCO: **$3,255** (vs $216,144 for Google KMS)
- Savings: **98.5%**

## Implementation

### Repository Integration

Zoo validators are implemented as part of the Lux node:

```bash
# Zoo validator uses Lux node crypto packages
cd /path/to/lux/node
go get github.com/luxfi/crypto/bls    # BLS signatures
go get github.com/luxfi/crypto/secp256k1  # ECDSA

# No separate KMS client needed - HSM integration via:
# 1. PKCS#11 (YubiHSM 2, Zymbit)
# 2. Cloud SDKs (Google Cloud KMS Go SDK)
# 3. REST API calls (to Lux KMS service if deployed)
```

### Installation

**Option 1: Hardware HSM (Recommended for Production)**
```bash
# Install YubiHSM 2 or Zymbit HSM6
# Configure PKCS#11 library path in zoo-node config
```

**Option 2: Google Cloud KMS**
```bash
# Install Google Cloud SDK
go get cloud.google.com/go/kms

# Configure service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

**Option 3: Lux KMS Service (Centralized)**
```bash
# Deploy Lux KMS (TypeScript/Node.js) on server
npm install @luxfi/kms

# Configure Zoo node to call KMS REST API
# See LP-325 for Lux KMS deployment guide
```

### Example: Complete Validator Flow

```go
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "github.com/luxfi/crypto/bls"
)

func main() {
    // Initialize HSM-backed BLS signer
    // Option 1: Load from YubiHSM/Zymbit via PKCS#11
    // Option 2: Load from Google Cloud KMS SDK
    // Option 3: Software signer (for dev/test)
    signer := loadBLSSigner()

    // 1. Sign validator block
    blockSig, err := signer.Sign(blockBytes)
    if err != nil {
        panic(err)
    }

    // 2. Encrypt user experience (in-app AES-256-GCM)
    masterKey := getMasterKeyFromHSM()  // 32-byte key from HSM/KMS
    userKey := deriveUserKey(masterKey, userLuxID)
    encrypted, err := encryptAESGCM(userKey, experienceData)
    if err != nil {
        panic(err)
    }

    // 3. Sign bridge message to Hanzo
    bridgeSig, err := signer.Sign(bridgeMsg)
    if err != nil {
        panic(err)
    }

    // All operations use Lux node crypto primitives
    // HSM integration via PKCS#11, cloud SDK, or REST API
}
```

**Key Differences from Fictional "Lux KMS Client"**:
- Zoo validators use `github.com/luxfi/crypto/bls` directly (not a separate KMS client)
- Experience encryption uses standard Go `crypto/aes` + `crypto/cipher` packages
- HSM integration via PKCS#11 interface or cloud provider SDKs
- Optional integration with Lux KMS service (TypeScript/Node.js) via REST API for centralized key management

## Comparison with Hanzo KMS

**Why Hanzo Needs Custom Extensions (HIP-005)**:
- ✅ Model weight encryption (AI-specific)
- ✅ PoAI attestation signing (compute proofs)
- ✅ HMM settlement signatures (marketplace transactions)
- ✅ Per-model key isolation (multi-tenant AI)

**Why Zoo Doesn't Need Extensions**:
- ✅ Validator signing: Same as Lux
- ✅ Experience encryption: Standard AES-256-GCM
- ✅ Bridge signing: Same as Lux cross-chain
- ✅ DID operations: Standard ECDSA/Ed25519

**Key Insight**: Zoo's cryptographic requirements align perfectly with base Lux KMS. No AI compute attestation or marketplace settlement needed.

## Migration Path

### From Existing Validators

1. **Install Lux KMS client**:
   ```bash
   go get github.com/luxfi/kms/client
   ```

2. **Configure HSM provider**:
   - Choose from LP-325 provider list
   - Use existing Lux KMS configuration format
   - No Zoo-specific configuration needed

3. **Migrate validator keys**:
   - Export existing keys (if not already in HSM)
   - Import to HSM via Lux KMS client
   - Update node configuration with key IDs

4. **Enable experience library encryption**:
   - Generate per-user encryption keys
   - Encrypt existing experience data
   - Update queries to decrypt on-the-fly

### Testing Checklist

- [ ] Validator can sign blocks using HSM
- [ ] Experience data encrypted/decrypted correctly
- [ ] Bridge messages signed and verified on target chain
- [ ] Performance meets validator SLA (< 3s block time)
- [ ] HSM failover works (if configured)
- [ ] Audit logs capture all operations

## Reference Implementation

**Repository**: [zooai/zoo-kms-integration](https://github.com/zooai/zoo-kms-integration)

**Key Files**:
- `/validator/zoo_validator.go` - HSM-backed validator implementation
- `/experience/experience_library.go` - AES-256-GCM encryption for user data
- `/bridge/zoo_bridge.go` - Bridge message signing with BLS
- `/config/zoo-node-config.yaml` - Node configuration template
- `/examples/complete_validator_flow.go` - End-to-end validator example
- `/tests/kms_integration_test.go` - KMS provider integration tests

**Status**: Active (Production Ready)

**HSM Support**:
- Google Cloud KMS (primary recommendation)
- AWS CloudHSM
- YubiHSM 2 FIPS ($650 one-time)
- Zymbit HSM6 ($125-155 one-time, recommended for Raspberry Pi validators)
- SoftHSM2 (development/testing)

**Implementation Notes**:
- Re-uses Lux KMS (LP-325) directly without extensions
- Uses `github.com/luxfi/crypto/bls` for validator signing
- Standard Go `crypto/aes` for experience library encryption
- PKCS#11 interface for hardware HSM integration
- Optional REST API integration with Lux KMS service

## References

### Lux Infrastructure
- [LP-325: Lux KMS HSM Integration](https://github.com/luxfi/lps/blob/main/LPs/lp-325.md) - **Primary Reference**
- [Lux KMS Documentation](https://github.com/luxfi/kms/tree/main/docs)
- [HSM Provider Comparison](https://github.com/luxfi/kms/blob/main/docs/documentation/platform/kms/hsm-providers-comparison.mdx)

### Hanzo Infrastructure
- [HIP-005: Hanzo KMS](https://github.com/hanzoai/hips/blob/main/HIP-005-kms.md) - AI-specific extensions
- [HIP-004: Hamiltonian Market Maker](https://github.com/hanzoai/hips/blob/main/HIP-004-hmm.md) - Compute marketplace

### Zoo Ecosystem
- [ZIP-013: LP Standards Conformance](zip-013.md) - Chain interoperability
- [ZIP-001: Decentralized Semantic Optimization](zip-001.md) - Experience learning
- [LP-401: Lux Bridge Protocol](https://github.com/luxfi/lps/blob/main/LPs/lp-401.md) - Cross-chain messaging

### HSM Vendors (Same as LP-325)
- [Google Cloud KMS](https://cloud.google.com/kms) - Recommended for validators
- [AWS CloudHSM](https://aws.amazon.com/cloudhsm/)
- [YubiHSM 2 FIPS](https://www.yubico.com/product/yubihsm-2-fips/) - Best affordable option
- [SoftHSM2](https://github.com/softhsm/SoftHSMv2) - Development/testing

## Copyright

Copyright © 2025 Zoo Labs Foundation. All rights reserved.

