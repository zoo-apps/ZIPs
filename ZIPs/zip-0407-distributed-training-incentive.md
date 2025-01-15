---
zip: 407
title: "Distributed Training Incentive"
description: "Token incentive mechanism for contributing compute resources to distributed AI model training on the Zoo network"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
created: 2025-01-15
tags: [ai, distributed-training, incentive, compute, tokenomics]
requires: [0, 1, 400, 402, 406]
---

# ZIP-407: Distributed Training Incentive

## Abstract

This proposal defines a token incentive mechanism for contributing compute resources to distributed AI model training on the Zoo network. Contributors register GPU/TPU nodes, receive training task assignments, submit gradient updates with proof-of-computation, and earn ZOO token rewards proportional to their verified contribution. The mechanism uses a commit-reveal scheme for gradient submission to prevent free-riding, and integrates with ZIP-406 (Model Attestation) to ensure training outputs are properly attested. Reward distribution is based on verified computation shares rather than self-reported hardware specs.

## Motivation

Training large AI models requires significant compute. Centralized cloud providers charge premium prices and create dependency on a few corporations. The Zoo network can aggregate idle GPU capacity from the community, but contributors need economic incentives:

1. **Cost reduction**: Distributed training across community GPUs can reduce training costs by 60-80% compared to centralized cloud providers.
2. **Decentralization**: No single entity controls the training infrastructure. Model training cannot be censored or shut down.
3. **Accessibility**: Researchers with limited budgets (especially in conservation science) can access training compute through the network.
4. **Fair compensation**: GPU owners earn returns on idle hardware. The incentive mechanism ensures honest contributors are rewarded and free-riders are penalized.

## Specification

### 1. Node Registration

Compute contributors register their hardware:

```solidity
struct ComputeNode {
    address operator;
    bytes32 nodeId;
    string hardwareSpec;          // Standardized hardware descriptor
    uint256 benchmarkScore;       // Verified benchmark result
    uint256 stakeAmount;          // ZOO tokens staked
    bool active;
    uint64 registeredAt;
}

contract ComputeRegistry {
    uint256 public constant MIN_STAKE = 100e18;  // 100 ZOO

    function registerNode(
        bytes32 nodeId,
        string calldata hardwareSpec,
        uint256 benchmarkScore,
        bytes calldata benchmarkProof
    ) external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(
            verifyBenchmark(nodeId, benchmarkScore, benchmarkProof),
            "Invalid benchmark"
        );
        nodes[nodeId] = ComputeNode({
            operator: msg.sender,
            nodeId: nodeId,
            hardwareSpec: hardwareSpec,
            benchmarkScore: benchmarkScore,
            stakeAmount: msg.value,
            active: true,
            registeredAt: uint64(block.timestamp)
        });
    }
}
```

### 2. Task Assignment

Training jobs are decomposed into tasks and assigned to registered nodes:

```typescript
interface TrainingTask {
  taskId: string;
  jobId: string;                   // Parent training job
  modelId: string;                 // ZIP-406 model being trained
  epoch: number;
  batchRange: [number, number];    // Data batch indices
  hyperparameters: Record<string, number>;
  dataShardUri: string;            // Encrypted data shard location
  deadline: number;                // Seconds to complete
  rewardPool: number;              // ZOO allocated to this task
}
```

The task scheduler assigns work based on node benchmark scores and historical reliability. Nodes with higher scores receive larger batch ranges and proportionally higher rewards.

### 3. Gradient Submission (Commit-Reveal)

