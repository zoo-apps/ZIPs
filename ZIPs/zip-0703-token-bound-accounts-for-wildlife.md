---
zip: 0703
title: "Token-Bound Accounts for Wildlife NFTs"
description: "ERC-6551 token-bound accounts enabling wildlife NFTs to own assets, receive donations, and accumulate conservation history"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-01-15
tags: [tba, token-bound, wildlife, nft, wallet, zrc-6551, conservation]
requires: [15, 100, 701]
---

# ZIP-0703: Token-Bound Accounts for Wildlife NFTs

## Abstract

This proposal defines the Zoo implementation of token-bound accounts (TBAs) for wildlife NFTs, based on the Lux LRC-6551 standard (LP-9551) and ERC-6551. Every ZRC-721 wildlife NFT receives a deterministic smart contract wallet that can hold ZRC-20 tokens, other NFTs, and ZRC-1155 badges. This enables wildlife NFTs to receive direct donations, accumulate conservation impact history, hold research data, and participate autonomously in governance. TBAs transform static collectibles into living on-chain entities that grow in value and impact over their lifetime.

## Motivation

Wildlife NFTs today are static references to off-chain data. A "Tiger #42" NFT has no ability to:

1. **Receive Donations**: Supporters cannot send ZOO tokens directly to a specific animal's NFT. They must donate to a general fund and hope it is allocated correctly.
2. **Accumulate History**: Conservation actions, veterinary records, and sightings have no on-chain home attached to the animal they describe.
3. **Own Assets**: A wildlife NFT cannot hold research data NFTs, sensor data tokens, or conservation badges that document its protection history.
4. **Participate in Governance**: Wildlife NFTs cannot vote on conservation proposals that directly affect their species.

Token-bound accounts solve all of these by giving each NFT its own Ethereum-compatible account. When the NFT transfers, its entire account -- including all held assets and history -- transfers with it.

## Specification

### Registry Contract

The Zoo TBA Registry is a singleton contract deployed at a deterministic address on Zoo L2, following ERC-6551.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZooTBARegistry
 * @notice Registry for creating and querying token-bound accounts for ZRC-721 wildlife NFTs.
 * @dev Implements ERC-6551 registry interface with Zoo-specific extensions.
 */
interface IZooTBARegistry {

