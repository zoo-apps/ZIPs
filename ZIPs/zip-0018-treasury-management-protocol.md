---
zip: 18
title: "Treasury Management Protocol"
description: "Defines multi-sig treasury operations, spending limits, audit requirements, and fund accounting"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper section 19 (Zoo DAO) -- treasury component"
follow-on: [zoo-fund-treasury]
created: 2025-01-15
tags: [treasury, multisig, audit, finance]
---

# ZIP-0018: Treasury Management Protocol

## Abstract

This proposal specifies the on-chain treasury management system for Zoo Network, including multi-signature wallet configuration, tiered spending limits, mandatory audit procedures, fund segregation between conservation and operational accounts, and reporting requirements. The treasury holds all protocol-owned assets and conservation funds.

## Motivation

As a 501(c)(3) nonprofit, Zoo Labs Foundation must maintain transparent, auditable financial operations:

1. **Fiduciary duty**: Nonprofit board members have legal obligations for fund stewardship
2. **Donor confidence**: Transparent treasury operations encourage continued conservation donations
3. **Regulatory compliance**: IRS Form 990 reporting requires clear fund accounting
4. **Security**: Multi-sig controls prevent single points of failure or insider theft
5. **Operational efficiency**: Tiered spending limits allow routine operations without full board approval

## Specification

### Treasury Architecture

```
┌─────────────────────────────────────────────┐
│              Zoo Treasury System             │
├──────────────┬──────────────┬───────────────┤
│ Conservation │  Operations  │   Grants      │
│    Fund      │    Fund      │   Fund        │
│  (Restricted)│ (Unrestricted)│ (Restricted) │
├──────────────┴──────────────┴───────────────┤
│          Gnosis Safe Multi-Sig              │
│            3-of-5 signers                   │
└─────────────────────────────────────────────┘
```

### Multi-Sig Configuration

```yaml
treasury:
  type: gnosis-safe
  signers:
    required: 3
    total: 5
    composition:
      - foundation_board: 2     # Foundation board members
      - community_elected: 2    # DAO-elected representatives
      - independent_auditor: 1  # Third-party auditor
  rotation:
    frequency: annual
    method: dao_vote
    overlap: 30 days  # Outgoing signers remain for transition
```

### Fund Segregation

| Fund | Source | Restrictions | Signer Threshold |
|------|--------|-------------|------------------|
| Conservation | Token emissions (40%), donations | Conservation-only expenditure | 4-of-5 |
| Operations | Token emissions (25%), fees | Protocol operations, salaries | 3-of-5 |
| Grants | Token emissions (25%), donations | Research and community grants | 3-of-5 |
| Emergency | Token emissions (10%) | Security incidents only | 2-of-5 |

### Spending Tiers

| Tier | Amount (USD equiv.) | Approval Required | Timelock |
|------|--------------------|--------------------|----------|
| Micro | < $1,000 | 1-of-5 signer | None |
| Small | $1,000 - $10,000 | 2-of-5 signers | 24h |
| Medium | $10,000 - $100,000 | 3-of-5 signers | 48h |
| Large | $100,000 - $500,000 | 4-of-5 signers + DAO vote | 7 days |
| Major | > $500,000 | 5-of-5 signers + DAO supermajority | 14 days |

### Treasury Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooTreasury {
    enum Fund { Conservation, Operations, Grants, Emergency }
    enum Tier { Micro, Small, Medium, Large, Major }

    mapping(Fund => uint256) public balances;
    mapping(Fund => uint256) public monthlySpent;
    mapping(Fund => uint256) public monthlyLimit;

    event Disbursement(Fund fund, address recipient, uint256 amount, string memo);
    event AuditCompleted(uint256 quarter, bytes32 reportHash);

    function disburse(
        Fund fund,
        address recipient,
        uint256 amount,
        string calldata memo
    ) external onlyApproved(fund, amount) {
        require(balances[fund] >= amount, "insufficient fund balance");
        require(monthlySpent[fund] + amount <= monthlyLimit[fund], "monthly limit exceeded");
        monthlySpent[fund] += amount;
        balances[fund] -= amount;
        IERC20(zooToken).transfer(recipient, amount);
        emit Disbursement(fund, recipient, amount, memo);
    }

    function submitAuditReport(uint256 quarter, bytes32 reportHash) external onlyAuditor {
        emit AuditCompleted(quarter, reportHash);
    }
}
```

### Audit Requirements

- **Quarterly**: On-chain fund reconciliation published to IPFS
- **Annual**: Full independent audit by a CPA firm with nonprofit experience
- **Continuous**: Real-time treasury dashboard at treasury.zoo.network
- **Report hashes**: Stored on-chain for immutable audit trail

### Monthly Reporting

Each month, the treasury must publish:
1. Beginning and ending balances per fund
2. All disbursements with memos and recipient addresses
3. Incoming revenue by source (emissions, fees, donations)
4. Variance against budget (if >10% variance, explanation required)

## Rationale

The 3-of-5 multi-sig with mixed composition (board + community + auditor) balances security with decentralization. Requiring board members prevents legally problematic disbursements, while community-elected signers prevent board capture. The independent auditor provides a neutral tiebreaker.

Fund segregation enforces donor intent (restricted conservation funds cannot be redirected to operations) which is a legal requirement for 501(c)(3) organizations receiving restricted gifts.

Tiered spending limits enable operational agility for small expenditures while requiring increasing consensus for larger amounts, matching the risk profile of each transaction.

## Security Considerations

- **Key compromise**: If any signer key is compromised, remaining signers can rotate the compromised key via 3-of-4 remaining signatures
- **Social engineering**: All disbursements over $10,000 require a 48h timelock, allowing detection of unauthorized transactions
- **Insider collusion**: Mixed signer composition (board + community + auditor) makes collusion difficult
- **Smart contract risk**: Treasury contracts must pass two independent audits before deployment
- **Oracle manipulation**: USD-equivalent spending tiers use a time-weighted average price oracle with a 24h lookback

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0017: DAO Governance Framework](./zip-0017-dao-governance-framework.md)
- [Gnosis Safe Documentation](https://docs.safe.global/)
- [IRS Publication 557: Tax-Exempt Status](https://www.irs.gov/publications/p557)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
