---
type: log
title: Poročilo tedna r08
description: Rok Vidmar, trener v Celju, je teden 12.–18. oktober 2026 vodil z LibrePT; poročilo o vrzelih in napakah.
tags: [exploratory, trainer-week]
---

## Povzetek

Aplikacija je prenesla sestavljanje in vodenje posameznega treninga (ustvarjanje termina, vaje, opombe, zaključek), tudi brez povezave, kar je ocena približno tretjine mojega tedna. Vse, kar je okoli treninga (paketi, plačila, teža, tekma, mesečni seznam za lastnika, 12-tedenski cikel), nima mesta in je ostalo v zapiskih, WhatsAppu in Excelu. Največja vrzel: ne morem zapisati, kaj je stranka dejansko dvignila (F-r08-06), največja napaka: prestavitev termina na drug dan izbriše načrt vaj (F-r08-15).

## Naloge

| dan | naloga | ocena 0–3 | min z aplikacijo | min brez nje |
|---|---|---|---|---|
| pon | vnos mojih podatkov in 6 strank | 2 | 10 | 0 |
| pon 08:00 | Tilen, zadnji težki trening | 1 | 25 | 5 |
| pon 20:30 | teža Tilna + poskus varnostne kopije | 1 | 6 | 1 |
| tor 15:40 | načrt Eve in Lucije brez povezave | 2 | 20 | 3 |
| tor 17:00 | Eva | 1 | 6 | 4 |
| tor 18:30 | Lucija | 2 | 6 | 2 |
| tor 21:00 | seznam za tekmo | 0 | 0 | 3 |
| sre 08:00 | Tilen, lahek trening, začetni poskusi | 2 | 12 | 3 |
| sre 20:30 | kofein, odgovor Tilnu | 0 | 0 | 2 |
| čet 15:35 | Domen, prestavitev in trening | 1 (načrt izginil) | 6 | 2 |
| pet 08:30 | Maja, intervali | 2 | 10 | 2 |
| pet 10:00 | klic organizatorja | 0 | 0 | 5 |
| pet 20:45 | Tilen ne spi | 0 | 0 | 3 |
| sob 08:15 | tekma Tilna | 1 | 15 | 5 |
| sob 16:00 | plačilo 60 € | 1 | 3 | 0 |
| sob 20:00 | Maja prestavljena na sredo | 1 (načrt izginil) | 6 | 1 |
| ned 09:00 | Tilen, nov 12-tedenski cikel | 0 | 5 | 20 |
| ned 11:00 | seznam treningov za lastnika | 0 | 5 | 30 |
| ned 19:00 | načrt za naslednji teden | 1 | 3 | 10 |

Opomba: minute z aplikacijo so merjene s številom ukazov, ne z uro; stroj je bil počasen.

## Vrzeli

1. F-r08-06 — dejanskih serij, ponovitev in bremen ni mogoče zapisati (P1); pri tekmi 9 poskusov samo kot besedilo. Okoli 5 min na trening.
2. F-r08-17 — mesečni seznam za lastnika in evidenca plačil (P2); 30–45 min na mesec.
3. F-r08-18 — 12-tedenski cikel je 36 ločenih terminov (P2); nekaj ur za cikel.
4. F-r08-01 — paket, cena in plačilo stranke nimajo polja (P2); okoli 10 min na teden.
5. F-r08-08 — telesna teža brez zapisa meritev (P2).
6. F-r08-12 — bolečina v kolenu brez lestvice 0–10 (P2).
7. F-r08-04 — v katalogu ni mrtvega dviga (P2); F-r08-10 — ni hip thrusta, čas vaje brez enote (P3).
8. F-r08-16 — intervali brez polja za hitrost in odmor (P3).
9. F-r08-13 — seznam za tekmo / opravila (P3).
10. F-r08-11 — brez povezave brez znaka; okno za vabila v koledar (P3).

## Napake

1. F-r08-15 (P1) — prestavitev termina na drug dan (Uredi → datum → Shrani) izbriše načrt vaj. Potrjeno pri Domnu in pri Maji.
2. F-r08-09 (P1) — varnostna kopija: »Izvozi JSON« ne da datoteke; okno pravi, da vsebina predogleda ni vključena; na vrhu piše »OGROŽENO — NAREDI KOPIJO«, kopije pa ni mogoče narediti.
3. F-r08-14 (P2) — »Shrani kot rutino« iz treninga postavi vsa bremena na 0.
4. F-r08-07 (P3) — pohvala in opomba sta »opozorilo« in »nerešen signal«.
5. F-r08-05 (P3) — imena vaj angleška (Barbell Back Squat).
6. F-r08-02 (P3) — gumb »Menu / Meni«.
7. F-r08-03 (P3) — seznam strank je kazal stranko, ki še ni bila shranjena (morda posledica prekinjenega ukaza).

Zunaj ugotovitev: orodje za zagon je med tednom enkrat poslalo nekaj ukazov v tuj brskalnik (skupna datoteka v /tmp je bila prepisana); podatki mojega brskalnika niso bili prizadeti.

## Dnevi, ki jih nisi dosegel

Dosegel sem vseh sedem dni. Robert Lenart ta teden nima treninga in ga nisem uporabil.

<!-- konec poročila r08 -->
