---
zip: 0803
title: "Encrypted Streaming Replication for Zoo Services"
description: "E2E post-quantum encrypted streaming replication for SQLite (WAL-based) and ZapDB (incremental backup) to S3-compatible storage using age (ML-KEM-768 + X25519)"
author: Zoo Labs Foundation
status: Final
type: Standards Track
category: ZRC
created: 2026-04-09
tags: [encryption, replication, sqlite, zapdb, age, pq, s3, infrastructure]
requires: [0000, 0005, 0800]
---

# ZIP-0803: Encrypted Streaming Replication for Zoo Services

## Abstract

This proposal specifies end-to-end post-quantum encrypted streaming replication for two storage engines used across the Zoo ecosystem:

1. **SQLite** (WAL-based) — used by Base-powered services (IAM, KMS, marketplace, governance)
2. **ZapDB** (incremental backup) — used by high-throughput KV workloads (DEX state, bridge relay cache, AI model registry metadata)

Both engines replicate continuously to S3-compatible object storage on the `zoo-k8s` DOKS cluster. All data at rest in S3 is encrypted with age using ML-KEM-768 + X25519 hybrid keys. Recovery is automatic: pods restore from S3 on startup, eliminating PVC scheduling constraints.

This ZIP adopts LP-102 (Lux Encrypted Streaming Replication) and HIP-0302 (Hanzo Replicate) for the Zoo ecosystem, adapting paths, key derivation, and service topology to Zoo's infrastructure.

## Motivation

Zoo services run on the dedicated `zoo-k8s` DOKS cluster (DigitalOcean Kubernetes) across four namespaces: `zoo`, `zoo-devnet`, `zoo-testnet`, `zoo-mainnet`. Storage challenges specific to Zoo:

1. **DOKS ephemeral volumes**: DigitalOcean block storage volumes have higher reattach latency than GKE PDs. Eliminating PVCs via S3 replication improves scheduling and recovery time.
2. **AI model registry**: The Zoo marketplace stores model metadata, ownership records (ZIP-0006), and fine-tuning state (ZIP-0007) in SQLite. Loss of this state requires expensive re-indexing from chain events.
3. **Bridge relay state**: The Zoo-Lux bridge (ZIP-0800) and omnichain teleport (ZIP-0802) maintain relay state in ZapDB. A relay crash without replication can cause stuck cross-chain transfers.
4. **Conservation metadata**: Token-bound accounts (ZIP-0703) carry conservation metadata that must survive pod restarts without re-syncing from L1.
5. **Post-quantum readiness**: Zoo's PQ security posture (ZIP-0005) requires that all data at rest be encrypted with PQ-safe algorithms. ML-KEM-768 hybrid encryption satisfies this requirement.

## Specification

### Encryption Layers

Three independent layers. Identical to LP-102 and HIP-0302.

| Layer | Scope | Algorithm | Key Source |
|-------|-------|-----------|------------|
| 1. Disk encryption | SQLite at rest on local disk | sqlcipher (AES-256-CBC, 256K PBKDF2 iterations) | Per-DB passphrase from KMS |
| 2. S3 encryption | Data at rest in object storage | age v1.3.0+ (ML-KEM-768 + X25519 hybrid) | Per-service age keypair |
| 3. Transport encryption | Data in flight to S3 | TLS 1.3 (ECDHE + AES-256-GCM) | S3 endpoint certificate |

### Per-Principal Key Derivation

Zoo uses the same HKDF derivation as LP-102, with a Zoo-specific domain separator:

```
master_key       = KMS.get("zoo/replicate/master")
service_salt     = SHA-256("zoo:replicate:" || service_name)
org_salt         = SHA-256("zoo:replicate:" || service_name || ":" || org_id)
service_cek      = HKDF-SHA-256(master_key, service_salt, 32)
org_cek          = HKDF-SHA-256(master_key, org_salt, 32)
age_identity     = age.NewX25519Identity(seed=org_cek)
```

The `zoo:` prefix ensures Zoo-derived keys are cryptographically isolated from Lux (`lux:`) and Hanzo (`hanzo:`) keys, even if they share a KMS backend.

