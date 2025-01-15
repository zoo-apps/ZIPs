---
zip: 0801
title: "Zoo-Hanzo Settlement Integration"
description: "Settlement protocol for AI inference payments between Zoo DeFi and Hanzo compute marketplace via Lux Network"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-01-15
tags: [settlement, hanzo, ai, compute, defi, inference, lux]
requires: [15, 42, 100, 700, 800]
---

# ZIP-0801: Zoo-Hanzo Settlement Integration

## Abstract

This proposal defines the settlement integration between Zoo DeFi protocols and the Hanzo AI compute marketplace. It enables ZOO token holders to pay for AI inference, model training, and agent execution on Hanzo infrastructure, with settlement occurring on Lux Network as the shared finality layer. The protocol introduces a three-phase settlement flow: pre-authorization on Zoo L2, compute execution on Hanzo, and finalization on Lux C-Chain. It supports both real-time micro-payments for inference and batched settlement for training workloads. Conservation impact is tracked end-to-end: a configurable fraction of compute spending generates conservation credits per ZIP-0700.

## Motivation

The Zoo, Hanzo, and Lux ecosystems form a complementary triad:

- **Zoo**: Community, governance, conservation funding, and DeFi liquidity.
- **Hanzo**: AI compute infrastructure, LLM gateway (100+ providers), and agent frameworks.
- **Lux**: Settlement finality, cross-chain security, and DeFi infrastructure.

Today, these ecosystems settle independently:

1. ZOO token holders cannot directly pay for Hanzo AI services.
2. Hanzo compute credits are denominated in USD and settled via traditional payment rails.
3. Conservation impact from AI compute usage is not tracked.

ZIP-0801 unifies settlement so that:

- ZOO tokens are a first-class payment method for AI compute.
- Settlement occurs on Lux for finality and auditability.
- Conservation impact flows automatically from every AI inference call.
- DeFi primitives (streaming payments, escrow, staking for compute credits) become available.

This aligns with ZIP-0042 (cross-ecosystem interoperability) and HIP-0101 (Hanzo-Lux bridge).

## Specification

### Architecture

```
Zoo L2 (200200)              Lux C-Chain              Hanzo Compute
┌─────────────────┐    ┌───────────────────┐    ┌────────────────────┐
│ SettlementVault │    │ SettlementLedger  │    │  ComputeOracle     │
│                 │    │                   │    │                    │
│ - Pre-auth ZOO  │───>│ - Finalize settle │<───│ - Report usage     │
│ - Stream escrow │    │ - Record impact   │    │ - Sign attestation │
│ - Refund unused │    │ - Distribute fees │    │ - Price feed       │
└─────────────────┘    └───────────────────┘    └────────────────────┘
        │                       │                        │
        │              ┌────────┴────────┐               │
        │              │  Lux Validators │               │
        └──────────────┤  (finality)     ├───────────────┘
                       └─────────────────┘
```

### Settlement Vault (Zoo L2)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISettlementVault
 * @notice Escrow and pre-authorization vault for AI compute payments on Zoo L2.
 * @dev Holds ZOO tokens in escrow during compute execution.
 */
interface ISettlementVault {

    enum PaymentMode {
        PREPAID,        // Full amount escrowed upfront
        STREAMING,      // Per-second streaming payment
        POSTPAID        // Credit-based, settled after execution
    }

    struct ComputeSession {
        bytes32 sessionId;
        address payer;
        address hanzoEndpoint;      // Hanzo compute provider address
        PaymentMode mode;
        uint256 maxAmount;          // Maximum ZOO escrowed
        uint256 consumedAmount;     // ZOO consumed so far
        uint256 ratePerSecond;      // For STREAMING mode (ZOO/second, 18 decimals)
        uint256 startTimestamp;
        uint256 endTimestamp;       // 0 = active
        uint16 conservationBps;     // Conservation donation rate for this session
        bool finalized;
    }

