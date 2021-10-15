---
zip: 405
title: "Conservation Agent SDK"
description: "Multi-agent SDK for building conservation AI agents for habitat monitoring, poaching detection, and migration tracking"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
originated: 2021-10
traces-from: "Whitepaper sections 08 (AI Assistant) and 21 (NFTs That Make You Smile)"
follow-on: [zoo-agent-nft]
created: 2025-01-15
tags: [ai, agents, sdk, conservation, monitoring]
requires: [0, 1, 400]
---

# ZIP-405: Conservation Agent SDK

## Abstract

This proposal specifies the Conservation Agent SDK -- a multi-agent framework for building, deploying, and coordinating AI agents that perform conservation tasks. The SDK defines four core agent types: SentinelAgent (real-time threat alerts from sensor feeds), PatrolAgent (optimal patrol route generation for anti-poaching teams), MigrationAgent (animal migration pattern tracking and prediction), and AnalystAgent (cross-source data synthesis and reporting). Agents communicate via a shared message bus, persist state to a conservation knowledge graph, and report findings on-chain via ZIP-400 (DSO) for verifiable impact measurement. The architecture follows the Hanzo HIP-0009 Agent SDK pattern for multi-agent coordination and tool use.

## Motivation

Conservation fieldwork depends on timely intelligence. Rangers need to know where to patrol; researchers need to track migration shifts; managers need synthesized reports across data sources. Today, each task uses bespoke scripts, manual analysis, or no automation at all.

1. **Alert Latency**: A camera trap detects a poacher at 2 AM, but the image sits in an SD card until a ranger checks it days later. SentinelAgents process feeds in real time and dispatch alerts within seconds.
2. **Patrol Inefficiency**: Anti-poaching patrols cover only 15-30% of a protected area on any given day. PatrolAgents optimize routes based on threat models, terrain, and historical incident data to maximize coverage.
3. **Migration Blindness**: Climate change is shifting migration corridors, but detecting these shifts requires correlating GPS collar data, satellite imagery, and weather patterns across years. MigrationAgents automate this analysis.
4. **Reporting Burden**: Conservation managers spend 30-40% of their time compiling reports for funders. AnalystAgents synthesize data across sources into structured reports automatically.
5. **Composability**: Individual analysis tools exist but cannot communicate. A multi-agent framework allows agents to share findings, trigger each other, and produce coordinated responses.

## Specification

### Agent Type Definitions

```typescript
/**
 * Base agent interface following HIP-0009 Agent SDK pattern.
 * All conservation agents implement this interface.
 */
interface ConservationAgent {
  /** Unique agent identifier */
  readonly agentId: string;

  /** Agent type classification */
  readonly agentType: AgentType;

  /** Human-readable name */
  readonly name: string;

  /** Geographic region this agent covers */
  readonly region: GeoRegion;

  /** Initialize agent with configuration and tool access */
  initialize(config: AgentConfig): Promise<void>;

  /** Process an incoming message from the message bus */
  handleMessage(message: AgentMessage): Promise<AgentResponse>;

  /** Execute the agent's primary task loop */
  run(context: ExecutionContext): Promise<AgentResult>;

  /** Gracefully shut down the agent */
  shutdown(): Promise<void>;

  /** Get current agent status and health */
  status(): AgentStatus;
}

type AgentType = "sentinel" | "patrol" | "migration" | "analyst";

interface AgentConfig {
  /** Data sources this agent can access */
  dataSources: DataSourceConfig[];

  /** Tools the agent can invoke */
  tools: ToolDefinition[];

  /** LLM configuration for reasoning (via LLM Gateway / LP-7106) */
  llm: LLMConfig;

  /** Knowledge graph connection for state persistence */
  knowledgeGraph: KnowledgeGraphConfig;

  /** Message bus for inter-agent communication */
  messageBus: MessageBusConfig;

  /** On-chain reporting configuration (ZIP-400 DSO) */
  onChainReporter?: OnChainReporterConfig;
}
```

### SentinelAgent -- Real-Time Threat Detection

