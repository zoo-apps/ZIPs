---
zip: 0404
title: "zLLM Architecture Specification"
description: "Zoo Large Language Model (zLLM) specification for training-free ecosystem-specific AI via BitDelta and DSO integration"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
originated: 2021-10
traces-from: "Whitepaper section 08 (AI Assistant)"
follow-on: [zoo-hamiltonian-llm, hllm-training-free-grpo]
created: 2025-01-15
tags: [zllm, language-model, bitdelta, fine-tuning, conservation-nlp]
requires: [0001, 0007, 0009, 0400]
references: HIP-0002, HIP-0039, HIP-0043, LP-7106
repository: https://github.com/zooai/zllm
license: CC BY 4.0
---

# ZIP-404: zLLM Architecture Specification

## Abstract

This proposal specifies the Zoo Large Language Model (zLLM) family -- ecosystem-specific language models built via training-free adaptation of frontier base models. Rather than training from scratch, zLLM uses a three-layer architecture: (1) a frozen frontier base model accessed via the LLM Gateway (LP-7106), (2) domain-specific BitDelta adapters (ZIP-0007/0009) for conservation, ecology, and biodiversity expertise, and (3) DSO-trained (ZIP-0400) community adapters that continuously improve from field data. This approach delivers domain expertise competitive with purpose-trained models at a fraction of the compute cost, while enabling every conservation organization to contribute to model improvement without centralizing data.

## Motivation

Conservation and ecology require AI models with deep domain knowledge:

1. **Taxonomic expertise**: Identifying 8.7 million estimated species requires models that understand taxonomic hierarchies, morphological features, and biogeographic distributions.
2. **Ecological reasoning**: Models must understand food webs, habitat requirements, migration patterns, and interspecies dependencies to provide useful conservation recommendations.
3. **Policy literacy**: Conservation decisions involve CITES, ESA, IUCN Red List criteria, CBD targets, and national legislation. Models must reason about regulatory frameworks.
4. **Multilingual field support**: Conservation workers operate in 190+ countries. Models must support local languages for field use.

Training a 70B+ parameter model from scratch for conservation would cost $10M+ and require data that no single organization possesses. The zLLM approach achieves equivalent domain expertise by adapting existing frontier models via efficient fine-tuning layers.

### Design Principles

- **Training-free base**: The base model is never re-trained; it is accessed as a service via the LLM Gateway.
- **Composable adapters**: Multiple BitDelta adapters can be stacked for different specializations (taxonomy + policy + regional language).
- **Continuously improving**: DSO enables the community to improve adapters without accessing the base model weights.
- **Verifiable expertise**: Every adapter carries provenance on who trained it, on what data categories, and with what validation scores.

## Specification

### 1. zLLM Architecture Stack

```
+---------------------------------------------------------------+
|                      zLLM Inference Stack                      |
+---------------------------------------------------------------+
|  Layer 3: User BitDelta (ZIP-0009)                            |
|  - Per-user personalization (optional)                         |
|  - Learning style, preferred species groups, region focus      |
+---------------------------------------------------------------+
|  Layer 2: Domain BitDelta Adapters (this ZIP)                  |
|  - Taxonomy adapter: species ID, morphology, phylogenetics     |
|  - Ecology adapter: food webs, habitats, population dynamics   |
|  - Policy adapter: CITES, IUCN, national regulations           |
|  - Regional adapters: Amazon, Serengeti, Great Barrier Reef    |
+---------------------------------------------------------------+
|  Layer 1: Frozen Base Model (via LLM Gateway / LP-7106)        |
|  - Frontier model accessed as API service                      |
|  - No weight modification; base reasoning preserved            |
+---------------------------------------------------------------+
```

### 2. Domain Adapter Specifications

