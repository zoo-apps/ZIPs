---
zip: 0802
title: "Zoo Omnichain Teleport Extension"
description: "Extension of the Lux Teleport omnichain bridge for cross-chain conservation DeFi across 270+ chains"
author: "Zoo Labs Foundation"
status: Final
type: Standards Track
category: ZRC
originated: 2021-10
traces-from: "Whitepaper sections 16 (Asset Transfer) and 22 (Bridging Blockchains)"
follow-on: [zoo-omnichain-teleport]
created: 2023-09-01
tags: [bridge, omnichain, teleport, cross-chain, conservation, defi, solana, ton, cosmos]
requires: [15, 42, 100, 700, 800]
---

# ZIP-0802: Zoo Omnichain Teleport Extension

## Abstract

This proposal extends the Zoo-Lux Bridge Protocol (ZIP-0800) to support omnichain conservation DeFi via the Lux Teleport architecture. The extension enables bridging from Zoo EVM (chain ID 200200) to any of 270+ supported destination chains, including native bridge programs on Solana, TON, and Cosmos. It introduces yield-bearing bridge tokens (yZETH, yZBTC) that generate conservation yield while in transit or held on foreign chains, and integrates ShariaFilter for Islamic finance-compliant conservation bonds. The protocol preserves all conservation metadata (ZIP-0700) and token-bound account states (ZIP-0703) across heterogeneous chains.

## Motivation

ZIP-0800 established the Zoo-Lux bridge for EVM-to-EVM transfers. However, conservation capital exists across the entire blockchain ecosystem:

1. **Reach**: 270+ chains means conservation tokens can access liquidity on Solana DEXs, Cosmos DeFi hubs, and TON's 900M+ user base.
2. **Yield**: Bridge tokens sitting idle on foreign chains should generate conservation yield rather than remaining inert.
3. **Islamic Finance**: $4.5T in Islamic finance assets require Sharia-compliant instruments. Conservation sukuk (bonds) are a natural fit but require on-chain compliance filtering.
4. **Non-EVM Ecosystems**: Solana programs, TON contracts, and CosmWasm modules cannot interact with EVM bridge gateways directly. Native adapters are required.

## Specification

### Chain Support

The Teleport extension routes through the Lux Teleport hub (LPS-016) and connects to destination chains via chain-specific adapters:

| Chain Family | Adapter | Supported Chains | Transport |
|--------------|---------|-------------------|-----------|
| EVM | `TeleportEVMAdapter` | Ethereum, Arbitrum, Base, BNB, + 50 others | Teleport relay (LPS-016) |
| Solana | `TeleportSolanaProgram` | Solana mainnet | Native Rust program via Teleport SPL bridge |
| TON | `TeleportTONContract` | TON mainnet | FunC contract via Teleport TON adapter |
| Cosmos | `TeleportCosmosModule` | Cosmos Hub, Osmosis, Injective, + 20 others | IBC channel via Teleport IBC relay (LPS-017) |
| Move | `TeleportMoveModule` | Aptos, Sui | Move module via Teleport Move adapter (LPS-018) |

### Omnichain Bridge Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IZooBridgeGateway} from "./IZooBridgeGateway.sol";

/**
 * @title IZooOmnichainGateway
 * @notice Extends ZIP-0800 gateway for omnichain routing via Lux Teleport.
 */
interface IZooOmnichainGateway is IZooBridgeGateway {

    struct OmnichainRoute {
        uint256 destinationChainId;
        bytes32 adapterType;         // keccak256 of adapter name
        bytes recipientAddress;      // Variable-length (32 bytes for EVM, 32 for Solana, etc.)
        uint256 maxBridgeFee;        // Max fee in ZOO the sender will pay
        bool yieldBearing;           // Mint yield-bearing wrapper on destination
        bool shariaCompliant;        // Apply ShariaFilter to this transfer
    }

    /**
     * @notice Bridges tokens to any supported chain via Teleport routing.
     */
    function omnichainBridgeOut(
        OmnichainRoute calldata route,
        AssetType assetType,
        address tokenContract,
        uint256 tokenId,
        uint256 amount
    ) external payable returns (bytes32 messageId);

    /**
     * @notice Returns estimated bridge fee for a given route.
     */
    function estimateFee(
        OmnichainRoute calldata route,
        AssetType assetType,
        uint256 amount
    ) external view returns (uint256 feeInZoo);

    /**
     * @notice Returns whether a destination chain ID is supported.
     */
    function isChainSupported(uint256 chainId) external view returns (bool);

