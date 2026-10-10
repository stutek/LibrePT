---
type: log
title: Ugotovitve
description: Napake in vrzeli, najdene med tednom z LibrePT.
tags: [exploratory, trainer-week]
---

### F-r07-01 — vrzel — Na zaslonu vadbe ne najdem, kako zabeležim opravljeno serijo ali vajo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:18 (ura telefona premaknjena na 06:55, nato je tekla naprej)
- **Koraki:** Ustvari trening → Ena na ena z Francem, 4 vaje → Začni trening → tapnil ime vaje, »S1 × 10:00«, značko »Prihodnje«, štoparico »Časomer premora« → Zaključi vadbo → Zaključi zdaj
- **Pričakovano:** gumb ali tap, ki pove »ta serija je narejena« (kolo 10 min, potisk nog 3 × 12 s 60 kg)
- **Opaženo:** vaja se le razpre (Prelahko, Pretežko, Opombe). Štoparica požene števec premora (0:06). Ob koncu vedno: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Vse vaje ostanejo »Prihodnje«.
- **Cena:** ne morem vpisati, kaj je Franc zares naredil; vsaka vadba bi se shranila prazna. Celoten zgodovinski zapis (obremenitev 60 kg, 3 × 12) odpade, ostane papirni karton.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-02 — vrzel — Katalog vaj nima sobnega kolesa, potiska nog, hoje po traku ali sedečega veslanja

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:05
- **Koraki:** Ustvari trening → Odpri v beležki → ⋮ Uredi načrt → Dodaj iz kataloga
- **Pričakovano:** vaje, ki jih ima vsak fitnes: kolo, potisk nog (leg press), hoja po traku, veslanje na stroju
- **Opaženo:** »Vaje: 48«, vsa imena angleška (Assault Bike, Barbell Back Squat, Concept2 Rower …); nobenega potiska nog, nobene hoje, nobenega sobnega kolesa. Filtri »All«, »Chest«, »Legs« so angleški (znano §80.54).
- **Cena:** vse vaje te stranke (kolo, potisk nog, veslanje, hoja po traku, počepi do klopi, vzpon na stopnico) vpišem na roke z gumbom »Vaja«: približno 2 minuti na stranko na vadbo.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-03 — vrzel — Trajanja (10 minut kolesa) ni mogoče vpisati kot čas; »drža« vzame sekunde

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:08
- **Koraki:** Vaja → polje »Merjeno v« (možnosti »pon.« in »drža«) → izbral »drža«, serije 1, vpisal 600
- **Pričakovano:** izbira minut za kolo in hojo
- **Opaženo:** na kartici piše »S1 × 10:00«. Deluje, a moram sam pretvoriti 10 minut v 600 sekund in nikjer ne piše, da je enota sekunda. Razdalje ali pulza ni.
- **Cena:** vsaka kardio vaja: pretvorba v glavi, tveganje napake.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-04 — napaka — Opomba z meritvijo (sladkor, tlak) postane »nerešen povratni signal« in obarva vaje rdeče

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:20
- **Koraki:** vaja → Opombe → »Samo opomba, brez ocene« → vpisal »Pred vadbo: sladkor 8,2 mmol/l, tlak 138/86.« → Zapiši opozorilo; enako za »Po vadbi 08:15: sladkor 6,9«
- **Pričakovano:** zapis meritve brez alarma; viden na kartici
- **Opaženo:** besedilo opombe se nikjer ne pokaže na zaslonu. Ime vaje je rdeče z opozorilnim trikotnikom, na vrhu pa: »Treningi, ki čakajo na pregled — 1 stranka ima nerešene povratne signale iz treninga. Franc Dolenc — Ena na ena (2)«.
- **Cena:** vsaka meritev je alarm in ne zapis; ne vidim, ali se je sploh shranila. Za 7 strank, vsaka ura, to je 7 ur na teden dvoma in ročnega prepisovanja v preglednico.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-05 — vrzel — Stranka nima polja za meritve (sladkor, tlak, teža) ali za paket ur in plačilo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:58
- **Koraki:** Imenik strank → Dodaj stranko: polja Ime, Vzdevek, E-pošta, Telefon, Cilji, Poškodbe in omejitve, Opombe
- **Pričakovano:** mesto za »ostalo 5 ur« in »plača s Flikom« ter za meritve z datumom
- **Opaženo:** samo prosta besedila. Zdravstveno stanje, paket in plačilo sem vpisal v »Poškodbe in omejitve« in »Opombe«; na vadbi se prikažeta zlepljena (»Sladkorna bolezen … · Mesečni paket 280 EUR«).
- **Cena:** preglednica in karton ostaneta; petek 17:30 (pregled ur v paketih) ni mogoč. Okoli 30 min na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-06 — napaka — Dialog za nov trening: ime termina z imenom stranke zavrne šele po tapu na »Odpri v beležki« in izgubi pot naprej

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:10
- **Koraki:** Ustvari trening → ime »Franc, jutranja« → Franc dodan → Odpri v beležki
- **Pričakovano:** opozorilo ob vpisu imena
- **Opaženo:** šele po tapu: »Ime termina ne sme vsebovati imena stranke, Franc pa je ime stranke. Termin že pokaže, kdo je na njem.« (Pravilo je razumno, a opozorilo pride ob shranjevanju.) Po popravku se odpre še okno za vabila v koledar, ki ga ne želim (znano §88.6).
- **Cena:** 1 minuta; P3.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:33:52, različica 166d3c8

