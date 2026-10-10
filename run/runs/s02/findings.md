---
type: log
title: Ugotovitve s05 - dve napravi
description: Napake in vrzeli, zapisane ob odkritju.
tags: [exploratory, trainer-week]
---

### F-s02-01 — napaka — Na računalniku (A) je »Nadaljuj« pri izbiri teme neodzivna, dokler ne izbereš teme, zaslon pa tega ne pove

- **Dan in ura (simulirano):** nedelja 11. 10., 19:00
- **Koraki:** Se strinjam → zaslon »Izberi temo« (Dan, Polnoč, Razpredelnica, Cvet, Nebula) → Nadaljuj
- **Pričakovano:** Nadaljuj gre naprej ali pove, da je treba izbrati temo.
- **Opaženo:** Dotik na »Nadaljuj« ne naredi nič (orodje po 8 s javi, da se gumb ne da pritisniti). Šele ko pritisneš »Dan«, gre naprej. Nobeno besedilo ne reče, da je izbira obvezna.
- **Cena:** nekaj minut zmedenosti ob prvem zagonu; trener bi mislil, da je aplikacija zastala.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 15:27:00, različica dev (glava kaže »dev«)

### F-s02-02 — vrzel — Na računalniku (A, 1280×800) aplikacija ostane v ozkem stolpcu, 480 px v sredini; širok zaslon ne pomaga pri sestavljanju načrtov

- **Dan in ura (simulirano):** nedelja 11. 10., 19:15
- **Koraki:** Menu → Ustvari trening, na računalniku z oknom 1280×800 (posnetek A-new-session.png)
- **Pričakovano:** Na širokem zaslonu vidim hkrati seznam terminov, stranke in načrt, ali vsaj širši obrazec.
- **Opaženo:** Telo strani je široko 480 px (od 400 do 880 px), levo in desno je prazen gradient. Obrazec »Nastavitev treninga« ima notranje drsenje, polja »Ime treninga« in »Lokacija« so na polovični širini, gumbi »Zavrzi spremembe«, »Shrani«, »Odpri v beležki« ležijo spodaj desno, obvestila pa prekrivajo spodnji rob. Za en termin potrebujem na računalniku enako število dotikov kot na telefonu in več premikanja miške.
- **Cena:** Računalnik ni hitrejši od telefona; tipkovnica pomaga le pri tipkanju besedila.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 15:30:00, različica dev

### F-s02-03 — vrzel — Na telefonu (B) med treningom ni nobenega gumba »opravljeno, kot je v načrtu«; vajo zaključiš le z oceno »Prelahko« ali »Pretežko« ali z opombo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 17:00 in 21:00
- **Koraki:** Odpri termin → Začni trening → dotik na vajo (npr. Romanian Deadlift ali Dumbbell Goblet Squat) → pod njo so le trije gumbi: »Prelahko«, »Pretežko«, »Opombe«; poleg je ikona štoparice »Časomer premora«.
- **Pričakovano:** Gumb ali dotik, ki zapiše »serija opravljena po načrtu« (3 × 5 z 80 kg), da zgodovina pokaže, kaj je stranka res naredila.
- **Opaženo:** Pri Nini sem vpisal samo opombo (»Samo opomba, brez ocene«) in »Zaključi vadbo«. Aplikacija je vprašala: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Prazno vadbo sem zaključil. Za Jureta sem moral pritisniti »Prelahko« in »Pretežko«, čeprav stranka ni rekla ne enega ne drugega: to sta oceni, ne potrdilo serije.
- **Cena:** Vsak trening ima dodatni pritisk, ocena pa zapiše napačno sporočilo o stranki (»Prelahko – povečaj težo«), ki se potem pokaže na seznamu čakajočih in lahko zavede, ko odpiram naslednji teden. Dodatni dokaz: vaja z oceno Prelahko se v zgodovini vpiše kot tri opravljene serije, vaja z oceno Pretežko ali samo opombo pa kot »PRESKOČENO« (glej F-s02-09).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:20:00, različica dev

### F-s02-04 — napaka — Opozorilo pri obnovi pove, da bo »izgubljeno« vse, kar je na napravi, tudi tisto, kar je v datoteki enako; trener ne izve, kaj se res izgubi

