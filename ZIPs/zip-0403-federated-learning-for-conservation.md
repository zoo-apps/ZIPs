---
zip: 0403
title: "Federated Learning for Conservation"
description: "Privacy-preserving federated learning protocol enabling conservation organizations to collaboratively train models without sharing raw data"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
created: 2025-01-15
tags: [federated-learning, conservation, privacy, differential-privacy, collaboration]
requires: [0400, 0401, 0402]
references: HIP-0067, HIP-0057, LP-7610
repository: https://github.com/zooai/fed-conservation
license: CC BY 4.0
---

# ZIP-403: Federated Learning for Conservation

## Abstract

This proposal defines the Federated Learning for Conservation (FLC) protocol, enabling wildlife conservation organizations, national parks, indigenous land management authorities, and citizen science networks to collaboratively train AI models without transferring raw data across organizational boundaries. FLC extends the DSO protocol (ZIP-0400) with organization-aware federation, heterogeneous device support (from edge sensors to cloud GPUs), and compliance mechanisms for data sovereignty regulations (GDPR, indigenous data sovereignty frameworks, CITES). The protocol implements HIP-0067 federated learning standards adapted for conservation-specific requirements: non-IID data distributions, extreme class imbalance (rare species), and intermittent connectivity in remote field sites.

## Motivation

Conservation AI faces a fundamental paradox: the organizations that most need shared AI models are the least able to share data.

1. **Data sovereignty**: Indigenous communities hold critical ecological knowledge and sensor data but rightfully demand control over their data. Traditional centralized training violates sovereignty principles.
2. **Legal restrictions**: CITES (Convention on International Trade in Endangered Species) restricts sharing of location data for critically endangered species to prevent poaching.
3. **Connectivity constraints**: Remote field stations in tropical forests, marine protected areas, and arctic reserves often have satellite-only internet with bandwidth measured in kbps.
4. **Non-IID distributions**: Each conservation site has a unique species assemblage. An Amazon camera trap network sees jaguars; a Serengeti network sees lions. Naive federated averaging degrades when data is this heterogeneous.
5. **Class imbalance**: The species that matter most (critically endangered) appear least often in training data. Standard federated learning amplifies this imbalance.

FLC addresses all five challenges with a purpose-built federation protocol.

## Specification

### 1. Federation Topology

```
                    +--------------------+
                    |  Zoo Federation    |
                    |  Coordinator       |
                    |  (on Zoo chain)    |
                    +---------+----------+
                              |
          +-------------------+-------------------+
          |                   |                   |
+---------+--------+ +--------+---------+ +-------+----------+
| Regional Hub:    | | Regional Hub:    | | Regional Hub:     |
| Africa           | | Americas         | | Asia-Pacific      |
| (Nairobi)        | | (Manaus)         | | (Singapore)       |
+---+-----+--------+ +---+-----+--------+ +---+------+-------+
    |     |               |     |               |      |
    v     v               v     v               v      v
 +----+ +----+         +----+ +----+         +----+ +----+
 |Site| |Site|         |Site| |Site|         |Site| |Site|
 | A  | | B  |         | C  | | D  |         | E  | | F  |
 +----+ +----+         +----+ +----+         +----+ +----+

Site = camera trap network, acoustic array, drone base, research station
```

### 2. Organization and Site Registration

```python
class FederationRegistry:
    """
    Register conservation organizations and their data sites.
    Each organization controls which sites participate and under what terms.
    """

    @dataclass
    class Organization:
        org_id: str
        name: str
        jurisdiction: str                    # Legal jurisdiction for data governance
        data_sovereignty_policy: str         # "full_control" | "share_gradients" | "share_aggregates"
        indigenous_authority: bool           # Whether indigenous data sovereignty applies
        min_privacy_epsilon: float           # Minimum privacy guarantee required
        bandwidth_tier: str                  # "broadband" | "satellite" | "intermittent"

    @dataclass
    class DataSite:
        site_id: str
        org_id: str
        location_region: str                 # Coarse region (not exact GPS)
        sensor_types: list[str]              # ["camera_trap", "acoustic", "drone"]
        species_assemblage: list[str]        # Known species at site
        data_volume_gb: float
        compute_available: str               # "edge_tpu" | "local_gpu" | "cloud"
        connectivity: str                    # "broadband" | "satellite_256kbps" | "batch_upload"

    def register_organization(self, org: Organization) -> str:
        """Register organization and return federation credentials."""
        verify_conservation_credentials(org)
        federation_key = generate_federation_key(org.org_id)
        store_organization(org)
        return federation_key

    def register_site(self, site: DataSite, org_key: str) -> str:
        """Register a data site under an organization."""
        verify_org_key(site.org_id, org_key)
        site_key = generate_site_key(site.site_id)
        store_site(site)
        return site_key
```

