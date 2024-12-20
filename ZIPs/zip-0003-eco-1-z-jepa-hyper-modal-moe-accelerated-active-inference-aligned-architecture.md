---
zip: 0003
title: "Eco-1: z-JEPA - A Hyper-Modal, MoE-Accelerated, Active-Inference Aligned Architecture"
author: Zoo Research Group, Z, Collaborators - Zoo Labs Foundation Inc. (Delaware 501(c)(3))
type: Standards Track
category: Core
status: Draft
created: 2024-12-20
updated: 2025-01-09
requires: ZIP-1, HIP-1, HIP-7
license: CC-BY-4.0
---

# ZIP-3: Eco-1: z-JEPA - A Hyper-Modal, MoE-Accelerated, Active-Inference Aligned Architecture

## Abstract

We present **Eco-1**, a hyper-modal learning stack whose core is **z-JEPA**: Zoo's Joint Embedding Predictive Architecture that learns world-state dynamics in latent space across video, audio, text, and 3D. Eco-1 composes:
1. A video backbone scaled to large datasets with native LLM alignment for video QA and instruction following
2. A **HLLM** (Hamiltonian Large Language Model) that governs routing, precision, and reasoning depth under latency/compute budgets
3. A planning prior derived from Expected Free Energy (EFE), which unifies goal pursuit with epistemic exploration

To reach interactive latency for humanoid robotics and metaverse avatars, we employ sparsely activated MoE transformers with modern inference optimizations. For per-user, multi-tenant personalization, we standardize on **BitDelta** 1-bit delta-weight finetunes with optional low-rank adapters. We outline optional ZKML proof-of-inference paths and interoperability via the Model Context Protocol (MCP) and IEEE 2874 Spatial Web.

## Motivation

Current AI models lack understanding of natural movement and social behaviors:

1. **Static Training**: Models trained on text/images miss temporal dynamics
2. **No Embodiment**: Lack understanding of physical movement and space
3. **Poor Social Modeling**: Can't predict group behaviors and interactions
4. **Limited Transfer**: Gaming AI doesn't transfer to real applications
5. **No Emergence**: Scripted behaviors rather than learned patterns

Eco-1 learns from virtualized animal ecosystems to create truly emergent AI.

## Key Contributions

Eco-1 contributes a comprehensive system design that advances the state-of-the-art in multiple dimensions:

### 1. z-JEPA: Hyper-Modal Learning Stack
Zoo's proprietary Joint Embedding Predictive Architecture featuring:
- **Cross-modal prediction**: Video→text, audio→video, 3D→action
- **LLM alignment**: Direct integration with language models for instruction following
- **Latent world modeling**: Learning dynamics in representation space, avoiding pixel reconstruction

### 2. HLLM (Hamiltonian Large Language Model)
Resource-aware orchestration with:
- **Thinking/non-thinking modes**: Controllable deliberation depth
- **Hamiltonian dynamics**: Energy-conserving routing with dual variables
- **Hidden Markov gating**: Regime persistence for stable expert selection
- **Group sequence optimization**: Stable MoE training via policy-level rewards

### 3. MoE Everywhere Architecture
Sparse experts across all modalities:
- **Dynamic routing**: Top-k gating with load balancing
- **Specialized experts**: Domain-specific feed-forward networks
- **Capacity vs latency trade-offs**: Token-granular resource allocation

### 4. EFE-Aligned Planning
Principled exploration and exploitation:
- **Expected Free Energy minimization**: Balance goal achievement with information gain
- **Latent rollouts**: Planning in learned representation space
- **Intrinsic motivation**: Natural curiosity drives from active inference

### 5. BitDelta Personalization
Memory-efficient per-user adaptation:
- **1-bit delta weights**: 10×+ memory savings
- **Safety benefits**: Quantization reduces jailbreak risks by ~60%
- **Fast swapping**: Millisecond user model switching
- **Privacy preservation**: Only store user deltas, not data

### 6. Verifiable & Interoperable Design
Standards-compliant integration:
- **ZKML proofs**: Optional zero-knowledge inference verification
- **MCP compatibility**: Anthropic's Model Context Protocol for tools
- **IEEE 2874 Spatial Web**: HSML/HSTP for cross-agent coordination

## Specification

### Model Architecture

#### Base Architecture

