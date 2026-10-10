---
type: log
title: Ugotovitve tedna r04
description: Napake in vrzeli, najdene med tednom Jake Vovka.
tags: [exploratory, trainer-week]
---

### F-r04-01 — vrzel — Skupina 11 otrok je 11 ločenih obrazcev (nov dokaz za znano vrzel §88.2)

- **Dan in ura (simulirano):** ponedeljek 12. 10., ob 07:00 in 17:00
- **Koraki:** Meni → Imenik strank → Dodaj stranko → vpis imena (in po potrebi poškodb, opomb) → Shrani; ponovljeno 14-krat
- **Pričakovano:** da skupino otrok, ki jo vodim skupaj, vpišem naenkrat (seznam imen) ali da stranko kopiram
- **Opaženo:** vsak otrok je poln obrazec s 7 polji in privolitvijo; ob vsakem je treba spet pritisniti »Dodaj stranko«
- **Cena:** približno 14 obrazcev in vsaj 3 ukazi na stranko; tedensko enkrat ob začetku sezone, a ob novih otrocih spet
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:32:31, različica 166d3c8

### F-r04-02 — napaka — Gumb menija se imenuje »Menu / Meni« na slovenskem zaslonu

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:00
- **Koraki:** odprem aplikacijo s ?lang=sl, pogledam kontrole
- **Pričakovano:** ime gumba samo v slovenščini
- **Opaženo:** gumb v zgornji vrstici se imenuje »Menu / Meni«
- **Cena:** majhna; bralnik zaslona bere dva jezika
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 10:33:00, različica 166d3c8

### F-r04-03 — vrzel — Knjižnica vaj ima 48 angleških vaj za telovadnico, nobene za otroke ali igrišče

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:30
- **Koraki:** Meni → Vaje in rutine → Rutine → Ustvari rutino → Dodaj vajo, pogledam seznam
- **Pričakovano:** vsaj nekaj vaj za otroke (kolebnica, plazenje, skoki v obroče, hoja po gredi) in ime v slovenščini
- **Opaženo:** seznam »Vaje: 48« z imeni kot »Barbell Back Squat«, »Abmat Sit-up«, »Face Pulls«; nobena od mojih šestih postaj ne obstaja, imena so angleška na slovenskem zaslonu
- **Cena:** vsako vajo moram vpisati sam; za ta teden 11 vaj, vsaka obrazec
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-04 — vrzel — Krožni trening (6 postaj × 2 kroga) se v rutini ne da zapisati

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:30
- **Koraki:** Rutine → Ustvari rutino → Dodaj vajo (6-krat) → pri vsaki vaji Serije 2, čas 120, Premor 10 → Shrani
- **Pričakovano:** da zapišem 6 postaj, ki si sledijo, in da se krog ponovi 2-krat
- **Opaženo:** vsaka vaja ima svoje serije (»Preskakovanje vrvice 2×2:00«, »Hoja po gredi 2×2:00« ...). To pomeni 2 seriji prve vaje, nato 2 seriji druge; krog ni mogoč. Privzeto je 3 serije, premor 60
- **Cena:** vsak otrok bi na terenu videl napačen vrstni red; razlago moram povedati sam ali v opombi (nekaj minut na trening)
- **Dopolnitev v soboto:** v urejevalniku načrta pri terminu (Uredi načrt) obstaja gumb »Sklop« s poljem »KROGI«, torej krog je mogoč, a samo za eno stranko naenkrat. Obrazec »Ustvari rutino« gumba »Sklop« nima; krog bi moral zgraditi pri enem otroku in nato »Vsi na ta načrt«. Šele ob sobotah sem ga našel, ker ga ob rutini nič ne omeni.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-05 — napaka — Polji »čas« in »Premor« pri vaji v rutini nimata enote

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:35
- **Koraki:** Rutine → Ustvari rutino → Dodaj vajo → izberem vajo z načinom beleženja »Agilnost — čas / razdalja / ponovitve«
- **Pričakovano:** ob polju piše, ali je 10 sekund, minut ali metrov
- **Opaženo:** polje »čas« je 10, polje »Premor« 60, brez enote; šele po shranjevanju sem iz »2×2:00« razbral, da 120 pomeni 2 minuti
- **Cena:** ugibanje; ena napačna vrednost na vajo
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-06 — napaka — Ko termin iz serije spremenim in znova vključim »Ponovi vsak teden«, nastane druga serija: vsak torek dvakrat

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:45
- **Koraki:** Rutine → Začni skupinski trening → ime, kraj, datum »jutri«, 16:30–17:30, »Ponovi vsak teden« → 11 otrok → Shrani (zaradi mojega napačnega dotika je serija začela četrtek 15. in nato torki od 20.) → seznam → Uredi pri četrtkovem terminu → datum »jutri«, »Ponovi vsak teden«, »tor.« in »čet.« → Shrani
- **Pričakovano:** da se serija popravi ali da me aplikacija vpraša, ali naj nadomesti obstoječo
- **Opaženo:** seznam ima zdaj za 20. 10., 27. 10., 3. 11. ... 1. 12. po dva enaka termina ob 16:30, vsak z 11 otroki; opozorila ni
- **Cena:** 8 podvojenih terminov, ki jih moram brisati enega po enega; nevarnost, da otroke štejem ali jim pošljem vabilo dvakrat
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-07 — vrzel — Skupinski trening brez ocenjevanja vsake serije vsakega otroka se zaključi kot »prazna vadba«