### 3. Heterogeneous Client Training

```python
class FLCClient:
    """
    Federated learning client adapted for conservation sites.
    Handles heterogeneous compute, connectivity, and data distributions.
    """

    def __init__(self, site: DataSite, model_config: ModelConfig):
        self.site = site
        self.local_data = LocalDataStore(site.site_id)
        self.model = self._select_model_variant(model_config)
        self.privacy_engine = DPEngine(epsilon=site.org.min_privacy_epsilon)

    def _select_model_variant(self, config: ModelConfig) -> nn.Module:
        """Select model size based on available compute."""
        if self.site.compute_available == "edge_tpu":
            return load_model(config.edge_variant)    # e.g., MobileNet-v4
        elif self.site.compute_available == "local_gpu":
            return load_model(config.standard_variant) # e.g., ViT-B/16
        else:
            return load_model(config.full_variant)     # e.g., ViT-L/14

    def train_local_round(
        self,
        global_model_state: dict,
        round_config: RoundConfig,
    ) -> FederatedUpdate:
        """
        Execute one local training round.
        Returns a compressed, privacy-protected model update.
        """
        # Load global model weights
        self.model.load_state_dict(global_model_state, strict=False)

        # Apply class-balanced sampling for rare species
        sampler = RareSpeciesBalancedSampler(
            self.local_data,
            rare_species_boost=round_config.rare_species_boost,
        )
        dataloader = DataLoader(
            self.local_data,
            batch_size=round_config.batch_size,
            sampler=sampler,
        )

        # Train with differential privacy
        self.model, optimizer = self.privacy_engine.make_private(
            self.model,
            SGD(self.model.parameters(), lr=round_config.lr),
            dataloader,
        )

        for epoch in range(round_config.local_epochs):
            for batch in dataloader:
                loss = self._compute_loss(batch)
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()

        # Compute model delta
        delta = compute_model_delta(global_model_state, self.model.state_dict())

        # Compress update based on bandwidth constraints
        compressed = self._compress_update(delta)

        # Get privacy spent
        epsilon_spent, delta_spent = self.privacy_engine.get_privacy_spent()

        return FederatedUpdate(
            site_id=self.site.site_id,
            delta=compressed,
            num_samples=len(self.local_data),
            species_distribution=self.local_data.get_species_counts(),
            privacy_spent=PrivacyBudget(epsilon_spent, delta_spent),
            compute_metrics=self._get_compute_metrics(),
        )

    def _compress_update(self, delta: dict) -> CompressedDelta:
        """Compress model update based on bandwidth constraints."""
        if self.site.connectivity == "broadband":
            # Full precision, top-k sparsification
            return topk_sparsify(delta, keep_ratio=0.1)
        elif self.site.connectivity == "satellite_256kbps":
            # 1-bit compression (sign only) + random rotation
            return signsgd_compress(delta)
        else:
            # Maximum compression: random sketch
            return count_sketch_compress(delta, sketch_size=10000)
```

### 4. Non-IID Aware Aggregation

