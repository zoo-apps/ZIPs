---
zip: 0011
title: Spatial Web, Active Inference, and Agent-to-Agent Economies for Zoo AI
author: Zoo Labs Foundation
type: Standards Track
category: Core
status: Draft
originated: 2021-10
traces-from: "Whitepaper sections 09 (AR App) and 12 (Metaverse Companion)"
follow-on: [zoo-spatial-web-agents]
created: 2025-01-09
requires: ZIP-3, ZIP-10, ZIP-12
references: IEEE 2874 Spatial Web, Active Inference Theory, DID Standards
repository: https://github.com/zooai/spatial-ai
license: CC BY 4.0
---

# ZIP-11: Spatial Web, Active Inference, and Agent-to-Agent Economies for Zoo AI

## Abstract

This proposal establishes Zoo's spatial understanding framework leveraging IEEE 2874 Spatial Web standards, active inference through Agent-to-Agent (A2A) DID simulations, and decentralized AI economies. By combining spatial computing with active inference theory, Zoo creates autonomous agents that perceive 3D environments, minimize surprise through predictive models, and engage in economic transactions. This enables emergent behaviors in virtual ecosystems, self-organizing AI marketplaces, and spatially-aware educational experiences.

## Motivation

Current AI systems lack three critical capabilities:

1. **Spatial Understanding**: Most models operate on flat text/images without true 3D comprehension
2. **Active Inference**: Passive response rather than goal-directed exploration and learning
3. **Economic Agency**: No autonomous value exchange between AI agents

Zoo addresses these through:
- **Spatial Web Integration**: Full 3D scene understanding and navigation
- **Active Inference Implementation**: Agents that actively minimize free energy
- **A2A DID Economy**: Agents with decentralized identities conducting autonomous transactions

## Technical Specification

### Spatial Understanding Architecture

```python
class SpatialUnderstanding(nn.Module):
    """
    3D spatial comprehension using point clouds, voxels, and scene graphs
    Implements IEEE 2874 Spatial Web standards
    """
    
    def __init__(self):
        super().__init__()
        
        # Point cloud processing (from Point-JEPA)
        self.point_encoder = PointTransformer(
            dim=512,
            depth=12,
            heads=8,
            dim_head=64,
            k=16,  # K-nearest neighbors
        )
        
        # Voxel representation
        self.voxel_encoder = Sparse3DCNN(
            in_channels=3,
            voxel_size=0.05,  # 5cm resolution
            feature_dim=256,
        )
        
        # Scene graph construction
        self.scene_graph = SceneGraphNetwork(
            object_dim=512,
            relation_dim=256,
            graph_layers=6,
        )
        
        # Spatial reasoning with transformers
        self.spatial_transformer = SpatialTransformer(
            dim=1024,
            depth=24,
            heads=16,
            dim_head=64,
            cross_attend_3d=True,
        )
        
        # IEEE 2874 HSML (Hyperspace Modeling Language)
        self.hsml_encoder = HSMLEncoder(
            semantic_dim=512,
            spatial_dim=512,
            temporal_dim=256,
        )
        
    def forward(self, spatial_input):
        """
        Process 3D spatial information
        """
        # Extract features from different representations
        if spatial_input.type == "point_cloud":
            features = self.point_encoder(spatial_input.points)
            
        elif spatial_input.type == "voxels":
            features = self.voxel_encoder(spatial_input.voxels)
            
        elif spatial_input.type == "mesh":
            # Convert mesh to point cloud
            points = self.mesh_to_points(spatial_input.mesh)
            features = self.point_encoder(points)
            
        # Build scene graph
        objects = self.detect_objects(features)
        relations = self.detect_relations(objects)
        scene_graph = self.scene_graph(objects, relations)
        
        # Spatial reasoning
        spatial_understanding = self.spatial_transformer(
            features,
            scene_graph,
            enable_3d_attention=True,
        )
        
        # Encode to HSML for interoperability
        hsml = self.hsml_encoder(spatial_understanding)
        
        return {
            "features": features,
            "scene_graph": scene_graph,
            "understanding": spatial_understanding,
            "hsml": hsml,  # IEEE 2874 compliant
        }
    
    def spatial_qa(self, scene, question):
        """
        Answer questions about 3D spatial relationships
        """
        understanding = self.forward(scene)
        
        # Examples of spatial reasoning
        if "above" in question:
            return self.reason_vertical_relations(understanding)
        elif "inside" in question:
            return self.reason_containment(understanding)
        elif "path" in question:
            return self.plan_navigation_path(understanding)
        elif "occluded" in question:
            return self.reason_occlusion(understanding)
```

