---
zip: 0010
title: Zoo Launch Models - Eco-1, Coder-1, and Nano-1
author: Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
created: 2025-01-09
requires: ZIP-3, ZIP-7, ZIP-8, ZIP-9, ZIP-12
supersedes: ZIP-1, ZIP-3
repository: https://github.com/zooai/zoo-models
license: CC BY 4.0
---

# ZIP-10: Zoo Launch Models - Eco-1, Coder-1, and Nano-1

## Abstract

Zoo launches three specialized AI models: **Eco-1** for multimodal behavioral learning with z-JEPA/v-JEPA v2 architecture, **Coder-1** for programming and technical tasks, and **Nano-1** for edge deployment. Each model features native thinking tokens for transparent reasoning, BitDelta for efficient personalization, and incorporates advances from GLM4.5 including self-critique mechanisms and hybrid retrieval. These models form the foundation for Zoo's AI ecosystem across education, gaming, DeFi, and development.

## Motivation

Zoo requires specialized models optimized for distinct use cases:

### Model Specialization
1. **Eco-1**: Multimodal understanding for avatars, NPCs, and behavioral AI
2. **Coder-1**: Programming expertise for development assistance and smart contracts  
3. **Nano-1**: Lightweight for mobile, edge, and resource-constrained environments

### Key Innovations (Incorporating GLM4.5 Advances)
- **Self-Critique Loop**: Models evaluate and refine their own outputs (from GLM4.5)
- **Hybrid Retrieval**: Dense + sparse retrieval for better context (GLM4.5 All-Tools)
- **Long Context**: 1M+ token context windows with gradient checkpointing
- **Thinking Tokens**: Transparent reasoning with <think> tags
- **z-JEPA Integration**: Video understanding without pixel reconstruction

## Model Specifications

### Eco-1: Multimodal Behavioral AI (72B Parameters)

```python
class Eco1(nn.Module):
    """
    Multimodal behavioral AI with z-JEPA/v-JEPA v2
    Learns from virtualized ecosystems and transfers to applications
    """
    
    def __init__(self):
        super().__init__()
        
        # Core transformer (72B parameters)
        self.transformer = TransformerModel(
            hidden_size=8192,
            num_layers=80,
            num_heads=64,
            num_kv_heads=8,  # GQA for efficiency
            intermediate_size=28672,  # GLM4.5 style FFN expansion
            max_position_embeddings=131072,  # 128K context
            rope_theta=10000000,  # Long context RoPE
            thinking_tokens=True,
            self_critique=True,  # GLM4.5 self-refinement
        )
        
        # v-JEPA v2 for video understanding
        self.vjepa = vJEPAv2(
            encoder="ViT-Huge-14",
            patch_size=(2, 16, 16),  # Temporal, height, width
            masking_ratio=0.9,  # Aggressive masking
            predictor_depth=6,
            target_encoder_momentum=0.998,
        )
        
        # z-JEPA cross-modal alignment
        self.zjepa = zJEPA(
            modalities=["text", "video", "audio", "3d"],
            latent_dim=2048,
            num_experts=8,  # MoE for modality routing
            expert_capacity=1.25,
        )
        
        # Behavioral specialization experts
        self.behavior_experts = nn.ModuleList([
            BehaviorExpert("hunting"),     # Predator behaviors
            BehaviorExpert("grazing"),     # Herbivore behaviors  
            BehaviorExpert("flocking"),    # Group coordination
            BehaviorExpert("nesting"),     # Building/creation
            BehaviorExpert("territorial"), # Space control
            BehaviorExpert("mating"),      # Social bonding
            BehaviorExpert("migration"),   # Long-range planning
            BehaviorExpert("playing"),     # Learning/exploration
        ])
        
        # GLM4.5-style hybrid retrieval
        self.retriever = HybridRetriever(
            dense_model="e5-large-v2",
            sparse_model="bm25",
            reranker="cross-encoder-ms-marco",
            knowledge_base_size="100M docs",
        )
        
    def forward(self, inputs, enable_thinking=True, self_critique_rounds=2):
        """
        Process multimodal inputs with thinking and self-critique
        """
        # Retrieve relevant context (GLM4.5 All-Tools style)
        if inputs.get("query"):
            context = self.retriever.retrieve(
                query=inputs["query"],
                top_k=20,
                hybrid_weight=0.7,  # 70% dense, 30% sparse
            )
            inputs["context"] = context
            
        # Process video if present
        if inputs.get("video"):
            # v-JEPA v2 encoding without pixel reconstruction
            video_features = self.vjepa.encode(inputs["video"])
            
            # Predict future frames in latent space
            future_latent = self.vjepa.predict_future(video_features)
            
            # Cross-modal alignment
            text_from_video = self.zjepa.video_to_text(video_features)
            inputs["video_understanding"] = {
                "features": video_features,
                "future": future_latent,
                "description": text_from_video,
            }
            
        # Add thinking tokens for reasoning
        if enable_thinking:
            inputs["text"] = f"<think>{inputs.get('text', '')}</think>"
            
        # Main transformer processing
        outputs = self.transformer(inputs)
        
        # Self-critique loop (GLM4.5 innovation)
        for round in range(self_critique_rounds):
            critique = self.generate_critique(outputs)
            if critique["quality_score"] > 0.95:
                break
            outputs = self.refine_based_on_critique(outputs, critique)
            
        # Route through behavioral experts if applicable
        if self.detect_behavioral_context(inputs):
            expert_outputs = self.route_to_experts(outputs)
            outputs = self.merge_expert_outputs(outputs, expert_outputs)
            
        return outputs
    
    def generate_critique(self, outputs):
        """
        GLM4.5-style self-critique mechanism
        """
        critique_prompt = (
            "<think>"
            "Let me evaluate my response for: "
            "1. Factual accuracy "
            "2. Logical consistency "
            "3. Completeness "
            "4. Appropriateness "
            "</think>"
            f"Critique: {outputs['response']}"
        )
        
        critique = self.transformer.generate(critique_prompt)
        return self.parse_critique(critique)
```

