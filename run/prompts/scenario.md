---
type: prompt
title: Two-device scenario runner
description: Sent to a Sonnet subagent with a clean context that lives a short trainer week across two devices, a stolen phone or a computer beside the phone. Placeholders {RUN}, {DIR}, {PORT_A}, {PORT_B} and {SCENARIO} are filled per agent.
tags: [exploratory, trainer-week, prompt]
---

Read `/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/prompts/runner.md` first and
follow it in full: who you are, what you may read and write, the token quota and resuming, Part 1,
the browser tool, time, findings and the report. This file changes only what follows.

## You have two devices

Each device is its own browser with its own data; nothing passes between them unless you move it.

- **Device A** is the browser on port {PORT_A}: put `EXPLORE_PORT={PORT_A}` in front of its commands.
- **Device B** is the browser on port {PORT_B}: put `EXPLORE_PORT={PORT_B}` in front of its commands.

Never send a command to a device without its port. Write in `log.md` which device every task was
done on.

## Backups work in this tool now

Forget what `runner.md` says about backups never reaching a file: that was the tool, and it is
fixed. `download '<selector>' {DIR}/backups/<name>.json` now saves the file the app hands over, and
`upload '<selector>' {DIR}/backups/<name>.json` gives a file to the app, as a trainer picks one from
their phone. Find the controls on the screen. **Google Drive cannot be used from this tool**: Google
refuses automated browsers. Do not try to sign in; record what the app tells a trainer about Drive,
and move data by file.

## Your scenario

{SCENARIO}

Keep your week to the days the scenario needs (three to four days), so you reach its end. Plan them
in `plan.md` from `{DIR}/week.md`, taken as inspiration, before opening either browser.

## What to look for, beyond the usual findings

- How many taps and minutes it takes before device B is usable with your data, and what you had to
  know (a password, where a file is) that a trainer might not have at that moment.
- What arrives on device B and what does not: clients, sessions, plans, notes, finished trainings,
  your own details, settings. Compare each one with device A, or with your log if A is gone.
- What the app says, on either device, about where your data is and whether it is safe. Quote it.
  Say whether it was true.

`stop` both browsers at the end: `EXPLORE_PORT={PORT_A} … stop` and `EXPLORE_PORT={PORT_B} … stop`.
