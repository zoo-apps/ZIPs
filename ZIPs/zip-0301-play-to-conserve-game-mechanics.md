---
zip: 301
title: "Play-to-Conserve Game Mechanics"
description: "Game mechanics standard where player actions generate real conservation funding with educational token rewards"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
originated: 2021-10
traces-from: "Whitepaper sections 07 (Gameplay) and 11 (Feeding/Growing/Breeding)"
created: 2025-01-15
tags: [gaming, conservation, play-to-earn, education, funding]
requires: [0, 4, 300]
references: [LP-7000, ZIP-500, ZIP-501]
---

# ZIP-301: Play-to-Conserve Game Mechanics

## Abstract

This proposal defines a game mechanics standard in which player actions within Zoo ecosystem games generate real-world conservation funding. Unlike conventional play-to-earn models that extract value through inflationary token emissions, Play-to-Conserve (P2C) channels a defined percentage of all in-game economic activity into auditable conservation pools. Token rewards to players are tied to verified educational outcomes and ecological contributions rather than raw time spent. Anti-cheat integrity is enforced through on-chain attestation via LP-7000, ensuring that conservation funding flows are tamper-proof and publicly auditable.

## Motivation

### The Play-to-Earn Failure

First-generation blockchain games demonstrated that tokenized rewards attract players but fail to sustain economies. The core flaw: rewards come from token inflation, not value creation. When new player growth slows, the economy collapses.

### The Conservation Funding Gap

Global biodiversity conservation requires an estimated $700-967 billion annually. Current funding covers less than 20% of this need. Gaming represents a $200B+ annual market with billions of engaged hours. Even a small fraction directed toward conservation would be transformative.

### The Education Deficit

Public understanding of ecology is shallow. Games are proven educational tools but rarely teach real ecological concepts. Players who understand ecosystems become conservation advocates.

### What P2C Solves

1. **Sustainable Economics**: Funding flows from genuine economic activity (marketplace fees, premium content, sponsorships), not token inflation.
2. **Conservation Impact**: Every game transaction contributes to a transparent, on-chain conservation fund.
3. **Educational Alignment**: Token rewards scale with demonstrated ecological knowledge, not grinding.
4. **Verifiable Impact**: LP-7000 attestation ensures funding commitments are honored and auditable.
5. **Anti-Cheat by Design**: Educational assessments and ecological contributions are attested on-chain, making bot farming economically unviable.

## Specification

### 1. Conservation Funding Flow

All P2C-compliant games must implement the following funding flow.

```solidity
contract ConservationFundingPool {
    // Minimum conservation allocation: 5% of all economic activity
    uint256 public constant MIN_CONSERVATION_RATE = 500; // basis points

    // Fund allocation buckets
    struct FundAllocation {
        uint256 directConservation;    // Field projects, anti-poaching
        uint256 habitatRestoration;    // Reforestation, wetland recovery
        uint256 research;              // Wildlife research grants
        uint256 communityPrograms;     // Local community conservation
        uint256 educationGrants;       // Conservation education initiatives
    }

    // Default allocation percentages (basis points, sum = 10000)
    FundAllocation public defaultAllocation = FundAllocation({
        directConservation: 3500,
        habitatRestoration: 2500,
        research: 2000,
        communityPrograms: 1000,
        educationGrants: 1000
    });

    // Accumulated funds per habitat
    mapping(bytes32 => uint256) public habitatFunds;

    // Total lifetime conservation funding
    uint256 public totalConservationFunded;

    event ConservationFunded(
        bytes32 indexed habitatId,
        uint256 amount,
        string source,
        address indexed game
    );

    // Called by P2C-compliant games on every economic transaction
    function contributeToConservation(
        bytes32 habitatId,
        uint256 amount,
        string calldata source
    ) external {
        require(registeredGames[msg.sender], "Unregistered game");
        require(amount > 0, "Zero contribution");

        IERC20(zooToken).transferFrom(msg.sender, address(this), amount);
        habitatFunds[habitatId] += amount;
        totalConservationFunded += amount;

        emit ConservationFunded(habitatId, amount, source, msg.sender);
    }

    // Disbursement to verified conservation projects (governed by DAO)
    function disburse(
        bytes32 habitatId,
        address recipient,
        uint256 amount,
        bytes calldata conservationProof
    ) external onlyConservationDAO {
        require(habitatFunds[habitatId] >= amount, "Insufficient funds");
        require(
            verifyConservationProject(recipient, conservationProof),
            "Unverified project"
        );

        habitatFunds[habitatId] -= amount;
        IERC20(zooToken).transfer(recipient, amount);

        emit FundsDisbursed(habitatId, recipient, amount);
    }
}
```

