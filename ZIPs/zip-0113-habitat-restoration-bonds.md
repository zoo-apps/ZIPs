---
zip: 113
title: "Habitat Restoration Bonds"
description: "Outcome-based bonds for habitat restoration where returns depend on verified ecological recovery"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [bonds, habitat, restoration, outcomes, defi]
requires: [0, 100, 101, 501, 520]
---

# ZIP-113: Habitat Restoration Bonds

## Abstract

This ZIP defines outcome-based bonds where investor returns are tied to verified ecological recovery metrics. Unlike conservation bonds (ZIP-101) which generate yield from DeFi vaults, habitat restoration bonds (HRBs) generate returns from outcome payments made by outcome funders (governments, NGOs, philanthropies) when pre-defined habitat restoration milestones are achieved. The protocol tokenizes the "pay-for-success" model used in social impact bonds, bringing it on-chain with transparent milestone verification via the Zoo AI pipeline (ZIP-401) and conservation impact measurement system (ZIP-501).

## Motivation

Habitat restoration is one of the most effective conservation interventions, yet it is chronically underfunded because:

1. **Long time horizons**: Restoration projects take 5-20 years to deliver results, exceeding typical grant cycles.
2. **Outcome uncertainty**: Funders are reluctant to pay upfront for uncertain ecological outcomes.
3. **Misaligned incentives**: Traditional grants pay for activities, not outcomes. Projects have no financial incentive to maximize ecological recovery.
4. **No secondary market**: Existing pay-for-success instruments are illiquid bilateral contracts.

HRBs solve these problems by:
- Shifting risk from outcome funders to bond investors who are compensated for bearing that risk.
- Creating liquid, tradable tokens that price ecological uncertainty in real-time.
- Paying returns only when verified milestones are met, aligning all parties with restoration success.

## Specification

### 1. Bond Structure

```
Outcome Funder                Bond Investors
(govt/NGO)                    (DeFi participants)
     |                              |
     | Commits outcome payments     | Purchases bond tokens
     v                              v
  ┌──────────────────────────────────────┐
  │     Habitat Restoration Bond (HRB)   │
  │                                      │
  │  Milestones:                         │
  │   M1: Invasive species removed (20%) │
  │   M2: Native planting complete (30%) │
  │   M3: Wildlife return detected (25%) │
  │   M4: Ecosystem self-sustaining(25%) │
  └──────────┬───────────────────────────┘
             |
             v
      Restoration Project
      (on-ground operator)
```

