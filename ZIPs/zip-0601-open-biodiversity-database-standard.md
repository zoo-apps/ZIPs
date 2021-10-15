---
zip: 601
title: "Open Biodiversity Database Standard"
description: "Open-access biodiversity database on IPFS with on-chain indexing for species observations, genetic data, and habitat surveys."
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Research
originated: 2021-10
traces-from: "Whitepaper section 23 (Open Source)"
follow-on: [zoo-data-commons]
created: 2025-01-15
tags: [biodiversity, ipfs, open-data, gbif, conservation]
requires: [540, 560, 600]
---

# ZIP-601: Open Biodiversity Database Standard

## Abstract

This ZIP specifies an open-access biodiversity database built on IPFS with on-chain indexing via the Zoo L2. The database stores species observations, genetic sequences, habitat survey data, and ecological metadata in standardized, machine-readable formats. It provides interoperability with the Global Biodiversity Information Facility (GBIF) through bidirectional data adapters and implements fine-grained access control for sensitive records (e.g., endangered species locations) per ZIP-540. All data is content-addressed, cryptographically attested, and permanently available.

## Motivation

Biodiversity data is fragmented across thousands of institutional databases, government agencies, and research projects. This fragmentation creates several problems:

1. **Discoverability**: Researchers cannot efficiently find existing observations for a given species or region. Duplicate data collection wastes limited conservation resources.
2. **Interoperability**: Different databases use incompatible schemas, taxonomies, and coordinate systems. Merging datasets requires extensive manual harmonization.
3. **Permanence**: Institutional databases go offline when funding ends. An estimated 20% of biodiversity datasets cited in published papers are no longer accessible at their original URLs.
4. **Provenance**: Data lineage is poorly tracked. When observations are copied between databases, attribution is lost and errors propagate without correction.
5. **Access control**: Sensitive data (endangered species locations, indigenous knowledge) requires granular permissions that most open databases cannot provide.

Zoo Labs Foundation operates at the intersection of AI and conservation. Our AI models for species identification, population modeling, and habitat assessment require large, high-quality, standardized datasets. This ZIP creates the data infrastructure layer that feeds both human researchers and machine learning pipelines.

### Cross-Ecosystem Context

- **HIP-0074** (Hanzo SBOM): Software Bill of Materials patterns for tracking data provenance and component lineage.
- **LP-7102** (Lux Immutable Training Ledger): On-chain audit trail for datasets used in AI model training.
- **ZIP-560** (Evidence Locker Index): Existing evidence cataloging system that this database extends for biodiversity data.

## Specification

### 1. Data Model

#### 1.1 Core Entities

```
BiodiversityRecord
    |
    +-- Observation          (species sighting, count, behavior)
    +-- GeneticSample        (DNA/RNA sequence, markers)
    +-- HabitatSurvey        (vegetation, soil, water, climate)
    +-- AcousticRecord       (bioacoustic recording + classification)
    +-- CameraTrapCapture    (image/video + AI classification)
```

#### 1.2 Observation Schema

```json
{
  "recordId": "bytes32",
  "recordType": "enum(OBSERVATION, GENETIC, HABITAT, ACOUSTIC, CAMERA_TRAP)",
  "taxon": {
    "scientificName": "string",
    "taxonId": "uint64",
    "taxonomySource": "enum(GBIF, ITIS, NCBI, COL)",
    "vernacularName": "string",
    "taxonRank": "enum(KINGDOM, PHYLUM, CLASS, ORDER, FAMILY, GENUS, SPECIES, SUBSPECIES)"
  },
  "location": {
    "latitude": "int64",
    "longitude": "int64",
    "precision": "uint32",
    "elevation": "int32",
    "coordinateSystem": "string",
    "locality": "string",
    "countryCode": "string",
    "sensitivityLevel": "enum(OPEN, FUZZY_10KM, FUZZY_100KM, RESTRICTED)"
  },
  "temporal": {
    "eventDate": "uint64",
    "eventEndDate": "uint64",
    "timeZone": "string"
  },
  "observer": {
    "address": "address",
    "institution": "string",
    "protocol": "string"
  },
  "evidence": {
    "ipfsCids": ["string"],
    "mediaType": ["string"],
    "license": "string"
  },
  "quality": {
    "basisOfRecord": "enum(HUMAN_OBSERVATION, MACHINE_OBSERVATION, PRESERVED_SPECIMEN, MATERIAL_SAMPLE)",
    "verificationStatus": "enum(UNVERIFIED, COMMUNITY_VERIFIED, EXPERT_VERIFIED)",
    "qualityFlags": ["string"]
  },
  "attestation": {
    "signature": "bytes",
    "timestamp": "uint64",
    "deviceFingerprint": "bytes32"
  },
  "ipfsCid": "string",
  "onChainIndex": "bytes32"
}
```

#### 1.3 Genetic Sample Schema

