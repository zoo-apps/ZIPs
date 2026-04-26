---
zip: 17
title: "DAO Governance Framework"
description: "Defines the governance structure, voting mechanisms, quorum requirements, and proposal lifecycle for Zoo DAO"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 19 (Zoo DAO)"
follow-on: [zoo-dao-governance, zoo-dao-operating-system]
created: 2025-01-15
tags: [governance, dao, voting, proposals]
---

# ZIP-0017: DAO Governance Framework

## Abstract

This proposal establishes the on-chain governance framework for Zoo Network. It defines the DAO structure, proposal types, voting mechanisms, quorum thresholds, timelock parameters, and the interaction between on-chain governance and the Zoo Labs Foundation board's compliance veto authority as outlined in ZIP-0000.

## Motivation

Zoo Labs Foundation operates as a 501(c)(3) nonprofit with community-driven governance. A formal framework is needed to:

1. **Legitimize decisions**: Provide transparent, verifiable decision-making for treasury and protocol changes
2. **Balance autonomy and compliance**: Preserve community sovereignty while respecting nonprofit legal obligations
3. **Prevent capture**: Ensure no single entity can dominate governance outcomes
4. **Enable iteration**: Allow the governance process itself to evolve through proposals
5. **Coordinate resources**: Direct conservation funding, grants, and protocol upgrades effectively

## Specification

### Governance Architecture

```
Community (ZOO holders)
        │
        ▼
   Proposal Submission
        │
        ▼
   Voting Period (7 days)
        │
        ▼
   Timelock (48 hours)
        │
        ▼
   Board Review Window (24 hours, veto only)
        │
        ▼
   Execution
```

### Proposal Types

| Type | Quorum | Approval | Timelock | Description |
|------|--------|----------|----------|-------------|
| Parameter Change | 4% | >50% | 48h | Adjust protocol parameters |
| Treasury Spend | 10% | >60% | 72h | Allocate funds from treasury |
| Protocol Upgrade | 15% | >66% | 168h (7d) | Smart contract upgrades |
| Emergency Action | 1% | >80% | 0h | Critical security response |
| Meta-Governance | 20% | >75% | 168h | Change governance rules |

### Proposal Lifecycle

```yaml
lifecycle:
  submission:
    minimum_stake: 100000 ZOO  # Anti-spam threshold
    deposit: 10000 ZOO         # Refunded if quorum met
    cooldown: 24h              # Between proposals per address
  discussion:
    duration: 3 days
    forum: governance.zoo.network
  voting:
    duration: 7 days
    method: token-weighted
    delegation: enabled
    options: [For, Against, Abstain]
  timelock:
    standard: 48 hours
    treasury: 72 hours
    upgrade: 168 hours
  execution:
    window: 14 days  # Must execute within window or proposal expires
    executor: any    # Permissionless execution after timelock
```

