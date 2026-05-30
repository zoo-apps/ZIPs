---
zip: 0026
title: "Zoo Onchain Federation Registry"
author: Zach Kelling (@zeekay)
type: Standards Track
category: Interface
status: Draft
created: 2026-05-29
requires: ZIP-0025
tags: [federation, registry, brand, white-label, discovery, precompile, post-quantum]
---

# ZIP-0026: Zoo Onchain Federation Registry

## Abstract

ZIP-0026 adopts LP-0011's onchain federation registry — an EVM precompile at the canonical address `0x0000000000000000000000000000000000011001` — on the Zoo subnet (chainId 200200 mainnet, 200201 testnet, 200202 devnet) running on the Lux primary network. Zoo apps (Exchange, Market, Bridge-Shim, DAO Governance frontend, the model registry, the species registry, conservation bond UI, et al.) MAY publish their `(brandId, appId, domain, url, wellKnownHash, owner)` tuple onchain. The Zoo subnet's chain-native federation registry gives DeSci consumers (model auditors, conservation bond analytics, species-registry indexers) a verifiable, anti-spoofable answer to "which app implements `(zoo, market)` today?". It is the chain-native successor to ZIP-0025's HTTP-only `/.well-known/<appId>.json` federation discovery and composes with — does not replace — ZIP-0025.

> Naming note: there is also an existing `zip-0026-ecosystem-reputation-system.md` filed earlier under the same number. Per the ZIPs repo's existing tolerance for dual-numbered entries (`zip-0025-brand-sovereignty-and-federation-discovery.md` and `zip-0025-privacy-preserving-donations.md` already coexist), this proposal is filed under the requested `zip-0026-onchain-federation-registry.md` filename. A future editorial pass MAY renumber the ecosystem-reputation entry or this one; both currently live under ZIP-0026 by precedent.

## Motivation

ZIP-0025 standardised `/.well-known/<appId>.json` as the HTTP federation surface for Zoo apps. Two Zoo-specific use cases push beyond HTTP:

1. **DeSci verifiability.** Zoo Labs Foundation publishes open AI/science research with cryptographic provenance. A peer reviewer querying "what's the canonical Zoo model registry?" should get an answer that's verifiable end-to-end — chain-rooted, content-addressed, not dependent on a DNS resolver, a CDN, or a TLS proxy being honest. ZIP-0025 alone doesn't deliver that.

2. **Species / conservation chain composition.** ZIP-0030 (on-chain species registry), ZIP-0101 (conservation bond protocol), and ZIP-0103 (green staking) all anticipate cross-app composition: a conservation bond reads the species registry; a green staking pool reads the bond protocol's collateral state. Smart contracts on the Zoo subnet need to discover canonical sibling apps without hard-coded addresses. An onchain registry fixes the discovery problem at the layer where the composition happens.

The `wellKnownHash` binding ensures that even when an aggregator UI (a third-party DeSci portal, an external research mirror) fetches the JSON over plain HTTP, the chain-rooted hash lets them verify they got the document Zoo signed off on.

## Specification

### 1. Inherits LP-0011

This ZIP **wholly inherits** the LP-0011 specification — schema, commit-reveal flow, ML-DSA-65 strict-PQ profile, JCS canonicalisation, 90-day re-attestation, 0.01 LUX registration fee, and address `0x0000000000000000000000000000000000011001`. The precompile MUST be byte-identical across Lux primary C-Chain and the Zoo subnet; a client library targeting one MUST work against the other.

Where this ZIP says "consumer", "registrant", "watcher", "owner" — see LP-0011 for normative meaning.

### 2. Zoo subnet activation

| Network | Chain ID | Precompile address | Activation |
|---------|----------|---------------------|------------|
| Zoo mainnet | 200200 | `0x0000000000000000000000000000000000011001` | enabled at activation height |
| Zoo testnet | 200201 | `0x0000000000000000000000000000000000011001` | enabled at activation height |
| Zoo devnet  | 200202 | `0x0000000000000000000000000000000000011001` | always enabled |

The subnet runs its own activation flag (`zip0026-onchain-federation-registry`) gated on Zoo subnet validator-set consensus. Lux primary-network activation (LP-0011) is independent.

### 3. Zoo brand registration discipline

Per ZIP-0025, only Zoo source repos carry Zoo brand data. Zoo apps that wish to register on the Zoo subnet (or on Lux mainnet, or both — these are independent registrations per LP-0011 chainId binding) MUST:

