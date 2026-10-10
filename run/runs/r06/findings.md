---
type: log
title: Ugotovitve r06
description: Napake in vrzeli, ki jih je Maja našla med tednom z LibrePT.
tags: [exploratory, trainer-week]
---

### F-r06-01 — vrzel — Knjižnica vaj ima samo angleška imena in nima vaj, ki jih potrebujem (počep na škatlo, elastika nad koleni, korak na stopnico, hoja v klanec, noženje na škatlo)

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:00 (ura premaknjena)
- **Koraki:** Meni → Vaje in rutine → Rutine → Ustvari rutino → Dodaj vajo → pregledal seznam 48 vaj
- **Pričakovano:** slovenska imena ali vsaj iskanje po slovensko; vaje za rehabilitacijo
- **Opaženo:** imena kot »Barbell Row«, »Face Pulls«, »Romanian Deadlift (RDL)«; filtri »Chest«, »Back«. Ni počepa na škatlo, koraka na stopnico, vaje z elastiko, izpadnega koraka (le »Walking Lunges«), hoje v klanec. Za vsako bi morala dodati lastno vajo.
- **Cena:** okoli 10 min na teden samo za dodajanje vaj, ki jih v Excelu preprosto prepišem
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:39:39, različica 166d3c8

### F-r06-02 — napaka — V oknu »Ustvari rutino« izbrane vaje niso vidne: pod gumbom »Dodaj vajo« je seznam 48 vaj, vrstice z nizi, ponovitvami in težo so šele pod njim

- **Dan in ura (simulirano):** ponedeljek 12. 10., 08:00
- **Koraki:** Ustvari rutino → vpisal ime → Dodaj vajo → tapnil »Dumbbell Bench Press« → posnetek zaslona
- **Pričakovano:** da vidim, kaj sem izbrala, in vpišem serije, ponovitve, težo
- **Opaženo:** okno kaže še vedno samo seznam; izbrana vaja je le obrobljena. Vrstica z »3«, »10«, »0 kg« je pod seznamom, treba je drseti. Rutina se je v ozadju že pokazala na seznamu (»Dumbbell Bench Press 3×10«), čeprav je okno še odprto in nisem pritisnila »Shrani«. Vaja z napačnim klikom (gumb »Dodaj vajo« znova) ne zapre seznama.
- **Cena:** vsaka rutina ~3 min več; ne vem, ali je že shranjena
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:39:39, različica 166d3c8

### F-r06-03 — vrzel — Aplikacija nima mesta za plačila, račune, opomnike za neplačano in pakete ur

- **Dan in ura (simulirano):** ponedeljek 12. 10., 12:00 (in torek 14:00, četrtek 11:00, petek 14:00)
- **Koraki:** Meni → Nastavitve; Imenik strank → Marko Hribar → Uredi profil; pregledal vse menije
- **Pričakovano:** vidim, kdo je plačal oktober (Marko 89 EUR), pošljem opomnik, izdam račun (Tina, Sara, Gregor, Petra), vem, koliko ur paketa ima Luka (ostanejo 3) in Alenka (6)
- **Opaženo:** stranka ima samo polja ime, vzdevek, e-pošta, telefon, cilji, poškodbe, opombe in privolitev. Ni plačil, računov, paketov ur in opomnikov. Vse to sem vpisala v prosto »Opombe«: »OKTOBER NI PLAČAN: opomnik poslan 2026-10-12, rok petek 2026-10-16«. Opomba ne opomni nikogar v petek.
- **Cena:** vsaj 25 min na teden še v Excelu in v programu za račune, plus tveganje, da pozabim opomnik
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:47:00, različica 166d3c8

