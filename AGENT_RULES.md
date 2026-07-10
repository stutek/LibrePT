# AI Agent Operating Rules (`AGENT_RULES.md`)

This document defines universal behavioral and interaction rules for any AI coding assistant or agent (Gemini, Claude, Codex/OpenAI, Cursor, etc.) contributing to the **OpenPT** repository.

---

## 1. Core Operating Directive: Meaningful Progression with Minimum Distraction

Every response and tool action must drive measurable, continuous progress toward the user's core outcome: **building an elegant, low-interaction, offline-first Personal Trainer platform**.
- **Avoid Fluff**: Keep conversational responses concise, structured, and focused on decisions, trade-offs, and implementation progress.
- **Single-Source of Truth**: Maintain terminology consistency across documentation (`README.md`, `use_cases/`) and code. Do not introduce redundant patterns or conflicting architectural concepts.

---

## 2. Mandatory Interaction Protocol: Detect, Evaluate, and Identify Gaps

For every interaction and turn, the agent MUST follow this analytical workflow:

### A. Detect & Evaluate User Changes
1. **Monitor Workspace Edits**: Inspect any user modifications made to documentation, markdown files, diagrams, or source code since the last turn.
2. **Evaluate Intent & Impact**: Explicitly acknowledge significant user edits, explain how they refine the system architecture or domain model, and align subsequent actions with the user's updated direction.

### B. Proactive Gap Identification & Proposed Improvements
1. **Spot Edge Cases & Ambiguities**: Actively evaluate current workflows against real-world gym conditions (e.g., basement gym offline states, sweaty hands, group session interruptions, client cancellations).
2. **Propose Actionable Enhancements**: When a design or architectural gap is identified, propose specific, low-interaction improvements rather than asking open-ended questions.

---

## 3. Core Domain & Architectural Guardrails for OpenPT

Whenever writing or reviewing specifications and code for OpenPT, agents must adhere to these established system principles:

1. **Gym Floor UX (The PT Clipboard Dashboard)**:
   - **Single-Exercise Focus Card**: Active session views display only the current exercise in focus—zero vertical scrolling across past or future exercises.
   - **Frictionless Participant Switching**: Sub-second tab transitions with as few clicks and scrolls as possible.
   - **Low-Interaction Signals**: Rely on one-tap progression/safety buttons (`[ ⬆ Load Up Next ]`, `[ ⬇ Step Back ]`, `[ ⚠️ Pain/Injury Flag ]`) and hold-to-record **Voice Notes** rather than mobile keyboard typing.
2. **Google Calendar-First Scheduling**:
   - Do **not** build custom client booking web apps or auth forms.
   - Use **Google Calendar Appointment Schedules** as the canonical engine for slot publishing, client self-subscription, capacity enforcement, and automated email invites.
3. **Local-First & Offline Resilience**:
   - Session execution tracking must function 100% offline via local caching, syncing asynchronously to the cloud backend when connectivity returns.