```typescript
/**
 * SentinelAgent monitors sensor feeds in real time and dispatches
 * alerts when threats are detected. Operates 24/7 with sub-minute
 * response times.
 *
 * Data sources: camera traps, acoustic monitors, satellite alerts,
 * perimeter sensors, drone feeds.
 */
interface SentinelAgent extends ConservationAgent {
  readonly agentType: "sentinel";

  /** Register a sensor feed for continuous monitoring */
  registerFeed(feed: SensorFeed): Promise<void>;

  /** Unregister a sensor feed */
  unregisterFeed(feedId: string): Promise<void>;

  /** Get all active alerts */
  getActiveAlerts(): Promise<Alert[]>;

  /** Acknowledge and close an alert */
  acknowledgeAlert(alertId: string, resolution: string): Promise<void>;
}

interface SensorFeed {
  feedId: string;
  type: "camera_trap" | "acoustic" | "satellite" | "perimeter" | "drone";
  endpoint: string;        // URL or stream endpoint
  location: GeoPoint;
  pollIntervalMs: number;  // 0 for push-based streams
  classifierModel: string; // Model ID for threat classification
}

interface Alert {
  alertId: string;
  severity: "low" | "medium" | "high" | "critical";
  threatType: "poaching" | "fire" | "encroachment" | "pollution" | "unknown";
  location: GeoPoint;
  timestamp: Date;
  source: SensorFeed;
  confidence: number;       // 0.0 - 1.0
  evidence: EvidenceBundle;
  status: "active" | "acknowledged" | "resolved" | "false_positive";
  dispatchedTo?: string[];  // Agent IDs or ranger IDs notified
}

interface EvidenceBundle {
  images?: string[];        // IPFS CIDs of captured images
  audioClips?: string[];    // IPFS CIDs of audio recordings
  sensorReadings: Record<string, number>;
  classifierOutput: ClassificationResult;
}
```

### PatrolAgent -- Route Optimization

```typescript
/**
 * PatrolAgent generates optimized patrol routes for anti-poaching
 * and monitoring teams. Routes maximize area coverage and threat
 * interception probability given terrain, team size, and time budget.
 */
interface PatrolAgent extends ConservationAgent {
  readonly agentType: "patrol";

  /** Generate an optimized patrol route */
  generateRoute(params: PatrolParameters): Promise<PatrolRoute>;

  /** Update a route in real time based on new intelligence */
  updateRoute(routeId: string, newIntel: Alert[]): Promise<PatrolRoute>;

  /** Get historical patrol effectiveness metrics */
  getEffectiveness(timeRange: TimeRange): Promise<PatrolMetrics>;
}

interface PatrolParameters {
  /** Protected area boundary */
  areaBounds: GeoPolygon;

  /** Number of patrol teams */
  teamCount: number;

  /** Available patrol hours per team */
  hoursPerTeam: number;

  /** Terrain data (elevation, vegetation density, road network) */
  terrainData: TerrainDataset;

  /** Historical poaching incident locations and times */
  incidentHistory: IncidentRecord[];

  /** Current active alerts from SentinelAgents */
  activeAlerts: Alert[];

  /** Weighting: coverage vs. threat response */
  coverageWeight: number;    // 0.0 - 1.0
  threatResponseWeight: number;  // 0.0 - 1.0 (must sum to 1.0 with above)
}

interface PatrolRoute {
  routeId: string;
  team: string;
  waypoints: GeoPoint[];
  estimatedDurationHours: number;
  coverageAreaKm2: number;
  threatInterceptionProb: number;
  terrain: TerrainSummary;
  generatedAt: Date;
}

interface PatrolMetrics {
  totalPatrolHours: number;
  areaCoveredKm2: number;
  incidentsDetected: number;
  responseTimeMinutes: { p50: number; p95: number };
  coveragePercentage: number;
}
```

### MigrationAgent -- Movement Pattern Tracking

```typescript
/**
 * MigrationAgent tracks and predicts animal migration patterns
 * by correlating GPS collar data, satellite imagery, weather
 * patterns, and historical movement records.
 */
interface MigrationAgent extends ConservationAgent {
  readonly agentType: "migration";

  /** Ingest GPS collar track data */
  ingestTracks(tracks: GPSTrack[]): Promise<void>;

  /** Analyze current migration patterns for a species */
  analyzePatterns(species: string, timeRange: TimeRange): Promise<MigrationAnalysis>;

  /** Predict future migration corridor based on climate projections */
  predictCorridor(
    species: string,
    climateScenario: string,
    targetYear: number
  ): Promise<PredictedCorridor>;

  /** Detect anomalies in migration behavior */
  detectAnomalies(species: string): Promise<MigrationAnomaly[]>;
}

interface GPSTrack {
  animalId: string;
  species: string;
  points: Array<{
    lat: number;
    lng: number;
    altitude: number;
    timestamp: Date;
    speed: number;
    heading: number;
  }>;
}

interface MigrationAnalysis {
  species: string;
  corridors: GeoPolygon[];       // Identified migration corridors
  timing: {
    startMonth: number;
    peakMonth: number;
    endMonth: number;
    durationDays: number;
  };
  populationEstimate: number;
  comparedToBaseline: {
    corridorShiftKm: number;     // How far corridors have shifted
    timingShiftDays: number;     // How much timing has changed
    populationChange: number;    // Percentage change in migrating count
  };
  riskZones: RiskZone[];         // Areas where migration crosses threats
}

interface MigrationAnomaly {
  anomalyId: string;
  type: "route_deviation" | "timing_shift" | "population_drop" | "barrier_detected";
  severity: "low" | "medium" | "high";
  description: string;
  affectedAnimals: string[];
  location: GeoPoint;
  detectedAt: Date;
}
```