- **Dan in ura (simulirano):** torek 13. 10., 16:30–17:32
- **Koraki:** na seznamu pritisnem termin → Začni trening → zavihki otrok (Ela, Jan, Tim) → vaja → Opombe → »Samo opomba, brez ocene« → Zapiši opozorilo → Zaključi vadbo
- **Pričakovano:** skupino 10 otrok vodim skupaj; zabeležim, kdo je bil, in nekaj opomb
- **Opaženo:** za vsakega otroka je svoj zavihek in svoj seznam 12 vrstic (6 vaj × 2 seriji in premori); pri zaključku okno pravi »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«. Prisotnosti (kdo je prišel) ni nikjer; Bora sem odstranil z urejanjem termina
- **Cena:** 10 otrok × 12 vrstic = 120 potrditev je na igrišču nemogoče; zapisal bom le opombe (po 6 dotikov na opombo), prisotnost pa ostane v Excelu: 10 min na trening, 20 min na teden
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-08 — napaka — Odštevanje na pasici termina pokaže negativen čas »-00h 02m«

- **Dan in ura (simulirano):** torek 13. 10., 17:32 (ura premaknjena)
- **Koraki:** ura 17:32, odprem aplikacijo; termin 16:30–17:30 je še aktiven
- **Pričakovano:** »Aktiven trening« s časom po koncu (npr. »zamuda«) ali brez minusa
- **Opaženo:** »Aktiven trening -00h 02m«
- **Cena:** majhna; zbega
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-09 — napaka — Po odstranitvi otroka s termina aplikacija javi »Nenačrtovani programi«

- **Dan in ura (simulirano):** torek 13. 10., 16:25
- **Koraki:** Uredi pri terminu → ✕ »Odstrani s tega treninga: Bor Kolenc« → Shrani
- **Pričakovano:** Bor, ki je bolan, je odstranjen in o njem ni več opozoril
- **Opaženo:** obvestila: »1 program je pripravljen, a še ni dodeljen treningu. Gibalna urica · Bor Kolenc · 2026-10-13«
- **Cena:** nepotreben rdeč znak; pet minut razmišljanja, ali sem nekaj pozabil
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-10 — vrzel — Plačil (mesečna karta 35 €, 5 € za obisk, gotovina, nakazilo) ni kam vpisati

- **Dan in ura (simulirano):** torek 13. 10., 17:40 in 18:00
- **Koraki:** Meni → Imenik strank → Ela Jerič (profil): polja so Cilji, Poškodbe, Opombe, E-pošta, Telefon, Privolitev; gumbi Načrtuj program, Kopija za AI, Izvozi podatke, Izbriši stranko. Pogledal še Meni: Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve
- **Pričakovano:** za vsakega otroka stanje oktobrske karte (plačano / ne, kako), seznam neplačnikov, opomnik
- **Opaženo:** nič od tega ne obstaja; ostaja Excel in zapis v polje »Opombe«
- **Cena:** 7 od 11 plačanih moram pregledati ročno v Excelu, 10 min v torek in 10 min v petek; opomnik še v Messengerju
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-11 — vrzel — Sporočil staršem (opomnik skupini, odgovor mami, sporočilo po spremembi) aplikacija ne pošlje

