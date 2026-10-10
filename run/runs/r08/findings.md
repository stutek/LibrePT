---
type: log
title: Ugotovitve r08
description: Napake in vrzeli, ki jih je trener Rok Vidmar našel med tednom z LibrePT.
tags: [exploratory, trainer-week]
---

### F-r08-01 — vrzel — stranka nima mesta za paket treningov, ceno in plačilo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:15
- **Koraki:** Menu / Meni → Imenik strank → Dodaj stranko; pregledal vsa polja obrazca.
- **Pričakovano:** polje za paket (10 treningov, ostalo 4), ceno (30 / 40 €) in način plačila.
- **Opaženo:** samo Ime, Vzdevek, E-pošta, Telefon, Cilji, Poškodbe, Opombe, privolitev GDPR. Paket, ceno in plačilo sem moral napisati v prosto polje »Opombe«.
- **Cena:** vsak trening moram števila ostalih treningov v opombi popraviti na roke; ob 6 strankah okoli 10 min na teden; zamenjava zneskov = napačen račun.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:10:37, različica 166d3c8

### F-r08-02 — napaka — gumb menija se imenuje »Menu / Meni«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:05
- **Koraki:** odprl slovenski zaslon (?lang=sl), pogledal seznam kontrol.
- **Pričakovano:** ime gumba samo v slovenščini (»Meni«).
- **Opaženo:** gumb se imenuje »Menu / Meni«, torej angleščina in slovenščina skupaj.
- **Cena:** nič, a izgleda neizdelano.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:10:37, različica 166d3c8

### F-r08-03 — napaka — med dodajanjem stranke se je v seznamu pojavila stranka, ki še ni bila shranjena

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:20
- **Koraki:** Dodaj stranko → vpisal »Robert Lenart« v ime → (ukaz je obvisel, stroj je bil počasen) → besedilo zaslona.
- **Pričakovano:** seznam kaže samo shranjene stranke; odprt obrazec ne spremeni seznama.
- **Opaženo:** seznam je že kazal »Robert Lenart«, obrazec pa je bil še odprt in prazen razen imena. Po »Prekliči« Roberta ni bilo več v seznamu, števec na vrhu pa je kazal 4 in ne 5. Roberta sem moral vpisati znova.
- **Cena:** 1 min; nezaupanje do tega, kaj je shranjeno.
- **Prioriteta po tvoje:** P3 (morda le posledica prekinjenega ukaza; nisem ponovil)
- **Čas:** 2026-10-10 12:10:37, različica 166d3c8
### F-r08-04 — vrzel — v katalogu vaj ni mrtvega dviga (deadlift), le romunski mrtvi dvig

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:40
- **Koraki:** Uredi načrt → Dodaj iz kataloga → iskanje »deadlift«, »mrtvi«, »trap bar«, »sumo«.
- **Pričakovano:** mrtvi dvig (konvencionalni, sumo) za powerlifterja.
- **Opaženo:** samo »Romanian Deadlift (RDL)«. Za »mrtvi dvig« piše »Nobena vaja ne ustreza iskanju. Imena vaj v katalogu so v angleščini.« Ponudi »Dodaj »Mrtvi dvig« kot novo vajo«, kar odpre obrazec s štirimi obveznimi izbirami (mišica, oprema, vzorec giba, način beleženja), ki so vse angleške (Legs, Barbell, Hinge …).
- **Cena:** okoli 2 min za vajo, ki jo vsak powerlifter vsak teden potrebuje; angleški izbiri me motita.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:23:50, različica 166d3c8

### F-r08-05 — napaka — imena vaj v načrtu so angleška na slovenskem zaslonu

- **Dan in ura (simulirano):** ponedeljek 12. 10., 07:45
- **Koraki:** načrt Tilnovega treninga: »Barbell Back Squat«, »Barbell Bench Press«.
- **Pričakovano:** slovensko ime (»Počep s palico«) ali vsaj možnost, da ga preimenujem v načrtu.
- **Opaženo:** na kartici treninga in v načrtu stoji »Barbell Back Squat«. Stranka bere angleščino.
- **Cena:** pri stranki, ki ne zna angleško, moram vsako vajo na roke prepisati.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:23:50, različica 166d3c8