### 2. Economic Activity Taxonomy

Every in-game transaction is classified and taxed for conservation.

```typescript
interface P2CTransaction {
  type: TransactionType;
  amount: number;                    // In ZOO tokens
  conservationRate: number;          // Basis points (min 500)
  habitatId: string;                 // Linked real-world habitat
  playerId: string;                  // Lux ID
  timestamp: number;
}

enum TransactionType {
  // Marketplace (conservation rate: 5-10%)
  ASSET_TRADE,                       // Player-to-player item trade
  ASSET_PURCHASE,                    // Primary sale from game
  LAND_LEASE,                        // Virtual habitat land lease

  // Gameplay (conservation rate: 5%)
  CRAFTING_FEE,                      // Resource combination
  BREEDING_FEE,                      // Wildlife breeding in-game
  EXPEDITION_COST,                   // Launching habitat expeditions

  // Premium (conservation rate: 10-15%)
  COSMETIC_PURCHASE,                 // Visual customizations
  SPONSORSHIP,                       // Corporate habitat sponsorship
  NAMING_RIGHTS,                     // Name a virtual species/landmark

  // Educational (conservation rate: 20%)
  CERTIFICATION_FEE,                 // Ecology course completion
  RESEARCH_GRANT,                    // In-game research funding
}

// Conservation rate schedule
const CONSERVATION_RATES: Record<TransactionType, number> = {
  ASSET_TRADE: 500,
  ASSET_PURCHASE: 750,
  LAND_LEASE: 1000,
  CRAFTING_FEE: 500,
  BREEDING_FEE: 500,
  EXPEDITION_COST: 500,
  COSMETIC_PURCHASE: 1000,
  SPONSORSHIP: 1500,
  NAMING_RIGHTS: 1500,
  CERTIFICATION_FEE: 2000,
  RESEARCH_GRANT: 2000,
};
```

### 3. Educational Reward System

Token rewards are gated by verified educational outcomes, not raw play time.

```typescript
interface EducationalAssessment {
  assessmentId: string;
  playerId: string;                  // Lux ID
  category: AssessmentCategory;
  questions: Question[];
  responses: Response[];
  score: number;                     // 0-100
  passingScore: number;              // Minimum to earn rewards
  attestation: bytes;                // LP-7000 attestation
  timestamp: number;
}

enum AssessmentCategory {
  SPECIES_IDENTIFICATION,            // Identify species from images/sounds
  ECOSYSTEM_DYNAMICS,                // Understand food webs, energy flow
  CONSERVATION_METHODS,              // Knowledge of conservation techniques
  HABITAT_ASSESSMENT,                // Evaluate habitat quality
  CLIMATE_IMPACT,                    // Understand climate effects on wildlife
  FIELD_SKILLS,                      // Virtual fieldwork competency
}

interface RewardCalculation {
  // Base reward from gameplay activity
  baseReward: number;

  // Educational multiplier (1.0x - 3.0x)
  educationalMultiplier: number;

  // Conservation contribution bonus
  conservationBonus: number;

  // Anti-inflation decay (rewards decrease as total supply grows)
  decayFactor: number;

  // Final reward
  finalReward: number;
}
```

