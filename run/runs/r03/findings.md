---
type: log
title: Ugotovitve tedna r03
description: Napake in vrzeli, ki sem jih našla med tednom z aplikacijo LibrePT.
tags: [exploratory, trainer-week]
---

### F-r03-01 — vrzel — Stranka nima mesta za plačila, pakete ur in karte

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:30
- **Koraki:** Meni, Imenik strank, Dodaj stranko; pregledala polja (ime, vzdevek, e-pošta, telefon, Cilji treninga, Poškodbe in omejitve, Opombe); odprla kartico Branke Sešel.
- **Pričakovano:** polje ali seznam za mesečno karto, paket 10 ur (ostane 6), »plačala 5. 10.«, »nakazilo še ni prišlo«.
- **Opaženo:** kartica ima samo Cilji, Poškodbe, Opombe, E-pošta, Telefon, GDPR. Karto, pakete ur in dolg sem vpisala v »Cilji treninga« in »Opombe«. Aplikacija jih ne šteje in ne opomni.
- **Cena:** zvezek ostane za denar: okoli 30 minut na teden (seštevanje gotovine, štetje ur paketa, opomniki za plačila).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:12:00, različica 166d3c8

### F-r03-02 — vrzel — Iz kartice stranke ni mogoče poklicati ali poslati SMS

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:30
- **Koraki:** Imenik strank, Branka Sešel; pregledala gumbe na kartici.
- **Pričakovano:** tapnem telefonsko številko in se odpre klic ali SMS (Branki moram poslati opomnik za karto).
- **Opaženo:** telefon je navaden besedilni podatek »031 111 003«. Gumb za e-pošto obstaja (»E-pošta ni vpisana«), za SMS ali klic ni nobenega.
- **Cena:** številko prepišem v SMS ročno, vsakič približno 1 minuta, deset do dvajset sporočil na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:12:00, različica 166d3c8

### F-r03-03 — vrzel — V rutini ni časa dela in odmora na postajo; vaje s časom imajo »ponovitve«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 15:00
- **Koraki:** Meni, Vaje in rutine, Rutine, Ustvari rutino; dodala šest postaj; pogledala vrstico vsake vaje.
- **Pričakovano:** za krog »45 s dela, 30 s odmora, 3 krogi«, »hoja po stopnicah 1 min«, »plank na kolenih 30 s« polja za čas.
- **Opaženo:** vsaka vrstica ima serije, ponovitve, breme, odmor (privzeto 60). Plank (Izometrija) in hoja po stopnicah (Kardio) imata isto polje »ponovitve« (privzeto 10). Krog sem zapisala v »Opis« rutine kot besedilo. Na seznamu rutin piše »Počep ob klopi 3×12 · BW«.
- **Cena:** vsak ponedeljek, sredo in petek ročno prevedem čase v »ponovitve«, ali jih nosim v glavi; okoli 5 minut na vadbo.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:30:00, različica 166d3c8

### F-r03-04 — napaka — Obrazec »Ustvari vajo po meri« in izbira elastike imata angleške izbire; opreme »kettlebell« ni

- **Dan in ura (simulirano):** ponedeljek 12. 10., 15:00
- **Koraki:** Meni, Vaje in rutine, Dodaj vajo; odprla izbire Ciljna mišična skupina, Oprema, Vzorec giba; v rutini pri veslanju z elastiko odprla polje za breme.
- **Pričakovano:** slovenske izbire; oprema Kettlebell za »počep s kettlebellom« in »mrtvi dvig 12 kg«.
- **Opaženo:** »Chest, Back, Legs, Shoulders, Arms, Core, Recovery, Cardio«, »Barbell, Dumbbell, Cable, Machine, Band, Bodyweight«, »Horizontal Push, Hinge, Lunge, Isolation, Mobility«; pri elastiki »Light / Medium / Heavy«. Kettlebella ni; izbrala sem Dumbbell. Naslovi polj so slovenski, vrednosti angleške.
- **Cena:** vsako vajo moram ugibati, kaj pomeni angleška izbira (15 vaj, okoli 10 minut skupaj); kettlebell v katalogu bo napačen.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:30:00, različica 166d3c8