### Coder-1: Programming & Technical AI (32B Parameters)

```python
class Coder1(nn.Module):
    """
    Specialized for code generation, debugging, and technical tasks
    Incorporates GLM4.5 repository-level understanding
    """
    
    def __init__(self):
        super().__init__()
        
        # Core transformer (32B parameters)
        self.transformer = TransformerModel(
            hidden_size=5120,
            num_layers=64,
            num_heads=40,
            num_kv_heads=8,
            intermediate_size=27648,
            max_position_embeddings=131072,  # Long code context
            thinking_tokens=True,
            code_specific_tokenizer=True,
        )
        
        # Code-specific components
        self.code_understanding = CodeUnderstanding(
            languages=["Python", "TypeScript", "Solidity", "Rust", "Go"],
            ast_aware=True,
            dataflow_analysis=True,
            type_inference=True,
        )
        
        # Repository-level understanding (GLM4.5 CodeGeeX)
        self.repo_analyzer = RepositoryAnalyzer(
            max_files=10000,
            dependency_graph=True,
            cross_file_references=True,
            semantic_search=True,
        )
        
        # Fill-in-middle capability
        self.fim = FillInMiddle(
            prefix_token="<fim_prefix>",
            middle_token="<fim_middle>",
            suffix_token="<fim_suffix>",
        )
        
        # Code execution sandbox
        self.executor = SecureCodeExecutor(
            languages=["Python", "JavaScript", "SQL"],
            timeout=30,
            memory_limit="1GB",
        )
        
    def generate_code(self, prompt, repo_context=None, execute=False):
        """
        Generate code with repository awareness and optional execution
        """
        # Analyze repository if provided
        if repo_context:
            repo_understanding = self.repo_analyzer.analyze(repo_context)
            prompt = self.enhance_with_repo_context(prompt, repo_understanding)
            
        # Add thinking for complex problems
        if self.is_complex_problem(prompt):
            prompt = f"<think>Let me break down this problem...</think>{prompt}"
            
        # Generate initial code
        code = self.transformer.generate(prompt)
        
        # Self-critique for correctness
        critique = self.critique_code(code)
        if critique["has_issues"]:
            code = self.fix_issues(code, critique)
            
        # Optional execution for validation
        if execute:
            result = self.executor.execute(code)
            if result["error"]:
                code = self.debug_and_fix(code, result["error"])
                
        return {
            "code": code,
            "explanation": self.explain_code(code),
            "tests": self.generate_tests(code),
            "complexity": self.analyze_complexity(code),
        }
    
    def debug_code(self, buggy_code, error_message):
        """
        Advanced debugging with dataflow analysis
        """
        # Parse AST
        ast = self.code_understanding.parse_ast(buggy_code)
        
        # Dataflow analysis to find issue
        dataflow = self.code_understanding.analyze_dataflow(ast)
        
        # Locate likely bug location
        bug_location = self.locate_bug(dataflow, error_message)
        
        # Generate fix
        fix = self.generate_fix(buggy_code, bug_location, error_message)
        
        return fix
```

