# ZIP: GYM Protocol - Generalized Yield Mining for GSPO Training

## Abstract

The GYM (Generalized Yield Mining) protocol enables decentralized GSPO (Group Sequence Policy Optimization) training for large language models through a ring-topology network of compute nodes. Participants earn rewards by contributing GPU compute for model training and validation.

## Motivation

Traditional centralized AI training faces several challenges:
- High compute costs concentrated in single organizations
- Lack of transparency in training processes
- Limited access to high-quality models
- Centralized control over model evolution

GYM protocol addresses these by:
- Distributing training across multiple nodes
- Providing cryptographic proof of training contributions
- Enabling community-driven model improvement
- Creating economic incentives for compute providers

## Specification

### Core Components

#### 1. Training Orchestrator (hanzod)
- Manages job scheduling and ring topology
- Validates training deltas using Ed25519 signatures
- Coordinates checkpoint aggregation
- Publishes models to IPFS/HuggingFace

#### 2. Compute Nodes (Workers)
- Run GSPO training on model shards
- Generate and sign training deltas
- Participate in ring all-reduce for gradient aggregation
- Submit proofs of compute to earn rewards

#### 3. Delta Format
Binary serialization format for model updates:
```
Header (24 bytes):
  - Magic: 0x44454C5441 (5 bytes)
  - Version: uint8
  - Compression: uint8
  - Flags: uint8
  - Checksum: [16 bytes]

Tensors:
  - Name length: uint32
  - Name: string
  - Dtype: uint8
  - Shape rank: uint8
  - Shape: [uint64]
  - Data: compressed bytes
```

### Ring All-Reduce Protocol

#### Phase 1: Scatter-Reduce
Each node sends its chunk to the next node in ring:
```
Node 0 -> Node 1: chunk_0
Node 1 -> Node 2: chunk_1  
Node 2 -> Node 0: chunk_2
```

#### Phase 2: All-Gather
Aggregated chunks propagate through ring:
```
Node 0 -> Node 1: aggregated_chunk_2
Node 1 -> Node 2: aggregated_chunk_0
Node 2 -> Node 0: aggregated_chunk_1
```

### GSPO Training Parameters

```python
class GSPOConfig:
    importance_sampling_level: str = "sequence"  # For MoE models
    beta: float = 0.1                           # KL penalty
    group_size: int = 8                         # Batch grouping
    aggregate_interval: int = 50                # Steps between syncs
    use_4bit: bool = True                       # Quantization
    lora_rank: int = 16                         # LoRA adapter rank
```

### Reward Calculation

Nodes earn GYM tokens based on:
1. **Compute Contribution** (60%)
   - FLOPs contributed
   - GPU hours
   - Memory bandwidth utilized

2. **Delta Quality** (30%)
   - Validation loss improvement
   - Gradient norm stability
   - Convergence contribution

3. **Network Participation** (10%)
   - Uptime and availability
   - Ring topology maintenance
   - Checkpoint validation

### Security Model

#### Post-Quantum Cryptography
- **Key Exchange**: ML-KEM-768 (Kyber)
- **Signatures**: ML-DSA-87 (Dilithium)
- **Symmetric**: AES-256-GCM

#### Delta Authentication
Each delta includes:
- Ed25519 signature from worker
- SHA3-256 hash of model state
- Timestamp and sequence number
- Hardware attestation proof

### Economic Model

#### Token Distribution
- **Mining Rewards**: 40% (distributed to compute nodes)
- **Staking Rewards**: 20% (validators and orchestrators)
- **Development**: 15% (protocol improvements)
- **Community**: 15% (governance and grants)
- **Reserve**: 10% (emergency fund)

#### Staking Requirements
- **Compute Nodes**: 10,000 GYM minimum stake
- **Orchestrators**: 50,000 GYM minimum stake
- **Validators**: 25,000 GYM minimum stake

### Supported Models