### F-r03-05 — napaka — Na kartici vaje ni gumba »opravljeno«; serije ne znam zabeležiti

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:00 do 19:02 (ura telefona 17:50, nato 19:02)
- **Koraki:** Meni, Vaje in rutine, Rutine, Začni skupinski trening; dodala pet strank, vsaki rutino; Odpri v beležki; Začni trening; tapnila na »Počep ob klopi«, na »1/12«, na »S3 × R12 × BW«, na ikono štoparice (»Časomer premora«), »Začni premor«, »Prelahko«; nato Zaključi vadbo.
- **Pričakovano:** gumb ali kljukica za vsako opravljeno serijo, da se zapiše, kaj je stranka naredila.
- **Opaženo:** aktivna kartica ima samo »Prelahko«, »Pretežko«, »Opombe« in štoparico; spodaj »+ Vaja«, »+ Sklop«, »+ Počitek«. Po 30 ukazih serije nisem zabeležila. Ob koncu je okno rekel: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Poskus poteze s prstom (simulirana poteza čez kartico) ni nič spremenil. Če je zapis serije poteza, je ni nikjer napisano. Torek 13. 10., 09:05 pri Vidi: tapnila štoparico na »Hoja po črti S3 × 0:10«; odštevalnik je tekel do 0:00 in naprej v minus (−0:13), serija pa se ni zabeležila; tudi ob zaključku: »Ni zabeleženih zaključenih serij«. Poskus s sproženim dotikom (touch) čez kartico prav tako brez učinka.
- **Cena:** brez zapisa serij aplikacija ne drži zgodovine vadb; pri skupini 10 žensk bi bilo to 10 kartic krat 6 vaj. Celo vadbo sem zapisala »prazno«, kar sem zapisala v zvezek (10 minut na vadbo).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 05:55:00, različica 166d3c8

### F-r03-06 — napaka — Po zaključeni vadbi obvestilo trdi, da so programi strank »pripravljeni, a še niso dodeljeni treningu«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 19:02 (popravljeno torek 13. 10., 10:05)
- **Koraki:** pet strank na treningu »Krožna vadba«; na zavihku Marija: Zaključi vadbo, Zaključi zdaj; odprla obvestila. Seznam Treningi je takrat kazal današnji dan brez kartice (kartica je bila pod lepljivo glavo seznama), naslednji dan pa »Zaključeno 01:10«.
- **Pričakovano:** obvestila nimajo kaj sporočati, saj je trening zaključen.
- **Opaženo:** »Nenačrtovani programi: 4 programi so pripravljeni, a še niso dodeljeni treningu«: Zdenka, Branka, Metka, Alenka, vsi 2026-10-12. Po torkovi zaključeni vadbi: »5 programov«. Trening pa je na seznamu »Zaključeno«. Obvestilo bere zaključene termine kot neobstoječe in sem ga prebrala kot izgubljen trening, dokler se nisem vrnila.
- **Cena:** vsak zaključen trening napolni obvestila z lažnim opozorilom; 3 do 5 minut zmede na dan, obvestilo postane šum.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:56:00, različica 166d3c8

### F-r03-07 — vrzel — Prisotnosti in gotovine (10 žensk, 51 €) ni kam vpisati

- **Dan in ura (simulirano):** ponedeljek 12. 10., 19:15
- **Koraki:** po zaključeni vadbi pregledala kartico stranke (Branka Sešel), seznam treningov, meni in obvestila.
- **Pričakovano:** za vsako vadbo seznam, kdo je prišel, in znesek, ki sem ga prejela (6 € Alenka, 45 € Branka).
- **Opaženo:** ni polja za prisotnost, plačilo, znesek ali karto. Trening ima samo kraj, čas, stranke in načrt. Skupina je omejena na vpisane stranke: deset žensk, ki jih imam v zvezku, bi morala biti vsaka posebej v imeniku (v tem tednu 9).
- **Cena:** zvezek ostane za prisotnost in denar: okoli 10 minut po vsaki skupinski vadbi (3 na teden) in 20 minut ob koncu tedna.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:00:00, različica 166d3c8

### F-r03-08 — napaka — Varnostne kopije si ne morem shraniti: »Izvozi JSON« najprej zahteva geslo, nato datoteka ne pride

