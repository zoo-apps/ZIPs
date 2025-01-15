---
zip: 0402
title: "Proof of AI (PoAI) Consensus"
description: "Consensus mechanism where validators prove useful AI computation for conservation and ecological analysis"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
created: 2025-01-15
tags: [proof-of-ai, consensus, ai-mining, validation, conservation]
requires: [0400, 0401]
references: HIP-0043, LP-7200, LP-7000, LP-7610
repository: https://github.com/zooai/poai-consensus
license: CC BY 4.0
---

# ZIP-402: Proof of AI (PoAI) Consensus

## Abstract

This proposal specifies the Proof of AI (PoAI) consensus mechanism for the Zoo network. PoAI replaces wasteful proof-of-work computation with **useful AI work** -- species detection, habitat analysis, climate modeling, and biodiversity assessment. Validators earn block rewards by completing verifiable AI inference and training tasks that directly serve conservation goals. The mechanism adapts LP-7200 (AI Mining) concepts to the Zoo ecosystem, using LP-7610 confidential compute enclaves for result integrity and LP-7000 attestation chains for provenance. PoAI ensures that every unit of computation spent securing the Zoo network simultaneously advances wildlife conservation.

## Motivation

Traditional blockchain consensus mechanisms waste enormous computational resources:

1. **Proof of Work**: Bitcoin consumes ~150 TWh/year on hash puzzles with no secondary utility.
2. **Proof of Stake**: Capital-efficient but provides no computational benefit beyond security.
3. **Proof of useful work** (existing proposals): Typically limited to narrow mathematical problems (Primecoin, Chia plotting) that do not serve broader societal needs.

Zoo's conservation mission demands that network security costs are not simply burnt but redirected to advance ecological science:

- **30 million** camera trap images generated daily need automated classification.
- **500+ PB** of satellite imagery remains unanalyzed for habitat change detection.
- **DSO training rounds** (ZIP-0400) require validated compute for gradient verification.
- **Species distribution models** need continuous retraining as climate shifts ranges.

PoAI turns all of this queued conservation compute into the work that secures the network.

## Specification

### 1. Task Categories

PoAI organizes useful work into four task categories with associated difficulty levels:

```python
class PoAITaskCategory(Enum):
    INFERENCE = "inference"          # Run model inference on sensor data
    TRAINING = "training"            # Contribute to DSO training rounds
    ANALYSIS = "analysis"            # Habitat/climate analysis tasks
    VERIFICATION = "verification"    # Verify other validators' results
```

| Category | Difficulty | Reward Multiplier | Example |
|----------|-----------|-------------------|---------|
| INFERENCE | Low | 1.0x | Classify 1000 camera trap images |
| TRAINING | Medium | 2.5x | Complete 1 DSO training round |
| ANALYSIS | High | 4.0x | Process 100km2 satellite habitat map |
| VERIFICATION | Variable | 1.5x | Re-run and verify 10 inference tasks |

### 2. Validator Registration

```solidity
contract PoAIValidatorRegistry {
    struct Validator {
        address operator;
        bytes32 teePublicKey;       // LP-7610 enclave key
        uint256 stakeAmount;        // Minimum 10,000 ZOO
        uint256 computeCapacity;    // TFLOPS available
        uint256 reputationScore;    // Earned through correct work
        TaskCategory[] capabilities;
        bool active;
    }

    uint256 public constant MIN_STAKE = 10_000 * 1e18; // 10,000 ZOO
    mapping(address => Validator) public validators;

    event ValidatorRegistered(address indexed operator, uint256 computeTFLOPS);
    event ValidatorSlashed(address indexed operator, uint256 amount, string reason);

    function register(
        bytes32 teePublicKey,
        uint256 computeCapacity,
        TaskCategory[] calldata capabilities,
        bytes calldata teeAttestation
    ) external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(verifyTEEAttestation(teeAttestation, teePublicKey), "Invalid TEE");
        require(computeCapacity >= 10, "Minimum 10 TFLOPS required");

        validators[msg.sender] = Validator({
            operator: msg.sender,
            teePublicKey: teePublicKey,
            stakeAmount: msg.value,
            computeCapacity: computeCapacity,
            reputationScore: 100, // Initial reputation
            capabilities: capabilities,
            active: true
        });

        emit ValidatorRegistered(msg.sender, computeCapacity);
    }
}
```

### 3. Task Assignment Protocol

