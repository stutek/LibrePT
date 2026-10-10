---
type: log
title: Poročilo s05 - dve napravi
description: Teden z računalnikom (A) in telefonom (B), od nedelje 11. do torka 13. oktobra 2026, in kaj je kje končalo.
tags: [exploratory, trainer-week]
---

## Povzetek

Aplikacija je nosila ves moj kratek teden: vpis štirih strank in sestava štirih načrtov na računalniku, prenos na telefon z datoteko, štiri vadbe na telefonu in pregled na računalniku. Največja vrzel: dveh naprav ni mogoče združiti. Uvoz datoteke zamenja vse na napravi, zato ob mojem ponedeljkovem večeru (popravka na računalniku, po pomoti drugačen popravek na telefonu) ena stran izgubi delo druge, aplikacija pa tega ne pove. Na široku zaslonu računalnika aplikacija ostane v 480 px stolpcu, zato sestavljanje načrtov ni lažje kot na telefonu.

## Naloge

Naprava A je računalnik (1280×800), B telefon (390×844). Minute so ocena števila ukazov (en ukaz je približno 4 s na tem stroju), ne ure na uri.

| dan | naloga | ocena 0-3 | minute z aplikacijo | minute brez nje |
|---|---|---|---|---|
| ned 11. 10. | A: profil trenerja, začni prazno, 4 stranke | 3 | 6 | 0 |
| ned 11. 10. | A: termin pon 17:00 Jure + načrt | 2 | 14 | 0 |
| ned 11. 10. | A: termin pon 21:00 Nina + načrt | 2 | 6 | 0 |
| ned 11. 10. | A: termin tor 08:30 Luka + načrt | 2 | 12 | 0 |
| ned 11. 10. | A: termin tor 10:00 Alenka + načrt | 2 | 8 | 0 |
| ned 11. 10. | A: izvoz šifrirane kopije (geslo) | 2 | 4 | 0 |
| ned 11. 10. | B: uvoz kopije na telefon | 2 | 12 | 0 |
| pon 12. 10. | B: vadba Jure Kos | 2 | 8 | 0 |
| pon 12. 10. | B: vadba Nina Kralj | 2 | 8 | 0 |
| pon 12. 10. | B: po pomoti popravek Alenkinega načrta | 3 | 6 | 0 |
| pon 12. 10. | A: popravka torkovih načrtov (Luka, Alenka) | 3 | 12 | 0 |
| pon 12. 10. | B: združitev z uvozom iz A | 1 | 6 | 0 |
| pon 12. 10. | B: vrnitev iz B-kopije, ročni ponovni vnos popravkov | 2 | 12 | 0 |
| tor 13. 10. | B: vadba Luka Mlakar | 2 | 8 | 0 |
| tor 13. 10. | B: vadba Alenka Vidmar | 2 | 8 | 0 |
| tor 13. 10. | B izvoz, A uvoz | 2 | 6 | 0 |
| tor 13. 10. | A: pregled končanih treningov tedna | 2 | 10 | 0 |

## Kaj je končalo kje