- **Dan in ura (simulirano):** ponedeljek 12. 10., 22:20
- **Koraki:** Telefon (B): ikona oblaka v glavi → Izberi JSON datoteko → izbral A-ponedeljek.json (kopija z računalnika)
- **Pričakovano:** Okno pove, kaj ima datoteka drugače od telefona: katera dva treninga je trener končal na telefonu, katera sta samo na računalniku, ali pa ju združi.
- **Opaženo:** »Obnovitev zamenja vse na tej napravi. Izgubljeno bo: 4 stranke, 4 treningi, 4 zapisi vadbe, 2 zapisa prisotnosti, 5 zaznamkov k vajam. Podatke na tej napravi zamenjam s podatki iz datoteke?« Gumba »Obdrži, kar imam« in »Zamenjaj«. Števila so vse, kar je na telefonu. Štiri stranke so v datoteki iste; resnično se izgubijo samo zapisi vadbe, prisotnosti in zaznamki, ki jih v datoteki ni. Okno tega ne loči.
- **Cena:** Trener ne more presoditi, ali je varno pritisniti »Zamenjaj«. Če pritisne, izgubi ponedeljkovi vadbi (potrjeno spodaj, če se je zgodilo).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 16:12:00, različica dev

### F-s02-05 — vrzel — Dveh naprav brez Google Drive ni mogoče združiti: uvoz datoteke zamenja vse, zato ena naprava izgubi delo druge

- **Dan in ura (simulirano):** ponedeljek 12. 10., 22:25
- **Koraki:** Računalnik (A): torkov načrt Luka (počep 72,5 kg) in Alenka (izpadni korak 8 kg), izvoz kopije. Telefon (B): ob istem času po pomoti drugačna sprememba Alenkinega načrta (izpadni korak 3 × 10), v dnevu pa končani vadbi Jure in Nina. B: ikona oblaka → Izberi JSON datoteko → A-ponedeljek.json → Zamenjaj.
- **Pričakovano:** Napravi se združita: ponedeljkovi vadbi ostaneta in torkova načrta se uskladita ali pa aplikacija pokaže, v čem se razlikujeta.
- **Opaženo:** Telefon ima po uvozu vse kot računalnik: obe ponedeljkovi vadbi spet kažeta »Zamuja«, signali iz vadbe Jureta (»Čakajoče na pregled«) so izginili (»Nič ne čaka na pregled«), moja po pomoti spremenjena vrstica izpadnega koraka je zamenjana z računalniško. Aplikacija ne reče nič o tem, kaj se je zgodilo s pon. vadbama. V oknu ikone oblaka piše: »Naloži varnostno kopijo .json. Vse na tej napravi zamenja s tem, kar je v datoteki.« Združevanje obljublja le Google Drive: »Ohrani stranke, programe in zgodovino vadb usklajene med svojimi napravami« — tega z datotekami ni mogoče preveriti.
- **Cena:** Trener mora izbrati, katera naprava velja. Delo druge je treba vnesti znova na roke (Luka in Alenka: 2 vrstici, 8 dotikov). Če bi pritisnil »Zamenjaj« brez shranjene kopije telefona, bi ostala samo računalniška različica in dve opravljeni vadbi bi bili izgubljeni.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 16:18:00, različica dev

### F-s02-06 — napaka — Rdeča značka »OGROŽENO — NAREDI KOPIJO« in »27 sprememb … ni v Google Drive« pokažeta na napravi, ki ima podatke v datoteki, izvožene minuto prej; datoteka v štetju ne šteje

- **Dan in ura (simulirano):** torek 13. 10., 20:10
- **Koraki:** Računalnik (A): ikona oblaka → Izberi JSON datoteko → B-torek.json → Zamenjaj. Nato odprem vadbo.
- **Pričakovano:** Podatki so enaki datoteki, ki sem jo pravkar uvozil, zato ni opozorila.
- **Opaženo:** V glavi rdeča značka »OGROŽENO — NAREDI KOPIJO«. Okno ikone oblaka: »27 sprememb na tej napravi še ni v Google Drive.« Značka je izginila šele, ko sem na A izvozil svojo datoteko (A-torek.json). Število 27 je ostalo tudi po izvozu v datoteko. Google Drive nisem povezal in ga s tem orodjem ne morem.
- **Cena:** Opozorilo kriči, čeprav so podatki varni v datoteki; trener ne ve, ali mora storiti kaj več. Tisti, ki uporablja datoteke, ne bo nikoli videl »0 sprememb«.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:40:00, različica dev