```python
class ZLLMAdapterConfig:
    """
    Configuration for each domain-specific BitDelta adapter.
    """

    # Taxonomy Adapter
    TAXONOMY = AdapterSpec(
        name="zllm-taxonomy-v1",
        description="Species identification, taxonomic classification, morphological features",
        training_data_categories=[
            "species_descriptions",     # GBIF, IUCN Red List species accounts
            "taxonomic_keys",           # Dichotomous keys and field guides
            "morphological_features",   # Trait databases (TRY, AnimalTraits)
            "phylogenetic_trees",       # Tree of Life, Open Tree of Life
        ],
        eval_benchmarks=[
            "species_qa_10k",           # 10K species identification questions
            "taxonomic_hierarchy_test", # Correct placement in taxonomy
            "morphology_description",   # Describe species from traits
        ],
        min_benchmark_score=0.85,       # 85% accuracy required for release
        update_frequency="monthly",
        size_budget_mb=700,             # ~700MB BitDelta adapter
    )

    # Ecology Adapter
    ECOLOGY = AdapterSpec(
        name="zllm-ecology-v1",
        description="Ecological reasoning, food webs, habitat analysis, population dynamics",
        training_data_categories=[
            "ecological_literature",    # Peer-reviewed ecology papers
            "habitat_descriptions",     # WWF ecoregions, EPA habitat data
            "population_surveys",       # Census data, mark-recapture studies
            "food_web_databases",       # GloBI, Web of Life
            "climate_projections",      # IPCC scenarios, species range shifts
        ],
        eval_benchmarks=[
            "ecology_reasoning_1k",     # 1K ecological reasoning problems
            "habitat_suitability",      # Predict habitat suitability from features
            "population_viability",     # Population viability analysis questions
        ],
        min_benchmark_score=0.80,
        update_frequency="monthly",
        size_budget_mb=700,
    )

    # Policy Adapter
    POLICY = AdapterSpec(
        name="zllm-policy-v1",
        description="Conservation law, CITES appendices, IUCN criteria, national regulations",
        training_data_categories=[
            "cites_appendices",         # CITES species listings and trade rules
            "iucn_criteria",            # Red List assessment criteria and examples
            "national_legislation",     # ESA (US), Wildlife Act (India), etc.
            "cbd_targets",              # Convention on Biological Diversity
            "case_law",                 # Wildlife crime prosecution records
        ],
        eval_benchmarks=[
            "cites_classification_1k",  # Classify species into CITES appendices
            "iucn_assessment_500",      # Apply Red List criteria to species data
            "legal_reasoning_200",      # Conservation law reasoning
        ],
        min_benchmark_score=0.90,       # High bar for legal/policy accuracy
        update_frequency="quarterly",
        size_budget_mb=500,
    )
```

### 3. Adapter Training Pipeline

```python
class ZLLMAdapterTrainer:
    """
    Train domain-specific BitDelta adapters for zLLM.
    Uses supervised fine-tuning on curated conservation datasets
    followed by DSO-based community improvement.
    """

    def __init__(self, base_model_gateway: str, adapter_config: AdapterSpec):
        self.gateway = LLMGateway(base_model_gateway)  # LP-7106
        self.config = adapter_config
        self.dso_node = DSONode()  # ZIP-0400

    def train_initial_adapter(
        self,
        training_dataset: ConservationDataset,
    ) -> BitDeltaAdapter:
        """
        Phase 1: Supervised fine-tuning to create initial domain adapter.
        Uses knowledge distillation from gateway base model.
        """
        # Step 1: Generate base model responses for calibration
        calibration_pairs = []
        for sample in training_dataset.calibration_split():
            base_response = self.gateway.generate(sample.prompt)
            calibration_pairs.append((sample.prompt, base_response))

        # Step 2: Fine-tune a local proxy model on domain data
        proxy_model = load_proxy_model(self.config.proxy_model_id)  # Smaller local model
        proxy_model = fine_tune(
            proxy_model,
            dataset=training_dataset,
            epochs=3,
            lr=2e-5,
            loss="cross_entropy + kl_divergence_from_base",
        )

        # Step 3: Compress fine-tuned delta to BitDelta
        base_weights = load_proxy_model(self.config.proxy_model_id).state_dict()
        adapter = compress_to_bitdelta(base_weights, proxy_model.state_dict())

        # Step 4: Validate adapter meets quality threshold
        scores = self.evaluate_adapter(adapter)
        for benchmark, score in scores.items():
            if score < self.config.min_benchmark_score:
                raise AdapterQualityError(
                    f"Adapter failed {benchmark}: {score:.3f} < {self.config.min_benchmark_score}"
                )

        return adapter

    def continuous_improvement(
        self,
        current_adapter: BitDeltaAdapter,
        new_field_data: list[ConservationSample],
    ) -> BitDeltaAdapter:
        """
        Phase 2: Continuously improve adapter via DSO protocol.
        Field data from conservation sites is used for local training,
        and semantic gradients are shared for global improvement.
        """
        # Local training on new field data
        gradient = self.dso_node.compute_semantic_gradient(
            model=self._reconstruct_model(current_adapter),
            data=new_field_data,
            privacy_budget=PrivacyBudget(epsilon=1.0, delta=1e-6),
        )

        # Submit to DSO for aggregation
        self.dso_node.submit_to_round(gradient)

        # After round completion, apply aggregated update
        aggregated = self.dso_node.get_round_result()
        updated_adapter = apply_dso_update(current_adapter, aggregated)

        return updated_adapter

    def evaluate_adapter(self, adapter: BitDeltaAdapter) -> dict[str, float]:
        """Evaluate adapter on all configured benchmarks."""
        model = self._reconstruct_model(adapter)
        scores = {}
        for benchmark_name in self.config.eval_benchmarks:
            benchmark = load_benchmark(benchmark_name)
            scores[benchmark_name] = benchmark.evaluate(model)
        return scores
```

