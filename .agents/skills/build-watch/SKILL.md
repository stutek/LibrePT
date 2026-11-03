---
type: skill
title: Watch a GitHub build and report the fall
description: After a push, wait for the GitHub Actions runs of that commit, say which job and which step fell, and write the facts to a file. Ships watch.py, which stops at the report, and after_push.py, which the git pre-push hook runs to watch every push and open a session that fixes a fall.
tags:
  - skill
  - ci
  - github-actions
---

# Watch a GitHub build and report the fall

A push starts five stages on GitHub and the answer arrives ten to thirty minutes later. Waiting for
it and reading which job fell is mechanical work: no judgement, one command, a written answer.
Fixing what fell is a different job: `watch.py` never does it, and a session that only watches
hands the report on. After a push, a session opened for the fall fixes it, as the last section
but one says.

## Which model runs this

**The cheapest one available.** Haiku or Sonnet is enough, and the tool exists so that the whole job
is one command rather than a dozen — a model paid by the token should spend one call here. The
Antigravity agent can take it too (see the last section). Nothing in this skill needs a large model;
if the report says the build fell, hand the report to whoever is fixing the code.

## The one command

```bash
python3 .agents/skills/build-watch/watch.py
```

It watches `HEAD`. It prints every run of that commit, waits while any of them is still going, and
when they are all finished writes `.private/BUILD_WATCH/<short sha>.md` with the verdict. Exit code:
`0` everything passed, `1` something fell, `2` nothing to watch or the wait ran out.

Options: `--sha <sha>` for a commit other than `HEAD`, `--once` for one look without waiting,
`--interval` (seconds, never below 120) and `--max-minutes` (default 45), `--report <path>`.

The 120-second floor is not caution. GitHub allows 60 anonymous requests an hour per address, and
one look walks several endpoints, so a shorter interval buys a `403` instead of an answer.

## What you can see, and what needs a login

| Access                 | What it gives                                                |
| ---------------------- | ------------------------------------------------------------ |
| no login (public repo) | the runs, the jobs, which step fell, the failure annotations  |
| a login (see below)    | all of the above, and the log of the fallen job               |

Without a login the log endpoint answers `403 Must have admin rights to Repository.`, and the run
page in a browser is an empty shell whose content is fetched by JavaScript from a signed address —
so there is no anonymous way around it. The annotations usually say only
`Process completed with exit code 1`, which is the consequence, not the cause.

**When the log is out of reach, say so.** Report which job and which step fell, and ask for a login
or for the log pasted in. A cause nobody measured is never reported as a cause: write what fell and
what is missing, and stop there.

The tool picks a login up by itself, in this order: `GH_TOKEN`, `GITHUB_TOKEN`, then `gh auth
token`. The login is `gh`'s own; never write a token into a file, a message or this repository.

## The cheap narrowing that needs no log

Run the same command the fallen job runs, here, and say whether it falls here too. The CI job names
its command in [.github/workflows/deploy.yml](../../../.github/workflows/deploy.yml); every stage's
command is also reachable through `.venv/bin/python -m build check`.

* Falls here as well → the defect is in the code, and the local run shows it in full.
* Passes here → the difference is the environment, and the duration usually says which: a job that
  fell in 30 seconds while the suite needs 4 seconds locally did not fail an assertion, it failed to
  get ready. Compare against a pristine clone of the same commit before saying "it works here", or
  you are only reporting that your working tree holds something the push did not.

Both sentences belong in the report. Neither is a diagnosis.

## Limits

* Never re-run a job. While watching, edit nothing but the report; a fix is the next section's job.
* Every time in the report comes from `date` read at that moment.
* The report is a file, not only a message: whoever asked for the watch was not watching.

## After a push

Every push to `main`, from a terminal or an agent, starts the watch by itself through the git
`pre-push` hook, which runs `after_push.py`. A green build shows a desktop notice. A fall opens
LibrePT in VS Code with a new Claude Code tab that asks to fix it; Simon sends it with Enter. Git
does not copy hooks with a clone, so a checkout installs it once:

```bash
printf '#!/bin/sh\nexec python3 .agents/skills/build-watch/after_push.py\n' > .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

The session that the tab opens fixes the fall:

1. Exit `1` of the watch is why it exists: read the report and the fallen job's log (`gh run view <run id> --log-failed`). Run the
   job's own command here, as above. Fix the cause, run the gate, commit, and push only where a push
   is allowed; the next push starts the next watch. Never re-run a job to make it pass.
2. A fall whose cause is outside the code (a GitHub outage, a secret that expired) is not fixed by a
   commit: record it in TODO.md with what blocks it, and say so.

## Taking it from a terminal with the Antigravity agent

Antigravity IDE accepts a prompt from the terminal:

```bash
~/"Antigravity IDE"/bin/antigravity-ide chat -m agent "<prompt>"
```

Verified: the `chat` subcommand exists and, by its own `--help`, starts a chat session in the current
working directory in mode `ask`, `edit` or `agent`. NOT verified: whether it runs without an open
window, and where its answer goes. So the prompt must tell the agent to run the command above and
leave the report file behind — the terminal gets back neither text nor an exit code, and an answer
inside the IDE window is invisible to whoever asked.
