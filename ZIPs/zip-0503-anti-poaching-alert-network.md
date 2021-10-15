---
zip: 503
title: "Anti-Poaching Alert Network"
description: "Decentralized alert system for real-time poaching detection and coordinated response across conservation areas"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Wildlife
originated: 2021-10
traces-from: "Whitepaper section 01 (Mission)"
follow-on: [zoo-conservation-ai]
created: 2025-01-15
tags: [wildlife, anti-poaching, alerts, decentralized, monitoring]
requires: [0, 405, 500, 501, 510]
---

# ZIP-503: Anti-Poaching Alert Network

## Abstract

This proposal defines a decentralized alert network for real-time poaching detection and coordinated response. The network connects sensor nodes (camera traps, acoustic monitors, drone patrols, satellite feeds), AI detection models (ZIP-401, ZIP-409), conservation agents (ZIP-405 SentinelAgent), and field ranger teams into a unified alert pipeline. Alerts propagate through a gossip protocol with priority-based routing, ensuring critical detections reach responders within 60 seconds. Alert records are anchored on-chain for evidence preservation and impact measurement. The system operates without centralized infrastructure, ensuring continued function even if individual nodes or network segments fail.

## Motivation

Poaching remains the primary direct threat to many endangered species. Current anti-poaching technology suffers from critical gaps:

1. **Alert latency**: Camera traps store images on SD cards retrieved days later. By the time a poacher is detected, they are long gone. Real-time detection and alert delivery can close this gap.
2. **Single points of failure**: Centralized alert servers can be targeted by sophisticated poaching networks. A DDoS attack on the server disables the entire protection system.
3. **Siloed systems**: Adjacent conservation areas often run independent monitoring systems. A poacher crossing from one area to another disappears from detection. Cross-area coordination is essential.
4. **Evidence integrity**: Courts require chain-of-custody for evidence. Alert records stored on a ranger's phone are easily challenged. On-chain anchoring provides tamper-proof evidence trails.
5. **Resource coordination**: When an alert fires, multiple ranger teams may respond redundantly while other areas go unpatrolled. Coordinated dispatch optimizes response coverage.

## Specification

### 1. Alert Schema

```typescript
interface PoachingAlert {
  alertId: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;               // ISO 8601
  location: GeoPoint;
  locationAccuracy: number;        // Meters
  detectionSource: DetectionSource;
  threatDetails: ThreatDetails;
  evidence: EvidenceRecord;
  propagation: PropagationRecord;
  status: AlertStatus;
}

interface DetectionSource {
  sourceType: "camera_trap" | "acoustic" | "drone" | "satellite"
             | "ranger_report" | "community_tip";
  sensorId?: string;
  modelId?: string;                // ZIP-406 attested detection model
  confidence: number;              // 0.0 - 1.0
  agentId?: string;                // ZIP-405 SentinelAgent that processed
}

interface ThreatDetails {
  threatType: "armed_intrusion" | "snare_placement" | "vehicle_incursion"
             | "gunshot_detected" | "chainsaw_detected" | "campfire"
             | "suspicious_movement" | "unknown";
  estimatedPersons: number;
  armed: boolean | null;           // null if unknown
  direction: number;               // Heading in degrees
  speed: number;                   // Estimated m/s
  targetSpecies?: string[];        // If species-targeted poaching
}

interface EvidenceRecord {
  images: ContentAddress[];        // IPFS CIDs
  audio: ContentAddress[];
  video: ContentAddress[];
  sensorData: ContentAddress[];
  onChainHash: string;             // Aggregate evidence hash
  chainOfCustody: CustodyEntry[];
}

type AlertStatus = "active" | "dispatched" | "responding"
                 | "resolved" | "false_positive" | "archived";
```

### 2. Network Topology

The alert network uses a gossip protocol over libp2p:

```
Sensor Nodes (edge)
    |  Detection events
    v
SentinelAgents (ZIP-405)
    |  Classified alerts
    v
Alert Relay Nodes (mesh)
    |  Gossip propagation
    v
Ranger Dispatch Nodes (endpoints)
    |  Dispatch orders
    v
Field Rangers (mobile)
```

Each layer operates independently. If SentinelAgents are offline, sensor nodes can send raw detections directly to relay nodes. If relay nodes fail, SentinelAgents can push alerts directly to ranger devices via SMS fallback.

### 3. Priority Routing

Alerts are routed based on severity:

