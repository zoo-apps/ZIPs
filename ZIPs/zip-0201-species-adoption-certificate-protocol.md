---
zip: 201
title: "Species Adoption Certificate Protocol"
description: "On-chain adoption certificates linking NFT ownership to real wildlife sponsorship with dynamic metadata"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper section 02 (Zoo Animal Utility)"
created: 2025-01-15
tags: [nft, adoption, sponsorship, dynamic-metadata, wildlife]
requires: [200, 500]
---

# ZIP-201: Species Adoption Certificate Protocol

## Abstract

This proposal defines the Species Adoption Certificate Protocol (SACP), a system of on-chain NFTs that represent verifiable sponsorship of individual wild animals. Each Adoption Certificate is a ZRC-721 token (ZIP-200) whose metadata updates dynamically as the sponsored animal's real-world status changes. The protocol connects NFT holders to conservation organizations via the Zoo Conservation Registry (ZIP-500/ZIP-550), routes sponsorship funds on-chain, and provides holders with living proof of their conservation impact through oracle-fed status updates.

## Motivation

Wildlife adoption programs are a proven fundraising mechanism for conservation organizations worldwide. However, existing programs suffer from:

1. **Opacity**: Donors receive a paper certificate and occasional email updates. There is no verifiable link between the donation and the animal's welfare.
2. **Illiquidity**: Traditional adoption certificates cannot be transferred, gifted, or resold. There is no secondary market that could amplify conservation funding.
3. **Stale Data**: Adoption certificates are static documents. The animal may have migrated, reproduced, or died, but the certificate never reflects this.
4. **No Composability**: Adoption certificates cannot interact with DeFi, governance, or gamification protocols.
5. **Attribution Gap**: Conservation organizations cannot prove to donors that funds were deployed to specific animals.

SACP solves these problems by issuing adoption certificates as dynamic ZRC-721 tokens with oracle-updated metadata, on-chain fund routing, and composability with the broader Zoo ecosystem.

## Specification

### Adoption Certificate Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdoptionCertificate {
    /// @notice Emitted when a new adoption certificate is minted
    event Adopted(
        uint256 indexed certificateId,
        address indexed adopter,
        bytes32 indexed animalId,
        string programId,
        uint256 sponsorshipAmount
    );

    /// @notice Emitted when animal status is updated by oracle
    event AnimalStatusUpdated(
        bytes32 indexed animalId,
        AnimalHealth newHealth,
        string location,
        uint64 timestamp
    );

    /// @notice Emitted when sponsorship is renewed
    event SponsorshipRenewed(
        uint256 indexed certificateId,
        uint256 amount,
        uint64 newExpiry
    );

    /// @notice Mint an adoption certificate by sponsoring an animal
    function adopt(
        bytes32 animalId,
        string calldata programId,
        uint64 duration
    ) external payable returns (uint256 certificateId);

    /// @notice Renew an existing sponsorship
    function renew(uint256 certificateId, uint64 additionalDuration) external payable;

    /// @notice Get the current status of the sponsored animal
    function animalStatus(bytes32 animalId) external view returns (AnimalRecord memory);

    /// @notice Get adoption details for a certificate
    function adoptionDetails(uint256 certificateId) external view returns (AdoptionRecord memory);

    /// @notice Check if a sponsorship is active
    function isActive(uint256 certificateId) external view returns (bool);
}
```

### Animal Record

Each tracked animal has an on-chain record updated by authorized conservation oracles.

```solidity
enum AnimalHealth {
    Unknown,            // No recent data
    Healthy,            // Normal observed condition
    Injured,            // Observed injury or illness
    InCare,             // Under veterinary care
    Released,           // Released after rehabilitation
    Breeding,           // Confirmed breeding activity
    Migrating,          // Seasonal migration detected
    Deceased            // Confirmed death
}

struct AnimalRecord {
    bytes32 animalId;           // Unique identifier (hash of tracking ID)
    string individualName;      // e.g. "Nalini" (if named by conservation org)
    string scientificName;      // e.g. "Panthera tigris"
    string commonName;          // e.g. "Bengal Tiger"
    AnimalHealth health;        // Current health status
    string lastKnownLocation;  // GPS coordinates or region name
    uint64 lastObserved;       // UNIX timestamp of last sighting
    uint32 estimatedAge;       // Estimated age in months
    string photoURI;           // Latest photo (IPFS/Arweave)
    uint256 totalSponsors;     // Number of active sponsors
    uint256 totalFunded;       // Cumulative funding in wei
    bytes32 speciesHash;       // Links to ZRC-721 SpeciesRecord taxonomy
}
```

### Adoption Record

```solidity
struct AdoptionRecord {
    uint256 certificateId;      // Token ID
    address adopter;            // Original sponsor
    bytes32 animalId;           // Linked animal
    string programId;           // Conservation program (ZIP-500)
    uint256 sponsorshipAmount;  // Amount paid
    uint64 startDate;           // Sponsorship start
    uint64 expiryDate;          // Sponsorship expiry
    uint16 conservationBps;     // Split to conservation (minimum per ZIP-200)
    bool active;                // Whether sponsorship is current
}
```

### Oracle Interface

Conservation organizations push animal status updates via an authorized oracle contract.

```solidity
interface IConservationOracle {
    /// @notice Update the status of a tracked animal
    /// @dev Only callable by authorized conservation data providers
    function updateAnimalStatus(
        bytes32 animalId,
        AnimalHealth health,
        string calldata location,
        uint64 observationTime,
        string calldata photoURI,
        bytes calldata signature
    ) external;

