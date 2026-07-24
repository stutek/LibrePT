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
[UC5](uc5_session_day_deck_and_deep_links.md) and the
gym-floor clipboard in [UC1](uc1_gym_floor_clipboard.md).

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
[../src/helper/repsAndLoad.js](../src/helper/repsAndLoad.js):

- **Reps**: a count (`10`), a range (`8-12`), a hold/time (`30s`), or **to-failure** (`max`, the
  engine's failure token).
- **Load**: derived from equipment — **kilograms** (free weights / machines), a stack **level**
  (cable), a resistance **band** label, or **bodyweight** (± added kg). The authored value is stored
  raw and its meaning derived at render time, so one authoring control serves every surface.

**Taxonomy-driven reps presets.** The reps combobox suggests values from the movement's **pattern ×
load**, not equipment alone: loaded compounds → *strength* (`3/5/8/10/max`), lunges/isolation →
*hypertrophy* (`8/10/12/15/max`), core & most bodyweight movements → *endurance* (`10/20/50/max`),
mobility → *time* (`20s/30s/45s/60s`) — with a bodyweight override that keeps vertical pulls
(pull-ups) at *strength*. The tiers live only in
[../src/helper/repsAndLoad.js](../src/helper/repsAndLoad.js) (`REPS_TIERS`); the
`<datalist>`s are **generated from them at boot**, so nothing is hardcoded in markup, and the PT can
always type any value regardless of the suggestion.

## 5. Exercise Modality — how a movement is logged

Reps/load is only one of several logging shapes. Each movement carries a **modality** axis
([../src/modules/common/exerciseModality.js](../src/modules/common/exerciseModality.js)) that decides
what its target *means* — orthogonal to equipment-derived load and to the structural item type
(exercise / rest / superset):

- **strength** *(default)* — sets × reps × load. Every legacy movement, and the shape the reps/load
  section above describes.
- **isometric** — a **hold under load**: hold-time **plus** a load axis (weighted plank, wall sit,
  overhead hold). The only hold modality that keeps a load field.
- **cardio** — a conditioning effort measured in **time**, **distance**, **calories**, **watts**,
  **pace** (min/km), or **heart-rate** (bpm) — assault bike, rower, ski-erg, watt bike, treadmill,
  outdoor run, Zone-2 ride. No load; the clipboard timer is the natural logging surface for time-bound
  work, seeded with the target duration so it counts the effort down.
- **stretch** / **balance** — an unloaded **hold-time** (child-pose stretch, single-leg / BOSU hold).
- **agility** — a speed / coordination drill logged against **time**, **distance**, or **reps**
  (pro-agility shuttle, ladder drill, cone sprints). No load.

Two modalities (**cardio**, **agility**) let the author pick their effort metric; the rest are fixed
by the modality (strength → reps, isometric/stretch/balance → hold). The load axis is shown only for
the load-bearing modalities (**strength**, **isometric**) — decided centrally by `usesLoad` so every
surface (focus card, editor, plans, history) agrees. This maps the app onto the recognised health- and
skill-related fitness components (muscular strength & endurance, cardiorespiratory, flexibility,
balance, agility, isometrics); HIIT/interval work (`hiit`, rounds) remains the one reserved-but-unbuilt
type.

Like reps/load, the **raw authored magnitude is stored on the item and its meaning derived at render
time**, so routines, sessions, and history need **no migration** — modality lives on the catalog entry
and is looked up alongside equipment. The focus card, compact row, past-session peek, plans preview,
and history log all render the right unit and drop the load tile for non-strength work; custom-create
offers a modality selector (cardio additionally picks its metric); the catalog and picker flag
non-strength movements with a highlighted modality badge. Delivers TODO §13.3 and the modality field of
§17.1. *(`hiit` is reserved by §17.1 but has no distinct logging surface yet.)*

---

## 7. Spec ↔ Code & Test Traceability

| Specification Requirement | Target Implementation / Test |
| :--- | :--- |
| Taxonomy catalog (equipment + pattern badges) | [../src/data/exercises.js](../src/data/exercises.js) · `EXERCISES` |
| Filtered movement picker modal (Scenario A/B) | [../src/components/exercisePicker.js](../src/components/exercisePicker.js) · `renderExercisePicker` |
| Polymorphic reps/load parse, format & equipment-derived units | [../src/helper/repsAndLoad.js](../src/helper/repsAndLoad.js) · `parseRepsTarget` / `formatRepsTarget` / `getLoadUnitForEquipment` |
| Custom movement creation (strict inheritance) | [../src/components/exercisePicker.js](../src/components/exercisePicker.js) · `renderCustomMovementForm` |
| Catalog shows equipment/pattern badges, not instructions | [../tests/e2e/test_exercise_taxonomy.py](../tests/e2e/test_exercise_taxonomy.py) · `test_catalog_shows_taxonomy_badges_not_instructions` |
| Filter chips constrain list & search narrows dynamically | [../tests/e2e/test_exercise_taxonomy.py](../tests/e2e/test_exercise_taxonomy.py) · `test_picker_filters_and_search` |
| Custom movement form enforces name + equipment + pattern | [../tests/e2e/test_exercise_taxonomy.py](../tests/e2e/test_exercise_taxonomy.py) · `test_custom_movement_creation_flow` |
| Polymorphic reps/load parse, format & equipment-derived units | [../tests/e2e/test_reps_and_load.py](../tests/e2e/test_reps_and_load.py) · `test_reps_and_load_helpers` |
| Exercise modality axis + per-metric target formatting | [../src/modules/common/exerciseModality.js](../src/modules/common/exerciseModality.js) · `modalityOf` / `primaryMetricOf` / `formatMetricValue` |
| Catalog & picker flag non-strength movements with a modality badge | [../tests/e2e/test_exercise_modality.py](../tests/e2e/test_exercise_modality.py) · `test_catalog_marks_cardio_with_a_modality_badge` |
| Custom-create reveals the cardio metric selector and persists modality + metric | [../tests/e2e/test_exercise_modality.py](../tests/e2e/test_exercise_modality.py) · `test_create_cardio_exercise_reveals_metric_and_persists` |
| Metric formatting renders time/distance/calories/watts/hold units | [../tests/e2e/test_exercise_modality.py](../tests/e2e/test_exercise_modality.py) · `test_metric_formatting_model_renders_the_right_units` |

---

## 8. Related Use Cases

- **[UC1 — Gym-Floor Clipboard](uc1_gym_floor_clipboard.md)**: Scenario B's live swap happens inside the clipboard; the inline editor authors reps/load with the same polymorphic controls.
- **[UC2 — Asynchronous Plan Adjustments](uc2_async_plan_adjustments.md)**: the desk-side adjustment wizard reuses the picker to swap a flagged movement.

> **Open gap.** Seeding/mapping the base catalog from an established open taxonomy (e.g. wger / ExRx)
> for universally interchangeable exports remains future work (TODO §13.1).
