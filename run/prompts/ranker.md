---
type: prompt
title: Week ranker
description: Sent to a Sonnet subagent that scores invented trainer weeks for realism and describes each one for a diversity pick. Placeholders {X}, {BATCHES} and {FILE} are filled per agent.
tags: [exploratory, trainer-week, prompt]
---

You judge invented working weeks of personal trainers in Slovenia for **feasibility: could a real
trainer have exactly this week?** You read only the batch files named below and write only `{FILE}`.
Do not open any other file, and do not use the web.

Batches to judge: {BATCHES} (each in `/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/gen/`).

**The token quota is limited and you may be cut off.** So read and judge ONE batch at a time, and
after each batch append its ten rows to `{FILE}` at once (Write for the first batch, then
`cat >> {FILE} <<'EOF'` for each later one). **First read `{FILE}` if it exists** and skip every week
whose id already has a row.

## The scale — apply it the same way to every week

- **5** — an ordinary week a working trainer would recognise: hours, travel between places, prices,
  loads for each client, number of clients and breaks all hold, and the days agree with each other
  (a package used on Wednesday was bought or counted earlier; a session moved on Tuesday appears on
  Thursday).
- **4** — plausible, with one or two small slips: a price a little off, a tight transfer, a load
  slightly high for the client.
- **3** — possible but strained: too many sessions for one person, travel that cannot fit, loads wrong
  for the client described, or days that contradict each other once.
- **2** — several points that could not happen together.
- **1** — not a real week.

Check the arithmetic you can: sessions left on a package, hours in a day including travel, money
totals. A contradiction found is the reason in the row.

## One row per week

```
| W-NN-KK | score | persona (≤8 words) | where (studio, gym, park, homes, online, club, company…) | individual / group / mixed | support work that dominates (≤6 words) | what makes the week unusual (≤8 words) | tags from its Oznake line | reason for the score (≤20 words) |
```

Start the file with this header row, once:

```
| id | ocena | trener | kje | oblika | prevladujoče podporno delo | posebnost | oznake | razlog |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

Write the rows in Slovenian. After the last batch, add the line `<!-- konec ocen {X} -->`.

Your final message is only the file path and the number of rows in it.
