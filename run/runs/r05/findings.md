---
type: log
title: Ugotovitve r05
description: Napake in vrzeli, ki sem jih našel med tednom z aplikacijo.
tags: [exploratory, trainer-week]
---

### F-r05-01 — vrzel — hitre hoje 20 minut z merilnikom utripa ni mogoče vpisati kot hojo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:15
- **Koraki:** Ustvari trening, Odpri v beležki, ⋮ Uredi načrt, Vaja, polje »Merjeno v« (ponovitve / drža).
- **Pričakovano:** vaja z minutami (ali razdaljo) in poljem za utrip.
- **Opaženo:** »Merjeno v« ima samo »pon.« in »drža«. Hojo 20 minut sem vpisal kot 1 serijo, drža 1200 (sekund). Aplikacija jo prikaže kot »S1 × 20:00«, zato nekaj ve o času, a ponudi samo sekunde. Polja za utrip med hojo ni; utrip 110–118 in zgornjo mejo 125 moram pisati v opombo.
- **Cena:** vsaka hoja pri 9 starejših strankah je ročni preračun v sekunde; približno 1 minuta na vajo.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:39:51, različica 166d3c8

### F-r05-02 — napaka — besedilo na zaslonu pravi »Pritisni Končano«, gumb pa je zelena kljukica brez besede

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:20
- **Koraki:** ⋮ Uredi načrt, Vaja, vpis vaj; na dnu piše »Pritisni Končano, tipko Esc ali zunaj okna za zaključek«.
- **Pričakovano:** gumb z besedo »Končano«, ali besedilo, ki imenuje kljukico.
- **Opaženo:** gumb zgoraj desno je samo zelena kljukica. Ukaz »click Končano« je zadel skrit gumb v oknu z vabili. Tipka Esc zaključka ni naredila (zaslon je ostal v urejanju); kljukica je delovala.
- **Cena:** pol minute iskanja ob prvem urejanju načrta; trener na telefonu nima tipke Esc.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 10:39:51, različica 166d3c8

### F-r05-03 — vrzel — na zaslonu treninga ne najdem, kako označiti opravljeno serijo ali vpisati izmerjeno vrednost

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:20–08:30
- **Koraki:** ▶ Začni trening, dotik vaje »Hitra hoja 20 min«, dotik »Utežke 2 kg«, dotik cilja »S2 × R12 × 2 kg«, dotik ikone štoparice, »Zaključi vadbo«.
- **Pričakovano:** kljukica ali število ob vsaki seriji; polje za dejanski utrip, težo ali ponovitve.
- **Opaženo:** kartica ponuja samo »Prelahko«, »Pretežko«, »Opombe« in štoparico. Štoparica zažene odštevanje (19:53, »HITRA HOJA 20 MIN«). Ob zaključku okno pravi: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Po 25 ukazih nisem našel poti do zabeležene serije; vadbo sem zaključil prazno.
- **Cena:** pri vsaki od približno 14 vadb na teden izguba zapisa, kaj je stranka dejansko naredila; utrip in sladkor ostaneta v zvezku.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 10:44:52, različica 166d3c8

### F-r05-04 — napaka — zaključen trening kaže »Ni vstavljenih vaj«, čeprav je imel dve vaji

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:30
- **Koraki:** po zaključku vadbe v seznamu Treningi dotik »Hoja in utežke«.
- **Pričakovano:** načrt z vajama »Utežke 2 kg« in »Hitra hoja 20 min«.
- **Opaženo:** »Ni vstavljenih vaj. Vaj še ni. Pritisni tri pike (⋮) zgoraj desno in izberi Uredi načrt.« Seznam je kazal »Zaključeno 00:04«.
- **Cena:** načrt moram vpisati še enkrat; zapis o opravljeni vadbi izgubi vsebino. Morda povezano s praznim zaključkom (F-r05-03).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 10:44:52, različica 166d3c8

### F-r05-05 — napaka — središče za varnostne kopije pravi, da kopija ne vsebuje ničesar, kar je dodal predogled

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:35
- **Koraki:** dotik ikone s številko in vprašajem zgoraj desno (»Središče za sinhronizacijo in varnostne kopije«).
- **Pričakovano:** varnostna kopija mojih 6 strank in terminov.
- **Opaženo:** »Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena. Shrani si svojo kopijo vsega, česar ne smeš izgubiti.« Ob tem je gumb »Izvozi JSON« poleg. Stranke in termini, ki sem jih vpisal, so torej v tej različici brez kopije.
- **Cena:** če se telefon pokvari na Goričkem, izgubim vse stranke in zgodovino; 12 strank ročno nazaj približno 40 minut. Ni jasno, ali je »Izvozi JSON« prazen ali poln.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 10:45:47, različica 166d3c8

