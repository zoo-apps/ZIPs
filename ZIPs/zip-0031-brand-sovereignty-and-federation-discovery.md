---
zip: 0031
title: "Zoo adopts LP-0010: Brand Sovereignty and Federation Discovery"
author: Zach Kelling (@zeekay)
type: Meta
category: Governance
status: Final
created: 2026-05-29
requires: ZIP-0017
references: LP-0010
tags: [brand, white-label, federation, governance, pointer]
---

# ZIP-0031: Zoo adopts LP-0010 — Brand Sovereignty and Federation Discovery

## Abstract

Zoo adopts [LP-0010](https://github.com/luxfi/lps/blob/main/LPs/lp-0010-brand-sovereignty-and-federation-discovery.md) verbatim. The Lux Proposal is the canonical spec for the brand schema, per-org sovereignty, white-label-by-fork, the `/.well-known/<appId>.json` discovery endpoint (IETF RFC 8615), the ConfigMap peer overlay, and the Liquidity isolation rule. Zoo's `zoo-labs/*` and `zooai/*` repos carry only Zoo brand data; HTTP federation discovery for Zoo apps happens at `/.well-known/<appId>.json` per the shared spec.

This document records Zoo-specific adoption details (GHCR namespace isolation, the academic-attribution exemption, and the commit log); the normative text lives in LP-0010.

## Zoo-specific notes

- **GHCR registry isolation**: per the workspace-global container-registry rule, Zoo publishes its container images exclusively under `ghcr.io/zooai/*`. Cross-org pushes (e.g. the historical Zoo DAO frontend at `ghcr.io/luxfi/dao-frontend`) are violations and have been moved. The mirror namespaces are: `ghcr.io/luxfi/*` for Lux, `ghcr.io/hanzoai/*` for Hanzo.
- **Zoo subnet branding**: the Zoo subnet runs on the Lux primary network (chainId 200200 mainnet, 200201 testnet, 200202 devnet). Explorers showing "Zoo Mainnet" or displaying the Zoo logo as chain identifier in Lux's canonical block explorer or bridge UIs is network metadata, not cross-brand pollution.
- **Academic / research collaboration attribution is exempt**: a Zoo AI model card that credits Zoo Labs Foundation, Hanzo AI, and Lux Industries as research collaborators is academic credit, not "Hanzo's brand is rendered in Zoo's app". Different intent, different rule. This exemption is Zoo-specific and is not part of LP-0010's normative text; LP-0010's cross-brand pollution rule otherwise applies in full.
- **Zoo source-tree scope**: `zoo-labs/*` and `zooai/*` GitHub repos host Zoo brand data only. No Lux / Hanzo / Pars / Liquidity brand presets, k8s manifests, or federation peer URLs in source.
- **White-label forks**: `zooai/bridge-shim` is the Zoo-branded view of the canonical `luxfi/bridge`. Each Zoo white-label of a Lux canonical app lives under `zooai/*` rather than as a runtime brand-switch in upstream.

## Reference implementation (Zoo)

| Repo | Commit | Action |
|------|--------|--------|
| `zoo-labs/zoo` | `e6bb40619` | DAO images moved `ghcr.io/luxfi/dao-*` → `ghcr.io/zooai/dao-*` (4 files) |
| `zoo-labs/zoo` | `bc8253045` | Solidity NatSpec cleanup (81 files) — brand string normalization across contracts |
| `zooai/bridge-shim` | (existing) | White-labeled Zoo view of canonical Lux bridge |

Outstanding: per-org `/.well-known/<appId>.json` endpoints for Zoo apps (exchange, market, etc.) — tracked separately.

## See also

- [LP-0010](https://github.com/luxfi/lps/blob/main/LPs/lp-0010-brand-sovereignty-and-federation-discovery.md) — canonical spec
- [HIP-0303](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0303-brand-sovereignty-and-federation-discovery.md) — Hanzo's adoption pointer
- ZIP-0032 — onchain registry sibling (adopts LP-0011)
- ZIP-0017 — Zoo DAO Governance Framework
- IETF RFC 8615 — Well-Known URIs
