---
zip: 108
title: "Carbon Offset Tokenization"
description: "Standard for tokenizing verified carbon offsets as ZRC-20 tokens tradable on Zoo DEX"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: DeFi
originated: 2021-10
traces-from: "Whitepaper section 03 (Sustainability)"
follow-on: [zoo-carbon-credits]
created: 2025-01-15
tags: [carbon, offsets, tokenization, defi, climate]
requires: [0, 100, 105, 700]
---

# ZIP-108: Carbon Offset Tokenization

## Abstract

This ZIP defines a standard for tokenizing verified carbon offsets as ZRC-20 fungible tokens on the Zoo L2 chain. Each token represents one metric tonne of CO2 equivalent (tCO2e) retired from a verified carbon registry (Verra VCS, Gold Standard, or equivalent). The protocol establishes a bridge between off-chain carbon registries and on-chain token issuance, with mandatory verification by DAO-approved oracles before minting. Tokens can be traded on the Zoo DEX (ZIP-105), used as collateral in the Impact Lending Protocol (ZIP-107), or permanently retired on-chain to claim carbon-neutral status.

## Motivation

The voluntary carbon market is projected to reach USD 50 billion by 2030, yet it suffers from fragmentation, double-counting, and opaque pricing. Tokenization on Zoo addresses these failures:

1. **Eliminating double-counting**: On-chain retirement is irreversible. Once a carbon token is burned, the corresponding offset is permanently marked as retired in both the on-chain registry and the source registry.
2. **Price discovery**: Trading on Zoo DEX provides transparent, real-time carbon pricing accessible to anyone.
3. **Conservation integration**: Carbon offsets from wildlife habitat projects (REDD+, mangrove restoration) create direct links between climate action and biodiversity conservation, aligning with Zoo's mission.
4. **DeFi composability**: Tokenized offsets integrate with conservation bonds (ZIP-101), lending (ZIP-107), and yield vaults (ZIP-102), unlocking financial innovation around carbon assets.

## Specification

### 1. Token Standards

Each carbon offset type is represented by a distinct ZRC-20 token:

| Token | Standard | Description |
|-------|----------|-------------|
| zVCS | Verra VCS | Verified Carbon Standard credits |
| zGS | Gold Standard | Gold Standard certified offsets |
| zCON | Zoo Conservation | Zoo-native offsets from habitat restoration (ZIP-520) |

All tokens share a common interface extending ZRC-20 (ZIP-700).

### 2. Token Contract

```solidity
// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonOffsetToken is ERC20, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct CarbonCredit {
        string registryId;       // Source registry serial number
        string projectId;        // Project identifier
        string vintage;          // Year of offset generation
        string methodology;      // Verification methodology
        string countryCode;      // ISO 3166-1 alpha-3
        CreditType creditType;
        bool retired;
    }

    enum CreditType { VCS, GoldStandard, ZooConservation }

    mapping(bytes32 => CarbonCredit) public credits;
    mapping(bytes32 => bool) public bridged;

    uint256 public totalRetired;
    uint256 public totalBridged;

    event CreditBridged(bytes32 indexed creditHash, string registryId, uint256 amount);
    event CreditRetired(address indexed retiree, bytes32 indexed creditHash, uint256 amount, string reason);

    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function bridgeCredit(
        string calldata registryId,
        string calldata projectId,
        string calldata vintage,
        string calldata methodology,
        string calldata countryCode,
        CreditType creditType,
        uint256 tonnes,
        bytes calldata verifierSignature
    ) external onlyRole(VERIFIER_ROLE) {
        bytes32 creditHash = keccak256(abi.encodePacked(registryId, vintage));
        require(!bridged[creditHash], "ALREADY_BRIDGED");

        credits[creditHash] = CarbonCredit({
            registryId: registryId,
            projectId: projectId,
            vintage: vintage,
            methodology: methodology,
            countryCode: countryCode,
            creditType: creditType,
            retired: false
        });

        bridged[creditHash] = true;
        totalBridged += tonnes;
        _mint(msg.sender, tonnes * 1e18);

        emit CreditBridged(creditHash, registryId, tonnes);
    }

    function retire(uint256 amount, string calldata reason) external {
        require(balanceOf(msg.sender) >= amount, "INSUFFICIENT_BALANCE");
        _burn(msg.sender, amount);
        totalRetired += amount;
        emit CreditRetired(msg.sender, bytes32(0), amount, reason);
    }
}
```

