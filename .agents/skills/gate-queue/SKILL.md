---
type: skill
title: Queue for the gate and for a claimed file
description: How to wait when another session holds the gate lock or claims the file you need, and how to come back to a free lock without re-running a failed gate. Ships wait.py with three subcommands.
tags:
  - skill
  - gate
  - parallel-sessions
---

# Queue for the gate and for a claimed file

Several agents work in this tree at once, and there are exactly two queues. One is
`.build-reports/gate.lock`: one gate run at a time, because two runs share a dev server and each
measures a tree the other is still writing. The other is the notes in `.private/AGENT_SYNC/`: a file
another session's note names is that session's until it commits. Both waits are obligatory: the lock
answering "already running" means wait, never commit without a green run of your own, and a claimed
file is taken in turns through the note. This skill is the procedure and the tool for waiting well.

## The commands

```bash
python3 .agents/skills/gate-queue/wait.py lock                    # who holds it, then wait
python3 .agents/skills/gate-queue/wait.py files src/a.js tests/b.py   # does a note claim these
python3 .agents/skills/gate-queue/wait.py gate -- src/a.js tests/b.py # wait, then gate them once
```

`gate` waits for the lock, runs `build check -- <paths>` exactly ONCE, prints the whole run and keeps
it in `.build-reports/gate-wait.log`. Exit code 0 passed, 1 failed, 2 the wait ran out. `--max-minutes`
caps the wait (40 by default) and goes after the subcommand.

The tool looks once a minute. A run lasts minutes, so a shorter look learns nothing and costs the
waiting model a call for every one.

## The mistake the tool exists to prevent

`build check` answers **1 for two different things**: the lock is held, and the tree is bad. A
hand-written `until` loop that retries on 1 therefore re-runs a FAILED gate every time, for as long
as the loop lasts — minutes of the machine, and the lock taken from every other session. On
2026-10-01 such a loop was written here and stopped before its first run.

So: only the words `already running` in the output send this tool back to waiting. A failed gate is
reported and the tool stops.

## While you wait

Do the work that needs no gate: read the code, write the TODO.md entry, write the commit message,
run the single checks your change can break (`pytest <file>`, `node --test <file>`, the one
`agent_tools.*` check that owns the rule). The gate proves a tree; it is not where facts are found.

Do not touch a file that is already inside a run in flight. The run took its digest when it started,
so an edit after that makes the commit of that path refuse — correctly. Finish the run, commit it,
then edit.

## Losing the race

The lock is taken by whoever asks first. Two sessions waiting on the same lock will not take turns
fairly, and on 2026-10-01 one lost it by eleven seconds. That is not a fault: run `gate` again, or
leave it waiting, and say in your note that you are queued, so the session that arrives next does not
think the lock is free for it.

## Limits

* Never delete another session's lock file. If the process is gone, the lock clears itself.
* Never edit a claimed file because the wait is long. Take other work, or ask that session in its
  note.
* Every clock time you report comes from `date` read at that moment.