    /// @notice Register a new animal for tracking
    function registerAnimal(
        bytes32 animalId,
        string calldata individualName,
        string calldata scientificName,
        string calldata commonName,
        uint32 estimatedAge,
        string calldata initialLocation
    ) external;

    /// @notice Verify an oracle data provider
    function isAuthorizedProvider(address provider) external view returns (bool);
}
```

### Reference Implementation

```solidity
contract AdoptionCertificate is ZRC721Wildlife, IAdoptionCertificate {
    IConservationOracle public oracle;

    mapping(bytes32 => AnimalRecord) private _animals;
    mapping(uint256 => AdoptionRecord) private _adoptions;
    mapping(bytes32 => uint256[]) private _animalCertificates; // animalId => certificateIds

    uint256 public minimumSponsorshipWei = 0.01 ether;
    uint64 public constant MIN_DURATION = 30 days;
    uint64 public constant MAX_DURATION = 365 days;

    constructor(
        address registry,
        address oracleAddr
    ) ZRC721Wildlife(registry) {
        oracle = IConservationOracle(oracleAddr);
    }

    function adopt(
        bytes32 animalId,
        string calldata programId,
        uint64 duration
    ) external payable returns (uint256 certificateId) {
        require(msg.value >= minimumSponsorshipWei, "Below minimum sponsorship");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        require(_animals[animalId].animalId != bytes32(0), "Animal not registered");

        AnimalRecord storage animal = _animals[animalId];

        // Build species record from animal data
        SpeciesRecord memory speciesRec = SpeciesRecord({
            commonName: animal.commonName,
            scientificName: animal.scientificName,
            kingdom: "Animalia",
            phylum: "Chordata",
            class_: "",
            order_: "",
            family: "",
            genus: "",
            species: "",
            iucnStatus: IUCNStatus.NotEvaluated,
            taxonomyHash: animal.speciesHash,
            habitatRegion: animal.lastKnownLocation,
            observationDate: uint64(block.timestamp)
        });

        certificateId = mintWildlife(msg.sender, speciesRec, programId, MIN_CONSERVATION_BPS);

        _adoptions[certificateId] = AdoptionRecord({
            certificateId: certificateId,
            adopter: msg.sender,
            animalId: animalId,
            programId: programId,
            sponsorshipAmount: msg.value,
            startDate: uint64(block.timestamp),
            expiryDate: uint64(block.timestamp) + duration,
            conservationBps: MIN_CONSERVATION_BPS,
            active: true
        });

        _animalCertificates[animalId].push(certificateId);
        animal.totalSponsors++;
        animal.totalFunded += msg.value;

        // Route funds to conservation program
        ConservationSplit memory split = conservationSplitOf(certificateId);
        (bool sent, ) = split.recipient.call{value: msg.value}("");
        require(sent, "Fund transfer failed");

        emit Adopted(certificateId, msg.sender, animalId, programId, msg.value);
        return certificateId;
    }

    function renew(uint256 certificateId, uint64 additionalDuration) external payable {
        AdoptionRecord storage adoption = _adoptions[certificateId];
        require(ownerOf(certificateId) == msg.sender, "Not certificate owner");
        require(msg.value >= minimumSponsorshipWei, "Below minimum");
        require(additionalDuration >= MIN_DURATION, "Duration too short");

        if (adoption.expiryDate < block.timestamp) {
            adoption.expiryDate = uint64(block.timestamp) + additionalDuration;
        } else {
            adoption.expiryDate += additionalDuration;
        }

        adoption.active = true;
        adoption.sponsorshipAmount += msg.value;
        _animals[adoption.animalId].totalFunded += msg.value;

        ConservationSplit memory split = conservationSplitOf(certificateId);
        (bool sent, ) = split.recipient.call{value: msg.value}("");
        require(sent, "Fund transfer failed");

        emit SponsorshipRenewed(certificateId, msg.value, adoption.expiryDate);
    }

    function animalStatus(bytes32 animalId) external view returns (AnimalRecord memory) {
        return _animals[animalId];
    }

    function adoptionDetails(uint256 certificateId) external view returns (AdoptionRecord memory) {
        return _adoptions[certificateId];
    }

    function isActive(uint256 certificateId) external view returns (bool) {
        AdoptionRecord memory adoption = _adoptions[certificateId];
        return adoption.active && adoption.expiryDate >= block.timestamp;
    }
}
```

### Dynamic Metadata

The `tokenURI` for adoption certificates MUST return metadata that reflects the current animal status. Metadata servers SHOULD query the on-chain `AnimalRecord` and return updated JSON:

```json
{
  "name": "Adoption Certificate: Nalini the Bengal Tiger",
  "description": "Active sponsorship of Nalini, a Bengal Tiger tracked in Ranthambore National Park",
  "image": "ipfs://QmLatestPhoto...",
  "animation_url": "ipfs://QmStatusAnimation...",
  "external_url": "https://zoo.ngo/adopt/nalini",
  "adoption": {
    "animal_id": "0x...",
    "individual_name": "Nalini",
    "species": "Panthera tigris",
    "health": "Healthy",
    "last_location": "26.0173N, 76.5026E",
    "last_observed": "2025-01-12T14:22:00Z",
    "estimated_age_months": 48,
    "total_sponsors": 127,
    "total_funded_eth": "12.7"
  },
  "sponsorship": {
    "start_date": "2025-01-15T00:00:00Z",
    "expiry_date": "2026-01-15T00:00:00Z",
    "amount_eth": "0.1",
    "program": "ranthambore-tiger-project",
    "active": true
  },
  "species": {
    "common_name": "Bengal Tiger",
    "scientific_name": "Panthera tigris",
    "iucn_status": "EN"
  }
}
```

## Rationale

- **Individual animal tracking** rather than species-level sponsorship creates a personal connection between sponsors and wildlife, increasing retention and engagement.
- **Duration-based sponsorship** with explicit expiry ensures ongoing funding rather than one-time payments. Renewals are incentivized by the dynamic metadata that only active sponsors receive updates for.
- **Oracle-fed status updates** bridge the gap between on-chain certificates and real-world conservation data. The oracle authorization model ensures only verified conservation organizations can push updates.
- **Transferable certificates** allow secondary market activity. Unlike traditional adoption programs, ZRC-721 certificates can be gifted or resold, with conservation splits (ZIP-200) ensuring every transaction funds wildlife protection.
- **Composability** with Zoo DeFi (Farm.sol, ZKStaking) means adoption certificates can be staked for governance weight, creating aligned incentives between conservation sponsors and ecosystem governance.

## Backwards Compatibility

SACP builds on ZRC-721 (ZIP-200) and is fully compatible with ERC-721. Existing Zoo marketplace contracts (Market.sol, Auction.sol) can list and trade adoption certificates. The conservation split mechanism uses EIP-2981 royalties, which Zoo Market.sol already supports.

## Security Considerations

1. **Oracle Trust**: Conservation oracles are a trusted component. Compromise of an oracle private key could lead to false status updates. Mitigation: multi-sig oracle wallets, time-delay on status changes to `Deceased`, and DAO override capability.
2. **Fund Routing**: Sponsorship funds are sent directly to conservation program addresses. These addresses MUST be validated against the ConservationRegistry (ZIP-500). A malicious registry update could redirect funds.
3. **Grief via Stale Data**: If an oracle stops updating, animal status becomes stale. The `lastObserved` timestamp allows UIs to display a staleness warning.
4. **Privacy**: GPS coordinates of endangered species MUST be obfuscated to region-level granularity to prevent poaching. Oracle providers MUST NOT publish precise coordinates for critically endangered species.
5. **Sponsorship Expiry**: Expired certificates remain as NFTs but `isActive` returns false. UIs SHOULD clearly distinguish active from expired sponsorships to prevent misleading claims.

## References

1. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
2. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
3. [ZIP-550: Conservation Standards Alignment](./zip-0550-conservation-standards-alignment.md)
4. [LP-3721: LRC-721 NFT Standard](https://github.com/luxfi/lps/blob/main/LPs/lp-3721.md)
5. [LP-3211: Media Content NFT](https://github.com/luxfi/lps/blob/main/LPs/lp-3211.md)
6. [LP-7981: NFT Royalties](https://github.com/luxfi/lps/blob/main/LPs/lp-7981.md)
7. [HIP-0048: Decentralized Identity](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0048.md)
8. [Chainlink Data Feeds](https://docs.chain.link/data-feeds)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