### F-r07-07 — napaka — »Razreši« izbriše meritev brez vprašanja in v kartoteki stranke ni sledi

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:40
- **Koraki:** obvestila → Franc Dolenc — Ena na ena (2) → pri opombi »Pred vadbo: sladkor 8,2 mmol/l, tlak 138/86.« tapnil ikono »Razreši« → Imenik strank → Franc Dolenc
- **Pričakovano:** da se meritev ohrani v zgodovini stranke (to je moj zapis, ne opozorilo)
- **Opaženo:** vrstica izgine brez vprašanja. V profilu pod »ZGODOVINA ZABELEŽENIH VADB« samo: »Prazen načrt, brez rutine • 7 min vadba … Sobno kolo PRESKOČENO …« in nikjer meritev. Ikona »Razreši« nima besede ob sebi.
- **Cena:** meritve, zaradi katerih sem trener za sladkorne bolnike, v aplikaciji niso nikoli trajne; ostane Google preglednica. Okoli 20 min na teden dvojnega vpisa.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 12:36:56, različica 166d3c8

### F-r07-08 — vrzel — Meritve so mogoče obdržati le z neoznačenim potrditvenim poljem »Shrani to v kartoteko stranke«; zapišejo se v prosto besedilo »Opombe«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 09:45
- **Koraki:** vaja → Opombe → Samo opomba, brez ocene → vpisal »Tlak pred vadbo 142/90.« → označil »Shrani to v kartoteko stranke« → Zapiši opozorilo; enako za »Tlak po vadbi 128/84.« → Imenik strank → Irena Žagar
- **Pričakovano:** tabela ali seznam meritev po datumih, ki ga pogledam pred naslednjo uro
- **Opaženo:** polje je privzeto neoznačeno (brez njega meritev po »Razreši« izgine, F-r07-07). Označeno doda v »OPOMBE« stranke en dolg odstavek: »2026-10-12 — Sobno kolo: Samo opomba, brez ocene - Tlak pred vadbo 142/90. 2026-10-12 — Hoja po traku: …«. Meritev je pripeta na ime vaje, ne na vadbo. Ni primerjave z prejšnjim tednom.
- **Cena:** za Vesnino tehtanje, Francov sladkor in Slavkov tlak bi čez mesec dobil odstavek, ki ga ne morem prebrati kot trend; preglednica ostane. Okoli 25 min na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:46:39, različica 166d3c8

### F-r07-09 — vrzel — Skrajšane ure (60 → 40 min) po koncu ni mogoče popraviti; čas vadbe je vedno ura aplikacije

- **Dan in ura (simulirano):** torek 13. 10., 08:45
- **Koraki:** Mateja, termin 08:00–09:00, zaključen → seznam Treningi → Uredi
- **Pričakovano:** da vpišem, da je ura trajala 40 minut (sladkor 4,2, prekinitev), ker moram stranki zaračunati celo uro in ostane v paketu 4
- **Opaženo:** »Ta trening se je že začel ali končal, zato datuma in ure ne moreš spremeniti.« Seznam kaže »Zaključeno 00:02« (to je čas, ko sem imel zaslon odprt, ne dolžina ure). Razlog skrajšanja sem lahko vpisal samo v opombo.
- **Cena:** ura in plačilo se ujemata le v glavi; 5 min na teden za ročni zapis drugje.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:06:36, različica 166d3c8

