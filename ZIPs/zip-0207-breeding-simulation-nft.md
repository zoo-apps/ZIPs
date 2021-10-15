---
zip: 207
title: "Breeding Simulation NFT"
description: "NFT breeding mechanics for virtual wildlife education with genetics-based trait inheritance"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: NFT
originated: 2021-10
traces-from: "Whitepaper section 11 (Feeding, Growing, Breeding)"
created: 2025-01-15
tags: [nft, breeding, simulation, education, genetics]
requires: [0, 100, 200, 300]
---

# ZIP-207: Breeding Simulation NFT

## Abstract

This ZIP defines a breeding mechanic for ZRC-721 wildlife NFTs that simulates genetic inheritance for educational purposes. Two parent NFTs of compatible species can produce offspring with traits derived from a simplified Mendelian genetics model. The system teaches users about genetic diversity, endangered species breeding programs, and conservation genetics while generating new NFTs whose minting fees fund real-world breeding and reintroduction programs. Offspring inherit species metadata from parents, with phenotypic traits (coloration, size, markings) determined by a verifiable random function (VRF) weighted by parental genotypes.

## Motivation

Captive breeding programs are critical for endangered species recovery, yet public understanding of conservation genetics is low. A gamified breeding simulation addresses this:

1. **Education**: Users learn about dominant/recessive traits, genetic bottlenecks, inbreeding depression, and minimum viable populations through interactive gameplay.
2. **Awareness**: Each virtual breeding event surfaces real-world information about the species' conservation status, habitat, and breeding challenges.
3. **Funding**: Breeding fees directly fund real-world captive breeding and species reintroduction programs via ZIP-500 verified recipients.
4. **Engagement**: Collectible offspring with rare trait combinations drive ongoing engagement with conservation content.

## Specification

### 1. Genotype System

Each wildlife NFT carries a genotype of 8 gene loci, each with two alleles (diploid):

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

struct Genotype {
    uint8[8] alleleA;    // First allele per locus (0-255)
    uint8[8] alleleB;    // Second allele per locus (0-255)
}

struct Phenotype {
    string coloration;       // e.g., "melanistic", "leucistic", "standard"
    string pattern;          // e.g., "spotted", "striped", "solid"
    string size;             // "small", "medium", "large"
    string markings;         // Unique identifiers
    uint8 fitnessScore;     // 0-100, affects breeding success
    uint8 rarityTier;       // 1-5, derived from trait rarity
}
```

### 2. Trait Inheritance

```
Parent A genotype: [A1a, A1b] at each locus
Parent B genotype: [B1a, B1b] at each locus

Offspring receives:
  - One random allele from Parent A (A1a or A1b, 50/50 via VRF)
  - One random allele from Parent B (B1a or B1b, 50/50 via VRF)
```

Dominance rules per locus determine phenotype:
- Locus 0: Coloration (complete dominance)
- Locus 1: Pattern (co-dominance)
- Locus 2: Size (quantitative, additive)
- Locus 3-5: Species-specific traits
- Locus 6: Fitness modifier
- Locus 7: Rare mutation chance

### 3. Breeding Contract

```solidity
import {VRFConsumerBase} from "./VRFConsumerBase.sol";