```python
class TaskAssigner:
    """
    Assign conservation AI tasks to validators based on capability,
    reputation, and stake-weighted random selection.
    """

    def assign_epoch_tasks(
        self,
        epoch_id: int,
        task_queue: list[PoAITask],
        validators: list[Validator],
    ) -> dict[str, list[PoAITask]]:
        assignments = {}

        for task in task_queue:
            # Filter validators capable of this task category
            eligible = [
                v for v in validators
                if task.category in v.capabilities
                and v.compute_capacity >= task.compute_requirement
                and v.active
            ]

            if not eligible:
                continue

            # Stake-weighted random selection with reputation bonus
            weights = [
                v.stake_amount * (v.reputation_score / 100.0)
                for v in eligible
            ]
            selected = weighted_random_choice(
                eligible, weights, seed=hash(epoch_id, task.task_id)
            )

            # Assign task with redundancy (k validators for verification)
            k = task.redundancy_factor  # Usually 3
            assigned_validators = weighted_random_sample(eligible, weights, k=k)

            for v in assigned_validators:
                assignments.setdefault(v.operator, []).append(task)

        return assignments
```

### 4. Work Execution in Confidential Enclaves

```python
class PoAIExecutor:
    """
    Execute AI tasks inside LP-7610 confidential compute enclaves.
    Results include cryptographic proof of correct execution.
    """

    def __init__(self, enclave: TEEEnclave):
        self.enclave = enclave
        self.model_cache = {}

    def execute_task(self, task: PoAITask) -> PoAIResult:
        # Load model inside enclave
        model = self._load_model_in_enclave(task.model_id)

        # Execute task based on category
        if task.category == PoAITaskCategory.INFERENCE:
            output = self._run_inference(model, task.input_data)
        elif task.category == PoAITaskCategory.TRAINING:
            output = self._run_training_round(model, task.training_config)
        elif task.category == PoAITaskCategory.ANALYSIS:
            output = self._run_analysis(model, task.analysis_params)
        elif task.category == PoAITaskCategory.VERIFICATION:
            output = self._verify_result(task.original_result, model, task.input_data)

        # Generate enclave attestation
        attestation = self.enclave.generate_attestation(
            input_hash=hash(task.input_data),
            output_hash=hash(output),
            model_hash=hash(model.state_dict()),
            execution_time=output.elapsed_ms,
        )

        return PoAIResult(
            task_id=task.task_id,
            output=output,
            attestation=attestation,
            compute_used_tflops=output.compute_tflops,
            validator=self.enclave.public_key,
        )

    def _run_inference(self, model, input_data) -> InferenceOutput:
        """Run species detection / classification inference."""
        predictions = model.predict(input_data)
        return InferenceOutput(
            predictions=predictions,
            elapsed_ms=timer.elapsed(),
            compute_tflops=estimate_tflops(model, input_data),
        )
```

### 5. Result Verification and Consensus

```python
class PoAIConsensus:
    """
    Achieve consensus on AI task results using redundant execution
    and statistical agreement checking.
    """

    def verify_task_results(
        self,
        task: PoAITask,
        results: list[PoAIResult],
    ) -> ConsensusResult:
        # Verify all TEE attestations
        verified_results = []
        for result in results:
            if verify_tee_attestation(result.attestation):
                verified_results.append(result)

        if len(verified_results) < 2:
            return ConsensusResult(status="insufficient_results")

        # Check agreement among verified results
        if task.category == PoAITaskCategory.INFERENCE:
            agreement = self._check_inference_agreement(verified_results)
        elif task.category == PoAITaskCategory.TRAINING:
            agreement = self._check_training_agreement(verified_results)
        else:
            agreement = self._check_generic_agreement(verified_results)

        # Determine consensus
        if agreement.score >= 0.8:  # 80% agreement threshold
            return ConsensusResult(
                status="accepted",
                canonical_result=agreement.majority_result,
                agreeing_validators=[r.validator for r in agreement.agreeing],
                disagreeing_validators=[r.validator for r in agreement.disagreeing],
            )
        else:
            return ConsensusResult(
                status="disputed",
                escalation_required=True,
            )

    def _check_inference_agreement(self, results: list[PoAIResult]) -> Agreement:
        """Check if inference outputs agree within tolerance."""
        predictions = [r.output.predictions for r in results]

        # For classification: majority vote on top-1 label
        top_labels = [p[0].species for p in predictions]
        label_counts = Counter(top_labels)
        majority_label, majority_count = label_counts.most_common(1)[0]

        # For confidence: check relative deviation < 10%
        confidences = [p[0].confidence for p in predictions]
        mean_conf = sum(confidences) / len(confidences)
        deviation = max(abs(c - mean_conf) for c in confidences) / mean_conf

        agreeing = [r for r, l in zip(results, top_labels) if l == majority_label]

        return Agreement(
            score=majority_count / len(results),
            majority_result=agreeing[0].output,
            agreeing=agreeing,
            disagreeing=[r for r in results if r not in agreeing],
        )
```