```python
class FLCAggregator:
    """
    Aggregate federated updates from heterogeneous conservation sites.
    Handles non-IID species distributions via FedProx + species-aware weighting.
    """

    def aggregate_round(
        self,
        global_model: dict,
        updates: list[FederatedUpdate],
        round_config: RoundConfig,
    ) -> dict:
        # Step 1: Verify all privacy budgets are within policy
        for update in updates:
            org = get_organization(update.site_id)
            assert update.privacy_spent.epsilon <= org.min_privacy_epsilon

        # Step 2: Compute species-aware weights
        # Sites with rare species get higher weight to combat class imbalance
        weights = self._compute_species_weights(updates)

        # Step 3: Decompress all updates
        deltas = [decompress(u.delta) for u in updates]

        # Step 4: Robust aggregation (trimmed mean, not simple average)
        aggregated_delta = {}
        for param_name in deltas[0].keys():
            param_updates = [d[param_name] for d in deltas]
            param_weights = weights

            # Trimmed mean: remove top and bottom 10%
            aggregated_delta[param_name] = weighted_trimmed_mean(
                param_updates, param_weights, trim_ratio=0.1
            )

        # Step 5: Apply FedProx regularization
        new_model = {}
        for name, param in global_model.items():
            new_model[name] = param + round_config.server_lr * aggregated_delta.get(
                name, torch.zeros_like(param)
            )

        return new_model

    def _compute_species_weights(self, updates: list[FederatedUpdate]) -> list[float]:
        """
        Weight sites inversely proportional to their species commonality.
        Sites with critically endangered species observations get higher weight.
        """
        global_species_counts = {}
        for update in updates:
            for species, count in update.species_distribution.items():
                global_species_counts[species] = (
                    global_species_counts.get(species, 0) + count
                )

        total_observations = sum(global_species_counts.values())

        weights = []
        for update in updates:
            site_weight = 0
            for species, count in update.species_distribution.items():
                # Inverse frequency weighting
                species_freq = global_species_counts[species] / total_observations
                rarity_boost = 1.0 / max(species_freq, 0.001)

                # Conservation status bonus
                status = get_iucn_status(species)
                status_multiplier = {
                    "CR": 5.0,  # Critically Endangered
                    "EN": 3.0,  # Endangered
                    "VU": 2.0,  # Vulnerable
                    "NT": 1.5,  # Near Threatened
                    "LC": 1.0,  # Least Concern
                }.get(status, 1.0)

                site_weight += count * rarity_boost * status_multiplier

            weights.append(site_weight)

        # Normalize
        total_weight = sum(weights)
        return [w / total_weight for w in weights]
```

### 5. Intermittent Connectivity Support

```python
class AsynchronousFederation:
    """
    Support sites with intermittent connectivity via asynchronous updates.
    Sites can participate in federation even if they miss several rounds.
    """

    def __init__(self, staleness_threshold: int = 10):
        self.staleness_threshold = staleness_threshold
        self.pending_updates = {}  # site_id -> (round_submitted, update)
        self.current_round = 0

    def accept_stale_update(
        self,
        update: FederatedUpdate,
        submitted_at_round: int,
    ) -> bool:
        """Accept updates from sites that computed on older model versions."""
        staleness = self.current_round - submitted_at_round

        if staleness > self.staleness_threshold:
            return False  # Too stale, reject

        # Apply staleness discount
        discount = 1.0 / (1.0 + 0.1 * staleness)
        update.staleness_discount = discount

        self.pending_updates[update.site_id] = (submitted_at_round, update)
        return True

    def get_round_updates(self) -> list[FederatedUpdate]:
        """Collect all updates for current round, including stale ones."""
        updates = []
        for site_id, (round_num, update) in self.pending_updates.items():
            staleness = self.current_round - round_num
            if staleness <= self.staleness_threshold:
                # Scale weight by staleness discount
                update.weight_multiplier = update.staleness_discount
                updates.append(update)

        self.pending_updates.clear()
        return updates
```

### 6. Data Sovereignty Compliance

```python
class DataSovereigntyEngine:
    """
    Enforce data sovereignty policies throughout the federation.
    Supports GDPR, indigenous data sovereignty, and CITES requirements.
    """

    def verify_compliance(
        self,
        update: FederatedUpdate,
        org: Organization,
    ) -> ComplianceResult:
        checks = []

        # Check 1: Privacy budget compliance
        if update.privacy_spent.epsilon > org.min_privacy_epsilon:
            checks.append(ComplianceCheck(
                rule="privacy_budget",
                passed=False,
                detail=f"Epsilon {update.privacy_spent.epsilon} exceeds limit {org.min_privacy_epsilon}",
            ))
        else:
            checks.append(ComplianceCheck(rule="privacy_budget", passed=True))

        # Check 2: Data never leaves site (only gradients transmitted)
        if update.contains_raw_data():
            checks.append(ComplianceCheck(
                rule="data_locality",
                passed=False,
                detail="Update contains raw data; only gradients permitted",
            ))
        else:
            checks.append(ComplianceCheck(rule="data_locality", passed=True))

        # Check 3: CITES compliance for endangered species locations
        if org.jurisdiction in CITES_JURISDICTIONS:
            for species in update.species_distribution:
                if is_cites_listed(species) and update.contains_location_signal(species):
                    checks.append(ComplianceCheck(
                        rule="cites_location",
                        passed=False,
                        detail=f"Location signal detected for CITES-listed {species}",
                    ))

        # Check 4: Indigenous data sovereignty
        if org.indigenous_authority:
            if not update.has_community_consent_token():
                checks.append(ComplianceCheck(
                    rule="indigenous_consent",
                    passed=False,
                    detail="Missing community consent token for indigenous data",
                ))
            else:
                checks.append(ComplianceCheck(rule="indigenous_consent", passed=True))

        all_passed = all(c.passed for c in checks)
        return ComplianceResult(passed=all_passed, checks=checks)
```

