---
zip: 0800
title: "Zoo-Lux Bridge Protocol"
description: "Cross-chain bridge between Zoo L2 and Lux Network secured by MPC threshold signatures and Teleport architecture"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
originated: 2021-10
traces-from: "Whitepaper section 22 (Bridging Blockchains)"
follow-on: [zoo-bridge, zoo-lux-bridge-protocol, zoo-threshold-signatures]
created: 2025-01-15
tags: [bridge, cross-chain, lux, teleport, mpc, interoperability]
requires: [15, 42, 100, 700, 701]
---

# ZIP-0800: Zoo-Lux Bridge Protocol

## Abstract

This proposal defines the cross-chain bridge protocol between Zoo L2 (Chain ID: 200200) and Lux Network (C-Chain, X-Chain, B-Chain). The bridge is built on the Lux Teleport architecture (LP-6332) and secured by MPC (Multi-Party Computation) threshold signatures with a 2/3 supermajority requirement. It supports bridging of ZRC-20 fungible tokens, ZRC-721 wildlife NFTs (with metadata preservation), ZRC-1155 multi-tokens, and native ZOO/LUX gas tokens. The protocol ensures that conservation metadata, provenance chains, and token-bound account states are faithfully preserved across chains.

## Motivation

The Zoo ecosystem requires seamless value transfer between Zoo L2 and Lux Network for:

1. **Liquidity Access**: ZOO tokens must trade on Lux DEXs and access Lux DeFi liquidity pools.
2. **Settlement**: Conservation fund disbursements settled on Lux C-Chain benefit from its finality guarantees.
3. **Cross-Chain NFTs**: Wildlife NFTs minted on Zoo must be exhibitable and tradeable on Lux marketplaces.
4. **Compute Payment**: AI inference on Hanzo (via Lux) must be payable with ZOO tokens (see ZIP-0801).
5. **Ecosystem Unity**: ZIP-0042 mandates cross-ecosystem interoperability. The bridge is the physical infrastructure for that mandate.

Existing generic bridges (e.g., LayerZero, Wormhole) lack support for conservation-specific metadata, provenance chains, and token-bound account synchronization. A purpose-built bridge ensures these Zoo primitives survive cross-chain transfers intact.

## Specification

### Architecture Overview

```
Zoo L2 (200200)                                              Lux Network
┌─────────────────────┐                                ┌─────────────────────┐
│  ZooBridgeGateway   │◄──────── MPC Relayers ────────►│  LuxBridgeGateway   │
│                     │         (threshold 2/3)         │                     │
│  ┌───────────────┐  │                                │  ┌───────────────┐  │
│  │ Token Locker  │  │    ┌──────────────────────┐    │  │ Token Minter  │  │
│  │ (lock/unlock) │  │    │   MPC Signer Set     │    │  │ (mint/burn)   │  │
│  └───────────────┘  │    │                      │    │  └───────────────┘  │
│  ┌───────────────┐  │    │  S1  S2  S3 ... Sn   │    │  ┌───────────────┐  │
│  │ Metadata      │  │    │  (n >= 7, t = 2n/3)  │    │  │ Metadata      │  │
│  │ Serializer    │  │    └──────────────────────┘    │  │ Deserializer  │  │
│  └───────────────┘  │                                │  └───────────────┘  │
│  ┌───────────────┐  │                                │  ┌───────────────┐  │
│  │ TBA Freezer   │  │                                │  │ TBA Mirror    │  │
│  └───────────────┘  │                                │  └───────────────┘  │
└─────────────────────┘                                └─────────────────────┘
```

### Bridge Gateway Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZooBridgeGateway
 * @notice Gateway contract for Zoo-Lux cross-chain bridge.
 * @dev Deployed on both Zoo L2 and Lux C-Chain.
 */
interface IZooBridgeGateway {

    enum AssetType {
        NATIVE,     // ZOO or LUX native gas token
        ZRC20,      // Fungible token
        ZRC721,     // Non-fungible token
        ZRC1155     // Multi-token
    }

    struct BridgeMessage {
        bytes32 messageId;          // Unique message identifier
        uint256 sourceChainId;      // Origin chain
        uint256 destinationChainId; // Target chain
        address sender;             // Initiator on source chain
        address recipient;          // Recipient on destination chain
        AssetType assetType;        // Type of asset being bridged
        address tokenContract;      // Token contract on source chain
        uint256 tokenId;            // Token ID (0 for fungibles)
        uint256 amount;             // Amount (1 for NFTs)
        bytes metadata;             // Serialized conservation metadata
        uint256 nonce;              // Replay protection
        uint256 deadline;           // Message expiry timestamp
    }