### F-r06-04 — napaka — Med treningom ne najdem, kako zabeležim opravljeno serijo; »Zaključi vadbo« pravi »Ni zabeleženih zaključenih serij«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 17:00 (ura premaknjena na 16:58)
- **Koraki:** Termini → Video klic → Začni trening → na kartici »Mrtvi dvig S3 × R5 × 70 kg« tapnila ime kartice, tapnila številke, tapnila uro (»Časomer premora«, odpre štoparico 0:06) → Zaključi vadbo → »Zaključi zdaj« → drugo okno
- **Pričakovano:** gumb ali tap za »serija 1 opravljena« z dejanskimi ponovitvami in težo (Jure je naredil 3 × 5 pri 70 kg)
- **Opaženo:** kartica ima samo gumbe »Prelahko«, »Pretežko«, »Opombe«. Dve vprašanji sta se vrstili: »Do konca tega treninga je še približno 00h 26m. Ga želiš vseeno zaključiti zdaj?« in »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Zaključila sem prazno vadbo; seznam kaže »Zaključeno 00:04«.
- **Cena:** brez opravljenih serij ni zgodovine; za vsak termin ostane delo v Excelu (~5 min na termin)
- **Prioriteta po tvoje:** P1 (če kontrole res ni; morda je skrita poteza, ki je ne vidim)
- **Čas:** 2026-10-10 10:58:43, različica 166d3c8

### F-r06-05 — napaka — Rutina, izbrana pri ustvarjanju termina, se zapiše kot ime programa na kartici, v beležki pa je načrt prazen (nov dokaz k znani napaki o izbiri programa)

- **Dan in ura (simulirano):** ponedeljek 12. 10., 16:58
- **Koraki:** Ustvari trening → ime »Video klic«, lokacija »Zoom«, 17:00–17:30 → iskanje »Jure« → izbrala rutino »Mrtvi dvig - tehnika« v spustnem seznamu → Odpri v beležki
- **Pričakovano:** beležka kaže vajo Mrtvi dvig 3 × 5 × 70 kg iz rutine
- **Opaženo:** beležka: »Ni vstavljenih vaj. Vaj še ni. Pritisni tri pike (⋮) zgoraj desno in izberi Uredi načrt.« Kartica na seznamu terminov pa pravi »Mrtvi dvig - tehnika«. Vajo sem morala vstaviti na novo iz kataloga.
- **Cena:** ~3 min na termin; kartica laže, da je program pripravljen
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:58:43, različica 166d3c8

### F-r06-06 — vrzel — Opozorilo v središču za kopije pravi, da kopija ne vsebuje podatkov, ki jih je dodal »predogled«, in rdeča značka »OGROŽENO — NAREDI KOPIJO« ne izgine

- **Dan in ura (simulirano):** ponedeljek 12. 10., 21:50
- **Koraki:** vrh zaslona ikona oblaka z »!« in »?« → okno »Središče za sinhronizacijo in varnostne kopije« → Izvozi JSON
- **Pričakovano:** datoteka s kopijo mojih strank, rutin in terminov
- **Opaženo:** okno: »To je predogledna različica. Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena. Shrani si svojo kopijo vsega, česar ne smeš izgubiti.« in »23 sprememb na tej napravi še ni v Google Drive.« Pritisk na »Izvozi JSON« je odprl okno za geslo; datoteke v brskalniku orodja ni (znano, §80.136). Ne vem, ali bi moje stranke bile v kopiji.
- **Cena:** ves teden delam z občutkom, da lahko izgubim vse; zapisujem še v Excel (~10 min na teden)
- **Prioriteta po tvoje:** P1 (izguba podatkov, če opozorilo drži)
- **Čas:** 2026-10-10 11:05:50, različica 166d3c8

### F-r06-07 — napaka — V urejevalniku načrta se vpis serij, ponovitev in teže tiho zapiše v PRVO vajo, ne v tisto, ki sem jo pravkar dodala

- **Dan in ura (simulirano):** torek 13. 10., 08:30 (in ponedeljek 21:00 pri Nini)
- **Koraki:** Termini → trening → ⋮ Možnosti treninga → Uredi načrt → Dodaj iz kataloga → »Barbell Bench Press« → vpisala 4, 8, 50 → Dodaj iz kataloga → »Barbell Row« → tapnila polja serij, ponovitev, teže in vpisala 4, 10, 40
- **Pričakovano:** polja pri »Barbell Row« (ali da je nova vrstica odprta)
- **Opaženo:** odprta je ostala vrstica prve vaje, nova je zložena (vidi se samo ime). Vpis je prepisal prvo vajo: »Barbell Bench Press« je dobil 4 × 6 × 70 kg. Napake nisem opazila, dokler nisem prebrala vseh polj. Naslednji kartici ne pokažeta napake, ker sta vrstici zloženi. Pri treh vajah sem za popravek porabila ~10 ukazov (pošiljanje obrazca vsakič zahteva razširitev vrstice z ikono ˅).
- **Cena:** ~3 min na termin z več vajami; tvegana tiha napaka v težah (varnost stranke)
- **Prioriteta po tvoje:** P1 (napačna teža pri Luki bi lahko prišla v zgodovino, ne da bi opazila)
- **Čas:** 2026-10-10 11:13:41, različica 166d3c8