    /**
     * @notice Creates a new compute session with escrowed ZOO tokens.
     */
    function createSession(
        address hanzoEndpoint,
        PaymentMode mode,
        uint256 maxAmount,
        uint256 ratePerSecond,
        uint16 conservationBps
    ) external returns (bytes32 sessionId);

    /**
     * @notice Records compute usage reported by the Compute Oracle.
     *         Only callable by the registered oracle.
     */
    function recordUsage(
        bytes32 sessionId,
        uint256 amount,
        bytes calldata oracleAttestation
    ) external;

    /**
     * @notice Finalizes a session. Transfers consumed ZOO to the settlement
     *         ledger on Lux via the bridge (ZIP-0800). Refunds unused escrow.
     */
    function finalizeSession(bytes32 sessionId) external;

    /**
     * @notice Emergency cancellation. Refunds all escrowed ZOO to the payer.
     *         Subject to a 1-hour cooldown to prevent abuse.
     */
    function cancelSession(bytes32 sessionId) external;

    event SessionCreated(
        bytes32 indexed sessionId,
        address indexed payer,
        address indexed hanzoEndpoint,
        PaymentMode mode,
        uint256 maxAmount
    );

    event UsageRecorded(
        bytes32 indexed sessionId,
        uint256 amount,
        uint256 totalConsumed
    );

    event SessionFinalized(
        bytes32 indexed sessionId,
        uint256 totalPaid,
        uint256 conservationDonation,
        uint256 refunded
    );
}
```

### Settlement Ledger (Lux C-Chain)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISettlementLedger
 * @notice Final settlement and record of AI compute payments on Lux C-Chain.
 * @dev Receives finalized settlements from Zoo L2 via the bridge.
 */
interface ISettlementLedger {

    struct SettlementRecord {
        bytes32 sessionId;
        address payer;              // Original payer on Zoo L2
        address provider;           // Hanzo compute provider
        uint256 totalAmount;        // Total ZOO paid
        uint256 providerShare;      // ZOO to provider
        uint256 conservationShare;  // ZOO to conservation fund
        uint256 protocolFee;        // ZOO to Zoo DAO treasury
        uint256 timestamp;
        bytes32 usageProofHash;     // Hash of compute oracle attestations
    }

    /**
     * @notice Processes a finalized settlement from the Zoo-Lux bridge.
     *         Only callable by the bridge gateway.
     */
    function processSettlement(
        bytes32 sessionId,
        address payer,
        address provider,
        uint256 totalAmount,
        uint256 conservationBps,
        bytes32 usageProofHash
    ) external;

    /**
     * @notice Returns the settlement record for a session.
     */
    function getSettlement(bytes32 sessionId) external view returns (SettlementRecord memory);

    /**
     * @notice Returns total ZOO settled for a provider across all sessions.
     */
    function providerTotalSettled(address provider) external view returns (uint256);

    /**
     * @notice Returns total conservation impact generated through compute settlements.
     */
    function totalConservationImpact() external view returns (uint256);

    event SettlementProcessed(
        bytes32 indexed sessionId,
        address indexed payer,
        address indexed provider,
        uint256 totalAmount,
        uint256 conservationShare
    );
}
```

### Compute Oracle

The Compute Oracle is an off-chain service operated by Hanzo that attests to compute usage. It bridges the gap between Hanzo's centralized compute infrastructure and Zoo's on-chain settlement.

