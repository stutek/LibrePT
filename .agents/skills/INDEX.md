---
type: index
title: Skills every agent reads
description: The skills that bind every AI agent working on LibrePT, and the rule for what belongs here rather than in one agent's own directory.
tags:
  - index
  - skills
  - okf
---

# Skills every agent reads

A **skill** is a way of working that is longer than a rule and narrower than the architecture: how to
do one kind of job properly, with the tool it needs beside it. It binds every agent — Claude, Gemini,
Codex, Cursor — the same way [AGENT_RULES.md](../../AGENT_RULES.md) does, and it is read BEFORE doing
the work it covers, not after something has gone wrong.

**Why this directory exists, and it is not tidiness.** The exploratory-test skill lived in `.claude/`
until 2026-09-30, and `.claude/` is ignored by git — so Codex and Gemini could not read it, could not
run it, and could not learn what it already knew. On that day a Codex session left a headless browser
running for three and a half hours at most of a core, blocking every `build check` on the machine,
while the skill it could not see had carried a watchdog closing an idle browser after fifteen minutes
since long before. A skill in one agent's directory is not a skill; it is a private note.

An agent may still keep its own directory (`.claude/`, `.gemini/`) for what is genuinely its own —
settings, local state, a pointer to a skill here. Everything another agent would need is here.

## The skills

| Skill | What it covers |
| --- | --- |
| [build-watch/SKILL.md](build-watch/SKILL.md) | Waiting for the GitHub Actions runs of a pushed commit and reporting which job and which step fell, for the cheapest model that can run a command. Ships with `watch.py`, one command that waits, reads and writes the report. |
| [exploratory-test/SKILL.md](exploratory-test/SKILL.md) | Testing the app as a trainer who has never seen it and reads no documentation: forms, short scenarios, and a whole invented working day. Ships with `explore.py`, which holds one headless browser open across shell calls. |

## Adding one

A way of working becomes a skill here when it will be done again, by whoever picks the work up, and
doing it badly is expensive or invisible. It carries frontmatter, says what it is for in its first
paragraph, and names the tool it needs by a path from the repository root — a skill whose command
only works from one agent's directory has not left that directory.

Anything the skill writes while it runs — a browser profile, a scratch directory — is runtime state
and belongs in `.gitignore` beside the existing `.agents/skills/*/.session/` line, never in a commit.
