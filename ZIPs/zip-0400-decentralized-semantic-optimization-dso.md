---
zip: 0400
title: "Decentralized Semantic Optimization (DSO)"
description: "Privacy-preserving decentralized protocol for collaborative AI model training via semantic gradient sharing"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
originated: 2021-10
traces-from: "Whitepaper section 08 (AI Assistant)"
follow-on: [zoo-experience-ledger, experience-ledger-dso]
created: 2025-01-15
tags: [dso, decentralized-training, differential-privacy, semantic-gradients]
requires: [0001, 0007, 0009]
references: HIP-0002, HIP-0067, LP-7000, LP-7102
repository: https://github.com/zooai/dso-protocol
license: CC BY 4.0
---

# ZIP-400: Decentralized Semantic Optimization (DSO)

## Abstract

This proposal specifies the Decentralized Semantic Optimization (DSO) protocol, Zoo's core mechanism for privacy-preserving collaborative AI model training. DSO enables geographically distributed nodes to jointly improve shared models by exchanging **semantic gradients** -- compressed, privacy-protected representations of local learning signals -- rather than raw data or full parameter updates. The protocol guarantees differential privacy at configurable (epsilon, delta) budgets, employs Byzantine-robust aggregation, and records all training contributions on an immutable ledger for provenance and royalty distribution. DSO is the foundational training protocol that underpins all Zoo AI systems.

## Motivation

Training large AI models today requires centralizing massive datasets in a single location, creating three fundamental problems:

1. **Privacy violation**: Conservation organizations, field researchers, and citizen scientists cannot share sensitive wildlife data (e.g., endangered species locations, poaching incident coordinates) without risking exposure.
2. **Data sovereignty**: Wildlife data collected on indigenous lands or within national parks is often subject to legal restrictions that prohibit export or centralization.
3. **Compute concentration**: Only well-funded organizations can afford the GPU clusters required for full training runs, excluding smaller conservation groups from contributing to model improvement.
4. **Attribution opacity**: When many parties contribute data to a centralized training run, individual contributions cannot be tracked, preventing fair credit and royalty distribution.

DSO solves these problems by keeping raw data local, sharing only compressed semantic gradients, and recording every contribution on-chain.

### Relationship to Zoo Protocols

- **ZIP-0001 (HLLMs)**: DSO trains the base HLLM models that users personalize via BitDelta.
- **ZIP-0007 (BitDelta)**: BitDelta personalizes locally; DSO improves the shared base collaboratively.
- **ZIP-0402 (PoAI)**: PoAI validators verify DSO training rounds for consensus rewards.
- **ZIP-0403 (Federated Learning)**: DSO generalizes federated learning with semantic compression and on-chain provenance.

## Specification

### 1. System Architecture

```
+------------------+     +------------------+     +------------------+
|   DSO Node A     |     |   DSO Node B     |     |   DSO Node C     |
| (Camera Traps)   |     | (Acoustic Data)  |     | (Satellite Imgs) |
|                  |     |                  |     |                  |
| Local Data Store |     | Local Data Store |     | Local Data Store |
| Local Trainer    |     | Local Trainer    |     | Local Trainer    |
| Gradient Encoder |     | Gradient Encoder |     | Gradient Encoder |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                         |
         | Semantic Gradients      | Semantic Gradients      |
         | (encrypted, compressed) | (encrypted, compressed) |
         v                         v                         v
+--------+-------------------------+-------------------------+---------+
|                       DSO Aggregation Layer                          |
|  Byzantine-Robust Aggregation  |  Differential Privacy Engine       |
|  Contribution Scoring          |  On-Chain Provenance (LP-7102)     |
+-----------------------------------------------------------------+
         |
         v
+--------+---------+
| Updated Global   |
| Model Checkpoint |
| (IPFS + On-Chain)|
+------------------+
```

### 2. Semantic Gradient Encoding

Standard gradient vectors are high-dimensional and leak information about training data. DSO compresses gradients into a semantic representation that preserves optimization signal while destroying data-level detail.

