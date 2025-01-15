---
zip: 205
title: "Wildlife Photography NFT Standard"
description: "Verified wildlife photography NFTs with GPS metadata, camera attestation, and conservation provenance"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
created: 2025-01-15
tags: [nft, photography, wildlife, gps, verification]
requires: [0, 100, 200]
---

# ZIP-205: Wildlife Photography NFT Standard

## Abstract

This ZIP defines a standard for minting verified wildlife photography as NFTs with embedded GPS coordinates, camera hardware attestation, timestamp verification, and species identification metadata. The standard extends ZRC-721 (ZIP-200) with a `PhotographyRecord` struct that captures the full provenance chain from camera sensor to blockchain. A verification pipeline using Zoo AI (ZIP-401) performs automated species identification, and optional TEE (Trusted Execution Environment) attestation from supported camera hardware proves the image was not AI-generated or digitally manipulated before minting.

## Motivation

Wildlife photography is a multi-billion dollar industry, yet digital wildlife images suffer from:

1. **Provenance opacity**: No reliable way to prove when, where, or by whom a photo was taken.
2. **AI contamination**: AI-generated wildlife images are indistinguishable from real photographs, undermining trust in conservation documentation.
3. **No conservation link**: Wildlife photographers profit from species they document but rarely contribute to their protection.
4. **Metadata stripping**: Social media and resale platforms strip EXIF data, destroying provenance.

This standard creates a tamper-evident chain from camera to blockchain, ensuring every wildlife photo NFT is verifiably authentic and contributes to conservation.

## Specification

### 1. Photography Record

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

struct PhotographyRecord {
    // Location
    int256 latitude;             // Scaled 1e7 (e.g., -1.2921 = -12921000)
    int256 longitude;            // Scaled 1e7
    uint256 altitude;            // Meters above sea level
    string locationName;         // Human-readable (e.g., "Masai Mara, Kenya")

    // Timing
    uint64 captureTimestamp;     // UNIX timestamp from camera
    uint64 mintTimestamp;        // On-chain mint time

    // Camera attestation
    bytes32 cameraId;            // Hardware identifier hash
    string cameraModel;          // e.g., "Canon EOS R5"
    bytes32 imageHash;           // SHA-256 of original RAW file
    bytes teeAttestation;        // TEE signature proving camera origin (optional)

    // Species identification
    string speciesCommonName;
    string speciesScientific;
    uint8 aiConfidence;          // 0-100 confidence from ZIP-401
    IUCNStatus iucnStatus;

    // Photographer
    address photographer;
    string photographerName;
    string license;              // CC license identifier
}
```

### 2. Core Contract

```solidity
import {ZRC721Wildlife} from "./ZRC721Wildlife.sol";

contract WildlifePhotographyNFT is ZRC721Wildlife {
    bytes32 public constant PHOTOGRAPHER_ROLE = keccak256("PHOTOGRAPHER_ROLE");

    mapping(uint256 => PhotographyRecord) private _photos;
    mapping(bytes32 => bool) private _usedImageHashes;

    event PhotoMinted(
        uint256 indexed tokenId,
        address indexed photographer,
        int256 latitude,
        int256 longitude,
        string speciesScientific
    );

    function mintPhoto(
        PhotographyRecord calldata record,
        string calldata programId,
        uint16 conservationBps
    ) external onlyRole(PHOTOGRAPHER_ROLE) returns (uint256) {
        require(!_usedImageHashes[record.imageHash], "DUPLICATE_IMAGE");
        require(record.captureTimestamp <= block.timestamp, "FUTURE_TIMESTAMP");
        require(record.captureTimestamp >= block.timestamp - 365 days, "TOO_OLD");
        require(record.aiConfidence >= 70, "LOW_CONFIDENCE");

        _usedImageHashes[record.imageHash] = true;

        // Mint ZRC-721 with species metadata
        SpeciesRecord memory species = SpeciesRecord({
            commonName: record.speciesCommonName,
            scientificName: record.speciesScientific,
            kingdom: "Animalia",
            phylum: "",
            class_: "",
            order_: "",
            family: "",
            genus: "",
            species: "",
            iucnStatus: record.iucnStatus,
            taxonomyHash: keccak256(abi.encodePacked(record.speciesScientific)),
            habitatRegion: record.locationName,
            observationDate: record.captureTimestamp
        });

        uint256 tokenId = mintWildlife(msg.sender, species, programId, conservationBps);
        _photos[tokenId] = record;

        emit PhotoMinted(
            tokenId,
            msg.sender,
            record.latitude,
            record.longitude,
            record.speciesScientific
        );

        return tokenId;
    }

    function photoOf(uint256 tokenId) external view returns (PhotographyRecord memory) {
        return _photos[tokenId];
    }
}
```

### 3. Verification Pipeline

```
Photographer captures image
  |
  v
