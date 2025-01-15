---
zip: 303
title: "Multiplayer Conservation Game Protocol"
description: "Peer-to-peer multiplayer protocol for real-time conservation games with state synchronization and anti-cheat"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
created: 2025-01-15
tags: [gaming, multiplayer, p2p, conservation, networking]
requires: [0, 4, 300, 301]
---

# ZIP-303: Multiplayer Conservation Game Protocol

## Abstract

This proposal defines a peer-to-peer multiplayer protocol for conservation games within the Zoo ecosystem. The protocol provides deterministic state synchronization, session discovery, and anti-cheat verification without relying on centralized game servers. Players connect via a libp2p-based overlay network, exchange game state using a delta-compressed CRDT model, and anchor session outcomes on-chain for reward eligibility under ZIP-301. The protocol supports cooperative conservation scenarios (joint habitat restoration, coordinated patrols) and competitive modes (leaderboard challenges per ZIP-305) with sub-200ms state propagation for up to 64 concurrent players per session.

## Motivation

Conservation games in the Zoo ecosystem are inherently social. Habitat restoration is more engaging and effective when players collaborate. Anti-poaching patrol simulations require coordination. Ecological surveying benefits from distributed effort. Yet existing blockchain game protocols either rely on centralized relay servers (single point of failure, censorship risk) or treat every state change as an on-chain transaction (prohibitive gas costs, unacceptable latency).

1. **Latency**: On-chain state updates take seconds to minutes. Real-time multiplayer requires sub-200ms round-trip times. The protocol must operate off-chain with periodic on-chain anchoring.
2. **Cost**: Writing every player action on-chain is economically infeasible. Only session summaries and outcomes need on-chain finality.
3. **Decentralization**: Centralized servers can be shut down, censored, or exploited. P2P networking removes this dependency.
4. **Integrity**: Without a trusted server, players could cheat by sending false state. Deterministic simulation with hash-chain verification ensures all peers agree on game state.

## Specification

### 1. Network Layer

Sessions use libp2p with the following transports and protocols:

```
Transport: QUIC (primary), WebSocket (fallback)
Discovery: mDNS (LAN), DHT (WAN), Rendezvous (session matchmaking)
Encryption: Noise protocol (XX handshake)
Muxing: Yamux
```

#### 1.1 Session Discovery

```typescript
interface SessionAdvertisement {
  sessionId: string;          // Unique session identifier
  gameId: string;             // ZIP-300 registered game ID
  mode: "cooperative" | "competitive" | "mixed";
  maxPlayers: number;         // 2-64
  currentPlayers: number;
  region: GeoRegion;          // Habitat region for this session
  minReputation: number;      // Minimum player reputation score
  createdAt: number;
  hostPeerId: string;         // libp2p peer ID of session creator
}
```

Players discover sessions via the Zoo DHT namespace `/zoo/games/<gameId>/sessions`.

#### 1.2 State Synchronization

Game state is modeled as a CRDT (Conflict-free Replicated Data Type) with deterministic merge semantics:

```typescript
interface GameState {
  epoch: number;                          // Monotonic tick counter
  players: Map<string, PlayerState>;      // Peer ID -> state
  habitat: HabitatState;                  // Shared environment state
  events: OrderedEventLog;                // Deterministic event sequence
  stateHash: string;                      // SHA-256 of serialized state
}

interface PlayerState {
  peerId: string;
  position: [number, number, number];
  action: PlayerAction;
  inventory: Item[];
  conservationScore: number;
  lastUpdate: number;
}
```

State deltas are broadcast every 50ms. Full state snapshots are exchanged every 5 seconds for consistency verification. If a peer's state hash diverges, they must resync from the majority-agreed snapshot.

### 2. Anti-Cheat Verification

Each peer maintains a hash chain of state transitions:

```
H(0) = hash(genesis_state)
H(n) = hash(H(n-1) || delta(n) || timestamp(n))
```

At session end, all peers submit their final hash chain to the session smart contract. If a supermajority (>= 2/3) of peers agree on the final state hash, the session is valid. Divergent peers are flagged and their rewards withheld pending dispute resolution.

### 3. On-Chain Anchoring

Only session outcomes are written on-chain:

```solidity
struct SessionResult {
    bytes32 sessionId;
    bytes32 gameId;
    bytes32 finalStateHash;
    address[] participants;
    uint256[] conservationScores;
    uint64 startTime;
    uint64 endTime;
    uint8 consensusCount;     // Peers agreeing on finalStateHash
}
```

The session host submits the result with signatures from participating peers. The contract verifies the supermajority threshold before recording the result and unlocking ZIP-301 reward eligibility.

### 4. Cooperative Mechanics

Cooperative sessions define shared objectives with contribution tracking:

```typescript
interface CooperativeObjective {
  objectiveId: string;
  description: string;        // e.g., "Restore 500 hectares of coral reef"
  targetValue: number;
  currentValue: number;
  contributions: Map<string, number>;  // Peer ID -> individual contribution
  deadline: number;
}
```

Contributions are recorded in the CRDT state and attributed to individual players for proportional reward distribution.

## Rationale

- **libp2p over custom networking**: libp2p provides battle-tested transports, encryption, and discovery. Building custom P2P networking is unnecessary when a mature stack exists and is already used by the Lux node (ZIP-015).
- **CRDT over lockstep**: Lockstep simulation requires all peers to advance in sync, making it fragile to latency spikes. CRDTs allow optimistic local updates with eventual consistency, better suited for conservation games where millisecond precision is less critical than responsiveness.
- **Supermajority consensus**: Requiring 2/3 agreement mirrors BFT consensus principles. A single cheating peer cannot corrupt the session result. Colluding minorities are detectable through divergent hash chains.
- **Periodic anchoring**: Writing only session outcomes on-chain reduces costs by 99%+ compared to per-action transactions while preserving verifiability.

## Security Considerations

1. **Sybil attacks**: A player could spawn multiple peers to control the supermajority. Mitigation: each participant must hold a valid Lux ID with minimum account age and reputation, verified at session join via signed challenge-response.
2. **Eclipse attacks**: An attacker could isolate a peer by surrounding it with malicious nodes. Mitigation: peers maintain connections to at least 3 other participants and verify state hashes against the DHT-published session state.
3. **Replay attacks**: An attacker could replay old session results. Mitigation: session IDs include a timestamp nonce and the contract rejects duplicate session IDs.
4. **Denial of service**: A peer could flood the session with invalid deltas. Mitigation: rate limiting at 20 deltas/second per peer; peers exceeding the limit are disconnected by majority vote.
5. **State manipulation**: A modified client could report false conservation scores. Mitigation: deterministic simulation means all peers compute scores independently; divergent scores are caught by the hash chain.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-300: Virtual Habitat Simulation](./zip-0300-virtual-habitat-simulation-protocol.md)
4. [ZIP-301: Play-to-Conserve Mechanics](./zip-0301-play-to-conserve-game-mechanics.md)
5. [libp2p Specification](https://github.com/libp2p/specs)
6. Shapiro, M. et al. "Conflict-free Replicated Data Types." SSS 2011.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
