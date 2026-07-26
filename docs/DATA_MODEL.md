---
type: architecture
title: LibrePT Data Model & Storage Schema
description: The IndexedDB physical layout, the logical record model, and how the star-write data layer projects one domain object into every live schema.
status: active
tags:
  - architecture
  - data-model
  - indexeddb
  - schema
  - star-writes
  - okf
---

# LibrePT Data Model & Storage Schema

How LibrePT stores a trainer's data, and why it is shaped this way. Design rationale and open
questions live in [TODO §18](../TODO.md); this document is the reference for what exists.

> **Status:** the physical layout below is **built** ([indexedDb.js](../src/data/indexedDb.js)); the
> star-write layer that fills it is **in progress**. The main read/write path still runs through
> `localStorage` via [stateStore.js](../src/data/stateStore.js) until that move lands.

---

## 1. The two version axes

The single most important thing to keep straight — and the one thing never to collapse into one
number:

| Axis | What it identifies | Shape | Where it lives |
| :--- | :--- | :--- | :--- |
| **Behaviour** | Which UI/logic a trainer is using | a named behaviour, selectable in-app | one deployed build carries them all |
| **Data schema** | The shape of a stored record | plain integer major | `schemaVersion`, [migrationSteps.js](../src/data/migrationSteps.js) |

**There are no release tags and no rollback-by-navigation.** One build ships every supported
behaviour concurrently, so switching behaviour is an in-app choice, not a different URL and not a
different deployment. The data schema is the only axis storage is keyed on.

A schema major is bumped **only** when a migration step is added. A "patch" to a schema is either a
migration step or it is nothing.

---

## 2. Physical layout — one database, one store per schema

```mermaid
erDiagram
    DATABASE ||--|| META : "always"
    DATABASE ||--o{ SCHEMA_STORE : "one per live schema"

    DATABASE {
        string name "librept"
        int version "max(live schemas)"
    }
    META {
        string key PK "keyPath"
        json value "migration mapping, counters"
    }
    SCHEMA_STORE {
        string id PK "keyPath — UUIDv7 base62"
        string collection "index: byCollection"
        string clientId "index: byClient (sparse)"
        json payload "the record, in THIS schema's shape"
    }
```

**One database is a correctness constraint, not a preference.** IndexedDB transactions cannot span
*databases*. Giving each schema its own database would make an atomic star write impossible by
construction — and a phone locking mid-fan-out would leave one schema written and another not.

Store names are `schema2`, `schema3`, … The database `version` is derived from the highest live
schema, so provisioning a schema is the only thing that triggers `onupgradeneeded`. Provisioning is
additive: a retired schema's store is never dropped as a side effect of booting: discarding a bucket
is a deliberate act.

### Indexes, and what they are for

| Index | Key path | Purpose |
| :--- | :--- | :--- |
| `byCollection` | `collection` | Load one collection without scanning the store |
| `byClient` | `clientId` | **Lazy per-client load** — one index hit instead of deserialising every client's history to render one screen |

`byClient` is sparse: records with no owner (the exercise catalog) simply do not appear in it.
`getAllKeys()` walks an index's B-tree and returns keys **without deserialising payloads**, which is
what makes the migration-completeness check (§4) — a set difference over two stores' keys — cheap
rather than a full scan.

---

## 3. Logical record model

The collections, and the references between them. **The reference graph must stay acyclic** — see §4.

```mermaid
erDiagram
    CLIENT ||--o{ SESSION : "booked for"
    CLIENT ||--o{ HISTORY : "performed"
    CLIENT ||--o{ PLAN_UPDATE : "about"
    ROUTINE ||--o{ SESSION_ITEM : "prescribes"
    EXERCISE ||--o{ SESSION_ITEM : "referenced by"
    HISTORY ||--|{ SESSION_ITEM : "snapshots (inline copy)"
    HISTORY ||--o{ FEEDBACK : "collected during"

    CLIENT {
        string id PK
        string name "PII — replaced on anonymization"
        string email "PII"
        string phone "PII"
        string goals
        string injury
        bool active
    }
    EXERCISE {
        string id PK
        string name
        string category "muscle group"
        string equipment
        string pattern "biomechanical"
        string modality "strength|cardio|stretch|balance|hiit"
        string metric
    }
    ROUTINE {
        string id PK
        string name
    }
    SESSION {
        string id PK
        string clientId FK
        string date
    }
    HISTORY {
        string id PK
        string clientId FK
        string routineName "soft ref — deliberately NOT an FK"
        string date
        int duration
    }
    SESSION_ITEM {
        string id PK
        string type "exercise|rest"
        string exerciseId FK
        string circuitId "circuit (superset) grouping key — null when standalone"
        string circuitTitle "denormalised onto every member"
        int circuitSeries "rounds — denormalised onto every member"
        bool completed "false = prescribed but skipped"
        json sets
    }
    FEEDBACK {
        string id PK
        string clientId FK
        string tag
        string note
    }
```

