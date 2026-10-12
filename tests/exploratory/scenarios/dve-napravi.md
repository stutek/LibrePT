---
type: exploratory-test
title: "Dve napravi — načrti na računalniku, trening na telefonu"
description: "Scenarij za raziskovalni preizkus z AI trenerjem: trener zvečer sestavi načrte na računalniku in zjutraj vodi trening na telefonu."
tags: [exploratory, trainer-week, dve-napravi, kopija]
---

# Dve napravi

Teden: [W-05-01](../weeks/W-05-01.md) (Maja Kovač, Ljubljana, večinoma spletne stranke), skrajšan
na nedeljo zvečer, ponedeljek in torek.

## Scenarij — to dobi trener, skupaj s tednom

Doma imaš računalnik (naprava A) in telefon (naprava B). V nedeljo zvečer na računalniku vpišeš
stranke in sestaviš načrte za ponedeljek in torek. Na telefon jih preneseš tako, kot ti dovoli
aplikacija. Treninge vodiš s telefonom. Ko kaj spremeniš na eni napravi, mora biti to tudi na drugi.

## Za orkestratorja — trener tega ne vidi

**Postavitev.** Dva brskalnika, vsak na svojih vratih (`EXPLORE_PORT`): A z oknom 1280 × 800, B kot
telefon. Kopija potuje kot datoteka (`download`, `upload`); v Google Drive se orodje ne more
prijaviti, zato pot prek Drive preveri Simon ročno.

**Kaj preizkus odgovori:**
- Kako načrti pridejo na telefon (Drive, datoteka) in koliko dotikov in minut to stane.
- Kaj se zgodi, če isti načrt ali termin spremeniš na obeh napravah.
- Ali je urejanje na širokem zaslonu udobno: aplikacija je stolpec, širok 480 pik.
- Kaj pride na napravo B in česa ni, primerjano z napravo A.

**Odigrano:** s02, 2026-10-10 na `166d3c8`. Prenos prek šifrirane datoteke je deloval; dveh naprav
ni mogoče združiti brez Drive, ker uvoz datoteke zamenja vse na napravi (F-s02-05). Ugotovitve (po
oznaki v TODO.md ali TODO_ARCHIVE.md): F-s02-01, F-s02-02, F-s02-04, F-s02-05, F-s02-06, F-s02-07,
F-s02-08, F-s02-09.
