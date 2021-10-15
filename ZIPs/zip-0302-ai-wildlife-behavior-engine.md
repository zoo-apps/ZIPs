---
zip: 302
title: "AI Wildlife Behavior Engine"
description: "AI engine for realistic wildlife behavior in games trained on real species data and camera trap footage"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
originated: 2021-10
traces-from: "Whitepaper section 08 (AI Assistant)"
follow-on: [zoo-conservation-ai]
created: 2025-01-15
tags: [gaming, ai, wildlife, behavior, federated-learning, computer-vision]
requires: [0, 4, 300]
references: [LP-7000, HIP-0081, HIP-0080, HIP-0082]
---

# ZIP-302: AI Wildlife Behavior Engine

## Abstract

This proposal specifies an AI engine for generating realistic, species-accurate wildlife behavior in games and simulations within the Zoo ecosystem. The engine is trained on real-world camera trap footage using computer vision pipelines (HIP-0081), incorporates published ethological research for each species, and improves continuously through federated learning across multiple game instances. Behavior models are parameterized per species using data from field observations, producing locomotion, foraging, social interaction, predator-prey dynamics, and circadian patterns that are visually and ecologically plausible. Model updates are attested via LP-7000 to ensure provenance and prevent adversarial corruption. The engine also supports validation against real-world robotic observation platforms (HIP-0080) to close the sim-to-real loop.

## Motivation

### The Problem with Wildlife in Games

Current wildlife behavior in games falls into two categories: scripted patrol paths, or ragdoll physics with random wandering. Neither reflects how animals actually behave. A lion in a modern AAA game and a lion in a mobile clicker use the same behavioral depth: none. This is a missed opportunity for both entertainment and education.

### Why Real Data Matters

Camera trap networks worldwide capture millions of images and videos annually. Projects like Wildlife Insights, LILA BC, and Snapshot Serengeti have made large datasets publicly available. This data contains rich behavioral information: activity patterns, social groupings, habitat preferences, and seasonal variations. None of it is systematically used in game development.

### The Federated Learning Opportunity

When thousands of game instances simulate the same species, each instance generates synthetic behavioral data. If this data is aggregated carefully, it can refine the behavior models beyond what any single training run achieves. Federated learning allows this without centralizing proprietary game data.

### Conservation Alignment

Realistic wildlife behavior in games creates empathy. Players who watch a virtual elephant herd navigate drought, protect calves, and mourn dead develop emotional connections that translate to conservation support. This is not speculation; studies on nature documentaries consistently demonstrate this effect. Games can amplify it through interactivity.

## Specification

### 1. Behavior Model Architecture

Each species is represented by a hierarchical behavior model with three layers: instinct (hardcoded survival drives), learned (trained from data), and social (emergent from multi-agent interaction).

```typescript
interface WildlifeBehaviorModel {
  // Identity
  speciesId: string;                 // IUCN taxon ID
  modelVersion: string;              // Semantic version
  modelHash: bytes32;                // Content hash for attestation

  // Architecture
  instinctLayer: InstinctModule;     // Fixed survival behaviors
  learnedLayer: LearnedModule;       // Trained from camera trap data
  socialLayer: SocialModule;         // Multi-agent interaction rules

  // Runtime
  stateSize: number;                 // Per-individual state vector size
  inferenceTimeMs: number;           // Target inference latency
  updateFrequencyHz: number;         // Behavior decision rate
}

interface InstinctModule {
  // Hardcoded species-specific drives (not learned, derived from literature)
  survivalDrives: {
    hunger: DriveFunction;           // Foraging motivation over time
    thirst: DriveFunction;           // Water-seeking motivation
    rest: DriveFunction;             // Circadian rest patterns
    safety: DriveFunction;           // Predator avoidance threshold
    reproduction: DriveFunction;     // Seasonal mating drive
    thermoregulation: DriveFunction; // Temperature comfort seeking
  };

  // Species-specific locomotion constraints
  locomotion: {
    maxSpeed: number;                // m/s
    cruisingSpeed: number;
    turnRadius: number;              // meters
    climbAngle: number;              // max slope in degrees
    swimCapable: boolean;
    flightCapable: boolean;
    terrainPreferences: TerrainAffinity[];
  };

  // Sensory model
  senses: {
    visionRange: number;             // meters
    visionFieldDeg: number;          // field of view
    hearingRange: number;
    smellRange: number;
    nightVisionFactor: number;       // 0.0 - 1.0 nocturnal capability
  };
}

interface LearnedModule {
  // Neural network for behavior selection
  network: {
    architecture: "transformer" | "lstm" | "mlp";
    inputDim: number;                // Observation vector size
    hiddenDim: number;
    outputDim: number;               // Action space size
    parameters: number;              // Total parameter count
  };

  // Training provenance
  training: {
    datasets: DatasetReference[];    // Camera trap datasets used
    totalFrames: number;             // Video frames analyzed
    speciesObservations: number;     // Labeled behavior observations
    trainingMethod: string;          // e.g., "behavioral_cloning", "IRL"
    lastUpdated: number;             // Unix timestamp
    attestation: bytes;              // LP-7000 training attestation
  };

  // Behavior categories the model can produce
  behaviorSpace: BehaviorCategory[];
}

enum BehaviorCategory {
  // Locomotion
  IDLE,
  WALK,
  RUN,
  STALK,
  CLIMB,
  SWIM,
  FLY,

  // Foraging
  SEARCH_FOOD,
  GRAZE,
  HUNT,
  SCAVENGE,
  CACHE_FOOD,

  // Social
  GROOM_SELF,
  GROOM_OTHER,
  PLAY,
  DISPLAY,
  COURT,
  MATE,
  NURSE,
  GUARD,
  SUBMIT,
  DOMINATE,

  // Defensive
  FLEE,
  FREEZE,
  MOB,
  HIDE,
  ALARM_CALL,

  // Environmental
  REST,
  SLEEP,
  DRINK,
  BATHE,
  WALLOW,
  THERMOREGULATE,

  // Cognitive
  INVESTIGATE,
  TOOL_USE,
  PROBLEM_SOLVE,
}
```

