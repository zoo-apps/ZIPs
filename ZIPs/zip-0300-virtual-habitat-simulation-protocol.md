---
zip: 300
title: "Virtual Habitat Simulation Protocol"
description: "Protocol for creating and simulating virtual wildlife habitats as digital twins of real ecosystems"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
originated: 2021-10
traces-from: "Whitepaper sections 07 (Gameplay), 09 (AR App), 12 (Metaverse Companion)"
follow-on: [zoo-habitat-modeling]
created: 2025-01-15
tags: [gaming, simulation, digital-twin, conservation, habitat]
requires: [0, 4]
references: [LP-3600, LP-3601, LP-7000, HIP-0082]
---

# ZIP-300: Virtual Habitat Simulation Protocol

## Abstract

This proposal defines a standard protocol for creating, running, and verifying virtual wildlife habitat simulations within the Zoo gaming ecosystem. Each simulation is a digital twin of a real-world ecosystem, driven by AI population dynamics, weather modeling, and migration pattern engines. Simulation state is periodically checkpointed on-chain via LP-7000 attestation, producing a verifiable, auditable record of ecosystem evolution. The protocol enables game developers, researchers, and conservation organizations to build interactive experiences grounded in real ecological data while generating actionable insights for wildlife management.

## Motivation

Conservation science suffers from a critical gap: real-world ecosystem experiments are expensive, slow, and ethically constrained. Meanwhile, blockchain gaming has yet to produce simulations with genuine scientific utility. This proposal bridges those worlds.

### Problems Addressed

1. **No Standard for Ecological Simulation in Games**: Existing wildlife games use hardcoded behaviors with no grounding in real species data. There is no interoperable format for habitat state, population models, or environmental parameters.

2. **Conservation Data Is Underutilized**: Camera trap networks, satellite imagery, and field surveys produce terabytes of ecological data annually. Almost none of it reaches interactive media where it could educate millions of players.

3. **Simulation Results Are Not Verifiable**: Academic ecosystem models run in closed environments. Results cannot be independently audited, reproduced, or composed with other simulations.

4. **Digital Twin Technology Ignores Wildlife**: HIP-0082 defines digital twin simulation for industrial and urban contexts. No equivalent exists for natural ecosystems, despite the clear conservation value.

5. **Game Economies Are Disconnected from Real Impact**: Players spend hours in virtual worlds without generating any measurable benefit for the ecosystems those worlds depict.

### Goals

- Define a portable habitat state format that any compliant game engine can load and run.
- Specify AI-driven population dynamics, weather, and migration modules.
- Require on-chain state attestation for all published simulation runs.
- Enable federation: multiple game instances can contribute observations back to a shared habitat model.
- Produce simulation data usable by conservation researchers under open licenses.

## Specification

### 1. Habitat State Schema

A habitat is represented as a structured document containing terrain, climate, species populations, and resource layers.

```typescript
interface HabitatState {
  // Identity
  habitatId: string;             // Unique identifier (UUID v4)
  name: string;                  // Human-readable name
  realWorldRef: GeoReference;    // Bounding box of real-world counterpart
  version: number;               // Monotonically increasing state version

  // Terrain
  terrain: TerrainLayer;         // Elevation, soil, water bodies
  vegetation: VegetationLayer;   // Flora distribution by species
  waterSystem: HydroLayer;       // Rivers, aquifers, rainfall zones

  // Climate
  climate: ClimateState;         // Temperature, humidity, wind, season
  weatherQueue: WeatherEvent[];  // Upcoming stochastic weather events

  // Populations
  populations: SpeciesPopulation[];  // All tracked species
  migrationRoutes: MigrationRoute[]; // Active migration corridors

  // Resources
  resources: ResourceLayer;      // Food, water, shelter availability

  // Metadata
  timestamp: number;             // Unix epoch of this state snapshot
  checkpointHash: bytes32;       // On-chain attestation hash
  sourceDatasets: DatasetRef[];  // Real-world data sources used
}

interface SpeciesPopulation {
  speciesId: string;             // IUCN taxon ID or Zoo species registry
  commonName: string;
  count: number;                 // Current population count
  ageDistribution: number[];     // Bucketed: juvenile, subadult, adult, elder
  healthIndex: number;           // 0.0 - 1.0 aggregate health
  geneticDiversity: number;      // Simpson diversity index
  spatialDistribution: HeatMap;  // Density across habitat grid
  behaviorProfile: string;       // Reference to ZIP-302 behavior engine
}

interface GeoReference {
  boundingBox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  crs: string;                   // Coordinate reference system (default: EPSG:4326)
  area_km2: number;              // Total area in square kilometers
  biome: string;                 // IUCN habitat classification
}
```

### 2. Simulation Engine Interface

All compliant simulation engines must implement the following interface, enabling interoperability across game clients.

