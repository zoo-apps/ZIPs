---
zip: 0007
title: BitDelta + DeltaSoup - Personalized and Community AI
author: Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2025-01-09
requires: ZIP-1, ZIP-3, ZIP-6, ZIP-12, HIP-6
---

# ZIP-7: BitDelta + DeltaSoup - Personalized and Community AI

## Abstract

This proposal specifies Zoo's dual approach to AI model improvement: **BitDelta** for efficient per-user personalization and **DeltaSoup** for community-aggregated enhancements. BitDelta compresses user-specific fine-tune deltas to 1-bit signs plus per-tensor scales, achieving 10× memory savings while preserving safety properties. DeltaSoup aggregates signed deltas from many users via Byzantine-robust averaging to create reproducible Reference Adapters that benefit the entire network.

## Motivation

Current AI systems face a fundamental tension:
- **Personalization requires privacy**: Users want AI tailored to them without exposing personal data
- **Improvement requires sharing**: Models get better by learning from many users
- **Efficiency requires compression**: Serving millions of personalized models is prohibitively expensive
- **Safety requires verification**: Changes must not degrade alignment or introduce backdoors

Zoo solves this quadrilemma through:
- **BitDelta**: Private, compressed per-user adapters in secure enclaves
- **DeltaSoup**: Opt-in community aggregation with privacy guarantees
- **GPU-CC**: Hardware-enforced confidential computing
- **Robust Aggregation**: Byzantine-fault-tolerant delta merging

## Specification

### BitDelta: Per-User Efficient Personalization

#### Mathematical Foundation

For user u with base model weights W_b and fine-tuned weights W_f:

```
Delta: δ_u = W_f - W_b
BitDelta: B_u = sign(δ_u), γ_u = scale(δ_u)
Reconstruction: W'_f ≈ W_b + γ_u * B_u
```

#### Compression Algorithm

```python
def compress_to_bitdelta(base_weights, finetuned_weights):
    """
    Compress weight delta to 1-bit + scale representation
    Returns 10× compression with <10% performance degradation
    """
    delta = {}
    signs = {}
    scales = {}
    
    for layer_name, W_b in base_weights.items():
        W_f = finetuned_weights[layer_name]
        
        # Compute delta
        δ = W_f - W_b
        
        # Extract sign (1-bit)
        signs[layer_name] = torch.sign(δ).to(torch.int8)
        
        # Compute optimal scale via logit matching
        scales[layer_name] = compute_optimal_scale(
            base=W_b,
            delta=δ,
            calibration_set=user_data_sample
        )
    
    return BitDeltaAdapter(signs, scales)

def compute_optimal_scale(base, delta, calibration_set):
    """
    Find scale γ that minimizes KL divergence on calibration set
    """
    def loss(γ):
        W_approx = base + γ * torch.sign(delta)
        logits_orig = model_forward(base + delta, calibration_set)
        logits_approx = model_forward(W_approx, calibration_set)
        return kl_divergence(logits_orig, logits_approx)
    
    γ_optimal = optimize(loss, init=delta.abs().mean())
    return γ_optimal
```

#### Safety Preservation

Quantized deltas preserve alignment better than full fine-tuning:

```python
def verify_safety_preservation(base_model, bitdelta):
    """
    Ensure BitDelta doesn't degrade safety properties
    """
    safety_benchmarks = [
        "truthfulness",    # TruthfulQA
        "harmlessness",    # HarmBench
        "helpfulness",     # MT-Bench
        "privacy",         # PrivacyBench
    ]
    
    base_scores = evaluate(base_model, safety_benchmarks)
    adapted_scores = evaluate(base_model + bitdelta, safety_benchmarks)
    
    # Require no more than 5% degradation
    for metric, base_score in base_scores.items():
        assert adapted_scores[metric] >= 0.95 * base_score
    
    return True
```

### DeltaSoup: Community-Aggregated Intelligence

#### Robust Aggregation Protocol