### AnalystAgent -- Data Synthesis and Reporting

```typescript
/**
 * AnalystAgent synthesizes data from all other agents, conservation
 * databases, and external sources into structured reports and
 * actionable insights.
 */
interface AnalystAgent extends ConservationAgent {
  readonly agentType: "analyst";

  /** Generate a conservation status report */
  generateReport(params: ReportParameters): Promise<ConservationReport>;

  /** Answer a natural language question using conservation data */
  query(question: string, context?: QueryContext): Promise<AnalystResponse>;

  /** Generate on-chain impact summary for ZIP-501 reporting */
  generateImpactSummary(timeRange: TimeRange): Promise<ImpactSummary>;
}

interface ReportParameters {
  region: GeoRegion;
  timeRange: TimeRange;
  reportType: "weekly" | "monthly" | "quarterly" | "incident" | "custom";
  sections: ReportSection[];
  audience: "rangers" | "management" | "funders" | "public";
  format: "markdown" | "pdf" | "json";
}

type ReportSection =
  | "threat_summary"
  | "patrol_effectiveness"
  | "migration_status"
  | "population_trends"
  | "habitat_change"
  | "funding_allocation"
  | "recommendations";

interface ConservationReport {
  reportId: string;
  title: string;
  generatedAt: Date;
  sections: Array<{
    name: ReportSection;
    content: string;
    data: Record<string, unknown>;
    visualizations: string[];  // IPFS CIDs of generated charts/maps
  }>;
  summary: string;
  recommendations: string[];
  dataSourcesCited: string[];
}
```

### Inter-Agent Communication

```typescript
/**
 * Message bus for agent coordination.
 * Agents publish findings and subscribe to relevant topics.
 */
interface AgentMessage {
  messageId: string;
  fromAgent: string;
  toAgent?: string;         // Null for broadcast
  topic: MessageTopic;
  priority: "low" | "normal" | "high" | "urgent";
  payload: unknown;
  timestamp: Date;
  correlationId?: string;   // Links related messages across agents
}

type MessageTopic =
  | "alert.new"             // SentinelAgent detected a threat
  | "alert.resolved"        // Alert resolved
  | "patrol.route_update"   // PatrolAgent has a new/updated route
  | "patrol.request"        // Request PatrolAgent to generate a route
  | "migration.anomaly"     // MigrationAgent detected unusual movement
  | "migration.corridor"    // New migration corridor data available
  | "analyst.report"        // AnalystAgent produced a report
  | "analyst.query"         // Request AnalystAgent to answer a question
  | "system.heartbeat"      // Agent health check
  | "system.shutdown";      // Coordinated shutdown signal

/**
 * Example coordination flow:
 *
 * 1. SentinelAgent detects gunshots via acoustic monitor
 *    -> publishes alert.new { severity: "critical", threatType: "poaching" }
 *
 * 2. PatrolAgent receives alert.new
 *    -> updates active patrol routes to intercept
 *    -> publishes patrol.route_update with new waypoints
 *
 * 3. MigrationAgent receives alert.new
 *    -> checks if threat location overlaps active migration corridor
 *    -> publishes migration.anomaly if animals are diverting
 *
 * 4. AnalystAgent receives all messages
 *    -> logs incident for reporting
 *    -> generates incident report if severity >= high
 */
```

### SDK Initialization and Deployment

```typescript
import { ConservationAgentSDK } from "@zoo/conservation-agent-sdk";

// Initialize the SDK
const sdk = new ConservationAgentSDK({
  region: {
    name: "Serengeti-Mara Ecosystem",
    bounds: { nw: [-1.0, 33.5], se: [-3.5, 36.5] },
  },
  llm: {
    gatewayUrl: "https://llm.hanzo.ai",      // Hanzo LLM Gateway
    model: "zllm-ecology-v1",                  // ZIP-404 domain adapter
    apiKey: process.env.ZOO_LLM_API_KEY,
  },
  knowledgeGraph: {
    endpoint: "bolt://conservation-kg:7687",
    database: "serengeti",
  },
  messageBus: {
    type: "nats",
    url: "nats://agents.zoo.ngo:4222",
  },
  onChainReporter: {
    rpcUrl: "https://rpc.zoo.ngo",
    contractAddress: "0x...",                  // ZIP-400 DSO contract
    signerKey: process.env.ZOO_AGENT_KEY,
  },
});

// Deploy agents
const sentinel = await sdk.createAgent("sentinel", {
  name: "Serengeti Sentinel Alpha",
  feeds: [
    { type: "camera_trap", endpoint: "rtsp://cam-grid-01.serengeti.local/stream" },
    { type: "acoustic", endpoint: "ws://acoustic-array.serengeti.local/feed" },
  ],
});

const patrol = await sdk.createAgent("patrol", {
  name: "Serengeti Patrol Optimizer",
  terrainDataPath: "/data/serengeti/terrain.tif",
  teamCount: 8,
});

const migration = await sdk.createAgent("migration", {
  name: "Mara Migration Tracker",
  species: ["Connochaetes taurinus", "Equus quagga"],
  collarDataEndpoint: "https://movebank.org/api/serengeti-collars",
});

const analyst = await sdk.createAgent("analyst", {
  name: "Serengeti Analyst",
  reportSchedule: { type: "weekly", dayOfWeek: "monday" },
  audience: "management",
});

// Start all agents
await sdk.startAll();
```

