---
zip: 0032
title: "Zoo adopts LP-0011: Onchain Federation Registry"
author: Zach Kelling (@zeekay)
type: Standards Track
category: Interface
status: Draft
created: 2026-05-29
requires: ZIP-0031
references: LP-0011
tags: [federation, registry, brand, white-label, discovery, precompile, post-quantum, pointer]
---

# ZIP-0032: Zoo adopts LP-0011 — Onchain Federation Registry

## Abstract

Zoo adopts [LP-0011](https://github.com/luxfi/lps/blob/main/LPs/lp-0011-onchain-federation-registry.md) verbatim on the Zoo subnet. The Lux Proposal is the canonical spec for the EVM precompile at address `0x0000000000000000000000000000000000011001`, the schema, the commit-reveal flow, the JCS canonicalisation (RFC 8785), the 90-day re-attestation cadence, the 0.01 LUX anti-sybil fee, and the strict-PQ ML-DSA-65 owner-key profile. The precompile MUST be byte-identical across Lux primary C-Chain and the Zoo subnet so a single client library targets either RPC endpoint without code changes.

This document records Zoo subnet activation, the canonical Zoo `appId` map (covering DeSci primitives — species registry, conservation bonds, model registry), and Zoo-specific composition with cross-org attribution; the normative text lives in LP-0011.

## Zoo-specific notes

- **Activation**: subnet flag `zip0032-onchain-federation-registry` is gated on Zoo subnet validator-set consensus and is independent from Lux primary-network LP-0011 activation.

  | Network | Chain ID | Precompile address |
  |---------|----------|---------------------|
  | Zoo mainnet | 200200 | `0x0000000000000000000000000000000000011001` |
  | Zoo testnet | 200201 | `0x0000000000000000000000000000000000011001` |
  | Zoo devnet  | 200202 | `0x0000000000000000000000000000000000011001` |

- **Canonical Zoo `appId` table** (lowercase ASCII, byte-padded to `bytes32`):

  | `appId` | Canonical app | Canonical domain |
  |---------|---------------|-------------------|
  | `exchange` | `zooai/exchange` | `zoo.exchange` |
  | `market`   | `zooai/market` (future) | `zoo.market` |
  | `bridge`   | `zooai/bridge-shim` | `bridge.zoo.ngo` |
  | `dao`      | `zoo-labs/zoo` DAO frontend | `dao.zoo.ngo` |
  | `models`   | Zoo model registry | `models.zoo.ngo` |
  | `species`  | Zoo species registry (ZIP-0030) | `species.zoo.ngo` |
  | `bonds`    | Conservation bonds (ZIP-0101) | `bonds.zoo.ngo` |
  | `zips`     | ZIPs governance site | `zips.zoo.ngo` |
  | `docs`     | Zoo docs | `docs.zoo.network` |

- **DeSci verifiability is the primary use case**: `wellKnownHash` lets peer reviewers, model auditors, conservation-bond analytics pipelines, and species-registry indexers verify content end-to-end from a chain-rooted hash rather than trusting any one HTTPS endpoint. Mirrors, CDNs, and IPFS gateways become first-class infrastructure rather than trust roots.
- **Strict-PQ by default for attestation-bearing apps**: per ZIP-0005, Zoo apps that produce attestation-bearing artifacts (ZIP-0030 species records, ZIP-0020 impact metric oracle outputs) SHOULD always carry an ML-DSA-65 (FIPS 204, LP-4400) `ownerPubKey`. Apps that defer PQ key generation lose the ability to update / revoke when the Zoo subnet's strict-PQ profile activates.
- **Cross-org partnership attribution**: per ZIP-0031, Zoo `/.well-known/<appId>.json` payloads MAY credit Hanzo / Lux as research collaborators in JSON content — that attribution is content, not a registry-level claim. Cross-org aggregators MUST NOT infer authority based on attribution strings; only the registration owner's signature counts.
- **Bridge-shim cross-chain registration**: `zooai/bridge-shim` registered on the Zoo subnet under `(zoo, bridge)` is distinct from any `(lux, bridge)` registration on Lux mainnet — different brand, different domain, different `wellKnownHash`. Cross-brand consumers MUST query each `(brandId, appId)` independently.
- **Conservation / impact data integrity**: attestation-bearing apps SHOULD separate stable metadata (covered by `wellKnownHash`) from live data (served at a separate URL referenced from the metadata). Unexplained `wellKnownHash` mismatches on routine audit SHOULD be treated as a critical finding given Zoo's grant-funding and regulatory implications.
- **Liquidity blocklist**: the Zoo subnet's federation precompile MUST reject registrations with `brandId == bytes32("liquidity")` (same hardcoded blocklist constant as HIP-0304); Liquidity's federation registry lives on Liquid EVM (chainId 8675309) and is not bridged into Zoo.
- **v0.2 Registry/Resolver split**: Zoo subnet implementations MUST deploy BOTH precompiles atomically — `0x0000000000000000000000000000000000011001` (`FederationRegistry` resolver) AND `0x0000000000000000000000000000000000011002` (`BrandConfigStore`). Partial deployment is rejected by node bootstrap. The resolver address is unchanged from v0.1 so existing federation aggregator clients keep working without code changes.

## Reference implementation (Zoo)

- Precompile (Go, Zoo subnet EVM): inherits the LP-0011 reference implementation; subnet activation flag wired in `~/work/zoo/subnet-evm/precompile/contracts/federationregistry/` (forthcoming)
- Solidity reference contract: deployed at the same address on the Zoo subnet
- Client library: `@luxfi/federation-registry` (chainId selection targets either chain)

## See also

- [LP-0011](https://github.com/luxfi/lps/blob/main/LPs/lp-0011-onchain-federation-registry.md) — canonical spec
- [HIP-0304](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0304-onchain-federation-registry.md) — Hanzo's adoption pointer
- ZIP-0031 — Zoo's adoption of LP-0010 (HTTP `/.well-known/` predecessor)
- ZIP-0005 — Post-Quantum Security for DeFi/NFTs
- ZIP-0017 — Zoo DAO Governance Framework
- ZIP-0020 — Impact Metric Oracle
- ZIP-0030 — On-chain Species Registry
- ZIP-0101 — Conservation Bond Protocol
- IETF RFC 8615 — Well-Known URIs
- IETF RFC 8785 — JSON Canonicalization Scheme
