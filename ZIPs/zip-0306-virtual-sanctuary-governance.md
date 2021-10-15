---
zip: 306
title: "Virtual Sanctuary Governance"
description: "DAO governance framework for collectively managing virtual wildlife sanctuaries in Zoo conservation games"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Gaming
originated: 2021-10
traces-from: "Whitepaper section 19 (Zoo DAO)"
created: 2025-01-15
tags: [gaming, governance, dao, sanctuary, conservation]
requires: [0, 4, 203, 300, 301]
---

# ZIP-306: Virtual Sanctuary Governance

## Abstract

This proposal defines a DAO governance framework for virtual wildlife sanctuaries within Zoo ecosystem games. A virtual sanctuary is a persistent, player-managed game environment linked to a real-world conservation project. Sanctuary stakeholders (players who hold fractional habitat NFTs per ZIP-203) collectively govern the sanctuary through on-chain proposals and voting: which species to introduce, how to allocate conservation funds, what research priorities to set, and how to respond to in-game ecological events. The framework enforces ecological constraints so that governance decisions must be scientifically plausible, preventing players from making choices that would be ecologically destructive in the real world.

## Motivation

Virtual sanctuaries (ZIP-300) are the persistent worlds where conservation games take place. Today, these environments are developer-controlled. Players interact with them but have no say in their management. This misses an opportunity:

1. **Ownership through governance**: Players who invest time and funds in a sanctuary should have a voice in its direction. DAO governance transforms passive players into active stewards.
2. **Conservation education**: Governing a virtual ecosystem teaches real ecological trade-offs. Introducing a predator affects prey populations; allocating funds to one species diverts from another.
3. **Aligned incentives**: When sanctuary governance decisions affect conservation fund allocation (ZIP-301), players who govern well generate more real-world impact.
4. **Community resilience**: DAO governance prevents single points of failure. If a game developer abandons a project, the community can continue managing the sanctuary.

## Specification

### 1. Sanctuary DAO Structure

Each virtual sanctuary is governed by a dedicated DAO instance:

```solidity
contract SanctuaryDAO {
    struct Sanctuary {
        bytes32 sanctuaryId;
        bytes32 habitatId;             // ZIP-300 habitat
        address habitatNft;            // ZIP-203 fractional NFT contract
        uint256 totalShares;
        bytes32 linkedConservationProject;  // Real-world project ID
        bool active;
    }

    struct Proposal {
        uint256 proposalId;
        address proposer;
        ProposalType proposalType;
        bytes data;                    // Encoded proposal details
        uint256 votesFor;
        uint256 votesAgainst;
        uint64 startTime;
        uint64 endTime;
        bool executed;
        bool ecologicallyValid;        // Validated by ecology oracle
    }

    enum ProposalType {
        SPECIES_INTRODUCTION,
        SPECIES_RELOCATION,
        FUND_ALLOCATION,
        RESEARCH_PRIORITY,
        HABITAT_MODIFICATION,
        EMERGENCY_RESPONSE,
        PARAMETER_CHANGE
    }

    // Voting power = fractional NFT shares (ZIP-203)
    function getVotingPower(address voter) public view returns (uint256) {
        return IFractionalHabitatNFT(sanctuary.habitatNft).balanceOf(voter);
    }
}
```

### 2. Ecological Validation

All proposals that affect the virtual ecosystem must pass ecological validation before execution:

```typescript
interface EcologyOracle {
  validateProposal(proposal: Proposal): Promise<EcologyValidation>;
}

interface EcologyValidation {
  valid: boolean;
  ecologicalImpact: {
    biodiversityScore: number;   // -1.0 to +1.0
    carryingCapacity: boolean;   // Within habitat limits?
    trophicBalance: boolean;     // Food web remains stable?
    invasiveRisk: boolean;       // Introduces invasive species?
  };
  reasoning: string;             // Human-readable explanation
  constraints: string[];         // Violated ecological rules
}
```