    /**
     * @notice Creates a token-bound account for an NFT.
     * @param implementation The TBA implementation contract address.
     * @param salt Unique salt for CREATE2 deployment.
     * @param chainId Chain ID where the NFT contract is deployed.
     * @param tokenContract Address of the ZRC-721 contract.
     * @param tokenId Token ID of the NFT.
     * @return account The address of the created TBA.
     */
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address account);

    /**
     * @notice Computes the deterministic address of a TBA without deploying it.
     */
    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address);

    event AccountCreated(
        address account,
        address indexed implementation,
        bytes32 salt,
        uint256 chainId,
        address indexed tokenContract,
        uint256 indexed tokenId
    );
}
```

### Account Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/**
 * @title IZooTBA
 * @notice Token-bound account implementation for Zoo wildlife NFTs.
 * @dev Extends ERC-6551 account interface with conservation features.
 */
interface IZooTBA is IERC165, IERC721Receiver, IERC1155Receiver {

    // ──────────────────────────────────────────────
    // ERC-6551 Core
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the NFT that owns this account.
     */
    function token() external view returns (uint256 chainId, address tokenContract, uint256 tokenId);

    /**
     * @notice Returns the current owner of the bound NFT (and thus this account).
     */
    function owner() external view returns (address);

    /**
     * @notice Returns whether a signer is authorized to act on behalf of this account.
     */
    function isValidSigner(address signer, bytes calldata context) external view returns (bytes4);

    /**
     * @notice Returns a nonce for replay protection.
     */
    function state() external view returns (uint256);

    /**
     * @notice Executes a call from this account. Only callable by a valid signer.
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external payable returns (bytes memory);

    // ──────────────────────────────────────────────
    // Conservation Extensions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the total ZOO tokens donated to this wildlife NFT.
     */
    function totalDonationsReceived() external view returns (uint256);

    /**
     * @notice Returns the number of unique donors to this wildlife NFT.
     */
    function donorCount() external view returns (uint256);

    /**
     * @notice Returns donation amount from a specific donor.
     */
    function donationFrom(address donor) external view returns (uint256);

    /**
     * @notice Accepts a ZOO token donation. Anyone can call this.
     *         Transfers ZOO from msg.sender to this account and records the donation.
     */
    function donate(uint256 amount) external;

    /**
     * @notice Withdraws funds from this account to a verified conservation project.
     *         Only callable by the NFT owner. Destination must be in the Conservation
     *         Fund Registry (ZIP-0100).
     */
    function withdrawToConservation(address fund, uint256 amount) external;

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 totalDonations
    );

    event ConservationWithdrawal(
        address indexed fund,
        uint256 amount,
        address indexed authorizedBy
    );

    // ──────────────────────────────────────────────
    // Conservation History
    // ──────────────────────────────────────────────

    struct ConservationAction {
        uint256 timestamp;
        address initiator;
        string actionType;       // "donation", "observation", "medical", "relocation", "research"
        uint256 value;           // ZOO amount if financial, 0 otherwise
        string detailsCID;       // IPFS CID for supporting data
    }

    /**
     * @notice Returns the full conservation action history for this account.
     */
    function conservationHistory() external view returns (ConservationAction[] memory);

    /**
     * @notice Appends a conservation action record. Callable by NFT owner or
     *         authorized verifiers registered in ZIP-0100.
     */
    function recordConservationAction(
        string calldata actionType,
        uint256 value,
        string calldata detailsCID
    ) external;

    event ConservationActionRecorded(
        string actionType,
        address indexed initiator,
        uint256 value,
        uint256 timestamp
    );

    // ──────────────────────────────────────────────
    // Governance Delegation
    // ──────────────────────────────────────────────

    /**
     * @notice Delegates voting power of ZRC-20 tokens held by this account.
     *         Only callable by NFT owner. Enables wildlife NFTs to participate
     *         in Zoo DAO governance (ZooGovernor).
     */
    function delegateVotingPower(address token, address delegatee) external;
}
```

### Account Creation Flow

1. A ZRC-721 wildlife NFT is minted via ZIP-0701.
2. The minting contract (or any party) calls `IZooTBARegistry.createAccount()` with the Zoo default TBA implementation, the Zoo L2 chain ID (`200200`), and the token details.
3. A deterministic account address is deployed via CREATE2.
4. The account can immediately receive ZOO tokens, other NFTs, and ZRC-1155 badges.
5. When the ZRC-721 NFT is transferred, the TBA's `owner()` automatically resolves to the new NFT holder.

### Automatic TBA Provisioning

ZRC-721 contracts conforming to ZIP-0701 SHOULD automatically create a TBA at mint time by calling the registry in `_afterTokenTransfer` (or equivalent post-mint hook). This ensures every wildlife NFT has a functional account from the moment of creation.

```solidity
function _afterTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
    super._afterTokenTransfer(from, to, tokenId, batchSize);
    if (from == address(0)) {
        // Mint - create TBA
        IZooTBARegistry(ZOO_TBA_REGISTRY).createAccount(
            ZOO_TBA_IMPLEMENTATION,
            bytes32(0),
            block.chainid,
            address(this),
            tokenId
        );
    }
}
```

### Donation Flow

```
Donor                    TBA                     ZOO Token           Conservation Fund
  │                       │                         │                       │
  ├─── donate(1000) ─────>│                         │                       │
  │                       ├── transferFrom(donor, ──>│                       │
  │                       │    self, 1000)           │                       │
  │                       ├── record donation ───────┤                       │
  │                       │   emit DonationReceived  │                       │
  │                       │                         │                       │
  │  [NFT owner decides to fund project]            │                       │
  │                       │                         │                       │
  ├─ withdrawToConservation(fund, 500) ─>│          │                       │
  │                       ├── verify fund ──────────┤                       │
  │                       ├── transfer(fund, 500) ──┼──────────────────────>│
  │                       │   emit ConservationWithdrawal                   │
```