1. Register with `brandId = bytes32("zoo")` (lowercase ASCII, byte-padded).
2. Use a canonical Zoo `appId`:

   | appId (bytes32 form) | Canonical app | Canonical domain |
   |----------------------|---------------|-------------------|
   | `bytes32("exchange")`   | `zooai/exchange` | `zoo.exchange` |
   | `bytes32("market")`     | `zooai/market` (future) | `zoo.market` |
   | `bytes32("bridge")`     | `zooai/bridge-shim` | `bridge.zoo.ngo` |
   | `bytes32("dao")`        | `zoo-labs/zoo` DAO frontend | `dao.zoo.ngo` |
   | `bytes32("models")`     | Zoo model registry | `models.zoo.ngo` |
   | `bytes32("species")`    | Zoo species registry (ZIP-0030) | `species.zoo.ngo` |
   | `bytes32("bonds")`      | Conservation bonds (ZIP-0101) | `bonds.zoo.ngo` |
   | `bytes32("zips")`       | ZIPs governance site | `zips.zoo.ngo` |
   | `bytes32("docs")`       | Zoo docs | `docs.zoo.network` |

3. Set `ownerPubKey` to an ML-DSA-65 (FIPS 204, LP-4400) public key for forward compatibility with strict-PQ activation. Zoo apps that produce attestation-bearing scientific artifacts (ZIP-0030 species records, ZIP-0020 impact metric oracle outputs) SHOULD always carry a PQ owner key.

### 4. DeSci consumer flow

A peer reviewer (or automated audit pipeline) verifying that `models.zoo.ngo` is the canonical Zoo model registry:

```solidity
import {IFederationRegistry} from "@luxfi/lps/contracts/IFederationRegistry.sol";

contract ModelVerifier {
    IFederationRegistry constant REGISTRY =
        IFederationRegistry(0x0000000000000000000000000000000000011001);

    function getZooModels() external view returns (string memory url, bytes32 wellKnownHash) {
        IFederationRegistry.AppRegistration[] memory rs =
            REGISTRY.getByBrandApp(bytes32("zoo"), bytes32("models"));
        require(rs.length > 0, "zoo.models not registered");
        require(!rs[0].revoked, "registration revoked");
        return (rs[0].url, rs[0].wellKnownHash);
    }
}
```

Off-chain, the auditor fetches `https://<url>/.well-known/models.json`, JCS-canonicalises the response per LP-0011 §4, hashes it, and asserts equality with `wellKnownHash`. DNS-level tampering or CDN-level substitution becomes detectable at the consumer.

### 5. Bridge-shim cross-chain registration

Per ZIP-0025, `zooai/bridge-shim` is a Zoo-branded view of the canonical `luxfi/bridge`. When the bridge-shim registers on the Zoo subnet under `(zoo, bridge)`, the registration is **distinct** from any `(lux, bridge)` registration on Lux mainnet — different brand, different domain (`bridge.zoo.ngo` vs `bridge.lux.network`), different `wellKnownHash`. Cross-brand consumers (a portal that aggregates bridges from multiple ecosystems) SHOULD query each `(brandId, bridge)` independently and not assume cross-brand equivalence.

### 6. Conservation / impact data integrity

ZIP-0020 (impact metric oracle) and ZIP-0101 (conservation bonds) emit data that downstream apps (analytics dashboards, third-party DeSci aggregators) consume. When those downstream apps register under the Zoo brand (e.g. `(zoo, bonds)`), their `wellKnownHash` covers the JSON descriptor of:

- The oracle source addresses they trust.
- The conservation bond contract addresses they expose.
- The API base URL for their bond-state queries.

A `wellKnownHash` mismatch on a routine audit indicates either a legitimate update (operator should `update()` the registration) or a compromise (the document was substituted). Conservation-domain auditors SHOULD treat unexplained mismatches as a critical finding given the regulatory and grant-funding implications.

### 7. Cross-org partnership attribution

ZIP-0025 §1 exempts academic / research collaboration attribution from the cross-brand pollution rule. A `/.well-known/<appId>.json` payload that credits Hanzo AI and Lux Industries as Zoo collaborators on a particular model does **not** require those orgs to be registered as `brandId`s in this registry; attribution is content, not registration. Only the document owner's own brand binds the `(brandId, appId)` slot.

### 8. Liquidity isolation

Per ZIP-0025 §6, Zoo source trees MUST NOT mention Liquidity. The Zoo subnet's federation registry MUST reject registrations with `brandId = bytes32("liquidity")` — enforced at the precompile level via the same hardcoded brand blocklist as HIP-0304 §7. Liquidity's federation registry lives on Liquid EVM (chainId 8675309) per Liquidity-side governance and is not bridged into Zoo.