### F-r05-06 — napaka — namesto enega termina so nastali trije enaki, vaje pa so pristale med »Nenačrtovanimi programi«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 10:20–10:35
- **Koraki:** Ustvari trening, vpis imena, kraja, 10:30–11:30, stranka Jožef Rituper, Odpri v beležki; v oknu »Pošlji vabila v koledar« Končano; ⋮ Uredi načrt; vpis 3 vaj; kljukica; ▶; Zaključi vadbo. Ukazi so vmes enkrat potekli (zaslon je bil zaklenjen z oknom za vabila).
- **Pričakovano:** en termin Jožefa ob 10:30 z 3 vajami.
- **Opaženo:** seznam je pokazal štiri termine »Vstajanje in hoja z oporo« ob 10:30, vsi »Program ni določen«, s sporočilom »Se prekriva z 10:30 - 11:30, 10:30 - 11:30«. Dva sem izbrisal (okno: »zabeležene serije bodo izgubljene … program vsakega udeleženca pa se ohrani med nenačrtovanimi programi«). Ostal je zaključen termin brez vaj; vaje so v »Nenačrtovani programi: 1 program je pripravljen, a še ni dodeljen treningu«. Ne vem, ali so podvojitev povzročili moji prekinjeni ukazi; zaključen termin brez vaj je enak kot v F-r05-04.
- **Cena:** približno 8 minut čiščenja in ponovnega vpisa načrta za eno stranko.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:55:23, različica 166d3c8

### F-r05-07 — napaka — zaključek vadbe brez označene serije odstrani načrt s termina in ga odloži med »Nenačrtovane programe«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 14:55 (potrjeno na drugem terminu)
- **Koraki:** ⋮ Uredi načrt, 3 vaje, kljukica, ▶ Začni trening, Zaključi vadbo, dvakrat Zaključi zdaj, dotik zaključenega termina v seznamu.
- **Pričakovano:** zaključen termin ohrani načrt, ki sem ga vpisal.
- **Opaženo:** »Ni vstavljenih vaj«; obvestilo »2 programa sta pripravljena, a še nista dodeljena treningu: Vstajanje, hoja in ravnotežje · Ana Horvat«. To razloži F-r05-04 in F-r05-06. Ker serije ne najdem označiti (F-r05-03), se to zgodi pri vsaki vadbi.
- **Cena:** vsak zaključen obisk izgubi svoj načrt; po tednu mi ostane 12 praznih terminov in 12 nenačrtovanih programov.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:00:09, različica 166d3c8

### F-r05-08 — napaka — poskus varnostne kopije (znano §80.136), nov dokaz

- **Dan in ura (simulirano):** ponedeljek 12. 10., 20:00
- **Koraki:** dotik ikone s številko zgoraj desno, »Izvozi JSON«.
- **Opaženo:** odpre se okno »Geslo za varnostne kopije«: »Zapiši to geslo nekam izven tega telefona … LibrePT ti ga ne more priklicati nazaj«, z gumboma »Zapri« in »Zapisal sem si ga, shrani«. Datoteke ni (20 s čakanja). Okno je odprto za oknom središča, zato en dotik »Zapri« zapre samo zgornje.
- **Cena:** brez kopije v celem tednu; za trenerja, ki ima 12 strank, je to nesprejemljivo tveganje.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:00:09, različica 166d3c8

### F-r05-09 — napaka — rdeča značka »OGROŽENO — NAREDI KOPIJO« prekrije napis LibrePT in ne vodi do kopije

- **Dan in ura (simulirano):** torek 13. 10., 08:30
- **Koraki:** po tednu vnosa (7 strank, 5 terminov) odprem trening Roka in hoja.
- **Pričakovano:** opozorilo, ki ga lahko odpravim.
- **Opaženo:** zgoraj je rdeča značka »OGROŽENO — NAREDI KOPIJO«; logotip je pod njo viden samo kot črka »L«. Kopije pa ne morem narediti (F-r05-08).
- **Cena:** vsakič ko odprem aplikacijo, me opominja na nekaj, česar ne morem narediti.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:04:41, različica 166d3c8