### F-s02-07 — napaka — Pri novem telefonu se moji podatki in tema ne prenesejo iz kopije; opozorilo »vsebina, ki jo je dodal ta predogled, ni vključena« pa ne pove, kaj

- **Dan in ura (simulirano):** nedelja 11. 10., 20:40 in torek 13. 10., 20:30
- **Koraki:** A: Nastavitve → Moji podatki → telefon 041 999 888 → Shrani moje podatke; Nastavitve → Tema → Polnoč; ikona oblaka → Izvozi JSON. B: ikona oblaka → Izberi JSON datoteko → Zamenjaj. B: Nastavitve → Moji podatki.
- **Pričakovano:** Moji podatki in tema pridejo na B, ali pa oba zaslona povesta, da ne.
- **Opaženo:** Stranke, termini, načrti, opombe, signali (vseh 10) in zaključene vadbe so prišli na B. Moji podatki (B kaže staro 041 555 123, ne 041 999 888) in tema (B ostane »Dan«) nista prišla. »Tvoji podatki … Ostanejo na tej napravi.« je torej res. Pri prvem zagonu na B pa sem moral vseeno vpisati vsa štiri polja (»Vsa štiri polja so obvezna«), še preden sem lahko uvozil kopijo. Opozorilo v oknu kopije: »To je predogledna različica. Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena.« V praksi so prišli vsi moji vpisi (4 stranke, 4 načrti, opombe), zato stavek ne ustreza temu, kar sem videl.
- **Cena:** Pri novem telefonu 4 polja vpisati znova in izbrati temo; opozorilo, ki ga ne razumem, vzbuja dvom, ali je kopija popolna.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:45:00, različica dev

### F-s02-08 — napaka — Napis »Vse na tej napravi je že v Google Drive« na praznem telefonu, ki Googla nikoli ni videl

- **Dan in ura (simulirano):** nedelja 11. 10., 20:45
- **Koraki:** B (nov telefon): Se strinjam → Dan → Nadaljuj → profil → Začni s prazno aplikacijo → ikona oblaka
- **Pričakovano:** Okno pove, da Drive ni povezan in da na telefonu še ni ničesar.
- **Opaženo:** »Vse na tej napravi je že v Google Drive. Vprašaj v glavi pomeni, da spremembe v Google Drive niso znane: ni povezan ali ni dosegljiv.« Stavek je pri 0 spremembah napačen: Drive ni povezan.
- **Cena:** Trener, ki bere samo prvi stavek, misli, da ima kopijo v oblaku.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:46:00, različica dev

### F-s02-09 — napaka — Zgodovina stranke po zaključeni vadbi pokaže vajo z oceno »Pretežko« in z opombo kot »PRESKOČENO«, »Prelahko« pa kot opravljene serije; opomba o bolečini ne pride v kartoteko

- **Dan in ura (simulirano):** torek 13. 10., 20:20 (podobno kot znano §80.6, nov dokaz)
- **Koraki:** Računalnik (A): Imenik strank → Jure Kos → Zgodovina zabeleženih vadb; isto za Alenko Vidmar.
- **Pričakovano:** Vse tri serije vsake vaje, opomba o tehniki, opomba o koleni.
- **Opaženo:** Jure: »Romanian Deadlift (RDL) PRESKOČENO« (označil sem Pretežko in Tehnika popušča z opombo), »Barbell Row: 30 kg×10, 30 kg×10, 30 kg×10« (označil sem Prelahko). Alenka: »Romanian Deadlift (RDL): 25 kg×8, 25 kg×8, 25 kg×8« (Prelahko), »Walking Lunges PRESKOČENO« (opomba Bolečina ali nelagodje, »Shrani to v kartoteko stranke« je bilo vklopljeno). Poškodbe in omejitve Alenke ostanejo »Osteopenija, brez skokov«, opomba o desnem kolenu je samo na seznamu »Čakajoče na pregled«.
- **Cena:** Pri naslednjem treningu moram opombo iskati na seznamu signalov; zgodovina o vaji, ki je stranko bolela, pravi, da je nisem naredila.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 16:50:00, različica dev
