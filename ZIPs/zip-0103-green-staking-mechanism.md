---
zip: 103
title: "Green Staking Mechanism"
description: "Staking that rewards validators for verified conservation outcomes"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
originated: 2021-10
traces-from: "Whitepaper section 10 (Collateral-Backed NFTs)"
created: 2025-01-15
tags: [staking, conservation, proof-of-impact, validators, green]
requires: [0, 100, 101]
---

# ZIP-103: Green Staking Mechanism

## Abstract

This ZIP defines a Green Staking Mechanism for the Zoo L2 chain that extends traditional proof-of-stake economics with a Proof of Impact (PoI) layer. Stakers lock ZOO tokens and, in addition to standard staking rewards, receive bonus yield proportional to verified conservation outcomes they sponsor. Conservation outcomes are measured per ZIP-501 standards and attested on-chain by a decentralized network of impact verifiers. The mechanism creates a direct economic link between network security participation and real-world ecological benefit, transforming staking from a purely financial activity into a conservation funding instrument.

## Motivation

Proof-of-stake networks secure billions in value but produce zero positive externalities beyond network security. The energy saved relative to proof-of-work is often cited as "green," but this framing conflates reduced harm with active benefit.

Zoo as an L2 on Lux inherits primary network security (ZIP-15). However, the Zoo chain operates its own staking layer for governance weight, liquidity provision, and conservation alignment. This staking layer is the target of this proposal.

Key motivations:

1. **Incentive alignment**: Stakers who fund conservation earn more than passive stakers, directing capital toward ecological benefit.
2. **Measurable impact**: Unlike carbon-offset schemes with questionable additionality, Zoo conservation outcomes are verified by independent field partners and attested on-chain.
3. **Competitive differentiation**: Zoo becomes the first L2 where staking directly funds wildlife conservation.
4. **DAO treasury sustainability**: Staking rewards partially fund the conservation treasury, reducing reliance on one-time donations.
5. **veZOO governance**: Long-term stakers with impact commitments gain amplified governance weight, aligning decision-making with mission.

## Specification

### 1. Staking Tiers

Green Staking operates in three tiers based on conservation commitment:

| Tier | Name | Impact Commitment | Reward Multiplier | Lock Period |
|------|------|-------------------|-------------------|-------------|
| 0 | Standard | None | 1.0x | 7 days minimum |
| 1 | Green | 10% of rewards to conservation | 1.15x | 30 days minimum |
| 2 | Deep Green | 25% of rewards to conservation | 1.40x | 90 days minimum |
| 3 | Guardian | 50% of rewards to conservation | 1.75x | 180 days minimum |

Reward multipliers are funded by a dedicated conservation staking rewards pool allocated from ZOO token inflation (see section 5).

### 2. Core Contracts

#### 2.1 GreenStaking

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