```json
{
  "recordId": "bytes32",
  "parentObservationId": "bytes32",
  "sequenceType": "enum(DNA_BARCODE, WHOLE_GENOME, METABARCODE, EDNA, RNA)",
  "marker": "string",
  "sequenceCid": "string",
  "qualityMetrics": {
    "phredScore": "uint8",
    "coverage": "float",
    "length": "uint32"
  },
  "accession": {
    "genbank": "string",
    "bold": "string"
  },
  "samplingProtocol": "string",
  "preservationMethod": "string"
}
```

#### 1.4 Habitat Survey Schema

```json
{
  "recordId": "bytes32",
  "surveyType": "enum(VEGETATION, AQUATIC, SOIL, CLIMATE, MULTI)",
  "plotSize": "uint32",
  "plotShape": "string",
  "measurements": [
    {
      "parameter": "string",
      "value": "float",
      "unit": "string",
      "method": "string"
    }
  ],
  "speciesInventory": ["bytes32"],
  "landCoverClass": "string",
  "habitatType": "string",
  "disturbanceHistory": "string",
  "satelliteImageCid": "string"
}
```

### 2. On-Chain Index

The on-chain index stores minimal metadata for discovery and verification. Full records live on IPFS.

#### 2.1 Index Entry

```solidity
struct IndexEntry {
    bytes32 recordId;
    uint8 recordType;
    uint64 taxonId;
    int64 latitude;       // Degrees * 1e6 (microdegrees)
    int64 longitude;      // Degrees * 1e6 (microdegrees)
    uint64 eventDate;
    address contributor;
    bytes32 ipfsCid;
    uint8 sensitivityLevel;
    uint8 verificationStatus;
    uint64 indexedAt;
}
```

#### 2.2 Index Contract

```solidity
interface IBiodiversityIndex {
    function submitRecord(IndexEntry calldata entry, bytes calldata attestation) external;
    function batchSubmit(IndexEntry[] calldata entries, bytes[] calldata attestations) external;
    function updateVerification(bytes32 recordId, uint8 newStatus) external;
    function queryByTaxon(uint64 taxonId) external view returns (bytes32[] memory);
    function queryByBoundingBox(int64 minLat, int64 maxLat, int64 minLon, int64 maxLon) external view returns (bytes32[] memory);
    function queryByContributor(address contributor) external view returns (bytes32[] memory);
    function getRecord(bytes32 recordId) external view returns (IndexEntry memory);
}
```

Gas costs are minimized by storing only the index on-chain. Spatial queries use a geohash-based Merkle tree for efficient bounding-box lookups.

### 3. IPFS Storage Layer

#### 3.1 Content Structure

```
/biodiversity/<recordId>/
    record.json          # Full record per schema above
    media/               # Photos, audio, video
        <hash>.jpg
        <hash>.wav
    provenance.json      # Data lineage chain
    attestation.json     # Cryptographic attestation
```

#### 3.2 Pinning Requirements

| Data Tier | Pinning Requirement | Redundancy |
|-----------|---------------------|------------|
| **Core records** | Zoo pinning cluster + 2 independent services | 3x minimum |
| **Media evidence** | Zoo pinning cluster + 1 independent service | 2x minimum |
| **Genetic sequences** | Zoo pinning cluster + GenBank mirror | 2x + institutional |
| **Sensitive records** | Encrypted, Zoo pinning cluster only | 1x + encrypted backup |

#### 3.3 Encryption for Sensitive Data

Records with sensitivityLevel > OPEN are encrypted before IPFS upload:

1. Record encrypted with AES-256-GCM using a per-record key.
2. Per-record key encrypted to authorized accessor public keys.
3. Key management via Zoo KMS (ZIP-014) integration.
4. Location data is fuzzed to the specified precision before indexing.

### 4. GBIF Interoperability

#### 4.1 Data Mapping

| Zoo Field | GBIF Darwin Core Term | Notes |
|-----------|----------------------|-------|
| `taxon.scientificName` | `scientificName` | Direct mapping |
| `taxon.taxonId` (GBIF source) | `taxonKey` | Direct mapping |
| `location.latitude` | `decimalLatitude` | Convert from microdegrees |
| `location.longitude` | `decimalLongitude` | Convert from microdegrees |
| `temporal.eventDate` | `eventDate` | Unix timestamp to ISO 8601 |
| `quality.basisOfRecord` | `basisOfRecord` | Direct enum mapping |
| `observer.address` | `recordedBy` | Resolve to name via registry |
| `evidence.license` | `license` | Direct mapping |

#### 4.2 Bidirectional Sync

```
Zoo Database                        GBIF
     |                                |
     |-- Export adapter (DwC-A) ----->|   (Push new Zoo records to GBIF)
     |                                |
     |<--- Import adapter (API) -----|   (Pull GBIF records into Zoo index)
     |                                |
     |-- Deduplication engine ------->|   (Match records by coordinates + date + taxon)
```