### 2. Camera Trap Training Pipeline

The behavior engine is trained from real-world camera trap footage using the HIP-0081 computer vision pipeline.

```typescript
interface CameraTrapPipeline {
  // Stage 1: Species detection and identification
  detectSpecies(params: {
    videoSource: string;             // URI to camera trap footage
    detectionModel: string;          // e.g., "MegaDetector v5"
    confidenceThreshold: number;     // Minimum detection confidence
  }): Promise<Detection[]>;

  // Stage 2: Individual tracking across frames
  trackIndividuals(params: {
    detections: Detection[];
    trackingModel: string;           // e.g., "DeepSORT", "ByteTrack"
    reIdModel: string;               // Re-identification model for known individuals
  }): Promise<Track[]>;

  // Stage 3: Behavior classification per track
  classifyBehavior(params: {
    tracks: Track[];
    behaviorModel: string;           // Behavior classification model
    temporalWindow: number;          // Frames to consider for context
  }): Promise<BehaviorAnnotation[]>;

  // Stage 4: Context extraction
  extractContext(params: {
    annotations: BehaviorAnnotation[];
    environmentData: EnvironmentContext; // Time of day, season, weather
    socialContext: SocialGraph;          // Other individuals present
  }): Promise<ContextualBehavior[]>;

  // Stage 5: Training data generation
  generateTrainingData(params: {
    contextualBehaviors: ContextualBehavior[];
    format: "behavioral_cloning" | "inverse_rl" | "imitation";
    stateRepresentation: StateEncoder;
  }): Promise<TrainingDataset>;
}

interface BehaviorAnnotation {
  trackId: string;
  speciesId: string;
  behavior: BehaviorCategory;
  confidence: number;
  startFrame: number;
  endFrame: number;
  boundingBoxes: BBox[];             // Per-frame positions
  bodyPose: Keypoints[];             // Per-frame pose estimation
}

interface ContextualBehavior {
  annotation: BehaviorAnnotation;
  timeOfDay: number;                 // Hours (0-24)
  season: string;
  temperature: number;               // Celsius (from weather station)
  nearbySpecies: string[];           // Other species detected
  socialDistance: number;             // Distance to nearest conspecific
  terrainType: string;
  vegetationDensity: number;
}
```

### 3. Species Data Integration

Each species model is parameterized from authoritative ecological databases.