### SQLite Replication

Identical sidecar pattern to LP-102. The Zoo-specific S3 path convention:

```
s3://zoo-replicate-{env}/{namespace}/{service}/{org_id}/
├── generations/
│   └── {generation_id}/
│       ├── snapshots/
│       │   └── {sequence}.snapshot.age
│       └── wal/
│           └── {start_offset}_{end_offset}.wal.age
└── latest
```

**Affected services**:

| Service | Namespace | Databases | RPO |
|---------|-----------|-----------|-----|
| IAM | `zoo` | 1 (identity) | 1s |
| KMS | `zoo` | 1 (secrets) | 1s |
| Marketplace | `zoo` | per-org (listings, bids) | 1s |
| Governance | `zoo` | 1 (proposals, votes) | 1s |

### ZapDB Replication

ZapDB instances in Zoo use the ZAP binary format for incremental backup frames, as specified in LP-102.

**Zoo-specific S3 path convention**:

```
s3://zoo-replicate-{env}/{namespace}/{service}/{instance_id}/zapdb/
├── snapshots/
│   └── {frame_id}.snap.zap.age
├── deltas/
│   └── {start_frame}_{end_frame}.delta.zap.age
└── latest
```

**Affected services**:

| Service | Namespace | Use Case | RPO |
|---------|-----------|----------|-----|
| DEX | `zoo-{env}` | Orderbook state, AMM pool state | 500ms |
| Bridge relay | `zoo-{env}` | Cross-chain transfer state (ZIP-0800, ZIP-0802) | 500ms |
| AI registry | `zoo` | Model metadata cache, inference routing table | 1s |

### ZAP Binary Format

The ZAP frame format is defined canonically in LP-102. Zoo services use the same format without modification:

- Magic: `0x5A415001` ("ZAP\x01")
- Flags: `0x01`=snapshot, `0x02`=delta, `0x04`=compressed (zstd)
- Payload: length-prefixed key-value pairs

### Post-Quantum Encryption

All age encryption uses ML-KEM-768 + X25519 hybrid mode (age v1.3.0+). Key properties:

- `age1pq` prefix for hybrid public keys
- NIST FIPS 203 compliant (ML-KEM-768 = CRYSTALS-Kyber Level 3)
- Consistent with Zoo PQ security posture (ZIP-0005)

Key rotation: 90-day cycle with 24-hour dual-recipient overlap window.

### NIST Standards Adopted

| Standard | Algorithm | Deployed Use Cases |
|----------|-----------|-------------------|
| FIPS 203 (ML-KEM-768) | Module-Lattice KEM | age backup encryption, TLS X25519MLKEM768, on-chain precompile |
| FIPS 204 (ML-DSA-65) | Module-Lattice DSA | JWT signing, validator identity, on-chain precompile, SafeMLDSASigner |
| FIPS 205 (SLH-DSA) | Stateless Hash DSA | On-chain precompile (stateless fallback) |

### Complete PQ Scorecard

All 13 cryptographic layers are deployed on devnet, testnet, and mainnet.