### 6. Reward Distribution

```solidity
contract PoAIRewards {
    uint256 public constant BASE_BLOCK_REWARD = 100 * 1e18; // 100 ZOO per block
    uint256 public constant VERIFICATION_BONUS = 150; // 1.5x in basis points / 100

    struct EpochReward {
        uint256 epochId;
        uint256 totalReward;
        mapping(address => uint256) validatorRewards;
    }

    mapping(uint256 => EpochReward) public epochRewards;

    function distributeRewards(
        uint256 epochId,
        address[] calldata validators,
        uint256[] calldata taskScores,
        TaskCategory[] calldata categories
    ) external onlyConsensus {
        uint256 totalPool = BASE_BLOCK_REWARD * blocksInEpoch(epochId);
        uint256 totalWeightedScore = 0;

        // Calculate weighted scores
        uint256[] memory weightedScores = new uint256[](validators.length);
        for (uint i = 0; i < validators.length; i++) {
            uint256 multiplier = getCategoryMultiplier(categories[i]);
            weightedScores[i] = taskScores[i] * multiplier;
            totalWeightedScore += weightedScores[i];
        }

        // Distribute proportionally
        for (uint i = 0; i < validators.length; i++) {
            uint256 reward = (totalPool * weightedScores[i]) / totalWeightedScore;
            epochRewards[epochId].validatorRewards[validators[i]] = reward;
            payable(validators[i]).transfer(reward);
        }
    }

    function getCategoryMultiplier(TaskCategory cat) internal pure returns (uint256) {
        if (cat == TaskCategory.INFERENCE) return 100;
        if (cat == TaskCategory.TRAINING) return 250;
        if (cat == TaskCategory.ANALYSIS) return 400;
        if (cat == TaskCategory.VERIFICATION) return 150;
        return 100;
    }
}
```

### 7. Slashing Conditions

Validators are penalized for:

```python
class SlashingEngine:
    """
    Detect and penalize dishonest or negligent validators.
    """

    SLASHING_RULES = {
        "incorrect_result": 0.10,      # 10% stake slash
        "attestation_forgery": 1.00,   # 100% stake slash (permanent ban)
        "repeated_timeout": 0.05,      # 5% stake slash
        "collusion_detected": 0.50,    # 50% stake slash
    }

    def evaluate_slashing(
        self,
        validator: Validator,
        consensus_result: ConsensusResult,
    ) -> SlashingDecision:
        if validator.operator in consensus_result.disagreeing_validators:
            # Check if disagreement is honest (close to threshold) or malicious
            result = get_validator_result(validator, consensus_result.task_id)
            deviation = compute_result_deviation(
                result, consensus_result.canonical_result
            )

            if deviation > 0.5:  # Wildly different result
                return SlashingDecision(
                    rule="incorrect_result",
                    slash_fraction=self.SLASHING_RULES["incorrect_result"],
                    evidence=f"Deviation {deviation:.2f} exceeds threshold 0.5",
                )

        return SlashingDecision(rule=None, slash_fraction=0.0)
```

### 8. Task Queue Management