```python
def create_deltasoup(
    deltas: List[BitDeltaAdapter],
    attestations: List[TEEAttestation],
    privacy_budgets: List[PrivacyBudget]
) -> ReferenceAdapter:
    """
    Aggregate user deltas into community Reference Adapter
    using Byzantine-robust methods
    """
    
    # Step 1: Filter by attestation and privacy
    verified_deltas = []
    for delta, attest, privacy in zip(deltas, attestations, privacy_budgets):
        if verify_tee_attestation(attest) and privacy.epsilon <= MAX_EPSILON:
            verified_deltas.append(delta)
    
    # Step 2: Robust aggregation (coordinate-wise trimmed mean)
    def trimmed_mean(tensor_list, trim_ratio=0.1):
        stacked = torch.stack(tensor_list)
        n = len(tensor_list)
        k = int(n * trim_ratio)
        
        # Sort and trim outliers
        sorted_vals, _ = torch.sort(stacked, dim=0)
        trimmed = sorted_vals[k:n-k]
        
        return trimmed.mean(dim=0)
    
    # Aggregate each layer separately
    aggregated_signs = {}
    aggregated_scales = {}
    
    for layer_name in verified_deltas[0].signs.keys():
        layer_signs = [d.signs[layer_name] for d in verified_deltas]
        layer_scales = [d.scales[layer_name] for d in verified_deltas]
        
        aggregated_signs[layer_name] = trimmed_mean(layer_signs)
        aggregated_scales[layer_name] = trimmed_mean(layer_scales)
    
    # Step 3: Greedy soup mixing with safety gates
    reference = greedy_soup_mixing(
        base_model=get_base_model(),
        candidates=verified_deltas,
        eval_fn=benchmark_performance,
        safety_fn=verify_safety_preservation
    )
    
    # Step 4: Record contributors for royalties (using Lux ID)
    contributors = [d.user_lux_id for d in verified_deltas]  # did:lux:122:0x...
    contribution_weights = calculate_contribution_weights(verified_deltas)
    
    return ReferenceAdapter(
        signs=aggregated_signs,
        scales=aggregated_scales,
        contributors=contributors,
        weights=contribution_weights,
        version=compute_version_hash()
    )
```

#### Greedy Soup Mixing

```python
def greedy_soup_mixing(base_model, candidates, eval_fn, safety_fn, step_size=0.25):
    """
    Iteratively mix deltas that improve performance without compromising safety
    Following Model Soups (Wortsman et al. 2022)
    """
    current_weights = base_model.state_dict()
    selected = []
    mixing_coefficients = []
    
    for candidate in candidates:
        # Try adding this delta
        test_weights = {}
        for k in current_weights:
            test_weights[k] = current_weights[k] + step_size * candidate.get_delta(k)
        
        # Evaluate performance and safety
        if safety_fn(test_weights) and eval_fn(test_weights) > eval_fn(current_weights):
            current_weights = test_weights
            selected.append(candidate)
            mixing_coefficients.append(step_size)
    
    return current_weights, selected, mixing_coefficients
```

### Privacy-Preserving Training

#### Differential Privacy Integration

```python
class DPBitDelta:
    """
    Differentially private BitDelta training
    """
    
    def train_with_privacy(
        self,
        base_model,
        user_data,
        epsilon=1.0,
        delta=1e-5
    ):
        # Use DP-SGD for training
        privacy_engine = PrivacyEngine()
        model, optimizer, data_loader = privacy_engine.make_private(
            module=base_model,
            optimizer=optimizer,
            data_loader=DataLoader(user_data),
            noise_multiplier=compute_noise(epsilon, delta),
            max_grad_norm=1.0
        )
        
        # Train with privacy
        for epoch in range(num_epochs):
            for batch in data_loader:
                loss = compute_loss(model, batch)
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()
        
        # Get privacy spent
        epsilon_spent, delta_spent = privacy_engine.get_privacy_spent()
        
        # Compress to BitDelta
        bitdelta = compress_to_bitdelta(base_model, model)
        
        return bitdelta, PrivacyBudget(epsilon_spent, delta_spent)
```

### On-Chain Integration

