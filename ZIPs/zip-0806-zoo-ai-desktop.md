---
zip: 0806
title: "Zoo AI Desktop"
description: "Local-first private AI desktop application that hosts the Zen model family on the user's device, with optional Zoo Cloud routing for larger models"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: ZRC
created: 2025-12-15
activation: 2025-12-25
tags: [desktop, local-ai, privacy, zen-models, mining, mcp, tauri]
related-lps: [LP-013, LP-134]
related-papers: [zoo-3-0-launch, zoo-per-llm-chains, hanzo-ai-chain]
---

# ZIP-0806: Zoo AI Desktop

## Abstract

Zoo AI Desktop is the user-facing desktop application that runs the Zen model family locally with no cloud egress by default. It is the consumer endpoint of the Zoo 3.0 GPU-native posture: the same GPU substrate that runs validator-side consensus runs user-side inference. Users with consumer GPUs run `zen4-nano` through `zen4-small` for free; users with larger workloads opt into Zoo Cloud or the Hanzo AI Chain marketplace, with optional confidential routing via F-Chain FHE (LP-013).

## Motivation

1. **Privacy-first AI.** Default posture: weights on the device, queries on the device, signing keys on the device.
2. **Free local inference.** Marginal cost is electricity, not API tokens.
3. **Mining accrual.** Idle GPU cycles earn `$AI` automatically when the user enables mining.
4. **Single distribution.** One installer covers wallet, inference, mining, and MCP tooling.

## Specification

### Stack

- Frontend: React 19 + Tauri 2.8.
- Backend: `zoo-node` (Rust), auto-spawned at launch.
- Runtimes: `llama.cpp`, `vLLM`, `ollama` — selected by hardware capability.
- Persistence: encrypted SQLite per Zoo Web5 / local-first architecture.

### Local model registry

- Auto-detects device VRAM and lists eligible Zen models.
- One-click pull from `huggingface.co/zenlm`.
- Model verification via the model's per-LLM chain provenance attestation (per `zoo-per-llm-chains`).

### Inference modes

| Mode | Routing | Cost | Privacy |
|---|---|---|---|
| Local | on-device runtime | electricity only | maximum (no egress) |
| Zoo Cloud | federated GPU capacity (LP-136) | per-token in `$AI` | TEE-attested via A-Chain |
| Hanzo Marketplace | Hanzo AI Chain HMM | per-token in `$AI` | TEE-attested via A-Chain |
| Confidential Cloud | F-Chain FHE (LP-013) | premium per-token | full ciphertext path |

### Mining

- Default: idle-time mining on the device GPU.
- Earnings: roughly 1 `$AI`/min on a recent gaming GPU at default settings; rates depend on market demand.
- Withdrawal: direct to the desktop's local wallet; no custodial path.

### MCP server

The desktop exposes a local MCP server over a Unix socket. Agents (including `zoo-bot` instances per ZIP-0807) can dial the socket to call local tools (file system, calendar, browser automation) within a capability-bounded sandbox.

### Wallet integration

- Built-in wallet using the same key material as the Lux Wallet.
- Auto-import from existing Lux Wallet installations.
- All signing happens locally; signing keys never leave the device.

## Rationale

A first-class desktop app is required because the privacy posture cannot be enforced from a web app: any web context can be compromised by the network, by browser extensions, or by malicious DNS. A native installer with code signing and an OS-enforced sandbox is the minimum viable shape for "your queries do not leave the device".

## Reference Implementation

`~/work/zoo/app` — the Tauri desktop app source.

## Security Considerations

- All telemetry is opt-in and disabled by default.
- All cloud calls require explicit user opt-in per session.
- Wallet keys are stored in the OS-native keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).
- F-Chain FHE confidential cloud mode validates the ciphertext path end-to-end before submitting; a compromised F-Chain validator cannot decrypt the user's prompt.

## References

- LP-013 — F-Chain FHE
- LP-134 — Lux Chain Topology
- `zoo-3-0-launch` paper §5 (Zoo AI Desktop)
- `zoo-per-llm-chains` paper (pooled GPU hosting)
- Hanzo AI Chain whitepaper (HMM marketplace)