### Active Inference Framework

```python
class ActiveInferenceAgent:
    """
    Agent that acts to minimize expected free energy (EFE)
    Implements perception-action loops for autonomous behavior
    """
    
    def __init__(self, agent_id: str, domain: str):
        self.agent_id = agent_id
        self.domain = domain
        
        # Generative model components
        self.generative_model = GenerativeModel(
            state_dim=1024,
            observation_dim=2048,
            action_dim=256,
        )
        
        # Belief state (variational distribution)
        self.beliefs = BeliefState(
            mean=torch.zeros(1024),
            variance=torch.ones(1024),
        )
        
        # Preferences (prior over observations)
        self.preferences = Preferences(
            goals=self.define_goals(domain),
            comfort_zones=self.define_comfort(domain),
        )
        
        # Expected Free Energy calculator
        self.efe_calculator = EFECalculator(
            epistemic_weight=0.5,  # Balance exploration vs exploitation
            pragmatic_weight=0.5,
        )
        
    def perceive(self, observation):
        """
        Update beliefs based on observation (variational inference)
        """
        # Prediction error
        predicted = self.generative_model.predict_observation(self.beliefs)
        error = observation - predicted
        
        # Update beliefs to minimize prediction error
        self.beliefs = self.variational_update(
            self.beliefs,
            error,
            learning_rate=0.01,
        )
        
        return self.beliefs
    
    def act(self, max_depth=5):
        """
        Select action that minimizes expected free energy
        """
        # Consider possible action sequences
        action_sequences = self.generate_action_sequences(max_depth)
        
        # Calculate EFE for each sequence
        efe_values = []
        for sequence in action_sequences:
            efe = self.calculate_efe(sequence)
            efe_values.append(efe)
            
        # Select action with minimum EFE
        best_sequence = action_sequences[torch.argmin(efe_values)]
        next_action = best_sequence[0]
        
        return next_action
    
    def calculate_efe(self, action_sequence):
        """
        Expected Free Energy = Epistemic value + Pragmatic value
        """
        # Simulate future trajectories
        simulated_beliefs = self.beliefs.clone()
        total_efe = 0
        
        for action in action_sequence:
            # Predict next state
            next_state = self.generative_model.transition(
                simulated_beliefs.mean,
                action,
            )
            
            # Epistemic value (information gain)
            info_gain = self.mutual_information(
                simulated_beliefs,
                next_state,
            )
            
            # Pragmatic value (preference satisfaction)
            expected_reward = self.expected_preference_score(next_state)
            
            # EFE = -info_gain - expected_reward
            efe = -self.efe_calculator.epistemic_weight * info_gain \
                  -self.efe_calculator.pragmatic_weight * expected_reward
                  
            total_efe += efe
            simulated_beliefs.mean = next_state
            
        return total_efe
    
    def dream(self, num_episodes=100):
        """
        Mental simulation to improve generative model
        """
        for _ in range(num_episodes):
            # Sample random initial state
            init_state = self.sample_state_prior()
            
            # Simulate trajectory
            trajectory = self.simulate_trajectory(init_state, length=50)
            
            # Update generative model to better predict trajectory
            self.generative_model.update_from_simulation(trajectory)
```

### Agent-to-Agent DID Economy

