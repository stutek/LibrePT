---
type: log
title: Poročilo tedna, Gregor Perko
description: Povzetek tedna 12. do 18. oktober 2026 s trenerjem za sladkorne bolnike in LibrePT, vrzeli in napake.
tags: [exploratory, trainer-week]
---

## Povzetek

Aplikacija je nosila približno tretjino mojega tedna: vpis strank, sestavo terminov, odpoved in premik ter ponavljanje sobote; meritve (sladkor, tlak, teža) sem lahko vpisal le kot proste opombe. Največja vrzel: na zaslonu vadbe ne najdem, kako zabeležim opravljeno serijo, zato se vsaka vadba shrani kot »prazna« in v zgodovini so vse vaje »PRESKOČENE«. Ta teden se meritve niso nikjer zbrale kot trend, računov, paketov ur in plačil aplikacija nima, zato preglednica, karton in WhatsApp ostanejo.

## Naloge

| dan | naloga | ocena 0–3 | minute z aplikacijo | minute brez nje |
|---|---|---|---|---|
| pon | vpis 7 strank | 2 | 9 | 0 |
| pon | Franc 07:00, vadba + meritve | 1 | 25 | 0 |
| pon | pregled in razrešitev opomb | 1 | 6 | 0 |
| pon | Irena 09:30, vadba + tlak | 1 | 18 | 0 |
| pon | Tone sporoča (sporočilo) | 0 | 0 | 2 |
| pon | Slavko 17:00 | 1 | 15 | 0 |
| pon | varnostna kopija (Izvozi JSON) | 0 | 4 | 0 |
| tor | Mateja 08:00, sladkor, skrajšana ura | 1 | 25 | 0 |
| tor | Mateja plača s Flikom, paket 4 ure | 0 | 0 | 5 |
| tor | Vesna tehtanje + vadba | 1 | 20 | 0 |
| tor | Bojan prosi premik na petek 16:00 | 1 | 6 | 0 |
| sre | Franc, načrt iz rutine (vnos 4 vaj v knjižnico in rutino) | 2 | 25 | 0 |
| sre | Franc 07:00 vadba + sladkor 9,5 | 1 | 6 | 0 |
| sre | Tone, tlak 144/88, hoja | 1 | 14 | 0 |
| sre | račun za Franca 280 EUR | 0 | 0 | 6 |
| sre | Bojan 14:00, stopala | 1 | 15 | 0 |
| sre | načrt za Slavka, 85 kg | 2 | 6 | 0 |
| čet | Slavko 07:30, 85 kg | 1 | 6 | 0 |
| čet | Irena 10:00 | 1 | 8 | 0 |
| čet | Franc sporoča o izvidu | 0 | 0 | 3 |
| čet | Vesna odpove petek, nov termin ponedeljek | 2 | 6 | 0 |
| pet | Tone sporoča nižji odmerek | 0 | 0 | 2 |
| pet | Bojan 16:00 premaknjena ura | 1 | 7 | 0 |
| pet | pregled ur v paketih | 0 | 1 | 8 |
| sob | Franc, dodatna ura, HbA1c | 1 | 6 | 0 |
| sob | Franc vsak teden v soboto (ponavljanje) | 2 | 3 | 0 |
| ned | sporočila Mateji in Tonetu | 0 | 1 | 8 |

Minute so ocena z urnikom stenske ure; stroj je bil zelo počasen, zato so minute z aplikacijo večje, kot bi bile na telefonu. Te minute niso merilo za oceno aplikacije.

## Vrzeli

1. F-r07-01 serije in vaje ni mogoče označiti kot opravljene (P1, vsaka vadba, ves teden).
2. F-r07-05 stranka nima polja za meritve, paket ur ali plačilo (okoli 30 min na teden).
3. F-r07-08 meritve so le proste opombe, brez trenda (okoli 25 min na teden).
4. F-r07-14 prejšnja meritev ni na zaslonu naslednje ure (okoli 10 min na teden).
5. F-r07-16 sporočila stranki (okoli 10 min na teden).
6. F-r07-09 trajanja skrajšane ure po koncu ni mogoče popraviti (5 min na teden).
7. F-r07-11 vaje iz načrta niso v knjižnici, rutina iz njih ni mogoča (3 min na vnos).
8. F-r07-02 katalog nima kolesa, potiska nog, hoje po traku (2 min na stranko na vadbo).
9. F-r07-03 trajanja ni mogoče vpisati v minutah.
10. F-r07-17 prostih terminov ni mogoče videti.

## Napake

1. F-r07-07 (P1) »Razreši« izbriše meritev brez vprašanja.
2. F-r07-10 (P1) premik termina na drugo uro izbriše načrt vaj.
3. F-r07-04 (P2) meritev postane »nerešen povratni signal« in obarva vajo rdeče.
4. F-r07-13 (P2) v rutini »čas« za kardio vzame sekunde brez enote.
5. F-r07-15 (P2) 14 vrstic »Čakajoče na pregled« do nedelje.
6. F-r07-06 (P3) opozorilo o imenu termina pride šele ob »Odpri v beležki«.
7. F-r07-12 (P3) obrazec vaje po meri ima angleške izbire.
8. F-r07-18 (P3) kartica »S3 × R12 × 60 kg«.

Varnostna kopija: tap na »Izvozi JSON« odpre okno »Geslo za varnostne kopije« in datoteka ne prispe (znano §80.136, v tem brskalniku). Okno pravi, da vsebina, ki jo doda predogled, ni v kopiji. Naslov med tednom kaže »OGROŽENO — NAREDI KOPIJO«.

## Dnevi, ki jih nisi dosegel

Vsi dnevi so doseženi. Ponedeljkov »Tone, 08:00« (naslednji teden) in petkov »načrt za naslednji teden« nista vneseni razen Vesninega termina 19. 10.

<!-- konec poročila r07 -->
