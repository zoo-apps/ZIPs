---
zip: 210
title: "Cross-Collection Composability"
description: "Standard for composing NFTs across Zoo collections enabling bundling, layering, and cross-collection interactions"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
created: 2025-01-15
tags: [nft, composability, bundling, cross-collection, interoperability]
requires: [0, 100, 200, 703]
---

# ZIP-210: Cross-Collection Composability

## Abstract

This ZIP defines a composability standard for Zoo NFTs that enables tokens from different collections to be combined, layered, and interact with each other. A wildlife photography NFT (ZIP-205) can be placed inside a microhabitat NFT (ZIP-209), a breeding simulation offspring (ZIP-207) can wear an accessory from a conservation badge collection (ZIP-202), and an endangered species NFT (ZIP-208) can be bundled with a conservation bond (ZIP-101) into a single composite token. The standard uses token-bound accounts (ZIP-703) as the composition mechanism, where any ZRC-721 token can hold other tokens, creating a tree structure of composable digital assets.

## Motivation

Zoo's NFT ecosystem spans multiple collections with distinct purposes. Without composability, these collections are siloed:

1. **Narrative depth**: A microhabitat NFT becomes richer when it contains wildlife photography NFTs of species observed there. Composability enables storytelling across collections.
2. **Bundle trading**: Collectors can create and trade curated bundles -- a "Conservation Starter Pack" containing a habitat sponsorship, a species adoption, and a photography NFT.
3. **Game mechanics**: The breeding simulation (ZIP-207) and virtual habitats (ZIP-300) benefit from cross-collection items like environmental modifiers and species accessories.
4. **Impact stacking**: Combining a habitat NFT with a conservation bond in a single composite token creates verifiable "impact bundles" whose total conservation value exceeds the sum of parts.

## Specification

### 1. Composition Interface

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

interface IZooComposable {
    /// @notice Emitted when a child token is attached to a parent
    event Composed(
        address indexed parentCollection,
        uint256 indexed parentTokenId,
        address indexed childCollection,
        uint256 childTokenId,
        string slot
    );

    /// @notice Emitted when a child token is detached
    event Decomposed(
        address indexed parentCollection,
        uint256 indexed parentTokenId,
        address indexed childCollection,
        uint256 childTokenId
    );

    /// @notice Attach a child token to a parent token's slot
    function compose(
        uint256 parentTokenId,
        address childCollection,
        uint256 childTokenId,
        string calldata slot
    ) external;

    /// @notice Detach a child token from a parent
    function decompose(
        uint256 parentTokenId,
        address childCollection,
        uint256 childTokenId
    ) external;

    /// @notice List all children of a parent token
    function childrenOf(uint256 parentTokenId) external view returns (ComposedChild[] memory);

    /// @notice Check if a token is currently composed into a parent
    function parentOf(address collection, uint256 tokenId)
        external view returns (address parentCollection, uint256 parentTokenId);
}