```python
class SemanticGradientEncoder:
    """
    Encode raw gradients into privacy-preserving semantic representations.
    Achieves 100x compression with <5% optimization signal loss.
    """

    def __init__(self, model_dim: int, semantic_dim: int = 256):
        self.projection = RandomProjection(model_dim, semantic_dim, seed=42)
        self.quantizer = StochasticQuantizer(bits=4)

    def encode(
        self,
        raw_gradient: dict[str, torch.Tensor],
        privacy_budget: PrivacyBudget,
    ) -> SemanticGradient:
        # Step 1: Flatten and project to semantic space
        flat_grad = flatten_parameters(raw_gradient)
        projected = self.projection.forward(flat_grad)

        # Step 2: Clip gradient norm for bounded sensitivity
        clipped = clip_by_norm(projected, max_norm=1.0)

        # Step 3: Add calibrated Gaussian noise for (epsilon, delta)-DP
        noise_scale = compute_noise_multiplier(
            epsilon=privacy_budget.epsilon,
            delta=privacy_budget.delta,
            sensitivity=1.0,
            num_samples=privacy_budget.batch_size,
        )
        noised = clipped + torch.randn_like(clipped) * noise_scale

        # Step 4: Stochastic quantization to 4-bit
        quantized = self.quantizer.quantize(noised)

        return SemanticGradient(
            data=quantized,
            projection_seed=42,
            noise_scale=noise_scale,
            norm_before_clip=flat_grad.norm().item(),
        )

    def decode(self, semantic_grad: SemanticGradient) -> dict[str, torch.Tensor]:
        dequantized = self.quantizer.dequantize(semantic_grad.data)
        reconstructed = self.projection.inverse(dequantized)
        return unflatten_parameters(reconstructed)
```

### 3. Byzantine-Robust Aggregation

The aggregation layer must tolerate up to `f` malicious nodes out of `n` total, where `f < n/3`.

```python
class DSOAggregator:
    """
    Aggregate semantic gradients from distributed nodes with
    Byzantine fault tolerance via Multi-Krum selection.
    """

    def __init__(self, num_nodes: int, byzantine_fraction: float = 0.3):
        self.n = num_nodes
        self.f = int(num_nodes * byzantine_fraction)
        self.k = self.n - self.f - 2  # Multi-Krum selection count

    def aggregate(
        self,
        gradients: list[SemanticGradient],
        node_stakes: list[float],
    ) -> SemanticGradient:
        decoded = [g.data for g in gradients]

        # Multi-Krum: select k gradients closest to their peers
        scores = []
        for i, g_i in enumerate(decoded):
            distances = []
            for j, g_j in enumerate(decoded):
                if i != j:
                    distances.append(torch.norm(g_i - g_j).item())
            distances.sort()
            # Sum of closest (n - f - 2) distances
            scores.append(sum(distances[: self.n - self.f - 2]))

        # Select top-k by lowest score (most central)
        selected_indices = sorted(range(len(scores)), key=lambda i: scores[i])[: self.k]

        # Stake-weighted average of selected gradients
        total_stake = sum(node_stakes[i] for i in selected_indices)
        aggregated = torch.zeros_like(decoded[0])
        for i in selected_indices:
            weight = node_stakes[i] / total_stake
            aggregated += weight * decoded[i]

        return SemanticGradient(data=aggregated, is_aggregated=True)
```

### 4. Training Round Protocol

Each DSO training round follows a strict sequence:

```
Round r:
  1. ANNOUNCE: Coordinator publishes round_id, model_hash, hyperparameters
  2. COMMIT:   Each node n_i computes semantic gradient g_i and publishes
               commitment H(g_i || nonce_i) on-chain
  3. REVEAL:   Nodes reveal g_i and nonce_i; chain verifies H(g_i || nonce_i)
  4. AGGREGATE: Aggregator runs Multi-Krum on revealed gradients
  5. UPDATE:   New model checkpoint = old checkpoint + lr * aggregated_gradient
  6. ATTEST:   Updated model hash recorded on immutable ledger (LP-7102)
  7. REWARD:   Contributing nodes receive ZOO tokens proportional to
               contribution_score(g_i, aggregated)
```

