---
zip: 0100
title: Zoo Contract Registry
author: Zoo Labs Foundation
type: Standards Track
status: Active
originated: 2021-10
traces-from: "Whitepaper section 14 (NFT Marketplace)"
created: 2025-12-23
updated: 2025-12-23
---

# ZIP-100: Zoo Contract Registry

## Abstract

This ZIP provides a comprehensive registry of all deployed contracts, token addresses, governance infrastructure, and DeFi protocols across the Zoo ecosystem. It serves as the canonical reference for Zoo mainnet (200200), Zoo testnet, and cross-chain bridge integrations.

## Motivation

The Zoo ecosystem requires a single source of truth for:
- Deployed contract addresses across all networks
- Token registries for each network
- Governance infrastructure (ZooGovernor, ZOO token)
- Bridge tokens from Lux ↔ Zoo
- AMM/DEX infrastructure
- GameFi and NFT marketplace contracts

## Network Configuration

### Chain Details

| Chain | Chain ID | Native Token | RPC | Explorer |
|-------|----------|--------------|-----|----------|
| **Zoo Mainnet** | 200200 | ZOO | `http://127.0.0.1:9630/ext/bc/zy5VXh7K.../rpc` | TBD |
| **Zoo Testnet** | 200201 | ZOO | TBD | TBD |
| **Lux Mainnet** | 96369 | LUX | `http://127.0.0.1:9630/ext/bc/C/rpc` | TBD |

### Genesis Parameters

```yaml
chainId: 200200
blockTime: ~1s
finality: sub-second (Lux L2 rollup confirmation)
gasLimit: 8000000
gasPrice: 25000000000 (25 gwei)
```

---

## Core Contracts

### ZOO Token

**Contract**: `ZOO.sol`
**Location**: `~/work/zoo/zoo/contracts/src/ZOO.sol`

| Feature | Description |
|---------|-------------|
| **Standard** | ERC20 with AccessControl, Pausable, Burnable |
| **Symbol** | ZOO |
| **Decimals** | 18 |
| **Blacklist** | Address blacklisting via AccessControl role |
| **Bridge Integration** | `bridgeMint()`, `bridgeBurn()` for cross-chain |
| **Airdrop** | Batch airdrop with one-time completion lock |

**Key Functions**:
```solidity
function configure(address _bridge) public onlyOwner;
function blacklistAddress(address _addr) public onlyOwner;
function bridgeMint(address to, uint256 value) external onlyBridge;
function bridgeBurn(address account, uint256 amount) external onlyBridge;
function airdrop(address[] memory addresses, uint256[] memory amounts) public onlyOwner;
function airdropDone() public onlyOwner; // Locks airdrop permanently
```

---

### ZooGovernor

**Contract**: `ZooGovernor.sol`
**Location**: `~/work/zoo/zoo/contracts/contracts/governance/ZooGovernor.sol`
**Standard**: OpenZeppelin Governor with extensions

| Parameter | Value |
|-----------|-------|
| **Voting Delay** | 1 block |
| **Voting Period** | 50,400 blocks (~1 week) |
| **Proposal Threshold** | 1 ZOO |
| **Quorum** | 4% |
| **Timelock** | TimelockController integration |

**Inheritance**:
- `Governor`
- `GovernorSettings`
- `GovernorCountingSimple`
- `GovernorVotes`
- `GovernorVotesQuorumFraction`
- `GovernorTimelockControl`

---

### ZooToken (Governance Token)

**Contract**: `ZooToken.sol`
**Location**: `~/work/zoo/zoo/contracts/contracts/governance/ZooToken.sol`
**Standard**: ERC20Votes for on-chain governance

---

### ZKStaking

**Contract**: `ZKStaking.sol`
**Location**: `~/work/zoo/zoo/contracts/contracts/governance/ZKStaking.sol`
**Purpose**: Zero-knowledge staking mechanism for governance

---

## DeFi Infrastructure

### Uniswap V2 (AMM)

All contracts deployed via CREATE2 for deterministic addresses across chains:

| Contract | Address |
|----------|---------|
| **V2 Factory** | `0xD173926A10A0C4eCd3A51B1422270b65Df0551c1` |
| **V2 Router** | `0xAe2cf1E403aAFE6C05A5b8Ef63EB19ba591d8511` |

