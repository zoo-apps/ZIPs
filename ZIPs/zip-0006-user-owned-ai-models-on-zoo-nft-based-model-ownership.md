---
zip: 0006
title: User-Owned AI Models on Zoo - NFT-Based Model Ownership
author: Zoo Team
type: Standards Track
category: Core
status: Draft
created: 2024-12-20
requires: ZIP-1, HIP-6, LP-102
---

# ZIP-6: User-Owned AI Models on Zoo - NFT-Based Model Ownership

## Abstract

This proposal establishes a system where Zoo users own their personalized AI models as NFTs. Each user's interactions with Zoo's DeFi, gaming, and NFT features create a unique AI model that learns their preferences, strategies, and style. These models are tokenized as NFTs, making them tradeable, leasable, and composable assets within the Zoo ecosystem.

## Motivation

Current Zoo users interact with generic AI models that don't learn or adapt:

1. **No Learning**: AI doesn't improve from user interactions
2. **No Ownership**: Users can't own their AI assistants
3. **No Value Capture**: User training data creates no value for them
4. **No Specialization**: Can't develop specialized trading/gaming AI
5. **No Portability**: AI knowledge locked to sessions

User-owned AI models solve this by making AI a personal asset that grows in value through use.

## Specification

### AI Model NFT Standard (ZRC-AI)

```solidity
interface IZRCAI is IERC721 {
    struct AIModelNFT {
        uint256 tokenId;
        address owner;
        bytes32 modelHash;       // IPFS hash of encrypted model
        uint256 generation;       // Model generation number
        uint256 trainingOps;      // Number of training operations
        uint256 performance;      // Performance score (0-10000)
        string specialization;    // "DeFi", "Gaming", "NFT", "General"
        uint256 lastUpdated;
    }
    
    // Core functions
    function mintModel(address to, bytes32 baseModel) external returns (uint256);
    function updateModel(uint256 tokenId, bytes32 newHash, bytes calldata proof) external;
    function forkModel(uint256 tokenId) external returns (uint256 newTokenId);
    function mergeModels(uint256[] calldata tokenIds) external returns (uint256);
    
    // Monetization
    function leaseModel(uint256 tokenId, address lessee, uint256 duration) external;
    function sellTrainingData(uint256 tokenId, address buyer) external payable;
    
    // Queries
    function getModelMetadata(uint256 tokenId) external view returns (AIModelNFT memory);
    function getModelPerformance(uint256 tokenId, string calldata task) external view returns (uint256);
}
```

### User Model Training in Zoo

```typescript
class ZooUserModel {
  constructor(userId: string, nftId: number) {
    this.userId = userId;
    this.nftId = nftId;
    this.model = new PersonalizedHLLM(baseModel: "HLLM-Zoo");
    this.specializations = new Map();
  }
  
  // DeFi Interaction Learning
  async learnFromDeFi(interaction: DeFiInteraction) {
    const training = {
      action: interaction.action,  // "swap", "provide_liquidity", "stake"
      tokens: interaction.tokens,
      amounts: interaction.amounts,
      outcome: interaction.profit,
      market_conditions: await getMarketData()
    };
    
    // Update model with DeFi strategy
    await this.model.finetune(training);
    
    // Record on ledger
    await ledger.recordTraining(this.nftId, training);
    
    // Update specialization
    this.specializations.set("DeFi", 
      (this.specializations.get("DeFi") || 0) + 1
    );
  }
  
  // Gaming Behavior Learning
  async learnFromGaming(gameSession: GameSession) {
    const training = {
      game: gameSession.gameId,
      actions: gameSession.actions,
      score: gameSession.score,
      strategy: gameSession.extractedStrategy(),
      preferences: gameSession.playerPreferences
    };
    
    await this.model.finetune(training);
    await ledger.recordTraining(this.nftId, training);
    
    this.specializations.set("Gaming",
      (this.specializations.get("Gaming") || 0) + 1
    );
  }
  
  // NFT Trading Learning
  async learnFromNFTTrading(trade: NFTTrade) {
    const training = {
      collection: trade.collection,
      traits: trade.nft.traits,
      price: trade.price,
      profit: trade.profit,
      market_timing: trade.timestamp,
      sentiment: await getSentimentData(trade.collection)
    };
    
    await this.model.finetune(training);
    await ledger.recordTraining(this.nftId, training);
    
    this.specializations.set("NFT",
      (this.specializations.get("NFT") || 0) + 1
    );
  }
}
```

