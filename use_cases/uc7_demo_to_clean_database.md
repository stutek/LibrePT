---
type: use_case
title: UC7 - From Demo Data to a Clean Working Database
description: Specification for clearing the sample dataset after a trainer has started real work, without deleting the records they created or the movement catalog their programmes depend on.
status: active
tags:
  - demo-data
  - data-lifecycle
  - record-provenance
  - referential-integrity
---

# Use Case 7: From Demo Data to a Clean Working Database

A trainer evaluates LibrePT with the sample dataset, likes it, and starts adding real clients — all
without ever making a deliberate "now I'm using this for real" decision. There is no such moment in
the product, and there should not be: forcing one would mean asking someone to commit before they
have reason to. The consequence is that **demo and real records coexist in the same database**, and
sooner or later the fake people become a stain across a dashboard being used for real work.

This use case specifies removing them.

## The problem with the obvious answer

"Reset the app" is not the operation. `resetLibrePTData()` deletes the entire database, which is
correct for someone who has not started yet and destructive for exactly the person who wants the
demo gone — the one who *has* started. The demo notice's primary action used to do this.

## What counts as demo data

Provenance is answered two ways, both in [seedProvenance.js](../src/data/seedProvenance.js):

1. **A stamp** (`seededDemo`) written onto each record at seed time. Unambiguous, and the right
   answer going forward.
2. **The committed seed id set**, derived from the `DEFAULT_*` exports. Necessary because databases
   seeded by earlier builds carry no stamp — a stamp-only test would tell those trainers they have
   no demo data at all.

Deliberately **not** id *shape*. Seed ids are 8 characters and current ones are 22
([recordId.js](../src/data/recordId.js)), which looks like a free discriminator — but 8-character
ids were also minted by older builds for **real** records, so shape would classify a trainer's
earliest genuine clients as demo data and offer to delete them.

## The two rules, both about not deleting

**1. The movement catalog is an asset, not a stain.** The seed ships 48 exercises, and a trainer's
first real session is built out of them. Exercises therefore default to **keep** while the fake
people and their fake training records default to remove. "Clear the demo" means the sample
*clients, sessions, logs and plan adjustments* — not the catalog.

**2. Nothing a surviving record depends on is removed.** A seeded exercise used in a real routine
stays; a seeded client with a real logged session stays. Computed to a **fixpoint**, because
retaining a record retains its dependencies in turn — rescuing a routine is worthless if the
exercises it prescribes are deleted underneath it.

Rule 2 settles the awkward case without guessing at intent: a demo client the trainer renamed and
has been logging real sessions against is referenced by those real records, so it is retained by the
same rule as everything else.

### The dependency graph this needs

[recordReferences.js](../src/data/recordReferences.js) declares the *collection-level* graph, whose
`{collection: {field: target}}` shape can only describe a scalar field holding one id. Half the real
dependencies are not that shape — `session.participants` is an array of client ids and
`routine.exercises` is an array of objects keyed by exercise id — so both were absent from it
entirely, which reads as "losing the referenced row merely stales a label". That is true for
`routineName`; it is false for `routineId`. [recordDependencies.js](../src/data/recordDependencies.js)
answers the record-level question a removal actually needs.

## Why a confirmation screen and not a confirm()

The planner is conservative by construction, so the destructive case it **cannot** rule out is
narrow but real: a seed record the trainer edited into something of their own that nothing else
references — a seeded exercise renamed to a movement they actually coach. Nothing in the data
distinguishes that from an untouched seed record.

A `confirm()` offers one bit for a decision that is per-record. The dialog
([demoCleanupDialog.js](../src/modules/common/demoCleanupDialog.js)) shows per-collection counts —
"8 sample clients, 5 sample training logs" is a sentence a trainer can check against what they
believe they have — names every retained record with the reason it survived, and offers an opt-out.

Reasons render as their own line, never a `title` tooltip: this is used on a phone, where a hover is
unreachable, and "why is this being kept" is the whole question that row answers.

## Persistence

The write goes through the ordinary save path, where star-write's stale-id reconciliation removes a
dropped record from every live schema store — there is no separate deletion path to keep in step
(see [DATA_MODEL.md §4](../docs/DATA_MODEL.md)). A caller-edited plan that would orphan a record is
refused before anything is written.

## Spec ↔ test traceability

| Behaviour | Test |
| :--- | :--- |
| Provenance by stamp or committed id, never by shape | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| Catalog kept by default | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| Seeded exercise in a real routine survives | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| Renamed demo client with real logs survives | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| Retention reaches a fixpoint through a dependency chain | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| An orphaning plan is detected before any write | [demoDataRemoval.test.mjs](../tests/unit_js/data/demoDataRemoval.test.mjs) |
| Counts and retained reasons are rendered | [test_demo_cleanup_dialog.py](../tests/medium/test_demo_cleanup_dialog.py) |
| Cancel writes nothing; a refusal keeps the dialog open | [test_demo_cleanup_dialog.py](../tests/medium/test_demo_cleanup_dialog.py) |
| Removal persists across a reload, real IndexedDB | [test_demo_cleanup.py](../tests/e2e/test_demo_cleanup.py) |
| A clean install has nothing to remove | [test_demo_cleanup.py](../tests/e2e/test_demo_cleanup.py) |
