---
zip: 28
title: "Zoo SDK Specification"
description: "Standard SDK interface and implementation requirements for building applications on Zoo Network"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 23 (Open Source)"
created: 2025-01-15
tags: [sdk, developer-tools, api, client-library]
---

# ZIP-0028: Zoo SDK Specification

## Abstract

This proposal defines the standard interface and implementation requirements for official Zoo Network SDKs. The specification covers TypeScript, Python, Go, and Rust client libraries with a unified API surface for interacting with Zoo Network contracts, governance, grants, conservation data, and the naming service. All SDKs must implement a common interface while respecting language-specific idioms.

## Motivation

A consistent SDK reduces friction for developers building on Zoo Network:

1. **Developer onboarding**: A well-documented SDK lowers the barrier to building conservation-focused applications
2. **Ecosystem consistency**: Unified interfaces prevent fragmentation across languages
3. **Correctness**: SDK-level validation catches errors before they reach the chain
4. **Abstraction**: Developers should not need to understand low-level contract ABIs to interact with Zoo
5. **Conservation tooling**: Conservation researchers (primarily Python users) need accessible tooling

## Specification

### Core Modules

Every Zoo SDK must implement these modules:

```
zoo-sdk/
├── client          # Network connection, provider management
├── governance      # Proposal creation, voting, delegation
├── treasury        # Fund queries, disbursement tracking
├── grants          # Grant submission, milestone reporting
├── naming          # ZNS registration, resolution
├── bridge          # Cross-chain transfers
├── impact          # Impact oracle data queries
├── reputation      # Reputation score queries
├── conservation    # Conservation-specific utilities
└── types           # Shared types and constants
```

### Client Module

```typescript
// TypeScript reference implementation
interface ZooClient {
  // Connection
  connect(rpcUrl: string, options?: ClientOptions): Promise<void>;
  disconnect(): Promise<void>;

  // Chain info
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
  getBalance(address: string): Promise<bigint>;

  // Transaction
  sendTransaction(tx: Transaction): Promise<TransactionReceipt>;
  estimateGas(tx: Transaction): Promise<bigint>;

  // Contract interaction
  readContract<T>(params: ReadContractParams): Promise<T>;
  writeContract(params: WriteContractParams): Promise<TransactionReceipt>;
}

interface ClientOptions {
  chainId?: number;          // Default: 200200 (Zoo mainnet)
  timeout?: number;          // RPC timeout in ms
  retries?: number;          // Retry count for failed requests
  signer?: Signer;           // Transaction signer
}
```

### Governance Module

```typescript
interface ZooGovernance {
  // Proposals
  createProposal(params: ProposalParams): Promise<ProposalId>;
  getProposal(id: ProposalId): Promise<Proposal>;
  listProposals(filter?: ProposalFilter): Promise<Proposal[]>;

  // Voting
  castVote(proposalId: ProposalId, support: VoteType): Promise<TransactionReceipt>;
  getVotingPower(address: string, blockNumber?: bigint): Promise<bigint>;

  // Delegation
  delegate(delegatee: string): Promise<TransactionReceipt>;
  getDelegates(address: string): Promise<string>;
}

type VoteType = 'for' | 'against' | 'abstain';

interface ProposalParams {
  type: 'parameter' | 'treasury' | 'upgrade' | 'emergency' | 'meta';
  targets: string[];
  calldatas: string[];
  description: string;
}
```

### Impact Module

```typescript
interface ZooImpact {
  // Metrics
  getMetric(metricId: string): Promise<ImpactMetric>;
  getMetricHistory(metricId: string, from: Date, to: Date): Promise<ImpactMetric[]>;
  getProjectScore(projectId: string): Promise<number>;

  // Submission (for oracle operators)
  submitReport(params: ImpactReportParams): Promise<TransactionReceipt>;
}

interface ImpactMetric {
  metricId: string;
  value: bigint;
  timestamp: Date;
  confidence: number;      // 0-100
  evidenceHash: string;    // IPFS CID
}
```