```typescript
interface HabitatSimulationEngine {
  // Lifecycle
  initialize(state: HabitatState): Promise<SimulationInstance>;
  step(instance: SimulationInstance, dt: number): Promise<HabitatState>;
  checkpoint(instance: SimulationInstance): Promise<CheckpointResult>;
  teardown(instance: SimulationInstance): Promise<void>;

  // Population dynamics
  computePopulationStep(
    species: SpeciesPopulation,
    environment: ClimateState,
    resources: ResourceLayer,
    predators: SpeciesPopulation[],
    prey: SpeciesPopulation[],
    dt: number
  ): Promise<SpeciesPopulation>;

  // Weather
  advanceWeather(
    climate: ClimateState,
    terrain: TerrainLayer,
    dt: number
  ): Promise<ClimateState>;

  // Migration
  evaluateMigration(
    species: SpeciesPopulation,
    routes: MigrationRoute[],
    season: Season,
    resources: ResourceLayer
  ): Promise<MigrationDecision>;

  // Player interaction
  applyPlayerAction(
    instance: SimulationInstance,
    action: PlayerAction
  ): Promise<ActionResult>;
}
```

### 3. Population Dynamics Model

Population changes are computed using a modified Lotka-Volterra system with carrying capacity, age structure, and stochastic events.

```
dN_i/dt = r_i * N_i * (1 - N_i/K_i) - sum_j(a_ij * N_i * N_j) + M_i(t) + S_i(t)

Where:
  N_i     = population of species i
  r_i     = intrinsic growth rate (from species database)
  K_i     = carrying capacity (dynamic, based on resources and habitat quality)
  a_ij    = interaction coefficient between species i and j
  M_i(t)  = migration flux at time t
  S_i(t)  = stochastic event impact (disease, natural disaster)
```

Parameters `r_i`, `K_i`, and `a_ij` are initialized from real-world ecological databases and refined through federated learning across game instances (see Section 6).

### 4. Weather and Climate Module

Weather drives resource availability, migration triggers, and population stress.

```typescript
interface WeatherEngine {
  // Generate weather from historical climate data + stochastic variation
  generateWeather(params: {
    baseClimate: ClimateBaseline;    // 30-year normals from real-world data
    currentState: ClimateState;
    stochasticSeed: number;          // Deterministic for replay
    extremeEventProb: number;        // Probability of drought, flood, fire
  }): Promise<WeatherForecast>;

  // Apply weather effects to habitat
  applyWeatherEffects(params: {
    weather: WeatherForecast;
    terrain: TerrainLayer;
    vegetation: VegetationLayer;
    waterSystem: HydroLayer;
  }): Promise<EnvironmentDelta>;
}

interface ClimateBaseline {
  source: string;                    // e.g., "ERA5", "CHIRPS", "WorldClim"
  temperatureRange: [number, number]; // Monthly min/max in Celsius
  precipitationMm: number[];         // Monthly averages
  seasonality: SeasonDefinition[];
  historicalExtremes: ExtremeEvent[];
}
```

### 5. On-Chain State Attestation

Every simulation checkpoint is attested on-chain using LP-7000 AI attestation, producing an immutable record.

```solidity
contract HabitatAttestation {
    struct Checkpoint {
        bytes32 habitatId;
        uint256 version;
        bytes32 stateHash;          // Merkle root of full HabitatState
        bytes32 populationHash;     // Merkle root of population data only
        uint256 simulationTick;
        uint64  wallclockTimestamp;
        address engine;             // Address of simulation engine contract
        bytes   teeAttestation;     // TEE proof from LP-7000
    }

    mapping(bytes32 => Checkpoint[]) public checkpoints; // habitatId => history

    event HabitatCheckpointed(
        bytes32 indexed habitatId,
        uint256 version,
        bytes32 stateHash,
        uint256 simulationTick
    );

    function submitCheckpoint(
        Checkpoint calldata cp,
        bytes calldata proof
    ) external {
        // Verify TEE attestation via LP-7000
        require(
            lp7000Verifier.verifyAttestation(cp.teeAttestation, proof),
            "Invalid TEE attestation"
        );

        // Verify state hash continuity
        Checkpoint[] storage history = checkpoints[cp.habitatId];
        if (history.length > 0) {
            Checkpoint storage prev = history[history.length - 1];
            require(cp.version == prev.version + 1, "Non-sequential version");
            require(cp.simulationTick > prev.simulationTick, "Tick regression");
        }

        history.push(cp);
        emit HabitatCheckpointed(cp.habitatId, cp.version, cp.stateHash, cp.simulationTick);
    }

    function getLatestCheckpoint(bytes32 habitatId)
        external view returns (Checkpoint memory)
    {
        Checkpoint[] storage history = checkpoints[habitatId];
        require(history.length > 0, "No checkpoints");
        return history[history.length - 1];
    }
}
```

### 6. Federated Habitat Learning

Multiple game instances simulating the same real-world habitat can contribute parameter refinements back to a shared model, improving ecological accuracy over time.

