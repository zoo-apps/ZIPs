---
zip: 21
title: "Zoo Naming Service"
description: "Decentralized .zoo domain name service for wallets, identities, and conservation projects"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-01-15
tags: [naming, identity, domains, dns]
---

# ZIP-0021: Zoo Naming Service

## Abstract

This proposal defines the Zoo Naming Service (ZNS), a decentralized domain name system on Zoo Network that maps human-readable `.zoo` names to wallet addresses, smart contracts, IPFS content, and conservation project identifiers. ZNS enables users to register names like `alice.zoo` or `borneo-orangutan.zoo` for identity, payments, and project discovery.

## Motivation

Hex addresses are hostile to human interaction and hinder adoption:

1. **Usability**: `donate.wwf.zoo` is vastly more accessible than `0x9011E888...`
2. **Identity**: Researchers, conservationists, and donors need recognizable on-chain identities
3. **Project discovery**: Named conservation projects (`amazon-reforestation.zoo`) are easier to find and verify
4. **Phishing prevention**: Named addresses reduce the risk of sending funds to wrong addresses
5. **Ecosystem branding**: A `.zoo` namespace strengthens Zoo Network's identity

## Specification

### Name Structure

```
<label>.zoo                    # Top-level name
<sublabel>.<label>.zoo         # Subdomain
```

- **Label rules**: 3-63 characters, alphanumeric plus hyphens, no leading/trailing hyphens
- **Unicode**: Supported via IDNA2008 normalization (Punycode encoding on-chain)
- **Reserved**: `zoo`, `admin`, `governance`, `treasury`, `bridge` (controlled by Foundation)

### Registration Tiers

| Name Length | Annual Fee (ZOO) | Category |
|-------------|-----------------|----------|
| 3 characters | 10,000 | Premium |
| 4 characters | 2,500 | Standard |
| 5 characters | 500 | Standard |
| 6+ characters | 100 | Basic |
| Conservation projects | 0 (subsidized) | Verified |

### Registry Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooNameRegistry {
    struct NameRecord {
        address owner;
        address resolver;
        uint256 expiry;
        bool isConservationProject;
    }

    mapping(bytes32 => NameRecord) public names;

    event NameRegistered(bytes32 indexed nameHash, address owner, uint256 expiry);
    event NameResolved(bytes32 indexed nameHash, address resolved);

    function register(
        string calldata name,
        address owner,
        uint256 duration
    ) external payable returns (bytes32 nameHash) {
        nameHash = keccak256(abi.encodePacked(name));
        require(names[nameHash].expiry < block.timestamp, "name taken");
        uint256 fee = calculateFee(name, duration);
        require(msg.value >= fee, "insufficient fee");

        names[nameHash] = NameRecord({
            owner: owner,
            resolver: address(defaultResolver),
            expiry: block.timestamp + duration,
            isConservationProject: false
        });

        emit NameRegistered(nameHash, owner, block.timestamp + duration);
    }

    function resolve(string calldata name) external view returns (address) {
        bytes32 nameHash = keccak256(abi.encodePacked(name));
        NameRecord memory record = names[nameHash];
        require(record.expiry >= block.timestamp, "name expired");
        return IResolver(record.resolver).addr(nameHash);
    }
}
```

### Resolver Interface

Resolvers map names to various record types:

| Record Type | Key | Example Value |
|-------------|-----|---------------|
| Address | `addr` | `0x9011E888251AB053B7bD1cdB598Db4f9DEd94714` |
| Content Hash | `contenthash` | `ipfs://QmYwAPJz...` |
| Text | `description` | `Borneo orangutan conservation project` |
| Text | `url` | `https://borneo-project.zoo.network` |
| Text | `avatar` | `ipfs://QmAvatar...` |
| Address (multi-chain) | `addr.lux` | Lux C-Chain address |

### Conservation Project Names

Verified conservation projects receive free `.zoo` names:

1. Project submits verification request with evidence (NGO registration, field reports)
2. Impact Oracle operators (ZIP-0020) validate the project
3. Upon approval, a subsidized name is minted with `isConservationProject = true`
4. Conservation project names display a verification badge in ecosystem UIs

### Revenue Allocation

All ZNS registration fees flow to the treasury (ZIP-0018):

```yaml
fee_distribution:
  conservation_fund: 60%
  operations: 20%
  name_renewal_subsidy_pool: 20%
```

### Grace Period and Expiry

- **Grace period**: 90 days after expiry where only the previous owner can renew
- **Premium auction**: After grace period, expired premium names (3-4 chars) enter a Dutch auction starting at 10x annual fee, decreasing linearly over 28 days to the standard fee
- **Basic release**: Names 5+ characters return to open registration at standard price

## Rationale

The tiered pricing model reflects the scarcity of short names while keeping longer names affordable for grassroots conservation projects. Free names for verified conservation projects remove financial barriers and encourage legitimate use of the namespace.

ENS-compatible resolver interface ensures tooling compatibility with existing wallet integrations and dApps that already support ENS-style resolution.

60% of fees going to conservation means that even the naming service contributes to the core mission, turning a protocol utility into a funding mechanism.

## Security Considerations

- **Front-running**: Name registration uses a commit-reveal scheme (commit hash first, reveal name after 1 block) to prevent front-running of desirable names
- **Squatting**: Names unused for 2 years (no transactions resolved) may be reclaimed via governance vote
- **Homograph attacks**: IDNA2008 normalization prevents confusable character substitutions
- **Resolver trust**: Users can set custom resolvers, but default resolver is maintained by the Foundation with upgrade timelock
- **Key rotation**: Name owners can update their resolver address, enabling key rotation without losing the name

## References

- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [ZIP-0020: Impact Metric Oracle](./zip-0020-impact-metric-oracle.md)
- [ENS Documentation](https://docs.ens.domains/)
- [ENSIP-1: ENS Name Resolution](https://docs.ens.domains/ensip/1)
- [RFC 5891: IDNA2008](https://tools.ietf.org/html/rfc5891)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