The ecology oracle is an AI agent (ZIP-405) that evaluates proposals against established ecological models. Proposals that fail validation (e.g., introducing a species that would collapse the food web) are rejected regardless of vote outcome. Players receive the oracle's reasoning as an educational tool.

### 3. Governance Parameters

| Parameter | Default | Range |
|-----------|---------|-------|
| Proposal threshold | 1% of total shares | 0.1% - 5% |
| Voting period | 7 days | 3 - 14 days |
| Quorum | 10% of total shares | 5% - 25% |
| Execution delay | 48 hours | 24 - 72 hours |
| Emergency quorum | 5% of total shares | 2% - 10% |
| Emergency voting period | 24 hours | 12 - 48 hours |

Emergency proposals (fire, disease outbreak, poaching event) use reduced quorum and voting periods to enable rapid response.

### 4. Fund Allocation Governance

Sanctuary DAOs govern how ZIP-301 conservation funds linked to their habitat are allocated:

```typescript
interface FundAllocationProposal {
  totalAmount: number;               // ZOO tokens to allocate
  allocations: Allocation[];
  justification: string;
}

interface Allocation {
  recipient: string;                 // Conservation project or research group
  amount: number;
  category: "species_protection" | "habitat_restoration"
           | "research" | "community" | "education";
  milestones: Milestone[];
}
```

Fund disbursement follows milestone-based release: funds are held in escrow and released as conservation projects report verified progress (ZIP-501).

### 5. Delegation

Stakeholders may delegate their voting power to conservation experts:

```solidity
function delegate(address delegatee) external {
    require(balanceOf(msg.sender) > 0, "No shares");
    delegates[msg.sender] = delegatee;
    emit Delegated(msg.sender, delegatee, getVotingPower(msg.sender));
}
```

Delegation is revocable at any time. Delegatees cannot re-delegate.

## Rationale

- **Fractional NFT voting power**: Using ZIP-203 habitat NFT shares as voting weight aligns governance power with economic stake in the sanctuary. Players who invest more have proportionally more say.
- **Ecological oracle veto**: Unrestricted governance could lead to ecologically nonsensical decisions (e.g., introducing polar bears into a tropical reef). The oracle acts as a scientific guardrail while educating players about why certain decisions are harmful.
- **Emergency governance**: Ecological crises require rapid response. Reduced quorum and voting periods for emergency proposals prevent governance paralysis during time-sensitive events.
- **Milestone-based fund release**: Prevents misallocation by requiring verified progress before releasing funds. Aligns with ZIP-501 conservation impact measurement.

## Security Considerations

1. **Governance capture**: A whale could acquire a majority of fractional NFTs and control the DAO. Mitigation: quadratic voting option (proposal parameter) reduces the power of large holders; maximum voting cap of 10% of total shares per address.
2. **Oracle manipulation**: If the ecology oracle is compromised, it could approve harmful proposals. Mitigation: the oracle is an ensemble of independently-run AI agents; a majority must agree for validation. Oracle responses are logged on-chain for audit.
3. **Proposal spam**: An attacker could flood the DAO with proposals to cause voter fatigue. Mitigation: proposal threshold (1% of shares) creates an economic cost; proposers forfeit a small deposit if their proposal fails to reach quorum.
4. **Flash-loan governance**: An attacker could borrow NFT shares to vote and return them in the same block. Mitigation: voting power snapshots are taken at proposal creation time; shares acquired after snapshot carry no voting weight.
5. **Fund misappropriation**: DAO-approved fund recipients could fail to deliver. Mitigation: milestone-based release and DAO ability to halt disbursement via emergency proposal.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-4: Gaming Standards](./zip-0004-gaming-standards-for-zoo-ecosystem.md)
3. [ZIP-203: Habitat NFT Fractional Ownership](./zip-0203-habitat-nft-fractional-ownership.md)
4. [ZIP-300: Virtual Habitat Simulation](./zip-0300-virtual-habitat-simulation-protocol.md)
5. [ZIP-301: Play-to-Conserve Mechanics](./zip-0301-play-to-conserve-game-mechanics.md)
6. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
7. DeepDAO. "DAO Governance Best Practices." 2024.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