struct ComposedChild {
    address collection;
    uint256 tokenId;
    string slot;
    uint64 composedAt;
}
```

### 2. Slot System

Each collection defines named slots that accept specific child collection types:

| Parent Collection | Slot Name | Accepted Children | Max Per Slot |
|------------------|-----------|-------------------|-------------|
| Microhabitat (ZIP-209) | `species` | Wildlife Photo (ZIP-205), Endangered (ZIP-208) | 50 |
| Microhabitat (ZIP-209) | `bond` | Conservation Bond (ZIP-101) | 5 |
| Breeding Sim (ZIP-207) | `accessory` | Conservation Badge (ZIP-202) | 3 |
| Breeding Sim (ZIP-207) | `habitat` | Microhabitat (ZIP-209) | 1 |
| Endangered (ZIP-208) | `photo` | Wildlife Photo (ZIP-205) | 10 |
| Endangered (ZIP-208) | `sponsor` | Microhabitat (ZIP-209) | 1 |

### 3. Core Contract

```solidity
contract ZooComposable is IZooComposable {
    struct SlotConfig {
        string name;
        address[] acceptedCollections;
        uint16 maxChildren;
        bool active;
    }

    // parentCollection => parentTokenId => slot => children
    mapping(address => mapping(uint256 => mapping(string => ComposedChild[]))) private _children;

    // childCollection => childTokenId => parent info
    mapping(address => mapping(uint256 => ParentInfo)) private _parents;

    struct ParentInfo {
        address parentCollection;
        uint256 parentTokenId;
        string slot;
        bool composed;
    }

    // collection => slot configs
    mapping(address => SlotConfig[]) public slotConfigs;

    function compose(
        uint256 parentTokenId,
        address childCollection,
        uint256 childTokenId,
        string calldata slot
    ) external {
        address parentCollection = msg.sender; // Called by parent collection contract
        // Or: require caller owns parent token

        // Validate slot accepts this child collection
        require(_isAcceptedChild(parentCollection, slot, childCollection), "INVALID_SLOT");

        // Check child is not already composed
        require(!_parents[childCollection][childTokenId].composed, "ALREADY_COMPOSED");

        // Check slot capacity
        ComposedChild[] storage children = _children[parentCollection][parentTokenId][slot];
        SlotConfig memory config = _getSlotConfig(parentCollection, slot);
        require(children.length < config.maxChildren, "SLOT_FULL");

        // Transfer child to parent's token-bound account (ZIP-703)
        address parentTBA = _getTokenBoundAccount(parentCollection, parentTokenId);
        IERC721(childCollection).transferFrom(msg.sender, parentTBA, childTokenId);

        // Record composition
        children.push(ComposedChild({
            collection: childCollection,
            tokenId: childTokenId,
            slot: slot,
            composedAt: uint64(block.timestamp)
        }));

        _parents[childCollection][childTokenId] = ParentInfo({
            parentCollection: parentCollection,
            parentTokenId: parentTokenId,
            slot: slot,
            composed: true
        });

        emit Composed(parentCollection, parentTokenId, childCollection, childTokenId, slot);
    }

    function decompose(
        uint256 parentTokenId,
        address childCollection,
        uint256 childTokenId
    ) external {
        ParentInfo storage parent = _parents[childCollection][childTokenId];
        require(parent.composed, "NOT_COMPOSED");

        // Only parent token owner can decompose
        address parentCollection = parent.parentCollection;
        require(IERC721(parentCollection).ownerOf(parentTokenId) == msg.sender, "NOT_OWNER");

        // Transfer child back from TBA
        address parentTBA = _getTokenBoundAccount(parentCollection, parentTokenId);
        // Execute via TBA
        IERC721(childCollection).transferFrom(parentTBA, msg.sender, childTokenId);

        // Remove from children array
        _removeChild(parentCollection, parentTokenId, parent.slot, childCollection, childTokenId);

        parent.composed = false;
        emit Decomposed(parentCollection, parentTokenId, childCollection, childTokenId);
    }

    function childrenOf(uint256 parentTokenId) external view returns (ComposedChild[] memory) {
        // Aggregate across all slots
        // Implementation returns flat array of all children
        return new ComposedChild[](0); // Placeholder
    }

    function _isAcceptedChild(address parent, string memory slot, address child) internal view returns (bool) {
        SlotConfig memory config = _getSlotConfig(parent, slot);
        for (uint256 i = 0; i < config.acceptedCollections.length; i++) {
            if (config.acceptedCollections[i] == child) return true;
        }
        return false;
    }

    function _getSlotConfig(address collection, string memory slot) internal view returns (SlotConfig memory) {
        // Lookup slot config for collection
        return SlotConfig("", new address[](0), 0, false); // Placeholder
    }

    function _getTokenBoundAccount(address collection, uint256 tokenId) internal view returns (address) {
        // ZIP-703 TBA registry lookup
        return address(0); // Placeholder
    }

    function _removeChild(address pc, uint256 pt, string memory slot, address cc, uint256 ct) internal {
        // Remove from _children mapping
    }
}
```

### 4. Composite Metadata

When an NFT contains children, its metadata includes the composed structure:

```json
{
  "name": "Borneo Rainforest Plot #23 (Composed)",
  "composable": true,
  "children": [
    {
      "slot": "species",
      "collection": "0x...(WildlifePhotography)",
      "tokenId": 17,
      "name": "Bornean Orangutan #17"
    },
    {
      "slot": "species",
      "collection": "0x...(EndangeredSpecies)",
      "tokenId": 42,
      "name": "Proboscis Monkey #42"
    },
    {
      "slot": "bond",
      "collection": "0x...(ConservationBond)",
      "tokenId": 8,
      "name": "90-Day Borneo Bond"
    }
  ],
  "total_conservation_value": 1250.00,
  "combined_impact_score": 87
}
```

### 5. Impact Aggregation

Composite tokens aggregate conservation impact from all children:

```
Composite Impact Score = Parent Impact + Sum(Child Impacts) * Synergy Bonus
```

Synergy bonuses apply when thematically aligned tokens are composed:
- Same species across collections: +10%
- Same habitat region: +15%
- Bond + Habitat: +20%

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Maximum composition depth | 3 levels | ZooGovernor |
| Maximum children per token | 50 across all slots | ZooGovernor |
| Synergy bonus cap | 50% | ZooGovernor |
| Slot configuration | Per collection | Collection admin |
| Decomposition cooldown | None | N/A |

## Rationale

**Why token-bound accounts (ZIP-703)?** TBAs provide a clean ownership model: the parent token literally owns the children via its own account. This means transferring the parent also transfers all composed children, which is the correct semantic for bundles.

**Why named slots?** Unrestricted composition leads to meaningless combinations. Slots enforce semantic coherence: a habitat can contain species observations but not other habitats (unless nested).

**Why synergy bonuses?** Incentivizing thematic alignment encourages collectors to build meaningful compositions rather than arbitrary bundles, driving engagement with conservation narratives.

**Why 3-level depth limit?** Deeply nested compositions create gas-intensive transfers and complex ownership graphs. Three levels (parent -> child -> grandchild) provides sufficient expressiveness without unmanageable complexity.

## Security Considerations

### Locked Assets
Composed children are held in TBAs. If the parent token is burned or the TBA contract has a bug, children could be locked. Emergency decomposition via ZooGovernor multisig provides a safety valve.

### Transfer Complexity
Transferring a deeply composed parent requires transferring the TBA's entire contents implicitly. Gas costs scale with composition depth and child count. The depth and child limits ensure transfers remain gas-feasible.

### Circular Composition
Token A composed into Token B composed into Token A would create an infinite loop. The contract must check for cycles before allowing composition. A simple parent-chain traversal (limited by depth cap) prevents this.

### Slot Configuration Attacks
A malicious collection admin could change slot configurations to lock or release children unexpectedly. Slot configurations should be immutable after collection deployment, or governed by timelock.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-703: Token Bound Accounts for Wildlife](./zip-0703-token-bound-accounts-for-wildlife.md)
4. [EIP-6551: Non-fungible Token Bound Accounts](https://eips.ethereum.org/EIPS/eip-6551)
5. [EIP-998: Composable Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-998)
6. [ZIP-205: Wildlife Photography NFT Standard](./zip-0205-wildlife-photography-nft-standard.md)
7. [ZIP-209: NFT-Backed Microhabitat](./zip-0209-nft-backed-microhabitat.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