### F-r07-10 — napaka — Premik termina na drugo uro izbriše načrt vaj

- **Dan in ura (simulirano):** torek 13. 10., 15:05
- **Koraki:** Treningi → petek 2026-10-16, 17:00–18:00 (Bojan, 2 vaji: kolo 20 min, vaje v sedenju 3 × 12) → Uredi → začetni čas 16:00, končni čas 17:00 → Shrani → Odpri v beležki
- **Pričakovano:** ista ura načrta, samo drugi čas (Bojan prosi za uro prej)
- **Opaženo:** seznam pokaže »petek 2026-10-16 · 16:00 - 17:00 … Program ni določen«, beležka pa »Ni vstavljenih vaj«. Okno Uredi je kazalo »Izberi rutino / Prazen načrt, brez rutine«; Shrani je prepisal načrt s praznim. Ni opozorila.
- **Cena:** vsak premik ure (v tednu: Bojan, Vesna) pomeni, da načrt vnesem znova, 3 do 5 minut; novo opažanje ob znanem §80.182.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 13:21:51, različica 166d3c8

### F-r07-11 — vrzel — Vaje, ki jih vpišem v načrt z gumbom »Vaja«, niso v knjižnici; iz njih ni mogoče narediti rutine

- **Dan in ura (simulirano):** sreda 14. 10., 06:45
- **Koraki:** Imenik strank → Franc Dolenc → pri zgodovini »Shrani kot rutino«
- **Pričakovano:** rutina iz ponedeljkovega načrta (isto bom delal v sredo in soboto)
- **Opaženo:** »4 vaje niso v tvoji knjižnici, zato jih ni v rutini.« Rutina bi bila prazna. Za vsako vajo moram v Knjižnica vaj → Dodaj vajo izpolniti pet obveznih polj (ime, »Chest/Back/Legs…«, »Barbell/Machine…«, »Horizontal Push/Squat…«, način beleženja), v angleščini.
- **Cena:** 4 vaje: okoli 6 minut enkrat; brez tega bi Francov načrt ponovno vpisoval trikrat na teden (okoli 3 minute na vnos).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:28:57, različica 166d3c8

### F-r07-12 — napaka — Obrazec »Ustvari vajo po meri« ima v slovenščini angleške izbire (Chest, Machine, Horizontal Pull, Squat)

- **Dan in ura (simulirano):** sreda 14. 10., 06:50
- **Koraki:** Meni → Vaje in rutine → Dodaj vajo
- **Pričakovano:** slovenska imena skupin mišic, opreme in vzorcev giba
- **Opaženo:** »Ciljna mišična skupina: Chest, Back, Legs …«, »Oprema: Barbell, Dumbbell, Cable, Machine …«, »Vzorec giba: Horizontal Push … Conditioning«. Možnosti načina beleženja so slovenske. Znani §80.54 govori le o filtrih kataloga, ne o tem obrazcu.
- **Cena:** trener, ki ne zna angleško, ne ve, kaj izbrati (»Hinge«, »Lunge«); 1 minuta razmisleka na vajo.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 13:28:57, različica 166d3c8

### F-r07-13 — napaka — V rutini polje »čas« za kardio vzame sekunde brez oznake enote: »Sobno kolo 1×0:10«

- **Dan in ura (simulirano):** sreda 14. 10., 06:58
- **Koraki:** Rutine → Ustvari rutino → Dodaj vajo → Sobno kolo (kardio) → v polje »čas« vpisal 10 (mislil sem 10 minut) → Shrani
- **Pričakovano:** »10 min«, ali vsaj enota ob polju
- **Opaženo:** seznam rutin pokaže »Sobno kolo 1×0:10« (10 sekund); na vadbi »S1 × 0:10«. Polje ima le nadpis »čas«.
- **Cena:** sem moral ugotoviti sam in rutino popraviti; če ne bi opazil, bi stranka imela 10 sekund kolesa v načrtu. 2 min.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:39:29, različica 166d3c8

### F-r07-14 — vrzel — Prejšnji tlak (ki sem ga shranil v kartoteko) na naslednji uri ni na zaslonu; za primerjavo moram v profil stranke