Dopolnilo k F-r05-07 (torek 13. 10., 09:25): tudi ko sem pri prvi vaji pritisnil »Prelahko« (okno »Ni zabeleženih zaključenih serij« se tedaj ni pojavilo), je zaključen termin »Roka in hoja« pokazal »Ni vstavljenih vaj«. Načrt izgine ob vsakem zaključku vadbe.

### F-r05-10 — napaka — izmerjena vrednost je samo opomba v čakalni vrsti; po »Razreši« je nikjer več ni

- **Dan in ura (simulirano):** torek 13. 10., 16:10
- **Koraki:** pri vaji »Opombe«, »Samo opomba, brez ocene«, vpis »Utrip med hojo 110–118, pod mejo 125.«, »Zapiši opozorilo«; pozneje v »Čakajoče na pregled« kljukica »Razreši« pri Štefanu; nato Imenik strank, Štefan Gomboc.
- **Pričakovano:** utrip ostane v zgodovini stranke, da lahko pokažem napredek.
- **Opaženo:** kljukica opombo takoj odstrani brez vprašanja in brez potrditve. V zgodovini stranke piše »Prazen načrt, brez rutine • 4 min vadba«, »Utežke 2 kg PRESKOČENO«, »Hitra hoja 20 min PRESKOČENO« in opombe z utripom ni. Iskanje po strani »Utrip med hojo« najde 0 zadetkov. Opombe pri Jožefu (»dobro spal«) v čakalni vrsti sploh ni bilo.
- **Cena:** meritve (utrip, sladkor 7,1, koti kolen) so jedro dokaza o napredku za zdravnika in družino; zdaj jih pišem v zvezek: približno 3 minute na obisk.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:16:12, različica 166d3c8

### F-r05-11 — vrzel — za prvi obisk nove stranke ni mesta za vprašalnik in list za merjenje gibljivosti

- **Dan in ura (simulirano):** sreda 14. 10., 09:00
- **Koraki:** Imenik strank, Povabi stranko; Dodaj stranko (polja: ime, vzdevek, e-pošta, telefon, cilji, poškodbe, opombe).
- **Pričakovano:** obrazec z vprašanji (operaciji, zdravila, bolečina, cilji) in preglednica meritev (kot levo/desno koleno), ki ju lahko ponovim čez mesec.
- **Opaženo:** »Povabi stranko« zbere samo ime, stik in privolitev. Vprašalnika in meritev ni; v polje »Opombe« sem napisal vprašanja in »levo ___, desno ___«. Kota 115° in 105° bosta zato ob petkih le besedilo.
- **Cena:** pripravo vprašalnika (20 minut na novo stranko) delam na papirju; primerjava kotov čez čas je ročna.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:21:18, različica 166d3c8

### F-r05-12 — napaka — okno »Povabi stranko« se ne zapre z Esc, v seznamu kontrol nima gumba »Zapri« po imenu in blokira naslednje okno

- **Dan in ura (simulirano):** sreda 14. 10., 09:05
- **Koraki:** Imenik strank, Povabi stranko, Esc; nato ukaz »Zapri«; nato Dodaj stranko.
- **Pričakovano:** Esc ali ✕ zapre okno.
- **Opaženo:** okno je ostalo po Esc in po ukazu »Zapri«; zaprl ga je šele dotik ✕ v kotu (oznaka »Zapri«, zelo majhna). Vnos nove stranke je bil ves čas pod njim.
- **Cena:** 2 minuti in 4 ponovni poskusi.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:21:18, različica 166d3c8

### F-r05-13 — vrzel — seznam terminov ne kaže, kdo je stranka; ime termina ne sme vsebovati imena stranke

- **Dan in ura (simulirano):** sreda 14. 10., 16:00
- **Koraki:** Ustvari trening z imenom »Štefan – hoja« (zavrnjeno: »Ime termina ne sme vsebovati imena stranke … Napiši, kaj termin je, na primer Moč ali Ena na ena«), nato ime »Hoja in utežke«; seznam Treningi.
- **Pričakovano:** v seznamu vidim čas, kraj in stranko.
- **Opaženo:** kartica kaže »16:00 - 17:00«, »Hoja in utežke«, »1/1 mest zasedenih«; stranke in kraja ni. Tri vsebinsko enake kartice (»Hoja in utežke« pri Štefanu v ponedeljek, sredo in naslednji ponedeljek) ločim samo po datumu; kdo je na terminu, izvem šele z odprtjem ali s filtrom »Stranka«.
- **Cena:** vsak dan 12 dodatnih dotikov, da vem, h komu vozim; v avtu po slabem signalu je to 1 minuta na dan.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:26:34, različica 166d3c8

