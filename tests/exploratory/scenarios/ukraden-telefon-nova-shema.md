---
type: exploratory-test
title: "Ukraden telefon, novi telefon ima novejšo različico aplikacije"
description: "Scenarij za raziskovalni preizkus z AI trenerjem: kopija s starega telefona se obnovi v aplikacijo, ki že bere novejšo shemo podatkov."
tags: [exploratory, trainer-week, ukraden-telefon, dve-napravi, kopija, shema]
---

# Ukraden telefon, novi telefon ima novejšo različico aplikacije

Teden: [W-01-03](../weeks/W-01-03.md) (Nina Krajnc, Celje), skrajšan na ponedeljek do sredo.
Različica scenarija [ukraden-telefon.md](ukraden-telefon.md).

## Scenarij — to dobi trener, skupaj s tednom

V ponedeljek in torek delaš na svojem telefonu (naprava A). V torek zvečer narediš kopijo. V sredo ob
12:30 ti telefon ukradejo. Kupiš nov telefon (naprava B), na katerem je že nova različica aplikacije,
in na njem obnoviš podatke iz torkove kopije.

## Za orkestratorja — trener tega ne vidi

**Postavitev.** Kot pri [ukraden-telefon.md](ukraden-telefon.md), in še: naprava A bere privzeto
(sproščeno) shemo, naprava B shemo `PREVIEW`. Shemo, ki jo naprava bere, izbere ključ
`librept_read_schema` v brskalniku te naprave. Pred tekom preveri, kateri shemi sta živi na različici,
ki jo preizkušaš; ko `PREVIEW` dobi številko, ta scenarij potrebuje novo par shem.

**Kaj preizkus odgovori:** ali obnovitev v novejšo shemo prenese vse (stranke, termine, načrte,
zaključene treninge, opombe, nastavitve), in kaj trener med tem vidi.

**Odigrano:** s03, 2026-10-11, A na shemi `6`, B na `PREVIEW`. Obnovitev je vrnila vse. Našel je dve
napaki, obe popravljeni: prazen urnik po obnovitvi (F-s03-07) in termin iz sheme 1 brez seznama
udeležencev. Ugotovitve (po oznaki v TODO.md ali TODO_ARCHIVE.md): F-s03-01, F-s03-02, F-s03-03,
F-s03-05, F-s03-06, F-s03-07, F-s03-08, F-s03-09, F-s03-10.
