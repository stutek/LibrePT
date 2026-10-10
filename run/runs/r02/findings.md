---
type: log
title: findings Boštjan
description: Zapis findings tedna r02.
tags: [exploratory, trainer-week]
---

### F-r02-01 — vrzel — Skupinska vadba za goste: število prisotnih ni mogoče vpisati brez celega obrazca za vsakega gosta

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:30 (ura telefona premaknjena)
- **Koraki:** Ustvari trening → ime »Jutranja vadba za goste«, Studio, 07:30–08:15, Ponovi vsak teden, pon./sre./pet. → polje za stranko → »Dodaj »Hans Reiter« kot novo stranko«.
- **Pričakovano:** za jutranjo vadbo, ki je brezplačna in kamor pride 4 anonimne goste, vpišem »4 prisotni« ali dodam goste brez podatkov.
- **Opaženo:** vsak gost mora biti stranka z obrazcem (ime in priimek obvezna). Termin kaže »1/1 mest zasedenih«, čeprav v studiu vadi 4 ljudi; nikjer ne najdem števila mest ali števila prisotnih. Hans je zdaj vpisan tudi v sredo in petek, ker ponovitev kopira vse udeležence.
- **Cena:** 3 dni × 3 anonimni gosti; ob vsakem terminu brez statistike obiskov, ki jo hotel zahteva v tedenskem poročilu (~10 min/teden več ročnega štetja).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:17:00, različica 166d3c8

### F-r02-02 — napaka — Dnevi ponovitve imajo za bralnik zaslona ime »on« in dan v tednu je obkljukan, ko tapneš drug gumb z istim besedilom

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:35
- **Koraki:** Ustvari trening → Ponovi vsak teden → tap na »sre.« (kjer je tudi gumb za datum »sre. 14.«).
- **Pričakovano:** obkljukam sredo.
- **Opaženo:** orodje je tapnilo gumb datuma »sre. 14.« in datum se je spremenil na 2026-10-14; potrditvena polja dni nimajo imena (kontrole kažejo »on«). Dan sem obkljukal šele s tapom na oznako PON./SRE.
- **Cena:** 1 minuta, a nevarnost, da termin ostane na napačnem datumu.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 05:17:30, različica 166d3c8

### F-r02-03 — napaka — Pri vaji, ki ni v sklopu, ne najdem, kako označim opravljeno serijo; vadba se zaključi kot »prazna«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 10:30
- **Koraki:** Marjanov trening z vajami Kolo, Veslanje na škripcu (S3 × R12 × 25 kg), Stopnička → Začni trening → tap na vajo → Zaključi vadbo.
- **Pričakovano:** ob vaji gumb ali tap »serija opravljena«, ki mi napolni zgodovino (3 × 12 po 25 kg).
- **Opaženo:** na kartici vaje so samo »Prelahko«, »Pretežko«, »Opombe« in ikona »Časomer premora«. Pri sklopu (krogi) je jasen gumb »Zaključi krog 1 / 3«, pri samostojni vaji ga ni. Zaključek vadbe vpraša: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«. Pet ukazov brez uspeha, nato opustil.
- **Cena:** vsak osebni trening se shrani brez opravljenih serij (~5 treningov/teden), zato nič v zgodovini ni dokaz, da je bil trening opravljen; dodatnih ~3 min na trening za iskanje.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 05:29:19, različica 166d3c8

### F-r02-04 — napaka — Večerna kopija podatkov ne pride do datoteke; »Izvozi JSON« najprej zahteva geslo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 19:00
- **Koraki:** gumb z oblačkom zgoraj desno (kaže »!«) → »Izvozi JSON« → okno »Geslo za varnostne kopije« → »Zapisal sem si ga, shrani« → ponovno »Izvozi JSON«.
- **Pričakovano:** datoteka s kopijo stranka, treningov in načrtov.
- **Opaženo:** po geslu stoji »Izvoženo in šifrirano.«, a datoteke ne dobim (brskalnik orodja jo prekliče). Okno hkrati pravi: »To je predogledna različica. Varnostne kopije … se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena.« Glava kaže »OGROŽENO — NAREDI KOPIJO« in rdeča značka prekriva logotip. Ne vem, ali je v kopiji sploh moj teden. Znano (§80.136); novi dokaz: kopije podatkov ob koncu dneva nimam, obnova po izgubi telefona je nemogoča.
- **Cena:** ~4 minute na večer ob 7 večerih in popolna izguba tedna, če se telefon pokvari.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 05:45:20, različica 166d3c8

### F-r02-05 — vrzel — Paketi 10 treningov, plačila in cena po stranki nimajo mesta

- **Dan in ura (simulirano):** torek 13. 10., 11:15
- **Koraki:** menu → Imenik strank → Vesna Oblak → pregled profila (cilji, poškodbe, opombe, zgodovina vadb).
- **Pričakovano:** polje »paket 10, ostane 1«, ki se zmanjša ob zaključenem treningu, ter zapis plačila (paket 350 €, sobni račun, 15 € gotovina, 70 € na recepciji, 160 €/mesec).
- **Opaženo:** profil ima samo ime, cilje, poškodbe, opombe (prosto besedilo), e-pošto, telefon in zgodovino vadb. Preostanek paketa sem vpisal v »Opombe« kot besedilo (»ostane 1«), aplikacija ga ne šteje in ne opozori, ko je zadnji trening porabljen. Vesna kupi nov paket: opombo moram ročno popraviti.
- **Cena:** 7 strank s tremi različnimi načini plačila (račun hotela, sobni račun, gotovina); ~15 min/teden za papirnati zvezek, ki ga aplikacija ne nadomesti; ob nadaljevanju paketa ni opomnika, da je Vesnin paket pri zadnjem terminu (torek).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:50:47, različica 166d3c8

### F-r02-06 — vrzel — Delo trenerja izven treningov (poročilo za vodjo, naročilo opreme, zamenjava izmene, pregled bazena) nima mesta

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:30–15:00 in petek 16. 10., 09:00–12:30
- **Koraki:** pregled menija (Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve) in zaslona »Ustvari trening«.
- **Pričakovano:** seznam opravil ali dnevnik izmene: bazen 28 °C in klor, tedensko poročilo (87 obiskov, 11 osebnih), zlomljena ročaja za naročilo, zamenjava izmene z Urško.
- **Opaženo:** nič od tega ne najdem. Termin je vedno trening s stranko. Tedensko poročilo za Katjo bi moral sešteti obiske in osebne treninge sam; aplikacija mi števila ne ponudi.
- **Cena:** ~25 min/teden v zvezku in WhatsAppu, ker aplikacija ne pozna izmen; števila treningov ne preberem iz nje (preverim v petek).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:50:47, različica 166d3c8