| # | Layer | Algorithm | PQ Status | NIST/FIPS | Status |
|---|-------|-----------|-----------|-----------|--------|
| 1 | Disk encryption | AES-256 sqlcipher, per-principal CEK via HKDF-SHA-256 | Safe (128-bit PQ via Grover bound) | SP 800-57 | Deployed |
| 2 | Field encryption | AES-256-GCM per sensitive field | Safe (128-bit PQ) | SP 800-38D | Deployed |
| 3 | S3 backup | age ML-KEM-768+X25519 (`age1pq` recipients) | Safe (FIPS 203) | FIPS 203 | Deployed |
| 4 | TLS | X25519MLKEM768 first curve (ingress + MPC inter-node) | Safe (hybrid PQ) | FIPS 203 | Deployed |
| 5 | JWT signing | ML-DSA-65 signing + validation via JWKS | Safe (Module-LWE+SIS) | FIPS 204 | Deployed |
| 6 | Consensus (Quasar) | BLS + Ringtail + ML-DSA -- three hardness assumptions | Safe (triple hybrid) | FIPS 204 | Deployed |
| 7 | EVM tx (Smart Account) | SafeMLDSASigner via ML-DSA precompile (ERC-1271 + ERC-4337) | Safe (FIPS 204) | FIPS 204 | Deployed |
| 8 | EVM tx (EOA) | secp256k1 ECDSA (wallet compat, PQ finality via Quasar) | Not PQ-safe (mitigated) | -- | EVM constraint |
| 9 | MPC transport | PQ TLS (X25519MLKEM768) | Safe (hybrid PQ) | FIPS 203 | Deployed |
| 10 | MPC custody | PQ KEM encrypted key shares + Cloud HSM (FIPS 140-2 L3) | Safe (hardware isolation) | FIPS 203, FIPS 140-2 | Deployed |
| 11 | Threshold signing | CGGMP21 (ECDSA), FROST (EdDSA), BLS, Ringtail (PQ lattice) | Safe (Ringtail PQ) | -- | Deployed |
| 12 | On-chain precompiles | ML-DSA, ML-KEM, SLH-DSA, Ringtail, PQCrypto unified | Safe (all three FIPS) | FIPS 203/204/205 | Deployed |
| 13 | Smart contracts | SafeMLDSASigner, SafeRingtailSigner, QuantumSafe base | Safe (precompile-backed) | FIPS 204 | Deployed |

**EOA mitigation**: EOA transactions use secp256k1 ECDSA for wallet compatibility. PQ finality is achieved because Quasar consensus validators sign blocks with BLS + Ringtail + ML-DSA. A quantum adversary who forges an EOA signature still cannot finalize a block without compromising all three consensus assumptions.

### Quasar Consensus

Quasar is a triple-hybrid consensus protocol using three independent hardness assumptions:

| Component | Assumption | PQ Safety |
|-----------|------------|-----------|
| BLS (BN254) | Discrete log on elliptic curves | Classical only |
| Ringtail | Module-LWE (lattice) | PQ-safe |
| ML-DSA-65 | Module-LWE + Module-SIS | PQ-safe (FIPS 204) |

Block finality requires valid signatures from all three schemes. An adversary must break discrete log AND Module-LWE AND Module-SIS simultaneously.

### Smart Account PQ Signing

Smart Accounts (ERC-4337 compliant) bypass the secp256k1 constraint via signature verification precompiles:

- **SafeMLDSASigner**: Validates ML-DSA-65 signatures via precompile at `0x0130`/`0x0131`. Implements ERC-1271.
- **SafeRingtailSigner**: Validates Ringtail lattice signatures via precompile at `0x0150`/`0x0151`.
- **QuantumSafe**: Base contract for Smart Accounts. Routes verification to the appropriate PQ precompile.

### On-Chain Precompiles

All activated at genesis on all networks.

| Address | Primitive | Gas (verify) | Gas (sign/encap) |
|---------|-----------|-------------|-----------------|
| 0x0120 | ML-KEM Encapsulate | -- | 15,000 |
| 0x0121 | ML-KEM Decapsulate | -- | 20,000 |
| 0x0130 | ML-DSA Sign | -- | 25,000 |
| 0x0131 | ML-DSA Verify | 10,000 | -- |
| 0x0140 | SLH-DSA Sign | -- | 50,000 |
| 0x0141 | SLH-DSA Verify | 15,000 | -- |
| 0x0150 | Ringtail Sign | -- | 30,000 |
| 0x0151 | Ringtail Verify | 12,000 | -- |
| 0x0160 | PQCrypto Unified | varies | varies |

### Cloud HSM for Master Keys

Master encryption keys are stored in Cloud HSM (GCP Cloud KMS, FIPS 140-2 Level 3 certified Cavium HSMs). The master key never leaves the HSM boundary. Three keyrings per ecosystem (devnet, testnet, mainnet).

### Threshold Signing

Four threshold protocols deployed:

