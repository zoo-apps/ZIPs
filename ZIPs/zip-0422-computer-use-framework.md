---
zip: 0422
title: "Computer Use Framework (Operative)"
description: "Framework enabling AI agents to control computers through visual observation and programmatic actions -- mouse, keyboard, browser, terminal"
author: "Zoo Labs Foundation"
authors:
  - Antje Worring <antje@zoo.ngo>
  - Zach Kelling <zach@zoo.ngo>
status: Final
type: Standards Track
category: AI
originated: 2024-09
traces-from: "ZIP-0412, ZIP-0416 / Whitepaper Section 08"
follow-on:
  - "hanzo/papers/hanzo-operative"
  - "hanzo/papers/hanzo-operate-computer"
  - "zen/papers/zen-voyager"
created: 2024-09-01
tags: [computer-use, operative, gui-agent, browser-automation, desktop-automation]
requires: [0412, 0416]
references: HIP-0031
repository: https://github.com/hanzoai/operative
license: CC BY 4.0
---

# ZIP-0422: Computer Use Framework (Operative)

## Abstract

This proposal specifies Operative, a framework that enables AI agents to use computers the way humans do: by observing screen contents (screenshots, DOM trees), deciding on actions (click, type, scroll, navigate), and executing them through programmatic control of mouse, keyboard, and browser. Operative bridges the gap between AI tool use (ZIP-0412) and the millions of GUI-based applications that have no API.

## Motivation

MCP (ZIP-0412) gives agents access to 260+ tools via API. But most of the world's software is GUI-only: web applications, desktop software, mobile apps. When a conservation researcher needs to:

1. Log into a government wildlife database (GUI-only web portal)
2. Download species survey data (click through menus)
3. Process it in a desktop GIS application (GUI-only)
4. Submit results to a conservation platform (web form)

...the agent needs computer use capabilities, not just API access.

## Specification

### Architecture

```
Agent (Zen-VL + MCP) ─────────> Operative Controller
                                      │
                           ┌──────────┼──────────┐
                           │          │          │
                      ┌────┴────┐ ┌───┴───┐ ┌───┴────┐
                      │ Browser │ │Desktop│ │Terminal │
                      │ Control │ │Control│ │Control  │
                      └────┬────┘ └───┬───┘ └───┬────┘
                           │          │          │
                      Playwright   PyAutoGUI    PTY
                      CDP          Accessibility subprocess
                                   API
```

### Observation Space

| Observation Type | Source | Use |
|-----------------|--------|-----|
| Screenshot | Screen capture | Visual understanding via Zen-VL |
| DOM snapshot | Browser CDP | Structured page understanding |
| Accessibility tree | OS API | Widget identification |
| Terminal output | PTY | Command result parsing |

### Action Space

| Action | Parameters | Description |
|--------|-----------|-------------|
| click | (x, y, button) | Mouse click at coordinates |
| type | (text) | Keyboard input |
| key | (key_combo) | Special key combination (Ctrl+C, etc.) |
| scroll | (x, y, delta) | Mouse scroll |
| navigate | (url) | Browser navigation |
| wait | (condition, timeout) | Wait for element/condition |
| screenshot | () | Capture current screen state |

### Safety

- **Sandboxed execution**: All computer use happens in isolated containers
- **Action approval**: Destructive actions (delete, submit, purchase) require user approval
- **Undo capability**: All actions are logged and reversible where possible
- **Rate limiting**: Maximum actions per minute to prevent runaway agents

## Research Papers

- [hanzo-operative](~/work/hanzo/papers/hanzo-operative/) -- Operative framework specification
- [hanzo-operate-computer](~/work/hanzo/papers/hanzo-operate-computer.tex) -- Computer use architecture
- [zen-voyager](~/work/zen/papers/zen-voyager.tex) -- Zen-Voyager web navigation model

## Implementation

- **hanzo/operative**: Production computer use framework
- **hanzo/mcp**: MCP integration for computer use actions
- **hanzo/chat**: Chat interface with computer use mode

## Timeline

- **Originated**: September 2024 (Operative architecture)
- **Research**: `hanzo-operative` published Q4 2024
- **Implementation**: Operative framework deployed Q4 2024
