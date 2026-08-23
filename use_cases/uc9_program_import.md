---
type: use_case
title: UC9 - Importing a Programme Written Outside LibrePT
description: Specification for bringing a training programme written in an external tool - a chat assistant, a spreadsheet, a colleague's file - into the ordinary plan editor, without a server, an API key, or a second write path.
status: active
tags:
  - program-import
  - external-tools
  - editor-as-review
  - taxonomy
---

# Use Case 9: Importing a Programme Written Outside LibrePT

A trainer plans somewhere else — an assistant in a chat window, a spreadsheet, a PDF a federation
published, a plan a colleague sent — and wants it in the app without retyping it. Retyping was the
largest block of typing this app still asked for, and the argument is the same one the gym floor
makes: the advantage is not the desk.

## What the trainer does

1. **☰ → Import a programme.**
2. Optionally says **who it is for** and **which session** it belongs to. Both are optional, because
   a plan often exists before either answer does.
3. **Pastes** the programme, or **reads a file**. Both land in the same box, so a file can be looked
   at and corrected before anything opens.
4. Reads what the app says came through: how many items, how many the catalogue does not know, and
   **every line that could not be read**, each with its position and its own text.
5. **Opens it in the editor** — the ordinary plan editor, the same one a session is built in.
6. Fixes anything that came through wrong, and saves. That save is the app's ordinary save.

Two buttons exist for the source rather than the destination: **Show me the format** fills the box
with a working example, and **Copy the prompt** puts a specification on the clipboard to paste into
whichever assistant the trainer already uses. No API key, no integration, no data leaving the device.

## Why the editor is the review screen

The open question when this was specced was how to keep ingestion from being fragile. The answer is
mostly not in the parser:

- **The import lands in an EDITOR, not in the database.** That turns "parse correctly" into "parse
  usefully": a wrong guess is a field somebody retypes, not a record anybody has to repair.
- **Per-item parsing, never all-or-nothing.** Item 7 being unreadable must not lose items 1–6. An
  unreadable item survives into the report carrying its raw text and its position.
- **Every failure is shown BEFORE the editor opens.** A trainer who lands in an editor and only then
  notices three blank rows has been handed a puzzle; one told "3 of 12 could not be read, here they
  are" can fix the paste, or go in knowing exactly what to repair.
- **Liberal at the edges, strict at the centre.** Markdown fences are stripped, an object or a bare
  array both parse, and each field has a NAMED alias table (`reps`/`repetitions`,
  `weight`/`load`/`kg`) — never a fuzzy matcher, which fails unpredictably and cannot be argued with.
- **A `format` marker.** `librept.program/1` is how "not our JSON" is told apart from "our JSON, one
  field wrong", which is the difference between a useful refusal and a half-understood import.
- **A frozen corpus.** Real pasted shapes live in [tests/fixtures/programs/](../tests/fixtures/programs/)
  and must keep parsing. Every paste that fails in real use joins them and never regresses again.
- **No second write path.** The editor's own save is the write, so there is no import-specific
  persistence to keep correct.

## A movement the catalogue does not have

It is **allowed**, and it is **marked**. Refusing it would throw away the trainer's programme over a
naming difference; silently adopting whatever the catalogue has nearest is how a catalogue becomes
forty spellings of "Bench Press" under forty ids — the failure the movement taxonomy exists to
prevent. So an unmatched movement enters the plan and wears a **CUSTOM** badge in the editor: the
word carries the meaning and the pencil glyph decorates it, because on a phone a tooltip is
unreachable.

Matching is exact after normalising case and spacing. "Incline Barbell Bench Press" is not "Barbell
Bench Press", and a similarity score that decided otherwise would be wrong in ways nobody could
predict. The trainer picks the catalogue entry themselves in the editor when the parser was too
conservative — the cheap direction to be wrong in.

## Spec ↔ test traceability

| Promise | Where it is held |
| :--- | :--- |
| Text becomes items; refusals say why | [programImport.test.mjs](../tests/unit_js/domain/programImport.test.mjs) |
| Real pasted shapes keep parsing | [frozenProgramCorpus.test.mjs](../tests/unit_js/domain/frozenProgramCorpus.test.mjs) |
| Catalogue match, or the CUSTOM mark | [catalogMatch.test.mjs](../tests/unit_js/domain/catalogMatch.test.mjs) |
| Every failure shown before the editor opens | [test_program_import_dialog.py](../tests/medium/test_program_import_dialog.py) |
| The plan and who it is for reach the editor | [test_program_import_dialog.py](../tests/medium/test_program_import_dialog.py) |

## Related

- [UC6 — Exercise taxonomy and picker](uc6_exercise_taxonomy_and_picker.md): what "the catalogue
  knows this movement" means, and where a trainer corrects a match.
- [UC8 — Client self-onboarding](uc8_client_self_onboarding.md): the same shape one step earlier — a
  document another party produced, reviewed before anything is written.
- [UC1 — Gym-floor clipboard](uc1_gym_floor_clipboard.md): where an imported programme is eventually
  run.