Three modelling decisions worth knowing before changing anything here:

- **History embeds a frozen copy of the program**, not a reference to a live routine. Editing a
  routine must never rewrite the past. This makes history the fastest-growing collection.
- **`SESSION_ITEM` is a flat typed array**, not a nested superset container — `circuitId` grouping is
  folded at render (see *Circuits* below). The live session and the frozen record use the *same*
  model, so there is no second representation to drift.
- **`routineName` is a soft string reference on purpose.** Making template provenance a hard FK would
  create `history → routine → history`, the first cycle in the graph, and break §4's ordering.

### Circuits (supersets) — a grouping key, not a record

There is **no circuit entity**, which is why one does not appear in the diagram above. A circuit is a
run of **consecutive** `SESSION_ITEM`s that share a `circuitId` — exercises *and* the rests between
them — folded into one unit at render time by `buildSupersetUnits`. `circuitId` is a **grouping key
among siblings inside one embedded array, not a foreign key**: it points at no record, so it adds no
edge to the reference graph and cannot introduce the cycle §4 forbids. That is also why the field
appears three times per member rather than once per group:

| Field | On every member | Why it is denormalised |
| :--- | :--- | :--- |
| `circuitId` | the grouping key | the *only* thing that makes an item a member; `null` = standalone |
| `circuitTitle` | the group's name | a member must render its own header without a second lookup |
| `circuitSeries` | round count | a member's `sets` length **is** the round count — one source of truth per item |

```mermaid
flowchart LR
    subgraph stored["Stored — flat ordered array"]
        I1["exercise · circuitId c1"]
        I2["rest · circuitId c1"]
        I3["exercise · circuitId c1"]
        I4["exercise · circuitId null"]
    end
    stored --> F["buildSupersetUnits()"]
    F --> U1["Circuit card · c1<br/>title, rounds, 3 members"]
    F --> U2["Standalone exercise card"]

    style F fill:#0d9488,color:#fff
```

**The contiguity is an invariant, not an accident.** Members must stay adjacent in the array or the
fold would split one circuit into two units; `normalizeCircuits()` in
[clipboardEditor.js](../src/modules/clipboard/clipboardEditor.js) pulls members back together on
every edit, and re-stamps the shared `circuitTitle`/`circuitSeries` so denormalised copies cannot
diverge. In a completed history record the order is frozen, so the invariant holds for good.

**Naming: stored `circuit*`, displayed "superset".** The feature shipped first as a round-counted
*circuit* block (2026-07-16) and the user-facing term moved to *superset* the next day; the persisted
field names never followed, because renaming a stored key is a migration, not a rename. The two words
are not strict synonyms in training vocabulary either — a superset is two movements back-to-back, a
circuit is a round-based block of three or more — and the stored model is the round-counted one.
**Do not "fix" the field names in isolation**: `circuitId` / `circuitTitle` / `circuitSeries` are
written into history records and cached live sessions, so a rename is a schema major with a
projection (§4), not a find-and-replace.

