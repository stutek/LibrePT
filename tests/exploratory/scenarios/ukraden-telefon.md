---
type: exploratory-test
title: "Ukraden telefon — trenerju sredi tedna ukradejo telefon"
description: "Scenarij za raziskovalni preizkus z AI trenerjem na dveh napravah: telefon A ukradejo v sredo, na novem telefonu B trener obnovi podatke iz zadnje kopije."
tags: [exploratory, trainer-week, ukraden-telefon, dve-napravi, kopija]
---

# Ukraden telefon

Teden: [W-01-03](../weeks/W-01-03.md) (Nina Krajnc, Celje), skrajšan na ponedeljek do četrtek.

## Scenarij — to dobi trener, skupaj s tednom

V ponedeljek in torek delaš na svojem telefonu (naprava A) kot vedno. V sredo ob 12:30 ti telefon
ukradejo iz omarice v telovadnici; od tega trenutka ga nimaš več. Ob 15:00 kupiš nov telefon
(naprava B) in na njem nadaljuješ teden do četrtka. Geslo za kopijo poznaš le, če si ga zapisala
takrat, ko ti je aplikacija rekla, naj ga zapišeš.

## Za orkestratorja — trener tega ne vidi

**Postavitev.** Dva brskalnika, vsak na svojih vratih (`EXPLORE_PORT`); po kraji naprava A ne dobi
nobenega ukaza več razen `stop` na koncu. Kopija potuje kot datoteka (`download`, `upload`); v Google
Drive se orodje ne more prijaviti, zato pot prek Drive preveri Simon ročno.

**Kaj preizkus odgovori:**
- Kaj od tedna ostane in od kod (zadnja kopija v datoteki, Drive), in kaj je izgubljeno.
- Koliko dotikov in minut stane, da je na novem telefonu spet vse, in kaj mora trener vedeti (geslo,
  kje je datoteka).
- Kaj aplikacija na obeh napravah reče o tem, kje so podatki in ali so varni; ali je to res.
- Kaj se zgodi s podatki strank na ukradenem telefonu, med njimi z zdravstvenimi opombami, in ali
  lahko trener ukradenemu telefonu odvzame dostop do Drive.

**Odigrano:** s01, 2026-10-10 na `166d3c8`. Obnovitev iz torkove kopije je delovala (13 dotikov,
okoli 6 minut); izgubljeno je bilo, kar je trener vpisal v sredo dopoldne. Ugotovitve (po oznaki v
TODO.md ali TODO_ARCHIVE.md): F-s01-03, F-s01-04, F-s01-05, F-s01-06, F-s01-07, F-s01-08, F-s01-13.