### F-r06-08 — vrzel — Domačih vaj (rutine) ne morem poslati stranki kot PDF, povezavo ali video

- **Dan in ura (simulirano):** torek 13. 10., 11:30
- **Koraki:** Meni → Vaje in rutine → Rutine → Ustvari rutino → »Domače vaje Alenka (15 min)« → Shrani; pregledala kartico rutine in gumbe
- **Pričakovano:** gumb »Pošlji« ali »Izvozi«, ki naredi PDF ali povezavo z vajami za Alenko (sreda in petek)
- **Opaženo:** rutina ima samo gumb »Začni skupinski trening«; urejanje in pošiljanje ni. Stranke ne vidijo ničesar. Video vaj ne morem priložiti. Pomotoma sem vpisala čas zadrževanja »0:01« pri »Wall Sit« (polje za čas vzame sekunde, ne minute; pri »Hoja v klanec« je »15« postalo »0:15«).
- **Cena:** ~10 min na teden (PDF še vedno naredim zunaj aplikacije)
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:20:23, različica 166d3c8

### F-r06-09 — vrzel — Skupni klic »Online klepet«: ni prisotnosti (pridejo / opravičen); termin brez programa je označen z rdečim »Program ni določen«

- **Dan in ura (simulirano):** sreda 14. 10., 12:00
- **Koraki:** Ustvari trening → ime »Online klepet«, Zoom, 12:00–12:30 → iskanje in izbira Tina, Jure, Marko, Gregor → Shrani → Končano
- **Pričakovano:** da označim, kdo je prišel (Tina in Jure) in kdo se je opravičil (Marko, Gregor); klepet brez vaj ni napaka
- **Opaženo:** kartica: »4/4 mest zasedenih«, rdeč znak »Program ni določen«, oranžna vrstica »Zamuja 00h 00m«. Udeleženca lahko samo odstranim (»Odstrani s tega treninga«), kar izbriše sled opravičila. Vsak od štirih udeležencev se doda z ločenim iskanjem in tapom (~5 ukazov na osebo). V oknu z vabili je »Pošlji vabilo« neaktiven, ker pri strankah ni e-pošte.
- **Cena:** ~5 min na skupni klic; prisotnost vodim še v Excelu
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:28:30, različica 166d3c8

### F-r06-10 — napaka — Polje »ČAS« pri kardio vaji nima enote: vpisala sem 20 za 20 minut, aplikacija je zapisala 0:20 (20 sekund)

- **Dan in ura (simulirano):** sreda 14. 10., 21:00 (prvič ponedeljek 21:00 pri »Hoja v klanec«: 15 → »S1 × 0:15«)
- **Koraki:** trening z Nino → ⋮ Možnosti treninga → Uredi načrt → Dodaj iz kataloga → »Hoja v klanec na tekočem traku« → polje »ČAS« → vpisala 20
- **Pričakovano:** da polje pove enoto (min) ali da 20 pomeni minute; hoja v klanec 20 minut
- **Opaženo:** kartica v beležki kaže »S1 × 0:20«. Za 20 minut sem morala vpisati 1200 (kartica kaže »S1 × 20:00«). Polje nima napisane enote.
- **Cena:** napačen čas na načrtu za nosečo stranko; ~2 min za popravek
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:33:24, različica 166d3c8

### F-r06-11 — vrzel — Ni mesta za meritve stranke (teža, obseg pasu, obseg trebuha) in za primerjavo z zadnjo meritvijo

- **Dan in ura (simulirano):** četrtek 15. 10., 09:00 (in petek 16. 10., 10:00 pri Nini)
- **Koraki:** Imenik strank → Dodaj stranko (Sara Oblak) → pregledala polja; Termini → Prvi obisk → Uredi načrt; profil stranke
- **Pričakovano:** vnos »teža 62 kg, obseg pasu 71 cm« z datumom in pri naslednji meritvi primerjava (Nina: trebuh 88 cm, prej 86 cm)
- **Opaženo:** polja so samo cilji, poškodbe, opombe. Meritve sem vpisala v prosto »Opombe« kot besedilo (»Meritve 2026-10-15: teža 62 kg, obseg pasu 71 cm …«); primerjave ni. Plank 40 s sem vpisala kot vajo »Weighted Plank« (kartica »S1 × 0:40 × BW«). Anamneze ni kam zapisati razen v isto polje opomb.
- **Cena:** ~10 min na teden za prepis v Excel; primerjavo naredim v glavi
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:38:26, različica 166d3c8