**Source Files** (in `~/work/zoo/zoo/contracts/src/uniswapv2/`):
- `UniswapV2Factory.sol`
- `UniswapV2Pair.sol`
- `UniswapV2Router02.sol`
- `UniswapV2ERC20.sol`

### Uniswap V3 (Concentrated Liquidity)

| Contract | Address |
|----------|---------|
| **V3 Factory** | `0x80bBc7C4C7a59C899D1B37BC14539A22D5830a84` |
| **V3 Router** | `0x939bC0Bca6F9B9c52E6e3AD8A3C590b5d9B9D10E` |
| **Quoter** | `0x12e2B76FaF4dDA5a173a4532916bb6Bfa3645275` |
| **NonfungiblePositionManager** | `0x7a4C48B9dae0b7c396569b34042fcA604150Ee28` |
| **TickLens** | `0x57A22965AdA0e52D785A9Aa155beF423D573b879` |
| **Multicall** | `0xd25F88CBdAe3c2CCA3Bb75FC4E723b44C0Ea362F` |

---

## Token Registry: Zoo Mainnet (200200)

### Core Bridged Tokens

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| **Wrapped ZOO** | WZOO | 18 | `0x4888E4a2Ee0F03051c72D2BD3ACf755eD3498B3E` |
| **Zoo ETH** | ZETH | 18 | `0x60E0a8167FC13dE89348978860466C9ceC24B9ba` |
| **Zoo USD** | ZUSD | 18 | `0x848Cff46eb323f323b6Bbe1Df274E40793d7f2c2` |
| **Zoo BTC** | ZBTC | 18 | `0x1E48D32a4F5e9f08DB9aE4959163300FaF8A6C8e` |
| **Zoo LUX** | ZLUX | 18 | `0x5E5290f350352768bD2bfC59c2DA15DD04A7cB88` |
| **Zoo BNB** | ZBNB | 18 | `0x6EdcF3645DeF09DB45050638c41157D8B9FEa1cf` |
| **Zoo POL** | ZPOL | 18 | `0x28BfC5DD4B7E15659e41190983e5fE3df1132bB9` |
| **Zoo CELO** | ZCELO | 18 | `0x3078847F879A33994cDa2Ec1540ca52b5E0eE2e5` |
| **Zoo FTM** | ZFTM | 18 | `0x8B982132d639527E8a0eAAD385f97719af8f5e04` |
| **Zoo xDAI** | ZXDAI | 18 | `0x7dfb3cBf7CF9c96fd56e3601FBA50AF45C731211` |
| **Zoo SOL** | ZSOL | 18 | `0x26B40f650156C7EbF9e087Dd0dca181Fe87625B7` |
| **Zoo TON** | ZTON | 18 | `0x3141b94b89691009b950c96e97Bff48e0C543E3C` |
| **Zoo ADA** | ZADA | 18 | `0x8b34152832b8ab4a3274915675754AA61eC113F0` |
| **Zoo AVAX** | ZAVAX | 18 | `0x0EE4602429bFCEf8aEB1012F448b23532f9855Bd` |
| **Zoo BLAST** | ZBLAST | 18 | `0x7a56c769C50F2e73CFB70b401409Ad1F1a5000cd` |

### Meme Tokens

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| **Zoo BONK** | ZBONK | 18 | `0x8a873ad8CfF8ba640D71274d33a85AB1B2d53b62` |
| **Zoo WIF** | ZWIF | 18 | `0x4586D49f3a32c3BeCA2e09802e0aB1Da705B011D` |
| **Zoo Popcat** | ZPOPCAT | 18 | `0x68Cd9b8Df6E86dA02ef030c2F1e5a3Ad6B6d747F` |
| **Zoo PNUT** | ZPNUT | 18 | `0x0e4bD0DD67c15dECfBBBdbbE07FC9d51D737693D` |
| **Zoo MEW** | ZMEW | 18 | `0x94f49D0F4C62bbE4238F4AaA9200287bea9F2976` |
| **Zoo BOME** | ZBOME | 18 | `0xEf770a556430259d1244F2A1384bd1A672cE9e7F` |
| **Zoo GIGA** | ZGIGA | 18 | `0xBBd222BD7dADd241366e6c2CbD5979F678598A85` |
| **Zoo AI16Z** | ZAI16Z | 18 | `0x273196F2018D61E31510D1Aa1e6644955880D122` |
| **Zoo FWOG** | ZFWOG | 18 | `0xd8ab3C445d81D78E7DC2d60FeC24f8C7328feF2f` |
| **Zoo MOODENG** | ZMOODENG | 18 | `0xe6cd610aD16C8Fe5BCeDFff7dAB2e3d461089261` |
| **Zoo PONKE** | ZPONKE | 18 | `0xDF7740fCC9B244c192CfFF7b6553a3eEee0f4898` |
| **Zoo NOT** | ZNOT | 18 | `0xdfCAdda48DbbA09f5678aE31734193F7CCA7f20d` |
| **Zoo DOGS** | ZDOGS | 18 | `0x0b0FF795d0A1C162b44CdC35D8f4DCbC2b4B9170` |
| **Zoo MRB** | ZMRB | 18 | `0x3FfA9267739C04554C1fe640F79651333A2040e1` |
| **Zoo REDO** | ZREDO | 18 | `0x137747A15dE042Cd01fCB41a5F3C7391d932750B` |
| **Slog** | SLOG | 6 | `0xED15C23B27a69b5bd50B1eeF5B8f1C8D849462b7` |