```typescript
interface FederatedHabitatLearning {
  // Each game instance periodically reports observed parameter deviations
  reportObservation(params: {
    habitatId: string;
    speciesId: string;
    observedGrowthRate: number;
    observedCarryingCapacity: number;
    interactionCoefficients: Map<string, number>;
    sampleSize: number;            // Number of simulation ticks observed
    engineVersion: string;
  }): Promise<void>;

  // Aggregator computes updated parameters using federated averaging
  aggregateParameters(params: {
    habitatId: string;
    minReports: number;            // Minimum reports before update
    outlierThreshold: number;      // Z-score threshold for outlier rejection
  }): Promise<ParameterUpdate>;

  // Updated parameters are published and attested
  publishUpdate(params: {
    habitatId: string;
    update: ParameterUpdate;
    attestation: bytes;            // LP-7000 attestation of aggregation
  }): Promise<void>;
}
```

### 7. Player Interaction Model

Players interact with habitats through conservation-aligned actions. Each action type has defined effects on habitat state.

```typescript
enum PlayerActionType {
  PLANT_VEGETATION,        // Restore flora in degraded areas
  BUILD_WATER_SOURCE,      // Create watering holes or restore streams
  ESTABLISH_CORRIDOR,      // Create wildlife migration corridor
  REMOVE_INVASIVE,         // Remove invasive species
  DEPLOY_SENSOR,           // Place virtual camera trap or weather station
  CONDUCT_SURVEY,          // Census a species population
  REPORT_OBSERVATION,      // Report wildlife sighting
}

interface PlayerAction {
  type: PlayerActionType;
  location: GridCoordinate;
  parameters: Record<string, unknown>;
  playerId: string;               // Lux ID (did:lux:...)
  timestamp: number;
}

interface ActionResult {
  success: boolean;
  habitatDelta: Partial<HabitatState>;
  conservationScore: number;      // Points toward ZIP-301 funding
  scientificValue: number;        // Contribution to parameter refinement
  narrative: string;              // In-game feedback text
}
```

### 8. VM Execution Environment

Simulation engines run within LP-3600 compatible virtual machines, using the LP-3601 VM SDK for deterministic execution and state management.

```yaml
SimulationVM:
  runtime: LP-3600
  sdk: LP-3601
  requirements:
    deterministic: true            # Same inputs must produce same outputs
    checkpointable: true           # Must support state serialization
    metered: true                  # Compute cost must be measurable
    sandboxed: true                # No external network access during step()
  resource_limits:
    max_memory_mb: 2048
    max_step_time_ms: 1000         # Per simulation tick
    max_state_size_mb: 512
```

## Rationale

### Why Digital Twins of Real Ecosystems?

Grounding simulations in real-world data transforms games from entertainment into educational and scientific tools. Players develop intuition for ecological dynamics. Conservation organizations gain a public engagement channel. Researchers gain a distributed simulation platform.

### Why On-Chain Attestation?

Without verifiable state, simulation results are anecdotal. On-chain checkpoints via LP-7000 create an audit trail that researchers can cite, conservation organizations can reference in grant applications, and players can trust.

### Why Federated Learning?

No single simulation captures the full complexity of an ecosystem. By aggregating observations across thousands of game instances, the protocol converges on more accurate ecological parameters than any individual run.

### Why LP-3600 VM?

Deterministic execution in a metered VM ensures that simulation results are reproducible and that compute costs are transparent. This is essential for scientific credibility and for preventing simulation manipulation.

## Security Considerations

1. **State Manipulation**: Simulation engines run in sandboxed LP-3600 VMs with TEE attestation. Tampering with state between checkpoints is detectable via hash chain verification.

2. **Parameter Poisoning**: Federated learning uses outlier rejection (z-score filtering) and minimum report thresholds to prevent adversarial parameter submissions.

3. **Sybil Attacks on Federation**: Each report must be signed by a valid Lux ID with a minimum stake or reputation score, preventing spam submissions.

4. **Sensitive Location Data**: Real-world geo-references use bounding boxes at minimum 10km resolution for endangered species habitats to prevent poaching exploitation. Exact coordinates are never exposed.

5. **Determinism Violations**: LP-3600 VM enforces deterministic execution. Any engine producing non-deterministic results for identical inputs fails attestation.

6. **Replay Attacks**: Checkpoint version numbers are monotonically increasing and include wall-clock timestamps. Replayed checkpoints are rejected.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards for Zoo Ecosystem](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [LP-3600: VM/Execution Environments](https://github.com/luxfi/lp-spec)
4. [LP-3601: VM SDK](https://github.com/luxfi/lp-spec)
5. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lp-spec)
6. [HIP-0082: Digital Twin Simulation](https://github.com/hanzoai/hips)
7. Lotka, A.J. (1925). *Elements of Physical Biology*. Williams & Wilkins.
8. Volterra, V. (1926). "Fluctuations in the Abundance of a Species considered Mathematically." *Nature*, 118, 558-560.
9. [IUCN Red List API](https://apiv3.iucnredlist.org/)
10. [ERA5 Climate Reanalysis](https://www.ecmwf.int/en/forecasts/datasets/reanalysis-datasets/era5)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