- **Dan in ura (simulirano):** ponedeljek 12. 10., 19:20
- **Koraki:** vrstica z ikono »!/?«, Središče za sinhronizacijo in varnostne kopije, Izvozi JSON; geslo »posture-kettle-kettle-flywheel-anchor-jumprope«; Zapisal sem si ga, shrani; Izvozi JSON še enkrat.
- **Pričakovano:** datoteka z mojimi podatki na telefonu.
- **Opaženo:** okno »Geslo za varnostne kopije« z angleškimi besedami in opozorilom, da je geslo edina pot do kopije. Besedilo je: »Izvoženo in šifrirano.« Datoteke v orodju ni (to je znana težava brskalnika orodja, a jaz ne vem, ali je kopija res na telefonu). Geslo vsebuje isto besedo dvakrat (kettle-kettle). Zgoraj ves čas piše »OGROŽENO — NAREDI KOPIJO«.
- **Cena:** vsak večer ne morem preveriti, ali je kopija nastala; v tem tednu je nisem dobila nobenega večera (zato je nadaljevanje po prekinitvi nemogoče). Geslo bi si morala zapisati v zvezek: 5 minut ob prvem izvozu.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:02:00, različica 166d3c8

### F-r03-09 — vrzel — Sporočilo SMS ob terminu nima ure in kraja, besedila ni mogoče urediti, vsaka stranka posebej

- **Dan in ura (simulirano):** torek 13. 10., 11:00 (in sreda 14. 10., 15:00)
- **Koraki:** Ustvari trening, datum 2026-10-14, štiri stranke, Shrani; v oknu »Pošlji vabila v koledar« pri vsaki stranki »Pošlji SMS«.
- **Pričakovano:** eno sporočilo vsem udeleženkam: »Vadba v sredo ob 18:00 je v župnijski dvorani Sv. Jožef na Taboru. Odgovori »pridem«.«
- **Opaženo:** gumb »Pošlji SMS« odpre SMS pri eni stranki z besedilom »Trening: Krožna vadba — <povezava>« (naslov, datum, ura in kraj so samo v povezavi). Besedila ne morem urediti. Za štiri stranke so štirje gumbi. Za sporočilo »prosim za nakazilo« ali »na otok v petek« ni nobenega mesta.
- **Cena:** SMS sama pišem v telefonu, vsako stranko posebej: približno 10 minut na teden, ko se mesto ali ura spremenita (sreda 15:00: 11 žensk).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:20:00, različica 166d3c8

### F-r03-10 — vrzel — Telesne teže stranke ni kam vpisati kot meritev; ostane kot besedilo v opombi

- **Dan in ura (simulirano):** sreda 14. 10., 09:50
- **Koraki:** na podlogi pri Tanji: Opombe, »Samo opomba, brez ocene«, vpisala »Teža 82,4 kg (−1,2 kg od zadnjič)…«, »Shrani to v kartoteko stranke«, Zapiši opozorilo. Nato Meni, Imenik strank, Tanja Zver.
- **Pričakovano:** polje »Teža« z datumom in grafom ali vsaj seznamom, da vidim, koliko je Tanja izgubila od oktobra.
- **Opaženo:** vpis je v kartici pod »Opombe« kot »2026-10-14 — Mrtvi dvig: Samo opomba, brez ocene - Teža 82,4 kg …«. Vezan je na vajo »Mrtvi dvig«, gumb se imenuje »Zapiši opozorilo«. Primerjave tež ni. Zgodovina pod kartico: »Ni še zabeleženih vadb.«
- **Cena:** tedenske teže (Tanja) bi bile v besedilu; 2 minuti na vnos in nobenega pregleda trenda. Za stranko, ki je prišla zaradi teže, je to glavna meritev.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:40:00, različica 166d3c8

### F-r03-11 — vrzel — Kartica termina na seznamu ne kaže kraja; po spremembi kraja ni predloga, da obvestim stranke

- **Dan in ura (simulirano):** sreda 14. 10., 13:00
- **Koraki:** na seznamu Treningi pri terminu 18:00 »Krožna vadba« Uredi (svinčnik); Lokacija: »Župnijska dvorana Sv. Jožef, Tabor«; Shrani.
- **Pričakovano:** kraj je viden na kartici, ker imam ta teden štiri različne kraje (otok, Tabor, dvorana, Pohorje); po spremembi kraja me aplikacija vpraša, ali naj sporočilo pošlje strankam.
- **Opaženo:** kartica kaže uro, ime, »4/4 mest zasedenih« in ime rutine; kraja ne. Kraj je samo v filtru »Lokacija« in v odprti podlogi. Po »Shrani« ni okna ali opombe o strankah, ki še mislijo, da je vadba na otoku. Okno z vabili se je odprlo samo pri prvi pripravi termina.
- **Cena:** ob dežju moram sama pomisliti na vseh 11 žensk; vsak teden pogled v podlogo, da vidim kraj: 1 minuta na dan.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 07:05:00, različica 166d3c8


### F-r03-12 — vrzel — Udeleženke, ki ne pride (Metka, brez prevoza), ni mogoče označiti; mogoče jo je le odstraniti s termina

