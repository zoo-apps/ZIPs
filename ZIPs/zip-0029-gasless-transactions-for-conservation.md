---
zip: 29
title: "Gasless Transactions for Conservation"
description: "Meta-transaction relay system enabling zero-gas conservation actions on Zoo Network"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: Core
created: 2025-01-15
tags: [meta-transactions, gasless, relay, conservation]
---

# ZIP-0029: Gasless Transactions for Conservation

## Abstract

This proposal defines a meta-transaction relay system that sponsors gas fees for conservation-related actions on Zoo Network. Users performing donations, citizen science submissions, grant milestone reports, and impact data contributions can interact with the network without holding ZOO tokens for gas. The Foundation operates a relay network funded by a dedicated gas sponsorship pool, with EIP-2771 compliant forwarding contracts.

## Motivation

Gas fees are the primary barrier to conservation participation on blockchain networks:

1. **Donor onboarding**: Donors who want to contribute should not need to first acquire gas tokens
2. **Citizen scientists**: Researchers submitting species observations should not bear transaction costs
3. **Global access**: Users in developing countries where even small gas fees are prohibitive need free access
4. **Mission priority**: Conservation actions are the core purpose of Zoo Network and should be frictionless
5. **Nonprofit obligation**: As a 501(c)(3), Zoo should minimize barriers to charitable participation

## Specification

### Sponsored Action Types

| Action | Sponsored | Daily Limit per User |
|--------|-----------|---------------------|
| Conservation donation | Yes | 10 transactions |
| Citizen science data submission | Yes | 50 transactions |
| Grant milestone report | Yes | 5 transactions |
| Impact oracle data submission | Yes | 20 transactions |
| Governance vote | Yes | 5 transactions |
| ZNS registration (conservation projects) | Yes | 1 transaction |
| Token transfers | No | - |
| DeFi operations | No | - |
| NFT trading | No | - |

### Meta-Transaction Architecture

```
┌──────────┐    sign     ┌──────────┐    relay    ┌──────────────┐
│  User    │────────────►│  Relay   │────────────►│  Forwarder   │
│ (no gas) │  (EIP-712)  │  Server  │  (pays gas) │  Contract    │
└──────────┘             └──────────┘             └──────┬───────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  Target      │
                                                  │  Contract    │
                                                  │ (trusts fwd) │
                                                  └──────────────┘
```

### EIP-2771 Forwarder Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZooForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        uint48 deadline;
        bytes data;
    }

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public sponsoredActions;

    event MetaTransactionExecuted(
        address indexed from,
        address indexed to,
        bytes32 actionType,
        bool success
    );

    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) external payable returns (bool success, bytes memory result) {
        require(block.timestamp <= req.deadline, "expired");
        require(nonces[req.from] == req.nonce, "invalid nonce");

        // Verify action is sponsored
        bytes32 actionType = getActionType(req.to, req.data);
        require(sponsoredActions[actionType], "not sponsored");

        // Verify signature (EIP-712)
        address signer = recoverSigner(req, signature);
        require(signer == req.from, "invalid signature");

        nonces[req.from]++;

        // Execute with sender appended (EIP-2771)
        (success, result) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        emit MetaTransactionExecuted(req.from, req.to, actionType, success);
    }
}
```

### Target Contract Integration

Contracts that accept meta-transactions must inherit `ERC2771Context`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract ConservationDonation is ERC2771Context {
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function donate(bytes32 projectId) external payable {
        address donor = _msgSender(); // Returns actual sender, not relay
        // Process donation from donor
    }
}
```

### Gas Sponsorship Pool

```yaml
sponsorship_pool:
  source: 5% of transaction fees collected on Zoo Network
  replenishment: automatic per epoch
  monthly_budget: 500,000 ZOO
  per_user_daily_limit:
    gas_value: 0.1 ZOO equivalent
    transactions: varies by action type (see table above)
  reserve: 3 months operating buffer
```

### Relay Network

```yaml
relay_network:
  operators:
    minimum: 3
    selection: permissionless (any address can relay)
    reimbursement: from sponsorship pool + 10% premium
  availability:
    target: 99.9% uptime
    fallback: users can submit transactions directly (with gas)
  rate_limiting:
    per_user: enforced at forwarder contract level
    per_relay: 1000 transactions/minute
    global: 10000 transactions/minute
```

### Anti-Abuse Measures

| Measure | Implementation |
|---------|---------------|
| Daily transaction limits | Per-user nonce tracking in forwarder |
| Action type whitelist | Only conservation-related actions are sponsored |
| Proof of humanity | Optional World ID or Gitcoin Passport for higher limits |
| IP rate limiting | Relay-level, not on-chain |
| Reputation gating | Users with ZOO-REP (ZIP-0026) get 2x daily limits |

### User Experience Flow

1. User connects wallet (no ZOO balance needed)
2. User signs an EIP-712 typed data message (gasless signature)
3. Relay server validates the request and submits on behalf of user
4. Target contract processes the action using `_msgSender()` to identify the real user
5. Relay is reimbursed from the sponsorship pool

### SDK Integration

The Zoo SDK (ZIP-0028) transparently handles meta-transactions:

```typescript
const client = new ZooClient({
  rpcUrl: "https://api.zoo.network/ext/bc/zoo/rpc",
  relayUrl: "https://relay.zoo.network",  // Meta-transaction relay
  gasless: true,  // Enable gasless mode for sponsored actions
});

// This donation is automatically relayed (user pays no gas)
await client.conservation.donate({
  projectId: "borneo-orangutan",
  amount: parseEther("100"),
});
```

## Rationale

EIP-2771 is chosen over EIP-4337 (account abstraction) because it requires no changes to user wallets and works with existing EOAs. Conservation donors likely have standard wallets (MetaMask, etc.) and should not need to deploy smart contract wallets.

Limiting sponsorship to conservation actions (not DeFi or trading) ensures the gas pool is used for mission-aligned activities. This is both economically sustainable and consistent with the Foundation's 501(c)(3) charitable purpose.

The 10% relay premium above gas cost ensures relaying is economically viable for third-party operators, creating a competitive relay market rather than Foundation-only infrastructure.

## Security Considerations

- **Replay attacks**: Nonce tracking in the forwarder contract prevents transaction replay
- **Relay censorship**: Multiple independent relays ensure no single operator can censor transactions; users can always fall back to direct submission
- **Sponsorship pool drain**: Daily per-user limits and action-type whitelist prevent rapid pool depletion
- **Forwarder trust**: Target contracts must only trust the canonical Zoo Forwarder address; a compromised forwarder could impersonate any user
- **Signature malleability**: EIP-712 structured signing prevents signature manipulation attacks
- **Relay griefing**: Relays validate transactions locally before submission to avoid wasting gas on guaranteed-to-fail transactions

## References

- [ZIP-0016: ZOO Token Economics](./zip-0016-zoo-token-economics.md)
- [ZIP-0026: Ecosystem Reputation System](./zip-0026-ecosystem-reputation-system.md)
- [ZIP-0028: Zoo SDK Specification](./zip-0028-zoo-sdk-specification.md)
- [EIP-2771: Secure Protocol for Native Meta Transactions](https://eips.ethereum.org/EIPS/eip-2771)
- [EIP-712: Typed Structured Data Hashing and Signing](https://eips.ethereum.org/EIPS/eip-712)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
