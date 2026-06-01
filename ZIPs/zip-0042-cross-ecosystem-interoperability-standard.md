---
zip: 0042
title: "Zoo adopts LP-3512 + HIP-0101: Cross-Ecosystem Interoperability"
description: "Adoption pointer for cross-chain messaging (LP-3512 Warp) and Zoo<->Hanzo bridge (HIP-0101), with Zoo-specific appId, fee, and DeSci notes"
author: Zoo Protocol Foundation
type: Standards Track
category: Core
status: Draft
created: 2025-01-15
updated: 2026-06-01
requires: [0005, 0017, 0022, 0032]
references: [LP-3512, LP-3650, LP-5000, LP-4030, LP-4099, HIP-0101]
tags: [interop, cross-chain, warp, bridge, federation, ai-attestation, adoption-pointer]
---

# ZIP-0042: Cross-Ecosystem Interoperability Standard

## Abstract

Zoo adopts [LP-3512 (Warp Cross-Chain Messaging Precompile)](https://github.com/luxfi/lps/blob/main/LPs/lp-3512-warp-cross-chain-messaging-precompile.md)
as the canonical transport for Zoo <-> Lux cross-chain messages, and
[HIP-0101 (Hanzo-Lux Bridge Protocol Integration)](https://github.com/hanzoai/HIPs/blob/main/HIPs/hip-0101-hanzo-lux-bridge-protocol-integration.md)
as the canonical Hanzo bridge profile. The Warp precompile at
`0x0200000000000000000000000000000000000005` MUST be byte-identical on the
Zoo subnet (chain IDs 200200 / 200201 / 200202) and Lux primary network, so a
single client library targets either RPC endpoint without code changes.

This ZIP no longer duplicates the cross-chain transport schema; it records
Zoo subnet activation, the cross-ecosystem `appId` map (extending ZIP-0032),
AI-attestation hooks via [LP-5000](https://github.com/luxfi/lps/blob/main/LPs/lp-5000-a-chain-ai-attestation-specification.md),
and Zoo-specific composition for DeSci and conservation use cases. The
normative transport, BLS quorum, and bridge text lives in LP-3512 and
HIP-0101.

## Motivation

The 2025-01 draft of this ZIP duplicated transport-layer text that the
Lux and Hanzo standards already specify, and referenced LP numbers that
were renumbered or never minted (the prior draft cited "LP-176" and
"LP-226" which do not exist in the current LP set). Following the
pattern set by ZIP-0031 / ZIP-0032 (adoption pointers for LP-0010 /
LP-0011), this ZIP collapses to a thin adoption record so that:

1. Spec changes land in `luxfi/lps` (transport) or `hanzoai/HIPs`
   (bridge) first, and are automatically authoritative on the Zoo
   subnet.
2. Zoo-specific framing (DeSci verifiability, conservation data
   integrity, strict-PQ default) is documented exactly once.
3. Cross-org composition rules (attribution, blocklist, brand
   sovereignty) inherit from ZIP-0031 / ZIP-0032 without re-statement.

## Zoo-specific notes

### Activation

Subnet flag `zip0042-cross-ecosystem-interoperability` is gated on Zoo
subnet validator-set consensus and is independent from Lux primary-
network LP-3512 activation (which has activation flag
`lp2515-warp-precompile`, hard-fork name "Teleport").

| Network     | Chain ID | Warp precompile address                      |
|-------------|----------|----------------------------------------------|
| Zoo mainnet | 200200   | `0x0200000000000000000000000000000000000005` |
| Zoo testnet | 200201   | `0x0200000000000000000000000000000000000005` |
| Zoo devnet  | 200202   | `0x0200000000000000000000000000000000000005` |

### Cross-ecosystem `appId` extension

ZIP-0032 defines the Zoo-local `appId` table for the federation
registry (LP-0011). For cross-ecosystem messages routed via LP-3512,
the same `appId` values MUST be used, prefixed by the source brand:

| Source brand | `appId`   | Canonical app on source         |
|--------------|-----------|---------------------------------|
| `zoo`        | `bridge`  | `zooai/bridge-shim`             |
| `zoo`        | `models`  | Zoo model registry              |
| `zoo`        | `species` | Zoo species registry (ZIP-0030) |
| `zoo`        | `bonds`   | Conservation bonds (ZIP-0101)   |
| `lux`        | `bridge`  | Lux primary network bridge      |
| `hanzo`      | `bridge`  | HIP-0101 lock-and-mint endpoint |

Cross-brand consumers MUST query each `(brandId, appId)` independently
via the LP-0011 federation registry (see ZIP-0032); they MUST NOT infer
authority based on attribution strings inside payloads.

### AI-attestation flows (LP-5000)

When a cross-ecosystem message carries AI model outputs (e.g. a Zoo
species-classification result reused on Hanzo, or a Hanzo-generated
recommendation consumed by a Zoo conservation bond), the payload
SHOULD include an LP-5000 A-Chain attestation reference (TEE quote
hash + A-Chain block height). Verifying parties on the receiving
chain MAY require a valid attestation before accepting the message.

This is the cross-ecosystem analog of the per-call attestation rule
in ZIP-0419 (Proof of AI Consensus) and ZIP-0423 (Privacy-Preserving
AI Training).

### Gas and fee accounting

Cross-chain message fees follow LP-3650 (Dynamic Gas Pricing) on the
Lux side and the Zoo subnet's local fee table on the Zoo side. The
prior fee-split numbers from the 2025-01 draft (40% validators /
30% LPs / 20% treasury / 10% insurance) are NOT normative; the
Lux validator-set reward share is set by LP-3512, and the Zoo
subnet's treasury / insurance shares are governed by ZIP-0017
(DAO Governance) and ZIP-0018 (Treasury Management).

### Strict-PQ by default for attestation-bearing flows

Per ZIP-0005 and ZIP-0032, Zoo cross-ecosystem messages that carry
attestation-bearing artifacts (ZIP-0030 species records, ZIP-0020
impact metric oracle outputs, ZIP-0101 conservation bond data)
SHOULD carry an ML-DSA-65 (FIPS 204) signature in addition to the
BLS aggregate signature used by LP-3512 transport. The Lux
post-quantum profile is normatively specified by LP-4030 (Lux Q
Security: Post-Quantum P-Chain Integration) and LP-4099 (Quasar
quantum-secure consensus protocol family).

### Liquidity blocklist

The Zoo subnet's LP-3512 implementation MUST reject incoming Warp
messages with `sourceBrand == bytes32("liquidity")` (same hardcoded
blocklist constant inherited from ZIP-0032 / HIP-0304). Liquidity's
cross-chain transport lives on Liquid EVM (chainId 8675309) and is
not bridged into Zoo.

### Conservation / DeSci verifiability

Cross-ecosystem messages used in DeSci flows (research data, peer
review attestations, reproducibility records under ZIP-0606) SHOULD
separate stable metadata (transported via LP-3512 payload + hash)
from live data (referenced by URL with `wellKnownHash` verification
per ZIP-0032). Unexplained hash mismatches on routine audit SHOULD
be treated as a critical finding given Zoo's grant-funding and
regulatory implications.

## Reference implementation (Zoo)

- Warp precompile (Go, Zoo subnet EVM): inherits the LP-3512 reference
  implementation; subnet activation flag wired in
  `~/work/zoo/subnet-evm/precompile/contracts/warp/` (forthcoming).
- Hanzo bridge endpoint: per HIP-0101, lock-and-mint at the 7-of-11
  multi-signature validator set drawn from both networks.
- Client library: `@luxfi/warp-messenger` (chainId selection targets
  Zoo subnet or Lux primary).

## Security considerations

Inherits the security model of LP-3512 (BLS validator quorum, default
67% threshold) and HIP-0101 (7-of-11 multi-signature). Zoo-specific
risks:

- **Subnet validator set divergence**: the Zoo subnet validator set is
  smaller than Lux primary; the LP-3512 quorum threshold MUST be
  enforced relative to the Zoo subnet validator set, not Lux primary.
- **AI-attestation freshness**: LP-5000 attestation references in
  cross-ecosystem payloads SHOULD be checked for staleness; the
  recommended freshness window is 24 hours unless a tighter bound is
  set by the consuming application.
- **Replay across activation flags**: Zoo subnet implementations MUST
  bind Warp message replay protection to both the Lux primary chainId
  AND the Zoo subnet chainId, to prevent a Lux-mainnet message being
  replayed on the Zoo subnet.

## See also

- [LP-3512](https://github.com/luxfi/lps/blob/main/LPs/lp-3512-warp-cross-chain-messaging-precompile.md) -
  canonical Warp transport spec
- [LP-3650](https://github.com/luxfi/lps/blob/main/LPs/lp-3650-dynamic-gas-pricing.md) -
  dynamic gas pricing
- [LP-5000](https://github.com/luxfi/lps/blob/main/LPs/lp-5000-a-chain-ai-attestation-specification.md) -
  A-Chain AI attestation
- [LP-4030](https://github.com/luxfi/lps/blob/main/LPs/lp-4030-lux-q-security-post-quantum-p-chain-integration.md) -
  PQ P-Chain integration
- LP-4099 (Quasar PQ consensus family) -
  `lp-4099-q-chain-quantum-secure-consensus-protocol-family-quasar.md` in
  [luxfi/lps](https://github.com/luxfi/lps)
- [HIP-0101](https://github.com/hanzoai/HIPs/blob/main/HIPs/hip-0101-hanzo-lux-bridge-protocol-integration.md) -
  Hanzo-Lux Bridge
- ZIP-0005 - Post-Quantum Security for DeFi/NFTs
- ZIP-0017 - Zoo DAO Governance Framework
- ZIP-0018 - Treasury Management Protocol
- ZIP-0022 - Multi-Chain Bridge Standard
- ZIP-0030 - On-chain Species Registry
- ZIP-0031 - Zoo adopts LP-0010 (Brand Sovereignty)
- ZIP-0032 - Zoo adopts LP-0011 (Onchain Federation Registry)
- ZIP-0101 - Conservation Bond Protocol
- ZIP-0419 - Proof of AI Consensus
- ZIP-0423 - Privacy-Preserving AI Training
- ZIP-0606 - Reproducibility Attestation

## License

CC BY 4.0