contract GreenStaking {
    enum Tier { Standard, Green, DeepGreen, Guardian }

    struct Stake {
        uint256 amount;
        Tier    tier;
        uint256 stakedAt;
        uint256 lockUntil;
        address conservationProject;  // Chosen project for impact commitment
        uint256 impactScore;          // Cumulative verified impact
        uint256 rewardsClaimed;
        uint256 conservationContributed;
    }

    IERC20  public immutable zoo;          // ZOO token
    address public immutable rewardsPool;   // Conservation staking rewards
    address public governance;

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public totalConservationFunded;

    // Tier configuration
    mapping(Tier => uint16) public impactCommitmentBps;  // % to conservation
    mapping(Tier => uint16) public rewardMultiplierBps;   // Reward boost
    mapping(Tier => uint256) public lockDays;

    event Staked(address indexed user, uint256 amount, Tier tier, address project);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 userShare, uint256 conservationShare);
    event ImpactVerified(address indexed user, uint256 score, bytes32 attestationHash);

    constructor(address zoo_, address rewardsPool_, address governance_) {
        zoo = IERC20(zoo_);
        rewardsPool = rewardsPool_;
        governance = governance_;

        // Initialize tier parameters
        impactCommitmentBps[Tier.Standard]  = 0;
        impactCommitmentBps[Tier.Green]     = 1000;  // 10%
        impactCommitmentBps[Tier.DeepGreen] = 2500;  // 25%
        impactCommitmentBps[Tier.Guardian]  = 5000;  // 50%

        rewardMultiplierBps[Tier.Standard]  = 10000; // 1.0x
        rewardMultiplierBps[Tier.Green]     = 11500; // 1.15x
        rewardMultiplierBps[Tier.DeepGreen] = 14000; // 1.40x
        rewardMultiplierBps[Tier.Guardian]  = 17500; // 1.75x

        lockDays[Tier.Standard]  = 7;
        lockDays[Tier.Green]     = 30;
        lockDays[Tier.DeepGreen] = 90;
        lockDays[Tier.Guardian]  = 180;
    }

    function stake(uint256 amount, Tier tier, address project) external {
        require(amount > 0, "ZERO_AMOUNT");
        require(stakes[msg.sender].amount == 0, "ALREADY_STAKED");
        if (tier != Tier.Standard) {
            require(project != address(0), "PROJECT_REQUIRED");
        }

        zoo.transferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = Stake({
            amount: amount,
            tier: tier,
            stakedAt: block.timestamp,
            lockUntil: block.timestamp + (lockDays[tier] * 1 days),
            conservationProject: project,
            impactScore: 0,
            rewardsClaimed: 0,
            conservationContributed: 0
        });

        totalStaked += amount;
        emit Staked(msg.sender, amount, tier, project);
    }

    function claimRewards() external {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "NO_STAKE");

        uint256 baseReward = _calculateBaseReward(msg.sender);
        uint256 boostedReward = (baseReward * rewardMultiplierBps[s.tier]) / 10_000;

        uint256 conservationShare = (boostedReward * impactCommitmentBps[s.tier]) / 10_000;
        uint256 userShare = boostedReward - conservationShare;

        // Transfer rewards
        IERC20(zoo).transferFrom(rewardsPool, msg.sender, userShare);
        if (conservationShare > 0) {
            IERC20(zoo).transferFrom(rewardsPool, s.conservationProject, conservationShare);
            s.conservationContributed += conservationShare;
            totalConservationFunded += conservationShare;
        }

        s.rewardsClaimed += userShare;
        emit RewardsClaimed(msg.sender, userShare, conservationShare);
    }

    function unstake() external {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "NO_STAKE");
        require(block.timestamp >= s.lockUntil, "STILL_LOCKED");

        uint256 amount = s.amount;
        totalStaked -= amount;
        delete stakes[msg.sender];

        zoo.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function _calculateBaseReward(address user) internal view returns (uint256) {
        Stake storage s = stakes[user];
        uint256 elapsed = block.timestamp - s.stakedAt;
        // Annual rate: 8% base APR
        // reward = (amount * rate * elapsed) / (365 days * 10000)
        return (s.amount * 800 * elapsed) / (365 days * 10_000);
    }
}
```

#### 2.2 ImpactVerifier

Decentralized verification of conservation outcomes.

```solidity
contract ImpactVerifier {
    struct Verification {
        address staker;
        address project;
        uint256 impactScore;       // Normalized 0-10000
        bytes32 evidenceHash;      // IPFS CID of evidence
        uint256 timestamp;
        address[] verifiers;       // Addresses that attested
        bool     finalized;
    }

    uint256 public constant QUORUM = 3;          // Minimum verifiers
    uint256 public constant VERIFICATION_WINDOW = 7 days;

    mapping(uint256 => Verification) public verifications;
    mapping(address => bool) public registeredVerifiers;
    uint256 public nextVerificationId;

    event VerificationSubmitted(uint256 indexed id, address project, bytes32 evidenceHash);
    event VerificationAttested(uint256 indexed id, address verifier);
    event VerificationFinalized(uint256 indexed id, uint256 impactScore);

    function submitVerification(
        address staker,
        address project,
        uint256 impactScore,
        bytes32 evidenceHash
    ) external returns (uint256 id) {
        require(registeredVerifiers[msg.sender], "NOT_VERIFIER");
        require(impactScore <= 10000, "SCORE_OVERFLOW");

        id = nextVerificationId++;
        verifications[id] = Verification({
            staker: staker,
            project: project,
            impactScore: impactScore,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            verifiers: new address[](0),
            finalized: false
        });

        verifications[id].verifiers.push(msg.sender);
        emit VerificationSubmitted(id, project, evidenceHash);
    }

    function attest(uint256 id) external {
        require(registeredVerifiers[msg.sender], "NOT_VERIFIER");
        Verification storage v = verifications[id];
        require(!v.finalized, "ALREADY_FINAL");
        require(block.timestamp <= v.timestamp + VERIFICATION_WINDOW, "WINDOW_CLOSED");

        v.verifiers.push(msg.sender);
        emit VerificationAttested(id, msg.sender);

        if (v.verifiers.length >= QUORUM) {
            v.finalized = true;
            // Update staker impact score in GreenStaking
            emit VerificationFinalized(id, v.impactScore);
        }
    }
}
```

### 3. Proof of Impact (PoI) Model

The PoI model connects on-chain staking rewards to off-chain conservation outcomes:

```
Field Partner          Impact Verifier Network       GreenStaking Contract
──────────────        ─────────────────────         ─────────────────────
1. Execute project    2. Review evidence             5. Update impact score
   (anti-poaching,    3. Submit verification         6. Adjust reward tier
    habitat restore)   4. Reach quorum (3/5)         7. Emit attestation
         │                      │                            │
         └──── Evidence ────────┘                            │
              (photos, GPS,                                  │
               sensor data,                                  │
               satellite imagery)                            │
                                                             │
         ┌──── Impact Attestation (soulbound) ───────────────┘
         │
    Staker receives on-chain proof of conservation contribution