### Model Specialization System

```solidity
contract ModelSpecialization {
    enum Specialization {
        DeFi_Yield_Optimizer,
        DeFi_Arbitrage_Bot,
        NFT_Valuation_Expert,
        NFT_Trend_Predictor,
        Game_Strategy_Master,
        Game_Economy_Optimizer,
        Social_Influencer,
        DAO_Governance_Analyst
    }
    
    struct SpecializationScore {
        Specialization type;
        uint256 score;           // 0-10000
        uint256 experience;      // Number of relevant interactions
        uint256 successRate;     // Success percentage * 100
        bytes32 certificateHash; // Proof of expertise
    }
    
    mapping(uint256 => SpecializationScore[]) public modelSpecializations;
    
    function earnSpecialization(
        uint256 modelId,
        Specialization spec,
        bytes calldata proof
    ) external {
        require(verifyExpertise(modelId, spec, proof), "Insufficient expertise");
        
        modelSpecializations[modelId].push(SpecializationScore({
            type: spec,
            score: calculateScore(proof),
            experience: getExperience(proof),
            successRate: getSuccessRate(proof),
            certificateHash: keccak256(proof)
        }));
        
        emit SpecializationEarned(modelId, spec);
    }
}
```

### Model Marketplace

```solidity
contract AIModelMarketplace {
    struct ModelListing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool forLease;
        uint256 leaseDuration;
        uint256 leasePrice;
        string[] specializations;
        uint256 performance;
    }
    
    mapping(uint256 => ModelListing) public listings;
    
    // Buy AI Model NFT
    function buyModel(uint256 tokenId) external payable {
        ModelListing memory listing = listings[tokenId];
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Transfer NFT
        IERC721(modelNFT).safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        // Transfer payment
        payable(listing.seller).transfer(msg.value);
        
        emit ModelSold(tokenId, listing.seller, msg.sender, msg.value);
    }
    
    // Lease AI Model for specific duration
    function leaseModel(uint256 tokenId, uint256 duration) external payable {
        ModelListing memory listing = listings[tokenId];
        require(listing.forLease, "Not available for lease");
        require(msg.value >= listing.leasePrice * duration, "Insufficient payment");
        
        // Create lease contract
        leases[tokenId] = Lease({
            lessee: msg.sender,
            expiry: block.timestamp + duration,
            payment: msg.value
        });
        
        emit ModelLeased(tokenId, msg.sender, duration, msg.value);
    }
}
```

### Model Composability

```typescript
class ComposableAIModels {
  // Merge multiple specialized models
  async mergeModels(modelIds: number[]): Promise<number> {
    const models = await Promise.all(
      modelIds.map(id => loadModel(id))
    );
    
    // Combine specializations
    const merged = new MergedModel();
    for (const model of models) {
      if (model.specialization === "DeFi") {
        merged.addDeFiExpertise(model);
      } else if (model.specialization === "Gaming") {
        merged.addGamingExpertise(model);
      } else if (model.specialization === "NFT") {
        merged.addNFTExpertise(model);
      }
    }
    
    // Mint new NFT for merged model
    const newNFT = await mintModelNFT(merged);
    return newNFT.tokenId;
  }
  
  // Create model ensemble
  async createEnsemble(modelIds: number[]): Promise<EnsembleModel> {
    return new EnsembleModel({
      models: modelIds,
      votingStrategy: "weighted_by_performance",
      specializations: await getSpecializations(modelIds)
    });
  }
}
```

### Training Rewards System

```solidity
contract TrainingRewards {
    uint256 constant REWARD_PER_TRAINING = 0.001 ether;
    uint256 constant QUALITY_MULTIPLIER = 2;
    
    mapping(uint256 => uint256) public modelRewards;
    mapping(address => uint256) public userRewards;
    
    function rewardTraining(
        uint256 modelId,
        bytes calldata trainingData,
        bytes calldata qualityProof
    ) external {
        uint256 quality = verifyQuality(qualityProof);
        uint256 reward = REWARD_PER_TRAINING * quality / 100;
        
        modelRewards[modelId] += reward;
        userRewards[ownerOf(modelId)] += reward;
        
        emit TrainingRewarded(modelId, reward);
    }
    
    function claimRewards(uint256 modelId) external {
        require(ownerOf(modelId) == msg.sender, "Not owner");
        
        uint256 rewards = modelRewards[modelId];
        modelRewards[modelId] = 0;
        
        payable(msg.sender).transfer(rewards);
    }
}
```