- **Dan in ura (simulirano):** četrtek 15. 10., 10:00
- **Koraki:** ponedeljek: Irena, opomba »Tlak pred vadbo 142/90.« s kljukico »Shrani to v kartoteko stranke« → četrtek: Ustvari trening, Irena → Začni trening
- **Pričakovano:** nad vajami vidim, kaj sem izmeril zadnjič (142/90 → 128/84), da lahko primerjam
- **Opaženo:** v vrstici pod imenom piše le začetni opis: »Hipertenzija, prekomerna teža. Cilj: manjši tlak brez več zdravil.« Ponedeljkova meritev je samo pod Imenik strank → Irena Žagar → Opombe. To je znani §80.158 (bolečina v kartoteki se ne pokaže); isto velja za meritve.
- **Cena:** pri vsaki stranki vsako uro 1 minuta za odpiranje profila. 7 strank, okoli 10 min na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:58:58, različica 166d3c8

### F-r07-15 — napaka — Vsaka vpisana meritev ostane »Čakajoče na pregled«, tudi kadar je shranjena v kartoteko; do nedelje 14 vrstic

- **Dan in ura (simulirano):** nedelja 18. 10., 18:00
- **Koraki:** ves teden po vadbi: Opombe → Samo opomba, brez ocene → kljukica »Shrani to v kartoteko stranke« → Zapiši opozorilo; nedelja: obvestila → »Čakajoče na pregled«
- **Pričakovano:** meritev, ki je že v kartoteki, ne sili v pregled
- **Opaženo:** »Čakajoče na pregled 14«; vsaka vrstica »Samo opomba, brez ocene« z imenom vaje (npr. »Vaja: Sobno kolo« za tlak). Spodaj pas z obvestili vse teden govori »5 strank ima nerešene povratne signale iz treninga«. Vsako vrstico moram razrešiti posebej (ikona »Razreši«), ni »Razreši vse«.
- **Cena:** okoli 14 tapov in odpiranj na teden; prava opozorila (bolečina v stopalu pri Bojanu) potonejo med meritvami.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 14:07:36, različica 166d3c8

### F-r07-16 — vrzel — Stranki ne morem poslati sporočila iz aplikacije (sladkor iz torka za Matejo, seznam zdravil za Toneta)

- **Dan in ura (simulirano):** nedelja 18. 10., 18:05
- **Koraki:** Imenik strank → Mateja Rebolj: gumbi »Načrtuj program«, »Kopija za AI brez imen«, »Izvozi podatke (GDPR)«; »E-pošta ni vpisana«
- **Pričakovano:** gumb »Pošlji sporočilo« z izbranimi meritvami
- **Opaženo:** vrednosti (5,6 / 7,1 / 4,2) lahko preberem v »Opombe«, a jih moram prepisati v WhatsApp. Aplikacija zna poslati samo vabilo na trening (»Pošlji vabilo«, »Pošlji SMS«).
- **Cena:** okoli 10 minut na teden za 4 sporočila (Tone ponedeljek, Franc izvid, Mateja, Tone zdravila), vsakič prepis.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 14:07:36, različica 166d3c8

### F-r07-17 — vrzel — Prostih terminov ni mogoče videti (Francova sobotna ura vsak teden)

- **Dan in ura (simulirano):** sobota 17. 10., 11:00
- **Koraki:** Treningi → seznam → Datumi; Ustvari trening → polja Datum in začetni čas
- **Pričakovano:** pogled tedna s prostimi urami, da Francu odgovorim v minuti
- **Opaženo:** seznam kaže samo vnesene termine pod dnevi; prostih ur ni. Ponavljanje »PONOVI VSAK TEDEN« z »SOB.« deluje (sobote 2026-10-24, 2026-10-31 …), a ne vidim, ali se kaj prekriva.
- **Cena:** 2 minuti, da preberem seznam; trenerju s 13 strankami več.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 14:07:36, različica 166d3c8

### F-r07-18 — napaka — Kartica vaje piše »S3 × R12 × 60 kg«: črki »S« in »R« nista razloženi in »R« ni slovenska

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:15
- **Koraki:** Odpri v beležki → kartica vaje »Potisk nog«
- **Pričakovano:** »3 × 12 × 60 kg« ali »3 serije × 12 pon.«
- **Opaženo:** »S3 × R12 × 60 kg«; pri kardiu »S1 × 10:00«. Polje v urejevalniku se imenuje »pon.«, na kartici pa »R« (angleško reps).
- **Cena:** nov uporabnik ugiba; 1 minuta, strankam brez znanja angleščine ne morem pokazati zaslona.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 14:07:43, različica 166d3c8

