---
zip: 19
title: "Validator Rewards Conservation Split"
description: "Defines the mechanism for splitting validator rewards between stakers and the conservation fund"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 17 (Zoo Animal Rewards)"
follow-on: [zoo-fund-validator-rewards]
created: 2025-01-15
tags: [staking, validators, conservation, rewards]
---

# ZIP-0019: Validator Rewards Conservation Split

## Abstract

This proposal defines a mandatory split of Zoo Network validator rewards between stakers and the conservation fund. As an L2 on Lux Network, Zoo does not operate its own validator set, but it does generate sequencer fees and MEV revenue. This ZIP specifies that a minimum of 20% of all such revenue flows to the conservation fund, with the split adjustable by governance within defined bounds.

## Motivation

Conservation funding must be sustainable and automatic, not dependent on voluntary donations:

1. **Mission alignment**: Every transaction on Zoo Network directly contributes to conservation
2. **Predictable funding**: Conservation organizations need reliable revenue streams for multi-year projects
3. **User alignment**: Users choose Zoo Network knowing their activity funds real-world impact
4. **Protocol-level commitment**: Embedding the split at the protocol level makes it credible and irrevocable
5. **Tax efficiency**: Automatic protocol-level allocation avoids the complexity of individual charitable deductions

## Specification

### Reward Sources

```yaml
reward_sources:
  base_fees:
    description: EIP-1559 base fees collected per block
    split: conservation receives 20% before burn
  priority_fees:
    description: Tips paid by users for transaction priority
    split: conservation receives 20%
  sequencer_revenue:
    description: MEV and ordering revenue from L2 sequencer
    split: conservation receives 30%
  blob_fees:
    description: Data availability fees for posting to Lux L1
    split: conservation receives 10%
```

### Split Parameters

| Parameter | Default | Min | Max | Governance |
|-----------|---------|-----|-----|------------|
| Base fee conservation share | 20% | 15% | 50% | DAO vote (Parameter type) |
| Priority fee conservation share | 20% | 15% | 50% | DAO vote |
| Sequencer revenue conservation share | 30% | 20% | 60% | DAO vote |
| Blob fee conservation share | 10% | 5% | 25% | DAO vote |

### Fee Distributor Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ConservationFeeSplitter {
    uint256 public constant MIN_CONSERVATION_BPS = 1500; // 15% floor
    uint256 public constant MAX_CONSERVATION_BPS = 5000; // 50% ceiling

    uint256 public baseFeeConservationBps = 2000;    // 20%
    uint256 public priorityFeeConservationBps = 2000; // 20%

    address public conservationFund;
    address public stakerRewardsPool;

    event RewardsSplit(
        uint256 totalRewards,
        uint256 conservationAmount,
        uint256 stakerAmount,
        uint256 epoch
    );

    function distributeRewards() external {
        uint256 baseFees = address(this).balance;
        uint256 conservationShare = (baseFees * baseFeeConservationBps) / 10_000;
        uint256 stakerShare = baseFees - conservationShare;

        payable(conservationFund).transfer(conservationShare);
        payable(stakerRewardsPool).transfer(stakerShare);

        emit RewardsSplit(baseFees, conservationShare, stakerShare, block.number);
    }

    function updateSplit(uint256 newBps) external onlyGovernance {
        require(newBps >= MIN_CONSERVATION_BPS, "below minimum");
        require(newBps <= MAX_CONSERVATION_BPS, "above maximum");
        baseFeeConservationBps = newBps;
    }
}
```

### Distribution Schedule

- **Epoch length**: 1 day (86,400 seconds)
- **Distribution**: Automatic at epoch boundary via keeper bot
- **Accumulation**: Fees accumulate in the splitter contract between epochs
- **Slippage protection**: If keeper misses an epoch, funds roll forward (no loss)

### Staker Reward Calculation

After the conservation split, remaining rewards are distributed to stakers proportionally:

```
staker_reward = (staker_stake / total_stake) * epoch_staker_pool
```

Stakers who delegate to the Zoo conservation pool receive a bonus multiplier:

| Delegation Target | Reward Multiplier |
|-------------------|-------------------|
| Standard staking | 1.0x |
| Conservation pool | 1.15x (15% bonus) |

### Transparency Dashboard

All splits are tracked in real-time at rewards.zoo.network:
- Cumulative conservation funding by epoch
- Per-source breakdown (base fees, priority fees, sequencer, blobs)
- Historical split ratios and governance changes
- USD-equivalent impact metrics

## Rationale

The 20% default conservation share balances meaningful conservation funding with competitive staking yields. The hard floor of 15% prevents governance from eliminating conservation funding entirely, while the 50% ceiling prevents staking from becoming uneconomical.

The conservation pool bonus multiplier (1.15x) incentivizes users to actively support conservation beyond the mandatory minimum, creating a voluntary amplification mechanism on top of the protocol-level guarantee.

Sequencer revenue has a higher default split (30%) because MEV extraction is a privilege granted by the protocol and should contribute more to the public good.

## Security Considerations

- **Governance manipulation**: The MIN_CONSERVATION_BPS constant is immutable in the contract, preventing governance from reducing conservation funding below 15%
- **Keeper reliability**: If the epoch distributor fails, funds accumulate safely in the splitter contract until the next successful execution
- **Oracle dependency**: The split operates on native token amounts, not USD values, avoiding oracle manipulation risks
- **Reentrancy**: The distributor uses checks-effects-interactions pattern and reentrancy guards
- **MEV on distribution**: The distribution transaction itself should be submitted via a private mempool to prevent front-running

## References

- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0018: Treasury Management Protocol](./zip-0018-treasury-management-protocol.md)
- [EIP-1559: Fee Market Change](https://eips.ethereum.org/EIPS/eip-1559)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
