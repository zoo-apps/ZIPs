---
zip: 304
title: "Game Asset Interoperability"
description: "Standard for portable game assets across Zoo ecosystem games with on-chain metadata and rendering hints"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
created: 2025-01-15
tags: [gaming, assets, interoperability, nft, portability]
requires: [0, 4, 200, 300]
---

# ZIP-304: Game Asset Interoperability

## Abstract

This proposal defines a standard for portable game assets across all Zoo ecosystem games. Assets (creatures, equipment, habitats, cosmetics) are represented as ZRC-721 tokens (ZIP-200) with an extended metadata schema that includes rendering hints, behavioral attributes, and game-specific adaptation rules. Any Zoo game that implements this standard can import, display, and utilize assets minted by any other compliant game. The standard separates visual representation from game-mechanical properties, enabling assets to retain their identity and history while adapting their function to each game's mechanics.

## Motivation

The Zoo gaming ecosystem (ZIP-4) envisions multiple interconnected conservation games. A player who earns a rare wildlife avatar in one game should be able to use it in another. Today, game assets are siloed: each game defines its own asset format, metadata schema, and rendering pipeline. This creates fragmentation and diminishes the value of player effort.

1. **Player investment**: Players invest time and resources earning assets. Locking assets to a single game devalues that investment and discourages ecosystem participation.
2. **Network effects**: Portable assets create cross-game demand. A popular creature design in one game attracts players to try other games where it also functions.
3. **Developer efficiency**: A shared asset standard reduces the work required for each game to support cross-game items. Developers implement one adapter rather than N per-game parsers.
4. **Conservation continuity**: Wildlife-themed assets tied to real species (ZIP-200) carry educational metadata. Portability ensures this educational content travels with the asset.

## Specification

### 1. Asset Metadata Schema

Every interoperable asset conforms to this metadata extension on ZRC-721:

```typescript
interface ZooGameAsset {
  // ZRC-721 base fields
  tokenId: string;
  owner: string;
  contractAddress: string;

  // Interoperability extension
  assetClass: AssetClass;
  visualDescriptor: VisualDescriptor;
  behaviorProfile: BehaviorProfile;
  provenance: AssetProvenance;
  adaptationRules: AdaptationRule[];
}

type AssetClass = "creature" | "equipment" | "habitat_element"
                | "cosmetic" | "consumable" | "certificate";

interface VisualDescriptor {
  model3dUri: string;          // IPFS CID of glTF 2.0 model
  texture2dUri: string;        // IPFS CID of 2D sprite sheet
  thumbnailUri: string;        // IPFS CID of 256x256 thumbnail
  animationSet: string;        // IPFS CID of animation bundle
  colorPalette: string[];      // Hex colors for recoloring
  scale: [number, number, number];  // Default scale factors
  polyBudget: "low" | "medium" | "high";  // LOD hint
}

interface BehaviorProfile {
  species?: string;            // Binomial nomenclature if wildlife
  conservationStatus?: string; // IUCN status
  baseStats: Record<string, number>;  // Game-agnostic attributes
  abilities: Ability[];
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface AssetProvenance {
  mintedBy: string;            // Game contract that created it
  mintedAt: number;            // Block timestamp
  originGame: string;          // Game ID from ZIP-4 registry
  earnedVia: string;           // How the player earned it
  conservationLink?: string;   // Real-world conservation project
  transferHistory: Transfer[];
}
```

### 2. Adaptation Rules

Games adapt foreign assets to their mechanics via adaptation rules:

```typescript
interface AdaptationRule {
  targetGameId: string;         // "*" for universal rules
  statMapping: Record<string, string>;  // Source stat -> target stat
  scalingFactor: number;        // Balance multiplier (0.5 - 2.0)
  restrictedContexts?: string[];  // Contexts where asset cannot be used
  visualOverride?: Partial<VisualDescriptor>;  // Game-specific visuals
}
```

The importing game reads adaptation rules in priority order: game-specific rules first, then universal rules, then default 1:1 mapping. Stat values are clamped to the importing game's valid ranges.

### 3. Asset Registry Contract

```solidity
interface IZooAssetRegistry {
    function registerAsset(
        uint256 tokenId,
        bytes calldata metadata,
        bytes calldata visualHash,
        bytes calldata behaviorHash
    ) external;

    function getAssetMetadata(uint256 tokenId)
        external view returns (bytes memory);

    function isInteroperable(uint256 tokenId)
        external view returns (bool);

    function getAdaptation(uint256 tokenId, bytes32 gameId)
        external view returns (bytes memory);
}
```

Assets are registered once. The registry stores content hashes for visual and behavioral data, ensuring immutability. Games query the registry to determine how to render and utilize imported assets.

### 4. Rendering Requirements

Compliant games MUST support:
- glTF 2.0 models with PBR materials for 3D games
- Sprite sheets with standard animation frames for 2D games
- Fallback to thumbnail rendering if full model cannot be loaded
- Color palette recoloring for visual customization

Games SHOULD support the full animation set but MAY use idle-only animations as a minimum.

## Rationale

- **glTF 2.0**: Industry standard for 3D asset interchange. Supported by all major game engines. Compact binary format (GLB) minimizes IPFS storage costs.
- **Separation of visual and behavioral data**: A creature that looks the same everywhere but has game-specific stats preserves identity while respecting each game's balance. No single game can dictate the mechanical value of another game's assets.
- **Adaptation rules over fixed stats**: Different games have different stat systems. Fixed universal stats would either be too generic to be interesting or too specific to fit everywhere. Adaptation rules give importing games flexibility while bounding the range of outcomes.
- **On-chain registry**: The registry is the single source of truth for asset interoperability status. Games trust the registry rather than parsing raw token metadata, reducing attack surface.

## Security Considerations

1. **Malicious models**: A glTF file could contain excessive geometry to crash renderers. Mitigation: games enforce polygon budget limits from the `polyBudget` hint and reject models exceeding the threshold.
2. **Stat inflation**: A game could mint assets with inflated base stats to gain advantages in other games. Mitigation: adaptation rules include scaling factors, and importing games clamp stats to their own valid ranges. The asset registry may flag assets from games with repeatedly inflated stats.
3. **Metadata tampering**: Asset metadata is content-addressed on IPFS and hash-verified on-chain. Tampered metadata will not match the registered hashes.
4. **Provenance fraud**: A game could claim assets were "earned" when they were sold. Mitigation: the `earnedVia` field is informational; actual rarity and value are determined by on-chain transfer history and game-specific achievement records.
5. **Cross-game exploits**: An asset with an ability that is benign in one game might be overpowered in another. Mitigation: `restrictedContexts` allow importing games to block specific abilities, and the 0.5-2.0 scaling factor bounds prevent extreme imbalances.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
4. [ZIP-300: Virtual Habitat Simulation](./zip-0300-virtual-habitat-simulation-protocol.md)
5. [glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
6. [EIP-5773: Multi-Resource Token](https://eips.ethereum.org/EIPS/eip-5773)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