### On-Chain Impact Reporting

Agents report verifiable conservation outcomes on-chain via ZIP-400 DSO:

```typescript
interface OnChainImpactReport {
  /** Report period */
  period: { start: Date; end: Date };

  /** Threats detected and response metrics */
  threats: {
    detected: number;
    responded: number;
    avgResponseTimeMinutes: number;
    falsePositiveRate: number;
  };

  /** Patrol coverage metrics */
  patrol: {
    totalHours: number;
    areaCoveredKm2: number;
    coveragePercentage: number;
  };

  /** Species monitoring metrics */
  species: Array<{
    name: string;
    populationEstimate: number;
    trend: "increasing" | "stable" | "decreasing";
    migrationStatus: string;
  }>;

  /** Hash of the full detailed report for verification */
  detailedReportHash: string;

  /** IPFS CID of the full report */
  detailedReportURI: string;
}
```

## Rationale

- **Four agent types** cover the primary conservation intelligence needs. Additional specialized agents (e.g., WaterQualityAgent, FireDetectionAgent) can be built by extending the base `ConservationAgent` interface without modifying the SDK core.
- **Message bus coordination** over direct agent-to-agent calls enables loose coupling. Agents can be added, removed, or replaced without modifying other agents. The publish-subscribe model naturally handles one-to-many notifications (a single alert triggers patrol, migration, and analyst responses).
- **Hanzo LLM Gateway integration** via LP-7106 provides access to zLLM domain-adapted models (ZIP-404) without embedding model weights in the agent runtime. Agents reason about conservation data using domain-expert LLMs.
- **On-chain impact reporting** provides verifiable proof of agent effectiveness for conservation funders and DAO governance. Reports are content-addressed and hash-verified, ensuring tamper-evidence.
- **TypeScript SDK** follows the Hanzo HIP-0009 Agent SDK pattern for consistency across the Hanzo/Zoo ecosystem. TypeScript provides strong typing for complex data structures while remaining accessible to the conservation technology community.

## Security Considerations

1. **Sensor Feed Authentication**: All sensor feeds MUST use TLS and authenticate via API keys or mutual TLS certificates. Unauthenticated feeds could inject false data, causing alert fatigue or masking real threats.
2. **Agent Key Management**: The on-chain reporter signing key grants write access to the DSO contract. Keys MUST be stored in a hardware security module (HSM) or KMS (ZIP-014). Compromised keys could submit false impact reports.
3. **Location Data Privacy**: GPS collar data and patrol routes reveal sensitive information (animal locations, patrol gaps). All location data MUST be encrypted at rest and in transit. Raw coordinates of critically endangered species MUST be obfuscated per ZIP-510.
4. **Model Poisoning**: If the zLLM domain adapter (ZIP-404) used by agents is poisoned, agents could make incorrect recommendations. Mitigation: version-pinned adapters with benchmark validation before deployment.
5. **Alert Fatigue**: An adversary could trigger numerous false sensor readings to overwhelm rangers with alerts. Mitigation: SentinelAgent implements confidence thresholds and deduplication; alerts below 0.8 confidence are logged but not dispatched.
6. **Inter-Agent Trust**: Agents on the message bus must authenticate. A rogue agent could publish false alerts or corrupt the knowledge graph. Mitigation: message signing with agent-specific keys; knowledge graph writes require agent authentication.

## References

1. [ZIP-0: Zoo Ecosystem Architecture Framework](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-1: Hamiltonian LLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
3. [ZIP-400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
4. [ZIP-404: zLLM Architecture Specification](./zip-0404-zllm-architecture-specification.md)
5. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
6. [HIP-0009: Hanzo Agent SDK](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0009.md)
7. [LP-7106: LLM Gateway Integration](https://github.com/luxfi/lps/blob/main/LPs/lp-7106.md)
8. [SMART Conservation Tools](https://smartconservationtools.org/)
9. [Movebank Animal Tracking](https://www.movebank.org/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