```typescript
interface SpeciesProfile {
  // Taxonomy
  taxonId: string;                   // IUCN taxon ID
  scientificName: string;
  commonName: string;
  taxonomicClass: string;            // Mammalia, Aves, Reptilia, etc.

  // Ecology (sourced from literature)
  ecology: {
    diet: DietType;                  // herbivore, carnivore, omnivore
    activityPattern: "diurnal" | "nocturnal" | "crepuscular" | "cathemeral";
    socialStructure: SocialStructure;
    homeRangeKm2: [number, number];  // [min, max]
    dailyMovementKm: [number, number];
    lifespan: [number, number];      // Years [wild, captivity]
    gestationDays: number;
    litterSize: [number, number];
    weaningDays: number;
    sexualMaturityMonths: number;
  };

  // Conservation status
  conservation: {
    iucnStatus: string;              // LC, NT, VU, EN, CR, EW, EX
    populationTrend: "increasing" | "stable" | "decreasing" | "unknown";
    majorThreats: string[];
    habitatTypes: string[];          // IUCN habitat codes
  };

  // Behavior parameters (calibrated from camera trap data)
  behaviorParams: {
    activityBudget: Map<BehaviorCategory, number>; // % of day per behavior
    groupSizeDistribution: number[];               // Probability by group size
    flightDistance: number;                         // meters before fleeing
    approachDistance: number;                       // tolerance to conspecifics
    territoriality: number;                         // 0.0 - 1.0
    curiosity: number;                              // 0.0 - 1.0
    aggressionThreshold: number;                    // 0.0 - 1.0
  };

  // Data sources
  sources: {
    primaryLiterature: Citation[];
    cameraTrapDatasets: DatasetReference[];
    fieldStudySites: string[];
    lastReviewDate: number;
    reviewedBy: string;              // Lux ID of reviewing ecologist
  };
}

interface SocialStructure {
  type: "solitary" | "pair" | "family" | "herd" | "pack" | "fission-fusion"
        | "colony" | "lek" | "territorial";
  hierarchyType: "linear" | "despotic" | "egalitarian" | "none";
  sexRatio: [number, number];        // [males, females] in typical group
  dispersalSex: "male" | "female" | "both";
  cooperativeBreeding: boolean;
  alloparenting: boolean;
}
```

### 4. Federated Learning Protocol

Multiple game instances contribute behavioral observations to improve species models without sharing raw game data.

```typescript
interface FederatedBehaviorLearning {
  // Each game instance computes local model updates
  computeLocalUpdate(params: {
    speciesId: string;
    modelVersion: string;
    observations: LocalObservation[];  // Behavior transitions observed
    environmentContext: EnvironmentSummary;
    epochCount: number;
  }): Promise<ModelGradient>;

  // Local updates are submitted with attestation
  submitUpdate(params: {
    speciesId: string;
    gradient: ModelGradient;
    metadata: {
      gameId: string;
      instanceCount: number;         // Number of individuals simulated
      simulationHours: number;       // In-game hours observed
      engineVersion: string;
    };
    attestation: bytes;              // LP-7000 attestation
  }): Promise<SubmissionReceipt>;

  // Aggregation server (operated by Zoo Foundation)
  aggregateUpdates(params: {
    speciesId: string;
    updates: SubmittedUpdate[];
    aggregationMethod: "fedavg" | "fedprox" | "scaffold";
    clipNorm: number;                // Gradient clipping for robustness
    minParticipants: number;         // Minimum game instances per round
    poisonDetection: boolean;        // Enable Byzantine-robust aggregation
  }): Promise<AggregatedModel>;

  // Publish new model version
  publishModel(params: {
    speciesId: string;
    model: AggregatedModel;
    changelog: string;
    attestation: bytes;              // LP-7000 attestation of aggregation
  }): Promise<PublicationReceipt>;
}

interface LocalObservation {
  individualId: string;              // In-game individual
  behavior: BehaviorCategory;
  duration: number;                  // Seconds
  context: {
    timeOfDay: number;
    season: string;
    hunger: number;
    thirst: number;
    nearbyPredators: number;
    nearbyConspecifics: number;
    terrainType: string;
    weatherCondition: string;
  };
  outcome: {
    survivalResult: boolean;         // Did the individual survive?
    resourceGained: number;          // Energy units acquired
    socialOutcome: string;           // Dominance change, bond formed, etc.
  };
}
```

### 5. Real-Time Behavior Decision Engine

The runtime engine selects behaviors for each simulated individual at a fixed update rate.