- **Export**: Zoo records with `sensitivityLevel = OPEN` and `license` compatible with GBIF are exported as Darwin Core Archive (DwC-A) files and published to GBIF via their IPT (Integrated Publishing Toolkit).
- **Import**: GBIF records relevant to Zoo conservation focus areas are indexed (metadata only) to provide unified search.
- **Deduplication**: A fuzzy matching engine prevents duplicate records when the same observation exists in both systems.

### 5. Data Quality Pipeline

```
Raw submission
    |
    v
Automated validation (schema, coordinates, taxonomy)
    |
    v
AI classification (species ID confidence, anomaly detection)
    |
    v
Community verification (citizen science consensus)
    |
    v
Expert verification (specialist review for flagged records)
    |
    v
Published record (on-chain index updated)
```

| Quality Check | Automated | Description |
|---------------|-----------|-------------|
| **Schema validation** | Yes | All required fields present and valid |
| **Coordinate validation** | Yes | Coordinates within country bounds, not in ocean (for terrestrial) |
| **Taxonomy validation** | Yes | Scientific name resolves to accepted taxon |
| **Temporal validation** | Yes | Date not in future, reasonable for species/location |
| **Duplicate detection** | Yes | Fuzzy match against existing records |
| **AI species verification** | Yes | Image/audio classified by Zoo AI models |
| **Range check** | Yes | Species within known geographic range |
| **Expert review** | No | Required for new range records, rare species, genetic data |

### 6. Access Control

Access control follows ZIP-540 data governance principles:

| Level | Location Precision | Record Access | Who |
|-------|-------------------|---------------|-----|
| **OPEN** | Exact coordinates | Full record | Anyone |
| **FUZZY_10KM** | 10km grid cell | Full record minus exact location | Registered users |
| **FUZZY_100KM** | 100km grid cell | Metadata only | Registered users |
| **RESTRICTED** | Country only | Metadata on request | Authorized researchers |

Sensitivity levels are set by the contributor and reviewed by data stewards. Records involving CITES Appendix I species default to FUZZY_10KM minimum.

## Rationale

1. **IPFS over centralized storage**: Content-addressed storage ensures data permanence regardless of any single institution's funding status. The on-chain index provides discovery without storing large payloads on the L2.
2. **Darwin Core compatibility**: GBIF's Darwin Core standard is the de facto standard for biodiversity data exchange. Native compatibility ensures Zoo data is immediately usable by the global biodiversity research community.
3. **Layered access control**: Conservation data requires nuanced access. Exact locations of critically endangered species are weaponized by poachers. The four-tier system balances openness with protection.
4. **AI in the quality pipeline**: Zoo's AI models for species identification can pre-screen submissions, reducing the burden on expert reviewers while catching common errors (misidentified species, GPS drift).
5. **On-chain attestation**: Cryptographic attestation of observations creates an immutable provenance chain, critical for scientific reproducibility and for training AI models with verified data (per LP-7102).

## Security Considerations

- **Location data leakage**: Even fuzzy coordinates can be de-anonymized through intersection attacks with other datasets. The protocol requires minimum fuzz levels per IUCN threat category and prohibits exact coordinates for Critically Endangered species.
- **Genetic data sensitivity**: Genetic sequences for commercially valuable species (e.g., medicinal plants) could be exploited for biopiracy. Access controls and benefit-sharing agreements per the Nagoya Protocol are required for genetic records.
- **Data poisoning**: Malicious actors could submit false observations to corrupt AI training data. The multi-stage quality pipeline (automated + community + expert) and contributor reputation (ZIP-602) mitigate this risk.
- **Attestation forgery**: Device fingerprinting and GPS spoofing are possible. The protocol treats attestation as evidence of submission, not proof of truth. Verification status is the authoritative quality signal.
- **IPFS content removal**: While IPFS is designed for permanence, unpinned content will eventually be garbage collected. The triple-redundancy pinning requirement and institutional mirrors (GenBank, GBIF) provide resilience.
- **Smart contract vulnerabilities**: The index contract handles no funds but controls access to sensitive location data. Access control logic must be audited and tested against privilege escalation attacks.

## References

- [ZIP-540](zip-0540-research-ethics-data-governance.md): Research Ethics & Data Governance
- [ZIP-560](zip-0560-evidence-locker-index.md): Evidence Locker Index
- [ZIP-600](zip-0600-desci-protocol-framework.md): DeSci Protocol Framework
- [ZIP-602](zip-0602-citizen-science-contribution-protocol.md): Citizen Science Contribution Protocol
- HIP-0074: Hanzo Software Bill of Materials
- LP-7102: Lux Immutable Training Ledger
- GBIF. "Darwin Core Standard." https://dwc.tdwg.org/
- Wilkinson, M. D. et al. "The FAIR Guiding Principles for scientific data management and stewardship." Scientific Data 3, 160018 (2016).
- CITES. "Convention on International Trade in Endangered Species." https://cites.org/
- CBD. "Nagoya Protocol on Access and Benefit-sharing." https://cbd.int/abs/

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
