---
zip: 204
title: "Dynamic Metadata for Living NFTs"
description: "NFT metadata that evolves based on real-world conservation data feeds and AI-generated visual updates"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper section 21 (NFTs That Make You Smile)"
follow-on: [zoo-agent-nft]
created: 2025-01-15
tags: [nft, dynamic, metadata, ai, conservation]
requires: [0, 200, 201]
---

# ZIP-204: Dynamic Metadata for Living NFTs

## Abstract

This proposal defines the Living NFT standard -- NFTs whose metadata evolves in response to real-world conservation data. Unlike static NFTs that represent a fixed snapshot, Living NFTs continuously reflect the current health, population, and habitat status of the species or ecosystem they represent. Oracle feeds from conservation sensors, satellite imagery, and field reports update on-chain health scores. An AI visual engine regenerates the NFT artwork to reflect the current state: a thriving ecosystem renders as vibrant and lush; a degraded one renders as muted and sparse. The standard integrates with ZIP-200 (ZRC-721 Wildlife NFT), ZIP-201 (Species Adoption Certificate), and ZIP-510 (Species Protection Monitoring) for data feeds.

## Motivation

Static NFTs fail to represent the living, changing nature of wildlife and ecosystems:

1. **Stale Representation**: A species adoption NFT minted when a population is thriving looks identical after a 40% population decline. Holders have no visibility into the current conservation reality.
2. **Engagement Decay**: After initial purchase, static NFTs provide no reason for continued engagement. Living NFTs that change create ongoing emotional and informational connection to conservation outcomes.
3. **Impact Visibility**: Conservation donors rarely see the direct impact of their funding. Dynamic metadata that reflects measurable improvement (population recovery, habitat expansion) provides tangible feedback.
4. **Data Integration**: Conservation generates vast telemetry -- camera trap counts, GPS collar tracks, water quality sensors, satellite NDVI. This data has no path into the NFT ecosystem today.
5. **AI-Native Art**: Generative AI can produce artwork that meaningfully reflects data inputs, turning conservation metrics into compelling visual narratives that evolve over time.

## Specification

### Living NFT Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ILivingNFT
/// @notice NFTs with metadata that evolves from real-world conservation data
interface ILivingNFT {
    /// @notice Emitted when metadata is updated from oracle data
    event MetadataUpdated(
        uint256 indexed tokenId,
        uint256 healthScore,
        uint256 timestamp,
        bytes32 dataHash
    );

    /// @notice Emitted when AI visual refresh is triggered
    event VisualRefreshTriggered(
        uint256 indexed tokenId,
        string previousImageURI,
        string newImageURI,
        uint256 healthScore
    );

    /// @notice Emitted when a data source is registered for a token
    event DataSourceRegistered(
        uint256 indexed tokenId,
        address indexed oracle,
        DataSourceType sourceType
    );

    /// @notice Update token metadata from oracle conservation data
    /// @param tokenId The token to update
    /// @param healthScore Composite health score (0-10000 basis points)
    /// @param populationCount Latest population estimate
    /// @param habitatQuality Habitat quality index (0-10000 basis points)
    /// @param threatLevel Current threat level
    /// @param dataHash Hash of the full data payload for verification
    function updateMetadata(
        uint256 tokenId,
        uint256 healthScore,
        uint256 populationCount,
        uint256 habitatQuality,
        ThreatLevel threatLevel,
        bytes32 dataHash
    ) external;

    /// @notice Get the current composite health score for a token
    /// @param tokenId The token to query
    /// @return score Health score in basis points (0-10000)
    function getHealthScore(uint256 tokenId) external view returns (uint256 score);

    /// @notice Trigger an AI-generated visual refresh based on current data
    /// @param tokenId The token to refresh visuals for
    /// @param newImageURI IPFS URI of the newly generated artwork
    function triggerVisualRefresh(uint256 tokenId, string calldata newImageURI) external;

    /// @notice Get the full current state of a Living NFT
    /// @param tokenId The token to query
    /// @return state The current conservation state
    function getLivingState(uint256 tokenId) external view returns (LivingState memory state);

    /// @notice Get the history of health score changes
    /// @param tokenId The token to query
    /// @param limit Maximum number of historical entries to return
    /// @return entries Array of historical state snapshots
    function getHistory(uint256 tokenId, uint256 limit)
        external view returns (StateSnapshot[] memory entries);
}
```

### Data Structures

```solidity
enum ThreatLevel {
    Minimal,        // Population stable, habitat intact
    Low,            // Minor pressures, monitoring required
    Moderate,       // Active threats requiring intervention
    High,           // Significant decline or habitat loss
    Critical        // Imminent extinction risk or habitat collapse
}

