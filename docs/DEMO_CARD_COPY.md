---
type: draft
title: Demo card copy — English, under review
description: The twelve cards the demo story narrates with, each with what it says today, what is wrong with it, and a proposed rewrite awaiting the maintainer's edits.
status: draft
tags:
  - demo
  - copy
  - okf
---

> **Status: the pass is running, card by card, from 2026-09-10.** Nothing here is shipped, and
> nothing under `src/` is touched while [TODO §40](../TODO.md)'s workspace rewrite is in flight —
> that is why the agreed wording is written down here first (asked 2026-09-10).
>
> **[The 2026-09-10 pass](#the-2026-09-10-pass) is the live part of this file.** It carries the
> maintainer's own wording, in Slovenian, and what a review of it found. The older sections below it
> are where the defect list came from; they are kept because they name the faults, not because their
> proposals still stand.
>
> The English goes into [src/i18n/en.js](../src/i18n/en.js) and the Slovenian into
> [src/i18n/sl.js](../src/i18n/sl.js). Those two are the only supported languages.
>
> The defects listed below were found by walking the demo; the fixes that were made without waiting
> are in [TODO.md](../TODO.md) §38.13 to §38.19.

# Demo card copy — English, for editing together

Twelve cards. For each: what it says today, what is wrong with it, what I propose.
**Edit the PROPOSED block directly** (or strike it out and write your own); I apply it to
`src/i18n/en.js` and write the Slovenian to match.

Names in the story: **Ana, Maja, Nik** (the three friends), **Jane, John, Sarah** (Tuesday's
regulars), **Sam** (the trainer, in the invitation).

---

## The three defects behind "obupna"

1. **Four cards share a title with another card.** "On Ana's phone" is two cards, "The programme"
   two, "In the gym" two. A viewer reads the same heading twice and cannot tell whether the story
   moved.
2. **The last card of the story is a copy-paste of the gym card.** `evening-close` uses
   `story_gym_close_body` verbatim — the story ends by telling you about an hour that finished two
   chapters ago, under the title "The evening is won".
3. **The message card shows an invitation the app no longer sends.** It still reads *"Fill in your
   details for our training…"* — the text replaced on 2026-08-26 precisely because, from an unknown
   number, it is indistinguishable from a phishing message. The app now sends the trainer's name
   first and the privacy notice with it. **The demo is showing something the app does not do.**

---

## 1 · `arrive-menu` — chapter opening (step 1 of 49)

CURRENT
- title: **Three friends arrive**
- body: Ana, Maja and Nik ask about training together after a class. They have chosen you to guide
  them through their strength journey. First task: get them into your register — without writing
  down a single detail for them yourself.

WRONG: "chosen you to guide them through their strength journey" is brochure language, and the
story does not need it. "First task" is good — it is the only card that sets a stake.

PROPOSED
- title: **Three friends arrive**
- body: Ana, Maja and Nik catch you after a class: can they train together? Your first job is to get
  all three into your register — without writing down a single detail yourself.

---

## 2 · `arrive-handover` — the crossing (step 10)

CURRENT
- title: **Over to Ana**
- body: Ana's link is on its way, and your own phone has done its part. Now you play Ana's side of
  it, on her phone, on the page she really opens from the message. Nothing ahead is a mock-up.

WRONG: little. "Nothing ahead is a mock-up" is the best line in the story — it is the whole claim.

PROPOSED
- title: **Over to Ana**
- body: Her link is sent, and your phone has done its part. Now you play Ana's side, on the page she
  really opens from the message. Nothing ahead is a mock-up.

---

## 3 · `intake-message` — the message card (step 11)

CURRENT
- title: **A message from your trainer**
- body: Fill in your details for our training — it takes a minute and nothing stays on your phone:
  librept.app/intake — Sam, +386 40 111 222

WRONG: **this is not what the app sends any more.** The real message leads with the trainer's name
and carries the privacy notice. Showing the old one makes the demo a liar about the one screen a
stranger judges the whole product by.

PROPOSED (quotes the shipped invitation, `intake_invite_message` + `intake_invite_privacy`)
- title: **A message from your trainer**
- body: Sam is inviting you to fill in your own details for training, through an app called LibrePT.
  It takes a minute: librept.app/intake — What happens to your data: librept.app/privacy

> Worth deciding: keep this text in step with the invitation automatically (one string, filled in
> with "Sam"), or leave it as its own line that a person keeps in step by hand. I would wire it to
> the real string — this is exactly the drift that produced the bug.

---

## 4 · `intake-name` — chapter opening on her phone (step 12)

CURRENT
- title: **On Ana's phone**
- body: You are Ana now, standing outside the studio with a link in a message. There is no app to
  install and nothing is kept on this phone: fill it in, send it, and it is gone from here.

WRONG: title duplicated with card 6.

PROPOSED
- title: **You are Ana now**
- body: Standing outside the studio with a link in a message. There is no app to install and nothing
  is kept on this phone: fill it in, send it, and it is gone from here.

---

## 5 · `intake-arrived` — the message card back on his phone (step 17)

CURRENT
- title: **It lands on the trainer's phone**
- body: The file Ana sent arrives in the trainer's own messages, like any other attachment. Nothing
  went through a server on the way: it left her phone and reached his, and he decides whether she
  joins the register.

WRONG: it slips into third person ("the trainer", "his") in a story that addresses you as the
trainer everywhere else.

PROPOSED
- title: **It lands on your phone**
- body: Her file arrives in your own messages, like any other attachment. Nothing went through a
  server on the way — it left her phone and reached yours, and you decide whether she joins the
  register.

---

## 6 · `intake-close` — her chapter closes (step 18)

CURRENT
- title: **On Ana's phone**
- body: Ana's part is done, and the first task with it. Send hands her file to you, the trainer, and
  you are the one who reads it and decides — a stranger never writes themselves into your register.
  Back to your own phone.

WRONG: title duplicated with card 4; "Send hands her file to you, the trainer" is hard to parse.

PROPOSED
- title: **Her part is done**
- body: Ana filled it in herself, and a stranger never writes themselves into your register — you
  read her file and decide. Back to your own phone.

---

## 7 · `programme-open-session` — chapter opening (step 23)

CURRENT
- title: **The programme**
- body: Sunday, two days out, on the sofa. Ana's file has landed and her first session is still to
  come; Tuesday belongs to Jane, John and Sarah, who have been training with you a while. Next task:
  have their hour ready before anyone is standing in front of you.

WRONG: title duplicated with card 8. The body is otherwise the strongest in the story.

PROPOSED
- title: **Sunday, two days out**
- body: On the sofa. Ana's file has landed and her first session is still to come; Tuesday belongs to
  Jane, John and Sarah, who have trained with you for a while. Next job: have their hour ready
  before anyone is standing in front of you.

---

## 8 · `programme-close` — chapter closes (step 29)

CURRENT
- title: **The programme**
- body: One plan, three people, and it fits the hour. Task done — Tuesday can be about the training
  instead of about the phone.

WRONG: title duplicated with card 7. Body is good.

PROPOSED
- title: **One plan, three people**
- body: And it fits the hour. Job done — Tuesday can be about the training instead of about the
  phone.

---

## 9 · `open-session` — chapter opening (step 30)

CURRENT
- title: **In the gym**
- body: Tuesday, ten past six. Jane and John are warming up together, Sarah is in the corner working
  through her rehab plan, and all three are yours to run from one phone. This is what the last two
  tasks were preparation for — and you do this one yourself, tap by tap, with the clock running.

WRONG: title duplicated with card 10. "ten past six" contradicts the caption under it, which says
18:00.

PROPOSED
- title: **In the gym**
- body: Tuesday, ten past six. Jane and John are warming up, Sarah is in the corner with her rehab
  plan, and all three are yours to run from one phone — with the clock running.

---

## 10 · `gym-close` — chapter closes (step 44)

CURRENT
- title: **In the gym**
- body: The hour is done and nothing was written twice. John's knee is on his record, his plan
  already knows about it, and Jane and Sarah were never interrupted. Keep tapping around, or clear
  the demo data and start with your own clients.

WRONG: title duplicated with card 9, and the last sentence is the STORY's closing offer appearing
two chapters early — it belongs on card 12 and nowhere else.

PROPOSED
- title: **Nothing was written twice**
- body: The hour is done. John's knee is on his record, his plan already knows about it, and Jane
  and Sarah were never interrupted.

---

## 11 · `evening-menu` — chapter opening (step 45)

CURRENT
- title: **The evening after**
- body: The session is over, everyone has gone home, and you are back on the sofa. This is the half
  nobody films: what happens to the notes you took between sets. One last task, then the evening is
  yours.

WRONG: nothing much. "the half nobody films" is good.

PROPOSED
- title: **The evening after**
- body: Everyone has gone home and you are back on the sofa. This is the half nobody films: what
  happens to the notes you took between sets. One last job, then the evening is yours.

---

## 12 · `evening-close` — the story ends (step 49)

CURRENT
- title: **The evening is won**
- body: The hour is done and nothing was written twice. John's knee is on his record, his plan
  already knows about it, and Jane and Sarah were never interrupted. Keep tapping around, or clear
  the demo data and start with your own clients.

WRONG: **the body is card 10's, word for word.** The story's last card tells you about the gym hour
instead of about what the whole evening's work bought.

PROPOSED
- title: **The evening is yours**
- body: From a question after a class to next Tuesday already in the diary — and none of it typed
  twice. Keep tapping around, or clear the demo data and start with your own clients.

---

## Two more, found by walking all 49 steps at full speed (2026-08-29)

**A · Card 4 now says something the app no longer does.** Since the reload fix (§38.12), what Ana
types is held until she closes the tab. Card 4's body still says *"nothing is kept on this phone"*,
and the page's own wording was changed to match the new behaviour — so the card and the screen it is
sitting on now disagree, in the one chapter that is about trusting a stranger's phone.

PROPOSED for card 4's body (replaces the version above)
- Standing outside the studio with a link in a message. There is no app to install and nothing
  leaves this phone: fill it in, send it, and closing the tab ends it.

**B · Both closing cards ask the reader to take on a task that does not exist.** Cards 8, 10 and 12
carry the caption *"Read that, then tap Next to take on the task it sets"* — but a chapter's CLOSING
card sets no task; it reports one finished. On the last card of all it is worse, because Next is the
end of the demo.

PROPOSED caption for a closing card
- Read that, then tap Next to carry on. *(and on the very last card, the existing "Every task is
  done…" line already does the job)*

---

## Separately: the captions (the line under each card)

Not "card text", so I have not touched them — but the same walk turns up a rule violation worth a
decision. The product rule is: *a step that asks for an action says the action, naming the control,
its glyph and where it is; never shortened to save room.* Steps 1–9 obey it ("Tap the ☰ button —
three stacked lines, in the top right corner…"). Roughly half of the rest do not:

| step | caption | what it does not say |
| :-- | :-- | :-- |
| 24 | "Open the session menu." | which control, where, what it looks like |
| 26 | "Done — back to the room." | that anything is to be tapped at all |
| 31 | "Jane's circuit comes up." | that the trainer must tap her card |
| 32 | "She flew through it. One tap says so…" | which button, where |
| 36 | "Joint pain, on this movement." | that a tag is to be chosen |
| 40 | "Open the session menu." | (same as 24, and identical text) |
| 46 | "Dark, because it is half past ten…" | which control switches the theme |

They read well as narration and fail as instructions — which is what the guide's caption line is
for. Say the word and I will rewrite these seven to the rule, in the same pass.

---

# The 2026-09-10 pass

The maintainer writes each card, in Slovenian; the review below each one says what it found and what
it proposes. **Nothing is written into `src/` until [TODO §40](../TODO.md)'s workspace rewrite has
landed** — that work is changing where demo data lives, and these cards talk about exactly that.

**Two rules the maintainer set for this pass** (2026-09-10):

1. A card explains **one step towards the goal**, in the voice of an adventure book, **and says how
   to do it** — naming the control, its glyph and where it is.
2. Every card is reviewed for **terminology consistency** and argued against, not just transcribed.

## The words this demo is allowed to use

One name per thing. Where the app already has a word, that word wins.

| The thing | English | Slovenian | Where the app already says it |
| :-- | :-- | :-- | :-- |
| the guided run itself | guided walkthrough | **vodeni ogled** | `walkthrough_title` |
| the learning workspace | sandbox | **peskovnik** | [data/workspace.js](../src/data/workspace.js), [TODO §40](../TODO.md) |
| a booked hour with clients | session | **trening** — ruled 2026-09-10, replacing *seja* | `btn_start_group_session` |
| its slot in the diary | — | **termin**, and only where the slot is the point | `schedule_conflict_confirm` |
| the person training | client | **stranka** | `btn_invite_client` |
| getting a new client in | invitation | **povabilo** | `intake_invite_title` |
| the whole process of taking one on | onboarding | **uvajanje** — proposed | nothing says it yet |

**Five inconsistencies this table exposes, all of them already shipped.** They are not demo faults;
the demo is where they became visible.

- **Session is three words.** `sl.js` has 53 strings using *sej-*, 18 using *trening*, 6 using
  *termin* — and `schedule_conflict_confirm` uses two of them in one sentence: *"Ta **termin** se prekriva
  z nečim, kar že imate. Želite **sejo** vseeno razporediti?"* **Ruled 2026-09-10: trening.** It is
  what a trainer and a client say to each other; *seja* is first a meeting (*seja odbora*) and only
  a session by calque. *Termin* survives where the diary slot itself is the point.
- **The guided run is three words in one panel.** `walkthrough_title` says *Vodeni ogled*,
  `walkthrough_exit` says *Končaj demo*, `walkthrough_collapse` says *kartico demota*.
- **The client list is two words twice over.** `clients_title` says *Imenik strank*,
  `menu_clients_register` says *Seznam strank (klientov)* — *imenik* against *seznam*, *stranka*
  against *klient*.
- **The app addresses the trainer two ways.** 41 strings use *ti* (*tvoje stranke*), 12 use *vi*
  (*kar že imate*, *Želite*, *vaše podatke*). The formal ones are not only the legal text: the sync
  panel, the overlap warning and the start-time question are all ordinary screens.
- **"prijava"** must not be used for a client filling in their own details. In Slovenian software it
  reads as *login*. The app's own word is **povabilo**.

## Card 1 · `arrive-menu` — the opening card

**The maintainer's wording, verbatim (2026-09-10):**

> **opis:** Dobrodošli v LibrePT, applikacija za pomoč osebnim trenerjem pri načrtoanju vadbenih sej
> (1-1 in skupinskih) ter digitalna beležnica za upravljanje vadbe. Tale walktrough opisuje scenarij
> treh novih strank, ki začenjajo skupinsko vadbo od prijave do izvedbe s prilagoditvami.
>
> **navodilo:** demonstracijo pričnete z gumbom naprej, lahko jo začasno prekinete z izklopom
> peskovnika ali pa zaprete to kartico z ikono X in preiskušate aplikacijo brez vodenja

### What the review found

1. **The ✕ is not on the card, and has not been since 2026-08-30.** The card's own corner carries ▾
   (`walkthrough_collapse`); the ✕ sits on the bar the card leaves behind
   ([walkthroughOverlay.js:130-149](../src/modules/demo/walkthroughOverlay.js#L130-L149)). It was
   moved there deliberately — see [TODO §38.16](../TODO.md) — because a trainer reported that
   closing the card gave them no way back. **The intent in the wording is ▾, not ✕:** put the card
   away and keep tapping around. The ✕ ends the run.
2. **"izklop peskovnika" cannot be instructed yet.** The sandbox is decided and unbuilt
   ([TODO §40](../TODO.md), same day). A worse problem than the timing: leaving the sandbox
   mid-walkthrough leaves the guide pointing at sessions that do not exist in the working
   workspace. The switch re-renders rather than reloads ([TODO §40.3](../TODO.md)), so the guide
   survives the switch and breaks. **A rule is needed before this sentence can be written:** either
   the switch parks the walkthrough, or the walkthrough refuses the switch.
3. **The card's title is the chapter's title.** `story_chapter_arrive` — "Trije prijatelji pridejo"
   — is used both as the chapter name and as this card's heading
   ([storyTour.js:273-275](../src/modules/demo/storyTour.js#L273-L275)). A welcome heading needs its
   own key, or this becomes a new card in front of the chapter.
4. **Three words for the run in one card:** *walktrough*, *demonstracijo*, and the panel around it
   saying *demo* and *vodeni ogled*. See the table above.
5. **"od prijave do izvedbe"** reads as *from login to delivery*. **povabila**, not *prijave*.
6. **The sandbox makes the old promise obsolete, and the new one is stronger.** Until now the card
   had to offer to clear the demo data afterwards. With a separate database ([TODO §40.2](../TODO.md))
   there is nothing to clear: the demo cannot reach the trainer's own records at all. Worth saying.
7. Spelling: *applikacija* → **aplikacija**, *načrtoanju* → **načrtovanju**, *preiskušate* →
   **preizkušate**, *walktrough* → dropped.

### Proposed — Slovenian

- **naslov:** Dobrodošli v LibrePT
- **opis:** LibrePT je aplikacija za osebne trenerje: načrtovanje vadbenih sej, individualnih in
  skupinskih, ter digitalna beležnica za njihovo izvedbo. Ta vodeni ogled pelje skozi zgodbo treh
  novih strank — od povabila do skupinske vadbe, ki se med izvajanjem prilagaja. Vse se dogaja v
  peskovniku: ljudje, seje in zapisi so izmišljeni in tvojih podatkov se ne dotaknejo.
- **navodilo:** Z gumbom **Naprej** začneš. Kartico lahko kadar koli pospraviš z ikono **▾** v
  njenem zgornjem desnem kotu in aplikacijo preizkušaš brez vodenja; na vrstici, ki ostane, je
  **✕**, ki ogled konča.

### Proposed — English

- **title:** Welcome to LibrePT
- **body:** LibrePT is an app for personal trainers: planning training sessions, one to one and in
  groups, and a digital notebook for running them. This guided walkthrough follows three new clients
  — from the invitation to a group session that is adjusted while it runs. All of it happens in a
  sandbox: the people, the sessions and the records are invented, and they never touch your own.
- **caption:** **Next** starts it. You can put this card away at any time with **▾** in its top
  right corner and try the app unguided; the bar it leaves behind carries **✕**, which ends the
  walkthrough.

### Ruled on card 1 (2026-09-10)

- **It is a NEW card, in front of the chapter.** "Trije prijatelji pridejo" keeps
  `story_chapter_arrive` and stays where it is; the welcome card gets its own keys and its own step.
  The story becomes 50 steps.
- **The deletion offer is gone.** The sandbox sentence replaces it: there is nothing to clear,
  because the demo cannot reach the trainer's records at all.
- **Leaving the sandbox costs nothing and ends nothing.** *"switching to production mode has to be
  frictionless, to not obstruct work, demo state stays recorded for later resume (maybe never)"*.
  So the walkthrough is **parked by the switch, never stopped by it**, and its position is kept.
  This answers what was open here: a card MAY now promise that it carries on where you left off.
  `resumeWalkthroughAt` already exists ([domain/walkthrough.js](../src/domain/walkthrough.js)) and
  the story's chapter crossings already pass `?step=`; what is missing is saving the step id. It is
  per-workspace state, so it belongs in [TODO §40.1](../TODO.md)'s meta, not beside it.

### Still open on card 1

- **Whether the ✕ goes away entirely**, leaving only ▾. See the argument below.

## Should the ✕ go, leaving only ▾?

**Yes — but only after [TODO §40](../TODO.md) ships, and one more string has to change with it.**

The ✕ was worth having while ending the run was the only way to get the guide off the screen and
the demo data was mixed in with real records. Both of those facts have now gone:

- **▾ and ✕ do the same thing, and ▾ does it better.** Park keeps the position; end throws it away.
  Once the position is kept across a workspace switch, throwing it away is not a second thing a
  trainer wants — it is the same thing with the memory deleted.
- **The bar belongs to the sandbox, so leaving the sandbox is what dismisses it.** That is the
  frictionless switch, already ruled. Nothing has to be built for it beyond §40 itself.
- It is one fewer control on a bar read one-handed, and it removes the glyph that everywhere else in
  this app means *close this box* from the one place where it meant *end this run* (the distinction
  [TODO §38.16](../TODO.md) had to introduce in the first place).

**What it costs, and this is the part that must not be skipped:**

- **Until §40 ships there is no switch, so removing the ✕ first leaves no way out at all.** Order
  matters: §40, then the ✕.
- `walkthrough_off_track` still offers **"Ustavi demo"** (`walkthrough_leave`) when the trainer has
  wandered off. If ending is gone from the bar, that button must become *park*, or the app has
  removed a control and kept its twin two screens away.
- `walkthrough_exit` and its icon button are referenced by the walkthrough tests; they go in the same
  change, not after it.

## The two words the maintainer asked about

### "vodeni ogled" or "voden prikaz"?

**Keep "vodeni ogled".** Two reasons, and the second is the deciding one.

1. Nothing is demonstrated to the trainer — **they do the taps themselves**, and the step advances
   because they did it. *Prikaz* claims the opposite.
2. The panel already has a button called **"Pokaži mi"**. A *prikaz* containing a *pokaži mi* button
   asks the reader what the rest of it was, if not showing.

There is no second, automatic mode to reserve *prikaz* for: the auto-playing tour is gone, and the
pointer now only runs one step at a time when *Pokaži mi* is pressed
([walkthroughOverlay.js](../src/modules/demo/walkthroughOverlay.js)).

### A Slovenian word for "onboarding"

**Proposed: "uvajanje"** — for the whole process of taking a new client on, from the invitation to
their first session.

| candidate | what it actually says | verdict |
| :-- | :-- | :-- |
| **uvajanje** | inducting someone, the whole run-up | **proposed** — the only one that covers the process rather than one act in it |
| vpis | enrolment; what a gym says at the counter | good and familiar, but it names the moment they are entered, not the run-up |
| sprejem | admission — the trainer reading the file and deciding | accurate for exactly one step of this flow, and that step already has a screen |
| prijava | login | rejected |

**Card 1 does not need the word.** "od povabila do izvedbe" says the same thing in the story's own
vocabulary, and the shorter card is the better card. The word is needed for headings and the backlog.

**This one is a guess about your trade, not about the language** — *uvajanje* is what Slovenian
usage supports, but what personal trainers say to each other is something you know and I do not.
If they say *vpis*, that wins.