### F-r08-06 — vrzel — med treningom ne morem zapisati, kaj je stranka dejansko dvignila

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:05–09:25
- **Koraki:** Začni trening → pregledal kartico vaje (Barbell Back Squat, S3 × R3 × 175 kg): gumbi Časomer premora, Prelahko, Pretežko, Opombe; spodaj Vaja, Sklop, Počitek.
- **Pričakovano:** za vsako serijo kljukica ali polje »dvignil 3 × 3 × 177,5 kg« (pri tekmovalcu moram vedeti, kaj je res šlo).
- **Opaženo:** nobene kontrole za dejansko izvedene serije, ponovitve ali breme. Ob »Zaključi vadbo« aplikacija vpraša »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«, a kontrole, ki bi serije zabeležila, nisem našel. Vaja, ki je že narejena, ima še naprej oznako »Prihodnje«.
- **Cena:** zapis dejanskih bremen pišem v zapiske v telefonu (okoli 5 min na trening, 3 treningi tekmovalca na teden); pri tekmi (9 poskusov) ne morem zapisati nič.
- **Prioriteta po tvoje:** P1 (brez tega nimam zgodovine napredka)
- **Čas:** 2026-10-10 12:30:11, različica 166d3c8

### F-r08-07 — napaka — opomba o hitrosti palice je prišla v »Čakajoče na pregled« kot opozorilo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 09:25
- **Koraki:** Opombe → Samo opomba, brez ocene → vpisal »Dobra hitrost palice, ni utrujen.« → Zapiši opozorilo → Zaključi vadbo → obvestila.
- **Pričakovano:** zapis o treningu, ki ga vidim pri Tilnu.
- **Opaženo:** obvestilo »Treningi, ki čakajo na pregled — 1 stranka ima nerešene povratne signale iz treninga«; moja pozitivna opomba je »signal«, ki ga moram »razrešiti«. Gumb se imenuje »Zapiši opozorilo« tudi za pohvalo.
- **Cena:** vsak trening en dodaten korak (razrešitev) in zmeda, kaj je opozorilo.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:30:11, različica 166d3c8

### F-r08-08 — vrzel — telesne teže stranke ni kam zapisati; zapisal sem jo v »Opombe«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 20:30
- **Koraki:** Imenik strank → Tilen Čretnik → Uredi profil; pregledal polja; v Opombe pripisal »Teža: 12. 10. 92,4 kg (do 93 kg)«.
- **Pričakovano:** polje ali seznam meritev (teža z datumom), da vidim potek do tekme in pri Evi izgubo 1,3 kg na mesec.
- **Opaženo:** profil ima samo cilje, poškodbe, opombe, e-pošto, telefon. Zapis teže je besedilo, ki ga moram prepisovati, graf ali primerjava ne obstajata.
- **Cena:** pri Tilnu en zapis na teden, pri Evi mesečna meritev; brez poteka ne morem pokazati napredka (to stranki prodaja paket).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:32:52, različica 166d3c8

### F-r08-09 — napaka — varnostna kopija v predogledu ne zajame tega, kar vpišem

- **Dan in ura (simulirano):** ponedeljek 12. 10., 20:40
- **Koraki:** ikona z števcem spremembe in »?« zgoraj (Središče za sinhronizacijo in varnostne kopije) → Izvozi JSON.
- **Pričakovano:** datoteka z mojimi strankami in treningi.
- **Opaženo:** okno pravi: »To je predogledna različica. Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena.« Pritisk na »Izvozi JSON« ni dal datoteke (20 s čakanja, brez sporočila). Vsega, kar sem ta teden vpisal, torej ni mogoče shraniti.
- **Cena:** če telefon odpove, izgubim stranke, pakete in zgodovino celega tedna.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 12:32:52, različica 166d3c8

### F-r08-10 — vrzel — v katalogu ni potiska bokov (hip thrust); »čas« vaje brez enote