```python
class Eco1Architecture:
    """
    Eco-1: z-JEPA MoE architecture for behavioral learning
    """
    # Core MoE Configuration
    hidden_size = 4096
    intermediate_size = 11008
    num_attention_heads = 32
    num_key_value_heads = 8  # GQA for efficiency
    num_layers = 32
    
    # MoE Configuration
    num_experts = 8
    num_experts_per_tok = 2  # Top-2 routing
    expert_capacity_factor = 1.25
    
    # v-JEPA Integration
    video_encoder = "ViT-Huge"  # Vision Transformer for video
    temporal_predictor = "Transformer"
    prediction_horizon = 16  # frames
    
    # Zoo-specific
    behavior_embedding_dim = 2048
    species_vocab_size = 10000  # Different animal types
    environment_vocab_size = 5000  # Terrain/climate types
```

#### v-JEPA Integration for Behavioral Learning

```python
class VideoJEPA:
    """
    Video Joint-Embedding Predictive Architecture
    Learns from watching animal behaviors in metaverse
    """
    def __init__(self):
        self.video_encoder = VideoEncoder(
            architecture="ViT-H/14",
            patch_size=(2, 16, 16),  # temporal, height, width
            embedding_dim=1280
        )
        
        self.context_encoder = ContextEncoder(
            hidden_dim=4096,
            num_heads=32
        )
        
        self.predictor = Predictor(
            input_dim=4096,
            hidden_dim=4096,
            output_dim=1280,
            prediction_steps=16
        )
    
    def learn_from_behavior(self, video_sequence):
        """
        Learn by predicting future frames of animal behavior
        """
        # Encode visible patches
        visible_tokens = self.video_encoder(video_sequence.visible)
        
        # Predict masked patches
        context = self.context_encoder(visible_tokens)
        predictions = self.predictor(context)
        
        # Self-supervised loss
        target_tokens = self.video_encoder(video_sequence.masked)
        loss = F.mse_loss(predictions, target_tokens.detach())
        
        return loss, predictions
```

#### MoE Router for Behavioral Specialization

```python
class BehavioralMoERouter:
    """
    Routes tokens to experts based on behavioral context
    """
    def __init__(self, num_experts=8):
        self.experts = nn.ModuleList([
            BehaviorExpert(specialization) for specialization in [
                "hunting",      # Predator behaviors
                "grazing",      # Herbivore behaviors
                "flocking",     # Group coordination
                "nesting",      # Building/creation
                "territorial",  # Space control
                "mating",       # Social bonding
                "migration",    # Long-range planning
                "playing"       # Learning/exploration
            ]
        ])
        
        self.router = nn.Linear(4096, num_experts)
        
    def forward(self, x, behavior_context):
        # Compute routing scores
        router_logits = self.router(x)
        
        # Add behavioral bias based on context
        if behavior_context.species == "wolf":
            router_logits[:, 0] += 2.0  # Bias toward hunting expert
            router_logits[:, 2] += 1.5  # Bias toward flocking (pack)
        elif behavior_context.species == "bee":
            router_logits[:, 2] += 2.0  # Bias toward flocking (swarm)
            router_logits[:, 3] += 1.5  # Bias toward nesting (hive)
        
        # Top-k routing
        top_k_logits, top_k_indices = torch.topk(
            router_logits, k=2, dim=-1
        )
        
        # Weighted combination of experts
        output = 0
        for k in range(2):
            expert_idx = top_k_indices[:, k]
            expert_weight = F.softmax(top_k_logits, dim=-1)[:, k]
            expert_output = self.experts[expert_idx](x)
            output += expert_weight * expert_output
            
        return output
```

### Training Data: Virtualized Animal Behaviors

#### Metaverse Zoo Environments

```yaml
Training Environments:
  African Savanna:
    - Species: Lions, zebras, elephants, gazelles
    - Behaviors: Hunting, herding, migration, watering
    - Dynamics: Predator-prey, resource competition
    
  Ocean Reef:
    - Species: Sharks, fish schools, octopi, dolphins
    - Behaviors: Schooling, hunting, camouflage, play
    - Dynamics: 3D movement, current navigation
    
  Rainforest Canopy:
    - Species: Monkeys, birds, snakes, insects
    - Behaviors: Swinging, flying, climbing, foraging
    - Dynamics: Vertical stratification, seasonal cycles
    
  Arctic Tundra:
    - Species: Polar bears, seals, wolves, caribou
    - Behaviors: Ice hunting, denning, migration
    - Dynamics: Seasonal adaptation, ice navigation
    
  Urban Environment:
    - Species: Pigeons, rats, cats, dogs
    - Behaviors: Scavenging, navigation, human interaction
    - Dynamics: Adaptation to human structures
```