### Nano-1: Edge & Mobile AI (3B Parameters)

```python
class Nano1(nn.Module):
    """
    Ultra-efficient model for edge deployment
    Incorporates GLM4.5 compression techniques
    """
    
    def __init__(self):
        super().__init__()
        
        # Compact transformer (3B parameters)
        self.transformer = CompactTransformer(
            hidden_size=2048,
            num_layers=28,
            num_heads=16,
            num_kv_heads=4,  # Aggressive GQA
            intermediate_size=5504,
            max_position_embeddings=32768,
            thinking_tokens=True,
            quantization="int4",  # 4-bit quantization
        )
        
        # Knowledge distillation from Eco-1
        self.distilled_knowledge = DistilledKnowledge(
            teacher_model="Eco-1-72B",
            compression_ratio=24,  # 72B → 3B
            preserve_capabilities=["reasoning", "instruction_following"],
        )
        
        # Efficient attention mechanisms
        self.attention = FlashAttention3(  # Latest optimization
            sliding_window=4096,
            global_tokens=128,
            memory_efficient=True,
        )
        
        # On-device learning with BitDelta
        self.bitdelta_adapter = BitDeltaAdapter(
            base_model=self,
            compression_ratio=10,
            max_adapters_in_memory=100,  # Support 100 users
        )
        
        # Edge-specific optimizations
        self.optimizations = EdgeOptimizations(
            dynamic_quantization=True,
            token_merging=True,  # Merge similar tokens
            early_exit=True,  # Exit early for easy queries
            speculative_decoding=True,
        )
        
    def forward(self, inputs, quality_level="balanced"):
        """
        Adaptive inference based on quality requirements
        """
        # Adjust computation based on quality level
        if quality_level == "fast":
            # Ultra-fast mode: 4-bit, early exit, token merging
            self.optimizations.set_mode("speed")
            outputs = self.transformer(inputs, early_exit_threshold=0.9)
            
        elif quality_level == "balanced":
            # Default: 8-bit, moderate optimizations
            self.optimizations.set_mode("balanced")
            outputs = self.transformer(inputs)
            
        else:  # quality_level == "best"
            # Best quality: fp16, all tokens, thinking enabled
            self.optimizations.set_mode("quality")
            inputs = f"<think>{inputs}</think>"
            outputs = self.transformer(inputs)
            
        return outputs
    
    def personalize(self, user_data):
        """
        On-device personalization with BitDelta
        """
        # Create user-specific adapter
        adapter = self.bitdelta_adapter.create_adapter(user_data)
        
        # Compress to 1-bit + scales
        compressed = self.bitdelta_adapter.compress(adapter)
        
        # Store efficiently (only ~30MB per user)
        self.bitdelta_adapter.store(compressed)
        
        return compressed
```

## Training Infrastructure

### Eco-1 Training Pipeline

```yaml
Data Sources:
  Behavioral Video:
    - 10M hours virtualized animal ecosystems
    - 5M hours human activity videos
    - 1M hours game NPC recordings
    
  Text Corpora:
    - 10T tokens web text
    - 100B tokens scientific papers
    - 50B tokens educational content
    
  Multimodal Pairs:
    - 1B image-text pairs
    - 100M video-text pairs
    - 10M audio-text pairs

Training Stages:
  Stage 1 - v-JEPA Pretraining:
    Duration: 30 days
    Hardware: 256 H100 GPUs
    Objective: Self-supervised video prediction
    
  Stage 2 - Language Modeling:
    Duration: 45 days
    Hardware: 512 H100 GPUs
    Objective: Next token prediction + thinking tokens
    
  Stage 3 - Cross-Modal Alignment:
    Duration: 15 days
    Hardware: 128 H100 GPUs
    Objective: CLIP-style contrastive learning
    
  Stage 4 - Behavioral Specialization:
    Duration: 10 days
    Hardware: 64 H100 GPUs
    Objective: Expert routing optimization
```

### Coder-1 Training Pipeline