- **Na računalniku (A) po torku zvečer:** 4 stranke, 4 termini, vsi 4 zaključeni, 10 signalov v »Čakajoče na pregled«, zgodovina pri vsaki stranki. Brez podvojenih zapisov. Vir: uvoz datoteke B-torek.json, torej A je zrcalo B, ne združitev.
- **Na telefonu (B):** vse, kar sem delal na njem, in ročno ponovno vneseni popravki z računalnika (Luka 72,5 kg, Alenka izpadni korak 3 × 8 z 8 kg).
- **Izgubljeno ob združitvi (ponedeljek zvečer):** ko sem na B uvozil kopijo z A, sta ponedeljkovi vadbi (Jure, Nina) spet kazali »Zamuja«, signali Jureta so izginili (»Nič ne čaka na pregled«), moj po pomoti spremenjen izpadni korak (3 × 10) je bil zamenjan. Poslal sem nazaj prej izvoženo kopijo telefona in izgubil računalniška popravka; ta sem vnesel znova na roke. Nič ni bilo podvojeno.
- **Ne potuje s kopijo:** moji podatki (telefon 041 999 888 ostane samo na A) in tema (A Polnoč, B ostane Dan).
- **Aplikacija o varnosti podatkov (navedki):** »LibrePT hrani tvoje podatke neposredno v tej napravi.« (res); »Varnostne kopije s te naprave so šifrirane.« (res: datoteka je aes-gcm, geslo ob prvem izvozu sama ustvari, 48 znakov, »Zapiši to geslo nekam izven tega telefona«); »Obnovitev zamenja vse na tej napravi. Izgubljeno bo: 4 stranke, 4 treningi, 4 zapisi vadbe, 2 zapisa prisotnosti, 5 zaznamkov k vajam.« (števila so prava za telefon, a ne povedo, kaj ima datoteka); »Vse na tej napravi je že v Google Drive.« na praznem telefonu (neresnično, F-s02-08); »OGROŽENO — NAREDI KOPIJO« (F-s02-06).
- **Koliko do uporabnega telefona:** približno 10 dotikov (Se strinjam, Dan, Nadaljuj, 4 polja profila + Shrani in nadaljuj, Začni s prazno aplikacijo, ikona oblaka, Izberi JSON datoteko, geslo, Odpri datoteko), 4 tipkana polja in geslo z 48 znaki, ki ga mora trener imeti zapisanega izven telefona; datoteko mora nekako prenesti sam (v tem orodju sem jo prenesel jaz). Google Drive nisem preizkusil.
- **Široki zaslon:** računalnik 1280×800: aplikacija je v stolpcu 480 px v sredini, ostalo je prazen gradient (posnetek A-new-session.png). Obrazec za termin ima isto razporeditev kot na telefonu, katalog vaj se zapre po vsaki vaji (znano), vrstica vaje kaže polja le za eno razširjeno vajo. Tipkanje besedila s tipkovnico je hitrejše, razporeditev pa je enaka, zato je bilo sestavljanje načrtov enako težko kot na telefonu, ne lažje (F-s02-02).

## Vrzeli

1. **Združevanje dveh naprav brez Googla** (F-s02-05): vsakič, ko se naprava izmenja, ena izgubi delo druge; 2 vrstici ponovnega vnosa (8 dotikov) ali izgubljena vadba. Vsak teden, kjer računalnik in telefon delata vzporedno.
2. **Gumb »opravljeno po načrtu«** (F-s02-03): vsak trening ima dodatne pritiske in napačne ocene.
3. **Računalnik brez širokega pogleda** (F-s02-02): ni prednosti pri sestavljanju načrtov.

## Napake

1. F-s02-05 (P1, tudi vrzel): uvoz zamenja vse, brez združevanja.
2. F-s02-04 (P1): opozorilo pred zamenjavo našteva vse na napravi, ne razlike.
3. F-s02-09 (P1): zgodovina kaže Pretežko in opombe kot »PRESKOČENO«, opomba o bolečini ne pride v kartoteko.
4. F-s02-06 (P2): »OGROŽENO — NAREDI KOPIJO« po uvozu, datoteka ne šteje.
5. F-s02-07 (P2): moji podatki in tema ne pridejo; stavek o predogledu ni razumljiv.
6. F-s02-08 (P2): »Vse na tej napravi je že v Google Drive« na praznem telefonu.
7. F-s02-01 (P3): »Nadaljuj« pri izbiri teme ne naredi nič, dokler ne izbereš teme.

Vseh ugotovitev: 9.

## Dnevi, ki jih nisi dosegel

Vsi trije dnevi (nedelja, ponedeljek, torek) so doseženi. Google Drive nisem poskusil (ni mogoče).

<!-- konec poročila s02 -->