#### Behavioral Learning Pipeline

```python
class MetaverseBehaviorLearning:
    def __init__(self):
        self.simulator = UnityMLAgents()  # Or Unreal Engine
        self.recorder = BehaviorRecorder()
        self.model = Eco1Model()
        
    def generate_training_data(self):
        """
        Simulate animal behaviors and record for training
        """
        for environment in self.environments:
            # Spawn AI-controlled animals
            animals = environment.spawn_animals()
            
            # Run simulation
            for timestep in range(10000):
                # Animals act based on current AI
                actions = [animal.decide_action() for animal in animals]
                
                # Environment updates
                observations = environment.step(actions)
                
                # Record behavior sequences
                self.recorder.record(observations, actions)
                
                # Learn online from observations
                if timestep % 100 == 0:
                    loss = self.train_on_batch(self.recorder.get_batch())
        
        return self.recorder.dataset
    
    def train_on_batch(self, batch):
        """
        Train Eco-1 model on behavioral sequences
        """
        # v-JEPA self-supervised learning
        video_loss = self.model.vjepa.learn_from_behavior(
            batch.video_sequences
        )
        
        # Language modeling on behavior descriptions
        text_loss = self.model.language_head(
            batch.behavior_descriptions
        )
        
        # Cross-modal alignment
        alignment_loss = self.model.align_video_text(
            batch.video_sequences,
            batch.behavior_descriptions
        )
        
        total_loss = video_loss + text_loss + alignment_loss
        return total_loss
```

### Emergent Capabilities from Animal Behaviors

#### Learned Behavioral Primitives

```python
class LearnedBehaviors:
    """
    Behavioral primitives learned from animal observation
    """
    
    # Movement patterns
    def flock_cohesion(self, agents):
        """Learned from birds/fish: stay together"""
        center = torch.mean(agents.positions, dim=0)
        return (center - agents.positions) * 0.01
    
    def predator_stalk(self, predator, prey):
        """Learned from cats/wolves: approach with stealth"""
        distance = torch.norm(prey.position - predator.position)
        if distance > predator.strike_range * 2:
            return predator.move_toward(prey, speed=0.5)
        else:
            return predator.circle(prey, maintain_distance=True)
    
    def escape_pattern(self, prey, predator):
        """Learned from gazelles: zigzag escape"""
        direct_away = prey.position - predator.position
        perpendicular = torch.tensor([-direct_away[1], direct_away[0]])
        zigzag = direct_away + perpendicular * torch.sin(prey.time * 5)
        return prey.move(zigzag, speed=1.0)
    
    def territorial_patrol(self, animal, territory):
        """Learned from wolves/lions: boundary patrol"""
        boundary_points = territory.get_boundary_points()
        next_point = boundary_points[animal.patrol_index % len(boundary_points)]
        return animal.move_toward(next_point, mark_scent=True)
```

#### Transfer to Game NPCs

```python
class GameNPCBehavior:
    """
    Transfer learned animal behaviors to game NPCs
    """
    def __init__(self, eco1_model):
        self.model = eco1_model
        self.behavior_lib = LearnedBehaviors()
        
    def npc_guard_behavior(self, npc, patrol_area):
        # Use wolf territorial behavior
        return self.behavior_lib.territorial_patrol(npc, patrol_area)
    
    def npc_combat_behavior(self, npc, enemies):
        if npc.role == "assassin":
            # Use predator stalking behavior
            target = self.select_weakest(enemies)
            return self.behavior_lib.predator_stalk(npc, target)
        elif npc.role == "tank":
            # Use elephant protective behavior
            return self.protect_group(npc, allies)
    
    def npc_merchant_behavior(self, npc, customers):
        # Use bee resource gathering/sharing behavior
        return self.resource_distribution(npc, customers)
```

### Model Variants

| Model | Parameters | Experts | Use Case |
|-------|------------|---------|----------|
| Eco-1-7B | 7B | 4 experts | Mobile games, simple NPCs |
| Eco-1-32B | 32B | 8 experts | Complex behaviors, MMOs |
| Eco-1-70B | 70B | 16 experts | Metaverse, realistic ecosystems |

