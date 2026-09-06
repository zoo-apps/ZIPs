# Implementation audit — Go, C++ and Rust against the ZIP corpus

Where each proposal's `implementation-go`, `implementation-cpp` and
`implementation-rust` would come from. One row per assessed ZIP in
`.audit-runtimes.tsv`:

    <language>:<zip-number>	<shipped|partial|none>	<evidence>

The evidence is a path and line, or a symbol, that a reader can check. A verdict
without its reasoning is a claim nobody can re-derive.

The audit read the code and looked for the ZIP that specifies it, rather than
reading 146 proposals and guessing. A ZIP absent from the file was not assessed
in that language — which is why `not assessed` is a column in the index and not
a zero.

## What was assessed

| | shipped | partial | none | assessed |
|:--|--:|--:|--:|--:|
| Go | 0 | 10 | 5 | 15 |
| C++ | 0 | 0 | 0 | 0 |
| Rust | 0 | 1 | 0 | 1 |

Sixteen rows over 146 proposals. That is the honest size of the intersection
between the ZIP corpus and these three runtimes, and the reason is stated below
rather than worked around.

## What was left unassessed, and why

**Everything Solidity.** ZIPs 0016–0037, 0100–0113, 0201–0210, 0300–0306,
0600–0606 and 0700–0703 are token standards, vaults, DAO mechanics and NFT
protocols. Their runtime is the EVM. Grading them `none` in Rust would report
that somebody looked for Rust and found none, when the true statement is that
Rust was never the language for them.

**Everything Python or TypeScript.** The 04xx AI series (less the
precompile-adjacent 0419 and 0423), the 05xx conservation and ESG series, and
0434 land in `gym` (an axolotl fork), `brain`, `zoo-ai` and `models`. Same
reasoning.

**Seven of the twelve `repository:` rows point outside Zoo.** ZIPs 0400, 0403,
0408, 0411, 0412, 0413, 0415 and 0422 name `hanzoai/*` or `zenlm/*` repositories.
Three of those are Rust or Go — `hanzoai/search`, `hanzoai/mcp`, `hanzoai/zen` —
and could be graded by an audit of the Hanzo estate. Grading Zoo for code in
another organisation's repository would be wrong whichever way it came out.

All twelve `repository:` URLs do resolve, which is a change from the state
`LLM.md` warns about. One repository-shaped claim outside the frontmatter does
not: zip-0005:275 gives `zooai/pqc`, and `gh repo view` returns
*Could not resolve to a Repository*.

**ZIP-0810 (Z-Chain).** Rust is genuinely the right runtime for the Plonky3
STARK prover it describes, but the ZIP delegates to `luxfi/plonky3-pq` and marks
it planned at line 110. The place to look is the Lux estate.

**No C++ exists.** A search for `*.cpp`, `*.cc`, `*.cxx` and `CMakeLists.txt`
across `~/work/zoo` returns nothing. The 134,387 lines under `wallet` and 2,303
under `yapp` are `.h` only — React Native and iOS bridging headers from a Uniswap
fork, and a vendored `Sparkle.framework`. There are no C++ verdicts to give, and
the C++ row above is empty for that reason rather than by omission.

## One row that collides with the index's own check

`scripts/index.py:126` refuses to write the README when a `Final` ZIP carries
`implementation-go: none`, on the ground that `Final` and `none` are two claims
about one body of code and one of them is wrong. Exactly one row here trips it:

    go:0803  none   ZIP-0803, Encrypted Streaming Replication, status Final

Applying it means first deciding whether ZIP-0803 is really Final. The search
was: `luxfi/replicate`, `zapdb-replicator` and `ghcr.io/zoolabs/replicate`
across every yaml, Dockerfile and `.go` under `~/work/zoo` — zero hits, against
a ZIP that names three upstream Go sidecars at lines 272–274. The other four
`none` rows are on Draft proposals and raise no such contradiction.

## The Go story is nine thousand lines of import lists

Zoo's Go across ten repositories is 9,538 lines, and none of it implements a
cryptographic, consensus or DEX primitive. ML-DSA, ML-KEM, SLH-DSA, Corona,
Pulsar, FROST, CGGMP21, FHE, the AI and inference precompiles and the DEX VM all
arrive as blank imports of `github.com/luxfi/precompile/*` at published versions
— `node/vm/factory.go` and `chains/zoo-evm/main.go` are, between them, mostly an
import block. No repository carries a `replace` directive; the one in
`node/go.mod:278` is commented out.

That is a defensible engineering posture: Zoo consumes Lux as a dependency
rather than forking it. But it means "implemented in Go" is true of almost no
ZIP in the sense the field asks about, which is why every Go verdict above is
`partial` or `none` and none is `shipped`. What Zoo's Go decides is which
primitives to link and what the genesis says.

## The node binary and the EVM plugin disagree about post-quantum finality

`chains/zoo-evm/main.go:56` registers `luxfi/precompile/pulsar` at `0x012204`.
`node/vm/factory.go` never imports it — grep returns zero. ZIP-0812 pins
Pulsar-M-65 as the primitive that ZIP-0811's Q-Chain finality consumes, so the
artifact an operator actually runs is missing the primitive the mirror ZIPs
depend on, while a sibling plugin has it.

ZIP-0811 compounds this by naming a VM at `zooai/node/chains/quasarvm`. That
path does not exist; `zoo/node` has no `chains/` directory at all, and
`zooai/chains` ships `quantumvm` under the upstream module path
`github.com/luxfi/chains/quantumvm/plugin`.

## `zooai/node` holds two unrelated projects under one name

The repository contains a 2,732-line Go L1 node and a 553,327-line Rust AI agent
node, side by side. The Rust half splits into `hanzo-libs` (248,750 lines),
`hanzo-bin` (96,111), `zoo-libs` (125,390) and `zoo-bin` (81,450), and `zoo-libs`
is a name-for-name fork of `hanzo-libs`: `zoo-fs` and `hanzo-fs` have identical
file counts and byte-identical sources modulo the string substitution. `zoo-libs`
is the older snapshot — it still carries the pre-rename Shinkai crate names
(`crypto-identities`, `message-primitives`, `tools-primitives`, `sqlite`) while
`hanzo-libs` has since gained 33 crates it never got. Retained LICENSE files
under `hanzo-tools-runner` and `hanzo-runner` show the same lineage, and
`app/apps/zoo-desktop/src-tauri/src/galxe.rs` survives untouched from the
Shinkai desktop application.

## The most substantial original Rust in the estate has no ZIP

`zoo/operator` is 2,014 lines carrying four working CRDs — `ZooNetwork`,
`ZooChain`, `ZooExplorer` and `ZooGateway` under group `zoo.network/v1alpha1` —
a 919-line controller and a leader elector, built on `hanzoai/operator-core`. No
ZIP describes it. Meanwhile ZIP-0014's KMS integration is four lines of
Dockerfile with a `main.go` that prints instructions instead of following them,
and ZIP-0015 is Final asserting L2 while `node/main.go:4` and `evm/main.go:4`
both call the same binary a sovereign L1 and zip-0036:53 records the Zoo EVM as
not bootstrapped. The corpus and the code are miscalibrated in both directions
at once.