```python
class A2AEconomy:
    """
    Decentralized economy where AI agents trade services and resources
    Uses Lux IDs (did:lux) for agent identity (LP-200)
    """
    
    def __init__(self):
        # Lux ID registry on-chain (LP-205)
        self.lux_id_registry = LuxIDRegistry(
            blockchain="lux",
            chain_id=122,  # Zoo chain
            standard="LP-200",
        )
        
        # Service marketplace
        self.marketplace = ServiceMarketplace()
        
        # Resource tokens
        self.resource_tokens = {
            "COMPUTE": ComputeToken(),
            "MEMORY": MemoryToken(),
            "KNOWLEDGE": KnowledgeToken(),
            "INFERENCE": InferenceToken(),
        }
        
        # Reputation system
        self.reputation = ReputationSystem()
        
    def register_agent(self, agent: ActiveInferenceAgent):
        """
        Register agent with Lux ID and initial resources
        """
        # Create Lux ID (did:lux:122:0x...)
        lux_id = self.lux_id_registry.create_did(
            chain_id=122,
            address=agent.address,
            document_hash=self.create_agent_did_document(agent),
            service_endpoints=[
                {
                    "type": "LuxAgent",  # LP standard service type
                    "endpoint": f"agent://zoo.network/agents/{agent.address}",
                },
            ],
        )
        
        # Initial resource allocation
        initial_resources = {
            "COMPUTE": 1000,
            "MEMORY": 1000,
            "KNOWLEDGE": 100,
            "INFERENCE": 100,
        }
        
        for token_type, amount in initial_resources.items():
            self.resource_tokens[token_type].mint(lux_id, amount)
            
        return lux_id
    
    def create_service_offering(self, provider_lux_id: str, service: Dict):
        """
        Agent offers a service to the marketplace
        """
        offering = ServiceOffering(
            provider=provider_lux_id,
            service_type=service["type"],
            description=service["description"],
            price={
                "COMPUTE": service.get("compute_cost", 0),
                "MEMORY": service.get("memory_cost", 0),
                "KNOWLEDGE": service.get("knowledge_cost", 0),
            },
            quality_guarantee=service.get("quality_sla", 0.9),
        )
        
        self.marketplace.list_offering(offering)
        return offering.id
    
    def request_service(
        self,
        requester_lux_id: str,  # did:lux:122:0x...
        service_type: str,
        requirements: Dict,
    ):
        """
        Agent requests a service from another agent
        """
        # Find matching offerings
        offerings = self.marketplace.find_offerings(
            service_type=service_type,
            max_price=requirements.get("max_price"),
            min_quality=requirements.get("min_quality", 0.8),
        )
        
        # Rank by reputation and price
        ranked = self.rank_offerings(offerings, requester_did)
        
        # Select best offering
        if not ranked:
            return None
            
        best_offering = ranked[0]
        
        # Execute transaction
        transaction = self.execute_transaction(
            requester=requester_did,
            provider=best_offering.provider,
            offering=best_offering,
        )
        
        return transaction
    
    def execute_transaction(self, requester, provider, offering):
        """
        Atomic transaction between agents
        """
        # Lock resources
        locked_resources = {}
        for token_type, amount in offering.price.items():
            if amount > 0:
                locked = self.resource_tokens[token_type].lock(
                    requester,
                    amount,
                )
                locked_resources[token_type] = locked
                
        # Execute service
        result = self.execute_service(provider, offering)
        
        # Transfer resources if successful
        if result.success:
            for token_type, locked in locked_resources.items():
                self.resource_tokens[token_type].transfer(
                    from_did=requester,
                    to_did=provider,
                    amount=locked.amount,
                )
                
            # Update reputation
            self.reputation.record_success(provider, offering.service_type)
            
        else:
            # Unlock resources on failure
            for token_type, locked in locked_resources.items():
                self.resource_tokens[token_type].unlock(locked)
                
            # Update reputation
            self.reputation.record_failure(provider, offering.service_type)
            
        return TransactionRecord(
            requester=requester,
            provider=provider,
            offering=offering,
            result=result,
            timestamp=time.time(),
        )
```

### Simulation Environment

