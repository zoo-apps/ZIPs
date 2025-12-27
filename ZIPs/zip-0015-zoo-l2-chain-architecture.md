---
zip: 15
title: "Zoo L2 Chain Architecture"
description: "Zoo Network operates as an L2 chain on the Lux Network, inheriting security from primary network validators"
author: "Zoo Labs Foundation"
status: "Final"
type: "Standards Track"
category: "Core"
created: 2025-12-27
requires: "LP-0011"
---

# ZIP-0015: Zoo L2 Chain Architecture

## Abstract

Zoo Network operates as an L2 chain on the Lux Network, meaning it is validated by the Lux primary network validators rather than maintaining its own independent validator set. This architecture provides Zoo with inherited security from the primary network while reducing operational complexity and enabling faster ecosystem growth.

## Motivation

Zoo Labs Foundation chose the L2 model for several strategic reasons:

1. **Lower barrier to entry**: No need to bootstrap a separate validator set
2. **Inherited security**: Benefits from Lux primary network's Byzantine fault tolerance
3. **Focus on mission**: Conservation and AI research, not validator operations
4. **Ecosystem alignment**: Deeper integration with Lux Network
5. **Faster iteration**: Quicker upgrades without validator coordination

## Specification

### Chain Configuration

```yaml
chain:
  name: Zoo
  type: L2
  chainId: 200200
  ticker: ZOO
  
validation:
  type: primary-network
  inheritSecurity: true
  
consensus:
  engine: snowman
  parameters: inherit
```

### Genesis Configuration

```json
{
  "config": {
    "chainId": 200200,
    "chainType": "L2",
    "validatorSet": {
      "type": "primary-network",
      "inheritSecurity": true
    }
  },
  "timestamp": "0x0",
  "gasLimit": "0xb71b00",
  "alloc": {
    "0x9011E888251AB053B7bD1cdB598Db4f9DEd94714": {
      "balance": "0x..."
    }
  }
}
```

### Network Endpoints

| Network | Chain ID | RPC Endpoint |
|---------|----------|--------------|
| Mainnet | 200200 | `https://api.zoo.network/ext/bc/zoo/rpc` |
| Testnet | 200201 | `https://testnet.zoo.network/ext/bc/zootest/rpc` |

### Validation Model

As an L2, Zoo transactions are validated by Lux primary network validators:

```
User Transaction → Zoo Chain → Primary Network Validators → Consensus → Finality
```

**Benefits:**
- No separate staking required for Zoo validators
- Immediate security inheritance (80%+ BFT)
- Shared infrastructure with Lux ecosystem
- Cross-chain Warp messaging built-in

**Tradeoffs:**
- Less sovereignty over consensus parameters
- Dependent on primary network health
- Shared block space with other L2s

### Cross-Chain Communication

Zoo uses Warp messaging for cross-chain operations:

```solidity
// Send message to Hanzo (L1)
IWarpMessenger(WARP_ADDRESS).sendMessage(
    HANZO_CHAIN_ID,
    abi.encode(payload)
);

// Receive message from C-Chain
function receiveWarpMessage(bytes calldata message) external {
    require(msg.sender == WARP_ADDRESS);
    // Process cross-chain message
}
```

### Upgrade Path

Zoo can upgrade to L1 (sovereign) status if needed:

```bash
# Future: Migrate to L1 with own validators
lux chain upgrade zoo --type l1 --validators validator-set.json
```

This would require:
1. Establishing independent validator set
2. Migrating staking economics
3. Deploying validator infrastructure
4. Coordinating network upgrade

## Rationale

### Why L2 over L1?

| Factor | L1 (Sovereign) | L2 (Zoo's Choice) |
|--------|----------------|-------------------|
| Validator ops | Required | Not required |
| Security bootstrap | Months | Immediate |
| Focus | Infrastructure | Mission (conservation) |
| Upgrade speed | Slow (validator coord) | Fast |
| Cross-chain | Manual setup | Built-in |

### Comparison with Hanzo

Zoo and Hanzo represent the two chain models:

| Chain | Type | Validators | Use Case |
|-------|------|------------|----------|
| **Zoo** | L2 | Primary network | Conservation, community AI |
| **Hanzo** | L1 | Own set | AI compute, sovereignty |

This allows Lux ecosystem to demonstrate and optimize both approaches.

## Security Considerations

### Inherited Security

Zoo inherits Lux primary network security:
- 80%+ Byzantine fault tolerance
- Economic security from LUX staking
- Battle-tested consensus (Snow family)

### Chain-Specific Security

Zoo implements additional security measures:
- Conservation fund multisig (3-of-5)
- AI model attestation via Z-Chain
- Cross-chain message validation

## Implementation

### Deployment

```bash
# Deploy Zoo to mainnet (L2 mode)
lux chain deploy zoo --mainnet --type l2

# Verify chain type
lux chain info zoo
# Output: Type: L2 (Primary Network Validated)
```

### Integration with LP-0011

Zoo follows the L2 specification defined in LP-0011:
- Genesis format compliance
- CLI command compatibility
- Warp messaging support
- Upgrade path documentation

## References

- [LP-0011: Chain Types Specification](https://lps.lux.network/lp-0011)
- [ZIP-0000: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
- [HIP-0101: Hanzo-Lux Bridge Protocol](https://hips.hanzo.ai/hip-0101)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