```python
class ConservationTaskQueue:
    """
    Manage the global queue of conservation AI tasks.
    Tasks are sourced from:
    - Camera trap networks (automated upload)
    - Satellite imagery providers (scheduled analysis)
    - DSO training rounds (ZIP-0400 integration)
    - Conservation agency requests (priority queue)
    """

    def __init__(self):
        self.priority_queue = PriorityQueue()
        self.sources = {
            "camera_traps": CameraTrapSource(),
            "satellite": SatelliteSource(),
            "dso_rounds": DSOSource(),
            "agency_requests": AgencyRequestSource(),
        }

    def generate_epoch_tasks(self, epoch_id: int) -> list[PoAITask]:
        tasks = []

        # High priority: agency requests (e.g., poaching alerts)
        for req in self.sources["agency_requests"].pending():
            tasks.append(PoAITask(
                category=PoAITaskCategory.INFERENCE,
                priority=10,
                input_data=req.data,
                model_id=req.required_model,
                redundancy_factor=5,  # High redundancy for critical tasks
            ))

        # Medium priority: DSO training rounds
        for round_config in self.sources["dso_rounds"].pending():
            tasks.append(PoAITask(
                category=PoAITaskCategory.TRAINING,
                priority=5,
                training_config=round_config,
                redundancy_factor=3,
            ))

        # Normal priority: camera trap backlogs
        for batch in self.sources["camera_traps"].next_batches(max_batches=100):
            tasks.append(PoAITask(
                category=PoAITaskCategory.INFERENCE,
                priority=1,
                input_data=batch,
                model_id="zoo-megadetector-v6",
                redundancy_factor=3,
            ))

        return sorted(tasks, key=lambda t: -t.priority)
```

## Rationale

### Why useful work instead of pure PoS?

Pure PoS secures the network but wastes the computational capacity of validators. PoAI validators must maintain GPU infrastructure anyway for staking. By directing that compute toward conservation tasks, Zoo produces tangible ecological value with every block.

### Why TEE enclaves for execution?

AI inference is non-deterministic across hardware platforms (floating-point rounding differences). TEE enclaves provide a controlled execution environment where results are reproducible and attestable. This eliminates disputes arising from legitimate hardware differences.

### Why redundant execution (k=3) instead of zero-knowledge proofs?

ZK proofs for general AI inference are currently impractical (proving a single transformer forward pass would take hours). Redundant execution with TEE attestation provides practical verification at acceptable cost. As ZK-ML matures, the redundancy factor can be reduced.

## Security Considerations

1. **Task grinding**: Validators cannot choose which tasks to execute. Assignment is deterministic based on stake-weighted randomness seeded by the epoch hash.
2. **Result manipulation**: TEE attestations bind outputs to specific inputs and model versions. Forging attestation requires compromising the enclave hardware.
3. **Sybil attacks**: Minimum stake of 10,000 ZOO makes Sybil attacks expensive. Reputation scores further discount new validators.
4. **Collusion**: If multiple validators collude to submit identical wrong answers, the verification task category catches this via independent re-execution.
5. **DoS on task queue**: Task submission requires a small fee (1 ZOO) to prevent queue flooding. Conservation agencies with verified credentials are exempted.

## Test Cases

```python
def test_poai_epoch_completion():
    """Verify an epoch produces valid consensus on all tasks."""
    validators = register_test_validators(n=20, stake=10000)
    tasks = generate_test_tasks(n=50)

    assignments = TaskAssigner().assign_epoch_tasks(0, tasks, validators)
    results = {}
    for v, v_tasks in assignments.items():
        for task in v_tasks:
            results.setdefault(task.task_id, []).append(
                PoAIExecutor(v.enclave).execute_task(task)
            )

    consensus = PoAIConsensus()
    for task_id, task_results in results.items():
        c = consensus.verify_task_results(tasks[task_id], task_results)
        assert c.status == "accepted"

def test_byzantine_validator_slashing():
    """Verify malicious validator is slashed."""
    honest = [create_honest_result() for _ in range(9)]
    malicious = create_malicious_result()  # Wildly wrong output

    consensus = PoAIConsensus().verify_task_results(
        task, honest + [malicious]
    )
    assert consensus.status == "accepted"
    assert malicious.validator in consensus.disagreeing_validators

    slash = SlashingEngine().evaluate_slashing(
        get_validator(malicious.validator), consensus
    )
    assert slash.slash_fraction == 0.10  # 10% stake slashed
```

## References

1. [LP-7200: AI Mining](https://github.com/luxfi/lps/blob/main/LPs/lp-7200.md)
2. [LP-7610: AI Confidential Compute](https://github.com/luxfi/lps/blob/main/LPs/lp-7610.md)
3. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lps/blob/main/LPs/lp-7000.md)
4. [HIP-0043: LLM Inference](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0043.md)
5. [ZIP-0400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
6. [ZIP-0401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
7. [Ball et al., "Proofs of Useful Work"](https://eprint.iacr.org/2017/203)
8. [Bravo-Marquez et al., "Proof of Learning: Definitions and Practice"](https://arxiv.org/abs/2103.05633)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