### 4. Adapter Composition (Stacking)

```python
class AdapterComposer:
    """
    Compose multiple BitDelta adapters for multi-domain expertise.
    Example: taxonomy + ecology + Amazon regional = Amazon species expert.
    """

    def compose(
        self,
        base_model: nn.Module,
        adapters: list[BitDeltaAdapter],
        weights: list[float] = None,
    ) -> nn.Module:
        """
        Apply multiple adapters with optional per-adapter weighting.
        Default: equal weighting across all adapters.
        """
        if weights is None:
            weights = [1.0 / len(adapters)] * len(adapters)

        assert len(adapters) == len(weights)
        assert abs(sum(weights) - 1.0) < 1e-6

        composed_state = base_model.state_dict()

        for adapter, weight in zip(adapters, weights):
            for layer_name in adapter.signs:
                delta = adapter.scales[layer_name] * adapter.signs[layer_name]
                composed_state[layer_name] = (
                    composed_state[layer_name] + weight * delta
                )

        model = copy.deepcopy(base_model)
        model.load_state_dict(composed_state)
        return model

    def recommend_composition(
        self,
        user_query: str,
        available_adapters: list[BitDeltaAdapter],
    ) -> list[tuple[BitDeltaAdapter, float]]:
        """
        Automatically select and weight adapters based on query content.
        """
        query_embedding = embed_query(user_query)

        adapter_scores = []
        for adapter in available_adapters:
            domain_embedding = embed_text(adapter.config.description)
            similarity = cosine_similarity(query_embedding, domain_embedding)
            adapter_scores.append((adapter, similarity))

        # Select top-3 adapters and normalize weights
        adapter_scores.sort(key=lambda x: -x[1])
        top_3 = adapter_scores[:3]
        total = sum(s for _, s in top_3)
        return [(a, s / total) for a, s in top_3]
```

### 5. Inference API

```python
class ZLLMInferenceAPI:
    """
    Unified inference API for zLLM with adapter selection.
    Compatible with OpenAI Chat Completions format.
    """

    def __init__(self, gateway_url: str):
        self.gateway = LLMGateway(gateway_url)
        self.adapter_registry = AdapterRegistry()
        self.composer = AdapterComposer()

    def chat_completion(
        self,
        messages: list[dict],
        adapters: list[str] = None,           # e.g., ["taxonomy", "ecology"]
        adapter_weights: list[float] = None,
        user_id: str = None,                   # For per-user BitDelta
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatCompletion:
        """
        Generate response with domain-specific expertise.
        """
        # Load requested adapters
        loaded_adapters = []
        if adapters:
            for adapter_name in adapters:
                adapter = self.adapter_registry.load(adapter_name)
                loaded_adapters.append(adapter)

        # Add user adapter if available
        if user_id:
            user_adapter = self.adapter_registry.load_user_adapter(user_id)
            if user_adapter:
                loaded_adapters.append(user_adapter)
                if adapter_weights:
                    adapter_weights.append(0.1)  # Low weight for user personalization

        # Compose adapters into system prompt augmentation
        domain_context = self._generate_domain_context(loaded_adapters, messages)

        # Augment messages with domain context
        augmented_messages = [
            {"role": "system", "content": domain_context},
            *messages,
        ]

        # Call base model via gateway
        response = self.gateway.chat_completion(
            messages=augmented_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # Post-process: verify factual claims against domain knowledge
        verified_response = self._verify_domain_claims(
            response, loaded_adapters
        )

        return verified_response
```

### 6. Adapter Registry and Versioning

```solidity
contract ZLLMAdapterRegistry {
    struct Adapter {
        string name;
        uint256 version;
        bytes32 weightsHash;       // IPFS CID of BitDelta weights
        bytes32 evalResultsHash;   // Benchmark evaluation results
        address[] trainers;        // Organizations that contributed training
        uint256 createdAt;
        bool active;
    }

    mapping(bytes32 => Adapter) public adapters;  // keccak(name, version)
    mapping(string => uint256) public latestVersion;

    event AdapterPublished(string name, uint256 version, bytes32 weightsHash);

    function publishAdapter(
        string calldata name,
        bytes32 weightsHash,
        bytes32 evalResultsHash,
        address[] calldata trainers
    ) external onlyGovernance {
        uint256 version = latestVersion[name] + 1;
        bytes32 key = keccak256(abi.encode(name, version));

        adapters[key] = Adapter({
            name: name,
            version: version,
            weightsHash: weightsHash,
            evalResultsHash: evalResultsHash,
            trainers: trainers,
            createdAt: block.timestamp,
            active: true
        });

        latestVersion[name] = version;
        emit AdapterPublished(name, version, weightsHash);
    }
}
```