## Advanced Technical Specification: z-JEPA Architecture

### Core Innovation: Hyper-Modal Joint Embedding Predictive Architecture

Eco-1 introduces **z-JEPA**, Zoo's hyper-modal learning stack that performs cross-modal prediction across video, audio, text, and 3D, with native LLM alignment for instruction following and planning.

#### Mathematical Foundation

The z-JEPA objective minimizes latent prediction error:

$$\mathcal{L}_{\text{JEPA}} = \sum_{k\in \mathcal{K}} \|\hat z_{t+k} - z_{t+k}^{\text{tgt}}\|_1$$

where $z^{\text{tgt}}$ are EMA target encoders following I-JEPA/V-JEPA protocols.

#### Expected Free Energy (EFE) Planning

We regularize planning with EFE to balance pragmatic value and epistemic gain:

$$\mathcal{L}_{\mathrm{EFE}}=\mathbb{E}_{q(o_{t:T},s_{t:T}|\pi)}\Big[\underbrace{\mathrm{D}_{\mathrm{KL}}\big(q(s|o)\,\|\,p(s)\big)}_{\text{epistemic}}-\underbrace{\log p(o)}_{\text{preferences}}\Big]$$

This provides principled exploration following Champion et al. (2024) and de Vries et al. (2025).

### System Architecture Components

#### (A) z-JEPA Hyper-Modal Backbone
- **Video Encoder**: Vision Transformer with temporal modeling
- **Audio Encoder**: Conformer/Transformers for speech and sound
- **Text Controller**: HLLM with thinking/non-thinking modes
- **3D JEPA**: Point cloud masked latent prediction
- **Cross-Modal Heads**: Multi-directional prediction (video→text, audio→video)

#### (B) HLLM
```python
class HamiltonianController:
    """Resource-constrained routing with dual variables"""
    def optimize(self):
        return min(E[L_task + λ_c*Compute + λ_ℓ*Latency])
```

Features:
- **Thinking Budget**: Controllable deliberation depth
- **MoE Routing**: Dynamic top-k gating with load balancing
- **Regime Gating**: Hidden Markov persistence for stable routing
- **Group Optimization**: Sequence-level policy optimization for stable MoE training

#### (C) EFE-Aligned Planner
Active inference planning over latent rollouts with intrinsic drives for information gain and preference satisfaction, complementing world model-based reinforcement learning.

### Personalization: BitDelta + Low-Rank Adaptation

We adopt **BitDelta** for memory-efficient per-user finetunes:

$$W_f = W_b + W_\Delta, \quad \widehat{W}_\Delta=\mathrm{sign}(W_\Delta), \quad \widehat{W}_f = W_b + \gamma \odot \widehat{W}_\Delta$$

Benefits:
- **10×+ memory savings** for multi-tenant serving
- **Safety**: Quantized deltas reduce alignment-breaking risks
- **Fast swapping**: Per-user model switching in milliseconds

### Real-Time Performance Targets

Based on ITU-T G.114 and VR industry standards:
- **Audio RTA**: ≤150ms mouth-to-ear latency
- **Avatar Control**: 10-20ms motion-to-photon
- **Inference**: FlashAttention-2, speculative decoding
- **Streaming**: Chunked processing with prefix caching

### Training Objectives

```python
class Eco1TrainingObjectives:
    def __init__(self):
        self.vjepa_weight = 0.4
        self.language_weight = 0.3
        self.behavior_weight = 0.2
        self.alignment_weight = 0.1
        
    def compute_loss(self, batch):
        losses = {}
        
        # 1. v-JEPA: Predict masked video patches
        losses['vjepa'] = self.vjepa_loss(
            batch.video_visible,
            batch.video_masked
        )
        
        # 2. Language: Describe behaviors in text
        losses['language'] = self.language_loss(
            batch.behavior_text,
            batch.behavior_labels
        )
        
        # 3. Behavior: Predict next actions
        losses['behavior'] = self.behavior_loss(
            batch.state_sequence,
            batch.action_sequence
        )
        
        # 4. Alignment: Match video to descriptions
        losses['alignment'] = self.contrastive_loss(
            batch.video_embeddings,
            batch.text_embeddings
        )
        
        # Weighted sum
        total_loss = sum(
            weight * losses[key] 
            for key, weight in [
                ('vjepa', self.vjepa_weight),
                ('language', self.language_weight),
                ('behavior', self.behavior_weight),
                ('alignment', self.alignment_weight)
            ]
        )
        
        return total_loss, losses
```