    event OmnichainBridgeInitiated(
        bytes32 indexed messageId,
        uint256 indexed destinationChainId,
        bytes32 adapterType,
        bool yieldBearing,
        bool shariaCompliant
    );
}
```

### Native Bridge Programs

#### Solana Program

The Teleport Solana program receives bridged conservation tokens and mints SPL equivalents:

- **Program ID**: Registered in Zoo Contract Registry (ZIP-0100) under `teleport-solana-adapter`.
- **Token mint**: Each bridged ZRC-20 maps to a unique SPL token mint with conservation metadata stored in a Metaplex metadata account.
- **Conservation metadata**: Stored as an anchor account linked to the mint. Includes species ID, impact credits, and provenance CID from the source chain.
- **Yield integration**: If `yieldBearing` is set, the program mints into a yield vault PDA that deposits into Solana conservation yield strategies.

#### TON Contract

The Teleport TON adapter receives tokens via a FunC contract:

- **Contract**: Deployed as a standard TON smart contract. Registered in ZIP-0100 under `teleport-ton-adapter`.
- **Jetton minting**: Bridged ZRC-20 tokens are represented as TON Jettons (TEP-74). Conservation metadata is stored in the Jetton wallet's on-chain content cell.
- **TON Connect**: Users bridge back to Zoo via TON Connect wallet integration.

#### Cosmos Module

The Teleport Cosmos adapter uses IBC (LPS-017) with a CosmWasm contract on each supported Cosmos chain:

- **IBC channel**: Dedicated `teleport-zoo` IBC channel registered per chain.
- **CW20 minting**: Bridged tokens are represented as CW20 tokens with conservation metadata in the token's `marketing` info field.
- **IBC hooks**: Conservation yield distribution uses IBC middleware hooks to auto-compound on the destination chain.

### Yield-Bearing Bridge Tokens

When `yieldBearing` is set in the `OmnichainRoute`, the destination adapter mints a yield-bearing wrapper instead of a standard bridged token:

| Token | Underlying | Yield Source | Conservation Split |
|-------|------------|--------------|-------------------|
| yZETH | Bridged ZETH (Zoo-wrapped ETH) | ETH staking yield via Lido/RocketPool on Ethereum, relayed to destination | 20% of yield to conservation fund |
| yZBTC | Bridged ZBTC (Zoo-wrapped BTC) | BTC yield via Babylon staking, relayed to destination | 20% of yield to conservation fund |
| yZOO | Bridged ZOO | ZOO staking rewards on Zoo L2, relayed to destination | 100% of yield is conservation (ZOO staking IS conservation) |

Yield is distributed on the destination chain by a Teleport yield oracle that relays yield accrual proofs from the source yield strategy. The oracle submits periodic yield updates (every 24 hours) and the yield-bearing token rebases accordingly.

```solidity
/**
 * @title IYieldBearingBridgeToken
 * @notice Rebasing wrapper for bridged tokens that generates conservation yield.
 */
interface IYieldBearingBridgeToken {

    /**
     * @notice Returns the current exchange rate (yield-bearing token to underlying).
     */
    function exchangeRate() external view returns (uint256);

    /**
     * @notice Returns total conservation yield generated by this token across all holders.
     */
    function totalConservationYield() external view returns (uint256);

    /**
     * @notice Unwraps yield-bearing tokens back to standard bridged tokens.
     *         Accrued conservation yield is sent to the conservation fund.
     */
    function unwrap(uint256 amount) external returns (uint256 underlyingAmount);

    event YieldDistributed(
        uint256 yieldAmount,
        uint256 conservationShare,
        uint256 newExchangeRate
    );
}
```

### ShariaFilter Integration

The ShariaFilter module enables Islamic finance-compliant conservation bonds on any destination chain. It is applied when `shariaCompliant` is set in the `OmnichainRoute`.

**Compliance rules enforced on-chain:**

1. **No riba (interest)**: yZETH/yZBTC yield is classified as profit-sharing (mudarabah), not interest. The yield-bearing token contract labels yield distributions as `profit_share`, not `interest`.
2. **No gharar (excessive uncertainty)**: Bridge fees are deterministic and quoted upfront via `estimateFee`. No slippage on bridge transfers.
3. **Asset-backing**: All bridged tokens are 1:1 backed by locked assets on Zoo L2. The ShariaFilter verifies backing ratio on every transfer.
4. **Halal screening**: The filter maintains a registry of Sharia-compliant destination protocols. Transfers to non-compliant protocols (gambling, alcohol-related tokens) are rejected.
5. **Sukuk structure**: Conservation bonds issued via this path follow the sukuk al-mudarabah structure where investors share in conservation project returns.

```solidity
/**
 * @title IShariaFilter
 * @notice On-chain Sharia compliance filter for conservation bond transfers.
 */
interface IShariaFilter {

    /**
     * @notice Returns whether a transfer passes Sharia compliance checks.
     */
    function isCompliant(
        address tokenContract,
        address recipient,
        uint256 destinationChainId,
        bytes calldata metadata
    ) external view returns (bool compliant, string memory reason);

    /**
     * @notice Returns whether a destination protocol is in the halal registry.
     */
    function isHalalProtocol(
        uint256 chainId,
        bytes calldata protocolAddress
    ) external view returns (bool);