| Protocol | Curve | Use Case |
|----------|-------|----------|
| CGGMP21 | secp256k1 (ECDSA) | EVM transaction signing |
| FROST | Ed25519 (EdDSA) | SOL/TON signing |
| BLS | BN254 | Consensus aggregation |
| Ringtail | Module-LWE (lattice) | PQ-safe threshold signing |

### ML-DSA-65 JWT Signing

Hanzo IAM issues JWT tokens signed with ML-DSA-65 (FIPS 204). JWKS validation uses PQ-safe ML-DSA-65 public keys. EUF-CMA security under Module-LWE and Module-SIS hardness assumptions.

### TLS Post-Quantum

All TLS 1.3 connections use X25519MLKEM768 as the first curve. PQ protection for all data in transit.

### Harvest-Now-Decrypt-Later: Closed

The full PQ stack closes the HNDL attack vector. An adversary who captures data today cannot decrypt it with a future quantum computer.

### Recovery Objectives

| Engine | RPO | RTO | WAL/Delta Retention | Snapshot Retention |
|--------|-----|-----|---------------------|-------------------|
| SQLite | 1 second | 30 seconds | 72 hours | 30 days |
| ZapDB | 500 milliseconds | 15 seconds | 24 hours | 7 days |

### emptyDir Replaces PVC

With continuous replication, all Zoo services use `emptyDir` for local storage. S3 is the source of truth. This eliminates DOKS block volume reattach latency and allows pods to schedule on any node in the cluster.

### Regulatory Compliance

| Regulation | Requirement | How Satisfied |
|------------|-------------|---------------|
| NIST SP 800-57 | Key management lifecycle | HKDF-derived per-principal keys, 90-day rotation, Cloud HSM master |
| NIST SP 800-131A | Cryptographic algorithm transition | All three FIPS PQ standards (203/204/205) deployed |
| FIPS 140-2 Level 3 | Hardware key isolation | Cloud HSM (GCP, Cavium) for master key material |
| GDPR Article 32 | Appropriate technical measures | AES-256 disk + field encryption, PQ backup encryption, HSM key isolation |

## Security Considerations

1. **Domain-separated keys**: The `zoo:` HKDF prefix ensures Zoo keys are cryptographically isolated from Lux and Hanzo keys.
2. **DigitalOcean Spaces**: Zoo uses DO Spaces (S3-compatible) for replication storage. age encryption ensures DO cannot read the data.
3. **Bridge relay integrity**: If a bridge relay pod restores from a stale snapshot, it may replay already-processed cross-chain messages. The relay must check on-chain nonces after restore to skip already-confirmed transfers.
4. **Harvest-now-decrypt-later**: ML-KEM-768 hybrid encryption protects against future quantum attacks on captured S3 objects.

## Compatibility

This ZIP is a Zoo-specific adaptation of:

- **LP-102** (Lux): Canonical specification for encrypted streaming replication
- **HIP-0302** (Hanzo): Hanzo Replicate sidecar implementation

All three proposals share the same encryption layers, key derivation scheme, frame format, and sidecar architecture. The differences are:

| Aspect | LP-102 (Lux) | HIP-0302 (Hanzo) | ZIP-0803 (Zoo) |
|--------|-------------|------------------|----------------|
| HKDF prefix | `lux:replicate:` | `hanzo:replicate:` | `zoo:replicate:` |
| S3 bucket | `lux-replicate-{env}` | `hanzo-replicate-{env}` | `zoo-replicate-{env}` |
| Cluster | GKE (lux-k8s) | DOKS (lux-k8s) | DOKS (zoo-k8s) |
| Sidecar image | `ghcr.io/luxfi/replicate` | `ghcr.io/hanzoai/replicate` | `ghcr.io/zoolabs/replicate` |

## Reference Implementation

Full LaTeX specification:

`zoo/papers/zip-0803-encrypted-sqlite-replication.tex`

Reference implementations (upstream):

- `luxfi/replicate` — SQLite WAL replication sidecar (Go)
- `luxfi/zapdb-replicator` — ZapDB frame replication sidecar (Go)
- `luxfi/age` — age encryption with ML-KEM-768 hybrid support (Go)
