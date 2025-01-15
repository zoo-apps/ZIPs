---
zip: 25
title: "Privacy-Preserving Donations"
description: "Zero-knowledge proof system for anonymous conservation donations with tax receipt compatibility"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-01-15
tags: [privacy, zero-knowledge, donations, conservation]
---

# ZIP-0025: Privacy-Preserving Donations

## Abstract

This proposal defines a zero-knowledge proof system that enables donors to make anonymous conservation donations on Zoo Network while optionally generating verifiable tax receipts. The system uses zk-SNARKs to prove donation amounts and eligibility without revealing donor identity on-chain, with an optional off-chain disclosure path for donors who want 501(c)(3) tax deductions.

## Motivation

Privacy in charitable giving serves legitimate purposes:

1. **Donor protection**: High-profile donors may face solicitation, social pressure, or security risks
2. **Pure altruism**: Some donors prefer anonymous giving to avoid perception of self-interest
3. **Political sensitivity**: Conservation in certain regions is politically contentious; anonymity protects donors
4. **Regulatory zones**: Donors in restrictive jurisdictions need privacy to support conservation safely
5. **Tax compatibility**: The system must accommodate donors who do need receipts for US tax deductions

## Specification

### Architecture

```
┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Donor       │    │  Shielded Pool   │    │  Conservation   │
│   (private)   │───►│  (zk-SNARK)      │───►│  Fund           │
│               │    │                  │    │  (public)       │
└───────┬───────┘    └──────────────────┘    └─────────────────┘
        │                                            │
        │ (optional, off-chain)                      │
        ▼                                            ▼
┌───────────────┐                            ┌─────────────────┐
│  Tax Receipt  │                            │  Impact Oracle  │
│  Service      │                            │  (ZIP-0020)     │
└───────────────┘                            └─────────────────┘
```

### Shielded Pool

The shielded donation pool operates similarly to a commitment scheme:

1. **Deposit**: Donor deposits ZOO into the shielded pool, receiving a secret note
2. **Commitment**: A Pedersen commitment to the amount is published on-chain
3. **Withdrawal**: The conservation fund withdraws donations using a zk-proof that the withdrawal amount matches committed deposits
4. **Nullifier**: Each deposit generates a nullifier to prevent double-spending

### Zero-Knowledge Circuit

```
Circuit: DonationProof
  Public inputs:
    - commitment (Pedersen hash)
    - nullifier_hash
    - conservation_fund_address
    - merkle_root (of commitment tree)

  Private inputs:
    - amount
    - secret (donor's secret key)
    - nullifier (unique per deposit)
    - merkle_path (proof of inclusion)

  Constraints:
    1. commitment == PedersenHash(amount, secret)
    2. nullifier_hash == Hash(nullifier)
    3. merkle_path verifies commitment in tree at merkle_root
    4. amount > 0
    5. amount <= MAX_DONATION (prevents overflow)
```

### Donation Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ShieldedDonations {
    using MerkleTree for MerkleTree.Data;

    MerkleTree.Data private commitmentTree;
    mapping(bytes32 => bool) public nullifiers;

    IVerifier public immutable verifier;
    address public conservationFund;

    event ShieldedDeposit(bytes32 indexed commitment, uint256 leafIndex);
    event ShieldedWithdrawal(bytes32 indexed nullifierHash, address fund, uint256 amount);

    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "zero deposit");
        uint256 index = commitmentTree.insert(commitment);
        emit ShieldedDeposit(commitment, index);
    }

    function withdraw(
        bytes calldata proof,
        bytes32 nullifierHash,
        bytes32 root,
        uint256 amount
    ) external onlyFundManager {
        require(!nullifiers[nullifierHash], "already spent");
        require(commitmentTree.isKnownRoot(root), "unknown root");
        require(
            verifier.verify(proof, nullifierHash, root, amount, conservationFund),
            "invalid proof"
        );
        nullifiers[nullifierHash] = true;
        payable(conservationFund).transfer(amount);
        emit ShieldedWithdrawal(nullifierHash, conservationFund, amount);
    }
}
```

### Denomination Tiers

To enhance anonymity set size, deposits use fixed denominations:

| Tier | Amount (ZOO) | Anonymity Set Target |
|------|-------------|---------------------|
| Micro | 100 | 1,000+ deposits |
| Small | 1,000 | 500+ deposits |
| Medium | 10,000 | 200+ deposits |
| Large | 100,000 | 50+ deposits |

Donors making non-round amounts split across multiple deposits.

### Tax Receipt Path (Optional)

Donors who need tax receipts can use an off-chain disclosure process:

1. Donor generates a zk-proof of their deposit (proves they made the donation without revealing on-chain link)
2. Donor presents the proof to the Zoo Labs Foundation Tax Receipt Service
3. Service verifies the proof against on-chain commitments
4. Service issues a 501(c)(3) receipt to the donor (off-chain, private)
5. The on-chain transaction remains anonymous; only the Foundation knows the donor identity

```yaml
tax_receipt_flow:
  disclosure: voluntary, off-chain
  verification: zk-proof of deposit ownership
  receipt_format: IRS-compliant (Pub 1771)
  data_retention: 7 years (IRS requirement)
  privacy: Foundation keeps donor identity confidential
```

### Compliance Safeguards

- **AML screening**: Deposits above 50,000 ZOO require a time-delay (24h) during which the Foundation can screen the source address
- **OFAC compliance**: Known sanctioned addresses are blocked at the contract level
- **Suspicious activity**: Unusual patterns (rapid large deposits from new addresses) trigger alerts to compliance team

## Rationale

Fixed denomination tiers follow the Tornado Cash anonymity model but adapted for charitable giving. Larger anonymity sets provide stronger privacy guarantees, which is why the micro tier targets 1,000+ deposits.

The optional tax receipt path is a key differentiator: donors can choose between full anonymity and tax benefits. The zk-proof based receipt verification means the Foundation can verify a donation occurred without the donor revealing their on-chain identity publicly.

The compliance safeguards balance privacy with legal obligations. The Foundation, as a 501(c)(3), must comply with AML regulations while respecting donor privacy to the maximum extent permitted by law.

## Security Considerations

- **Trusted setup**: The zk-SNARK circuit requires a trusted setup ceremony with at least 100 participants; the ceremony must be publicly verifiable
- **Anonymity set leakage**: Small anonymity sets (few deposits of a given denomination) weaken privacy; the system warns users when sets are below minimum thresholds
- **Timing correlation**: Deposits and withdrawals close in time can be correlated; a randomized delay (1-24h) is applied to withdrawals
- **Amount correlation**: Fixed denominations prevent amount-based correlation
- **Regulatory risk**: The system is designed for legitimate charitable privacy, not money laundering; compliance safeguards demonstrate good faith
- **Smart contract bugs**: The verifier contract is the most critical component and requires formal verification

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0018: Treasury Management Protocol](./zip-0018-treasury-management-protocol.md)
- [Groth16: On the Size of Pairing-Based Non-Interactive Arguments](https://eprint.iacr.org/2016/260)
- [IRS Publication 1771: Charitable Contributions](https://www.irs.gov/publications/p1771)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