Camera writes EXIF + TEE attestation (if supported)
  |
  v
Upload to Zoo verification service
  |
  ├── SHA-256 hash computed on original RAW
  ├── GPS coordinates extracted and validated
  ├── Zoo AI (ZIP-401) identifies species + confidence
  ├── TEE attestation verified (if present)
  └── Duplicate hash check against on-chain registry
  |
  v
If all checks pass: mint transaction submitted
```

### 4. GPS Privacy Zones

For endangered species, exact GPS coordinates may enable poaching. The protocol supports privacy zones:

| IUCN Status | GPS Precision | Rationale |
|-------------|---------------|-----------|
| LC, NT | Full precision | Low risk |
| VU | 10km grid | Moderate protection |
| EN, CR | Country only | High protection |
| EW, EX | No location | Maximum protection |

The full-precision coordinates are stored encrypted on-chain, accessible only to authorized researchers via the Zoo research DAO (ZIP-603).

### 5. Metadata JSON Extension

```json
{
  "name": "Snow Leopard #17 - Hemis National Park",
  "image": "ipfs://QmPhoto...",
  "photography": {
    "camera_model": "Canon EOS R5",
    "capture_time": "2025-01-10T06:15:00Z",
    "location": {
      "name": "Hemis National Park, Ladakh",
      "latitude_grid": "34.0N",
      "longitude_grid": "77.5E",
      "precision": "10km"
    },
    "image_hash": "0xabcd...",
    "tee_attestation": true,
    "ai_species_id": {
      "species": "Panthera uncia",
      "confidence": 97
    }
  }
}
```

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum AI confidence for mint | 70% | ZooGovernor |
| Maximum image age for mint | 365 days | ZooGovernor |
| GPS privacy zones | Per IUCN status | ZooGovernor |
| Minimum conservation split | 10% (1000 bps) | ZooGovernor |
| TEE attestation required | Optional (higher trust tier) | ZooGovernor |

## Rationale

**Why GPS metadata on-chain?** Location data proves the photographer was physically present in the habitat. Combined with timestamp verification, this provides stronger authenticity evidence than metadata-free NFTs.

**Why privacy zones for endangered species?** Exact coordinates of critically endangered species could be exploited by poachers. The graduated privacy model balances scientific utility against species safety.

**Why 70% AI confidence minimum?** Below 70%, species misidentification is too likely. This threshold ensures taxonomic accuracy without being so strict that it excludes difficult field conditions (poor lighting, partial views).

**Why TEE attestation optional?** Most existing cameras lack TEE capability. Making it optional allows broader participation while rewarding verified hardware with a higher trust tier.

## Security Considerations

### Image Manipulation
Without TEE attestation, images could be digitally altered before hashing. The protocol's trust model is gradient: TEE-attested photos have the highest trust, AI-verified photos have moderate trust, and unverified uploads are not permitted.

### GPS Spoofing
Camera GPS can be spoofed. Cross-referencing with habitat range data (is this species plausible at this location?) and TEE attestation mitigate this. The Zoo AI pipeline flags geographically implausible species-location combinations.

### Poaching Risk
Even with privacy zones, metadata patterns (mint frequency from a region, species sequence) could reveal endangered species locations. The protocol should rate-limit queries and monitor for suspicious access patterns.

### Duplicate Detection
The `imageHash` uniqueness check prevents minting the same image twice. However, slightly modified images produce different hashes. Perceptual hashing via the Zoo AI pipeline provides a secondary duplicate detection layer.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
4. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
5. [C2PA: Coalition for Content Provenance and Authenticity](https://c2pa.org/)
6. [IUCN Red List](https://www.iucnredlist.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