    /**
     * @notice Initiates a bridge transfer from this chain to the destination.
     */
    function bridgeOut(
        uint256 destinationChainId,
        address recipient,
        AssetType assetType,
        address tokenContract,
        uint256 tokenId,
        uint256 amount
    ) external payable returns (bytes32 messageId);

    /**
     * @notice Completes a bridge transfer on the destination chain.
     *         Only callable by the MPC relayer with threshold signatures.
     */
    function bridgeIn(
        BridgeMessage calldata message,
        bytes calldata mpcSignature
    ) external;

    /**
     * @notice Returns the MPC signer set address (threshold verification contract).
     */
    function mpcSignerSet() external view returns (address);

    /**
     * @notice Returns whether a message ID has been processed (replay protection).
     */
    function processedMessages(bytes32 messageId) external view returns (bool);

    event BridgeOutInitiated(
        bytes32 indexed messageId,
        address indexed sender,
        uint256 destinationChainId,
        AssetType assetType,
        address tokenContract,
        uint256 tokenId,
        uint256 amount
    );

    event BridgeInCompleted(
        bytes32 indexed messageId,
        address indexed recipient,
        uint256 sourceChainId,
        AssetType assetType,
        address tokenContract,
        uint256 tokenId,
        uint256 amount
    );

    event BridgeMessageFailed(
        bytes32 indexed messageId,
        string reason
    );
}
```

### MPC Threshold Signature Scheme

The bridge is secured by an MPC signer set using GG20 (Gennaro-Goldfeder 2020) threshold ECDSA:

| Parameter | Value |
|-----------|-------|
| Minimum signers (n) | 7 |
| Threshold (t) | ceil(2n/3) |
| Key generation | Distributed key generation (DKG) |
| Signature scheme | Threshold ECDSA (secp256k1) |
| Rotation period | 30 days |
| Slashing | Signers stake 10,000 LUX; slashed for equivocation |

```solidity
/**
 * @title IMPCSignerSet
 * @notice Verifies MPC threshold signatures for bridge messages.
 */
interface IMPCSignerSet {
    /**
     * @notice Verifies that a message was signed by the threshold of MPC signers.
     * @param messageHash The keccak256 hash of the bridge message.
     * @param signature The aggregated MPC signature.
     * @return valid True if the signature meets the threshold requirement.
     */
    function verifyThresholdSignature(
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);

    /**
     * @notice Returns the current signer set configuration.
     */
    function signerSetInfo() external view returns (
        uint256 totalSigners,
        uint256 threshold,
        uint256 rotationEpoch,
        bytes32 publicKeyHash
    );

    /**
     * @notice Proposes a signer set rotation. Requires governance approval.
     */
    function proposeRotation(
        address[] calldata newSigners,
        uint256 newThreshold
    ) external;

