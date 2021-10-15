---
zip: 22
title: "Multi-Chain Bridge Standard"
description: "Bridge protocol for ZOO token cross-chain transfers between Zoo L2, Lux C-Chain, and external networks"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
originated: 2021-10
traces-from: "Whitepaper sections 16 (Asset Transfer) and 22 (Bridging Blockchains)"
follow-on: [zoo-bridge, zoo-lux-bridge-protocol, zoo-threshold-signatures]
created: 2025-01-15
tags: [bridge, cross-chain, interoperability, warp]
---

# ZIP-0022: Multi-Chain Bridge Standard

## Abstract

This proposal defines the standard bridge protocol for transferring ZOO tokens and other Zoo Network assets across chains. It specifies the native Lux Warp messaging bridge for Zoo L2 to Lux C-Chain transfers, and a lock-and-mint bridge for connections to external EVM chains (Ethereum, Arbitrum, Base). The standard enforces security invariants including supply conservation, rate limiting, and multi-operator verification.

## Motivation

Zoo Network assets must be portable across ecosystems to maximize utility and liquidity:

1. **Liquidity access**: Bridging to major chains enables ZOO trading on established DEXes
2. **Donation accessibility**: Donors may hold assets on Ethereum or other chains; bridging lowers friction
3. **DeFi composability**: Cross-chain assets can participate in yield strategies on multiple networks
4. **Ecosystem growth**: Interoperability attracts users from other ecosystems
5. **Lux integration**: Native Warp messaging provides the most secure bridge to the Lux ecosystem

## Specification

### Bridge Architecture

```
┌──────────────┐    Warp Messaging     ┌──────────────┐
│  Zoo L2      │◄─────────────────────►│ Lux C-Chain  │
│  (Native ZOO)│    (Native, trustless)│ (Wrapped ZOO)│
└──────┬───────┘                       └──────────────┘
       │
       │  Lock-and-Mint
       │
┌──────┴───────┐    ┌──────────────┐   ┌──────────────┐
│  Bridge      │◄──►│  Ethereum    │   │  Arbitrum    │
│  Contract    │    │  (zooZOO)    │   │  (zooZOO)    │
│  (Zoo L2)    │◄──►│              │   │              │
└──────────────┘    └──────────────┘   └──────────────┘
```

### Lux Warp Bridge (Native)

The Warp messaging bridge is the primary bridge for Zoo L2 <-> Lux C-Chain:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWarpMessenger {
    function sendWarpMessage(bytes calldata payload) external returns (bytes32);
    function getVerifiedWarpMessage(uint32 index)
        external view returns (WarpMessage memory, bool valid);
}

contract ZooWarpBridge {
    IWarpMessenger constant WARP = IWarpMessenger(0x0200000000000000000000000000000000000005);
    bytes32 public immutable peerChainId;

    event BridgeInitiated(address indexed sender, uint256 amount, bytes32 destChainId);
    event BridgeCompleted(address indexed recipient, uint256 amount, bytes32 srcChainId);

    function bridgeOut(uint256 amount, address recipient) external {
        IERC20(zooToken).transferFrom(msg.sender, address(this), amount);
        bytes memory payload = abi.encode(recipient, amount);
        WARP.sendWarpMessage(payload);
        emit BridgeInitiated(msg.sender, amount, peerChainId);
    }

    function bridgeIn(uint32 index) external {
        (IWarpMessenger.WarpMessage memory msg, bool valid) =
            WARP.getVerifiedWarpMessage(index);
        require(valid, "invalid warp message");
        require(msg.sourceChainID == peerChainId, "wrong source");
        (address recipient, uint256 amount) = abi.decode(msg.payload, (address, uint256));
        IERC20(zooToken).transfer(recipient, amount);
        emit BridgeCompleted(recipient, amount, msg.sourceChainID);
    }
}
```

### External Chain Bridge (Lock-and-Mint)

For non-Lux chains, Zoo uses a lock-and-mint model:

| Step | Zoo L2 | External Chain |
|------|--------|---------------|
| Bridge out | Lock ZOO in vault | Mint zooZOO (wrapped) |
| Bridge in | Release ZOO from vault | Burn zooZOO |

### Bridge Operator Set

External bridges require a multi-operator verification set:

```yaml
operators:
  minimum: 7
  threshold: 5-of-7       # Signature threshold
  stake: 100000 ZOO each  # Slashable stake
  rotation: quarterly     # Via governance
  slashing:
    conditions:
      - signing_invalid_message
      - downtime_exceeding_4_hours
      - colluding_on_fake_transfer
    penalty: 50% of stake
```

### Rate Limiting

To prevent catastrophic bridge exploits:

| Parameter | Value | Adjustable |
|-----------|-------|-----------|
| Per-transaction limit | 1,000,000 ZOO | Governance |
| Hourly volume limit | 10,000,000 ZOO | Governance |
| Daily volume limit | 50,000,000 ZOO | Governance |
| Cooldown after limit | 1 hour | Fixed |
| Emergency pause threshold | 25% of locked supply in 24h | Fixed |

### Supply Invariant

The bridge enforces a strict supply conservation rule:

```
total_supply_zoo_l2 + locked_in_bridge_vaults == INITIAL_SUPPLY + EMISSIONS
```

An on-chain audit function verifies this invariant and pauses the bridge if violated.

### Supported Assets

| Asset | Zoo L2 | Lux C-Chain | Ethereum |
|-------|--------|-------------|----------|
| ZOO | Native | wZOO | zooZOO |
| LUX | wLUX | Native | - |
| USDC | Zoo USDC | USDC | USDC |

## Rationale

Two bridge architectures serve different trust models. The Warp bridge for Lux is trustless (validated by the primary network), making it the preferred path. External bridges use an operator set because cross-ecosystem verification requires an intermediate trust layer.

5-of-7 threshold for external bridges provides Byzantine fault tolerance (tolerates 2 compromised operators) while keeping the set small enough for operational efficiency.

Rate limiting is critical because bridge exploits are the most common attack vector in cross-chain DeFi. The emergency pause at 25% of locked supply provides an automatic circuit breaker.

## Security Considerations

- **Bridge exploits**: Rate limiting and supply invariant checks provide defense-in-depth against the most common DeFi attack vector
- **Operator collusion**: 5-of-7 threshold means 3+ operators must collude; economic stake makes this expensive
- **Warp message replay**: Each Warp message includes a nonce that is consumed on receipt, preventing replay
- **Wrapped token depegging**: If the bridge is paused, wrapped tokens may trade at a discount; a reserve fund covers redemptions during pauses
- **Chain reorganization**: Bridge finality waits for 32 block confirmations on external chains before releasing funds
- **Smart contract bugs**: Bridge contracts require three independent audits and a $500,000 bug bounty

## References

- [ZIP-0015: Zoo L2 Chain Architecture](./zip-0015-zoo-l2-chain-architecture.md)
- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0800: Zoo-Lux Bridge Protocol](./zip-0800-zoo-lux-bridge-protocol.md)
- [Lux Warp Messaging](https://docs.lux.network/warp)
- [EIP-7683: Cross-Chain Intents](https://eips.ethereum.org/EIPS/eip-7683)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