```solidity
/**
 * @title IComputeOracle
 * @notice Oracle for reporting AI compute usage to the Settlement Vault.
 */
interface IComputeOracle {

    struct UsageReport {
        bytes32 sessionId;
        uint256 tokensProcessed;    // LLM tokens (input + output)
        uint256 computeSeconds;     // GPU-seconds consumed
        uint256 zooAmount;          // ZOO amount for this usage
        string model;               // Model identifier (e.g., "zen-480b")
        uint256 timestamp;
        bytes signature;            // Oracle operator signature
    }

    /**
     * @notice Submits a usage report. Signed by the oracle operator key.
     */
    function submitReport(UsageReport calldata report) external;

    /**
     * @notice Returns the oracle operator address (registered in ZIP-0100).
     */
    function operator() external view returns (address);

    /**
     * @notice Returns the ZOO/compute-unit price feed.
     *         Price is denominated in ZOO per 1M LLM tokens.
     */
    function pricePerMillionTokens(string calldata model) external view returns (uint256);

    event UsageReported(
        bytes32 indexed sessionId,
        uint256 tokensProcessed,
        uint256 zooAmount,
        string model
    );
}
```

### Settlement Flow

#### Phase 1: Pre-Authorization (Zoo L2)

1. User calls `SettlementVault.createSession()` with desired payment mode and maximum ZOO amount.
2. ZOO tokens are transferred from the user to the vault (escrowed).
3. A `sessionId` is returned and communicated to Hanzo via the API gateway (HIP-0044).

#### Phase 2: Compute Execution (Hanzo)

1. User sends inference/training requests to Hanzo API with the `sessionId` in the request header.
2. Hanzo executes the workload and meters usage (tokens processed, GPU-seconds).
3. The Compute Oracle periodically submits `UsageReport` to the Settlement Vault on Zoo L2.
4. For STREAMING mode, the vault continuously drains escrow at `ratePerSecond`.

#### Phase 3: Finalization (Lux C-Chain)

1. Session ends (user-initiated, timeout, or escrow depleted).
2. `finalizeSession()` computes the split:
   - **Provider share**: `totalConsumed * (10000 - conservationBps - protocolFeeBps) / 10000`
   - **Conservation share**: `totalConsumed * conservationBps / 10000`
   - **Protocol fee**: `totalConsumed * protocolFeeBps / 10000` (default 100 bps = 1%)
   - **Refund**: `maxAmount - totalConsumed` returned to payer
3. Provider share and protocol fee are bridged to Lux C-Chain via ZIP-0800.
4. Conservation share is sent to the Zoo conservation fund on Zoo L2.
5. The Settlement Ledger on Lux records the final settlement with `usageProofHash`.

### Pricing

The Compute Oracle maintains a price feed for each supported model:

| Model Tier | ZOO per 1M Input Tokens | ZOO per 1M Output Tokens |
|------------|------------------------|--------------------------|
| Small (< 10B params) | 50 ZOO | 150 ZOO |
| Medium (10B-100B) | 200 ZOO | 600 ZOO |
| Large (100B-500B) | 500 ZOO | 1,500 ZOO |
| Frontier (500B+) | 2,000 ZOO | 6,000 ZOO |

Prices are updated daily based on the ZOO/USD TWAP from Lux DEX pools. The oracle publishes prices on-chain and signs each update.

### DeFi Composability

The settlement protocol enables several DeFi primitives:

1. **Compute Staking**: Stake ZOO to earn compute credits at a discount. Staked ZOO generates conservation impact credits passively.
2. **Compute Futures**: Pre-purchase compute at today's prices for future use. Backed by ZOO escrow in the Settlement Vault.
3. **Compute Streaming**: Pay-per-second streaming payments for long-running training jobs. Uses Superfluid-style constant flow agreements.
4. **Inference Pools**: Liquidity pools where ZOO providers fund shared compute access. LPs earn a share of settlement fees.

### Conservation Impact Tracking

Every compute session generates conservation impact:

1. The `conservationBps` parameter (default 200 bps = 2%) determines the fraction of compute spending directed to conservation.
2. Conservation ZOO is sent to the default conservation fund registered in ZIP-0100.
3. The payer receives non-transferable conservation impact credits (per ZIP-0700) proportional to the conservation share.
4. The Settlement Ledger on Lux maintains a running total of conservation impact from compute, queryable by anyone.

### API Integration