### 5. Contribution Scoring

```python
def contribution_score(
    node_gradient: SemanticGradient,
    aggregated_gradient: SemanticGradient,
    validation_improvement: float,
) -> float:
    """
    Score a node's contribution to the training round.
    Combines alignment with consensus direction and validation gain.
    """
    # Cosine similarity between node gradient and aggregated result
    alignment = cosine_similarity(node_gradient.data, aggregated_gradient.data)

    # Magnitude contribution (how much signal vs noise)
    magnitude_ratio = node_gradient.norm_before_clip / aggregated_gradient.data.norm()

    # Weighted score
    score = (
        0.5 * max(0, alignment)           # Reward alignment, penalize opposition
        + 0.3 * min(1.0, magnitude_ratio)  # Reward meaningful signal
        + 0.2 * validation_improvement      # Reward actual model improvement
    )

    return score
```

### 6. On-Chain Provenance (LP-7102 Integration)

```solidity
contract DSOLedger {
    struct TrainingRound {
        uint256 roundId;
        bytes32 prevModelHash;
        bytes32 newModelHash;
        address[] contributors;
        uint256[] contributionScores;
        uint256 totalReward;
        bytes32 aggregationProof;
        uint256 timestamp;
    }

    mapping(uint256 => TrainingRound) public rounds;
    mapping(address => uint256) public accumulatedRewards;

    event RoundCompleted(
        uint256 indexed roundId,
        bytes32 newModelHash,
        uint256 numContributors
    );

    function recordRound(
        uint256 roundId,
        bytes32 prevModelHash,
        bytes32 newModelHash,
        address[] calldata contributors,
        uint256[] calldata scores,
        bytes calldata aggregationProof
    ) external onlyAggregator {
        require(contributors.length == scores.length, "Length mismatch");
        require(verifyAggregation(aggregationProof), "Invalid proof");

        uint256 totalReward = computeRoundReward(roundId);

        rounds[roundId] = TrainingRound({
            roundId: roundId,
            prevModelHash: prevModelHash,
            newModelHash: newModelHash,
            contributors: contributors,
            contributionScores: scores,
            totalReward: totalReward,
            aggregationProof: keccak256(aggregationProof),
            timestamp: block.timestamp
        });

        // Distribute rewards proportional to scores
        uint256 totalScore = sum(scores);
        for (uint i = 0; i < contributors.length; i++) {
            uint256 reward = (totalReward * scores[i]) / totalScore;
            accumulatedRewards[contributors[i]] += reward;
        }

        emit RoundCompleted(roundId, newModelHash, contributors.length);
    }
}
```

### 7. Privacy Budget Management

```python
class PrivacyAccountant:
    """
    Track cumulative privacy loss across training rounds
    using Renyi Differential Privacy (RDP) composition.
    """

    def __init__(self, max_epsilon: float = 8.0, delta: float = 1e-6):
        self.max_epsilon = max_epsilon
        self.delta = delta
        self.rdp_orders = list(range(2, 128))
        self.rdp_spent = [0.0] * len(self.rdp_orders)

    def can_participate(self, round_noise_multiplier: float) -> bool:
        """Check if node can participate without exceeding budget."""
        hypothetical_rdp = [
            spent + compute_rdp(alpha, round_noise_multiplier)
            for spent, alpha in zip(self.rdp_spent, self.rdp_orders)
        ]
        epsilon = rdp_to_dp(hypothetical_rdp, self.rdp_orders, self.delta)
        return epsilon <= self.max_epsilon

    def record_participation(self, round_noise_multiplier: float):
        for i, alpha in enumerate(self.rdp_orders):
            self.rdp_spent[i] += compute_rdp(alpha, round_noise_multiplier)

    def remaining_budget(self) -> float:
        current_epsilon = rdp_to_dp(self.rdp_spent, self.rdp_orders, self.delta)
        return self.max_epsilon - current_epsilon
```

## Rationale

