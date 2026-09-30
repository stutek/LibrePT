---
type: archive
title: LibrePT Archived TODO Sections
description: The full reasoning behind closed TODO sections — decided, shipped, superseded or abandoned — kept out of the working backlog so TODO.md stays the open work.
status: active
tags:
  - roadmap
  - archive
  - okf
---

# LibrePT — Archived TODO Sections

Closed sections moved out of [TODO.md](TODO.md), verbatim and in full: what was decided, why, and
what it cost. **Nothing here is open work.** TODO.md keeps every closed heading as a one-line stub,
so a `§N.M` reference from code, a test or another document still lands somewhere — and lands here
for the reasoning.

Read [CHANGELOG.md](CHANGELOG.md) for what shipped and when. This file is why.

---

### 80.154 [x] P2 — Občasno se aplikacija ne naloži: ostane na angleškem zaslonu za nalaganje — zavrnjeno 2026-10-01

**Popravek 2026-10-01 01:20 (Claude):** prva različica je bila P1 s petimi zastoji na kopiji `main`.
Ti so skoraj vsi lastnost moje kopije: bila je nežigosana (`version.js` = `dev`), in ko sem ji dal
pravi SHA, je izginilo tudi 15 zastojev od 15. Na objavljeni aplikaciji je en zastoj.

**Scenarij in koraki:** objavljena aplikacija, prvi zagon trenerke »Tara Zorko« (podatki, tema,
»Začni s prazno aplikacijo«), nato isti naslov `/?lang=sl` naložiti znova, več kot štiridesetkrat.

**Opaženo:** enkrat (00:44) je stran ostala na zaslonu »LibrePT / A lightweight, free app for your
clipboard, sessions and training programmes.« v angleščini, `<html lang="en">`, naslov `/LibrePT/`
se ni preusmeril na ploščo. Po 50 sekundah enako; konzola brez napak. Naslednja nalaganja so stekla.

| Kje                                        | Nalaganj | Zastojev             |
| :----------------------------------------- | :------- | :------------------- |
| objavljena `#8b2ce80`                      | ~40      | 1                    |
| kopija `main` `6230070`, žigosana          | 18       | 0                    |
| kopija `main` `6230070`, nežigosana `dev`  | ~25      | 5; `/intake` po prvem zagonu trenerja vsakič (3 od 3) |

Na nežigosani kopiji je en zastoj obstal globlje: stran ni odgovorila niti na `1+1` prek CDP, brez
izvornega okna in brez porabe procesorja. Na žigosani kopiji in na objavljeni se `/intake` po prvem
zagonu trenerja odpre (3 od 3).

**Težava in vpliv:** trener, ki mu se to zgodi, vidi angleški zaslon, ki ne pove ničesar in se ne
premakne, in ne ve, ali je podatke izgubil. Na razvojnem strežniku (nežigosan) pa `/intake` obstane
vsakič, ko je trener aplikacijo že odprl — kdor povabilo preizkuša lokalno, obtiči.

**Predlog:** zagon naj se vedno konča — s ploščo ali s sporočilom v jeziku trenerja, kaj ni uspelo in kaj
naj stori — opaženo na različicah `#8b2ce80` (objavljena) in `main` `6230070`, 390 × 844, sl.

**Zavrnjeno 2026-10-01 01:35 (Claude): zastoja ni mogoče pripisati aplikaciji.** Primerjava A/B na
kopiji `main`, vsakič čist brskalnik, prvi zagon trenerke in tri nalaganja `/intake`: z navadno
navigacijo (`goto(wait_until="commit")`, brez kavlja) 6 od 6 naloženih, z ukazom `goto` iz explore.py
(`networkidle`, nato vbrizg kavlja za napake in odklop ukaznega procesa) 3 od 6 obstalih. Z navadno
navigacijo v vsej seji ni bilo zastoja (0 od 24 na kopiji). Edini zastoj na objavljeni aplikaciji se je
zgodil prvi po ukazih explore.py. Tudi zveza z žigom različice, ki jo je trdila prejšnja različica te
točke, ni potrjena: po žigosanju je `/intake` z `goto` iz explore.py znova obstal. Kaj v gonilniku
povzroči zastoj, ni ugotovljeno; lekcija je v veščini `exploratory-test`.

### 80.148 [x] P2 — Zamenjava vaje obdrži težo prejšnje: Wall Sit dobi »BW+80kg« — popravljeno 2026-09-30

**Scenarij in koraki:** trening »Noge« za Barbaro Kos, v »Uredi načrt« Leg Press 3 × 10 × 80 kg. V
vrstici Leg Press ikona odprte knjige (»Prebrskaj katalog vaj«), poiskati »wall«, izbrati Wall Sit,
»Končano z urejanjem načrta«.

**Opaženo:** vrstica ima zdaj Wall Sit s 3 serijami, »10« in težo 80; polje za težo ima namig »+kg
(BW)«. Podloga: »Wall Sit S3 × 0:10 × BW+80kg«. Ponovitve so postale sekunde drže, 80 kg z naprave je
postalo dodatna teža na telesu. Trener dneva 10, ko je bila naprava zasedena: »Wall Sit je dobil
"BW+80kg" in 0:12; Goblet Squat je obdržal 100 kg. Trener to na telovadnici zlahka spregleda.«

**Težava in vpliv:** zamenjava se dela v naglici, med dvema strankama. Če trener številk ne preveri,
stranka dobi drža ob steni z 80 kg ali počep z utežjo z 100 kg, ker sta bila tista kilograma
postavljena za napravo.

**Predlog:** ko se vaja zamenja z vajo druge vrste (naprava → lastna teža, ponovitve → čas), naj se
teža in cilj ponastavita na privzeto vrednost nove vaje ali naj vrstica na številke opozori. Opaženo na
`main` `d12646c`, sl, 390 × 844; najprej opazil trener dneva 10.

### 80.93 [x] P2 — »Kopiraj ta načrt na …« ne kopira na drug dan, ampak na drugo stranko istega treninga — popravljeno 2026-09-30

**Opaženo** (`8b2ce80`): pri treningu z eno stranko ⋮ → »Kopiraj ta načrt na …« odgovori »V tem
treningu ni še nikogar drugega.« Ukaz kopira načrt k drugi stranki istega treninga, ne na drug dan;
tri pike obljubljajo izbiro cilja. Pri treningu »Par« (`12d0e66`) kopija k SIM Eva Test uspe, a brez
besede: okno se zapre, zavihek ostane pri Timu, obvestila ni. »Potrditev bi bila dobrodošla.«

**Presoja:** kopija na drug datum ni napaka, ampak manjkajoča funkcija §88.5. Odprto tukaj: napis naj
pove, kam kopira (»Kopiraj ta načrt drugi stranki na tem treningu«); pri treningu z eno stranko naj
ukaza ne bo; po kopiji naj aplikacija pove, komu je kopirala.

### 80.149 [x] P3 — Brez povezave glava slovenske aplikacije napiše »Offline« — popravljeno 2026-09-30

**Scenarij in koraki:** aplikacija je naložena, strežnik se ustavi (klet brez signala), stran se ponovno
naloži.

**Opaženo:** aplikacija se naloži iz predpomnilnika; v glavi je viden napis »Offline«
(`span.sync-offline`). V slovenskem slovarju tega napisa ni. Delo brez povezave sicer deluje: trening
»Klet« za jutri je nastal in je po ponovnem nalaganju še tam.

**Težava in vpliv:** edini znak, da telefon nima povezave, je v jeziku, ki ga trener morda ne bere.

**Predlog:** napis iz slovarja, na primer »Brez povezave«. Opaženo na `main` `d12646c`, sl, 390 × 844.

### 80.145 [x] P3 — Stran za prijavo nagovori vsako stranko v ženskem spolu: »izbereš sama« — popravljeno 2026-09-30

**Scenarij in koraki:** »Povabi stranko« → povezava `intake?lang=sl` → prvi zaslon strani za prijavo.

**Opaženo:** »Ta stran sama ničesar ne pošlje: iz tvojih odgovorov nastane datoteka na tem telefonu,
komu jo daš, pa izbereš **sama**.« Stavek nagovarja bralca, to je stranko, ne glede na spol. Drugod
aplikacija za nagovor ne ve spola in piše »Pozdravljen/a«. Druge ženske oblike v slovarju se ujemajo
s samostalnikom (»stranka … poslala«, »oseba, ki ti je dala«) in so pravilne.

**Težava in vpliv:** moška stranka na prvem zaslonu, ki ga od trenerja sploh vidi, prebere nagovor
v ženskem spolu.

**Predlog:** stavek brez spola, na primer »komu jo daš, izbereš ti«. Opaženo na `main` `e2daf5e`, sl,
390 × 844.

## [x] Resume point — state as at 2026-09-26 12:06 — merged 2026-09-30

**Merged 2026-09-30 into: 83. [ ] §66 gleda samo naprej: stranka, ki pride za besedilom**

Read this and `.private/AGENT_SYNC/` before touching anything.

Written when Simon stopped every agent at 2026-09-26 12:06, and committed at 2026-09-27 03:01, when
he told them to carry on. The machine slept between the two, so **everything below describes the tree
as it was fifteen hours earlier** — re-read `git log` and `git status --short` rather than trusting
the commit list here. What is ruled, refuted and measured does not go stale; what is in the tree
does.

**The tree.** `librept-39` parked its unfinished §81.2 with `git stash push -u`, named
"claude-opus §81.2 WIP", so `main` is clean; §81.2 says what is missing. Shipped today: §79 German,
§79.3, §79.4, §81.1 (`f847eb4`), §82.1 (`964539d`), and the ISO date in `3461d92`.

**Two stale claim notes are still in `.private/AGENT_SYNC/`.** `gpt-6-trainer-review.md` belongs to a
Codex session that ran out of tokens and is not coming back. `claude-opus-card-copy.md` (2026-09-23)
waits on a note that no longer exists. Both lock nothing and nobody owns them. Simon decides whether
they go.

**§80, the trainer's first-use review, is ruled and needs no re-checking.** Codex tested the
published build `0625bd6`, fourteen commits behind, so every finding was re-verified in the code on
`main`. §80.1 is refuted — it is §66 working as ruled. §80.2's terms modal is fixed in §81.1. §80.4
was three defects: its date is closed, its language-change seam is in §81.1, its two unkeyed menu
rows in §81.2. **§80.3 is the one finding nobody has taken**: the exercise catalogue's 48 English
names carry no search synonyms, so "počep" matches nothing, and localised names are refused by
§46.4. It needs Simon's Slovenian and German search terms, which an agent must not invent by
translating. Codex's own scenario §80.1 is also unfinished: running a session, logging sets, fixing a
wrong entry and closing it were never tested, and the requested five hours were not spent.

**§83 waits on Simon's ruling** — §66's client-name check looks only forward, which breaks editing
old sessions and leaves the GDPR hole §66 exists to close.

**Two TODO entries Simon asked for on 2026-09-26 were never written.** They take the next free
numbers; §84 is taken by the legacy-session boot crash. Their content, measured rather than guessed,
so it is not lost:

1. **Better detection of a client's name in a field.** Run against the real `clientNamesIn` with
   clients "Ana Novak" and "Jože Kovačič", **nine of thirteen phrases pass through**: *Anin trening*,
   *trening za Novaka*, *pri Novaku*, *Vadba z Ano*, *Ano peljem ven*, *Anini zgibi*, *Kovačičev
   program*, *pri Jožetu*, *Novakova garaža*. Only *Ana 1:1*, *NOVAK doma* and *Telovadnica Novak*
   are blocked — and the last of those is a real gym name, so the rule is wrong in both directions.
   It matches the nominative only, which is the form a Slovenian trainer is least likely to type in a
   title. "Whole words only" was ruled on 2026-09-18 against an English-shaped assumption; the first
   market is inflected. Only two fields are checked at all, `setup-session-name` and
   `setup-location`, while [clientErasure.js](src/data/clientErasure.js) itself names three prose
   surfaces erasure cannot reach — session titles, draft titles and feedback notes — and the feedback
   note (`feedback_note_placeholder`) is unchecked.
2. **Offer the trainer a way out of the conflict: change the name, or change the field values.**
   Simon's words, 2026-09-26. Today the refusal is a dead end: retyping the field is the only exit,
   there is no way to change the client's name or alias from there, and no way to say the word is a
   coincidence.

**These two are ordered, and the order is the point.** A stricter matcher is safe only once the
conflict has an exit; while the refusal is a dead end, every improvement to detection costs more than
it buys.

## [x] Where to start (ranked 2026-08-22) — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: Every ranked item is closed or has its own section: §29 shipped (af17b0b, use_cases/uc9_program_import.md); §8.8 '[x] ... shipped 2026-08-22'; §8.7 and §23.1/§23.6 are their own open sections; §23.5's feedback route and §12.6 ('[x] ... closed 2026-09-30') shipped; §18.11 '[x] ... closed 2026-09-30'. Waiting-on-ruling items live in §1.6 (replay question) and §19.2. The GitHub-issues question was answered and the route shipped (§23.5). Nothing true here that another section does not say.**

The governing fact is [docs/PREVIEW.md](docs/PREVIEW.md): the app tells its own users it can wipe
their data. Nothing trainer-facing can be promoted until that is false, so the ranking is **data
safety → showability → everything else**.

**Every ranked item from 08-17 has shipped**: §26/§1.7's self-onboarding (rank 1, 08-17), §18.7's
import consent (3, 08-18), and §8.7/§8.8's neighbourhood (4) is now the only gym-floor work left.
What replaced them, on 08-21/08-22, was the long demo and everything it needed — which is why this
re-rank looks different: §35's story named four product gaps, and building the story built them
(§8.1's shared plan, §35.3a's recurrence model, §35.3b's fit meter, §35.3c/d's gym notes).

Re-read this table against `src/` before trusting it, and close items in the commit that ships them.

| Rank | Item | Why now |
| :--- | :--- | :--- |
| 1 | §29 program import | The shape is decided and every prerequisite exists — the parser and its frozen corpus are the whole of it |
| 2 | §8.7 / §8.8 gym-floor remainders | §8.7 is a question rather than work (does completing a round stop its timer); §8.8's copy-program icon is cheap, and its open questions are answerable now that §8.1 exists |
| 3 | §23.6 / §23.1 — what "winning" means, then a channel | Nothing technical is left in front of a launch: the feedback route and the icon subsetting both shipped 2026-08-22 |

**Asked 2026-08-22 (Simon), answered rather than decided**: should the email go and everything run
through GitHub issues, praise included? Recommendation is no, on two grounds — the tracker is
**public**, and a screenshot of this app shows real people, which makes "post it publicly" bad advice
in an app built around client confidentiality; and praise is precisely the feedback that does not
survive the friction of opening an account. If one channel is wanted anyway, the honest version is
email only, with the maintainer filing issues from it. The public-tracker warning shipped regardless,
since it holds as long as the GitHub route exists at all.

**Both 08-22 ranks shipped the day they were written**: §23.5's feedback route (an address that needs
no account, plus the bug half pointed at an issue with a screenshot) and §12.6's subsetting.

**Waiting on a ruling, not on work** — §1.6's confirm link (a replayable capability token aimed at the
trainer's own store) and SMS as the response channel; §19.2's URL-privacy invariant, which unblocks
§19.3. Each is a question in its own section, deliberately not folded into the ranking above.

**Cheap wins, unranked** — each small enough to ride along with adjacent work. What is LEFT of the
list: §12.5's reflog expiry (one maintainer command) and §12.6's glyph subsetting (prerequisite
already built, and §7.2 wants the regular weight it would restore). Done since it was written:
§19.3's exercise-library filter reset and §25.6's overflow harness (2026-08-21), §18.11's retention
paragraph and §21's 60s → 30s navigation timeout (2026-08-22).

Deprioritised on purpose: §24.5/§24.7 remainders and §24.8's rename (optional by their own text),
§11/§5.1/§4.1 (large UI churn with no users yet to aim it), §17.2/§17.4 and §18.8–§18.12 (decided on
paper, correctly parked), §12.7 (measured, closed — do not reopen).

### Open work at a glance

One row per theme, so the shape of the backlog is readable without scrolling it. "Blocked on" names
the thing that must happen first, not merely what it touches.

| Theme | Open | Lead item | Blocked on |
| :--- | :--- | :--- | :--- |
| **Launch prerequisites** | §16.6, §23.5 | §16.6: one origin or two (custom domain) before trainers hold data | Simon's ruling on §16.6; §23.5's two open items (demo deep-link, Calendar in README) do not block a push |
| **Data safety remainder** | §18.8, §18.9, §18.12 | Storage durability warning, and the desktop file handle | Nothing; the backup encryption shipped 2026-09-28 |
| **Scheduling** | §1.2, §1.3, §1.4, §1.5 | Room occupancy via `freebusy.query` | §1.5's OAuth/verification path |
| **Gym-floor UX** | §8.7, §8.8 | Copy-program icon on the clipboard | Nothing; §8.7 is a question, not work |
| **History & templates** | §17.1, §17.2, §17.4, §17.5 | Modality into the history snapshot | Decided on paper, parked deliberately |
| **UI redesign** | §4.1, §5.1, §5.2, §11.1, §11.2 | Tabbed client view | Deliberately waiting for real users to aim it |
| **Go-to-market** | §23.1–§23.6 | Decide what "winning" means | §23.1 gates every channel choice |
| **Refactor remainders** | §24.4d, §24.5, §24.7, §24.8 | One movement → plan item mapping | Optional by their own text |
| **Tests & docs** | §6.2, §12.3, §12.5, §12.6 | Vendor Font Awesome locally | Nothing; all small |
| **The long demo** | Nothing blocking | — | The trainer opening Ana's file shipped 2026-08-25: the demo engine attaches a real file to the real input, so no hook was added to the shipped app |
| **Routing decisions** | §19.2, §19.3 | The URL-privacy invariant | One decision, then both unblock |
| **Data-subject rights** | §27.4 | One-tap withdrawal in the consent letter | Nothing; the other four shipped 2026-08-11 |
| **Reported 2026-08-18** | §28.2 | Which contributor-facing docs get BUILT, so their addresses are injected rather than written out | Everything else in §28 shipped the same day |
| **Client self-service** | §26.7 phase 2 | The vendored QR encoder and the wall poster | Deferred on purpose until the messaging handover has been tried in a gym; the link route shipped 08-22 |
| **Welcome screen & menu** | §81.1–§81.6 | The mandatory welcome screen (§81.1) | Nothing for §81.1–§81.4; §81.5 and §81.6 on Simon's answer |
| **Program import** | §29 | Nothing — shape decided 2026-08-18, and the editor-as-review answers the fragility question | The parser and its frozen corpus; the intake flow, media-type rule and catalog crosswalk already exist |
| **Live clipboard taps — PRIORITY** | §48.2 | Tracking and notes after the session | §48.2's measuring exception waits on §45.11; §48.1 shipped 2026-09-13 |
| **Trainer feedback 2026-09-11** | §45.4–§45.13 | §45.4's failed share of a filled-in signup | Nothing for the three defects; §45.4 is ruled (2026-09-15) and waits to be built, §45.8 on looking at both screens together |

---

#### 1.5.1 [x] Live-Google testing with a bounded stored credential — 2026-08-16 — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Heading says [x] Done 2026-08-16 and the body is still here. The runbook it describes is in docs/GOOGLE_CLOUD_SETUP.md and tests/INDEX.md (both mention GOOGLE_LIVE_CREDENTIALS / credential_expiry); its one 'Not built' item (calendarFreeBusy.js) died with Calendar: `ls tests/live/` = _credentials.mjs, driveAppData.live.test.mjs, tokenScopes.live.test.mjs.**

**Built 2026-08-10**: [tests/live/](tests/live/), `.github/workflows/google-canary.yml`,
`build.run_live_google_tests`. The canary workflow is complete; it needs only its one-time consumer
credential before it can run live.

**Settled 2026-08-12, after two attempts at storing no secret at all — worth recording in full,
because both attempts were reasonable and both were wrong.** The goal was never "test Google", it
was **"test Google from a public repository without a credential to leak."** Workload Identity
Federation answered that exactly: GitHub's OIDC assertion exchanged for a short-lived token at run
time, nothing stored on either side. A vaulted consumer refresh token (Secret Manager, unlocked by
that same federation) was built alongside it, then removed as buying no coverage — the argument
being that the only thing a consumer identity exercises that a service account cannot is the consent
flow, which no CI can drive anyway since Google fingerprints and blocks automated browsers on
`accounts.google.com`.

**That last step is false, and the canary said so on its first dispatch:** `findSyncFile` (a list)
answered, `createSyncFile` (the multipart upload) returned **403**. Google removed service-account
Drive storage quota, and neither remedy they publish reaches this case — an `appDataFolder` cannot
live in a shared drive, and domain-wide delegation needs Workspace, not a consumer Gmail. Seeding
the folder by hand does not work either: `appDataFolder` is written only by the owning account
specifying `parents: ["appDataFolder"]`, so a manual upload is the identical refused request, and a
file shared into the account lands in "Shared with me" where `spaces=appDataFolder` will never see
it.

**A service account can therefore read the Drive API and can never write to it** — and because the
folder stays permanently empty, everything downstream of a file existing goes with it: download,
update, and the `modifiedTime` assertion `driveSyncService`'s conflict detection depends on. What
was left was one call on its empty-result path. Multipart upload, the one hand-rolled wire format in
`driveAppData.js` and the likeliest thing to break, would have been unwatched.

**So the design is now a plain stored credential, and the cost is stated rather than engineered
around**: a real account's refresh token in the `GOOGLE_LIVE_CREDENTIALS` Actions secret, written
into `.private/google-live.json` at run time so CI and a laptop run one code path. WIF, Secret
Manager and `agent_tools/wif_audit.py` are all deleted — a federation with no consumer is a standing
capability nobody would notice was still granted. Bounding what the credential can do is what
replaces bounding whether it exists: the grant is `drive.appdata` (one hidden folder, one probe
file) plus `calendar.freebusy` (busy intervals, never an event body), and there is no
`pull_request_target` trigger.

**Two consequences worth carrying forward.** The 7-day refresh-token expiry is a *Testing*-mode
property, not a verification one: the consent screen is now **In production** (unverified is fine,
the 100-user cap stays), so the credential remains valid until revoked, changed, or unused for six
months. A missing or expired credential makes the canary fail before checkout rather than report a
green run that watched nothing. The static "canary requests the app's scopes" check could not
survive the move — the grant lives on a consent screen now, not in the workflow YAML — so it became
[tests/live/tokenScopes.live.test.mjs](tests/live/tokenScopes.live.test.mjs), which asks `tokeninfo`
what the token was actually granted. Strictly better: it also catches an OVER-broad grant (a `drive`
scope left from debugging) that would keep every Drive test green while production's narrow
`drive.appdata` was broken.

- **Testing a PR branch by hand** uses the workflow's `access_token` dispatch input, which
  short-circuits `_credentials.mjs`. Deliberately an ACCESS token, not the refresh token: a
  dispatch input is echoed on the run's own page, so on a public repository treat it as published
  the moment it is submitted. An hour-long token that is revoked afterwards bounds that; a refresh
  token pasted there would be a standing grant on a real account.
- **Not a deploy gate, deliberately.** It sits outside `deploy.yml` rather than joining the chain, so
  Google's uptime can never block a release. `pipeline_gates.py`'s one-terminal-job rule holds
  trivially in a single-job workflow. What it cannot cover — the consent UI — is unautomatable
  anyway: Google fingerprints and blocks driven browsers on `accounts.google.com`.
- **[x] Done 2026-08-16.** The credential is minted on the dedicated throwaway account, stored as the
  `GOOGLE_LIVE_CREDENTIALS` secret, and the first live canary run passed — so Drive `appDataFolder`,
  the multipart upload, `freeBusy.query`, the granted scopes and the rotation deadline are all
  verified against the real Google, not against a stub. The rotation date is in the maintainer's
  calendar, which is the one part of this no code in the repo can guarantee (see the rotation bullet
  above: a guard inside the repo can only fire when someone touches the repo).

  How it was done: run `python -m agent_tools.google_credential`, which consents in a
  browser, exchanges the returned code and verifies the granted scopes in one step, then store its
  JSON as the `GOOGLE_LIVE_CREDENTIALS` GitHub Actions secret. It uses the supported Desktop loopback
  callback; Google's retired copy/paste OOB callback cannot work for an app that is In production.
  Run it as the **dedicated throwaway** created 2026-08-16 (`canary@` in the runbook). Google's
  per-phone-number signup limit blocked an earlier attempt, which is why this section briefly said to
  use the admin account instead; retrying worked. The throwaway is the better identity for the one
  place a long-lived refresh token is stored — the admin account owns both GCP projects, and while
  the grant could never administer them (an OAuth token carries only its scopes), an account holding
  nothing is a smaller thing to lose. Being an ordinary consumer account, it has the Drive storage
  quota a service account lacks, which is the whole reason a human account is needed here.
  The tool exists because the flow was three hand-run steps around a **single-use** authorization
  code, so any stumble after the code was written to disk meant starting the consent over.
- **The six-month expiry is a rotation deadline, not a diary entry — and this is the subtle part.**
  Google revokes a refresh token that has gone **six months unused**, and that clock is reset by
  every use, so the daily canary keeps the credential alive indefinitely and no renewal ever falls
  due while things work. The clock only starts advancing once the canary **stops**, and every way it
  stops is quiet: GitHub disables scheduled workflows after 60 days of repository inactivity, a
  workflow edit can break the `cron`, a repository can be archived. By the time anyone notices there
  is nothing to notice — the credential is simply dead, and the fix is the full consent flow again.
  So there is nothing observable to alert on, and a calendar reminder would be exactly the
  silently-expiring, nobody's-job artefact no gate may carry for
  suppressions. Instead `python -m agent_tools.google_credential` stamps a `minted` date and
  `python -m agent_tools.credential_expiry` runs **inside the canary**, failing it from **150 days**
  — a month inside Google's 180 — so a live canary turns red with runway, and a canary that stopped
  comes back red the moment it next runs. It is deliberately a hard failure rather than a warning
  (a gate that warns and returns success is a build failure); a month of
  daily red is the action item.
  It cannot live in `build check` Stage 1, because a contributor's clone holds no credential and a
  check that skips on a missing file gates nothing — so Stage 1 asserts the *workflow still runs it*
  instead, via [tests/unit/test_google_canary_workflow.py](tests/unit/test_google_canary_workflow.py).
- **Not built**: a live test importing a real `calendarFreeBusy.js`, because §1.3's occupancy module
  does not exist yet. `calendarFreeBusy.live.test.mjs` probes the endpoint directly meanwhile, which
  is what proves the minted token actually carries the calendar scope.

### 1.7 [x] Client self-onboarding and GDPR consent from a QR on a leaflet — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Done, and its two open questions are answered elsewhere. Shipped: intake route src/modules/intake/intakeView.js with its own boot (src/appBoot.js:419 bootIntake); review dialog src/modules/clients/signupReviewDialog.js; file type src/manifest.json:40,49 ('.json.librept-signup'); goals/injuries optional (src/data/clientSignup.js:8-9,48); UC8. 'Landing page: static or route' = §26.1 (route); 'what the PT sees on arrival' = §26.5 review dialog. The static leaflet QR was replaced by the code the trainer's phone draws (§26.4, src/modules/common/qrCode.js). Heading mark becomes [x]. §29.4 cites §1.7's media-type ruling; it moves to the archive with it.**

**Wanted 2026-08-17 (Simon).** A code on a gym wall or a printed leaflet that a prospective client
scans to introduce themselves and give consent, so a PT acquires a client without typing anything.
Rides the same seam §1.6 built: an event, encoded into a link, carried by email or SMS.

- **The QR is static and generic** — one code per trainer, not per client, so it carries only the
  trainer's return channel (~100 bytes, prints crisply at leaflet size). It therefore does **not**
  force the in-app QR-generation question: a code needed once, for printing, can be produced by any
  tool outside the app. An in-app generator is a separate convenience, and the only thing that would
  make a vendored QR library necessary.
- **The consent it produces must be the same record a PT-captured consent is** —
  `{cloudSync, consentDate, formVersion, formLang}` per [clientConsent.js](src/data/clientConsent.js).
  Art. 7(1) requires being able to DEMONSTRATE consent, so the wording version and the language it
  was given under have to travel with it; a self-served consent that loses those is not evidence of
  anything. The notice and form pages already exist in both languages
  ([privacy-notice-en.html](src/privacy-notice-en.html), and the `sl` pair).
- **Decided 2026-08-17 (Simon) — the client offers goals and injuries if they choose to.** So the form
  does collect Art. 9 health data, and the exposure story is the transport: those fields ride **only
  inside the shared file**, never in a URL, so they never sit in a carrier's logs or two phones'
  message histories. They are optional at every level, and a blank field is absent from the record
  rather than stored as an empty string — "chose not to say" and "not asked yet" are different things
  for a trainer reading the review. Pinned in [clientSignup.js](src/data/clientSignup.js).
- **Decided 2026-08-17 (Simon: "use shares")** — the submission travels as a FILE, not a payload in a
  link. This retires §26.2's fragment codec for phase 1: there is no URL payload to compress, so
  nothing needs `CompressionStream` and the §19.2 URL-privacy question does not arise here at all.
  Built: [signupFile.js](src/data/signupFile.js) (the artifact, both declarations) and
  [signupDelivery.js](src/modules/intake/signupDelivery.js) (share sheet, with the permanent download
  fallback — `canShare({files})` is false on every desktop and on iOS below 15).
- **The original recommendation, kept for the reasoning**: the submission travels as a FILE attached to an email,
  not as a payload in a link — `navigator.share({ files })` puts it in the client's mail app in one
  tap, and `mailto:` cannot attach anything, so a link-based version would have a stranger hand-
  attaching a download. Three things follow. Nothing sensitive crosses a carrier or sits in a URL, so
  the Art. 9 question above may simply stop applying. The file is a RETAINABLE artifact — notice
  version, language, timestamp, what was ticked — which is far better Art. 7(1) evidence than a query
  parameter. And there is no size budget, so a signature or photo becomes possible later. The
  trainer-side fallback already exists in [encryptedFileReader.js](src/modules/common/encryptedFileReader.js)
  ("pick the file someone sent you, opened on this device, no copy kept"), so this is buildable with
  no manifest work; `file_handlers`/`share_target` registration later upgrades it from *find the
  file* to *tap the attachment*. iOS Safari supports neither, so the fallback is permanent, not
  temporary.
- **Decided 2026-08-17 (Simon) — one media type per handling surface, not one generic type with a
  `kind` field inside.** `application/vnd.librept.signup+json` (RFC 6838 vendor tree, RFC 6839 `+json`
  suffix) plus a distinctive extension, because the mechanisms key off different things: an Android
  share intent routes on the MIME type, an OS file association routes on the extension, and email
  frequently relabels the type to `application/octet-stream` so only the extension survives that hop.
  Declaring both is not redundancy. **Marked for reconsideration** if the number of file kinds grows
  enough that per-kind declarations become the larger cost.
- **Amended 2026-08-30 (Simon) — the distinctive part goes LAST: `.json.librept-signup`.** It was
  `.librept-signup.json`, chosen when the trailing `.json` was what kept the file openable where no
  association existed. Registering the app as a file handler (§38.22) made that the wrong way round:
  **an operating system associates on the last suffix**, so a distinctive part in the middle
  registers nothing, and claiming `.json` instead would hand LibrePT every JSON file on the phone.
  *"daj na konec, json pred tem je namig uporabniku"* — the `.json` stays, now as a hint to the person
  looking at the file rather than as the association.
- **Open**: whether the landing page is a generated static page (the `privacy.html` pattern — own
  CSP, offline-cached) or a route inside the app; and what the PT sees on arrival, since accepting a
  stranger's submission into the client register should be a deliberate act rather than a silent
  write.
- **Started anyway, because it depends on none of the above (2026-08-17)**: the submission RECORD is
  built and tested ([clientSignup.js](src/data/clientSignup.js), §26.7 phase 0). Identity, contact and
  the consent stamp are the same under every option on the table; the file-vs-link question and the
  health-data question both decide *transport and form*, not the record. The record ships with health
  fields excluded, which is the option that stays reversible whichever way the ruling goes.

---

### 5.2 [x] Client add/modify — fold editing into the detail view, keep creation a minimal modal — merged 2026-09-30

**Merged 2026-09-30 into: 5.1 [ ] Tabbed client view**

**Decided (2026-07-22): no standalone add/modify client view.** Unlike a session (setup vs. live
clipboard are genuinely different modes), a client has no "live" mode, so a separate edit view would
just duplicate the detail screen. **Create** = a lightweight modal with the minimum to bring the
client into existence, dropping straight into the detail view. **Edit** = inline inside §5.1's tabbed
view. Effectively a sub-decision of 5.1 and should ship with it.

---

### 9.2 [x] Demo-data loader — PARTIAL — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: Replaced by the sandbox workspace (f562c37 'one control moves between the trainer's work and the sandbox'): sample data is seeded into its own database by ensureSandboxSeeded (src/data/stateStore.js:688), offered in-app via `?workspace=sandbox` (src/modules/splash/splashScreen.js:129-135, which says the offer no longer seeds the trainer's database). The 'never clobber real records' and 'callable from in-app' goals are met by construction.**

`?init=demo_data_load` (parsed in [shareLink.js](src/modules/common/shareLink.js)) seeds the full
fixture, but **only when the app is genuinely empty**, so it never clobbers real records. **Still
open**: narrow it to a focused subset (a few clients, one or two routines, today's sessions, the
in-progress session) and expose it as a callable `loadDemoData()` invoked by the in-app activation in
§9.5, not only by URL.

### 11.1 [x] Replace the footer nav with a message / status area — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: The footer nav is gone: src/index.html:207 'Omnipresent Notification Area (replaces old footer & bottom-nav)'. Navigation found its home in the ☰ menu of five entries (§81.2 '[x] ... done 2026-09-27').**

Evolve the session-bar contents into a general message area: current/upcoming session, spot
reservations, cancellations, and the "run the demo" invite. Navigation (Clients / Routines /
Exercises / History) needs a new home — proposal: a compact tab row in the omnipresent header. The
feed is priority-ordered: live session → next upcoming → notifications, each tappable to its session.

### 12.3 [x] Test completeness — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: Its one open item is false: the walkthrough shipped (§9.5 [x]) and is tested (tests/e2e/test_walkthrough.py; tests/medium/test_walkthrough_modal.py, _panel.py, _show_me.py, _target.py). 'Every extracted component has an exercised path' is now a gate: agent_tools/unit_coverage.py (2d7ef08) holds src/domain and src/data at 90%; the browser-tier question lives in §6.2.**

Themes, the Sync & Backup modal and counters, the header menu, the first-run agreement, the
plan-adjustments deck and wizard, the Client Directory grid and search are all covered. **Still
open**: the demo walkthrough (§9.5) is unbuilt, so it has no tests. Confirm every extracted component
has at least one exercised path.

### 18.15 [x] A hard reload can outrun a queued write — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Fixed: 76d9af1 'fix(data): keep a save the page closed before it landed'. src/controllers/appLifecycleController.js:162-169 listens to `pagehide` and `visibilitychange` and keeps the state in localStorage while a write is unfinished (src/data/unsavedStateJournal.js); §6.2's body records the same fix. Heading mark becomes [x].**

Found 2026-08-18 while landing §18.7's import consent: `tests/e2e/test_signup_round_trip.py` failed under
a parallel run and passed alone, because it accepted a client and then navigated with a FULL page load —
which re-reads IndexedDB before the enqueued write ([writeQueue.js](src/data/writeQueue.js)) has flushed.

The test now waits for the stored row, which is the assertion it wanted anyway ("it survived", not "the
list re-rendered"). **The app-side question is left open deliberately**: the real window is milliseconds
and only on a hard reload or a tab close immediately after a write, so it has never been observed by a
trainer — but there is no flush-on-`pagehide` and nothing that would tell anyone if it bit. Worth deciding
whether the queue should drain on `visibilitychange`, or whether the risk is acceptable and should simply
be written down.

---

## 20b. [x] Backlog sweep — 2026-08-06 — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: A method note from one past sweep. Its lesson ('close the entry in the commit that ships it') is now a rule and a gate: AGENT_RULES.md 'A section leaves TODO.md the day it closes' and agent_tools/todo_hygiene.py (fails a closed section that keeps its body). The two false positives it records are about §9.5 and §18.9 text that has since changed.**

Method note, kept so the next sweep starts from evidence: check a signal's **context, not its count**
(a `grep -c` over multiple files emits `file:count`, which mis-scored several items on the first
pass). Two recorded false positives: `expectedVersion` in
[schemaMigrations.js](src/data/schemaMigrations.js) is *schema* validation, not §18.9's
compare-and-swap; and the `walkthrough` hits are i18n strings for a notification button, not §9.5's
engine.

**The lesson this sweep exists to prevent recurred anyway**: on 2026-08-08 two more items (§6.3 and
§7.3) were found shipped but unticked. **Tick the entry in the commit that closes it.**

### [x] 26.1 One app, one route — not a second PWA — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Decided and built: `/intake` inside the same build, with its own boot (src/appBoot.js:419 bootIntake, called from src/app.js:373); pinned by tests/medium/test_intake_form.py and tests/e2e/test_intake.py per §26.7's body. Heading gets [x].**

**Decided**: `#/intake` inside the same build. A second PWA means a second service worker, CSP,
deploy target and test tier for what is ~200 lines of form; the client simply never installs the one
that exists. The constraint this buys is worth stating: intake must render on a **stock, cold
browser** — no IndexedDB write, no demo seed, no service-worker dependency, no boot of the trainer's
app state. It is the only route in the app that is stateless by design, and a medium test should
pin that rather than trusting it.

### [x] 26.4 The trainer's own QR has to be drawn, not printed — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Built 2026-09-11 (its own body: '[x] Built'): the invite dialog draws the code on open (src/modules/clients/intakeInviteDialog.js; src/modules/common/qrCode.js; src/vendor/qrcode.js). Nothing open. Note: intakeInviteDialog.js has uncommitted edits by another session (§80.137, invitation language), unrelated. Heading gets [x].**

It was to encode a **static** URL — a pre-rendered SVG in `assets/`, printable, stickable on the gym
wall, one file per language variant, and no runtime encoder on the trainer's side in either phase.

**[x] Built 2026-09-11 as a code the trainer's phone DRAWS. Revised first, and the reason is
§26.3's own signature.** A static file is the same for
every install, so it cannot carry `#from=` — the name, number and address that let the client check
who sent them and save the contact. A wall QR therefore identifies nobody, which is the state the
page was deliberately moved out of on 2026-08-23. Wanted instead (asked 2026-09-11): the trainer's
phone **draws the QR on screen and shows it to the client**, as the alternative to typing a number or
an address into the invite dialog at all. That needs the vendored encoder of §26.3 step 3 on the
TRAINER's side, which Phase 2 was already going to pay for on the client's side; the printed leaflet
stays possible as the version that names nobody.

**What shipped.** The invite dialog draws the invitation as a code on the trainer's own screen,
under the two send buttons ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js)). It
carries the same `#from=` every other route carries, so the client sees who it is from and can save
the contact. The
encoder is vendored ([vendor/qrcode.js](src/vendor/qrcode.js), MIT, checksummed against upstream),
and the app builds only the geometry ([qrCode.js](src/modules/common/qrCode.js)) — a library that
returns markup would be markup built from a string, which this app does not do. Black on white
whatever the theme, because it is a picture for somebody else's camera. **Drawn the moment the dialog
opens** (asked 2026-09-11): it sat behind a *Show a code* button for one afternoon, guarding against a
code left up from the last invitation — a guard that protected nothing, since the code carries the
trainer and names no client, so it is the same code for everybody. Redrawn on each open, because the
name, number, address and language it carries are all settings.

### [x] 26.7 Phasing — merged 2026-09-30

**Merged 2026-09-30 into: 26.3 Return path — share first, mail/SMS second, QR third**

- [~] **Phase 0 — what a submission IS, 2026-08-17.** [clientSignup.js](src/data/clientSignup.js):
      identity + contact + the consent stamp, built and parsed in one place, with the register match
      that stops a second Jane Doe being minted. Deliberately **transport-free** — it is the half of
      this section that both live designs share, so it could ship while §1.7's two open questions
      (below) are still open. Health fields are **excluded for now**, since shipping them and
      retracting them is not reversible while adding them later is.
- [~] **Phase 1 — both rulings landed 2026-08-17; the client's half is built.** Shared file (§1.7)
      rather than a link, so §26.2's codec is retired unbuilt; goals and injuries collected at the
      client's discretion. Done: the record, the file artifact, share/save delivery, and the `/intake`
      page itself — [intakeView.js](src/modules/intake/intakeView.js) behind its own boot step
      (`appBoot.bootIntake`), which is what makes §26.1's stateless promise structural rather than
      disciplinary. **Left: the trainer-side import-review dialog with dedupe** (§26.5). Still **no new
      dependency and no CSP change** — `connect-src` untouched, it is all local.

      **A separate boot, not a flag through the normal one.** Every step of the trainer's boot writes
      something or asks something — state load, seed, service worker, terms modal, splash hold, and
      `initTheme`, which persists the resolved theme. Threading "unless this is a client" through all
      of them would work until the day one was missed, and the failure would be a stranger's phone
      holding a LibrePT database or a terms modal in front of the form. Pinned at both tiers:
      [test_intake_form.py](tests/medium/test_intake_form.py) mounts the boot step and asserts nothing
      is written; [test_intake.py](tests/e2e/test_intake.py) navigates for real and asserts the boot
      DECISION, which the medium tier cannot see.

      **Found by writing the test first**: the send button set `hidden` and stayed on screen, because
      every `.btn` in this app sets `display: flex`, which beats the UA stylesheet's `[hidden]` rule —
      so a desktop visitor would have been offered a file share their browser cannot do. It uses the
      `.hidden` class now.

- [x] **Phase 1 COMPLETE — 2026-08-17.** The review dialog (§26.5) closed the loop, and
      [UC8](use_cases/uc8_client_self_onboarding.md) documents the whole flow with spec↔test
      traceability. End to end, proven in one e2e test: a stranger fills in `/intake`, shares the file,
      and the trainer accepts them into the register without typing anything.
- [~] **Phase 2 — the trainer's half built 2026-09-11.** The vendored encoder and the code on the
      TRAINER's screen shipped (§26.4); the static leaflet asset is dropped rather than deferred,
      since a printed file names nobody. **Left: the code on the CLIENT's screen** — the return path
      for a phone with no messaging app and no signal, which is §26.3 step 3 and lands on the same
      review dialog. Worth deferring until the messaging handoff has actually been tried in a gym.
- [x] **Tests — done 2026-08-17.** `tests/unit_js/` for the record, the file artifact and delivery
      (the "codec round-trip" became file round-trip, since the transport is a file);
      `tests/medium/` for the intake form mounted cold and for the review dialog; `tests/e2e/` for the
      full intake → file → review → saved-client loop, plus the boot decision. UC8 and its
      [INDEX](use_cases/INDEX.md) row shipped with it.

## 27. [x] Data-subject rights the app documents but cannot perform — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Every subsection is closed: 27.1, 27.2, 27.3, 27.4 (2026-08-14), 27.5, 27.7 are '[x]' headings; its intro still says 'Only §27.4 is still open', which is false. Heading gets [x].**

[PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md) tabulates four data-subject rights against
"what to do in LibrePT". Two of the four had no code behind them when this section was filed at 20:10
on 2026-08-11 — no way to delete a client, no way to export one client's data. The document was not
wrong about the law; it was wrong about the app, which is worse, because it is written for trainers
who will rely on it while answering a request under a one-month deadline.

**All of that shipped 44 minutes later, in the same evening** (see [CHANGELOG](CHANGELOG.md)) — and
then sat here marked open until 2026-08-13, still ranked second in *Where to start*, because nobody
came back to the file. Two sessions began by reading it and nearly rebuilt an export that already
existed. **Only §27.4 is still open.** The lesson is the one this repo already states for suppression
comments: a note about work is only as good as the pass that re-reads it, so a section that ships
gets closed *in the shipping change*, not later.

§26 is the reason this section exists: it was written first, and reading the trainer doc against
`src/` while sizing its consent step is what surfaced these gaps. It was then pruned *because* of
them, and restored on 08-13 once this section closed — the sequencing objection it carried is
discharged by §27.1 and §27.2 having shipped.

### 27.1 [x] Erasure (Art. 17) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#271-x-erasure-art-17-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.2 [x] Access & portability (Art. 15, 20) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#272-x-access-portability-art-15-20-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.3 [x] Erasure does not reach the copies — closed 2026-08-11 by the register

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#273-x-erasure-does-not-reach-the-copies-closed-2026-08-11-by-the-register); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.4 [x] Withdrawal as easy as consent (Art. 7(3)) — 2026-08-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#274-x-withdrawal-as-easy-as-consent-art-73-2026-08-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.7 [x] Record a withdrawal instead of erasing the consent — 2026-08-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#277-x-record-a-withdrawal-instead-of-erasing-the-consent-2026-08-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.5 [x] The doc describes what a trainer can actually do — 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#275-x-the-doc-describes-what-a-trainer-can-actually-do-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.6 What this architecture already gets for free
**Identity verification** (Art. 12(6)) is trivial here — the trainer knows the client by face, with
no account, no recovery flow and no impersonation vector, where a SaaS has to build for it. And with
data never leaving the device (the trainer's own Drive aside), there is no processor relationship to
paper.

The asymmetry is the point, and the 08-11 build proved the prediction: **this architecture makes
verification easy and erasure hard**, the exact inverse of a hosted product. Erasure took a
derived-pseudonym scheme, a same-name safeguard, a register applied at import and an itemised
receipt of what it cannot reach — where a hosted product would have written one `DELETE`. Weight
future compliance work the same way.

---

### [x] 29.1 Decided 2026-08-18 (Simon) — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: All its decisions are built (§29.5: 'The surface, and everything §29.1 decided about it'; af17b0b). The CUSTOM tag renders in the editor (src/modules/clipboard/clipboardEditor.js:283-285). Heading gets [x].**

- **A movement the catalog does not have is ALLOWED**, not refused and not silently normalised. It
  carries **a small tag marking it as having no official taxonomy backing** — so a trainer can see at
  a glance which movements in a plan are standard and which came in with it.
  - Recommended glyph `fa-pencil` ("hand-written"), with the word **CUSTOM** beside it, since
    Meaning may never live only in an icon — this app is used on a phone, where a tooltip is unreachable. `fa-asterisk`,
    `fa-puzzle-piece`, `fa-user-pen`, `fa-wand-magic-sparkles` and `fa-tag` all ship too, if the
    reading should be "with a caveat" rather than "yours". Not a decision — the maintainer asked
    whether a glyph exists, and the answer is that several do.
  - This does NOT retire §13's taxonomy work: the tag is what keeps a custom movement visibly
    distinct instead of quietly becoming the fortieth spelling of "Bench Press".
- **The import surface carries four inputs, every one of them optional**:
  - a **client picker** — the client's permanent id, displayed as their name;
  - a **session picker**;
  - a **text area to paste into**;
  - a **read from file** button.
- **The result is the session EDIT view, prepopulated** — the same editor used during a session, not
  a bespoke review screen. That is the decision that makes the rest cheap (see §29.2).
- **A downloadable TEMPLATE of the format**, so a trainer has a working example to follow rather than
  a schema to interpret. Generated from `programImport.js` and parsed by a test: an example that
  stopped being readable would be the app handing out a demonstration of how to fail.
- **Every parsing failure is shown BEFORE the editor opens** — all of them, not the first. A trainer
  who lands in an editor and only then notices three blank rows has been handed a puzzle; one told
  "3 of 12 lines could not be read, here they are" can fix the paste, or go in knowing exactly what
  to repair. Each failure carries its position and its raw text, so the report points at a line.

### [x] 29.2 Why the editor-as-review makes ingestion robust — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Reasoning realised in code: src/domain/programImport.js, the frozen corpus tests/fixtures/programs/ (4 files, 43bb127) and tests/unit_js/domain/frozenProgramCorpus.test.mjs. Heading gets [x].**

The maintainer's open question: *"How do we make the data ingestion not fragile, that I don't know"*.
The answer starts with the decision already made — **the import lands in an editor, not in the
database** — which turns "parse correctly" into "parse usefully": a wrong guess is a field the
trainer retypes, not a corrupted record. On top of that, in order of what it buys:

1. **Ship the prompt; do not guess the format.** Most variance is at the source. A copyable prompt
   specifying the exact shape, including a `"format": "librept.program/1"` marker, means a paste
   either announces itself or is rejected with a useful message rather than half-understood. The
   marker is also how "not our JSON" is told apart from "our JSON, one field wrong". No API key, no
   integration, no egress — it works with whichever assistant the trainer already has.
2. **Liberal at the edges, strict at the centre.** Strip markdown fences, accept an object or a bare
   array, accept a NAMED alias per field (`reps`/`repetitions`, `weight`/`load`/`kg`,
   `sets`/`series`), coerce `"3x10"` and `"3 × 10"`. Every alias is an explicit table entry with a
   test — never a generic fuzzy matcher, which fails unpredictably and cannot be reasoned about
   (verbosity over a clever mechanism).
3. **Per-item parsing, never all-or-nothing.** Item 7 being unreadable must not lose items 1–6; an
   unparsed line survives into the editor carrying its raw text, so the trainer fixes one row rather
   than starting over. This is the whole difference between fragile and merely annoying.
4. **A frozen corpus — the real answer.** Exactly the pattern
   [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs) already uses for
   backups: a fixture folder of REAL pasted outputs (Claude's, ChatGPT's, a spreadsheet paste, one
   with prose wrapped around the JSON) that must keep parsing. Every paste that fails in real use
   joins the corpus and never regresses. Nothing else keeps a parser honest over time.
5. **No second write path.** The editor's own save is the write, the same one a hand-built session
   uses, so there is no import-specific persistence to keep correct.

### [x] 29.3 Built so far (2026-08-18) — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Status snapshot of 2026-08-18, overtaken by §29.5 (shipped 2026-08-23, af17b0b). Heading gets [x].**

The pure core, test-first, with nothing wired to a screen yet:

- [programImport.js](src/domain/programImport.js) — the parser, its refusals, `programTemplate()`,
  and the all-failures report.
- [catalogMatch.js](src/domain/catalogMatch.js) — catalog id or the CUSTOM mark.
- [tests/fixtures/programs/](tests/fixtures/programs/) + [the corpus test](tests/unit_js/domain/frozenProgramCorpus.test.mjs)
  — four real pasted shapes that must keep parsing, and the rule that every paste which fails in real
  use joins them.

### [x] 29.4 What is already in the repository, and should be copied rather than invented — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Its one open line ('A use case is still owed') is done: use_cases/uc9_program_import.md. The reuse list was used (programImport.js, catalogMatch.js). Heading gets [x].**

- **[§26](TODO.md)'s intake** is the same shape — a document another party produced, reviewed before
  anything is written ([signupFile.js](src/data/signupFile.js) →
  [signupReviewDialog.js](src/modules/clients/signupReviewDialog.js)). The file half of §29.1's input
  list is that flow with a routine instead of a person.
- **[§1.7](TODO.md)'s media-type ruling**: one media type per handling surface, so a program is
  `application/vnd.librept.program+json` and the intake file stays its own.
- **[exerciseStandard.js](src/domain/exerciseStandard.js)** already maps a movement name onto the
  catalog by canonical name (the wger crosswalk, UC6 §6) — that is the matching half solved, and it
  is also what decides whether a movement earns the CUSTOM tag.
- **A use case is still owed**: this is a workflow, so it needs a file under
  [use_cases/](use_cases/INDEX.md) like every other one.

---

## 33. [x] Code and tests still cite `TODO.md` 495 times — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: Replaced by §82 'Links run one way, out of TODO.md' (ruled 2026-09-26: no file may point at a TODO section) and its gate agent_tools/todo_refs.py (96afe34 'feat(tools): a pointer into TODO fails the build', 500cb2b). The 'what replaces them' question is answered by AGENT_RULES ('what a file needs to explain itself is written in that file').**

**Decided 2026-08-19 (Simon):** *"the code and tests are allowed to reference only use cases"* —
code and tests work from behaviour and requirements, not from process documents. The operating-rules
half is done and now gated: no file outside the loaders and document maps mentions them.
The `TODO §N.M` half is 495 sites, and unlike those citations these carry real navigational value:
a `§` pointer is often the only route from a module to the reasoning that produced it.

**Open question before sweeping**: what replaces them. Three candidates, in preference order —
a link to the [use case](use_cases/INDEX.md) that specifies the behaviour (best, but not every
module has one); the reason restated in the comment itself (always possible, costs length); or
nothing (cheapest, loses the trail). Doing this as one 495-site mechanical strip would rewrite
half the repository's comments blind, so the plan is to convert them **as files are touched**,
starting with the modules whose §-refs point at sections that have already shipped.

---

## 34. [x] Browser-suite cost: what an audit of test durations found — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Its action is done: 795c356 'perf(demo): honour reduced motion, and gate the demo as its own task' and 337d42d 'docs(todo): record the demo-suite outcome and the parallelism answer'. The rest is measurement for the record. Pipeline speed now lives in §91 ('The pipeline is slower than it needs to be — measured 2026-09-30'). Heading gets [x].**

**Measured 2026-08-19** on a quiet 16-core box, `--durations=0` over both browser tiers. The headline
is that nothing is broken: the duration distribution is smooth (51 tests near 3s, 48 near 2s, 31 near
4s), so there is **no cluster of near-identical times** — the signature of a swallowed timeout, which
is what the 2026-08-07 investigation found. This is real work, and both tiers run near their parallel
floor: e2e at 81% efficiency (755s of call time, 94s floor at 8 workers, 116s actual), medium at 63%
(238s call, 30s floor, 48s actual).

So the only lever left is **total call time**, and it is concentrated in deliberate waiting:

| Where | Cost | What it is |
| :--- | :--- | :--- |
| `test_walkthrough.py` | 117s / 20 tests | the demo's own pacing:each step is 520ms scroll + 650ms hand travel + 160ms tap + 1350ms settle ≈ 2.7s, and a test that walks the script pays ~11s |
| `test_demo_tour.py` | 41s / 4 tests | same constants, whole script per test |
| `test_splash_screen.py` | 63s / 19 tests | the splash's deliberate minimum hold |
| `test_layout_overflow.py` | 45s / 4 tests | genuine geometry sweeps across four viewports and two languages |

**158s of 755s (21%) is the app deliberately waiting so a human viewer can follow a finger.** Those
constants exist for a viewer (raised 2026-08-18: "on web browser the button and clicks are about 50%
too fast"); the tests pay them 24 times per gate run to assert step logic that has nothing to do with
pacing.

**Done 2026-08-19** — the second option, plus the reason the first was wrong. The demo now runs at
`demoPace` zero under `prefers-reduced-motion`, which is a real user mode rather than a test switch,
and the suites moved into their own Stage 3 task beside the e2e one. `test_demo_tour.py` 41s -> 6s,
`test_walkthrough.py` 117s -> 22s, whole gate 3m13s -> 2m46s.

**Is more parallelism worth it for the demo task? No — measured after the change:**

| Configuration | Wall |
| :--- | :--- |
| Combined, one scheduler, 8 workers (208 tests) | 111s |
| Split as shipped: e2e at 7 ∥ demo at 1 | **104s** (e2e 104s, demo 76s) |
| Demo alone, 2 workers | 25s |
| Demo alone, 4 workers | 17s |

The stage costs `max(e2e, demo)` and e2e is the long pole, so the demo task already has ~28s of
slack; more workers there can only come out of e2e's seven and push the long pole further out. Note
also that its 76s inside the stage is CONTENTION, not cost — standalone it is a quarter of that — so
nobody should read that number as the demo suite being slow. And the split is 7s FASTER than one
scheduler over everything: two schedulers avoid the tail where one worker holds the last slow file
while the others idle.

The remaining lever for Stage 3 is e2e's own call time (437s of CPU over 182 tests), not
parallelism. Raising the total worker count above half the cores has been measured and rejected
twice — compositor starvation and the dev server's listen backlog, both surfacing as `Page.goto`
timeouts unrelated to any change.

**The three candidates as they were assessed, for the record:**

1. **A URL knob for the pace** (`?demo=walkthrough&pace=fast`). Cheapest to write, and wrong: it adds
   product surface whose only consumer is the test suite.
2. **Move the step-logic tests down a tier.** Most of `test_walkthrough.py` asserts panel behaviour —
   which control is offered, what Back rebuilds, what the caption says — and needs no router, no
   persistence and no real boot. Mounted in `tests/medium/` via a stub, each can inject its own
   `wait`, because `performStep` already takes one. Two e2e tests stay behind to prove the real thing
   end to end, and one asserts the PACING itself, which is currently asserted nowhere.
3. **Leave it.** 15s of wall time per run against a day's work is not obviously worth the churn.

---

### [x] 35.1 Shape before content — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Built: one persona at a time with a labelled handover (storyTour.js 'story_persona_client', the one-persona-at-a-time ruling comment near the ARRIVE_CHAPTER); paper track as text on a textured card (PaperNarratorCard in src/modules/demo/demoNarratorCard.js); client screens are the real /intake page. Rules now live in those files' comments.**

- **Chapters, each independently playable and each ending somewhere useful.** ~23 events is 4–6
  minutes at the current pace, and nobody watches an unbroken five-minute demo of software they do
  not yet use. `?demo=story` plays the lot; `?demo=story&chapter=floor` plays one. A chapter is a
  tour in the existing sense, so the engine ([demoTourPlayer.js](src/modules/demo/demoTourPlayer.js),
  [domain/demoTour.js](src/domain/demoTour.js)) is unchanged and a chapter is DATA.
- **Every step still carries an expectation**, including the narrated ones — the rule `validateTour`
  enforces, and the reason a script was chosen over a recording. A paper-action card is not exempt:
  its expectation is that the card is on screen and dismissible. What is NOT allowed is a step that
  claims something about the app while asserting nothing about it.
- **The paper track is TEXT on a paper-textured card, never a picture of a form.** The card SAYS what
  happens on paper — the client signs the printed consent, the trainer dates and files it, the form
  version is recorded — over a paper texture that marks it as narration. Do not draw a form that
  looks like a screenshot: everything else in the demo is the live app, so a drawn surface among them
  reads as a real screen, and the first viewer who tries to find it in the app has been misled.
- **ONE persona on screen at a time, with a transition between them** (decided 2026-08-19, Simon:
  *"we don't really need split screen, transition is enough"*). Desktop gets the same treatment as
  mobile — no side-by-side pane, no second layout to keep working at every width, and the handover
  itself becomes the thing the viewer reads. Each persona's screen is labelled with whose phone it
  is, because the app looks the same on both sides of the handover.
- **The client's screens are the real ones.** Intake, consent and RSVP already exist as pages
  ([signupDelivery.js](src/modules/intake/signupDelivery.js), `consent-form-*.html`,
  [rsvpView.js](src/modules/rsvp/rsvpView.js)), so the client chapter drives those rather than a
  mock-up of them. A hand-built "client phone" would be a recording with extra steps, stale the day
  those pages change.

### [x] 35.2 The events — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: The event list is implemented as the chapters of src/modules/demo/storyTour.js ('All five chapters play — 2026-08-22', §35.4); later changes to the script are recorded in §38.21, §39 and §73.**

**Chapter A — three friends arrive.**

1. The trainer's board, with the message feed and no pending work — the before state the story moves
   away from.
2. The trainer books the pair of weekly slots: muscle gain, 2× a week, fixed day and time, 60-minute
   slot, three participants. **Needs the recurrence model (35.3a).**
3. The trainer shares one self-onboarding link per friend, each carrying the calendar invite for the
   series.
4. **The demo hands over to the client** — a labelled transition from the trainer's app to a friend's
   phone, on every screen size.
5. On the phone: the introduction form — name, contact, goal, and injuries *offered, never demanded*
   (§1.7's ruling, [clientSignup.js](src/data/clientSignup.js)).
6. Consent, with the notice version and the language it was given under stamped into the record —
   Art. 7(1) is about being able to DEMONSTRATE it later.
7. The paper card, narrated: the same consent on a printed form, signed and dated, filed by the
   trainer, its form version recorded (§3.5). Same record, different pen.
8. The submission travels as a FILE; the trainer reviews it and decides
   ([signupReviewDialog.js](src/modules/clients/signupReviewDialog.js)) — the feature's trust
   boundary, and the step where the story says a stranger cannot write into the register.
9. The other two are compressed into one step, not replayed. A demo that shows the same form three
   times teaches that the app is slow.
10. Back on the phone: the invite is answered ([rsvpView.js](src/modules/rsvp/rsvpView.js)) and the
    trainer's board fills in.

**Chapter B — the first programme.**

11. The trainer builds the session as circuits, with rests as real items (§8.6), to **45 minutes net
    inside the 60-minute slot** — the net-vs-slot number is the whole point of this chapter and
    should be visible while it is being built. **Needs the net-time meter (35.3b).**
12. The same circuit is bound to all three participants at once. **Needs §8.1.**

**Chapter C — on the floor.**

13. The session opens: one clipboard, three participant tabs, the circuit running.
14. Mid-circuit a client mentions a recent minor injury; the trainer records it **without leaving the
    session and without stopping the clock**, TAGGED to that one participant. **Needs an in-session
    injury capture (35.3c).**
15. The trainer swaps that one movement **for that one participant**; the other two are untouched and
    the demo shows they are untouched.
16. On the deadlift the trainer sees bad posture and leaves a coaching note against that client's
    exercise — one-handed, mid-set. It is a note about a MOVEMENT, so it must resurface the next time
    that movement is programmed for that client, not only in a session log. **Needs 35.3d.**

    **What events 14 and 16 are in the story FOR** (refined 2026-08-19, Simon): not the capture
    itself, which is two taps and unremarkable to watch, but the **review pane** they feed and the
    **per-client tagging** that gets them there. The demo's claim is that a note taken one-handed
    mid-circuit lands against the right person and comes back at the right moment — so the capture
    steps are short, and the pane in event 20 is where the camera stays.
17. Circuits progress; Too Easy is signalled once, so the story keeps §23.4's wedge inside it.
18. The last circuit completes; the session is marked complete, net time against slot time shown.

**Chapter D — the evening after.**

19. The trainer switches to the dark theme, and the rest of the story runs in it — the only "look at
    our settings" step that earns its place, because it is what an evening at home actually looks
    like.
20. Planning the next session: the injury swap and the deadlift note are **already there**, waiting
    against the right client. This is the payoff for events 14–16 and the reason they are in the
    story at all.
21. A pre-agreed one-off move of the NEXT occurrence two hours later — **the series does not change**
    — which lands 30 minutes across a 1-to-1 cardio session. The occupancy grid shows the two side by
    side ([overlapLanes.js](src/domain/overlapLanes.js)); the overlap is accepted deliberately, on
    screen, rather than warned away. **Needs 35.3a and §1.3.**
22. The updated invite goes out to the three; the replies land on the board.
23. Thank you, and the two ways onward already decided in §30.2 — play around, or clear the demo
    data.

### [x] 39.11 Answered 2026-08-31 — not work — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Heading says 'Answered 2026-08-31 — not work'. The answers (navigator.share hands over to the phone's share sheet, with clipboard and on-screen fallbacks in src/modules/clients/intakeInviteDialog.js; the demo phone number is invented and nothing is sent) are answers, not open work.**

**"Other ways to send it — are those Chrome's built-in options, or do we have influence over that?"**
The button is ours, and so is its wording and the payload; what it opens is not. It calls
`navigator.share()`, which hands over to the phone's own share sheet — we choose the title, text and
link, and nothing about which apps appear or how the sheet looks. Where the browser has no
`navigator.share`, we write the link to the clipboard, and where that fails too we put the link on
screen in a read-only field ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js),
§26.3).

**"Where did you get the demo phone number? Can it be some operator SMS echo service?"**
`+386 41 234 567` is invented in the story script — a well-formed Slovenian mobile number with an
obviously fake tail. It reaches nothing, and nothing is sent: the step composes the message and the
story never taps send. I know of no Slovenian operator echo service and will not claim one exists.
If the point is a number that is provably nobody's, the clean answer is a range a regulator has
reserved for fiction — the UK and the US both publish one, and whether AKOS does is a question for
their numbering plan, not something to guess at.

### [x] 41.0 REDIRECTED 2026-09-11 — planning gets the columns, the clipboard does not — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Ruling executed in c200149 (2026-09-11); the ruling itself is restated in the compressed §41 body and in the header comment of src/modules/clipboard/planColumns.js ('Planning only, and that is the whole point').**

**Ruled (Simon):** *"večstolpični pogled raje uporabiva za načrtovanje treningov"*, and then
*"štartaj implementacijo seje priprave načrtov"*. This overrides §41.1's "the clipboard goes first".
Everything below stands as written; what changed is WHICH screen gets columns, and it changed for
reasons §41.4 had already written down against itself.

- **The width exists where the trainer sits.** §41.4's first objection is that the gym floor is the
  judge and a wide layout serves a desk. Planning IS the desk activity. The objection does not apply
  to it; it applied to the clipboard.
- **§41.4's safety argument disappears.** The clipboard is where data is WRITTEN live — sets, quick
  signals, timers — and one participant per screen with thumb-sized targets is what keeps a mis-tap
  from logging a set against the wrong person. Planning writes a plan. A wrong drop is visible and
  undone before anybody trains.
- **Comparison is the actual need in planning.** Building a group session for three people is where
  "the same for everyone, except Ana's knee" is decided, and that decision wants the three
  programmes side by side. During execution the trainer looks at ONE person, because they are
  standing in front of them.
- **Dragging between columns is what makes it worth building, and §41.4 named it as the likeliest
  bug.** In planning it is the feature; in execution it is a gesture with two meanings.
- **The schedule risk drops with it.** §41.2's hard part is that recovery after a reload reads the
  address bar. In a live session being wrong there loses a session; in planning it costs some
  retyping. **So the first slice does not touch the route grammar at all.**

**What the code already gives us, read 2026-09-11 before any of it was written:**

- `currentPlanMode()` ([activeSessionStore.js](src/controllers/activeSessionStore.js)) already
  returns `live` / `future` / `planning`, so "planning" needs no new concept — it has one.
- The editor is already a function of ONE participant:
  [activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js) calls
  `renderClipboardEditor(deckContainer, { activeClientState, clientName, … })`, and the plans live
  per client in `clientRoutines[clientId]`. Columns mean calling it N times into N containers, not
  taking it apart.

**Two obstacles, both small and both found by reading rather than by running into them:**

- [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) writes one fixed
  `id="clipboard-editor-ex-names"` — the exercise-name datalist. N editors would mean N identical
  ids. One shared list above the columns.
- [editModeState.js](src/modules/clipboard/editModeState.js) holds ONE `editorRowId` for the whole
  module, meaning "which row is open". With columns that becomes an answer per column. The same
  shape of question as §41.2's routes, but it stays inside the module and never reaches session
  recovery.

**Still ruled, and unchanged:** the clipboard stays one participant at a time until somebody shows
that it is missing on the floor.

### [x] 41.1 Two layouts, not one — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: §41.0 (2026-09-11) overrode 'the clipboard goes first'; the count rule '1/2/3/4/5/.. odvisno od prostora' is implemented as planColumnCount in src/modules/clipboard/planColumns.js.**

**Ruled 2026-09-10 (Simon), and §41.0 has since redirected which screen this applies to first.** They share the rule for dividing the width and nothing else:

| | The clipboard (live session) | The home screen |
| :--- | :--- | :--- |
| What a column holds | one participant's programme | one view taken from the menu |
| How many | *"1/2/3/4/5/.. odvisno od prostora in števila udeležencev"* | as many as the same rule allows |
| Are the columns alike? | yes — the same view, once per participant | no — different views side by side |
| Per-column state | **each programme is independently in EDIT or EXECUTE mode** | each view is itself |

*"clipboard pokaže 1/2/3/4/5/.. programov hkrati odvisno od prostora in števila udeležencev, vsak
program je individualno lahko v edit ali execute načinu (popravi deep linke)"* — so the count is not
a fixed three: it is what the width allows, bounded by how many participants the session has.

**The clipboard goes first.** Its columns are alike and the rule for filling them is already ruled;
the home screen still has to choose what goes in them (§41.3).

### [x] 41.2 The deep links are the hard part, and they are ruled to change — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: §41.5's ruling (2026-09-10: the layout is remembered, not addressed) and §41.0 ('the first slice does not touch the route grammar at all') replace the ?with= route proposal.**

A route today names ONE session and ONE client, and three shapes carry the mode:

```
/session/:sessionId/client/:clientId                         execute
/session/:sessionId/client/:clientId/edit                    edit
/session/:sessionId/client/:clientId/edit/exercise/:slotId   edit, one row open
```

With several columns, each in its own mode, the address has to name a SET. Proposed — **the focused
column keeps the path, the rest ride in the query**:

```
/session/:sessionId/client/:clientId?with=c7:edit:slot3,c9
```

Why this shape rather than a new path grammar: **every link ever shared keeps working and keeps
meaning.** A link with no `with=` is exactly today's link — that client, alone or focused — so the
demo scripts, the walkthrough's steps and every message a trainer has already sent stay correct, and
the multi-column state is additive.

What this touches, and why it is the schedule risk rather than the layout:

- **Recovery after a reload reads the address bar** to know whether the trainer was in the editor and
  which row was open ([sessionLifecycle.js](src/controllers/sessionLifecycle.js)). Per-column mode
  makes that a set of answers, in the one path where being wrong loses a session.
- [sessionFocusUrl.js](src/controllers/sessionFocusUrl.js) syncs the focused card INTO the URL on
  every render. With several columns, "the focused card" needs a definition before that sync can be
  written.
- The demo story and the guided walkthrough assert on routes (§35, §38). They are the regression net
  for exactly this screen.

### [x] 41.4 Red team — the strongest case against the whole idea — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: §41.0 answers the red team by moving columns to planning; the surviving ideas (participant strip, widen the home screen) are carried into the compressed §41 body.**

Written against it on purpose. Nothing here is a refusal; it is what has to be answered before this
is worth building.

1. **The judge is the gym floor, and this is a desk feature.** Value 13 says a decision that only
   makes sense at a desk is wrong. A wide layout serves a trainer sitting down. Before any of it:
   how many of the trainers in the go-to-market plan own a tablet they would carry to a session?
   If the answer is "the maintainer's own", the audience is one.
2. **The clipboard is where data is WRITTEN, and its narrowness is a safety property.** Sets, quick
   signals, timers. One participant per screen with thumb-sized targets is what keeps a mis-tap from
   logging a set against the wrong person. Five columns makes those targets smaller and puts another
   client's row a thumb-width away — against the standing rule that touch targets get real padding.
3. **Two modes on screen at once is the likeliest source of a data-loss bug in the whole idea.** Edit
   mode is drag-to-reorder; execute is tap-to-log. Side by side, a drag that starts in one column and
   ends over another is a gesture with two meanings and no obvious right answer.
4. **The route space multiplies, in the one place that must not break.** §41.2 lists what reads a
   route; recovery after a reload is among them. The layout is a stylesheet problem; the addressing
   is not, and that is where the time will actually go.
5. **The test matrix multiplies with it.** The medium tier's stubs assume one column and the e2e
   suite asserts on "the in-focus card"; both land in the slowest stage of the gate.
6. **The home screen risks becoming a dashboard — a thing that is READ rather than used.** And since
   the phone still shows one column, every feature after this is designed twice.
7. **Sequencing.** [docs/PREVIEW.md](docs/PREVIEW.md) still tells trainers this build can lose their
   data, and the ranking at the top of this file puts data safety and showability above everything.
   A wide-screen layout moves neither.

**Answered 2026-09-10 (Simon), and it moves the ground under most of the above:**

> *"res je večina trenerjev ima telefon"* · *"več vrstični clipboard je feature predvsem za večerno
> urejanje načrtov za računalnikom, ne live delo"* · *"again smiselno samo za evening planiranje sej"*

**The multi-column clipboard is an EVENING PLANNING feature, at a computer — not a gym-floor one.**
That is a different product decision from the one argued against above, and it settles three of the
seven objections rather than answering them:

- **(1) audience** — conceded and reframed. Most trainers have a phone, and the phone keeps its one
  column. The wide layout serves the evening, on a machine that is already sitting on a desk, which
  is the one context where a desk-shaped answer is the right one.
- **(2) thumb-sized targets** — falls for the evening. Nobody is logging a set into five columns at
  arm's length; the evening has a mouse and a keyboard. **It does NOT fall for the live case below.**
- **(3) two gesture modes at once** — falls as a hazard in the evening, and comes back as an
  OPPORTUNITY (§41.6): with several plans open in edit at once, dragging an exercise from one
  client's plan into another's becomes possible, and no single-column layout can offer that at all.

**Corrected the same day, by the maintainer's own Tuesday:**

> *"primer uporabe clipboarda (1 ali 3 stolpce) je moj torkov trening: tri stranke vsak svoj program
> hkrati"*

**So the live case is real, and it is the maintainer's own weekly session:** three clients training
side by side on three different programmes. One column on a phone, three on a tablet — the count
follows the device, which is what "odvisno od prostora" already said. Objections (2) and (3) stand
for that case and are settled only for the evening one, so the layout has to serve both without
carrying the evening's gestures onto the floor.

**The rule that lets it: the per-column MODE is the safety boundary, and it was already ruled.**

| A column in EXECUTE | A column in EDIT |
| :--- | :--- |
| the gym floor: logging sets, signals, timers | planning: reordering, adding, removing |
| thumb-sized targets, no drag gestures at all | drag is the point |
| **never accepts a drop from another column** | may exchange exercises with another EDIT column |

Cross-column drag (§41.6's opportunity) is therefore allowed **only between two columns that are both
in edit**, and an executing column is inert to it. That is one rule, it needs no mode switch of its
own, and it means the Tuesday session on a tablet — three columns, all executing — has exactly the
gesture surface the single-column clipboard has today.

**What survives, unchanged:** (4) the routes, (5) the test matrix, (6) the two-experience problem —
sharper now, because the phone and the desk stop being the same layout by design rather than by
accident — and (7) sequencing.

**The question the evening framing raised — whether this belongs in the plan editor rather than the
live clipboard — is answered by the Tuesday case: the clipboard.** It is the screen a session is run
on, and running three programmes at once is the case. The evening then uses the same screen with its
columns in edit mode, which is what the per-column mode is for.

**Two cheaper things that take most of the value, worth measuring before the full build:**

- **A participant rail.** On a wide screen, a fixed strip of participant names down the side of the
  single clipboard column: switching becomes one tap instead of a swipe, targets stay thumb-sized,
  and **no route changes at all**. It answers the complaint the request came from — switching one at
  a time — at a small fraction of the cost, and it is not thrown away by a later multi-column build.
- **Two columns before five.** Pair training is the common case above one; two columns can be built
  with the focused-column route shape and no gesture ambiguity worth the name. Five is a different
  product decision, and it can be taken after two are in front of real trainers.

For the home screen, the equivalent cheap answer is **widen rather than split**: one column at a
comfortable measure, with the deck showing more days at once. It uses the space without inventing a
second layout to maintain.

### [x] 42.5 One head row, however open the card is — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: 7cf8d71 (2026-09-10) feat(clipboard): two expand settings that hold, and one head row per card**

**Reported 2026-09-10 (Simon):** *"kartice imajo zanimiv past tag v naslovni vrstici, expanded card
pa da past tag nad ime kartice, popravi, da ostane enak izgled expanded in collapsed"*.

The collapsed row put the tag at the end of the title row; the expanded card put it on a line of its
own above the name. One card read as two designs depending on how open it was — and on the past card,
where the tag says which session the history came from, the tag moved furthest.

Every card shape now draws the SAME head row in every state: number or icon, name, tag, and whatever
control belongs at the end. The focused card's name grows so it is still readable at arm's length
mid-set, but the row, the order and the tag's place do not move — that is what makes three states one
design.

It also takes the first of §42.3's savings: folding the top row into the name line is ~32px off every
expanded card, which is what "expand all" spends its screen on.

### [x] 42.6 A collapsed circuit names its movements — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: 1e1a296 (2026-09-10) feat(clipboard): a collapsed circuit names its movements; CHANGELOG.md:1208**

**Asked 2026-09-10 (Simon):** *"a lahko skrčene kartice za circuit prikažejo tudi imena vaj, težo in
ponovitve (brez gumbov)?"* — shipped the same day, see [CHANGELOG](CHANGELOG.md).

"Tri-Set Metabolic Circuit" with a round badge said only that three unnamed things were coming, while
every other collapsed card already said what the trainer was looking at. It lists each movement with
its reps and load now, in the same rows the open card draws, minus the actions — the rule every card
that is not in focus follows (§42.1).

**Found by looking at the real app rather than the stub:** a rest INSIDE a circuit is a member like
any other and has no name or reps, so asking it for them printed a line reading `undefined` under
every circuit in the deck. The medium-tier fixture had no rest inside its circuit; the seeded demo
data did.

### 45.6 [x] The session list needs filters: a date range, a client, a location — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: 6c4708a (2026-09-11) feat(sessions): filter the board by dates, client and location — src/modules/sessionList/sessionFilterBar.js (chips, not a modal; own calendar), src/domain/sessionFilters.js (nextDateSelection); empty board says why: src/modules/sessionList/sessionsView.js:361-363. Later calendar work closed as §74.**

**Reported:** on the home screen, the calendar should act as a from–to filter; a filter by client is
wanted; Simon added a filter by location.

**None of the three exists today.**

**Not a modal (agreed, Simon 2026-09-11).** A modal costs two taps and hides what is switched on, so
a trainer sees a short list without seeing why it is short — and this screen is read one-handed, with
a client waiting. The shape instead: **a row of chips under the header that shows what is active**,
each removable with one tap. A modal becomes worth revisiting only if the chips stop fitting on a
phone-width row.

**Researched 2026-09-11, and it is a bigger change than "add three filters".** There is no calendar on
the board today. The control that looks like one is *Jump to date*
([sessionTimeline.js](src/modules/sessionList/sessionTimeline.js)): it opens the phone's native date
picker and **scrolls** the timeline to that day. The board itself is one continuous, time-ordered
list with sticky day headers, over a fixed window of days around today
([sessionsView.js](src/modules/sessionList/sessionsView.js)'s `visibleSessions`).

**The request changes the model, not just the control: from "take me to" to "show only".** Three
things are built on the first model and have to be answered before any of this is written:

- **Day swipes and the sticky headers.** A day is a POSITION in the list. Under a from–to filter,
  what does swiping past the end of the range do — nothing, or widen the range?
- **The Today button**, which today both jumps to today and shows which day is in view. What is it
  when today is outside the chosen range?
- **The `sessions.day` route.** The focused date is written into the URL, so a deep link names a day.
  A filtered board has a range as well as a position, and the link has to say which it carries — this
  is [§19](TODO.md)'s territory, not the board's alone.

**The chips live in the sticky title bar** (asked 2026-09-11, after seeing them). They shipped as a
row below it, which meant scrolling the board took the filters off the screen while the thing they
filter stayed on it — a filter nobody can see is the modal's defect arriving by another road. One
sticky header now carries two rows, the title with the day controls and the filters under them, and
the calendar opens inside it. The day headings' own sticky offset follows on its own: the timeline
measures that header with a ResizeObserver, so a second row costs no number kept in step by hand.

**Chips, not a modal, is still the answer for the client and location filters** — they are plain
"show only these" choices and a modal hides what is on. The date range is the one that is not simply
another chip, because the board's whole navigation is already made of dates.

#### The date range's click model — proposed 2026-09-11 (Simon), NOT decided

Proposed as booking.com's: first click selects a day; a second click on the same day clears it; a
second click on another day makes a range; then the third click moves the first date, the fourth
moves the second, and odd/even clicks continue that pattern. Separately proposed: a click on an
already-selected date removes it and the range collapses back to one day.

**Booking.com does not do the odd/even part.** Its rule is keyed to MEANING — first click is the
arrival, second the departure, third starts over — not to a count of clicks.

**And the count is the defect.** Under the parity rule, what the next tap does depends on how many
taps came before, a number that is nowhere on screen. Two identical taps on the same day give
different results, and a trainer who mis-taps cannot see why. Every rule here has to be readable from
what is VISIBLE.

**The collapse-to-one-day proposal is good and should be kept**, with one clarification: it can only
apply to the two ENDS. A day in the middle of a range looks selected too, and removing it would split
the range into two pieces, which a single from–to filter cannot express.

**Counter-proposal — five rules, every one read off the screen:**

1. nothing selected, tap A → filter is the day A;
2. one day A, tap A again → filter cleared;
3. one day A, tap another day B → the range between them, in either direction (a tap BEFORE A gives
   B–A, never an inverted range);
4. a range, tap one of its two ends → that end goes, the other stays as a single day;
5. a range, tap any other day → the NEARER end moves there: inside the range it narrows, outside it
   widens. An exact tie has to be settled by a fixed rule — the start, arbitrarily, and what matters
   is only that it never changes.

Rule 5 does the work parity was meant to do, without anything to remember: the edge nearest the
finger is the one that moves. Rule 4 guarantees a way back from a range to a single day, so no state
is a dead end.

**The conservative alternative to rule 5** is booking's own: a tap anywhere else starts over with one
day. Easier to explain, but every narrowing then costs two taps instead of one.

##### Checked against documented practice, 2026-09-11 — and BOTH of the above are inventions

Asked to test the design against the portals that built people's expectations. Every reference below
was opened and read, not taken from a search summary.

- **The third tap starts over.** eBay's design system states it plainly: the first tap sets the start,
  the second the end, *"a third tap resets the date range and sets the new starting date"*
  ([playbook.ebay.com](https://playbook.ebay.com/design-system/components/date-picker)). Syncfusion's
  widely used component documents the same rule with more detail: a click when both ends are set is a
  new start, **and a click on a date earlier than the current start is also a new start, never an
  inverted range** ([help.syncfusion.com](https://help.syncfusion.com/js/daterangepicker/behavior-settings)).
  Airbnb's `react-dates` behaves the same way for a selection that would be invalid — the clicked day
  becomes the start ([github.com/airbnb/react-dates#1978](https://github.com/airbnb/react-dates/issues/1978)).
- **Nothing uses alternation, and nothing uses "the nearer end".** Neither the parity model nor the
  five-rule counter-proposal appears in any design system or component library found. Both are
  patterns a trainer has met nowhere else.
- **Booking.com — the portal this started from — edits an existing range by naming the END FIRST**:
  *"by clicking the appropriate box for check-in/out the dates can be adjusted"*
  ([blog.mobiscroll.com](https://blog.mobiscroll.com/how-to-build-amazing-booking-apps-calendar-tips-and-considerations/)).
  So the visible marker both of us arrived at is real practice — with the difference that the USER
  arms it, rather than the app alternating it.
- **Ends styled apart from the days between them is the standard**, not a nicety: endpoints get a
  *"distinct style"* with rounded caps, the interior a *"continuous highlight colour lighter than the
  selection circles"* ([uxpatterns.dev](https://uxpatterns.dev/patterns/forms/date-range)). The same
  page recommends the header text change from "Select a start date" to "Now select an end date" —
  the marker, in words.
- **Do not move the calendar between the two taps.** NN/g: a shifted month *"may go unnoticed and
  cause users to slip by clicking where the intended date used to be"*
  ([nngroup.com](https://www.nngroup.com/articles/date-input/)).

**So the model to build, unless overruled:**

1. first tap = start, second = end; a tap before the start becomes the start, never an inverted range;
2. a third tap on any day starts over from that day — the one behaviour a trainer already knows;
3. a tap on the same single day clears the filter;
4. to move ONE end without starting over, tap the `od` or `do` chip to arm it, then tap a day. Armed
   is visible, and chosen rather than inferred;
   - **The chips are OUTSIDE the calendar grid** — in the filter row above it, beside the client and
     location chips — so arming can never collide with rule 2 or 3. Misread once as "tap the endpoint
     inside the grid to arm it", which is genuinely unworkable: a tap on a day already means
     something there, and the only way left to tell the two apart would be a drag, which is the wrong
     gesture on a phone. Booking.com places its check-in/check-out boxes outside the calendar for the
     same reason.
   - The same tap on a day therefore has two outcomes depending on whether a chip is armed. That is
     only allowed because armed is VISIBLE — the whole objection to the parity model was a mode
     nobody could see, and a mode this design cannot see either would be the same defect rebuilt;
5. ends drawn stronger than the days between them, and the calendar does not shift while choosing.

**What this costs, and it is the largest part of §45.6.** None of it is possible with the phone's own
date picker: every date control in this app is a native `<input type="date">`, which returns one date
and can neither show a range nor take two taps. This means a calendar of our own — a month grid,
swiping between months, thumb-sized targets, marked ends and marked days between them, in five themes
and two languages. A new component, not a setting on an existing one.

Also unresolved and cheap to get wrong: what the list shows when a filter matches nothing. An empty
board that does not say "because of a filter" is the same defect in a different costume.

### 45.14 [x] Found while running the gate: `_switch` waits for the wrong thing — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: The section's own body says '[x] Fixed the same day'; tests/e2e/test_sandbox.py:28-48 — _switch waits for body.in-sandbox, not activeWorkspace().**

**Two sandbox tests failed on 2026-09-11**, in a Stage 3 that took 308s where earlier runs that day
took 183–196s — the same suite, a busier machine.
`test_a_sandbox_older_than_twelve_hours_offers_a_fresh_one` was clicking the ☰ menu while
`#dialog-sandbox-stale` sat over it, and `test_coming_back_returns_to_the_view_you_left` read the URL
before it had been rewritten. Both pass when the file is run on its own. **This is not flakiness to
be re-run away; it is one located defect in a test helper.**

**The cause.** `_switch` ([test_sandbox.py](tests/e2e/test_sandbox.py)) waits for
`activeWorkspace() === expected`, then sleeps 200ms. That flag flips in the MIDDLE of
`switchToWorkspace` ([app.js](src/app.js)): `switchWorkspace()` sets it, and only afterwards come
`renderEverything()`, `rebindTimers()`, `returnToLastView()` — which is what rewrites the URL — and
finally `offerFreshSandboxIfStale()`, which is what opens that dialog. So the helper returns while
the switch is still running, and 200ms is the whole of what stands between it and the rest. On a
quiet box that is enough; under eight browser workers it is not.

**[x] Fixed the same day, in the test and with no timeout.** The helper now waits for
`body.in-sandbox` to match the workspace it asked for. That class is set by `renderWorkspaceChrome()`
inside `renderEverything()`, which runs AFTER the switch's awaits — and `renderEverything()` through
`returnToLastView()` is one synchronous block, so observing the class means the database is loaded
and the address bar has moved. The app needed no new signal; it was already saying this, and the test
was asking the wrong question.

**One place also had to stop lying to the page.** The staleness test aged the sandbox and then called
`switchWorkspace('working')` from inside `page.evaluate` — which moves the stored workspace without
repainting, leaving `body.in-sandbox` saying "sandbox" for a workspace the app had left. Any wait on
that class would then be satisfied by a stale fact. It now leaves and re-enters through the menu, the
way a trainer does.

**The lesson, which is why this is written down rather than just fixed:** a wait on a flag that is set
mid-operation is a sleep wearing a better name. `setActiveWorkspace()` is called before
`loadSavedState()` and before a first sandbox is seeded, so the flag was true for the whole expensive
part of the switch.

## 46. [x] Reported 2026-09-12 — the setup form, read off a screenshot — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: All seven subsections (46.1–46.7) are [x] and already archived; the parent keeps only an intro.**

Simon sent one screenshot of the session setup form in Slovenian and asked what was wrong with it.
Six things were, and the picker under them turned out to be the bigger problem.

### 46.1 [x] The warning list called the whole day taken — fixed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#461-x-the-warning-list-called-the-whole-day-taken-fixed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.2 [x] Choosing two clients out of a hundred — redesigned 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#462-x-choosing-two-clients-out-of-a-hundred-redesigned-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.3 [x] Four smaller things in the same screenshot — fixed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#463-x-four-smaller-things-in-the-same-screenshot-fixed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.4 [x] The demo data speaks the trainer's language — shipped 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#464-x-the-demo-data-speaks-the-trainers-language--shipped-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.5 [x] The seed stamp says what it is — renamed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#465-x-the-seed-stamp-says-what-it-is--renamed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.6 [x] [Decided] The demo-removal code stays, as a safety valve — ruled 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#466-x-decided-the-demo-removal-code-stays-as-a-safety-valve-ruled-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.7 [x] The stamp says WHICH kind, and the app notices when test data escapes — shipped 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#467-x-the-stamp-says-which-kind-and-the-app-notices-when-test-data-escapes-shipped-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 61. [x] Every install reads the preview schema P — the live schema must not be P — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: The problem is gone: src/data/recordSchemas.js:340 DEFAULT_READ_SCHEMA = 5, src/data/migrationSteps.js:35 CURRENT_SCHEMA_VERSION = 5; PREVIEW replaced P in a37e926 (2026-09-18); the 'still open' second browser pass that reads PREVIEW exists since 635ef74 (build/__init__.py:1768 _read_schema_flags, .github/workflows/deploy.yml:244-248). The other 'still open' item, discarding preview data at the end of a test run, has no commit of its own — each test runs in a new browser context, so nothing survives it (not separately verified).**

**Ruled 2026-09-17 (Simon): the live schema must not be P; that would be data loss for trainers in
production.** Checked the same day (Claude), from the code:

- `DEFAULT_READ_SCHEMA` is `"P"` ([recordSchemas.js](src/data/recordSchemas.js), since 93e2b1d,
  2026-08-10) and `CURRENT_SCHEMA_VERSION` is `"P"` ([migrationSteps.js](src/data/migrationSteps.js)).
  An install reads P unless its trainer chose another schema ([readSchema.js](src/data/readSchema.js)),
  and its data is stamped P.
- On the first boot of every new build, `rebuildPreviewSchemaIfBuildChanged` copies every `schema4`
  record over the P store. Its comments say P is discarded; `backfillSchema` only puts and never
  clears, so what exists only in P stays.
- **What exists only in P** (measured in Node against `SCHEMA_4` and `SCHEMA_P`): the sessions'
  fields `startDate`, `seriesId`, `occurrenceDate` and `cancelled`, and two whole collections,
  `invites` and `sessionSeries` — invitations and the rules of repeating sessions. All are used by
  live features.
- **The four fields are safe today only by accident**: the star write copies every field into
  `schema4`, undeclared ones included (§58), so the copy over P brings them back. **The two
  collections are in the P store alone**: the star write writes a collection only where its schema
  declares it, and no backup carries them.

**Ruled 2026-09-17 (Simon): schema 4 is the live schema; P is discarded at every migration.** Also
ruled: swallow the inconsistency — nothing held in 4 may be lost or thrown away.

**What that settles, and what it does not (Claude):**

- **The four fields: settled.** They are already in `schema4` and in every recent backup; declaring
  them in `SCHEMA_4` makes the schema say what the data holds, as `alias` did (§60).
- **The two collections: not settled.** Pointing reads at 4 today would show no invitations and no
  repeating sessions — the rules sit only in the P store, which is then discarded. They must be
  declared in `SCHEMA_4` AND copied from the P store into `schema4` once, before reads move.
- **The stamp: not a problem on a phone — corrected the same day.** An IndexedDB install stores no
  schema version: once its data is imported, boot runs no migration and sets the version in memory
  (`loadSavedState` in [stateStore.js](src/data/stateStore.js)). Only the `localStorage` fallback and
  a backup's `runtimeSchema` carry "P". The earlier claim that installs are stamped "P" and would be
  refused was wrong.

**Ruled 2026-09-17 (Simon), from schema 5 on: the P database is thrown away whenever a test run
ends and whenever the app starts, and the app switches to the active database.** P is only ever a
temporary demo or test. Open with it (Claude): a demo that must survive a reload then cannot live in
P — the sandbox workspace (§40) is already a separate database for sample data, so whether a demo
needs P at all is the question; and nothing in the app offers a trainer the choice to read P today
(only a test sets `librept_read_schema`), which keeps that true only while nobody adds such a choice.

**Ruled 2026-09-17 (Simon), the order:**

1. Schema 4 takes the four session fields and the two collections, `invites` and `sessionSeries` —
   the inconsistency is accepted.
2. **A migration step P → 4** brings the records that exist only in the P store into `schema4`.
   On a phone this cannot be a step of `migrateState`, which does not run on an IndexedDB boot; it is
   a one-time store copy at boot, marked done in the meta store, like the backfill.
3. Then the preview schema is renamed **PREVIEW**.
4. **PREVIEW is never a step in the migration chain.** It is newer than 4 but a dead branch:
   4 → PREVIEW → 5 must not exist; the chain runs 4 → 5.

Tested from a frozen device database of a P-era install holding a repeating session, a cancelled
evening and an invitation (§63), made from today's code before any of this changes.

**Steps 1 and 2 done 2026-09-17** — schema 4 declares the fields and both collections, and
[previewTransfer.js](src/data/previewTransfer.js) moves what only the P store holds, once, at boot.
**Also ruled with them (Simon): P is not an alias of PREVIEW** — P is the legacy preview store data
is moved out of; PREVIEW is the future CI and preview schema; the two mean different things.
**Schema 4 made active 2026-09-17:** `DEFAULT_READ_SCHEMA` and `CURRENT_SCHEMA_VERSION` are 4; a stored
"P" ranks as 4. Replaced by the PREVIEW schema below on 2026-09-18.

**Ruled 2026-09-17 (Simon): PREVIEW uses the same solution as a released schema** — a store in the
main database, provisioned and written like schema 4 and 5 and 6 will be. Done 2026-09-18:

- **The database version stopped being a schema number** ([indexedDb.js](src/data/indexedDb.js)). It
  was the highest numbered live schema, which could not provision a store for a schema named PREVIEW
  and would have LOWERED the version the day a preview was retired; IndexedDB then refuses to open the
  database at all. The database now opens at whatever version it holds and is reopened one version
  higher only when a store is missing.
- **`SCHEMA_PREVIEW` replaces `SCHEMA_P`** in the live schemas, with one collection only it declares,
  `previewProbe`, so staging is exercised by the real schemas: a record of it reaches the PREVIEW store
  alone, a backup leaves it out, and a restore names it as lost. No screen writes one.
- **Preview data is refused by what it is**, before any rank comparison (`isPreviewVersion`), which is
  the test §63 asked for.
- The P store is no longer written. It stays on disk, and [previewTransfer.js](src/data/previewTransfer.js)
  still reads it once on an install that has one.

**Done 2026-09-18: the PREVIEW store is emptied when the build changes**, and refilled from schema 4
only where it is read — at activation (`setReadSchema`) or for an install already on it. Emptying at
every start was written first, on the earlier ruling, and Simon changed it the same day: a preview
session spans reloads, and CI's second pass reads the store on every navigation, so an empty store at
each start left it reading nothing. Filling it for an install that never asks would cost a projection
pass on every boot — 22ms for the demo set, about 400ms at 3,000 records.

**Still open:** the second browser-test pass that reads PREVIEW (§62), and discarding preview data at
the end of a test run.

## 58. [x] A record is written whole, so a field cannot be staged at all — merged 2026-09-30

**Merged 2026-09-30 into: 71. [ ] Nothing detects when the code stops supporting a live schema with the right data**

**[x] First step shipped 2026-09-23 (§45.5 needed it):** a store no longer receives a field only a
newer live schema declares — schema 4's store never holds `exercises.source` — and a field the schema
being read cannot see is carried over from the row a store already holds, so a save made while
reading an older schema (the toggle §76 builds) cannot wipe it (`narrowToSchema`, `fieldsHiddenFrom`
in [recordSchemas.js](src/data/recordSchemas.js)). A field no live schema declares is still written
whole. **Still open:** renames and retypes — §71's per-schema projector.

**By design a backup is made at schema 4, the newest numbered one, never at P** (Simon,
2026-09-17), so a field that exists only in P is not in it. The preview database is used only for
testing and demonstrations, never live for a client. [backupFile.js](src/data/backupFile.js) leaves out only the
COLLECTIONS schema 4 does not declare; each record is copied whole through `projectCollection`,
which keeps every field.

**Measured 2026-09-17 (Claude)** with `buildBackupPayload` in Node: a session holding `seriesId`,
`occurrenceDate` and `cancelled` — fields schema 4 does not declare — came out in a file stamped
`schemaVersion: 4` with all three. The star write does the same to the `schema4` store, so
`rebuildPreviewSchemaIfBuildChanged` in [readSchema.js](src/data/readSchema.js) does not lose them
either, although its comment says it does.

**Re-measured 2026-09-21 (Claude): those three instances are gone, and the mechanism is not.** §61
declared all three fields in schema 4 on 09-17, and `SCHEMA_PREVIEW` today is `SCHEMA_4` plus one
collection (`previewProbe`) and a stricter `required` on `startDate` — it adds no field at all. So
the defect has zero instances and no test holds it at zero. The way it reached zero is exactly what
§60 was about: the fix for "a preview field leaks into the schema 4 file" was to widen schema 4.

The mechanism: `projectSession` is `{ ...session, collection }` — the whole domain object. Staging
is enforced per **collection** only (`schemaAcceptsCollection`); nothing anywhere compares a
record's fields against the shape it is being written at. `undeclaredFields` exists in
[recordSchemas.js](src/data/recordSchemas.js) and no live code calls it.

**What §60's ruling (2026-09-21) changes here.** Numbered shapes are frozen, so a new field can no
longer be absorbed into schema 4 — it is staged in `SCHEMA_PREVIEW` until it mints a number. That
makes field-level staging necessary rather than hypothetical, and the earlier warning above ("do not
fix this before §61 is settled") has expired with §61.

**The obstacle, found 2026-09-21 and not yet solved.** §62's guard
([conftest.py](tests/conftest.py), `UNDECLARED_STORED_FIELDS`) reads each store and fails the test
when a row carries a field that store's schema does not declare. A field staged in PREVIEW alone is
therefore written into the `schema4` store by the fan-out and **fails that guard immediately** — so
today field staging is not merely leaky, it is impossible.

Trimming a record to its target schema's declared fields fixes both, but it also blinds §62's
guard: after trimming, the store can never hold an undeclared field, so the check can never fire,
and a feature writing ahead of **every** schema would be silently dropped instead of reported.

**Proposed (Claude), not ruled** — three parts, and the middle one is the price:

1. `projectCollection` takes the target schema and trims the record to the fields it declares.
2. **Trim on write only, never on read.** `fieldIssues` and `groupRecordsByCollection` accept
   unknown fields and collections on purpose, so an older build survives a newer file; trimming
   there would destroy that.
3. §62's guard moves from the store to the write path: a field declared by **no** live schema is
   still an error and must still fail the build.

Blocks: nothing now — §50.3's record badges are unblocked by §60 and go into `SCHEMA_PREVIEW`. What
this blocks is the first field that actually stages there reaching a trainer's backup correctly.

### 58.1 [ ] Removing a field is not expressible, and trimming alone does not make it so

Asked 2026-09-21 (Simon): how does the star write handle schema 5 removing a field while schema 4,
still live, has to go on writing it? Read from the code the same day (Claude):

**It cannot be expressed today.** `starWrite` in [stateStore.js](src/data/stateStore.js) projects
once, OUTSIDE the loop over schemas — `const projected = projectCollection(collection, record)`,
then the same object is `put` into every target store. A schema decides only **whether** a record
reaches a store, by collection; never **what shape** it arrives in.

**The model forbids the case rather than answering it.** `docs/DATA_MODEL.md`'s star-write
invariants say schema changes are expand-first, so no projection is ever lossy, and
[starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs) asserts that no
field is dropped between live schemas. So a field is removable only once every schema declaring it
has been RETIRED — which is exactly the deliberate decision §60 introduced. §60's retirement clause
is therefore the mechanism for removal, and nothing else is.

**Trimming (above) does not by itself allow removal while both are live.** The star projects from
the live domain object, so a field the app has stopped maintaining cannot be invented for schema 4's
store. "Schema 5 removes the field" means *schema 5 stops storing it*, not *the app stops producing
it*: while schema 4 is live and declares it, the app must keep producing a field none of its own
code uses. That cost is why expand-first exists, and it should be stated before anyone plans a
removal.

**One direction is unguarded.** §62's store guard uses `undeclaredFields`, which finds EXTRA fields,
not missing required ones — so an app that stopped producing a field schema 4 requires would not be
caught there. It is caught one level up, by `every live writer shape validates against every live
schema` in the same test file, which checks the write path's literals against every live schema.
Worth knowing which check actually holds this, because the obvious one does not.

**Proposed with it (Simon), not ruled: write the preview schema as `PREVIEW` instead of `P`**, so the
stored value says what it is. Found against it (Claude): `P` is stored, not only named — in every
preview database's `schemaVersion`, in the `schemaP` store name, and in a backup's `runtimeSchema` —
and the demonstration installs hold it. The migration runner treats an
unrecognised version as below the floor and replays the chain from 1, which re-asks the language
question (step 3 → 4), so "PREVIEW" must be taught to rank exactly as "P". P also stops existing the
day schema 5 is minted.

### [x] 76.1 Three identities, kept apart — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Built: app version id and schema per entry in src/data/appVersions.js; commit SHA unchanged (BUILD_INFO.commit). The three identities are restated in one line of the compressed §76 body.**

- **App version** — what the trainer chooses. A name and a date, for example *2026-10*, with one
  sentence on what it changes. New to this design.
- **Schema** — the shape of the stored data. Each app version names the schema its behaviour
  writes; several versions may name the same one. **Every install READS the newest numbered schema,
  whatever version runs** (§76.4).
- **Commit SHA** — which code is running, for support. Unchanged.

### [x] 76.2 One registry of app versions — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Built 2026-09-23: src/data/appVersions.js; tests/unit_js/data/appVersions.test.mjs:48 (one default), :55 (live schemas vs versions), :70 (every behaviour asked for is declared), :86 (no behaviour on in every version).**

One file under `src/data/` lists every supported app version: its id, the schema it reads, its
status, the text key of its one-sentence description, and the behaviours it turns on. The status is
one of:

- `default` — what a new install runs. Exactly one version has it.
- `supported` — offered to the trainer, older or newer than the default. A newer one shows the
  `BETA` tier of §18.12's ribbon, which that section already reserves for "an in-app behaviour
  opt-in".
- `preview` — CI and demonstrations only, never offered (§61's ruling). It reads PREVIEW.

**`LIVE_SCHEMAS` is checked against the registry, not derived from it** (built 2026-09-23, Claude):
`appVersions.test.mjs` fails the build when a numbered live schema is named by no version, or a
version names a schema that is not live. Deriving it would have made recordSchemas.js import the
registry for one line; the check gives the same guarantee without that dependency.

**Feature code asks for a behaviour by name, never for a version number.** It asks, for example,
whether circuits are offered when a plan is built, and never whether the version is at least
2026-10. A comparison of versions spreads through every file that branches. A named behaviour lives
in one registry entry, and a check fails the build when a behaviour named in the code is declared by
no version, or is turned on in every supported version (its branch is then dead and must be removed).

### [x] 76.3 What the trainer sees, and what happens when they switch — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Built: src/modules/common/appVersionDialog.js:7,47-66 (list of versions, refused while a session runs, reload). Its one unbuilt point, the sentence naming what the chosen version cannot show, is carried by §76.6.**

- In the ☰ menu ([applicationHeader.js](src/modules/common/applicationHeader.js)), beside *My
  details*: **App version**, which opens a list of the supported versions with the running one
  marked and each one's sentence.
- **Before the switch, one sentence says what the chosen version cannot show, and how many records
  that is** — for example, that it has no circuits, that the trainer has three, and that they are
  kept but not shown while that version runs. This is the production check §71.2 already earned.
  The sentence is shown only when the number is not zero.
- **The switch is refused while a session is running**, with the reason on the screen. This follows
  §18.12's rule that nothing blocks a trainer who has a client in front of them.
- The switch stores the chosen version and **reloads the page**, so every screen is built again
  under the new behaviour. It does not change which store is read. The build is already in the
  service worker's cache, so the reload also works offline.
- The choice belongs to the device, like the theme, and is kept in `localStorage`.

### [x] 76.5 What each supported version costs — merged 2026-09-30

**Merged 2026-09-30 into: 76.6 The first use: schema 5 for §45.5**

- **One browser-test pass per supported version**, the way §62 adds one for PREVIEW. The last full
  gate run took 341 seconds (`.build-reports/last-run.json`). How much of that the browser tests take
  was not measured, so the cost of a second pass is not stated here.
- **Every behaviour branch stays in the code** until the last version that needs it is retired.
- **One more star-write store** for each new schema, as `docs/DATA_MODEL.md` already counts it.

**Proposed: at most two numbered versions are supported at once**, plus PREVIEW — the default and
one other. Two versions give the trainer both a way back and a way forward, while each further
version adds a browser-test pass and one more branch in every feature that differs.

### 80.1 [x] Prva stranka in prvi individualni trening — v teku — superseded 2026-09-30

**Superseded 2026-09-30 in the TODO clean-up: The rejected 'TEST' observation is §66 working as designed (verdict in the body). Its real residue — a surname that is also a gym name — is carried by §83 point 'pravilo ne pozna naključja'. The untested half of the scenario (run, log, finish) was tried 2026-09-30 on main 12d0e66: §80.6 'Odgovor 2026-09-30' and §80.52 'Dokaz 2026-09-30'.**

**Scenarij:** trener prvič odpre aplikacijo in brez navodil poskuša dodati izmišljeno
stranko »TEST Ana Novak«, njen cilj »redno trenirati dvakrat tedensko« ter pripraviti
45-minutni trening s tremi vajami. Nato želi trening začeti, zapisati dejanske serije,
ponovitve in obremenitve, popraviti napačen vnos ter trening zaključiti. Imena gumbov
in poti se določijo šele iz vidnega vmesnika. Uporabiti ločene testne podatke.

**Preverjeno doslej:** shranjen trener »TEST Trener« z naslovom
`trener@example.invalid`; prek menija in imenika dodana »TEST Ana Novak« z naslovom
`ana@example.invalid`, ciljem in opombo. Brez označene privolitve profil jasno pove
»Brez privolitve (samo lokalno)«. »Načrtuj program« ohrani izbrano stranko.
Termin »Uvodna vadba«, kraj »Telovadnica Center«, 10:00–10:45; iz kataloga dodan
»Dumbbell Goblet Squat« 3 × 10 × 8 kg, »Single-Arm Dumbbell Row« 3 × 10 × 6 kg
in »Plank« 3 × 30s. Pri vsaki vaji so shranjene opombe s simuliranimi dejanskimi
serijami; pri počepu tudi »Pretežko«. Po ponovnem odprtju je program še nenačrtovan.
Naslednji korak je ustvariti termin prek »Ustvari trening« in preveriti izvedbo v njem.

**Opažanje za nadaljnji preizkus:** ime »TEST Ana — prvi trening« in kraj
»TEST Telovadnica« sta zavrnjena zaradi besede »TEST« v imenu stranke. Po popravku
na zgornji nevtralni imeni shranjevanje uspe. Preveriti še običajno ime kraja, ki se
naključno ujema z imenom stranke; umetni testni prefiks sam ne dokazuje te napake.

**Verdikt 2026-09-26 (Claude): opažanje zavrnjeno — to ni napaka, ampak §66, ki deluje, kot je
bilo odločeno.** §66 (odločeno 2026-09-18) prepoveduje ime stranke v imenu ali kraju treninga,
ker se besedila po izbrisu stranke ne da več očistiti: takrat ime ni več znano (§65). Zavrnjeno
je ob shranjevanju in ne pobrisano pozneje, prav zato.
[clientNameWords.js](src/domain/clientNameWords.js) razbije ime vsake stranke na besede in
blokira vsako, dolgo `SHORTEST_BLOCKED_WORD` = 3 znake ali več. Stranka »TEST Ana Novak« torej
prepove besedo »TEST« v imenu termina in v kraju. Sporočilo napake besedo krepko citira nazaj,
da trener vidi, kateri del svojega naslova je sporen, in obroba pokaže, katero polje.

**Ostanek, ki je resničen in ni sprememba:** pravi priimek je lahko tudi ime telovadnice.
Stranka »Ana Novak« naredi besedo »Novak« neuporabno v kraju, torej trener ne more vpisati
»Telovadnica Novak«. To je cena, ki jo §66 zavestno plača, in sprememba tega je Simonova
odločitev, ne popravek. Zapisano tu, ker ga je Codexov preizkus pokazal, čeprav z umetnim
imenom.

**Scenarij sam ostaja nedokončan:** izvedba treninga, vpis serij in ponovitev, popravek
napačnega vnosa in zaključek niso bili preizkušeni.

### 80.11 [x] P2 — Števec sinhronizacije v glavi je brez besed in samo v angleščini — merged 2026-09-30

**Merged 2026-09-30 into: 80.86 [~] P2 — Značka v glavi piše »7?« in nikjer na zaslonu ni povedano, kaj šteje**

**Scenarij in koraki:** trener prvič odpre objavljeno aplikacijo v slovenščini, ne poveže
nobene shrambe v oblaku in pogleda glavo zaslona.

**Opaženo:** desno od imena in oznake različice stojita puščica gor z »0« in puščica dol z
»?«. Nikjer ni besede, ki bi povedala, kaj šteje. Edina razlaga je bralniku zaslona
namenjen `aria-label`, ki se glasi »0 local changes to push, cloud status unknown« — v
angleščini, čeprav stran pravi `lang="sl"`.

**Težava in vpliv:** trener vidi vprašaj v glavi in ne ve, ali kaj ni v redu z njegovimi
podatki. Pomen je samo v nevidnem besedilu, kar projektno pravilo prepoveduje, in to
besedilo je v tujem jeziku. Znak »?« brez razlage vzbuja skrb pri uporabniku, ki oblaka
sploh ni priklopil.

**Natančneje, izmerjeno v brskalniku:** gumb sam (`#backup-btn`) ima slovenski opis
»Središče za sinhronizacijo in varnostne kopije — Sinhronizacija v oblak ni povezana«, znotraj
njega pa je števec (`span.sync-badge`) z angleškim opisom »4 local changes to push, cloud
status unknown«. Slovenščina in angleščina sta torej v istem gumbu, ena v drugi. Število
narašča ob delu — po prvem shranjenem treningu je bilo 4 — in trener nikjer ne izve, kaj šteje.
Nad devet se številka umakne klicaju: v glavi piše »↑!«, kar je videti kot opozorilo na napako,
pomeni pa samo, da je sprememb veliko.

**Predlog in preverjanje:** ko oblak ni nastavljen, števca ne kazati; ko je, mu dati vidno
besedo ali ga odpreti v okno s stanjem. `aria-label` sestaviti prek `t(...)` s ključi v
`en`, `sl` in `de`. Preverjeno na objavljeni različici `0625bd6`; koda na `main` je ista —
[applicationHeader.js](src/modules/common/applicationHeader.js), funkcija, ki sestavi
`sync-badge`, vpisuje oba angleška stavka dobesedno.

**Delno popravljeno 2026-09-27, commit `22b79bf`:** opis za bralnik zaslona je v izbranem jeziku,
s pravilnimi števili. **Odprto, čaka na Simona:** ali števca brez povezanega oblaka skriti. To bi
spremenilo odločitev z dne 2026-08-18, da števca ostaneta vidna in siva.

### 80.91 [x] P1 — Sprememba teže v načrtu prihodnjega treninga po osvežitvi izgine brez besede — merged 2026-09-30

**Merged 2026-09-30 into: 80.52 [ ] P1 — Spremembe načrta nezačetega treninga izginejo, ko trening odpreš znova s kartice**

**Scenarij in koraki:** odpri podlogo prihodnjega treninga (»Ponedeljkova moc«, 2026-10-05, 09:00 -
10:00, stranka Jane Doe, rutina »Zgornji del A«). Tapni ⋮ »Možnosti treninga« → »Uredi načrt«. Pri
vaji Barbell Bench Press popravi težo z 62.5 na 90 in tapni »Končano z urejanjem načrta«. Nato osveži
stran in trening odpri znova s kartice.

**Opaženo:** takoj po zaprtju urejevalnika podloga pravi »Barbell Bench Press · 5 · 90 kg«. Po
osvežitvi pravi »5 · 62.5 kg«. Nobenega opozorila ni bilo, ne pri zapiranju urejevalnika ne po
osvežitvi. V shrambi ni nikjer zapisa s to težo — ne med `sessions`, ne med `planUpdates`.

**Težava in vpliv:** trener za mizo pripravi obremenitve za naslednji teden. Ko naslednjič odpre
telefon, so nazaj stare številke, in tega ne izve: podloga po urejanju kaže novo težo, torej ni
razloga za dvom. Delo, ki ga je opravil, je izgubljeno tiho.

**Predlog:** »Končano z urejanjem načrta« naj spremembo zapiše, in dokler ni zapisana, naj podloga ne
kaže nove številke — opaženo na različici `8b2ce80`.

**Presoja 2026-09-30 (Claude):** isti vzrok kot §80.52. Načrt treninga, ki se še ni začel, živi samo
v predpomnilniku odprte podloge (`librept_active_session`), ne pri treningu; ob novi gradnji podloge
ali osvežitvi se vrne načrt iz rutine. Popravek, ki drži, shrani načrt pri treningu samem — to je
sprememba sheme, o kateri odloča Simon (§80.52). Do takrat ostane odprto.

### 92.6 [x] Leaving a session by the peek throws away what was logged in it — merged 2026-09-30

**Merged 2026-09-30 into: 95.1 [ ] §92.6 is this section's subordinate case, not its own task**

**Found 2026-09-30, the same way.** The walkthrough logged Too Easy on the first participant, then
pulled aside to the previous session and came back with Today. The signal was gone — the control
no longer showed it set, so a trainer would tap it again and a second tap CLEARS it.

The guard that exists (`canOpen` in `controllers/planPeekController.js`) refuses to leave a session
that has been STARTED, to protect a running session's logs. A session that has not been started but
already carries feedback is not protected at all, although the trainer typed into it just as much.
On the gym floor the plan is open and being marked up long before anyone taps Start.

Two ways out, and the choice is Simon's: widen the guard to any session carrying logs or feedback,
or keep what was logged when the clipboard is replaced. The second is the better product and the
larger change.

For now the walkthrough works around it by placing the gesture BEFORE anything is logged, which is
also the better story — you check what they did last time, then you work — but it is a workaround
and this is why.

## 93. [x] The exploratory-test skill is Claude's alone, and the agent that needed it could not see it — archived 2026-09-30

**Archived 2026-09-30 in the TODO clean-up: Both subsections shipped: b29777e ('move the exploratory-test skill where every agent reads it'), 02d0422 ('§93 shipped; what the move turned up is in the archive'). .agents/skills/exploratory-test/ exists and is tracked; .claude/skills/exploratory-test/SKILL.md is a symlink to it; explore.py:66 writes .private/AGENT_SYNC/exploratory-browser.md. TODO_ARCHIVE.md already holds 93.1/93.2 reasoning; the parent's body (the 3.5-hour browser story) moves with them.**

Ruled by Simon 2026-09-30: **the skill must be shared by every agent.** It lives in
`.claude/skills/exploratory-test/`, and `.claude/` is in `.gitignore` — so Codex and Gemini cannot
see it, cannot run it, and cannot read what it already knows.

**What that cost, today, measured.** A headless Chromium ran from 09:16 to 12:47, holding about 95 %
of one core for three and a half hours, and blocked every `build check` on this machine until
`ed041fd` changed how the gate measures load. It was not this skill's browser: port 9223, profile
`/tmp/librept-trainer-cdp-profile`, launched by a Codex session started 2026-09-29 23:45 (its own
rollout log names both). Its parent was `systemd --user`, so nothing owned it and nothing would ever
have stopped it. The skill it could not see already solves exactly this: `explore.py` touches a
heartbeat on every command and a detached watchdog closes the browser after 15 minutes without one,
with a comment recording the same failure happening once before.

**Two separate defects, then.** The skill is in the wrong place, and a browser held by a living
session is recorded nowhere, so nobody arriving later can tell a browser that still has a keeper
from one that does not.

### 93.1 [x] Move the skill where every agent reads — done 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md).

### 93.2 [x] A live browser says who holds it, and until when — done 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md).

### 80.137 [x] P2 — Stranka z angleškim »Jezik obrazca« dobi slovensko vabilo in slovensko stran za odgovor — popravljeno 2026-09-30

**Stanje 2026-09-30 (librept-02):** vabilo na trening je v jeziku obrazca stranke: e-pošta, SMS in
stran za odgovor (`dcc2cae`). **Odprto:** »Povabi stranko« (spodaj, dodano 19:11). Nova stranka
jezika obrazca še nima, zato ga okno ne more prebrati; potrebuje izbiro jezika v oknu.

**Scenarij in koraki:** stranka Emily Stone, e-pošta vpisana, »Uredi profil« → privolitev →
»Jezik obrazca: English« → »Shrani«. Nato trening »Moč« za jutri z Emily, »Shrani«, v oknu »Pošlji
vabila v koledar« pogledati povezavo »Pošlji vabilo«.

**Opaženo:** »Pošlji obrazec za privolitev« pripravi angleško sporočilo (»Hi Emily Stone, To prepare
our workout schedules …«). »Pošlji vabilo« pa slovensko: zadeva »Trening: Moč«, besedilo
»Pozdravljen/a Emily Stone, Tvoj trening: Moč … Sporoči mi, ali lahko prideš:« in povezava z
`?lang=sl`. Zaprta §80.50 (`86aefd7`) je v povezavo dodala jezik, v katerem je vabilo napisano, to je
trenerjev. Trenerka dneva 08 (stranka govori le angleško): »Emily dobi vabilo v slovenščini.«

**Težava in vpliv:** stranka, ki slovensko ne bere, vabila ne razume, stran za odgovor pa je tudi
slovenska. Trener mora vsako vabilo prevesti na roke ali ga ne pošlje.

**Predlog:** vabilo in povezava naj uporabita jezik, ki ga ima stranka zapisan (»Jezik obrazca«),
kot ga že obrazec za privolitev. Opaženo na `main` `e8e90d8`, sl, 390 × 844.

Enako pri »Povabi stranko« (`main` `e2daf5e`): okno nima izbire jezika stranke; za
`emily@primer.invalid` pripravi slovensko sporočilo (»Tvoji podatki za najin trening … Vzame minuto«),
povezavo `intake?lang=sl` in slovensko obvestilo o zasebnosti (`privacy-notice-sl.html`). Stran za
prijavo sama ponudi »English«, »Slovenščina«, »Deutsch«, a do nje stranka pride prek slovenskega
sporočila.

### 80.127 [x] P1 — Datum, vpisan po slovensko »6.10.2026«, se tiho shrani kot 6102-02-06 — popravljeno 2026-09-30

**Scenarij in koraki:** »Ustvari trening«, tapniti polje »DATUM« in vpisati »6.10.2026«, kot se datum
piše v Sloveniji. Zapustiti polje, dodati stranko Maja Kranjc, »Shrani«.

**Opaženo:** polje pokaže »6102-02-06«. Opozorila ni, polje ni označeno kot napačno. Po »Shrani« se
odpre okno z vabili, nato seznam na naslovu `/sessions/6102-02-06`: trening je shranjen v leto 6102.
Za primerjavo: »20261006« da pravilno 2026-10-06. Polje ima številsko tipkovnico
(`inputmode=numeric`); na mnogih telefonih ta nima vezaja, pika pa je na njej.

**Težava in vpliv:** trener vpiše termin za naslednji torek po navadi, ki jo ima, in trening izgine
s seznama tega tedna. Stranka pride, trener pa termina nima. Vabilo v koledar bi stranki poslalo
datum 6102.

**Predlog:** polje naj sprejme »6.10.2026« in »6. 10.« kot 2026-10-06, ali pa vnos zavrne in pove,
kako se piše. Nikoli naj ne shrani drugega datuma brez besede (isto načelo kot zaprta §80.59).
Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.128 [x] P2 — Prazna slovenska aplikacija predlaga angleška imena treningov in krajev — popravljeno 2026-09-30

**Scenarij in koraki:** svež brskalnik, `?lang=sl`, »Začni s prazno aplikacijo« (vzorčni podatki
nikoli naloženi). Trener vpiše treninga »Moč« in »Moč A« in kraj »Studio«. Nato »Ustvari trening« in
dotik polja »Izberi ali vpiši ime treninga ...«.

**Opaženo:** seznam predlogov imena: »Morning Strength«, »Hypertrophy Upper«, »Full Body
Conditioning«, »Cardio & Core«, »Athletic Performance«, »Mobility & Recovery«, »Lower Body Power«,
»Personal Training 1-on-1«, šele nato »Moč« in »Moč A«. Predlogi kraja: »Trib gym base«,
»playground outside«, »city park«, »Studio A«, »Main Gym Floor«, »Client Home Studio«, nato
»Studio«. Zaprta §46.4 je prevedla vzorčne podatke; tu vzorca ni, besede so vseeno tam.

**Težava in vpliv:** trener v slovenski aplikaciji dobi osem angleških imen pred svojim. Svoj
»Moč« najde na devetem mestu. Kraja »Trib gym base« in »city park« nista njegova in ga zmedeta,
ali je aplikacija pomešala njegove podatke s tujimi.

**Predlog:** v prazni aplikaciji naj predlogi vsebujejo le imena in kraje, ki jih je trener že
vpisal; ali pa naj bodo vzorčni predlogi v jeziku aplikacije in za trenerjevimi. Opaženo na `main`
`12d0e66`, 390 × 844.

### 80.130 [x] P2 — Vsaka stranka, dodana na trening, samodejno dobi prvo rutino v knjižnici — popravljeno 2026-09-30

**Scenarij in koraki:** v knjižnici je ena rutina, »Moč A« (Dumbbell Goblet Squat 12 kg, Dumbbell
Bench Press 30 kg, Barbell Row 25 kg). »Ustvari trening«, dodati obstoječo stranko Ana Zupan in novo
stranko »Nova Oseba« prek »Dodaj »Nova Oseba« kot novo stranko«. Rutine ne izbrati.

**Opaženo:** izbirnik rutine pri obeh kaže »Moč A«, ne »Izberi rutino« ali »Prazen načrt, brez
rutine«. Skupina treh novih strank (»Skupina«, jutri) je shranjena s »Moč A« na kartici, čeprav je
trener ni izbral. Pred prvo rutino je izbirnik kazal »Prazen načrt, brez rutine«.

**Težava in vpliv:** nova stranka, o kateri trener še ne ve ničesar, dobi program z utežmi, ki ga je
sestavil za nekoga drugega. Če tega ne opazi v vrstici pod imenom, je program na podlogi. Popravek
`0caf9b5` je ista stvar odpravil pri odpiranju (»a programme nobody chose«); obrazec jo zdaj naredi
pri vpisu.

**Predlog:** izbirnik naj ostane »Prazen načrt, brez rutine«, dokler trener ne izbere; ali naj
predlaga rutino, ki jo je ta stranka imela zadnjič. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.131 [x] P2 — Takoj po zaključku treninga predal pravi »Vse je pregledano«, signal se pokaže šele po osvežitvi — popravljeno 2026-09-30

**Scenarij in koraki:** trening »Moč« (rutina »Moč A«) za Maja Kranjc. »Začni trening«, tapniti prvo
vajo, »Pretežko«, »Zaključi vadbo« → »Zaključi zdaj« → »Zaključi zdaj«. Pogledati predal z
obvestili. Nato osvežiti stran.

**Opaženo:** po zaključku predal: »Obvestila in pregled stanja«, »Vse je pregledano — trenutno tukaj
ni ničesar.« Po osvežitvi: »Treningi, ki čakajo na pregled«, »1 stranka ima nerešene povratne
signale iz treninga.«, »Maja Kranjc — Moč (1)«. Enako že prej s hitrim »Prelahko« pri SIM Nina
Koleno (treninga »Rehabilitacija«). Signal, dan z »Opombe« → »Zapiši opozorilo«, pa se pokaže takoj.

**Težava in vpliv:** trener po treningu pogleda, ali mora kaj popraviti v programu, in prebere, da
ne. Signal »Pretežko« ostane nerešen, naslednji trening ima enako težo.

**Predlog:** predal naj se po zaključku osveži, kot se je seznam treningov v zaprti §80.107.
Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.135 [x] P2 — Trening, ki teče, se brez vprašanja prestavi na drug dan; tam ostane »Zaključeno« — popravljeno 2026-09-30

**Scenarij in koraki:** trening »Jutranja« danes (2026-09-30) za Emily Stone, rutina »Tri vaje«.
»Začni trening«. Na seznamu svinčnik »Uredi« na kartici, čip »pet. 2.«, »Shrani«. Nato trening
zaključiti in odpreti seznam za 2026-10-02 ter stran stranke.

**Opaženo:** shranjevanje ne vpraša ničesar. Na petku 2026-10-02 stoji »Aktiven trening 01h 06m«,
spodnja vrstica šteje naprej (»1:06:51«), na sredi treninga ni več. Po zaključku ima petek »Zaključeno
00:01«, zgodovina stranke pa »2026-09-30«. Trenerka dneva 08 je trening prestavila, ker je mislila, da
prestavlja termin, ki se še ni zgodil: »Aplikacija ni vprašala, ali premik velja za začet trening.«

**Težava in vpliv:** petkov termin je zaseden s treningom, ki je bil v sredo; urnik za petek laže, v
sredo pa ni zapisa, da je trening bil. Če je trener hotel prestaviti naslednji termin, ta ostane
nedotaknjen.

**Predlog:** pri treningu, ki teče ali je končan, naj »Uredi« datum ne ponudi ali naj vpraša, ali gre
za drug termin. Opaženo na `main` `e8e90d8`, sl, 390 × 844; najprej opazila trenerka dneva 08.

### 80.138 [x] P1 — Konec serije, vpisan pri današnjem večeru, podvoji današnji večer in serije ne konča — popravljeno 2026-09-30

**Scenarij in koraki:** tedenska serija »Hipertrofija« ob sredah ob 07:00 od danes (2026-09-30) za
Petro Zupan. Večer 7. 10. odpreti s svinčnikom »Uredi« in »Shrani« (nič spremenjeno). Nato današnji
večer »Uredi«: obkljukati »Spremeni vse večere tega treninga«, nato »Ponovi vsak teden« (pri večeru
serije je prikazan neobkljukan), v »DO (NEOBVEZNO)« vpisati 20261006, »Shrani«.

**Opaženo:** na seznamu je današnji večer dvakrat, obe kartici »07:00 - 08:00 Hipertrofija … Zamuja«
(eden je shranjen zapis, drugi večer serije `…@2026-09-30`). Serija teče dalje: 7., 14., 21. 10. in
naprej. Po »Izbriši trening« pri eni od kartic (okno: »Izbriše se samo ta večer, ostali ostanejo«)
izgineta obe; današnjega treninga ni več. Trener dneva 09 je hotel ustaviti serijo za dva tedna
stranke na dopustu.

**Težava in vpliv:** trener misli, da je serijo končal, termini pa se še naprej pojavljajo; na
današnji dan ima dva enaka termina, in ko enega izbriše, izgubi oba. Stranka na dopustu ostane v
urniku.

**Predlog:** »Do« pri »Spremeni vse večere« naj serijo konča na tem dnevu in ne ustvari novega večera;
izbris enega večera naj pusti drugi. Pri večeru serije naj bo »Ponovi vsak teden« prikazan kot
obkljukan. Opaženo na `main` `e2daf5e`, sl, 390 × 844; najprej opazil trener dneva 09.

### 80.139 [x] P3 — V »Ustvari rutino« gumb »Dodaj vajo« skrije izbirnik vaj, ki je že odprt — popravljeno 2026-09-30

**Scenarij in koraki:** ☰ → »Vaje in rutine« → »Rutine« → »Ustvari rutino«. Pritisniti »Dodaj vajo«,
nato še enkrat.

**Opaženo:** ob odprtju okna je izbirnik vaj že odprt (»Išči vaje«, filtri, 48 vaj). Prvi dotik na
»Dodaj vajo« ga zapre, drugi odpre. Trener dneva 09: »tapni "Dodaj vajo" (izbirnik se ne odpre),
tapni še enkrat (odpre se)«.

**Težava in vpliv:** gumb, ki pravi »dodaj«, prvič skrije seznam, iz katerega se dodaja. Trener
misli, da gumb ne deluje.

**Predlog:** ko je izbirnik odprt, naj gumb pravi, kaj naredi (na primer »Skrij seznam vaj«), ali naj
izbirnik ostane odprt. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.10 [x] P1 — Po zaključku aktivnega treninga se testni zavihek ne odziva — popravljeno 2026-09-30

**Scenarij:** prek »Ustvari trening« ustvariti »Individualna vadba« za Ano, dodati
počep 3 × 10 × 8 kg, začeti trening, sprejeti ponujeni premik na dejanski čas,
v »Opombe« izrecno izbrati »Too Hard - Reduce Load« in vnesti besedilo izvedbe.
Ponovno odpreti in preklicati opombo ter pritisniti »Zaključi vadbo«.

**Opaženo:** zahteva za klik in nato branje strani ne odgovorita v 30 sekundah.
Chrome ohrani zavihek; CDP potrdi, da ni odprtega JavaScript potrditvenega okna.
Po zaprtju samo testnega zavihka in odprtju aplikacije v istem profilu je trening še
aktiven, opomba je ohranjena. Ponovljen zaključek z dejanskimi dogodki miške prek CDP
znova obstane; prejšnje branje kartice uspe, klik zaključka pa ne odgovori.

**Vpliv:** preizkus zaključka in pregleda opravljenih serij je blokiran. Vzrok še ni
lokaliziran: to je ponovljiv zastoj testnega zavihka ob zaključku, ne dokaz določene
napake v kodi. Preizkušeno v Chrome CDP na objavljeni različici `0625bd6`.

**Predlog in preverjanje:** ponoviti zaključek v običajnem uporabniškem kliku ter
ugotoviti vzrok neodzivnosti. Zaključek mora potrditi shranitev in po ponovnem odprtju
pokazati zaključeno vadbo; preklic pa mora ohraniti odziven aktiven trening.

**Stanje 2026-09-27:** verjetni vzrok je odstranjen. Zaključek pred iztekom in zaključek brez serij sta
odprla dve okni brskalnika (`confirm`) zaporedoma, in dokler stojita, stran ne dela ničesar (§80.19).
Od `f49f7e4` sprašuje okno aplikacije, ki strani ne ustavi. **Odprto:** ponoviti scenarij v brskalniku
na objavljeni gradnji; zaprto šele, ko se zaključek odzove in shrani.

**Zaprto 2026-09-30 (Claude):** vzrok (dve okni brskalnika zaporedoma) je odstranjen v `f49f7e4`, v
`src/` ni več nobenega `confirm()`. Zaključek začetega treninga z oknom aplikacije pokriva
`test_session_start_time_adjust.py` (»Finishing asks twice in the app's own dialog«), ki teče v vsaki
gradnji.

### 80.111 [x] P2 — Nova stranka: gumba pravita »E-pošta ni vpisana« in »Telefon ni vpisan«, čeprav sta vpisana — popravljeno 2026-09-30

**Scenarij in koraki:** »Ustvari trening« → v polje »Poišči stranko po imenu...« vpisati
»SIM Vera Kos« → »Dodaj »SIM Vera Kos« kot novo stranko«. Vpisati e-pošto in telefon, nato
označiti »Stranka je podpisala privolitev (hramba podatkov in sinhronizacija v oblak)«.
Tipkati v polje »E-pošta« in ga zapustiti.

**Opaženo:** pod privolitvijo sta sivi, onemogočeni gumbi z napisom »E-pošta ni vpisana« in
»Telefon ni vpisan«. Napisa se ne spremenita, ko sta polji izpolnjeni, ne ob tipkanju in ne
ob izhodu iz polja.

**Težava in vpliv:** trener prebere, da e-pošte ni vpisal, čeprav jo je. Ne ve, ali je polje
sprejelo naslov in ali bo obrazec za privolitev lahko poslal.

**Predlog:** gumba naj se odzoveta na vpisani naslov in številko. Če obrazca pred shranjevanjem
stranke ni mogoče poslati, naj to piše: na primer »Obrazec pošlješ, ko stranko shraniš«.
Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.112 [x] P3 — Gumb »Ni se zgodila« v oknu, ki govori o »treningu« — popravljeno 2026-09-30

**Scenarij in koraki:** trening za danes ob 18:00 začeti ob 12:30 z »Začni trening«.

**Opaženo:** okno »Trening se je začel izven urnika« ponudi »Ni se zgodila«, »Ohrani urnik« in
»Prilagodi čas«. »Trening« je moškega spola, gumb je ženskega. Trener-podagent je zapisal:
»ne vem, kaj se ni zgodilo: vadba?«

**Težava in vpliv:** trener se ustavi pri gumbu, ki odstrani termin. Pri gumbu z nepovratno
posledico ne sme ugibati, na kaj se nanaša.

**Predlog:** »Ni se zgodil« ali »Trening ni bil«. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.113 [x] P1 — Uvoz programa izgubi serije, ponovitve in težo, tudi pri primeru, ki ga pokaže aplikacija — popravljeno 2026-09-30

**Scenarij in koraki:** ☰ → »Vaje in rutine« → »Rutine« → »Uvozi program«. »Pokaži obliko«
(v polje vpiše primer aplikacije). »Za koga«: SIM Vera Kos. »Odpri v urejevalniku«.

**Opaženo:** okno reče »Prebranih 4 postavk, 2 jih ni v tvojem katalogu.« Primer predpiše
Barbell Bench Press 4 × 5 × 60 kg, Bent-Over Row 4 × 8 × 45 kg in Push-Up 3 × 12. V
urejevalniku ima Barbell Bench Press prazno polje za serije, 10 ponovitev in 0 kg. Vaji z
značko »PO MERI« kažeta »S[object Object],[object Object],[object Object],[object Object] × R—«
in »S[object Object],[object Object],[object Object] × R—«. Konzola nima napak.

**Težava in vpliv:** trener uvozi program, ki ga je pisal drugje, in dobi vaje brez številk
ali s privzetimi (10 ponovitev, 0 kg). Opozorila ni. Če ne primerja vsake vrstice z izvirnikom,
stranka dela po napačnem programu. Programski izpis »[object Object]« mu pove, da je nekaj
pokvarjeno, ne pa kaj.

**Predlog:** urejevalnik naj pokaže serije, ponovitve in težo iz uvoza. Postavko, ki je ni bilo
mogoče prebrati, naj imenuje. Opaženo na `main` `12d0e66`, sl, 390 × 844; najprej opazil
trener-podagent.

### 80.115 [x] P2 — Na slovenski podlogi vaja po »Prelahko« dobi oznako »Completed« — popravljeno 2026-09-30

**Scenarij in koraki:** vzorčni podatki, trening za Jane Doe s tremi vajami iz kataloga. Na odprti
vaji Wall Sit pritisniti »Prelahko«, nato tapniti oznako »Prihodnje« na naslednji vaji.

**Opaženo:** kartica Wall Sit ima zdaj oznako »Completed«. Ostale oznake na isti podlogi so
slovenske: »Prihodnje«, »Zadnjič: 2026-07-20«, »Krog 1 / 3«. Trener brez predznanja: »prejšnja
dobi oznako Completed (angleško v slovenskem zaslonu)«.

**Težava in vpliv:** edina oznaka, ki pove, da je vaja zapisana kot opravljena, je v jeziku, ki
ga trener morda ne bere.

**Predlog:** slovenska oznaka, na primer »Opravljeno«. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.116 [x] P2 — Okno »Trening se je začel izven urnika« skrije »Končni čas« desno od roba — popravljeno 2026-09-30

**Scenarij in koraki:** vzorčni trening »Hitri HIIT za trup« (14:00–15:00) ob 13:01 odpreti in
pritisniti »Začni trening«.

**Opaženo:** okno je široko 351 pik. »Začetni čas« z gumbi 13:30, 14:00, 14:30, 15:00 zapolni
širino. »Končni čas« se začne pri 315 pikah in sega do 577, zato se vidi le »Končn« in začetek
dveh gumbov (posnetek zaslona). Pod poljema je tanek drsnik; nič ne pove, da je treba
podrsati v stran.

**Težava in vpliv:** trener, ki premakne trening na dejanski čas, lahko popravi le začetek. Konca
ne vidi in ne ve, da obstaja, zato z »Prilagodi čas« shrani konec, ki ga ni preveril.

**Predlog:** polji naj stojita drugo pod drugim, kot v obrazcu »Nastavitev treninga«. Opaženo na
`main` `12d0e66`, sl, 390 × 844; najprej opazil trener-podagent.

Na 320 × 680 je okno široko 288 pik, oznaka »Končni čas« se začne pri 311. piki in polje za konec
pri 311. do 523. piki: z zaslona se vidi 9 pik oznake, polja nič.

### 80.117 [x] P3 — Trening čez teden dni »se začne čez 870h 01m« — popravljeno 2026-09-30

**Scenarij in koraki:** vzorčni podatki, seznam »Treningi«, trening »Moč ob torkih in četrtkih«
2026-11-05.

**Opaženo:** kartica: »Se začne čez 870h 01m«. Enako »197h 01m« za trening čez osem dni.

**Težava in vpliv:** trener ur ne preračuna v dneve. Trener brez predznanja: »Ure za en teden
naprej ne preračunam; dneva bi razumel.« Datum nad kartico to že pove, zato je številka le šum.

**Predlog:** nad 24 ur pisati dneve (»čez 36 dni«) ali števca ne kazati. Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.119 [x] P2 — Zgodovina stranke izpusti težo: »Dumbbell Goblet Squat: 10, 10, 10« pri 12 kg — popravljeno 2026-09-30

**Scenarij in koraki:** prazna aplikacija, stranka SIM Nina Koleno, trening »Rehabilitacija« z vajo
Dumbbell Goblet Squat 3 × 10 × 12 kg (podloga kaže »S3 × R10 × 12 kg«). Začeti, pritisniti
»Prelahko«, zaključiti. ☰ → »Imenik strank« → SIM Nina Koleno.

**Opaženo:** »ZGODOVINA ZABELEŽENIH VADB«: »Dumbbell Goblet Squat: 10, 10, 10«. Teže ni. Tudi vrstica
»Zadnjič« na naslednjem treningu te stranke piše le »10, 10, 10«. Pri vzorčni stranki Jane Doe pa
»Zadnjič« piše »18 kg x 10, 18 kg x 10, 18 kg x 9«. Trenerka brez
predznanja: »Teže (12 kg) ni v zgodovini. … napredek po teži ne vidim.«

**Težava in vpliv:** napredek pri vaji z utežjo je teža. Iz zgodovine trener ne vidi, s koliko je
stranka delala, in pri naslednjem programu ugiba ali išče drugje.

**Predlog:** zgodovina naj pokaže težo ob vsaki seriji, kot vrstica »Zadnjič«. Opaženo na `main`
`12d0e66`, sl, 390 × 844; najprej opazil trener-podagent.

### 80.120 [x] P2 — Pod poškodbo kolena stran stranke pravi »Brez zabeleženih zdravstvenih težav« — popravljeno 2026-09-30

**Scenarij in koraki:** nova stranka SIM Nina Koleno, v »Poškodbe in omejitve« vpisano »Bolečine v
desnem kolenu, brez globokih počepov«, polje »Opombe« prazno. Odpreti stran stranke.

**Opaženo:** »POŠKODBE IN OMEJITVE: Bolečine v desnem kolenu, brez globokih počepov«, takoj pod tem
»OPOMBE: Brez zabeleženih zdravstvenih težav ali posebnosti.«

**Težava in vpliv:** besedilo za prazno polje »Opombe« trdi, da stranka nima zdravstvenih težav, dve
vrstici pod njeno poškodbo. Trener, ki stran hitro preleti, lahko prebere zadnje.

**Predlog:** za prazne opombe napisati, da opomb ni, na primer »Ni opomb.« Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.121 [x] P2 — »Zamenjaj vajo« stranki z bolečim kolenom vnaprej izbere Barbell Back Squat — popravljeno 2026-09-30

**Scenarij in koraki:** stranka SIM Nina Koleno s »Poškodbe in omejitve: Bolečine v desnem kolenu,
brez globokih počepov«. Na treningu pri Dumbbell Goblet Squat »Opombe« → »Prelahko – povečaj
težo« → »Zapiši opozorilo«. Zaključiti. »Treningi, ki čakajo na pregled« → vnos stranke →
»Razreši« → »Zamenjaj vajo (lažja ali težja različica)«.

**Opaženo:** seznam »Vaje: 9« za noge je po abecedi, izbrana je prva: Barbell Back Squat. Okno ne
omeni poškodbe. Nad seznamom piše »Nadomestna vaja — ista mišična skupina ohrani sledenje obsegu«.
Trenerka brez predznanja je pri signalu »Bolečina ali nelagodje v sklepu« dobila isto izbiro:
»pri stranki s poškodbo kolena in zabeleženo bolečino. Trener to lahko spregleda.«

**Težava in vpliv:** en dotik na »Uveljavi in razreši« stranki, ki ne sme delati globokih počepov,
vpiše počep s palico v program. Izbira ni trenerjeva, naredila jo je abeceda.

**Predlog:** nobena vaja naj ne bo izbrana vnaprej, dokler je trener ne izbere; ob poškodbi naj
okno pokaže njeno besedilo. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.122 [x] P3 — Koledar »Datumi« ne pokaže ne današnjega dne ne dni s treningi — popravljeno 2026-09-30

**Scenarij in koraki:** prazna aplikacija s treningoma 2026-10-01 in 2026-10-02. Na seznamu
»Treningi« pritisniti »Datumi«.

**Opaženo:** koledar septembra 2026. Dan 30 (danes) ima isto obliko kot dan 15: brez ozadja, brez
krepke pisave, brez oznake za bralnik zaslona. Enako 1. in 2. oktober, ko sta vpisana treninga.
Trenerka brez predznanja: »Koledar ne označi današnjega dne in ne pokaže dni s treningi, zato z njim
ne vidim, kdaj je kaj.«

**Težava in vpliv:** trener, ki izbira obdobje, ne vidi, kje je danes in kateri dnevi so zasedeni.
Izbira na slepo, nato preveri na seznamu.

**Predlog:** označiti današnji dan in dneve s treningi. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.123 [x] P2 — Podloga treninga čez dva ali več dni v glavi ne pove dneva, samo »Prihodnje« — popravljeno 2026-09-30

**Scenarij in koraki:** ustvariti trening »Par« s čipom »sob. 3.« (seznam ga pokaže pod »sobota
2026-10-03«) in ga odpreti. Za primerjavo odpreti trening za jutri.

**Opaženo:** glava sobotnega treninga: »Prihodnje · 13:30 - 14:30 · Studio«. Glava jutrišnjega:
»Jutri · 13:30 - 14:30 · Studio«, današnjega »Danes · …«. Datuma ali dneva v tednu pri treningu čez
dva dni ni nikjer na podlogi.

**Težava in vpliv:** trener pripravlja načrt za soboto in na zaslonu, kjer ga ureja, ne vidi, da je
to sobota. Pri tedenski seriji so vsi večeri »Prihodnje«, zato ne ve, katerega ureja.

**Predlog:** namesto »Prihodnje« dan in datum, na primer »sob. 2026-10-03«. Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.124 [x] P2 — Oznaka »PREDOGLED« vodi na »Stran ni najdena«, ko je aplikacija že naložena — popravljeno 2026-09-30

**Scenarij in koraki:** trener nekaj časa dela v aplikaciji (ne v peskovniku), nato pritisne rumeno
oznako »PREDOGLED« v glavi. Njeno pomožno ime: »Predogledna različica — še ni izdana in lahko izgubi
podatke. Odpri obvestilo o tveganjih in izgubi podatkov.«

**Opaženo:** na `main` `12d0e66` se odpre `/LibrePT/preview.html` z besedilom »Stran ni najdena. Ta
povezava ne vodi do treninga, stranke ali pogleda v LibrePT.« Na objavljeni `8b2ce80` isti naslov v
istem brskalniku odpre aplikacijo z izbiro jezika. Strežnik pa stran vrne: `curl` na oba naslova da
200 in naslov »LibrePT Preview Build — Risks & Data-Loss Notice«. Stran z obvestilom torej obstaja,
brskalnik, ki je aplikacijo že naložil, pa je ne pokaže. To je verjetno isto, kar je Simon prijavil
2026-09-10 (»klik na peskovnik značko vodi na neobstoječo stran«, §42.12), ko se s `curl` ni
ponovilo.

**Težava in vpliv:** oba trenerja brez predznanja je oznaka skrbela (»pomeni, da ne smem zaupati
podatkom«). Edina stran, ki pove, kaj predogled pomeni za njune podatke, jima odgovori, da ne obstaja.

**Predlog:** oznaka naj odpre obvestilo tudi v brskalniku, ki ima aplikacijo naloženo; test naj jo
pritisne v takem brskalniku, ne s `curl`. Opaženo na `main` `12d0e66` (lokalni strežnik) in na
objavljeni `8b2ce80`, 390 × 844.

### 80.125 [x] P3 — Na slovenski strani so pomožna imena gumbov za bralnik zaslona angleška — popravljeno 2026-09-30

**Scenarij in koraki:** `?lang=sl`, seznam »Treningi« in podloga treninga. Zbrati `aria-label` in
`title` vseh elementov v dokumentu, tudi v zaprtih oknih.

**Opaženo:** slovar aplikacije je preveden (od 1080 besedil jih je le pet enakih angleškim, vsa
upravičeno), angleška pa so ta imena, ki ne pridejo iz njega: »Loading LibrePT«, »Notification Center
and Active Session«, »Toggle notifications drawer«, »Toggle Notifications«, »Close modal«, »Close add
exercise modal«, »Close catalog«, »Close conflict review«, »Close build info«; v oknu »Uredi rutino«
ima polje za težo ime »Load«. Drugi gumbi za zapiranje so »Zapri« (14-krat). Trener brez predznanja je
to opazil v orodju: »ime "Close" (angleško) na slovenski strani, drugod "Zapri"«.

**Težava in vpliv:** trener, ki uporablja bralnik zaslona ali glasovno upravljanje, sliši angleščino
sredi slovenske strani in gumba ne more poklicati s slovensko besedo, ki jo vidi pri drugih oknih.

**Predlog:** imena iz slovarja, kot ostala; test, ki na `?lang=sl` ne najde angleškega pomožnega
imena. Opaženo na `main` `12d0e66`, 390 × 844.

### 80.126 [x] P3 — Pred izbiro jezika stran nima `<html lang>`, besedilo za oknom pa je angleško — popravljeno 2026-09-30

**Scenarij in koraki:** prvi obisk brez `?lang=`, kot ga trener dobi od kolega:
`/LibrePT/`. Brskalnik ima `navigator.language` `en-US`.

**Opaženo:** okno »Choose your language · Izberi jezik · Wähle deine Sprache« z gumbi »English«,
»Slovenščina«, »Deutsch«. Za njim je glava angleška (»PREVIEW«, »Sessions«) in stavek »A lightweight,
free app for your clipboard, sessions and training programmes.« `<html lang>` ni nastavljen.
Gumbi jezikov imajo pravilen svoj `lang` (`en`, `sl`, `de`). Po dotiku »Slovenščina« je `lang`
strani `sl` in besedilo slovensko.

**Težava in vpliv:** bralnik zaslona angleško besedilo za oknom prebere z glasom, ki ga izbere
sam, ker stran ne pove, v katerem jeziku je.

**Predlog:** stran naj ima `lang` jezika, v katerem je besedilo za oknom (`en`). Opaženo na `main`
`12d0e66`, 390 × 844.

### 1.3 [x] Session list must model partial overlaps — shipped 2026-09-30

**Narrowed 2026-09-27: the room half left this app.** Other trainers' room occupancy was read from
one Google resource calendar per room, and every Google Calendar integration is now a paid
capability — the ruling and its reasoning are in the private `~/Projects/EnterprisePT` project,
`TODO.md` §19, and what has to leave this repository is §68.3 below. What stays here is the trainer's
own sessions overlapping, which needs no calendar at all.

- **Partial overlaps** (10:00–11:00 vs 10:30–11:30) must both render, showing the overlap rather than
  stacking as if sequential. Render it the way calendar apps do: a vertical time grid, blocks whose
  top/height map to start/end, overlapping blocks side by side in columns.
- The lane arithmetic is built and tested — [src/domain/overlapLanes.js](src/domain/overlapLanes.js)
  decides which column a block takes and how many it shares width with. What remains is the renderer.
- Must be legible inside the continuous timeline §4.3 shipped.

### 80.109 [x] P2 — Ocena trajanja istega intervala je odvisna od zapisa časa — popravljeno 2026-09-30

**Scenarij in koraki:** v »SIM Previdna vadba« za TEST Maja Omejitev (jutri
10:00–10:45, Telovadnica B) odpreti »Uredi načrt«. Obstoječemu Dumbbell Bicep Curl
3×10×6 kg in počitku 60 s dodati Treadmill Run iz kataloga. Nastaviti 4 serije in
v polje »ČAS« vpisati »2:30«. Končati urejanje, nato ga ponovno odpreti. Za primerjavo
v isti vaji zamenjati samo čas s »150«, končati urejanje in ga ponovno odpreti.

**Opaženo:** pri obeh vnosih kartica vaje kaže »S4 × 2:30«. Pri vnosu »2:30« ocena
načrta kaže »2 / 45 min«, pri enakovrednem vnosu »150« pa »12 / 45 min«. V načrtu
sta tudi dva počitka po 60 s. Že štirje tekaški intervali sami trajajo deset minut,
zato dvominutna ocena celotnega načrta ne more držati. Obrazec »2:30« sprejme brez
opozorila in ga ob ponovnem odprtju ohrani.

**Težava in vpliv:** trener dobi deset minut razlike pri oceni zasedenosti termina,
čeprav obe kartici predpisujeta isto vadbo. Na tej osnovi lahko v termin doda preveč
vaj ali napačno presodi, koliko časa ostane.

**Predlog:** sprejeti zapisi časa naj dajo isto oceno trajanja; primerjati »2:30«
in »150« pri več serijah, skupaj s počitki. Opaženo na objavljeni `8b2ce80`, sl,
390 × 844, Chrome CDP; brez prestreženih napak in brez pregledovanja kode.

### 93.1 [ ] Move the skill where every agent reads

- `SKILL.md`, `explore.py`, `form-task-prompt.md` and `persona-day-prompt.md` move to
  `.agents/skills/exploratory-test/`, tracked by git. Other projects of Simon's already use
  `.agents/skills/` for this, so the location is the convention rather than a new idea. The depth is
  the same, so the relative links inside `SKILL.md` still resolve.
- `.claude/skills/exploratory-test/SKILL.md` becomes a pointer to the shared file, so Claude Code
  still lists the skill. A pointer and not a copy: the description is the trigger, and two copies of
  it would drift.
- The one hard path inside `SKILL.md` (`S=.claude/skills/exploratory-test/explore.py`, line 68)
  becomes the shared one.
- `AGENT_RULES.md` names `.agents/skills/` as the home of skills every agent must read before doing
  the work they cover — this is what makes the move worth anything to Codex.
- `.gitignore` takes `.agents/skills/exploratory-test/.session/` and its `__pycache__`: the browser
  profile is runtime state, wiped at every start.
- `.agents/skills/INDEX.md`, because every knowledge directory has one.

### 93.2 [ ] A live browser says who holds it, and until when

`explore.py` writes `.private/AGENT_SYNC/exploratory-browser.md` — port, browser pid, watchdog pid,
profile path and the clock time the idle timeout will close it — refreshed on the same call that
touches the heartbeat, and deleted by `stop` and by the watchdog. Refreshed on every command rather
than only at `start`, so a browser already running when this ships gets a note on its next command
instead of needing a restart.

Then a session arriving later can act instead of guessing: if the note is absent, or its watchdog pid
is gone while the browser is alive, the browser has no keeper and may be closed. Today that judgement
needed reading `/proc`, and the answer still had to go to Simon.

**Shipped 2026-09-30. What the move turned up, none of it in the plan:**

- **`.agents/` was in `.gitignore` too.** Moving the skill there as written would have left it
  exactly as invisible to Codex and Gemini as `.claude/` had. The ignore is narrowed instead —
  `.agents/*` ignored, `.agents/skills/` re-included, `.agents/skills/*/.session/` ignored again for
  the browser profile — so what every agent must read is tracked and what one agent keeps for itself
  is not. Without this line the whole move would have been theatre.
- **The pointer is a symlink, not a copy.** `.claude/skills/exploratory-test/SKILL.md` is a symlink
  to the shared file. A copy would have needed the description duplicated — and the description is
  the trigger, so two of them drift into two different skills. Verified live: the skill listing
  Claude Code offers shows the rewritten text, read through the symlink.
- **Ruff saw `explore.py` for the first time** and failed it: `main` is a twenty-branch command
  dispatcher, complexity 33 against a limit of 10. Suppressed with the rationale at the function and
  a re-check condition — when a command needs more than a couple of calls, or two commands start
  sharing state, the branches have stopped being independent and it becomes a table of handlers.
- **`todo_refs` saw it too, and that one could not be suppressed.** SKILL.md named TODO sections
  fourteen times, and the rule is that no file outside TODO.md points into it. The purpose behind
  the rule is that a section closes and its reasoning moves — but this skill does not READ those
  sections, it WRITES findings into them, and they are registers that never close. The rule was left
  untouched all the same and the skill reworded: it names its destinations by what they are (the
  first-use trial section, the trainer's-day section, the business-needs brainstorm) rather than by
  number. Simon was offered the alternative — an exemption for `.agents/skills/` — and it remains
  his to take; the rewording costs precision the whole project otherwise has, since findings are
  referred to everywhere by their numbers.

---

### 92.3 [x] The demo shows a press, a hold and a drag at once — shipped 2026-09-30

`demoTourPlayer.js` can only tap, type, pick a file and point; `demoHand.js` can only move and
pulse. Neither can show a gesture, so the L would ship undiscoverable — the walkthrough is the only
place a trainer can learn it.

- A new act in `interactWith`'s vocabulary, declared by the step the way `enter` and `choose` are:
  a pointer sequence (down, moves, up) on the blanket with one `pointerId`.
- A hand that stays pressed and travels along the path, rather than arriving and pulsing.
- New steps in `gymFloorTour.js`: a quick look back, a switch back, and a switch forward. Each
  keeps the file's rule that the expectation is a behavioural claim.
- To check before writing: the tour's session must not be started, or `canOpen` refuses to leave it
  and the switch steps cannot pass.

**What it cost that the plan did not foresee.** Three things, all found by building it rather than
by reading:

- The peek looked from the WRONG DAY for every session opened from the board — `buildSessionMeta`
  hands the clipboard a Date object and the neighbour rule reads ten characters of it, so "Tue Sep
  30" counted as later than every "2026-…". Fixed in the same commit, because the step could not be
  honest otherwise.
- A gesture that is let go of leaves nothing behind, so the LOOK cannot be its own step: its
  expectation would already be true when its card appears, and the guided walkthrough reads such a
  step as done. It is graded mid-gesture instead, by a new `expectHeld` on the step.
- Three walkthrough tests were written around the script's length and the step numbers in it. They
  read the count off the guide now. One of them compared a CSS-uppercased line with `to_have_text`
  — the trap documented at the top of that same file, walked into while fixing the others.

**Simon asked for three things and this ships two.** The look and the switch BACK are demonstrated;
the switch FORWARD is not, because it does not work — §92.5. A demonstration of a gesture that does
nothing is worse than no demonstration.

---

### 92.2 [x] The deck holds one session, and the peek is aligned to the exercise in focus — shipped 2026-09-30

- Out of `exerciseDeckOfCards.js`: `buildPastExerciseItems`, the `PastDeckCard` branch and the
  `pastExpanded` plumbing it feeds to the live cards (`exerciseCard.js`, `circuitCard.js`), whose
  "an open past log defocuses the live card" rule can no longer be reached.
  `exerciseDeckOfCards.css` and `themes/spreadsheet.css` lose their `.past-session` rules, and the
  nine tests that select `.exercise-deck-card:not(.past-session)` drop a qualifier that can no
  longer match.
- **`pastDeckCard.js` STAYS, with `expandedPastId`** — corrected 2026-09-30, before any code. An
  earlier draft of this subsection said the module would be deleted. That was wider than Simon's
  instruction, which is about what the live deck holds, and it would have destroyed the component
  §45.8 is built on: its ruling of 2026-09-11 is that the client's history view stops drawing its
  own records and mounts these cards instead. The pair is self-contained, so it is left whole and
  simply not mounted in the live deck. Nothing in the build fails on a module with no importer.
- The two comments in `activeSessionBoard.js` (lines 459-461) that send the reader to
  `showPastExerciseInFocus` are corrected: that function no longer exists, and
  `clipboard-logger-container` is now only the empty-state placeholder.
- `src/sw/cacheManifest.js` and the `CHANGELOG.md` link to `pastDeckCard.js` are untouched, since
  the file stays.
- Alignment: `planSheet.js` marks each exercise row with its normalised name,
  `planPeekController.js` finds the row matching the card in focus and offsets the sheet by one
  custom property (`--peek-align`), the same carve-out `--plan-pull` already uses. No match, no
  offset.
- `docs/SRC_MODULES.md` loses `pastDeckCard.js` in the same change.

**What the gate found that the plan did not.** Two promises this change takes away, both stated
rather than quietly dropped. The rendered "Last time" badge — the word from the dictionary beside an
ISO date — had two browser tests through the card, and the card is mounted nowhere now; the data
rules behind it moved to `tests/unit_js/modules/clipboard/pastDeckCard.test.mjs`, and the rendering
is uncovered until the card is mounted again. A bound group's per-member last sessions are shown
nowhere at all, which is §92.4, open for Simon.

**Chosen while writing, not planned:** the alignment is measured when the peek BEGINS
(`onPeekBegin`, a new injected seam on `initPlanPeek`), not when the sheets are drawn. Measured at
render time it was 12px out, because the deck scrolls its own active card into view a tenth of a
second after it paints. The seam is worth more than the fix: anything else measured about the
under-layers now has one honest moment to be measured in.

**`buildPastExerciseItems` moved from `exerciseDeckOfCards.js` into `pastDeckCard.js`.** Deleting it
along with the deck's use of it would have kept the card while throwing away what it is built from,
and with it the rule that a skipped movement is named as skipped rather than listed as sets the
client lifted — a rule that came from a real defect.

---

### 92.1 [x] The L: sideways looks, up opens — shipped 2026-09-30

`planPeek.js` after the axis locks to x (8px, `LOCK_PX`) already captures the pointer, so vertical
movement from that moment on is free to carry meaning and cannot be confused with the deck's own
scroll. A release with no upward stroke always springs back.

- Opening asks for both: a horizontal pull of at least a quarter of the width, and an upward stroke
  of at least 64px measured from the DEEPEST point of the horizontal pull, not from where the
  press began.
- The horizontal offset is pinned at its deepest value while the finger travels up, so the plan
  does not slide back during the second stroke.
- `is-release-ready` is renamed `is-open-ready`: a class named for releasing, on a gesture that no
  longer opens on release, is a lie in the code. It now turns on as soon as an openable neighbour is
  uncovered at all, not at a distance threshold.
- Wording: `plan_peek_release_open` / `plan_peek_release_create` are replaced by
  `plan_peek_up_open` / `plan_peek_up_create` in sl, en and de — the old keys are deleted, since a
  step that names a control names what the control says.
- Tests: `tests/medium/test_plan_peek.py` (the threshold, the two open cases, the spring-back, the
  started-session refusal) and `tests/e2e/test_plan_peek_open.py`.

**Found by the gate, not by the plan:** splitting `pointermove` was not optional. The added
bookkeeping took it to a cyclomatic complexity of 21 against a limit of 15, so the rise, the axis
lock and the opening each became their own named function. The gate caught it in Stage 1, 11
seconds in.

**Chosen while writing, not ruled:** opening happens on the upward stroke itself, in `pointermove`,
not on the `pointerup` that follows. A completed L that still waited for the finger to lift would be
cancellable by sliding back down, and nothing on the screen would say so. It also makes every
release mean one thing — the look is over — including a `pointercancel`, which used to need its own
guard against opening.

---

### 17.4 [x] Save a past session as a routine template (library fills itself from history) — shipped 2026-09-30

With §17.1 preserving the full program, "Save as routine" on a history record extracts a reusable
template — **demoting the Routines view from an authoring surface to a library that fills itself from
real sessions**, removing the blank-page chore that blocks ramp-up.

- Extraction **strips person/day-specific magnitudes** (`weight`, watts, time, distance, calories),
  keeping the prescription structure: exercise, set count, reps/targets, rest, circuit grouping.
- Pairs with the inline clipboard editor (§8.3) and §5.1's Tab 3.
- **Watch item for §18.5**: a *hard* provenance reference back to the source history record would
  create the first cycle in the reference graph (`history → routine → history`), which the topological
  migration order forbids. Keep provenance soft/denormalised.

### 80.96 [x] P2 — Prva kartica vodenega ogleda veleva pritisniti »Naprej«, tega gumba pa ni — popravljeno 2026-09-30

**Scenarij in koraki:** ☰ → »Nastavitve« → »Vstopi v peskovnik«. Odpri predal na dnu in tapni poglavje
»LibrePT te pozdravlja«.

**Opaženo:** kartica pravi »KORAK 1 OD 1« in v besedilu: »Z gumbom Pokaži mi ti vodnik pokaže dvoje …
Z gumbom Naprej začneš.« Na kartici sta samo dva gumba, »Pokaži mi« (153 × 46 pik) in »Končaj«
(136 × 46 pik), ter ikona za pospravljanje kartice, ki meri 17 × 19 pik. Gumba »Naprej« ni nikjer na
zaslonu, ne omogočenega ne onemogočenega. »Končaj« je veliki zeleni gumb in ogled zapre.

**Težava in vpliv:** trener bere navodilo in pritisne edini veliki gumb, ki se ponuja, torej »Končaj«,
in ogled se konča, preden se je začel. Ogled je edina razlaga aplikacije, ki jo ima.

**Predlog:** besedilo naj imenuje gumb, ki na kartici res je, ali pa naj bo gumb »Naprej« — opaženo na
različici `8b2ce80`.

**Popravljeno 2026-09-30.** Kartica zdaj imenuje gumba, ki na njej res sta: »Pokaži mi« pokaže
oboje, »Končaj« pa kartico zapre, in besedilo pove, da naslednje poglavje trener izbere v seznamu
spodaj. Besedilo je popravljeno v vseh treh jezikih.

### 80.97 [x] P3 — Peskovnik napoti trenerja na seznam poglavij, ki je 325 pik pod robom zaslona — popravljeno 2026-09-30

**Scenarij in koraki:** ☰ → »Nastavitve« → »Vstopi v peskovnik«. Preberi besedilo, ki se izpiše, in
poskusi narediti, kar pravi.

**Opaženo:** besedilo pravi: »Za vodeni ogled aplikacije po korakih pritisni poglavje v spodnjem
seznamu: ogled se začne pri poglavju, ki ga pritisneš.« Ta seznam je v predalu na dnu, ki je zaprt:
vrstica »LibrePT te pozdravlja« je pri 1169. piki navpično, zaslon pa je visok 844. Predal odpre le
ročica, ki meri 40 × 5 pik (§80.78).

**Težava in vpliv:** trener stori, kar mu piše, in ne najde ničesar. Seznama, na katerega je napoten,
ne vidi, ker je pod robom zaslona.

**Predlog:** ob vstopu v peskovnik naj bo predal odprt, ali pa naj besedilo pove, da ga je treba prej
odpreti, in imenuje ročico — opaženo na različici `8b2ce80`.

**Popravljeno 2026-09-30.** Ob vstopu v peskovnik se predal odpre, tako da je seznam poglavij, na
katerega besedilo napoti, na zaslonu (`switchToWorkspace` v `src/app.js`).

### 80.98 [x] P2 — Korak ogleda imenuje polje »Ime stranke«, obrazec pa ima »Ime in priimek« — popravljeno 2026-09-30

**Scenarij in koraki:** v peskovniku zaženi poglavje »Sprejem treh novih strank« in pojdi do koraka 8
od 10 (☰ → »Imenik strank« → »Povabi stranko« → vpiši telefon → vpiši e-naslov → zapri z ✕ → »Dodaj
stranko«).

**Opaženo:** kartica pravi: »V polje Ime stranke vpiši Nik Zupan.« V obrazcu tega polja ni. Polja se
imenujejo »Ime in priimek *«, »Vzdevek (samo če si dve stranki delita ime)«, »E-pošta«, »Telefonska
številka«, »Cilji treninga«, »Poškodbe in omejitve« in »Opombe«.

**Težava in vpliv:** trener, ki prvič vidi aplikacijo, išče polje z imenom, ki ga je pravkar prebral,
in ga ne najde. Pravilo aplikacije je, da korak imenuje kontrolo z napisom, ki ga ta kontrola kaže v
tem jeziku.

**Predlog:** korak naj reče »Ime in priimek«, ali pa naj se polje preimenuje in napis popravi v vseh
jezikih — opaženo na različici `8b2ce80`.

**Popravljeno 2026-09-30.** Korak zdaj imenuje polje z napisom, ki ga to polje kaže: »Ime in
priimek«, enako kot korak za vpis stranke same. Popravljeno v vseh treh jezikih.

### 80.106 [x] P3 — Vprašanje pred zaključkom treninga šteje čas v minutah: »še približno 3812 minut« — popravljeno 2026-09-30

**Scenarij in koraki:** ustvari trening za čez dva dni (»Vecerna vadba«, 2026-10-02, 18:00 - 19:00),
odpri podlogo, tapni »Začni trening« in »Ohrani urnik«, nato »Zaključi vadbo«.

**Opaženo:** okno pravi »Do konca tega treninga je še približno 3812 minut. Ga želiš vseeno zaključiti
zdaj?« To je 63 ur in 32 minut. Aplikacija drugod isti čas piše po urah in minutah, na primer »Se
začne čez 62h 32m« na kartici in »začeto 62h 32m prezgodaj« v oknu tri dotike prej.

**Težava in vpliv:** številke 3812 trener ne prebere. Vprašanje je varovalka pred prezgodnjim
zaključkom, in prav v njej mu podatek ne pove nič.

**Predlog:** čas naj bo zapisan kot drugod, v urah in minutah — opaženo na različici `8b2ce80`.

**Popravljeno 2026-09-30.** Vprašanje zdaj pove preostanek tako, kot ga povejo vsi drugi
števci v aplikaciji (»01h 32m«), prek `formatDurationHourMin`. Ob tem je dodana preverba, ki velja za
ves slovar: `{nadomestek}` mora biti pri istem ključu enak v vseh jezikih, sicer se v enem jeziku
izpiše besedilo v zavitih oklepajih (`tests/unit/test_i18n_parity.py`).

### 80.107 [x] P3 — Kartica zaključenega treninga takoj po zaključku še vedno piše »Aktiven trening« — popravljeno 2026-09-30

**Scenarij in koraki:** kot pri §80.106; po »Zaključi vadbo« potrdi »Zaključi zdaj« in nato še
»Zaključi zdaj« v oknu »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno
vadbo?«. Takoj zatem poglej kartico tega treninga v seznamu.

**Opaženo:** kartica pravi »18:00 - 19:00 Vecerna vadba 1/1 mest zasedenih Program ni določen Aktiven
trening«. Po osvežitvi strani piše pravilno: »Zaključeno 00:00«. Seznam se torej po zaključku ne
osveži sam.

**Težava in vpliv:** trener zaključi vadbo, seznam pa mu pravi, da še teče. Lahko tapne kartico in
misli, da se trening ni zaključil, ali pa počaka, da se stanje »popravi«, česar brez osvežitve ne bo.

**Predlog:** po zaključku naj se kartica v seznamu takoj prepiše na »Zaključeno« — opaženo na
različici `8b2ce80`.

**Popravljeno 2026-09-30.** Po zaključku se seznam takoj preriše, iz istega razloga, kot se
preriše ob zagonu treninga: stanje na kartici se vpiše ob izrisu seznama in ni izračunano v živo.

### 80.108 [x] P3 — Na 320 × 680 je od gumba »Shrani in nadaljuj« na uvodnem zaslonu vidne štiri pike — popravljeno 2026-09-30

**Scenarij in koraki:** zaslon širine 320 in višine 680 (najmanjši, ki ga aplikacija podpira), prvi
zagon: »Se strinjam« → izberi temo → »Nadaljuj«. Odpre se obrazec s trenerjevimi podatki.

**Opaženo:** štiri polja so na zaslonu (zadnje, »E-pošta«, sega do 666. pike), gumb »Shrani in
nadaljuj« pa se začne pri 676. piki in je visok 48, torej je vidna le njegova zgornja robna črta.
Stran se ne premika (`scrollHeight` telesa je enak višini zaslona), premika se notranji del
`.app-splash`; ko se ta premakne za 69 pik, je gumb cel na zaslonu. Torej je dosegljiv, a ob odprtju
zaslon izgleda končan.

**Težava in vpliv:** to je prvi zaslon, ki ga vidi vsak nov trener, in edini gumb na njem je videti,
kot da ga ni. Na manjšem telefonu trener najprej ne ve, kako naprej.

**Predlog:** gumb naj bo ob odprtju cel na zaslonu tudi pri 320 × 680, ali pa naj bo pritrjen na dno —
opaženo na različici `8b2ce80`.

**Presoja 2026-09-30 (Claude): čaka na Simona — nasprotuje zapisani odločitvi.** `logQuickSignal` v
[sessionQuickSignals.js](src/controllers/sessionQuickSignals.js) namerno označi vse serije vaje kot
opravljene, ko trener tapne signal: »signal na vaji pomeni, da je bila opravljena« (manj dotikov,
§48). Ugotovitev pravi, da tak zapis trdi delo, ki ga ni bilo. Obe branji sta mogoči; katero velja,
je Simonova odločitev. Opaženo ob tem: ponovni tap, ki signal umakne, pusti serije označene kot
opravljene, zato zapis po umiku ni tak kot pred tapom.

**Popravljeno 2026-09-30.** Na nizkem zaslonu (do 720 pik) se višina vzame znaku in ritmu, ne
besedilu, tako da je gumb ob odprtju cel na zaslonu; preizkušeno pri 320 × 680
(`tests/e2e/test_first_run_terms.py`).

### 80.99 [x] P2 — Kartica »Ta zaslon ni del demota« pokrije oba gumba zaslona, na katerem stoji — popravljeno 2026-09-30

**Scenarij in koraki:** v poglavju »Sprejem treh novih strank« pridi do koraka 9 od 10, kjer kartica
pravi »Pritisni Shrani na dnu obrazca«. Namesto tega tapni »Prekliči«.

**Opaženo:** kartica se preseli na vrh zaslona (od 69. do 277. pike navpično) in pravi »Ta zaslon ni
del demota. Demo se odvija drugje v aplikaciji. Pritisni Nazaj v demo ali Ustavi demo.« Zaslon je pri
tem »Imenik strank«, torej prav tisti, na katerem se poglavje dogaja. Gumba »Povabi stranko« (pri 75.
piki, visok 62) in »Dodaj stranko« (pri 76. piki, visok 60) sta v celoti pod kartico: `elementFromPoint`
na sredini obeh vrne kartico, ne gumba. Izhod obstaja — »Nazaj v demo« pri meni deluje in obrazec
ponovno odpre, tako da se ogled nadaljuje.

**Težava in vpliv:** trener, ki je prekinil korak, dobi dvoje hkrati: trditev, da je na napačnem
zaslonu, čeprav je na pravem, in kartico, ki mu zakrije edina dva gumba tega zaslona. Če se hoče
lotiti svojega dela, ne more, ker se gumba ne odzoveta na dotik.

**Predlog:** kartica naj ne pokriva kontrol zaslona (naj se postavi pod nje ali ob rob), in stavka o
napačnem zaslonu naj ne izpiše, kadar je trener na zaslonu, kjer korak teče — opaženo na različici
`8b2ce80`.

**Popravljeno 2026-09-30, z eno pridržano točko.** Kartica ob odstopu zdaj ne trdi več, da je
trener na napačnem zaslonu — to je bilo neresnično prav v izmerjenem primeru, ko je bil na pravem in
je le prekinil korak. Novo besedilo v vseh treh jezikih pove, kaj se je zgodilo in kaj storita gumba,
ki sta na kartici: »Ogled čaka. Zadnje dejanje ni bilo korak ogleda. Z »Nazaj v demo« nadaljuješ tam,
kjer si bil, s »Končaj demo« ga končaš.« (Staro besedilo je imenovalo »Ustavi demo«, gumba s tem
napisom pa ni.) Postavitev: ob odstopu se kartica usede na dno, po istem pravilu, ki ga že ima obroč —
nihče ni na nič usmerjen, torej se ni čemu umikati; presoja o odstopu se zdaj zgodi pred postavitvijo,
ne za njo. **Ta polovica gre brez lastne preverbe:** stanje, v katerem je napaka vidna (korak, čigar
kontrola je nizko v oknu, nato zaprto okno), se v štiristopenjskem ogledu, ki ga test lahko odpelje,
ne pojavi, in izsiliti ga v poglavju zgodbe je delo zase. Preizkušeno je z roko na objavljeni
različici.

### 80.100 [x] P2 — Berljiv izvoz podatkov za stranko meša prihodnje termine z opravljenimi, je delno angleški, in pogreša obljubljeno spremembo načrta — popravljeno 2026-09-30

**Scenarij in koraki:** »Imenik strank« → stranka z zgodovino (John Smith) → »Izvozi podatke (GDPR)«.
Okno pove: »Opravljeni treningi: 1, termini: 6, spremembe plana: 1.« Tapni »Berljiva kopija«.

**Opaženo:** datoteka je dolga 2047 znakov in ima troje:
1. Razdelek »## Treningi (6)« našteje termine brez oznake, kateri so bili in kateri bodo: med njimi
   sta 2026-10-01 in 2026-10-04, ki sta v prihodnosti. Vrstni red ni po datumu (09-29, 10-01, 09-29,
   10-04, 09-24, 09-29).
2. Signali s treninga so angleški: »Povratna informacija (Joint Pain / Discomfort): Rahlo ščipanje v
   desni rami« in »Povratna informacija (Completed reps easily): Odlična povezava z mišico«. Vse
   drugo v datoteki je slovensko.
3. Obljubljene »spremembe plana: 1« v datoteki ni: beseda »plan« ali »sprememb« se v njej ne pojavi
   nikjer.

**Težava in vpliv:** to je dokument, ki ga trener izroči stranki na njeno zahtevo po GDPR, in dokazuje
tudi, kaj je bilo opravljeno. Stranka bere seznam šestih treningov kot opravljene, čeprav dva še
nista bila. Tuji jezik sredi dokumenta zmanjša zaupanje v pravilnost, manjkajoči del pa pomeni, da
izvoz ne vsebuje vsega, kar okno obljubi.

**Predlog:** seznam naj loči opravljene od načrtovanih in naj bo urejen po datumu; signali naj bodo v
jeziku dokumenta; obljubljena sprememba načrta naj bo v datoteki ali pa naj je okno ne šteje —
opaženo na različici `8b2ce80`.

**Popravljeno 2026-09-30.** Troje: seznam terminov je urejen po datumu in vsaka vrstica pove,
ali je bil trening opravljen ali je načrtovan; signali s treninga so zapisani v jeziku dokumenta
(mapiranje oznake je domenino, zato se v plast `data` vbrizga — `feedbackTagTextFor`); obljubljene
spremembe programa imajo zdaj svoj razdelek, ker jih je okno štelo, datoteka pa jih ni imela.
Preizkušeno v `tests/unit_js/data/clientDataExport.test.mjs`.

### 80.101 [x] P2 — Izbrisana stranka ima še vedno cel zaslon stranke in ponuja izvoz svojih podatkov — popravljeno 2026-09-30

**Scenarij in koraki:** »Imenik strank« → stranka z zgodovino → »Izbriši stranko (GDPR)« → v polje
vpiši »IZBRIŠI« → »Izbriši dokončno«. Nato to stranko odpri znova iz imenika.

**Opaženo:** zaslon pravi »Client #BYDL7Y« in »Izbrisano 2026-09-30 na zahtevo stranke. Spodnji zapisi
treningov so anonimni.« Pod tem so isti gumbi kot pri živi stranki: »Uredi profil«, »Načrtuj
program«, »Anonimna kopija za AI«, »Izvozi podatke (GDPR)« in »Izbriši stranko (GDPR)«. Dotik na
»Izvozi podatke (GDPR)« odpre okno »Izvozi podatke te stranke — Client #BYDL7Y … Opravljeni treningi:
3, termini: 6, spremembe plana: 1«. Izbrisana oseba ostane tudi v imeniku strank in v obvestilu
»Treningi, ki čakajo na pregled«: »Client #BYDL7Y — Skupinska moč in kondicija (1)«. Oznaka »Client
#BYDL7Y« je angleška, aplikacija pa je slovenska.

**Težava in vpliv:** trener po izbrisu na zahtevo stranke še vedno vidi vrstico v imeniku in nalogo v
pregledu, ki ju ne more zapreti, ker za njima ni več osebe. Aplikacija mu ponudi, da izvozi podatke
osebe, ki je bila izbrisana — komu naj jih izroči, ni jasno, privolitve pa ni več. »Načrtuj program«
za izbrisano osebo je v isti vrsti.

**Predlog:** po izbrisu naj zaslon ponudi samo pogled na anonimne zapise; »Uredi profil«, »Načrtuj
program«, »Anonimna kopija za AI« in »Izvozi podatke (GDPR)« naj izginejo, oznaka pa naj bo slovenska
(»Stranka #BYDL7Y«). Vrstica v imeniku in naloga v pregledu naj bosta označeni kot izbrisani ali
odstranjeni — opaženo na različici `8b2ce80`.

**Popravljeno 2026-09-30 za dejanja, ne za oznako.** Po izbrisu zaslon ponudi samo branje:
»Uredi profil« in vrstica z dejanji (»Načrtuj program«, »Anonimna kopija za AI«, »Izvozi podatke
(GDPR)«, »Izbriši stranko (GDPR)«) izginejo, anonimna zgodovina ostane, ker je prav ona tisto, kar
izbris namerno obdrži (`tests/medium/test_client_data_rights.py`). **Odprto, čaka na Simona:** oznaka
»Client #BYDL7Y« je angleška, a ni besedilo vmesnika — je shranjena v zapisu in gre v sinhronizacijo
in v izvoz, zato je njena sprememba odločitev o podatkih (ali sme shranjena oznaka nositi jezik), ne
popravek besedila.

### 80.102 [x] P2 — Preklic privolitve nima polja za datum in ne pove, kaj se z njim ustavi — popravljeno 2026-09-30

**Scenarij in koraki:** »Imenik strank« → stranka → »Uredi profil«. Obkljukaj »Stranka je podpisala
privolitev (hramba podatkov in sinhronizacija v oblak)«, v polje »Datum podpisa« vpiši pretekli datum
2026-06-15 in shrani. Nato znova odpri »Uredi profil«, kljukico odstrani in shrani.

**Opaženo:** troje.
1. Ko kljukico odstraniš, polje za datum izgine in drugega polja ni. Datum preklica aplikacija zapiše
   sama, na dan dotika: zaslon pravi »Privolitev preklicana (2026-06-15 → 2026-09-30)«. Stranka, ki je
   privolitev preklicala prejšnji teden, dobi današnji datum.
2. Puščica med datumoma ni pojasnjena. Nikjer ne piše, da je prvi datum podpis in drugi preklic.
3. Po shranitvi se na zaslonu stranke ne spremeni nič drugega: nobenega opozorila, kaj se je s
   preklicem ustavilo. Razdelek se imenuje »PRIVOLITEV GDPR ZA SINHRONIZACIJO V OBLAK«, o
   sinhronizaciji po preklicu pa ni besede. Edino navodilo je v majhnem pojasnilu »Kdo hrani obrazec?«:
   »Če stranka privolitev prekliče, tukaj izbriši njene zapise in preklic zabeleži na svojem izvodu.«

**Težava in vpliv:** preklic je datum, ki šteje — od njega naprej obdelava ni več dovoljena. Trener ga
ne more vpisati, zato je zapis napačen pri vsaki stranki, ki ne prekliče ravno tisti dan, ko trener
sedi pri telefonu. In ker aplikacija ne pove, kaj se je ustavilo, trener misli, da je s kljukico
opravil vse.

**Predlog:** ob odstranitvi kljukice naj se pokaže polje »Datum preklica« s privzetim današnjim
datumom; zaslon naj obe datuma poimenuje z besedami; in naj z eno vrstico pove, kaj se s preklicem
ustavi — opaženo na različici `8b2ce80`.

Ob tem opažena manjša neskladnost na istem zaslonu: pri podpisu z datumom 2026-06-15 zaslon pravi
»Privolitev dana (2026-06-15 · v2026-08-09)«, torej pripiše različico obrazca iz avgusta podpisu iz
junija.

**Popravljeno 2026-09-30 za datum in za besede.** Ob odstranitvi kljukice se zdaj pokaže polje
»Datum preklica«, prednastavljeno na danes in popravljivo; presoja teče po privolitvi, kakršna je bila
ob odprtju obrazca, ker obrazec piše v zapis že ob dogodku `input`, torej pred `change`
(`tests/medium/test_client_consent.py`). Značka na zaslonu stranke oba datuma poimenuje z besedami
namesto s puščico: »Datum podpisa: … · Datum preklica: …«. **Odprto:** kaj se s preklicem ustavi, na
zaslonu še ni povedano — to je besedilo, ki ga je treba napisati skupaj z odločitvijo, kaj se z
preklicem res zgodi (sinhronizacija, izvozi).

### 80.104 [x] P2 — Izbrisana serija pusti za sabo programe brez datuma, ki jih ni mogoče razločiti — popravljeno 2026-09-30

**Scenarij in koraki:** ustvari tedensko serijo s stranko (šest večerov), nato izbriši vse njene
večere enega za drugim (kartica → svinčnik → »Odpri v beležki« → ⋮ »Možnosti treninga« → »Izbriši
trening«). Nato poglej predal z obvestili.

**Opaženo:** urnik je prazen, predal pa pravi: »Nenačrtovani programi — 7 programov je pripravljenih,
a še niso dodeljeni treningu«, in pod tem sedemkrat isto vrstico »Jutranja serija · Sarah Jenkins«.
Vrstice nimajo datuma in se med sabo ne razlikujejo v ničemer. Ostanejo tudi po osvežitvi strani. (Da
se dajo odstraniti, nisem našel; poti nisem izčrpal, zato tega ne trdim.)

**Težava in vpliv:** trener, ki odpove tečaj, ima potem v predalu sedem enakih opravil, ki jih ne more
ne razločiti ne zapreti. Predal je mesto, kjer bere, kaj ga čaka, zato ga sedem praznih vrstic zmoti
pri vsakem pogledu.

**Predlog:** ko se izbriše večer serije, naj njegov program ne ostane med nenačrtovanimi, ali pa naj
vrstica nosi datum večera, iz katerega je prišla, in pot, po kateri se odstrani — opaženo na različici
`8b2ce80`.

**Popravljeno 2026-09-30 za razločevanje, ne za odstranitev.** Vrstica nenačrtovanega programa
zdaj nosi dan, za katerega je bil pripravljen, tako da sedem vrstic ene odpovedane serije ni več
enakih (`buildUnscheduledPlansItem` v `src/domain/notificationItems.js`, preizkušeno v
`tests/unit_js/domain/notificationItems.test.mjs`). **Odprto:** poti, po kateri trener nenačrtovan
program odstrani, ni; ali naj obstaja in kje, je odločitev zase — program se namerno ohrani, ko se
termin izbriše (to pove okno za brisanje).

### 80.95 [x] P1 — Dotik »Pretežko« zapiše vajo kot opravljeno z vsemi načrtovanimi serijami — popravljeno 2026-09-30

**Scenarij in koraki:** odpri podlogo treninga (»Ponedeljkova moc«, stranka Jane Doe, rutina »Zgornji
del A«), tapni »Začni trening« in »Ohrani urnik«. Odpri sklop »Sklop za moč prsi in hrbta«. Pri vaji
Barbell Bench Press tapni samo »Pretežko«. Ne zaključuj nobenega kroga in ne vpiši nobene serije.
Tapni »Zaključi vadbo« in »Zaključi zdaj«.

**Opaženo:** shranjeni zapis vadbe pravi »Barbell Bench Press: opravljeno, 3/3 serije«, vse tri z
načrtovano težo 62.5 kg. Vse druge vaje istega treninga so pravilno »0/3, preskočeno«. Isto se pokaže
na zaslonu stranke: »Barbell Back Squat: 80 kg×5, 80 kg×5, 80 kg×5, 80 kg×5« pri vaji, kjer je bil
tapnjen samo »Pretežko«, medtem ko ostale pišejo »PRESKOČENO«. Po dotiku na »Pretežko« na podlogi ni
nobenega sporočila, da je bilo kaj zapisano.

**Težava in vpliv:** »Pretežko« je gumb, s katerim trener pove, da je bilo breme previsoko — pogosto
prav zato, ker je stranka serijo predčasno prekinila. Aplikacija iz tega naredi zapis, da je vajo
opravila v celoti, z bremenom, ki ga ni zmogla. Ta zapis je potem zgodovina stranke in številka
»Zadnjič«, po kateri trener naslednjič nastavi težo. Zapis je bil napačen v shrambi, ne le na zaslonu.

**Popravljeno 2026-09-30, a ožje od prvotnega predloga** (»naj zapišeta samo signal, nobene serije«).
Tak popravek bi odvzel edini način, da se samostojna vaja zapiše kot opravljena: taka vaja svoje
kljukice nima, njene serije se odštevajo prav s tem, da se trener nanje odzove. Zato popravek deli
signale: »Prelahko« in »Completed reps easily« sta izjavi, da so ponovitve bile, in serije še naprej
zapišeta; »Pretežko«, bolečina in prekinjena tehnika pa ne, ker na tleh pomenijo prav nasprotno.
Pravilo živi pri signalih (`src/domain/feedbackTags.js`, `tagImpliesPerformed`), uporablja ga
`src/controllers/sessionQuickSignals.js`, obljuba je preizkušena v obe smeri
(`tests/medium/test_clipboard_quick_signals.py`). Odprto ostaja globlje vprašanje: kako se samostojna
vaja označi kot opravljena, ko trener ne da nobenega signala.

### 80.103 [x] P1 — Odprtje in zapiranje enega večera serije ustvari drugo, enako kartico istega večera — popravljeno 2026-09-30

**Scenarij in koraki:** »Ustvari trening«: ime »Jutranja vaja«, datum 2026-10-05, 07:15 - 08:15,
stranka Sarah Jenkins, obkljukaj »PONOVI VSAK TEDEN«, v »DO (NEOBVEZNO)« vpiši 2026-10-19, »Shrani«,
nato »Končano« v oknu za vabila. Seznam pokaže tri ponedeljke: 5., 12. in 19. oktober. Zdaj na kartici
12. oktobra tapni svinčnik, v obrazcu tapni »Zavrzi spremembe«, isto kartico odpri še enkrat s
svinčnikom in tapni »Odpri v beležki«.

**Opaženo:** kartic je zdaj štiri. Pri 12. oktobru sta dve enaki: obe »07:15 - 08:15 Jutranja vaja
1/1 mest zasedenih«, obe visoki 102 pike. Ostaneta tudi po osvežitvi strani. Naslov podloge, ki se je
odprla, nosi drug id treninga kot tisti, ki je bil urejan.

**Težava in vpliv:** trener pogleda v termin serije in ga zapre, ne da bi kaj spremenil, pa ima v
urniku dva treninga isto uro. Stranka je na obeh, mesto je zasedeno dvakrat, in vsakega je treba
izbrisati posebej. Če na napačnem zabeleži vadbo, je zapis na terminu, ki ga ne bo pogledal.

**Popravljeno 2026-09-30.** Ploščica večer tapne z id-jem, ki ga je narisala, pri izpeljanem večeru
torej s ključem tega večera, zapis zanj pa dobi svoj id; vprašanje »ali je ta večer že zapisan« se je
postavljalo samo po id-ju in je zato vedno odgovorilo z ne. Zdaj na to odgovarja domena po večeru, ki
ga zapis zastopa (`storedOccurrenceFor` v `src/domain/sessionSeries.js`, preizkušeno v
`tests/unit_js/domain/sessionSeries.test.mjs`).

### 80.94 [x] P2 — V kartoteki stranke je signal s treninga še vedno angleški: »Too Hard - Reduce Load« — popravljeno 2026-09-30

**Scenarij in koraki:** na podlogi pri vaji tapni »Pretežko«, nato »Dodaj opombo«, izberi »Pretežko –
zmanjšaj težo«, vpiši opombo (»SIM pretežko pri 4. seriji«), obkljukaj shranjevanje v kartoteko in
tapni »Zapiši opozorilo«. Nato odpri »Imenik strank« → stranko → razdelek OPOMBE.

**Opaženo:** vrstica se glasi »2026-09-30 — Barbell Back Squat: Too Hard - Reduce Load - SIM pretežko
pri 4. seriji«. Na zaslonu »Čakajoče na pregled« je isti signal slovenski: »Pretežko – zmanjšaj
težo«. Angleška oblika je torej ostala samo v kartoteki.

**Težava in vpliv:** kartoteka je tisto, kar trener prebere pred naslednjim treningom s to stranko.
Vrstica, ki jo je zapisala aplikacija sama, je tam v tujem jeziku, pomešana s slovensko opombo, ki jo
je napisal trener.

**Predlog:** v kartoteko naj se zapiše isto besedilo kot na zaslonu za pregled — opaženo na različici
`8b2ce80`. Isti napis je bil na zaslonu za pregled popravljen z §80.26 (2026-09-27), v kartoteki pa
ne.

### 7.2 [x] Feedback button must show its own state — toggled, and "notes exist" — note mark drawn and tested 2026-09-30

**Raised 2026-07-26 (Simon).** The three signal buttons on a deck card
([exerciseCard.js](src/modules/clipboard/exerciseCard.js)) and the `.circuit-sig` trio look identical
before and after use, so a PT who tapped *Too Hard* taps again and logs a second signal.

Three things the control must express, and they are not the same signal:

1. **Toggled on** — a filled/active **background**, not a colour tweak: it must read at arm's length
   on a bright gym floor.
2. **Icon changes with state** — outline for available, solid for set, so the meaning survives for a
   colour-blind PT and in sunlit greyscale. Colour alone is not a state indicator.
3. **Notes present** — a *separate* mark for "a written/voice note is attached here", independent of
   any signal. A card can have either, both or neither.

- **[x] Toggling off already cleared the stored feedback** — `removeQuickSignal` drops the ids from
  BOTH `activeSession.feedback` and `state.planUpdates`, and only ever touches *plain* taps, so
  something the trainer wrote is never deleted by a toggle aimed at a tag. Nothing to decide.
- **[x] The notes lookup** is `hasExerciseNote` in [quickSignals.js](src/domain/quickSignals.js),
  written as the exact inverse of `isPlainQuickSignal` rather than as its own condition, so "safe to
  un-tap" and "has a note worth marking" cannot disagree about the same entry.
- **[x] Standalone cards and circuit member rows agree** — same lookups, same glyph swap, same mark.

**[x] Shipped 2026-08-15**, with one item's requirement met differently than written:

- **Point 1 (filled background) was already there** for Too Easy / Too Hard.
- **Point 2 (icon changes with state) could NOT be done as specified.** "Outline for available,
  solid for set" needs Font Awesome's *regular* weight, and that face was deliberately deleted from
  [fontawesome.css](src/fonts/fontawesome.css) on 2026-08-06 to save 29KB — on the then-true grounds
  that nothing used it. An `fa-regular` class today still matches the stylesheet and silently
  renders **solid**, so the two states would look identical, and `icon_coverage.py` cannot catch it
  because it checks glyph renderability, not weight availability. The intent — a state cue that
  survives greyscale and colour-blindness — is met with a different SOLID glyph instead
  (`fa-circle-check` when set), which costs no payload and does not reverse a measured decision.
- **Point 3 (notes mark) is a corner dot, not a fill**, because unlike the toggles the feedback
  button is not a toggle: tapping it opens the modal whether or not a note exists. Reusing the
  pressed fill would collapse two independent states into one.

**Still open**: the mark is rendered but only lightly covered — a medium-tier test mounting the deck
with a noted exercise would pin it against the real markup rather than the lookup alone.

### 80.87 [x] P2 — Napačna datoteka pri uvozu odgovori angleško: »Error: Invalid backup file format.« — popravljeno 2026-09-30

**Scenarij in koraki:** tapni gumb z oblakom v glavi → »Središče za sinhronizacijo in varnostne
kopije« → »Izberi JSON datoteko« in izberi datoteko, ki ni varnostna kopija. Preizkušeno z besedilno
datoteko (nakupovalni seznam) in z datoteko JSON, ki ni kopija (`{"seznam":["kruh","mleko"]}`).

**Opaženo:** v obeh primerih se v oknu izpiše »Error: Invalid backup file format.« Vse ostalo v tem
oknu je slovensko. Sporočilo ne pove, katero datoteko aplikacija pričakuje, ne kako jo trener dobi,
in ne, da se na napravi ni nič spremenilo. Pri pravi kopiji z napačnim geslom je isti korak slovenski
in pomirjujoč: »Napačno geslo ali spremenjena datoteka. Na tej napravi se ni nič spremenilo.«

**Težava in vpliv:** trener, ki išče svojo kopijo med datotekami na telefonu, prvič skoraj zagotovo
izbere napačno. Dobi angleško besedo »Error« in ne ve, ali je pokvaril svoje podatke, ne kaj naj
izbere.

**Predlog:** sporočilo naj bo slovensko, naj pove, da se ni nič spremenilo, in naj imenuje datoteko,
ki jo aplikacija pričakuje (tisto, ki jo je sama naredila z »Izvozi JSON«) — opaženo na različici
`8b2ce80`.

### 80.89 [x] P2 — Po čiščenju vzorčnih podatkov vrstica na dnu še vodi v izbrisani vzorčni trening — popravljeno 2026-09-30

**Scenarij in koraki:** svež zagon z vzorčnimi podatki, predal na dnu → »Počisti podatke in zapusti
predstavitveni način« → »Odstrani«. Nato poglej vrstico na dnu zaslona in jo tapni.

**Opaženo:** vrstica pravi »Skupinska moč in kondicija · 2 stranki · 00:00 - 02:00 · Zamuja 00h 09m«,
čeprav je čiščenje pravkar odstranilo vseh 20 vzorčnih terminov; v shrambi ni nobenega vzorčnega
treninga več, ostal je samo tisti, ki sem ga ustvaril sam. Dotik na vrstico odpre podlogo tega
izbrisanega treninga, v celoti delujočo: »Začni trening«, zavihek stranke Jane, opozorilo o poškodbi,
sklop »Dinamično ogrevanje«, časomer premora, »Prelahko«, »Pretežko«, »Dodaj opombo«.

**Težava in vpliv:** trener počisti vzorčne podatke, da začne z resničnim delom, na dnu pa mu ostane
vrstica, ki ga vabi v trening, ki ga ni. Če ga začne in vpiše serije, dela v termin, ki je izbrisan;
kaj se z zapisanim zgodi, ni videti nikjer.

**Predlog:** čiščenje naj zapre tekočo podlogo in odstrani vrstico na dnu — opaženo na različici
`8b2ce80`.

### 80.82 [x] P2 — Odprt in zaprt urejevalnik načrta pobriše oznako »Zaključeno« z opravljenega sklopa — popravljeno 2026-09-30 z 5ea4ada

**Scenarij in koraki:** vzorčni podatki, skupinski trening »Skupinska moč in kondicija« (stranke
Jane, Sarah in ena dodana). Tapni kartico, »Začni trening«, v oknu »Trening se je začel izven
urnika« tapni »Ohrani urnik«. Na Janinem zavihku odpri sklop »Dinamično ogrevanje« (en krog) in
tapni »Zaključi sklop«; sklop pravi »Zaključeno«. Nato tapni ⋮ »Možnosti treninga« → »Uredi načrt«
in takoj »Končano z urejanjem načrta«, brez ene same spremembe.

**Opaženo:** sklop »Dinamično ogrevanje« ne piše več »Zaključeno«, ampak spet »KROG 1 / 1«, torej
neopravljeno. Shranjeni zapis vadbe je pri tem pravilen: v zgodovini je »Dinamično ogrevanje / Face
Pulls: opravljeno 1/1«. Izgubi se samo oznaka na zaslonu. Pri treningu z eno stranko in sklopom treh
krogov se to ni zgodilo — oznaka »Zaključeno« je ostala.

**Težava in vpliv:** trener popravi eno težo v načrtu in se vrne na podlogo, ki zdaj trdi, da
ogrevanje ni opravljeno. Sredi skupinskega treninga s tremi strankami si ne more zapomniti, kateri
sklop je pri kateri stranki že zaključil, zato ga ponovi ali pa ga izpusti.

**Predlog:** po zaprtju urejevalnika naj podloga pokaže isto stanje, kot ga ima zapis, torej
»Zaključeno« — opaženo na različici `8b2ce80`.

**Vzrok in stanje 2026-09-30 (Claude):** popravljeno že z `5ea4ada` (§80.74). »Dinamično ogrevanje«
vsebuje Walking Lunges, ki je v tej rutini dvakrat; obe pojavitvi sta imeli en zapis serij, in izhod
iz urejevalnika je ta zapis prilagodil na tri serije glavnega sklopa, zato ogrevanje ni bilo več
zaključeno. Izmerjeno v brskalniku: s kodo pred `5ea4ada` je po urejevalniku »Round 1 / 1«, s kodo
po njem »Completed«. Pri eni stranki se ni zgodilo, ker tam vaja ni bila dvakrat.

Seja, ki dela na drevesu, poroča (2026-09-30, 01:30), da je to na `main` že popravljeno s `5ea4ada`
(popravek §80.74: Walking Lunges je bil v tej rutini dvakrat z enim skupnim zapisom serij, obhod
urejevalnika pa mu je spremenil velikost), in da na sedanjem drevesu ogrevanje po urejevalniku ostane
»Zaključeno«. Tega nisem preveril sam — objavljena `8b2ce80` je za `main` približno dvajset commitov.

### 80.83 [x] P1 — Treninga, ki se konča po polnoči, ni mogoče niti vpisati niti urediti — popravljeno 2026-09-30

**Scenarij in koraki:** dvoje, oboje ponovljeno.
1. »Ustvari trening«: ime »Pozna skupina«, datum 2026-10-02, začetek 21:00, konec 00:30, »Shrani«.
2. Vzorčni trening »Vrnitev po poškodbi«, 23:00 - 01:00: tapni svinčnik na kartici in takoj
   »Shrani«, brez ene same spremembe.

**Opaženo:** v obeh primerih se obrazec ne zapre. Med poljema za čas se izpiše: »Trening se konča,
preden se začne. Preveri uro konca.« Vpisani konec 00:30 oziroma 01:00 je torej prebran kot čas pred
začetkom istega dne, ne kot čas naslednjega jutra. Sporočilo ne pove, da je težava v prehodu čez
polnoč, in ne ponudi izhoda.

**Težava in vpliv:** večerna skupina, ki se konča ob 00:30, je običajen termin, in vpisati je ni
mogoče. Še huje pri obstoječih: vzorčni podatki sami vsebujeta dva taka treninga (»Skupinska moč in
kondicija« in »Vrnitev po poškodbi«, oba 23:00 - 01:00), pri katerih trener ne more dodati stranke,
je odstraniti, popraviti kraja ali imena, dokler ne zlaže ure konca (z 23:59 se shrani). Preverba, ki
to ustavi, je prišla z §80.48, kjer se je trening s koncem pred začetkom shranil brez besede.

**Predlog:** konec, ki je manjši od začetka, naj se bere kot naslednji dan, dokler trening ni daljši
od nekega razuma (recimo 12 ur); nad tem naj bo vprašanje, ne zavrnitev — opaženo na različici
`8b2ce80`.

### 80.84 [x] P1 — Nedokončan nov trening se prilepi na urejanje drugega treninga in ga pri shranjevanju povozi — popravljeno 2026-09-30

**Scenarij in koraki:**
1. Na plošči tapni »Ustvari trening«. Vpiši IME TRENINGA »Osnutek C«, DATUM 2026-10-05, ZAČETNI ČAS
   07:00, KONČNI ČAS 08:00 in dodaj stranko »Tom Walker«. Ne shrani. Zapusti obrazec tako, kot ga
   trener zapusti, ko ga kdo pokliče: ☰ → »Termini treningov« (enako se zgodi po osvežitvi strani).
2. V seznamu odpri za urejanje **drug** trening: svinčnik na kartici »Jutranja kondicija«,
   2026-10-01, 09:00 - 10:00, »1/3 mest zasedenih«, stranka Jane Doe, rutina »Metabolna kondicija v
   trojkah«.
3. Tapni »Shrani«.

**Opaženo:** obrazec, ki se odpre v 2. koraku, ni trening s kartice. V njem je »Osnutek C«,
2026-10-05, 07:00 - 08:00 in »Izbrani: 1 Tom Walker«. Naslov je vseeno naslov urejanega treninga
(`session/setup/s04f2e3d`). Po »Shrani« se odpre okno »Pošlji vabila v koledar« s Tomom Walkerjem, in
zapis treninga »Jutranja kondicija« je zdaj: naslov »Osnutek C«, čas 07:00 - 08:00, datum
2026-10-05, udeleženec Tom Walker, rutina »Zgornji del A«, mest 1, kraj prazen. Jane Doe na treningu
ni več in treninga 1. oktobra ob 09:00 ni več. Vprašanja pred tem ni bilo nobenega.

**Težava in vpliv:** trener začne vpisovati nov termin, nekdo ga pokliče, obrazec pusti. Ko se vrne in
odpre povsem drug trening, da bi mu dodal stranko, izgubi tisti trening: ime, dan, uro, rutino in
stranko, ki je bila nanj vpisana. Stranka ostane brez termina, trener pa o tem ne izve nič, ker vse
skupaj izgleda kot uspešno shranjevanje. Osnutek, ki se ohrani, je Simonovo pravilo (2026-09-17: samo
»Prekliči« zavrže); napaka je, da se ohrani osnutek *novega* treninga v obrazcu *obstoječega*.

**Predlog:** osnutek naj se vrne samo v obrazec, v katerem je nastal (nov trening k »Ustvari
trening«, obstoječi k svojemu naslovu). Obrazec obstoječega treninga naj vedno pokaže ta trening —
opaženo na različici `8b2ce80`.

### 80.85 [x] P2 — V skupnem načrtu je opozorilo o poškodbi ene stranke prikazano brez imena — popravljeno 2026-09-30

**Scenarij in koraki:** vzorčni podatki, skupinski trening »Skupinska moč in kondicija« s tremi
strankami (Jane, Sarah in ena dodana). Odpri podlogo in tapni ⋮ »Možnosti treninga« → »Vsi na ta
načrt«.

**Opaženo:** zavihki strank se združijo v enega z napisom »Skupaj JD · SL · SJ«. Takoj pod njim je
opozorilo »Rahla napetost v levi rami pri dvigih nad glavo« in vrstice »Zadnjič: 2026-09-30 | Face
Pulls | Lvl 5 x 10 ponovitev (lahko)«. Oboje je Janino — na ločenih zavihkih se to pokaže na njenem.
V skupnem pogledu ni nikjer napisano, čigavo je, opozoril in zgodovine drugih dveh strank pa ni.

**Težava in vpliv:** trener, ki vodi tri ljudi po istem načrtu, prebere eno opozorilo o poškodbi brez
imena. Lahko ga upošteva pri napačni osebi ali pa spregleda omejitev pri tistih dveh, katerih
opozorila niso prikazana. Prav zato, da bi jih prebral hitro, je vse tri dal na skupen načrt.

**Predlog:** v skupnem pogledu naj bo pri opozorilu in pri vrstici »Zadnjič« napisano ime stranke, in
naj bosta prikazani za vse stranke na treningu — opaženo na različici `8b2ce80`.

### 1.2 [x] Simultaneous sessions merged into one clipboard: multi-line titles + per-participant tags — dots shipped 2026-09-30

Overlapping same-day sessions **already merge** into one clipboard (`getOverlappingSessions` /
`launchClipboardDirectly`). What is missing is the visual separation of who belongs to which
programme. Relates to [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md).

- **The data gap**: `buildSessionMeta` already carries a deduplicated `titles`/`ids` list, but the
  merge loop builds a flat `clientId → routineId` map with no record of the source session. Needs a
  parallel `clientId → sourceSessionId` threaded into `clientRoutines`.
- **Decided — where the tag shows**: stacked title lines in the session title bar
  (`components/sessionTitleBar.js`), *not* the participant tabs (already tight on space). Each line
  gets a subtle colour dot repeated next to the matching participant tab, so the pairing is
  glanceable without reading. `renderSessionTitle()` shows only `titles[0]` today, so this is new UI.
- **Decided — de-duplication**: identical titles collapse to one line, not repeated ones.

### 80.77 [x] P2 — Po polnoči obrazec »Nastavitev treninga« privzame včerajšnji datum — popravljeno 2026-09-30

**Scenarij in koraki:** ob 00:38 dne 2026-09-30 odpri aplikacijo (`?lang=sl&init=demo_data_load`),
tapni »Ustvari trening«. Enako se zgodi ob neposrednem odprtju naslova `session/new`.

**Opaženo:** polje DATUM pokaže `2026-09-29`, ZAČETNI ČAS pa `01:00`. Nobeden od čipov nad poljem
(»danes«, »jutri«, »pet. 2.«, »sob. 3.«) ni izbran, čeprav so ti čipi šteti od pravega današnjega
dne. Isti zaslon v seznamu treningov piše »sreda 2026-09-30 DANES«, seznam »Termini treningov« pa se
odpre na naslovu `/sessions/2026-09-30`. Torej aplikacija v isti minuti na enem mestu ve, da je
danes 30. september, na obrazcu pa ponudi 29. september.

**Težava in vpliv:** trener, ki po polnoči vpiše naslednji trening in datuma ne popravi, ga shrani
na včerajšnji dan ob 01:00, torej skoraj cel dan v preteklost. Tak trening se uvrsti med pretekle in
ne v seznam, kjer ga trener pričakuje. Pozno načrtovanje po zaključku večernih treningov je ravno
tisti čas, ko trener to dela.

**Predlog:** obrazec naj privzame isti dan, kot ga aplikacija na plošči označi z »DANES«, in naj bo
čip »danes« pri odprtju izbran — opaženo na različici `8b2ce80`.

### 80.79 [x] P2 — Kartica treninga brez udeležencev se na dotik ne odzove, noter vodi le svinčnik — popravljeno 2026-09-30

**Scenarij in koraki:** na plošči (vzorčni podatki) tapni kartico »Prost termin (brez najave)«,
danes 04:00 - 05:00, ki pravi »0/3 mest zasedenih« in »Ni udeležencev«. Tapni jo dvakrat, na naslov
in na telo kartice.

**Opaženo:** nič. Naslov se ne spremeni, podloga se ne odpre, okna ni, sporočila ni, v dnevniku
konzole ni napake. Kartica treninga z udeleženci (»Hitri HIIT za trup«) se na isti dotik odpre v
podlogo. Edina pot v tak termin je ikona svinčnika v desnem zgornjem kotu kartice, ki meri 38 × 38
pik in nima napisane oznake (pomožno ime je »Uredi«); ta odpre »Nastavitev treninga«, kjer se stranka
doda.

**Težava in vpliv:** ko pride stranka brez najave, trener tapne prosti termin, da jo vpiše. Dotik ne
naredi nič in trener ne ve, ali je bil zaznan, zato tapne znova. Da bi našel svinčnik, mora zapustiti
prvo domnevo.

**Predlog:** dotik na kartico brez udeležencev naj odpre isti zaslon kot svinčnik, torej
»Nastavitev treninga« — opaženo na različici `8b2ce80`.

### 80.80 [x] P1 — Vrstica »Zadnjič« na podlogi pokaže tudi serije, ki jih stranka ni naredila — popravljeno 2026-09-30

**Scenarij in koraki:** vzorčni podatki, stranka Sarah Jenkins. Odpri današnji trening »Hitri HIIT
za trup«, tapni »Začni trening«, potrdi »Prilagodi čas«. Odpri prvi sklop »Krog za moč nog« in ga
odpelji do konca (»Zaključi krog 1 / 3«, »Zaključi krog 2 / 3«, »Zaključi krog 3 / 3«, »Zaključi
sklop«). Drugega sklopa »Trojka za hipertrofijo in trup« (Leg Press, Plank, Hanging Knee Raise) se
ne dotakni. Tapni »Zaključi vadbo« in »Zaključi zdaj«. Nato odpri naslednji trening iste stranke in
poglej podlogo.

**Opaženo:** podloga na vrhu pravi »Zadnjič: 2026-09-30« in pod tem: »Leg Press 140 kg x 12, 140 kg
x 12, 140 kg x 12«, »Plank BW x 45, BW x 45, BW x 45«, »Hanging Knee Raise BW x 15, BW x 15, BW x
15«. Nobene od teh serij ni bilo. Zaslon stranke (Imenik strank → Sarah Jenkins → ZGODOVINA
ZABELEŽENIH VADB) iste vaje pravilno označi z »Leg Press PRESKOČENO«, »Plank PRESKOČENO«, »Hanging
Knee Raise PRESKOČENO«, in shranjeni zapis ima pri vsaki od teh serij `completed: false`. Napačna je
torej samo vrstica »Zadnjič« na podlogi.

**Težava in vpliv:** »Zadnjič« je številka, po kateri trener nastavi težo za današnjo serijo. Če
piše, da je stranka prejšnjič trikrat naredila 140 kg, ji trener naloži 140 kg ali več, čeprav te
vaje sploh ni delala. Trening, ki ga je trener predčasno zaključil (stranka je morala prej oditi, se
je poškodovala), se tako naslednjič bere kot opravljen v celoti.

**Predlog:** »Zadnjič« naj šteje samo serije z `completed: true`, preskočene vaje pa naj označi
enako kot zaslon stranke, torej »PRESKOČENO« — opaženo na različici `8b2ce80`.

### 80.74 [x] P2 — Vaja, ki je v rutini dvakrat, si deli zapis serij — popravljeno 2026-09-30

**Scenarij in koraki:** peskovnik, lokalni strežnik (`main` na `080ab10`), sl, 390 × 844. Odpreti
»Skupinska moč in kondicija« in pri Jane zaključiti »Dinamično ogrevanje« (en krog: Face Pulls,
Walking Lunges).

**Opaženo:** Walking Lunges je v isti rutini dvakrat — v ogrevanju (1 krog) in v »Metabolni krog v
trojkah« (3 krogi). Obe postavki imata isti id (`e38c4d5e`), ker postavka rutine dobi id vaje iz
kataloga (`populateClientStateExercisesFromRoutine` v
[sessionPlanFactory.js](src/domain/sessionPlanFactory.js)). Zapis serij je en sam, zato druga postavka
prepiše prvo (tri serije namesto ene), zaključek ogrevanja pa šteje v metabolični krog. Krožni sklopi
iz knjižnice to že rešujejo z lastnim id-jem za vsako pojavitev (`buildClientStateFromLibraryCircuit`).

**Težava in vpliv:** trener vidi napačno število opravljenih serij, zgodovina treninga ima eno vajo
namesto dveh. Pri rutinah z isto vajo v ogrevanju in glavnem delu je to pogosto.

**Predlog:** vsaka pojavitev dobi svoj id, vez na katalog pa ločeno polje, kot pri krožnih sklopih.
Dotakne se zgodovine (»Zadnjič«), fokusa v naslovu (`/exercise/<id>`) in prilagoditev načrta, zato
ni del hitrih popravkov. Najdeno pri raziskovalnem testiranju 2026-09-29.

### 39.4 [x] CHANGE — the invite dialog's two buttons — fixed 2026-09-30

**Reported at card 5:** *"button name nowhere to send it yet is way too confusing - could it be just a
disabled "send invite"? make the default action button on right (unify), not left"*.

The dialog offers `intake_invite_send_disabled` — *"Nowhere to send it yet"* — on an anchor styled as
the primary action ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js)). It reads as
a label for a thing that has gone wrong rather than as a button waiting for input, and it is the
first control on the row while the secondary sits to its right.

Two changes, and the second is a rule rather than a one-off: the primary keeps its own name while
disabled, and the primary action goes on the RIGHT everywhere a dialog has two.

### 88.1 [x] Iskanje v katalogu brez zadetka se konča, uvoz večjega kataloga pa obstaja — narejeno 2026-09-30

Dan 01: trenerka je za krožno vadbo iskala »kettlebell«, »burpee«, »box jump« — nič od tega ni med
48 vajami, in prazen seznam reče samo »No movements match this filter.«. Dan 02 potrdi z vajami brez opreme za
online trening: navadnega počepa s telesno težo, burpeeja in kettlebell swinga ni. Dan 03: za nosečo stranko ni stenskega
počepa ne vaje za medenično dno. Dan 04: za tekmovalca v powerliftingu ni ozkega potiska s prsi; vpisal ga je kot
lastno vajo, kar je delovalo. Aplikacija ima uvoz večjih
katalogov (`libraryImportDialog.js`) in dovoli vajo z lastnim imenom, a s praznega iskanja ne vodi do
nobenega. Trener, ki vaje ne najde, jo zapiše na papir. **Vrednost:** vsak nov trener naleti na to pri
prvem načrtu; vsaka vaja, zapisana mimo aplikacije, nima zgodovine. **Cena:** majhna — prazen seznam
ponudi »Dodaj kot novo vajo« z vpisanim imenom in »Uvozi večji katalog«. **Presoja: izplača se.**

### 80.75 [x] P3 — Vzorčni peskovnik obljublja trening, ki že poteka, a ga ni — popravljeno 2026-09-30

**Opaženo:** obvestilo »Raziskuješ z vzorčnimi podatki« pravi »vključno z enim treningom, ki že
poteka«. Odprt trening »Skupinska moč in kondicija« kaže »Začni trening«: vzorčna aktivna seja nima
`started: true` (`seedDemoActiveSession` v
[sessionsView.js](src/modules/sessionList/sessionsView.js)), tap kartice pa jo zgradi znova.
Lokalni strežnik, `main` na `080ab10`, sl.

**Predlog:** ali vzorčna seja res teče (in jo tap kartice ohrani), ali obvestilo tega ne obljublja.

### 45.7 [x] Finish "seja" → "trening", and settle on ONE form of address — finished 2026-09-30

**Reported:** the rename from *seja* (session) to *trening* (training) is not consistent, worst of all
where a new session is planned.

**Confirmed.** The rename was started and left half-done — its reasoning is recorded in the
translation file itself ([sl.js](src/i18n/sl.js)): *seja* in Slovenian reads first as a meeting, while
*trening* is the word a trainer and a client actually use. Above that comment sit roughly twenty
strings still saying *seja*, including "Nastavitev seje vadbe" and "Ime seje" — the new-session
screen the trainer named.

**A second inconsistency, not reported but worse in use:** the Slovenian text switches between the
formal and the familiar form of address. "Nastavite podrobnosti seje" in one place, "želiš poslati" in
another. A reader notices a change of register faster than a change of noun.

**Ruling (Simon, 2026-09-11):** finish the rename, and use the **familiar form (tikanje)**
throughout — a trainer talks to a client, not an office to a citizen.

**This is a rule for new text as well, not a one-time sweep**, which is why it is written here rather
than only fixed: Slovenian user-visible text is familiar-form, and a training session is a *trening*.

## 74. [x] The sessions board's header and its calendar — all four done, closed 2026-09-30

Four things Simon reported on 2026-09-21, all on the board and its date filter.

### 74.1 [x] The filter chips break into two rows on a desktop — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#741-x-the-filter-chips-break-into-two-rows-on-a-desktop--fixed-2026-09-21).

### 74.2 [x] Today belongs in the calendar — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#742-x-today-belongs-in-the-calendar--shipped-2026-09-21).

### 74.3 [x] The calendar's month and year are chosen, not stepped to — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#743-x-the-calendars-month-and-year-are-chosen-not-stepped-to--shipped-2026-09-21).

### 74.5 [x] Four icons had no glyph, and the check could not see it — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#745-x-four-icons-had-no-glyph-and-the-check-could-not-see-it--fixed-2026-09-21).
This was the reported "missing glyphs": both calendar chevrons, `id-card` and `paperclip` drew a
crossed box. §74.4 below is the other half.

### 74.4 [x] The app ships the symbols and emoji it writes — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#744-x-the-app-ships-the-symbols-and-emoji-it-writes--shipped-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 11.3 [x] The ☰ menu is where everything without a home ended up — superseded by §81.2, closed 2026-09-30

**Superseded 2026-09-26 by §81** — Simon set the menu at five entries; the plan below is kept for its
counts and reasoning, not as the plan.

**Reported 2026-09-11 (Simon):** *"☰ je natlačen morala bova zgostiti in prioritizirati, morda celo
narediti podskupine"*. **Raised again 2026-09-21 (Simon): the menu is too long and too complex, and
wants reorganising.** Same section, nothing new to decide — what it is waiting on is below.

**Counted, not estimated: 21 rows plus 2 selects** in one dropdown
([applicationHeader.js](src/modules/common/applicationHeader.js)) — language, theme, the trainer's
details, the sandbox pair, five views, five data actions, and six support/legal rows.

**Re-measured 2026-09-21 (Claude): 19 rows carrying `session-menu-item`** in that file, one of them
(`menu-sandbox-reset`) hidden by default, plus the same 2 selects. That is two fewer than the count
above and the difference has NOT been traced — the file's last commit is e1490a5 (2026-09-13,
§49.2's Spreadsheet theme), which is not an obvious cause. Trace it before quoting either number as
the baseline for a fold.

**Five of those rows are §11.1 arriving as a bill.** Clients, Routines, Exercises and History are
NAVIGATION; they live here because the footer nav was replaced and they were never given a new home.
So this section cannot be finished without §11.1 — the menu is not crowded by accident, it is holding
somebody else's luggage.

**Two foldings need no design decision at all, and are worth doing before anything is rearranged:**

- ***Connect cloud storage* and *Export data as a file* open the SAME dialog.** Both are
  `goto(urlFor("backup"))`. That is a duplicate rather than a choice — one row, and nothing is lost.
- **Six support/legal rows are read once in a lifetime**: GitHub, Send feedback, Bug report, About,
  Terms, Privacy. One row — *About & help* — opening a panel with all of them is five rows fewer at
  no cost to anybody who has already read them. *Open an encrypted file* belongs in there too: by its
  own module header it is for a CLIENT who was emailed their export, not for the trainer.

That is 21 → 14 with no capability lost and no ruling needed.

**Subgroups, asked about in the same message: not yet.** Headings inside a dropdown do not shorten a
list — they add rows to it and give the reader a sense of structure over the same number of taps.
They earn their place once the count is down. Fold first; then, if it is still long, three headings
(settings · work · data).

**Withdrawn the same day:** §45.9's note recommended moving the board's expand-all DEFAULT into this
menu. That would make this section worse. The better answer is that the global control simply goes —
the per-card chevron stays, and §45.6's client filter has taken over the reason anybody expanded
every card at once (to read the names and find one person's sessions).

---

### 12.6 [x] Vendor Font Awesome locally — the last CDN dependency — done, closed 2026-09-30

**Vendored 2026-08-05** ([CHANGELOG](CHANGELOG.md)); it was the root cause of §21's `Page.goto`
stalls.

**[x] Glyph subsetting — done 2026-08-22.** 252KB of two whole faces became **7KB** of two subsets,
72 glyphs, on the first load that matters most. Three things worth not re-deriving:

- **Two subsets, not one merged font.** The first attempt merged both faces into one family and two
  brand icons silently became other glyphs: the faces share 96 codepoints (both map ASCII, and
  `fa-plus` genuinely lives at U+002B), so merging forces a winner per codepoint. Upstream's own
  separation is kept.
- **The check had to come first, and it caught exactly that.** `icon_coverage.py` compares NAMES;
  [glyph_render.py](agent_tools/glyph_render.py) compares rendered SHAPES against a recorded
  baseline — a 16×16 grid per icon, so a re-encode's antialiasing (3-17 cells) passes and a wrong
  glyph (114) does not.
- **The upstream faces moved to `assets/fontawesome-upstream/`**, out of the shipped app but in the
  repository, so regenerating after an icon is added needs nothing else. `fonttools` is installed
  for the run and removed again.

**The original note, kept for the reasoning:** 2 woff2 files remain (252KB) using 48
glyphs of ~1400 plus 2 brand glyphs; the codepoints do not collide, so merging would land ~381KB of
font+CSS at roughly 24KB. The prerequisite is built —
[agent_tools/icon_coverage.py](agent_tools/icon_coverage.py) gates every `fa-` class in `src/`
against what the stylesheet can render, with the four **runtime-built** names
(`fa-arrow-${dir}`, `fa-chevron-${…}`) declared explicitly because a static scan misses them and they
would subset to blank boxes with no error. Remaining work is a dev-time `fonttools` script (not a
build dependency — regeneration stays a deliberate committed act).

**Licensing, checked against the shipped text**: a subset is a "Modified Version" under SIL OFL 1.1,
which permits it but reserves the name — so the merged font's `font-family` must be renamed
(`"LibrePT Icons"`), and the copyright/licence must travel with it, which subsetting tools routinely
strip from the name table. The icons are separately CC BY 4.0, so attribution must also state that
the set was subset. **Today is compliant and relies on none of this**: both woff2 files are
byte-identical to upstream (SHA-256 verified), so no Modified Version exists yet.

**What is still missing is a check, not the script** (established 2026-08-22): `fonttools` installs
cleanly into the venv as a one-off (`pip install fonttools brotli`, then uninstall — it must not
become a build dependency), so writing the merge is the small half. The large half is that
[icon_coverage.py](agent_tools/icon_coverage.py) compares NAMES, and a subset's failure mode is a
correct name whose glyph is a blank box — which a name-level gate cannot see. Do the render check
first, the way §12.6's own note argues the coverage gate had to come before subsetting.

**Subsetting cannot affect names in any language** — Font Awesome is Private Use Area only and
contains no letters. Non-Latin coverage is a `fonts.css` question (latin + latin-ext only, deliberate
since a CJK webfont is megabytes per trainer), and `getInitials()` derives real initials from
Han/Cyrillic/Greek/Arabic names.

### 18.7 [x] [Decided] Backups: 1× not N×, readers forever, writers never — every part shipped, closed 2026-09-30

**Core shipped 2026-08-10** — [CHANGELOG](CHANGELOG.md). What landed, and what the decisions were:

- **Back up the newest STABLE bucket only — 1×, not 3×.** Export projects through `STABLE_SCHEMA`
  ([backupFile.js](src/data/backupFile.js)) using the same projection path the star-write fan-out
  uses, so a file cannot drift from what the store would write for that shape. Not the newest *live*
  shape — that is the disposable preview schema (§18.14), which is exactly what a backup must not be
  written at. One shape per file, because expand-first staging (§18.4) makes the newest a strict
  superset of every older one; a test asserts that superset rather than trusting the convention.
- **No snapshot tier** (Simon: endless point-in-time issues in the backup world).
- **Retain readers forever; retain writers never** — a restore runs `parse → migration chain →
  single write layer → fan out`, so an old file needs no old writer.
- **Frozen backup-fixture corpus in CI** — five committed fixtures (schema 0 through 4) in
  [tests/fixtures/backups/](tests/fixtures/backups/), asserted by
  [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs) to still import to
  the expected domain object.
- **A restore REPLACES, and now says so** — it names what would be lost per collection ("8 clients,
  13 sessions") and only when something is at stake, because a warning shown every time is a warning
  nobody reads. Declining discards the parsed file rather than leaving it primed for a later click.
  Merging two databases was rejected: it needs a common ancestor, which Drive sync's three-way merge
  has and a file import does not.

**Still open**:

- **[x] ONE version number, on the envelope — 2026-08-15.** `formatVersion` is written outside any
  future compression or encryption, so it is the first thing readable, and it is the **same integer**
  as `schemaVersion`: a container change and a record change both bump it. Version 4 is schema 4 in a
  plain-JSON container; [BACKUP_FORMATS](src/data/backupFile.js) records how to open each version and
  is **append-only**, since files declaring a version are in the wild forever. An unknown version is
  refused before anything touches the database — a newer file may be compressed, so this reader would
  otherwise find no `clients` array and restore an empty database over the trainer's real one.

  **Two independent numbers were the original plan and were rejected** (Simon, 2026-08-15). Both
  arguments for splitting fail on this architecture:
  - *"A container-only change forces a record bump with no migration to run."* It does, and the cost
    is one no-op step in the chain. Cheap, and it keeps the chain's history complete.
  - *"An older build then refuses a file whose container it understands."* It should. The guarantee
    here is retain **readers** forever — new builds open old files — and that is untouched. Old builds
    opening NEW files was never promised, and refusing is already what the restore path does, since a
    newer file may hold records this build cannot faithfully represent.

  What sharing buys: there is no way to express, or accidentally ship, a file whose two numbers
  disagree. Files written before today carry no `formatVersion` and stay readable permanently via the
  payload's own `schemaVersion` — the frozen corpus is all of that shape.

  §18.8's encryption becomes **version 5**, a new row with `container: "aes-gcm"`, plus a no-op 4→5
  record step.
- **[x] Forward-migration consent at import — 2026-08-18.** The prompt covered *what you lose from this
  device*; it now also says what the import does to the FILE: the steps in the trainer's own words, then
  *"this brings the file's data forward, and it will no longer open in older builds of LibrePT"*.

  **The case it was missing was the empty device**, which skipped the prompt entirely — and that is
  exactly where the replace warning has nothing to say while the one-way door still applies. Consent is
  now asked when EITHER consequence is real, and the two lines show independently.

  Declining leaves the `.json` untouched (the app never writes to it) and the database unwritten — no
  half-import, asserted on a clean device. A file already at this build's shape still restores in one
  step: `bringsDataForward` is false when nothing was applied, so the ordinary case — yesterday's backup
  restored today — gained no toll. One existing test had to be **rewritten rather than kept**: it
  asserted that an empty device never asks, using an OLD file, which stopped being right the moment
  portability became something to lose.

### 18.11 [x] Legal gaps this design creates — every gap answered, closed 2026-09-30

- **[x] Retention basis is documented — 2026-08-22.** [PRIVACY.md](PRIVACY.md) §3.3 now states it:
  nothing is deleted on a schedule, records stay until the trainer removes them, and the anonymised
  remains of an erased client are kept indefinitely because a training history with the person taken
  out of it is no longer personal data (Recital 26). The trainer's own retention period stays the
  trainer's obligation, and the paragraph says what to do when theirs is shorter.

  **Writing it found a worse bug than the missing paragraph**: the same section claimed deleting a
  client "instantly purges their records", which is not what this app does and has not been since
  §17.3 — the exact class of error §27 was filed about, a document that is wrong about the app rather
  than about the law. It now describes anonymisation, its irreversibility, and the two things it
  cannot reach.
- **[x] Re-identification via backups + the mapping table — closed 2026-08-11.** A pre-erasure backup
  names Jane; restoring it brought her back, and **§18.7's indefinite-restore requirement removes**
  the usual "backups rotate out" defence. The register ships with both properties this bullet
  demanded: applied **at import**, before the data becomes live, and keyed so a backup written under
  another schema still matches. See [CHANGELOG](CHANGELOG.md). §17.3's key-location tension is gone
  rather than resolved — a derived pseudonym stores no mapping to re-identify against.
- **[x] Minimize the suppression list itself — done.** Salted hashes of the id and nothing else, with
  a **fresh salt per entry** rather than one install-wide: the register is unioned across devices on
  import, which a shared salt cannot survive. The side effect is strictly better, since duplicates
  become unscannable.
- **Taxonomy licensing — checked 2026-07-26, currently clear.** wger's *application* is AGPLv3 but no
  wger code is linked; its *dataset* is CC-BY-SA 4.0 but
  [exerciseStandard.js](src/domain/exerciseStandard.js) vendors ~17 generic category and equipment
  words, far below any threshold. **The line not to cross**: bulk-importing wger's 1000+ entries would
  engage both ShareAlike (a licensing split inside an MIT repo, and a one-way door for that file) and
  the **EU *sui generis* database right** (Dir. 96/9/EC), which is separate from copyright and needs
  no originality. SNOMED CT, if ever considered, requires an affiliate licence.

### 77.3 [x] P2 — Uvoz sklopa tiho zavrže nenumerične cilje vaj — popravljeno 2026-09-30

**Izvor:** `4faf64f`, [libraryImport.js](src/domain/libraryImport.js), `readItem`.
Za `reps` in `weight` uporabi `toNumber`, čeprav aplikacija podpira besedilne cilje
([repsAndLoad.js](src/domain/repsAndLoad.js), `parseReps` in `parseLoad`).

**Ponovitev:** sklop z vajama `{name: "Squat", reps: "8-12", weight: "Medium", rest: 60}`
in `{name: "Pull-up", reps: "max", weight: "BW"}`. `readLibrary` vrne `ok: true` in
`unreadable: []`, vendar obdrži samo imeni in `rest: 60`. Enako se izgubi ob izvozu in
ponovnem uvozu kataloga s takimi cilji. Vstavljanje nato uporabi privzete cilje.

**Odprava:** ohraniti dovoljene besedilne cilje po skupnih pravilih aplikacije; nepodprte
vrednosti jasno poročati pred potrditvijo. Testirati izvoz → uvoz za `max`, razpon `8-12`,
časovni cilj in besedilno obremenitev. Blokira zanesljivo izmenjavo predpisov vadbe (§45.5).

### 77.5 [x] P2 — Ponovni uvoz istega kataloga podvoji sklope — popravljeno 2026-09-30

**Izvor:** `4faf64f`, [libraryImport.js](src/domain/libraryImport.js), `planLibraryImport`.
Obstoječe vaje se preverijo, obstoječi sklopi pa funkciji sploh niso predani; vsak dobi
nov ID. Tudi ID sklopa iz lastnega izvoza se pri branju ne ohrani.

**Ponovitev:** dvakrat uvozi `{"circuits":[{"name":"Legs","exercises":["Squat"]}]}`.
Drugi načrt doda nič vaj in en nov sklop `Legs`, `duplicates` pa ostane prazen. Vsaka
ponovitev iste datoteke podaljša seznam enakih sklopov v urejevalniku načrta.

**Odprava:** določiti identiteto in preverjanje podvojitev tudi za sklope ter v pregledu
ločiti nov sklop od že prisotnega; ne združevati različnih predpisov samo po naslovu.
Test: dvakrat uvožen lasten izvoz ne podvoji sklopov, spremenjen predpis pa ni tiho
izpuščen. Blokira ponovljivo izmenjavo katalogov (§45.5).

### 77.6 [x] P3 — Ime uvoznega vira se lahko zamenja z internim filtrom — popravljeno 2026-09-30

**Izvor:** `fc172f9` in `4faf64f`, [exerciseLibrary.js](src/data/exerciseLibrary.js),
`exerciseSourceOf`, `sourcesOf`, `withSource`; besedila filtrov v
[exercisePicker.js](src/modules/exercises/exercisePicker.js), `sourceLabels`.

**Ponovitev:** vaji imata vira `all` in `Ana`. `withSource(vaje, "all")` vrne obe vaji;
vira `all` zato ni mogoče izbrati samostojno. Vir `own` se predstavi kot lastne vaje,
`librept` pa kot vgrajeni katalog in izgubi oznako uvoza. Polje sprejme vsa tri imena.

**Odprava:** ločiti identifikatorje sistemskih filtrov od poljubnih imen virov. Testirati
prikaz oznak in neodvisno filtriranje vseh treh imen v knjižnici in izbirniku vaj.
Blokira pravilno filtriranje sicer veljavnih uvozov (§45.5).

### 80.76 [x] P1 — Tap na kartico treninga, ki že teče, ga zamenja z novim, nezačetim — popravljeno 2026-09-30

**Scenarij in koraki:** trener začne »Group Strength & Conditioning« (»Začni trening«), se vrne na
ploščo in tapne kartico istega treninga, ki je označena kot aktivna.

**Opaženo, izmerjeno 2026-09-29 na `main` (`8b2ce80`) s preizkusom v brskalniku:** pred tapom je v
shrambi `librept_active_session` `started: true` in čas začetka; po tapu `started: false` in brez
časa začetka. Nobeno okno ne vpraša ničesar. Časomer in vse vpisane serije so izgubljeni.

**Vzrok, potrjen v kodi:** tap na kartico ([sessionCard.js](src/modules/sessionList/sessionCard.js))
vedno pokliče `launchClipboardDirectly`, ta pa `startWorkoutSession`
([sessionLifecycle.js](src/controllers/sessionLifecycle.js)), ki podlogo zgradi na novo, tudi ko je
isti trening že začet. Isti vzrok kot §80.52, a tu brez odprtega vprašanja o zasnovi: trening, ki
teče, ima svoje udeležence in serije že v podlogi, nova gradnja pa ne more dati ničesar boljšega.

**Popravek:** tap na kartico začetega treninga, ki je v odprti podlogi, odpre to podlogo. Nezačeti
trening ostane pri §80.52.

### 89.1 [x] Seznam datotek za delo brez povezave je ročna kopija `integrity.json` — odločeno 2026-09-29: ostane
`src/sw/cacheManifest.js` ima 307 ročno vpisanih poti (`ASSETS`) in ročno številko
`CACHE_NAME = "librept-v143"`. Vsak nov, premaknjen ali izbrisan modul zahteva vpis in dvig
številke. Service worker ob namestitvi že naloži `integrity.json` (`sw/integrity.js`), ki ima vse
datoteke z zgoščeno vrednostjo SHA-256. **Predlog:** seznam za predpomnilnik so ključi kataloga
(brez `sw.js` in `sw/`), ime predpomnilnika pa zgoščena vrednost kataloga. Odpadejo ročni seznam,
ročna številka in test `test_service_worker_precaches_every_runtime_module`, ki preverja le
manjkajoče poti, ne odvečnih. **Odprto pred delom:** ali `dist/` vsebuje datoteke, ki jih namerno
ne predpomnimo (velike slike, `404.html`); te bi potrebovale seznam izjem.

**Odločitev: ročni seznam ostane.** Pri izvedbi se je pokazalo, da predlog ni zamenjava enega
seznama z drugim. V produkciji gradnja datotek service workerja ne spreminja, zato brskalnik novo
različico opazi le, ko se spremenijo bajti `sw.js` ali `sw/*.js`. Ročni vpis in dvig `CACHE_NAME`
sta tisto, kar sproži ponovno shranjevanje. Seznam, izpeljan iz `integrity.json`, bi zahteval, da
gradnja ob vsaki objavi vpiše različico v service worker, telefon pa bi ob vsaki objavi znova
prenesel vse datoteke. **Namesto tega** (`d4ee523`) test primerja seznam z `src/` natančno, v obe
smeri in za vse vrste datotek; tako je našel `icons/icon-mark-512.png`, ki ni bil nikoli na seznamu.
Napaka zdaj ne more priti v `main`; ročno delo je ena vrstica in dvig številke na nov modul.
Odločitev lahko Simon ovrže.

---

### 89.3 [x] Pet pravil o usklajevanju sej opisuje, kar `build check` že izsili — uveljavljeno 2026-09-29
`AGENT_RULES.md` (vrstice o mirnem drevesu, `pgrep`, posnetku drevesa, `tests/` in zavrnitvi
preverjanja) je približno četrtina datoteke. `build check` drži `.build-reports/gate.lock` in
zavrne drugi zagon; `build/__main__.py` po zagonu primerja posnetek `src/` in `tests/` ter konča z
napako, če se je drevo premaknilo. Točke nosijo datume in zgodbe, kar skupno pravilo »brez
zgodovine« prepoveduje. **Predlog** (namen: pravila, ki so v vsakem kontekstu, krajša za toliko,
kolikor jih koda že izsili): strniti v eno točko — »V drevo piše ena seja naenkrat; zasede ga v
zapisu. `build check` zavrne drugi zagon in zavrže rezultat, če se `src/` ali `tests/` med
zagonom spremenita: zavrnitev ali premaknjeno drevo pomeni počakaj, nikoli commit.« Pravila
spreminja Simon.

**Uveljavljeno** v `2ff6351`, ko se je Simon strinjal z namenom. Šest točk je postalo dve: ena o
enem pisarju in zaklepu preverjanja, ena o preverbi, na katero nič ne ukrepa.

---

### 89.4 [x] Tema je zapisana na šestih mestih, ena kopija je že zastarela — popravljeno 2026-09-29
`modules/common/theme.js` (razred, barva, stara imena, imena v treh jezikih), `theme-boot.js`
(kopija razredov in starih imen, ker je navaden skript brez `import`), `tests/medium/test_theme.py`
(tretja kopija razredov), `index.html`, `sw/cacheManifest.js` (odpade z §89.1) in komentar v
`modules/common/shareLink.js`, ki še našteva temo `red`. Razred je vedno `<ime>-theme`, zato je
tabela `THEME_BODY_CLASS` pravilo, ne podatek. Komentar v `theme.js` pravi, da imena tem niso
besedilo vmesnika, a so prevedena (Dan, Polnoč): nov jezik zato popravlja `theme.js`. Ni
preverjeno, ali preverjanje enakosti slovarjev ta imena vidi.

**Popravljeno** v `c8d8953`: seznam `THEMES` in pravilo `themeClass` namesto tabele, imena v
slovarjih (`theme_name_<tema>`), mrtvi ključ `theme_light` odstranjen, komentar v `shareLink.js`
popravljen. `theme-boot.js` obdrži kopijo; `tests/unit_js/modules/themeBoot.test.mjs` ga požene
proti `theme.js` za vsako ime. Barve `THEME_META_COLOR` ostajajo tabela v `theme.js`.

---

### 89.5 [x] Seznam zbirk ročno, čeprav obstaja izpeljan — popravljeno 2026-09-29
`COLLECTIONS` v `data/recordProjections.js` je izpeljan iz tabele projekcij. `ARRAY_COLLECTIONS` v
`data/schemaMigrations.js` je ročna kopija brez `invites` in `sessionSeries`, zato preverjanje
oblike po migraciji tega dvojega ne preveri. `stateHasData` v `data/stateStore.js` je še ena ročna
kopija (brez `invites` in `notifications`; ali namerno, ni preverjeno).

**Popravljeno** v `8ef7f8e`: `STATE_COLLECTIONS` je izpeljan iz sheme, v katero pripelje veriga
posodobitev; `stateHasData` bere isti seznam brez `notifications`.

---

### 79.3 [x] The evening theme card names an option the menu does not have — popravljeno 2026-09-26

`story_step_evening_theme` told the viewer to choose *Dark Mode* (en) and *Temna tema* (sl), but
the step selects the theme `midnight`, whose label in the menu is *Midnight* / *Polnoč*
([theme.js](src/modules/common/theme.js)). The German card already named *Mitternacht*. The theme
was renamed, the caption kept the old name retyped from memory, and the old label's key
`theme_dark` stayed in all three dictionaries with nothing reading it.

**Fixed 2026-09-26 (Claude).** The English and Slovenian cards name *Midnight* / *Polnoč*, and
`theme_dark` is deleted from en, sl and de. A text names a control by the label the control shows
in that language, and renaming a control searches every text that names it and deletes the old
label's key.

### 79.4 [x] The client documents declare `lang="en"` whatever their language — popravljeno 2026-09-26

[render_docs.py](agent_tools/render_docs.py) wrote `<html lang="en">` and an English link back to
the app on every page, so the Slovenian and German privacy notices and consent forms were announced
to a screen reader, and offered for translation by the browser, as English.

**Fixed 2026-09-26 (Claude).** `document_language` reads the language from the source's
`docs/templates/<lang>/` folder, every other page is English, and the link back is in the page's
language. `test_a_page_declares_the_language_it_is_written_in` in
[test_render_docs.py](tests/unit/test_render_docs.py) renders a Slovenian and a German page and an
English one.

### 77.4 [x] P2 — Vir iz imena datoteke izgine ob potrditvi uvoza — popravljeno 2026-09-25

**Izvor:** `4faf64f`, [libraryImportDialog.js](src/modules/exercises/libraryImportDialog.js),
`readCurrent` in `addImported`.

**Ponovitev v uporabniškem vmesniku:** izberi datoteko `Ana.json` z vsebino
`["Imported Sled"]`. Polje za vir kaže `Ana`. Brez ročnega posega vanj pritisni Add to
library. Shranjena vaja nima `source`. `addImported()` pokliče `readCurrent()` brez
imena datoteke; ta izprazni vir, ker uporabnik polja ni tipkal. Vaja je označena kot lastna.

**Odprava:** ob potrditvi ohraniti prikazani vir; privzeto ime datoteke določiti ob branju
datoteke, ne znova ob vsakem pregledu. Test mora uporabiti dejanski izbor datoteke brez
`source`, potrditi brez urejanja polja in preveriti vir po ponovnem zagonu. Sedanja
[test_library_import.py](tests/e2e/test_library_import.py) preverja le lepljenje JSON z
izrecnim `source`. Blokira pravilno označevanje uvoženih vaj (§45.5).

**Popravljeno 2026-09-25 (Claude).** Dialog si ime datoteke brez končnice zapomni v trenutku, ko
datoteko prebere (`fileSource`), in ga uporabi pri vsakem nadaljnjem branju polja, tudi ob
Add to library. Ob odprtju dialoga in ob izbiri predloge se ime izbriše. Test
`test_a_chosen_file_names_the_source_of_what_it_adds` v
[test_library_import.py](tests/e2e/test_library_import.py) izbere datoteko `Ana.json` brez
`source`, potrdi brez urejanja polja in po ponovnem zagonu preveri vir `Ana`. Brez popravka pade:
vir je prazen.

### 77.7 [x] P2 — Danes ne prikaže današnjih vadb ob aktivnem datumskem filtru — popravljeno 2026-09-24

**Izvor:** `b7735d4`, [sessionFilterBar.js](src/modules/sessionList/sessionFilterBar.js),
obravnava `data-today`; [sessionTimeline.js](src/modules/sessionList/sessionTimeline.js),
`focusSessionsColumn`. Gumb spremeni prikazani mesec in poskusi pomakniti seznam, ne
spremeni pa filtra `from` / `to`. Seznam je še vedno omejen na prej izbrani datum.

**Ponovitev v Chromiumu:** v koledarju izberi 2026-09-07, nato Danes na dan 2026-09-24.
Pred klikom in po njem `activeSessionFilters()` vrne `from: "2026-09-07"` in
`to: "2026-09-07"`. V preizkušenem prikazu ni nobene skupine vadb; gumb ne vrne današnjih
vadb. Uporabljen je obstoječi `SESSIONS_STUB` z resničnim ponovnim izrisom in priklopom
`onToday` na `focusSessionsColumn("today")`, kot v produkciji.

**Odprava:** ob kliku odstraniti oziroma nastaviti datumsko omejitev tako, da vključuje
današnji dan, nato izrisati seznam in šele zatem pomakniti pogled. Ohraniti neodvisna
filtra stranke in lokacije. Testirati en dan in razpon, ki izključujeta danes; obstoječi
[test_sessions_dashboard.py](tests/e2e/test_sessions_dashboard.py) preverja klik brez
aktivnega datumskega filtra. Blokira delovanje premaknjenega gumba Danes (§74.2).

**Popravljeno 2026-09-24 (Claude).** `filtersIncludingDay` v
[sessionFilters.js](src/domain/sessionFilters.js): Danes odstrani datumsko omejitev, ki današnjega
dne ne vsebuje; razpon, ki ga vsebuje, ter filtra stranke in lokacije ostanejo. Gumb najprej
spremeni filtre, nato premakne pogled na danes in šele potem znova izriše seznam. Codexov predlog,
najprej izrisati in nato pomakniti, je podrl obstoječi test: ponovni izris postavi seznam na dan iz
naslova, naslov pa premakne šele pomik na danes. Izbrano namesto nastavitve filtra na današnji dan: Danes
brez filtra že pomeni celoten seznam, pomaknjen na danes, in tako ostane. Enotski test v
[sessionFilters.test.mjs](tests/unit_js/domain/sessionFilters.test.mjs), e2e test v
[test_sessions_dashboard.py](tests/e2e/test_sessions_dashboard.py), ki brez popravka pade.

### 77.1 [x] P1 — Uvoženi ID vaje lahko prepiše stranko — popravljeno 2026-09-24

**Izvor:** `4faf64f`, [libraryImport.js](src/domain/libraryImport.js), funkciji
`readExercise` in `planLibraryImport`; zapis v [stateStore.js](src/data/stateStore.js),
`starWrite`. Uvoz ohrani `x_librept.id` in preverja trke samo med vajami. Vsi zapisi ene
sheme pa imajo skupni ključ `id`, ne para zbirka + ID
([indexedDb.js](src/data/indexedDb.js), `createSchemaStore`).

**Ponovitev:** shrani stranko `{id: "same-record-id", name: "Existing client"}`. Uvozi
`{"format":"wger-exercise-interchange","exercises":[{"name":"Injected exercise",
"x_librept":{"id":"same-record-id"}}]}`. Po `flushWrites()` in ponovnem branju baze je
`clients` prazen, pod istim ID je vaja. Uvoz ne opozori na prepis. Dokaz uporablja pravi
uvozni načrt, `addToLibrary` in običajno shranjevanje, ne neposrednega prepisa vrstice baze.

**Odprava:** preveriti identifikatorje proti vsem zbirkam pred zapisom; ob trku uvoz
zavrniti ali varno preslikati ID in reference. Test mora dokazati, da uvoz s tujim ID
ohrani stranko, zgodovino in druge zbirke tudi po ponovnem zagonu. Blokira varen uvoz
izmenjanih katalogov (§45.5).

**Popravljeno 2026-09-24 (Claude).** `planLibraryImport` sprejme `takenIds`, množico ID-jev, ki
jih že ima katerikoli zapis v stanju (`recordIdsInUse` v
[recordProjections.js](src/data/recordProjections.js), prek vseh zbirk iz `COLLECTIONS`).
Uvožena vaja obdrži ID iz datoteke samo, če ga nima nihče; sicer dobi novega, in sklopi, ki jo
uporabljajo, kažejo nanj. Enotski test v
[libraryImport.test.mjs](tests/unit_js/domain/libraryImport.test.mjs) in e2e test v
[test_library_import.py](tests/e2e/test_library_import.py) ponovita Codexov primer: stranka po
uvozu, zapisu in ponovnem nalaganju ostane. Brez popravka e2e test pade (stranka izgine).

### 57. [x] The demo story tests count steps — fixed 2026-09-24

Raised 2026-09-17 (Simon): counting cards and steps is fragile. Two counts were removed with
040bcb9. Still in [test_demo_story.py](tests/e2e/test_demo_story.py): walks that take a fixed
number of steps from a named start step — "four steps on from `arrive-menu`", then three Backs —
and one that takes two steps from the top and expects step 3. A step added inside such a stretch
moves the test onto a different step, and the failure then names a screen, not the insertion. The
design that cannot fail that way walks until a step with a given id is reached.

**Fixed 2026-09-24.** The four counted walks in [test_demo_story.py](tests/e2e/test_demo_story.py) —
the reload from step 3, the repeated Show me, and the two walks back and forth around the invite
dialog — now walk until a named step is reached: `_walk_to` forward and `_back_to` with Back. Both
read the step's id from the address, which the story writes in the same handler that moves the
progress line. A step that is never reached fails with the id it was looking for.
`test_the_trainer_reads_what_ana_sent_and_she_lands_in_the_register` still takes two steps from
`review-message`; it asserts an outcome (Ana in the register), not a step, so an added step there
fails on that outcome rather than on a wrong screen.

### 65. [x] The erasure sweep does not reach repeating sessions — closed 2026-09-24

Asked 2026-09-18 (Simon): is the anonymisation complete now that the alias is cleared (§59)? Read from
the code the same day (Claude): **no.** `eraseClientInState` in
[clientErasure.js](src/data/clientErasure.js) rebuilds four collections — clients, history,
planUpdates, sessions — and returns everything else untouched. Two of the collections schema 4 now
carries (§61) were added after the sweep was written:

- **`sessionSeries` is not swept, and it has two problems.** Its `title` is trainer-typed and can name
  the person, exactly as a session title can, and nothing rewrites or reports it. Worse, the erased
  client stays in the rule's `participants`, so the board goes on producing their evenings — an erased
  person still being scheduled.
- **`invites` is by reference only** — two ids, a channel and two timestamps — so it names nobody.
  It does keep the fact that this id was invited, which is execution data like a history record.

- **A session's `location` is trainer-typed and is never swept.** Only `title` is checked for the
  name, so "at Jane's flat" survives an erasure with nothing said about it. Confirmed 2026-09-18
  (Simon asked, and it holds): a session stores its attendees as plain client ids and nothing else
  about them, so `title` and `location` are the only places a name can sit.

Also worth stating for the receipt: `joinedDate` and `gdprConsent` survive by design (evidence under
Art. 7(1)), and `notifications` carry i18n keys rather than typed text.

**Ruled 2026-09-18 (Simon): the erasure runs again** — after every migration, and, since walking the
erased clients is cheap, at every start.

**What that repairs, and what it cannot** (Claude, from the code):

- **It repairs what needs no name:** the alias a build before 2026-09-18 left behind, and anything a
  later sweep learns to clear. Cheap and idempotent — an erased record keeps its original dates
  (`eraseClientRecord` returns early on `client.erasure`).
- **It cannot repair prose.** Scrubbing a name out of a session title, a location or a feedback note
  needs the name, and after the first erasure the name is gone. So a title that was left for the
  trainer to review stays as typed, for ever, unless they fix it by hand.
- **The import path is the exception, and it is the strong one.** A restored backup still carries the
  name, and [erasureSuppression.js](src/data/erasureSuppression.js) already re-erases on the way in —
  so there the full sweep, prose included, runs again.
- **Who to walk.** The register stores a salted hash per id and nothing else, so it cannot be listed;
  the erased clients are found on the records themselves (`isErased`), and the register stays what it
  is for — recognising a record arriving from outside.

**Ruled and shipped 2026-09-19 (Simon):**

- **A repeating rule for this client alone is removed** — it exists only to keep producing their
  evenings, and an erased person must not still be scheduled every week. Its trainer-typed title goes
  with it. **A rule shared with other people stays**, minus this client, because it belongs to them.
- **Ambiguity is judged on the record, not on the whole book.** A namesake who is not on this session
  or rule cannot be who its text means, so the name is replaced there; only a record holding both
  same-named clients is left as typed and reported. This replaced "any namesake anywhere blocks a
  rewrite", which left names standing on records the namesake had nothing to do with.
- **A session's location is swept like its title** — "at Jane's flat" names a person as much as a
  title does.
- **What stands in for the name in prose is the record's own id in brackets**, `[c1a9f0e2]`: already
  in the record, says nothing about the person, and keeps two erased clients in one sentence apart.
  The client record itself keeps the short pseudonym, which is what a trainer reads in a list.
- The receipt counts the rules removed and kept, and names the ones left for a human to read.

**Shipped 2026-09-24: the repeat sweep.** `resweepErasedClients` in
[clientErasure.js](src/data/clientErasure.js) runs every erasure again at every start, which also
covers the start after a migration. It runs every time rather than behind a marker: walking the
erased clients is cheap, and the start saves only when the sweep changed something, so an
unchanged book does not count as a change not yet backed up. A record already erased holds only
its pseudonym, so the repeat run no longer scrubs prose for it: the pseudonym is not a name, and
scrubbing it would rewrite text the trainer typed after the erasure.

### 45.1 [x] The first screen is English whatever language was chosen — fixed 2026-09-11

**Reported:** first launch, choose Slovenian, and the invitation into the demo and the walkthrough is
still in English.

**Cause, located.** The onboarding block in [index.html](src/index.html) — *Explore with demo data*,
*Guided walkthrough*, *Start with an empty app* — is written as plain English text. It carries no
translation key, has no entry in [domMappings.js](src/i18n/domMappings.js), and no `splash_*` key
exists in either [sl.js](src/i18n/sl.js) or [en.js](src/i18n/en.js). The language buttons above it
work; nothing below them can be reached by a language choice at all.

The language prompt itself is correct as it stands and must not be touched: each language names
itself, in its own language, so the choice is legible to someone who cannot read the current one.

**Why it is a first-run defect specifically.** The block is shown only while the trainer has saved
nothing of their own, so the one screen that is guaranteed to be English is the very first one a new
trainer sees. It is also the screen that decides whether they go any further.

**Ruling (Simon, 2026-09-11):** *"popravi tako, da bo prav"* — fix it properly, without first
establishing which surface the trainer saw.

### 45.2 [x] The trainer can enter their own name, phone and email — shipped 2026-09-11

**Reported:** there is nowhere to put the trainer's own details.

**Confirmed, and worse than a missing field.** The app already *uses* the trainer's name — the
invitation a client receives reads *"{trainer} invites you to fill in your details"*
([sl.js](src/i18n/sl.js), `intake_invite_body`) — while offering no place to enter it. Every record
in the app belongs to a client; the trainer is the one person the data model does not know.

**What it is for, so the scope stays honest:** the invitation and consent wording that names the
trainer, and the contact details a client needs in order to answer. Not an account, not a login,
not a profile that syncs anywhere.

**Ruling (Simon, 2026-09-11):** implement immediately, alongside §45.1 and §45.3.

**Also on the cold-start splash** (Simon, same day): the same form is offered beside the three
onboarding choices, not only in the ☰ menu. Built as ONE form — the fields, the labels and the single
validation rule live in
[trainerDetailsDialog.js](src/modules/common/trainerDetailsDialog.js) and are rendered into either
host under different id prefixes, because two copies of a form is two places for the rule to drift
and both can be in the document at once.

**It is an offer there, never a gate, and that is a product constraint rather than a preference.**
The app's first promise is that there is no account and no signup; a form on the first screen is
exactly what a stranger reads as one. So every field is optional, the three choices work with
nothing typed, saving does not choose for them or dismiss anything, and the form says in its own
words that it can be done later from the menu. The form sits BELOW the three choices for the same
reason — a form above the way in reads as the price of entry. If that ever tightens into a required
step, the promise on [landing.html](src/landing.html) stops being true and has to change with it.

### 45.3 [x] The signup form asks for first and last name — fixed 2026-09-11

`intake_name` reads *"Tvoje ime"* / *"Your name"* ([sl.js](src/i18n/sl.js),
[en.js](src/i18n/en.js)). A trainer filing a client needs both names; *your name* invites one.

**Ruling (Simon, 2026-09-11):** fix the label in both languages.

### 70. [x] Reading a narrower schema narrows the whole database on the next save — closed 2026-09-23

Stated 2026-09-21 (Simon): the purpose of the star write is **instant rollback whenever the trainer
asks for it**. Read from the code the same day (Claude): the design does not hold that promise the
moment two live schemas are not supersets of each other — which is exactly the day schema 5 removes
a field, or an older numbered schema is made live again.

**The mechanism, from two places in [stateStore.js](src/data/stateStore.js):**

- `readStateFromIndexedDb` loads records from `readStoreName()` **and from nowhere else**. The
  in-memory state is therefore shaped by the schema this install READS.
- `starWrite` then writes `currentState[collection]` into **every** live store.

What that does to a trainer, step by step:

1. They switch back to the older schema.
2. Their repeating sessions disappear from the screen. **This part is expected** — the older schema
   does not know that collection.
3. They change something unrelated. Adding one client is enough.
4. On save, the app writes what it holds in memory into EVERY live store. Memory no longer holds the
   repeating sessions, because the older schema never read them.
5. The newer store loses them too.

Steps 2 and 5 are the whole point. That the trainer cannot SEE those sessions while on the older
schema is what a rollback means. That they are DESTROYED is not, and the rollback is then not
reversible: switching forward again returns to a store that has been stripped.

**It does not bite today**, and that is why nobody has seen it: `SCHEMA_PREVIEW` is `SCHEMA_4` plus
one collection, so every live shape is a superset, and the preview store is rebuilt from schema 4 on
a build change anyway.

**It contradicts what `docs/DATA_MODEL.md` promises.** *Upgrading is a toggle, not a migration* says
the move is "instantaneous, and **reversible**, because the schema being left goes on being
written". That holds only while shapes grow. Under §60's freeze, shapes will stop growing — a field
change mints a number, and sooner or later one of those numbers drops a field.

**Two honest limits to state before any of this is designed** (Claude, 2026-09-21):

1. **Rollback can only be lossless for data both schemas can express.** If the older schema has no
   `sessionSeries`, a trainer who rolls back stops seeing their repeating sessions. That is not a
   defect to fix; it is what rollback means, and the app has to SAY it rather than let the trainer
   discover it.
2. **What must not happen is the silent part** — that the data is destroyed in the newer store
   rather than merely hidden while the trainer is on the older one.

**Proposed (Claude), not ruled:** the fan-out writes a store only from a state that store's schema
can fully express; where the reading schema is narrower, the wider store's records are updated
field-wise rather than replaced, so a field the trainer cannot currently see is preserved rather
than overwritten. That needs the per-schema projector of §58 underneath it, and it needs a test that
rolls back, edits, rolls forward and asserts nothing was lost.

Blocks: any live schema that is not a superset of every other — so it blocks schema 5 if schema 5
removes or renames anything, and it blocks reviving schema 3 as a live shape.

**Closed 2026-09-23 (Claude, with §76): no install reads a narrower schema any more.** Every install
reads the newest numbered schema, whatever app version the trainer runs; the version decides
behaviour only. `recordSchemas.test.mjs` fails the build when the read schema stops declaring a
field or collection that another live schema declares, so the situation above cannot arise on a
trainer's phone. The per-install choice in `readSchema.js` remains for the test passes. A test that
points it at schema 4 still reads the narrower store; nothing offers that to a trainer.

Read from the code while closing it, not measured: step 5 as written — the newer store loses whole
collections — does not match `starWrite`, which deletes only ids missing from the store being READ.
A collection the read schema does not declare is therefore neither written nor deleted in the wider
store. The field-level loss needs a projector that drops undeclared fields, which does not exist
(§71).

---

### 73.1 [x] A table of contents on both surfaces — shipped 2026-09-21

Both places that offered the guided story offered one way in: its beginning. Four to six minutes, and
a trainer who wanted the evening after a session had to watch the morning first.

The sandbox card and the splash now carry a folded list — *Start at a chapter* — and every line of it
starts the guide at that chapter. The chapters come from the story script itself through
`storyChapterIndex` in [demoStory.js](src/domain/demoStory.js), so there is no second list to keep
true, and the link a line follows drops the `?step=` a running story leaves in the address bar:
handed one chapter's steps and another chapter's starting id, the guide would begin wherever it
could.

The story script is imported only where an index is about to be shown — in the sandbox, and on an
app with nothing saved — so an ordinary boot does not fetch a quarter of a megabyte of demo steps to
draw a handful of titles.

### 73.2 [x] Only a chapter that actually runs from cold is offered — measured 2026-09-21

The index is a promise about every line of it, so it is gated by a walk rather than by reasoning:
`test_every_offered_chapter_can_be_walked_from_a_cold_start` in
[test_demo_story.py](tests/e2e/test_demo_story.py) opens each offered chapter on a freshly seeded
sandbox and walks it to its end with *Show me*.

Four of the five trainer chapters pass. **The programme chapter does not**, and it is now marked
`needsEarlierChapters` in [storyTour.js](src/modules/demo/storyTour.js) and left out of the index. It
opens on the trainer reading what Ana sent, and her submission reaches the store from HER phone, in
the client chapter's own boot — a sandbox that has played none of the earlier chapters has nothing to
review, so the guide stops on *Tap Add to my clients* with nothing to add. Starting the whole story
at that step instead was measured too, and fails identically: the crossing to her phone is not
something the trainer's boot can perform.

It still plays as part of the whole story. It is only not a way in. §73.3 is what would change that.

### 73.4 [x] The language choice is built from the shipped dictionaries — shipped 2026-09-21

The splash's language step and the ☰ menu's language `<select>` each carried two hand-written
buttons; a third dictionary would have appeared in neither, and the splash's language step is the one
screen where a language nobody can find is fatal — there is nothing else on it to read.

Both are now built from `TRANSLATIONS` in [index.js](src/i18n/index.js), and each language is named
by its own `language_name` key — written in that language and never translated, because someone
looking for their language on a screen they cannot read has only the name to go by. The splash's row
of buttons became a wrapping grid that scrolls inside the splash, so two names and twenty-four both
fit on a phone without pushing the question off the top.

No new dictionary shipped with it. That was the ruling (Simon, 2026-09-21): a button for a language
the app does not speak shows English behind it, which is a promise the first screen then breaks.
§73.5 is the open half — which languages, and who translates them.

---

### 73.6 [x] The index is open, and the "show me around" button is gone — shipped 2026-09-21

Asked by Simon 2026-09-21: "kazalo poglavij ne sme biti skrčeno" and "razglej se gumb odstrani".

The table of contents shipped folded (§73.1), which is an offer nobody can see, and the button above
it did exactly what the first line of the list does — two controls for one act, one of them to
mis-tap. So the list is drawn open on every surface that offers the tour, and the button is gone
from all of them: the sandbox card, the demo-data card on a working database, and the empty app's
invitation card.

Dropped where the notice is RESOLVED, not where it is written. The action is stored in the trainer's
own database — `tests/fixtures/devices/p_era_install.json` has two of them — so removing it from
`data/messages.js` alone would have left the button standing on every install that already had one.

The list moved ABOVE the card's actions in the same change. Rendered below them it put the
friendliest offer on the card directly under the most destructive one, *clear demo data*, which is
the 2026-08-18 report all over again in a new shape; the medium test that measured that gap now
measures it from the last chapter row.

### 73.8 [x] The chapters carry Simon's own names — shipped 2026-09-21

Named by Simon 2026-09-21, in Slovenian, for the four chapters the index offers:

| chapter | before | now |
| :--- | :--- | :--- |
| `trainer-details` | Tvoji podatki | **Vnesi svoje podatke** |
| `arrive` | Prijatelji se oglasijo | **Sprejem treh novih strank** |
| `gym` | V telovadnici | **Izvedba in prilagoditve treninga** |
| `evening` | Večer po vadbi | **Pregled zaznamkov in priprava treningov** |

Only the capitalisation of his draft was changed, to match every other title in the app. The English
says the same thing rather than the old wording: *Enter your own details*, *Taking on three new
clients*, *Running the session and adjusting it*, *Reviewing the notes and preparing sessions*.

A chapter's title is also the heading on the card that OPENS it, so these are read twice: once in
the list, once by the viewer who chose it.

---

### 73.9 [x] The splash's walkthrough button went the same way — shipped 2026-09-21

Not asked for in as many words: Simon's instruction named the message feed's *Razglej se*. The splash
carried the identical redundancy — a **Guided walkthrough** button directly above a list whose first
line starts the same tour at its first chapter — so the rule he gave for one surface decides the
other, and it was done rather than asked about: where the choice is between wordings or approaches,
the agent picks one and reports what it picked over what.

The onboarding offer is now three things: explore with demo data, the tour's chapters, start with an
empty app. The list's heading carries the offer the button used to make.

---

### 73.10 [x] A chosen chapter counts inside itself — fixed 2026-09-21

Reported by Simon 2026-09-21: "številčenje ni prilagojeno poglavjem, včasih je bilo to zahtevano,
sedaj pa naj bodo številke omejene na velikost poglavja."

He is right about both halves. Counting across the whole story WAS the requirement, and the reason
still stands where it was made: the story crosses to the client's own page half way through, each
side is a separate boot, and a count that restarted there made the viewer watch "step 10 of 41"
become "step 1 of 8" and then "step 11 of 41", as if they had wandered into something else.

What changed underneath it is what a chapter IS. It used to be a way of joining a long story
part-way, so its number was a place in that story. Since the table of contents shipped it is how the
tour is offered at all — a viewer picks a chapter and watches that chapter, and "step 18 of 41"
measures them against four minutes they never asked for.

So the count is scoped to what is PLAYING, and to nothing else: a run that named a chapter counts
inside that chapter, a whole-story run counts across the whole story.

That made the handover a decision rather than a detail. It used to navigate to
`intake?demo=story&chapter=intake`, which under the new rule would have made the client's page count
inside her own chapter — the exact §38.9 defect. It now hands over the story and names no chapter;
her page is the only client-surface chapter there is, so the surface filter finds it without being
told, and the count carries across the two phones. A link that does name `chapter=intake` still
plays just that chapter, counting inside it, which is what such a link now means everywhere.

---

### 74.1 [x] The filter chips break into two rows on a desktop — fixed 2026-09-21

**Measured at 1440px wide before the fix:** the board's column is 480px, the header gave the chips
274px of it, and the three chips landed on two rows — *Datumi* and *Stranka* at y=75, *Lokacija* at
y=112, in a header grown to 99px.

The cause was a media query reading the wrong width. The header flipped from a column to a row above
600px so the chips could sit beside the title — but 600px was the VIEWPORT, and on a desktop this
component lives in a 480px column beside the other views. A component asked about the screen it was
on instead of the space it had.

It is a container query now, on the view around it, because a container query styles what is INSIDE
the container and never the container itself. Measured after: one row of chips at 1440px, 1024px and
390px.

The header is 103px instead of 99px, and that is the trade: the title takes a row of its own so the
three chips can share one. At 480px they cannot do both — the title and the chips together need
479px before any gap.

### 74.2 [x] Today belongs in the calendar — shipped 2026-09-21

*Danes* left the title row for the date filter's calendar panel. It is the one control that means a
day, and the calendar is where days are chosen — the same argument that removed the old *jump to
date* button in §45.6.

It moves BOTH things on screen: the board to today, and the grid back to this month. Moving one
would be a control that half works — the trainer would be looking at this month's grid over a board
still showing March.

It lost its disabled state, which used to say "you are already on today". That state lived on a
button in the title row that knew which day the board had scrolled to; the filter row does not, and
teaching it would be coupling bought for a greyed-out button. In the calendar the control always has
something to do, because it moves the grid as well.

`renderSessionsTitleBar()` went with it — the button was the only thing it drew, so it was a
function that did nothing, in three call sites.

### 74.3 [x] The calendar's month and year are chosen, not stepped to — shipped 2026-09-21

The month and year were a label between two arrows, so a session three months out was three taps and
one next year was twelve. They are native `<select>`s now, for the same reason the client and
location chips are: the phone's own list beats any popover written here, and it costs nothing.

The year list is bounded — last year through the year after next, plus wherever the arrows have
taken the grid, so the control never shows a value it does not hold. A trainer schedules within
about a year either way, and a select holding a century is a scroll on a phone held in one hand.

---

### 74.4 [x] The app ships the symbols and emoji it writes — shipped 2026-09-21

Reported by Simon as part of "manjkajo glyphi v aplikaciji", and separate from §74.5: that one was
four Font Awesome icons, this one is the app's own TEXT.

**Measured against the font files themselves:** of the eighteen characters above Latin that `src/`
can print, fifteen were in no file the app ships — ☰ ✕ ✎ ⚠ ▾ ⋯ → ✓ and the emoji 👋 🧪 📅 🚀 🔬 🔥 💪.
Only the em dash, the en dash and the ellipsis were there. They rendered on a developer's machine
because the SYSTEM supplied them, which is the one thing this app relies on nowhere else: every
typeface and every icon is vendored so a first load in a basement gym needs no network and no host
font. On a phone with a thin font set they are empty boxes, and one of them is the ☰ that the sandbox
card names as the way out.

**Ruled by Simon, 2026-09-21: the characters stay.** The cheaper way was to take them out of the
sentences and let the icon font draw them — cheaper because it ships no font, wrong because an icon
is an element while a translated string reaches the screen as text (`textContent`, or escaped), so
an icon cannot sit inside a sentence. Every such sentence would have had to be rewritten in both
languages to say the shape in words: "Pritisni ☰ — tri vodoravne črtice" becomes "Pritisni gumb s
tremi vodoravnimi črticami". That is a rewrite of his copy, not a technical change.

**So they are vendored, 17KB for the pair**: `librept-symbols.woff2` (1.3KB, cut from DejaVu Sans)
and `librept-emoji.woff2` (16.1KB, cut from Noto Color Emoji, in colour). One family name in the font
stack, two files behind it split by `unicode-range`, so the emoji file is fetched only by a page that
shows an emoji. Both are precached with the rest of the shell, because a trainer with no signal must
still see that ☰.

One character had no source at all: `＋`, the fullwidth plus, in the "new circuit" option of a
`<select>`. A `<select>` cannot hold an icon, so a character is the only mark available there — it is
now the ordinary `+`, which every face already carries.

**The check is a browser with no fonts of its own.** Comparing renderings on a normal machine cannot
answer this question: the subsets are cut from DejaVu and Noto, which are exactly what a Linux box
falls back to, so "the app drew it" and "the system drew it" are the same pixels — measured. So
tests/e2e/test_text_glyphs_render.py launches its own browser against a fontconfig holding one Latin
face (`tests/fixtures/fonts/thin-device-latin.ttf`, DejaVu cut to bare ASCII), where a character that
appears can only have come from a file the app ships. It was proved to fail in both directions before
it was believed: remove the symbols file and it names the seven symbols, remove the emoji file and it
names the eight emoji.

**Three measurements were wrong before one was right**, and each error is worth keeping because each
has already been made twice today. A box is ink, so "did it draw something" says yes for a missing
glyph. A face is fetched when something LAYS IT OUT, and a canvas drawing is not that, so an untouched
face measures as missing. And `document.fonts.check()` answers about the loaded face and its declared
`unicode-range`, not about whether the glyph is in the file — it said all eighteen characters were
fine while seven of them were not.

---

### 74.5 [x] Four icons had no glyph, and the check could not see it — fixed 2026-09-21

Reported by Simon as "manjkajo glyphi v aplikaciji". Four icons drew a crossed box instead of
themselves: both of the calendar's month chevrons, `id-card` in the ☰ menu's My details row, and
`paperclip` on the story's attachment.

**The font was a month behind the app.** The subsets in `src/fonts/` were cut on 23 August; the
calendar's arrows arrived on 11 September with §45.6, My details with §45.2, the attachment with
§38.22. `agent_tools/font_subset.py` was never run again, so their codepoints were never cut into
the font — and `options.notdef_outline = True` means a codepoint the font lacks draws the box rather
than nothing.

**Three checks stood between that and a trainer, and all three were green.**

`icon_coverage.py` compares the class names in `src/` against the stylesheet, and the stylesheet is
upstream's complete one — it declares every Font Awesome icon whether the subset carries it or not.
Its own docstring calls the CSS "a faithful manifest of the font beside it"; that is true only on the
day the font is regenerated.

`test_icons_render.py` renders every icon and fails on one that "draws nothing". A notdef box is not
nothing.

And the recorded baseline held the box as those icons' correct shape, so the comparison agreed with
itself. Six icons shared one picture in that file, which is the plainest possible sign — two
different icons cannot look identical.

**What was fixed.** The subsets were regenerated (8KB, 93 glyphs), the baseline re-recorded, and the
renderer now compares each drawing against what that same font draws for a codepoint no icon font
carries: a box is therefore not a drawing, and the existing "draws nothing" test fails on it. A
second test refuses two different codepoints that draw the same picture.

**The renderer was also reading two icons off the wrong face.** It tried `fa-solid` first and took
whatever "drew something" — so for `github` and `google-drive` it took the solid font's box and never
tried the brand face at all. The app itself drew them correctly the whole time; only the record was
wrong. Fixing the box rule fixed that too, once the brand face was forced to LOAD: a web font is
fetched when something lays it out, and a canvas drawing is not that, so the face the tool was
measuring had never been downloaded.

**A measurement in this same session was wrong first, and is worth keeping.** The first attempt
compared each icon drawn in the icon font against the same codepoint drawn in a font that does not
exist. Both draw a box; the two boxes differ slightly in metrics, so the comparison said "it draws"
for every icon, and the report that went with it — "all 93 icons are sound" — was false. The
comparison has to be against the SAME font's own missing-glyph mark, which is why that is what the
tool now does.

---

### 72. [x] Should every evening of a repeating session be stored? — decided 2026-09-21: no

Asked by Simon 2026-09-21, after reading §70's rollback walk-through: does schema 4 have to store a
repeating session as many individual evening records? And, put as a view rather than a question,
storing them individually would be better anyway, because it allows changing times, cancelling
evenings and skipping holidays.

**The literal question, answered first: no.** Schema 4 declares both `sessions` and `sessionSeries`.
The schema in §70's walk-through that loses the evenings is one that does NOT declare
`sessionSeries` — schema 3, for instance.

**The three things that view wants already work**, read from
[sessionSeries.js](src/domain/sessionSeries.js) the same day (Claude). The model is not "a rule
instead of records", it is both at once:

- `sessionsWithSeries` returns the stored sessions, plus the evenings each rule still owes, minus
  the evenings a stored session already speaks for.
- `occurrenceAsSession` turns a derived evening into a stored record as soon as the trainer opens,
  moves, cancels, starts or edits the plan of that evening.
- Cancelling is a stored record with `cancelled: true`, not a deletion, because the rule would
  otherwise produce the evening again.
- Moving keeps the original `occurrenceDate` and takes a new `startDate`, which is what makes a
  second invitation a change to the same evening rather than a new one.

So changing a time, cancelling an evening and skipping a single date are all supported today. The
two models differ only over evenings **the trainer has never opened, moved, cancelled, started or
edited**.

**What storing every evening would cost:**

- **An open-ended series cannot be stored at all.** `until` is optional, so "Tuesdays at six until I
  say otherwise" has no last row. It would need a horizon and something to extend it, and with no
  server that something runs when the app opens — a trainer who does not open it for two months
  opens an empty board.
- **Every edit to a rule becomes a rewrite of every future row**, and worse, moving ONE evening
  stops being distinguishable from re-timing the whole series. Today those are two different acts.
- **The client's calendar.** `calendarInvite` sends the RULE, so a client's calendar holds one entry
  for "Tuesdays and Thursdays at six". Stored evenings would send fifty. That is client-facing.
- **Erasure (§65).** The ruling there removes a rule that exists for the erased client alone: one
  record. Stored evenings make it N records to find.

**Where the view was right, and it is worth keeping:** a plain session row does survive a schema
that knows nothing of series. That is a real advantage and it is what §70 is about — but the fix is
§70's, so that switching to a narrower schema does not destroy what it cannot read. Changing the
domain model to suit a storage problem would let storage dictate the domain.

**The one thing the current model genuinely cannot do:** say what the schedule USED to look like. If
a trainer changes a series' time in March, nothing recovers what the board showed in February.
Stored evenings would. Not pursued: sessions that actually happened become `history` records
anyway.

**Decided 2026-09-21 (Simon): the model stays — the rule is stored once, and an evening becomes a
stored record only when the trainer opens, moves, cancels, starts or edits the plan of it.**

Holidays are open regardless of this, as §1.4: the mechanism exists (cancel that evening), what is
missing is importing a holiday and gym-closure calendar so it need not be done by hand.

### 69. [x] One board test fails for a whole hour every night — fixed 2026-09-21

Found 2026-09-21 at 00:29 (Claude), while running the JS unit tier before the gate for §60. It had
nothing to do with that change: it failed on a clean tree, and would have failed on any change run
between 00:00 and 01:00 local time.

`nothing on a fresh board is overdue by more than its own day` in
[seedBoard.test.mjs](tests/unit_js/data/seedBoard.test.mjs) failed with the two seeded live
sessions, `s01f2e3d` (Group Strength & Conditioning) and `s09f2e3d` (Return-to-Play Rehab), both
reported overdue by one hour.

**The test disagreed with the seed on purpose, and the seed was the one that was right.** Both
sessions are `slot(-1, +1)` in [sessions.js](src/data/sessions.js) — started an hour ago, still
running — and the helper's own comment says the spread is anchored on the real current hour and
**allowed to cross midnight**, because the point of the dataset is that something is live whenever a
trainer opens it. An earlier clamp that kept the spread inside one calendar day was removed for
exactly that reason.

The test then cut at the start of today and required anything earlier to have arrived finished. At
00:29 the pair had started at 23:29 **yesterday**, so a session that is deliberately live was
counted as stale.

**Fixed by measuring elapsed time instead of the calendar day**: an unfinished row more than 24
hours past its start is stale. That is the threshold the test's own name states, and it is not tuned
to pass — the only unfinished rows in the past are the live pair at one to two hours, the next
unfinished row is in the future, and the defect the test was written for was reported at 64 hours.

Both directions were proved rather than assumed: the test passes on the real seed, and a probe
session inserted three days back and unfinished was caught at 55 hours, then removed.

Not the same as §53, which is two tests that fail when the machine is busy. This one was a clock
boundary and was deterministic inside that hour.

### 60. [x] A numbered schema changed shape without a new number — ruled and enforced 2026-09-21

Raised 2026-09-17 (Simon): in a released product, adding `alias` to schema 4 would have needed a
new schema version. Checked against the documents (Claude): two rules disagree.
[DATA_MODEL.md](docs/DATA_MODEL.md) says a schema major is bumped only when a migration step is
added, and an added optional field needs no step. The same document says two files declaring the
same numbered schema have the same shape by definition, and
[recordSchemas.js](src/data/recordSchemas.js) that a numbered shape does not move. `alias` went into
schema 4 on 2026-08-11 (fc51141), so "4" now names two shapes.

What that costs once there are released installs: a file or a Drive copy written by the newer build
is accepted by an older one, which keeps the field but knows nothing of it — cannot show it, and
cannot clear it on an erasure (§59 shows the newer build forgets it too).

**Re-read from the code 2026-09-21 (Claude), and it was worse than the section said: schema 4 had
moved four times, not twice** — `alias` (fc51141, 08-11), §61's `startDate`, `seriesId`,
`occurrenceDate` and `cancelled` plus the `invites` and `sessionSeries` collections (09-17), and
§62's `completed`, `duration`, `titles` and `icon` (09-19). "4" named four shapes.

Found with it: the claim that costs nothing in code. The restore path accepts fields it does not
know — `fieldIssues` says nothing about undeclared fields and `groupRecordsByCollection` accepts
unknown collections on purpose — so an older build keeps a newer file's extra field rather than
breaking on it. The promise "same number, same shape" was carrying one sentence in
[backupFile.js](src/data/backupFile.js), not one line of logic.

**Ruled 2026-09-21 (Simon): the schemas are frozen.** Any change to a numbered shape — a field
added, removed, retyped or turned required — mints a new schema number, **even when the migration
step does nothing**. Claude had argued against it on cost (a new number, a no-op step, a store and a
fixture for one optional field); Simon ruled it anyway, and on re-reading it is the better call: it
makes the promise true instead of deleting it, and it resolves §58 by itself, because PREVIEW is
unnumbered and may therefore stage fields freely.

**Ruled with it (Simon, same day): every numbered schema stays live**, and **retiring one is a
deliberate decision** rather than a side effect of cutting the next. The quantity that decision
manages is how many star writes happen at once — each live schema is one more store, one more full
copy of the data, one more write per fan-out.

**Accepted with it (Simon, same day):** an older build now refuses a backup written by a newer one
even when the only difference is an added optional field, because `formatVersion` and
`schemaVersion` are one number by design (decided 2026-08-15). Two independent numbers were offered
again and declined again.

**What shipped 2026-09-21:**

- The rule in [DATA_MODEL.md](docs/DATA_MODEL.md), under *A numbered shape is frozen*, with the
  retirement clause and the refusal cost stated in the same place.
- **Schema 4 frozen as it stood that day; the history is not renumbered** — installs hold "4" data
  in all four shapes with no way to tell them apart, so the rule runs from the next change onward.
- `tests/fixtures/schemas/schema_4.json`, the exact shape, and two tests in
  [recordSchemas.test.mjs](tests/unit_js/data/recordSchemas.test.mjs): one fails the build when
  `SCHEMA_4` differs from the fixture by so much as a `required` flag, the other when a live
  numbered schema has no frozen fixture at all. Both were proved to fail by adding a field and
  watching them break, then reverting it.
- The freeze written at the declaration itself in
  [recordSchemas.js](src/data/recordSchemas.js), where someone about to add a field is looking.

**Unblocked by it:** §50.3's record badges, which were waiting on where a new field may be declared.
They go into `SCHEMA_PREVIEW`, and mint a number when they graduate.

### 54. [x] The past cards on the clipboard write their date as "20. jul." — fixed 2026-09-20

Seen 2026-09-14 on the demo data, while checking §52.2. A past card's badge read "Past: 20. jul."
(`dateStr` passed to `buildPastExerciseItems` in
[exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js)), and "Past" was English on
a Slovenian screen. The app writes a date as ISO everywhere, in every language, so it should read
2026-07-20, and the word should come from the dictionary.

**Fixed 2026-09-20 (Claude).** Two defects, one line each:

- The deck built the date with `toLocaleDateString(state.lang === "sl" ? "sl-SI" : "en-US",
  { month: "short", day: "numeric" })`. That asks the DEVICE how to write a date and drops the year
  entirely, so the same record read "20. jul." on one screen and "Jul 20" on the other, and neither
  said which year the set was lifted in. It now goes through `getISODateString`, like every other
  date the app shows.
- The word beside it was written into the markup as `Past:`. It comes from the dictionary now, as
  `last_time` — "Last time" / "Zadnjič", which says what the card IS (the client's most recent
  session) rather than naming a tense.

Pinned by `test_the_past_card_writes_its_date_as_an_iso_day` in
[tests/medium/test_clipboard_card_design.py](tests/medium/test_clipboard_card_design.py), the file
that already owns the deck's status tags. It seeds one history record on a fixed date — not one
relative to the frozen clock — because what is asserted is how the date is WRITTEN.

### 55.1 [x] A history record opened from the clipboard reads "Untitled Session" and offers Start — fixed 2026-09-20

Seen 2026-09-14. A past session opened by pulling the plan aside (§52.2), or from the History view,
showed "Untitled Session" in the title bar and the Start button, although it is a finished record.
Pulling makes this path far more common than it was.

**Fixed 2026-09-20 (Claude).** `openSessionFromHistory`
([sessionLifecycle.js](src/controllers/sessionLifecycle.js)) built an active session that carried
nothing saying which record it came from: a planning draft got a `sourceSession` with
`isPlanning: true`, and a finished record got `null`. Everything downstream then read it as a
session staged to be run — the title bar fell back to `untitled_session`, and `canStartSession`,
which knew only about edit mode and planning mode, offered Start.

It now sets `finishedRecord: { id, title }` on the session instead:

- The title bar names the record (`finishedRecord.title`), and an unnamed one reads
  `finished_session` — "Finished session" / "Zaključen trening" — rather than "Untitled Session",
  which describes nothing on a screen whose whole subject is a session that already happened.
- `canStartSession` takes it as its third term, so neither Start nor the Complete footer is offered.

**Deliberately NOT a second `sourceSession`.** That field means "the booked slot this clipboard was
launched from", and every reader of it would have been handed a slot that was never booked — the
clipboard strip prints `sourceSession.timeLabel` straight into its meta line, and the schedule-drift
offer writes back to the sessions a slot names.

Pinned in two files, each the one that owns the rule: the title in
[tests/medium/test_clipboard_title.py](tests/medium/test_clipboard_title.py), Start and Complete
in [tests/medium/test_clipboard_complete_action.py](tests/medium/test_clipboard_complete_action.py)
— the latter with `started: false`, since a started session hides Start anyway and the fixture's
default would have proved nothing.

### 55.2 [x] Blossom's future colour is too light for text — fixed 2026-09-20

Measured 2026-09-14 while checking §52.2: `--temporal-future` in
[blossom.css](src/modules/themes/blossom.css) read 2.46:1 to 2.69:1 as text on its own surfaces,
under the 4.5:1 a line of text needs. The plan drawn under the blanket colours future exercise names
with it, and so does the "no next plan" line.

**Fixed 2026-09-20 (Claude).** Re-measured first, with the contrast test's own arithmetic: rose-400
`#fb7185` gives 2.68:1 on the card and 2.46:1 on the page field — the reported numbers exactly. It is
now rose-700 `#be123c`, at 6.25:1 and 5.76:1, which stays in the same rose family beside the pink
primary. Every other theme was measured at the same time and all of them already passed; Blossom's
past colour is 5.35:1 / 4.93:1 and stayed as it was.

**What stops the next one.** [tests/unit/test_theme_contrast.py](tests/unit/test_theme_contrast.py)
held only `--text-muted` to a bar, so an accent read as text was outside every check — which is why a
pastel sat there unread until someone looked at the screen. It now sweeps `--temporal-past` and
`--temporal-future` in every theme, on the card and on the page field, at 4.5:1. The bar is 4.5 and
not the 6:1 the muted text carries: these are accents on a plain surface, not body text a component
may tint further, and 6 would fail three themes that are perfectly readable.

### 64. [x] The gate fails on a different test each run, and each one passes on its own — fixed 2026-09-19

Measured 2026-09-18 (Claude) while gating §61's PREVIEW work. Three runs of `build check` on the same
tree, each red in a different place:

- **15:16** — stage 4, OWASP ZAP: the container stopped after 11s with a three-line log
  (`Unable to copy yaml file to /zap/wrk/zap.yaml`, then `Failed to access summary file`). The same
  docker command run by hand on the same tree: `WARN-NEW: 0`, exit 0.
- **15:23** — stage 3: `test_lang_param_preselects_language` and
  `test_getting_the_guide_out_of_the_way_is_one_tap_and_takes_nothing_with_it`, both timing out at 20s
  on the app's boot. Alone: 2.7s, both pass. The whole e2e stage with the gate's 8 workers: 271 passed.
- **15:33** — stage 2: `test_the_guide_stays_inside_the_modal_it_had_to_move_into`, which measured the
  guide's frame as outside the dialog. Alone: passes in 1.1s. The whole medium stage: 394 passed.

**Not the change under test:** boot timing measured five times on the working tree and five on HEAD —
939/2098/1695/1686/1732 ms against 989/2033/1762/1734/1739 ms.

- **16:19** — stage 2 again, three at once: `test_a_demo_store_is_named_a_demo` (`window.showBuildState
  is not a function`, i.e. the stub's module never finished loading), `test_the_trainer_sees_what_the_gym
  _said_while_shaping_the_next_plan` and `test_a_slot_field_is_the_app_s_own_control_not_the_browser_s`,
  both timing out on a selector. The three files alone: 23 passed in 16s.

**Where the load came from, found afterwards:** a second agent session was working in the same tree
through the same hour and committed 15adb99 at 15:57, running its own browser suites while this one
gated — although the claim note in `.private/AGENT_SYNC/` said the whole tree was held. Its commit
touched only its own files, so nothing was lost; the contention was the cost.

**The pattern, after five runs: the gate passes on an idle machine and fails on a busy one.** The one
green run started at load 1.45; every red one started at 3.0 or higher, with the five-minute average
between 8 and 13 — mostly from the targeted test runs used to check the change before gating. The dev
server is already threaded (`ThreadingHTTPServer`), so it is not the single bottleneck it looked like.

**Open:** what the failures have in common. Two are about a measurement taken before the app has settled
(a boot wait, a layout read), which is the shape that fails under load; the ZAP one is its own. A gate
that is red for a reason nobody can name is a gate nobody will believe — and rules forbid re-running a
failure away, so this blocks every commit while it lasts.

**Fixed 2026-09-19 (Claude): the gate does not start on a busy machine.** Before stage 1,
`build/__main__.py` asks [quiet_machine.py](build/quiet_machine.py) whether the 1-minute load average
is at most an eighth of the cores (2.0 on this 16-core box — above the greens' 1.45, below every red
run's 3.0). If it is higher the run waits, saying the load it sees, polls every 30 s for ten minutes,
and then refuses with a line naming the cause and what to stop. The load is read there and nowhere
later: between stages the load average is the pipeline's own exhaust, which is why scaling worker
counts by it was tried on 2026-08-04 and reverted the same day.

**What this does not do, plainly:** it does not make the tests robust under load. It removes the false
red — a gate that says a tree is broken when the machine was saturated — and leaves the tests'
timing sensitivity where it belongs, in §53, which stays open because a slow phone in a gym sees the
same thing and cannot be told to wait for a quiet machine.

---

### 62. [x] Feature code may write only what the live schema declares — shipped 2026-09-19

**Ruled 2026-09-17 (Simon), a release constraint:** a schema is released before or together with the
code of a feature that uses it, never after, or the feature breaks for the trainers using it. P is
only for CI and for previewing an upcoming version; a demo for a client does not need it.

Asked with it: can an E2E scenario cover this? **Proposed (Claude), not ruled:** not one scenario,
but a check in every browser test. The store records each written record that has a field or a
collection the live numbered schema does not declare, and the test fails naming it. One scenario
would only prove the paths it walks; the whole suite walks every feature it tests, and a feature
without a test is a gap either way. A unit test does the same for every collection a projection
knows. **It cannot be switched on before §61**: today it would fail at once on the four session
fields and the `invites` and `sessionSeries` collections.

**Asked with it (Simon): that check protects trainers — how is reading P tested in CI?**
**Ruled 2026-09-17 (Simon): the browser tests run twice.** Proposed shape (Claude): a second pass of the browser tests that reads P instead of 4, with
the same check held against P's declarations. Its first boot fills P from data written at 4, so it
proves the upcoming version works on the data trainers hold now. The pass runs only while P differs
from the live schema — decided by comparing the two declarations, never by a setting — so right after
a release, when there is no preview shape, it costs nothing. While it runs it roughly doubles the
browser-test stage, locally and in CI alike. Today
[test_read_schema_toggle.py](tests/e2e/test_read_schema_toggle.py) proves only that switching
between the stores keeps them complete, not that the features work on P.

**Shipped 2026-09-19:**

- **After every browser test, the app's own databases are read** and the test fails if any stored
  record carries a field, or sits in a collection, no live schema declares
  (`stored_records_match_their_schema` in [conftest.py](tests/conftest.py)). Read from the stores, so
  no production code carries a check that exists for the tests. It found four fields the app had been
  writing into shapes that did not know them: a session's `completed` and `duration`, a
  notification's `icon`, and the legacy `titles` a migrated pre-rename database still carries. All
  four are declared now.
- **The browser suite runs a second time reading PREVIEW** (`run_e2e_preview_tests`), demo files
  included, as a Stage 3 task and a CI job the deploy waits for. It skips itself, saying so, when
  PREVIEW declares nothing beyond the active schema. Measured 2026-09-19: 271 tests, 3m40s per pass.
- **Which schema a pass reads is a pytest option** (`--read-schema=PREVIEW`), not an environment
  variable: the suite clears ambient settings on purpose, and a second pass is the runner's
  instruction rather than something a test could inherit by accident.
- **Ruled 2026-09-19 (Simon): every build must check that the demo still works on the active schema
  and that it works on PREVIEW.** Both passes run the demo tests, and the seed data is validated
  against every live schema by walking `LIVE_SCHEMAS` — so minting schema 5 makes that test demand
  the demo fit it, with nothing to remember.

It also found a real defect in the preview store: an install already reading PREVIEW came up on an
empty store the first time a build provisioned one, because the fill only ran when the build stamp
had changed. It now fills whenever the store is not ready.

**Reshaped the same day, ruled by Simon: a regression suite and a stage of its own.** Running the
whole browser suite twice — once per schema — was replaced by a clearer split:

- **Stage 3 follows the work in hand** and pins its e2e and demo runs to PREVIEW while a preview shape
  exists. One pass, so the gate does not pay for two full suites.
- **Stage 4 is the regression suite**, [tests/regression/](tests/regression/), pinned to the released
  schema: what the shipped version promises the trainers already on it — data survives a reload, a
  backup carries every collection, an erasure leaves no name, the demo loads. Its own directory,
  because when behaviour changes the schema and these tests change together.
- **The OWASP ZAP scan became stage 5**, with the CI job graph following the same order.
- Simon named the risk himself: keeping two suites in step when a new build lands.
  [test_frozen_schema.py](tests/regression/test_frozen_schema.py) answers it — the suite records the
  released schema it froze, and fails the day the app's released schema moves past it, so the review
  is deliberate rather than forgotten.
- **What this trades away, stated plainly:** the full suite no longer runs on the released schema.
  Whatever the regression suite does not name is proved only against the preview shape.

---

### 66. [x] A session may not be named after a client — shipped 2026-09-18

**Ruled 2026-09-18 (Simon)**, after asking how trainers are kept from putting names into session
titles: check every single word against every client's name and REFUSE the save, with a message the
trainer can act on. Then: match whole words only, outline the field, and show the offending word in
the message, bold and coloured.

**Why refusing beats cleaning up.** A name typed into a session's name or location is a name the app
can never take out again: scrubbing prose needs the name, and after an erasure the name is gone
(§65). The participants are already on the record as ids, so the name adds nothing the app did not
know.

**What shipped.** [clientNameWords.js](src/domain/clientNameWords.js) folds case and accents, splits
on anything that is not a letter or a digit, and takes names, surnames and aliases from three
characters up — two-letter names would refuse ordinary titles and leave a trainer unable to start a
session. An erased client's pseudonym is not blocked. The session form checks the name and the
location before anything else, outlines the field, and quotes the word back in bold.

What it deliberately does not cover: free text elsewhere — a routine's name, a feedback note, a gym
note — which stayed open as §67.

---

### 59. [x] Erasing a client keeps their alias — fixed 2026-09-18

Found 2026-09-17 (Claude) while checking what a numbered schema may carry: `eraseClientRecord` in
[clientErasure.js](src/data/clientErasure.js) copied the whole client and cleared only email, phone,
goals, notes and injury. `alias` was not in that list.

**Why that mattered.** The alias is the trainer's own label for telling two same-named clients apart,
and the form asks for exactly the words that identify one — a surname, or a detail about an injury.
It is drawn beside the name on every screen that shows a client, so an erased record went on naming
the person its pseudonym exists to hide: the erasure was not an anonymisation. No test checked it.

**Fixed** by adding `alias` to the cleared fields, with a test that fails without it — it asserts the
label is nowhere in the erased record, not merely that the field is empty.

---

### 1.1 [x] PT-side client assignment to a session
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md). Invites are `.ics` + `mailto:`, because there is no
backend to send mail from (§1.5).

---

### 3.3 [x] Google Drive periodic sync

Shipped 2026-08-02, manual-only as of §3.10 — [CHANGELOG](CHANGELOG.md) carries the decisions worth
not re-litigating (no visible Drive file ever; three-way merge, so no Lamport pair and no tombstones).
Setup steps live in [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md), written against role
handles and naming no credential, so the procedure is reviewable in the open.

**Unblocked 2026-08-12** by a real OAuth client id in
[driveSyncConfig.js](src/data/driveSyncConfig.js). Two consequences worth knowing:

- **Only listed test users can grant access.** The OAuth app is in *Testing*: 100 explicitly-listed
  accounts, everyone else gets `403: access_denied`, and refresh tokens expire after 7 days. Demo
  users are unaffected (`?init=demo_data_load` never contacts Google). Publishing WITHOUT verification
  is the useful middle state — it drops the manual list and the 7-day expiry, keeping the 100-user cap
  and an "unverified app" warning.
- **The connected state is unreachable from any Playwright tier** — Google fingerprints and blocks
  automated browsers on `accounts.google.com`, which is what [tests/live/](tests/live/) exists for.
  `tests/medium/test_drive_sync_ui.py` pins configured-but-not-connected instead.

**Not built**: incremental sync via the Drive Changes API. Every pass moves the whole file — correct,
not bandwidth-minimal.

---

### 3.5 [x] Paper consent — checkbox, signed date, form version, and delivery
**Decided 2026-07-22: KISS — consent lives on paper.** The client signs a form kept at the gym; that
physical file is the evidence. No photo capture, no image storage, no IMAP — considered and dropped,
and still dropped. **Shipped 2026-08-09**, per client and per language — see
[CHANGELOG](CHANGELOG.md) for the editable signed date, the versioned letter, the localised client
documents and why the archiving reminder is a dialog rather than a tooltip.

One amendment to the 07-22 decision worth recording: the `mailto:` delivery trigger was to be removed
once paper consent landed. **Reversed on request (Simon, 2026-08-09)** and given an SMS sibling — a
trainer who has to produce the letter themselves before the first session will not, and both buttons
open the device's OWN mail/messaging app, so neither is an "email flow" in the IMAP sense rejected
above.

**Still open**: `PRIVACY_FOR_TRAINERS.md` and `PRIVACY.md` remain English-only (they are read by the
trainer, not the client), and the Slovenian client documents are maintainer translations that have
**not** been reviewed by a data-protection lawyer — each says so at the top. That review is a launch
prerequisite for §23.6, not a code task.

---

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB
Engine decision and sizing live in §18.6. The Export/Import JSON backup remains the user-facing
escape hatch (§3.3, §18.7).

---

### 3.8 [x] Unbacked-data warning banner — same weight as the PREVIEW badge

**Shipped 2026-08-13.** [backupHealth.js](src/data/backupHealth.js) decides,
[backupHealthController.js](src/controllers/backupHealthController.js) keeps it current, and
`renderBackupBadge` shows it beside the PREVIEW tag. Three things worth not re-deriving:

- **A `{id, hash}` fingerprint, not a snapshot.** Counting "changes since the last backup" needs a
  reference point and records carry no `updatedAt`. Storing a full state copy (as the Drive ancestor
  does) works and was rejected: it roughly doubles what the database holds, and a feature that exists
  to warn about STORAGE EVICTION must not be a cause of it. `countChangedRecords` diffs two
  fingerprints unchanged, since it compares any two state-shaped objects.
- **Time alone never fires.** A database backed up a year ago and untouched since is still backed up;
  warning there teaches the trainer the badge means nothing. Never-backed-up is judged on count
  alone, because there is no timestamp to measure an interval from and inventing one would nag
  someone still evaluating the app with three test clients.
- **`onStateSaved` had to become additive first**, and that is the sharp lesson. It stored ONE
  listener in one slot, which was indistinguishable from correct while the ahead/behind badge was its
  only consumer. Registering this feature's listener silently *unsubscribed* the badge, which then
  showed whatever it had last rendered — nothing threw, and the only symptom was a number that had
  been right a moment earlier. Pinned now by `tests/unit_js/data/stateSavedListeners.test.mjs`.
  `onSyncCountsChanged` still has the single-slot shape and one consumer; it is the next one to trip.

Three requirements from the original scope still bind any change: it must be clearable **without Google** (a downloaded backup resolves it exactly as a sync does, or a warning colour is a growth prompt and trainers can tell); it is **not the same number as §3.9's ↑**, which is Drive-relative while this is backup-relative; and it escalates by **colour, never animation** — a permanent pulse in a fixed header is ignored within a day and devalues the PREVIEW badge beside it.

---

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button
Shipped 2026-08-03, fixed at the seam (`onStateSaved`) rather than the ~21 call sites —
[CHANGELOG](CHANGELOG.md).

---

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md).

---

### 3.11 [x] Sync surface — the icon vocabulary and tap-to-sync — SHIPPED 2026-08-12

Split out of 2026-08-12's sync work, which fixed the counter's honesty and its legibility but stopped
before the states around it. All five items built; what shipped, and what was decided along the way:

- **`↑!` past nine, for AHEAD only** — `↑↑` said "many" only to whoever wrote it. **Behind keeps
  `↓↓`**: *behind* means Drive holds changes not pulled yet, so nothing is at risk, while *ahead*
  means those edits exist only on this device. Same width, and the asymmetry is the point.
- **Warning over the cloud on a failed sync**, replacing the sync glyph — a genuine fault earns the
  treatment deliberately withheld from "merely not connected".
- **A muted slashed cloud when not connected** — informational, not an ✕ and not warning colour,
  because [PRIVACY.md](PRIVACY.md) tells trainers local-first is the point. The cloud desaturates
  along with its slash: a bright cloud under a grey slash still reads as connected.
- **Animated arrows while syncing** — Font Awesome's own `fa-spin`, whose stylesheet already cuts
  the animation under `prefers-reduced-motion`, so the guard cannot drift from what it guards.
- **Tap-to-sync when connected**, with the dialog left in the ☰ menu. The two listeners on
  `#backup-btn` became one: `driveSyncUi` answers first and `backupRestore` opens the dialog only
  for the taps it declines. Both exceptions survived — conflicts open the review modal, and a
  failure posts to the notification feed.

The four states live in [syncStatusGlyph.js](src/modules/common/syncStatusGlyph.js), DOM-free so
each is forced to carry a LABEL as well as a shape (the glyph is `aria-hidden`, so without words in
the button's `aria-label` the state would be unreachable on touch and silent to a screen reader).
The failure notification is **synthetic, never stored in `state.notifications`** — a stored one
would ride into the backup file and the Drive snapshot and count as a local change, so a failed
sync would increment the very ahead counter it failed to clear.

---

### 3.12 [x] Ship the remaining trainer-facing docs as pages, not GitHub links

**Shipped 2026-08-13** — six more pages (PREVIEW, bug reporting, and the consent form + privacy
notice in `en` and `sl`), the four in-app links repointed, and `privacy.html` finally linked from the
menu: it had been generated on 2026-08-12 and the link left on `github.com`, so the page shipped for
a day while nobody could reach it.

Two things worth keeping from the build:

- **Link rewriting is the real work, not the table row.** The docs link to each other as repository
  files do (`../PRIVACY.md`, `templates/en/Client_Consent_Form.md`), and rendered into a flat `src/`
  every one of those is a 404. `rewrite_link()` sends a shipped doc to its sibling page and anything
  else to an absolute GitHub URL. A runtime guard against "unrewritten" links was written first, and
  its own test proved it could never fire — the two destinations are exhaustive — so it was deleted
  and the property is pinned by a test instead.
- **The consent URLs had to stay absolute.** They are interpolated into the email a trainer sends a
  client, where a relative `./privacy-notice-en.html` is meaningless. `consentForm.js` derives them
  from `import.meta.url` rather than importing `routerController`'s `BASE_PATH`, since `controllers/`
  is a layer above `modules/common/`.

**Deliberately not done**: `README.md#about-demo-data` ([messages.js](src/data/messages.js)) still
points at GitHub. The README is developer-facing and stays there by this section's own rule — the
right fix is not a seventh page but moving that explanation in-app, which belongs with §9.3/§9.5's
demo-data and onboarding work rather than here.

---

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG
Shipped 2026-07-27 with the continuous-timeline rewrite. The blocking premise (sessions carried no
real date) was resolved by schema 3's `startDate`.

---

### 6.3 [x] The bottom session bar renders nothing — decided: restore, active state only
Shipped 2026-08-08 — [CHANGELOG](CHANGELOG.md). The idle "Next: …" state was deliberately not
restored.

---

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel
Resolved 2026-08-08 (Simon): **CI mirrors the local gate**, four stages chained from one declaration
(`PIPELINE_STAGES`). See `build/__init__.py` for the staged definition and
[CHANGELOG](CHANGELOG.md) for the cost this was overruled on.

---

### 8.1 [x] Bind multiple clients to one shared set of exercises — shipped 2026-08-22
Two or more participants bound to the same exercises, merged into a single combined view — they train
the identical programme in lockstep, so the trainer logs it once instead of switching tabs.

- The **cards are shared**: navigating/logging advances the plan for the whole group.
- **Feedback stays per-person** — one client can find a shared set too hard while another finds it
  too easy.
- **The model, decided by building it**: bound participants SHARE one `clientState` object
  ([participantBinding.js](src/domain/participantBinding.js)). Every existing write — a set logged, a
  round completed, an exercise swapped in the editor — then lands for the whole group without a
  single write site learning that bindings exist; a mirror-on-write would have been a side effect at
  a dozen seams, each of which could be missed. Feedback needed no work at all: it lives on the
  SESSION keyed by client, never in the plan, so "too hard for one, too easy for another" was
  already true.
- **A bound group is one tab**, named with its members' initials — three tabs that always show the
  same plan invite three taps to check whether they still do. One control in the ⋯ menu binds and
  unbinds; unbinding hands each member a COPY of what they were training, because dropping the
  binding alone would leave them holding one object and the next set would still appear for both
  (found by a test, not by reasoning).
- **The bindings are stored beside the plans they join**, because the live session is cached as JSON
  and object identity does not survive it — a restored session would otherwise come back silently
  unbound, logging each set for one person.
- Still open: §1.2's multi-line titles, and per-person signals from INSIDE the bound tab (today the
  trainer unbinds, or switches to that person's tab, to log one).

---

### 8.3 [x] Inline Clipboard Editor — shipped, see CHANGELOG

---

### 8.6 [x] Rests are first-class, focusable plan items — shipped, see CHANGELOG

---

### 8.8 [x] Copy the program to another participant — shipped 2026-08-22
**Raised 2026-08-09 (Simon); built once §8.1 made its open questions answerable.** *Copy this plan
to…* in the session ⋯ menu, listing the other participants by name.

**Every open question below, answered by building it:**

- **To whom** — a participant in the same clipboard, which was named here as the common case (a
  walk-in joining a session underway). Listed by NAME rather than performed by a single action,
  because "to whom" is the entire question and a control that guessed would answer it for them. The
  same client's next session and a routine template stay §17.4's business.
- **What** — the prescription only ([planCopy.js](src/domain/planCopy.js)): movements, targets, rests
  and circuits. Logged sets and completions stay with whoever did them, or a copy would write a
  stranger's numbers into this person's history.
- **Placement** — the ⋯ menu, beside *Everyone on this plan*, rather than the title bar: the bar was
  measured at 48px of icons against 169px of title on a 390px phone (§30.1's neighbourhood), and the
  unit being copied is the whole programme, not a card.
- **Against §8.1** — the two are deliberately adjacent and deliberately different, and the menu now
  states both in one place: a copy DIVERGES the moment either plan is edited, a binding never does.
  Each item gets a fresh id, circuits remapped together, so nothing is shared by accident.

The original notes, kept because they are what made the answers obvious:

- **Copy to what?** The three plausible targets are a different participant in the same clipboard
  (the common case when a walk-in joins a session already underway), the same client's next session,
  or a routine template. The third overlaps §17.4, which extracts a template from *history*; this one
  would act on the plan that is live right now.
- **Copy what, exactly?** Prescription structure only (exercise, sets, reps/targets, rest, circuit
  grouping) or logged magnitudes too. §17.4 already decided that a *template* strips person- and
  day-specific magnitudes; a participant-to-participant copy mid-session probably wants the same
  rule, since the point is a shared plan, not a shared performance.
- **Placement**: it belongs beside the existing edit affordance in the title bar, not on a card —
  the unit being copied is the whole program. Must satisfy the no-hover rule and carry a real touch
  target, not a 9px glyph.
- Interacts with §8.1 (binding several clients to one shared set) — if that ships, a copy and a bind
  are two different intentions and the UI must not blur them: a copy diverges afterwards, a bind
  does not.

---

### 9.3 [x] Selective demo-data removal — shipped 2026-08-10
The demo notice's primary action called `resetLibrePTData()`, which deletes the **whole database** —
fine while the only person pressing it had nothing else, destructive from the moment a trainer adds
real clients, which is exactly when the fake people become a stain worth removing. Now a
confirmation screen that removes demo records selectively. See [CHANGELOG](CHANGELOG.md) and
[UC7](use_cases/uc7_demo_to_clean_database.md). Two rules worth not re-deriving: **provenance is
never inferred from id shape**, and the seeded exercise **catalog is an asset, not a stain** — it is
kept, with the reason it survived shown on its own line rather than in a tooltip.

Also fixed the same week: the seed anchored "today" sessions with a `min(17, …)` hour clamp, so a
demo loaded after 17:00 opened on a wall of already-past sessions counting down in negative hours.
Slots now follow the real clock and may cross midnight, each session's `day` bucket is **derived**
from its timestamp rather than asserted alongside it, and an overdue card flips its label to
"Overdue" instead of printing a minus sign.

---

### 9.4 [x] Simulated finger / touch controller — 2026-08-16
Shipped as [demoHand.js](src/modules/demo/demoHand.js): an overlay pointer that travels to a target,
pulses as a tap, and lets the player dispatch the real interaction underneath it.

**It lives in `src/modules/demo/`, not the `src/demo/` this asked for.** Every other feature sits in
`modules/<feature>/` and `import_layers.py` derives a module's layer from that path, so a top-level
`src/demo/` would have been a directory outside the layering with no rule saying what it may import.
The folder was the incidental part of this item; the pointer was the point.

---

### 9.5 [x] Guided walkthrough engine (step overlay) — 2026-08-17
Shipped: [walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js) over
[domain/walkthrough.js](src/domain/walkthrough.js), reached by `?demo=walkthrough` and by the splash's
own button. **Back / "Show me" / Next**, one step at a time, over the real app.

- **It plays the SAME script as the automatic demo** ([gymFloorTour.js](src/modules/demo/gymFloorTour.js)),
  and shares its tap (`performStep`). Two scripts would have been two things that must stay true of
  the app, which is the failure mode §23.5 chose a script over a recording to avoid — and the demo's
  e2e replay already keeps this one honest.
- **The trainer doing the step themselves is what advances it** — beyond what this item asked for, and
  the reason the app stays fully tappable underneath with no scrim. Completion is the step's own
  expectation becoming true, watched on a poll, so it does not care who caused it. A walkthrough that
  only advanced on its own buttons would be teaching its own buttons.
- **"Show me" is the escape hatch, not the path**, and it withdraws once the step is done: an offer to
  do something already done is a control that does nothing.
- **Back re-explains; it does not undo.** An inverse for every step is an undo stack for a
  demonstration. A step returned to stays done, so re-reading what Too Easy meant cannot log a second
  signal.
- **The splash button is enabled and the "soon" pill is gone** — that control was the last place in
  the app announcing something unbuilt. It carries `?init=demo_data_load` with it, because the script
  drives the seeded group session and a walkthrough over an empty app would point at nothing.
- **Still open — the script is four steps, not six.** This item listed "complete a round" and "review
  an adjustment" too; the shipped script is §23.4's wedge (open the session, focus a circuit, signal
  Too Easy, switch participant). Adding either is a data change in `gymFloorTour.js` plus a caption —
  worth doing only if a viewer is demonstrably left wanting them, since every step is one more thing
  between a stranger and the point.

---

### 12.4 [x] Capture exceptions and offer semi-automatic bug reporting — 2026-08-18
**Raised 2026-07-26 (Simon); shipped 2026-08-18.** [crashReport.js](src/data/crashReport.js) builds
the payload, [appLifecycleController.js](src/controllers/appLifecycleController.js) installs the
`error`/`unhandledrejection` listeners as the FIRST boot step (a crash during boot is the one a
trainer can least describe), and the notification feed offers it. Five constraints that still bind:

- **Non-identifying by construction, not by redaction** — a fixed field list (message, stack, route,
  build, time) and anything else a caller passes is dropped, because a pass that strips known-bad keys
  fails the first time someone adds a field nobody remembered to strip. Names, notes and injuries are
  Art. 9 data (§17.3) and the issue is public.
- **Offer, never send.** A prefilled GitHub issue URL the trainer reviews and submits; no server, no
  telemetry, no `connect-src` change. Automatic reporting would be unannounced egress of a PT's data.
- **The feed, not a modal** — a handler rendering over a live session mid-set is worse than the bug it
  reports. An e2e case asserts no dialog opens and the app stays usable after an uncaught throw.
- **The handler cannot throw**, and a failure inside it is deliberately silent: there is nowhere left
  to report a failure to report.
- **A repeat collapses into a count**, so a render loop throwing every frame cannot evict the report
  that explains how it started. Kept distinct from the integrity error page (`sw/integrity.js`) — a
  corrupt download must never be reported as an app bug.

**The wiring bug the tests caught**, and the reason that e2e case exists: `appBoot.crashLog` was
imported but never re-exported, so the feed asked for the crash log, got `undefined`, and rendered
nothing — silently, because a missing optional dep looks exactly like "no crashes yet".

**Still open, and a maintainer decision: §23.5's feedback route for a PT without a GitHub account.**

---

### 12.7 [x] [CLOSED — measured, do not reopen] ~89 separate module requests on first load
The cheap half shipped (15 `<link rel="modulepreload">` hints on the boot-critical path); page
pooling was built, measured at ~4% of the gate and **reverted** 2026-08-08. Full measurements, and
how to read a subset benchmark, are in [CHANGELOG](CHANGELOG.md) — they are expensive to retake, so
read them before proposing this again (it was mis-recommended as "the next big win" twice).

Bundling remains the only untried half, and it trades away the buildless property — a deliberate
architectural choice, so the bar is high.

---

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`
Shipped 2026-08-04/05 — [CHANGELOG](CHANGELOG.md). See [tests/INDEX.md](tests/INDEX.md) for the four
tiers.

---

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

---

### 13.2 [x] Fast-selection flows over the taxonomy — see CHANGELOG
Restored as a stub because four `src/` modules still cite it. The three scenarios those comments
mean: **A** multi-add from the picker, staying open for rapid entry; **B** swap-by-volume-bucket in
the adjustment wizard; **C** strict taxonomy inheritance when authoring a new movement.

---

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

---

### 14.6 [x] Rename the `booking` domain term to `session` — shipped 2026-07-27
**No back-compat kept** — decided pre-release with no real PT data to protect, so the v1→v2 migration
drops stray `bookings` rather than carrying it forward.

---

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01, see CHANGELOG

---

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01, see CHANGELOG

---

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01

---

### 16.3 [x] [Resolved — superseded by §18.6] Key storage buckets on the DATA SCHEMA, not the release tag
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). `CURRENT_SCHEMA_VERSION` stays a plain integer major:
a "patch" to a schema is either a migration step or nothing.

---

### 16.5 [x] Retire the multi-version hosting machinery from the code — done
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). **Kept**: the commit-SHA build stamp and the
build-info dialog — support surfaces, not switching machinery.

---

### 17.3 [x] Erasure = anonymization only (never delete) — shipped 2026-08-11
Decided 2026-07-22, built 2026-08-11 as `clientErasure.js`. See [CHANGELOG](CHANGELOG.md).

The one open question this section carried — **reversible vs irreversible**, and where a
re-identification key could live — is settled as **irreversible**, and the reasoning is worth not
re-deriving: a reversible scheme needs a mapping, and with no server the mapping would live in the
database it is protecting, making one file that un-erases everyone. Deriving the pseudonym from the
record's own opaque id instead means there is nothing extra stored to reverse, so the key-location
question stops existing rather than being answered.

---

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3
**Built** — [recordSchemas.js](src/data/recordSchemas.js), [recordProjections.js](src/data/recordProjections.js)
and `starWrite()` in [stateStore.js](src/data/stateStore.js). Three constraints that still bind any
change here:

- **The fan-out set is global, never per-app-version.** If each version declared its own, two tabs on
  two versions would write different sets and buckets would silently diverge.
- **A cached build's fan-out set is fixed at cache time** — it can never learn a schema was retired.
  So the set is a constant compiled into the build, and retirement is a two-step: stop reading it,
  then stop provisioning it. A retired schema goes on receiving writes from stale builds, which is
  harmless (a store nobody reads).
- **Write set ⊇ read set.** A bucket must receive star writes the moment its migration *begins*, not
  when it completes — that is what makes §18.3's accelerator work.

---

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table
`lineageId` **is** the record's own `id` — projections carry it unchanged, so today's UUIDv7 already
is the lineage id and no mapping table exists. **UUIDv7** (RFC 9562) gives 122 bits of collision
resistance *and* lexicographic time-ordering, doubling as the tiebreak within §18.5's topological
order. If short ids are ever wanted, base62-encode a v7 — never drop entropy.

---

### 18.4 [x] [Decided — staging, not envelopes] The lossy-projection problem
**The problem is narrower than it looks.** A rollback loses nothing — the newest bucket keeps full
fidelity while the PT reads a degraded older one. The loss happens only when **the old UI writes**: a
v5 domain object with no v6 concept in it fans out and overwrites the full-fidelity record everywhere.

**Chosen: expand-first staged releases** — never let a supported schema be unable to carry a field.
Free in code, paid for in release discipline. (Rejected: a preservation envelope, an opaque field
older versions round-trip verbatim — if staging guarantees projections are not lossy, there is
nothing to reconstruct.)

- **The rule staging obligates**: *no feature ships until its storage has shipped in every currently
  supported schema* — the field lands N releases before the UI that uses it. **Enforced in CI**
  (`test_star_write_invariants.py`), because without a check the discipline survives until the first
  hurried release.
- **Projections must be pure and total** so buckets are always re-derivable — enforced by
  `test_projections_are_idempotent_and_invertible`.
- **Escape hatch**: a change that genuinely cannot be staged is the trigger to **EOL the incompatible
  schema**, not to ship a lossy projection.
- **Reading degraded is mild; WRITING degraded is the danger.** A wrongly displayed HIIT exercise is a
  display problem; a PT *logging into that wrong view* produces bad data that fans out everywhere. So
  the signal belongs at the point of writing, announced app-wide via §18.12's ribbon.

---

### 18.5 [x] [Decided] Ordering is topological, not chronological
Replay order means correct **foreign-key availability**, not timestamp order.
[recordReferences.js](src/data/recordReferences.js) declares the reference graph (structural
ownership only) and a DFS cycle check is asserted in CI. Today's graph is trivial; the point is
catching a future convenience back-reference before a trainer does — **§17.4 is the first realistic
cycle risk.** The wall clock is not an ordering key anywhere.

---

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds
Resolved in favour of the one-build model. Three deep-link invariants that follow and still apply:
**never version-qualify a shareable link**; a **removed or renamed route becomes a permanent alias**
retained forever, so a link to a retired behaviour resolves to the nearest surviving ancestor rather
than erroring; and **deep links carry the `lineageId`**, never a per-schema id (§18.2).

---

### 18.13 [x] CD pipeline tests for the star-write layer — shipped
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). The properties §18 relies on are *invariants across
releases*, which a per-commit gate can hold and review cannot: none can ever be tested against a real
PT's data, because that data is local-only by design.

---

### 18.14 [x] One numbering axis, and a disposable preview schema — shipped 2026-08-10
Record schemas and the migration chain used small integers for **different** things (`{2, 3}` vs
`1–4`+`P`), so "schema 3" meant two things in two files. Unified: `LIVE_SCHEMAS` is `{4, P}` and 4 is
the same 4 the migration chain ends at. See [CHANGELOG](CHANGELOG.md). Two rules this pins:

- **`schema4` is durable, `schemaP` is not.** P is the shape *this build* reads; its fields may change
  on any commit, so it is never a source of truth for anything outliving the build. It is rebuilt from
  schema 4 whenever the recorded build SHA does not match the running one — and an **absent** marker
  counts as not matching, so "we don't know which build wrote this" costs a projection pass rather
  than risking a read of fields that are not there.
- **Non-numeric schema keys must be threaded, never coerced.** `Number("P")` is `NaN`;
  `Object.keys(LIVE_SCHEMAS).map(Number)` once sent every star write to a `schemaNaN` store that does
  not exist, failing 139 of 141 e2e tests on a splash timeout. Use `liveSchemas()`.

---

### 18.16 [x] Local runs stopped disagreeing with CI about what time it is — 2026-08-18

Asked for after CI failed on a test that had passed locally three times. Four divergence classes were
visible in one day's evidence; three were closed:

- **Wall-clock dependence.** Browser tests run on a frozen `Date.now` ([conftest.py](tests/conftest.py)),
  so the demo seed's relative times, day buckets and overdue labels are identical whatever hour the
  suite runs. Four tests had been deriving "today" from the HOST clock and comparing it against the
  app's — agreement by luck, and already a midnight race.
- **Suspend detection.** `_timed_task` compares monotonic against wall time and says so when a task
  spanned a gap it did not spend working ([build/__init__.py](build/__init__.py)). A time jump means
  the run was interrupted, not that the change regressed — it previously relied on somebody noticing
  timestamps by eye, which failed twice in one session.
- **One Python declaration.** CI ran 3.11 while this machine ran 3.14.4 with nothing saying so. The
  first fix bumped thirteen `python-version:` literals and added a checker that they agreed, which the
  maintainer rejected outright — *"12 pins for python? that is not single source of truth"*. There is
  one declaration now (`.python-version`), read by every job via `python-version-file:` and by pyenv,
  so drift is impossible rather than detected. [python_version.py](agent_tools/python_version.py)
  keeps what a file cannot: this machine on the declared minor, plus a guard against literals
  returning.
- **A shared wait for durable writes.** Two tests raced the write queue in one day (signup, then RSVP
  ingestion): both wrote, then did a full page load that re-read IndexedDB before the enqueued write
  had flushed. `wait_for_stored_record` in [conftest.py](tests/conftest.py) is the one wait now, taking
  a field/value dict rather than a JS predicate — the first draft used `new Function`, which the app's
  own CSP forbids.

**Left deliberately**, as theoretical rather than observed: an opt-in stress mode (higher worker count,
to surface write-queue races on purpose) and randomized test order with a printed seed.

---

## 20. [x] Test tiers: the clipboard, and the `activeSession` contract — COMPLETE
**Closed 2026-08-05** — [CHANGELOG](CHANGELOG.md); the seam is [DATA_MODEL §7](docs/DATA_MODEL.md).

**Two shapes that break naive consumers**, worth keeping in front of anyone writing a fixture: a
planning draft carries `isPlanning: true` and NO `startDate`/`endDate`, and a session opened from
history has `sourceSession: null` unless it was a plan. `buildSessionMeta`'s 2h `endDate` clamp is
load-bearing — `recoverActiveSession()` discards a cache more than 2h past its scheduled end.

---

## 21. [x] `Page.goto` stalls against the local dev server — ROOT-CAUSED AND FIXED
**The cause was the Font Awesome CDN stylesheet (§12.6), vendored 2026-08-05.** The measurements, and
the list of things ruled out so they are not re-derived, are in [CHANGELOG](CHANGELOG.md); the
per-stage budget and the diagnostic that generalises (**a tight cluster of near-identical durations
is a timeout, not work**) are in the per-stage budget table.

**One loose end**: the navigation timeout was raised 30s → 60s while chasing this. With the cause
fixed, consider reverting it so any future stall fails fast and cheap.

---

## 22. [x] Two `src` defects found while testing — FIXED
Fixed 2026-08-05 — [CHANGELOG](CHANGELOG.md). **The general lesson**: a stub that hand-duplicates
production wiring will agree with itself and disagree with the app. Mount the real `bootXyz` step, or
the test proves only that the test is self-consistent.

---

### 24.1 [x] Stage 1 — one theme system, not two — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). `src/theme-boot.js` keeps its own small copy deliberately: it must stay
import-free to run before first paint.

---

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). The two durations were deliberately **not** merged; the duplicate
`escapeHTML` was, because `build/frontend_audit.py` recognises the *name*, so a local copy passes the
audit while being free to drift.

---

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md), which also records why `correctness/noUndeclaredVariables` is on
despite not being in Biome's recommended set.

---

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07
`domain/sessionPlanFactory.js`, `domain/quickSignals.js`, `domain/sessionFocus.js` and
`domain/sessionHistoryRecord.js` — see [CHANGELOG](CHANGELOG.md) for the three defects it surfaced.
The rule that decided the split boundary: **the quick-signal DECISIONS are pure while the MUTATION is
not**, so the controller keeps thin wrappers rather than the whole thing moving.

---

### 24.6 [x] Stage 6 — `src/domain/`, a layer for what is neither storage nor UI — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). `src/domain/` is ranked in `import_layers.py` between `data/` and
`modules/common/`.

**The line to hold when adding to either**: **`data/` is records at rest** (shape, identity, ordering,
persistence); **`domain/` is the training vocabulary** (what a modality is, how reps and load are
authored, what a session's clock means) — pure, no DOM, no storage. Three modules went to `data/` and
not `domain/` on that test, and the layering itself decided the last one: `position` is a stored
FIELD, `sessionCache.js` needs the logic keeping it well-formed, and a `data/` module may not import
upward.

---

## 25. [x] Layout overflow: assert geometry, not just semantics

**Shipped 2026-08-10** — [overflow_scan.py](agent_tools/overflow_scan.py) plus
[tests/e2e/test_layout_overflow.py](tests/e2e/test_layout_overflow.py); the rules the sweep learned,
and the real defect it found, are in [CHANGELOG](CHANGELOG.md). Every other test in this repo asserts
*semantics* (text, counts, ids); this one asserts *geometry*, which is the class of bug a trainer
hits on the gym floor and the pipeline never saw.

### 25.1 [x] Invariant A — nothing extends past its clipping boundary
Each visible element's `getBoundingClientRect()` against the client box of its nearest **clipping
ancestor** (`position: fixed` escapes that chain and is bounded by the viewport **horizontally
only** — a bottom sheet is not a bug). **The mechanic worth keeping**: `body { overflow-x: hidden }`
already masks this whole class, so `documentElement.scrollWidth` reads clean today and forever. The
check has to be geometric and per-element to see the true layout box.

### 25.2 [x] Invariant B — nothing overflows its own box
`scrollWidth > clientWidth + 1` and the height equivalent, exempted **per axis** by what the element
itself declares: `auto`/`scroll` is self-declaring intent, `visible` is skipped (a non-clipping
element reports its children's overflow as its own, so one defect would repeat up the whole chain —
Invariant A names the offending child once), and the ellipsis / line-clamp idioms state their intent.
Bare `overflow: hidden` with real overflow is the silent-clipping case, and the one worth finding.
**No test-side allowlist** — intentional clipping opts out in the markup as `data-clip="intentional"`,
reviewable in a diff and travelling with the component.

### 25.3 [x] Where it runs
With demo data seeded, one page context per device walks every route in
`src/controllers/routes/routeTable.js` — views, then each route-backed dialog while OPEN — via
router-driven `pushState`, so ~20 routes cost one cold boot (~12.5s of call time per walk). Devices
are **iPhone 14 (390×844)**, **Galaxy S23 Ultra (412×915)** and **desktop (1280×800)** (where
`body`'s 480px column, not the window, is the edge), plus **one Slovenian pass** at the narrowest
width, because overflow is a text-length bug. A fifth test needs no browser: it diffs the walk's
route list against `routeTable.js`, so a route added later fails until someone decides whether its
view can overflow.

### 25.4 [x] One sweep, two consumers
The JS lives in ONE module, used by the e2e suite and
runnable directly as a diagnostic (`--device`, `--viewport`, `--invariant`). Its own tool rather than
a flag on [layout_probe.py](agent_tools/layout_probe.py), which stays about *named selectors*.

### 25.5 [x] What it found
One real, phone-only defect — the edit-mode status chip pushed 169px outside the ellipsised session
title, entirely invisible, and the only thing on screen distinguishing editing a LIVE session from a
future one. **Reordering did not fix it, it only chose the casualty**; an ellipsis eats whole
ELEMENTS, so the fix was structural (flex row, `min-width: 0`, only the client name shrinks). Three
false positives came first, each buying a rule now written into the tool — see
[CHANGELOG](CHANGELOG.md).

### 25.6 Status
- [x] The tool, its unit tests, and the four-device e2e suite; full gate green 2026-08-10.
- [x] `tests/medium/_overflow.py` — 2026-08-21. `assert_component_fits(page, root)` after mount; the
      sweep gained a `root` selector that scopes which elements are asserted, not what they are
      measured against, so the boundary is still the real page's. Defaults to a 390px phone, because
      a medium test that set no viewport sweeps at a desktop default where nothing is tight enough to
      break, and a missing root fails rather than sweeping nothing. Its own tests plant an overflow
      and assert the failure names the element; wired into the clipboard title bar (§25.5's defect)
      and the signup review dialog.

**Cost, measured**: ~50s of call time across the four walks, ~13s on stage 3's floor once fanned out.

---

### 26.2 [Superseded 2026-08-17] The payload, and why it lives in the fragment
**The transport is a shared FILE, not a link** (§1.7, ruled by Simon). Nothing below is being built:
there is no URL payload, so there is no codec, no fragment, and no compression. The reasoning is kept
because it is the argument for why a URL was never the right place for this data — which is the same
argument that makes the file transport correct.


Name / email / phone / goals / injury plus `gdprConsent` is ~400–600 bytes of JSON;
`CompressionStream('deflate-raw')` + base64url takes it to ~250–400 characters. The codec belongs in
`src/data/` with a round-trip unit test in [tests/unit_js/](tests/unit_js/) — pure logic, no DOM, no
persistence.

**In the fragment (`#`), never the query string.** A fragment is not sent to the host, so it never
reaches GitHub Pages logs or a `Referer`, and WhatsApp's link-preview crawler cannot fetch it. This
is §19.2's URL-privacy question in its sharpest form — the payload is names, phone numbers and
health data rather than an opaque id — and the fragment is what keeps it off every wire except the
two devices that already hold it.

---

### 26.5 [x] Import is a review, never an auto-save — 2026-08-17
Anyone who photographs the wall QR can craft a payload, so the review dialog is the trust boundary,
not a nicety. It also carries **dedupe**: match email/phone against existing clients and offer
"update existing" rather than minting a second Jane Doe — the same key
[UC4](use_cases/uc4_client_self_subscription.md) already uses to reconcile bookings, so the two
should agree on it. Sits naturally inside §5.2's "creation is a minimal modal, editing is inline"
decision.

---

### 27.1 [x] Erasure (Art. 17) — shipped 2026-08-11
Built as `clientErasure.js`; see [CHANGELOG](CHANGELOG.md) and §17.3. The framing this section
argued for survived into the implementation: **per-field redaction inside shared records**, not row
removal, because a completed group session with three participants is simultaneously two *other*
clients' training record. Art. 17 is not absolute either, so what a trainer gets is "redact identity,
keep the training record" rather than a delete button.

What the section did not anticipate, and is the part worth remembering: **two Jane Does is ordinary
in a gym**, and it is where a name-based sweep does real damage. Prose in records the client *owns*
is rewritten; text several clients share is left as typed and reported for a human pass.

---

### 27.2 [x] Access & portability (Art. 15, 20) — shipped 2026-08-11
Built as `clientDataExport.js` + `encryptedExport.js`; see [CHANGELOG](CHANGELOG.md). Whitelist-scoped
to one client, so this section's central hazard — the whole-database backup carries every *other*
client's Art. 9 health data, and sending it to answer an access request would itself be a breach — is
structurally hard to hit rather than filtered against. Both renderings landed: Markdown for Art. 12(1)
legibility, JSON for portability, from one projection.

---

### 27.3 [x] Erasure does not reach the copies — closed 2026-08-11 by the register
Settled as **prune on restore**, the option this section thought was the less obvious one. The
recursion it flagged is real and is what shaped the answer: the register stores a **salted hash per
entry** and nothing else, so what is retained after an erasure request is the minimum needed to
honour it. Applied at import, before restored data becomes live. See §18.11 and [CHANGELOG](CHANGELOG.md).

The half that is still true: a backup file sitting in Drive **still contains the name**. The register
neutralises it on the way back in, which is what protects the trainer's own database; it does nothing
about a copy someone else holds. That belongs in the retention paragraph §18.11 still owes.

---

### 27.4 [x] Withdrawal as easy as consent (Art. 7(3)) — 2026-08-14
The letter now carries the route, not just the right. Consent is given by replying **"I CONSENT"** /
**"PRIVOLIM"**; withdrawal is replying **"WITHDRAW"** / **"PREKLICUJEM"** to the same message. That
symmetry *is* the Art. 7(3) standard — withdrawal must be as easy as consent, and the same reply to
the same person is exactly as easy, not merely possible.

**No prefilled `mailto:` to the trainer, because the app stores no trainer contact** — and it does
not need to. The letter reaches the client *from* the trainer's own address (a `mailto:` opens the
trainer's mail client), so reply is already the one-tap route, and it survives the trainer changing
address. A stored contact would have been a second thing to keep correct for no gain.

Both channels carry it: a client sent the short SMS variant never receives the email letter, so a
route living only in the email is missing for exactly the clients reached by the shorter channel.

`CONSENT_FORM_VERSION` deliberately **not** bumped, on the 2026-08-10 precedent recorded in
[the template](docs/templates/en/Client_Consent_Form.md): purposes, recipients, retention and the
rights on offer are unchanged, and making an existing right easier to exercise does not make earlier
consent cover less. A bump would have asked every signed client to re-sign for nothing.

**Still open, and a different item: nothing RECORDS a withdrawal.** `gdprConsent` holds
`{cloudSync, consentDate, formLang, formVersion, timestamp}` and no withdrawal state, so a trainer
acting on the reply can only untick the box — which destroys the evidence that consent was ever
given. Art. 7(1) requires being able to demonstrate that it was. See §27.7.

---

### 27.7 [x] Record a withdrawal instead of erasing the consent — 2026-08-14
Surfaced building §27.4. Withdrawal arrives as a message; the trainer's only way to act on it today
is to untick the consent box, which leaves a record indistinguishable from a client who never
consented at all. Art. 7(1) requires demonstrating that consent *was* obtained, and §3.5's
`formVersion` stamp exists precisely to answer "who is still covered?" — a question that needs
"consented on X, withdrew on Y" rather than silence.

Shipped as [clientConsent.js](src/data/clientConsent.js), and it needed **no schema bump** —
`gdprConsent` is `type: "object"` in [recordSchemas.js](src/data/recordSchemas.js) with no inner
schema, so `withdrawnDate` is additive.

**Unticking the box now records the withdrawal rather than blanking the record.** That was the
actual defect: `readConsentFromSection` wrote `{cloudSync: false, consentDate: "", formVersion: "",
formLang: ""}`, so the only action available for honouring a withdrawal destroyed the proof that
consent had ever been given. `cloudSync` stays the "may I process?" flag every caller already reads,
so nothing had to learn a second rule; the signed date, wording version and language survive beside
the new `withdrawnDate`. Re-ticking drops the withdrawal date, because signing again is a new
consent and not an undo.

**The archiving dialog was telling trainers the wrong thing** and was corrected in the same change:
it said "if the client withdraws consent, delete their records here", which conflates Art. 7(3) with
Art. 17 and loses the withdrawal record along with everything else. Withdrawal halts processing;
erasure (§27.2) is a separate request the client makes, and they may well want their history kept.

Three states now render distinctly — never consented, consented, withdrawn — in the profile badge
and in the client's own Art. 15 export, since the subject reading it is the person most entitled to
see that their withdrawal was acted on.

---

### 27.5 [x] The doc describes what a trainer can actually do — 2026-08-11
Resolved by the other branch: [PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md)'s rows name
**Export data (GDPR)** and **Erase client (GDPR)**, and both now exist. The rule stands for whatever
this doc promises next — a compliance document naming a button that does not exist is worse than one
saying "do this by hand", because the trainer discovers the gap while a statutory clock is running.

---

### 28.1 [x] Comments and docstrings must name a constant, not repeat its value — 2026-08-18

See [CHANGELOG](CHANGELOG.md). Swept: `deploy/local_http_server.py`, `build/__init__.py`,
`src/modules/common/consentForm.js`, the three `agent_tools/` usage docstrings, and
the tests that had a deployment address written into them (those now use obviously foreign hosts,
which is also the better test — they pin how a link is BUILT, not where this app is deployed).
`dev_server_url()` was added alongside, so nothing has to write out the port and base path together.

**What remains, and it is §28.2's, not this one's**: `README.md`, `CONTRIBUTING.md` and
`docs/GOOGLE_CLOUD_SETUP.md` still spell out addresses, because every one of them is a string a human
copy-pastes into a shell, a browser or the Google console — `git clone {{ISSUE_TRACKER_URL}}` helps
nobody. Those files are not built, so they cannot be injected into; which contributor-facing docs get
built is exactly §28.2's open question. `constant_copies` reports them meanwhile, so they are a list
rather than a forgotten corner.

---

### 28.3 [x] A declared constant must appear in exactly one place — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). `python -m agent_tools.constant_copies`, a **diagnostic and not a
gate**, exactly as decided: it earns a Stage 1 task by catching something twice, not before. It is now
the first step of the fortnightly duplication sweep above.

One row was dropped during the build and the reason is worth keeping: `DEV_SERVER_BASE_PATH`'s value is
the repository's own name, so its literal matches every absolute path on the maintainer's disk and
every link into the GitHub repo. A constant whose value collides with unrelated text is not trackable
this way, and a check that cries wolf is one nobody runs.

---

### 28.4 [x] BUG — a collapsed deck card's first line is unreadable — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "unless it is a past card" half of the report was the clue: the past
card is LAST in the deck, so nothing is stacked on it. Nothing about past cards was involved, and the
`2fe2464` pointer was right — that fix covered desktop only.

---

### 28.5 [x] BUG — backup warnings appear in DEMO mode — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Fixed together with §28.6: one predicate, `withoutSeedRecords`, applied
at both counters — the reports were two symptoms of the same wrong question.

---

### 28.6 [x] BUG — loading demo data increments the ahead counter — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The `seededDemo` stamp pointer in the original note was right, and the
committed seed id set covered the databases minted before it existed.

---

### 28.7 [x] BUG — the header menu does not work while the messages pane is expanded — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The menu worked; the expanded drawer covered the view it navigated to.
The `753985a` scroll-container suspicion in the original note was a red herring.

---

### 28.8 [x] BUG — the disabled-backup strikethrough is not visible enough — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). This reverses §3.11's deliberate "informational, never a warning"
treatment on the maintainer's ruling; the reasoning for the reversal is in the commit and the test.

---

### 28.9 [x] CHANGE — a DEMO tag replaces the PREVIEW tag in demo mode — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The open question — whether both matter at once — was answered by the
one slot: DEMO while the store holds nothing but the demo, PREVIEW from the trainer's first real
record, because that is when data loss stops being hypothetical.

---

### 28.10 [x] CHANGE — cancellations and bookings accumulate in one message card — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The group takes the place of the FIRST of its members rather than
floating to the top, so the demo-mode notice stays the collapsed summary.

---

### 28.11 [x] BUG — a cleared browser boots to a splash with no demo or animation offer — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The maintainer's diagnosis was right: the deep link, not the empty
store. Only the `?splash=off` half was overridden — the language half was tried and reverted, because
a share link naming a language must open in it ([test_share_deeplink.py](tests/e2e/test_share_deeplink.py)).

---

### 28.12 [x] CHANGE — the guided walkthrough wants a glow, instructions and a real hand — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). Two of the three were built: the glow, and a hand that is actually a
hand. The instructions overlay already existed and was left alone.

---

### 28.13 [x] BUG — a walkthrough reloaded by deep link points at the wrong element — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Target resolution now skips anything with a zero-sized box, so an
inactive view's copy of a selector can never win.

---

### 28.14 [x] CHANGE — the demo-mode message offers to start the walkthrough — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "verify all needed data is there" half became
[walkthroughReadiness.js](src/domain/walkthroughReadiness.js), keyed on shape rather than seed ids.

---

### 28.15 [x] BUG — the walkthrough panel covers the control it points at — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Reported as steps 2 and 4, "sometimes", after scrolling — and both
halves of the "sometimes" were timing: the clearance check ran once per step, right after
`scrollIntoView` and therefore before the scroll settled, and the poll that keeps the spotlight on a
moving target never re-ran it.

---

### 30.1 [x] BUG — loading demo data from the message button freezes the app for a while — closed 2026-09-11, not reproducible

**Reported 2026-08-18:** tapping the empty feed's "load demo data" offer appeared to hang the app
briefly. The suspected cause was named in the report itself: the handler seeded the whole dataset
and then RELOADED the page, so the freeze was probably the synchronous seed, the write queue
flushing behind it, or the reload landing while those writes were still in flight. The section said
measure before choosing, because the fix is different for each.

**Measured 2026-09-11, and the freeze is gone.** An empty app, the real boot, the drawer open, the
button tapped: the click returns in **76ms** and the browser records **no long task at all** — no
span over 50ms in which the page could not have answered a tap. Throttled to a sixth of this
machine's CPU, which is the order of a mid-range phone, it is **one 249ms task** and a click that
returns in 359ms: a visible hitch on a button that writes a whole gym's records, not an app that
hangs.

**What removed it was not aimed at it.** The reload is no longer there — §40.3a replaced it with
`renderEverything()`, so seeding now writes the records and repaints, and the report's own leading
suspect went with the reload. The remaining 249ms is the seed plus a full re-render; the writes
themselves are behind the queue ([writeQueue.js](src/data/writeQueue.js)) and never blocked the
main thread.

**Nothing shipped for this, so there is no CHANGELOG entry.** The measurement is the outcome, and
it is written here so the next person who reads the report knows it was answered rather than
forgotten. Reopen it if a trainer reports the hitch on real hardware — the cheap fix then is a
progress state on the button, not a yielded seed.

### 30.5 [x] BUG — Show me did nothing on a card, and a second caption sat on the panel — fixed 2026-08-22

**Reported 2026-08-22 (Simon)**, walking the story in the browser:

- *"Show me for three friends arrive does nothing."* It did something, and that was the problem: it
  spent three seconds walking a pointer to the **Continue button already under the reader's thumb**.
  From outside, a guide that pauses for three seconds and then closes a card is a guide that has
  stopped working.

  **Fix, in his words: "for steps that have no Show me, merge them with the next one".** A card is
  now attached to the step it introduces — read it, then do the thing it is about, and the first tap
  anywhere takes it away. One rule, [foldCards](src/modules/demo/storyTour.js), so the chapters stay
  readable as a sequence: the card is still written where it belongs in the story. A card with
  nowhere to ride — the last step, or the handover to the client's phone — stays a step and declares
  `showMe: false`, and the guide hides the button rather than offering a dead one. The story went
  from 35 steps to 31, all of them things a person does.

- *"Steps 3 and 4 have an overlapping black subtitle over the buttons."* The story's own caption bar,
  fixed to the bottom of the screen, over the guide's panel — which carries the same caption. The bar
  was written when the story played itself and nothing else showed captions; it has had no reason to
  exist since the story became guided. Gone, and the card now sits in the upper half so it cannot
  cover the panel either.

- **Found while fixing the first**: dismissing the card on the first tap ALSO fired for taps on the
  guide's own panel, so Show me made the card vanish before the pointer reached it.

- *"Step 2 of 31 … this step didn't complete."* The ☰ menu closes on any click outside it, and Show
  me is outside it — so the guide closed the menu holding the item its next step points at.

**Asked while fixing this (Simon): "do you have other TOOLS that should really be tests? fix
them."** One did, and it was the one written the same day: the icon RENDER check. It asserts
something that has to stay true — every icon draws, and draws the shape it drew before — so it is
[tests/e2e/test_icons_render.py](tests/e2e/test_icons_render.py) now, importing the rendering from
the tool rather than reimplementing it. What stayed a command is recording the baseline, which is a
deliberate act taken with a regenerated font. The same question was asked of the rest of the catalog:
the gates are already gates, and what is left (the font subsetter, the icon rasteriser, the demo
recorder, the layout probe, the credential minter) either PRODUCES a committed artifact or explores a
running page, and neither is a claim a build can hold.

A story walker was written and deleted in the same hour for the same reason: the e2e suite already
walks the story, so a second walker was a second thing to keep true. What it was really offering was
a readable failure, which is now what the suite gives — the step, its caption, what the guide said,
and what was on screen.

**Three surfaces, one rule, now declared once**: [isGuideSurface](src/modules/common/dom.js). Every
"tap outside closes me" rule in this app means *outside the thing you are working on*, and the guide
floats over the app: its panel and its story card are the trainer working the GUIDE. The plan editor,
the ☰ menu, the session menu and the card's own dismissal all ask the same question of the same
helper now. Pinned by [test_guide_is_not_the_app.py](tests/medium/test_guide_is_not_the_app.py),
which tests the TAP — the demo's own walk missed all three, because it taps Show me at moments where
the closure happens to do no harm.

---

### 30.4 [x] BUG — the guide asked for a screen the trainer was already past — fixed 2026-08-22

**Reported 2026-08-22 (Simon), with a screenshot**: "step 1 of 4 on the clipboard view" — the panel
said *open the group session* over an already-open clipboard. The app opens a live session on its own
(the demo seed has one in progress), so the first step was satisfied before anyone read it.

**The fix is to move past it, not to undo it.** The first attempt re-checked the PRECONDITION on
every poll tick and rebuilt the ground when it failed — which turned the guide against the trainer:
tapping the session card themselves opened the clipboard, and the guide navigated straight back out
of it. A test caught that within the minute. What is right is narrower: a step already satisfied when
the guide ARRIVES at it is one the trainer is past, so the guide advances to the one they are not.
Never on Back, where a step returned to stays done and stays put — otherwise Back does nothing at all
and gets tapped twice.

Two more from the same session, both real beyond the demo:

- **The highlight lagged the control.** "When Show me clicks a collapsed card, the card expands way
  faster than the surrounding border highlight" — a card expanding fires no scroll and no window
  resize, so the ring sat on the old geometry until the next poll tick, up to a quarter second. A
  `ResizeObserver` on the target sees it in the same frame.
- **Two looks for the same three buttons.** Too Easy / Too Hard / Notes were grey and 32px tall
  inside a circuit and coloured and 40px on a standalone card. §7.2 already said in words that the
  two must agree; the circuit rows now wear the deck's own classes, so the look comes from one place,
  and [test_signal_buttons_match.py](tests/medium/test_signal_buttons_match.py) says it in a way that
  fails.

---

### 30.3 [x] BUG — a cleared browser plays the demo to an empty room — fixed 2026-08-22

**Reported 2026-08-21 (Simon):** clear the browser data, open a demo deep link, and you get neither
the language choice nor the demo. Two independent causes, both invisible to the whole e2e suite
because the shared fixtures auto-accept the terms and auto-dismiss the splash — so the first test
written for this had to build its own browser context
([test_first_run_deeplink.py](tests/e2e/test_first_run_deeplink.py)).

- **Seeding the demo answered the language question.** `seedMockData()` set `lang = state.lang ||
  "en"`, so a store that had never chosen one came out of the seed looking as though it had, and the
  splash skipped the step. Seeding is about RECORDS; the preference is the person's to give. The
  line is gone.
- **The demo started as soon as the app was wired**, which on a first run is BEHIND the mandatory
  terms modal — measured: all sixteen steps played out and finished at ~44s while the agreement was
  still on screen. It now waits on the splash's own promise (which also covers the language step, so
  the demo narrates itself in the language just chosen) and on the agreement being closed. Started,
  never awaited: `init()` must finish wiring whatever the trainer is reading.

---

## 31. [x] A support data-wipe link — shipped 2026-08-23

**Wanted 2026-08-19 (Simon):** a link support can send by SMS or email that opens a **consent dialog**
asking the trainer to confirm a data wipe. *"Link should not be advocated"*, it should offer a wipe
**per schema version (plus unversioned data)**, and it must carry the note that **exports and backups
are not removed from storage the app does not own.**

**Shipped as `/wipe`**, every one of those honoured. Asked on 2026-08-23 whether it existed yet: the
pure planner ([dataWipe.js](src/data/dataWipe.js)) had been built with the spec and nothing called
it, which is the shape of a feature that looks done in a diff and does nothing in an app.

- **The stores are read from the DATABASE, not from this build's schema list**
  ([listDatabaseStores](src/data/indexedDb.js)). A long-lived install accumulates stores from builds
  this one never made, and a wipe that cleared only the familiar ones would leave a trainer's data
  behind while telling them it was gone.
- **Stores are EMPTIED, not dropped.** Dropping one needs a version change, and a half-applied
  upgrade is a worse state than the one they called support about. An empty store reads as no data
  everywhere in this app.
- **It reloads afterwards.** Every module in the page is holding state from a database that no longer
  has it; asking a dozen of them to notice would be a dozen places to be wrong.
- **Linked from nowhere**, as asked. No menu item, no button — a permanent "erase everything" control
  on a phone used one-handed is a mis-tap waiting to happen, and anyone who has not been sent here by
  someone helping them has no reason to be here.

### 31.1 The one invariant

**The link carries no authority.** Opening it can only ever OPEN A DIALOG; there is no parameter that
performs the wipe, no `confirm=1`, no auto-run after a delay. A URL that destroys data on open would
be one forwarded message away from destroying a stranger's — and support links are, by their nature,
sent to people who are already confused and inclined to tap.

That makes the dialog the whole security boundary, so it: names the device it is about to erase,
lists what will go by schema, states what it CANNOT reach, and requires a deliberate confirmation
rather than a default-focused OK.

### 31.2 What it wipes, and what it cannot

Storage is `librept` in IndexedDB — one store per live schema (`schema4`, `schemaP`, and any older
store a long-lived device still carries) plus a `meta` store — and a set of `librept*` localStorage
keys. So the offer is per schema store, plus **unversioned**: `meta` and localStorage, which is where
the active session, read-notification ids, the terms acceptance and the Drive sync meta live.

**Not reachable, and the dialog must say so**: a downloaded backup file, a Drive sync file, an
encrypted export a client was sent, a consent letter already in someone's mailbox. The app can erase
what it holds; it cannot reach into storage it does not own, and a support wipe that implied
otherwise would be worse than none.

### 31.3 Not advocated

No menu entry, no notification card, no link from anywhere in the app. It exists at a URL support
sends deliberately. The support runbook can document it; the product must not offer it — a
"wipe everything" control one tap from the gym floor is a support ticket waiting to happen, which is
also why §9.3's demo cleanup is selective rather than a reset.

---

## 38. [x] Reported 2026-08-25 — the demo's own entry points — fixed 2026-08-25

See [CHANGELOG](CHANGELOG.md).

### 38.22 [x] CHANGE — a client's file opens the app, instead of being saved and hunted for

**Asked 2026-08-30 (Simon):** *"a PWA import rabi shranjevanje datoteke iz message-a in nato
odpiranje? … a je branje datoteke preko menija sploh potrebno?"* and, for the demo, *"raje bi videl,
da simuliraš branje sporočila s priponko in odpiranje priponke odpre LibrePT"*, with *"zunanjo
aplikacijo simuliraj z zaslonsko sliko in kartico razlage"*.

**It did.** There was one way in: save the attachment out of the messaging app, open LibrePT, open
the ☰ menu, choose "Review a client's file", find the file in the picker. Five acts, two of them in
somebody else's app, for a file already on the phone.

**Two ways in now, and neither of them saves anything.**

- **`share_target`** — the trainer taps Share on the attachment and picks LibrePT. The OS POSTs the
  file to the app; the service worker answers that POST
  ([sw/sharedInbox.js](src/sw/sharedInbox.js)) because there is no server to, keeps the text, and
  redirects to the app with `?open=signup`.
- **`file_handlers`** — the trainer taps the `.json` itself and the OS launches LibrePT with it,
  which arrives through `launchQueue` rather than as a POST.

Both end in the same review dialog, so the trust boundary is untouched: a share target accepts a
file from any app on the phone, and a human still reads every field before a record is written
(§26.5). What is saved is the fetching, not the reading.

**The menu keeps its file picker, and that is the trade.** Both mechanisms are Chromium's and both
need the app installed; **iOS has neither**. So the picker stops being the main road and stays as the
one that works everywhere.

**Three things had to be got right, each found by building it:**

1. The inbox cache is not a version of the app shell, so `deleteObsoleteCaches` had to stop treating
   it as an obsolete one — a deploy while an unread submission sat there threw away a client's file.
2. A submission that opened during boot put a modal over the splash, and a modal makes the page under
   it inert — including the splash's own dismiss button. The trainer was left on a splash screen they
   could not get past. It now opens after the splash has gone.
3. The submission is read once and dropped: the marker survives a reload, so leaving it in the inbox
   re-opened the same dialog on every refresh.

**The type and the extension are the app's own, not JSON's.** The first version of this declared
`application/json` and `.json`, which would have offered LibrePT in the share sheet for every JSON
file on the phone and claimed the extension system-wide. Asked about directly: *"a nisva rekla, da
bova imela custom mime in custom končnico za uvoz v LibrePT?"* — and the pair was already decided and
already in the code (§1.7): `application/vnd.librept.signup+json` and `.json.librept-signup`, one
home in [data/signupFile.js](src/data/signupFile.js). The manifest now names that pair and nothing
wider, and a check compares the two files so they cannot drift.

**The suffix order was wrong for this, and changed with it.** The file was
`.librept-signup.json`; an operating system associates on the LAST suffix, so the distinctive part
sat where nothing reads it and the only way to be tapped open would have been to claim `.json` —
every JSON file on the phone. It is `.json.librept-signup` now (§1.7, amended 2026-08-30), which is
what makes registering as a handler possible at all. The `.json` stays as a hint to whoever looks at
the file.

**Still not testable here:** whether a given OS offers the app for that suffix is an association, not
a browser behaviour, and no test harness can answer it. **Re-check on a real Android phone before
this is called finished.** A share is unaffected either way — it carries the media type.

**The demo shows the new path.** Three steps — open the menu, choose the review, find the file — became
one: a screenshot of the trainer's messaging app with Ana's message and her attachment under it,
drawn rather than photographed (a picture goes stale the day either app changes and nobody notices).
The attachment is a real button, and tapping it calls the same entry point the share target does
rather than a path invented for the demo. The card quotes the message the app really sends
(`intake_share_text`), so it cannot drift the way the invitation text did (§38.19). The story is 47
steps now, down from 49.

`ScreenshotNarratorCard` is the fifth kind in the card hierarchy (§38.10) and the first to draw a
control of its own, which is what the `extras` hook is for. Its text colours are its own, like the
message card's: a tinted card puts muted text under the AA bar on the light palettes (§38.11), and
the contrast walk now covers it.

### 38.19 [x] BUG — the demo could not be finished in Slovenian

**Reported 2026-08-30 (Simon)**, from a Slovenian run, with the card pasted in: *"Korak 16 od 49 …
Tega koraka ni bilo mogoče zaključiti."* Followed by *"ana poškodbo piše v angleščini?"*

**The step asserted the app's English words.** `intake-send` expected
`containsText: "Shared"`; the Slovenian page says *"Deljeno. Trener te bo dodal iz te datoteke."*
The claim could never come true, so the story stopped dead at step 16 for every Slovenian viewer —
and passed every test we had, because the suite runs in English.

Four expectations read translated copy back to the app. All four now ask for a fact instead:

| step | was | is |
| :-- | :-- | :-- |
| `arrive-contact` | `containsText: "text message"` | `#intake-invite-send[data-channel='sms']` |
| `arrive-contact-email` | `containsText: "email"` | `#intake-invite-send[data-channel='email']` |
| `intake-send` | `containsText: "Shared"` | `#intake-status.is-done` |
| `swap-pick-movement` | `containsText: "Swapped"` | `.editor-added-badge[data-callout='swap']` |

Two of those hooks did not exist and were added, which is a small improvement in its own right: the
invite dialog now says which channel it chose (`data-channel`) and the editor says which kind of
callout a badge is (`data-callout`), rather than only rendering a sentence about it.

**And what the demo TYPES is content, so it is translated too.** Ana wrote up her shoulder in English
on a Slovenian phone. A step now says which words with `enterKey` and the expectation that reads them
back uses `hasValueKey` — the same key, so the two cannot drift into different languages — resolved
by `storyStepsFor` where the story becomes a runnable list. Names, addresses, phone numbers and times
stay literal: they are the same in every language. Measured after, in Slovenian: Ana writes *"rama,
pred dvema letoma"*, and step 16 completes.

**The check that keeps the fifth from being written**
([storyLanguage.test.mjs](tests/unit_js/modules/demo/storyLanguage.test.mjs)): a demo step may not
match on text the app says in English and never says in the other language. Verified by putting the
reported bug back and watching it fail — which is also how a hole in the first version was found: it
read the trainer's run, and step 16 is on the client's phone, so it walked straight past the one step
it was written for.

**A false alarm the check taught me something with:** matching the same key across locales flagged
`hasValue: "Ana"` — the client's own NAME, which the demo types — because "Ana" sits inside "Ana's
phone" and Slovenian declines it to "Anin telefon". The rule is therefore about the whole dictionary:
what makes the four real ones real is that the word is absent from the other language altogether.

**Still open, and much larger: §38.20.**

### 38.18 [x] BUG — Show me advanced the demo, or did not, depending on something invisible

**Reported 2026-08-30 (Simon):** *"show me behavior is inconsistent, should it advance always or
never?"* Measured before answering, on two kinds of step:

| the step's expectation when its card arrived | Show me | what happened |
| :-- | :-- | :-- |
| not yet true (the ordinary case) | performs it | **the card moved on** |
| already true — the screen the step before left behind | performs it | **the card sat still** |

So it was neither always nor never: it turned on whether the expectation happened to be true on
arrival, which nothing on screen shows. From the floor that reads as a button that sometimes works.

**Two rules, laid down three days apart, had come to contradict.** The guide's own source still
carried the first one verbatim:

> *"Show me demonstrates the step; it never moves the guide. Next is always the trainer's tap
> (reported 2026-08-23: 'sometimes show me advances demo step sometimes not')."*

…and §38.5 then made the card follow the app whenever a step completed in front of the viewer. Show
me completes a step in front of the viewer, so the second rule quietly overruled the first — except
where `enteredSatisfied` blocked it. The 2026-08-23 ruling was correct when NOTHING advanced by
itself; §38.5 made "never" the inconsistent choice, because doing the step yourself moved the card
and asking to be shown it did not.

**Ruled 2026-08-30: always.** One sentence, one function (`carryCardOn`): *a step completed while the
trainer is watching carries the card on, whether their own thumb did it or they asked to be shown.*

Two exceptions kept, each for its own reason and neither invisible:

- **the last step waits** — finishing is a decision, and a demo that closed itself on the final tap
  would take the thank-you card with it before anyone read it;
- **a step walked BACK to is re-explained, not advanced past** — carrying them on from there would
  skip the step they came back for.

The second needed a distinction the code did not have. A step whose expectation arrives true is
marked done by the very next poll, so by the time Show me is tapped, "already done" cannot tell a
step never seen from one walked back to. `enterStep` now records both facts separately: whether the
outcome held on arrival (`enteredSatisfied`, which the poll uses) and whether the trainer had already
been past it (`enteredDone`, which Show me uses).

Pinned by [test_walkthrough_show_me.py](tests/medium/test_walkthrough_show_me.py) over a three-step
tour built for exactly these cases: one that arrives untrue, one that arrives already true, and the
last one.

### 38.17 [x] BUG — the guide called the screen wrong while scrolling to it

Measured 2026-08-30 at story step 47 (the evening's session move), deep-linked on a 390×844 phone:

```
t+1.0s  busy rebuilding, every button greyed
t+4.1s  "This step needs a different screen — go back to the sessions board and start it again."
t+4.7s  the board scrolls, the control is ringed — the message gone
```

**The screen was right the whole time**, and the first diagnosis here was wrong: nothing was slow to
render and `READY_SETTLE_MS` was never the problem. The Tuesday & Thursday card was on the board from
the first paint, 650px above the fold. What was wrong is the question the guide asked about it.
`isCovered` clamped the control's centre into the viewport before asking `elementFromPoint` what was
drawn there — so a control above the fold answered with whatever sits at the top of the screen, the
app header. The guide then waited out its full 2500ms settle for a control nothing was going to
uncover, said the app was on the wrong screen, and only then ran the scroll that brings it into view.

**Out of view is not covered.** Two changes in
[walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js), and neither touches the settle:

1. `isCovered` asks about the control's real centre, and a centre outside the viewport is not
   covered. Bringing a control into view is the guide's own job — `enterStep` scrolls to it, and
   `moveTargetOutFromUnderPanel` scrolls it out from under the panel.
2. The stale-overlay sweep after a replay no longer asks `stepIsReady` first. It was leaning on the
   old reading: with the control honestly off screen, the sweep stopped running and left the ☰ menu
   the replayed theme step re-opens standing over the very card the ring was about to name.

The step now settles at **t+2.4s with no message at all**, 2.8s sooner than the complaint used to
arrive.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): the complaint line is watched with a
MutationObserver installed before the app boots — a message shown for half a second and withdrawn
again is exactly what a retrying assertion is built to miss — and the ☰ menu must be closed when the
control lands.

### 38.16 [x] CHANGE — the demo card is put away, not shut

**Reported 2026-08-30 (Simon):** *"demo cards exiting does not allow for return to demo, find a way
for the demo card to be collapsed only (just like message area is) that allows for the user to return
to demo"*, with the brainstorm *"do we get rid of the x button on the demo cards?"*

**Yes — and that is the fix.** The corner of the panel held a ✕ that called `stop()`: the most final
act available, wearing the glyph that everywhere else in this app means "close this box". A trainer
who taps it wants the card out of the way for a moment; what they got was the demo over, with no way
back — 49 steps in, that is the whole thing gone to one tap on a glyph that promised less.

- The corner now **parks** the guide, the way the message drawer parks itself: everything but the
  head goes, leaving a bar with the one line worth reading from across the room — which step, of how
  many, on whose phone. Tapping the bar anywhere brings the guide back.
- **It keeps running while parked.** A trainer who does the step by hand with the card out of the way
  comes back to a guide that moved on with them. That is what makes it a park rather than a pause,
  and why the bar keeps the step number.
- **Ending the demo is offered only from the parked bar** — one tap from a guide already out of the
  way, two from one you are reading, which is the right way round for the act with nothing after it.
  It is also the only place the ✕ appears now, on a bar that says DEMO, so it reads as "end the demo"
  rather than "close this card".

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py): the bar keeps the step
number and drops the card, the instruction and the buttons; tapping it brings them back; the ✕ is
absent until parked and still ends the walkthrough; and the spotlight keeps following the control
while parked, which is the proof that the guide is still watching.

### 38.15 [x] BUG — a chapter's opening card left the panel nowhere to get out of the way

Found 2026-08-29 in the same hand-walk as §38.13, and confirmed by looking at the screen rather than
at a number: at **steps 23 and 30** — the openings of the programme and gym chapters — the guide's
panel sits **on top of the session card its own spotlight is ringing**. The ring is visible below the
panel's bottom edge with its top half covered.

Both are folded-card steps: the chapter's opening card rides on the first real step, so the panel is
carrying a paragraph AND an instruction. That makes it ~375px tall on an 844px screen, and
`keepPanelClearOf` has nowhere left to put it — moving to the top covers the top half of the board,
which is where the ringed card is. The pure card steps flagged by the same walk (11, 17, 18, 44, 49)
are **not** this: their target IS the card inside the panel, so an overlap is what they mean.

**Measured again on 2026-08-30, this time at both iPhone sizes**, after *"opravi še isti prehod dema
na iPhone resoluciji in popravi čudno postavljene kartice"*. The numbers are worse on the short
phone, and there was a third symptom nobody had reported:

| | iPhone 14 (390×844) | iPhone SE (375×667) |
| :-- | :-- | :-- |
| tallest panel | 47% of the screen | **63%** (story step 1) |
| covers the ringed control | steps 23, 30 | steps 12, 21 |
| **hangs off the screen** | — | step 9 |

**Fixed in two halves, because one alone cannot do it.**

1. **The panel is bounded** (45vh) and laid out as a column: the prose scrolls inside it, while the
   step number, the instruction and the buttons keep their own height and stay where a thumb expects
   them. The card's own `max-height: 32vh` is gone — it was a second number saying the same thing in
   different units, and on a short phone the two disagreed: the card obeyed its cap while the panel
   holding it came to 63% of the screen.
2. **When neither end of the screen clears the control, the control moves.** A cap cannot win the
   middle band: a control at half-height is under a panel docked low AND under the same panel docked
   high. The board scrolls and the panel's ends do not, so the guide scrolls the control out from
   under itself — ONCE per control, never on the poll (which asks four times a second and would be
   wrestling the thumb), and never while a demonstration is running, because the player scrolls the
   control into view itself and then reads its box to place the hand.

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py) at both phone sizes,
with a card in the panel and the control in the middle band: the panel must not cover it, and must
not exceed 45% of the screen.

**After, walked again on both phones:** all 49 steps on each (from 23 before), tallest panel 45%,
nothing hanging off the screen. The walk still reports two chapter openings as covered — it samples
350ms after arriving, and what it catches is the repair in flight. Deep-linked to the same step and
measured at 0.4s, 1.2s, 2.5s and 4s, the overlap is **0 on both phones**; the panel had settled to
the far end of the screen from the control. A viewer sees the card land and the screen sort itself
out inside a second, which is the honest state of it: at rest it is clear, in transit it is not.

### 38.14 [x] CHANGE — the gate refuses to run with a filter reading its output

**Asked 2026-08-29 (Simon):** *"can we somehow prevent build checks to be run piped? to exit if pipe
is detected?"* — after four gate runs in one session went through `| tail`, which is what the rules
already forbid. A rule is the weakest way to hold anything (value 10), so it is now held by the gate.

**A TTY check cannot do it, and that is the design problem.** `sys.stdout.isatty()` is false for an
agent's shell whether or not anything was piped — a tool capturing output captures it the same way —
so a TTY test refuses the honest run and the careless one alike, and the only way past it would be a
flag, which is the same mistake with one more keystroke. **Measured**: a plain
`.venv/bin/python -m build lint` from this session's shell is not a TTY.

So the guard looks for what is actually wrong: a **truncating filter reading this process's output**,
found by walking `/proc` for siblings under the same shell — `cmd | tail` puts both under one parent.
`tail`, `head`, `grep`, `sed`, `awk`, `cut`, `wc`. Nothing else is refused: `| cat`, a pager and a
redirect to a file all keep every line. `CI` is exempt, which is an escape hatch for a machine.

**What piping costs, and why this is worth a guard:** the output IS the report. `| tail -20` keeps
the closing summary and throws away the stage lines above it — a check that was skipped, a warning
nobody failed on, a stage that suddenly takes four times as long as the header predicted. A green
summary read through a pipe is a green summary with the evidence removed.

### 38.13 [x] BUG — the evening chapter opened wherever the gym chapter had left the app

Found 2026-08-29 by walking the whole demo by hand at full motion, which is not what the e2e suite
does (it runs at reduced motion and asserts the story finishes). At **step 47 of 49** the guide greyed
out every button for about five seconds and then said *"This step needs a different screen — go back
to the sessions board and start it again"* — while the board was where it had just navigated.

**The cause is three lines away from the symptom.** A chapter's opening card declares the screen its
chapter happens on (`route: "/"`), and `foldCards` — which merges that card into the first real step,
so nobody has to tap Continue on a paragraph — copied `narrate` and **dropped everything else**. The
evening chapter therefore began wherever the gym chapter had left the app, which is deep inside the
plan editor, and by the third step the guide was trying to rebuild ground from an anchor two chapters
back. The other three chapters were fine only by luck: their first step happens to declare a route of
its own.

Fixed in the fold (the card's route rides along, unless the step names its own — the step is the more
specific of the two), and pinned by
[storyTour.test.mjs](tests/unit_js/modules/demo/storyTour.test.mjs) with the invariant behind it:
**every chapter played on the trainer's phone says which screen it starts on.** The client's chapter
is exempt and cannot be otherwise — it is a different page on a different device, reached by handing
the browser over rather than by routing.

### 38.12 [x] CHANGE — a reload no longer throws away a half-filled form

**Asked 2026-08-29 (Simon):** *"kadar se izpolnjujejo obrazci in se zgodi page reload poskrbi, da se
vsebina vnosnih polj ohrani"*. Measured on the client's intake page before writing anything: type a
name, an email and a phone number, reload, all three gone.

That form is the longest thing anyone is asked to fill in on their own phone, there is **no second
copy of it anywhere**, and a reload on a gym floor is not a rare accident — a locked phone, a browser
reclaiming memory, a mis-tap on the address bar.

**The conflict this had to resolve, and the ruling.** §26.1 promises the client's phone is written to
by nothing, and the page says so in as many words. Keeping a draft is a write. Ruled 2026-08-29
(Simon), presented with the trade: **sessionStorage, and the wording sharpened to match** — the draft
survives the reload and dies with the tab, so the promise's substance holds (close the page and it is
gone) while its old letter ("Nothing is saved on this phone") does not, and a promise that is nearly
true is worse than one that is exact. Both languages' copy, the module headers,
[uc8](use_cases/uc8_client_self_onboarding.md) and the catalog were changed in the same commit; the
e2e test that asserted the old promise now asserts the exact one, including that `sessionStorage`
holds the draft and nothing else.

**Consent is never restored.** A ticked consent box put back by a script is a person agreeing to
something without being asked, on a page they have just reloaded. `data-draft="never"` exists for
that field, on both the client's form and the trainer's.

**The trainer's client form too**, keyed by who is being edited: one form is "add a client" one
moment and "edit Jane" the next, and a draft that did not know the difference would spill half of
Jane's details into the next person's form. Cancel and ✕ mean "throw this away", so they do — only a
reload, the thing nobody chose, brings the form back.

### 38.11 [x] GAP — muted text sits ON the AA bar on the light palettes — fixed 2026-09-10

Found 2026-08-27 while measuring the demo's cards, and it is not about the demo. `--text-muted`
measured **4.76:1** on Daylight and **4.87:1** on Blossom (after §38.8 deepened Blossom's from
4.28:1) against those palettes' cards. The bar for body text is 4.5:1, so both passed — with so
little margin that **any** tinted surface put the text under it. That is exactly what happened to
the demo's message card at 4.28:1, and it would have happened again to the next component that
tints a card: warnings, selected rows, anything mixing an accent into `--card-bg`.

The dark palettes have room (Midnight 7.1:1, Nebula 7.2:1, Red 9.2:1), so this was a light-palette
question only. It was parked as "an app-wide colour decision, not a demo one" — deepening
`--text-muted` on Daylight and Blossom changes every muted line in the app.

**Fixed 2026-09-10, and the measurement that had been missing changed the answer.** The two
palettes were measured against the PAGE FIELD as well as the card, because a muted line does not
only sit on a card: **4.45:1 on Daylight and 4.46:1 on Blossom**, both already UNDER the 4.5:1 a
paragraph needs. So this was not a thin margin waiting for the next tint — it was a live failure
wherever muted text sat outside a card.

Both moved, each staying in its own hue: Daylight from slate-500 to **slate-600** (`#475569`,
7.58:1 on the card and 7.08:1 on the field) and Blossom's plum from `#96617f` to **`#7a4a64`**
(6.98:1 and 6.43:1). Both now carry the same room the dark palettes always had.

**The bar in the check is 6:1, not 4.5:1** ([test_theme_contrast.py](tests/unit/test_theme_contrast.py)):
the gap above 4.5 is what a component is allowed to spend on tinting a surface, which is the whole
of what went wrong here. It is a Stage 1 text test rather than a browser one because both surfaces
come from the theme's own tokens — `--bg-color` is a plain hex and `--card-bg` is a colour with an
alpha over it, so compositing them is arithmetic. A theme whose `--card-bg` stops being either
fails the check instead of quietly dropping out of it.

### 38.10 [x] CHANGE — one definition for every card the demo shows, and one word for a step

**Asked 2026-08-27 (Simon):** *"poenoti vse demo kartice, da bodo enotne, uporabi
polimorfizem/objektno orientirano abstrakcijo"*, and then *"poskrbi, da bo terminologija jasna:
nadomesti Beat z DemoNarratorCard ali ekvivalentom (sledi self-documenting code načelu)"* and
*"posodobi tudi prose da bo razumljiv, ne samo code"*.

**What they were.** A `kind` string interpolated into a class name
(`story-card--${step.narrate.kind}`), two stylesheet blocks that knew about two of those kinds, and
— for the guide's own "you have wandered off" state — no card at all, just the caption line
overwritten in place beside two buttons. Four things to read, three shapes, and a typo'd kind
produced a real box with no styling and no complaint.

**What they are.** `DemoNarratorCard` owns the shell, the three slots, the reading behaviour and the
one rule about the way out of the demo; a subclass declares only what makes its kind different:

- `ChapterNarratorCard` — the story's own narrating voice;
- `MessageNarratorCard` — words from another app, set as the `blockquote` they are (the italics said
  that to a reader and nothing at all to a screen reader);
- `PaperNarratorCard` — the paper track, whose texture is its declaration (§35.1);
- `OffTrackNarratorCard` — the guide's own card, which takes its words from the GUIDE because the
  step's instruction names a control that is not on screen, and refuses the way-out offer that only
  a closing card is entitled to make.

A kind with no class now draws nothing rather than an unstyled box, and
[demoNarratorCard.test.mjs](tests/unit_js/modules/demo/demoNarratorCard.test.mjs) walks the shipped
script demanding a class for every kind it names. That check lives in a test rather than in
`validateStory` because the import layering keeps a `modules/` registry out of `domain/`.

**The guide always has a card surface now**, whether or not a story is being told through it: the
long story mounts its own and hands it in (it narrates through the same one), and anything else — the
four-tap wedge — gets one from the overlay and has it torn down with the guide.

**Measured while unifying them**, by extending the contrast walk to every kind on every palette: the
message card's tint pushed muted text to 4.28:1 on Daylight and 4.37:1 on Blossom. A card that tints
itself owns its own text colours. The general fact behind it is recorded in §38.11.

**Terminology.** "Beat" was this codebase's private word for a step, used 345 times across code,
tests, docs, `TODO.md` and `CHANGELOG.md` while every identifier around it said `step`
(`tour.steps`, `stepIndex`, `currentWalkthroughStep`, "Step 4 of 49"). One thing, two words, and the
one a reader could not look up. Now: a **step** is a unit of the script, a **DemoNarratorCard** is
what narrates one, and the animation's own pauses are called waits — they were "beats" too, in a
different sense, which is exactly the confusion the word was causing. `replayBeats` → `replaySteps`,
`keepOwnBeat` → `keepOwnStep`, `_do_beat` → `_do_step`, `#story-card` → `#demo-narrator-card`.
Nine sites where "beats" is a verb were left alone by name rather than by guess.

### 38.9 [x] CHANGE — one story, one count, across both phones

**Asked 2026-08-27 (Simon):** *"zakaj je anin telefon demo števec 1/10, zakaj ne nadaljuje po demo
števcu z enakim slogom kot do sedaj"*. Walked and measured: the story went **step 10 of 41 → step 1
of 8 → step 19 of 41**, three numberings for one story, with nothing on screen saying why.

Nobody decided that. The counter counted the TOUR, and the story is played by two of them: the
client's chapter runs in its own boot on the intake page — no database, no seed, no terms modal,
because in the story it is a stranger's phone — so it has its own step list, and
`storyStepsFor` deliberately keeps those steps out of the trainer's run (the guide would otherwise
point at a form that is not on his screen). The script already held the opposite value one step
later: the hand back is written by step id rather than by chapter *"because the trainer's run is one
numbered sequence, and returning to 'chapter 3, step 1' would restart the count in the middle of a
story the viewer is four steps into"*. Going the other way had no such rule.

**A step's number is now its place in the STORY**, attached by `storyStepsFor` as `storyPosition`
and carried with the step — the one thing both boots can agree on while sharing no state, because it
is a property of the script and both of them have the script. Measured after: **10 of 49 → 11 of 49
→ 19 of 49**.

**Two numbers, deliberately** ([domain/walkthrough.js](src/domain/walkthrough.js)): what the viewer
READS is their place in the story; what the buttons OBEY is this run ending. Counting the story for
`isLastStep` would leave the client's page unable to finish, waiting for step 49 on a page that has
eight. The choice between them is a `TourNumbering` / `StoryNumbering` pair rather than a condition
at the point of use — a run whose steps know where they belong is counted by the story, everything
else counts itself, and the wedge tour is untouched.

A chapter link now opens at that chapter's place in the story (30 of 49), not at 1 of its own
length: someone handed one is joining a story part-way, and the count is what tells them so.

### 38.8 [x] BUG — the story card was painted with tokens this app has never had

**Reported 2026-08-27 (Simon):** *"2/8 kartica je slabo berljiva"* — the demo's card on the client's
phone. Measured before touching anything: **2.38:1** body text on the Midnight palette, against the
4.5:1 a paragraph needs. Title and caption were 17.29:1, which is why it read as one broken half.

[demoNarratorCard.css](src/modules/demo/demoNarratorCard.css) asked for `--text-primary`,
`--text-secondary`, `--bg-secondary` and `--bg-primary`. This app defines `--text-main`,
`--text-muted`, `--card-bg` and `--bg-color`. **An undefined custom property does not fail** — CSS
takes the fallback written beside it, and a fallback is a colour someone typed on the day they wrote
the line. So all five declarations froze at light-theme slate: right on Daylight by coincidence, and
dark-on-dark everywhere else — including the palette the story's own handover link **forces** on the
client's phone (`theme=midnight`), which is why this surfaced there and nowhere else.

**The check is the real fix** ([agent_tools/css_tokens.py](agent_tools/css_tokens.py), Stage 1): a
`var()` naming a property nobody writes fails the build. Its first run found **38 reads of 17
properties across 12 files** — the story card was one of them. The rest, all fixed here:

- `.notification-card` and the header's nav hover painted `var(--bg-surface)`, which is invalid at
  computed-value time and therefore **transparent** — feed cards had a border, a radius and no
  surface;
- seven `color: var(--text-color)` declarations that quietly did nothing (the property is inherited,
  so an invalid value inherits) — said out loud as `color: inherit`, since each sits on a fixed dark
  overlay where naming a theme token would be wrong on half the palettes;
- the backup warnings' frozen amber, now `--warning` mixed the way `index.css` already mixes
  `--danger`, which retired a `prefers-color-scheme` override that contradicted the trainer's own
  theme choice — and a byte-identical duplicate of the whole rule beside it;
- two dead middle links (`var(--card-bg, var(--bg-surface, #fff))`).

**The check's second half is palette parity**: the five themes are alternatives, not layers, so a
property only one of them defines is undefined for everyone on the other four. It holds today (33
properties × 5) and now cannot quietly stop holding.

**Found by the test that pins it**: `--text-muted` on Blossom was 4.28:1 — under AA for **every**
muted line in the app on that palette, not just this card. Deepened to `#96617f`, same hue.

Pinned by [test_demo_narrator_card.py](tests/medium/test_demo_narrator_card.py), which measures what an eye
gets — the card's four text elements against the surface actually behind them, on every palette the
app ships, read from the app rather than listed in the test.

### 38.7 [x] BUG — the tap's rings landed on the screen the tap had already opened

**Reported 2026-08-27 (Simon):** *"show me click ripple effect is sometimes too late as application
already loads new view when the effect fires. Try to animate the effect a bit before the actual
click."*

The click is what changes the screen, so the mark can only be spent BEFORE it. It was not: the
player waited 160ms — the time a finger takes to land — and then tapped, while the rings need most
of a second. The trailing two had not even been SENT when the view changed, so the whole set played
out over a screen it had never touched. What a viewer sees then is not a late effect; it is a tap on
the screen that just arrived.

**The pointer's mark and the real click are one gesture, so one module times both.** The ring's
duration moved out of the stylesheet into [demoPace.js](src/modules/demo/demoPace.js) — the module
that already owns every wait a step takes — and the wait before the tap IS that duration.
[demoHand.js](src/modules/demo/demoHand.js) stamps it onto the rings for the CSS to animate with,
and clears them on it. Three numbers that had to agree became one, which is the actual repair: the
old comment said "kept in sync by hand", and they were not.

By the time the app is told anything, a whole ring has expanded over the control being tapped and
the two behind it are past their peak. What crosses the view change is their tail — the echo of the
tap that left.

**Found while fixing it:** the delayed rings were painted at their full 26px until their turn came,
because the animation filled `forwards` only. Three rings appeared as one hard blob at the contact
point, snapped back to a third of their size, and only then rippled. Filling `both` starts each one
where its own animation starts. The per-ring fading was dead for the same reason and is now carried
inside the keyframes, so the group still reads as waves rather than as a target reticle.

Pinned at both tiers: [demoPace.test.mjs](tests/unit_js/modules/demo/demoPace.test.mjs) holds the
lead to the ring's own duration, and
[test_walkthrough_target.py](tests/medium/test_walkthrough_target.py) times the real player's
gesture on its own injected clock — the rings must be out and the first one finished before the
control is touched — and measures the rings at the instant of contact.

### 38.1 [x] BUG — "show me around" started the old four-tap tour, not the story

**Reported 2026-08-25 (Simon):** *"Message in notification area starts the old 1/4 demo not the new
1/31"*, and on the same walk *"same with guided walkthrough on the splash screen"*. Both offers built
their URL from one function, and that function still wrote `?demo=walkthrough` — the gym-floor wedge
that predates §35. Invisible in the code, because the story runs on the same guided panel: the only
symptom was the step counter saying 1 / 4. Fixed by making that builder write `?demo=story`, and by
pinning the VALUE in the tests, which had asserted only that some `?demo=` was set. The wedge keeps
its own link for the engine's tests; nothing in the app offers it.

### 38.6 [x] BUG — walking back left the card describing a screen the app was not showing

**Reported 2026-08-26 (Simon):** *"going back in demo from step 7 to step 4 does not clear/update the
intake address / number"*. Worse than stale: every one of those steps showed an EMPTY contact box,
under cards reading "type the number" and "type it over the number".

Being able to PERFORM a step is not the same as standing where it begins. The rebuild reopened the
invite dialog — which empties its field on every open, correctly, since it is the next person's
invitation — and then stopped, because the step's own control was now reachable and nothing looked
wrong. The two steps that fill that box were never replayed.

**A step's ground now includes what the step before it left on screen**, and the rebuild replays
until that holds rather than until the control is merely tappable.

**Two repairs, told apart, and that distinction is the whole cost of this fix.** Conflating them
froze the guide for tens of seconds at the programme chapter — resuming the trainer's run after the
client's phone made every step try to rebuild the arrive chapter, one unsatisfiable replay at a
time, with every button greyed out. So:

- a step that **cannot be performed** replays from its anchor and stops the moment its control is
  reachable, exactly as before;
- a step that **can** be performed but whose immediate history is wrong restores at most the last
  three taps, and never reports a problem — the trainer is looking at a card whose control is right
  there.

Only the step IMMEDIATELY before counts as ground. Most of what a story does is undone on purpose by
what comes later — the invite dialog is opened by one step and closed four steps on — so demanding
every earlier outcome would have the guide re-opening dialogs the story had deliberately shut.

### 38.5 [x] CHANGE — the card follows the app, and says so when the trainer goes exploring

**Decided 2026-08-26 (Simon)**, after reporting the same thing three ways in one session — a modal
closed by hand with the card still asking for it, and two "Show me does not fill the form" reports
where the filling was the NEXT step:

> *"make Show me fill in the fields and point to the action and execute it, when performs the
> expected action the card should advance, but if user explores on its own we should display a demo
> card with 2 buttons 'return to demo' and 'exit demo mode' (same as x on demo card)"*

**A step completed in front of the viewer carries the card on**, whoever completed it — the trainer's
own tap or Show me. This reverses the 2026-08-23 rule (only Next advances), which was itself a fix
for THREE rules: Show me advancing on some steps and not others. What makes one rule safe now is the
guard that did not exist then: **a step whose expectation was already true when its card appeared is
read, not performed**, and is never advanced past on its own. Narrated cards are exactly that — a
card is satisfied by being on screen — and so are steps the previous screen already answers, which
is what "skipped two steps in a blink" was. Never off the LAST step either: finishing is a decision,
and the thank-you card would have closed itself before anyone read it.

**Going exploring is not a fault, so it no longer looks like one.** When the step's control is not on
this screen at all — the trainer opened another view — the card says so and offers exactly two ways
on: *Back to the demo*, which is the same rebuild Back and Next already use, and *Stop the demo*,
which is the ✕. Deliberately weaker than the readiness test: a control merely scrolled out of view or
under a menu is still on the step's own screen, and the guide handles both by itself. It takes three
consecutive polls, because one reading is a view mid-render.

The e2e walkers gained ONE definition of "do the step on screen" (`_do_step`, `_card_moved_on`) —
they had four copies of Show-me-then-Next between them, and each copy was a place the rule could be
half-changed.

### 38.4 [x] CHANGE — the invitation text says who it is from and what happens to the data

**Wanted 2026-08-26 (Simon)**, from the message as it arrived on a phone: it should name the
trainer, say it is an invitation to fill the signup form, and carry the privacy statement.

The old opening — *"Fill in your details for our training"* — is exactly what a phishing text says,
and the trainer's name only appeared as a signature under the link. The name now leads, the app is
named with it, and the notice comes WITH the invitation rather than as small print on a form
somebody has already started filling in. It is [consentForm.js](src/modules/common/consentForm.js)'s
`clientPrivacyNoticeUrl` — the same shipped page the consent letter links to, in the language the
link opens in — so the two cannot drift.

An install that does not know the trainer's name sends an unsigned line rather than a message with a
gap in it. Around 300 characters with both links, so two or three SMS parts; the alternative is a
bare URL, which is the thing being fixed.

### 38.3 [x] BUG — the guide and the app's own modals — fixed 2026-08-26

**Reported 2026-08-25 (Simon)**, walking the story: *"step 3/41 does not ensure menu closed"*, then
*"send intake link does not count the steps right, back button keeps the app stuck in the modal, the
modal for intake sharing is hijacking the demo step card and the card is covering the controls"*.
Four symptoms, three causes, all of them at the seam where the guide meets a `<dialog>` or a
dropdown it opened itself.

- **A control behind an open modal counted as visible.** `showModal()` makes the rest of the page
  inert, but the buttons under it keep their boxes — so the step that closes the intake-invite
  dialog, which claimed only "the register button is visible", was satisfied the moment the dialog
  OPENED. The guide lit Next, the viewer walked on, and every step after it happened over a modal
  nobody had closed, with the whole app inert behind it: the miscounted steps and the Back that
  could not escape are both this. `probe` and `resolveTarget` now read reachable, not painted, and
  the step claims what it is about — the dialog gone.
- **The modal took the card over.** Every dialog here is a glass card, and `backdrop-filter` makes
  an element the containing block for `position: fixed` descendants — so the guide's full-screen
  frame collapsed onto the dialog the moment the panel was moved inside it (which is what keeps it
  tappable). The card drew INSIDE the modal, over the controls the step was asking for, and on the
  taller new-client form the scroll carried it off the top of the screen. The frame is measured back
  onto the viewport by hand, the dialog's own scroll included.
- **A rebuild could not undo, and a modal is the one state nothing else escapes.** Restoring a
  step's ground navigates and replays forward; neither reaches out of a modal, because everything
  outside it is inert. The rebuild now closes a modal the step does not live in, through the
  dialog's own ✕.
- **The ground a rebuild puts back has to be taken away again by the step that is already done.**
  The register opens from the ☰ menu and the tap that opens it closes the menu; walking back into
  that step re-opened the menu over the register, and the tap that would have closed it was skipped
  as redundant. Both the entry rebuild and Show me now re-fire a done step's action after a rebuild
  — after one, the app is by construction back BEFORE the step, so it is a replay rather than a
  double tap.

**The frame fix above was wrong, and the same evening said so twice more** — *"send intake link
modal has some really long scroll bars (should have none)"*, then *"send intake link modal does not
display demo card anymore, so I can't click show me or next or back"*. Stretching the guide's frame
back over the viewport from inside the dialog does not work in either direction: a dialog's UA
`overflow: auto` CLIPS what hangs off its top and left — which is where the card went — and what
hangs off its bottom becomes scrollable overflow, which is where the scrollbars came from. Living
outside the dialog is not available either: a popover in the top layer is still not clickable while
a modal is open (measured, not assumed).

So while the guide is inside a dialog, **the dialog is its screen**: the frame becomes the dialog's
own visible box, scroll offset included, and the card docks inside it — top or bottom by the same
rule that keeps it off the control everywhere else. The ring is placed in frame coordinates for the
same reason.

**And the lesson that cost the third report**: the geometry was verified by reading boxes, and a
clipped element still reports a perfectly good box. Where the question is "can a person see and tap
this", `elementFromPoint` at the control's own centre is the check; a rect is not.

A second Show me on the step that OPENS a modal also told the trainer it had failed — the step's own
success puts its control behind the dialog, and a precondition that reads "met" says nothing about
that. The rebuild is now forced whenever the step's own control cannot be reached.

**Back and forth, and the state nothing was checking** — *"back and forth for demo steps
surrounding sending intake link don't work"*, and, reproducing the menu report by hand, *"manually
open menu and click show me -> observe menu is not closed (no state enforcement)"*.

One cause. The guide asked only whether a step's declared `requires` held, and almost no step
declares any — `requires` was written for the states a selector cannot see. So nothing noticed that
a step's own CONTROL was gone or buried: walking Back out of the invite modal closes it, correctly,
and walking forward again then stepped through four steps whose controls were inside that closed
dialog, lighting Next on each because each was done on the first pass, over a screen where none of
it was happening. A dropped-down menu is the same defect a layer up — it covers, so the
demonstration is a hand tapping something the viewer cannot see.

**Being READY now means: preconditions hold, the control resolves, and nothing is drawn on top of
it** — asked with `elementFromPoint` at the control's own centre, since a rect cannot answer it. And
what the app has left lying on top is cleared before anything is replayed: a menu through the
control that opened it, a modal through its own ✕. Cheap repair first, replay only if that was not
the whole problem, because several steps exist to OPEN a menu and rebuilding through them re-opens
the very thing that was in the way.

**Three things this taught, all of them about instrumentation rather than the guide:**

- A geometry check passes on a clipped element, and a `requires` check passes on a buried one. Where
  the question is "can a person see and tap this", only a hit test answers it.
- **Waiting for a state to look right will take the first frame where it does.** Waiting for
  readiness before deciding whether to rebuild made the guide stop tearing the clipboard down on
  Back: an overlay mid-transition measures as gone for one frame. That decision is taken on one
  reading; only the complaint waits, and only when the rebuild actually moved the app.
- **The browser suites pin `Date.now()`**, so a `Date.now() + budget` deadline never arrives there.
  A settle loop written that way hung for ever, with every button on the panel greyed out. Count
  ticks.

**And the card is OUT of the modal** — *"step 4 of 41 card is still trapped in the modal view and
covers the interface, can you move the demo card outside of modal please?"*. What kept it in there
was the dialog's own UA `overflow: auto` clipping its children; lifting that lets the card draw at
the bottom of the SCREEN while staying a child of the dialog, which is the only thing that keeps it
tappable while the rest of the page is inert. Measured before it was built: it is then the topmost
element at its own centre and a real tap lands on it. Not for a dialog that needs its own scrolling
— the new-client form is taller than a phone, and a form that cannot scroll is worse to hand someone
than a card in the way — so that one keeps the card docked inside.

**A repeat Show me stopped blinking the dialog** — *"show me on step 3/41 seems to loop"*. The step
that opens the invite dialog puts its own control, the button on the page behind, out of reach by
succeeding. Asking to be shown it again therefore closed the dialog to get at that button, tapped
it, and opened the dialog afresh — the app blinking, and anything typed in the meantime gone, since
the dialog empties its field on every open. A step that is done and whose control its own success
removed has nothing left to demonstrate, so Show me does nothing there. Quietly: a complaint about a
step that worked is worse than silence.

Pinned by [tests/medium/test_walkthrough_modal.py](tests/medium/test_walkthrough_modal.py) (six
rules, one stub), the story's own back-and-forth walk across the invite dialog, and the menu-closed
assertion in its repeat-Show-me test.

### 38.2 [x] CHANGE — the demo-mode notice leads the whole feed

**Wanted 2026-08-25 (Simon):** *"DEMO mode message should be the 1st one on the message area, above
bookings and cancelations"*. It led the STORED messages already, but synthetic work items — pending
sessions, unscheduled plans — lead the feed by rule, and the demo seed generates those, so the card
was pushed below them. It is now the one exception to that rule, and the reason is not politeness:
every other item is a claim about the trainer's own gym, and reading one before knowing the data is
a fiction is reading it wrong. It is also the collapsed drawer's summary line and the only way back
to the guided demo and the cleanup screen.

---

### 39.1 [x] BUG — the story told the viewer four things that were not true

Verified against [en.js](src/i18n/en.js) and the shipped script; every one of them is a sentence, not
a mechanism.

| Card | Key | What it says | Why it is false |
| :-- | :-- | :-- | :-- |
| 1 | `story_arrive_open_body` | *"without writing down a single detail for them yourself"* | Cards 8 and 9 have the trainer typing Nik's name, and card 9 says so: *"you typed four words in total"*. |
| 10 | `story_handover_body` | *"Nothing ahead is a mock-up."* | Cards 11, 17 and 19 are drawn message screenshots. They are honest mock-ups; the sentence is what makes them dishonest. |
| 17 | `story_arrived_body` | *"Nothing went through a server on the way"* | A text message crosses an operator's servers. The true claim is narrower and better: nothing went through **ours**, and nothing was uploaded. |
| 6 | `story_step_arrive_close_invite` | *"Two of the three are on their way."* | *"where are they going? drop the poetics!"* — nobody is going anywhere; two invitations have been written. |

Simon on card 1: *"this is a lie and not needed sentence"*. The fix for each is the same shape — say
what happened, drop the flourish.

**Fixed 2026-08-31**, eight strings across [en.js](src/i18n/en.js) and [sl.js](src/i18n/sl.js):

- Card 1 names the three routes into the register instead of promising one that the chapter itself
  breaks two cards later.
- Card 10 says what is actually true of the crossing: *"The page is the real one; only her messages
  are drawn."* That is the stronger claim as well as the honest one — the drawn messages are the
  point of §35.1's rule, and the old sentence was disowning them.
- Card 17 keeps the claim worth making and drops the one that is not ours to make: *"no server of
  ours ever saw it"*.
- Card 6 says where the three of them stand, which is also what sets up card 7: *"Ana has her link
  and Maja has hers; Nik is still standing here."*

**No check can hold this.** Whether a sentence is true of the app is not a property a test can read,
and the two suites that walk the story pass either way. What the gate does hold is that both
dictionaries stay in step, so a sentence cannot be corrected in one language only.

---

### 39.2 [x] BUG — crossing to Ana's phone lost the language

**Reported at card 20:** *"zagotovo je Ana imela nekaj slovenskih besedil, če ne kar celega UI slo, ta
import pa pravi 'en'"*.

**Found, not guessed:** [storyTour.js](src/modules/demo/storyTour.js) hands the browser over with a
fixed address — `intake?demo=story&chapter=intake&theme=midnight` — and there is no `lang` in it.
Ana's page is a separate boot with no database (§35.1), so it has nothing to read a language from and
comes up in the default. A Slovenian viewer watches Ana fill in an English form, and the consent her
file records is the language she never chose.

The way back, `clients?demo=story&step=review-message`, dropped it too; the trainer's own side
survived only because his choice is in storage.

**Fixed 2026-08-31 at the crossing itself, not in the script.** The guide's Next puts the current
language on any address a step hands the browser to, unless that step names one of its own
([walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)). Written there because the story
already had two crossings and forgot it on both: a rule at the seam cannot be forgotten by the third
one. The trainer's side reads it from `state.lang` at the moment of the crossing rather than at boot,
since the ☰ menu can change it mid-story; the client's side passes on the language it was given.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): walked in Slovenian to the handover,
the button Ana is about to tap says *Deli s trenerjem*.

**Found while writing that test, and worth more than the bug:** both story walkers asked "did the
card move on?" by matching `step N of` — English, so in every other language the answer was always
"yes", the walk stopped tapping Next and stalled where it stood. Every walk in the suite is English,
so nothing had ever noticed.

**And the first fix for it was worse**, which is the part worth keeping. Comparing
`inner_text()` against `not_to_have_text` looks language-agnostic and is not: the panel uppercases
that line in CSS, `inner_text()` returns what CSS made of it, and the assertion compares
`textContent` — so "is it still this text?" answered *no* before anything had happened, for every
step in every language. The walk stopped tapping Next altogether and the demo stage ran **41 minutes
without failing** before it was killed. A comment two files away had already written this down.

Both walkers now read the value the assertion reads, through a named helper rather than by hand, and
the rule is in [tests/INDEX.md](tests/INDEX.md) where the next person meets it before writing the
test rather than after.

---

### 39.3 [x] BUG — the consent Ana ticked named Google Drive

**Reported at card 16:** *"privacy consent naj ne omeni google drive-a, naj bo generičen "PT's private
cloud storage""*.

Verified: [en.js:265](src/i18n/en.js) has the client agreeing to a backup *"in my trainer's personal
Google Drive"*, and [sl.js:256](src/i18n/sl.js) says the same. The long consent letter
([consent/en.js](src/i18n/consent/en.js)) already says *"my personal cloud storage"* and names no
vendor — so the two texts a client reads disagree, and the shorter one is the one they actually tick.

Naming the vendor in the tick is also a promise the app cannot keep across a deployment that syncs
somewhere else, and it dates the consent record to a product decision rather than to a practice.

**Fixed 2026-08-31.** The tick now says *"my trainer's own private cloud storage"* / *"njegovi osebni
shrambi v oblaku"*, which is what the letter says.

**Nothing is concealed by it**, and that is what made it safe: the privacy notice the tick links to
names Google Drive in full, in both languages, and a processor's identity is what that notice is for.

**`CONSENT_FORM_VERSION` is deliberately NOT bumped.** It stamps the letter's substance — purposes,
recipients, rights, retention — and the letter has not changed. This makes its summary agree with it
instead of contradicting it, adds no recipient and narrows no right, so a bump would ask every client
already on the record to consent again to the promise they already made.

**Now checked**, in [consentForm.test.mjs](tests/unit_js/modules/common/consentForm.test.mjs): no
consent text a client ticks or signs may name a storage vendor, in any language. It is the same drift
the letters were already pinned against — *"Google Drive/iCloud" vs "personal cloud storage" across
three copies* — caught one artifact further out.

**The gate found the rule this replaces**, which is why it is written down twice.
[test_intake_form.py](tests/medium/test_intake_form.py) required the tick to disclose *"Drive"* by
name, from the 2026-08-23 full-disclosure ruling. That test now asks for the KIND of recipient —
`cloud storage` — and says why: what must be disclosed here is that a backup copy may leave the
trainer's device, and WHO holds it is what the linked notice is for.

---

### 39.6 [x] BUG — the clipboard says which session, and the chapter builds a programme

**Reported at cards 23–24:** *"the edit view is not clear which session and for whom that plan is, the
demo card text is useless"*, and *"demonstrate actually adding one circuit please, before just saying
done"*.

Two different faults, one screen.

**The app's — fixed 2026-08-31.** Measured before building, and the report was half right: *for whom*
was already there (*Editing Jane Doe*). *Which session* was not — `Group Strength & Conditioning`
appeared nowhere in the clipboard, in either mode, and the bar carried
`2026-09-01 11:30 playground outside` on one 22px line. Simon then found the rest of it at desktop
width — *"this one clips on desktop"* — where that line lost **90px** to an ellipsis. The repo's own
sweep passes that, correctly: an ellipsis is visible truncation, not the silent clipping
[overflow_scan](agent_tools/overflow_scan.py)'s invariant B hunts for.

**Two lines, and they cost nothing.** The bar is 76px tall because its buttons need a 44px touch row;
the title was using 25px of it. A 15px line over a 12px line comes to ~36px — still inside height
already spent. Measured at 390, 375 and the desktop column: same bar height, same actions width, no
overflow, sweep clean.

- **The clipboard** ([sessionTitleBar.js](src/modules/session/sessionTitleBar.js)): the session's name,
  then `day · time · gym`. `TODAY` replaces `2026-09-01`, which is what a person standing in the gym
  reads. The gym goes last because it is the least identifying thing on the bar and usually the same
  one every day — **the order is the design**: what gets cut is chosen, not left to chance.
- **The editor** ([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)): `✎ <session>`
  over `[day · time] <client>`. The ✎ shrinks from 22px to 12px and moves to the name it is about.
  **The word "Editing" is gone**, and that was decided by measurement rather than taste: rendered both
  ways, four things on one 12px line clip the client's name at 390 *and* 375, three clip nothing. The
  glyph says the mode and Done sits beside it.

**Then the buttons beside it gave the room back** (asked the same day: *"we probably should change
start session button from text to play glyph"*). Start and Done carry only their glyph now, with
their words in `aria-label` through `data-i18n-label`, and the touch target held at 44px by
`.btn-glyph` — a control a thumb cannot hit has not been made smaller, it has been made worse.

| | title block | session name clipped |
| :-- | --: | --: |
| clipboard 390, Start as words | 171px | 0 |
| clipboard 390, Start as glyph | **258px** | 0 |
| editor 375, Done as words | 191px | **27px** |
| editor 375, Done as glyph | **231px** | **0** |

So the editor's last truncation is gone at both phone sizes, and only a deliberately long name still
ellipsises — visible, with an affordance, which is the whole point of choosing the order.

**And the play glyph was never on screen at all.** `fa-circle-play` has been in that markup all
along. The button was wired through BOTH translation mechanisms at once: the selector table in
[domMappings.js](src/i18n/domMappings.js), which keeps an icon and appends the label after it, and a
`data-i18n` on the button itself, which calls `replaceChildren` and throws the icon away. They
disagreed on every boot and the second one won. Nothing noticed — the dictionaries were in parity,
the label was right in both languages, the button worked, and the glyph was simply absent.
[test_i18n_parity.py](tests/unit/test_i18n_parity.py) now refuses any element that carries
`data-i18n` while containing markup, which is the shape that loses it.

Pinned by [test_clipboard_title.py](tests/medium/test_clipboard_title.py) (the name leads, in the
larger type) and [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) (the bar names the
session, and that name is not the part that gets cut).

**The story's — fixed 2026-08-31.** The chapter now builds something, which is what a chapter called
*The programme* is for.

- **It adds a circuit** (*"demonstrate actually adding one circuit please, before just saying done"*).
  A new step taps `+ Circuit` on the last insert bar, so the block lands at the end where a finisher
  belongs. Its expectation is a circuit with **no title yet**: the seeded plan's five circuits are all
  named, so an untitled one is proof this tap made it rather than a selector that was already true —
  measured before writing it, 5 circuits and 0 untitled before, 6 and 1 after. The story is 48 cards.
- **Both captions name their control**, the glyph and where it is, which neither did.
  `story_step_programme_editor` never said to tap anything at all; it now opens with *"Tap Edit plan —
  the ✎ row in the menu that just dropped down"*.
- **"Done — back to the room" is gone** (*"what room are we going back to?"*). It says what the tap
  does and why the screen changes: the plan is saved, and the session comes back with everybody in it,
  because the editor shows one person at a time and what follows is about all three.

---

### 39.10 [x] CHANGE — the intake-link button is named for the intent

**Reported at card 3:** *"would text button be better as invite customer instead send intake form?"*

`Send an intake link` named our mechanism; `Invite a client` names the trainer's intent. The register
already calls the other route `Add Client`, so the pair now reads as two ways to do one thing —
**Invite a client** / **Add Client**, *Povabi stranko* / *Dodaj stranko*.

**Fixed 2026-08-31**, and in three places rather than one, because a name is not only on the control:

- the button, and the dialog it opens — a dialog that opens under a different heading from the button
  that summoned it reads as having gone somewhere else;
- the story's own caption, which names the control the viewer has to find. It gained the glyph while
  it was being rewritten: *"the button with the share arrows just under the Clients heading"*.

---

### 39.12 [x] BUG — a deep-linked clipboard showed a placeholder instead of the session

**Reported 2026-08-31 (Simon)**, with the address he was standing on:
`/session/s04f2e3d/client/c1a9f0e2/circuit/z08a2b3c` — *"still no title visible"*.

Not §39.6. The bar was not merely missing the session's NAME; it was showing the word `Clipboard`,
the placeholder that ships in the static markup, on a screen that knew perfectly well it was holding
*Morning Conditioning, 09:00 - 10:00, city park*. Tapping a session in from the board wrote the bar
correctly; arriving at the same address from cold never did.

**Traced, not guessed.** A MutationObserver on the title showed it written exactly once — at
t+1357ms, when the overlay's markup renders — and never touched again. `renderSessionTitle` runs
before that markup exists, takes its `if (!el) return`, and nothing calls it a second time. Calling
it by hand on the stuck page produced the right line immediately.

**A deep link is the common case, not the exotic one**: a reload, a bookmark, a link sent to a
colleague and the app's own restored session all arrive that way.

**Fixed by deriving the title instead of stashing it.** Edit mode repurposes that bar, and it used to
keep the bar's HTML in a module variable and restore it verbatim on the way out — faithfully putting
back whatever was there, placeholder included, which is how one wrong render spread to every later
one. Leaving edit mode now re-derives from the session
([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)), and the module variable is
gone: a value that cannot be stale beats a rule about keeping it fresh.

Pinned by [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) on both halves — a cold deep
link names the session, and so does the screen you get back after leaving the editor.

---

### 39.15 [x] BUG — the plan-fit meter looked like a button and explained itself only on hover

**Reported 2026-09-01 (Simon)**, from the editor route: *"there is a 65 / 60 min button like element
that I don't know what it does"*.

Two faults in one element, and he demonstrated the first by being unable to name it:

- **It was shaped like a control.** `border-radius: 999px`, a tint and padding, sitting in a toolbar
  immediately beside *Add from catalog*, which is a real button.
- **Its only explanation was a `title` attribute.** A phone has no hover, and this repository does not
  accept meaning that lives there — so on the device the app is built for, the element said `65 / 60
  min` and nothing else.

**And the state it exists to report was in the colour alone.**
[clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) already said it in a comment — *the
number a trainer scans for is not "45", it is "over"* — while encoding "over" as red text, which is
the half a colour-blind trainer cannot read and the half sunlight takes first.

**Fixed:** a clock glyph says the number is a duration, the word `over` / `čez` says the state, and
the pill is gone — plain text while the plan fits, with the tint kept only for the case that wants
attention. Pinned by [test_clipboard_editor.py](tests/medium/test_clipboard_editor.py), which had to
teach its mount about a booked slot: the meter is silent without one, because a planning programme
has no hour to fit into and inventing a constraint nobody set would be worse than saying nothing.

---

### 39.16 [x] CHANGE — the fit meter warns before the hour is gone, and costs a set by its reps

Two rulings from 2026-09-01, one screen apart, and they answer each other.

**"If the plan (not counting rests) exceeds 75% of time then it should mark warning and at 100%
should turn error."** There were two states, so a plan at 95% of its hour looked exactly like one at
30% — a trainer found out it was too long by going over. Three now, each saying its own WORD (`tight`
/ `na tesnem`, `over` / `čez`), because the state used to be in the colour alone: the half a
colour-blind trainer cannot read, and the half sunlight takes first.

**Judged on WORK, which is the part of the ruling worth keeping.** This module counts rest only where
a trainer wrote a rest ROW; the rest they take between sets without typing it in is invisible. So a
total that includes authored rests under-reads exactly the plans most likely to overrun, and the
quarter of the slot the threshold leaves free IS that unwritten rest. `planFitsSlot` now reports
`workSeconds` beside `netSeconds`, and the meter shows work — showing one number while colouring by
the other would leave an amber reading nobody could explain.

**"We should also find a way to account time for 20 bolgarian squats, or 5 pullups."** A flat 45s per
set said those cost the same. A set is now an overhead plus a cost per rep — 15s + 3s each:

| | before | now |
| :-- | --: | --: |
| 5 pull-ups | 45s | 30s |
| 10 bench press | 45s | 45s |
| 20 Bulgarian split squats | 45s | 75s |

Calibrated where it always was, so the common set did not move, and it still invents **no
per-movement table** — the thing this module refused for good reason. Reps are already in the plan.
A rep range costs its top; `Max`, a band label or an empty box fall back to the plain working set,
because costing them at nothing would make a plan of failure sets look free.

**Ruled 2026-09-01, and built:** *"keep the description 'X reps per arm', but when estimating
duration for a card or a cycle it should return calculated time back"*. The authored text is never
rewritten — the cost model reads it, and any per-side wording (`arm`, `leg`, `side`, `hand`, `foot`)
counts double. Side words are matched, never guessed: a movement that is unilateral without saying so
cannot be detected from a plan at all.

**And a set to failure costs the recovery it forces**, ruled the same day: *"max reps should probably
default to 3 or 5 min"*. Three, the conservative end — at five, four such sets eat a third of an hour
by themselves. `SECONDS_PER_MAX_SET` is the dial if it reads short on the floor. `Max`, `AMRAP` and
`F` are the tokens [repsAndLoad.js](src/domain/repsAndLoad.js) already recognises, so this needs no
new vocabulary.

**The arithmetic is a list of shapes now, not a chain of ifs** — asked for as *"in object oriented
manner"*. Each shape of work answers for its own cost (rest, timed, to failure, per side, counted,
uncounted) and the first whose test holds wins, so the order is the meaning and a new kind of work is
an entry rather than another branch to hold in your head.

Pinned by [planDuration.test.mjs](tests/unit_js/domain/planDuration.test.mjs) (nine new cases, from
the pull-up/squat asymmetry to rests being excluded from the judgement but kept in the total) and
[test_clipboard_editor.py](tests/medium/test_clipboard_editor.py) (the meter says `tight` before it
says `over`).

---

### 39.18 [x] FIX — the gate's worker split had gone stale, and it cost half the run

**Asked 2026-09-01 (Simon):** *"is there a way to support local development with code graphs, so that
tests unit, e-2-e and compliance get run on every edit premptivly to reduce wait times?"* — and the
first thing that question deserved was a look at where the time actually went.

**It went to one worker.** `demo_worker_count()` returned 1, derived on 2026-08-19 when the demo
suite was ~90s of call time against ~600s for the rest of e2e, with its own docstring asking to
*"re-derive this if either suite's call time moves substantially — the ratio, not the number, is what
matters"*. Both moved, in opposite directions: the demo suite grew with the story (48 cards, walked
twice over) while the rest of e2e got faster. Measured today: **demo 387s against e2e 192s** — the
ratio inverted, the stage's long pole running on a single worker while seven idled beside it.

The demo files alone finish in 163s at four workers. At three, inside the shared budget:

| | before | after |
| :-- | --: | --: |
| Demo & Walkthrough | 387s | **181s** |
| E2E Browser Tests | 192s | 162s |
| Stage 3 | 387s | **181s** |
| **whole gate** | **8m51s** | **4m44s** |

The two tasks now land within 20s of each other, which is the property the split exists for: the
stage costs as long as its slower half.

**[test_stage_tasks.py](tests/unit/test_stage_tasks.py) pinned the number, not the rule** — it
asserted `demo_worker_count() == 1`, so an honest re-derivation read as a regression. It now asserts
what must stay true: both tasks come out of ONE browser allowance, neither is starved, and the shares
add up. The number is free to follow the measurement, which is what its own docstring always asked.

**Re-check condition:** whenever either suite's wall time moves substantially — the same condition as
before, now with a test that does not fight it.

---

## 40. [x] Two workspaces — the trainer's own work, and a sandbox to learn in — shipped 2026-09-10

**Asked 2026-09-10 (Simon):** research whether demo data should be separated from the trainer's real
data, so that they can *"preklopi kadarkoli med svojim delovnim stanjem in stanjem za učenje in
experementiranje"* — switch at any time between their working state and a state for learning and
experimenting. Decided and **shipped the same day**; see [CHANGELOG](CHANGELOG.md). The subsections
below are kept as the record of what was decided and why — every one of them is now code.

Today the two are the same database, told apart by a `seededDemo` stamp on each record
([seedProvenance.js](src/data/seedProvenance.js)), and the only operation is one-way: the demo is
*removed* (§9.3, UC7). Three
things follow, and all three are what this section answers:

- **There is no way back.** A trainer who clears the demo cannot get it back without losing their own
  work, and one who has started working cannot put the demo aside.
- **Experimenting on real data has nowhere to happen.** Trying a plan change on a real client's
  programme means doing it to the client's programme.
- **The DEMO badge is a guess.** `isDemoOnlyStore(state)` holds only until the trainer's first real
  record, so the badge goes off while the demo is still all over the screen. With workspaces it is a
  fact, not a heuristic.

### 40.1 Two workspaces, and the line between shared and per-workspace

**Two, not many** (Simon): a working workspace and a sandbox. Any number would need naming, a list,
and a choice at boot; two keep the switch to one control.

One rule decides where every stored thing lives: **a fact about the person or the device is shared; a
fact about the data is per workspace.** That axis already exists in
[storageNamespace.js](src/data/storageNamespace.js) as `VERSION_SCOPED_KEYS` against
`ORIGIN_GLOBAL_KEYS` — it is renamed, not invented.

| Shared | Per workspace |
| :--- | :--- |
| The Drive OAuth grant, `librept_drive_connected`, the client id | `driveSync` meta — **the file id and the merge ancestor** |
| `librept_erasure_suppressions` — the erasure register | `backupHistory` meta |
| `trainerIdentity` — name, email, phone | `librept_active_session`, `librept_active_timers`, `librept_workout_setup_draft`, `librept_read_notifications` |
| Theme, accepted terms, chosen language | |

Two of those are not preferences:

**The `driveSync` ancestor MUST be per workspace.** A three-way merge is correct only if the ancestor
is exactly what Drive last saw ([syncMerge.js](src/data/syncMerge.js)). A sandbox that overwrote it
would silently corrupt the next merge of the trainer's real data. This is the only thing in the whole
design that can destroy work.

**The erasure register MUST be shared, as a union.** It is a grow-only set
([erasureSuppression.js](src/data/erasureSuppression.js)), so merging is a union — associative,
idempotent, no conflict. A promise made to a person must not be escapable by switching workspace, and
because every entry is a salted SHA-256 of an opaque record id, a shared list describes nobody.

### 40.2 A separate database, not a store-name prefix

**Ruled 2026-09-10 (Simon):** *"ločeni hrambi"* — separate storage.

**The prefix was considered and rejected** (Simon proposed it as the simpler build, with a guard in
the star write). Three facts decide against it:

1. **An IndexedDB object store can only be created inside `onupgradeneeded`.** A prefix doubles the
   stores at upgrade time and drags `databaseVersion()` ([indexedDb.js](src/data/indexedDb.js)) into a
   second axis, when it is deliberately derived from the highest numbered schema and nothing else. A
   second database changes none of that: `openDatabase({ schemas, name })` already takes `name` as an
   injected argument, because that is how tests have always run against a throwaway database.
2. **Resetting the sandbox is now a recurring operation (§40.4).** With its own database that is
   `deleteDatabase("librept_sandbox")` — one call that cannot reach the trainer's records. With a
   prefix it is deleting by name pattern *inside the database that holds them*.
3. **A guard in the star write is a rule; a separate database is the design.** The handle points at
   another database, so a sandbox write *cannot* touch real data — there is no check to forget and no
   exception to argue about for sync. Value 10.

Atomicity is not lost: a transaction cannot span databases, but the fan-out only ever writes within
one workspace. The prefix would win only for a cross-workspace transaction — "move this record into
my real data" — which is not wanted, and would be an export/import if it ever is.

### 40.3 Switching re-renders; it does not reload the page

**Ruled 2026-09-10 (Simon):** *"Si pa želim preklopa s ponovnim renderiranjem, ne pa reloadom
page-a"* — the switch re-renders, it does not reload. A reload costs the splash hold (`max(5s, boot)`),
the open view, the scroll position and any half-filled dialog, and it puts a service-worker fetch in
the path of a switch that may happen on the gym floor.

The app already replaces its whole database under a running UI — a backup restore
([backupRestore.js](src/modules/common/backupRestore.js)) and a Drive merge
([driveSyncService.js](src/data/driveSyncService.js)) both call `setState()` and re-render. So the
switch is four steps, three of which exist:

```js
async function switchWorkspace(name) {
  await flushWrites();         // writeQueue.js, already exported
  closeDb();                   // dbPromise = null
  setActiveWorkspace(name);    // one localStorage key
  setState(await loadState()); // the existing boot path
  renderEverything();          // §40.3a — does not exist yet
  navigateToPath("/");         // a route from the old workspace must not survive
}
```

**§40.3a `renderEverything()` is the only new piece, and it is a consolidation.** It exists three
times by halves today: the erasure path in [app.js](src/app.js) re-renders three things, the restore
and the Drive merge re-render others. One function used by all four callers removes that drift.

**Four boot-time captures have to become accessors.** `setupClientForms`, `setupRoutineForms`,
`setupExerciseForms` and `setupActiveSession` are each handed `state: getState()` once at boot, so
after any `setState()` they hold the previous object. Measured: **11 `state.` uses across the four
controllers**. This is a latent defect *today*, after every restore and every Drive merge — the switch
does not create it, it exposes it.

Measured cost of the whole switch:

| Work | Size |
| :--- | :--- |
| `workspace.js` — active workspace, database name, key suffix | ~40 lines, new |
| `stateStore`: workspace-scoped `getDb()` plus `switchWorkspace()` | ~30 lines |
| `renderEverything()` extracted, used at 4 call sites | ~30 lines, mostly moved |
| 4 controllers: `state` object → `getState` accessor | 11 references |
| Tinted header and the switch control (§40.5) | small |
| Sandbox lifecycle: seed, reset, staleness (§40.4) | ~80 lines |
| [dataWipe.js](src/data/dataWipe.js): enumerate both databases | small |
| Tests: unit_js for naming and staleness, e2e for isolation and switching | 2 files |

### 40.4 The sandbox holds today's seed, and says when it has gone stale

**Ruled (Simon):** the sandbox is filled exactly as the demo is filled today. No copy-of-real-data
variant for now.

Seeded sessions are generated relative to *now* ([sessions.js](src/data/sessions.js),
[sessionSeriesSeed.js](src/data/sessionSeriesSeed.js)), so a sandbox left for a month is an empty
board. **Ruled:** *"Najbolje, da zaznava zastarelost in predlagava data reset (z izgubo podatkov, če
se uporabnik strinja)"* — detect staleness and offer a reset, losing the sandbox's contents with the
trainer's agreement.

**Ruled 2026-09-10 (Simon):** *"zastarelost naredi v primeru več kot 12 ur — vprašaj ob vklopu demo
načina s cooldown timerjem 3 ure"* — stale after **12 hours**, asked when the sandbox is entered, and
a declined offer is not repeated for **3 hours**.

- The sandbox's `meta` store carries `seededAt`, and `staleOfferDeclinedAt` beside it.
- **Stale at 12 hours.** Not the week the seed spans: what the demo is *for* is a live and an upcoming
  session on today's board ([sessions.js](src/data/sessions.js)), and that is gone by the next
  morning, long before the week's edges are. A trainer who opens the sandbox in the morning and again
  the next day is asked, which is the intent.
- **The cooldown is 3 hours**, held in the sandbox's own `meta`. It survives declining, which is the
  case it exists for, and dies with the reset, which is the case where it means nothing.
- Offered **on entry**, not at boot — at boot it is a question about a workspace the trainer is not in.
- The reset is the first-entry path: delete the database, seed again.
- The dialog says what is lost — *what you did in the sandbox goes* — never "your data will be
  refreshed".

Both numbers are testable exactly, because the browser tiers run on a frozen wall clock
([tests/INDEX.md](tests/INDEX.md)): 11h59m does not ask, 12h01m does, and a decline followed by a
re-entry two hours later stays quiet.

### 40.5 What the trainer sees

**Agreed (Simon):** a tinted header, not only a badge. A badge read at arm's length, one-handed, mid
session, is not enough to stop someone logging a real set into the sandbox. The DEMO/PREVIEW badge
slot ([applicationHeader.js](src/modules/common/applicationHeader.js)) then states the workspace as a
fact and `isDemoOnlyStore()` stops being load-bearing.

**Ruled:** the sandbox survives a reload and a later visit. *"Da."* Otherwise it is a demo with a
timer, and nothing can be learned in it across two days.

### 40.6 Backup and Drive sync stay available inside the sandbox

**Ruled (Simon):** *"Backup in sync ni smiseln, je pa morda uporaben za e-2-e testing in za učenje. Se
mi zdi, da je tudi manj dela, če ohraniva polno funkcionalnost."* Keeping them is both the more useful
and the cheaper answer: **switching them off is a condition at every sync seam — a rule in ten places
— while isolating them is the per-workspace `driveSync` meta §40.1 already requires.**

The residual cost has to be stated rather than discovered: a sync from the sandbox creates a **second
file** in `appDataFolder` and spends the same OAuth grant. So the sandbox syncs to its own file name,
and the sync card in the sandbox says what it is syncing — otherwise a trainer reads "synced" and
believes their real work is safe.

A downloaded backup file is harmless, and "try a restore before doing it for real" is one of the
better things a sandbox offers.

### 40.7 The e2e suite must keep testing production, not the sandbox

**Simon's warning, and it lands:** *"Pozor e-2-e testi ne validirajo peskovnika temveč produkcijsko
kodo!"*

[conftest.py](tests/conftest.py) injects `?init=demo_data_load` for **every** test using the shared
`page` fixture. If demo data came to mean *the sandbox*, the whole e2e tier (231 tests) would quietly
start validating the sandbox instead of the app.

**The rule that prevents it, which is also less work: `?init=demo_data_load` keeps meaning "seed the
CURRENT workspace", which is the working one by default.** The sandbox is entered by a separate,
explicit act — a `?workspace=` parameter or the header control. The existing suite is then untouched,
and the sandbox gets its own e2e file covering exactly what is new: isolation, switching, staleness.

### 40.8 What this leaves of UC7

[uc7_demo_to_clean_database.md](use_cases/uc7_demo_to_clean_database.md) specifies removing demo
records from a mixed database. With two workspaces "clear the demo" is deleting a database, and the
fixpoint dependency planner is not needed for it — but it cannot simply retire:
[demoDataRemoval.js](src/data/demoDataRemoval.js) (172 lines) and
[seedProvenance.js](src/data/seedProvenance.js) (130 lines) are what a device whose database is
*already* mixed needs on the way onto this design. **UC7 becomes the one-time migration**, and the
document is rewritten as that rather than as a standing feature.

**Ruled 2026-09-10 (Simon):** a mixed install is **not split automatically**. Everything it holds
stays in the working workspace, and UC7's cleaner is offered once. Splitting by the stamp would tear a
demo client the trainer renamed and has been training for months away from the real records that
reference them — the exact case `planDemoRemoval`'s fixpoint exists to protect, and it cannot be
protected by a rule applied at boot without a trainer looking at it.

### 40.9 Both "show me around" offers now open the sandbox

**Ruled 2026-09-10 (Simon):** *"oba v demo način"* — the splash's demo-data offer and the guided
story/walkthrough both enter the sandbox rather than seeding the working one.

That is what makes the whole design honest: today the only way to see the product is to put sample
people into the database the trainer is about to work in.
[splashScreen.js](src/modules/splash/splashScreen.js)'s `guidedDemoUrl()` is the single builder behind
both offers, so both move together.

**The `?init=demo_data_load` parameter keeps its own meaning — seed the CURRENT workspace** (§40.7).
The two do not collide: the buttons change where they lead, the parameter does not change what it
does, and [conftest.py](tests/conftest.py)'s injection keeps every existing e2e test in the working
workspace against production paths. The demo and walkthrough tests move into the sandbox, which
is where they belong.

### 40.10 Demo data can never enter the working workspace

**Ruled 2026-09-10 (Simon):** *"restore demo podatkov ne sme biti mogoč v produkcijsko bazo"* — a
restore must not be able to put demo data into the trainer's own database. This overrides the earlier
working assumption that a restore simply lands wherever the trainer happens to be.

**One exact test, not two.** The backup file **declares the workspace it was written in**, and a file
declaring the sandbox is refused whole on the way into the working one. A restore that silently
landed nothing would be a failure reported as a success, so it is a refusal with a reason, not a
filter.

**Ruled 2026-09-10 (Simon):** *"produkcijski backup naj ne ločuje (starih) demo vnosov, install base
je premajhen, da bi to skrbela"* — a file written before this ships carries no declaration, and its
seeded records ride back in untouched. This drops the per-record filter that was proposed here.

It costs nothing real. Such a file came from a mixed database, so restoring it returns exactly the
database the trainer already had — no loss and no surprise — and the rule that matters holds anyway:
nothing can flow *out of the sandbox* into the working one, because the sandbox only
ever writes declared files. The heuristic half of [seedProvenance.js](src/data/seedProvenance.js) (the
committed seed id set) is therefore not needed on this path at all; it stays only for UC7's one-time
cleaner (§40.8).

Into the sandbox nothing is refused: it is the workspace where sample data belongs.

Drive sync needs no separate rule. The `driveSync` file id and ancestor are per workspace (§40.1), so
the working workspace never reads the sandbox's file — the isolation is the same one that keeps
the merge ancestor correct.

### 40.11 A running timer keeps running, and every timer knows which workspace it belongs to

The case: a trainer with a session running steps into the sandbox during a rest period — the only free
moment a session has, and exactly when a rest timer is counting down.

**Nothing is lost by leaving.** A rest timer computes its remaining time from an absolute `endTime`
([exerciseAndRestTimer.js](src/modules/clipboard/exerciseAndRestTimer.js)) and the live session is a
per-workspace key ([sessionCache.js](src/data/sessionCache.js)), so time spent away is accounted for
on return. What would be lost is the **beep**: the module holds its timers in memory, the switch has
to stop the sandbox from showing the working workspace's timers, and tearing the module down stops the
tick that beeps. Same class of defect as §40.3's four boot-time captures — module state silently bound
to one workspace.

**Ruled 2026-09-10 (Simon):** the switch does not stop the clocks. **Every timer carries a mark
saying which workspace it belongs to**, and the mark decides who hears it:

| Where the trainer is | A working-workspace timer expires | A sandbox timer expires |
| :--- | :--- | :--- |
| Working workspace | beeps | **expires silently** |
| Sandbox | **beeps, and says which one** | beeps |

The asymmetry is the point, and it is one sentence: **real work is never missed, and the demonstration
never intrudes on real work.**

**A working-workspace timer expiring while the trainer is in the sandbox names itself and offers two
ways on** — *return to the working workspace*, or *ignore and discard the expired timer*. Naming it
is possible today: a timer already carries `clientName`, `label` and `sessionId`, so the card can say
whose rest is over rather than that some timer somewhere finished.

Neither answer interrupts anything else: nothing is blocked, and a trainer who chooses to stay in the
sandbox stays there.

Implementation notes this leaves:

- The mark is **stamped when the timer is loaded, from the store it came out of** — it is not a second
  place where the truth lives.
- The in-memory map is keyed by `clientId` today, so it becomes keyed by workspace and client. Two
  workspaces cannot collide on an id, but a map that cannot express the pair would drop one of them.
- Ticking is global, the display is filtered by workspace, and §40.3's `switchWorkspace()` therefore
  must **not** tear the timer module down.

### 40.12 It is called the sandbox — in the code, in the docs, and on screen

**Ruled 2026-09-10 (Simon):** *"preklopiva na sandbox povsod"* — one word everywhere, against the
recommendation of a split (screen word "demo", code word `sandbox`) made in the same session. One
word means nothing has to be translated between what we say and what the trainer reads, and it names
the **place** rather than its current **contents** — which is what survives if the sandbox is ever
filled with something other than the demo seed.

`sandbox` is therefore the term in module names, the database name (`librept_sandbox`), storage keys,
i18n keys, this section and the rewritten UC7.

**On screen in Slovenian it is `peskovnik`** (Simon, 2026-09-10) — `sandbox` in `en`, `peskovnik` in
`sl`, one i18n key behind both.

### 40.13 What was assumed while building it

Decisions taken during implementation that no ruling covered. Each is cheap to reverse; each is
written here rather than only in a comment, because a decision nobody was asked about is the kind
that gets found by accident.

**Storage**

1. **The working workspace keeps every name it already has** — the `librept` database, unsuffixed
   keys. So the split arrived as a no-op for existing installs: nothing to migrate, and a sandbox
   nobody has opened does not exist as a database at all.
2. **`librept_workspace` — the pointer saying which workspace is open — belongs to neither of them.**
   It cannot live inside a workspace: it is what selects one. Absent means the working workspace, so
   an unreadable or unknown value fails towards the trainer's own data.
3. **A sandbox reset keeps what belongs to the person.** It deletes the sandbox database and the keys
   suffixed to it; the theme, the language, the accepted terms and the trainer's own name are
   untouched, because they were never the sandbox's.
4. **`resetLibrePTData` deletes both databases.** It sweeps every `librept*` key already, so leaving
   the sandbox database standing would leave a database nothing points at — after telling the trainer
   everything was removed.
4a. **The support wipe (§31) takes the sandbox with the device's own bookkeeping, not as a row of its
   own.** Both databases name their stores identically — `schema4` is in each — so two identical rows
   would ask somebody on a support call to tell them apart, and the sandbox holds sample data only,
   which is nothing worth keeping back. **Ruled 2026-09-10 (Simon):** *"data wipe naj ostane
   totalen"* — the offer of a separate, deselectable sandbox row was declined; a wipe removes
   everything this device holds.

**The language, which was a defect the tests found**

5. **`lang` moved to an origin-global key** (`librept_lang`), joining the theme and the accepted
   terms. It had lived only in each database's meta store — invisible while there was one database,
   and wrong the moment there were two: entering the sandbox produced a store with no language in it,
   and the splash asked a trainer who had answered that question already. The meta copy is still
   written and is still read when the shared key is absent, which carries an install that chose its
   language before this existed.
6. **A save carrying no language never clears that key.** A store that was never asked is not an
   answer being withdrawn — and the sandbox's very first save is exactly such a store.

**Behaviour**

7. ~~The switch resets the route to the dashboard.~~ **Overruled 2026-09-10 (Simon):** *"vrnitev,
   bi bila idelna, da se vrne na prejšnji view (primer clipboard, uporabnik in aktivna vaja)"* —
   coming back returns to the view that was left, the live session included
   ([lastRoute.js](src/data/lastRoute.js)). Stepping out to look something up and landing on the
   dashboard costs three taps to find the session, the client and the exercise again, on a gym floor
   with somebody waiting. A remembered path is used only if the router still recognises it: what it
   names may have been deleted in the meantime, or rebuilt under a sandbox reset. The live session is
   re-recovered for the workspace being entered, and the one held in memory is dropped first — its
   cache key is per workspace, so without that the sandbox would keep showing the trainer's real
   session on the clipboard bar.
8. **A restore lands in the workspace the trainer is in**, and only sandbox → working is refused.
9. **The staleness offer is a real dialog, not a `confirm()`**, and dismissing it counts as declining
   — a question closed is not a question answered yes, so the cooldown starts either way.
10. **A sandbox of unknown age is never stale**, and a clock that moved backwards never makes one
    stale. Both would offer to delete somebody's work on no evidence.
11. **The sandbox is seeded on first entry only** — when it holds nothing. It is never re-seeded
    behind the trainer; §40.4's offer is the only other way it gets filled.
12. **The timer rule, stated as one line in the code:** the trainer's own work beeps wherever they
    are; the sandbox beeps only in the sandbox. The card names the client and what was being timed,
    and "ignore" discards that timer rather than silencing all of them.
13. **The sandbox syncs to its own Drive file** (`librept_sandbox_sync.json`), and the sync card says
    so while the trainer is in there. The erasure register stays ONE file, shared, per §40.1.

**Two things the estimate in §40.3 got wrong**, both worth remembering:

- The four boot-time state captures were real and small, exactly as measured — but `appDeps` was a
  fifth, reaching ten more call sites, and it was fixed at the seam instead: `deps.state` is now a
  live getter, so nothing downstream changed.
- Nothing in the estimate predicted the language defect. It was not introduced by this work; it was
  **exposed** by it, which is the ordinary way a hidden coupling surfaces.

---

### 42.1 [x] Expand all — shipped 2026-09-10

See [CHANGELOG](CHANGELOG.md). The ⋯ menu opens every card at once, and the item says which direction
it goes. Two decisions in it are worth keeping:

- **An expanded card that is not in focus draws what the focused card draws and BEHAVES like a
  collapsed one.** Its controls are removed from the DOM rather than disabled — twelve open cards
  with live Too Easy / Too Hard / timer buttons put a mis-tap one thumb-width from logging against
  the wrong exercise, and a control that is drawn but inert is worse than either. A tap focuses the
  card, exactly as a collapsed one's does.
  **Half superseded by §42.3:** there is no second template to draw and nothing to strip any more —
  every card is one design and focus ADDS its controls. What survives is the promise: a card that is
  not in focus carries nothing to tap.
- **Expansion and focus are separate states.** Focus is a fact about the session — it keeps the tint,
  the ring, and what a card may do. Expansion only decides how much is drawn.

Two defects the first version had, both found by the test rather than by reading: stripping the two
named containers missed the rest card's Start button, which sits in neither (it strips every button
and input now), and the rest card hardcoded an "In Focus" badge that was only true while its template
was drawn for the focused card alone.

---

### 42.2 [x] Measured: why expanding alone does not finish the job — closed 2026-09-10

A phone at 390×844, the deck stub with a four-item plan:

| | Height |
| :--- | ---: |
| Focused card | **172px** — top row 32, name 17, stats block 52, action row 39, padding 16 |
| Expanded, not in focus | **133px** — the same without the action row |
| Collapsed row in the stack | **37px** |

The deck's own visible area on that phone is roughly 500px once the header, the title bar and the
clipboard bar are out. So expanding gives **under four cards on screen** where the stack gives
eleven. For a six-item plan the trainer still scrolls — the control answers "show me everything" and
not yet "let me see it".

---

### 42.3 [x] One card design, opened up — ruled and shipped 2026-09-10

**Ruled (Simon):** *"fix the card redesign, expanding the card should just insert elements into
existing exercise design, not load a completely different one"* — and, asked whether that also
governs the card in FOCUS: yes, all three states are one design.

What was there before: every card type carried two full templates, and the deck swapped one for the
other. The collapsed exercise row said `S4 × R6 × 60kg` on one line; the focused card threw that line
away and said the same three numbers again as a block of big tiles 52px further down. So a tap
replaced what the trainer was reading instead of opening it — and the two templates had to be kept in
agreement by hand, which is how the status tag ended up in a different place in each (§42.5).

**Now:** `renderCard` draws the one design, for every state. `addFocusElements` ADDS to it — the ⏱ at
the end of the head row, the Too Easy / Too Hard / Feedback row, a rest's Start, a circuit's feedback
trio per movement and its round button, a past card's set-by-set panel. The focused card is bigger
only where being read at arm's length needs it: the name, the target line and a circuit's movements
grow, and nothing moves.

**The safety rule became structural.** A card that is not in focus carries nothing to tap because no
control was ever drawn, not because a `stripControls` pass removed every button and field afterwards.
That pass is gone, and with it the class of bug it had already produced twice (a Start button in
neither named container; a live number field on a card being read).

**What "expand all" now does, stated plainly:** it takes the cards out of the stack. Collapsed cards
slide up over each other and only their top row peeks; an expanded card lays flat and is fully
visible. It no longer draws MORE of a card — there is no more to draw — which is the honest version
of what the trainer asked for: *see the whole session*.

**Measured on a phone (390×844), the deck stub with a four-item plan** — the same setup §42.2
measured before the change:

| | Before | After |
| :--- | ---: | ---: |
| Focused card | 172px | **96px** |
| Expanded, not in focus | 133px | **39px** |
| Collapsed row in the stack | 37px | 37px |

An expanded card is now the collapsed row laid flat, 2px taller only because it stops being scaled
back into the stack. With its 8px gap that is a 47px pitch: **ten expanded cards** in the deck's
~500px of visible area on that phone, against under four before.

**The savings §42.3 estimated, taken:** folding the stats block into the target line (~35px) and the
top row into the name line (~32px, taken by §42.5).

What stayed open is the card chrome question — see §42.13.

---

### 42.4 [x] Expand all is a SETTING — shipped 2026-09-10, halved by §42.14

**Ruled 2026-09-10 (Simon):** *"expand all cards should be a permanent setting, and should be
reversable with collapse all cards (ločeni nastavitvi za termine in za klipboard kartice)"*.

Two corrections to what §42.1 shipped, both now in (`data/displayPrefs.js`, the module [§45.16](TODO.md) later retired):

1. **It persists.** The flag was written onto the live session, so it died with that session — a
   trainer who wants the whole plan open wants it open tonight as well. It sits beside the theme now:
   plain unscoped `localStorage`, shared by both workspaces, because it is a fact about the PERSON
   and not about either workspace's data (§40.1).
2. **Two settings, not one.** The day's session cards and the clipboard's exercise cards are read in
   different postures — scanning tomorrow at a desk wants every session card open, mid-set wants the
   clipboard down to the card being worked. One switch would make each answer wrong half the time.

Both default OFF: a preference that changes how the app looks before anybody asks for it is a
surprise, not a default.

**Where each control lives: beside the cards it changes.** The clipboard's is in the ⋯ session menu;
the day's is beside Today and the date jump, wearing the same chevron pair the cards' own controls
wear. A setting two taps away from the thing it changes is a setting nobody finds — which is the
argument against the other candidate home, a "display" section in the ☰ app menu.

**The per-card control still works in both directions.** A session card's chevron is now an EXCEPTION
to the setting rather than a list of open cards, so it opens or closes whichever way the setting
points. Exceptions are cleared when the setting itself flips: a fresh default with yesterday's
exceptions on top is neither answer.

**Amended 2026-09-11 by §42.14:** the clipboard's half of this is removed. Everything above still
holds for the day's session cards, which is the one setting left.

---

### 42.13 [x] Should an expanded card keep its border and shadow? — dissolved 2026-09-11

Left open by §42.3. A card that is not in focus is now one line, and ten of them fit the phone. If
the expanded tier also dropped the card chrome — border, radius, shadow — it would save perhaps
another 10px each and the deck would read as a table, which is what a trainer scanning a whole
session is doing. It is also the point where the deck stops looking like the app.

**What would settle it:** show the trainer who reported the legibility both, on their own phone.
Nothing in the code has to be decided first — the chrome is three lines in
[exerciseDeckOfCards.css](src/modules/clipboard/exerciseDeckOfCards.css)'s `.expanded` rule.

**Never answered, and no longer askable.** §42.14 removed the expanded tier the same day: there is no
state between the stack and the card in focus for the chrome question to be about. If the deck is
ever asked to read as a table again, the question comes back with it.

---

### 42.14 [x] The clipboard's expand-all is gone — removed 2026-09-11

**Ruled (Simon):** *"da, odpri vse je sedaj redundantno, lahko odstraniva"* — after §42.3 made every
deck card one design.

The control answered "let me see the whole session". Once a card said everything it had on its own
row, it had nothing left to open: what it still did was stop the cards overlapping. **Measured on a
phone (390×844), a plan with a three-movement circuit:** the circuit card's content needs 80px and
the stack leaves it 85px; a rest needs 29px and is left 31px. Nothing was clipped, so the setting
was buying a layout preference, not legibility — and it cost a menu item, a stored setting, a
deck-wide render flag, a CSS state and a third card state to reason about.

**What replaces it is a check, not a promise.** The deck's legibility test used to assert that a
collapsed card's FIRST LINE clears the card above it; it now asserts that ALL of its content does
([test_clipboard_deck_legibility.py](tests/medium/test_clipboard_deck_legibility.py)). That is the
guard the removed setting was standing in for: with no way to open the cards, the stack has to be
readable, and the margin is thin enough (2px on a one-line card) that anything which grows a card
will say so.

**What came off:** the ⋯ menu item and its label repaint, `clipboardCardsExpanded` in
`data/displayPrefs.js` — retired by [§45.16](TODO.md) — with its `librept_expand_clipboard` key, the `expandAll`
flag threaded to every card, `DeckCard.isExpanded`, and the `.expanded` layout rules. A card is now
either the one being worked or one of the rest.

**One word changed with it.** `collapse_all` read *"Back to the deck"* — deck language, written for
the clipboard. The day's session cards are the only caller left and they are not a deck, so it says
*"Collapse all cards"* / *"Skrči vse kartice"*.

**Left standing:** the day's session-card setting (§42.4). Those cards genuinely hide something —
participants and programme — so opening them all still opens something.

---

### 42.8 [x] No badge on the card in focus — shipped 2026-09-10

**Ruled (Simon):** *"do not create inFocus tag for active excersize (i like the background and border
highlight on midnight)"*. The tint and the border already say which card it is, in every theme, and a
word repeating what the colour has said costs a slot in the title row. **Completed** and **Upcoming**
stay: nothing else on the card says those.

---

### 42.10 [x] The sandbox says where its own exit is — shipped 2026-09-10

**Asked, then ruled, 2026-09-10 (Simon):** *"kaj pa je hitra vrnitev iz peskovnika v produkcijo?"* —
and, after the options were laid out: *"ne, imaš prav, uporaba menija je dovolj, bi pa bilo treba to
uporabniku povedati, da bo vedel"*.

Two taps through the ☰ menu is the way out, and it stays that way. A one-tap control was considered
and declined: the badge beside it is the only route to the data-loss notice, and a mode switch hidden
behind a tap on the logo is a surprise. What was missing was not a control but a sentence.

**The feed's leading card says it**, because that is the card a trainer in the sandbox is already
reading — it is what tells them none of this is real, and it is the collapsed drawer's summary line.
In the sandbox it now says what the sandbox is, that nothing done in there can reach their own data,
and how to get back: **the menu ☰ at the top right, and the item by its name**, per the standing rule
that a step naming an action names the control.

The stored card's other half goes with it: **"Clear demo data" is not offered in the sandbox.** It was
written for a database where sample records sat among real ones; in here it would empty the very
thing the trainer came to look at.

---

### 42.11 [x] The expand-all menu item wears the app's own chevron — fixed 2026-09-10

CI caught what this machine could not: `fa-up-right-and-down-left-from-center`, added for the
clipboard's expand-all item, **drew a different shape on the runner than in the baseline recorded
here** — 141 of 256 cells apart, while all 90 other icons matched exactly.

The gap that let it through: **`agent_tools/icon_render.py` checks that a class maps to a codepoint in
the shipped CSS, not that the vendored subset FONT contains that glyph.** A codepoint with no glyph in
the subset falls back to whatever the machine has, which is a different outline on a runner than on a
laptop — and recording a baseline from here baked this machine's fallback in as the truth.

The item now wears `fa-chevron-down`/`fa-chevron-up`, the same pair the day's control and every
session card's own control already use: one idea, one glyph, and a shape whose drawing is already
recorded. The baseline is back to 90 icons, with the one line removed and nothing else changed —
which is itself the evidence that only that glyph was ever in question.

**Open:** whether `--baseline` should refuse to record a glyph the subset does not contain, rather
than recording a fallback. The blank check covers a glyph that draws nothing; it does not cover one
that draws something else.

### 42.12 [x] In the sandbox the badge is a marker, not a link — shipped 2026-09-10

**Reported, then ruled, 2026-09-10 (Simon):** *"klik na peskovnik značko vodi na neobstoječo stran"*
· *"odstrani povezavo iz značke"*.

The 404 could not be reproduced: the badge's `./preview.html` resolves through the shipped `<base>`
to `/LibrePT/preview.html`, which answers 200 on the dev server and on the published site, and the
page has existed since 2026-08-13. What the report exposed is a better question than the one it
asked — **whether that destination belongs to the sandbox at all.**

It does not. The notice explains that a preview build can lose the trainer's data; a workspace that
holds nothing but sample data is the one place where that warning is beside the point, and the badge
is the first thing a trainer taps when they want to know what they are looking at. Since §42.10 that
explanation is one tap away in the feed's leading card, in words about the sandbox.

So in the sandbox the badge carries no `href` and no `target`, and announces itself as a status. An
`<a>` without an href is neither focusable nor clickable, which is the point: it stops offering what
it cannot honour, rather than pointing somewhere else. The link is put back on the way out, because
one element serves every state — pinned by a test that switches in and out.

**Unchanged in the other two states.** PREVIEW and DEMO keep the link: the build is still a preview,
and that page is still the only place the risk is explained without signal.

---

#### 45.16 [x] The session card, read off a screenshot — shipped 2026-09-11

**Reported (Simon), with a picture:** the *Zaključeno* badge takes room in the heading row, the card
carries a block of empty space, and the programme name is written twice.

**Three complaints, one cause.** The heading row wraps. With the time, the title, the badge and two
icon buttons in it, the EDIT button was pushed onto a line of its own — and that line, otherwise
empty, is the "empty space". So the badge was not merely taking room; it was breaking the row.

**What the card lost, and why each was costing more than it said:**

- **The participants' NAMES.** They were the only thing the card hid, which is the whole reason an
  expand control existed. A name is also the slowest thing on the card to read and the least useful
  at a glance: the count says whether the session is full, and [§45.6](TODO.md)'s client filter now
  answers "which sessions is Ana in" far better than reading every card on the board. An injury is
  NOT dropped — it becomes ONE mark on the card, because that is a warning rather than a detail.
- **The programme name when it repeats the title.** A session usually takes its name from its
  programme, so the repeat is the common case. Compared trimmed and case-insensitively: what matters
  is what a reader sees twice.
- **The completed badge, out of the heading row** and into the status bar at the foot, which already
  exists on a finished session and already reports how long it ran.
- **The expand chevron and the expand-all control**, which now have nothing left to open.

**So `data/displayPrefs.js` is gone.** It held exactly one setting, the session cards' expand-all —
the clipboard's copy having been removed by §42.14 for the same reason, in the same words. A module
whose only reason to exist has been retired is deleted rather than left empty. Its two localStorage
KEYS stay listed in `storageNamespace.js`: an install that still holds one must go on being read and
wiped unscoped, and moving a leftover value into a workspace scope would be a migration performed by
accident.

**§42.4 is thereby reversed, seven weeks after it shipped.** It was right when a card hid something.

### 46.1 [x] The warning list called the whole day taken — fixed 2026-09-12

The form sat at 06:00-06:00 and reported five collisions, none of them real. `slotFromForm`
([scheduleConflicts.js](src/domain/scheduleConflicts.js)) handed `"06:00 - 06:00"` to
`parseTimeRange` ([timeRange.js](src/domain/timeRange.js)), whose midnight rule reads an end at or
before the start as the next day — right for 22:00-00:00, and a full 24-hour slot for two equal
times. A missing end was worse: it defaulted to the start, so an untouched field meant "all day"
too.

**Fixed by measuring the length instead of trusting the pair**: no end, or a length of a full day,
now means "the trainer has not said how long this is", and an unknown length collides with nothing.
The rule a live warning lives or dies by is that it must not fire on the ordinary case.

**And the end now follows the start**, keeping the length already chosen (an hour until the trainer
says otherwise) — the state that produced the screenshot could not have been reached.

### 46.2 [x] Choosing two clients out of a hundred — redesigned 2026-09-12

The form rendered EVERY client in the base as a checkbox row carrying its own routine `<select>`,
and opened with all of them ticked. With the eight seeded clients that is merely untidy; with a real
base of a hundred it is a wall to scroll one-handed, a hundred `<select>` elements built on every
open, and a session that starts out booking ninety-eight people the trainer must then remove.

**What it is now**: the form opens with nobody on the session. One search field finds a client by
name and shows at most eight matches; a tap — or Enter — puts that person on the session with their
own programme picker and a cross to take them off again. A row exists only for someone who is
actually training, so the rows ARE the selection and there is no checkbox to read.

Pinned in [tests/medium/test_session_participant_picker.py](tests/medium/test_session_participant_picker.py).

### 46.3 [x] Four smaller things in the same screenshot — fixed 2026-09-12

- **The labels promised a format the control does not use.** "DATUM (YYYY-MM-DD)" sat above a field
  showing `09/12/2026`, and "ZAČETNI ČAS (24H)" above `06:00 AM`. A `<input type="date">` or
  `type="time"` always renders in the browser's own locale; the hint could not be honoured and was
  only misleading. Removed from both languages.
- **The session name appeared twice**, once in its field and again as plain text above the
  participants. The subtitle existed because the form was long enough to scroll the name out of
  sight — which §46.2 fixed at the cause.
- **The warning list was five full-width tinted blocks** pushing the participant picker off a phone
  screen. Now a coloured bar down the left of a compact line, with the two states still told apart.
- **The form's own description still said "check clients to select participants (2-6)"** — a
  description of the picker that no longer exists, and a count the form never enforced.

### 46.4 [x] The demo data speaks the trainer's language — shipped 2026-09-12

**Reported 2026-09-12 (Simon), from a screenshot**: "Morning Conditioning", "Trib gym base" and
"playground outside" read as English in a Slovenian app.

**Ruled the same day**: the demo is a SNAPSHOT in the language selected when it is loaded. A later
language switch does not rewrite it — by then those rows are the trainer's to edit, and reseeding
them would throw that away. Reloading the demo in the other language is how to get it in the other
language.

**Why it was not a text edit.** The seed is a static dataset written into the database at load time,
and `data/` may not import the interface dictionaries as a layer. Two things made it safe in the
end. `data/seedProvenance.js` identifies demo rows by ID, not by text, so translating the words
cannot break selective removal. And the dictionary lives at
[src/data/demoText.js](src/data/demoText.js) rather than in `src/i18n/`: every `.js` in the locale
directory is read as a LANGUAGE by the parity check, so a helper dropped there is a locale missing
six hundred keys. Found by the gate, on another session's run.

**Keyed by the seed's own English**, not by invented key names: a seed record is a sample session
called "Morning Conditioning", and a key per record would mean two places to edit with nothing to
catch a miss. The walk translates every string at any depth, because the words are not only on the
record — a routine's circuits carry titles and a history entry's sets carry the note written during
the set. Its test walks the real seed modules and failed twice while being written, on strings a
by-hand sweep had missed.

**Not translated, deliberately**: exercise names (the movement catalog's own vocabulary, used in
English on a Slovenian gym floor), people's names, and "Trib gym base" — a gym's name, not a
description of one.

### 46.5 [x] The seed stamp says what it is — renamed 2026-09-12

Every seeded record carried `seededDemo: true`. That name was not true of all of them: the browser
suite seeds the same rows through `?init=demo_data_load`, and those are not a demo of anything. The
field is now `testData`, which is true of both and is the word someone reading a backup needs —
**the manual cleanup route Simon named is to hand an exported backup to an AI and have it strip
those rows**, so the file has to say plainly which rows are not the trainer's. The old name is still
READ, for the two preview installs that carry it and sit at schema "P", where the migration chain
never runs again.

### 46.6 [x] [Decided] The demo-removal code stays, as a safety valve — ruled 2026-09-12

Simon first said it was no longer needed: the demo lives in the sandbox now, and a sandbox is thrown
away whole. He then asked what keeping it costs, and on the measurement ruled that it **stays**, for
the case the sandbox does not cover — test data that reaches the working workspace, through an old
`?init=demo_data_load` link or a restored backup.

**What it costs: nothing that grows.** [seedProvenance.js](src/data/seedProvenance.js) identifies a
record by the `testData` stamp, and failing that by the seed id set derived from the seed modules
themselves — never by text. So translating the demo (§46.4) could not break it, and adding a demo
record keeps it correct with nothing to remember. Seed ids are 8 characters where a real one is a
22-character base62 UUIDv7 ([recordId.js](src/data/recordId.js)). It is 172 lines of rule, 180 of
dialog and 447 of tests.

**And it costs the trainer nothing to carry**: the button lives on a notification that is itself a
seeded record, so an install with no test data has no card and no button.

**The manual route stays the fallback** for a store nobody can reach through the app: hand the
exported backup to a tool that strips every row stamped `testData`. That is what §46.5 renamed the
stamp for.

### 46.7 [x] The stamp says WHICH kind, and the app notices when test data escapes — shipped 2026-09-12

**Asked by Simon**: tag seeded rows as demo or test, and find a way to detect when such rows are in
the production database outside a test run.

**The stamp now carries an origin**, written when the row is created, because the two are byte-identical
afterwards and nothing can tell them apart later. The sandbox writes `testData: "demo"` — the sample gym
a trainer asked to see. `?init=demo_data_load` writes `testData: "test"` — the switch the browser suite
puts on every navigation, and the only way anything reaches the WORKING database.

**The app cannot detect a test run, and does not pretend to.** No page can: it is the same app under
Playwright as under a thumb. The alarm is built from two facts instead. One is already written down —
which switch wrote this row. The other is the current boot: does the address carry `?init=`? A test run
always does, so it never sees the alarm; a trainer's install never does, so one escaped row shows up
the moment the app opens. In the sandbox it says nothing, because that is where sample data belongs.

**What the trainer sees**: a warning at the top of the message feed — *V tvojih podatkih so testni
zapisi* — naming how many rows and which collections, and offering the removal screen §46.6 kept.

**Two weaknesses, on the record.** Anyone can type `?init=` into a URL, so a person can create
test-stamped rows; that is the case the alarm is FOR, not a defect in it. And the alarm stays quiet
during the suite only while every test navigation carries the switch — a test that seeds with it and
then reloads without it would raise the alarm on itself.

### 47.1 [x] The session title runs off the card — fixed 2026-09-13

The card in the screenshot is the clipboard's title bar, not a card in the session list. Its name
was "Group Strength & Conditioning + …": two sessions booked into one slot share one clipboard, and
the name joins both.

**The title.** `h3#session-title-text` is a flex item of `.session-title-block` and had no
`min-width: 0`, so it would not shrink below its text. At 390px it was 379px wide in a 240px slot.
The name never reached its ellipsis and ran under ▶ and ⋮. Fixed in
[activeSessionOverlay.css](src/modules/clipboard/activeSessionOverlay.css).

**Each name on its own line — ruled 2026-09-13.** With the h3 shrinking, the joined name was cut
with "…": at 390px it read "Group Strength & Conditioning + …", and the second session was not
named at all. Measured options were one line with "…" or two wrapped lines (+8px of bar height).
Simon's ruling: one line per session name, and a name too long by itself still ends in "…". Both
the clipboard ([sessionTitleBar.js](src/modules/session/sessionTitleBar.js)) and the editor title
([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)) do it, because they are one
bar in two modes. The collapsed bar at the bottom of the screen still joins names with " + ".

**Why the sweep missed it — three reasons, all measured.**

1. **The walk opened the wrong clipboard.** `_walk_live_session` clicked the first card, a finished
   session with a short name. With the seed's merged pair open, the old sweep did report the h3, by
   5px past the screen edge. The walk now opens that pair.
2. **No rule saw text that stays on the screen.** A name ending at 286px lies under ▶ (from 272px)
   and inside the screen. Rule A needs a box that clips, or the screen edge; rule B needs a box that
   clips. Nothing here clips. **New rule C**: an element in the normal flow may not be wider than a
   parent that does not clip it, measured against the parent's padding box and allowing any negative
   margin. Pinned against built-to-break pages in
   [test_overflow_scan_invariants.py](tests/medium/test_overflow_scan_invariants.py).
3. **The component test measured a shape the app no longer draws.** `_mount` in
   [test_clipboard_title.py](tests/medium/test_clipboard_title.py) wrote a plain string into the h3.
   Since §39.6 the renderer puts two lines there, and only that shape breaks. The fit test now goes
   through the real renderer, with the merged name.

**Rule C found two more, on its first run, on every width.**

- **Plan editor rows.** At 390px a row needed 380px and had 304: the rest field and the delete
  button sat past the screen edge. Rule A had stayed quiet because the list around the rows has
  `overflow-y: auto`, which makes the browser compute `overflow-x: auto` too, and A reads that as
  "can be scrolled sideways". The row now has two lines: the exercise, then the four numbers and
  the delete button. The exercise name is no longer cut either.
- **Exercise picker badges.** `flex-shrink: 0` stopped them wrapping, so "CONDITIONING" ran past the
  item's border and the name beside it was squeezed to one word per line. They now wrap.

### 48.1 [x] The active card and the open card are two different things — shipped 2026-09-13

**Wanted.** On the clipboard, the card the participant is working on now (the ACTIVE card) must be
separate from the card the trainer has opened to look at (the OPEN card). The aim is fewer taps.

**What the app does today.** One value, `activeExerciseIndex` in the client's session state, does
both jobs. The deck in [exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js) opens
the card at that index, and a tap on another card calls `focusExerciseByIndex`, which moves it. So
when the trainer opens the next card to read it ahead, the app also treats that card as the one in
progress. Getting back costs another tap.

**Decided 2026-09-13 (Simon):**

- A tap on a card that is not active opens it AND makes it active, as today.
- The active card follows the scroll: the card the trainer is looking at is the active one. Nothing
  else moves it forward.
- The rest timer starts on a tap and does not depend on any card. Assumed, not yet confirmed: it
  keeps the way back to the card that started it
  ([sessionFocus.js](src/domain/sessionFocus.js) records that card).
- The active card has a coloured left edge and a thin outline, drawn by a class and CSS (§49.1).

**Ruled 2026-09-13 (Simon), second answer:** *"scroling does collapse cards, but it only highlights
the one in focus, so it can quickly be returned to when switching client views. We don't want to
show any buttons on active card, to not clutter in progress session, card opens buttons and controls
only on tap."* And, asked separately: *"fix also reload to return to same state as before"* — which
also opened §50 for every other form.

**What shipped.**

- The state stayed one index per client. `activeExerciseIndex` is the active card and is always
  marked (`is-active`); `deckAllCollapsed` now means only "no card is open".
- [deckScrollFocus.js](src/modules/clipboard/deckScrollFocus.js) reads the card at the focus line
  after a scroll and hands it to `activateExerciseByScroll` in
  [sessionFocusUrl.js](src/controllers/sessionFocusUrl.js), which closes the open card. It
  re-renders only when a card was open, so a scroll with nothing open does not rebuild the deck
  under a moving finger.
- Only the trainer's scrolling counts: a wheel, a touch drag or a scrolling key opens an 800 ms
  window, and a tap closes it. Without this, the scroll the deck makes by itself after a render
  would close a card opened low on the screen at once. The test for it was checked by removing the
  guard and seeing it fail.
- The focus line moves with the scroll, from the top edge at the start of the list to the bottom
  edge at its end. **Reported by Simon while it was being built:** a line fixed a third of the way
  down could never be reached by the first and last cards.
- When the open card closes, the list gets shorter and the browser scrolls on its own. That scroll
  is ignored, or it moved the mark straight back to the first card.
- The URL keeps naming the active card, and ends in `/closed` when no card is open, so a reload
  restores both the card and whether it was open (`session.focus.closed` in
  [routeTable.js](src/controllers/routes/routeTable.js)).
- The deck scrolls to the active card when no card is open, which is what a switch back to a client
  returns to.
- The mark is an outline and a 4px left edge, from `outline` and `::before`: neither takes layout
  room, so the stack does not move when the mark moves.

**Not changed:** the rest timer. It already starts on a tap and keeps its way back to the card that
started it.

**Follow-up the same day (Simon):** *"je možno premikati aktivno kartico samo s scrollom tudi, na
kratkih seznamih brez page reload-a?"* — then *"1+2 prosim"*. A short list could not scroll, so only a
tap moved the active card there. Now the deck measures the room it is missing and adds it at its end,
and the scroll works like the wheel of a time picker: how far the list has scrolled decides the card,
and the active card rests where the first card rests. While the clipboard is open, the page and the
clipboard's scrolling area have `overscroll-behavior-y: contain`, so a pull down does not reload the
page on a phone. The cost, said before it was built: closed cards stand about 30px apart on a phone,
so a short pull moves the active card by one.

## 49. [x] A theme is a stylesheet, and the Red theme becomes Spreadsheet — shipped 2026-09-13

Simon sent a screenshot of the spreadsheet a trainer runs her sessions from — a white sheet, thin
grid lines, a header row, grey rows for each round — and asked for a theme modelled on it, in place
of Red, with cell colours that appeal to as many people as possible and do not recall the orange
sandbox marks. Asked what a palette alone could do, he ruled: *"vsaka tema rabi svoj lastni CSS
override, ne samo barvne sheme — po principu lokalnosti in single responsibility layout ne sme biti
pisan v kodi"*. The decision is recorded in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#themes-and-styling).

### 49.1 [x] No style written in code — shipped 2026-09-13

Ruled 2026-09-13 (Simon) as the ground for §49.2: a theme is a whole stylesheet, and layout is not
written in code. A declaration on the element beats every stylesheet, so a theme could not reach it.

**Measured before:** 126 declarations in 16 JavaScript files — `planAdjustments.js` 36,
`sessionCard.js` 18, `activeUsersList.js` 17, `feedbackModal.js` 15, the rest six or fewer. Another
25 were already custom properties and stay.

**What moved, and how.** Each declaration went to its module's stylesheet as a class. Code that
switched a look (`isActive ? … : …`, `display = cond ? "flex" : "none"`) now toggles a state class or
`.hidden`. The overlay's slide-down is two classes with the same reflow between them. Values only the
code knows became custom properties: the walkthrough panel's measured height
(`--walkthrough-panel-max-height`) and an exercise's signal colour (`--signal-color`). An inline style
used to beat every rule, so where an existing rule on the same element set the same property, the new
selector is chained (`.badge.session-card-time-badge`, `.modal-actions.adjust-modal-actions`, …).

**Visible on purpose:** the literal `#ef4444` — midnight's `--danger` — became `var(--danger)`, so
warning pills, injury marks and the recording icon follow the theme. Two reads of `--text-color`, a
property nothing defines, now name `--text-main`, which they were already inheriting.
**Visible by accident, and accepted:** a session card's hover lift moved from JavaScript listeners to
`.session-card:hover`, where a completed or live card's own background now wins over the hover tint.

**Held by** [agent_tools/inline_styles.py](agent_tools/inline_styles.py) in Stage 1 and CI, a plain
gate rather than a ratchet, since the count reached zero in the same change.

The conversion ran on four cheaper subagents, one set of files each; the six sites in
`clientsView.js` were missed when the files were split and were moved by hand.

### 49.2 [x] The Spreadsheet theme replaces Red — shipped 2026-09-13

**The colour.** The sheet's own amber header and yellow highlights were dropped first: they recall
the sandbox's orange marks. Blue came next, as the colour named first worldwide — YouGov, ten
countries on four continents, 23 % to 33 % — but it leans male: 40 % of men against 24 % of women in
the US ([YouGov](https://yougov.com/en-gb/articles/12331-blue-worlds-favourite-colour)). Simon chose
**petrol** (`#0e7490`), between blue and green, the first two choices worldwide. It is 32° from
Daylight's emerald on the colour wheel. Every contrast was measured: white on petrol 5.36:1, muted
text 7.66:1 on a cell and 6.83:1 on the field.

**The grid.** Tokens set the colours and 2px corners; rules under them draw the table. The clipboard's
deck is rows sharing one line instead of a tilted stack, and the card in focus is the selected cell,
tinted with a 2px edge, in its own row. A circuit's round count is the grey row. The day's sessions
are rows too, pills are cells, and side-by-side plan columns share their borders. **Cost:** a
collapsed deck card shows its whole row, 8px more per card than the stacked deck.

**Found by looking, not by a test.** The overdue bar puts dark text (`#3d2600`) on `--warning`, and
this palette's `--warning` is dark enough to be read as text on white. The theme draws that bar as a
pale yellow cell instead (11.22:1).

**Two decisions a theme has to respect.** Theme stylesheets now load after every module stylesheet,
as the last `<link>` tags, with the sandbox marks after them. And a theme must not restyle the app
header: at equal specificity it would win over the sandbox's orange header.

**Held by** [test_theme_selectors.py](tests/unit/test_theme_selectors.py): every class a theme
restyles must still exist, since a renamed component would otherwise drop out of one theme without a
sound. A saved `red` choice and an old `?theme=red` link open the new theme
([test_theme.py](tests/medium/test_theme.py)).

## 51. [x] A tap the demo step did not ask for interrupts the guide — fixed 2026-09-13

**Reported 2026-09-13 (Simon):** *"klik na meni ne odstrani highlightov od walkthrough-a,
nepričakovani klik naj prekine walkthrough in kartica ponudi vrnitev"* — a tap on the menu leaves
the walkthrough's highlight on screen; an unexpected tap should interrupt the walkthrough, and the
card should offer the way back.

**Why it happened.** The guide already had a "you have wandered off" card (§38.5), but it appeared
only when the step's control was gone from the screen for three polls. The ☰ menu drops down while
the step's session card is still there, so the ring stayed lit over the menu.

**What changed** ([walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)):

- A real tap on a control (button, link, field, menu item) that is not the step's own control and
  not on the guide's panel is recorded. Taps on empty space do not count.
- The next poll judges it. If the step is not done by then, the guide is interrupted: the ring
  goes away and the card shows *Back to the demo* / *Stop the demo*. A tap that does the step by
  another route is a step done, so the guide moves on instead.
- The guide's own taps (*Show me*, the rebuild) use `click()`, which is never `isTrusted`, so they
  never interrupt.
- *Back to the demo* first closes the menu or window the tap opened, through its own control, and
  then rebuilds the step as before.

**An earlier ruling changed with it.** On 2026-08-26 the case "open the menu by hand, then tap
*Show me*" was answered by *Show me* closing the menu. The menu tap now interrupts the guide, so
*Show me* is not offered there; *Back to the demo* closes the menu and *Show me* returns.
[test_walkthrough_modal.py](tests/medium/test_walkthrough_modal.py) walks that path now. Closing the
clipboard mid-step is also a stray tap, so the console-diagnosis test in
[test_walkthrough.py](tests/e2e/test_walkthrough.py) returns through the card instead of Back and
Next — it had passed only because the guide took three polls to notice.

**Words unchanged, possibly worth revisiting:** the card still says *"You have left the demo's place
in the app"*, which is loose after a menu tap on the same screen. Left for §38.21 (the demo's card
text, waiting on the maintainer).

Tested by `test_a_tap_the_step_did_not_ask_for_interrupts_the_demo` in
[test_walkthrough.py](tests/e2e/test_walkthrough.py).

## 52. [x] The Spreadsheet theme looks like a sheet, and a plan can be pulled aside — shipped 2026-09-14

Simon, after §49.2 shipped: *"izgled je še vedno preveč podoben ostalim temam, pričakujem mrežo in
razporeditev bolj podobno zaslonski sliki (z merge celicami za naslov in podobno)"*. Shown two
layouts, he ruled: no column letters and no row numbers; a thick border round each block of the
plan (a circuit, or an exercise outside one); history and future as columns scrolled left and
right. Then: *"poenostaviva, pusti levo-desno scroll za prihodnost in najprej implementiraj samo
izgled"*.

### 52.1 [x] The look — shipped 2026-09-13

Reported by Simon after §49.2 shipped: the Spreadsheet theme still looked too much like the other
themes. The first version only made cards flat and square. He asked for a grid with merged cells,
like his screenshot. He then ruled out column letters and row numbers, asked for a thick border round
each block, and deferred the history columns (§52.2).

**What changed, all in [spreadsheet.css](src/modules/themes/spreadsheet.css):**

- **Blocks.** A circuit is one block, and so is an exercise or a rest outside a circuit. Each has a
  2px border in `--text-muted`, and neighbouring blocks overlap by 2px so they share one line. A past
  card keeps the thin grid line, because it is one movement pulled out of an old session, not a
  block.
- **Merged cells.** A circuit's name and round count are one grey cell across the block. Negative
  margins cancel the card's padding so the fill meets the border. The movements under it are rows
  divided by the thin grid line. The clipboard's title bar is the merged title cell at the top of
  the sheet.
- **Sheet tabs.** Client tabs are flat cells, and the client shown is underlined in petrol. The
  component painted the active tab's initials white for its solid tab. On a white tab they vanished,
  which the first screenshot showed, so the theme gives them a petrol disc (5.36:1).

**Kept:** §48.1's active-card outline and left edge.

**Changed 2026-09-14.** Simon: *"debela obroba sklopov je premočna, se izgubi poudarek na aktivni
kartici"*. The 2px dark block border became a 4px empty strip between blocks, the way his sheet
leaves an empty row between sections, and every other line on the clipboard is thin, the title bar's
included. The active card's outline went from 1px to 2px, so it is the one heavy edge on the screen.
4px was chosen after comparing 3px and 6px on a 390px phone. A circuit is set apart at 3px already,
by its grey name row, but an exercise outside a circuit has no such row.

**Not possible in a theme alone:** columns for sets, reps and load. The exercise card writes its
target as ONE string (`compactTarget` in exerciseCard.js). It was not needed once Simon chose
sessions, not values, as the columns.

### 52.2 [x] Pull the current plan aside to see the previous one — shipped 2026-09-14

**What Simon described, 2026-09-14.** A way to compare a client's current plan with the previous one,
as his sheet does with two columns side by side:

> *"umikanje trenutnega načrta razkrije starega, ko prst drsanje spusti trenutni načrt skoči nazaj
> na svoje mesto (in zakrije preteklega). Torej dokler prst drži 'odejo' sta vidna oba načrta."*

- The current plan lies over the previous one. A drag from left to right moves the current plan
  aside, and the previous plan shows underneath.
- While the finger holds, both plans are visible. On release, the current plan springs back and
  covers the previous one.
- **Not** a comparison inside one row: exercises are not repeated from plan to plan, so there is
  nothing to match a row against.
- The whole current plan is visible at once, and the reveal shows every row of the previous plan.

This replaces the sideways columns of history and future that were first proposed here on
2026-09-13.

**Measured in the code on 2026-09-13.** The deck draws only the LAST past session (`pastExList` in
[exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js)), and
`buildPastExerciseItems` flattens it without its circuits. Nothing uses a sideways drag yet; the only
gesture is the swipe down that closes the clipboard.
[deckScrollFocus.js](src/modules/clipboard/deckScrollFocus.js) picks the active card from vertical
scrolling, so a sideways drag must not count as a scroll.

**Ruled 2026-09-14 (Simon), while trying a prototype:**
- **The previous plan always shows what was PLANNED.** No ticks. An icon marks a signal recorded
  against a row, in the active card's own glyphs (exerciseCard.js): `fa-feather` for too easy,
  `fa-weight-hanging` for too hard, `fa-note-sticky` for a note. Corrected the same day: the first
  record here read Simon's "pero, utež" as a pen for a note and a weight for a logged load.
- **The session's title bar and client tabs are part of the plan** that moves aside, and the plan
  underneath shows its own.
- **Press and hold shrinks the plan by itself**, before any movement, so the trainer can see it can
  be pulled. A short tap does nothing, so tapping a card is not disturbed. It narrows too, so the
  edge of the previous session shows on the left and of the next one on the right. Simon asked for
  more than the first 22px a side; at 60px on a 390px phone the plan is 256px wide, no exercise name
  of the demo plan is cut, and the neighbours show the start of their names and their loads.
- **Exercise names carry the session's time**: a past session's names in `--temporal-past`, a
  future session's in `--temporal-future`, under the blanket and when that session is opened.
- **Signal icons are coloured**, in the active card's colours but darker: the app's `#10b981` and
  `#f59e0b` measure 2.27:1 and 1.96:1 on the sheet's white, under the 3:1 an icon needs. The
  prototype uses `#1e7e34` (4.38:1), `#b45309` (4.25:1) and `#c5221f` (4.75:1). "Too hard" keeps
  `fa-weight-hanging`: Simon saw eleven other glyphs on the prototype and kept it.
- **The main colour stays `#0e7490`.** Simon compared it on the prototype with two greener
  candidates and chose it.

**Approved 2026-09-14 with the prototype as a whole** (*"všeč mi je! greva v implementacijo"*):
- **Rows shrink while the plan is held or pulled aside**, animated, so more of both plans fits; they
  grow back on release. The row under the finger stays where it is while the rows shrink.
- **Sessions as a sideways deck.** A pull past a marked threshold ("Release to open") opens the
  neighbouring session's clipboard; a **Today** button leads back. A pull from right to left shows
  the next plan, or, when the client has none, a card offering to create one.
- **The sessions are the ACTIVE CLIENT'S** (Simon, the same day): back and forward move through this
  client's previous and next plans, not through all sessions in time order.
- **Why the live deck keeps its row height:** every collapsed card is a tap target, and a 22px row is
  too small for one thumb. Rows that are not tapped (the plan under the blanket) can be dense.

**Chosen by the implementing session, not ruled** (say so if one is wrong):
- **The back gesture:** a drag that starts within 24px of either screen edge is ignored, as in the
  prototype. It still needs trying on a real phone.
- **A plan longer than the screen:** the plan underneath shows from its top. First chosen as "both
  scroll together", changed at step 3: in the app the deck is its own scroller, and since exercises
  do not correspond between plans, aligning the two scroll positions says nothing.
- **Every theme gets the drag.** It is behaviour, and a theme only styles; colours come from each
  theme's `--temporal-past` / `--temporal-future`.

**Chosen at step 3, not ruled:**
- **Held cards get denser by their own padding.** A deeper stack overlap was tried first and dropped
  in review: it hid the row a collapsed card needs read (§28.4) and did nothing in the Spreadsheet
  theme, which sets its own overlap.
- **Holding or pulling the plan never changes the active card.** The rows reflow under the finger and
  the browser scrolls on its own; on a phone the same press's touchmove would make §48.1 read that
  as the trainer scrolling. Found in review, not by the first tests, which drive a mouse.
- **The under-layer header repeats the neighbour's title, ISO date and client name** as plain text,
  not the real title-bar/tabs components — nothing there is tapped, and mounting the real components
  twice would wire two copies of every listener they carry.

**Chosen at step 4, not ruled:**
- **A started session is never left by a pull.** The pull still uncovers the other plan, but shows
  no "Release to open" and opens nothing. Opening another session replaces the one clipboard slot,
  and a running session's logs would go with it. The same holds for the create-a-plan card.
- **Today is worked out, not remembered.** It leads to the client's session on today's date (a
  finished day: its history record), found by `clientSessionToday` from the same history and
  schedule as the neighbours. So it also shows when a past record was opened from the History view
  and the client trains today. It shows only when the clipboard is showing a different session.
- **Today sits on the title bar as a calendar glyph with the word**, left of Start. It costs the
  title 106px while it shows.
- **"Create a plan" opens the client's planning form**, the one the client card's "Plan Program"
  button opens, at the `session.new` address. Nothing new was built for it.
- **A pull on a phone needed `touch-action: pan-y` on the clipboard body as well.** Found at step 4
  with emulated touch: touch-action stops at the nearest scroll container, so a finger on a card
  never moved the plan at all. Pinned by `tests/e2e/test_plan_peek_open.py`. `pinch-zoom` was added
  beside it in review: `pan-y` alone switches off two-finger zoom on the whole clipboard.

**Seen at step 4, not changed:** see §55.

**Steps, one commit and one gate each:** 1) the client's previous and next plan, as a pure domain
function (`clientSessionNeighbours.js`, shipped 2026-09-14); 2) the plan drawn under the blanket
(`planSheet.js`, with the live card's target wording moved to one shared helper, shipped 2026-09-14); 3) the drag, with title bar and tabs moving with the
plan (`planPeek.js` + `planPeekController.js`, shipped 2026-09-14); 4) opening a neighbour, Today, and the create-a-plan card (shipped 2026-09-14).

### 82.1 [x] The link check stops scanning TODO.md and its archive — done 2026-09-26

`agent_tools/doclinks.py` skips TODO.md and TODO_ARCHIVE.md as sources and still resolves them as
targets, so a reference into them from another file must still name a live section. The rule that a
bare § inside the backlog means the backlog was removed with it. `find_unresolved()` is the one loop
the tool and the repository test both run. Commit 964539d; `build check` green, 10:54 to 11:03.

### 80.2 [x] P2 — Pogoji uporabe prekrijejo izbiro jezika ob prvem obisku — popravljeno 2026-09-26

**Scenarij in koraki:** slovenski trener prvič odpre objavljeno aplikacijo v praznem
profilu Chrome. Pred izbiro jezika ga pričaka modal »Terms & Disclaimer« z edinim
vidnim gumbom »I agree«. Želi najprej izbrati slovenščino in razumeti pogoje.

**Opaženo:** izbira »Slovenščina« je za modalom; preverba elementa pod središčem
gumba vrne dialog s pogoji. Posnetek zaslona potrjuje, da je preostanek zaslona
zatemnjen in zamegljen. Po »I agree« izbira jezika postane dosegljiva.

**Težava in vpliv:** trener mora sprejeti angleško besedilo, preden lahko izbere jezik.
Blokira razumljivo prvo uporabo v slovenščini; to ni presoja pravne veljavnosti pogojev.

**Predlog in preverjanje:** najprej omogočiti izbiro jezika, nato prikazati pogoje v
izbranem jeziku. V praznem profilu mora biti mogoče izbrati slovenščino brez predhodne
potrditve angleških pogojev. Preverjeno na objavljeni različici `0625bd6`.

**Verdikt 2026-09-26 (Claude): potrjeno na `main`, in koda si sama nasprotuje. Popravek je v
§81.1.** `setupFirstRunTerms()` v
[applicationHeader.js](src/modules/common/applicationHeader.js) se izvede med sestavljanjem
glave in pokliče `dlg.showModal()`. Modalni `<dialog>` gre v vrhnjo plast brskalnika, torej nad
`#app-splash-language`, in nobena vrednost `z-index` tega ne spremeni. Dva zaslona sta oba
obvezna in oba brez izhoda, modal pa je drugi na vrsti in vseeno zmaga.

Nasprotje je zapisano v kodi: komentar v [index.html](src/index.html) pravi, da je jezikovna
izbira »Shown ahead of everything else and with no way out«, komentar v
[splashScreen.js](src/modules/splash/splashScreen.js) pa, da ta korak izhoda nikoli ni imel in
da ga tudi `?splash=off` ne sme preskočiti — »the app would come up in a language nobody
picked«. Natanko to se zgodi.

Besedilo pogojev se prevede samo po sebi, brž ko je jezik izbran prej: `#terms-title`,
`#terms-body` in `#btn-terms-agree` so že v tabeli v
[domMappings.js](src/i18n/domMappings.js).

**Popravljeno 2026-09-26 (Claude), commit `f847eb4` (§81.1):** pogoji se ne odprejo več sami ob sestavljanju glave; pozdravni zaslon jih zahteva kot drugi korak, za jezikom, zato so že prevedeni. Pripeto v `tests/e2e/test_first_run_terms.py`.

### 81.1 [x] Language, theme and the trainer's details are mandatory on the welcome screen — done 2026-09-26

- **Order:** language, then the terms agreement, then theme, then details, then — on an empty
  database — the demo, the chapters and *Start with an empty app*. A first launch from a demo link
  (`?init=`, `?demo=`) goes through the same steps before the demo starts.
- **Fixes §80.2 here:** today `setupFirstRunTerms()` (applicationHeader.js) opens the terms dialog
  as a modal during header wiring, so it covers the language step, and a trainer must accept English
  terms before *Slovenščina* can be tapped. The terms become the step after the language, and come
  out translated, since `domMappings.js` already maps their three elements.
- **Fixes the splash half of §80.4 here:** the splash's language choice (`onChooseLanguage` in
  app.js) translates the static labels but re-draws none of the views built in code, so "Dates",
  "Client", "Location" stay English under a Slovenian choice. One language-change function, called
  by the splash and by the ☰ switcher, holds the one list of views to re-draw.
- **One set of details for both workspaces.** `trainerIdentity.js` keeps them under fixed
  `localStorage` keys, outside the sandbox's and the working database's own storage, so what is
  written on the first launch is what the sandbox and the trainer's own work both show.
- **Theme:** one button per theme, named in the chosen language. A tap shows that theme at once;
  *Continue* works after a tap. A share link naming a theme (`?theme=`) answers this step, as `?lang=`
  already answers the language step.
- **Theme choice cannot be read from storage today.** `setupThemeSwitcher` (theme.js) writes
  `librept-theme` on every boot, so the key exists whether or not anybody chose. Boot must stop
  writing it; only a choice writes it.
- **First and last name, separately.** `trainerIdentity.js` stores one `name` today. Invitations keep
  carrying the full name, first then last. An install that stored one name is asked to split it.
- **BUG found while reading, fixed here: sending an invitation deletes the trainer's name.**
  `rememberOrganizer` (sessionInviteDialog.js) calls `writeTrainerIdentity` with email and phone
  only, and that function clears every key it is not given. A key the caller does not pass must stay
  as it is; only an empty string clears.
- **Checked at the field:** email by `looksLikeEmail`, phone by `domain/contactChannel.js`.
- **The X is gone while anything is missing**, and the step appears whenever something is missing,
  not only on an empty database — so an install in use without a phone is asked once.
- **Cost:** this ends the "no signup" promise that the comments in `trainerDetailsDialog.js` and the
  form's own lede make. Both are rewritten.
- **Tests:** `tests/conftest.py` writes the theme and the details before the page loads, as it
  already does for the accepted terms.

**Done 2026-09-26 (Claude), commit `f847eb4`; `build check` green 11:46–11:56.** Built as planned, with one finding: the splash had been started from `setupActiveSession`, ahead of the header, so a `?lang=` link reached the terms step before the dialog existed. It now starts once every component is wired and before the first draw — after the draw, a legacy database whose session card throws (§84) kept the trainer behind the splash.

### 81.2 [x] The menu in five entries — done 2026-09-27

Where each row of today's menu goes. The last row is not in the request; the choice is Claude's.

| Today                                                       | Goes to                                       |
|-------------------------------------------------------------|-----------------------------------------------|
| Language, Theme, My details, App version                    | Settings                                      |
| Enter the sandbox / Leave the sandbox                       | Settings; Leave also top-level in the sandbox |
| Reset sandbox data                                          | Settings, only in the sandbox                 |
| Clients Directory                                           | Client directory                              |
| Add a client from their own details                         | Client directory, a button in the view        |
| Routines, Exercises, Import a programme                     | Exercises and routines                        |
| Connect cloud storage, Export data as a file                | Data management (both opened the same dialog) |
| Open an encrypted file                                      | Data management                               |
| Pending Review                                              | removed, see §81.3                            |
| History                                                     | removed; the client's page keeps its history  |
| GitHub, Send feedback, Bug Reporting, About, Terms, Privacy | Settings, a section *Help and legal*          |

**The demo story points at four of these rows** (`#menu-clients-register`, `#menu-sandbox`,
`#menu-sandbox-reset`, `#menu-trainer-details`), and its step texts name them. They move with the
rows, and the texts name the new path — *Settings*, then the row.

**Fixes the menu half of §80.4 here:** *Add a client from their own details* and *Open an encrypted
file* have no translation key (neither `data-i18n` nor an entry in `domMappings.js`), so they stay
English in every language. Both get a key in en, sl and de in their new place.

**Done 2026-09-27 (Claude), commit `c3a057e`; `build check` green 03:47–03:56.** Parked in a stash on 2026-09-26 when Simon stopped every session, restored and finished the next day. Found on the way: the library's third header button and the routines' import button did not fit a phone in German, so both secondary actions sit in a row under the title; entering or leaving the sandbox from Settings remembered `/settings` as the view to return to, so Settings now goes Back first; the demo's theme step counted `<html>` as unreachable behind the Settings modal; `gear` and `database` were not in the icon subset, which was regenerated.

### 81.3 [x] Pending review only in the notification area — done 2026-09-27

The feed already carries it: `buildPendingSessionsItem` in `domain/notificationItems.js` counts the
same unresolved `planUpdates` the menu badge counts, and links to `/adjustments`. What is left: remove
the menu row and its badge (`app.js` updates the badge), and keep the route as the message's target.

**Done 2026-09-27 (Claude), in commit `c3a057e` with §81.2:** the menu row and its badge are gone; `tests/e2e/test_view_split_navigation.py` reaches the view from the message and checks that its counts add up to the unresolved updates.

### 81.7 [x] Remove the global History view — done 2026-09-27

Simon ruled that a client's history is shown only on that client's page. The ☰ row is gone (§81.2);
what is left is the view itself — `/history`, `historyView.js` and `renderGlobalHistory` — and the
tests and the overflow walk entry that name it.

**Done 2026-09-27 (Claude), commit `c7ab3a2`; `build check` green 04:02–04:12.** Finishing a session opened this view, so it now returns to the sessions list (chosen over a client's page, which a group session would have to pick one of). Planning drafts, which only this view listed, stay reachable through the notification area's resume message.

### 81.4 [x] Import and export of exercises, routines and circuits in one place — done 2026-09-27

- Exercises and circuits: import is built (§45.5, in the exercise library view); the export
  (`catalogToInterchange`, `catalogToCsv`) sits in the Sync & Backup dialog and moves beside the
  import.
- **Routines have no import and no export.** New work: carried in the same file as the library, so
  one file moves a trainer's whole library.

**Done 2026-09-27 (Claude), commit `8f0f808`; `build check` green 04:18–04:30.** The export moved to the library screen beside Import; the JSON carries routines, which Import reads back. A routine carries no source, because schema 5 gives it no such field.

### 45.12 [CLOSED 2026-09-27] Published slots a client picks from an INVITATION, moved to PRO

**Wanted (Simon, 2026-09-11).** A training session with published times, where the client chooses one
themselves, having been invited.

**Adjacent to, but not the same as, what exists.** `use_cases/uc3_publish_slots.md` and
`use_cases/uc4_client_self_subscription.md` both stand on Google Calendar's appointment schedules —
deliberately, to avoid hosting anything. This one starts from an invitation the trainer sends and has
to work for a trainer with no Google account, which is the difference that makes it a separate use
case rather than a variation.

Where it connects: §26's self-onboarding already sends a client a link and gets a file back, and the
RSVP page ([rsvpView.js](src/modules/rsvp/rsvpView.js)) is already an answer coming back from a
client. The open question is whether choosing a slot is another answer of the same kind.

**Closed 2026-09-27 (Simon): it is a paid feature, wanted there.** Every Google Calendar integration
moved to PRO the same day, and a menu of times the client picks from moved with it — including this
shape, which needs no Google account. The reason it survives at all is that a seat count several
strangers change at once needs a place where state lives outside one phone, and that place is the
paid tier's, not this app's. It continues in the private `~/Projects/EnterprisePT` project, `TODO.md`
§11 and §19. What stays here is §45.13: the trainer names the time and sends the client an `.ics`.

### 82.2 [x] Remove every reference into TODO.md, then make one fail the build — done 2026-09-27

One directory per commit, after §81, which rewrites many of the same files in `src/`. A reference
that only tags a comment (`(TODO §45.2)`) is deleted. A reference that carries the reason ("see TODO
§29 for why") is replaced by the reason, written where it is needed. The check that fails the build
on a reference into TODO.md lands in the commit that removes the last one; before that it would fail
every run.

**Done 2026-09-27 (Claude), commits `14995f0` (src), `3ba641d` (tests), `8da80f0` (documents), `96afe34` (tools and the check); `build check` ran once on the whole tree, green 05:13–05:22.** Done by subagents, one per directory, reading each section before rewriting a sentence that needed it. Several pointers named the wrong section and were corrected rather than carried over; one was on screen — the erasure checklist told the trainer "(TODO §1.5)". `agent_tools/todo_refs.py` now fails the build on a new one. Found on the way: §85, the landing page shows a developer comment.

## 84. [x] A session with no participants stops the boot — test data, not a defect — closed 2026-09-27

**Found 2026-09-26 (Claude) while building §81.1**, by
`tests/e2e/test_schema_migrations.py::test_a_stored_legacy_database_is_migrated_on_boot`.

A database from before the `bookings` → `sessions` rename carries sessions with no `participants`.
`renderSessionCard` (`src/modules/sessionList/sessionCard.js`) calls `b.participants.map(...)` and
throws. The throw is inside `renderEverything()`, the first draw in `init()` (app.js), so everything
after it never runs: the recovery of a running session, the Back-button handler, the sync badge, the
demo. The test passed only because the splash used to start earlier in `init()`; §81.1 now starts it
before the first draw for the same reason, so the trainer is no longer kept behind the splash.

**What is left:** the migration (or the card) must give a session with no participants an empty
list, and a test must pin that the boot reaches its end on that database. Not built in §81.1: it is
a separate defect with its own test.

**Corrected and closed 2026-09-27 (Claude), commit `3eb6a00`.** The claim above that an old database carries sessions with no participants was written without checking, and it is wrong: `bookings` were renamed to `sessions` with the same shape, the seed was `bookings = [...SESSIONS]`, and the schema requires `participants`. The only such row was the test's own fixture. It now has the shape the rename carried, and the boot runs to its end. No product change; the splash starts before the first draw regardless (§81.1).

## 85. [x] BUG — the rendered landing page showed a developer comment as text — fixed 2026-09-27

**Found 2026-09-27 (Claude) during §82.2.** `docs/LANDING.md` holds an HTML comment explaining why
its three demo links are absolute. `agent_tools/render_docs.py` escapes it instead of dropping it, so
`src/landing.html` shows it to every visitor as a paragraph starting `<!-- The three demo links…`.

**What is left:** the renderer drops HTML comments (or the note moves out of the page), and the
render check pins that no rendered page contains `&lt;!--`. Every page render_docs writes has the
same exposure, not only this one.

**Fixed 2026-09-27 (Claude), commit `7c6ccc7`.** `render_docs.strip_comments` drops every HTML comment outside a code block before rendering; `tests/unit/test_render_docs.py` pins that and that no rendered page shows `&lt;!--`.

### 80.13 [x] P2 — Opozorilo o poškodbi stranke je samo v opisu ob dotiku miške, in v angleščini — popravljeno 2026-09-27

**Scenarij in koraki:** trener v peskovniku pritisne kartico skupinskega treninga
»Skupinska moč in kondicija« (08:00–10:00). Odpre se podloga z zavihki udeleženk in
udeležencev; pri imenih »Jane« in »John« stoji oranžen trikotnik z klicajem.

**Opaženo:** kaj trikotnik pomeni, ne piše nikjer na zaslonu. Edino besedilo je atribut
`title`, ki se pokaže samo ob dotiku miške, in se glasi »Has recorded injury: Rahla napetost
v levi rami pri dvigih nad glavo« — angleška uvodna beseda pred slovenskim zapisom.

**Težava in vpliv:** na telefonu dotika miške ni, torej je na telovadnici opis poškodbe
nedosegljiv. Trener vidi znak za nevarnost in ne more prebrati, katera poškodba je to, prav
ko izbira obremenitev. Angleški uvod je poleg tega v slovenski aplikaciji.

**Vzrok, potrjen v kodi na `main`:** [utils.js](src/modules/common/utils.js), funkcija, ki
sestavi ime z znakom poškodbe, vpisuje niz »Has recorded injury: « dobesedno. Isti razred
napake sta še dva kraja: gumb za nov trening v
[sessionsView.js](src/modules/sessionList/sessionsView.js) nosi `aria-label` in `title`
»Create Session«, pika neprebranega obvestila v
[notificationArea.js](src/modules/common/notificationArea.js) pa `title="Unread"` — oboje
angleško v slovenskem in nemškem vmesniku.

**Predlog in preverjanje:** opis poškodbe mora biti dosegljiv s pritiskom, ne z dotikom miške
— na primer znak odpre kratko sporočilo z zapisom. Vsak `title` in `aria-label` naj gre prek
`t(...)`; ključe dodati v `en`, `sl` in `de`. Preveriti s preizkusom, ki v slovenskem vmesniku
prebere vsak `title` in `aria-label` na zaslonu podloge in zahteva, da noben ni angleški niz
iz kode. Opaženo na objavljeni različici `0625bd6`; vsi trije kraji na `main` so isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `455a399`.** The injury mark and the unread dot carry a translated name instead of an English hover title; the Create Session button lost the English aria-label that hid its text.

### 80.14 [x] P3 — V slovenskem vzorčnem treningu je stolpec z navodilom vaje angleški — popravljeno 2026-09-27

**Scenarij in koraki:** trener odpre peskovnik v slovenščini in v podlogi skupinskega
treninga bere, kaj naj kdo naredi.

**Opaženo:** naslovi krogov so slovenski (»Dinamično ogrevanje«, »Metabolni krog v trojkah«),
navodilo pri vsaki vaji pa angleško: »10 reps (light)«, »10 per arm«, »Max«, »45 seconds«,
»30s hold«, »20 per side«. V vzorčnih programih je deset različnih takih zapisov in nobenega
ni v prevajalni tabeli. Angleščina tudi ni enotna: hkrati »45s« in »45 seconds«, »30s hold«
in »60s hold«.

**Težava in vpliv:** to je prav tisti stolpec, ki ga trener bere med serijo. Vzorčni podatki
so prvo, kar slovenski trener vidi, in zgledajo kot na pol preveden izdelek. Ni P2, ker
trener svoje programe piše sam in ga to pri njegovem delu ne ustavi.

**Vzrok, potrjen v kodi na `main`:** [demoText.js](src/data/demoText.js) prevaja besedila
vzorčnih podatkov in v uvodni opombi našteje, kaj ostane angleško namenoma — imena vaj, imena
ljudi, ime telovadnice. Navodila vaj v tem seznamu ni, v tabeli `sl` pa jih ni; polje `reps` v
[routines.js](src/data/routines.js) je prosto besedilo, ki se izriše, kakor je zapisano.

**Predlog in preverjanje:** deset zapisov dodati v `sl` in `de`, hkrati poenotiti angleško
obliko. Preizkus naj vzorčne programe naloži v slovenščini in zahteva, da noben zapis
`reps` ni angleški niz iz `routines.js`. Opaženo na objavljeni različici `0625bd6`; tabela na
`main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `dd312f3`.** The ten reps phrases of the sample routines have Slovenian and German forms; the demo text test walks each routine entry's reps and circuit title.

### 80.15 [x] P3 — Oznaka v glavi piše »PREVIEW« in »DEMO«, čeprav prevod obstaja — popravljeno 2026-09-27

**Scenarij in koraki:** trener v slovenskem vmesniku zapre peskovnik prek menija ☰ z
»Zapusti peskovnik« in pogleda oznako levo od številke različice.

**Opaženo:** oznaka se glasi »PREVIEW«. V peskovniku je pisala »PESKOVNIK«, torej je prevod
tam upoštevan, tu pa ne. Z naloženimi vzorčnimi podatki piše »DEMO«.

**Težava in vpliv:** dve angleški besedi v glavi slovenske aplikacije, in prav ob mestu, ki
naj bi povedalo, da to še ni končni izdelek. Slovenski trener »PREVIEW« ne prebere nujno kot
»predogled«.

**Vzrok, potrjen v kodi na `main`:** [applicationHeader.js](src/modules/common/applicationHeader.js)
vpiše oznako z `textContent`: za peskovnik prek `t("sandbox_badge")`, za drugi dve stanji pa
dobesedno »DEMO« in »PREVIEW«. Ključ `preview_badge` je preveden v `en`, `sl` in `de` in je v
[domMappings.js](src/i18n/domMappings.js) pripet na `#preview-badge-label`, tako da prevod
nastane in ga ta vrstica takoj prepiše; za »DEMO« ključa ni nikjer.

**Predlog in preverjanje:** obe stanji peljati prek `t(...)`, dodati ključ za »DEMO« v vse tri
jezike in v preizkusu glave zahtevati, da oznaka v slovenščini ni angleška beseda. Opaženo na
objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `651900e`.** The badge label and description have one writer that reads the dictionary; the static pass no longer writes `preview_badge` over it.

### 80.17 [x] P3 — Slovenska števila: »3 strank«, »3 stranka(-e/-k) ima« — popravljeno 2026-09-27

**Scenarij in koraki:** trener odpre peskovnik, pogleda vrstico odprtega treninga nad dnom
zaslona in nato predal obvestil.

**Opaženo:** vrstica pravi »3 strank«, obvestilo pa »3 stranka(-e/-k) ima nerešene povratne
signale iz treninga.« Pravilno slovensko je »3 stranke« in »3 stranke imajo«. Enako je pri
programih: »{count} program(-i/-ov) je zasnovanih«.

**Težava in vpliv:** aplikacija zveni kot strojni prevod prav v napisih, ki jih trener vidi
najpogosteje. Angleščina in nemščina te napake nimata, ker imata eno množinsko obliko.

**Vzrok, potrjen v kodi na `main`:** [sl.js](src/i18n/sl.js) ima `bar_clients_label: "strank"`
— ena sama oblika za vsa števila — ter dva zapisa z oklepajem, `notif_pending_sessions_desc` in
`notif_unscheduled_plans_desc`. Oblike z oklepajem, ki povedo spol bralca (»Dobrodošel(-la)«),
so nekaj drugega in ostanejo: tam aplikacija spola ne ve, števila pa vedno ve.
Pripomočka za množino v `src/` ni; opomba v
[exercisePicker.js](src/modules/exercises/exercisePicker.js) že pravi, da ima slovenščina štiri
oblike, in se jim je ta napis izognil z drugačno ubeseditvijo.

**Predlog in preverjanje:** dodati pripomoček na `Intl.PluralRules` (»one«, »two«, »few«,
»other«) in mu dati te tri napise; jezik, ki ima eno obliko, zapiše eno. Preizkus naj za 1, 2,
3 in 5 zahteva pravilno slovensko obliko in ujemanje glagola. Opaženo na objavljeni različici
`0625bd6`; zapisi na `main` so isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `5e7874c`.** `src/i18n/plural.js` picks the _one/_two/_few/_other form with Intl.PluralRules; used for the session bar, both notification counts and the name-collision hint.

### 80.20 [x] P3 — Prazen imenik strank govori o neuspelem iskanju in veli »Klikni« — popravljeno 2026-09-27

**Scenarij in koraki:** trener v prazni aplikaciji odpre meni ☰ in »Seznam strank (klientov)«.

**Opaženo:** na zaslonu piše »Strank ni mogoče najti. Klikni "Dodaj stranko", da jo ustvariš.«
Trener ni ničesar iskal; imenik je prazen, ker je aplikacija nova.

**Težava in vpliv:** napis zveni kot sporočilo o napaki tam, kjer je stanje povsem običajno.
Beseda »Klikni« je poleg tega z namizja; aplikacija se uporablja z eno roko na telefonu in v
triinštiridesetih drugih napisih pravi »Pritisni«. Nemščina že govori »Tippe auf«, torej je
slovenščina edina, ki tu veli klikanje.

**Obseg, potrjen v kodi na `main`:** v [sl.js](src/i18n/sl.js) sta taka zapisa dva,
`no_clients_found` in `no_routines_found`; enako v [en.js](src/i18n/en.js) (»Click«).
Za isto dejanje so v slovenščini tri besede: »Pritisni« triinštiridesetkrat, »Tapni«
šestkrat, »Klikni« dvakrat. Zapis `edit_exit_hint` uporabi dve v enem stavku: »Tapni Končano,
pritisni Esc ali tapni zunaj za zaključek.«

**Predlog in preverjanje:** oba napisa prepisati v stanje, ne v neuspeh — »Strank še ni.
Pritisni "Dodaj stranko" in vpiši prvo.« — in besedo »Klikni« odpraviti iz slovenščine ter
»Click« iz angleščine. Preizkus naj v slovenskih napisih prepove »klikn«. Opaženo na objavljeni
različici `0625bd6`; zapisa na `main` sta ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `97686a1`.** An empty directory says `clients_empty`, a search with no match says `no_clients_found`; »Pritisni« in place of »Klikni« and »Tapni«.

### 80.22 [x] P3 — Gumb »Done« v oknu za vabila ostane angleški — popravljeno 2026-09-27

**Scenarij in koraki:** trener shrani nov trening z eno stranko. Odpre se okno »Pošlji vabila
v koledar«.

**Opaženo:** okno je v slovenščini, zadnji gumb pa se glasi »Done«. Prevod obstaja:
`done: "Končano"` v [sl.js](src/i18n/sl.js), in gumb ima `data-i18n="done"`.

**Obseg, izmerjen v brskalniku:** primerjava vseh 847 ključev slovenskega slovarja z vsemi
elementi na zaslonu, ki nosijo `data-i18n`, najde natanko eno neskladje — ta gumb. Drugih
takih ni.

**Vzrok:** okno se sestavi šele, ko je potrebno, prevajanje pa je čez `data-i18n` teklo prej.
Druga besedila v tem oknu se izrišejo po lastnih ključih ob odprtju in so zato slovenska; ta
gumb ostane pri besedilu iz predloge. [sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js),
vrstica z `data-i18n="done"`; datoteka se od objavljene gradnje ni vsebinsko spremenila, torej
velja tudi na `main`.

**Predlog in preverjanje:** ob vsakem sestavljanju okna pognati prevajanje še enkrat, ne
dodajati ročnega izpisa. Preizkus naj v slovenskem vmesniku odpre okno za vabila in zahteva, da
na gumbu piše »Končano«. Isto primerjavo (`data-i18n` proti slovarju) je vredno pognati kot
preizkus čez vsa okna, ki nastanejo pozneje.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `a5b76e1`.** `translateMarkup` runs on the invite dialog when it is drawn; a test opens it in Slovenian and reads »Končano«.

### 80.23 [x] P2 — Prazna podloga veli pritisniti ikono (✎), ki je na zaslonu ni — popravljeno 2026-09-27

**Scenarij in koraki:** trener shrani prvi trening s prazim načrtom in zapre okno za vabila.
Podloga je prazna in pod naslovom piše: »Ni vstavljenih vaj. Tapni ikono za urejanje (✎)
zgoraj, da načrtuješ in dodaš vaje za to stranko.«

**Opaženo:** na zaslonu sta samo dva znaka, krog s puščico (»Začni trening«) in tri navpične
pike (»Možnosti treninga«). Svinčnika ni. Urejanje je skrito pod tremi pikami, kot vrstica
»Uredi načrt«. Trener, ki bere navodilo, išče znak, ki ga ni.

**Težava in vpliv:** to je edino navodilo na prvi prazni podlogi, torej prvi korak, ki ga nov
trener naredi po shranitvi prvega treninga. Napačno ime kontrole ga ustavi prav tam.

**Vzrok, potrjen v kodi na `main`:** gumb `#btn-edit-plan` je danes vrstica menija
(`session-menu-item` s pisalom) v [activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js),
napotek pa je ostal iz časa, ko je znak stal v naslovni vrstici — enako v vseh treh jezikih
([sl.js](src/i18n/sl.js), [en.js](src/i18n/en.js), [de.js](src/i18n/de.js)). Isti gumb ima
`aria-label="Edit plan"` v angleščini, čeprav vrstica kaže »Uredi načrt«.

**Predlog in preverjanje:** napotek naj imenuje pot, ki obstaja: »Pritisni tri pike (⋮) zgoraj
desno in izberi Uredi načrt.« Popraviti v vseh treh jezikih in `aria-label` peljati prek
`t(...)`. Preizkus naj zahteva, da se vsako ime kontrole iz napotka ujema z napisom kontrole,
ki je takrat na zaslonu. Opaženo na objavljeni različici `0625bd6`; koda in zapisi na `main`
so isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `12b86c5`.** The empty plan names the three dots (⋮) and Edit plan; the English aria-label is gone.

### 80.24 [x] P3 — Vabilo stranki govori o stranki kot o moškem, njena lastna stran pa kot o ženski — popravljeno 2026-09-27

**Scenarij in koraki:** trener v imeniku strank pritisne »Povabi stranko«.

**Opaženo:** okno pravi »Svoje podatke in privolitev izpolni sam na svojem telefonu in ti jih
pošlje nazaj«, polje se imenuje »Njegova telefonska številka ali e-naslov«, spodaj pa piše
»Pokaži mu to kodo in ga prosi, naj vanjo usmeri kamero telefona«. Stran, ki jo stranka nato
odpre, isto osebo nagovori v ženski obliki: »komu jo daš, pa izbereš sama«.

**In še tretjič, spet drugače:** okno »Preglej podatke stranke«, ki prebere datoteko, ki jo je
stranka poslala, govori v ženski obliki — »NJENI CILJI«, »Poškodbe in opombe, ki jih je
navedla«, »JEZIK, V KATEREM JE BRALA«. Ista oseba je torej v vabilu moški, na svojem obrazcu
ženska in ob prevzemu spet ženska.

**Težava in vpliv:** ena oseba je na trenerjevem zaslonu moški in na svojem ženska. Aplikacija
je pri trenerju dosledno previdna (»Dobrodošel(-la)«), pri stranki pa ne, čeprav so med
strankami v vzorčnih podatkih večinoma ženske.

**Obseg, potrjen v kodi na `main`:** [sl.js](src/i18n/sl.js) — `intake_invite_body`,
`intake_invite_contact_label`, `intake_invite_qr_hint` in `switch_participant_hint` (»njegov
lasten načrt«) proti `intake_disclaimer` (»izbereš sama«). Isto je v profilu stranke: `joined`
se glasi »Pridružil se«, torej piše »Ana Kovač — Pridružil se …«. Brez spola: »V imeniku od«.

**Predlog in preverjanje:** te zapise ubesediti brez spola. Slovenščina to tu dopušča prek
besede »stranka«: »Pokaži stranki to kodo in jo prosi …«, »Telefonska številka ali e-naslov
stranke«, »Podatke in privolitev izpolni stranka na svojem telefonu«. Preizkus naj v slovenskih
zapisih o stranki prepove »mu«, »ga«, »njegov« in »sam«. Opaženo na objavljeni različici
`0625bd6`; zapisi na `main` so isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `9bb101e`.** The intake, tour and joined texts name the client (»stranka«) instead of »he«.

### 80.26 [x] P2 — Trenerjev lastni signal se v pregledu pokaže kot »Too Easy - Increase Load« — popravljeno 2026-09-27

**Scenarij in koraki:** trener izvede svoj trening in pri vaji pritisne gumb »Prelahko«. Po
zaključku odpre meni ☰ in »Čakajoče na pregled«.

**Opaženo:** vrstica se glasi »Ana Kovač — Too Easy - Increase Load — Vaja: Barbell Back
Squat«. Gumb, ki ga je pritisnil, piše »Prelahko«; pregled pokaže angleški zapis.

**Zakaj tega ni nihče opazil:** v vzorčnih podatkih je ta zapis preveden. [demoText.js](src/data/demoText.js)
ima vrstico »Too Easy - Increase Load« → »Prelahko – povečaj težo« (in nemško »Zu leicht – Last
erhöhen«), zato je peskovnik videti pravilno. Angleščina se pokaže šele, ko signal zapiše
trener sam.

**Vzrok, potrjen v kodi na `main`:** oznaka signala je v zapisu shranjena kot angleški niz —
[quickSignals.js](src/domain/quickSignals.js), `OPPOSITE_QUICK_SIGNAL` — in to je prav, ker je
to ključ, po katerem se signal prepozna in izklopi. Napaka je, da se ta ključ izpiše
neposredno: [planAdjustments.js](src/modules/plans/planAdjustments.js) postavi `u.tag` v značko
in `update.tag` v besedilo okna.

**Širše, kot je videti:** okno »Zabeleži povratne informacije«, ki se odpre z gumbom »Opombe«
na kartici vaje, ponuja pet oznak in vse so angleške: »🚀 Too Easy - Increase Load«,
»⚠️ Too Hard - Reduce Load«, »🔬 Form Break - Focus Required«, »🔥 Joint Pain / Discomfort«,
»💪 Good Progression«. Vpisane so dobesedno v
[feedbackModal.js](src/modules/common/feedbackModal.js), brez prevajalnega ključa. Pri tretji
se napis in shranjena vrednost celo razlikujeta: trener pritisne »Form Break - Focus
Required«, shrani pa se »Form Break - Watch Position«, in prav to pozneje prebere v pregledu.

**Predlog in preverjanje:** ključ naj v zapisu ostane, izpisuje pa naj se prek slovarja — pet
novih ključev v `en`, `sl` in `de`, in napis naj se ujema s shranjeno vrednostjo. Paziti na
[historyView.js](src/modules/history/historyView.js), ki iz iste oznake bere `Too Hard` in
`Reduce Load`, da ugane barvo; tudi to naj bere ključ, ne besedila. Preizkus naj v slovenskem
vmesniku pritisne »Prelahko« in zahteva, da v pregledu ni angleškega niza. Opaženo na objavljeni
različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `ead921d`.** `src/domain/feedbackTags.js` maps the stored key to dictionary words for the review list, its dialog, history icons and clipboard notes; the chips are built from the same list; demo tags stay keys.

### 80.30 [x] P2 — Nepovratni izbris stranke se potrdi z angleškim navodilom in angleško besedo — popravljeno 2026-09-27

**Scenarij in koraki:** trener odpre profil stranke »Ana Kovač« in pritisne »Izbriši stranko
(GDPR)«.

**Opaženo:** okno je slovensko in jasno pove, kaj se zgodi, dve stvari v njem pa nista: vrstica
s podatki stranke se glasi »Ana Kovač — +386 40 111 222 · **joined** 2026-09-27 · id …XsD94l«,
navodilo nad poljem pa »**Type ERASE to confirm**«. Gumb »Izbriši dokončno« se odklene šele,
ko trener vpiše angleško besedo »ERASE«.

**Težava in vpliv:** to je edino dejanje v aplikaciji, ki ga ni mogoče razveljaviti, in njegova
zadnja varovalka je napisana v jeziku, ki ga uporabnik morda ne bere. Slovenski trener mora
uganiti, kaj naj vpiše. Beseda za potrditev naj bo v jeziku vmesnika.

**Vzrok, potrjen v kodi na `main`:** [clientDataRights.js](src/modules/clients/clientDataRights.js)
ima `ERASE_CONFIRMATION_WORD = "ERASE"` in oznako polja vpisano dobesedno v angleščini;
[clientErasure.js](src/data/clientErasure.js) sestavi vrstico s podatki z besedo `joined`.

**Predlog in preverjanje:** oznako polja in besedo za potrditev peljati prek `t(...)` — v
slovenščini »IZBRIŠI«, v nemščini »LÖSCHEN« — in vrstico s podatki sestaviti iz ključev, ne iz
angleških besed. Paziti, da preverjanje primerja vpisano besedo z besedo TRENUTNEGA jezika.
Preizkus naj v vseh treh jezikih zahteva, da se gumb odklene z besedo tistega jezika. Opaženo na
objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `2519c5b`.** The instruction and the word to type (IZBRIŠI, LÖSCHEN) come from the dictionary; the input is compared with the word on screen.

### 80.33 [x] P3 — Dva prevajalna ključa ne obstajata, zato se uporabniku pokaže ključ sam — popravljeno 2026-09-27

**Scenarij in koraki:** trener na plošči pogleda kartico treninga; ob imenu je svinčnik. Bralnik
zaslona in opis ob dotiku miške se glasita »edit«, z malo začetnico in v angleščini.

**Izmerjeno:** v `src/` je uporabljenih 341 različnih prevajalnih ključev, v
[en.js](src/i18n/en.js) jih je zapisanih 867 — in dva uporabljena ključa ne obstajata nikjer:
`edit` v [sessionCard.js](src/modules/sessionList/sessionCard.js) in `voice_processing` v
[feedbackModal.js](src/modules/common/feedbackModal.js), kjer se izpiše kot stanje med obdelavo
glasovne opombe. Ko ključa ni, `t(...)` vrne kar ključ, zato ga uporabnik bere na zaslonu.

**Težava in vpliv:** v angleščini je »edit« videti skoraj pravilno, zato tega nihče ne opazi; v
slovenščini in nemščini je to angleška beseda z malo začetnico. Pri glasovni opombi se med
obdelavo izpiše »voice_processing«, kar je videti kot napaka programa.

**Predlog in preverjanje:** dodati oba ključa v vse tri jezike. Ker tega nihče ne ujame,
naj ta primerjava postane preizkus: vsak `t("ključ")` v `src/` mora obstajati v `en.js`. To je
ista vrsta preverbe, kot jo že dela [ui_strings.py](agent_tools/ui_strings.py), in sodi zraven.
Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `170a358`.** `edit` and `voice_processing` exist in every language; tests/unit/test_translation_keys_exist.py fails the build on a key the code names and en.js lacks.

### 80.34 [x] P3 — »Glasovna opomba (zasebnost-prva)« je izmišljen izraz — popravljeno 2026-09-27

**Scenarij in koraki:** trener na kartici vaje pritisne »Opombe«; v oknu je razdelek za glasovno
opombo.

**Opaženo:** naslov razdelka se glasi »Glasovna opomba (zasebnost-prva)«. »Zasebnost-prva« ni
slovenska besedna zveza; nastala je s prevodom angleškega »privacy-first«. Pod njo že piše
»Samo na napravi«, kar isto stvar pove razumljivo.

**Težava in vpliv:** bralec obstane pri besedi, ki je ne pozna, na mestu, kjer gre za zaupanje —
kam gre posnetek njegove stranke.

**Predlog in preverjanje:** oklepaj izpustiti; naslov naj bo »Glasovna opomba«, pojasnilo pa
ostane »Samo na napravi«. `voice_note_label` v [sl.js](src/i18n/sl.js); preveriti tudi nemško
ustreznico. Opaženo na objavljeni različici `0625bd6`.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `f0ee646`.** »Glasovna opomba«, »Voice note, on this device only«.

### 80.37 [x] P2 — Pred nepovratno zamenjavo podatkov piše, kaj bo izgubljeno, v angleščini — popravljeno 2026-09-27

**Scenarij in koraki:** trener v »Središče za sinhronizacijo in varnostne kopije« izbere
»Izberi JSON datoteko« in naloži staro varnostno kopijo, medtem ko ima na napravi dve stranki,
eno rutino in en trening.

**Opaženo:** aplikacija pravilno vpraša za potrditev: »Obnovitev zamenja vse na tej napravi.
Izgubljeno bo: **2 clients, 1 routines, 1 sessions, 1 planUpdates**.« Naštevanje je angleško, in
zadnje ime je celo notranje ime polja v kodi (`planUpdates`). Gumba sta slovenska: »Obdrži, kar
imam« in »Zamenjaj«.

**Težava in vpliv:** to je stavek, ob katerem se trener odloči, ali bo izgubil delo. Prav ta del
stavka — kaj izgubi — je v jeziku, ki ga morda ne bere, in z besedo, ki je ne pozna nihče razen
programerja.

**Vzrok, potrjen v kodi na `main`:** [backupRestore.js](src/modules/common/backupRestore.js)
sestavi naštevanje kot `${count} ${collection}`, kjer je `collection` ključ zbirke iz
[backupFile.js](src/data/backupFile.js). Okvirni stavek ima prevod, vsebina ne.

**Predlog in preverjanje:** vsaka zbirka dobi svoje ime v vseh treh jezikih, in številke naj gredo
skozi pravilo za množino (§80.17): »2 stranki, 1 program, 1 trening, 1 čakajoča sprememba«.
Preizkus naj v slovenskem vmesniku sproži to potrditev in zahteva, da v njej ni angleških imen
zbirk. Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `d19785b`.** Each collection in the replace warning has counted forms in every language.

### 80.38 [x] P2 — Uvoz pravi »združilo ali prepisalo«, v resnici vedno zamenja — popravljeno 2026-09-27

**Scenarij in koraki:** trener v istem oknu bere, kaj uvoz naredi, preden izbere datoteko.

**Opaženo:** »Naloži obstoječo .json datoteko. To bo združilo ali prepisalo trenutno bazo.«

**Kaj se zgodi v resnici:** uvoz vedno **zamenja** celotno bazo. To je zapisano tudi v kodi, z
utemeljitvijo: združevanje dveh baz brez skupnega izhodišča je ugibanje, zato ga uvoz iz
datoteke ne dela ([backupRestore.js](src/modules/common/backupRestore.js)). Združevanje zna
samo sinhronizacija z Google Drive, ki skupno izhodišče ima.

**Težava in vpliv:** stavek pred nepovratnim dejanjem ponuja dve možnosti, od katerih ena ne
obstaja. Trener, ki prebere »združilo«, lahko sklene, da bo uvoz njegove nove stranke pustil pri
miru — pa jih ne bo. Potrditveno okno pozneje pove pravo stvar, a šele potem, ko je datoteko že
izbral.

**Predlog in preverjanje:** zapis naj se glasi, da uvoz zamenja vse na tej napravi s
tistim, kar je v datoteki. Ključ `backup_import_desc` v `en`, `sl` in `de`. Preizkus naj zahteva,
da opis uvoza ne vsebuje besede za združevanje. Opaženo na objavljeni različici `0625bd6`; zapis
na `main` je isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `5d9c541`.** The import text says it replaces everything; success and re-erased messages are translated.

### 80.7 [x] P2 — Prvi prikaz novega termina pokaže 1970-01-01 — popravljeno 2026-09-27

**Scenarij:** na začetnem zaslonu »Ustvari trening«, ime »Individualna vadba«, kraj
»Telovadnica Center«, privzeti današnji datum 2026-09-27, 10:00–10:45, dodati Ano in
izbrati »Odpri v beležki«. Vabil ne pošiljati.

**Opaženo:** glava nove beležke kaže »1970-01-01 · 10:00 - 10:45 · Telovadnica
Center«. Polje odprtega obrazca še vsebuje 2026-09-27. Po zaprtju vabil in beležke je
termin pravilno v današnjem urniku; ob poznejšem odprtju glava kaže »Danes«.

**Vpliv in predlog:** ob prvem prikazu trener ne more zaupati datumu prav pred
pošiljanjem vabil. Uskladiti prvi izris glave z datumom shranjenega termina in
preveriti pred ponovnim odpiranjem. Napačna rezervacija ali vsebina vabila nista
dokazani. Objavljena različica `0625bd6`, razvoj ni pregledan.

**Ponovljeno 2026-09-27 (Claude) in vzrok najden:** ista pot, s stranko »Ana Kovač« in
praznim načrtom, glava »1970-01-01 · 10:00 - 11:00 · Telovadnica Center«. V tistem trenutku
so vsa tri polja, iz katerih glava bere dan, prazna — izmerjeno v brskalniku: `startTime`
odprtega treninga, `sourceSession.startDate` in `sourceSession.day` so `null`. V
[sessionTitleBar.js](src/modules/session/sessionTitleBar.js) `whenAndWhere` naredi
`new Date(null)`, kar je 1. januar 1970, in ga izpiše kot dan, ker `day` ni nastavljen.
Datoteka se od objavljene gradnje ni vsebinsko spremenila (razlika sta samo komentarja), torej
**napaka stoji tudi na `main`**. Popravek ni nov izračun datuma, ampak da glava ne izriše
dneva, ki ga ni: ko so vsa tri polja prazna, prevzame datum iz shranjenega termina, sicer pa
dneva ne pokaže. Preizkus naj tik po shranitvi prebere glavo in zahteva današnji datum.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `e83891b`.** `buildRealSessionMeta` (src/domain/sessionRecord.js) carries `day`, `startDate` and `endDate`, as a dashboard launch does; the header reads today's day right after the save.

### 80.8 [x] P1 — Prosta opomba brez izbrane ocene postane priporočilo za večjo težo — popravljeno 2026-09-27

**Scenarij:** na vaji izbrati »Opombe«, vnesti samo prosto besedilo in potrditi
»Zapiši opozorilo«, brez namernega izbora ocene. Primer: »plank 30 s, 25 s, 20 s;
tretjo serijo zaključila pred ciljem«. Enako pri počepu z zmanjšano zadnjo obremenitvijo.

**Opaženo:** ob ponovnem odprtju načrta se obe opombi začneta z »Too Easy - Increase
Load«. Tudi nevtralna opomba o veslanju po načrtu dobi isto oznako. Ročno dodani ločeni
signal »Pretežko« pri počepu ostane, zato isti program kaže nasprotujoči si oceni.

**Vpliv in predlog:** pri pripravi naslednje vadbe trener vidi predlog za večjo težo,
ki ga ni podal. Prosta opomba mora ostati nevtralna; oceno izbrati izrecno ali zahtevati
odločitev pred shranjevanjem. Preveriti zapis opombe brez izbire in po ponovnem odprtju.
Objavljena različica `0625bd6`; ne gre za zdravstveni nasvet ali diagnozo.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `9537542`.** The feedback dialog starts on a neutral sixth choice, »Samo opomba, brez ocene« (stored as `Note`); a rating is chosen on purpose.

### 80.12 [x] P2 — Zamujen trening na plošči pokaže samo številko, besede »Zamuja« ni nikoli — popravljeno 2026-09-27

**Scenarij in koraki:** trener ob 09:45 pogleda ploščo treningov v peskovniku. Na njej stoji
trening »Skupinska moč in kondicija«, 08:00–10:00, ki se še ni začel.

**Opaženo:** kartica kaže samo »01h 43m« na oranžni podlagi, brez ene same besede. Ne pove,
ali je to pretekli čas, preostali čas ali zamuda. Obe oznaki sta v HTML — »Se začne čez« in
»Zamuja« — a obe imata `display: none`, izmerjeno v brskalniku.

**Težava in vpliv:** trener na plošči ne vidi, da trening zamuja; vidi številko, ki je enaka
tisti pri treningih, ki se šele začnejo. Beseda »Zamuja« (`overdue` v [sl.js](src/i18n/sl.js))
se ne pokaže nikoli, v nobenem jeziku. To zadeva vsako kartico, ki ji je napovedani začetek
že ušel.

**Vzrok, potrjen v kodi na `main`:** v [sessionsView.css](src/modules/sessionList/sessionsView.css)
sta obe pravili v enem seznamu selektorjev:
`.session-live-bar.upcoming .when-overdue, .session-live-bar.upcoming.overtime .when-upcoming { display: none }`.
Vrstica z zamudo nosi oba razreda, `upcoming` in `overtime`, zato jo zadene tudi prvi
selektor — skrita sta oba napisa. Prvi selektor mora zamudo izvzeti
(`.upcoming:not(.overtime) .when-overdue`).

**Enako pri treningu, ki je zdavnaj mimo:** trening, vpisan za 2026-09-20 in nikoli začet, se
na plošči glasi »167h 52m« — brez besede. Razred je isti (`upcoming overtime`), zato trener
številko lahko bere le kot »čez 167 ur«, čeprav pomeni »zamuja teden dni«.

**Ista tišina na drugem koncu treninga:** ko trening teče čez napovedani konec, vrstica nad dnom
zaslona pokaže »-00:51« in šteje naprej v minus. Minus je edini znak, da je ura potekla; besede
za to ni. To je zavestna izbira v [sessionBar.js](src/modules/session/sessionBar.js) (odštevanje
do konca, s predznakom), vendar pade v isto vrzel: aplikacija pove s številko, kar bi morala
povedati z besedo.

**Predlog in preverjanje:** popraviti selektor in pripeti besedo v test plošče: kartica pred
začetkom kaže »Se začne čez«, kartica po zapadlem začetku »Zamuja«, vrstica v podaljšku pa
besedo za podaljšek ob času. Danes tega ne preverja
noben test — iskanje po `tests/` ne najde ne razreda `when-overdue` ne besede »Zamuja«.
Opaženo na objavljeni različici `0625bd6`; pravilo na `main` je nespremenjeno.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `59bd6c8`.** The selector is `.upcoming:not(.overtime) .when-overdue`; past the planned end the bar reads »Čez konec 00:51«.

### 80.16 [x] P2 — Po izhodu iz peskovnika ostane vzorčni trening v vrstici nad dnom zaslona — popravljeno 2026-09-27

**Scenarij in koraki:** trener ima svojo aplikacijo še prazno. Prek menija ☰ izbere »Vstopi v
peskovnik«, pritisne kartico »Skupinska moč in kondicija« (08:00–10:00, trening že teče), nato
spet odpre ☰ in izbere »Zapusti peskovnik«.

**Opaženo:** plošča je prazna, oznaka v glavi se vrne na predogled, spodaj pa še naprej stoji
vrstica »Skupinska moč in kondicija + Vrnitev po poškodbi · 3 strank · 08:00 - 10:00« s
tekočo uro. To je vzorčni trening s tremi vzorčnimi strankami, prikazan v trenerjevih lastnih
podatkih. Pritisk nanjo ne odpre tega treninga. Po osvežitvi strani vrstica izgine; v
`localStorage` sta ključa samo pod končnico `__sandbox`, torej se v trenerjeve podatke ni
zapisalo nič. Ponovljeno dvakrat.

**Težava in vpliv:** peskovnik obljubi, da nič iz njega ne doseže poslovnih podatkov, tu pa
trener v svojem prostoru vidi trening, ki ga nima, z imeni ljudi, ki jih ne pozna. Ne izgubi
podatkov, izgubi pa zaupanje v ločnico — in dokler ne osveži strani, mu vrstica jemlje prostor
na dnu zaslona.

**Predlog in preverjanje:** ob preklopu delovnega prostora poleg počiščene spomina počistiti
tudi izris te vrstice. [app.js](src/app.js), `returnToLastView`, že pokliče
`setActiveSession(null)` in `recoverActiveSession()` — komentar ob njiju opisuje isto napako v
nasprotni smeri (vstop v peskovnik) — vrstica pa se očitno ne izriše znova. Popravek naj pokrije
obe smeri, preizkus pa naj po izhodu iz peskovnika zahteva, da vrstice ni. Opaženo na objavljeni
različici `0625bd6`; `89770cd`, ki je to pot uvedel, je v tej gradnji že vključen, zato
verjetno velja tudi na `main` — preveriti na razvojnem strežniku pred popravkom.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `62bc100`.** `returnToLastView` in src/app.js draws the bar again after the workspace's session replaces the one in memory.

### 80.27 [x] P2 — Svinčnik pri čakajočem signalu ne naredi nič, če vaja ni iz programa — popravljeno 2026-09-27

**Scenarij in koraki:** trener izvede trening, sestavljen s »Poljuben / Prazen načrt«, z vajo,
dodano iz kataloga. Med vadbo pritisne »Prelahko«. Po zaključku odpre »Čakajoče na pregled« in
pri vrstici pritisne svinčnik (»Uredi načrt«).

**Opaženo:** nič. Naslov strani se ne spremeni, okno se ne odpre, sporočila ni, v dnevniku
brskalnika ni napake. Gumb je viden in ni onemogočen. Preizkušeno z dotikom in s programskim
klikom, oba brez učinka. Drugi gumb v isti vrstici (kljukica, »Razreši«) deluje.

**Vzrok, potrjen v kodi na `main`:** [planAdjustments.js](src/modules/plans/planAdjustments.js)
ob pritisku poišče vajo v knjižnici in nato program, ki to vajo vsebuje, ter se premakne
**samo, če program obstaja** (`if (routine)`). Trening iz praznega načrta ne pripada nobenemu
programu, zato pogoj ne drži in funkcija se tiho konča.

**Težava in vpliv:** prav trening, sestavljen sproti na telovadnici, je tisti, pri katerem
signal največ pomeni. Trener pritisne edini gumb, ki obljublja popravek programa, in ne dobi
ničesar — niti pojasnila, da programa za popravek ni.

**Predlog in preverjanje:** ko programa ni, gumba ne kazati, ali pa ga peljati do zapisa vaje
oziroma do načrta tistega treninga in to povedati z besedo. Preizkus naj signal ustvari v
treningu brez programa in zahteva, da pritisk na ta gumb pripelje nekam. Opaženo na objavljeni
različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `d2c012f`.** The pencil is shown only when a routine holds the exercise.

### 80.28 [x] P2 — Predlagana ciljna teža je 2,5 kg za vajo, ki jo je stranka delala s 40 kg — popravljeno 2026-09-27

**Scenarij in koraki:** trening brez programa, vaja »Barbell Back Squat« s 3 × 10 × 40 kg. Med
vadbo trener pritisne »Prelahko«. Po treningu odpre »Čakajoče na pregled«, pritisne kljukico in
v oknu »Uveljavi spremembo programa« pogleda polje »Ciljna teža (kg)«.

**Opaženo:** v polju piše **2,5**. Ponovitve so 10 in serije 3, kar se ujema, teža pa ne: stranka
je delala s 40 kg. Če trener pritisne »Uveljavi in razreši«, se kot cilj zapiše 2,5 kg.

**Vzrok, potrjen v kodi na `main`:** [planAdjustments.js](src/modules/plans/planAdjustments.js),
`prefillAdjustmentFields`: če vaja pripada programu, je predlog »trenutna teža + 2,5«; če
programa ni, je predlog gola številka 2,5 (pri »Pretežko« pa 0). Trening iz praznega načrta
nima programa, dejansko težo pa aplikacija ves čas pozna — zapisana je v treningu, ki je pravkar
tekel.

**Težava in vpliv:** okno predlaga breme, ki je šestnajstkrat prelahko, in to na poti, ki
obljublja popravek programa. Trener, ki predlogu zaupa, stranki zapiše napačen cilj.

**Predlog in preverjanje:** kadar programa ni, vzeti težo, ponovitve in serije iz zapisa
treninga, iz katerega je signal prišel, in šele nanje prišteti 2,5. Če tudi tega ni, polja
pustiti prazna in ne ponuditi številke. Preizkus naj signal ustvari pri 40 kg brez programa in
zahteva, da predlog ni manjši od izvedene teže. Opaženo na objavljeni različici `0625bd6`; koda
na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `d2c012f`.** src/domain/adjustmentSuggestion.js starts from the routine's target, else from the sets recorded in the session the signal came from (found by the signal's id); with neither, the fields stay empty.

### 80.29 [x] P3 — Predal obvestil še naprej trdi, da signal čaka, dokler strani ne osvežiš — popravljeno 2026-09-27

**Scenarij in koraki:** trener v oknu »Uveljavi spremembo programa« pritisne »Uveljavi in
razreši«, nato pogleda predal obvestil.

**Opaženo:** stran s pregledom pravi »Nič ne čaka na pregled. Vsi signali s tal so usklajeni!«,
predal obvestil pa v isti sapi »1 stranka(-e/-k) ima nerešene povratne signale iz treninga« in
»Ana Kovač — Jutranja vadba (1)«. Po osvežitvi strani je predal prazen in pravilen.

**Vzrok, potrjen v kodi na `main`:** obvestilo ni shranjen zapis, ampak se sestavi ob vsakem
izrisu iz nerešenih signalov ([notificationItems.js](src/domain/notificationItems.js)). Podatek
je torej pravilen, izris pa star: pot za uveljavitev v
[planAdjustments.js](src/modules/plans/planAdjustments.js) osveži seznam pregleda in seznam
programov, predala pa ne — `renderNotificationArea` se pokliče ob zagonu in ob menjavi jezika.

**Težava in vpliv:** dva dela istega zaslona si nasprotujeta; trener ne ve, kateremu verjeti,
in na telefonu strani ne osvežuje.

**Predlog in preverjanje:** po uveljavitvi in po razrešitvi poklicati isti izris predala.
Preizkus naj razreši zadnji signal in zahteva, da predal takoj pokaže »Ni obvestil«. Opaženo na
objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `0abf5e4`.** `renderPendingPlanAdjustments` in src/app.js also redraws the notification drawer.

### 80.31 [x] P2 — Po izbrisu stranke profil še vedno kaže ime, telefon in cilje — popravljeno 2026-09-27

**Scenarij in koraki:** v profilu stranke »Ana Kovač« pritisniti »Izbriši stranko (GDPR)«,
vpisati potrditveno besedo in pritisniti »Izbriši dokončno«.

**Opaženo:** okno se zapre, pod njim pa stoji nespremenjen profil: »Ana Kovač«, »+386 40 111
222«, cilji in zapiski. Šele po osvežitvi strani piše »Client #DBV3KK«, cilji so prazni in
zgoraj stoji »Izbrisano 2026-09-27 na zahtevo stranke. Spodnji zapisi treningov so anonimni.«

**Kaj je v redu:** izbris sam je opravljen do konca. Po osvežitvi imena in telefonske številke
ni nikjer — ne na plošči, ne v zgodovini, ne v shrambi brskalnika (iskano po nizu v
`localStorage`). Zapisi treningov ostanejo brez osebe, kot okno obljubi.

**Težava in vpliv:** trener po nepovratnem dejanju vidi zaslon, ki pravi, da se ni nič zgodilo.
Lahko ga ponovi ali pa sklene, da izbris ni uspel. Če je stranka ob njem — izbris se zgodi
prav na njeno zahtevo — vidi svoje ime in telefonsko številko na zaslonu, potem ko ju je dala
izbrisati.

**Vzrok:** isti razred kot §80.29 — dejanje spremeni podatke, pogled nad njimi se ne izriše
znova. Popravek naj po izbrisu izriše profil (ali se vrne v imenik) iz novega stanja.

**Preverjanje:** preizkus naj po izbrisu, brez osvežitve, zahteva, da imena in telefonske
številke ni več na zaslonu. Opaženo na objavljeni različici `0625bd6`.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `0abf5e4`.** The erasure's `onErased` re-enters the current route, so the profile behind the receipt is drawn from the erased record.

### 80.18 [x] P2 — Prvi trening: iskanje udeleženca je slepa ulica, ko strank še ni — popravljeno 2026-09-27

**Scenarij in koraki:** trener z novo, prazno aplikacijo pritisne »Ustvari trening«, vpiše ime
»Jutranja vadba« in kraj »Telovadnica Center«, nato v polju »Poišči stranko po imenu...«
vpiše »Ana«.

**Opaženo:** pod poljem se izpiše »Stranke s tem imenom ni«, spodaj pa stoji »Na tem treningu
še ni nikogar. Stranko poišči v polju zgoraj.« Aplikacija ima takrat nič strank, torej to
polje ne more uspeti — pa tega ne pove in ne ponudi nobene poti do vpisa nove stranke.

**Kaj se zgodi ob shranjevanju:** pritisk na »Odpri v beležki« odpre okno brskalnika z
besedilom »Izbrati moraš vsaj eno stranko.« Trening torej brez stranke ne nastane, poti do
stranke pa na tem zaslonu ni.

**Težava in vpliv:** prvo opravilo novega trenerja je prvi trening s prvo stranko. Tu obstane:
mora sam uganiti, da gre najprej v meni ☰ in »Seznam strank (klientov)«, se vrniti in začeti
znova. Navodilo na zaslonu ga pošilja nazaj v polje, ki ne more delovati.

**Vzrok, potrjen v kodi na `main`:** [editSessionControl.js](src/modules/session/editSessionControl.js),
`renderParticipantMatches` pozna en sam odgovor za nič zadetkov — napis »Stranke s tem imenom
ni«. Prazen imenik in »to ime ni med osmimi strankami« sta zanj isto stanje.

**Predlog in preverjanje:** ko je imenik prazen, naj napis to pove in ponudi gumb, ki odpre
vpis nove stranke, po vpisu pa se vrne v ta obrazec z izbrano stranko. Ko imenik ni prazen,
naj pod »Stranke s tem imenom ni« stoji ponudba, da se stranka s tem imenom doda. Preizkus naj
gre pot od prazne aplikacije do shranjenega prvega treninga z eno stranko, brez obiska menija.
Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `98f11c3`.** A search with no match says whether the directory is empty and offers »Dodaj »Ana« kot novo stranko«; the client dialog opens with the name filled in, and the client saved comes back onto the session.

### 80.21 [x] P2 — Ista stvar se na enem zaslonu imenuje vaja, program, rutina in načrt — popravljeno 2026-09-27

**Scenarij in koraki:** trener v obrazcu novega treninga doda stranko »Ana Kovač«. Ob njenem
imenu se pojavi spustni seznam.

**Opaženo:** seznam se odpre z besedilom »Izberi vajo«, v njem pa ni vaj, temveč programi
vadbe in možnost »Poljuben / Prazen načrt«. Če trener ne izbere ničesar in shrani, okno pravi
»Dodeli predlogo rutine vsem izbranim strankam.« Bralnik zaslona prebere »Program za to
stranko«.

**Težava in vpliv:** za eno stvar štirje izrazi — vaja, program, predloga rutine, načrt — na
enem samem zaslonu. Trener, ki se aplikacije šele uči, mora ugibati, ali gre za štiri različne
reči. Povsem napačna je prva: »vaja« je v tej aplikaciji posamezen gib iz kataloga.

**Vzrok, potrjen v kodi na `main`:** [editSessionControl.js](src/modules/session/editSessionControl.js)
napolni prvo možnost s ključem `select_exercise` (»Izberi vajo«, »Select Exercise«,
»Übung auswählen«), čeprav seznam gradi iz `state.routines`. Sporočilo napake uporablja
`err_assign_routine`, bralnikov opis pa `select_routine_for`.

**Imen je v resnici pet.** Vrstica v meniju ☰ se glasi »Rutine«, naslov strani, ki jo odpre,
pa »Predloge rutine« z gumbom »Ustvari rutino«. Skupaj z izrazi na zaslonu za nov trening je to
pet imen za eno stvar: vaja, program, rutina, predloga rutine, načrt.

**Predlog in preverjanje:** izbrati eno ime za to stvar v vsakem jeziku in ga uporabiti v vseh
zapisih; prva možnost dobi svoj ključ, ne ključa za vaje. Preveriti tudi, da se ime ujema
z imenom vrstice v meniju in z naslovom strani. Preizkus naj zahteva, da se v tem obrazcu ne pojavi ključ
`select_exercise`. Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `f5a485d`.** One name, »rutina«: the dropdown opens on »Izberi rutino« (its own key, `select_routine`), the screen reader reads »Rutina za to stranko«, the page is titled »Rutine« like the menu; »načrt« stays for a session's own plan.

### 80.32 [x] P3 — Skupinski trening, začet iz rutine, nima svojega naslova; osvežitev ga izbriše — popravljeno 2026-09-27

**Scenarij in koraki:** trener odpre »Rutine«, pri rutini »Ponedeljek moč« pritisne »Začni
skupinski trening«, vpiše ime »Skupina ponedeljek« in ga telefon zmoti — stran se osveži.

**Opaženo:** naslov v brskalniku ves čas ostane `/routines`. Po osvežitvi je na zaslonu spet
seznam rutin, obrazca ni več in vpisano ime je izgubljeno. Če trener namesto tega pritisne
gumb za nazaj, ne pride na seznam rutin, od koder je prišel, ampak na ploščo treningov.

**Primerjava:** isti obrazec, odprt z gumbom »Ustvari trening«, ima svoj naslov
`/session/new`, zato ga osvežitev ohrani in gumb za nazaj deluje pričakovano.

**Težava in vpliv:** na telefonu se strani osvežujejo same — klic, preklop med aplikacijami,
brskalnik, ki sprosti pomnilnik. Delo, vpisano v ta obrazec, takrat izgine brez besede.

**Predlog in preverjanje:** to pot peljati na isti naslov kot »Ustvari trening«, z rutino kot
parametrom. Preizkus naj obrazec odpre iz rutine, osveži stran in zahteva, da je obrazec še
odprt z vpisanim imenom. Opaženo na objavljeni različici `0625bd6`.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `06197b2`.** The button navigates to `/session/new?routine=<id>`; a reload keeps the form and what was typed, Back returns to the routines.

### 80.35 [x] P1 — Glasovna opomba si izmisli stavek o stranki in ga zapiše v njeno kartoteko — popravljeno 2026-09-27

**Scenarij in koraki:** trener med treningom na kartici vaje pritisne »Opombe«, nato mikrofon,
počaka in pritisne mikrofon še enkrat. Nazadnje pritisne »Zapiši opozorilo«.

**Opaženo:** po drugem pritisku piše »Prepis v napravi je zaključen!«, v polje za opombo pa se
zapiše stavek, ki ga ni nihče izrekel: »Glasovna opomba (lokalno): Maja Horvat poroča o dobrem
počutju pri vaji Barbell Bench Press.« Po pritisku na »Zapiši opozorilo« je ta stavek shranjen
kot povratna informacija, pripeta stranki in vaji: v »Čakajoče na pregled« se prebere kot
»Maja Horvat — Too Easy - Increase Load - Glasovna opomba (lokalno): Maja Horvat poroča o dobrem
počutju pri vaji Barbell Bench Press.«, pod njim pa piše »voice_memo.wav (0:04)« — ime in dolžina
posnetka, ki ne obstaja. (V polje »Predhodne poškodbe in opombe« v profilu stranke ta stavek ne
gre.) Pri tem se je potrdila tudi §80.8: oznake nisem izbral, zapis pa je dobil
»Too Easy - Increase Load«.

**Mikrofona pri tem sploh ni:** preizkus je tekel v brskalniku, kjer `getUserMedia` zavrne
dovoljenje, aplikacija pa je vseeno pokazala »Snemanje…« in nato »Prepis v napravi je
zaključen!«. V kodi ni ne `getUserMedia` ne `MediaRecorder`:
[feedbackModal.js](src/modules/common/feedbackModal.js) ob prvem pritisku zamenja ikono, ob
drugem po zakasnitvi sestavi stavek iz imena stranke in imena vaje, posebej za `sl`, `de` in
`en`. Uvodna opomba datoteke to imenuje »mock«.

**Težava in vpliv:** aplikacija izmisli zapis o imenovani osebi in ga predstavi kot prepis
njenih besed, v kartoteki, ki je podlaga za odločitve o treningu — in za katero stranka podpiše
privolitev. Trener, ki opombo pozneje bere, nima kako vedeti, da je ni nihče izrekel. To ni
nedokončana funkcija, ampak neresničen zapis o človeku. Da posnetka ni, ni nikjer povedano;
napis trdi nasprotno.

**Odločeno 2026-09-27 (Simon): mikrofona v kodi ne bo, ker je vprašanje zasebnosti.** S tem ta
razdelek ni manjši, ampak dokončen: to ni nedokončana funkcija, ki čaka na snemanje, ampak pot, ki
mora izginiti. Dokler je tam, aplikacija za vedno trdi »Prepis v napravi je zaključen!« in piše
stavke, ki jih ni nihče izrekel.

**Predlog, po tej odločitvi:** pot glasovne opombe odstraniti iz delovne aplikacije v celoti —
gumb z mikrofonom, napis o snemanju, izmišljeni prepis in oznako »voice_memo.wav (0:04)«. Polje z
lastnim besedilom opombe ostane; to je tisto, kar trener res napiše.

**Kaj vse gre s tem, in tega se iz enega gumba ne vidi:**
- **Obljuba v specifikacijah.** [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md)
  navaja »Privacy-First Voice Notes (Auto-Mapped & Local-Only)« kot eno od nosilnih zmožnosti, z
  opisom prepisa na napravi; [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md)
  ima predvajanje glasovne opombe v koraku pregleda, [INDEX.md](use_cases/INDEX.md) pa jo našteje v
  povzetku UC1. Vse troje mora odpasti v isti spremembi, sicer specifikacija obljublja, česar ni.
- **Opis modulov.** [SRC_MODULES.md](docs/SRC_MODULES.md) opisuje `feedbackModal.js` kot »voice
  recorder handler« in `feedbackModal.css` kot animacijo valovanja.
- **Besedila.** Šest ključev `voice_*` v vsakem od treh slovarjev; med njimi »Glasovna opomba
  (zasebnost-prva)« iz §80.34 in `voice_processing` iz §80.33. Oba sta bila danes popravljena, še
  preden je odločitev prišla; popravka s to potjo odpadeta in to ni izgubljeno delo, ampak vrstni
  red dogodkov.
- **Zapisi.** `hasVoiceNote` je polje sheme ([recordSchemas.js](src/data/recordSchemas.js)) in ga
  bere `isPlainQuickSignal` v [quickSignals.js](src/domain/quickSignals.js) pri odločitvi, ali je
  signal »gol dotik«, ki se sme umakniti. Polje naj ostane v shemi (stari zapisi ga imajo), pisati
  pa ga ne sme nič novega. **Preveriti je treba, kaj se zgodi s trenerjevimi obstoječimi zapisi,
  ki trdijo, da imajo posnetek**: posnetka ni bilo nikoli, zato naj se oznaka o datoteki nikjer več
  ne izriše.

**Preverjanje:** preizkus naj odpre okno z opombami in zahteva, da gumba za snemanje ni — tudi v
peskovniku ne. (Prvotno je ta vrstica zahtevala v peskovniku primer besedila; po odločitvi pot
odpade povsod, zato tudi tam ni ničesar, kar bi bilo treba označiti.) Opaženo na
objavljeni različici `0625bd6`; koda na `main` je ista. Sorodno: §80.8 (prosta opomba brez
ocene postane priporočilo) in zapis v [TODO_ARCHIVE.md](TODO_ARCHIVE.md) o imenu »voice_memo.wav«,
ki mock omenja, ne pa tega, da si izmisli vsebino.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `ff15fff`.** The voice-note path is removed from the whole app, the sandbox included: the »Preverjanje« line above still asked for an example text in the sandbox, but with no microphone anywhere nothing is left to label. The review card and dialog no longer draw a recording for old records that carry `hasVoiceNote`; the field stays in the schema and is still read by `isPlainQuickSignal`. This also removes the label from §80.34 and the key from §80.33.

### 80.19 [x] P2 — Aplikacija sprašuje z okni brskalnika, ki jih ne oblikuje in ne prevaja — popravljeno 2026-09-27

**Scenarij in koraki:** trener shrani trening brez stranke; med izvedbo treninga pritisne
»Zaključi vadbo« prej, kot se je trening iztekel; v podlogi pritisne brisanje treninga.

**Opaženo:** v vseh treh primerih se odpre okno brskalnika (`alert` oziroma `confirm`), ne okno
aplikacije. Pri shranjevanju piše »Izbrati moraš vsaj eno stranko.« Besedilo je slovensko,
gumba v oknu pa nista aplikacijina: napiše ju brskalnik v jeziku naprave, torej »OK« in
»Cancel« na napravi, nastavljeni na angleščino.

**Težava in vpliv:** trikrat se zalomi isto. Gumb, ki potrdi ali prekliče, je v tujem jeziku,
čeprav stran pravi `lang="sl"`. Okna ne doseže nobena tema, ker ga ne riše aplikacija. In
dokler okno stoji, stran ne dela ničesar drugega — prav to je najbrž vzrok zastoja, opisanega
v §80.10: zaključek vadbe pred iztekom časa in zaključek brez zabeležene serije odpreta dve
taki vprašanji zaporedoma ([sessionLifecycle.js](src/controllers/sessionLifecycle.js)), in
dokler nanju nihče ne odgovori, se zavihek ne premakne.

**Obseg, preštet v kodi na `main`:** deset klicev `alert` in `confirm` v petih datotekah —
[editSessionControl.js](src/modules/session/editSessionControl.js) (pet),
[sessionLifecycle.js](src/controllers/sessionLifecycle.js) (dva),
[activeSessionController.js](src/controllers/activeSessionController.js),
[sessionScheduleAdjustment.js](src/controllers/sessionScheduleAdjustment.js) in
[clientsView.js](src/modules/clients/clientsView.js). Aplikacija ima svoja okna
(`dialog-modal card glassmorphic`) in jih drugod uporablja.

**Predlog in preverjanje:** vsa ta vprašanja preseliti v okno aplikacije, z gumboma iz
slovarja. Preizkus naj v slovenskem vmesniku prehodi te poti in zahteva, da se ne odpre nobeno
okno brskalnika. Opaženo na objavljeni različici `0625bd6`; klici na `main` so isti.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `f49f7e4`.** All eleven calls go through src/modules/common/appQuestion.js: a yes/no with the action on the confirm button and »Prekliči«, or a message with »V redu«, in the app's language and theme. tests/unit/test_no_browser_dialogs.py fails the build if alert(), confirm() or prompt() comes back.

### 80.36 [x] P2 — »Anonimna kopija za AI« s seboj odnese cilje in zdravstvene opombe — popravljeno 2026-09-27

**Scenarij in koraki:** trener v profilu stranke pritisne »Anonimna kopija za AI«.

**Opaženo:** okno pravi »Anonimni povzetek stranke je kopiran. Varno ga lahko uporabiš z
AI-pomočniki.« Kaj je v odložišču, pove koda:
[clientsView.js](src/modules/clients/clientsView.js) sestavi zapis z vrsticami »Entity: Client
#<id>«, »Goals: <cilji>«, »Health & Mobility Notes: <opombe>« in seznamom vadb.

**Težava in vpliv:** ime je res zamenjano z oznako, cilji in opombe o poškodbah pa gredo zraven
dobesedno. To je prosto besedilo, ki ga piše trener — in prav tja se ime stranke najpogosteje
zapiše (»Ana ima občutljivo koleno«), kar je odprto vprašanje §67. Poleg tega so opombe o
poškodbah zdravstveni podatek. Beseda »Varno« v sporočilu obljublja več, kot kopija naredi:
trener to prilepi v AI-pomočnika, torej k tuji storitvi.

**Predlog in preverjanje:** povedati, kaj kopija vsebuje, preden se ustvari, in dati trenerju
izbiro, ali gre zraven tudi prosto besedilo; sporočilo naj ne trdi, da je uporaba varna, ampak
naj pove, kaj je odstranjeno. Preizkus naj zahteva, da kopija bodisi ne vsebuje polj s prostim
besedilom bodisi da jih sporočilo poimensko napove. Opaženo na objavljeni različici `0625bd6`;
koda na `main` je ista. Povezano z §67.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `1b38205`.** src/domain/aiClientSummary.js copies the client's ID and the performed sessions set by set; no name, contact details, goals or notes. The message says what was left out and no longer calls it safe. The workouts had never reached the copy: it read `completedExercises`, a field workout records do not have.

### 80.40 [x] P1 — Dva odprta zavihka: tisti, ki shrani pozneje, izbriše delo drugega — popravljeno 2026-09-27

**Scenarij in koraki:** aplikacija je odprta v dveh zavihkih (trener odpre povezavo, medtem ko
jo že ima odprto — ali pusti star zavihek odprt).
1. V zavihku A doda stranko »Test A«.
2. V zavihku B (odprtem po tem) doda stranko »Test B«. Zavihek B vidi obe.
3. V zavihku A, ki od koraka 1 ni bil osvežen, doda stranko »Test C«.

**Opaženo:** po osvežitvi obeh zavihkov sta v imeniku »Test A« in »Test C«. **»Test B« je
izginila** — brez vprašanja, brez opozorila, brez sledi. Preverjeno v obeh zavihkih in v
shrambi.

**Vzrok, potrjen v kodi na `main`:** stanje se prebere ob zagonu v pomnilnik, vsako shranjevanje
pa zapiše **celotno** stanje ([stateStore.js](src/data/stateStore.js), `saveToLocalStorage`).
Zavihek A shrani svojo sliko sveta, v kateri »Test B« nikoli ni bilo. V `src/` ni ne
`BroadcastChannel` ne poslušalca dogodka `storage`, torej zavihka drug za drugega ne vesta.

**Težava in vpliv:** to je tiha izguba podatkov pri ravnanju, ki ga nihče ne bi imel za
nevarno — dva odprta zavihka. Trener ne izve nič; stranka, trening ali zapisana vadba preprosto
ni več tam. Aplikacija, ki obljublja, da podatki živijo na napravi, mora to znati preživeti.

**Predlog:** ob vsakem pisanju preveriti, ali je zapis v shrambi novejši od tistega, ki ga ima
zavihek v pomnilniku, in takrat ne pisati čez, ampak brati znova (ali združiti). Najmanjši
popravek, ki odpravi tiho izgubo: zavihek, ki ugotovi, da je shramba novejša, se osveži in
trenerju pove, da je aplikacija odprta še nekje. `BroadcastChannel` je za to dovolj.

**Preverjanje:** preizkus naj v dveh straneh iste izvorne točke naredi zaporedje zgoraj in
zahteva, da po koncu obstajajo vse tri stranke. Opaženo na objavljeni različici `0625bd6`; koda
na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `4b17230`.** One tab saves at a time (src/data/tabOwnership.js): the newest tab to boot claims the turn before it reads, every other tab stops saving and shows »LibrePT je odprt v drugem zavihku« with »Uporabi tukaj«, which reloads it. tests/e2e/test_two_tabs.py runs the scenario above and requires all three clients at the end.

### 80.42 [x] P2 — Izvoz podatkov, ki ga prebere stranka, je v celoti angleški — popravljeno 2026-09-27

**Scenarij in koraki:** trener v profilu stranke pritisne »Izvozi podatke (GDPR)«, prenese
šifrirano datoteko in jo skupaj z geslom pošlje stranki. Stranka jo odpre v aplikaciji prek
menija ☰ z »Open an encrypted file« in vpiše geslo.

**Opaženo:** dešifriranje deluje in vse okoli njega je slovensko — okno, navodila, opozorilo,
naj geslo pošlje po drugi poti. Dokument, ki ga stranka nato bere, pa je angleški od prve do
zadnje vrstice: »# Your training data«, »## About you«, »- Name:«, »- Training goals:«,
»If you believe your data has been mishandled you may complain to your national supervisory
authority.«

**Težava in vpliv:** to je edini dokument v aplikaciji, ki je napisan za stranko in ne za
trenerja, in nastane zaradi njene pravice po GDPR. Prav njen jezik aplikacija pozna — obrazec
ob včlanitvi zapiše `formLang` (v mojem preizkusu `sl`) —, uporabi pa ga ne. Slovenska stranka
dobi pravni dokument v jeziku, ki ga morda ne bere.

**Vzrok, potrjen v kodi na `main`:** [clientDataExport.js](src/data/clientDataExport.js) sestavi
besedilo iz vpisanih angleških nizov; slovarja skoraj ne uporablja.

**Predlog in preverjanje:** besedilo dokumenta peljati skozi slovar in izbrati jezik po
`formLang` stranke, sicer po jeziku aplikacije. Preizkus naj izvozi stranko z `formLang: "sl"`
in zahteva, da naslov dokumenta ni angleški. Opaženo na objavljeni različici `0625bd6`; koda na
`main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `4a5b114`.** The readable export and its email are written in the client's `formLang`, else the app's language; the language travels in the file, so the reader renders it the same way. The German and Slovenian legal paragraphs are a machine translation and need review.

### 80.43 [x] P2 — Če trener ni vpisal svojih podatkov, v dokumentu piše »[trainer name]« — popravljeno 2026-09-27

**Scenarij in koraki:** trener ni izpolnil »Moji podatki« (ti so izrecno neobvezni) in izvozi
podatke stranke po GDPR.

**Opaženo:** dokument se glasi »Prepared 2026-09-27 by **[trainer name]** (**[trainer
contact]**), the data controller for these records.«

**Težava in vpliv:** upravljavec podatkov je pravna vloga; v dokumentu, s katerim trener
odgovarja na zahtevo stranke, ostane oglata oznaka namesto imena. Stranka ne izve, kdo hrani
njene podatke, in trener tega ne opazi, ker se dokument sestavi brez vprašanja.

**Vzrok, potrjen v kodi na `main`:** [clientDataExport.js](src/data/clientDataExport.js) vzame
`trainer.name || "[trainer name]"` in enako za stik.

**Predlog in preverjanje:** izvoz naj ne teče, dokler trener ni vpisal imena in enega stika —
okno naj ju vpraša takrat, ko ju potrebuje, in ne prej. Oglate oznake iz dokumenta odstraniti.
Preizkus naj poskusi izvoziti brez vpisanih podatkov in zahteva, da aplikacija to prepreči.
Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `4a5b114`.** The dialog never passed the trainer, so every document said »[trainer name]«. It now names the trainer; without a name and a contact the export stops and says to fill in Nastavitve → Moji podatki.

### 80.44 [x] P2 — Uvoz programa odgovori na napako v angleščini, z malo začetnico — popravljeno 2026-09-27

**Scenarij in koraki:** trener v meniju ☰ izbere »Uvozi program«, v polje »Prilepi program
sem« prilepi program, kakor bi ga napisal na roko —
»Počep 3x8 60kg / Potisk s prsi 3x10 40kg / odmor 90s« — in pritisne »Odpri v urejevalniku«.

**Opaženo:** okno se ne premakne, pod gumbi pa se izpiše »no programme data found in that
text«. Vse ostalo v tem oknu je slovensko.

**Težava in vpliv:** to je najbolj verjeten izid prvega poskusa, saj trener oblike še ne pozna.
Sporočilo, ki naj bi ga naučilo, kako naprej, je v tujem jeziku in ne pove, kaj naj popravi.

**Obseg, potrjen v kodi na `main`:** [programImport.js](src/domain/programImport.js) ima pet
takih zavrnitev, vse vpisane kot angleški niz: »nothing to read«, »no programme data found in
that text«, »that is not readable as a programme (…)«, »that file says it is …, not …«, »that
programme lists no exercises«.

**Predlog in preverjanje:** vsaka zavrnitev dobi ključ v `en`, `sl` in `de`, sestavo pa naj
pokliče tisti, ki jo pokaže, da domenska koda ostane brez slovarja. Sporočilo naj pove tudi
naslednji korak (»Pritisni Pokaži obliko in primerjaj«). Preizkus naj v slovenskem vmesniku
prilepi neustrezno besedilo in zahteva, da odgovor ni angleški. Opaženo na objavljeni različici
`0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `f066052`.** programImport.js returns a key with its parameters; the dialog says it in the trainer's language and names »Pokaži obliko« where comparing helps.

### 80.45 [x] P3 — »Nikogar posebej« pri uvozu programa vseeno izbere prvo stranko — popravljeno 2026-09-27

**Scenarij in koraki:** trener v »Uvozi program« pusti izbiro »Za koga« na privzetem
»Nikogar posebej«, prilepi program v pravilni obliki (gumb »Pokaži obliko«) in pritisne »Odpri
v urejevalniku«.

**Opaženo:** urejevalnik se odpre z naslovom »Upper Body — Week 1« in podnaslovom »Nenačrtovano
· **Test A**«, poleg pa s cilji in opombami o poškodbah te stranke. Test A je prva stranka v
imeniku; trener je ni izbral.

**Vzrok, potrjen v kodi na `main`:** [app.js](src/app.js), `openImportedProgramme` vzame
`state.clients.find(row => row.id === clientId) || state.clients.find(row => row.active)` —
brez izbire torej prvo dejavno stranko.

**Kaj pri tem ni narobe:** nič se ne zapiše, dokler trener v urejevalniku ne shrani, in ime
stranke je vidno. Zato P3 in ne več.

**Težava:** možnost se imenuje »Nikogar posebej«, aplikacija pa vseeno izbere nekoga — in ob
programu pokaže zdravstvene opombe osebe, ki z njim nima zveze. Aplikacija načrt brez stranke
pozna (`isPlanning`), torej je to izvedljivo.

**Predlog in preverjanje:** brez izbrane stranke naj se program odpre brez nje; polja o
stranki naj ostanejo prazna, dokler je trener ne izbere. Preizkus naj uvozi program z
»Nikogar posebej« in zahteva, da v glavi urejevalnika ni imena stranke. Opaženo na objavljeni
različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `e59dde2`.** The client choice is required: »Izberi stranko« cannot be picked, »Odpri v urejevalniku« waits for a choice, and app.js no longer falls back to the first client. A plan with no client at all would need the clipboard to work without a participant; not built.

### 80.46 [x] P2 — Na podlogi skupinskega treninga sta dve stranki z istim imenom oba »Ana« — popravljeno 2026-09-27

**Scenarij in koraki:** trener naredi trening s tremi udeleženci, med njimi »Test A« in
»Test C«, in ga odpre.

**Opaženo:** zavihki udeležencev se glasijo »TA Test«, »TC Test«, »EP Esc« — v napisu je samo
prva beseda imena. Prvi dve stranki sta na zaslonu razločni le po dveh črkah v krogcu. Pri
pravih imenih to pomeni, da sta »Ana Kovač« in »Ana Novak« obe »Ana«.

**Težava in vpliv:** zavihek je tisto, kar trener med vadbo pritisne, preden vpiše serijo. Če
zgreši, gre izvedba k napačni osebi — in tega pozneje nič ne pokaže kot napako. To je natanko
tista zamenjava, ki je na telovadnici draga.

**Vzrok, potrjen v kodi na `main`:** [utils.js](src/modules/common/utils.js),
`getClientDisplayNameHTML` s `isShort` vzame `client.name.split(" ")[0]`. Vzdevek se doda, če
obstaja — a polje zanj je v obrazcu opisano kot »samo če si dve stranki delita ime«, kar se pri
»Ana Kovač« in »Ana Novak« ne zgodi: delita si samo tisti del, ki ga podloga pokaže.

**Predlog in preverjanje:** ko imata dva udeleženca **istega treninga** enako prvo besedo imena,
naj zavihek pokaže več — začetnico priimka (»Ana K.«, »Ana N.«) — ali pa naj aplikacija takrat
predlaga vzdevek. Preizkus naj sestavi trening z dvema strankama z istim imenom in zahteva, da
se napisa zavihkov razlikujeta. Opaženo na objavljeni različici `0625bd6`; koda na `main` je
ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `3fd4df1`.** A tab adds the surname's initial when another participant of the same session shares the first word (»Ana K.«, »Ana N.«), and shows the full name when even the initials clash.

### 80.47 [x] P3 — »Vsi na ta načrt« preklaplja v obe smeri, napis pa se ne spremeni — popravljeno 2026-09-27

**Scenarij in koraki:** v skupinskem treningu trener v meniju ⋮ izbere »Vsi na ta načrt«.
Zavihki treh udeležencev se združijo v eno vrstico »Skupaj TA · TC · EP«. Nato spet odpre ⋮.

**Opaženo:** v meniju še vedno piše »Vsi na ta načrt«, čeprav so vsi že na enem načrtu.
Ponoven pritisk jih res razdruži nazaj na tri zavihke — torej gumb dela oboje, pove pa samo
eno.

**Vzrok, potrjen v kodi na `main`:** napis je pripet na ključ `bind_participants`
([activeSessionOverlayView.js](src/modules/clipboard/activeSessionOverlayView.js)). Ključ za
drugo smer **obstaja in je preveden v vseh treh jezikih** — `unbind_participants`
(»Vsak svoj načrt«, »Give everyone their own plan«, »Jedem einen eigenen Plan geben«) — in ga
nihče ne uporabi: v `src/` ni nobenega klica.

**Težava in vpliv:** trener, ki je vse združil in si premislil, na zaslonu ne vidi poti nazaj.
Poskusi jo lahko le tako, da pritisne isto vrstico, ki pravi nasprotno od tega, kar bo storila.

**Predlog in preverjanje:** ob združenem stanju izpisati `unbind_participants`, kakor je
očitno bilo mišljeno. Preizkus naj po združitvi zahteva, da vrstica menija ne pravi več »Vsi na
ta načrt«. Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `2a5e17f`.** Bound, the row reads `unbind_participants` (»Vsak svoj načrt«); unbound, »Vsi na ta načrt«.

### 80.48 [x] P3 — Trening, ki se konča pred svojim začetkom, se shrani brez besede — popravljeno 2026-09-27

**Scenarij in koraki:** trener v obrazcu za nov trening vpiše začetek 18:00 in konec 09:00 —
ura, ki jo je zgrešil, ali popravek, pri katerem je pozabil na drugo polje. Doda stranko in
shrani.

**Opaženo:** aplikacija shrani brez pripombe. Kartica na plošči se glasi »18:00 - 09:00 …
Se začne čez 06h 39m«, podloga pa »1970-01-01 · 18:00 - 09:00« (datum je §80.7). Trening torej
traja minus devet ur.

**Težava in vpliv:** iz takega zapisa se izračuna odštevanje, podaljšek in trajanje vadbe ob
zaključku; vse to je od tod naprej narobe in trener tega ne izve, dokler mu številke ne
zaškripajo. Napaka pri vnosu ure je na telefonu z eno roko običajna, zato jo je vredno ujeti
takoj.

**Preverjeno v kodi na `main`:** preverbe razmerja med začetkom in koncem v
[editSessionControl.js](src/modules/session/editSessionControl.js) ni; v slovarjih ni ključa za
tako napako.

**Predlog in preverjanje:** ob shranjevanju preveriti, da je konec za začetkom, in to povedati
pri polju, ne v oknu brskalnika (§80.19). Trening čez polnoč, če je mišljen, naj bo izbira in ne
tiha posledica. Preizkus naj poskusi shraniti 18:00–09:00 in zahteva, da aplikacija to zavrne s
sporočilom ob polju. Opaženo na objavljeni različici `0625bd6`.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `4eeeb2f`.** An end before the start is refused at the end field (»Trening se konča, preden se začne. Preveri uro konca.«); 00:00 stays allowed as midnight.

### 80.49 [x] P3 — Pri brisanju enega večera ponavljajočega se treninga ni povedano, da gre za en večer — popravljeno 2026-09-27

**Scenarij in koraki:** trener odpre en večer ponavljajočega se treninga in v meniju ⋮ izbere
»Izbriši trening«.

**Opaženo:** vprašanje se glasi »Izbriši ta trening? Odstranjen bo z urnika, zabeležen napredek
in povratne informacije pa bodo izgubljeni — program vsakega udeleženca se ohrani med
nenačrtovanimi programi.« O ponavljanju ne pove ničesar. Preizkušeno: izbriše se res samo ta
večer, ostali ostanejo.

**Težava in vpliv:** pri urejanju istega večera aplikacija obseg pove naravnost (»To je en
večer ponavljajočega se treninga. Kar spremeniš tukaj, velja samo za ta večer.«), pri brisanju
pa ne. Trener, ki tega ne ve, se bo brisanja izogibal ali pa se bo bal, da je pobrisal vse
torke do konca leta.

**Predlog in preverjanje:** ko ima trening `seriesId`, naj vprašanje doda isti stavek o obsegu,
in naj po možnosti ponudi tudi »izbriši vse prihodnje večere«. Preizkus naj pri večeru serije
zahteva, da je v vprašanju beseda o enem večeru. Opaženo na objavljeni različici `0625bd6`.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `acbad9a`.** For an evening of a series, both delete paths add »To je en večer ponavljajočega se treninga. Izbriše se samo ta večer, ostali ostanejo.« Deleting all future evenings is not offered; that would be a feature of its own.

### 80.4 [x] P3 — Po izbiri slovenščine del osnovnega vmesnika ostane angleški — popravljeno 2026-09-27

**Scenarij in koraki:** ob prvem obisku izbrati »Slovenščina«, začeti s prazno
aplikacijo, odpreti meni, dodati stranko in odpreti njen profil.

**Opaženo:** seznam treningov kaže »Dates«, »Client«, »Location« in »No sessions
scheduled.« Meni vsebuje »Add a client from their own details« in »Open an encrypted
file«. Profil kaže »Pridružil se Sep 26, 2026«.

**Težava in vpliv:** jezik ni dosleden prav pri začetnih opravilih; datum uporablja
angleško ime meseca in drugačen vrstni red. Oteži razumevanje brez dokumentacije.

**Predlog in preverjanje:** ob menjavi jezika osvežiti tudi že izrisane filtre in
menijske možnosti; datum prikazati v obliki ISO. Preveriti začetni prehod iz angleščine
v slovenščino ter ponovni obisk posebej. Ponovni obisk še ni preizkušen.
Preverjeno na objavljeni različici `0625bd6`.

**Verdikt 2026-09-26 (Claude): potrjeno na `main`, in to niso ena, ampak tri ločene napake.**
Codexova diagnoza »osvežiti že izrisane« je pravilna; oznaka P3 je prenizka, ker gre pri datumu
za kršitev pravila projekta.

- **[x] Popravljeno 2026-09-26 (Claude), commit `f847eb4` (§81.1).** **Koren: jezikovna menjava je napisana dvakrat, en izvod je nepopoln.** `onChooseLanguage` na
  pozdravnem zaslonu ([app.js](src/app.js)) pokliče `applyTranslations(lang)` in `saveState()`
  in nič več. Stikalo v meniju ☰ ([applicationHeader.js](src/modules/common/applicationHeader.js))
  pa poleg tega ponovno izriše sedem pogledov —
  `renderClientsList`, `renderRoutinesList`, `renderExercisesList`, `renderGlobalHistory`,
  `renderPendingPlanAdjustments`, `renderSessions`, `populateDropdownSelectors`.
  `applyTranslations` prepiše le označeno besedilo v postavitvi; vse, kar JavaScript sestavi s
  `t(...)`, ostane v jeziku zagona. Zato »Dates«, »Client«, »Location« in »No sessions
  scheduled.« — ključi `filter_dates`, `filter_client`, `filter_location` in
  `no_sessions_scheduled` so v [sl.js](src/i18n/sl.js) vsi prevedeni, nihče jih ni vprašal.
  Popravek je **ena** funkcija, ki jo kličeta obe poti, ne drugi izvod seznama. **V §81.1**, ki na
  to isto pot dodaja še korak teme in korak podatkov.
- **[x] Popravljeno 2026-09-27 (Claude), commit `c3a057e` (§81.2).** **Dve vrstici menija nimata prevoda nikjer.** `#menu-review-signup` in `#menu-open-encrypted`
  nista niti v tabeli `staticMappings` v [domMappings.js](src/i18n/domMappings.js) niti nosita
  atributa `data-i18n`; vse sosednje vrstice so v tabeli. Ostaneta angleški v slovenščini in
  nemščini. **V §81.2**, ki obe vrstici prestavi — prvo med gumbe imenika strank, drugo v
  *Data management* — in kjer morata dobiti ključa v `en`, `sl` in `de`.
- **[x] Datum: popravljeno 2026-09-26 (Claude), commit `3461d92`.** To ni bila nova odločitev,
  ampak nedokončan §54, ki je že zahteval ISO datum v vsakem jeziku. `formatDateStr` v
  [utils.js](src/modules/common/utils.js) je sestavljal »Sep 26, 2026« iz trdo vpisanega
  seznama angleških okrajšav mesecev, v ameriškem vrstnem redu. §54 je popravil pretekle kartice
  deka in si je v [exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js)
  napisal lokalni ovoj prav zato, ker skupne funkcije ni mogel poklicati — te pa ni popravil.
  Codex je videl profil stranke; ista funkcija je pisala tudi vsako vrstico zgodovine
  ([historyView.js](src/modules/history/historyView.js)). Zdaj kliče `getISODateString`, ki je v
  isti datoteki, dek pa je svoj lokalni izvod opustil, tako da je oblikovalec datuma spet en.
  Varovalka za manjkajoč ali neberljiv datum ostaja v `formatDateStr` in ne gre v
  `getISODateString`, ki mu devetnajst klicnih mest izroči datum, ki ga že ima. Pripeto v
  [utils.test.mjs](tests/unit_js/modules/common/utils.test.mjs).

**Še ni preizkušeno:** ponovni obisk po izbiri jezika.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `95369f8`.** The three defects were fixed earlier (f847eb4, c3a057e, 3461d92); the return visit is now tested: after choosing Slovenian at the first run and reloading, the page and the menu are Slovenian.

### 80.24.1 [x] P3 — Pet slovenskih besedil še piše končnico v oklepaju, »(-a)« — popravljeno 2026-09-27

Najdeno 2026-09-27 ob popravku izvoza (§80.42), ne v raziskovalnem preizkusu. Oblika »ostal(-a)« se
bere kot obrazec za izpolnjevanje, ne kot stavek. Ključi v [sl.js](src/i18n/sl.js):
`walkthrough_off_track` (»Zapustil(-a) si …«), vabilo k vpisu podatkov (»Vabljen(-a) si …«), kartica
peskovnika (»… kjer si ostal(-a)«), »Moji podatki« (»… ki si jih vpisal(-a) …«) in prazna plošča
(»… preizkušati sam(-a) …«). Predlog: vsako preoblikovati brez preteklega deležnika, ki nosi spol,
kot pri §80.24 — na primer »pristaneš tam, kjer si ostal(-a)« → »vrneš se na isto mesto«.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `5ef85c0`.** Eight texts, not five: the two welcome titles and the off-track title too. Each reworded without a gendered past participle; tests/unit_js/i18n/genderNeutral.test.mjs fails the build on a bracketed ending.

### 80.50 [x] P2 — Stran, na kateri stranka odgovori na vabilo, kaže »12:00 PM« in »Thursday, October 8« — popravljeno 2026-09-27

**Scenarij in koraki:** trener v slovenski aplikaciji naredi trening za 2026-10-08 ob 12:00 in
stranki pošlje vabilo. V vabilu (slovenskem) je povezava »Sporoči mi, ali lahko prideš«.
Stranka jo odpre.

**Opaženo:** stran je v angleščini (`<html lang="en">`): »WHEN | Thursday, October 8 at 12:00 PM
(60 min) | You can answer here for another 260 h 28 min | Can you make it? | Yes, I'll be there
| Not sure yet | No, I can't«.

**Dve različni napaki:**
1. **Ura in datum.** »12:00 PM« je dvanajsturni zapis, »Thursday, October 8« pa ni ISO. Projektno
   pravilo zahteva 24-urni čas in ISO datum **povsod in v vsakem jeziku**, in prav zato, ker
   `toLocale…` vpraša napravo. [rsvpView.js](src/modules/rsvp/rsvpView.js), `formatWhen`, kliče
   `start.toLocaleString(lang, {weekday, day, month, hour, minute})` — torej napravo vpraša za
   obliko. To drži tudi, če je jezik strani pravi.
2. **Jezik.** Stran izbere jezik iz `?lang=` v povezavi ali iz jezikov brskalnika
   ([app.js](src/app.js), `resolveIntakeLang`). Povezava, ki jo trener pošlje, jezika ne nosi —
   torej slovenska stranka z angleško nastavljenim telefonom dobi angleško stran, čeprav je bilo
   vabilo slovensko in aplikacija jezik stranke pozna (`formLang` iz obrazca ob včlanitvi).

**Težava in vpliv:** to je prvo, kar stranka od LibrePT sploh vidi, in edini zaslon, kjer sama
nekaj odgovori. Ura v tuji obliki je poleg tega natanko tista napaka, zaradi katere se pride ob
napačnem času.

**Predlog in preverjanje:** `formatWhen` naj sestavi zapis iz aplikacijinih pripomočkov
(`formatClockFromEpoch`, ISO datum), ne iz `toLocaleString`. V povezavo vabila dodati `lang`, ki
ga aplikacija pozna. Preizkus naj odpre povezavo vabila v brskalniku, nastavljenem na `en-US`, in
zahteva 24-urni zapis ure ter ISO datum. Opaženo na objavljeni različici `0625bd6`; koda na
`main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `86aefd7`.** The reply page shows the ISO date and the 24-hour clock with the weekday in the page's language; the invite link carries `lang`, the language the invitation was written in.

### 80.51 [x] P1 — Stranka izbere odgovor na vabilo, poslati pa ga nima s čim — popravljeno 2026-09-27

**Scenarij in koraki:** trener svojih podatkov ni vpisal — pozdravni zaslon pravi, da so
neobvezni — in pošlje vabilo. Stranka odpre povezavo in pritisne »Yes, I'll be there«.

**Opaženo:** stran odgovori »You're saying yes. Send it so your trainer knows.« in »This opens
your own messaging app with the reply ready — nothing is sent until you send it.« **Gumba za
pošiljanje ni.** V HTML sta (»Send as a text«, »Send as an email«), oba skrita.

**Vzrok, potrjen v kodi na `main`:** [rsvpView.js](src/modules/rsvp/rsvpView.js) prikaže gumb za
SMS samo, če vabilo nosi trenerjevo telefonsko številko, in gumb za e-pošto samo, če nosi
e-naslov. Brez trenerjevih podatkov vabilo ne nosi ne enega ne drugega, zato ostaneta oba skrita
— navodilo nad njima pa vseeno govori o pošiljanju.

**Težava in vpliv:** zanka vabila se tiho pretrga na zadnjem koraku, in to pri stranki, ne pri
trenerju. Trener čaka odgovor, ki ne more priti, in ne izve, da se je to zgodilo. Podatki
trenerja so povsod predstavljeni kot neobvezni, tu (in pri izvozu po GDPR, §80.43) pa so pogoj.

**Predlog:** vabila brez trenerjevega stika sploh ne ponuditi — ob pošiljanju vprašati za
številko ali e-naslov in to shraniti. Če vabilo vseeno pride brez stika, naj stran stranki pove,
kaj naj stori (»odgovori svojemu trenerju po poti, po kateri sta v stiku«), namesto navodila o
gumbu, ki ga ni.

**Preverjanje:** preizkus naj z izpraznjenimi trenerjevimi podatki odpre povezavo vabila, izbere
odgovor in zahteva, da je na zaslonu pot naprej. Opaženo na objavljeni različici `0625bd6`; koda
na `main` je ista.

**Fixed 2026-09-27 (Claude Opus 5.5), commit `16af98c`.** With neither a phone nor an email on the invite, the page says »Odgovor sporoči trenerju tako, kot sta običajno v stiku.« New installs cannot reach this: the welcome screen writes the trainer's phone and email on every path, and the invite dialog fills them in.

### 81.6 [x] The backup password is stored, safely — done 2026-09-28

**Ruled 2026-09-27 (Simon):** *"geslo za varnostne kopije naj bo shranjeno in poiščiva varen način
za shranjevanje gesel za varnostne kopije."*

**What it depends on:** backups are not encrypted today (§18.8 decided to encrypt them and parked
it). A stored backup password means encrypting backups — the file and Drive — with it.

**Researched 2026-09-27, primary sources read:**

- **A key the app can use but nobody can read out.** WebCrypto keeps a derived key as a `CryptoKey`
  whose `extractable` flag decides *"whether or not the key may be extracted using exportKey() or
  wrapKey()"* ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)). The interface is
  `[Serializable]`, so it can be kept in IndexedDB, and serialising keeps the flag: *"Set
  serialized.[[Extractable]] to the [[extractable]] internal slot of value"*
  ([W3C Web Crypto](https://www.w3.org/TR/WebCryptoAPI/)). So the password is never stored — only a
  key derived from it, with `extractable: false`.
- **A key unlocked by fingerprint or face.** The WebAuthn `prf` extension gives a value per passkey
  that *"can be used to generate a symmetric key for encrypting sensitive data, and that can only be
  decrypted by a user who has the seed and the associated authenticator"*
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/WebAuthn_extensions)).
  Nothing is stored at all. Support per [caniuse](https://caniuse.com/mdn-api_credentialscontainer_create_publickey_option_extensions_prf):
  Chrome 116+, Safari and iOS 18+, Firefox 139+ (partial from 135), Samsung Internet 24+.

**What neither protects against:** someone holding the unlocked phone can open the app and restore a
backup. What they do protect: a backup file or Drive copy that leaves the phone, and the key itself
from being copied out of the browser.

**The risk a stored password creates:** the backup exists for a lost phone. If the password lives only
on that phone, the backup on Drive cannot be opened on the new one. The trainer must keep it
elsewhere as well, and the app must say so when it is set.

**Recommended:** the non-extractable key in IndexedDB now — no prompt at each backup, works offline
and in every browser the app supports — with *forget the password* in Data management, and PRF as a
later option. **Blocks:** Simon's choice of the storage (non-extractable key, PRF, or both), then
§18.8's encryption of the backup itself.

**Done 2026-09-28 (Claude Opus 5), on Simon's *"prosim zagotovi, da bodo varnostne kopije kriptirane
in šifrirni ključi varno shranjeni"*.** The recommendation above is what shipped: a non-extractable
`CryptoKey` in the meta store, derived from the password with a fresh salt, and no copy of the password
anywhere. The WebAuthn `prf` unlock stays a later option — Firefox and older Safari do not support it,
so it cannot be the only way in.

**What the research above did not settle, and building it did:**

- **The key is derived from a password, not generated.** The note called this a risk to warn about; it
  is the whole design. A random key living on one phone makes every Drive copy unreadable on the day
  that phone is lost, which is the day a backup exists for. So the trainer keeps six readable words,
  the device keeps a key derived from them, and the dialog says to write the words somewhere else.
- **Changing the password does not re-encrypt old files**, because nothing can reach a file already on
  Drive or in somebody's mailbox. The dialog says so when it is a change rather than a first setting.
- **It is set at the first export, not in a settings screen.** The export is the moment the trainer is
  thinking about the file. Declining cancels the export instead of quietly writing a plain one.
- **Where *forget the password* went:** under *Export Data Backup* in the Sync & Backup dialog, not in
  Data management as this note proposed. The state line that says whether backups are encrypted has to
  live where the backup is taken, and splitting the answer from the two acts that change it would put
  them in two places.

### 80.57 [x] P1 — Decimalna vejica spremeni 2,5 kg v 25 kg brez opozorila — popravljeno 2026-09-29

**Scenarij in koraki:** slovenski trener v načrt »Par z vzdevkoma« doda ročno vajo
»Dvig rok z lahkima utežema«. Polje KG označi v celoti in s tipkovnico vpiše »2,5«,
pritisne Tab ter »Končano z urejanjem načrta«.

**Opaženo:** polje po vnosu kaže »25«, nima validacijskega opozorila, v načrtu se
izpiše »S3 × R10 × 25 kg«. Ponovno odprto urejanje še vedno kaže 25. Enak vnos s piko,
»2.5«, ohrani pravilno vrednost in v načrtu pokaže »2.5 kg«. Testni načrt je popravljen
na to vrednost. Zabeleženih napak brskalnika ni.

**Okolje:** objavljena različica `0625bd6`, Chrome CDP, 390 × 844, jezik aplikacije
slovenščina, `navigator.language` je `en-US`. Gre za tipkanje znakov, ne neposredno
spreminjanje vrednosti prek JavaScripta. Preizkus drugega jezika brskalnika še ni izveden.

**Težava in vpliv:** običajen slovenski decimalni zapis postane desetkrat večja
obremenitev, ki je videti veljavna. Trener mora napako opaziti in vrednost popraviti.

**Predlog in preverjanje:** sprejeti decimalno vejico in piko ali neustrezen ločilni
znak jasno zavrniti; nikoli ga tiho izpustiti. Pri slovenski aplikaciji na brskalniku
en-US preveriti vnose »2,5«, »0,5« in »2.5« ter prikaz ob ponovnem odprtju načrta.
Ugotovitev temelji samo na objavljenem vmesniku, brez preverjanja kode.

**Popravljeno 2026-09-29 (`857bc6a`).** Polja za težo so besedilna polja z decimalno tipkovnico
(`inputmode="decimal"`), ne `type="number"`, ki bere ločilo po jeziku telefona. En bralnik
(`parseDecimal` v `repsAndLoad.js`) sprejme vejico in piko; vrednost, ki je ne zna prebrati, polje
označi kot neveljavno. Velja za urejevalnik načrta, gradnik rutine, okno za dodajanje vaje in okno
za prilagoditev. Test: `test_a_decimal_comma_is_the_same_load_as_a_decimal_point`.

### 80.53 [x] P2 — Načrt treninga, vpisanega za nazaj, po osvežitvi izgine — popravljeno 2026-09-29

**Scenarij in koraki:** trener popoldne odpre jutranji trening, ki ga ni začel v aplikaciji, v meniju ⋮
izbere »Uredi načrt«, vpiše vaje in pritisne »Končano«. Nato osveži stran (ali mu telefon stran naloži
znova).

**Opaženo:** načrt je spet takšen, kot ga da rutina. Našel podagent v dnevu trenerja 02 (§88), ki je
jutranje treninge vpisoval popoldne; ponovljeno na `main`: pri treningu, ki je minil pred več kot dvema
urama, preimenovana vaja po osvežitvi izgine, pri prihodnjem treningu ostane.

**Vzrok, potrjen v kodi na `main`:** `isCachedSessionStale` v
[sessionClock.js](src/domain/sessionClock.js) šteje shranjen odprt trening za pozabljenega, ko je več kot
dve uri čez načrtovani konec, in ga obnova zavrže. Merilo je konec termina, ne zadnja sprememba — tudi
ko trener trening ureja prav zdaj.

**Težava in vpliv:** vpis za nazaj je običajen (trener po jutranjem sklopu vpiše, kar je naredil), in
prav tam se delo izgubi brez besede. P2, ker ga ne zadene vsak dan in ker trening ni izbrisan, le načrt.

**Predlog in preverjanje:** zastarelost meriti od zadnje spremembe odprtega treninga, ne samo od konca
termina. Preizkus naj uredi načrt treninga, ki je minil pred tremi urami, osveži in zahteva spremembo.

**Popravljeno 2026-09-29 (`6011a11`).** Vsaka sprememba načrta zapiše `planEditedAt`, merilo
zastarelosti pa šteje od najpoznejšega od konca termina, začetka in te spremembe. Sprememba rok le
podaljša: podloga brez termina še vedno ne zastara. Testa:
`test_a_plan_written_up_after_its_slot_survives_reload` in enotni test merila.

### 80.55 [x] P3 — Kartica treninga pravi samo »Nedoločen«, trener pa to bere kot stanje — popravljeno 2026-09-29

**Scenarij in koraki:** trening brez izbrane rutine na plošči treningov.

**Opaženo:** v vrstici kartice stoji »• Nedoločen« z ikono odložišča. Trenerka v dnevu trenerja 05 (§88)
je to prebrala kot stanje udeležbe in iskala, kje ga spremeni v »prišla«.

**Vzrok, potrjen v kodi na `main`:** [sessionCard.js](src/modules/sessionList/sessionCard.js) izpiše
`t("undefined")` (»Nedoločen«, »Undefined«), ko trening nima rutine. Beseda ne pove, kaj je nedoločeno.

**Težava in vpliv:** na plošči, ki jo trener bere med vadbami, beseda brez predmeta zavaja. P3.

**Predlog in preverjanje:** napis naj pove, česa ni (»Rutina ni izbrana«), ali pa naj ga ni. Preizkus
naj pri treningu brez rutine zahteva besedilo, ki imenuje rutino.

**Popravljeno 2026-09-29 (`e3cb306`).** Vrstica »Nedoločen« je odstranjena, skupaj s slogom in
ključem `undefined`. Ista kartica ima že opozorilo »Program ni določen«, ki pove, kaj manjka. Test:
`test_a_session_without_a_routine_says_which_thing_is_missing`.

### 80.56 [x] P2 — Iskanje strank ne najde vidnega vzdevka — popravljeno 2026-09-29

**Scenarij in koraki:** trener vodi dve stranki z enakim imenom »TEST Luka Kovač«.
Prvi v obrazcu doda vzdevek »jutranji«, drugi »večerni«, različna izmišljena e-naslova
in različna cilja. Obe shrani. V imeniku poišče »Luka«, nato »jutranji« in »večerni«.

**Opaženo:** »Luka« pokaže obe kartici z ustreznima vzdevkoma in ciljema. Vsak vzdevek
zase pokaže »Strank ni mogoče najti. Klikni "Dodaj stranko", da jo ustvariš.«
Po izbrisu iskalnega niza sta obe stranki spet vidni. Prestreznik napak ni zabeležil napak.
Preizkus: objavljena različica `0625bd6`, Chrome CDP, 390 × 844, slovenščina.

**Težava in vpliv:** trener ne more poiskati stranke po razlikovalnem podatku, ki ga je
vnesel prav zaradi podvojenega imena. Sporočilo ga pri tem usmerja v ustvarjanje nove stranke.

**Predlog in preverjanje:** iskanje naj upošteva tudi vzdevek. Pri nič zadetkih naj ponudi
brisanje filtra. Ponoviti opisani scenarij: vsak vzdevek mora vrniti samo ustrezno stranko.
Po izrecnem navodilu uporabnika gre za ugotovitev iz vmesnika; kode in stanja na `main`
v tem nadaljevanju ne preverjamo.

**Dopolnitev:** enako v nastavitvi treninga: »večerni« vrne »Stranke s tem imenom ni«,
»Luka« pa obe pravilno označeni možnosti. Vzdevek naj upoštevata oba iskalnika.

**Popravljeno 2026-09-29 (`bdffa49`).** Obe iskanji, v imeniku in pri dodajanju udeleženca, iščeta
po imenu in vzdevku (`clientNameMatches` v `utils.js`). Predlog, da prazen zadetek ponudi brisanje
iskalnega niza, ni narejen. Testa v `test_clients_directory.py` in
`test_session_participant_picker.py`.

### 80.61 [x] P2 — Konec ponavljanja pred začetkom se shrani brez opozorila — popravljeno 2026-09-29

**Scenarij in koraki:** trener ustvari »Serija z obrnjenim obdobjem« za TEST Luka
Kovač (večerni), Studio, 2026-11-10 16:00–16:45. Označi »Ponovi vsak teden«, torek,
in v »Do« vpiše 2026-11-03. Pritisne »Odpri v beležki«, zapre vabila in trening ter
ponovno odpre urejanje kartice. Enako nastavitev ponavljanja preveri še ob urejanju.

**Opaženo:** shranitev uspe brez opozorila na končni datum pred začetnim. Na seznamu
je en termin, pri ponovnem urejanju ponavljanje ni označeno. Pri drugem poskusu sta
bila pred shranitvijo izrecno preverjena označeni torek in »Ponovi vsak teden« ter
datuma 2026-11-10 in 2026-11-03. Tudi ta poskus ne pokaže validacijskega sporočila.

**Težava in vpliv:** tipkarska napaka v obdobju se spremeni v navidezno uspešno
shranjevanje; trener lahko meni, da je pripravil serijo, čeprav vidi samo en termin.

**Predlog:** ob koncu pred začetkom ustaviti shranitev in označiti polje »Do«, da
trener popravi datum. Preveriti tako ustvarjanje kot urejanje serije. Opaženo na
objavljeni `0625bd6`, sl, Chrome CDP, 390 × 844, brez branja kode. Med scenarijem ni
novih prestreženih napak; ostaneta dve opozorili prejšnjega preizkusa brez povezave.

**Popravljeno 2026-09-29 (`c6514e1`).** `validateSeries` zavrne serijo, ki se konča pred začetkom,
obrazec pa shranitev ustavi pri polju »Do« z besedilom »Ponavljanje se konča pred prvim treningom.
Izberi datum na dan prvega treninga ali pozneje.« Konec na dan prvega treninga je dovoljen. Test:
`test_a_repeat_that_ends_before_it_starts_is_refused_at_the_field`.

### 80.64 [x] P3 — Prazna plošča po filtrih reče »Počisti jih«, ne pove pa, kje — popravljeno 2026-09-29

**Scenarij in koraki:** v peskovniku z vzorčnimi podatki na plošči »Treningi« izbrati
»Lokacija« → »zunanje igrišče«, nato še »Stranka« → »Priya Patel«.

**Opaženo:** plošča pokaže »Tem filtrom ne ustreza noben trening. Počisti jih, da vidiš vso
ploščo.« Gumb za to je ✕ desno od obeh filtrov, brez besedila; velik je 32 × 31 pikslov.
Izbrana filtra sta odrezana na »Priya Pa…« in »zunanje …«. ✕ filtre pravilno počisti.

**Težava in vpliv:** trener ne izve, kateri gumb počisti filtre, in ✕ je manjši od palca.
Iz odrezanega imena ne vidi, katera lokacija je izbrana, če se dve imeni začneta enako.

**Predlog:** sporočilo naj imenuje gumb in mesto, na primer »Pritisni ✕ desno od filtrov,
da vidiš vso ploščo.«; ✕ naj ima velikost za palec; izbrano ime naj se prebere v celoti. Odrezano
besedilo je preverjeno na posnetku zaslona. Opaženo na objavljeni `0625bd6`, sl, 390 × 844;
brez napak v konzoli.

**Popravljeno 2026-09-29 (`4556509`).** Sporočilo reče »Pritisni ✕ desno od filtrov, da vidiš vso
ploščo.«, gumba v vrstici filtrov pa merita najmanj 44 × 44. Odrezana imena na čipih ostanejo: ozka
izbirna seznama sta Simonova odločitev (2026-09-11, zapisana v `sessionFilterBar.css`). Test:
`test_every_control_in_the_filter_row_is_a_thumb_wide`.

### 80.65 [x] P3 — Vzorčna obvestila v peskovniku omenjajo stranke in trening, ki jih ni — popravljeno 2026-09-29

**Scenarij in koraki:** pritisniti »Razišči z vzorčnimi podatki«, odpreti predal »Obvestila in
pregled stanja« na dnu zaslona in prebrati kartici »📅 Rezervacija mesta za stranko« in
»👋 Raziskujete z vzorčnimi podatki«. Nato pritisniti »Poglej vzorčne stranke« in odpreti
petkov trening »HIIT kondicija« (2026-10-02, 10:00).

**Opaženo:** kartica pravi »Alex Smith je rezerviral mesto za petkov HIIT.« in »Mike Johnson je
odpovedal mesto za jutri ob 10:00.« V »Imenik strank« ni ne Alexa Smitha ne Mika Johnsona;
na petkovem HIIT sta Jane in John; jutri (2026-09-29) ni treninga ob 10:00. Druga kartica
ima naslov »Raziskujete z vzorčnimi podatki« (vikanje), besedilo pod njim pa »Razišči brez
skrbi« (tikanje), kot vsa druga besedila v aplikaciji.

**Težava in vpliv:** trener, ki spoznava aplikacijo, išče Alexa na petkovem treningu in ga ne
najde. Sklepa lahko, da rezervacija ni bila shranjena, ali da obvestila ne kažejo resničnega
stanja. Mešanje vikanja in tikanja v eni kartici deluje nedokončano.

**Predlog:** vzorčno obvestilo naj imenuje stranko in trening, ki sta v peskovniku res, in dan,
ki se ujema s ploščo; naslov naj bo v tikanju (»Raziskuješ z vzorčnimi podatki«). Opaženo na
objavljeni `0625bd6`, sl, 390 × 844; brez napak v konzoli.

**Popravljeno 2026-09-29 (`ff074df`).** Obvestili imenujeta Johna Smitha na treningu HIIT kondicija
in Mika Chena, ki odpove Jutranjo kondicijo jutri ob 09:00; dneva v tednu ni, ker so vzorčni
treningi postavljeni glede na današnji dan. Angleški »10:00 AM« je odpravljen, naslov je v tikanju.
Test v `seedBoard.test.mjs` zahteva, da obvestili govorita o vzorcu.

### 80.66 [x] P2 — Vrstica nad dnom pri prihodnjem treningu kaže stoječo številko za napačen dan — popravljeno 2026-09-29

**Scenarij in koraki:** v peskovniku z vzorčnimi podatki ob 23:51 (ponedeljek 2026-09-28) na
plošči »Treningi« pritisniti petkov trening »HIIT kondicija« (2026-10-02, 10:00–11:00).
Nato enako z »Moč nog« (sreda 2026-09-30, 08:00–09:30).

**Opaženo:** vrstica nad dnom zaslona pokaže »HIIT kondicija 2 strank · 10:00 - 11:00
35:07:25«. Kartica istega treninga na plošči pravi »Se začne čez 82h 07m«. 35 ur in 7 minut od
23:52:37 je sreda ob 11:00, dva dni pred koncem petkovega treninga. Pri »Moč nog« vrstica
pokaže »33:37:49«, kar je točno konec treninga v sredo ob 09:30. Pri obeh številka stoji:
po 10 sekundah je enaka. Ob ponovnem odprtju je manjša za toliko, kolikor je minilo časa.
Ob številki ni besede, ki bi povedala, do česa šteje.

**Težava in vpliv:** trener ne ve, ali številka pomeni čas do začetka, do konca ali že
pretečeni čas, in ob petkovem treningu kaže napačen dan. Številka, ki ne teče, je videti kot
ustavljen trening.

**Predlog:** pri treningu, ki se še ni začel, naj vrstica pove z besedo, kdaj se začne (kot
kartica: »Se začne čez …«), in naj šteje od pravega dne; številka naj teče. Opaženo na
objavljeni `0625bd6`, sl, 390 × 844; brez napak v konzoli.

**Popravljeno 2026-09-29 (`0f54706`, `2f4b262`).** Vzrok napačnega dne: podloga je dan treninga
računala iz vedra »upcoming« (vedno čez dva dni). Isto vedro je odločalo o prekrivanju, zato so se
vsi prihodnji treningi ob isti uri (vsak torek in četrtek ob 18:00) združili v eno podlogo. Oboje
zdaj bere koledarski datum treninga. Pred začetkom vrstica reče »Se začne čez …« in teče vsakih 30
sekund; odštevanje do konca začetega treninga ostane.

### 80.67 [x] P3 — Čip »Datumi« zapiše izbrano obdobje kot »5. okt. – 11. okt.«, ne v ISO — popravljeno 2026-09-29

**Scenarij in koraki:** v peskovniku na plošči »Treningi« pritisniti »Datumi«, v koledarju
pritisniti 5 in nato 11 v vrstici oktobra pod septembrom.

**Opaženo:** čip se glasi »5. okt. – 11. okt.«. Plošča pod njim piše datume kot »2026-10-06«
in »2026-10-08«. Filter sam deluje pravilno: pokaže samo treninga 2026-10-06 in 2026-10-08.
Koledar se ob pritisku zunaj njega ne zapre, zapre ga šele ponovni pritisk na čip.

**Težava in vpliv:** isti datum je na enem zaslonu v dveh oblikah; obdobje čez novo leto
(»28. dec. – 3. jan.«) ne pove leta.

**Predlog:** čip naj piše obdobje v obliki ISO, na primer »2026-10-05 – 2026-10-11«, kot vsi
drugi datumi v aplikaciji. Opaženo na objavljeni `0625bd6`, sl, 390 × 844; brez napak v konzoli.

**Popravljeno 2026-09-29 (`65d67c4`).** Čip piše obdobje kot »2026-10-05 – 2026-10-11«. Vrstica
čipov se ob daljšem napisu prelomi, ne štrli. Zapiranje koledarja ob pritisku zunaj njega ni
spremenjeno: zapre ga ponovni pritisk na čip.

### 80.58 [x] P2 — Prvi termin tedenske serije ima dve enaki kartici — popravljeno 2026-09-29

**Scenarij in koraki:** ustvariti »Nedeljska moč«, Studio, 2026-10-18, 09:00–09:45,
ponavljanje ob nedeljah do vključno 2026-11-01, udeleženec TEST Luka Kovač (večerni),
rutina SIM Osnovna moč. Shraniti, zapreti neodposlana vabila in trening, pregledati seznam
ter osvežiti stran. Namen scenarija je bil preveriti termine čez oktobrski premik ure.

**Opaženo:** 2026-10-18 ima dve kartici »Nedeljska moč« z enakim časom in udeležbo.
2026-10-25 in 2026-11-01 imata vsaka eno. Štiri kartice ostanejo tudi po osvežitvi.
Obe prvi kartici odpreta isti naslov treninga (ID `034WBB1veZioyikcozc7gC`).
To potrjuje podvojen prikaz, ne nastanka dveh zapisov v podatkovni zbirki.
Vse tri nedelje pravilno ohranijo lokalno uro 09:00–09:45 v časovnem pasu Europe/Ljubljana.
Preizkus na objavljeni `0625bd6`, Chrome CDP, 390 × 844, sl; brez zabeleženih napak.

**Težava in vpliv:** trener vidi dva prekrivajoča se termina in lahko sklepa, da je
trening ustvaril dvakrat. Ker oba vodita na isti trening, bi popravljanje domnevnega
dvojnika lahko prizadelo načrtovani termin.

**Predlog in preverjanje:** en termin naj ima eno kartico. Ponoviti opisano serijo in
zahtevati tri kartice, po eno na vsako nedeljo, tudi po ponovnem nalaganju. Preverjeno
samo prek vmesnika, brez branja kode; vzrok ni ugotovljen.

**Dodatno opažanje pri GDPR-izvozu iste stranke:** šifrirano datoteko smo odprli v
vgrajenem bralniku. V razdelku »Sessions (4)« sta dve enaki vrstici za Nedeljsko moč
2026-10-18 09:00–09:45. Torej podvajanje ni omejeno na kartici: vidno je tudi v
izvozu. Ponavljanji 2026-10-25 in 2026-11-01, ki ju plošča kaže, v tem izvozu nista
navedeni. Preverjanje naj zato zajame tudi dosleden seznam terminov v izvozu.

**Popravljeno 2026-09-29 (`d2204a2`).** Vzrok: obrazec je shranil trening in pravilo serije, pravilo
pa je isti večer izpeljalo še enkrat, ker shranjeni trening ni bil označen kot njegov večer. Zdaj ga
`claimFirstEvening` označi (`seriesId`, `occurrenceDate`), kadar pravilo ta datum res ustvari. Del o
izvozu po GDPR (izpeljani večeri niso navedeni) ni obravnavan. Test:
`test_the_first_evening_of_a_new_repeat_is_on_the_board_once`.

### 80.59 [x] P2 — Neveljavni datum se brez pojasnila zamenja z drugim dnevom — popravljeno 2026-09-29

**Scenarij in koraki:** trener pri novem treningu »Kontrola datuma« vpiše 2027-02-29,
09:00–09:45, Studio, izbere testno stranko in shrani. V ločenem osnutku s tipkovnico
vpiše 2027-04-31, pritisne Tab, nato enako preveri 2028-02-29.

**Opaženo:** prvi datum se spremeni v 2027-02-28 in trening je na seznamu na tem dnevu.
31. april se ob zapustitvi polja spremeni v 30. april, brez validacijskega sporočila.
Veljavni prestopni datum 2028-02-29 ostane pravilen. Primerjalni osnutek je zavržen.
Objavljena `0625bd6`, sl, Chrome CDP, 390 × 844; brez zabeleženih napak brskalnika.

**Težava in vpliv:** trenerjeva tipkarska napaka postane drug veljaven termin brez
pojasnila. Spremembo lahko spregleda in nato stranko povabi na napačen dan.

**Predlog in preverjanje:** neveljavni dan označiti in zahtevati popravek ali vidno
pojasniti predlagano spremembo, preden se termin shrani. Veljavni 29. februar naj
ostane nespremenjen. Gre za opažanje vmesnika in predlog izboljšave; kode nismo brali.

**Popravljeno 2026-09-29 (`aaa4e20`).** Polje dan še vedno premakne na resničnega (zapisana namera v
`dateField.js`), pod njim pa zdaj piše »2027-02-29 ne obstaja. Izbran je 2027-02-28.«, dokler trener
ne vtipka ali pritisne česa drugega. Test:
`test_a_day_that_does_not_exist_is_moved_and_the_field_says_so`.

### 80.60 [x] P1 — Kartica »Sled predloge« odpre drug trening z drugima terminom in udeležbo — popravljeno 2026-09-29

**Scenarij in koraki:** v istem profilu obstajata »Par z vzdevkoma« (jutranji in večerni
TEST Luka Kovač, jutri 18:30–19:30) in »Sled predloge« (jutranji Luka, rutina SIM Osnovna
moč). Drugi trening začeti pred načrtovanim časom, izbrati »Prilagodi čas« (v preizkusu
danes 18:41–19:26), odpreti Dumbbell Bicep Curl in označiti »Pretežko«. Zapreti trening,
ustvariti »Naslednji obisk« za večernega Luko 2026-09-29 17:00–17:45. Zapreti vabila
brez pošiljanja, se vrniti na seznam in odpreti kartico z naslovom »Sled predloge«.

**Opaženo:** kartica kaže »Sled predloge«, 18:41–19:26 in eno mesto. Odprti pogled pa
kaže »Par z vzdevkoma«, pod njim »Sled predloge«, jutri 18:30–19:30 in oba udeleženca.
Naslov strani vsebuje ID treninga Par z vzdevkoma (`034WAw24qVRnACeQo4mLV3`), medtem
ko je Sled predloge pred tem imel `034WB6QrvMesM2tyJDKucm`. Ponovljeno s klikom kartice,
izbrane po njenem točnem naslovu; enak rezultat tudi po osvežitvi. Namesto zaključka
prejšnje aktivne vadbe je v odprtem pogledu gumb za začetek. Po osvežitvi obvestilo
»Pretežko« pripada »TEST Luka Kovač — Par z vzdevkoma«.

**Težava in vpliv:** trener iz seznama ne pride do pričakovanega treninga; prikaz
združi ime izbrane vadbe s terminom in udeleženci druge. Nadaljnji vnos bi lahko
pripisal napačnemu treningu. To niso samo nejasna imena dveh istoimenskih oseb.

**Predlog in preverjanje:** naslov, termin, udeleženci in povratne informacije naj
ob odprtju ustrezajo izbrani kartici. Preizkusiti opisano prekinitev aktivne vadbe
z načrtovanjem druge in vrnitev, tudi po osvežitvi. Vzrok in najmanjši nabor potrebnih
korakov še nista ugotovljena. Objavljena `0625bd6`, Chrome CDP, 390 × 844, sl;
brez zabeleženih napak brskalnika, brez pregleda kode.

**Popravljeno 2026-09-29 (`0f54706`, `090de6f`).** Vzrok izpeljan iz kode, ne ponovljen v
brskalniku: »Prilagodi čas« je trening premaknil na danes, shranjeno vedro `day` pa je ostalo
»tomorrow«. Prekrivanje se je računalo po vedru, zato se je trening združil z jutrišnjim »Par z
vzdevkoma« ob isti uri, podloga pa je dobila id prvega od njiju. Prekrivanje zdaj primerja
koledarski datum, prilagoditev pa premakne tudi vedro. Testa: enotni test v `utils.test.mjs` in
`test_tomorrows_session_moved_onto_today_is_shown_as_today`.

### 80.63 [x] P2 — Časovna vaja v sklopu izgubi oznako trajanja — popravljeno 2026-09-29

**Scenarij in koraki:** v jutrišnjem treningu »Vrstni red vaj« pri stranki TEST Luka
Kovač (jutranji · Studio A) zamenjati samostojno vajo z Wall Sit iz kataloga,
nastaviti vrednost 25 in končati urejanje. Nato spet odpreti »Uredi načrt«, razširiti
Wall Sit ter pri »Sklop« izbrati »+ Nov sklop«. Končati urejanje brez spremembe 25.

**Opaženo:** samostojna kartica kaže »S3 × 0:25 × BW«. Ista vaja v sklopu kaže
»KROG 1 / 3«, »Wall Sit« in »25 · BW«. Številka nima oznake sekund ali zapisa časa.
Pri prej sestavljenem dvokrožnem sklopu je bilo enako z vrednostjo »20 · BW«.

**Težava in vpliv:** trener med krožno vadbo ne vidi, ali številka pomeni ponovitve
ali trajanje. Da potrdi predvideno držo, mora znova v urejevalnik ali si podatek
zapomniti. Premik v sklop spremeni jasnost istega navodila.

**Predlog:** pri časovnih vajah tudi v sklopu prikazati »0:25« ali »25 s«; ohraniti
razlikovanje med številom ponovitev in trajanjem ob premikanju vaje v sklop in iz
njega. Opaženo na objavljeni `0625bd6`, sl, Chrome CDP, 390 × 844; brez novih
prestreženih napak brskalnika in brez pregledovanja kode.

**Popravljeno 2026-09-29 (`7e8fc99`).** Vrstica v sklopu zapiše vrednost s `formatMetricValue`, kot
samostojna kartica: »0:25«. Test: `test_a_timed_movement_in_a_circuit_says_its_time`.

### 80.52 [x] P2 — Gumb »Shrani« je ob odprtju obrazca pod robom zaslona — popravljeno 2026-09-29

**Kako je prišlo na dan:** ne iz scenarija, ampak iz Simonovega ugovora (2026-09-27). Zapisal sem,
da bo podagent brez konteksta poročal lažne napake, ker ne zna voziti gonilnika; Simon je odgovoril,
da je to vprašanje oblike — če je aplikacija pretežka za uporabo, je treba popraviti aplikacijo.
Izmeril sem in ima prav.

**Izmerjeno v brskalniku na objavljeni različici `0625bd6`,** ob odprtju okna, preden je vanj kaj
vpisano:

| okno              | zaslon 390×844                | zaslon 320×680            |
| :---------------- | :---------------------------- | :------------------------ |
| »Dodaj stranko«   | »Shrani« 133 pik pod robom    | **387 pik pod robom**     |
| »Ustvari rutino«  | »Shrani« 55 pik pod robom     | —                         |
| »Dodaj vajo«      | viden (vrh pri 678)           | —                         |

**Težava in vpliv:** edina pot do shranitve ob odprtju ni na zaslonu. Trener, ki hoče popraviti eno
polje — na primer označiti privolitev —, se mora prebiti čez cel obrazec, da pride do gumba. Na
najmanjšem telefonu je to več kot pol zaslona drsenja. Novi uporabnik ob tem sklepa, da obrazca ni
mogoče shraniti; prav to se je zgodilo pri preizkusu, dvakrat, in obakrat sem najprej okrivil svoje
orodje namesto aplikacije.

**Predlog:** vrstica z dejanji (»Prekliči« in »Shrani«) naj se drži dna okna, telo obrazca pa naj
drsi pod njo. Gumb je tako viden ves čas, na vsaki višini zaslona, in shranitev je en dotik od
koder koli v obrazcu. Pri tem preveriti §80.41: ✕ in Esc obdržita vpisano, »Prekliči« pa ga zavrže,
kar ob vedno vidnem gumbu postane še bolj vidno neskladje.

**Preverjanje:** preizkus naj na treh širinah odpre vsak obrazec z gumbom za shranitev in zahteva,
da je ta ob odprtju znotraj zaslona. To je ista vrsta meritve kot §80.25 (velikost tarč) in sodi v
isti preizkus geometrije.

**Popravljeno 2026-09-29 (`597c906`).** Vrstica z dejanji se v vsakem oknu drži dna okna, obrazec pa
se pomika pod njo, na ozadju okna. Velja za vsa okna z `.modal-actions`, torej tudi za »Ustvari
rutino«. Neskladje iz §80.41 (✕ in Esc obdržita vpisano) ostane odprto tam. Test:
`test_save_is_on_the_screen_when_the_client_form_opens` na 390×844 in 320×680.

### 80.68 [x] P2 — Križec ✕, ki zapre okno, meri 12 × 16 pik — popravljeno 2026-09-29

**Scenarij in koraki:** v peskovniku odpreti »Imenik strank« → »Dodaj stranko«, in »Knjižnica
vaj« → »Dodaj vajo«. Izmerjeno z ukazom `measure` (način 3 veščine), zaslon 390 × 844.

**Opaženo:** v obeh oknih je ✕ zgoraj desno (»Zapri«) velik 12 × 16 pik. Vse druge kontrole v
obeh oknih so dovolj velike.

**Težava in vpliv:** najmanjša tarča v oknu je prav tista, s katero trener okno zapre. Na telefonu
v eni roki jo zgreši in pritisne okno pod njo ali polje obrazca. Po pravilu 2026-09-17 ✕ vpisano
obdrži, zato zgrešen pritisk ne izgubi podatkov, stane pa ponovni poskus.

**Predlog:** ✕ naj ima tarčo najmanj 44 × 44, znak sam je lahko manjši. Preizkus naj v vsakem
oknu zahteva, da je gumb za zapiranje velik vsaj toliko. Opaženo na objavljeni `0625bd6`, sl,
390 × 844; brez napak v konzoli.

**Popravljeno 2026-09-29 (`fdfaffb`).** Tarča ✕ meri najmanj 44 × 44 v vsakem oknu; znak ostane
majhen, negativni rob ohrani višino glave. Test:
`test_the_cross_that_closes_the_form_is_a_thumb_wide`.

### 80.72 [x] P2 — Ocena obrazca »Ustvari rutino« — popravljeno 2026-09-29

Način 3. Naloga (podagent): začetniška rutina s petimi vajami, Plank na čas. Pot: ☰ → »Vaje in
rutine« → »Ustvari rutino«. `main` na `e55bbd2`, sl, 390 × 844. Iskalno polje izbirnika vaj je bilo
16 pik visoko v okvirju 38 pik in pritisk na okvir ga ni izbral — `e844d16`. Plank je bil v katalogu
vaja s ponovitvami, čeprav ga vse vzorčne rutine predpisujejo s časom — `5d00270`. Čipi izbirnika
(26 pik) in vrstice vaj (37 pik) ostanejo pod mero za palec; sodijo k odločitvi v §80.25.

### 80.73 [x] P1 — »Sinhroniziraj podatke« je zamenjal trenerjeve treninge z vzorčnimi — popravljeno 2026-09-29

V »Središče za sinhronizacijo in varnostne kopije« je kartica »Sinhroniziraj podatke o treningih«
obljubljala rezervacije iz povezanega koledarja. Koledarja ni: po 1,2 sekunde je vse treninge v pravem
delovnem prostoru zamenjala z 20 angleškimi vzorčnimi in izpisala »Koledar je bil uspešno
sinhroniziran!«. Preizkušeno na `main`; trenerjev trening je izginil. Odstranjeno v `080ab10`, s ključi
in handlerjem; test `test_sync_and_backup_offers_no_calendar_it_does_not_have`.
