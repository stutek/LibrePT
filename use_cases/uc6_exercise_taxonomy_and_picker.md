---
type: use_case
title: UC6 - Professional Movement Taxonomy & Fast-Selection Picker
description: Specification for the professional exercise catalog (equipment + biomechanical pattern taxonomy), the filtered exercise picker used to build routines and swap movements on the gym floor, strict-inheritance custom-exercise creation, and polymorphic reps/load.
status: active
tags:
  - exercise-catalog
  - taxonomy
  - exercise-picker
  - reps-and-load
  - routing
---

# Use Case 6: Professional Movement Taxonomy & Fast-Selection Picker

A certified Personal Trainer knows every movement by heart — they do not need beginner
"instructions" on screen, and they never hand their device to a client mid-session. The exercise
catalog therefore exists for **referential integrity**, not tutorials: immutable movement IDs plus
an **equipment** tag and a **biomechanical movement pattern**, so long-term volume-load and 1RM
analytics stay consistent across months of client history. This use case specifies the catalog's
professional pivot and the three concrete ways a trainer selects movements. It realises TODO §13.

See also the deep-link routing overview in
[UC5](file:///home/simon/Projects/LibrePT/use_cases/uc5_session_day_deck_and_deep_links.md) and the
gym-floor clipboard in [UC1](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md).

---

## 1. Actors & Preconditions

- **Primary actor**: the Personal Trainer, at the desk (program building) or on the gym floor.
- The exercise catalog is seeded/loaded, each movement carrying `id`, `name`, `category` (target
  muscle group), `equipment`, and `pattern`.

---

## 2. Professional Taxonomy Catalog

The exercises view is a **high-density taxonomy inspector**, not a beginner encyclopedia:

- Each card shows the movement name, its **muscle-group** badge, and **taxonomy badges** for
  `equipment` and `pattern`. The old instructional paragraph (`ex.instructions`) is **removed** from
  the card — instructions are deprecated for authoring and retained only where the live deck still
  reads them.
- Search matches across name, category, **equipment**, and **pattern**, so a trainer can find "all
  Cable Hinge movements" by typing a tag.

---

## 3. The Three Selection Scenarios

### 3.1 Scenario A — Rapid Routine & Program Builder (template assembly)

Building a routine template, the trainer opens the **filtered picker** instead of typing free-text
names. Muscle-group and equipment **filter chips** narrow a single-tap movement list; each tap
**drops a standardized movement ID** (with default sets/reps/load/rest) as a row in the template.
The picker stays open for rapid multi-add. Benefit: zero string-matching errors and clean
cross-client analytics.

### 3.2 Scenario B — On-the-Fly Equipment / Injury Substitution (gym floor)

Mid-session, when a station is occupied or a movement aggravates an injury, the trainer opens the
same picker **pre-filtered to the affected muscle group** and swaps in an alternative in seconds.
The substitute **inherits the correct volume bucket**, so historical tracking is preserved.

### 3.3 Scenario C — Custom Exercise vs. Taxonomy Integrity

Creating a bespoke movement must not pollute the data with ad-hoc text. The custom-exercise form
enforces **strict inheritance**: a **target muscle group**, **equipment**, and **movement pattern**
are all **required** before the movement can be saved, so volume analytics keep working across the
whole roster.

---

## 4. Polymorphic Reps & Load

A set is not always "3 × 10 × 40 kg". Reps and load are **polymorphic**, resolved by
[helper/repsAndLoad.js](file:///home/simon/Projects/LibrePT/src/helper/repsAndLoad.js):

- **Reps**: a count (`10`), a range (`8-12`), a hold/time (`30s`), or **to-failure** (`max`, the
  engine's failure token).
- **Load**: derived from equipment — **kilograms** (free weights / machines), a stack **level**
  (cable), a resistance **band** label, or **bodyweight** (± added kg). The authored value is stored
  raw and its meaning derived at render time, so one authoring control serves every surface.

---

## 5. Traceability (spec ↔ tests)

| Scenario | Test |
| :--- | :--- |
| Catalog shows equipment/pattern badges, not instructions | [tests/e2e/test_exercise_taxonomy.py](file:///home/simon/Projects/LibrePT/tests/e2e/test_exercise_taxonomy.py) · `test_catalog_shows_taxonomy_badges_not_instructions` |
| Scenario A — routine-builder picker drops a standardized movement | `test_routine_builder_picker_drops_a_movement` (same file) |
| Scenario C — custom-exercise creation requires muscle group + equipment + pattern | `test_custom_exercise_requires_taxonomy` (same file) |
| Polymorphic reps/load parse, format & equipment-derived units | [tests/e2e/test_reps_and_load.py](file:///home/simon/Projects/LibrePT/tests/e2e/test_reps_and_load.py) · `test_reps_and_load_helpers` |

---

## 6. Related Use Cases

- **[UC1 — Gym-Floor Clipboard](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md)**: Scenario B's live swap happens inside the clipboard; the inline editor authors reps/load with the same polymorphic controls.
- **[UC2 — Asynchronous Plan Adjustments](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md)**: the desk-side adjustment wizard reuses the picker to swap a flagged movement.

> **Open gap.** Seeding/mapping the base catalog from an established open taxonomy (e.g. wger / ExRx)
> for universally interchangeable exports remains future work (TODO §13.1).