contract BreedingSimulation is VRFConsumerBase {
    struct BreedingPair {
        uint256 parentA;
        uint256 parentB;
        address breeder;
        uint256 requestId;
        bool fulfilled;
    }

    uint256 public breedingFee;
    uint256 public cooldownPeriod;          // Seconds between breeds per NFT
    uint16 public conservationFeeBps;       // Share of fee to conservation

    mapping(uint256 => Genotype) public genotypes;
    mapping(uint256 => uint256) public lastBreedTime;
    mapping(uint256 => uint8) public generation;
    mapping(uint256 => BreedingPair) public pendingBreeds;

    event BreedingInitiated(uint256 parentA, uint256 parentB, address breeder);
    event OffspringBorn(
        uint256 indexed offspringId,
        uint256 indexed parentA,
        uint256 indexed parentB,
        uint8 rarityTier,
        uint8 generation
    );

    function breed(uint256 parentA, uint256 parentB) external returns (uint256 requestId) {
        require(ownerOf(parentA) == msg.sender, "NOT_OWNER_A");
        require(ownerOf(parentB) == msg.sender || _isApprovedBreeder(parentB, msg.sender), "NOT_OWNER_B");
        require(_isCompatibleSpecies(parentA, parentB), "INCOMPATIBLE");
        require(block.timestamp >= lastBreedTime[parentA] + cooldownPeriod, "COOLDOWN_A");
        require(block.timestamp >= lastBreedTime[parentB] + cooldownPeriod, "COOLDOWN_B");
        require(!_isInbred(parentA, parentB), "INBREEDING_BLOCKED");

        // Collect fee
        IERC20(zusd).transferFrom(msg.sender, address(this), breedingFee);
        uint256 conservationShare = (breedingFee * conservationFeeBps) / 10000;
        IERC20(zusd).transfer(conservationDAO, conservationShare);

        // Request VRF for genetic randomness
        requestId = requestRandomness();

        pendingBreeds[requestId] = BreedingPair({
            parentA: parentA,
            parentB: parentB,
            breeder: msg.sender,
            requestId: requestId,
            fulfilled: false
        });

        lastBreedTime[parentA] = block.timestamp;
        lastBreedTime[parentB] = block.timestamp;

        emit BreedingInitiated(parentA, parentB, msg.sender);
    }

    function fulfillRandomness(uint256 requestId, uint256 randomness) internal override {
        BreedingPair storage pair = pendingBreeds[requestId];
        require(!pair.fulfilled, "ALREADY_FULFILLED");
        pair.fulfilled = true;

        Genotype memory offspringGenotype = _inheritGenes(
            genotypes[pair.parentA],
            genotypes[pair.parentB],
            randomness
        );

        Phenotype memory phenotype = _expressGenotype(offspringGenotype);
        uint8 gen = max(generation[pair.parentA], generation[pair.parentB]) + 1;

        uint256 offspringId = _mintOffspring(pair.breeder, offspringGenotype, phenotype, gen);

        emit OffspringBorn(offspringId, pair.parentA, pair.parentB, phenotype.rarityTier, gen);
    }

    function _inheritGenes(
        Genotype memory a,
        Genotype memory b,
        uint256 randomness
    ) internal pure returns (Genotype memory offspring) {
        for (uint8 i = 0; i < 8; i++) {
            // Select one allele from each parent
            uint8 fromA = (uint8(randomness >> (i * 4)) & 1) == 0 ? a.alleleA[i] : a.alleleB[i];
            uint8 fromB = (uint8(randomness >> (i * 4 + 2)) & 1) == 0 ? b.alleleA[i] : b.alleleB[i];

            // Rare mutation (1% chance per locus)
            if (uint8(randomness >> (i * 4 + 3)) % 100 == 0) {
                fromA = uint8(randomness >> (32 + i * 8));
            }

            offspring.alleleA[i] = fromA;
            offspring.alleleB[i] = fromB;
        }
    }

    function _isInbred(uint256 a, uint256 b) internal view returns (bool) {
        // Check if parents share a common ancestor within 3 generations
        return false; // Simplified; full implementation tracks lineage tree
    }

    function max(uint8 a, uint8 b) internal pure returns (uint8) {
        return a > b ? a : b;
    }
}
```

### 4. Inbreeding Prevention

The protocol tracks a lineage tree up to 3 generations deep. Breeding is blocked if:
- Parents share a common grandparent (coefficient of inbreeding > 0.125).
- This teaches users about genetic diversity and the importance of outbreeding in small populations.

### 5. Educational Content

Each breeding event generates an educational card:
- Real-world species breeding program status.
- Genetic diversity statistics for the species.
- Conservation challenges specific to captive breeding.
- Link to the funded conservation program.

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Breeding fee | 5 ZUSD | ZooGovernor |
| Conservation fee share | 60% of breeding fee | ZooGovernor |
| Cooldown period | 7 days | ZooGovernor |
| Maximum generation | 10 | ZooGovernor |
| Inbreeding coefficient limit | 0.125 | ZooGovernor |
| Mutation rate | 1% per locus | ZooGovernor |

## Rationale

**Why simplified Mendelian genetics?** Full population genetics models are too complex for a gamified experience. The 8-locus diploid model captures the core concepts (dominance, recombination, mutation) while remaining computationally tractable on-chain.

**Why block inbreeding?** Inbreeding depression is a real threat to endangered species. The game mechanic mirrors real-world captive breeding programs that carefully manage genetic diversity, teaching users why this matters.

**Why VRF for randomness?** Verifiable random functions ensure breeding outcomes are unpredictable and provably fair. No one -- including the contract deployer -- can predict or manipulate offspring traits.

**Why 60% conservation fee?** The primary purpose is conservation education and funding. Creators and the protocol take a minority share to sustain operations while maximizing conservation impact.

## Security Considerations

### VRF Manipulation
The VRF provider must be trusted. Using Zoo's own VRF (derived from the Lux consensus) or Chainlink VRF on the Zoo L2 ensures randomness integrity.

### Trait Rarity Sniping
If trait rarity is known in advance, users could selectively breed for rare traits to flip for profit. The VRF ensures randomness, and the cooldown period limits breeding throughput.

### Generation Inflation
Without a generation cap, unlimited breeding could flood the market. The maximum generation limit (10) and increasing cooldown per generation control supply.

### Economic Sustainability
If breeding fees are too low, conservation funding is insufficient. If too high, user engagement drops. Governance should monitor participation rates and adjust fees to maintain both engagement and funding goals.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-200: ZRC-721 Wildlife NFT Standard](./zip-0200-zrc-721-wildlife-nft-standard.md)
3. [ZIP-300: Virtual Habitat Simulation](./zip-0300-virtual-habitat-simulation-protocol.md)
4. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
5. Frankham, R., "Genetics and Conservation Biology," 2010
6. [IUCN Guidelines on Captive Breeding](https://www.iucn.org/resources/publication/iucn-technical-guidelines-management-ex-situ-populations-conservation)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
