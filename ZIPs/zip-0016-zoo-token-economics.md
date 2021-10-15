---
zip: 16
title: "ZOO Token Economics"
description: "Defines ZOO token distribution, inflation schedule, and conservation fund allocation"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 13 (Native Token)"
follow-on: [zoo-tokenomics]
created: 2025-01-15
tags: [tokenomics, zoo-token, conservation, inflation]
---

# ZIP-0016: ZOO Token Economics

## Abstract

This proposal defines the economic model for the ZOO token, including initial distribution, inflation schedule, vesting periods, and the mandatory conservation allocation mechanism. ZOO serves as the native gas and governance token of Zoo Network (L2 on Lux Network) with a fixed initial supply of 1,000,000,000 (1B) tokens and a capped annual inflation rate that decreases over time.

## Motivation

A clearly defined token economic model is essential for:

1. **Sustainability**: Ensuring long-term funding for conservation initiatives without relying solely on donations
2. **Alignment**: Binding protocol economics to the conservation mission of Zoo Labs Foundation (501c3)
3. **Transparency**: Providing donors, researchers, and participants with predictable economic guarantees
4. **Ecosystem growth**: Incentivizing early contributors while preventing excessive dilution
5. **Regulatory clarity**: Maintaining utility-token classification by tying value to governance and network access rather than profit expectations

## Specification

### Initial Token Distribution

| Allocation | Percentage | Amount | Vesting |
|-----------|-----------|--------|---------|
| Conservation Fund | 25% | 250,000,000 | 10-year linear unlock |
| Ecosystem Grants | 20% | 200,000,000 | 4-year linear, 1-year cliff |
| Community Airdrop (ZIP-0002) | 10% | 100,000,000 | Immediate |
| Foundation Reserve | 15% | 150,000,000 | 5-year linear, 1-year cliff |
| Research Incentives | 15% | 150,000,000 | 4-year linear |
| Liquidity Provision | 10% | 100,000,000 | 2-year linear |
| Core Contributors | 5% | 50,000,000 | 4-year linear, 1-year cliff |

### Inflation Schedule

Annual inflation is capped and decreases on a fixed schedule:

```yaml
inflation:
  year_1: 5.0%    # Bootstrap ecosystem incentives
  year_2: 4.0%
  year_3: 3.0%
  year_4: 2.5%
  year_5_plus: 2.0%  # Terminal rate
  distribution:
    conservation_fund: 40%  # Of new emissions
    staking_rewards: 35%
    ecosystem_grants: 25%
```

### Conservation Allocation Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ConservationAllocation {
    uint256 public constant CONSERVATION_BPS = 4000; // 40% of emissions
    address public conservationMultisig;
    address public emissionsController;

    event ConservationFunded(uint256 amount, uint256 epoch);

    function distributeEmissions(uint256 totalEmissions) external {
        require(msg.sender == emissionsController, "unauthorized");
        uint256 conservationShare = (totalEmissions * CONSERVATION_BPS) / 10_000;
        IZOO(zooToken).transfer(conservationMultisig, conservationShare);
        emit ConservationFunded(conservationShare, block.timestamp);
    }
}
```

### Burn Mechanism

A portion of transaction fees is burned to counteract inflation:

- **Base fee burn**: 50% of EIP-1559 base fees are burned permanently
- **Net inflation** = Gross emissions - Burned fees
- Target: Net inflation approaches 0% as network activity grows

### Token Utility

| Use Case | Mechanism |
|----------|-----------|
| Gas fees | Native token for Zoo L2 transactions |
| Governance | Voting weight on ZIP proposals (1 token = 1 vote) |
| Staking | Delegate to validators for rewards |
| Grant funding | Stake to back community grant proposals |
| Data access | Pay for premium biodiversity data queries |

## Rationale

The 25% conservation allocation at genesis plus 40% of ongoing emissions ensures the network's primary mission is funded regardless of external donation volume. The decreasing inflation schedule prevents excessive dilution while maintaining incentive budgets during the critical growth phase. Terminal 2% inflation ensures perpetual funding for conservation without supply shocks.

The burn mechanism creates a natural equilibrium: as the network becomes more useful, more fees are burned, offsetting inflation and rewarding long-term holders who are aligned with the conservation mission.

## Security Considerations

- **Vesting contracts** must be audited and use timelocks to prevent premature access
- **Conservation multisig** requires 3-of-5 signers including at least one independent board member
- **Inflation controller** is governed by a timelock with 7-day delay for parameter changes
- **Emergency pause** can halt emissions if a critical vulnerability is discovered
- Token distribution contract should be deployed behind a proxy with a 48-hour upgrade delay

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0002: Genesis Airdrop](./zip-0002-genesis-airdrop-to-original-zoo-token-victims.md)
- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
- [EIP-1559: Fee Market Change](https://eips.ethereum.org/EIPS/eip-1559)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