### F-r05-14 — vrzel — ni števca obiskov v paketu in ni pregleda, komu je koliko ostalo

- **Dan in ura (simulirano):** sreda 14. 10., 13:00
- **Koraki:** Imenik strank, profil stranke (opombe, GDPR, zgodovina vadb), Upravljanje podatkov.
- **Pričakovano:** paket (5 ali 10 obiskov) z odštevanjem ob vsakem zaključenem obisku in seznam, kdo je pri koncu.
- **Opaženo:** nič takega. Ostanke paketov (Ana 4, Terezija 2) sem zapisal v prosto polje »Opombe« in jih odštevam sam. Zgodovina vadb Terezije pravi »Ni še zabeleženih vadb«, čeprav je imela zaključen termin.
- **Cena:** pregled zvezka ob sredah 20 minut; napaka pri paketu stane 32 EUR.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:26:34, različica 166d3c8

### F-r05-15 — vrzel — odpoved nima razloga in ne obvesti stranke; »prestavi« ni, nov termin je brez načrta

- **Dan in ura (simulirano):** sreda 14. 10., 16:00
- **Koraki:** termin Štefan 16:00, ⋮ Odpovej trening; okno: »Odpovej ta trening? Ostane na urniku, označen kot odpovedan, in ga ni mogoče začeti. Zabeležene serije bodo izgubljene … program … se ohrani med nenačrtovanimi programi«. Nato Ustvari trening za ponedeljek 2026-10-19 08:30.
- **Pričakovano:** odpoved z razlogom (prehlad) in prestavitev na nov datum v enem koraku.
- **Opaženo:** termin dobi oznako »Odpovedano«. Razloga ni kam vpisati, stranka ni obveščena, prestavitve ni; nov termin sem moral ustvariti od začetka (ime, kraj, ura, stranka).
- **Cena:** približno 3 minute na odpoved; odpovedi so 2 na teden (prehlad, megla).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:26:34, različica 166d3c8

### F-r05-16 — vrzel — računi in plačila: ni cene, plačnika, števila obiskov v mesecu ne sporočila plačniku

- **Dan in ura (simulirano):** petek 16. 10., 14:00 in 15:30
- **Koraki:** Imenik strank (profil stranke, polja), Upravljanje podatkov, Filter »Stranka« v seznamu terminov.
- **Pričakovano:** za Marijo (plačnik sin Rajko, 4 obiski, 128 EUR) in Jožefa (plačnik Marjan) seznam opravljenih obiskov v mesecu in znesek; za Terezijo sporočilo hčerki Majdi z zneskom 290 EUR in številko računa.
- **Opaženo:** cene, plačnika in plačila ni nikjer. Plačnika (Rajko, Marjan, Majda) in »Plača z gotovino/nakazilom« imam v prostem polju »Opombe«. Število obiskov bi lahko prešteval ročno s filtrom »Stranka«, a zgodovina stranke po prazni vadbi pravi »Ni še zabeleženih vadb«. SMS-ja Majdi iz aplikacije ne morem poslati.
- **Cena:** računi ob petkih (približno 1 ura) ostanejo v zvezku in Googlu; 12 strank × mesečno štetje.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:43:20, različica 166d3c8

### F-r05-17 — vrzel — brez mesta za prevožene kilometre in za vožnjo med obiski; ni nadomestila za obisk brez signala

- **Dan in ura (simulirano):** nedelja 18. 10., 17:00
- **Koraki:** pregled menija (Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve), polja termina (ime, lokacija, datum, čas, ponavljanje).
- **Pričakovano:** razdalja ali čas vožnje ob terminu, tedenski seštevek kilometrov (410 km) za potne stroške; urnik za teden, ki ga lahko natisnem za Goričko.
- **Opaženo:** nič od tega. Kilometre in vožnjo (25 in 55 minut) pišem v zvezek. Ponavljajoči termin (sreda in petek 11:00) pa je deloval: ustvaril je 16 terminov naprej v enem koraku.
- **Cena:** 10 minut ob nedeljah za potne stroške.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:46:33, različica 166d3c8