### Governance Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooGovernor {
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool vetoed;
        ProposalType pType;
    }

    enum ProposalType { Parameter, Treasury, Upgrade, Emergency, Meta }

    mapping(ProposalType => uint256) public quorumBps;
    mapping(ProposalType => uint256) public approvalBps;

    function propose(
        address[] calldata targets,
        bytes[] calldata calldatas,
        string calldata description,
        ProposalType pType
    ) external returns (uint256 proposalId) {
        require(getVotes(msg.sender) >= proposalThreshold(), "below threshold");
        // Create and store proposal
    }

    function castVote(uint256 proposalId, uint8 support) external {
        // Record vote weighted by token balance at snapshot
    }
}
```

### Vote Delegation

Token holders may delegate their voting power to any address without transferring tokens. Delegation is transitive up to one level (A delegates to B, but B cannot re-delegate A's votes).

### Board Veto Mechanism

Per ZIP-0000 Section 15, the Foundation board retains a narrow compliance veto:

- Board may veto only for legal, mission, or donor-restriction violations
- Veto must include a public written justification
- Vetoed proposals enter a 30-day appeal period where a supermajority (80%) can override

## Rationale

The tiered quorum and approval thresholds scale with the impact of the decision. Low-impact parameter changes need only 4% quorum, while changes to governance itself require 20%. This prevents governance fatigue while ensuring high-stakes decisions have broad consensus.

The 100,000 ZOO proposal threshold (~0.01% of supply) balances accessibility against spam. The refundable deposit further deters frivolous proposals without permanently penalizing good-faith participants.

Emergency actions have minimal quorum but require 80% supermajority, enabling rapid response to security incidents while preventing abuse.

## Security Considerations

- **Flash loan attacks**: Voting power is snapshotted at proposal creation block, preventing flash-loan governance attacks
- **Timelock**: All non-emergency actions pass through a timelock, giving users time to exit if they disagree
- **Proposal spam**: Minimum stake and deposit requirements prevent denial-of-service on governance
- **Voter apathy**: Delegation allows active participants to represent passive holders
- **Centralization risk**: No single address may hold more than 5% of delegated voting power (enforced at contract level)

## 2025-12-15 Update: Homomorphic / Holographic Consensus DAO

The DAO described above is the on-chain Solidity surface. As of the
2025-12-15 spec freeze and 2025-12-25 Quasar 3.0 activation, the Zoo
DAO additionally operates as a **homomorphic / holographic consensus
DAO**:

- **Homomorphic**: votes are tallied while encrypted under FHE on
  Lux F-Chain (Lux LP-013). Individual ballots remain private; only
  the aggregate is decrypted, by the M-Chain MPC threshold custodial
  (Lux LP-019), after the voting window closes.
- **Holographic**: every sub-DAO (per-LLM chain, research vertical,
  regional chapter) inherits the meta-DAO governance topology and is
  structurally a small copy of the whole. Sub-DAOs propose and
  ratify locally; cross-shard issues escalate to the meta-DAO.

### Weighted voting (replaces pure token-weighted)

```
weight(p) = α·advocacy + β·involvement + γ·contribution + δ·token_stake
α + β + γ + δ = 1
```

Default initial weights at activation (2025-12-25):

| Axis | Symbol | Default | Source |
|------|--------|---------|--------|
| Advocacy | α | 0.20 | Z-Chain attestation-rooted social signal |
| Involvement | β | 0.30 | A-Chain contribution-graph attestation (Lux LP-134) |
| Contribution | γ | 0.40 | Reproducibility attestation (ZIP-0606) |
| Token stake | δ | 0.10 | Locked $ZOO; bounded to prevent plutocracy |

The weights themselves are governed by the meta-DAO via homomorphic
weighted vote.

### Anti-Sybil

- Advocacy must be on attestation-rooted social platforms; un-rooted
  posts do not count.
- Involvement is computed from TEE-attested commits and reviews on
  Lux A-Chain (Lux LP-134).
- Contribution requires reproducibility attestation per ZIP-0606.
- Token stake is bounded at δ = 0.10 to prevent plutocracy.

### Quantum-secure governance certificates

Every governance vote outcome is settled under Quasar 3.0
(Lux LP-020), composing BLS12-381 (Lux LP-075), Ringtail Ring-LWE
(Lux LP-073), and ML-DSA-65 (Lux LP-070) signatures. Governance keys
are held in M-Chain threshold custody (Lux LP-019).

### Cross-references

- Companion paper: `papers/zoo-2025-securities-and-dao` (full
  treatment, §4).
- Companion paper: `papers/zoo-per-llm-chains` (§11).

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0026: Ecosystem Reputation System](./zip-0026-ecosystem-reputation-system.md)
- [ZIP-0570: Zoo Labs Impact Thesis](./zip-0570-zoo-labs-impact-thesis.md)
- [ZIP-0606: Reproducibility Attestation](./zip-0606-reproducibility-attestation.md)
- Lux LP-013 (F-Chain FHE), LP-019 (M-Chain MPC), LP-020 (Quasar 3.0),
  LP-070 (ML-DSA), LP-073 (Ringtail), LP-075 (BLS), LP-134 (A/B/M/F
  topology)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/governance)
- [Compound Governor Bravo](https://compound.finance/docs/governance)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