## Rationale

**Why mirror LP-0011 verbatim on the Zoo subnet?** Address-stable, ABI-stable, semantically-stable. A Zoo-subnet contract calling out to a model registry should run identically on Lux mainnet, Hanzo subnet, or any LP-0011-compliant chain. Forking the ABI would break that portability.

**Why allow registration on either chain (or both)?** Zoo apps span chains. The DAO frontend lives at `dao.zoo.ngo` and is consumed from Lux mainnet by users; the species / conservation contracts live on the Zoo subnet and are queried from there. The dual-registration model lets each app pick the chain whose audience and security model best matches its use case.

**Why is content-addressed `wellKnownHash` valuable for DeSci?** DeSci's core promise is verifiability. A conservation impact metric, a model card, or a species record that consumers can fetch from any mirror — and verify against a chain — is much stronger than one that requires consumers to trust a specific HTTPS endpoint. Mirrors, CDNs, and IPFS gateways become first-class infrastructure rather than trust roots.

**Why ML-DSA-65 by default?** Zoo subnet aligns with Lux's PQ posture per ZIP-0005 (Post-Quantum Security for DeFi/NFTs). Apps that defer PQ key generation lose the ability to update / revoke when strict-PQ profile activates.

## Backwards Compatibility

ZIP-0026 is additive. ZIP-0025's HTTP discovery continues to work unchanged. Apps with no onchain registration are unaffected. Consumers MAY use HTTP only, onchain only, or both.

Cross-brand consumers (DeSci aggregators that index Zoo + Hanzo + Lux registries) SHOULD treat per-chain registrations as authoritative within that chain only and not silently merge across chains. The replay protection in LP-0011 §6 makes cross-chain replay impossible by design; consumers should mirror that boundary.

## Reference Implementation

- Precompile (Go, Zoo subnet EVM): inherits the LP-0011 reference implementation; subnet activation flag wired in `~/work/zoo/subnet-evm/precompile/contracts/federationregistry/` (forthcoming)
- Solidity reference contract: deployed at the same address on subnet
- TS/Go client: `@luxfi/federation-registry` (single client targets any LP-0011-compliant chain via chainId selection)

## Security Considerations

All LP-0011 security considerations apply unchanged. Zoo-subnet-specific:

- **DeSci provenance attacks**: an attacker who compromises an off-chain mirror of a Zoo dataset cannot produce a forgery that passes `verifyWellKnown()` without also compromising the onchain owner key. The composability with content-addressed mirrors (IPFS, Arweave) is straightforward: store the JCS-canonical form, hash check at retrieval time.
- **Cross-org partnership attribution confusion**: registration owners credit other orgs in the JSON payload (per §7), but those mentions do not transfer any registry-level claim. Cross-org aggregators MUST NOT infer authority based on attribution strings; only the registration owner's signature counts.
- **Species / impact / bond data integrity**: ZIP-0020 / ZIP-0030 / ZIP-0101 attestation-bearing apps SHOULD treat `wellKnownHash` rotation as a security-relevant operation; routinely-changing well-known payloads (e.g. embedded live metrics) defeat the integrity-binding purpose. Apps SHOULD separate stable metadata (covered by `wellKnownHash`) from live data (served at a separate URL referenced from the metadata).
- **Zoo PQ posture**: Per ZIP-0005, the Zoo subnet's strict-PQ activation timeline is independent of Hanzo's. App owners MUST track the Zoo activation flag and generate ML-DSA-65 keys before that height or lose the ability to update / revoke.
- **Brand-blocklist enforcement**: the Liquidity blocklist is enforced at precompile entry. Updates to this list (e.g. additional blocklisted brand strings) require a precompile upgrade and an activation flag bump; no governance backdoor exists.

## See Also

- LP-0011 — Onchain Federation Registry (canonical spec; this ZIP inherits from it)
- ZIP-0025 — Zoo Brand Sovereignty and Federated App Discovery (HTTP `/.well-known/` predecessor)
- ZIP-0005 — Post-Quantum Security for DeFi/NFTs
- ZIP-0017 — Zoo DAO Governance Framework
- ZIP-0020 — Impact Metric Oracle
- ZIP-0030 — On-chain Species Registry
- ZIP-0101 — Conservation Bond Protocol
- HIP-0304 — Hanzo subnet adoption of the same registry
- IETF RFC 8615 — Well-Known URIs
- IETF RFC 8785 — JSON Canonicalization Scheme
