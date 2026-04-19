# Zoo Improvement Proposals (ZIPs)

Master index mapping all Zoo papers and specifications to their ZIP numbers,
traced from the October 2021 whitepaper through current implementation.

Governance site: [zips.zoo.ngo](https://zips.zoo.ngo)

## Status Key

- **Final**: Accepted and implemented
- **Active**: Deployed and maintained
- **Draft**: Under development
- **Review**: Community review
- **Living**: Continuously updated

## Number Ranges

| Range | Category |
|-------|----------|
| 0000-0099 | Core Protocol |
| 0100-0199 | DeFi |
| 0200-0299 | NFT Standards |
| 0300-0399 | Gaming |
| 0400-0499 | AI/ML |
| 0500-0599 | Conservation |
| 0600-0699 | DeSci (Decentralized Science) |
| 0700-0799 | Token Standards (ZRC) |
| 0800-0899 | Infrastructure (Bridge, Settlement, Replication) |

---

## Whitepaper Provenance

Every feature in the October 2021 whitepaper by Antje Worring and Zach Kelling
maps to one or more ZIPs. The whitepaper is the genesis document; all ZIPs that
formalize whitepaper features carry an **Originated: 2021-10** date even if the
formal ZIP specification was written later.

| # | Whitepaper Section (Oct 2021) | Primary ZIP | Secondary ZIPs | Follow-on Papers |
|---|-------------------------------|-------------|----------------|------------------|
| 01 | Mission & Conservation | ZIP-0000 | ZIP-0500, ZIP-0570 | `zoo-foundation-mission` (2025) |
| 02 | Zoo Animal Utility / NFTs | ZIP-0200 | ZIP-0204, ZIP-0208 | `zoo-agent-nft`, `zoo-zrc-721` |
| 03 | Sustainability | ZIP-0500 | ZIP-0105, ZIP-0108 | `zoo-carbon-credits` |
| 04 | Market Opportunity | ZIP-0000 | -- | -- |
| 05 | Supporting Non-Profits | ZIP-0530 | ZIP-0570 | `zoo-fund-impact-thesis` |
| 06 | Zoo Foundation | ZIP-0000 | ZIP-0570 | `zoo-foundation-mission` (2025) |
| 07 | Gameplay Functions | ZIP-0004 | ZIP-0300, ZIP-0301 | -- |
| 08 | AI Assistant | ZIP-0400 | ZIP-0401, ZIP-0402, ZIP-0403, ZIP-0405, ZIP-0409, ZIP-0418 | `zoo-experience-ledger` (2021), `zoo-hamiltonian-llm` (2024), `hanzo-chat` (2024) |
| 09 | Augmented Reality App | ZIP-0011 | ZIP-0300 | `zoo-spatial-web-agents` |
| 10 | Collateral-Backed NFTs | ZIP-0206 | ZIP-0103, ZIP-0200 | `zoo-nft-liquidity-protocol` (2021) |
| 11 | Feeding, Growing, Breeding | ZIP-0004 | ZIP-0207, ZIP-0301 | -- |
| 12 | Metaverse Companion | ZIP-0011 | ZIP-0204 | `zoo-spatial-web-agents` |
| 13 | Native Token (ZOO) | ZIP-0016 | ZIP-0700 | `zoo-tokenomics` (2025) |
| 14 | NFT Marketplace | ZIP-0100 | ZIP-0200, ZIP-0210 | `zoo-dex` |
| 15 | Gen 0 NFT Drop | ZIP-0002 | ZIP-0208 | -- |
| 16 | Asset Transfer / Bridge | ZIP-0022 | ZIP-0800, ZIP-0802 | `zoo-bridge` (2024), `zoo-lux-bridge-protocol` |
| 17 | Zoo Animal Rewards | ZIP-0019 | ZIP-0016 | `zoo-fund-validator-rewards` |
| 18 | Roadmap | ZIP-0000 | -- | `zoo-mainnet-launch-checklist` |
| 19 | Zoo DAO | ZIP-0017 | ZIP-0023, ZIP-0026, ZIP-0027 | `zoo-dao-governance` (2022), `zoo-dao-operating-system` |
| 20 | NFT Liquidity Protocol | ZIP-0206 | ZIP-0106 | `zoo-nft-liquidity-protocol` (2021) |
| 21 | NFTs That Make You Smile | ZIP-0204 | ZIP-0405 | `zoo-agent-nft` |
| 22 | Bridging Blockchains | ZIP-0022 | ZIP-0800 | `zoo-bridge` (2024), `zoo-threshold-signatures` |
| 23 | Open Source | ZIP-0028 | ZIP-0042 | -- |
| 24 | Partnerships | ZIP-0530 | ZIP-0023 | `zoo-dao-grants-program` |

---

## Antje Worring's Research Papers

Antje Worring authored the October 2021 whitepaper and 24 follow-on research
papers that form the scientific backbone of the Zoo ecosystem. Each paper
expands a whitepaper concept into a formal specification with proofs,
benchmarks, and implementation details.

### 2021 -- Genesis

| Paper | Expands | ZIP |
|-------|---------|-----|
| `zoo-whitepaper` | Original vision document | All ZIPs |
| `zoo-experience-ledger` | AI Assistant (sec. 08) -- first conversational AI interface, Oct 2021 | ZIP-0400, ZIP-0405 |
| `zoo-nft-liquidity-protocol` | NFT Liquidity Protocol (sec. 20), Collateral-Backed NFTs (sec. 10) | ZIP-0206, ZIP-0106 |

### 2022 -- Governance and Conservation AI

| Paper | Expands | ZIP |
|-------|---------|-----|
| `zoo-dao-governance` | Zoo DAO (sec. 19) | ZIP-0017 |
| `zoo-conservation-ai` | Mission (sec. 01), Sustainability (sec. 03) | ZIP-0302, ZIP-0503 |

### 2023 -- DeSci, Education, Data

| Paper | Expands | ZIP |
|-------|---------|-----|
| `zoo-desci-platform` | Open Source (sec. 23), Non-Profits (sec. 05) | ZIP-0600 |
| `zoo-data-commons` | Open Source (sec. 23) | ZIP-0601, ZIP-0540 |
| `zoo-educational-ai` | AI Assistant (sec. 08), Metaverse Companion (sec. 12) | ZIP-0008 |
| `zoo-citizen-science` | Partnerships (sec. 24), Non-Profits (sec. 05) | ZIP-0602 |
| `zoo-omnichain-teleport` | Bridging Blockchains (sec. 22) | ZIP-0802 |

### 2024 -- Infrastructure and Advanced AI

| Paper | Expands | ZIP |
|-------|---------|-----|
| `zoo-evm-l2-architecture` | Roadmap (sec. 18) -- L2 chain on Lux | ZIP-0015 |
| `zoo-consensus` | Roadmap (sec. 18) -- Quasar consensus | ZIP-0015, ZIP-0402 |
| `zoo-bridge` | Bridging Blockchains (sec. 22), Asset Transfer (sec. 16) | ZIP-0022, ZIP-0800 |
| `zoo-fhe` | Privacy-preserving compute | ZIP-0005 |
| `zoo-dex` | NFT Marketplace (sec. 14) -- DEX evolution | ZIP-0106 |
| `zoo-hamiltonian-llm` | AI Assistant (sec. 08) -- HLLM architecture | ZIP-0001, ZIP-0404 |
| `zoo-gym-protocol` | AI Assistant (sec. 08) -- decentralized training | ZIP-0407 |
| `zoo-poai-consensus` | Proof of AI consensus | ZIP-0402 |
| `zoo-species-classification` | Sustainability (sec. 03) -- ML pipeline | ZIP-0401, ZIP-0409 |

### 2025 -- Network Launch

| Paper | Expands | ZIP |
|-------|---------|-----|
| `zoo-network-architecture` | Full network design | ZIP-0000, ZIP-0015 |
| `zoo-tokenomics` | Native Token (sec. 13) -- 100% airdrop model | ZIP-0016 |
| `experience-ledger-dso` | AI Assistant (sec. 08) -- DSO protocol | ZIP-0400 |
| `zoo-foundation-mission` | Mission (sec. 01), Zoo Foundation (sec. 06) | ZIP-0000, ZIP-0570 |
| `zoo-federated-wildlife` | Sustainability (sec. 03) -- federated learning | ZIP-0403 |
| `zoo-satellite-ecology` | Sustainability (sec. 03) -- satellite monitoring | ZIP-0502, ZIP-0520 |
| `hllm-training-free-grpo` | AI Assistant (sec. 08) -- 99.8% cost reduction | ZIP-0001, ZIP-0404 |

---

## 1. Core Protocol

Network architecture, consensus, EVM, PQ crypto, tokenomics, governance.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0000 | Zoo Ecosystem Architecture & Framework | Final | `zoo-foundation-mission` | 2021-10 | 2024-12-20 |
| ZIP-0001 | Hamiltonian Large Language Models (HLLMs) for Zoo | Draft | `zoo-hamiltonian-llm` | 2021-10 | 2024-12-20 |
| ZIP-0002 | Genesis Airdrop to Original ZOO Token Victims | Final | `zoo-whitepaper` | 2021-10 | 2024-12-20 |
| ZIP-0003 | Eco-1: z-JEPA Hyper-Modal MoE Active Inference Architecture | Draft | `zoo-eco1-zjepa` | -- | 2024-12-20 |
| ZIP-0004 | Gaming Standards for Zoo Ecosystem | Draft | -- | 2021-10 | 2025-01-09 |
| ZIP-0005 | Post-Quantum Security for DeFi & NFTs | Final | `zoo-pq-crypto` | -- | 2024-12-20 |
| ZIP-0006 | User-Owned AI Models -- NFT-Based Model Ownership | Draft | `zoo-user-owned-models` | -- | 2024-12-20 |
| ZIP-0007 | BitDelta + DeltaSoup -- Personalized and Community AI | Draft | `zoo-bitdelta-deltasoup` | -- | 2025-01-09 |
| ZIP-0008 | Specialized Avatar Tutors for Personalized Learning | Draft | `zoo-avatar-tutors` | 2021-10 | 2025-01-09 |
| ZIP-0009 | Unified BitDelta Architecture for All Zoo AI Systems | Draft | `zoo-bitdelta-deltasoup` | -- | 2025-01-09 |
| ZIP-0010 | Zoo Launch Models -- Eco-1, Coder-1, Nano-1 | Draft | `zoo-eco1-zjepa` | -- | 2025-01-09 |
| ZIP-0011 | Spatial Web, Active Inference, Agent-to-Agent Economies | Draft | `zoo-spatial-web-agents` | 2021-10 | 2025-01-09 |
| ZIP-0012 | LP Integration -- Chain-Agnostic AI Standards | Draft | -- | -- | 2025-01-09 |
| ZIP-0013 | LP Standards Conformance and Chain Interoperability | Final | -- | -- | 2025-01-09 |
| ZIP-0014 | Zoo KMS Integration via Lux KMS | Active | `zoo-key-management` | -- | 2025-11-22 |
| ZIP-0015 | Zoo L2 Chain Architecture | Final | `zoo-evm-l2-architecture` | -- | 2025-12-27 |
| ZIP-0016 | ZOO Token Economics | Draft | `zoo-tokenomics` | 2021-10 | 2025-01-15 |
| ZIP-0017 | DAO Governance Framework | Draft | `zoo-dao-governance` | 2021-10 | 2025-01-15 |
| ZIP-0018 | Treasury Management Protocol | Draft | `zoo-fund-treasury` | 2021-10 | 2025-01-15 |
| ZIP-0019 | Validator Rewards Conservation Split | Draft | `zoo-fund-validator-rewards` | 2021-10 | 2025-01-15 |
| ZIP-0020 | Impact Metric Oracle | Draft | `zoo-fund-impact-oracle` | -- | 2025-01-15 |
| ZIP-0021 | Zoo Naming Service | Draft | -- | -- | 2025-01-15 |
| ZIP-0022 | Multi-Chain Bridge Standard | Draft | `zoo-bridge` | 2021-10 | 2025-01-15 |
| ZIP-0023 | Community Grant Program | Draft | `zoo-dao-grants-program` | 2021-10 | 2025-01-15 |
| ZIP-0024 | Data Availability Layer | Draft | -- | -- | 2025-01-15 |
| ZIP-0025 | Privacy-Preserving Donations | Draft | -- | -- | 2025-01-15 |
| ZIP-0026 | Ecosystem Reputation System | Draft | `zoo-dao-reputation-system` | 2021-10 | 2025-01-15 |
| ZIP-0027 | Emergency Governance Protocol | Draft | `zoo-dao-emergency-protocol` | 2021-10 | 2025-01-15 |
| ZIP-0028 | Zoo SDK Specification | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0029 | Gasless Transactions for Conservation | Draft | -- | -- | 2025-01-15 |
| ZIP-0030 | On-Chain Species Registry | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0042 | Cross-Ecosystem Interoperability Standard | Draft | -- | -- | 2025-01-15 |

**Provenance notes for Core Protocol:**

- ZIP-0000 traces from whitepaper sections 01 (Mission), 04 (Market), 06 (Foundation), 18 (Roadmap).
- ZIP-0001 traces from section 08 (AI Assistant). Follow-on: `zoo-hamiltonian-llm` (2024), `hllm-training-free-grpo` (2025).
- ZIP-0002 traces from section 15 (Gen 0 NFT Drop). The genesis airdrop restores original CryptoZoo holders.
- ZIP-0004 traces from sections 07 (Gameplay) and 11 (Feeding/Growing/Breeding).
- ZIP-0008 traces from section 08 (AI Assistant) via `zoo-educational-ai` (2023).
- ZIP-0011 traces from sections 09 (AR App) and 12 (Metaverse Companion).
- ZIP-0016 traces from section 13 (Native Token). Follow-on: `zoo-tokenomics` (2025).
- ZIP-0017 traces from section 19 (Zoo DAO). Follow-on: `zoo-dao-governance` (2022), `zoo-dao-operating-system`.
- ZIP-0018 traces from section 19 (Zoo DAO) -- treasury component.
- ZIP-0019 traces from section 17 (Zoo Animal Rewards). Follow-on: `zoo-fund-validator-rewards`.
- ZIP-0022 traces from sections 16 (Asset Transfer) and 22 (Bridging Blockchains). Follow-on: `zoo-bridge` (2024).
- ZIP-0023 traces from section 24 (Partnerships).
- ZIP-0026 traces from section 19 (Zoo DAO) -- reputation component.
- ZIP-0027 traces from section 19 (Zoo DAO) -- emergency governance.
- ZIP-0028 traces from section 23 (Open Source).
- ZIP-0030 traces from section 02 (Zoo Animal Utility) -- on-chain species data.

---

## 2. DeFi

DEX, bridge, FHE, MPC, staking, lending, carbon markets.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0100 | Zoo Contract Registry | Active | -- | 2021-10 | 2025-12-23 |
| ZIP-0101 | Conservation Bond Protocol | Draft | `zoo-impact-bonds` | -- | 2025-01-15 |
| ZIP-0102 | Impact Yield Vaults | Draft | -- | -- | 2025-01-15 |
| ZIP-0103 | Green Staking Mechanism | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0104 | Research Funding DAO Treasury | Draft | `zoo-dao-research-governance` | -- | 2025-01-15 |
| ZIP-0105 | Carbon Credit DEX | Draft | `zoo-carbon-credits` | 2021-10 | 2025-01-15 |
| ZIP-0106 | Automated Market Maker for Conservation | Draft | `zoo-dex` | 2021-10 | 2025-01-15 |
| ZIP-0107 | Impact Lending Protocol | Draft | -- | -- | 2025-01-15 |
| ZIP-0108 | Carbon Offset Tokenization | Draft | `zoo-carbon-credits` | 2021-10 | 2025-01-15 |
| ZIP-0109 | Wildlife Insurance Protocol | Draft | -- | -- | 2025-01-15 |
| ZIP-0110 | Conservation DAO Treasury Yield | Draft | -- | -- | 2025-01-15 |
| ZIP-0111 | Impact Perpetuals Market | Draft | -- | -- | 2025-01-15 |
| ZIP-0112 | Micro-Donation Streaming | Draft | -- | -- | 2025-01-15 |
| ZIP-0113 | Habitat Restoration Bonds | Draft | `zoo-impact-bonds` | -- | 2025-01-15 |

**Provenance notes for DeFi:**

- ZIP-0100 traces from section 14 (NFT Marketplace) -- contract registry for marketplace.
- ZIP-0103 traces from section 10 (Collateral-Backed NFTs) -- staking mechanic.
- ZIP-0105, ZIP-0108 trace from section 03 (Sustainability) -- carbon/environmental finance.
- ZIP-0106 traces from section 20 (NFT Liquidity Protocol). Follow-on: `zoo-nft-liquidity-protocol` (2021), `zoo-dex` (2024).

---

## 3. NFT Standards

Wildlife NFTs, adoption certificates, dynamic metadata, photography, royalties.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0200 | ZRC-721: Wildlife NFT Standard | Draft | `zoo-zrc-721` | 2021-10 | 2025-01-15 |
| ZIP-0201 | Species Adoption Certificate Protocol | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0202 | Conservation Badge Standard | Draft | -- | -- | 2025-01-15 |
| ZIP-0203 | Habitat NFT Fractional Ownership | Draft | -- | -- | 2025-01-15 |
| ZIP-0204 | Dynamic Metadata for Living NFTs | Draft | `zoo-agent-nft` | 2021-10 | 2025-01-15 |
| ZIP-0205 | Wildlife Photography NFT Standard | Draft | -- | -- | 2025-01-15 |
| ZIP-0206 | NFT Conservation Royalties | Draft | `zoo-nft-liquidity-protocol` | 2021-10 | 2025-01-15 |
| ZIP-0207 | Breeding Simulation NFT | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0208 | Endangered Species Collection | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0209 | NFT-Backed Microhabitat | Draft | -- | -- | 2025-01-15 |
| ZIP-0210 | Cross-Collection Composability | Draft | -- | -- | 2025-01-15 |

**Provenance notes for NFT Standards:**

- ZIP-0200 traces from section 02 (Zoo Animal Utility). Follow-on: `zoo-zrc-721`.
- ZIP-0201 traces from section 02 (Zoo Animal Utility) -- adoption certificates.
- ZIP-0204 traces from section 21 (NFTs That Make You Smile) -- AI personality NFTs. Follow-on: `zoo-agent-nft`.
- ZIP-0206 traces from sections 10 (Collateral-Backed NFTs) and 20 (NFT Liquidity Protocol). Follow-on: `zoo-nft-liquidity-protocol` (2021).
- ZIP-0207 traces from section 11 (Feeding, Growing, Breeding).
- ZIP-0208 traces from section 15 (Gen 0 NFT Drop) and section 02 (Zoo Animal Utility).

---

## 4. Gaming

Virtual habitats, play-to-conserve, AI behavior, multiplayer, leaderboards.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0300 | Virtual Habitat Simulation Protocol | Draft | `zoo-habitat-modeling` | 2021-10 | 2025-01-15 |
| ZIP-0301 | Play-to-Conserve Game Mechanics | Draft | -- | 2021-10 | 2025-01-15 |
| ZIP-0302 | AI Wildlife Behavior Engine | Draft | `zoo-conservation-ai` | 2021-10 | 2025-01-15 |
| ZIP-0303 | Multiplayer Conservation Game Protocol | Draft | -- | -- | 2025-01-15 |
| ZIP-0304 | Game Asset Interoperability | Draft | -- | -- | 2025-01-15 |
| ZIP-0305 | Leaderboard Oracle | Draft | -- | -- | 2025-01-15 |
| ZIP-0306 | Virtual Sanctuary Governance | Draft | -- | 2021-10 | 2025-01-15 |

**Provenance notes for Gaming:**

- ZIP-0300 traces from sections 07 (Gameplay), 09 (AR App), 12 (Metaverse Companion). Follow-on: `zoo-habitat-modeling`.
- ZIP-0301 traces from sections 07 (Gameplay) and 11 (Feeding/Growing/Breeding).
- ZIP-0302 traces from section 08 (AI Assistant) -- AI behavior engine for animal personalities. Follow-on: `zoo-conservation-ai` (2022).
- ZIP-0306 traces from section 19 (Zoo DAO) -- governance applied to virtual sanctuaries.

---

## 5. AI/ML

Conversational AI, semantic memory, multimodal, Zen model family, HLLM, GRPO, DSO, ASO, MCP, PoAI, embeddings, training, inference, safety, translation.

### 5a. October 2021 -- Whitepaper Genesis

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0400 | Conversational AI for Conservation | Final | `zoo-experience-ledger` | 2021-10 | 2021-10-15 |
| ZIP-0401 | Persistent Semantic Memory (Experience Ledger) | Final | `zoo-experience-ledger` | 2021-10 | 2021-10-15 |
| ZIP-0402 | AI-Augmented NFTs | Final | `zoo-agent-nft` | 2021-10 | 2021-10-15 |
| ZIP-0403 | On-Chain AI Identity | Final | `zoo-identity-chain` | 2021-10 | 2021-10-15 |

### 5b. 2022 -- Early Research

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0404 | Content-Addressable Semantic Memory System | Final | `zoo-ai-memory` | 2022-03 | 2022-03-15 |
| ZIP-0405 | Conservation-Aware Language Models | Final | `zoo-conservation-ai` | 2022-06 | 2022-06-01 |
| ZIP-0406 | Multi-Modal Conservation AI | Final | `zoo-species-classification` | 2022-09 | 2022-09-01 |
| ZIP-0407 | Decentralized AI Training Architecture | Final | `zoo-gym-protocol` | 2022-11 | 2022-11-15 |

### 5c. 2023 -- Jin / Multimodal Era

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0408 | Unified Multimodal Architecture (Jin) | Final | `zen-multimodal-architecture` | 2023-03 | 2023-03-01 |
| ZIP-0409 | Active Semantic Optimization (ASO) | Final | `hanzo-aso` | 2023-06 | 2023-06-01 |
| ZIP-0410 | Decentralized Semantic Optimization (DSO) | Final | `experience-ledger-dso` | 2023-09 | 2023-09-01 |
| ZIP-0411 | AI-Powered Search with RAG | Final | `hanzo-search` | 2023-10 | 2023-10-01 |
| ZIP-0412 | MCP Server Architecture | Final | `hanzo-agent-sdk` | 2023-12 | 2023-12-01 |

### 5d. 2024 -- Zen Model Family

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0413 | Foundation Language Model Architecture (Zen Base) | Final | `zen-base_whitepaper` | 2024-01 | 2024-01-15 |
| ZIP-0414 | Mixture of Distilled Experts (MoDE) | Final | `zen-mixture-of-experts` | 2024-02 | 2024-02-15 |
| ZIP-0415 | Code Intelligence at Scale (Zen-Code) | Final | `zen-coder_whitepaper` | 2024-03 | 2024-03-01 |
| ZIP-0416 | Vision-Language Models (Zen-VL) | Final | `zen-vl_whitepaper` | 2024-04 | 2024-04-01 |
| ZIP-0417 | Real-Time Conversational AI (Zen-Live) | Final | `zen-live_whitepaper` | 2024-05 | 2024-05-01 |
| ZIP-0418 | Hamiltonian Large Language Models (HLLM) | Final | `zoo-hamiltonian-llm` | 2024-06 | 2024-06-01 |
| ZIP-0419 | Proof of AI Consensus (PoAI) | Final | `zoo-poai-consensus` | 2024-06 | 2024-06-15 |
| ZIP-0420 | 7680-Dimensional Embeddings (Zen-Reranker) | Final | `zen-reranker` | 2024-07 | 2024-07-01 |
| ZIP-0421 | Training-Free Preference Optimization (GRPO) | Final | `hllm-training-free-grpo` | 2024-08 | 2024-08-01 |
| ZIP-0422 | Computer Use Framework (Operative) | Final | `hanzo-operative` | 2024-09 | 2024-09-01 |
| ZIP-0423 | Privacy-Preserving AI Training (FHE) | Final | `zoo-fhe` | 2024-10 | 2024-10-01 |
| ZIP-0424 | Federated Wildlife Monitoring | Final | `zoo-federated-wildlife` | 2024-11 | 2024-11-01 |
| ZIP-0425 | Satellite Ecological Monitoring | Final | `zoo-satellite-ecology` | 2024-12 | 2024-12-01 |

### 5e. 2025 -- Scaling

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0426 | 1M Token Context Extension | Final | `zen-context-extension` | 2025-01 | 2025-01-15 |
| ZIP-0427 | BitDelta Model Compression | Final | `zoo-bitdelta-deltasoup` | 2025-02 | 2025-02-01 |
| ZIP-0428 | Knowledge Distillation Pipeline | Final | `zen-knowledge-distillation` | 2025-03 | 2025-03-01 |
| ZIP-0429 | Multilingual 100+ Language Coverage | Final | `zen-multilingual` | 2025-04 | 2025-04-01 |
| ZIP-0430 | AI Safety Framework (Zen-Guard) | Final | `zen-safety-evaluation` | 2025-05 | 2025-05-01 |
| ZIP-0431 | Neural Machine Translation (Zen-Translator) | Final | `zen-translator` | 2025-06 | 2025-06-01 |
| ZIP-0432 | Sovereign AI Memory | Final | `zoo-ai-memory` | 2025-07 | 2025-07-01 |
| ZIP-0433 | Spatial Web Active Inference | Final | `zoo-spatial-web-agents` | 2025-08 | 2025-08-01 |
| ZIP-0434 | Decentralized Training Infrastructure | Final | `zoo-gym-protocol` | 2025-09 | 2025-09-01 |

**Provenance notes for AI/ML:**

- ZIP-0400 traces from section 08 (AI Assistant) -- the ChatGPT-like conversational interface, 14 months before ChatGPT. Follow-on: `zoo-experience-ledger` (2021), `hanzo-chat` (2024).
- ZIP-0401 traces from section 08 (AI Assistant) -- persistent semantic memory. Follow-on: `zoo-experience-ledger` (2021), `zoo-ai-memory` (2024), `experience-ledger-dso` (2025).
- ZIP-0402 traces from sections 02, 08, 21 -- intelligent agents bound to NFT tokens, predating ERC-6551 by 2 years. Follow-on: `zoo-agent-nft` (2022).
- ZIP-0403 traces from sections 08, 19, 21 -- agents as first-class blockchain citizens. Follow-on: `zoo-identity-chain` (2024), `hanzo-aci`.
- ZIP-0404 extends ZIP-0401 with content-addressable storage. Follow-on: `zoo-data-commons` (2023), `zoo-ai-memory` (2024).
- ZIP-0405 traces from sections 03, 08 -- domain-specific conservation language models. Follow-on: `zoo-conservation-ai` (2022), `zoo-species-classification` (2024).
- ZIP-0406 traces from sections 03, 08, 09 -- multimodal conservation AI. Follow-on: `zen-multimodal-architecture`, `zen-vision-architecture`.
- ZIP-0407 traces from section 08 -- decentralized training architecture, precursor to Zoo Gym. Follow-on: `zoo-gym-protocol` (2024).
- ZIP-0408 specifies the Jin unified multimodal architecture. Follow-on: `zen-vl_whitepaper`, `zen3-omni_whitepaper`.
- ZIP-0409 specifies ASO (HIP-0002). Follow-on: `hanzo-aso`, `zen-aso-protocol`.
- ZIP-0410 specifies DSO, the distributed counterpart to ASO. Follow-on: `experience-ledger-dso` (2025), `zen-dso-protocol`.
- ZIP-0411 specifies RAG architecture for grounded search. Follow-on: `hanzo-search`, `zen-reranker`.
- ZIP-0412 specifies MCP server architecture with 260+ tools. Follow-on: `hanzo-agent-sdk`.
- ZIP-0413 specifies Zen Base foundation model architecture (600M-480B params). Follow-on: `zen-base_whitepaper`, `zen4_whitepaper`.
- ZIP-0414 specifies Zen MoDE (Mixture of Diverse Experts). Follow-on: `zen-mixture-of-experts`.
- ZIP-0415 specifies Zen-Code for code intelligence. Follow-on: `zen-coder_whitepaper`, `zen4-coder_whitepaper`.
- ZIP-0416 specifies Zen-VL vision-language models. Follow-on: `zen-vl_whitepaper`, `zen3-vl_whitepaper`.
- ZIP-0417 specifies Zen-Live real-time conversational AI. Follow-on: `zen-live_whitepaper`.
- ZIP-0418 specifies HLLM (Hamiltonian LLMs, HIP-0004). Follow-on: `zoo-hamiltonian-llm` (2024), `hllm-training-free-grpo` (2025).
- ZIP-0419 specifies PoAI consensus (ZIP-002). Follow-on: `zoo-poai-consensus` (2024).
- ZIP-0420 specifies 7680-dim embeddings. Follow-on: `zen-reranker`, `embedding-7680`.
- ZIP-0421 specifies GRPO, 99.8% cost reduction over RLHF. Follow-on: `hllm-training-free-grpo` (2025).
- ZIP-0422 specifies Operative computer use framework. Follow-on: `hanzo-operative`.
- ZIP-0423 specifies FHE for privacy-preserving AI. Follow-on: `zoo-fhe` (2024), `zoo-fhe-ai` (2024).
- ZIP-0424 specifies federated wildlife monitoring. Follow-on: `zoo-federated-wildlife` (2025).
- ZIP-0425 specifies satellite ecological monitoring. Follow-on: `zoo-satellite-ecology` (2025).
- ZIP-0426 specifies 1M token context extension. Follow-on: `zen-context-extension`.
- ZIP-0427 specifies BitDelta model compression. Follow-on: `zoo-bitdelta-deltasoup`.
- ZIP-0428 specifies knowledge distillation pipeline. Follow-on: `zen-knowledge-distillation`.
- ZIP-0429 specifies 100+ language multilingual coverage. Follow-on: `zen-multilingual`.
- ZIP-0430 specifies Zen-Guard AI safety framework. Follow-on: `zen-safety-evaluation`, `zen3-guard_whitepaper`.
- ZIP-0431 specifies Zen-Translator neural machine translation. Follow-on: `zen-translator`.
- ZIP-0432 specifies sovereign AI memory (user-owned). Follow-on: `zoo-ai-memory` (2024).
- ZIP-0433 specifies spatial web active inference for AR/VR. Follow-on: `zoo-spatial-web-agents` (2024).
- ZIP-0434 specifies Zoo Gym production training infrastructure. Follow-on: `zoo-gym-protocol` series (2024).

---

## 6. Conservation

Wildlife tracking, satellite ecology, habitat, anti-poaching, ESG, impact.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0500 | ESG Principles for Conservation Impact | Draft | -- | 2021-10 | 2025-12-16 |
| ZIP-0501 | Conservation Impact Measurement | Draft | -- | 2021-10 | 2025-12-17 |
| ZIP-0502 | Wildlife Corridor Mapping | Draft | `zoo-wildlife-tracking` | 2021-10 | 2025-01-15 |
| ZIP-0503 | Anti-Poaching Alert Network | Draft | `zoo-conservation-ai` | 2021-10 | 2025-01-15 |
| ZIP-0504 | Marine Conservation Tracking | Draft | -- | -- | 2025-01-15 |
| ZIP-0505 | Reforestation Verification | Draft | -- | -- | 2025-01-15 |
| ZIP-0510 | Species Protection & Monitoring | Draft | `zoo-wildlife-tracking` | 2021-10 | 2025-12-17 |
| ZIP-0520 | Habitat Conservation | Draft | `zoo-habitat-modeling` | 2021-10 | 2025-12-17 |
| ZIP-0530 | Community Partnerships & FPIC | Draft | -- | 2021-10 | 2025-12-17 |
| ZIP-0540 | Research Ethics & Data Governance | Draft | `zoo-data-commons` | -- | 2025-12-17 |
| ZIP-0550 | Conservation Standards Alignment Matrix | Draft | -- | -- | 2025-12-16 |
| ZIP-0560 | Evidence Locker Index | Draft | -- | -- | 2025-12-16 |
| ZIP-0570 | Zoo Labs Impact Thesis | Draft | `zoo-fund-impact-thesis` | 2021-10 | 2025-12-17 |

**Provenance notes for Conservation:**

- ZIP-0500 traces from sections 01 (Mission) and 03 (Sustainability).
- ZIP-0501 traces from section 05 (Supporting Non-Profits) -- measurable impact.
- ZIP-0502, ZIP-0510 trace from section 03 (Sustainability). Follow-on: `zoo-wildlife-tracking`, `zoo-satellite-ecology` (2025).
- ZIP-0503 traces from section 01 (Mission). Follow-on: `zoo-conservation-ai` (2022).
- ZIP-0520 traces from section 03 (Sustainability). Follow-on: `zoo-habitat-modeling`.
- ZIP-0530 traces from sections 05 (Supporting Non-Profits) and 24 (Partnerships).
- ZIP-0570 traces from sections 01 (Mission) and 06 (Zoo Foundation). Follow-on: `zoo-fund-impact-thesis`, `zoo-foundation-mission` (2025).

---

## 7. DeSci (Decentralized Science)

Open data, citizen science, peer review, reproducibility, research governance.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0600 | DeSci Protocol Framework | Draft | `zoo-desci-platform` | 2021-10 | 2025-01-15 |
| ZIP-0601 | Open Biodiversity Database Standard | Draft | `zoo-data-commons` | 2021-10 | 2025-01-15 |
| ZIP-0602 | Citizen Science Contribution Protocol | Draft | `zoo-citizen-science` | 2021-10 | 2025-01-15 |
| ZIP-0603 | Research DAO Governance | Draft | `zoo-dao-research-governance` | -- | 2025-01-15 |
| ZIP-0604 | Decentralized Peer Review | Draft | -- | -- | 2025-01-15 |
| ZIP-0605 | Open Access Publication Protocol | Draft | -- | -- | 2025-01-15 |
| ZIP-0606 | Reproducibility Attestation | Draft | -- | -- | 2025-01-15 |

**Provenance notes for DeSci:**

- ZIP-0600 traces from section 23 (Open Source) and section 05 (Supporting Non-Profits). Follow-on: `zoo-desci-platform` (2023).
- ZIP-0601 traces from section 23 (Open Source). Follow-on: `zoo-data-commons` (2023).
- ZIP-0602 traces from section 24 (Partnerships). Follow-on: `zoo-citizen-science` (2023).

---

## 8. Token Standards (ZRC)

ZRC-20, ZRC-721, ZRC-1155, token-bound accounts.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0700 | ZRC-20: Fungible Token Standard | Draft | `zoo-zrc-20` | 2021-10 | 2025-01-15 |
| ZIP-0701 | ZRC-721: Non-Fungible Token Standard | Draft | `zoo-zrc-721` | 2021-10 | 2025-01-15 |
| ZIP-0702 | ZRC-1155: Multi-Token Standard | Draft | `zoo-zrc-1155` | -- | 2025-01-15 |
| ZIP-0703 | Token-Bound Accounts for Wildlife NFTs | Draft | `zoo-token-bound-accounts` | -- | 2025-01-15 |

**Provenance notes for Token Standards:**

- ZIP-0700 traces from section 13 (Native Token) -- ZOO as ZRC-20.
- ZIP-0701 traces from section 02 (Zoo Animal Utility) -- NFT standard for wildlife.

---

## 9. Infrastructure

Bridge, settlement, omnichain, replication.

| ZIP | Title | Status | Paper | Originated | Created |
|-----|-------|--------|-------|------------|---------|
| ZIP-0800 | Zoo-Lux Bridge Protocol | Draft | `zoo-lux-bridge-protocol` | 2021-10 | 2025-01-15 |
| ZIP-0801 | Zoo-Hanzo Settlement Integration | Draft | `zoo-hanzo-settlement` | -- | 2025-01-15 |
| ZIP-0802 | Zoo Omnichain Teleport Extension | Final | `zoo-omnichain-teleport` | 2021-10 | 2023-09-01 |
| ZIP-0803 | Encrypted Streaming Replication for Zoo Services | Final | `zip-0803-encrypted-sqlite-replication` | -- | 2026-04-09 |

**Provenance notes for Infrastructure:**

- ZIP-0800 traces from section 22 (Bridging Blockchains). Follow-on: `zoo-bridge` (2024), `zoo-lux-bridge-protocol`, `zoo-threshold-signatures`.
- ZIP-0802 traces from section 16 (Asset Transfer) and section 22 (Bridging Blockchains). Follow-on: `zoo-omnichain-teleport` (2023).

---

## Papers Without ZIPs

Papers in `~/work/zoo/papers/` not yet assigned a dedicated ZIP. These are either covered by existing ZIPs (noted below) or candidates for future proposals.

| Paper | Description | Covered By |
|-------|-------------|------------|
| `beluga-l3-whitepaper` | Beluga L3 architecture | -- |
| `embedding-7680` | 7680-dim embedding model | ZIP-0420 |
| `gym-training-platform` | Gym decentralized training platform | ZIP-0407, ZIP-0434 |
| `hllm-training-free-grpo` | HLLM with Training-Free GRPO | ZIP-0418, ZIP-0421 |
| `zoo-agi` | Zoo AGI research agenda | ZIP-0003 |
| `zoo-ai-memory` | AI memory architecture | ZIP-0401, ZIP-0404, ZIP-0432 |
| `zoo-ai-research-agenda` | Zoo AI research roadmap | -- |
| `zoo-confidential-defi` | FHE/MPC for confidential DeFi | ZIP-0005, ZIP-0025, ZIP-0423 |
| `zoo-consensus` | Zoo consensus mechanism | ZIP-0015, ZIP-0419 |
| `zoo-dao-operating-system` | DAO operating system | ZIP-0017, ZIP-0027 |
| `zoo-educational-ai` | Educational AI tutoring | ZIP-0008, ZIP-0400 |
| `zoo-evm-benchmarks` | EVM performance benchmarks | ZIP-0015 |
| `zoo-experience-ledger` | Experience ledger | ZIP-0400, ZIP-0401 |
| `zoo-fhe` | Fully homomorphic encryption | ZIP-0005, ZIP-0423 |
| `zoo-fhe-ai` | FHE for AI inference | ZIP-0005, ZIP-0423 |
| `zoo-foundation-mission` | Zoo Labs Foundation mission | ZIP-0000 |
| `zoo-fund-platform` | Fund management platform | ZIP-0018 |
| `zoo-gpu-evm` | GPU-accelerated EVM | ZIP-0015 |
| `zoo-gym-compute-proof` | Gym compute proof protocol | ZIP-0407, ZIP-0434 |
| `zoo-gym-grpo-continuous` | Continuous GRPO training | ZIP-0421, ZIP-0434 |
| `zoo-gym-orchestrator` | Gym training orchestrator | ZIP-0407, ZIP-0434 |
| `zoo-gym-tokenomics` | Gym token economics | ZIP-0016, ZIP-0434 |
| `zoo-identity-chain` | On-chain identity | ZIP-0014, ZIP-0403 |
| `zoo-mainnet-launch-checklist` | Mainnet launch checklist | ZIP-0015 |
| `zoo-mobile-inference` | Mobile AI inference | ZIP-0428 |
| `zoo-mpc-custody` | MPC custody protocol | ZIP-0014 |
| `zoo-network-architecture` | Network architecture overview | ZIP-0000, ZIP-0015 |
| `zoo-quasar-benchmarks` | Quasar consensus benchmarks | ZIP-0015 |
| `zoo-research-coordination` | Research coordination protocol | ZIP-0603 |
| `zoo-satellite-ecology` | Satellite-based ecology | ZIP-0425, ZIP-0502, ZIP-0520 |
| `zoo-threshold-signatures` | Threshold signature scheme | ZIP-0014 |
| `zoo-voting-platform` | DAO voting platform | ZIP-0017 |
| `zoo-web5-local-first` | Web5 local-first architecture | ZIP-0432 |
| `zoo-whitepaper` | Original Zoo whitepaper (Oct 2021) | All ZIPs (genesis document) |
| `zoo-zchain-zkp` | ZK proof chain | ZIP-0005 |

---

## Evolution Timeline

Tracing every feature from the October 2021 whitepaper through current implementation.

### Phase 0: Whitepaper Genesis (October 2021)

Antje Worring and Zach Kelling publish the Zoo Labs whitepaper: "A Game-Fi
Multiverse for Conservation of Endangered Species." 24 sections define the
complete vision. Two companion papers are written in late 2021:

- `zoo-experience-ledger` -- the first conversational AI interface spec, predating ChatGPT by over a year
- `zoo-nft-liquidity-protocol` -- collateral-backed NFTs with liquidity protocol

All features below originate from this document. The whitepaper establishes:
- Mission and conservation model (sec. 01, 03, 05, 06)
- NFT animal utility, marketplace, Gen 0 drop (sec. 02, 14, 15)
- AI assistant with per-animal personalities (sec. 08)
- AR/VR metaverse companion (sec. 09, 12)
- Game mechanics: feeding, growing, breeding (sec. 07, 11)
- Collateral-backed NFTs and liquidity protocol (sec. 10, 20)
- Native ZOO token backed by gold/silver (sec. 13)
- Asset transfer and cross-chain bridge (sec. 16, 22)
- Zoo DAO governance (sec. 19)
- Open source and partnerships (sec. 23, 24)

**AI/ML ZIPs originated in this phase:**
- ZIP-0400: Conversational AI for Conservation (the ChatGPT-like interface, 14 months before ChatGPT)
- ZIP-0401: Persistent Semantic Memory (Experience Ledger concept)
- ZIP-0402: AI-Augmented NFTs (intelligent agents bound to tokens)
- ZIP-0403: On-Chain AI Identity (agents as first-class blockchain citizens)

### Phase 1: Governance and Conservation AI (2022)

- `zoo-dao-governance` -- formalizes section 19 (Zoo DAO) into DAO governance spec
- `zoo-conservation-ai` -- formalizes sections 01, 03 into AI-driven conservation monitoring

**AI/ML ZIPs originated in this phase:**
- ZIP-0404: Content-Addressable Semantic Memory System (extending Experience Ledger)
- ZIP-0405: Conservation-Aware Language Models (domain-specific LLMs)
- ZIP-0406: Multi-Modal Conservation AI (vision + NLP + audio for species)
- ZIP-0407: Decentralized AI Training Architecture (precursor to Zoo Gym)

### Phase 2: DeSci, Education, and Multimodal AI (2023)

- `zoo-desci-platform` -- extends open source vision into decentralized science
- `zoo-data-commons` -- open biodiversity data standard
- `zoo-educational-ai` -- expands the AI assistant into educational tutoring
- `zoo-citizen-science` -- citizen contribution protocol
- `zoo-omnichain-teleport` -- bridge protocol for omnichain NFT transfers (ZIP-0802, Final)

**AI/ML ZIPs originated in this phase:**
- ZIP-0408: Unified Multimodal Architecture (Jin -- vision/language/audio/3D)
- ZIP-0409: Active Semantic Optimization (ASO protocol, HIP-0002)
- ZIP-0410: Decentralized Semantic Optimization (DSO protocol)
- ZIP-0411: AI-Powered Search with RAG
- ZIP-0412: MCP Server Architecture (260+ tools for AI agents)

### Phase 3: Zen Model Family and Advanced AI (2024)

- `zoo-evm-l2-architecture` -- L2 chain architecture on Lux (ZIP-0015)
- `zoo-consensus` -- Quasar consensus mechanism
- `zoo-bridge` -- cross-chain bridge formalized from whitepaper sec. 22
- `zoo-fhe` -- fully homomorphic encryption for privacy
- `zoo-dex` -- AMM for conservation assets
- `zoo-hamiltonian-llm` -- HLLM architecture evolving the AI assistant
- `zoo-gym-protocol` -- decentralized training platform
- `zoo-poai-consensus` -- Proof of AI consensus
- `zoo-species-classification` -- ML pipeline for species detection

**AI/ML ZIPs originated in this phase:**
- ZIP-0413: Foundation Language Model Architecture (Zen Base, 600M-480B params)
- ZIP-0414: Mixture of Distilled Experts (Zen MoDE)
- ZIP-0415: Code Intelligence at Scale (Zen-Code)
- ZIP-0416: Vision-Language Models (Zen-VL)
- ZIP-0417: Real-Time Conversational AI (Zen-Live)
- ZIP-0418: Hamiltonian Large Language Models (HLLM, HIP-0004)
- ZIP-0419: Proof of AI Consensus (PoAI, ZIP-002)
- ZIP-0420: 7680-Dimensional Embeddings (Zen-Reranker)
- ZIP-0421: Training-Free Preference Optimization (GRPO, 99.8% cost reduction)
- ZIP-0422: Computer Use Framework (Operative)
- ZIP-0423: Privacy-Preserving AI Training (FHE)
- ZIP-0424: Federated Wildlife Monitoring
- ZIP-0425: Satellite Ecological Monitoring

### Phase 4: Scaling and Network Launch (2025)

- `zoo-network-architecture` -- full network design (ZIP-0000, ZIP-0015)
- `zoo-tokenomics` -- 100% airdrop tokenomics evolving from sec. 13 Native Token
- `experience-ledger-dso` -- Decentralized Semantic Optimization (ZIP-0410)
- `zoo-foundation-mission` -- Zoo Labs Foundation 501(c)(3) mission
- `zoo-federated-wildlife` -- federated learning for conservation (ZIP-0424)
- `zoo-satellite-ecology` -- satellite-based ecology monitoring (ZIP-0425)
- `hllm-training-free-grpo` -- 99.8% cost reduction for AI training (ZIP-0421)
- ZIP-0014: KMS integration via Lux KMS (Active, Nov 2025)
- ZIP-0100: Contract registry (Active, Dec 2025)
- ZIP-0015: Zoo L2 Chain Architecture (Final, Dec 2025)
- ZIP-0500 -- ZIP-0570: Conservation impact framework (Dec 2025)

**AI/ML ZIPs originated in this phase:**
- ZIP-0426: 1M Token Context Extension
- ZIP-0427: BitDelta Model Compression
- ZIP-0428: Knowledge Distillation Pipeline
- ZIP-0429: Multilingual 100+ Language Coverage
- ZIP-0430: AI Safety Framework (Zen-Guard)
- ZIP-0431: Neural Machine Translation (Zen-Translator)
- ZIP-0432: Sovereign AI Memory
- ZIP-0433: Spatial Web Active Inference
- ZIP-0434: Decentralized Training Infrastructure (Zoo Gym)

### Phase 5: Production (2026)

- ZIP-0803: Encrypted streaming replication (Final, Apr 2026)
- Beluga L3 whitepaper -- next-generation L3 architecture
- Mainnet launch preparation (`zoo-mainnet-launch-checklist`)

---

## Statistics

| Category | Count | Final | Active | Draft |
|----------|-------|-------|--------|-------|
| Core Protocol | 32 | 5 | 1 | 26 |
| DeFi | 14 | 0 | 1 | 13 |
| NFT Standards | 11 | 0 | 0 | 11 |
| Gaming | 7 | 0 | 0 | 7 |
| AI/ML | 35 | 35 | 0 | 0 |
| Conservation | 13 | 0 | 0 | 13 |
| DeSci | 7 | 0 | 0 | 7 |
| Token Standards (ZRC) | 4 | 0 | 0 | 4 |
| Infrastructure | 4 | 2 | 0 | 2 |
| **Total** | **127** | **42** | **2** | **83** |

Papers in `~/work/zoo/papers/`: **79**
Zen papers in `~/work/zen/papers/`: **60+**
Hanzo papers in `~/work/hanzo/papers/`: **40+**
Papers with dedicated ZIP: **70+**
Papers covered by related ZIP: **34**
ZIPs tracing to October 2021 whitepaper: **55**
AI/ML ZIPs cross-referencing Zen papers: **25**
AI/ML ZIPs cross-referencing Hanzo papers: **15**

---

## Related Protocols

- **HIPs** (Hanzo Improvement Proposals): [github.com/hanzoai/HIPs](https://github.com/hanzoai/HIPs)
- **LPs** (Lux Proposals): Chain-agnostic AI standards referenced by ZIP-0012, ZIP-0013

## License

All ZIPs are CC BY 4.0 unless otherwise noted.
All innovations are public goods (CC0) per Zoo Labs Foundation policy.

---

*Maintained by Zoo Labs Foundation -- oss@zoo.ngo*
*Last updated: 2026-04-19*