## Rationale

### Why training-free base model access?

Training a base model from scratch is prohibitively expensive ($10M+) and redundant given that frontier models already possess strong general reasoning. By accessing base models as a service via LP-7106, Zoo avoids this cost entirely and benefits from base model improvements automatically.

### Why BitDelta adapters instead of LoRA or full fine-tuning?

BitDelta provides 10x compression over LoRA while preserving 90%+ task performance (ZIP-0007). This matters at scale: serving 50 domain adapters at LoRA size would require 50x the memory, whereas 50 BitDelta adapters fit in the same footprint as 5 LoRA adapters.

### Why composable stacking?

Conservation queries rarely fall into a single domain. "What CITES restrictions apply to trafficking of Amazon parrots?" requires taxonomy (parrot species identification), policy (CITES appendix classification), and regional (Amazon biogeography) knowledge simultaneously. Composable stacking provides this without training a single monolithic adapter.

### Why DSO for continuous improvement?

Conservation knowledge is continuously evolving: species are reclassified, ranges shift with climate change, and new policy instruments are adopted. DSO enables distributed organizations to continuously improve adapters using their local data without centralizing sensitive information.

## Security Considerations

1. **Adapter poisoning**: All adapters must pass benchmark evaluations before publication to the registry. On-chain governance controls who can publish.
2. **Base model extraction**: BitDelta adapters never contain base model weights; they only contain compressed deltas. An attacker who obtains an adapter cannot reconstruct the base model.
3. **Hallucination in high-stakes domains**: The policy adapter has an elevated quality threshold (90%) and includes a verification step that cross-references generated claims against structured databases (CITES appendices, IUCN Red List).
4. **Adapter compatibility**: Version pinning in the registry ensures that adapters trained against a specific base model version are not applied to incompatible versions.
5. **Supply chain integrity**: Adapter weights are content-addressed (IPFS CID) and hash-verified on-chain. Any tampering is detectable.

## Test Cases

```python
def test_taxonomy_adapter_accuracy():
    """Verify taxonomy adapter meets 85% benchmark threshold."""
    adapter = load_adapter("zllm-taxonomy-v1")
    model = reconstruct_model(base_model, adapter)

    benchmark = load_benchmark("species_qa_10k")
    score = benchmark.evaluate(model)
    assert score >= 0.85

def test_adapter_composition():
    """Verify composed adapters improve over individual adapters."""
    taxonomy = load_adapter("zllm-taxonomy-v1")
    ecology = load_adapter("zllm-ecology-v1")

    composed = AdapterComposer().compose(base_model, [taxonomy, ecology], [0.5, 0.5])

    # Test on cross-domain query
    query = "How does deforestation affect jaguar population viability?"
    composed_score = evaluate_response_quality(composed, query)
    taxonomy_only = evaluate_response_quality(
        reconstruct_model(base_model, taxonomy), query
    )
    assert composed_score > taxonomy_only

def test_dso_adapter_improvement():
    """Verify DSO round improves adapter quality."""
    adapter_v1 = load_adapter("zllm-taxonomy-v1")
    score_v1 = evaluate_on_benchmark(adapter_v1, "species_qa_10k")

    # Simulate DSO round with field data
    adapter_v2 = dso_improve(adapter_v1, field_data_samples)
    score_v2 = evaluate_on_benchmark(adapter_v2, "species_qa_10k")

    assert score_v2 >= score_v1
```

## References

1. [HIP-0002: Hamiltonian LLMs](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0002.md)
2. [HIP-0039: Zen Model Architecture](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0039.md)
3. [HIP-0043: LLM Inference](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0043.md)
4. [LP-7106: LLM Gateway Integration](https://github.com/luxfi/lps/blob/main/LPs/lp-7106.md)
5. [ZIP-0001: HLLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
6. [ZIP-0007: BitDelta + DeltaSoup](./zip-0007-bitdelta-deltasoup-personalized-and-community-ai.md)
7. [ZIP-0009: Unified BitDelta Architecture](./zip-0009-unified-bitdelta-architecture-for-all-zoo-ai-systems.md)
8. [ZIP-0400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
9. [Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models"](https://arxiv.org/abs/2106.09685)
10. [Liu et al., "BitDelta: Your Fine-Tune May Only Be Worth One Bit"](https://arxiv.org/abs/2402.10193)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