### Cross-Chain TBA Resolution

When a ZRC-721 NFT is bridged to Lux C-Chain via ZIP-0701's bridgeable extension:

1. The TBA on Zoo L2 is frozen (no new executions allowed).
2. A mirror TBA is created on Lux C-Chain using the same salt and implementation.
3. Held assets remain on Zoo L2 and are accessible via the Zoo-Lux bridge (ZIP-0800).
4. When the NFT returns to Zoo L2, the original TBA is unfrozen and the Lux mirror is deactivated.

## Rationale

**Why deterministic addresses?** CREATE2 deployment means the TBA address can be computed before deployment. Donors can send ZOO tokens to a wildlife NFT's account address even before the TBA contract is deployed. The funds will be accessible once the account is created.

**Why restrict withdrawals to verified conservation funds?** Without this restriction, a TBA becomes just another wallet. The conservation fund registry (ZIP-0100) ensures that donations to wildlife NFTs actually reach conservation projects, maintaining donor trust and tax-deductibility for the 501(c)(3).

**Why record conservation history on-chain?** Transparency is the foundation of Zoo's impact model (ZIP-0500). On-chain history lets anyone verify that donations to "Tiger #42" resulted in actual conservation actions: veterinary care, habitat protection, anti-poaching patrols.

**Why governance delegation?** Wildlife NFTs that hold ZOO tokens should have a voice in the DAO. By delegating voting power, the NFT's human owner can vote on conservation proposals on behalf of the animal the NFT represents, creating a symbolic "voice for nature" in governance.

## Backwards Compatibility

ZRC-703 TBAs are fully compatible with ERC-6551. Standard TBA tooling (tokenbound.org, Tokenbound SDK) will correctly identify and interact with Zoo TBAs. The accounts implement `IERC721Receiver` and `IERC1155Receiver`, so they can safely receive any ERC-721 or ERC-1155 token. The conservation extensions use novel function selectors that do not conflict with ERC-6551 or any established standard.

## Security Considerations

1. **Ownership Confusion**: The TBA's `owner()` changes when the NFT transfers. Pending transactions from the previous owner MUST be invalidated. The `state()` nonce increments on each ownership change.
2. **Reentrancy via execute()**: The `execute` function can call arbitrary contracts. Implementations MUST use reentrancy guards and validate the `operation` parameter (call vs. delegatecall).
3. **Fund Drain**: A compromised NFT owner key could drain the TBA. Implementations SHOULD support optional timelocks or multi-sig requirements for withdrawals exceeding a threshold.
4. **Circular Ownership**: A TBA could hold its own parent NFT, creating a circular ownership loop. Implementations MUST prevent an account from acquiring its own bound token.
5. **Conservation Fund Verification**: The `withdrawToConservation` function MUST verify the destination against the live Contract Registry. A stale local cache could allow withdrawals to deregistered addresses.
6. **Cross-Chain State**: When an NFT is bridged, the source-chain TBA must be atomically frozen. Failure to freeze could allow double-spending of held assets.
7. **Gas Griefing**: Unbounded conservation history arrays could make `conservationHistory()` calls exceed gas limits. Implementations SHOULD paginate history queries and set a per-account record limit.

## References

- [EIP-6551: Non-fungible Token Bound Accounts](https://eips.ethereum.org/EIPS/eip-6551)
- [LP-9551: LRC-6551 Token-Bound Accounts](https://lux.network/lps/lp-9551)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
- [ZIP-0500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [ZIP-0701: ZRC-721 NFT Standard](./zip-0701-zrc-721-nft-standard.md)
- [ZIP-0800: Zoo-Lux Bridge Protocol](./zip-0800-zoo-lux-bridge-protocol.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
