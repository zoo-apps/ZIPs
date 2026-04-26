# Zoo Labs Whitepaper - Table of Contents

Source: https://zoolabs.gitbook.io/whitepaper/
Mirror date: 2026-04-26
Original publication date: October 31, 2021 (Antje Worring, Zoo Labs Foundation)

The gitbook is a JavaScript-rendered Next.js SPA but renders content server-side
inside `<main>...</main>`. `wget --recursive` only retrieved the SPA shell because
sidebar links are JS-built; sub-page URLs were harvested by regex from the rendered
HTML and fetched individually with `wget -i urls.txt`. All 31 sub-pages (plus the
root) returned full content.

## Discovered sidebar (32 pages)

- Introduction (root)
  - Abstract -- /introduction/abstract
  - Mission -- /introduction/mission
  - Market Opportunity -- /introduction/market-opportunity
  - ZOO Foundation: Conservation x Education -- /introduction/zoo-foundation-conservation-x-education
  - Zoo Animal Utility -- /introduction/zoo-animal-utility
  - Supporting Non-Profits -- /introduction/supporting-non-profits
  - Sustainability -- /introduction/sustainability
- Game-Play
  - Gameplay: Functions -- /game-play/gameplay-functions
  - Gen 0 NFT Drop -- /game-play/gen-0-nft-drop
  - Feeding, Growing, and Breeding -- /game-play/feeding-growing-and-breeding
  - Growing with the Animals -- /game-play/growing-with-the-animals
  - Zoo Animal Rewards -- /game-play/zoo-animal-rewards
  - Native Token -- /game-play/native-token
  - NFT Marketplace -- /game-play/nft-marketplace
  - Asset Transfer -- /game-play/asset-transfer
  - Collateral Backed NFTs -- /game-play/collateral-backed-nfts
  - Metaverse Companion -- /game-play/metaverse-companion
    - Artificial Intelligence -- /game-play/metaverse-companion/artificial-intelligence
  - A Cute AI Assistant -- /game-play/a-cute-ai-assistant
  - Augmented Reality App -- /game-play/augmented-reality-app
  - Roadmap -- /game-play/roadmap
- Differentiators
  - ZOO: An NFT Liquidity Protocol -- /differentiators/zoo-an-nft-liquidity-protocol
    - Sustainability Tax -- /differentiators/zoo-an-nft-liquidity-protocol/sustainability-tax
  - ZOO DAO -- /differentiators/zoo-dao
    - Decentralized Identification Services -- /differentiators/zoo-dao/decentralized-identification-services
    - XP Levels and Quests -- /differentiators/zoo-dao/xp-levels-and-quests
  - Bridging Blockchains -- /differentiators/bridging-blockchains
  - NFTs that make you smile -- /differentiators/nfts-that-make-you-smile
- Extras
  - Partnerships -- /extras/partnerships
  - Open Source -- /extras/open-source

## Image manifest (8 unique uploaded assets)

| Source slug | Local file (figures/) | Type | Original dim |
|---|---|---|---|
| icon/egg.png | egg.png | PNG | 162x180 |
| uploads/animals(1).gif | animals_1_.gif (still: animals.png) | GIF | 1440x810 |
| uploads/liquidityprotocolgif.gif | liquidityprotocol.gif (still: liquidity-protocol.png) | GIF | 1440x810 |
| uploads/Screen Shot 2022-03-01 at 6.46.44 PM.png | Screen_Shot_2022-03-01_at_6.46.44_PM.png (alias: marketplace.png) | JPEG | 2304x1277 |
| uploads/Screen Shot 2022-03-01 at 6.54.02 PM.png | Screen_Shot_2022-03-01_at_6.54.02_PM.png (alias: bridge.png) | PNG | 2304x1296 |
| uploads/Untitled 2.png | Untitled_2.png (alias: collateral.png) | PNG | 2038x1346 |
| uploads/Untitled 9.png | Untitled_9.png (alias: ai-chat.png) | JPEG | 900x913 |
| uploads/whale.png | whale.png | JPEG | 300x296 |

## Dating note

The live gitbook contains some content that post-dates 2021-10-31 (the
"Screen Shot 2022-03-01" filenames, references to "Q2 of 2022", the AI assistant
section that mentions LLMs). The reconstruction is dated October 31, 2021 per
the founder paper requirement, with a footer noting the mirror date. Content
that was clearly authored after 2021 is preserved as the consolidated founder
vision document, but the framing remains the original Antje Worring vision.