    /**
     * @notice Updates the halal protocol registry. Governance-controlled.
     */
    function updateRegistry(
        uint256 chainId,
        bytes calldata protocolAddress,
        bool halal
    ) external;

    event ComplianceCheckPassed(address indexed token, address indexed recipient, uint256 chainId);
    event ComplianceCheckFailed(address indexed token, address indexed recipient, string reason);
}
```

### Fee Structure

| Route | Fee | Recipient |
|-------|-----|-----------|
| Zoo to EVM chain | 0.1% of amount | 50% MPC signers, 50% conservation fund |
| Zoo to Solana | 0.15% of amount | 50% MPC signers, 50% conservation fund |
| Zoo to TON | 0.15% of amount | 50% MPC signers, 50% conservation fund |
| Zoo to Cosmos (IBC) | 0.08% of amount | 50% MPC signers, 50% conservation fund |
| Zoo to Move chains | 0.15% of amount | 50% MPC signers, 50% conservation fund |
| Yield-bearing mint | Additional flat 5 ZOO | Conservation fund |
| ShariaFilter check | Flat 2 ZOO | Sharia advisory board multisig |

## Rationale

**Why extend ZIP-0800 rather than deploy a separate bridge?** ZIP-0800 already handles MPC security, metadata serialization, and TBA synchronization. The omnichain extension adds routing logic and chain-specific adapters on top of the same security model. One bridge, many destinations.

**Why native programs on Solana/TON/Cosmos instead of generic message passing?** Generic bridges lose conservation metadata at non-EVM boundaries. Native programs can store metadata in chain-native formats (Metaplex accounts, Jetton content cells, CW20 marketing info) that are readable by local ecosystem tools.

**Why yield-bearing bridge tokens?** Bridged tokens typically sit idle. yZETH and yZBTC put that capital to work while maintaining 1:1 backing. The 20% conservation yield split ensures bridge usage directly funds conservation, even when tokens are parked on foreign chains.

**Why ShariaFilter?** Islamic finance is the fastest-growing segment of ethical finance. Conservation sukuk are a natural product. On-chain compliance filtering removes the need for off-chain Sharia boards to manually review each transaction, enabling permissionless Islamic conservation DeFi.

## Backwards Compatibility

This proposal extends ZIP-0800 without modifying it. The `IZooOmnichainGateway` inherits from `IZooBridgeGateway`. Existing Zoo-to-Lux bridge transfers continue to use the base `bridgeOut` function. The omnichain extension is opt-in via `omnichainBridgeOut`. Yield-bearing tokens are standard ERC-20 on EVM chains, SPL tokens on Solana, Jettons on TON, and CW20 on Cosmos -- fully composable with each ecosystem's DeFi.

## Security Considerations

1. **Cross-chain message verification**: Each chain adapter verifies Teleport relay proofs independently. A compromised adapter on one chain cannot affect others.
2. **Yield oracle manipulation**: The yield oracle submits proofs of yield accrual from source strategies. Proofs are verified against source chain state roots relayed by Teleport. Fraudulent yield claims are rejected.
3. **ShariaFilter bypass**: The filter is enforced at the gateway level before tokens leave Zoo L2. It cannot be bypassed by interacting with destination chain contracts directly, because minting on the destination requires a valid Teleport message that includes the compliance flag.
4. **Non-EVM key formats**: Solana (Ed25519), TON (Ed25519), and Cosmos (secp256k1) use different key formats. Recipient addresses are validated against chain-specific address formats before the bridge message is relayed.
5. **Yield-bearing token depegging**: If the underlying yield strategy suffers a loss, the yield-bearing token's exchange rate decreases. The conservation yield split is applied only to positive yield. Negative yield is absorbed entirely by token holders.
6. **IBC timeout**: Cosmos IBC transfers have a configurable timeout (default 10 minutes). Timed-out transfers are automatically refunded on Zoo L2 via the standard IBC timeout callback.
7. **Halal registry governance**: The halal protocol registry is governance-controlled with a 48-hour timelock. Emergency additions (to block a newly non-compliant protocol) use a 4-hour fast-track path requiring 3/5 Sharia advisory board signatures.

## References

- [LPS-016: Teleport Omnichain Bridge Architecture](https://lux.network/lps/lps-016)
- [LPS-017: Teleport IBC Relay](https://lux.network/lps/lps-017)
- [LPS-018: Teleport Move Adapter](https://lux.network/lps/lps-018)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0042: Cross-Ecosystem Interoperability](./zip-0042-cross-ecosystem-interoperability-standard.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0703: Token-Bound Accounts for Wildlife](./zip-0703-token-bound-accounts-for-wildlife.md)
- [ZIP-0800: Zoo-Lux Bridge Protocol](./zip-0800-zoo-lux-bridge-protocol.md)
- [TEP-74: Jetton Standard (TON)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [CW20: CosmWasm Fungible Token](https://github.com/CosmWasm/cw-plus/tree/main/packages/cw20)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