### 7. On-Chain Federation Governance

```solidity
contract FLCGovernance {
    struct FederationRound {
        uint256 roundId;
        bytes32 globalModelHash;
        address[] participants;
        uint256[] contributions;     // Weighted contribution scores
        bytes32 complianceProof;     // Merkle root of compliance checks
        uint256 timestamp;
    }

    mapping(uint256 => FederationRound) public rounds;
    mapping(address => bool) public approvedOrganizations;

    event RoundCompleted(uint256 indexed roundId, uint256 numParticipants);
    event OrganizationJoined(address indexed org, string name);

    function completeRound(
        uint256 roundId,
        bytes32 newModelHash,
        address[] calldata participants,
        uint256[] calldata contributions,
        bytes32 complianceProof
    ) external onlyCoordinator {
        require(participants.length == contributions.length, "Length mismatch");

        // Verify all participants are approved organizations
        for (uint i = 0; i < participants.length; i++) {
            require(approvedOrganizations[participants[i]], "Unauthorized org");
        }

        rounds[roundId] = FederationRound({
            roundId: roundId,
            globalModelHash: newModelHash,
            participants: participants,
            contributions: contributions,
            complianceProof: complianceProof,
            timestamp: block.timestamp
        });

        emit RoundCompleted(roundId, participants.length);
    }
}
```

## Rationale

### Why not use DSO (ZIP-0400) directly?

DSO is a general-purpose decentralized training protocol. FLC adds three conservation-specific layers on top: (1) organization-aware governance with data sovereignty enforcement, (2) species-aware weighting to combat extreme class imbalance, and (3) asynchronous participation for sites with intermittent satellite connectivity. FLC uses DSO's semantic gradient encoding and Byzantine aggregation as building blocks.

### Why species-aware weighting?

A naive federated average would be dominated by sites with common species (e.g., deer from North American camera traps), while critically endangered species observations (e.g., Amur leopard from a single Russian site) would be statistically invisible. IUCN-status-weighted aggregation ensures rare species have proportional impact on the global model.

### Why support indigenous data sovereignty explicitly?

The CARE Principles for Indigenous Data Governance (Collective benefit, Authority to control, Responsibility, Ethics) require that indigenous communities maintain control over data collected on their lands. FLC's consent token mechanism provides cryptographic proof that community authority was exercised before any gradient was shared.

## Security Considerations

1. **Gradient inversion attacks**: All updates are protected by differential privacy (configurable epsilon per organization). Semantic projection (ZIP-0400) adds a second layer of protection.
2. **Membership inference**: An adversary cannot determine whether a specific image was in a site's training set given the site's model update, up to the configured privacy budget.
3. **Model poisoning via Sybil organizations**: Organization registration requires verifiable conservation credentials. The trimmed mean aggregation further tolerates up to 10% malicious participants.
4. **Compliance bypass**: All compliance checks are recorded as a Merkle tree on-chain. Any federation round can be audited by verifying the compliance proof against the recorded root.
5. **Connectivity-based denial**: Asynchronous federation ensures that sites with poor connectivity are not excluded from participation, preventing a digital divide in conservation AI.

## References

1. [HIP-0067: Federated Learning](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0067.md)
2. [HIP-0057: ML Pipeline Standards](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0057.md)
3. [LP-7610: AI Confidential Compute](https://github.com/luxfi/lps/blob/main/LPs/lp-7610.md)
4. [ZIP-0400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
5. [ZIP-0401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
6. [McMahan et al., "Communication-Efficient Learning of Deep Networks from Decentralized Data"](https://arxiv.org/abs/1602.05629)
7. [Li et al., "Federated Optimization in Heterogeneous Networks" (FedProx)](https://arxiv.org/abs/1812.06127)
8. [CARE Principles for Indigenous Data Governance](https://www.gida-global.org/care)
9. [GBIF Data Use Agreement](https://www.gbif.org/terms/data-user)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