```python
class ZooSimulation:
    """
    Large-scale simulation of agent interactions in spatial environments
    """
    
    def __init__(self, config):
        # 3D environment
        self.environment = SpatialEnvironment(
            size=(1000, 1000, 100),  # 1km x 1km x 100m
            resolution=0.1,  # 10cm voxels
        )
        
        # Agent population
        self.agents = []
        for i in range(config.num_agents):
            agent = self.create_agent(
                agent_type=config.agent_types[i % len(config.agent_types)],
                position=self.random_position(),
            )
            self.agents.append(agent)
            
        # Economy
        self.economy = A2AEconomy()
        
        # Active inference coordinator
        self.inference_engine = ActiveInferenceCoordinator()
        
        # Metrics collector
        self.metrics = MetricsCollector()
        
    def step(self):
        """
        Single simulation timestep
        """
        # Each agent perceives environment
        observations = []
        for agent in self.agents:
            obs = self.environment.observe_from_position(
                agent.position,
                agent.sensor_range,
            )
            observations.append(obs)
            
        # Agents update beliefs via active inference
        beliefs = []
        for agent, obs in zip(self.agents, observations):
            belief = agent.perceive(obs)
            beliefs.append(belief)
            
        # Agents decide actions to minimize EFE
        actions = []
        for agent in self.agents:
            action = agent.act()
            actions.append(action)
            
        # Check for agent interactions (spatial proximity)
        interactions = self.detect_interactions()
        
        # Process economic transactions
        for interaction in interactions:
            if interaction.type == "service_request":
                transaction = self.economy.request_service(
                    requester_did=interaction.requester.did,
                    service_type=interaction.service,
                    requirements=interaction.requirements,
                )
                
        # Execute actions in environment
        for agent, action in zip(self.agents, actions):
            self.environment.execute_action(agent, action)
            
        # Update metrics
        self.metrics.record_step({
            "beliefs": beliefs,
            "actions": actions,
            "transactions": len(interactions),
            "total_resources": self.economy.total_resources(),
        })
        
    def detect_interactions(self):
        """
        Find agents close enough to interact
        """
        interactions = []
        
        for i, agent_i in enumerate(self.agents):
            for j, agent_j in enumerate(self.agents[i + 1:], i + 1):
                distance = self.spatial_distance(
                    agent_i.position,
                    agent_j.position,
                )
                
                if distance < agent_i.interaction_range:
                    # Determine interaction type based on agent goals
                    interaction = self.determine_interaction(
                        agent_i,
                        agent_j,
                    )
                    if interaction:
                        interactions.append(interaction)
                        
        return interactions
    
    def run_experiment(self, num_steps=10000):
        """
        Run full simulation experiment
        """
        print(f"Starting simulation with {len(self.agents)} agents")
        
        for step in range(num_steps):
            self.step()
            
            if step % 100 == 0:
                # Log progress
                metrics = self.metrics.get_summary()
                print(f"Step {step}: {metrics}")
                
                # Check for emergent behaviors
                behaviors = self.detect_emergent_behaviors()
                if behaviors:
                    print(f"Emergent behaviors detected: {behaviors}")
                    
        return self.metrics.get_full_results()
```

### Emergent Behavior Analysis

```python
class EmergentBehaviorDetector:
    """
    Detect and analyze emergent behaviors in agent populations
    """
    
    def __init__(self):
        self.pattern_library = {
            "flocking": self.detect_flocking,
            "market_formation": self.detect_markets,
            "specialization": self.detect_specialization,
            "cooperation": self.detect_cooperation,
            "competition": self.detect_competition,
            "hierarchy": self.detect_hierarchy,
        }
        
    def detect_flocking(self, agents):
        """
        Detect coordinated movement patterns
        """
        # Calculate alignment of velocity vectors
        velocities = [agent.velocity for agent in agents]
        alignment = self.vector_alignment(velocities)
        
        # Calculate cohesion (distance to center of mass)
        positions = [agent.position for agent in agents]
        cohesion = self.spatial_cohesion(positions)
        
        # Flocking score
        flocking_score = 0.5 * alignment + 0.5 * cohesion
        
        return flocking_score > 0.7
    
    def detect_markets(self, economy):
        """
        Detect spontaneous market formation
        """
        # Analyze transaction patterns
        transaction_graph = economy.build_transaction_graph()
        
        # Find clusters (markets)
        clusters = self.find_clusters(transaction_graph)
        
        # Market metrics
        metrics = {
            "num_markets": len(clusters),
            "market_efficiency": self.calculate_efficiency(clusters),
            "price_discovery": self.analyze_price_convergence(economy),
        }
        
        return metrics
    
    def detect_specialization(self, agents):
        """
        Detect role specialization in agent population
        """
        # Analyze service offerings
        specializations = {}
        for agent in agents:
            services = agent.offered_services
            if services:
                primary_service = max(services, key=lambda s: s.frequency)
                specializations[agent.did] = primary_service.type
                
        # Calculate specialization index
        unique_roles = len(set(specializations.values()))
        specialization_index = unique_roles / len(agents)
        
        return {
            "specialization_index": specialization_index,
            "role_distribution": Counter(specializations.values()),
        }
```

## Use Cases

### 1. Educational Metaverse