    event SignerSetRotated(
        uint256 epoch,
        uint256 totalSigners,
        uint256 threshold,
        bytes32 publicKeyHash
    );
}
```

### Asset Bridging Mechanics

#### Native Token (ZOO/LUX)

- **Zoo to Lux**: ZOO locked in ZooBridgeGateway. Wrapped ZOO (wZOO) minted on Lux as LRC-20 (LP-3800).
- **Lux to Zoo**: wZOO burned on Lux. ZOO unlocked on Zoo L2.
- LUX follows the reverse path (locked on Lux, wrapped on Zoo).

#### ZRC-20 Tokens

- **Zoo to Lux**: Tokens locked. Bridged LRC-20 representation minted on Lux with matching metadata per LP-3800.
- **Lux to Zoo**: Bridged tokens burned. Original ZRC-20 unlocked. Conservation extensions (donation rate, impact credits) are restored from on-chain state.

#### ZRC-721 NFTs

- **Zoo to Lux**: NFT locked. Species metadata serialized and included in `BridgeMessage.metadata`. Provenance chain snapshot uploaded to IPFS and CID included. TBA frozen (ZIP-0703). Mirror LRC-721 minted on Lux with full metadata.
- **Lux to Zoo**: Mirror burned. Original NFT unlocked. TBA unfrozen. New provenance record added: `"bridged_back"`.

#### ZRC-1155 Multi-Tokens

- **Batch bridging**: Multiple token IDs and amounts can be bridged in a single message. The `metadata` field contains serialized `TokenTypeInfo` for each bridged type.
- Soulbound tokens MUST NOT be bridged. The gateway rejects any `bridgeOut` call for non-transferable token IDs.

### Metadata Serialization

Conservation metadata is serialized using ABI encoding for deterministic cross-chain reconstruction:

```solidity
// ZRC-721 metadata serialization
bytes memory metadata = abi.encode(
    speciesMetadata,           // SpeciesMetadata struct
    provenanceSnapshotCID,     // IPFS CID of full provenance chain
    conservationFundAddress,   // Conservation royalty fund
    royaltySplit,              // (conservationBps, creatorBps)
    tbaAddress,                // Token-bound account address on source chain
    tbaBalanceSnapshot         // ZOO balance in TBA at bridge time
);
```

### Fee Structure

| Operation | Fee | Recipient |
|-----------|-----|-----------|
| Native token bridge | 0.1% of amount | MPC signer set (operational costs) |
| ZRC-20 bridge | 0.05% of amount | 50% signers, 50% conservation fund |
| ZRC-721 bridge | Flat 10 ZOO | Conservation fund |
| ZRC-1155 batch | 5 ZOO per token type | Conservation fund |

### Liveness and Safety

- **Liveness**: If the MPC signer set is unavailable for > 72 hours, a governance-controlled emergency withdrawal path activates, allowing users to reclaim locked assets with a 7-day timelock.
- **Safety**: Messages expire after `deadline` (default 24 hours). Expired messages are rejected. Each `messageId` can only be processed once (replay protection via `processedMessages` mapping).
- **Finality**: Bridge messages are only relayed after source chain finality. Zoo L2 inherits sub-second finality from Lux primary network (ZIP-0015). Lux C-Chain requires 2 seconds for finality.

## Rationale

**Why MPC over multisig?** MPC threshold ECDSA produces a single on-chain signature regardless of signer set size, reducing gas costs. Multisig requires per-signer signature verification on-chain, which scales linearly with signer count.

**Why not use the Lux native bridge (Teleport) directly?** Teleport (LP-6332) provides the transport layer. ZIP-0800 adds the application layer for conservation metadata serialization, TBA synchronization, and conservation-specific fee routing. We build on Teleport, not replace it.

**Why freeze TBAs on bridge?** A TBA's assets could be double-spent if the NFT and its account were active on both chains simultaneously. Freezing ensures exactly-once asset access.

**Why conservation fee routing?** The bridge is ecosystem infrastructure. Directing a portion of bridge fees to conservation aligns infrastructure usage with the Zoo Foundation's mission (ZIP-0500).

## Backwards Compatibility

The bridge is compatible with LP-3800 (Bridged Asset Standard) and LP-6000 (B-Chain Bridge Specification). Bridged tokens on Lux appear as standard LRC-20/LRC-721/LRC-1155 tokens and are usable in any Lux DeFi protocol. The conservation metadata is stored in auxiliary mappings on the Lux gateway and does not interfere with standard token interfaces.

## Security Considerations

1. **MPC Key Compromise**: If t signers are compromised, the bridge is vulnerable. Mitigation: 30-day key rotation, geographic distribution of signers, hardware security modules (HSMs), and slashing for equivocation.
2. **Replay Attacks**: Each `messageId` is tracked in `processedMessages`. The nonce and deadline fields provide additional replay protection.
3. **Metadata Tampering**: The `messageHash` covers all fields including `metadata`. MPC signature verification ensures metadata integrity.
4. **Reentrancy**: `bridgeIn` mints or unlocks tokens before external calls. Implementations MUST follow checks-effects-interactions pattern.
5. **Censorship**: If MPC relayers censor specific messages, the 72-hour liveness fallback allows governance to force-process messages.
6. **Oracle Price Manipulation**: Bridge fees denominated in ZOO are not subject to price oracle manipulation since they are percentage-based or flat-rate.
7. **TBA Freeze Race Condition**: The TBA must be frozen before the bridge message is relayed. The `bridgeOut` function MUST atomically lock the NFT and freeze the TBA in a single transaction.
8. **Signer Set Rotation**: During rotation, both old and new signer sets are valid for a 24-hour overlap period. Messages signed by either set are accepted during this window.

## References

- [LP-6332: Teleport Bridge Architecture](https://lux.network/lps/lp-6332)
- [LP-6000: B-Chain Bridge Specification](https://lux.network/lps/lp-6000)
- [LP-3800: Bridged Asset Standard](https://lux.network/lps/lp-3800)
- [HIP-0101: Hanzo-Lux Bridge Protocol](https://hanzo.ai/hips/hip-0101)
- [GG20: One Round Threshold ECDSA](https://eprint.iacr.org/2020/540)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0042: Cross-Ecosystem Interoperability](./zip-0042-cross-ecosystem-interoperability-standard.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0701: ZRC-721 NFT Standard](./zip-0701-zrc-721-nft-standard.md)
- [ZIP-0703: Token-Bound Accounts for Wildlife](./zip-0703-token-bound-accounts-for-wildlife.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