```solidity
contract EducationalRewards {
    // Assessment results (attested via LP-7000)
    mapping(address => mapping(uint256 => AssessmentResult)) public assessments;

    // Educational multiplier tiers
    uint256 constant TIER_NOVICE = 100;       // 1.0x (score 0-39)
    uint256 constant TIER_LEARNER = 150;      // 1.5x (score 40-69)
    uint256 constant TIER_INFORMED = 200;     // 2.0x (score 70-89)
    uint256 constant TIER_EXPERT = 300;       // 3.0x (score 90-100)

    struct AssessmentResult {
        uint8 category;
        uint8 score;
        uint64 timestamp;
        bool attested;                         // LP-7000 verified
    }

    function calculateReward(
        address player,
        uint256 baseAmount,
        uint8 category
    ) public view returns (uint256) {
        AssessmentResult memory result = assessments[player][category];

        // No attested assessment = minimum multiplier
        if (!result.attested) return baseAmount;

        // Assessment expires after 90 days
        if (block.timestamp > result.timestamp + 90 days) return baseAmount;

        uint256 multiplier;
        if (result.score >= 90) multiplier = TIER_EXPERT;
        else if (result.score >= 70) multiplier = TIER_INFORMED;
        else if (result.score >= 40) multiplier = TIER_LEARNER;
        else multiplier = TIER_NOVICE;

        return (baseAmount * multiplier) / 100;
    }

    function submitAssessment(
        address player,
        uint8 category,
        uint8 score,
        bytes calldata attestation
    ) external {
        // Verify LP-7000 attestation
        require(
            lp7000Verifier.verifyAttestation(
                keccak256(abi.encodePacked(player, category, score)),
                attestation
            ),
            "Invalid attestation"
        );

        assessments[player][category] = AssessmentResult({
            category: category,
            score: score,
            timestamp: uint64(block.timestamp),
            attested: true
        });

        emit AssessmentRecorded(player, category, score);
    }
}
```

### 4. Anti-Cheat via On-Chain Attestation

Bot farming and reward manipulation are prevented through multi-layered attestation.

```solidity
contract P2CAntiCheat {
    struct PlayerSession {
        bytes32 sessionHash;          // Hash of session activity log
        uint256 actionsCount;
        uint256 uniqueDecisions;      // Non-repetitive meaningful choices
        uint256 educationalEvents;    // Quiz completions, observations
        uint64 duration;
        bytes teeAttestation;         // LP-7000 TEE proof
    }

    // Minimum thresholds for reward eligibility per session
    uint256 constant MIN_UNIQUE_DECISIONS = 10;
    uint256 constant MIN_EDUCATIONAL_EVENTS = 1;
    uint256 constant MAX_ACTIONS_PER_MINUTE = 30;    // Human speed limit
    uint256 constant MIN_SESSION_DURATION = 300;      // 5 minutes

    function validateSession(
        PlayerSession calldata session
    ) external view returns (bool eligible) {
        // Verify TEE attestation
        if (!lp7000Verifier.verifyAttestation(
            session.sessionHash, session.teeAttestation
        )) return false;

        // Check human-plausible action rate
        uint256 actionsPerMinute = (session.actionsCount * 60) / session.duration;
        if (actionsPerMinute > MAX_ACTIONS_PER_MINUTE) return false;

        // Require meaningful engagement
        if (session.uniqueDecisions < MIN_UNIQUE_DECISIONS) return false;

        // Require educational participation
        if (session.educationalEvents < MIN_EDUCATIONAL_EVENTS) return false;

        // Minimum session length
        if (session.duration < MIN_SESSION_DURATION) return false;

        return true;
    }

    // Behavioral pattern analysis (off-chain, results attested)
    // Detects: repetitive action sequences, inhuman precision,
    // geographic impossibility, concurrent session anomalies
    function submitBehaviorAnalysis(
        address player,
        bool suspicious,
        bytes calldata evidence,
        bytes calldata attestation
    ) external onlyAnalyzer {
        require(
            lp7000Verifier.verifyAttestation(
                keccak256(abi.encodePacked(player, suspicious, evidence)),
                attestation
            ),
            "Invalid analysis attestation"
        );

        if (suspicious) {
            playerFlags[player]++;
            if (playerFlags[player] >= FLAG_THRESHOLD) {
                suspendRewards(player);
            }
        }

        emit BehaviorAnalyzed(player, suspicious);
    }
}
```

### 5. Conservation Impact Tracking

Every P2C game must expose a standardized impact dashboard.

```typescript
interface ConservationImpactDashboard {
  // Real-time metrics
  totalFundsRaised: number;          // Lifetime ZOO tokens contributed
  activeHabitats: number;            // Habitats receiving funding
  playersContributing: number;       // Unique players this period
  projectsFunded: number;            // Conservation projects receiving funds

  // Per-habitat breakdown
  habitatImpact: Map<string, HabitatImpact>;

  // Educational metrics
  assessmentsCompleted: number;
  averageScore: number;
  certificationsIssued: number;

  // Verification
  latestAuditHash: bytes32;          // On-chain audit trail reference
  auditorAddress: string;            // Independent auditor Lux ID
}

interface HabitatImpact {
  habitatId: string;
  realWorldName: string;
  fundsAllocated: number;
  fundsDeployed: number;
  projectCount: number;
  speciesImpacted: string[];
  verificationStatus: "pending" | "verified" | "audited";
}
```