```typescript
class BehaviorDecisionEngine {
  private model: WildlifeBehaviorModel;
  private profile: SpeciesProfile;

  // Called at updateFrequencyHz for each individual
  async decide(individual: IndividualState): Promise<BehaviorDecision> {
    // 1. Compute drive states from instinct layer
    const drives = this.computeDrives(individual);

    // 2. Gather sensory observations
    const observations = this.gatherObservations(individual);

    // 3. Encode state vector
    const stateVector = this.encodeState(individual, drives, observations);

    // 4. Run learned model inference
    const actionProbs = await this.model.learnedLayer.network.forward(stateVector);

    // 5. Apply instinct overrides (e.g., flee if predator within flight distance)
    const filteredProbs = this.applyInstinctOverrides(actionProbs, drives, observations);

    // 6. Apply social modifiers
    const socialProbs = this.applySocialModifiers(
      filteredProbs, individual, observations
    );

    // 7. Sample action with temperature-based stochasticity
    const behavior = this.sampleBehavior(socialProbs, individual.personality);

    // 8. Compute locomotion target
    const target = this.computeLocomotionTarget(behavior, individual, observations);

    return {
      behavior,
      target,
      duration: this.estimateDuration(behavior, individual),
      animation: this.selectAnimation(behavior, individual),
      sound: this.selectVocalization(behavior, individual),
    };
  }

  private computeDrives(individual: IndividualState): DriveState {
    const instinct = this.model.instinctLayer;
    return {
      hunger: instinct.survivalDrives.hunger(individual.satiation, individual.metabolicRate),
      thirst: instinct.survivalDrives.thirst(individual.hydration),
      rest: instinct.survivalDrives.rest(individual.energy, individual.timeAwake),
      safety: instinct.survivalDrives.safety(individual.stressLevel),
      reproduction: instinct.survivalDrives.reproduction(
        individual.age, individual.season, individual.hormoneLevel
      ),
      thermoregulation: instinct.survivalDrives.thermoregulation(
        individual.bodyTemp, individual.ambientTemp
      ),
    };
  }

  private applyInstinctOverrides(
    probs: number[],
    drives: DriveState,
    obs: Observations
  ): number[] {
    // Critical override: flee if predator detected within flight distance
    if (obs.nearestPredatorDist < this.profile.behaviorParams.flightDistance) {
      return this.overrideTo(BehaviorCategory.FLEE, probs);
    }

    // Critical override: drink if severely dehydrated
    if (drives.thirst > 0.95 && obs.nearestWaterDist < this.model.instinctLayer.senses.visionRange) {
      return this.overrideTo(BehaviorCategory.DRINK, probs);
    }

    return probs;
  }
}
```

### 6. Sim-to-Real Validation

Behavior models are validated against real-world observations, including robotic observation platforms per HIP-0080.

```typescript
interface SimToRealValidation {
  // Compare simulated behavior distributions with real-world camera trap data
  validateActivityBudget(params: {
    speciesId: string;
    simulatedBudget: Map<BehaviorCategory, number>;
    observedBudget: Map<BehaviorCategory, number>;
    sampleSize: number;
  }): Promise<ValidationResult>;

  // Compare movement patterns with GPS collar data
  validateMovement(params: {
    speciesId: string;
    simulatedTracks: Track[];
    gpsCollarTracks: Track[];
    metric: "step_length" | "turning_angle" | "home_range" | "daily_distance";
  }): Promise<ValidationResult>;

  // Compare social network structure with field observations
  validateSocialStructure(params: {
    speciesId: string;
    simulatedNetwork: SocialGraph;
    observedNetwork: SocialGraph;
    metric: "degree_distribution" | "clustering" | "modularity";
  }): Promise<ValidationResult>;

  // Robotic platform validation (HIP-0080)
  validateWithRoboticObserver(params: {
    speciesId: string;
    roboticPlatformId: string;       // HIP-0080 platform identifier
    observationPeriodDays: number;
    comparisonMetrics: string[];
  }): Promise<ValidationResult>;
}

interface ValidationResult {
  metric: string;
  simulatedValue: number;
  observedValue: number;
  divergence: number;                // KL divergence or earth mover distance
  pValue: number;                    // Statistical significance
  sampleSize: number;
  pass: boolean;                     // Below divergence threshold
  attestation: bytes;                // LP-7000 attestation of validation run
}
```

### 7. Model Distribution and Versioning

Behavior models are distributed as versioned, attested artifacts.