## Implementation Roadmap

### Phase 1: Metaverse Zoo Creation (Q1 2025)
- Build 5 initial biomes in Unity/Unreal
- Implement 50 animal species with basic AI
- Set up behavior recording pipeline

### Phase 2: z-JEPA Training (Q2 2025)
- Collect 10M hours of simulated behavior
- Train z-JEPA encoder on video sequences
- Validate learned representations

### Phase 3: MoE Integration (Q3 2025)
- Implement MoE architecture with dynamic routing
- Train behavioral experts
- Fine-tune routing based on species/context

### Phase 4: Game Integration (Q4 2025)
- Transfer to Zoo GameFi NPCs
- Deploy in metaverse environments
- Community testing and feedback

## Interoperability & Verifiability

### Model Context Protocol (MCP)
Standardized tool/data connectivity for agents following Anthropic's MCP specification for secure, stateful interactions.

### IEEE 2874 Spatial Web
Cross-device/agent coordination via:
- **HSML**: Hyperspace Modeling Language for semantic descriptions
- **HSTP**: Hyperspace Transaction Protocol for agent communication
- **UDG**: Universal Data Graph for shared world state

### Zero-Knowledge ML (ZKML)
Selected inference heads proven with succinct cryptographic proofs:
- Light classifiers/regressors verifiable on-chain
- Proof sizes: ~10KB for small models
- Verification time: <100ms

## Implementation Details

### Training Infrastructure
```yaml
Data Requirements:
  - Video: ~1M hours of behavioral sequences
  - Audio: 100K hours with transcripts
  - 3D Scenes: 10M point clouds
  - Behavioral Sequences: 10M hours simulated
  
Compute:
  - Pretraining: 512 H100 GPUs × 30 days
  - Fine-tuning: 64 H100 GPUs × 7 days
  - Per-user adaptation: 1 GPU × 10 minutes
```

### Optimization Stack
- **Optimizer**: AdamW with cosine schedule
- **EMA Targets**: Momentum 0.996 → 1.0
- **Multi-crop**: Spatial and temporal augmentation
- **Gradient Accumulation**: Effective batch 4096
- **Mixed Precision**: BF16 with dynamic loss scaling

## Reference Implementation

