---
type: prompt
title: Week generator
description: Sent to a Sonnet subagent that writes ten invented working weeks of a personal trainer in Slovenia, one theme per batch. Placeholders {NN}, {THEME} and {FILE} are filled per agent.
tags: [exploratory, trainer-week, prompt]
---

You write ten invented working weeks of a personal trainer in Slovenia. Other agents will later rank
the weeks for realism and try to run some of them with a phone app for trainers, so each week must be
concrete enough to be lived hour by hour. You know nothing about that app and must not look for it:
**do not read or search any file except `{FILE}`**, and do not use the web.

**The token quota is limited, and your work may be cut off at any moment.** So:

- Write ONE week at a time to `{FILE}` and save it before starting the next. Use the Write tool for
  the first week; for every later week, read the file and rewrite it with the new week appended, or
  append with a shell `cat >> {FILE} <<'EOF'` — whichever you can do without losing what is there.
- **First, read `{FILE}` if it exists.** Every finished week ends with its marker
  `<!-- konec W-{NN}-KK -->`. Continue after the last complete marker, and delete anything after it
  (a week cut off mid-way is written again).
- No preamble, no planning text, no summary in the file beyond what is asked. Keep each week
  between 500 and 900 words.

## The theme of your ten weeks

{THEME}

The ten weeks must differ from each other: a different trainer each time (age, years in the job,
where they work, how many clients, prices), and a different shape of week (busy, quiet, disrupted,
a week with an event at its end). Vary which support work dominates.

## The shape of one week, in Slovenian

```
## W-{NN}-KK — <the trainer and the week in one line>

**Kdo sem:** <who, where they train, years in the job, how many regular clients, prices and packages,
what they use today to keep track: paper, a spreadsheet, WhatsApp, a calendar>

**Stranke v tem tednu:** <6 to 15 clients with invented Slovenian names: goal, health limits, package
and sessions left, how they pay, anything the trainer must remember about them>

**Ponedeljek 12. 10.** … **Nedelja 18. 10.**
<for each day, in time order, lines such as:>
- 07:00–08:00, <place>: <who>, <individual or group> — <exercises with sets × reps × load>, <what
  the trainer expects to change, e.g. a sore knee, a client ready for more>
- 10:30: <a support task: a booking, a cancellation, a reminder sent, a payment taken, an invoice, a
  package sold or used up, travel between places, measurements, writing next week's plans, answering
  messages>
- <something unplanned that a real week holds: a no-show, rain on an outdoor session, a late payment,
  a pain that changes the plan, a client who wants to move a session>

**Oznake:** <4 to 8 tags from this list, comma-separated>
`individualno, skupina, krožna-vadba, kardio, rehabilitacija, zunaj, več-lokacij, paket, plačilo,
račun, odpoved, neprihod, rezervacija, opomnik, sporočila, meritve, napredek, načrt-za-teden,
prvi-obisk, domača-naloga, nadomeščanje, sezona, mladostniki, starejši, nosečnost, online,
zaposlen-v-fitnesu, ekipa, podjetje, v-paru, otroci, prehrana, brez-signala, posebne-potrebe,
tekmovalec`

<!-- konec W-{NN}-KK -->
```

`KK` runs from 01 to 10. Days that depend on each other are what make a week: a session moved on
Tuesday happens on Thursday; a package bought on Monday is used during the week; a measurement on
Monday is compared on Friday; Friday's plan for next week uses what the week showed. A rest day is a
day too: write what the trainer does on it, even if it is only messages and planning.

Prices, loads and timings must be ones a real trainer in Slovenia would have in October 2026: travel
time between places, a lunch break, sessions that start late, loads that suit the client.

After the tenth week, add one last line: `<!-- konec serije {NN} -->`.

Your final message is only the file path and the number of complete weeks in it.
