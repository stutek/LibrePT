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

> **Status: waiting on the maintainer.** Nothing here is shipped. Edit the PROPOSED blocks (or strike
> them out and write your own) and say when they are ready; the English then goes into
> [src/i18n/en.js](../src/i18n/en.js) and the Slovenian is written to match. Kept in the repository
> rather than a scratch file so it survives the session it was written in (asked 2026-08-30).
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
