---
type: guidelines
title: LibrePT Agent Interaction & Development Rules
description: Mandatory interaction protocols, direct execution rules, modular-code architecture standards, and single-source-of-truth pointers for AI agents working on LibrePT.
status: active
tags:
  - agent-rules
  - workflow
  - modularity
  - okf
---

# AI Agent Operating Rules (`AGENT_RULES.md`)

This document defines universal behavioral and interaction rules for any AI coding assistant or agent (Gemini, Claude, Codex/OpenAI, Cursor, etc.) contributing to the **LibrePT** repository.

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
1. **Evaluate User Changes**: Explicitly evaluate user modifications and input, highlighting how they refine the LibrePT domain model or improve real-world gym ergonomics.
2. **Call Out Gaps & Edge Cases**: Actively identify real-world training friction (e.g., basement gym offline states, sweaty hands, quick equipment pivots, group session distractions).
3. **Propose Opportunities**: Proactively call out architectural opportunities and enhancements that make the system more robust and frictionless.

---

## 3. Single Source of Truth Reference

To prevent drift and redundant documentation, agents MUST NOT duplicate feature lists or domain specifications in this rules file. Always reference the canonical sources of truth:
- **System Architecture & Features**: See [README.md](file:///home/simon/Projects/LibrePT/README.md).
- **Functional Workflows & Use Cases**: See [use_cases/](file:///home/simon/Projects/LibrePT/use_cases/).

---

## 4. Open Knowledge Format (OKF v0.1) Documentation Standards

All specifications, architectural documentation, and use cases in this repository must strictly adhere to Google's **Open Knowledge Format (OKF v0.1)**:
1. **Mandatory YAML Frontmatter**: Every Markdown file MUST begin with YAML frontmatter containing at minimum the `type` field (`overview`, `guidelines`, `use_case`, `index`), along with `title`, `description`, `status`, and `tags`.
2. **Directory Indexing (`INDEX.md`)**: Every directory containing knowledge files MUST maintain an `INDEX.md` catalog table listing its files, their `type`, and clickable Markdown links.
3. **Graph Interconnectivity**: Use explicit Markdown links (`[label](file:///path)`) to connect related concepts across files so AI agents can traverse the repository knowledge graph reliably.

---

## 5. Modular Code Architecture: Small Files, Clear Seams, Self-Documenting

The front-end is a buildless native-ES-module app under `src/`. Keep it navigable and
parallel-friendly by favouring many small, single-responsibility files over large ones. Small
files reduce the context an agent must load to make a change, let separate concerns be edited in
parallel without collisions, and make the directory tree itself act as documentation.

1. **One responsibility per file.** A UI element, a data entity, or a single concern belongs in its own module. When a self-contained unit inside the entry file (`src/app.js`) grows, extract it. Prefer a file an agent can read in full over scrolling a multi-thousand-line file.
2. **Organise by concern in subfolders.** UI components in `src/components/`, seed data per entity in `src/data/`, browser tests in `tests/e2e/`, static/unit tests in `tests/unit/`. Group tests by feature/component — not one file per test, and not one monolithic file for everything.
3. **Decouple with dependency injection, not cross-imports.** Extracted components receive the app-level helpers they need as parameters (`state`, `t`, `escapeHTML`, launch callbacks). For globals that get reassigned (`activeSession`, `state`), pass an *accessor* (`getActiveSession()`) so the module always reads the current value. This avoids circular imports and keeps modules independently testable.
4. **Self-document at the top of every module.** Begin each file with a short comment naming its single responsibility and listing its injected dependencies. Choose descriptive names over clever ones — a reader should understand a file without opening its call site.
5. **Keep the runtime app in `src/`; keep the root clean.** Only the app entry, its modules, and its assets live under `src/`. Dev tooling, docs, and CI configuration stay out of the app tree. Source files must never sit loose at the repository root.
6. **Update the catalog when the module map changes.** When you add, move, or remove a module, update the *Source Modules & UI Components* table in [INDEX.md](file:///home/simon/Projects/LibrePT/INDEX.md) in the same change, so the knowledge graph stays a reliable map of the codebase.