- **Dan in ura (simulirano):** sreda 14. 10., 17:50
- **Koraki:** Treningi, »Krožna vadba« (4 stranke), zavihek Metka, Možnosti treninga; pregledala ukaze.
- **Pričakovano:** pri stranki ukaz »ne pride« ali »odsotna«, da ostane v skupini in da vidim, koliko jih je prišlo (8 od 11, ne 11 od 11).
- **Opaženo:** Možnosti treninga imajo Uredi načrt, Vsi na ta načrt, Kopiraj ta načrt drugi stranki, Odpovej trening, Izbriši trening. Zavihek stranke nima ukaza za odsotnost. Kartica še vedno kaže »4/4 mest zasedenih«.
- **Cena:** število prisotnih in odsotnih vodim v zvezku: 3 do 5 minut po vsaki skupinski vadbi (3 na teden).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:45:00, različica 166d3c8

### F-r03-13 — napaka — Serija se zabeleži samo z gumbom »Prelahko« ali »Pretežko«; za »opravljeno kot načrtovano« ni gumba, signal pa ostane med obvestili

- **Dan in ura (simulirano):** sreda 14. 10., 18:05 do 18:20 (ura telefona 18:05; ob 17:55 je na kartici vaje pisalo »Prihodnje«)
- **Koraki:** Treningi, Krožna vadba, zavihek Marija, Začni trening; tapnila kartico »Dumbbell Goblet Squat S3 × R10«; Zaključi vadbo, Zaključi zdaj (okno: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«), Prekliči; tapnila »Prelahko«; Zaključi vadbo, Zaključi zdaj.
- **Pričakovano:** gumb »Opravljeno« za vajo ali serijo; ocena teže (lahko/težko) je dodatek, ne pogoj.
- **Opaženo:** šele ko tapnem »Prelahko«, se naslov vaje obarva zeleno in okno o prazni vadbi ne pride več. To je prvi razlog, zakaj sem v ponedeljek in torek mislila, da se serije ne dajo zabeležiti (F-r03-05): nikjer ne piše, da je »Prelahko« tudi zapis opravljene vaje. Dobesedno »Marija Pušnik, nerešeni povratni signali (1)« se pojavi med obvestili in vadbo, ki sem jo opravila po načrtu, prikaže kot signal, ki ga moram razrešiti. Šest žensk bi pri šestih vajah dalo 36 pritiskov na »Prelahko«.
- **Cena:** za vsako opravljeno vajo moram izbrati »prelahko« ali »pretežko«, čeprav ni ne eno ne drugo: lažni signali, ki jih moram pozneje razrešiti (2 do 5 minut po vadbi), ali pa prazna vadba.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:10:00, različica 166d3c8

### F-r03-14 — vrzel — Katalog nima vaj za hrbtenico (mačka–krava, ptičji pes, mostiček); vsako moram ustvariti sama, s privzetimi napačnimi izbirami

- **Dan in ura (simulirano):** četrtek 15. 10., 09:50
- **Koraki:** Ustvari trening (Silvo Pernat), Možnosti treninga, Uredi načrt, Dodaj iz kataloga; iskala Cat, Bird, Bridge, nato Mačka-krava, Ptičji pes, Mostiček; pri vsaki »Dodaj »…« kot novo vajo«, izbire Core ali Recovery, Bodyweight, Mobility, Moč; Shrani.
- **Pričakovano:** v katalogu vsaj osnovne vaje za stabilizacijo hrbtenice, da jih izberem.
- **Opaženo:** »Vaje: 48«, med njimi 5-10-5 Pro Agility Shuttle, Assault Bike, Barbell Bench Press; vaj za hrbtenico ni. Za vsako novo vajo je obrazec z devetimi polji, od tega štirimi obveznimi izbirami v angleščini (Chest, Barbell, Horizontal Push so privzete). Serije in ponovitve so potem v urejevalniku načrta: pri vsaki vaji posebej odpreš s »Razširi« (odpre se samo ena naenkrat), zato sem pri Mačka-krava ob prvem poskusu pomotoma zapisala 12 namesto 10 ponovitev in pri Mostiček 10 namesto 12, in sem morala načrt še enkrat odpreti in popraviti.
- **Cena:** okoli 20 minut za tri vaje, preden sem imela načrt za eno stranko (ob tem, da hrbtenica pomeni 8 enakih vaj na teden); zvezek z izpisom je hitrejši.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:50:00, različica 166d3c8