enum DataSourceType {
    CameraTrap,     // Automated wildlife camera counts
    GPSCollar,      // Animal tracking collar telemetry
    Satellite,      // Satellite imagery (NDVI, deforestation)
    WaterSensor,    // Water quality monitoring stations
    AcousticMonitor,// Bioacoustic monitoring devices
    FieldReport,    // Manual field survey data
    CitizenScience  // Community-submitted observations
}

struct LivingState {
    uint256 tokenId;
    uint256 healthScore;          // Composite score (0-10000 bps)
    uint256 populationCount;      // Latest population estimate
    uint256 habitatQuality;       // Habitat quality index (0-10000 bps)
    ThreatLevel threatLevel;
    string currentImageURI;       // Current AI-generated artwork
    string baseImageURI;          // Original static artwork
    uint64 lastUpdated;           // Timestamp of last oracle update
    uint64 lastVisualRefresh;     // Timestamp of last AI art regeneration
    uint256 updateCount;          // Total number of metadata updates
    bytes32 latestDataHash;       // Hash of most recent data payload
}

struct StateSnapshot {
    uint256 healthScore;
    uint256 populationCount;
    uint256 habitatQuality;
    ThreatLevel threatLevel;
    string imageURI;
    uint64 timestamp;
}

struct DataSource {
    address oracle;               // Address authorized to submit data
    DataSourceType sourceType;
    string description;           // Human-readable source description
    uint64 registeredAt;
    bool active;
}
```

### Implementation

```solidity
contract LivingNFT is ERC721, AccessControl, ILivingNFT {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VISUAL_ENGINE_ROLE = keccak256("VISUAL_ENGINE_ROLE");

    mapping(uint256 => LivingState) private _states;
    mapping(uint256 => StateSnapshot[]) private _history;
    mapping(uint256 => DataSource[]) private _dataSources;

    uint256 public constant MAX_HISTORY = 365;  // ~1 year of daily updates
    uint256 public constant MIN_UPDATE_INTERVAL = 1 hours;

    constructor() ERC721("Zoo Living NFT", "ZLIVE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateMetadata(
        uint256 tokenId,
        uint256 healthScore,
        uint256 populationCount,
        uint256 habitatQuality,
        ThreatLevel threatLevel,
        bytes32 dataHash
    ) external onlyRole(ORACLE_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(healthScore <= 10000, "Health score exceeds max");
        require(habitatQuality <= 10000, "Habitat quality exceeds max");

        LivingState storage state = _states[tokenId];
        require(
            block.timestamp >= state.lastUpdated + MIN_UPDATE_INTERVAL,
            "Update too frequent"
        );

        // Snapshot previous state to history
        if (state.lastUpdated > 0) {
            _pushHistory(tokenId, state);
        }

        // Apply new state
        state.healthScore = healthScore;
        state.populationCount = populationCount;
        state.habitatQuality = habitatQuality;
        state.threatLevel = threatLevel;
        state.lastUpdated = uint64(block.timestamp);
        state.updateCount++;
        state.latestDataHash = dataHash;

        emit MetadataUpdated(tokenId, healthScore, block.timestamp, dataHash);
    }

    function triggerVisualRefresh(
        uint256 tokenId,
        string calldata newImageURI
    ) external onlyRole(VISUAL_ENGINE_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(newImageURI).length > 0, "Empty image URI");

        LivingState storage state = _states[tokenId];
        string memory previousURI = state.currentImageURI;
        state.currentImageURI = newImageURI;
        state.lastVisualRefresh = uint64(block.timestamp);

        emit VisualRefreshTriggered(tokenId, previousURI, newImageURI, state.healthScore);
    }

    function getHealthScore(uint256 tokenId) external view returns (uint256) {
        return _states[tokenId].healthScore;
    }

    function getLivingState(uint256 tokenId) external view returns (LivingState memory) {
        return _states[tokenId];
    }

    function getHistory(uint256 tokenId, uint256 limit)
        external view returns (StateSnapshot[] memory)
    {
        StateSnapshot[] storage full = _history[tokenId];
        uint256 count = limit < full.length ? limit : full.length;
        StateSnapshot[] memory result = new StateSnapshot[](count);

        // Return most recent entries first
        for (uint256 i = 0; i < count; i++) {
            result[i] = full[full.length - 1 - i];
        }
        return result;
    }

    function registerDataSource(
        uint256 tokenId,
        address oracle,
        DataSourceType sourceType,
        string calldata description
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _dataSources[tokenId].push(DataSource({
            oracle: oracle,
            sourceType: sourceType,
            description: description,
            registeredAt: uint64(block.timestamp),
            active: true
        }));

        emit DataSourceRegistered(tokenId, oracle, sourceType);
    }

    /// @notice Override tokenURI to return dynamic metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        // Returns a URI to an off-chain metadata server that constructs
        // JSON from on-chain LivingState. See Metadata Schema below.
        return string(abi.encodePacked(
            "https://api.zoo.ngo/living-nft/",
            Strings.toString(tokenId),
            "/metadata"
        ));
    }

    function _pushHistory(uint256 tokenId, LivingState storage state) internal {
        StateSnapshot[] storage history = _history[tokenId];

        // Circular buffer: overwrite oldest entry after MAX_HISTORY
        if (history.length >= MAX_HISTORY) {
            // Shift is gas-expensive; in production use a ring buffer index
            history[state.updateCount % MAX_HISTORY] = StateSnapshot({
                healthScore: state.healthScore,
                populationCount: state.populationCount,
                habitatQuality: state.habitatQuality,
                threatLevel: state.threatLevel,
                imageURI: state.currentImageURI,
                timestamp: state.lastUpdated
            });
        } else {
            history.push(StateSnapshot({
                healthScore: state.healthScore,
                populationCount: state.populationCount,
                habitatQuality: state.habitatQuality,
                threatLevel: state.threatLevel,
                imageURI: state.currentImageURI,
                timestamp: state.lastUpdated
            }));
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### AI Visual Engine Specification

The off-chain AI visual engine listens for `MetadataUpdated` events and generates new artwork:

```python
class LivingNFTVisualEngine:
    """
    Generates evolving NFT artwork based on real-time conservation data.
    Uses generative AI to produce images that reflect current health state.
    """

    # Health score thresholds mapped to visual styles
    VISUAL_PROFILES = {
        (9000, 10000): "thriving",    # Vibrant colors, dense vegetation, active wildlife
        (7000, 8999):  "healthy",     # Natural palette, balanced ecosystem depiction
        (5000, 6999):  "stressed",    # Muted tones, signs of habitat pressure
        (2500, 4999):  "declining",   # Desaturated, sparse vegetation, fewer animals
        (0, 2499):     "critical",    # Monochrome, barren landscape, emergency visual
    }

    def generate_visual(
        self,
        token_id: int,
        living_state: LivingState,
        species_profile: SpeciesProfile,
    ) -> str:
        """
        Generate AI artwork reflecting current conservation state.
        Returns IPFS URI of the new image.
        """
        profile = self._get_visual_profile(living_state.health_score)

        prompt = self._build_prompt(
            species=species_profile,
            profile=profile,
            population=living_state.population_count,
            habitat_quality=living_state.habitat_quality,
            threat_level=living_state.threat_level,
        )

        image = self.image_generator.generate(
            prompt=prompt,
            style=f"conservation_art_{profile}",
            seed=token_id,  # Deterministic per token for consistency
            base_image=living_state.base_image_uri,  # Style reference
        )

        ipfs_cid = self.ipfs_client.upload(image)
        return f"ipfs://{ipfs_cid}"

    def _build_prompt(
        self,
        species: SpeciesProfile,
        profile: str,
        population: int,
        habitat_quality: int,
        threat_level: ThreatLevel,
    ) -> str:
        base = f"Wildlife conservation artwork of {species.common_name} "
        base += f"({species.scientific_name}) in {species.primary_habitat}. "

        if profile == "thriving":
            base += "Vibrant ecosystem, lush vegetation, clear water. "
            base += f"Healthy population of approximately {population} individuals. "
        elif profile == "critical":
            base += "Stark, desaturated landscape showing ecosystem under severe stress. "
            base += f"Only {population} individuals remain. Urgent conservation need. "

        return base
```

### Metadata Schema

```json
{
  "name": "Living NFT: African Elephant - Amboseli Population",
  "description": "A living NFT that reflects the real-time conservation status of the Amboseli elephant population",
  "image": "ipfs://QmCurrentAIGeneratedArt...",
  "animation_url": "ipfs://QmTimelapseAnimation...",
  "external_url": "https://zoo.ngo/living/42",
  "living_nft": {
    "version": "1.0",
    "species": {
      "common_name": "African Elephant",
      "scientific_name": "Loxodonta africana",
      "iucn_status": "Endangered"
    },
    "current_state": {
      "health_score": 7250,
      "population_count": 1847,
      "habitat_quality": 6800,
      "threat_level": "Moderate",
      "last_updated": "2025-01-15T12:00:00Z"
    },
    "historical_trend": {
      "health_30d_change": +350,
      "population_90d_change": +23,
      "direction": "improving"
    },
    "data_sources": [
      {"type": "GPSCollar", "count": 34, "provider": "Save the Elephants"},
      {"type": "CameraTrap", "count": 128, "provider": "Amboseli Trust"},
      {"type": "Satellite", "provider": "Planet Labs", "resolution": "3m"}
    ],
    "visual": {
      "profile": "healthy",
      "base_image": "ipfs://QmOriginalBaseArt...",
      "current_image": "ipfs://QmCurrentAIGeneratedArt...",
      "last_refresh": "2025-01-15T06:00:00Z",
      "refresh_count": 47
    }
  }
}
```

### Oracle Data Feed Protocol

Oracles submit conservation data through a standardized payload:

```solidity
struct OraclePayload {
    uint256 tokenId;
    uint256 healthScore;
    uint256 populationCount;
    uint256 habitatQuality;
    ThreatLevel threatLevel;
    uint64 observationTimestamp;    // When the data was collected
    bytes32 dataHash;              // keccak256 of full off-chain data bundle
    bytes signature;               // Oracle signature for verification
}
```

Multiple oracles can be registered per token. A median aggregation strategy prevents any single oracle from manipulating the health score:

```solidity
function aggregateOracleData(
    uint256 tokenId,
    OraclePayload[] calldata payloads
) external {
    require(payloads.length >= 3, "Minimum 3 oracle reports required");
    // Sort health scores and take median
    // Verify each oracle signature against registered data sources
    // Apply the median values via updateMetadata
}
```

## Rationale

- **On-chain health scores** enable composability: other contracts (ZIP-203 governance, ZIP-202 badges) can read health scores to make decisions. Fully off-chain metadata would break this composability.
- **Off-chain visual generation** is necessary because AI image generation cannot run on-chain. The on-chain contract stores the IPFS CID of the generated image and emits events for verifiability.
- **Minimum update interval** of 1 hour prevents gas-wasteful frequent updates while remaining responsive to meaningful changes. Conservation data rarely changes meaningfully at sub-hour resolution.
- **Circular history buffer** caps storage growth. 365 entries at daily granularity provides one year of trend data without unbounded storage costs.
- **Multiple oracle sources** with median aggregation prevent single points of failure and manipulation in conservation data reporting.

## Backwards Compatibility

Living NFTs extend ERC-721 with additional state and methods. Standard ERC-721 operations (transfer, approve, balance queries) work unchanged. Marketplaces that read `tokenURI` will receive the dynamic metadata endpoint. Platforms that cache metadata should implement ERC-4906 (Metadata Update) event listeners to refresh when `MetadataUpdated` is emitted.

## Security Considerations

1. **Oracle Manipulation**: A compromised oracle could submit false health scores, causing misleading visual changes. Mitigation: minimum 3 oracles per token with median aggregation; oracle staking with slashing for provably false data.
2. **AI Visual Manipulation**: The VISUAL_ENGINE_ROLE holder could submit misleading artwork. Mitigation: visual refresh requires the health score to have changed since the last refresh; artwork is stored on IPFS for auditability.
3. **Data Privacy**: GPS collar data and camera trap images may reveal locations of endangered species, enabling poaching. Oracle data hashes reference redacted summaries per ZIP-510 (Species Protection Monitoring). Raw coordinates MUST NOT be stored on-chain.
4. **Gas Cost Accumulation**: Frequent updates across many tokens could become expensive. Implementations SHOULD batch updates across tokens and use L2 solutions for high-frequency data.
5. **Metadata Server Availability**: The `tokenURI` endpoint depends on an off-chain server. Implementations MUST ensure the server constructs metadata from on-chain state (which is always available), not from a separate database that could be lost.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-201: Species Adoption Certificate Protocol](./zip-0201-species-adoption-certificate-protocol.md)
4. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
5. [ERC-4906: EIP-721 Metadata Update Extension](https://eips.ethereum.org/EIPS/eip-4906)
6. [ERC-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
7. [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
8. [GBIF: Global Biodiversity Information Facility](https://www.gbif.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
