---
zip: 305
title: "Leaderboard Oracle"
description: "On-chain oracle for conservation gaming achievement leaderboards with verifiable score aggregation"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
created: 2025-01-15
tags: [gaming, oracle, leaderboard, achievements, on-chain]
requires: [0, 4, 301, 303]
---

# ZIP-305: Leaderboard Oracle

## Abstract

This proposal defines an on-chain leaderboard oracle that aggregates conservation gaming achievement scores across all Zoo ecosystem games into a unified, tamper-proof ranking system. The oracle collects session results from ZIP-303 multiplayer sessions and ZIP-301 Play-to-Conserve transactions, computes composite scores weighted by conservation impact, and publishes ranked leaderboards on-chain. Scores are verifiable by any party against the underlying session data. The oracle supports seasonal resets, category-specific boards, and anti-gaming mechanisms to ensure rankings reflect genuine conservation engagement.

## Motivation

Leaderboards drive player engagement and create visible recognition for conservation effort. However, game-specific leaderboards fragment the community and are vulnerable to manipulation by game operators. A cross-game, on-chain leaderboard provides:

1. **Unified recognition**: A player's conservation contributions across all Zoo games are aggregated into a single reputation score visible ecosystem-wide.
2. **Tamper-proof rankings**: On-chain publication prevents any single game or operator from inflating or suppressing scores.
3. **Incentive alignment**: Composite scores weighted toward conservation impact (not raw play time) align player behavior with Zoo's mission.
4. **Seasonal engagement**: Periodic resets with historical archives maintain competitive tension while recognizing long-term contributors.

## Specification

### 1. Score Aggregation

The oracle computes composite scores from multiple input sources:

```typescript
interface LeaderboardEntry {
  playerId: string;              // Lux ID
  compositeScore: number;        // Weighted aggregate
  breakdown: ScoreBreakdown;
  rank: number;
  season: number;
  lastUpdated: number;
}

interface ScoreBreakdown {
  conservationFunding: number;   // ZOO tokens contributed (ZIP-301)
  educationalScore: number;      // Assessment performance (ZIP-301)
  multiplayerWins: number;       // Session victories (ZIP-303)
  cooperativeObjectives: number; // Completed co-op goals (ZIP-303)
  speciesDiscovered: number;     // Unique species encountered
  habitatsRestored: number;      // Virtual habitats restored
  streakBonus: number;           // Consecutive daily participation
}

// Composite formula
const WEIGHTS = {
  conservationFunding: 0.30,
  educationalScore: 0.25,
  cooperativeObjectives: 0.20,
  multiplayerWins: 0.10,
  speciesDiscovered: 0.05,
  habitatsRestored: 0.05,
  streakBonus: 0.05,
};
```

Conservation funding and educational scores receive the highest weights, ensuring the leaderboard rewards mission-aligned behavior over pure gaming skill.

### 2. Oracle Contract

```solidity
contract LeaderboardOracle {
    struct Entry {
        address player;
        uint128 compositeScore;
        uint64 lastUpdated;
        uint32 rank;
        uint16 season;
    }

    // Season configuration
    uint16 public currentSeason;
    uint64 public seasonStartTime;
    uint64 public constant SEASON_DURATION = 90 days;

    // Leaderboard categories
    mapping(bytes32 => mapping(address => Entry)) public boards;

    // Authorized score reporters (registered game contracts)
    mapping(address => bool) public authorizedReporters;

    event ScoreUpdated(
        bytes32 indexed boardId,
        address indexed player,
        uint128 newScore,
        uint16 season
    );

    function reportScore(
        address player,
        bytes32 boardId,
        uint128 score,
        bytes calldata proof
    ) external onlyAuthorizedReporter {
        require(verifyScoreProof(player, score, proof), "Invalid proof");
        Entry storage entry = boards[boardId][player];
        entry.compositeScore = score;
        entry.lastUpdated = uint64(block.timestamp);
        entry.season = currentSeason;
        emit ScoreUpdated(boardId, player, score, currentSeason);
    }

    function advanceSeason() external {
        require(
            block.timestamp >= seasonStartTime + SEASON_DURATION,
            "Season not ended"
        );
        currentSeason++;
        seasonStartTime = uint64(block.timestamp);
        emit SeasonAdvanced(currentSeason);
    }
}
```

### 3. Leaderboard Categories

| Board ID | Category | Description |
|----------|----------|-------------|
| `global` | Overall | Composite score across all metrics |
| `conservation` | Conservation Impact | Funding + habitat restoration only |
| `education` | Education | Assessment scores + species discovered |
| `multiplayer` | Competitive | Session wins + cooperative completions |
| `seasonal` | Current Season | Same as global but resets quarterly |

### 4. Anti-Gaming Mechanisms

- **Score decay**: Inactive players lose 2% of their score per week to prevent early-season score hoarding.
- **Diminishing returns**: Each additional unit of any metric contributes less to the composite score (logarithmic scaling).
- **Cross-game minimum**: Players must have scores from at least 2 different games to appear on the global leaderboard.
- **Outlier detection**: Scores more than 4 standard deviations above the mean trigger automatic review before publication.

### 5. Score Verification

Any party can verify a player's score against the underlying data:

```typescript
interface ScoreProof {
  playerId: string;
  season: number;
  sessionResults: bytes32[];     // Merkle root of session hashes
  fundingReceipts: bytes32[];    // Merkle root of funding tx hashes
  assessmentHashes: bytes32[];   // Merkle root of assessment results
  merkleRoot: string;
  signature: string;             // Oracle operator signature
}
```

## Rationale

- **On-chain oracle over off-chain API**: An off-chain leaderboard can be manipulated by its operator. On-chain publication makes rankings a public good that any game, wallet, or dApp can read without trusting a single party.
- **Weighted composite scoring**: Raw metrics (total tokens spent, total sessions played) reward whale spending and grind time. Weights favoring conservation impact and education align the leaderboard with Zoo's mission.
- **Seasonal resets**: Permanent leaderboards become stale as early adopters accumulate insurmountable leads. 90-day seasons keep competition accessible while historical archives preserve legacy recognition.
- **Logarithmic diminishing returns**: Prevents a single whale from dominating by spending orders of magnitude more than average players. The top rank must be earned broadly, not bought narrowly.

## Security Considerations

1. **Reporter compromise**: If a game contract is compromised, it could submit inflated scores. Mitigation: the oracle verifies score proofs against on-chain session results (ZIP-303) and funding transactions (ZIP-301). Scores without matching on-chain evidence are rejected.
2. **Sybil leaderboard manipulation**: A player could create multiple accounts to inflate cooperative objective counts. Mitigation: Lux ID uniqueness enforcement and minimum account age requirements.
3. **Front-running season end**: Players could time large contributions just before season end. Mitigation: score decay applies retroactively, and the composite formula uses time-weighted averages rather than raw sums.
4. **Oracle liveness**: If the oracle fails to update, scores become stale. Mitigation: any authorized reporter can trigger score updates; the oracle is not a single operator but a set of registered game contracts.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-301: Play-to-Conserve Mechanics](./zip-0301-play-to-conserve-game-mechanics.md)
4. [ZIP-303: Multiplayer Conservation Game Protocol](./zip-0303-multiplayer-conservation-game-protocol.md)
5. Breidenbach, B. et al. "Chainlink Off-Chain Reporting." 2021.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
