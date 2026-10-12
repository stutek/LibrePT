---
type: index
title: AI-driven manual exploratory tests
description: Invented trainer weeks and two-device scenarios that an AI trainer lives through the app's screens; no gate runs them.
tags:
  - index
  - tests
  - exploratory
  - okf
---

# AI-driven manual exploratory tests

Each file here is a test that an AI agent runs by hand, through the screens, as a personal trainer
who has never seen the app. The exploratory-test skill says how, in its part *A week from the
catalog* ([SKILL.md](../../.agents/skills/exploratory-test/SKILL.md)). No gate runs these tests and
they assert nothing: a run produces findings, which are judged and written to TODO.md.

- **weeks/** — 37 weeks of an invented personal trainer in Slovenia. Agents that had never seen the
  app wrote 100 of them on 2026-10-10; these are the 37 scored 5 of 5 for realism. A week is in
  Slovenian, as the trainer lives it.
- **scenarios/** — a week lived on two devices: a phone stolen mid-week, or a computer beside the
  phone.

**Every file has two parts.** The first, *Teden* or *Scenarij*, is all the trainer is given. The
second, *Za orkestratorja*, is never given to the trainer: the realism score and every run so far,
with the finding ids it produced, which TODO.md or its archive hold.

**A week is not a specification.** It was written without the app, and that is what it measures: how
much of a real week the app carries. A feature designed from a week here makes that week measure
nothing.

## Scenarios

| Scenario                                                              | What happens                                                   | Week    |
| :-------------------------------------------------------------------- | :------------------------------------------------------------- | :------ |
| [dve-napravi](scenarios/dve-napravi.md)                               | Dve napravi                                                    | W-05-01 |
| [ukraden-telefon-nova-shema](scenarios/ukraden-telefon-nova-shema.md) | Ukraden telefon, novi telefon ima novejšo različico aplikacije | W-01-03 |
| [ukraden-telefon](scenarios/ukraden-telefon.md)                       | Ukraden telefon                                                | W-01-03 |

## Weeks

| Week                        | Trainer and week                                                                                                                                     | Runs |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :--- |
| [W-01-03](weeks/W-01-03.md) | Nina Krajnc, 29, najeta soba v Celju, teden, ko počita cev in studio dva dneva ni uporaben                                                           | 3    |
| [W-01-05](weeks/W-01-05.md) | Maja Bizjak, 38, najeta soba v Kopru in obiski na domu v Izoli, poln teden z burjo v sredo                                                           | 1    |
| [W-01-06](weeks/W-01-06.md) | Jaka Zorman, 26, deljen prostor na Bežigradu, miren teden mladega trenerja in iskanje novih strank                                                   | 0    |
| [W-01-09](weeks/W-01-09.md) | Vilma Kalan, 58, lastni studio v kleti hiše v Celju, teden, ko stranke obvesti o novi ceni od 1. novembra                                            | 0    |
| [W-02-02](weeks/W-02-02.md) | Boštjan, 47 let, trener v hotelskem fitnesu na Bledu, konec sezone, konferenca v četrtek in zamenjava izmene s kolegico                              | 1    |
| [W-02-03](weeks/W-02-03.md) | Žan, 26 let, trener v univerzitetnem športnem centru v Mariboru, začetek semestra, v soboto dan odprtih vrat                                         | 0    |
| [W-02-05](weeks/W-02-05.md) | Nejc, 24 let, trener v večjem verižnem fitnesu v Celju, konec meseca, cilj prodaje in odprti vikend                                                  | 1    |
| [W-02-08](weeks/W-02-08.md) | Dejan, 39 let, trener v fitnesu v Novi Gorici, v soboto vodi tekmovalca na državnem prvenstvu v Mariboru in zamenja izmeno s kolegico                | 0    |
| [W-02-09](weeks/W-02-09.md) | Bojana, 52 let, trenerka v občinskem športnem centru v Slovenj Gradcu, z izplačilnim listom pride razlika v proviziji                                | 0    |
| [W-03-04](weeks/W-03-04.md) | Darja, 52 let, krožna vadba za ženske nad 45 let na Mariborskem otoku, poln teden s prijavami po SMS                                                 | 1    |
| [W-03-06](weeks/W-03-06.md) | Nataša, 38 let, vadba na plaži v Portorožu, tih teden ob koncu sezone z zadnjo skupino v soboto                                                      | 0    |
| [W-03-07](weeks/W-03-07.md) | Jaka, 27 let, gibalna vadba za otroke in starše na igrišču v Celju, teden z nadomeščanjem zaradi prehlada                                            | 1    |
| [W-03-08](weeks/W-03-08.md) | Urša, 45 let, skupina »Jezerski krog« na Bledu, teden z ledom v četrtek in testnim tekom v soboto                                                    | 1    |
| [W-03-10](weeks/W-03-10.md) | Ines, 40 let, nordijska hoja in vadba za starše z otroki v Murski Soboti, deževen teden z vadbo prek videa in pohodom v nedeljo                      | 0    |
| [W-04-04](weeks/W-04-04.md) | Marjana, 47 let, bivša medicinska sestra v Celju, stranke brez pametnega telefona, na koncu tedna sestanek s svojci                                  | 0    |
| [W-04-05](weeks/W-04-05.md) | Blaž, 36 let, trener na slovenski obali, vadba po stanovanjih in na promenadi, burja v četrtek razbije načrt                                         | 0    |
| [W-04-06](weeks/W-04-06.md) | Nina, 33 let, trenerka v Novem mestu, vadba po operaciji hrbtne ploščice, v četrtek ima njen glavni pacient kontrolo pri kirurgu                     | 0    |
| [W-04-07](weeks/W-04-07.md) | Franc, 58 let, trener po Pomurju z 400 km vožnje na teden, vasi brez signala, nova stranka v petek                                                   | 1    |
| [W-04-08](weeks/W-04-08.md) | Andraž, 38 let, mobilni trener v Kamniku in Domžalah, v torek zboli in stranke prevzame kolegica, v nedeljo pride hči iz Nemčije                     | 0    |
| [W-04-09](weeks/W-04-09.md) | Petra, 44 let, kineziologinja v Ljubljani, skupina v dnevnem centru in stranke z demenco in multiplo sklerozo, miren teden z izobraževanjem v soboto | 1    |
| [W-04-10](weeks/W-04-10.md) | Sašo, 31 let, trener na Gorenjskem, ta teden pripravlja stranko na operacijo kolena v ponedeljek, prve zimske gume in dolga vožnja v Bohinj          | 0    |
| [W-05-01](weeks/W-05-01.md) | Maja, 34 let, večinoma online stranke po Evropi in v Avstraliji, en dan v tednu živi treningi v Ljubljani                                            | 2    |
| [W-05-04](weeks/W-05-04.md) | Franci, 58 let, Celje, trideset let v poklicu, miren teden, v katerem se prvič uči video klice s stranko v Argentini                                 | 0    |
| [W-05-06](weeks/W-05-06.md) | Blaž, 29 let, zaposlen v fitnesu v Ljubljani, ta teden nadomešča kolega in ob strani vodi tri online stranke v tujini                                | 0    |
| [W-05-08](weeks/W-05-08.md) | Matjaž, 41 let, Ljubljana, vadba za podjetje z zaposlenimi v treh državah in nekaj osebnih strank; v petek skupni tek ekipe                          | 1    |
| [W-05-10](weeks/W-05-10.md) | Nejc, 36 let, Bohinj, konec turistične sezone: gostje v živo, ki nato nadaljujejo online, in slab signal v dolini                                    | 0    |
| [W-07-04](weeks/W-07-04.md) | Gregor, 47 let, trener za sladkorno bolezen in visok tlak v Kranju, teden z nizkim sladkorjem med uro                                                | 1    |
| [W-07-05](weeks/W-07-05.md) | Nada, 58 let, trenerka za osteoporozo in ljudi po raku na obali, miren teden, v soboto prva vadba Ane po obsevanju                                   | 0    |
| [W-07-07](weeks/W-07-07.md) | Jernej, 39 let, trener skupin za kronične bolnike v Velenju, poln teden z dvema skupinama in službo                                                  | 0    |
| [W-08-08](weeks/W-08-08.md) | Krištof, 31, štiri leta v poklicu: Ptuj, podnajem v tuji telovadnici, ki se v četrtek zapre zaradi popisa, šest strank, miren teden                  | 0    |
| [W-09-01](weeks/W-09-01.md) | Jan, programer, ob strani trener: jutra ob šestih v fitnesu, miren tedenski ritem z eno prestavitvijo                                                | 0    |
| [W-09-09](weeks/W-09-09.md) | Rok, študent ekonomije z delom v trgovini: v soboto tekma v powerliftingu, ki jo vodi kot trener svojega tekmovalca                                  | 1    |
| [W-10-04](weeks/W-10-04.md) | Gašper, 47 let, Kranj: v petek izprazni stari studio, v soboto prvi trening v novem                                                                  | 0    |
| [W-10-06](weeks/W-10-06.md) | Luka, 26 let, Koper: prvi teden kot samostojni podjetnik s štirimi strankami                                                                         | 1    |
| [W-10-08](weeks/W-10-08.md) | Rok, 38 let, Velenje: direktor mu dolguje 480 € in tri tedne obljublja plačilo                                                                       | 1    |
| [W-10-09](weeks/W-10-09.md) | Urban, 31 let, Ptuj: treningi v kleti brez signala, ki ga v sredo zalije dež                                                                         | 0    |
| [W-10-10](weeks/W-10-10.md) | Primož, 44 let, Kranj: od četrtka do nedelje je s smučarskim klubom na ledeniku v Avstriji                                                           | 1    |