---

## NFT & GameFi Contracts

### Core NFT Infrastructure

Located in `~/work/zoo/zoo/contracts/src/`:

| Contract | Purpose |
|----------|---------|
| **Media.sol** | NFT media with content/metadata URIs |
| **Market.sol** | NFT marketplace with bid shares |
| **Auction.sol** | English auction for NFTs |
| **Drop.sol** | NFT drops with egg/animal mechanics |
| **DropEggs.sol** | Egg drop mechanics |
| **EGGDrop.sol** | Egg airdrop functionality |

### GameFi Contracts

| Contract | Purpose |
|----------|---------|
| **ZooKeeper.sol** | Game logic manager |
| **Farm.sol** | Yield farming with rewards |
| **NFTStaking.sol** | Stake NFTs for rewards |
| **Random.sol** | On-chain randomness |
| **Savage.sol** | Game mechanics |

### Zoo Interfaces (`~/work/zoo/zoo/contracts/src/interfaces/`)

| Interface | Purpose |
|-----------|---------|
| **IZoo.sol** | Core Zoo types (Token, Rarity, Parents, Breed, etc.) |
| **IMedia.sol** | Media contract interface |
| **IMarket.sol** | Market contract interface |
| **IAuctionHouse.sol** | Auction house interface |
| **IDrop.sol** | Drop interface |
| **IKeeper.sol** | ZooKeeper interface |
| **IVoting.sol** | Governance voting |
| **IRewarder.sol** | Reward distribution |

---

## Bridge Infrastructure

### Cross-Chain Bridge (Lux ↔ Zoo)

**Architecture**: MPC-signed bridge with ERC4626 vaults

**Core Bridge Contract**: `Bridge.sol`
- MPC verification for cross-chain messages
- Stealth mint/burn operations
- Fee: 1% (100 basis points)
- Treasury: `0x9011E888251AB053B7bD1cdB598Db4f9DEd94714`

### Zoo Bridge Token Contracts

Located in `~/work/lux/bridge/contracts/contracts/zoo/`:

| Token | Contract |
|-------|----------|
| ZETH | `ZETH.sol` |
| ZUSD | `ZUSD.sol` |
| ZBTC | `ZBTC.sol` |
| ZLUX | `ZLUX.sol` |
| ZBNB | `ZBNB.sol` |
| ZPOL | `ZPOL.sol` |
| ZCELO | `ZCELO.sol` |
| ZFTM | `ZFTM.sol` |
| ZXDAI | `ZXDAI.sol` |
| ZSOL | `ZSOL.sol` |
| ZTON | `ZTON.sol` |
| ZAVAX | `ZAVAX.sol` |
| ZBLAST | `ZBLAST.sol` |
| ZADA | `ZADA.sol` |
| ZAI16Z | `ZAI16Z.sol` |
| ZBONK | `ZBONK.sol` |
| ZWIF | `ZWIF.sol` |
| ZPOPCAT | `ZPOPCAT.sol` |
| ZPNUT | `ZPNUT.sol` |
| ZMEW | `ZMEW.sol` |
| ZBOME | `ZBOME.sol` |
| ZGIGA | `ZGIGA.sol` |
| ZFWOG | `ZFWOG.sol` |
| ZMOODENG | `ZMOODENG.sol` |
| ZPONKE | `ZPONKE.sol` |
| ZNOT | `ZNOT.sol` |
| ZDOGS | `ZDOGS.sol` |
| SLOG | `SLOG.sol` |
| TRUMP | `TRUMP.sol` |
| MELANIA | `MELANIA.sol` |
| CYRUS | `CYRUS.sol` |