- **Dan in ura (simulirano):** torek 13. 10., 16:10 (brez povezave, vlak)
- **Koraki:** Dodaj iz kataloga → iskanje »hip thrust«, »thrust«, »glute«, »bridge« → nič; »Dodaj »Hip thrust« kot novo vajo« → štiri izbire v angleščini. Pri teku po traku (»Treadmill Run«) polje »čas« kaže 10; vpisal sem »15 min«, kartica pokaže »S1 × 15:00«.
- **Pričakovano:** hip thrust v katalogu; pri času enota (minute / sekunde).
- **Opaženo:** hip thrust sem ustvaril sam. Zapis 15:00 se bere kot ura ali minute:sekunde.
- **Cena:** 2 min za vajo, ki jo imam pri vsaki drugi stranki; dvom, ali je 15:00 res 15 minut.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:50:07, različica 166d3c8

### F-r08-11 — vrzel — brez povezave aplikacija tega ne pove, in kaj je shranjeno ne vem

- **Dan in ura (simulirano):** torek 13. 10., 15:40–16:30 (nastavljeno »Brez povezave«)
- **Koraki:** offline on → Ustvari trening → dva termina s po tremi vajami → Končano z urejanjem načrta.
- **Pričakovano:** znak, da sem brez signala in da je vse shranjeno na telefonu.
- **Opaženo:** nobenega znaka brez povezave; vse je delovalo, kar je dobro. Ob vsakem shranjenem treningu se je odprlo okno za vabila v koledar (»Pošlji vabila v koledar«), ki v tunelu nima smisla.
- **Cena:** okoli 10 s na trening za zapiranje okna.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:50:07, različica 166d3c8

### F-r08-12 — vrzel — bolečina v kolenu nima lestvice 0–10; ne vidim poteka

- **Dan in ura (simulirano):** torek 13. 10., 18:45
- **Koraki:** Lucijin trening → Opombe → »Bolečina ali nelagodje v sklepu« (ni mogoče nastaviti ocene) → v »Opombe po meri« vpisal »Koleno 2/10 …« → kljukica »Shrani to v kartoteko stranke« → Zapiši opozorilo.
- **Pričakovano:** število 0–10 ob vsaki vaji; pravilo »več kot 3 = prenehaj« je moje, aplikacija ga lahko prikaže.
- **Opaženo:** izbira »Bolečina …« je ena sama, brez stopnje. Moje število je prosto besedilo. Opomba se pojavi pod »Treningi, ki čakajo na pregled« kot »3 stranke imajo nerešene povratne signale«, skupaj s Tilnom in Evo.
- **Cena:** pri Luciji bi rad videl potek bolečine čez tedne; zdaj ga moram brati iz besedila vsakič posebej.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:55:57, različica 166d3c8

### F-r08-13 — vrzel — za seznam stvari za tekmo (izkaznica, obleka, magnezij, trak) ni mesta

- **Dan in ura (simulirano):** torek 13. 10., 21:00
- **Koraki:** Meni: Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve; nič za opravila ali seznam.
- **Pričakovano:** preprost seznam opravil ali opomnik, vezan na datum tekme.
- **Opaženo:** nič takega ni. Seznam za tekmo bi moral napisati v Opombe Tilnove kartice.
- **Cena:** nič v denarju; ostane WhatsApp ali zapiski v telefonu, torej dve mesti za en teden.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:55:57, različica 166d3c8

### F-r08-14 — napaka — »Shrani kot rutino« iz Tilnovega treninga izgubi bremena

- **Dan in ura (simulirano):** sreda 14. 10., 07:35
- **Koraki:** Imenik strank → Tilen Čretnik → pri zgodovini treninga 2026-10-12 »Shrani kot rutino«.
- **Pričakovano:** rutina z 3 × 3 × 175 kg, 3 × 3 × 120 kg, 2 × 2 × 220 kg, kot sem jih načrtoval.
- **Opaženo:** okno »Uredi rutino« ponudi ime »Moč pred tekmo 2026-10-12« in tri vaje, vse z bremenom 0 (stolpec »kg«) in premorom 0. Serije in ponovitve so pravilne.
- **Cena:** rutino moram popraviti (3 polja) — enako dolgo, kot če jo vpišem na novo, zato gumb ne prihrani nič.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:57:24, različica 166d3c8