### F-r06-12 — napaka — Pri ponavljanju vsak teden je označen napačen dan v tednu (današnji, ne dan vpisanega datuma)

- **Dan in ura (simulirano):** petek 16. 10., 16:00
- **Koraki:** Ustvari trening → ime »Online program« → datum 2026-10-19 (ponedeljek) → ura 12:00–12:30 → »Ponovi vsak teden« (kljukica) → Tina Zupan → Shrani
- **Pričakovano:** da je označen ponedeljek (datum je ponedeljek)
- **Opaženo:** v vrstici »PON. TOR. SRE. ČET. PET. SOB. NED.« je bil označen »PET.« (današnji dan, simulirani petek), čeprav sem vpisala ponedeljek 2026-10-19; kljukice so majhne (~20 pik); »PON.« nisem mogla izbrati z imenom, samo z izbirnikom polja. Po ročnem popravku (izbirnik polja, ne ime) seznam kaže ponedeljke 2026-10-19, 2026-10-26, 2026-11-02 …; polje »DO (NEOBVEZNO)« sem pustila prazno in seznam kaže vsaj osem ponovitev naprej. (Popravek: »--« v prvem branju je bil moj napačen izpis besedila, datumi so pravilni.)
- **Cena:** ~4 min; bi lahko ustvaril serijo na napačen dan
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:47:56, različica 166d3c8

### F-r06-13 — vrzel — Tedenski programi za 9 online strank: vsak je ločen termin z ločeno vajo, poslati jih ni mogoče (nov dokaz k znanima §88.5 in §88.3)

- **Dan in ura (simulirano):** petek 16. 10., 16:00 in nedelja 18. 10., 19:00
- **Koraki:** Imenik strank → Tina Zupan → Načrtuj program; Ustvari trening → Ponovi vsak teden → Odpri v beležki → Uredi načrt
- **Pričakovano:** v enem koraku pripraviti in poslati tedenski program vsaki stranki (Tina z opozorilom za koleno, Gregor brez dviga nad glavo)
- **Opaženo:** »Načrtuj program« odpre isti obrazec »Nastavitev treninga« kot »Ustvari trening«; ima samo »Zavrzi spremembe« in »Odpri v beležki«. Program mora imeti ime termina, uro in lokacijo. Pošiljanja ni (WhatsApp, e-pošta ali PDF). Za Tino sem v 25 ukazih naredila dve lastni vaji in en termin; za preostalih osem strank bi potrebovala ~3 ure. Zato sem druge programe pustila v Excelu.
- **Cena:** ~3 ure na teden (ponedeljek–nedelja, 9 strank)
- **Prioriteta po tvoje:** P1 (ta naloga je jedro mojega tedna)
- **Čas:** 2026-10-10 11:51:02, različica 166d3c8

### F-r06-14 — vrzel — Ni časovnega pasu stranke: Nina (Melbourne, 06:00) in Marko (London, 1 uro za nami) imata uro samo kot moj čas ali kot opombo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 21:00 (in sreda, petek 21:00)
- **Koraki:** Imenik strank → Dodaj stranko → Nina Kralj; Ustvari trening → ura 21:00
- **Pričakovano:** ob stranki piše »06:00 po njenem času« in aplikacija pozna zamik; ali vsaj polje za mesto/pas
- **Opaženo:** stranka nima polja za pas; vpisala sem ga v »Opombe« (»Trening 06:00 po njenem času = 21:00 prejšnji dan pri nas«). Termin kaže samo 21:00. Pri menjavi poletnega in zimskega časa (Avstralija 4. 10., Evropa 25. 10.) bi se zamik spremenil; opomba tega ne ve.
- **Cena:** ~5 min na teden preračunavanja; tvegano 25. oktobra, ko se pri nas ura zamakne
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 11:51:10, različica 166d3c8