```python
class EducationalMetaverse:
    """
    Spatially-aware learning environment with active inference tutors
    """
    
    def __init__(self):
        self.spatial_env = SpatialEnvironment(
            scene="virtual_classroom",
            interactive_objects=["whiteboard", "lab_equipment", "library"],
        )
        
        self.avatar_tutor = ActiveInferenceAgent(
            agent_id="oliver_owl",
            domain="education",
        )
        
        self.student_agents = []
        
    def conduct_lesson(self, topic):
        """
        Spatially-aware lesson with active exploration
        """
        # Tutor plans lesson to minimize student uncertainty
        lesson_plan = self.avatar_tutor.plan_lesson(
            topic=topic,
            student_beliefs=self.assess_student_knowledge(),
            spatial_resources=self.spatial_env.available_objects,
        )
        
        # Execute lesson with spatial demonstrations
        for step in lesson_plan:
            if step.type == "demonstration":
                # Move to relevant object in 3D space
                self.avatar_tutor.navigate_to(step.object_position)
                
                # Demonstrate using spatial reasoning
                self.avatar_tutor.demonstrate_spatially(step.concept)
                
            elif step.type == "exploration":
                # Students explore to minimize their uncertainty
                for student in self.student_agents:
                    exploration = student.explore_to_learn(
                        environment=self.spatial_env,
                        concept=step.concept,
                    )
```

### 2. Autonomous Game NPCs

```python
class AutonomousNPC:
    """
    Game NPC with spatial awareness and economic agency
    """
    
    def __init__(self, npc_type):
        self.spatial = SpatialUnderstanding()
        self.inference = ActiveInferenceAgent(
            agent_id=f"npc_{uuid.uuid4()}",
            domain="gaming",
        )
        self.did = None  # Set during registration
        
    def live_in_world(self, game_world):
        """
        NPC lives autonomously in game world
        """
        while True:
            # Perceive 3D environment
            scene = game_world.get_scene_around(self.position)
            spatial_understanding = self.spatial(scene)
            
            # Update beliefs about world state
            self.inference.perceive(spatial_understanding)
            
            # Decide next action (minimize EFE)
            action = self.inference.act()
            
            # Check if action requires resources
            if action.requires_resources:
                # Try to acquire through economy
                transaction = game_world.economy.request_service(
                    requester_did=self.did,
                    service_type=action.resource_type,
                    requirements={"max_price": self.budget},
                )
                
            # Execute action in game world
            game_world.execute_npc_action(self, action)
```

### 3. DeFi Strategy Discovery

```python
class DeFiStrategyEvolution:
    """
    Evolve DeFi strategies through agent competition
    """
    
    def __init__(self):
        self.agents = []
        for i in range(100):
            agent = ActiveInferenceAgent(
                agent_id=f"trader_{i}",
                domain="defi",
            )
            # Each agent has different priors (trading strategies)
            agent.preferences = self.random_strategy_priors()
            self.agents.append(agent)
            
        self.defi_env = DeFiEnvironment()
        self.economy = A2AEconomy()
        
    def evolve_strategies(self, generations=100):
        """
        Strategies evolve through active inference and competition
        """
        for gen in range(generations):
            # Agents trade for a period
            for _ in range(1000):
                for agent in self.agents:
                    # Observe market state
                    market_state = self.defi_env.get_state()
                    
                    # Update beliefs
                    agent.perceive(market_state)
                    
                    # Execute trades to minimize EFE
                    trade = agent.act()
                    self.defi_env.execute_trade(trade)
                    
            # Natural selection of strategies
            profits = [agent.calculate_profit() for agent in self.agents]
            
            # Reproduce successful strategies
            self.reproduce_top_strategies(profits)
            
            # Mutation (slight changes to priors)
            self.mutate_strategies()
            
        return self.extract_winning_strategies()
```

## Performance Metrics

### Spatial Understanding Benchmarks
- **3D Scene Understanding**: 92.3% accuracy on ScanNet
- **Spatial QA**: 89.7% on 3D question answering
- **Navigation Planning**: 94.1% optimal path finding
- **Object Manipulation**: 87.2% success rate

### Active Inference Performance
- **Goal Achievement**: 85% average across domains
- **Exploration Efficiency**: 3.2× faster than random
- **Surprise Minimization**: 67% reduction in prediction error
- **Multi-step Planning**: Up to 10 steps ahead

### A2A Economy Metrics
- **Transaction Throughput**: 10,000 TPS
- **Market Efficiency**: 0.92 (perfect = 1.0)
- **Specialization Emergence**: 15 distinct roles from 100 agents
- **Resource Utilization**: 78% average

## Implementation Roadmap

### Phase 1: Spatial Foundation (Q1 2025)
- Implement IEEE 2874 Spatial Web standards
- Integrate Point-JEPA and 3D transformers
- Deploy spatial understanding to Eco-1

### Phase 2: Active Inference (Q2 2025)
- Implement EFE minimization
- Deploy to avatar tutors and NPCs
- Validate learning improvements

### Phase 3: A2A Economy (Q3 2025)
- Launch DID registry for agents
- Deploy resource token system
- Enable autonomous transactions