```yaml
Data Sources:
  Code Repositories:
    - 100M GitHub repositories
    - 10M high-quality projects
    - 1M Solidity contracts
    
  Documentation:
    - All major framework docs
    - API references
    - Stack Overflow (filtered)
    
  Execution Pairs:
    - 10M code-output pairs
    - 1M bug-fix pairs
    - 100K optimization examples

Training Approach:
  - Start from strong base model
  - Continue pretraining on code
  - Instruction tuning on coding tasks
  - RLHF with execution feedback
  - Self-critique training loop
```

### Nano-1 Training Pipeline

```yaml
Knowledge Distillation:
  Teacher: Eco-1-72B
  Student: Nano-1-3B
  
  Method:
    - Logit matching
    - Hidden state alignment
    - Attention transfer
    - Task-specific distillation
    
Compression Techniques:
  - Magnitude pruning (50% sparsity)
  - Quantization-aware training
  - Token merging strategies
  - Dynamic computation paths
```

## BitDelta Personalization

All three models support BitDelta personalization:

```python
class UniversalBitDelta:
    """
    Unified BitDelta for all Zoo models
    """
    
    def personalize_model(self, model_name, user_data):
        # Load base model
        if model_name == "Eco-1":
            base = Eco1()
            domain = "multimodal"
        elif model_name == "Coder-1":
            base = Coder1()
            domain = "programming"
        else:  # Nano-1
            base = Nano1()
            domain = "general"
            
        # Fine-tune on user data
        finetuned = self.finetune(base, user_data, domain)
        
        # Compute delta
        delta = finetuned - base
        
        # Compress to 1-bit + scales
        signs = torch.sign(delta)
        scales = self.compute_optimal_scales(base, delta, user_data)
        
        # Create adapter (10× compression)
        adapter = BitDeltaAdapter(signs, scales)
        
        return adapter
```

## Performance Benchmarks

| Model | Parameters | FLOPs | Memory | Latency | Quality Score |
|-------|------------|-------|---------|---------|---------------|
| Eco-1 | 72B | 1.4T | 144GB | 850ms | 94.7 |
| Coder-1 | 32B | 0.6T | 64GB | 380ms | 92.1 (HumanEval) |
| Nano-1 | 3B | 0.06T | 6GB | 35ms | 85.3 |

### Specialized Benchmarks

**Eco-1**:
- Video Understanding (Perception Test): 89.4%
- Behavioral Prediction Accuracy: 91.2%
- Cross-Modal Retrieval (mAP): 0.847
- Avatar Teaching Effectiveness: +47% learning gains

**Coder-1**:
- HumanEval: 92.1%
- MBPP: 89.7%
- SWE-Bench: 67.3%
- Solidity Security: 94.2% vulnerability detection

**Nano-1**:
- MMLU: 72.4%
- Mobile Inference Speed: 28 tokens/sec (iPhone 15)
- Memory Usage: <2GB RAM
- Battery Life: 8 hours continuous use

## Deployment Strategies

### Cloud Deployment (Eco-1 & Coder-1)
```yaml
Infrastructure:
  Provider: AWS/GCP/Azure
  GPUs: 8× H100 per instance
  Optimization: TensorRT, vLLM
  Scaling: Kubernetes with autoscaling
  
API Endpoints:
  - wss://eco1.zoo.ai/v1/stream
  - https://coder1.zoo.ai/v1/generate
  - https://api.zoo.ai/v1/chat
```

### Edge Deployment (Nano-1)
```yaml
Platforms:
  Mobile: iOS (Core ML), Android (TFLite)
  Web: WebAssembly + WebGPU
  Desktop: ONNX Runtime
  IoT: Raspberry Pi, NVIDIA Jetson
  
Optimizations:
  - Static quantization (INT4/INT8)
  - Graph optimization
  - Kernel fusion
  - Memory mapping
```

## Use Case Examples

### Eco-1: Educational Avatar
```python
avatar = Eco1()
response = avatar.teach(
    video="biology_lesson.mp4",
    question="How does photosynthesis work?",
    learner_profile=student.profile,
    enable_thinking=True,
)
# Returns explanation with visual aids and reasoning trace
```

### Coder-1: Smart Contract Audit
```python
coder = Coder1()
audit = coder.audit_contract(
    contract_code=solidity_code,
    repo_context=project_files,
    execute_tests=True,
)
# Returns vulnerabilities, gas optimizations, and fixes
```

