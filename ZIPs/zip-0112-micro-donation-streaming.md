---
zip: 112
title: "Micro-Donation Streaming"
description: "Real-time streaming donations via continuous token flow protocol for conservation projects"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
created: 2025-01-15
tags: [streaming, donations, micro, defi, conservation]
requires: [0, 100, 700]
---

# ZIP-112: Micro-Donation Streaming

## Abstract

This ZIP defines a money streaming protocol that enables continuous, per-second token flow from donors to conservation projects. Rather than discrete one-time donations, supporters create streams that transfer ZUSD or ZOO tokens at a configurable rate (e.g., 1 ZUSD/day) to verified conservation recipients. Streams are non-custodial: tokens flow directly from the donor's balance in real-time, claimable by the recipient at any moment. The protocol supports one-to-many streams, conditional streams triggered by conservation milestones (ZIP-501), and employer-matched streams where organizations automatically match employee donations.

## Motivation

Conservation funding is episodic -- large grants arrive annually, creating feast-and-famine cycles that disrupt field operations. Micro-donation streaming solves this:

1. **Predictable cash flow**: Conservation projects receive continuous, predictable funding rather than lumpy grants, enabling better planning and staff retention.
2. **Donor engagement**: Streaming creates an ongoing relationship between donor and project. Donors can adjust or cancel at any time, providing real-time feedback to project operators.
3. **Lower friction**: Micro amounts (cents per day) are psychologically easier than lump sums. Streaming removes the activation energy of repeated donation decisions.
4. **Milestone gating**: Conditional streams that pause or accelerate based on verified conservation outcomes (species population data, habitat restoration progress) create accountability.

## Specification