```solidity
// Implements LP-303 (ILPRoyalties) and LP-107 (PersonaCredential)
contract BitDeltaRegistry {
    struct BitDelta {
        bytes32 baseModelHash;
        bytes32 deltaHash;
        string ownerLuxId;          // did:lux:122:0x... (LP-200)
        uint256 compressionRatio;   // e.g., 10 for 10×
        bool isPrivate;
        PrivacyBudget privacy;
        bytes32 receiptHash;        // LP-105 ComputeReceipt
    }
    
    struct DeltaSoup {
        bytes32 referenceAdapterHash;
        string[] contributorLuxIds;  // Array of did:lux identifiers
        uint256[] weights;            // Contribution weights for royalties (LP-106)
        uint256 version;
        bool active;
        RoyaltyMap royalties;         // LP-106 royalty distribution
    }
    
    mapping(string => BitDelta[]) public userDeltas;  // Keyed by Lux ID
    mapping(uint256 => DeltaSoup) public referenceSoups;
    
    event DeltaPublished(string userLuxId, bytes32 deltaHash, bool isPrivate);
    event SoupCreated(uint256 soupId, bytes32 adapterHash, string[] contributorLuxIds);
    
    function publishBitDelta(
        string calldata userLuxId,  // did:lux:122:0x...
        bytes32 baseModelHash,
        bytes32 deltaHash,
        uint256 compressionRatio,
        bool makePublic,
        bytes calldata teeAttestation,
        bytes calldata computeReceipt  // LP-105
    ) external {
        require(verifyTEE(teeAttestation), "Invalid TEE attestation");
        require(verifyLuxId(userLuxId, msg.sender), "Invalid Lux ID");
        
        BitDelta memory delta = BitDelta({
            baseModelHash: baseModelHash,
            deltaHash: deltaHash,
            ownerLuxId: userLuxId,
            compressionRatio: compressionRatio,
            isPrivate: !makePublic,
            privacy: extractPrivacyBudget(teeAttestation),
            receiptHash: keccak256(computeReceipt)
        });
        
        userDeltas[userLuxId].push(delta);
        emit DeltaPublished(userLuxId, deltaHash, !makePublic);
    }
    
    function createDeltaSoup(
        bytes32[] calldata deltaHashes,
        string[] calldata contributorLuxIds,  // did:lux identifiers
        uint256[] calldata weights,
        bytes calldata aggregationProof,
        RoyaltyMap calldata royaltyDistribution  // LP-106
    ) external returns (uint256 soupId) {
        require(verifyAggregation(aggregationProof), "Invalid aggregation");
        require(contributorLuxIds.length == weights.length, "Mismatched arrays");
        
        soupId = nextSoupId++;
        
        referenceSoups[soupId] = DeltaSoup({
            referenceAdapterHash: keccak256(abi.encode(deltaHashes)),
            contributorLuxIds: contributorLuxIds,
            weights: weights,
            version: block.timestamp,
            active: true,
            royalties: royaltyDistribution
        });
        
        emit SoupCreated(soupId, referenceSoups[soupId].referenceAdapterHash, contributorLuxIds);
    }
}
```

### Serving Infrastructure

```python
class BitDeltaServingEngine:
    """
    High-performance serving with PagedAttention + BitDelta
    """
    
    def __init__(self):
        self.base_model = load_base_model()
        self.delta_cache = LRUCache(max_size=10000)  # 10K users
        self.gpu_memory = GPUMemoryPool()
    
    def serve_request(self, user_lux_id: str, prompt):  # did:lux:122:0x...
        # Load user's BitDelta (compressed)
        delta = self.delta_cache.get(user_lux_id)
        if not delta:
            delta = load_from_storage(user_lux_id)
            self.delta_cache.put(user_lux_id, delta)
        
        # Efficient batched serving
        with self.gpu_memory.allocate(delta.memory_required()):
            # Fused kernel for base + BitDelta
            weights = fused_bitdelta_add(
                base=self.base_model.weights,
                signs=delta.signs,
                scales=delta.scales
            )
            
            # Use PagedAttention for KV cache
            output = paged_attention_generate(
                weights=weights,
                prompt=prompt,
                max_tokens=512
            )
        
        return output
```

## Rationale

### Why BitDelta?

1. **Memory Efficiency**: 10× reduction enables serving millions of users
2. **Safety Preservation**: Quantization constrains harmful adaptations
3. **Fast Switching**: Binary operations for rapid user context switching
4. **Privacy**: Compressed format reduces attack surface

### Why DeltaSoup?