Hanzo API gateway (HIP-0044) accepts Zoo settlement sessions via HTTP headers:

```http
POST /v1/chat/completions HTTP/1.1
Host: llm.hanzo.ai
Authorization: Bearer <hanzo-api-key>
X-Zoo-Session-Id: 0xabc123...
X-Zoo-Payer: 0x742d35Cc...
Content-Type: application/json

{
  "model": "zen-72b",
  "messages": [{"role": "user", "content": "Analyze this satellite imagery for deforestation"}],
  "max_tokens": 4096
}
```

The Hanzo gateway validates the session ID against the Settlement Vault (via RPC to Zoo L2), executes the request, and reports usage to the Compute Oracle.

## Rationale

**Why three-phase settlement?** Separation of concerns. Pre-authorization on Zoo L2 is fast (sub-second finality). Compute execution is off-chain (Hanzo infrastructure). Final settlement on Lux provides the highest security guarantees for the financial record.

**Why not settle entirely on Zoo L2?** Lux C-Chain is the ecosystem's settlement layer (ZIP-0013). Financial records on Lux benefit from the primary network's security and are accessible to the broader Lux DeFi ecosystem.

**Why an off-chain oracle?** AI compute is inherently off-chain. The Compute Oracle is the minimal trusted component that attests to off-chain compute usage. Its operator is registered in the Zoo Contract Registry and can be rotated by governance.

**Why conservation impact on compute?** The Zoo Foundation's mission is to fund conservation through technology. If ZOO tokens are used for AI compute, that economic activity should generate conservation impact, just as ZRC-20 transfers do (ZIP-0700).

## Backwards Compatibility

This proposal introduces new contracts and does not modify existing standards. ZOO tokens used in settlement are standard ZRC-20 tokens (ZIP-0700). Bridge operations use the standard ZIP-0800 bridge protocol. The Hanzo API integration is additive -- existing API keys and authentication continue to work alongside Zoo settlement sessions.

## Security Considerations

1. **Oracle Compromise**: A compromised Compute Oracle could report false usage and drain escrowed ZOO. Mitigation: per-session spending caps, anomaly detection on usage patterns, and governance ability to pause and replace the oracle.
2. **Escrow Drain**: STREAMING mode continuously drains escrow. Users MUST set appropriate `maxAmount` limits. The vault MUST halt streaming when escrow is depleted.
3. **Price Manipulation**: ZOO/USD price feeds used by the oracle could be manipulated via flash loans on Lux DEXs. Mitigation: use 24-hour TWAP, not spot price.
4. **Bridge Latency**: Settlement finalization requires a bridge message from Zoo to Lux. During bridge congestion, finalization may be delayed. The vault holds escrowed funds safely until finalization completes.
5. **Replay Protection**: Each `UsageReport` includes a `sessionId` and `timestamp`. The vault tracks cumulative usage per session and rejects reports that would exceed `maxAmount`.
6. **Provider Rug**: A provider could accept payment and not deliver compute. Mitigation: usage reports are signed by the Compute Oracle, not the provider. The oracle independently verifies compute execution before attesting.
7. **Governance Key Rotation**: Oracle operator and conservation fund addresses are governance-controlled. Rotation MUST go through the Zoo DAO timelock (minimum 48 hours).

## References

- [HIP-0101: Hanzo-Lux Bridge Protocol](https://hanzo.ai/hips/hip-0101)
- [HIP-0044: API Gateway](https://hanzo.ai/hips/hip-0044)
- [HIP-0040: Multi-Language SDK](https://hanzo.ai/hips/hip-0040)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0042: Cross-Ecosystem Interoperability](./zip-0042-cross-ecosystem-interoperability-standard.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0800: Zoo-Lux Bridge Protocol](./zip-0800-zoo-lux-bridge-protocol.md)
- [Superfluid Protocol: Real-Time Finance](https://docs.superfluid.finance/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