| Severity | Propagation | Target Latency | Notification |
|----------|-------------|----------------|--------------|
| Critical | Flood to all nodes | < 30 seconds | Push + SMS + radio |
| High | Gossip to region | < 60 seconds | Push + SMS |
| Medium | Gossip to area | < 5 minutes | Push notification |
| Low | Batch delivery | < 30 minutes | Dashboard update |

Critical alerts (armed intrusion, gunshot) trigger flood propagation: every node immediately relays to all connected peers. This ensures maximum delivery probability at the cost of bandwidth.

### 4. On-Chain Evidence Anchoring

```solidity
contract EvidenceAnchor {
    struct AlertEvidence {
        bytes32 alertId;
        bytes32 evidenceHash;       // SHA-256 of all evidence CIDs
        address reporter;
        uint64 timestamp;
        uint8 severity;
        bytes32 locationHash;       // Hash of obfuscated coordinates
    }

    mapping(bytes32 => AlertEvidence) public evidence;

    event EvidenceAnchored(
        bytes32 indexed alertId,
        bytes32 evidenceHash,
        uint64 timestamp
    );

    function anchorEvidence(
        bytes32 alertId,
        bytes32 evidenceHash,
        uint8 severity,
        bytes32 locationHash
    ) external onlyAuthorizedReporter {
        evidence[alertId] = AlertEvidence({
            alertId: alertId,
            evidenceHash: evidenceHash,
            reporter: msg.sender,
            timestamp: uint64(block.timestamp),
            severity: severity,
            locationHash: locationHash
        });
        emit EvidenceAnchored(alertId, evidenceHash, uint64(block.timestamp));
    }
}
```

Evidence is anchored within 5 minutes of alert creation. The on-chain record provides an immutable timestamp and hash for legal proceedings.

### 5. Cross-Area Coordination

Adjacent conservation areas register with the network and define shared boundary zones:

```typescript
interface BoundaryAgreement {
  areas: [string, string];         // Conservation area IDs
  sharedBoundary: GeoLineString;
  alertSharingLevel: "all" | "high_and_above" | "critical_only";
  responseProtocol: "notify" | "coordinate" | "joint_response";
  signatories: string[];           // Area manager Lux IDs
}
```

When an alert fires within 5km of a shared boundary, it is automatically propagated to the adjacent area per the boundary agreement terms.

## Rationale

- **Gossip protocol over pub/sub**: In remote conservation areas, network connectivity is unreliable. Gossip protocols are resilient to partitions and require no central broker. Messages eventually reach all nodes even through intermittent connectivity.
- **Multi-channel notification**: Rangers in the field may lack internet but have cellular or radio coverage. Critical alerts use all available channels to maximize delivery probability.
- **On-chain evidence over cloud storage**: Cloud storage requires trusting a provider and can be legally challenged. On-chain hashes with IPFS content addressing provide tamper-evident, provider-independent evidence chains.
- **Severity-based routing**: Not all alerts require the same urgency. Batching low-severity alerts reduces bandwidth in constrained environments while ensuring critical alerts propagate immediately.

## Security Considerations

1. **False alert injection**: An attacker could flood the network with false alerts to cause alert fatigue or divert rangers. Mitigation: alerts from sensor nodes require cryptographic authentication; community tips require Lux ID with minimum reputation; repeated false alerts from a source trigger automatic throttling.
2. **Alert suppression**: A poaching network could jam or compromise relay nodes to prevent alerts. Mitigation: multi-path gossip ensures alerts propagate through alternative routes; SMS fallback bypasses the mesh network entirely.
3. **Location leakage**: Alert locations reveal patrol gaps and sensor placements. Mitigation: alert propagation uses location hashes; full coordinates are only decrypted at authorized dispatch nodes. Public alert records use ZIP-510 obfuscation.
4. **Evidence tampering**: Raw evidence (images, audio) could be modified before anchoring. Mitigation: sensor nodes hash evidence at capture time using tamper-resistant firmware; hashes are compared against the on-chain anchor.
5. **Ranger safety**: Alert dispatch must not send rangers into ambushes. Mitigation: alerts include estimated threat level; dispatch protocol requires minimum team size for armed intrusion alerts; PatrolAgent (ZIP-405) optimizes approach routes avoiding known threat positions.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-405: Conservation Agent SDK](./zip-0405-conservation-agent-sdk.md)
3. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
4. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
5. [SMART Conservation Tools](https://smartconservationtools.org/)
6. Xu, W. et al. "Real-time Anti-poaching Systems: A Review." Conservation Technology 3(1), 2023.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