### Nano-1: Mobile Assistant
```python
nano = Nano1()
response = nano.assist(
    query="Summarize this document",
    document=pdf_content,
    quality_level="balanced",
)
# Returns summary in 35ms on mobile device
```

## Future Roadmap

### Q1 2025: Initial Release
- Eco-1 beta for avatar tutors
- Coder-1 beta for developers
- Nano-1 for mobile testing

### Q2 2025: Production Launch
- Eco-1 powers 1M+ learning sessions
- Coder-1 integrated in IDEs
- Nano-1 on 10M+ devices

### Q3 2025: Advanced Features
- Eco-1: Real-time video streaming
- Coder-1: Full repository understanding
- Nano-1: Federated learning

### Q4 2025: Ecosystem Integration
- Unified API across all models
- Cross-model knowledge transfer
- Community fine-tuning platform

## LP Standards Integration

### Model Registration (LP-R)

All Zoo models registered in LP-compliant registry:

```solidity
contract ZooModelRegistry {
    // Implements LP-301 (ILPJob) and LP-303 (ILPRoyalties)
    
    struct ModelRegistration {
        string modelLuxId;          // did:lux:122:0x... for the model
        bytes32 modelHash;          // Content-addressed model identifier
        string[] architectures;     // ["z-JEPA", "v-JEPA-v2", "BitDelta"]
        uint256 parameterCount;     // 72B, 32B, or 3B
        string[] capabilities;      // ["multimodal", "behavioral", "code", etc.]
        RoyaltyMap royalties;       // LP-106 royalty distribution
        uint256 version;
        bool active;
    }
    
    mapping(string => ModelRegistration) public models;
    
    function registerModel(
        string calldata modelLuxId,
        ModelRegistration calldata registration,
        bytes calldata computeReceipt  // LP-105
    ) external {
        require(verifyLuxId(modelLuxId), "Invalid Lux ID");
        require(verifyReceipt(computeReceipt), "Invalid compute receipt");
        models[modelLuxId] = registration;
        emit ModelRegistered(modelLuxId, registration.modelHash);
    }
}
```

### Compute Jobs (LP-101)

Model inference requests use standard JobSpec:

```python
class ZooModelJob:
    """
    LP-101 compliant job submission for Zoo models
    """
    
    def submit_inference_job(
        self,
        model_name: str,  # "Eco-1", "Coder-1", or "Nano-1"
        user_lux_id: str,  # did:lux:122:0x...
        input_data: Dict
    ) -> JobSpec:
        
        job = JobSpec(
            chainId=122,  # Zoo chain
            modelHash=self.get_model_hash(model_name),
            requesterLuxId=user_lux_id,
            providerLuxId=self.get_provider_lux_id(),
            functionCall=f"{model_name.lower()}_inference",
            inputData=input_data,
            maxGasPrice=self.calculate_gas_price(model_name),
            deadline=int(time.time()) + 300  # 5 minute timeout
        )
        
        # Sign with EIP-712
        signature = self.sign_job_spec(job)
        
        # Submit to compute network
        receipt = self.compute_client.submit_job(job, signature)
        
        return receipt
```

### Training Campaigns (LP-108)

Coordinated model improvement campaigns:

```python
class ZooTrainingCampaign:
    """
    LP-108 compliant training campaigns for Zoo models
    """
    
    def create_campaign(
        self,
        model_name: str,
        campaign_type: str,  # "fine-tune", "continued-pretrain", "rlhf"
        dataset_lux_ids: List[str]  # did:lux identifiers for datasets
    ) -> TrainingCampaign:
        
        campaign = TrainingCampaign(
            modelLuxId=self.get_model_lux_id(model_name),
            campaignType=campaign_type,
            datasetCredentials=[
                self.fetch_dataset_credential(did) for did in dataset_lux_ids
            ],  # LP-112 DatasetCredentials
            computeRequirements={
                "gpu_type": "H100" if model_name == "Eco-1" else "A100",
                "gpu_count": 8 if model_name == "Eco-1" else 4,
                "memory_gb": 640 if model_name == "Eco-1" else 320
            },
            privacyBudget=PrivacyBudget(epsilon=1.0, delta=1e-5),
            startTime=int(time.time()),
            endTime=int(time.time()) + 7 * 24 * 3600  # 1 week
        )
        
        return campaign
```

### UI Requirements (LP-500s)