```

### 4. Verifier Network

Impact verifiers are conservation organizations, field researchers, and satellite data providers authorized by ZooGovernor:

| Verifier Type | Examples | Verification Method |
|---------------|----------|-------------------|
| Field partner | WWF, WCS, local NGOs | Ground-truth photographic evidence |
| Remote sensing | Planet Labs, Sentinel | Satellite imagery analysis |
| Sensor network | SMART, AudioMoth | Acoustic/camera trap data |
| Academic | University researchers | Peer-reviewed methodology |

Verifiers stake ZOO tokens as collateral. Fraudulent attestations result in slashing.

### 5. Token Economics

#### 5.1 Rewards Pool Funding

The Green Staking rewards pool is funded by:

| Source | Allocation | Notes |
|--------|-----------|-------|
| ZOO inflation | 2% annual | Dedicated staking emission schedule |
| Protocol fees | 15% of Zoo DEX fees | LP-9000 fee routing |
| Conservation bond yield | Overflow | When ZIP-101 bonds exceed target |

#### 5.2 Reward Distribution

```
Annual Rewards Pool
       │
       ├── 60% → Standard staking rewards (all tiers)
       ├── 25% → Green bonus pool (multiplier funding)
       └── 15% → Verifier incentives
```

#### 5.3 veZOO Integration

Long-term stakers at Green tier or above may lock their staked ZOO into veZOO (vote-escrowed ZOO) for amplified governance power:

| Lock Duration | veZOO Multiplier | Governance Weight |
|---------------|------------------|-------------------|
| 6 months | 1.0x | Base |
| 1 year | 1.5x | 1.5x voting power |
| 2 years | 2.0x | 2.0x voting power |
| 4 years | 4.0x | 4.0x voting power |

veZOO follows the Curve ve-token model with linear decay.

### 6. Governance Parameters

| Parameter | Default | Range | Governor |
|-----------|---------|-------|----------|
| Base APR | 800 bps (8%) | 200-2000 bps | ZooGovernor |
| Tier multipliers | See section 1 | 10000-20000 bps | ZooGovernor |
| Verifier quorum | 3 | 2-7 | ZooGovernor |
| Verifier stake minimum | 10,000 ZOO | 1,000-100,000 | ZooGovernor |
| Slashing rate | 10% | 5-50% | ZooGovernor |

## Rationale

**Why tiered staking?** A single impact commitment level would either be too high (discouraging participation) or too low (negligible impact). Tiers let stakers self-select based on their conservation commitment and risk tolerance for longer lock periods.

**Why reward multipliers instead of separate yield?** Multipliers are simpler to reason about and avoid the complexity of dual-token reward streams. A 1.75x multiplier at Guardian tier means the total economic return can exceed Standard tier even after the 50% conservation split -- the conservation contribution is funded by the bonus pool, not by reducing the staker's effective yield.

**Why decentralized verification?** Centralized impact reporting creates a single point of failure and trust assumption. A quorum-based verifier network distributes trust across multiple independent parties, similar to oracle networks but specialized for conservation data.

**Why not integrate with Lux primary network staking directly?** Zoo is an L2 (ZIP-15) and does not control primary network validator economics. Green Staking operates at the application layer within Zoo's own contracts.

## Security Considerations

### Sybil Attacks on Verifiers
- Verifiers must be governance-approved and stake ZOO collateral. Creating fake verifier identities requires real capital at risk.

### Impact Score Manipulation
- A colluding set of verifiers could attest false impact scores. Mitigation: quorum requirement, verifier diversity requirement (at least 2 distinct verifier types per verification), and slashing for provably false attestations.

### Lock Period Bypass
- Stakers cannot unstake before lock expiry. No emergency withdraw for staked principal. This is by design -- conservation commitment must be credible. Stakers should only commit capital they can lock.

### Reward Pool Exhaustion
- If staking demand exceeds reward pool capacity, APR decreases naturally. The governor can adjust emission rates. The pool is replenished from protocol fees and inflation.

### Economic Attack
- A whale could stake at Guardian tier to earn 1.75x rewards and immediately sell. Mitigation: 180-day lock at Guardian tier and vesting schedule on bonus rewards.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-15: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
3. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
4. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
5. [ZIP-500: ESG Principles](./zip-0500-esg-principles-conservation-impact.md)
6. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
7. [LP-9000: DEX Specifications](https://lps.lux.network/lp-9000)
8. [LP-9018: Liquidity Mining](https://lps.lux.network/lp-9018)
9. [HIP-0008: Hamiltonian Market Maker](https://hips.hanzo.ai/hip-0008)
10. Curve Finance, "Vote-Escrowed CRV," 2020

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