### F-r03-15 — napaka — Ponavljajoči termin, ki se začne danes (petek 16. 10.), današnjega termina ne ustvari

- **Dan in ura (simulirano):** petek 16. 10., 17:40
- **Koraki:** Ustvari trening; ime »Krožna vadba, otok«, lokacija, 18:00 do 19:15, datum 2026-10-16 (privzeto), šest strank; »Ponovi vsak teden«; označeni dnevi PET. (ob odprtju že označen) in PON.; Shrani; Končano.
- **Pričakovano:** termin danes ob 18:00 in nato vsak teden v petek ter ponedeljek.
- **Opaženo:** na seznamu je prvi termin ponedeljek 2026-10-19, nato petki 2026-10-23, 2026-10-30 … Termina 2026-10-16 ni, čeprav sem datum pustila na današnjem in je ura 17:40. Vadba čez 20 minut nima mesta na seznamu. Pot, ki je ne bi uganila: ustvariti še en termin brez ponavljanja za danes.
- **Cena:** 10 minut (ponoven vnos 6 strank in kraja) tik pred vadbo; če tega ne opazim, stoji pred 6 ženskami prazen telefon.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 11:15:00, različica 166d3c8

### F-r03-16 — napaka — Napačen »Prelahko« iz ene vadbe se na naslednji kartici pokaže kot nasvet »povečaj težo«

- **Dan in ura (simulirano):** sobota 17. 10., 09:00
- **Koraki:** sreda 14. 10. sem pri Mariji pritisnila »Prelahko« samo zato, da se vaja zabeleži (F-r03-13); v soboto Treningi, Sprehod, Pohorje, Uredi načrt, kartica Marije.
- **Pričakovano:** da pri Mariji (visok tlak) ni nobenega nasveta o teži, ki ga nisem izbrala.
- **Opaženo:** v okencu pod cilji piše »V TELOVADNICI: Dumbbell Goblet Squat, Prelahko – povečaj težo«. Marija dviga prek glave ne sme. Nasvet je nastal iz mojega pritiska, ki sem ga uporabila kot »opravljeno«, ne iz tega, kako ji je bilo.
- **Cena:** vsak lažni »Prelahko« pozneje vodi k napačnemu nasvetu pri stranki z visokim tlakom; moram ga razrešiti med obvestili ali ga ignorirati: 1 minuta na stranko.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:45:00, različica 166d3c8

### F-r03-17 — vrzel — Za pohod (4 km, 250 m vzpona) vaja »Outdoor Run« ponuja samo »Serije« in »Tempo«, ne razdalje ali vzpona

- **Dan in ura (simulirano):** sobota 17. 10., 08:50
- **Koraki:** Ustvari trening (Sprehod, Pohorje, Pekrska gorca, 09:00 do 11:00, pet strank), Odpri v beležki, Možnosti treninga, Uredi načrt, Dodaj iz kataloga, Outdoor Run.
- **Pričakovano:** razdalja v kilometrih in vzpon v metrih za pohod; en načrt za vse udeležence.
- **Opaženo:** vrstica ima »Serije 3« in »Tempo 10«. Razdalje in vzpona ni; hojo moram predstaviti kot tek. Načrt je nastavljen samo za prvo stranko (Marijo); za ostale štiri »Vsi na ta načrt«.
- **Cena:** pohod zapišem v ime termina ali v zvezek: 5 minut; v tem tednu to ni težava za varnost, saj je termin ob 09:00 brez signala.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:45:00, različica 166d3c8

### F-r03-18 — vrzel — Aplikacija nima opomnika; »Branko opomni 1. 11.« in »v ponedeljek v banko« ostaneta v glavi

- **Dan in ura (simulirano):** nedelja 18. 10., 10:00
- **Koraki:** Menu / Meni, Nastavitve; pregledala Jezik, Tema, Moji podatki, Povezani računi, Pomoč in pravno; nato Imenik strank in kartica Branka Sešel.
- **Pričakovano:** opomnik z datumom (»1. 11. Branka: nakazilo za november«) in z imenom stranke, da me aplikacija opozori.
- **Opaženo:** nastavitev opomnikov ni. Obvestila kažejo samo stanje treningov. Kartica stranke ima samo Opombe, brez datuma.
- **Cena:** plačila, opomnike in posebne opombe (kolk Zdenke, prevoz Metke, banka) nosim v zvezku ali telefonu: 10 do 15 minut na teden in tveganje, da kaj pozabim.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:10:00, različica 166d3c8
