---
zip: 0025
title: "Zoo Brand Sovereignty and Federated App Discovery"
author: Zach Kelling (@zeekay)
type: Meta
category: Governance
status: Final
created: 2026-05-29
requires: ZIP-0017
tags: [brand, white-label, federation, governance]
---

# ZIP-0025: Zoo Brand Sovereignty and Federated App Discovery

## Abstract

Zoo apps (Market, Exchange, Bridge-Shim, DAO Governance, the Zoo AI model family registry, etc.) consume Zoo's own brand assets and ship with **only Zoo brand data** in their source trees. White-label forks under other orgs (Lux, Hanzo, Pars, Liquidity) own their brand independently. Apps expose `/.well-known/<appId>.json` per IETF RFC 8615 so federated discovery surfaces can resolve a peer's brand identity, chain bindings, and capabilities at runtime. Federation peer lists ship empty in source and are populated via runtime ConfigMap at deploy time.

## Motivation

Zoo Labs Foundation publishes open-source AI research and operates the Zoo subnet on the Lux primary network (chainId 200200). Zoo's repos historically held cross-brand artifacts that violated org-sovereignty boundaries:

- DAO governance container images at `ghcr.io/luxfi/dao-*` instead of `ghcr.io/zooai/dao-*` (wrong org's GHCR namespace per the registry isolation rule)
- Tenant manifests for non-Zoo brands inside Zoo source repos
- Brand presets for Hanzo / Pars / Liquidity inside Zoo OSS code

The fix is structural: Zoo source repos carry only Zoo brand data. Per-org GHCR namespaces are honored (`zooai/*` for Zoo's images, `luxfi/*` for Lux's, etc.). Other-brand white-label deployments live in those brands' org namespaces.

## Specification

### 1. Brand data isolation

Zoo source repos (`zoo-labs/*` and `zooai/*` on GitHub) MUST carry only Zoo brand data. Specifically forbidden:

- Brand presets for Lux, Hanzo, Pars, Liquidity, or any other org
- K8s manifests for non-Zoo deployments
- Federation peer URLs pointing to other orgs' deployments (in source; runtime ConfigMap is fine)
- Cross-org logo assets used as the Zoo app's identity
- Code comments referencing other orgs' brand identity

Exempt:

- **Partnership / collaboration attribution** (e.g. "Zoo AI is developed by Zoo Labs Foundation in collaboration with Hanzo AI and Lux Industries") — academic / research credit is not brand pollution
- Genuine OSS dependency imports (`from "@luxfi/exchange"`, etc.)
- Chain identity metadata for the Lux primary network or sibling subnets

### 2. GHCR registry isolation

Per the workspace-global rule:

| Org | GHCR namespace |
|-----|----------------|
| Lux | `ghcr.io/luxfi/*` |
| Hanzo | `ghcr.io/hanzoai/*` |
| Zoo | `ghcr.io/zooai/*` |

Zoo MUST publish its container images under `ghcr.io/zooai/*`. Cross-org pushes (e.g. Zoo's DAO frontend at `ghcr.io/luxfi/dao-frontend`) are violations and MUST be moved.

### 3. White-label by fork

Zoo's canonical app forks live in `zoo-labs/*` and `zooai/*`. White-labeled deployments for other ecosystems happen in those ecosystems' org namespaces (e.g. there's a `zooai/bridge-shim` for the Zoo-branded view of the canonical `luxfi/bridge`).

No `BRAND_ID=<id>` runtime multiplexing — each fork carries its own brand and only its own brand.

### 4. Federation discovery — `/.well-known/<appId>.json`

Each Zoo app exposes its identity at `/.well-known/<appId>.json` per IETF RFC 8615:

```json
{
  "brandId": "zoo",
  "appId": "exchange",
  "title": "Zoo Exchange",
  "domain": "zoo.exchange",
  "url": "https://zoo.exchange",
  "github": "https://github.com/zooai/exchange",
  "chain": {
    "id": 200200,
    "name": "Zoo Mainnet",
    "rpcUrl": "https://api.zoo.network/rpc",
    "explorerUrl": "https://explore-zoo.lux.network"
  },
  "peers": [],
  "capabilities": ["swap", "lp", "limit-order"],
  "apiVersion": "1",
  "apiBase": "https://zoo.exchange/api/v1"
}
```

Same shape as LP-0010 and HIP-0303. Peers ship empty; ConfigMap overlay supplies the runtime peer list.

### 5. Zoo subnet branding

The Zoo subnet runs on the Lux primary network (chainId 200200). Explorers showing "Zoo Mainnet" or displaying the Zoo logo as chain identifier (in Lux's canonical block explorer at `explore.lux.network`, in bridge UIs, etc.) is network metadata, not cross-brand pollution. Chain identity is named after the deployment, not the org's marketing surface.

### 6. Liquidity isolation

Zoo source trees MUST NOT contain references to Liquidity (`liquidityio/*` repos, regulated US securities ATS). Zero substring matches for `Liquidity.io`, `@liquidityio/*` in Zoo source. The inverse rule is codified in Liquidity's CLAUDE.md.

## Rationale

**Why no multi-tenant runtime?** A `BRAND_ID=<id>` env switch would make Zoo's canonical apps the dependency bottleneck for every fork's release cadence. Per-org fork model lets Zoo, Lux, Hanzo, Pars, and Liquidity engineering teams move independently.

**Why `/.well-known/`?** IETF RFC 8615 is the standard URI path prefix for service discovery. Federated aggregator UIs (e.g. a future "Zoo Market that browses agents from Hanzo Market") get standard HTTP caching and CDN behavior for free.

**Why is research collab attribution allowed but brand presets aren't?** Academic credit is a different concern from brand identity. The Zoo AI model card legitimately credits Zoo Labs Foundation, Hanzo AI, and Lux Industries as co-creators of the research. That's not "Hanzo's brand is rendered in Zoo's app" — it's "Zoo's app discloses who contributed". Different intent, different rule.

## Backwards Compatibility

- Zoo DAO governance images moved from `ghcr.io/luxfi/dao-*` to `ghcr.io/zooai/dao-*` (`zoo-labs/zoo@e6bb40619`). Operators pulling old image refs MUST update their compose/k8s files.

## Reference Implementation

| Repo | Commit | Action |
|------|--------|--------|
| `zoo-labs/zoo` | `e6bb40619` | DAO images moved `ghcr.io/luxfi/dao-*` → `ghcr.io/zooai/dao-*` (4 files) |
| `zooai/bridge-shim` | (existing) | White-labeled Zoo view of canonical Lux bridge |

Outstanding: per-org `/.well-known/<appId>.json` endpoints for Zoo apps (exchange, market, etc.) — future ZIP follow-up.

## Security Considerations

- **Brand spoofing via ConfigMap mount**: Operators must restrict ConfigMap write access via RBAC.
- **TLS-only**: `/.well-known/<appId>.json` MUST be served via HTTPS.
- **GHCR namespace squatting**: Each org's GHCR namespace MUST have access controls preventing other orgs from pushing into it.

## See Also

- LP-0010 — Lux ecosystem's same architecture
- HIP-0303 — Hanzo ecosystem's same architecture
- ZIP-0017 — Zoo DAO Governance Framework
- IETF RFC 8615 — Well-Known URIs