### F-r08-15 — napaka — ko sem trening prestavil na drug dan, je izginil načrt vaj

- **Dan in ura (simulirano):** četrtek 15. 10., 15:40 (odkrito ob 18:05)
- **Koraki:** Domenov trening v petek 16. 10., 18:00 sem sestavil: počep 4 × 8 × 80, potisk 4 × 8 × 65, veslanje 4 × 8 × 60 → na začetnem zaslonu pri kartici »Mišična masa« pritisnil »Uredi« → datum spremenil na 2026-10-15 → Shrani. Ob 18:02 odprl kartico, pritisnil »Začni trening«.
- **Pričakovano:** isti trening, samo na drug dan, s tremi vajami.
- **Opaženo:** kartica pravi »Program ni določen«, trening pravi »Vaj še ni. Pritisni tri pike (⋮) zgoraj desno in izberi Uredi načrt.« Načrta ne vidim nikjer. POTRJENO pri Maji, sobota 17. 10., 20:10: trening »Tek, zadnji trening« 19. 10. z eno vajo (Treadmill Run) → Uredi → datum 2026-10-21 → Shrani; kartica pravi »Program ni določen«, odprt trening »Ni vstavljenih vaj«. Prestavitev na drug dan vedno izbriše načrt.
- **Cena:** ob 18:00 pred stranko brez načrta; načrt moram znova vnesti (3 min).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 13:16:18, različica 166d3c8

### F-r08-16 — vrzel — intervalni tek: hitrost in odmor nimata polja

- **Dan in ura (simulirano):** petek 16. 10., 08:20
- **Koraki:** Maja: Treadmill Run → razširi vrstico: samo »Serije« in »čas«.
- **Pričakovano:** polje za hitrost (11 km/h) in za odmor (90 s hoje).
- **Opaženo:** vpisal sem 6 × 3 min; hitrost in odmor sem zapisal v opombo ob koncu treninga. (Znana vrzel o teku, tu samo nov dokaz.)
- **Cena:** 2 min na trening pri tekačici; opomba se ne vidi na kartici vaje.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 13:39:58, različica 166d3c8

### F-r08-17 — vrzel — za lastnika fitnesa ni mesečnega seznama in ni evidence plačil

- **Dan in ura (simulirano):** nedelja 18. 10., 11:00
- **Koraki:** začetni zaslon → Datumi (izbira od–do) → seznam; Meni → Upravljanje podatkov (je okno za varnostno kopijo); pregledal Imenik strank in profile.
- **Pričakovano:** seznam zaključenih treningov v oktobru s številom (do 20. v mesecu pošljem lastniku), znesek za 20 %, kdo je plačal koliko (30 €, 40 €, 60 €, paket 270 €).
- **Opaženo:** izbira datumov filtrira kartice, a število ni prikazano, izvoza seznama ni, zneskov ni nikjer. Število sem preštel s prstom (7 treningov v tem tednu). Plačila sem pisal v Opombe strank.
- **Cena:** 30–45 min vsak mesec za seznam in izračun v Excelu; 31 treningov na mesec = 31 ročnih preverjanj.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:43:35, različica 166d3c8

### F-r08-18 — vrzel — 12-tedenski cikel za Tilna je 12 ločenih terminov

- **Dan in ura (simulirano):** nedelja 18. 10., 09:00
- **Koraki:** Imenik strank → Tilen Čretnik → Načrtuj program → obrazec za en termin (ime, lokacija, datum, ura, »Ponovi vsak teden«, rutina).
- **Pričakovano:** program na 12 tednov z enim tednom počitka in obljubo »načrt do 25. 10.«.
- **Opaženo:** samo en termin naenkrat, ponovitev je enaka vsak teden; bremena naj bi se spreminjala, torej 3 treningi × 12 tednov = 36 terminov. Opomnika za 25. 10. ni.
- **Cena:** nekaj ur v enem večeru; zato bom cikel še naprej pisal v Excel. (Znana vrzel o načrtu teden za tednom; tu nov dokaz.)
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:43:35, različica 166d3c8