### Integration with Zoo Features

```typescript
// DeFi Integration
class DeFiAIAssistant {
  constructor(private modelNFT: number) {}
  
  async suggestYieldStrategy(capital: BigNumber): Promise<Strategy> {
    const model = await loadModel(this.modelNFT);
    return model.predict({
      task: "yield_optimization",
      capital,
      risk_tolerance: await getUserRiskProfile(),
      market_conditions: await getMarketData()
    });
  }
}

// Gaming Integration  
class GameAICompanion {
  constructor(private modelNFT: number) {}
  
  async playAsNPC(): Promise<void> {
    const model = await loadModel(this.modelNFT);
    
    // Model controls NPC behavior
    while (gameActive) {
      const action = await model.decideAction(gameState);
      await executeAction(action);
    }
  }
}

// NFT Creation Integration
class NFTAICreator {
  constructor(private modelNFT: number) {}
  
  async generateNFTCollection(theme: string): Promise<Collection> {
    const model = await loadModel(this.modelNFT);
    
    return model.generate({
      type: "nft_collection",
      theme,
      size: 10000,
      traits: await generateTraits(theme),
      style: await getUserStylePreference()
    });
  }
}
```

## Rationale

### Why NFT-Based Ownership?

- **True Ownership**: Users own their AI as an asset
- **Tradeable**: Can sell trained models
- **Leasable**: Passive income from model rental
- **Composable**: Combine models for super-intelligence
- **Verifiable**: On-chain proof of model performance

### Why Per-User Instead of Generic?

- **Personalization**: AI learns user's specific strategies
- **Privacy**: User data stays with user's model
- **Value Capture**: Users benefit from their training
- **Specialization**: Develop expertise in specific areas

## Implementation Phases

### Phase 1: Basic NFT Models (Q1 2025)
- NFT minting for AI models
- Basic training recording
- Simple marketplace

### Phase 2: Specialization System (Q2 2025)
- DeFi/Gaming/NFT specializations
- Performance tracking
- Leasing functionality

### Phase 3: Advanced Features (Q3 2025)
- Model merging/composition
- Training rewards
- Cross-game portability

### Phase 4: Full Ecosystem (Q4 2025)
- AI-to-AI marketplace
- Autonomous AI agents
- DAO governance by AI

## Security Considerations

- Model NFTs use same PQC security as Zoo
- Encrypted model storage on IPFS
- Zero-knowledge training proofs
- Anti-gaming mechanisms for rewards

## Reference Implementation

**Repository**: [zooai/model-nfts](https://github.com/zooai/model-nfts)

**Key Files**:
- `/contracts/AIModelNFT.sol` - ERC-721 NFT for AI models
- `/contracts/ModelMarketplace.sol` - Trading marketplace for AI model NFTs
- `/contracts/TrainingRewards.sol` - Reward distribution for model training
- `/storage/ipfs_storage.py` - Encrypted model storage on IPFS
- `/training/model_evolution.py` - Track model evolution from Newborn to Master
- `/ownership/transfer.sol` - Secure model ownership transfer
- `/zkml/training_proofs.py` - Zero-knowledge proofs for training verification
- `/api/model_api.ts` - API for model querying and management
- `/sdk/typescript/` - SDK for integrating user-owned models
- `/valuation/model_valuation.py` - Model value estimation algorithms
- `/tests/ownership_tests.sol` - Ownership and transfer test suite
- `/docs/user_guide.md` - Guide for model owners

**Status**: In Development (Alpha Q2 2025)

**NFT Metadata Schema**:
- Model ID and version
- Training operation count
- Specialization domains
- Performance metrics
- Ownership history

**Integration Points**:
- ZIP-1 HLLM personalization
- ZIP-3 Eco-1 model architecture
- ZIP-7 BitDelta weight storage
- LP-102 Immutable Training Ledger

## References

1. [ZIP-1: HLLMs for Zoo](./zip-1.md)
2. [HIP-6: Per-User Fine-Tuning](https://github.com/hanzoai/hips/blob/main/HIPs/hip-6.md)
3. [LP-102: Immutable Training Ledger](https://github.com/luxfi/lps/blob/main/LPs/lp-102.md)
4. [ERC-721: NFT Standard](https://eips.ethereum.org/EIPS/eip-721)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).