- **Dan in ura (simulirano):** ponedeljek 12. 10., 09:00; torek 13. 10., 18:00 in 19:30
- **Koraki:** profil stranke: edini gumb za stik je »E-pošta ni vpisana« (onemogočen, ker nimam naslova staršev); v meniju drugega za sporočila ni
- **Pričakovano:** sporočilo ali opomnik vsem v skupini hkrati (pri meni teče po Facebook skupini in Messengerju)
- **Opaženo:** samo e-pošta, ki jo moram imeti za vsakega otroka, in vabila v koledar
- **Cena:** okoli 12 sporočil na teden ostane zunaj aplikacije: 30 min na teden
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:39, različica 166d3c8

### F-r04-12 — napaka — Vaja se zaključi samo z oceno »Prelahko« ali »Pretežko«; nevtralnega »opravljeno« ne najdem

- **Dan in ura (simulirano):** sreda 14. 10., 18:10
- **Koraki:** Ena na ena → Začni trening → vaja »Mačka–krava« (S2 × R10) → poskusil: stopalka (Časomer premora), dotik na »S2 × R10 × BW«, poteg po kartici, meni ⋮ → nato »Prelahko«
- **Pričakovano:** gumb ali dotik, ki pove »2 seriji narejeni«, brez ocene
- **Opaženo:** šele »Prelahko« spremeni vrstico v »Zaključeno«; »Opombe« z bolečino je ne zaključi (»Ptičji pes ... Prihodnje«). Pri rehabilitaciji ne želim zapisati »prelahko – povečaj težo«
- **Cena:** 15 ukazov iskanja; pri vsaki vaji bi moral zapisati napačno oceno ali pa vaja ostane neopravljena
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:18:45, različica 166d3c8

### F-r04-13 — napaka — Meni ⋮ ostane odprt ob pritisku na Esc in prekriva gumbe vaje

- **Dan in ura (simulirano):** sreda 14. 10., 18:12
- **Koraki:** med treningom pritisnem ⋮ (Možnosti treninga) → Esc
- **Pričakovano:** meni se zapre
- **Opaženo:** meni »Uredi načrt / Vsi na ta načrt / Odpovej trening / Izbriši trening« ostane in pokrije gumba »Pretežko« in »Opombe«; zapre ga šele ponovni pritisk na ⋮
- **Cena:** majhna; en dotik
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:18:45, različica 166d3c8

### F-r04-14 — vrzel — Paket 10 ur (ostane 4) in plačilo 30 € nista nikjer; števec ur ni ob stranki

- **Dan in ura (simulirano):** sreda 14. 10., 19:15
- **Koraki:** profil Jerneje Cokan: polja Cilji, Poškodbe, Opombe; po zaključku vadbe pregledam profil
- **Pričakovano:** »ostane 3 ure« se samo zmanjša po zaključeni uri in plačilo se zapiše
- **Opaženo:** število ur in plačilo sta le prosto besedilo v polju »Opombe« (aplikacija jih pokaže v oknu »Predhodne poškodbe in opombe«, a jih ne šteje)
- **Cena:** vsak paket ročno popravim v opombi: 2 min na uro, 4 stranke s paketi
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:18:45, različica 166d3c8

### F-r04-15 — vrzel — Opomba o Eli (kašelj po teku) je lahko samo besedilo v polju »Poškodbe in omejitve«, brez datuma (nov dokaz za §88.7)

- **Dan in ura (simulirano):** četrtek 15. 10., 18:00
- **Koraki:** Imenik strank → Ela Jerič → Uredi profil → polje »Poškodbe in omejitve«: dopišem »15. 10.: kašljala po teku ...« → Shrani
- **Pričakovano:** datiran zapis, ki ostane ločen od stalne omejitve (astma) in ga ob naslednjem treningu vidim
- **Opaženo:** dopisal sem datum sam, v isti odstavek kot astmo; naslednjič ga ne ločim od stalnega opozorila
- **Cena:** 2 min na opombo, 3 do 4 opombe na teden pri 11 otrocih
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:24:43, različica 166d3c8