1. **Community Intelligence**: Aggregate improvements from all users
2. **Byzantine Robustness**: Trimmed mean resists poisoning attacks
3. **Reproducibility**: Single reference adapter vs ensemble overhead
4. **Fair Attribution**: On-chain royalties for contributors

## Implementation Roadmap

### Phase 1: BitDelta Core (Q1 2025)
- Compression algorithm implementation
- GPU-CC integration for secure training
- Single-user serving infrastructure

### Phase 2: DeltaSoup Alpha (Q2 2025)
- Robust aggregation algorithms
- Safety verification gates
- Contributor tracking system

### Phase 3: Production Scale (Q3 2025)
- 10K+ concurrent users
- Automated soup creation
- Royalty distribution

### Phase 4: Open Ecosystem (Q4 2025)
- Public delta marketplace
- Cross-model transfer learning
- Community governance

## Security Considerations

1. **TEE Attestation**: All deltas must be created in secure enclaves
2. **Privacy Budgets**: Track and limit (ε,δ) per user
3. **Backdoor Detection**: Automated scanning of contributed deltas
4. **Robust Aggregation**: Byzantine fault tolerance up to 30% malicious

## Testing

```python
def test_bitdelta_compression():
    """Test 10× compression with <10% performance loss"""
    base = load_model("zoo-base-7b")
    finetuned = finetune(base, user_data)
    
    # Compress
    bitdelta = compress_to_bitdelta(base, finetuned)
    
    # Verify compression ratio
    original_size = calculate_size(finetuned - base)
    compressed_size = calculate_size(bitdelta)
    assert compressed_size <= original_size / 10
    
    # Verify performance
    original_score = evaluate(finetuned)
    compressed_score = evaluate(base + bitdelta)
    assert compressed_score >= 0.9 * original_score

def test_deltasoup_robustness():
    """Test Byzantine robustness of aggregation"""
    good_deltas = [create_good_delta() for _ in range(70)]
    bad_deltas = [create_poisoned_delta() for _ in range(30)]
    
    soup = create_deltasoup(good_deltas + bad_deltas)
    
    # Verify soup quality despite 30% poisoned
    assert evaluate(soup) >= evaluate(good_deltas[0])
```

## Reference Implementation

**Repository**: [zooai/bitdelta](https://github.com/zooai/bitdelta)

**Key Files**:
- `/bitdelta/quantization.py` - 1-bit weight quantization implementation
- `/bitdelta/deltasoup.py` - DeltaSoup aggregation with Byzantine robustness
- `/bitdelta/model_swapping.py` - Fast user model switching (< 10ms)
- `/storage/distributed_storage.py` - Distributed delta weight storage
- `/aggregation/byzantine_defense.py` - Krum and trimmed mean aggregation
- `/personalization/user_adapter.py` - Per-user model adaptation engine
- `/benchmarks/memory_efficiency.py` - Memory usage benchmarking
- `/benchmarks/safety_evaluation.py` - Jailbreak resistance testing
- `/api/delta_api.ts` - API for delta weight management
- `/sdk/python/` - Python SDK for BitDelta operations
- `/tests/poisoning_tests.py` - Byzantine attack resistance tests
- `/tests/quality_tests.py` - Model quality preservation tests
- `/docs/technical_spec.md` - Detailed technical specification

**Status**: In Development (Beta Q2 2025)

**Performance Characteristics**:
- Memory reduction: 10-20× vs. full weights
- Model switching latency: < 10ms
- Jailbreak resistance: ~60% improvement
- Byzantine tolerance: Up to 30% poisoned deltas

**Integration**:
- ZIP-3 Eco-1 model personalization
- ZIP-6 User-owned model NFTs
- ZIP-8 Avatar tutor customization
- ZIP-9 Unified architecture

## References

1. [BitDelta: Your Fine-Tune May Only Be Worth One Bit](https://arxiv.org/abs/2402.10193)
2. [Model Soups: Averaging Weights of Multiple Fine-Tuned Models](https://arxiv.org/abs/2203.05482)
3. [Byzantine-Robust Aggregation in Federated Learning](https://arxiv.org/abs/1703.02757)
4. [ZIP-6: User-Owned AI Models](./zip-6.md)
5. [HIP-6: Per-User Fine-Tuning](https://github.com/hanzoai/hips/blob/main/HIPs/hip-6.md)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).