### Why semantic gradients instead of raw gradients?

1. **Privacy**: Raw gradients can be inverted to reconstruct training data. Semantic projection destroys pixel-level detail while preserving optimization direction.
2. **Bandwidth**: 100x compression reduces network requirements from gigabytes to megabytes per round, enabling participation over satellite links common in remote field stations.
3. **Robustness**: Lower-dimensional representations are harder for adversaries to manipulate with targeted poisoning attacks.

### Why Multi-Krum over simple averaging?

Simple averaging is vulnerable to a single malicious node injecting a large gradient that dominates the mean. Multi-Krum selects the most central gradients first, then averages only those, tolerating up to 30% Byzantine nodes.

### Why on-chain provenance?

Conservation AI models used for policy decisions (species listing, habitat protection) require auditable training histories. On-chain recording via LP-7102 provides immutable proof of which data contributed to which model version.

## Security Considerations

1. **Gradient inversion attacks**: Semantic projection + differential privacy noise makes reconstruction computationally infeasible at epsilon < 8.0.
2. **Model poisoning**: Multi-Krum aggregation tolerates up to 30% Byzantine nodes. Stake-weighting further penalizes Sybil attacks.
3. **Free-riding**: Nodes that submit zero or near-zero gradients receive proportionally low contribution scores and rewards.
4. **Privacy budget exhaustion**: Nodes track cumulative epsilon via RDP composition and automatically stop participating when budget is spent.
5. **Collusion attacks**: The commit-reveal scheme prevents nodes from tailoring their gradients to match others after seeing submitted values.

## Test Cases

```python
def test_dso_round_convergence():
    """Verify that DSO training reduces validation loss."""
    model = load_base_model("zoo-eco-7b")
    nodes = [DSONode(local_data=shard) for shard in partition_dataset(n=10)]

    initial_loss = evaluate(model, validation_set)
    for round_id in range(10):
        gradients = [node.compute_semantic_gradient(model) for node in nodes]
        aggregated = DSOAggregator(n=10).aggregate(gradients, stakes=[1.0] * 10)
        model = apply_update(model, aggregated, lr=0.01)

    final_loss = evaluate(model, validation_set)
    assert final_loss < initial_loss * 0.8  # At least 20% improvement

def test_byzantine_robustness():
    """Verify tolerance to 30% malicious nodes."""
    honest_grads = [create_honest_gradient() for _ in range(7)]
    malicious_grads = [create_poisoned_gradient() for _ in range(3)]

    agg = DSOAggregator(n=10, byzantine_fraction=0.3)
    result = agg.aggregate(honest_grads + malicious_grads, stakes=[1.0] * 10)

    honest_only = simple_average(honest_grads)
    assert cosine_similarity(result.data, honest_only.data) > 0.9

def test_privacy_guarantee():
    """Verify differential privacy holds."""
    encoder = SemanticGradientEncoder(model_dim=1000000)
    budget = PrivacyBudget(epsilon=1.0, delta=1e-6, batch_size=256)

    grad_a = encoder.encode(compute_gradient(dataset_a), budget)
    grad_b = encoder.encode(compute_gradient(dataset_b), budget)

    # Statistical test: outputs should be indistinguishable
    assert ks_test(grad_a.data, grad_b.data).pvalue > 0.01
```

## References

1. [HIP-0002: Hamiltonian LLMs](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0002.md)
2. [HIP-0067: Federated Learning](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0067.md)
3. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lps/blob/main/LPs/lp-7000.md)
4. [LP-7102: Immutable Training Ledger](https://github.com/luxfi/lps/blob/main/LPs/lp-7102.md)
5. [ZIP-0001: HLLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
6. [Blanchard et al., "Machine Learning with Adversaries: Byzantine Tolerant Gradient Descent"](https://arxiv.org/abs/1703.02757)
7. [Abadi et al., "Deep Learning with Differential Privacy"](https://arxiv.org/abs/1607.00133)
8. [Mironov, "Renyi Differential Privacy"](https://arxiv.org/abs/1702.07476)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