### 3. Verification Oracle

Carbon credits are only mintable after verification by DAO-approved oracles that:

1. Confirm the credit exists in the source registry.
2. Confirm the credit has not been previously retired or tokenized.
3. Lock or retire the credit in the source registry to prevent double-counting.
4. Submit a signed attestation on-chain.

The oracle set is managed by ZooGovernor. A minimum of 2-of-3 oracle signatures is required for bridging.

### 4. Retirement Mechanism

On-chain retirement is permanent and irrevocable:

```
User calls retire(amount, reason)
  -> Tokens burned
  -> RetirementCertificate NFT minted (soulbound, ZIP-202 compatible)
  -> Source registry notified via oracle (async confirmation)
```

### 5. Pricing Integration

Carbon tokens trade on the Zoo DEX (ZIP-105/ZIP-106). The AMM conservation fee (ZIP-106) applies, meaning every carbon credit trade also funds wildlife conservation.

### 6. Parameters

| Parameter | Value | Governance |
|-----------|-------|------------|
| Minimum bridge amount | 1 tCO2e | ZooGovernor |
| Oracle quorum | 2 of 3 | ZooGovernor |
| Retirement cooldown | None | N/A |
| Supported registries | Verra, Gold Standard, Zoo | ZooGovernor |

## Rationale

**Why separate tokens per registry?** Different carbon registries have different verification standards and market prices. Fungibility should only apply within a single standard to avoid quality dilution.

**Why 2-of-3 oracle quorum?** Balances security against liveness. A single compromised oracle cannot mint unbacked tokens, and the system remains operational if one oracle goes offline.

**Why soulbound retirement certificates?** Retirement claims must be non-transferable to prevent "retirement washing" where organizations buy and sell retirement certificates rather than actually offsetting emissions.

## Security Considerations

### Double-Counting
The primary risk in carbon tokenization. Mitigated by oracle verification that locks credits in source registries before on-chain minting. The 2-of-3 quorum prevents a single compromised oracle from minting unbacked tokens.

### Oracle Collusion
If 2 of 3 oracles collude, they could mint unbacked tokens. ZooGovernor should maintain geographic and organizational diversity among oracle operators. A time-delay on large bridge operations (>1000 tCO2e) provides a window for community review.

### Stale Registry Data
Source registries may have latency. The protocol enforces a 24-hour confirmation window after bridging during which the mint can be reversed if the source registry rejects the lock.

### Price Manipulation
Carbon tokens with thin liquidity are vulnerable to price manipulation. The Impact Lending Protocol (ZIP-107) should use TWAP oracles with a minimum observation window of 24 hours for carbon collateral pricing.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-100: Zoo Contract Registry](./zip-0100-zoo-contract-registry.md)
3. [ZIP-105: Carbon Credit DEX](./zip-0105-carbon-credit-dex.md)
4. [ZIP-107: Impact Lending Protocol](./zip-0107-impact-lending-protocol.md)
5. [ZIP-700: ZRC-20 Fungible Token Standard](./zip-0700-zrc-20-fungible-token-standard.md)
6. [Verra VCS Program Guide](https://verra.org/programs/verified-carbon-standard/)
7. [Gold Standard for the Global Goals](https://www.goldstandard.org/)
8. [Toucan Protocol: Base Carbon Tonne](https://docs.toucan.earth/)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