```solidity
contract BehaviorModelRegistry {
    struct ModelRecord {
        string speciesId;
        string version;              // Semantic version
        bytes32 modelHash;           // IPFS CID of model weights
        bytes32 configHash;          // IPFS CID of species profile
        uint256 parameterCount;
        uint256 trainingFrames;      // Camera trap frames used
        uint256 federatedRounds;     // Federated learning rounds completed
        bytes   validationReport;    // Encoded ValidationResult[]
        bytes   attestation;         // LP-7000 attestation
        address publisher;
        uint64  publishedAt;
    }

    // speciesId => version => ModelRecord
    mapping(string => mapping(string => ModelRecord)) public models;

    // speciesId => latest version string
    mapping(string => string) public latestVersion;

    event ModelPublished(
        string indexed speciesId,
        string version,
        bytes32 modelHash,
        uint256 parameterCount
    );

    function publishModel(
        ModelRecord calldata record
    ) external onlyPublisher {
        // Verify LP-7000 attestation
        require(
            lp7000Verifier.verifyAttestation(record.modelHash, record.attestation),
            "Invalid attestation"
        );

        // Verify validation results meet minimum thresholds
        require(
            validateMinimumQuality(record.validationReport),
            "Below quality threshold"
        );

        models[record.speciesId][record.version] = record;
        latestVersion[record.speciesId] = record.version;

        emit ModelPublished(
            record.speciesId,
            record.version,
            record.modelHash,
            record.parameterCount
        );
    }
}
```

## Rationale

### Why Hierarchical Behavior Architecture?

The three-layer design (instinct, learned, social) mirrors how real animal behavior works. Instinctive responses (flee from predator) are fast and reliable. Learned behaviors (optimal foraging paths) are flexible and data-driven. Social behaviors (dominance, cooperation) emerge from multi-agent dynamics. This architecture produces behaviors that are both ecologically accurate and computationally tractable.

### Why Camera Trap Data?

Camera traps capture undisturbed natural behavior. Unlike zoo observations or radio-collar data, camera trap footage shows animals in their habitat without human influence. The HIP-0081 pipeline already standardizes CV processing for this data, making integration straightforward.

### Why Federated Learning?

Centralizing behavioral data from all game instances would create privacy concerns (game developers may consider simulation parameters proprietary) and scalability bottlenecks. Federated learning achieves the same convergence while keeping raw data local. Byzantine-robust aggregation prevents a single malicious game instance from corrupting the shared model.

### Why Sim-to-Real Validation?

Without validation, the engine could drift from ecological reality across federated rounds. Periodic comparison with real-world data (camera traps, GPS collars, robotic observers) anchors the model to ground truth. The HIP-0080 robotic observation platforms provide continuous automated validation data.

## Security Considerations

1. **Model Poisoning**: Federated learning is vulnerable to Byzantine participants submitting adversarial gradients. The aggregation protocol uses Krum or coordinate-wise median as robust aggregation methods. Gradient contributions are clipped to a configurable norm bound.

2. **Data Provenance**: All training data sources (camera trap datasets) must be registered in the Zoo data registry with verifiable licensing. Models trained on unregistered data fail attestation.

3. **Sensitive Species Data**: Behavior models for critically endangered species (IUCN CR) must not encode precise location information. Spatial parameters use relative coordinates, not absolute GPS positions. The SpeciesProfile.sources field omits exact camera trap locations for CR species.

4. **Inference Manipulation**: Game clients could modify behavior engine outputs to gain gameplay advantages. Critical ecological metrics (population dynamics inputs) use server-side inference with LP-7000 attestation. Client-side inference is used only for animation and locomotion.

5. **Intellectual Property**: Camera trap datasets are used under their stated licenses (typically CC-BY or CC-BY-NC). The behavior model weights are published under CC-BY-4.0 to enable broad use while requiring attribution.

6. **Adversarial Observation Injection**: Federated learning updates must include a minimum simulation duration (1000 in-game hours) and minimum individual count (50 per species) to prevent low-effort poisoning attempts.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards for Zoo Ecosystem](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-300: Virtual Habitat Simulation Protocol](./zip-0300-virtual-habitat-simulation-protocol.md)
4. [HIP-0081: Computer Vision Pipelines](https://github.com/hanzoai/hips)
5. [HIP-0080: Robotics Integration](https://github.com/hanzoai/hips)
6. [HIP-0082: Digital Twin Simulation](https://github.com/hanzoai/hips)
7. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lp-spec)
8. Beery, S. et al. (2019). "Efficient Pipeline for Camera Trap Image Review." *arXiv:1907.06772*.
9. Tuia, D. et al. (2022). "Perspectives in Machine Learning for Wildlife Conservation." *Nature Communications*, 13, 792.
10. McMahan, H.B. et al. (2017). "Communication-Efficient Learning of Deep Networks from Decentralized Data." *AISTATS*.
11. [IUCN Red List API](https://apiv3.iucnredlist.org/)
12. [Wildlife Insights](https://www.wildlifeinsights.org/)
13. [LILA BC - Labeled Information Library of Alexandria: Biology and Conservation](https://lila.science/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