### 1. Stream Data Structure

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DonationStreaming {
    struct Stream {
        address donor;
        address recipient;
        address token;
        uint256 ratePerSecond;    // Tokens per second (scaled 1e18)
        uint256 startTime;
        uint256 stopTime;         // 0 = indefinite
        uint256 deposit;          // Total tokens committed
        uint256 withdrawn;        // Tokens claimed by recipient
        bool conditional;         // If true, milestone-gated
        bytes32 milestoneId;      // ZIP-501 milestone reference
        bool active;
    }

    mapping(uint256 => Stream) public streams;
    uint256 public nextStreamId;

    event StreamCreated(
        uint256 indexed streamId,
        address indexed donor,
        address indexed recipient,
        uint256 ratePerSecond
    );
    event StreamClaimed(uint256 indexed streamId, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, uint256 refunded);

    function createStream(
        address recipient,
        address token,
        uint256 deposit,
        uint256 ratePerSecond,
        uint256 duration,
        bool conditional,
        bytes32 milestoneId
    ) external returns (uint256 streamId) {
        require(recipient != address(0), "ZERO_RECIPIENT");
        require(ratePerSecond > 0, "ZERO_RATE");
        require(deposit >= ratePerSecond, "DEPOSIT_TOO_LOW");

        IERC20(token).transferFrom(msg.sender, address(this), deposit);

        streamId = nextStreamId++;
        streams[streamId] = Stream({
            donor: msg.sender,
            recipient: recipient,
            token: token,
            ratePerSecond: ratePerSecond,
            startTime: block.timestamp,
            stopTime: duration > 0 ? block.timestamp + duration : 0,
            deposit: deposit,
            withdrawn: 0,
            conditional: conditional,
            milestoneId: milestoneId,
            active: true
        });

        emit StreamCreated(streamId, msg.sender, recipient, ratePerSecond);
    }

    function claimable(uint256 streamId) public view returns (uint256) {
        Stream storage s = streams[streamId];
        if (!s.active) return 0;

        uint256 elapsed = _elapsed(s);
        uint256 earned = elapsed * s.ratePerSecond;
        uint256 available = earned > s.deposit ? s.deposit : earned;
        return available - s.withdrawn;
    }

    function claim(uint256 streamId) external {
        Stream storage s = streams[streamId];
        require(msg.sender == s.recipient, "NOT_RECIPIENT");
        require(s.active, "INACTIVE");

        if (s.conditional) {
            require(_milestoneReached(s.milestoneId), "MILESTONE_NOT_MET");
        }

        uint256 amount = claimable(streamId);
        require(amount > 0, "NOTHING_CLAIMABLE");

        s.withdrawn += amount;
        IERC20(s.token).transfer(s.recipient, amount);

        emit StreamClaimed(streamId, amount);
    }

    function cancel(uint256 streamId) external {
        Stream storage s = streams[streamId];
        require(msg.sender == s.donor, "NOT_DONOR");
        require(s.active, "INACTIVE");

        uint256 recipientAmount = claimable(streamId);
        uint256 refund = s.deposit - s.withdrawn - recipientAmount;

        s.active = false;
        if (recipientAmount > 0) IERC20(s.token).transfer(s.recipient, recipientAmount);
        if (refund > 0) IERC20(s.token).transfer(s.donor, refund);

        emit StreamCancelled(streamId, refund);
    }

    function _elapsed(Stream storage s) internal view returns (uint256) {
        uint256 end = s.stopTime == 0 ? block.timestamp : min(block.timestamp, s.stopTime);
        return end > s.startTime ? end - s.startTime : 0;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _milestoneReached(bytes32 milestoneId) internal view returns (bool) {
        // Query ZIP-501 conservation impact oracle
        return true; // Placeholder
    }
}
```

### 2. Employer Matching

```solidity
contract MatchedDonationStreaming is DonationStreaming {
    struct MatchConfig {
        address employer;
        uint16 matchRateBps;     // e.g., 10000 = 1:1 match
        uint256 maxMatchPerMonth;
        uint256 matchedThisMonth;
    }

    mapping(address => MatchConfig) public matchConfigs;

    function createMatchedStream(
        address recipient,
        address token,
        uint256 deposit,
        uint256 ratePerSecond,
        uint256 duration
    ) external returns (uint256 streamId, uint256 matchStreamId) {
        streamId = createStream(recipient, token, deposit, ratePerSecond, duration, false, bytes32(0));

        MatchConfig storage mc = matchConfigs[msg.sender];
        if (mc.employer != address(0) && mc.matchedThisMonth < mc.maxMatchPerMonth) {
            uint256 matchDeposit = (deposit * mc.matchRateBps) / 10000;
            matchStreamId = _createMatchStream(mc.employer, recipient, token, matchDeposit, ratePerSecond);
        }
    }
}
```

### 3. Stream Types

| Type | Description | Use Case |
|------|-------------|----------|
| Simple | Fixed rate, fixed or indefinite duration | Monthly donor |
| Conditional | Pauses until milestone verified | Results-based funding |
| Matched | Employer auto-matches employee stream | Corporate giving |
| Decaying | Rate decreases over time | Front-loaded grants |
| Escalating | Rate increases with milestones | Performance incentives |

### 4. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum stream rate | 0.01 ZUSD/day | ZooGovernor |
| Maximum streams per donor | 50 | ZooGovernor |
| Claim gas subsidy | Optional, from protocol fund | ZooGovernor |
| Recipient verification | ZIP-500 registered | Required |

## Rationale

**Why streaming over recurring transfers?** Streaming is continuous and gas-efficient. A single transaction creates months or years of funding. Recurring transfers require repeated transactions and centralized schedulers.

**Why conditional streams?** Accountability. Donors can set milestone conditions that must be verified by the ZIP-501 impact measurement system before funds flow. This creates market-like incentives for conservation projects to deliver measurable results.

**Why employer matching?** Corporate matching programs are a proven mechanism to amplify individual giving. On-chain matching is transparent and auditable, unlike traditional corporate programs.

## Security Considerations

### Stream Draining
Recipients can only claim accrued amounts. The contract holds deposits securely and releases them proportionally over time. A compromised recipient address cannot access more than the accrued balance.

### Donor Rug Pull
Donors can cancel streams, but outstanding claimable amounts are paid to the recipient first. Projects should maintain a buffer equivalent to their minimum operating period.

### Milestone Oracle Manipulation
Conditional streams depend on ZIP-501 milestone verification. A compromised oracle could unlock funds prematurely. The same oracle security guarantees from ZIP-501 apply here.

### Gas Costs
On Zoo L2 (ZIP-015), gas costs are minimal. However, streams with very low rates may accumulate insufficient value to justify claim gas. The protocol may subsidize claim transactions for verified conservation recipients.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-501: Conservation Impact Measurement](./zip-0501-conservation-impact-measurement.md)
4. [ZIP-700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
5. [Superfluid Protocol](https://docs.superfluid.finance/)
6. [Sablier V2 Streaming Protocol](https://docs.sablier.com/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
