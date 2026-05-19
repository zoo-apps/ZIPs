# Zoo Improvement Proposals (ZIPs) — Agent Knowledge Base

**Repository**: github.com/zooai/zips
**Site**: zips.zoo.ngo

## Purpose (one-liner)

Formal proposals for the Zoo Labs Foundation L2 (on Lux). ZIPs mirror
the canonical Hanzo HIPs for Zoo's specific use of the Lux platform.

## Post-E2E-PQ State (current)

Twelve ZIPs landed this session, mirroring the Hanzo HIPs and Lux LPs
for the E2E-PQ proposal set.

### ZIPs that landed this session

| ZIP | Mirrors HIP | Mirrors LP | Topic |
|-----|-------------|------------|-------|
| ZIP-0809 | HIP-0077 | LP-168 | Mesh Identity |
| ZIP-0810 | HIP-0078 | LP-169 | Z-Chain |
| ZIP-0811 | HIP-0079 | LP-170 | Q-Chain |
| ZIP-0812 | HIP-0084 | LP-171 | Pulsar-M DKG |
| ZIP-0813..0820 | HIP-0085..0104 | LP-172..179 | E2E PQ coverage |

### Recent significant commits

| SHA | Impact |
|-----|--------|
| `d1cdd90` | ZIP-0813..0820 — mirror HIP-0085..104 |
| `93c72f8` | ZIP-0809..0812 — mirror HIP-0077/0078/0079/0084 for Zoo |
| `6847056` | fix(ZIP-0900): YAML front matter — required by validate-zips |
| `ba350fc` | ZIP-0033 DID, ZIP-0034 XP+quests, ZIP-0804..0900 launch + chronology |
| `6edb753` | ZIP-0900: chain-set framing + native Lux primary access |

### Cross-repo coherence
- This repo's ZIPs MIRROR `hanzoai/hips` HIP-0077..0104, adapted for
  Zoo's L2 architecture on Lux.
- Body text uses Zoo-specific paths and naming where applicable; all
  cross-references point back to the canonical Hanzo HIPs.
- All three repos (HIPs / LPs / ZIPs) share the same red-finding
  closure list (F92-F112).

### Active versions
- No semver tag scheme; proposals are content-addressed by ZIP number.
- Latest landed: ZIP-0820.

### Cross-repo dependencies
- `hanzoai/hips` → authoritative HIP text (Zoo mirrors).
- `luxfi/lps` → Lux network mirror for the same proposal set.
- `luxfi/consensus`, `luxfi/node`, `luxfi/crypto` → reference
  implementations the proposals describe.

### Where to look for X
- ZIP front matter validator: `scripts/validate-zips`
- Index: `INDEX.md`
- Authoritative text: `ZIPs/zip-XXXX.md`

## Rules

1. Mirror, don't fork: text changes in HIP-XXXX should propagate to
   ZIP-XXXX with the same revision number.
2. `validate-zips` requires YAML front matter; CI will fail without it.
3. Per CLAUDE.md: never bump ZIP numbers backwards; never duplicate ZIP
   numbers across repos.
