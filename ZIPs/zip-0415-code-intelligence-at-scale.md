---
zip: 0415
title: "Code Intelligence at Scale (Zen-Code)"
description: "Zen-Code -- specialized code generation, analysis, and refactoring models trained on 1T+ tokens of curated source code"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-03
traces-from: "ZIP-0413 / Whitepaper Section 08"
follow-on:
  - "zen/papers/zen-coder_whitepaper"
  - "zen/papers/zen-coder-flash_whitepaper"
  - "zen/papers/zen-code-benchmarks"
  - "zen/papers/zen4-coder_whitepaper"
created: 2024-03-01
tags: [code-generation, zen-code, programming, refactoring, code-analysis]
requires: [0413]
references: HIP-0022
repository: https://github.com/hanzoai/zen-coder
license: CC BY 4.0
---

# ZIP-0415: Code Intelligence at Scale (Zen-Code)

## Abstract

This proposal specifies Zen-Code, the code-specialized variant of the Zen model family. Zen-Code models are continued from Zen Base (ZIP-0413) with additional pre-training on 1T+ tokens of curated source code spanning 100+ programming languages, followed by instruction tuning on code generation, analysis, refactoring, and debugging tasks. Zen-Code models power the code intelligence features in Hanzo Chat, MCP code tools, and the Hanzo agent SDK.

## Motivation

While Zen Base models have strong code capabilities from their pre-training data mixture, specialized code models achieve significantly better performance on programming tasks through:

1. Extended code pre-training that deepens understanding of syntax, semantics, and patterns
2. Code-specific instruction tuning covering generation, completion, explanation, debugging, and refactoring
3. Repository-level context understanding (not just single-file completion)
4. Fill-in-the-middle (FIM) training for inline code completion

## Specification

### Training Pipeline

1. **Base**: Start from Zen Base checkpoint (ZIP-0413)
2. **Code pre-training**: 1T tokens of deduplicated, quality-filtered source code
3. **Repository-level training**: Whole-repo context with file dependency graphs
4. **FIM training**: 50% causal, 50% fill-in-the-middle
5. **Instruction tuning**: 500K code instruction-following examples
6. **GRPO**: Preference optimization on code quality metrics (ZIP-0421)

### Code Corpus

| Language Family | Languages | Tokens |
|----------------|-----------|--------|
| Systems | C, C++, Rust, Go, Zig | 200B |
| Web | TypeScript, JavaScript, HTML, CSS | 180B |
| ML/Data | Python, R, Julia | 150B |
| JVM | Java, Kotlin, Scala | 120B |
| Mobile | Swift, Dart, Kotlin | 80B |
| Infrastructure | Bash, Dockerfile, YAML, Terraform | 60B |
| Smart Contracts | Solidity, Move, Rust (Solana) | 30B |
| Other | 80+ additional languages | 180B |

### Model Variants

| Variant | Parameters | Context | HumanEval | SWE-bench |
|---------|-----------|---------|-----------|-----------|
| Zen-Coder-Flash | 1.5B | 32K | 72.1% | -- |
| Zen-Coder | 7B | 128K | 85.3% | 38.2% |
| Zen-Coder-Pro | 72B | 128K | 92.1% | 52.7% |
| Zen4-Coder | 32B | 128K | 93.5% | 55.1% |

### Key Capabilities

- **Code generation**: Function/class/module generation from natural language
- **Code completion**: Inline completion with FIM support
- **Code explanation**: Natural language explanations of code
- **Refactoring**: Architecture-aware code restructuring
- **Bug detection**: Static analysis augmented by semantic understanding
- **Test generation**: Unit and integration test generation
- **Repository understanding**: Cross-file dependency analysis

## Research Papers

- [zen-coder_whitepaper](~/work/zen/papers/zen-coder_whitepaper.tex) -- Zen-Coder architecture and training
- [zen-coder-flash_whitepaper](~/work/zen/papers/zen-coder-flash_whitepaper.tex) -- Zen-Coder-Flash lightweight variant
- [zen-code-benchmarks](~/work/zen/papers/zen-code-benchmarks.tex) -- Code benchmark evaluation
- [zen4-coder_whitepaper](~/work/zen/papers/zen4-coder_whitepaper.tex) -- Zen4-Coder next generation

## Implementation

- **hanzo/chat**: Chat interface with code intelligence features
- **hanzo/mcp**: MCP code tools (read, write, exec, ast, git, lsp, refactor, review)
- **hanzo/operative**: Computer use with code execution capabilities (ZIP-0422)

## Timeline

- **Originated**: March 2024 (Zen-Code architecture)
- **Research**: `zen-coder_whitepaper` published Q2 2024, `zen4-coder_whitepaper` published 2025
- **Implementation**: Zen-Coder family deployed via Hanzo LLM Gateway Q2 2024