To prevent free-riding (copying another node's gradients), submissions use commit-reveal:

```
Phase 1: COMPUTE (task deadline)
  Node computes gradients for assigned batch range.
  Node commits: hash(gradients || salt || nodeId)

Phase 2: REVEAL (30 minutes after deadline)
  Node reveals: gradients + salt
  Contract verifies: hash matches commitment

Phase 3: AGGREGATE
  Coordinator aggregates verified gradients.
  Model weights updated.
```

Nodes that commit but fail to reveal are slashed (5% of stake). Nodes that do not commit forfeit their task reward.

### 4. Proof of Computation

Nodes prove they performed actual computation through gradient validation:

```typescript
interface ComputationProof {
  nodeId: string;
  taskId: string;
  gradientHash: string;           // Hash of gradient tensor
  intermediateHashes: string[];   // Hashes at checkpoint steps
  computeTimeMs: number;
  gpuUtilization: number;         // 0.0 - 1.0
  teeAttestation?: string;       // TEE proof if available
}
```

The coordinator validates proofs by:
1. Verifying intermediate hashes are consistent with the final gradient
2. Checking compute time is plausible for the hardware spec and batch size
3. Cross-referencing a random subset of tasks by re-executing on trusted verifier nodes

### 5. Reward Distribution

```solidity
contract TrainingRewards {
    function distributeRewards(
        bytes32 jobId,
        bytes32[] calldata nodeIds,
        uint256[] calldata contributions  // Verified compute shares
    ) external onlyCoordinator {
        uint256 totalContribution = 0;
        for (uint i = 0; i < contributions.length; i++) {
            totalContribution += contributions[i];
        }

        uint256 rewardPool = jobs[jobId].totalReward;
        for (uint i = 0; i < nodeIds.length; i++) {
            uint256 reward = (rewardPool * contributions[i])
                / totalContribution;
            pendingRewards[nodeIds[i]] += reward;
        }

        emit RewardsDistributed(jobId, nodeIds.length, rewardPool);
    }
}
```

Rewards are proportional to verified computation shares. A node that processes 10% of the total batch range receives 10% of the reward pool, adjusted by a quality multiplier based on gradient validation scores.

### 6. Slashing Conditions

| Violation | Slash Amount | Additional Penalty |
|-----------|-------------|-------------------|
| Failed to reveal after commit | 5% of stake | Task reassigned |
| Invalid gradients (random noise) | 20% of stake | 7-day suspension |
| Copied another node's gradients | 50% of stake | 30-day ban |
| Repeated invalid submissions (3+) | 100% of stake | Permanent ban |

## Rationale

- **Staking requirement**: Stake aligns incentives. Nodes with skin in the game are less likely to submit garbage gradients or go offline mid-task.
- **Commit-reveal for gradients**: Without commit-reveal, a lazy node could wait for another node to submit gradients and copy them. The commitment prevents this because gradients must be committed before any are revealed.
- **Benchmark-based assignment**: Self-reported hardware specs are unreliable. Verified benchmarks ensure task assignments match actual capability, preventing nodes from claiming high-end hardware while running on consumer GPUs.
- **Proportional rewards**: Nodes that contribute more compute earn more. This naturally attracts higher-capacity hardware to the network while allowing smaller contributors to participate at a smaller scale.

## Security Considerations

1. **Gradient poisoning**: A malicious node could submit adversarial gradients to degrade model quality. Mitigation: Byzantine-tolerant aggregation (coordinate-wise median) rejects outlier gradients. Nodes whose gradients are consistently rejected face slashing.
2. **Data leakage**: Training data shards contain potentially sensitive conservation data. Mitigation: data shards are encrypted with per-task keys; nodes receive decryption keys only after committing their benchmark proof and stake.
3. **Coordinator compromise**: The task coordinator is a privileged role. Mitigation: coordinator is a multisig contract requiring 3-of-5 signatures from the Zoo AI Committee; coordinator actions are timelocked and auditable.
4. **Stake grinding**: An attacker could register many low-stake nodes. Mitigation: minimum stake of 100 ZOO per node; total network contribution is weighted by verified benchmark scores, not node count.
5. **Timing attacks**: Observing commit timestamps could leak information about which nodes are collaborating. Mitigation: commitments are batched and published together after the compute phase ends.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-1: Hamiltonian LLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
3. [ZIP-400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
4. [ZIP-402: Proof of AI Consensus](./zip-0402-proof-of-ai-consensus.md)
5. [ZIP-406: Model Attestation Protocol](./zip-0406-model-attestation-protocol.md)
6. Dean, J. et al. "Large Scale Distributed Deep Networks." NIPS 2012.
7. Kairouz, P. et al. "Advances and Open Problems in Federated Learning." FnTML 2021.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