**Repository**: [zooai/eco-1](https://github.com/zooai/eco-1)

**Key Files**:
- `/models/z_jepa.py` - Core z-JEPA architecture implementation
- `/models/video_encoder.py` - ViT-Huge video encoder
- `/models/hllm.py` - Hamiltonian LLM orchestration layer
- `/models/moe_transformer.py` - MoE transformer with dynamic routing
- `/models/efe_planner.py` - Expected Free Energy planning module
- `/training/pretrain.py` - Pretraining pipeline on behavioral data
- `/training/bitdelta.py` - BitDelta 1-bit weight adaptation
- `/inference/latency_optimized.py` - Sub-100ms inference optimizations
- `/data/behavioral_dataset.py` - Dataset loader for ecosystem simulations
- `/evaluation/benchmarks.py` - Evaluation metrics and benchmarks
- `/zkml/proof_generation.py` - Optional ZKML proof-of-inference
- `/mcp/context_protocol.py` - Model Context Protocol integration
- `/spatial_web/ieee2874.py` - IEEE 2874 Spatial Web compliance
- `/tests/` - Comprehensive test suite for all components

**Status**: In Development (Alpha Release Q2 2025)

**Pre-trained Models**:
- `eco-1-base` (16B params) - Base z-JEPA model
- `eco-1-large` (32B params) - Large-scale behavioral model
- `eco-1-moe` (64B params, 8 experts) - MoE version for production

**Documentation**:
- Training guide: `/docs/training.md`
- Inference optimization: `/docs/inference.md`
- BitDelta personalization: `/docs/bitdelta.md`
- ZKML integration: `/docs/zkml.md`

## Evaluation Metrics

```yaml
Video Understanding:
  - Motion Prediction: z-JEPA benchmarks
  - Action Anticipation: 85% accuracy target
  - VideoQA: LLM-aligned responses

Behavioral Realism:
  - Turing Test: Humans can't distinguish AI vs recorded
  - Ethologist Review: Animal behavior experts validation
  - Emergent Behaviors: Novel realistic behaviors not scripted

Transfer Learning:
  - NPC Quality: Player ratings of NPC behavior
  - Adaptation Speed: <100 steps to new environment
  - Cross-Species: 70% transfer between animal types

Technical Performance:
  - Inference: <50ms per decision (Eco-1-32B)
  - Memory: <16GB VRAM for Eco-1-32B
  - Training Efficiency: 10x less data than GPT-4
  - Personalization: <1MB per user (BitDelta)
```

## Security, Safety, and Privacy

### Per-User Isolation
- Store only delta weights and scales (ŴΔ, γ)
- No cross-user data mixing
- Encrypted user-specific buffers

### Safety Measures
- Quantized deltas reduce jailbreak risks by ~60%
- Alignment preservation through BitDelta
- Runtime refusal mechanisms
- Behavioral bounds from animal priors

### Privacy Protection
- On-device adaptation when possible
- Federated learning for sensitive domains
- No raw user data exfiltration
- Differential privacy option (ε=1.0)

## Release Plans

We will release the following components to enable reproducible research and deployment:

1. **Reference PyTorch code for z-JEPA**: Complete implementation with modular encoders
2. **Training scripts**: Video/audio/3D training pipelines with distributed support
3. **EFE-regularized planners**: Active inference planning modules
4. **BitDelta pipelines**: Quantization and serving infrastructure
5. **Low-rank adapters**: Fine-tuning scripts and pre-trained adapters
6. **Optional ZKML recipes**: Proof generation for selected model heads
7. **MCP/IEEE-2874 bindings**: Interoperability connectors

All code will be released under permissive licenses to encourage adoption and innovation.

## Limitations

While Eco-1 represents significant advances, we acknowledge several limitations:

1. **Composed from published work**: We synthesize existing research without new empirical results
2. **EFE as inductive bias**: Expected Free Energy provides principled guidance but not guarantees
3. **ZKML scalability**: Full-model zero-knowledge proofs remain computationally expensive
4. **Real-time targets**: Latency budgets (150ms audio, 20ms motion) are aspirational based on industry standards
5. **Animal behavior transfer**: Effectiveness of virtual→real behavior transfer needs validation
6. **Compute requirements**: Pre-training requires significant GPU resources (512 H100s × 30 days)

## Fun Applications

### Virtual Pet AI
```python
class VirtualPet:
    def __init__(self, species="cat", personality=None):
        self.model = Zoo1Model.load(f"z1-7B-{species}")
        self.personality = personality or self.randomize_personality()
        
    def interact(self, user_action):
        # React based on learned animal behaviors
        response = self.model.predict_response(
            user_action,
            self.personality,
            self.current_mood
        )
        return response
```

### Wildlife Documentary Generation
```python
def generate_documentary(ecosystem, duration_hours=1):
    """Generate David Attenborough style documentary"""
    simulation = MetaverseZoo(ecosystem)
    behaviors = simulation.run(duration_hours)
    
    narration = z1_model.generate_narration(behaviors)
    video = z1_model.render_cinematic(behaviors)
    
    return DocumentaryVideo(video, narration)
```

## Academic References

### Core JEPA Architecture Papers
1. **I-JEPA**: M. Assran, Q. Duval, I. Misra, et al. (2023). "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture." arXiv:2301.08243, CVPR'23. [https://arxiv.org/abs/2301.08243](https://arxiv.org/abs/2301.08243)

2. **V-JEPA**: A. Bardes, Q. Garrido, J. Ponce, et al. (2024). "V-JEPA: Latent Video Prediction for Visual Representation Learning." OpenReview. [https://openreview.net/forum?id=WFYbBOEOtv](https://openreview.net/forum?id=WFYbBOEOtv)

3. **V-JEPA 2**: M. Assran, A. Bardes, D. Fan, Q. Garrido, et al. (2025). "V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning." arXiv:2506.09985. [https://arxiv.org/abs/2506.09985](https://arxiv.org/abs/2506.09985)

4. **3D-JEPA**: N. Hu, H. Cheng, Y. Xie, et al. (2024). "3D-JEPA: A Joint Embedding Predictive Architecture for 3D Self-Supervised Representation Learning." arXiv:2409.15803. [https://arxiv.org/abs/2409.15803](https://arxiv.org/abs/2409.15803)

5. **Point-JEPA**: W. Saito, Y. Yang, T. Matsubara (2025). "Point-JEPA: A Joint Embedding Predictive Architecture for Self-Supervised Learning on Point Cloud." WACV 2025. [https://openaccess.thecvf.com/WACV2025](https://openaccess.thecvf.com/WACV2025)

6. **Slot Attention**: F. Locatello, D. Weissenborn, T. Unterthiner, et al. (2020). "Object-Centric Learning with Slot Attention." NeurIPS. [https://arxiv.org/abs/2006.15055](https://arxiv.org/abs/2006.15055)

### Active Inference & Planning
7. **EFE Unification**: T. Champion, H. Bowman, D. Marković, M. Grzęś (2024). "Reframing the Expected Free Energy: Four Formulations and a Unification." arXiv:2402.14460. [https://arxiv.org/abs/2402.14460](https://arxiv.org/abs/2402.14460)

8. **EFE Planning**: B. de Vries, W. Nuijten, T. van de Laar, et al. (2025). "Expected Free Energy-based Planning as Variational Inference." arXiv:2504.14898. [https://arxiv.org/abs/2504.14898](https://arxiv.org/abs/2504.14898)

9. **Active Inference Survey**: P. Lanillos, C. Meo, C. Pezzato, et al. (2021). "Active Inference in Robotics and Artificial Agents: Survey and Challenges." arXiv:2112.01871. [https://arxiv.org/abs/2112.01871](https://arxiv.org/abs/2112.01871)

10. **Free Energy Principle**: P. Mazzaglia, T. Verbelen, B. Dhoedt (2022). "The Free Energy Principle for Perception and Action." Entropy. [https://www.mdpi.com/1099-4300/24/2/301](https://www.mdpi.com/1099-4300/24/2/301)

11. **DreamerV3**: D. Hafner, J. Pasukonis, J. Ba, T. Lillicrap (2023). "Mastering Diverse Domains through World Models." arXiv:2301.04104. [https://arxiv.org/abs/2301.04104](https://arxiv.org/abs/2301.04104)

### Efficient Architectures & Optimization
12. **LoRA**: E. Hu, Y. Shen, P. Wallis, et al. (2021). "LoRA: Low-Rank Adaptation of Large Language Models." arXiv:2106.09685. [https://openreview.net/pdf?id=nZeVKeeFYf9](https://openreview.net/pdf?id=nZeVKeeFYf9)

13. **QLoRA**: T. Dettmers, A. Pagnoni, A. Holtzman, L. Zettlemoyer (2023). "QLoRA: Efficient Finetuning of Quantized LLMs." arXiv:2305.14314. [https://openreview.net/forum?id=OUIFPHEgJU](https://openreview.net/forum?id=OUIFPHEgJU)

14. **Switch Transformers**: W. Fedus, B. Zoph, N. Shazeer (2021). "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity." arXiv:2101.03961. [https://arxiv.org/abs/2101.03961](https://arxiv.org/abs/2101.03961)

15. **Sparsely-Gated MoE**: N. Shazeer, A. Mirhoseini, K. Maziarz, et al. (2017). "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer." arXiv:1701.06538. [https://arxiv.org/abs/1701.06538](https://arxiv.org/abs/1701.06538)

16. **Mixtral**: A. Q. Jiang, A. Sablayrolles, A. Roux, et al. (2024). "Mixtral of Experts." arXiv:2401.04088. [https://arxiv.org/abs/2401.04088](https://arxiv.org/abs/2401.04088)

17. **FlashAttention-2**: T. Dao (2023). "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning." arXiv:2307.08691. [https://arxiv.org/abs/2307.08691](https://arxiv.org/abs/2307.08691)

18. **Speculative Decoding**: Y. Leviathan, M. Kalman, Y. Matias (2022). "Fast Inference from Transformers via Speculative Decoding." arXiv:2211.17192. [https://arxiv.org/abs/2211.17192](https://arxiv.org/abs/2211.17192)

19. **rSLDS**: S. Linderman, A. Miller, R. Adams, et al. (2016). "Recurrent Switching Linear Dynamical Systems." arXiv:1610.08466. [https://arxiv.org/abs/1610.08466](https://arxiv.org/abs/1610.08466)

### Personalization & Safety
20. **BitDelta (arXiv)**: J. Liu, G. Xiao, K. Li, J. D. Lee, S. Han, T. Dao, T. Cai (2024). "BitDelta: Your Fine-Tune May Only Be Worth One Bit." arXiv:2402.10193. [https://arxiv.org/abs/2402.10193](https://arxiv.org/abs/2402.10193)

21. **BitDelta (NeurIPS)**: J. Liu, G. Xiao, K. Li, et al. (2024). "BitDelta: Your Fine-Tune May Only Be Worth One Bit." NeurIPS 2024. [https://proceedings.neurips.cc/paper_files/paper/2024](https://proceedings.neurips.cc/paper_files/paper/2024)

22. **QDW Safety**: Y. Liu, Z. Sun, X. He, X. Huang (2024). "Quantized Delta Weight Is Safety Keeper." arXiv:2411.19530. [https://arxiv.org/abs/2411.19530](https://arxiv.org/abs/2411.19530)

### Verifiability & Standards
23. **ZKML**: B. J. Chen, S. Waiwitlikhit, I. Stoica, Y. Sun, T. Hashimoto, D. Kang (2024). "ZKML: An Optimizing System for ML Inference in Zero-Knowledge Proofs." EuroSys 2024. [https://dl.acm.org/doi/10.1145/3627703.3650088](https://dl.acm.org/doi/10.1145/3627703.3650088)

24. **ZKTorch**: B. J. Chen, L. Tang, D. Kang (2025). "ZKTorch: Compiling ML Inference to Zero-Knowledge Proofs via Parallel Proof Accumulation." arXiv:2507.07031. [https://arxiv.org/abs/2507.07031](https://arxiv.org/abs/2507.07031)

25. **Model Context Protocol**: Anthropic (2024). "Introducing the Model Context Protocol (MCP)." [https://www.anthropic.com/news/model-context-protocol](https://www.anthropic.com/news/model-context-protocol)

26. **IEEE 2874**: IEEE Standards Association (2025). "IEEE 2874-2025: Spatial Web, Architecture and Governance." [https://standards.ieee.org/ieee/2874/11717/](https://standards.ieee.org/ieee/2874/11717/)

### Language Models & Training
27. **Qwen3**: Qwen Team (2025). "Qwen3: Think Deeper, Act Faster." Blog. [https://qwenlm.github.io/blog/qwen3/](https://qwenlm.github.io/blog/qwen3/)

28. **GSPO**: C. Zheng, S. Liu, M. Li, et al. (2025). "Group Sequence Policy Optimization." arXiv:2507.18071. [https://arxiv.org/abs/2507.18071](https://arxiv.org/abs/2507.18071)

### Latency & Performance Standards
29. **ITU-T G.114**: ITU-T (2003). "Recommendation G.114: One-Way Transmission Time." [https://www.itu.int/rec/T-REC-G.114](https://www.itu.int/rec/T-REC-G.114)

30. **Motion-to-Photon Latency**: M. Warburton, E. Mitchell, et al. (2022/2023). "Measuring motion-to-photon latency for sensorimotor control in VR." Behavior Research Methods. [https://link.springer.com/article/10.3758/s13428-022-01983-5](https://link.springer.com/article/10.3758/s13428-022-01983-5)

31. **Low Latency Displays**: P. C. Lincoln (2017). "Low Latency Displays for Augmented Reality." PhD Thesis, UCF. [https://sreal.ucf.edu/wp-content/uploads/2018/02/dissertation_lincoln-op.pdf](https://sreal.ucf.edu/wp-content/uploads/2018/02/dissertation_lincoln-op.pdf)

### Additional Resources
- Unity ML-Agents Toolkit: [github.com/Unity-Technologies/ml-agents](https://github.com/Unity-Technologies/ml-agents)
- Animal Behavior: An Evolutionary Approach (Alcock, 2013)
- Locate-3D: Unified 3D localization and understanding benchmark

## License & Copyright

This work is released under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

Full license text: [https://creativecommons.org/licenses/by/4.0/](https://creativecommons.org/licenses/by/4.0/)

## Acknowledgments

We thank the broader research community for foundational work in joint embedding architectures, mixture of experts models, active inference theory, and zero-knowledge machine learning that informed our development of z-JEPA.

## Author Information

**Zoo Research Group, Z, and Collaborators**  
Zoo Labs Foundation Inc.  
A Delaware-based 501(c)(3) non-profit organization  

---

*Building the future of AI-powered DeFi, gaming, and emergent intelligence through restorative justice and community governance.*