### 6. Game Registration

Games must register with the P2C registry to participate in conservation funding.

```solidity
contract P2CGameRegistry {
    struct GameRegistration {
        address gameContract;
        string name;
        bytes32[] linkedHabitats;     // ZIP-300 habitat IDs
        uint256 conservationRate;     // Minimum 500 basis points
        string auditorLuxId;          // Independent auditor
        bool active;
        uint64 registeredAt;
    }

    mapping(address => GameRegistration) public games;

    function registerGame(
        string calldata name,
        bytes32[] calldata habitats,
        uint256 conservationRate,
        string calldata auditorLuxId
    ) external {
        require(conservationRate >= 500, "Below minimum conservation rate");
        require(habitats.length > 0, "Must link to at least one habitat");
        require(
            isVerifiedAuditor(auditorLuxId),
            "Auditor not in approved list"
        );

        games[msg.sender] = GameRegistration({
            gameContract: msg.sender,
            name: name,
            linkedHabitats: habitats,
            conservationRate: conservationRate,
            auditorLuxId: auditorLuxId,
            active: true,
            registeredAt: uint64(block.timestamp)
        });

        emit GameRegistered(msg.sender, name, conservationRate);
    }
}
```

## Rationale

### Why Not Standard Play-to-Earn?

Play-to-earn models create closed-loop economies where value is extracted by early participants at the expense of later ones. P2C breaks this pattern: value flows outward to conservation, creating a public good. Players are rewarded for learning and contributing, not for grinding.

### Why Educational Gating?

Tying rewards to educational outcomes serves three purposes: (1) it makes bot farming uneconomical since bots cannot pass contextual ecology assessments, (2) it creates genuine conservation advocates, and (3) it aligns incentives so that the most knowledgeable players earn the most.

### Why 5% Minimum Conservation Rate?

The 5% floor is calibrated to be economically sustainable for games while generating meaningful conservation funding at scale. A game with $10M annual volume generates $500K+ for conservation. The rate is a minimum; games may set higher rates voluntarily.

### Why On-Chain Attestation for Anti-Cheat?

Traditional anti-cheat runs on game servers controlled by developers. In a decentralized ecosystem, there is no trusted central authority. LP-7000 TEE attestation provides cryptographic proof that session data was generated by a legitimate client, removing trust assumptions.

## Security Considerations

1. **Sybil Resistance**: Players must hold a valid Lux ID with minimum account age (7 days) and one attested educational assessment before earning rewards. This prevents mass account creation for reward farming.

2. **Conservation Fund Security**: Disbursement requires Conservation DAO multisig approval plus verification of the recipient conservation project against an approved registry (ZIP-501). Funds are held in a timelock contract with 48-hour delay.

3. **Assessment Integrity**: Educational assessments are generated per-session from a question bank, randomized, and time-limited. Answers are hashed client-side and submitted with TEE attestation. Question banks rotate monthly.

4. **Economic Attack Vectors**: Circuit breakers halt reward distribution if the rate exceeds 3 standard deviations from the 30-day moving average. Conservation fund contributions are irreversible to prevent drain attacks.

5. **Privacy**: Player educational scores are stored as on-chain hashes. Full assessment details are available only to the player and attested auditors. Aggregate statistics are published without individual attribution.

6. **Game Developer Collusion**: Conservation rates are enforced at the smart contract level. Games cannot reduce their rate below the registered minimum. Rate changes require a 30-day notice period with DAO oversight.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards for Zoo Ecosystem](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-300: Virtual Habitat Simulation Protocol](./zip-0300-virtual-habitat-simulation-protocol.md)
4. [ZIP-500: ESG Principles for Conservation Impact](./zip-0500-esg-principles-conservation-impact.md)
5. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
6. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lp-spec)
7. Waldron, A. et al. (2020). "Protecting 30% of the planet for nature: costs, benefits and economic implications." *Campaign for Nature*.
8. Qian, K. et al. (2022). "Gamification for Conservation: A Systematic Review." *Conservation Biology*, 36(4).

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