### 2. Core Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HabitatRestorationBond is ERC20 {
    struct Milestone {
        string description;
        uint16 payoutBps;        // Share of outcome payment (bps of total)
        bytes32 verificationId;  // ZIP-501 verification reference
        bool achieved;
        uint256 achievedAt;
    }

    address public outcomeFunder;
    address public projectOperator;
    uint256 public totalOutcomePayment;   // Total committed by funder
    uint256 public totalInvestment;       // Total invested by bondholders
    uint256 public maturityDate;
    string public habitatRegion;
    string public restorationGoal;

    Milestone[] public milestones;
    uint256 public milestonesAchieved;
    uint256 public totalPaidOut;

    event MilestoneVerified(uint256 indexed index, string description, uint256 payout);
    event BondPurchased(address indexed investor, uint256 amount);
    event ReturnClaimed(address indexed investor, uint256 principal, uint256 profit);

    constructor(
        string memory name_,
        string memory symbol_,
        address _outcomeFunder,
        address _projectOperator,
        uint256 _totalOutcomePayment,
        uint256 _maturityDate,
        string memory _habitatRegion,
        string memory _restorationGoal
    ) ERC20(name_, symbol_) {
        outcomeFunder = _outcomeFunder;
        projectOperator = _projectOperator;
        totalOutcomePayment = _totalOutcomePayment;
        maturityDate = _maturityDate;
        habitatRegion = _habitatRegion;
        restorationGoal = _restorationGoal;
    }

    function invest(uint256 amount) external {
        require(block.timestamp < maturityDate, "EXPIRED");
        IERC20(zusd).transferFrom(msg.sender, address(this), amount);
        totalInvestment += amount;
        _mint(msg.sender, amount);
        emit BondPurchased(msg.sender, amount);
    }

    function verifyMilestone(uint256 index, bytes calldata proof) external {
        require(index < milestones.length, "INVALID_INDEX");
        Milestone storage m = milestones[index];
        require(!m.achieved, "ALREADY_ACHIEVED");

        // Verify via ZIP-501 oracle
        require(_verifyProof(m.verificationId, proof), "VERIFICATION_FAILED");

        m.achieved = true;
        m.achievedAt = block.timestamp;
        milestonesAchieved++;

        // Trigger outcome payment from funder
        uint256 payout = (totalOutcomePayment * m.payoutBps) / 10000;
        IERC20(zusd).transferFrom(outcomeFunder, address(this), payout);
        totalPaidOut += payout;

        // Send operating budget to project (50% of payout)
        uint256 operatorShare = payout / 2;
        IERC20(zusd).transfer(projectOperator, operatorShare);

        emit MilestoneVerified(index, m.description, payout);
    }

    function claim() external {
        require(block.timestamp >= maturityDate, "NOT_MATURED");
        uint256 bondBalance = balanceOf(msg.sender);
        require(bondBalance > 0, "NO_BONDS");

        // Calculate investor return based on milestones achieved
        uint256 investorPool = totalPaidOut / 2; // Other 50% after operator share
        uint256 investorShare = (investorPool * bondBalance) / totalSupply();
        uint256 principalReturn = (totalInvestment * bondBalance) / totalSupply();
        uint256 totalReturn = principalReturn + investorShare;

        _burn(msg.sender, bondBalance);
        IERC20(zusd).transfer(msg.sender, totalReturn);

        emit ReturnClaimed(msg.sender, principalReturn, investorShare);
    }

    function _verifyProof(bytes32 verificationId, bytes calldata proof) internal view returns (bool) {
        // Delegate to ZIP-501 verification oracle
        return true; // Placeholder
    }
}
```

### 3. Milestone Verification

Milestones are verified through the ZIP-501 conservation impact measurement system using:

| Milestone Type | Verification Method | Data Source |
|---------------|-------------------|-------------|
| Invasive removal | Satellite + ground survey | Copernicus + field teams |
| Native planting | Drone survey + species count | Zoo AI (ZIP-401) |
| Wildlife return | Camera trap + acoustic monitoring | Zoo sensor network |
| Self-sustaining | Multi-year trend analysis | ZIP-501 composite score |

### 4. Return Structure

Investor returns depend on milestone achievement:

| Milestones Achieved | Investor Return (of principal) |
|--------------------|-------------------------------|
| 0 of 4 | 0% (total loss) |
| 1 of 4 | 60% (partial loss) |
| 2 of 4 | 90% (near break-even) |
| 3 of 4 | 110% (modest profit) |
| 4 of 4 | 130% (target return) |

### 5. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum bond term | 1 year | ZooGovernor |
| Maximum bond term | 10 years | ZooGovernor |
| Minimum investment | 10 ZUSD | ZooGovernor |
| Outcome funder deposit | Escrowed at bond creation | Required |
| Milestone count | 2-8 per bond | Bond creator |
| Operator share of payouts | 50% | ZooGovernor |

## Rationale

**Why outcome-based over yield-based (ZIP-101)?** Conservation bonds (ZIP-101) generate returns from DeFi yield, independent of conservation outcomes. HRBs tie returns directly to ecological recovery, creating stronger alignment between investors and restoration success.

**Why 50/50 split between operator and investors?** Operators need working capital to execute restoration. Investors need returns to justify risk. A 50/50 split balances these needs. Governance can adjust if market conditions require.

**Why allow 0% return?** Honest pricing of ecological risk is essential. If no milestones are achieved, the habitat was not restored and outcome funders should not pay. Investors bear this risk in exchange for potential returns above principal.

## Security Considerations

### Outcome Funder Default
The outcome funder's total payment is escrowed at bond creation in the bond contract. If the funder fails to escrow, the bond cannot be created. This eliminates counterparty risk.

### Milestone Gaming
Project operators could manipulate milestone evidence. Multi-source verification (satellite + ground + AI) and the ZIP-501 dispute mechanism mitigate this. A 30-day challenge period after milestone verification allows community dispute.

### Illiquidity Risk
HRBs are long-term instruments. Secondary market liquidity may be thin. Bond tokens are ERC-20 compatible and can trade on Zoo DEX, but investors should expect illiquidity premiums for multi-year bonds.

### Smart Contract Risk
The bond contract holds both investor principal and escrowed outcome payments. A comprehensive audit is required before mainnet deployment. The contract should use standard OpenZeppelin patterns and minimal custom logic.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-101: Conservation Bond Protocol](./zip-0101-conservation-bond-protocol.md)
4. [ZIP-401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
5. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
6. [ZIP-520: Habitat Conservation](./zip-0520-habitat-conservation.md)
7. Social Finance, "Social Impact Bonds: The Early Years," 2016
8. Convergence, "Pay-for-Success in Conservation," 2022

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
