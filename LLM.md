# Zoo Improvement Proposals (ZIPs) — Agent Knowledge Base

**Repository**: github.com/zoo-apps/ZIPs
**Site**: zips.zoo.ngo

## Purpose

The specification corpus for Zoo Labs Foundation — an open AI research
network doing DeAI and DeSci. A ZIP says what Zoo is, not what anyone
once thought it would be. Historical narrative, migration paths and
compatibility shims do not belong here; delete them when you find them.

## One source of truth

A ZIP's frontmatter is the only place its facts live. Everything else is
derived:

- `scripts/index.py` reads the frontmatter and rewrites the README table.
- `docs/lib/source.ts` reads `ZIPs/*.md` directly with gray-matter and
  builds the site pages from it.

There is no hand-maintained index, no `zip-index.json`, and no second
copy of the table. If you find one, it is drift — delete it.

`scripts/index.py --check` is what CI runs. It refuses when a ZIP has no
frontmatter, carries a status outside the vocabulary, disagrees with its
own filename, shares a number with another ZIP, `requires:` a ZIP that
does not exist, or when the corpus has shrunk below the floor recorded in
the script. Raise the floor when you add ZIPs.

## Status vocabulary

Three values. `Draft` — proposed, no implementation found, or an
experiment. `Final` — the thing it specifies exists in code, and
`repository:` names where. `Living` — never finalises: policy,
registries, indexes.

Zoo is a research network, so `Draft` is an ordinary resting place. Do
not promote a ZIP to `Final` without naming the code, and do not leave it
at `Final` once that code is gone.

## Frontmatter fields

- `requires:` — a list of ZIP **numbers**, `[12, 100]`. Nothing else.
- `related-hips:` / `related-lps:` / `mirrors:` — cross-estate pointers.
  Never put `HIP-*` or `LP-*` in `requires:`.
- `repository:` — where the work lives. It must resolve; 19 of 28 of these
  named repos that had never existed, which is how proposals came to be
  marked Final with nothing behind them.

## Facts worth not getting wrong

- Zoo is an **L2** on the Lux primary network: no validator set of its
  own, `CreateChainTx` on the Lux P-chain, no `ConvertNetworkToL1Tx`.
  ZIP-0015 records this; `zooai/universe` `chain.yaml` is where it is
  declared. ZIP-0804 proposes graduating to a sovereign L1 and has not
  happened.
- Zoo's own EVM chain ID is **200200** (testnet 200201, devnet 200202,
  localnet 200203). Lux is 96369, Hanzo is 36963. A ZIP asserting the
  120/121/122 map is quoting a scheme that was never adopted.
- C-Chain is Lux Network's primary EVM. Zoo has its own EVM, not C-Chain.
- Zoo images are `ghcr.io/zooai/*`. Never `luxfi` or `hanzoai`.
- ZIP-0809..0820 pin Zoo's profile over Hanzo HIP-0077..0104; the
  primitives live in `luxfi/crypto` and `luxfi/pulsar`. Mirror, do not
  fork — a mirror pins Zoo-specific facts and cites the HIP for the wire
  format.

## Site

`docs/` is a Next app (`@hanzo/docs`, fumadocs) exported static to
`docs/out`. Type comes from `@hanzo/design/tokens/fonts.css` — Zen, via
the token layer, declared nowhere else. Build it with
`pnpm install --ignore-workspace && pnpm build` from `docs/`; the
`--ignore-workspace` matters on any box where a parent directory is a
pnpm workspace root, or install silently no-ops.