Initial support for Qwen family:
- Qwen3-2507 (80B params, 3B active)
- Qwen3-Next series
- QwQ-32B-Preview

Future expansions:
- Llama 3.x models
- Mistral/Mixtral MoE
- Custom fine-tunes

## Implementation

### Docker Deployment
```yaml
services:
  trainer:
    image: hanzo/gym-trainer:latest
    environment:
      - MODEL_NAME=Qwen/Qwen3-2507
      - USE_4BIT=true
      - IMPORTANCE_SAMPLING_LEVEL=sequence
      - GSPO_BETA=0.1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              capabilities: [gpu]
```

### Python Integration
```python
from gym_protocol import GSPOTrainer, DeltaWriter

trainer = GSPOTrainer(
    model_name="Qwen/Qwen3-2507",
    use_4bit=True,
    ring_position=0
)

# Train and generate delta
delta = trainer.train_epoch(dataset)
writer = DeltaWriter("delta.bin")
writer.write_delta(delta)
cid = writer.upload_ipfs()

# Claim rewards
trainer.claim_rewards(cid, proof_of_work)
```

### Rust Orchestrator
```rust
use hanzod::{GspoOrchestrator, RingTopology};

let orchestrator = GspoOrchestrator::new(
    ipfs_url: "http://ipfs:5001",
    redis_url: "redis://redis:6379"
);

// Create ring topology
let ring = orchestrator.create_ring_topology(
    workers: vec![node_a, node_b, node_c],
    redundancy: 1
);

// Start training job
let job = orchestrator.start_job(
    model: "Qwen3-2507",
    dataset: dataset_cid,
    epochs: 10
);
```

## Rationale

### Why Ring Topology?
- Bandwidth efficient: O(1) communication per node
- Fault tolerant: Can reconfigure on node failure
- Scalable: Works with 3-1000+ nodes
- Proven: Used by major ML frameworks (Horovod, NCCL)

### Why GSPO over GRPO?
- Better for MoE models with sparse activation
- Sequence-level importance sampling
- More stable training dynamics
- Superior final model quality

### Why 4-bit Quantization?
- 75% memory reduction
- Enables larger models on consumer GPUs
- Minimal quality loss with QLoRA
- Faster training iterations

## Test Vectors

### Delta Validation
```python
# Valid delta structure
delta = {
    "header": {
        "magic": b"DELTA",
        "version": 1,
        "compression": "lz4",
        "checksum": "sha3_256_hash"
    },
    "tensors": {
        "lora.q_proj.weight": torch.tensor([...]),
        "lora.k_proj.weight": torch.tensor([...])
    },
    "metadata": {
        "timestamp": "2024-01-01T00:00:00Z",
        "epoch": 1,
        "loss": 2.34,
        "worker_id": "worker-a"
    }
}
```

### Ring Communication
```
# Round 1: worker-a -> worker-b
Message {
    phase: "scatter_reduce",
    chunk_id: 0,
    data: encrypted_gradient_chunk,
    signature: ed25519_sig
}

# Round 2: worker-b aggregates and forwards
Message {
    phase: "all_gather", 
    chunk_id: 0,
    data: aggregated_gradient,
    signatures: [sig_a, sig_b]
}
```

## Security Considerations

1. **Sybil Attacks**: Require staking and hardware attestation
2. **Data Poisoning**: Validate deltas against baseline metrics
3. **Network Partitions**: Implement view change protocol
4. **Model Theft**: Encrypt model weights in transit
5. **Gradient Inversion**: Add differential privacy noise

## Future Work

- Multi-model training orchestration
- Federated learning integration  
- Zero-knowledge training proofs
- Cross-chain reward distribution
- Decentralized model marketplace

## References

- [GSPO Paper](https://arxiv.org/abs/gspo)
- [Ring All-Reduce](https://tech.preferred.jp/en/blog/technologies-behind-distributed-deep-learning-allreduce/)
- [Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Unsloth Framework](https://github.com/unslothai/unsloth)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)