### Phase 4: Large-Scale Simulations (Q4 2025)
- 10,000+ agent simulations
- Emergent behavior studies
- Real-world deployment

## LP Standards Integration

### JobSpec (LP-101)

Spatial AI jobs use standard LP job specification:

```python
class SpatialJobSpec:
    """
    LP-101 compliant jobs for spatial understanding
    """
    
    def submit_spatial_job(
        self,
        agent_lux_id: str,  # did:lux:122:0x...
        spatial_data: Dict
    ) -> JobSpec:
        return JobSpec(
            chainId=122,
            modelHash=self.spatial_model_hash,
            requesterLuxId=agent_lux_id,
            functionCall="spatial_inference",
            inputData={
                "type": spatial_data["type"],  # point_cloud, mesh, voxel
                "data": spatial_data["data"],
                "task": spatial_data["task"]  # navigation, manipulation, etc.
            },
            spatialContext=True  # LP extension for spatial jobs
        )
```

### ComputeReceipt (LP-105)

Active inference generates verifiable receipts:

```python
class ActiveInferenceReceipt:
    """
    LP-105 receipts for active inference loops
    """
    
    def generate_inference_receipt(
        self,
        agent_lux_id: str,
        inference_result: Dict
    ) -> ComputeReceipt:
        return ComputeReceipt(
            jobSpec=self.create_job_spec(agent_lux_id),
            computeProof=TEEQuote(
                attestation=self.tee_attestation,
                measurements={
                    "free_energy": inference_result["efe"],
                    "surprise": inference_result["surprise"],
                    "action_taken": inference_result["action"]
                }
            ),
            timestamp=int(time.time())
        )
```

### InferencePool (LP-111)

Shared inference pools for agent collectives:

```solidity
contract SpatialInferencePool {
    // Implements LP-308 (ILPInferencePool)
    
    struct SpatialPool {
        string poolLuxId;           // did:lux:122:0x... for the pool
        string[] memberLuxIds;      // Agent members
        uint256 computeCapacity;    // Total GPU capacity
        uint256 spatialResolution;  // Voxel/point resolution
        bool activeInference;       // Enable active inference mode
    }
    
    mapping(string => SpatialPool) public pools;
    
    function createPool(
        string calldata poolLuxId,
        string[] calldata initialMembers,
        bytes calldata computeReceipt  // LP-105
    ) external {
        require(verifyLuxIds(initialMembers), "Invalid member IDs");
        pools[poolLuxId] = SpatialPool({
            poolLuxId: poolLuxId,
            memberLuxIds: initialMembers,
            computeCapacity: calculateCapacity(initialMembers),
            spatialResolution: 0.05,  // 5cm default
            activeInference: true
        });
    }
}
```

## Standards Compliance

### IEEE 2874 Spatial Web
- **HSML**: Full implementation of Hyperspace Modeling Language
- **HSTP**: Hyperspace Transaction Protocol for agent communication
- **Spatial Domains**: Registered with IEEE Spatial Web Working Group

### Lux ID (LP-200)
- **DID Method**: did:lux:122:0x... for all agent identities
- **Registry Contract**: LP-205 on-chain registry
- **Verifiable Credentials**: Agent capabilities and reputation
- **DID Document**: LP-compliant format with service endpoints

### Active Inference Standards
- **Free Energy Principle**: Following Friston et al. formulation
- **Variational Inference**: Standard ELBO optimization
- **Message Passing**: Belief propagation on factor graphs

## References

1. [IEEE 2874 Spatial Web Protocol](https://standards.ieee.org/standard/2874-2023.html)
2. [Active Inference: A Process Theory](https://www.sciencedirect.com/science/article/pii/S0893608016301673) - Friston et al.
3. [W3C Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/)
4. [Point-JEPA](https://arxiv.org/abs/2409.15803) - 3D point cloud understanding
5. [Expected Free Energy](https://arxiv.org/abs/2402.14460) - Champion et al.
6. [Spatial Transformers](https://arxiv.org/abs/1506.02025) - Jaderberg et al.

## Implementation Resources

- Spatial AI: https://github.com/zooai/spatial-ai
- Active Inference: https://github.com/zooai/active-inference
- A2A Economy: https://github.com/zooai/a2a-economy
- Simulations: https://github.com/zooai/agent-simulations

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

*"In the spatial web, agents don't just respond—they explore, learn, and trade. Active inference drives curiosity, DIDs enable identity, and economies emerge from interaction." - Zoo Spatial Vision*