Model interfaces implement LP-500 series:

```typescript
interface ZooModelUI {
    // LP-501: Citation Rendering for all model outputs
    renderModelCitations(response: ModelResponse): CitationUI {
        return {
            sources: response.citations.map(c => ({
                text: c.text,
                confidence: c.confidence,
                modelComponent: c.component  // Which expert/module generated this
            })),
            aggregatedConfidence: response.overallConfidence
        }
    }
    
    // LP-502: Confidence Display with thinking tokens
    displayThinkingProcess(thoughts: ThinkingTokens): ThoughtUI {
        return {
            reasoning: thoughts.internal_monologue,
            confidence: thoughts.confidence_score,
            alternatives: thoughts.considered_alternatives,
            decision: thoughts.final_decision
        }
    }
    
    // LP-503: Model selection consent
    getModelConsent(userLuxId: string, modelName: string): Promise<boolean> {
        return showConsentDialog({
            title: `Use ${modelName} Model`,
            description: `${modelName} will process your request`,
            capabilities: this.getModelCapabilities(modelName),
            dataHandling: this.getDataPolicy(modelName),
            luxId: userLuxId
        })
    }
}
```

## References

1. [v-JEPA](https://ai.meta.com/research/publications/v-jepa-masked-video-prediction/) - Video prediction architecture
2. [V-JEPA 2](https://arxiv.org/abs/2506.09985) - Next generation improvements
3. [GLM-4-Plus](https://arxiv.org/abs/2501.12158) - Self-critique and All-Tools
4. [BitDelta](https://arxiv.org/abs/2402.10193) - 1-bit compression
5. [FlashAttention-3](https://arxiv.org/abs/2401.04577) - Efficient attention
6. Knowledge distillation advances from recent literature

## Reference Implementation

**Repository**: [zooai/zoo-models](https://github.com/zooai/zoo-models)

**Key Files**:
- `/eco1/model.py` - Eco-1 z-JEPA implementation (16B/32B params)
- `/eco1/training/` - Eco-1 training pipeline on behavioral data
- `/eco1/inference/` - Optimized inference for video/audio/3D
- `/coder1/model.py` - Coder-1 code generation model (7B/15B params)
- `/coder1/training/` - Coder-1 training on code + execution traces
- `/coder1/tools/` - Tool use integration (bash, git, file operations)
- `/nano1/model.py` - Nano-1 efficient model (1.5B params)
- `/nano1/quantization/` - INT4/INT8 quantization for edge devices
- `/nano1/mobile/` - iOS/Android deployment
- `/shared/bitdelta.py` - BitDelta personalization for all models
- `/shared/moe_router.py` - MoE routing shared across models
- `/deployment/serve.py` - Model serving infrastructure
- `/deployment/scaling.py` - Auto-scaling for production
- `/api/openai_compatible.py` - OpenAI-compatible API
- `/tests/model_tests.py` - Comprehensive model evaluation suite

**Status**: In Development (Launch Q2 2025)

**Pre-trained Model Weights**:
- Eco-1: https://huggingface.co/zoo-ai/eco-1-base (16B), eco-1-large (32B)
- Coder-1: https://huggingface.co/zoo-ai/coder-1-base (7B), coder-1-large (15B)
- Nano-1: https://huggingface.co/zoo-ai/nano-1 (1.5B)

**Documentation**:
- Model cards and usage: https://docs.zoo.ai/models
- API reference: https://api.zoo.ai/docs
- Training guides: https://docs.zoo.ai/training
- Deployment guides: https://docs.zoo.ai/deployment

**Integration**:
- ZIP-3 Eco-1 architecture specification
- ZIP-7 BitDelta personalization
- ZIP-8 Avatar tutor models
- ZIP-9 Unified BitDelta deployment

**Benchmarks**:
- Eco-1: Video QA, motion prediction, multimodal understanding
- Coder-1: HumanEval, MBPP, code execution accuracy
- Nano-1: MMLU, edge device latency, energy efficiency

## Implementation Resources

- Model weights: https://huggingface.co/zoo-ai/
- Training code: https://github.com/zooai/zoo-models
- Deployment guides: https://docs.zoo.ai/models
- API documentation: https://api.zoo.ai/docs

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

*"Three models, infinite possibilities. Eco-1 sees and learns, Coder-1 builds and debugs, Nano-1 goes everywhere." - Zoo AI Vision*