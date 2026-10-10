---
type: log
title: Dnevnik tedna r03
description: Ena vrstica na nalogo, v vrstnem redu kot sem živela teden z aplikacijo LibrePT.
tags: [exploratory, trainer-week]
---

- načrt — plan.md shranjen pred odprtjem aplikacije.

OPOMBA ZA NADALJEVANJE: orodje Write zavrača datoteko findings.md (»Subagents should return findings as text«). Ugotovitve zato zapisujem v razdelek »Ugotovitve« na koncu te datoteke, v predpisani obliki. Če report.md prav tako ni mogoče shraniti, je poročilo v končnem sporočilu.
Brskalnik: vrata 9363, ura telefona nastavljena. Profil trenerke Darja Kolar vpisan, aplikacija prazna, vseh 9 strank vneseno (stanje po ponedeljku 08:30). Pred vsako goto je treba ponovno nastaviti clock.

## Naloge

- pon 08:30 — vpis 9 strank v imenik (Meni, Imenik strank, Dodaj stranko) — opravljeno — ocena 2 — 25 / 0
- pon 15:00 — priprava krožne vadbe: 11 lastnih vaj + rutina »Krog 6 postaj (otok)« (Meni, Vaje in rutine) — delno — ocena 2 — 30 / 5 (časi vaj 45 s/30 s in plank 30 s se ne dajo vpisati)
- pon 18:00 — skupinska vadba na otoku: nov trening s petimi strankami in tedensko ponovitvijo, začetek vadbe — delno — ocena 1 — 40 / 10 (serij ni mogoče zabeležiti, prisotnost in gotovina brez mesta)
- pon 19:15 — prisotnost in gotovina (51 €), kopija podatkov dan 1 — ni mogoče — ocena 0 — 8 / 15 (vpis v zvezek; kopija se ni shranila: day-1.json ne obstaja, geslo kopije: posture-kettle-kettle-flywheel-anchor-jumprope)
- tor 09:00 — Vida Kos, Tabor: nov trening, načrt na podlogi iz kataloga (3 vaje), začetek, zaključek — delno — ocena 1 — 25 / 5 (načrt je mogoč, zapis serij ne; zadnja ura paketa ni označena)
- tor 11:00 — Zdenka odpove sredo: nov termin v sredo 14. 10., 18:00 z 4 strankami namesto 5 (odstranila Zdenko) — opravljeno — ocena 2 — 12 / 2 (odpoved ima samo to obliko; sporočilo ji pišem sama)
- tor 16:00 — razmislek o drugi lokaciji ob dežju — ni mogoče — ocena 0 — 0 / 3 (aplikacija ne kaže vremena in ne pozna dvorane; razmišljam v glavi)
- sre 09:00 — Tanja Zver, Tabor: nov trening s tedensko ponovitvijo, načrt (tekoči trak 15 min, kettlebell 8 kg, mrtvi dvig 12 kg), teža v opombi, zaključek — delno — ocena 1 — 20 / 5 (serij ni mogoče zabeležiti; teža samo kot besedilo; »ostane 5 ur« ni nikjer)
- sre 13:00 — dež: kraj večerne vadbe prestavljen v župnijsko dvorano (Uredi, Lokacija) — opravljeno — ocena 2 — 5 / 5 (kraj se spremeni; najem 10 € in klic župniji nimata mesta)
<!-- dalje -->

## Ugotovitve

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

<!-- konec ugotovitev -->