### F-r04-16 — napaka — Po odstranitvi dveh postaj ostaneta v načrtu prazna vrstica »Počitek 10s« in dva premora zapored

- **Dan in ura (simulirano):** četrtek 15. 10., 16:20
- **Koraki:** Uredi načrt → ✕ Odstrani pri »Preskakovanje vrvice« in »Hoja po gredi« → Končano z urejanjem načrta
- **Pričakovano:** načrt z 4 postajami in premori med njimi
- **Opaženo:** na vrhu načrta sta »Počitek 10s« in »Počitek 10s« pred prvo vajo, številčenje pa se začne pri »3/10«, čeprav je vaj 4 + 5 premorov (od 10 vrstic)
- **Cena:** zmeda otrokom in meni na igrišču; 1 min
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:24:43, različica 166d3c8

### F-r04-17 — napaka — Zgodovina Andraževe vadbe pokaže »PRESKOČENO« pri obeh vajah, moja opomba »Peta ne boli« pa ni vidna (nov dokaz za §80.6 in §80.167)

- **Dan in ura (simulirano):** sobota 17. 10., 10:05
- **Koraki:** Ena na ena → Začni trening → »Tek 300 m ...« → Opombe → »Dober napredek« + besedilo »Peta ne boli ...« → Zapiši opozorilo; enako pri »Sprint 60 m« → Zaključi vadbo → Zaključi zdaj → Imenik strank → Andraž Leskovšek
- **Pričakovano:** v zgodovini vidim, da je vadba narejena, in svojo opombo, da peta ne boli niti pri sprintu (dokaz, da sme na tekmo)
- **Opaženo:** »Tek 300 m v tempu 800 m, odmor 2 min PRESKOČENO«, »Sprint 60 m PRESKOČENO«; besedila opombe ni
- **Cena:** odločitev o tekmi moram prepisati v Excel ali v polje »Opombe« ročno: 3 min na tekmovalca
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:37:29, različica 166d3c8

### F-r04-18 — napaka — Števec »Nenačrtovani programi« se je v tednu povečal od 1 na 20 in ne pove, kaj naj naredim

- **Dan in ura (simulirano):** sobota 17. 10., 10:10
- **Koraki:** pogledam obvestila po zaključku vadbe
- **Pričakovano:** opozorilo samo za programe, ki jih res nisem dodelil
- **Opaženo:** »20 programov je pripravljenih, a še niso dodeljeni treningu.« (v torek 1 za Bora, v petek 8). Tedenske serije tvorijo toliko terminov, da števec ne pomeni nič
- **Cena:** rdeče opozorilo v vsakem pogledu, ki ga moram ignorirati
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:37:29, različica 166d3c8

### F-r04-19 — vrzel — Trening, ki ga je vodil nadomestni trener, ostane za vedno »Zamuja«; prisotnosti otrok ni kam vpisati

- **Dan in ura (simulirano):** nedelja 18. 10., 19:55
- **Koraki:** na seznamu pogledam termin iz četrtka 15. 10. (vodil ga je Mitja) → pritisnem ga → ⋮ (Možnosti treninga)
- **Pričakovano:** da ga označim kot opravljenega z 9 otroki, ki jih je Mitja prešel, in da seznam otrok prepišem iz njegove fotografije
- **Opaženo:** kartica kaže »Zamuja 03d 03h« in »9/11 mest zasedenih« (to je število vpisanih, ne prisotnih); meni ima samo »Uredi načrt«, »Vsak svoj načrt«, »Kopiraj ta načrt ...«, »Odpovej trening«; gumb »Začni trening« bi ustvaril novo vadbo, ne pa zapisa o tem, kdo je bil
- **Cena:** prisotnost 9 od 11 prepišem v Excel kot doslej: 10 min na teden; kartica s »Zamuja« ostane v seznamu
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:39:28, različica 166d3c8