**Round position is live-only.** The *current* round a trainer is on lives in the active-session
cache as `circuitRounds[circuitId]`, never in a history record — a finished record stores how many
rounds were **prescribed** (`circuitSeries`) and what was **performed** (each member's `sets`), which
is enough to reconstruct the block without storing a cursor into a session that has ended.

---

## 4. Star writes — one domain object, every live schema

The data layer does not migrate a chain (`v2 → v3 → v4`). It **projects**, directly from the live
domain object into every schema that is currently live:

```mermaid
flowchart LR
    UI["UI behaviour<br/>(any of the ones shipped)"] --> D["Domain object"]
    D --> W["Write layer"]
    W -->|project| S2["schema2 store"]
    W -->|project| S3["schema3 store"]
    W -->|project| S4["schema4 store"]
    W -.->|"one IndexedDB transaction"| TX(["commit or nothing"])

    style W fill:#0d9488,color:#fff
    style TX stroke-dasharray: 4 4
```

**Why a star and not a chain.** In a chain, lossiness compounds and each step is tested against the
previous step's output rather than against reality. In a star, every projection is computed from the
same source, so error cannot compound and each is independently testable. There are also **no
backward transforms to write** — a "downgrade" is just a projection that was already being written.

### Invariants the star depends on

| Invariant | Why |
| :--- | :--- |
| Projections are **pure and total** | Buckets stay fully re-derivable, so a divergence is repairable by re-projection rather than by restore |
| The fan-out is **one transaction** | A phone locking mid-write cannot leave schemas disagreeing |
| Ids are **stable across projections** | The same logical record is the same key in every store |
| The reference graph is **acyclic** | Migration replays in topological (foreign-key availability) order, never by timestamp — the device clock is not trustworthy |
| Schema changes are **expand-first** | A field's storage ships in every live schema *before* the UI that writes it, so no projection is ever lossy |

### Migration

Migration into a newly live schema is **pre-emptive** (it starts before a trainer opts into anything),
**resumable** (a phone dies mid-way and it picks up), and runs **through the normal write layer** —
`read old record → build domain object → star write` — so there is no second transform to drift.

The `meta` store holds the id mapping, which doubles as the cursor: *present in the mapping* means
*migrated*. Ordinary use therefore **accelerates** migration, because a star write to a not-yet-
migrated record populates the new store and marks it, and migration then skips it.

**Completeness is a query, never a stored flag** — and the query compares **id sets, not counts**:

```
complete(target) ⇔ keys(source store) \ keys(target store) = ∅
```

The target is complete when the source holds **no id the target is missing**. Derived state cannot
drift the way a flag written at the wrong moment can.

**Why not `count(source) === count(mapping)`.** Two counts are independent aggregates over two
stores; nothing ties them element-to-element. One absent source id together with one spurious target
entry — a retried projection that wrote under a fresh id, an imported backup, a fan-out that
committed in one store and not another, a plain bug — yields **equal counts over a hole**, and the
check passes on a bucket that is missing a client. Count equality is only sound under assumptions the
storage layer cannot enforce (no deletes, strict 1:1, no duplicates, no external writes); a set
difference needs none of them, because it compares the actual thing being asserted. This is what the
star-write invariant *"ids are stable across projections"* buys: the same logical record is the same
key in every store, so the sets are directly comparable.

**Containment, not equality.** Ids in the target that the source lacks are **not** an error — a
record created after the target went live legitimately exists only forward. Asserting equality would
fail on healthy data; asserting containment asks the only question that matters: *is anything left
behind?*

**Cheap, and it names the gap.** `getAllKeys()` on each store returns keys from the B-tree without
deserialising a single payload, already sorted ascending, so the comparison is a linear merge that
short-circuits on the first source key with no match. The result is the **list of missing ids**, not
a boolean — which makes the repair a re-projection of exactly those records instead of a full
re-migration.

A store whose migration is incomplete is **not readable**: a crash at 40% must not show a trainer 40%
of their clients.

---

## 5. Deletion, erasure and retention

**There are no hard deletes.** Erasure is **anonymization**: client PII is replaced with an anonymous
token and the execution records stay, so longitudinal analytics survive.

Two consequences that are easy to get wrong:

- **Anonymization fans out like any other write.** If one store keeps the name and another is
  anonymized, the erasure has failed.
- **The suppression list must be applied at import, not only at erasure.** Restoring a pre-erasure
  backup would otherwise resurrect the PII. It is keyed on the stable record id and stores a salted
  hash and nothing else.

---

## 6. Durability

The database holds the **only** copy of a trainer's records — there is no server. So:

- `navigator.storage.persist()` is requested on boot; without it a browser may reclaim IndexedDB under
  storage pressure, and Safari caps script-writable storage for sites unopened for seven days.
- Risk is reported by **measuring the consequence** (quota, persistence) rather than by sniffing for
  private browsing — see [storageDurability.js](../src/data/storageDurability.js).
- The **backup file is the disaster-recovery tier**, and the only recovery path from a write-layer
  bug. Backups export the newest schema's store only (every other store is derived), and old backups
  stay importable indefinitely: readers are retained forever, writers never.

---

## Related

- [TODO §18](../TODO.md) — design rationale, decisions and open questions
- [indexedDb.js](../src/data/indexedDb.js) — the adapter implementing §2
- [recordId.js](../src/modules/common/recordId.js) — UUIDv7 identity
- [storageDurability.js](../src/data/storageDurability.js) — §6
- [PRIVACY.md](../PRIVACY.md) — the GDPR statement §5 serves