### Zoo Vault

**Contract**: `ZooVault.sol`
**Location**: `~/work/lux/bridge/contracts/contracts/ZooVault.sol`
**Standard**: ERC4626 tokenized vault

---

## Crowdfund / DAO Factory

Located in `~/work/zoo/zoo/contracts/src/crowdfund/`:

| Contract | Purpose |
|----------|---------|
| **ZooDAO.sol** | DAO contract for crowdfund projects |
| **DAOFactory.sol** | Factory for creating project DAOs |
| **CrowdfundProject.sol** | Individual crowdfund project |
| **KeeperToken.sol** | Governance token for project donors |

---

## Deployment Scripts

Located in `~/work/zoo/zoo/contracts/deploy.backup/`:

| Script | Purpose |
|--------|---------|
| `00_token.ts` | ZOO token deployment |
| `01_faucet.ts` | Faucet deployment |
| `02_weth.ts` | WETH deployment |
| `05_v2factory.ts` | Uniswap V2 Factory |
| `06_v2router02.ts` | Uniswap V2 Router |
| `07_pair.ts` | LP pair creation |
| `09_dao.ts` | DAO deployment |
| `10_bridge.ts` | Bridge deployment |
| `11_market.ts` | NFT market deployment |
| `12_media.ts` | Media contract deployment |
| `13_zookeeper.ts` | ZooKeeper deployment |
| `14_drop.ts` | Drop contract deployment |
| `15_auction.ts` | Auction deployment |
| `16_farm.ts` | Farm deployment |
| `17_EggDrop.ts` | Egg drop deployment |
| `20_crowdfund.ts` | Crowdfund deployment |

---

## Test Suite

Located in `~/work/zoo/zoo/contracts/test/`:

| Test | Coverage |
|------|----------|
| `Auction.test.ts` | Auction mechanics |
| `Bridge.test.ts` | Cross-chain bridge |
| `Drop.test.ts` | NFT drops |
| `Farm.test.ts` | Yield farming |
| `Faucet.test.ts` | Token faucet |
| `GoveranceToken.test.ts` | Governance token |
| `Market.test.ts` | NFT marketplace |
| `Media.test.ts` | Media contract |
| `Random.test.ts` | Randomness |
| `Savage.test.ts` | Game mechanics |
| `ZOO.test.ts` | ZOO token |
| `ZooKeeper.test.ts` | ZooKeeper |
| `integration.test.ts` | End-to-end integration |

---

## Related ZIPs

| ZIP | Title |
|-----|-------|
| ZIP-0 | Zoo Ecosystem Architecture & Framework |
| ZIP-1 | Hamiltonian LLMs for Zoo |
| ZIP-2 | Genesis Airdrop to Original ZOO Token Victims |
| ZIP-4 | Gaming Standards for Zoo Ecosystem |
| ZIP-5 | Post-Quantum Security for DeFi/NFTs |
| ZIP-6 | User-Owned AI Models on Zoo |
| ZIP-12 | LP Integration (Chain-Agnostic AI Standards) |
| ZIP-13 | LP Standards Conformance and Chain Interoperability |
| ZIP-14 | Zoo KMS Integration via Lux KMS |

---

## Solidity Compiler Configuration

From `hardhat.config.ts`:

| Version | Optimizer | Runs |
|---------|-----------|------|
| 0.4.24 | Enabled | 1000 |
| 0.6.12 | Enabled | 1000 |
| 0.8.4 | Enabled | 1000 |
| 0.8.20 | Enabled | 200 |

---

## BNB Smart Chain Deployments (Legacy)

From `contracts.v4.json` - BNB mainnet (Chain ID: 56):

| Contract | Address |
|----------|---------|
| **BNB** | `0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c` |
| **DAO** | `0x85Bb05348905eDE5D6f91EC0F0B1e7957d978461` |
| **Drop** | `0x6f918d5E359276A8A4120BC4Af89d0A8a044Fe48` |

---

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

---

**Document Maintainer**: Zoo Labs Foundation
**Last Updated**: 2025-12-23