### Conservation Module

```typescript
interface ZooConservation {
  // Species registry (ZIP-0030)
  getSpecies(taxonId: string): Promise<SpeciesRecord>;
  searchSpecies(query: string): Promise<SpeciesRecord[]>;

  // Donations
  donate(params: DonationParams): Promise<TransactionReceipt>;
  shieldedDonate(params: ShieldedDonationParams): Promise<TransactionReceipt>;

  // Data availability (ZIP-0024)
  commitData(params: DataCommitParams): Promise<string>;  // Returns commitment ID
  getData(commitmentId: string): Promise<Uint8Array>;
}
```

### Error Handling

All SDKs must implement structured errors:

```typescript
class ZooError extends Error {
  code: ZooErrorCode;
  details?: Record<string, unknown>;
}

enum ZooErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PROPOSAL_THRESHOLD_NOT_MET = 'PROPOSAL_THRESHOLD_NOT_MET',
  INVALID_PROOF = 'INVALID_PROOF',
  NAME_TAKEN = 'NAME_TAKEN',
  BRIDGE_RATE_LIMITED = 'BRIDGE_RATE_LIMITED',
  GRANT_MILESTONE_OVERDUE = 'GRANT_MILESTONE_OVERDUE',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

### Language-Specific Requirements

| Language | Package Manager | Async Model | Minimum Version |
|----------|----------------|-------------|-----------------|
| TypeScript | npm/pnpm | Promise/async-await | ES2022, Node 18+ |
| Python | uv/pip | asyncio | Python 3.11+ |
| Go | go modules | goroutines/channels | Go 1.21+ |
| Rust | cargo | tokio async | Rust 1.75+ |

### Python SDK Example

```python
import zoo

async def main():
    client = zoo.Client("https://api.zoo.network/ext/bc/zoo/rpc")

    # Check conservation fund balance
    balance = await client.treasury.get_fund_balance("conservation")
    print(f"Conservation fund: {balance} ZOO")

    # Query impact metrics
    metric = await client.impact.get_metric("IMP-001")
    print(f"Species population: {metric.value} (confidence: {metric.confidence}%)")

    # Resolve a .zoo name
    addr = await client.naming.resolve("borneo-orangutan.zoo")
    print(f"Resolved: {addr}")
```

### Testing Requirements

All SDK implementations must include:
- Unit tests for every public method (>90% coverage)
- Integration tests against a local Zoo devnet
- Conformance tests that verify behavior matches this specification
- Documentation with examples for every module

### Versioning

SDKs follow semantic versioning. Breaking changes increment major version. All SDKs targeting the same Zoo Network version must be compatible:

```yaml
compatibility_matrix:
  zoo_network_v1:
    typescript_sdk: "^1.0.0"
    python_sdk: "^1.0.0"
    go_sdk: "v1.x.x"       # Never v2+ per project policy
    rust_sdk: "^1.0.0"
```

## Rationale

A specification-first approach (rather than implementation-first) ensures all language SDKs are consistent. The module structure maps directly to Zoo Network's major subsystems, making it intuitive for developers familiar with the protocol.

Python is prioritized alongside TypeScript because conservation researchers predominantly use Python. The `uv` package manager is specified per project conventions.

Go SDK is kept at v1.x.x per project policy to avoid import path breaking changes.

## Security Considerations

- **Key management**: SDKs must never store private keys in memory longer than necessary; support hardware wallet signers
- **Input validation**: All user inputs must be validated before constructing transactions
- **RPC security**: SDKs should support authenticated RPC connections and warn on unencrypted endpoints
- **Dependency minimization**: Each SDK should minimize dependencies to reduce supply chain attack surface
- **Audit**: Reference implementations (TypeScript and Python) must be audited before v1.0.0 release

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0405: Conservation Agent SDK](./zip-0405-conservation-agent-sdk.md)
- [Viem Documentation](https://viem.sh/)
- [ethers.js Documentation](https://docs.ethers.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
