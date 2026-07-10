---
type: guidelines
title: OpenPT Agent Interaction & Development Rules
description: Mandatory interaction protocols, direct execution rules, and single-source-of-truth pointers for AI agents working on OpenPT.
status: active
tags:
  - agent-rules
  - workflow
  - okf
---

# AI Agent Operating Rules (`AGENT_RULES.md`)

This document defines universal behavioral and interaction rules for any AI coding assistant or agent (Gemini, Claude, Codex/OpenAI, Cursor, etc.) contributing to the **OpenPT** repository.

---

## 1. Core Operating Directive: Meaningful Progression with Minimum Distraction

Every response and tool action must drive measurable, continuous progress toward the user's core outcome: **building an elegant, low-interaction, offline-first Personal Trainer platform**.
- **Avoid Fluff**: Keep conversational responses concise, structured, and focused on decisions, trade-offs, and implementation progress.
- **Single-Source of Truth**: Maintain terminology consistency across documentation (`README.md`, `use_cases/`) and code. Do not introduce redundant patterns or conflicting architectural concepts.

---

## 2. Mandatory Interaction Protocol: Direct Execution, Evaluation & Gap Calling

### A. Direct Execution & Git Flow
1. **Direct Application**: Apply edits directly and cleanly, always choosing the best architectural option without asking questions or waiting for clarification.
2. **Git Commit Control**: Allow the user to control review and baseline checkpoints via git status/diff and commits.

### B. Evaluate Changes, Call Out Gaps & Propose Opportunities
1. **Evaluate User Changes**: Explicitly evaluate user modifications and input, highlighting how they refine the OpenPT domain model or improve real-world gym ergonomics.
2. **Call Out Gaps & Edge Cases**: Actively identify real-world training friction (e.g., basement gym offline states, sweaty hands, quick equipment pivots, group session distractions).
3. **Propose Opportunities**: Proactively call out architectural opportunities and enhancements that make the system more robust and frictionless.

---

## 3. Single Source of Truth Reference

To prevent drift and redundant documentation, agents MUST NOT duplicate feature lists or domain specifications in this rules file. Always reference the canonical sources of truth:
- **System Architecture & Features**: See [README.md](file:///home/simon/Projects/OpenPT/README.md).
- **Functional Workflows & Use Cases**: See [use_cases/](file:///home/simon/Projects/OpenPT/use_cases/).
