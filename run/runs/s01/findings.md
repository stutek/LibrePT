---
type: log
title: findings s01
description: findings za tek s01, ukraden telefon.
tags: [exploratory, trainer-week]
---

### F-s01-01 — vrzel — Na zaslonu treninga ne najdem, kako serijo označim kot opravljeno

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:45
- **Koraki:** Začni trening → pritisnil vajo »Potisk na klopi« → pritisnil »Prelahko«, »Opombe«, štoparico (»Časomer premora«) in oznako »S3 × R10 × 8 kg« → »Zaključi vadbo«.
- **Pričakovano:** gumb ali kljukica za vsako serijo (3 × 10 × 8 kg), da ostane zapis opravljenega.
- **Opaženo:** nobena kontrola ni povedala, da označuje serijo. Pri zaključku: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Trening sem zaključil prazen; na seznamu piše »Zaključeno 00:03«.
- **Cena:** zapis opravljene vadbe je prazen; številke za Katjo moram še vedno pisati v zvezek (okoli 5 min na dan).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 15:3x, različica c48ae4a (aplikacija kaže »dev«)

### F-s01-02 — napaka — Okno »Zabeleži povratne informacije« ima angleška imena za bralnik zaslona

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:50
- **Koraki:** Začni trening → vaja → »Opombe«; seznam kontrol pokaže »Note«, »Too Easy - Increase Load«, »Joint Pain / Discomfort«.
- **Pričakovano:** slovenska imena.
- **Opaženo:** angleška imena ob slovenskem zaslonu. To je že znano (§80.125), dodajam samo kot potrditev na tem oknu.
- **Cena:** nič zame, ki ne uporabljam bralnika.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 15:3x, različica c48ae4a
### F-s01-03 — napaka — Okno za varnostno kopijo pravi, da vsebina predogleda ni vključena; ne pove, kaj to pomeni za moje stranke

- **Dan in ura (simulirano):** ponedeljek 12. 10., 20:00
- **Koraki:** simbol oblaka z »0 ?« zgoraj → okno »Središče za sinhronizacijo in varnostne kopije«.
- **Pričakovano:** da mi okno pove, ali bodo moje stranke, termini in vadbe v kopiji.
- **Opaženo:** »To je predogledna različica. Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena. Shrani si svojo kopijo vsega, česar ne smeš izgubiti.« Ne piše, kaj je »vsebina, ki jo je dodal predogled«, ali so to moje stranke, in kako naj »shranim svojo kopijo«. Preverim, ko bom obnovil na B.
- **Cena:** ne vem, ali je kopija vredna kaj; odločitev je moja na slepo.
- **Prioriteta po tvoje:** P1 (če kopija izpusti stranke), sicer P2
- **Čas:** 2026-10-10 15:4x, različica c48ae4a
### F-s01-04 — napaka — Geslo za kopije je dolgo in polje pokaže le zadnji del

- **Dan in ura (simulirano):** ponedeljek 12. 10., 20:00
- **Koraki:** oblak → »Nastavi geslo za varnostne kopije«.
- **Pričakovano:** geslo, ki ga lahko v celoti vidim in prepišem v zvezek.
- **Opaženo:** aplikacija sama ponudi geslo iz šestih angleških besed (barbell-tempo-deadlift-quadrant-jumprope-impulse). Polje je ožje od gesla in na zaslonu vidim samo »…ipo-deadlift-quadrant-jumprope-impulse«; začetek moram dobiti s premikanjem po polju ali z gumbom »Kopiraj«, ki pa gre v odložišče telefona, ne v zvezek. Angleške besede nisem slišal za nobeno vajo v slovenščini.
- **Cena:** 2 minuti in tveganje, da zapišem napačno besedo; brez gesla je kopija neuporabna.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 15:4x, različica c48ae4a

### F-s01-05 — napaka — Na praznem novem telefonu okno pravi »Vse na tej napravi je že v Google Drive«

- **Dan in ura (simulirano):** sreda 14. 10., 15:05, telefon B
- **Koraki:** B zagnan, »Se strinjam«, tema, moji podatki, »Začni s prazno aplikacijo« → oblak z »0 ?« → okno za kopijo.
- **Pričakovano:** da prazen telefon, ki ni povezan z Google Drive, tega ne trdi; ali pa da ne pove nič.
- **Opaženo:** »Vse na tej napravi je že v Google Drive. Vprašaj v glavi pomeni, da spremembe v Google Drive niso znane: ni povezan ali ni dosegljiv.« Google Drive nikoli nisem povezal, ne na A ne na B. Na A je isto okno prej pravilno pisalo »12 sprememb na tej napravi še ni v Google Drive«.
- **Cena:** po kraji telefona bi trener lahko verjel, da je njegova kopija v oblaku, čeprav je ni.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-06 — vrzel — Nov telefon: obnovitev iz datoteke je skrita za uvodom, ki sprašuje, kar je v datoteki

- **Dan in ura (simulirano):** sreda 14. 10., 15:00
- **Koraki:** zagon B → »Se strinjam« → izbira teme (»Dan«, »Nadaljuj«) → obrazec z imenom, priimkom, telefonom in e-pošto (vsa štiri polja obvezna) → »Shrani in nadaljuj« → »Razišči z vzorčnimi podatki« / »Začni s prazno aplikacijo« → oblak → »Izberi JSON datoteko«.
- **Pričakovano:** ob prvem zagonu vprašanje »Imaš kopijo? Obnovi iz datoteke«.
- **Opaženo:** nobena od prvih treh zaslonov ne omeni obnovitve. Do kopije sem prišel šele po 10 dotikih in vpisu štirih polj, ki so v kopiji že shranjena (znano §88.14; tu dodajam ceno).
- **Cena:** okoli 3 minute in štiri polja, ki jih po obnovitvi aplikacija verjetno prepiše; trener, ki ne ve, da je oblak z »0 ?« pot do kopije, je obstal.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-07 — napaka — »Izjava o zasebnosti in GDPR« se iz slovenske aplikacije odpre v angleščini

- **Dan in ura (simulirano):** sreda 14. 10., 15:25, telefon B
- **Koraki:** Menu → Nastavitve → »Izjava o zasebnosti in GDPR«.
- **Pričakovano:** slovenska stran.
- **Opaženo:** stran privacy.html je v angleščini, `lang: en` (»LibrePT — Privacy & GDPR Statement«, »Zero Central Backend«). Stran, ki naj trenerju pove, kaj mora narediti z geslom in kopijo, je za slovenskega trenerja težko berljiva.
- **Cena:** 5+ minut branja v tujem jeziku; stranke po pravilih GDPR sprašujejo, kaj hranim.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-08 — vrzel — Aplikacija ne reče nič o ukradenem telefonu in podatkih na njem

- **Dan in ura (simulirano):** sreda 14. 10., 15:30, telefon B
- **Koraki:** na B pregledal okno za kopijo, »Nastavitve«, »Izjava o zasebnosti in GDPR« (iskal besede stolen, lost, wipe, erase, theft, lock).
- **Pričakovano:** kratko navodilo za trenerja z ukradenim telefonom: kaj vidi tat, ali je mogoče podatke izbrisati od daleč, ali moram stranke obvestiti (GDPR: zdravstveni podatki strank).
- **Opaženo:** nič. Edina povezana stavka je v angleški izjavi: »a backup is exactly what you reach for on the day the device is gone. Write the password down somewhere other than that device.« Aplikacija nima zaklepa s kodo; podatkov na A ne morem izbrisati; ni besede o obvestilu strankam, čeprav aplikacija sama pravi, da so to zdravstveni podatki (»Special Category Data (Health Data)«).
- **Cena:** ne vem, ali je na A kdo bere moje stranke; ne vem, ali moram po zakonu obvestiti sedem ljudi in koga; to je ravno dan, ko trener to išče.
- **Prioriteta po tvoje:** P1 (zdravstveni podatki strank na telefonu, ki ga nimam več)
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-09 — napaka — Po uspešni obnovitvi na B okno za kopijo še vedno pravi »Varnostne kopije s te naprave še niso šifrirane«

- **Dan in ura (simulirano):** sreda 14. 10., 15:12 (takoj po »Uvoz je uspel.«)
- **Koraki:** na B uvozil torek-zvečer.json z geslom in z vključeno kljukico »Zapomni si ga na tej napravi« → »Uvoz je uspel.« → pogled v okno za kopijo.
- **Pričakovano:** da si B zapomni geslo in da je naslednja kopija z B šifrirana s istim geslom (kot na A v torek: »Varnostne kopije s te naprave so šifrirane.«); ali da me aplikacija vpraša, ali želim nadaljevati s tem geslom.
- **Opaženo:** okno je še vedno kazalo »Varnostne kopije s te naprave še niso šifrirane.« in gumb »Nastavi geslo za varnostne kopije«. Po ponovnem odprtju aplikacije (goto) isto okno pravilno pravi »Varnostne kopije s te naprave so šifrirane.« in kaže »26 sprememb na tej napravi še ni v Google Drive«: B je geslo torej prevzel; napačen je bil samo zaslon takoj po uvozu (do osvežitve).
- **Cena:** zmeda za minuto: vpisal sem geslo pred minuto, pa me aplikacija spet sili, da si izmislim novo; do osvežitve tega ne vem.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-10 — napaka — Na B se zaključena ponedeljkova vadba odpre z »Ni vstavljenih vaj«, čeprav sem na A vpisal štiri vaje

- **Dan in ura (simulirano):** sreda 14. 10., 15:20, telefon B
- **Koraki:** B po uvozu torkove kopije → začetek → pritisnil kartico »Ena na ena« z oznako pon. 2026-10-12 06:45 (Katja).
- **Pričakovano:** zaključena vadba pokaže, kaj sem delal (Potisk na klopi, Počep s kettlebellom, Veslanje, Plank), ali pa vsaj to, da so bile vaje preskočene.
- **Opaženo:** »Ni vstavljenih vaj. Vaj še ni. Pritisni tri pike (⋮) zgoraj desno in izberi Uredi načrt.« Hkrati zgodovina na Katjini kartici navaja vse štiri vaje kot »PRESKOČENO«. Ne morem primerjati z A, ker A ni več; zato ne vem, ali je to izgubila kopija ali je tako že na A (znano §80.6 za zgodovino).
- **Cena:** ponedeljkov zapis Katje je na B videti prazen; trener bi mislil, da kopija ni prenesla vadbe.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:1x, različica c48ae4a

### F-s01-11 — napaka — Po zaključku para v parku obvestilo pravi, da je Tadejev program pripravljen, a ni dodeljen treningu

- **Dan in ura (simulirano):** sreda 14. 10., 18:05, telefon B
- **Koraki:** termin »Par v parku« (Mojca in Tadej, »Vsi na ta načrt«, zavihka »Skupaj«) → Začni trening → opomba → »Zaključi vadbo« → »Zaključi zdaj« (dvakrat).
- **Pričakovano:** vadba zaključena, brez opozoril.
- **Opaženo:** na začetnem zaslonu »Nenačrtovani programi · 1 program je pripravljen, a še ni dodeljen treningu. Par v parku · Tadej Cvikl · 2026-10-14«. Program je bil dodeljen treningu, ki sem ga pravkar zaključil. Ne morem primerjati z A (A je ukraden), zato ne vem, ali je zaradi obnovitve ali zaradi para.
- **Cena:** 2 minuti iskanja, kaj je »nenačrtovani program«; opozorilo, ki ga ne morem razrešiti, ostane na zaslonu.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:2x, različica c48ae4a

### F-s01-12 — vrzel — Paket ur (»paket 20, ostalo 12«) nima mesta; odpoved Simonu ne pove, ali se obisk odšteje

- **Dan in ura (simulirano):** četrtek 15. 10., 08:00, telefon B
- **Koraki:** termin za Simona → kartica »Uredi« → »Odpri v beležki« → ⋮ »Možnosti treninga« → »Odpovej trening«; nato »Imenik strank« → »Simon Žnidar«.
- **Pričakovano:** profil stranke z zapisom paketa (koliko ur je plačanih, koliko ostalo) in vrstico, da odpovedan termin ne porabi obiska.
- **Opaženo:** okno pravi: »Odpovej ta trening? Ostane na urniku, označen kot odpovedan, in ga ni mogoče začeti. Zabeležene serije bodo izgubljene.« O obisku ni besede. Profil stranke nima polja za paket, ostanek ali plačilo; samo opombe, e-pošto, telefon, GDPR. Kartica kaže »Odpovedano«.
- **Cena:** stanje paketov (Barbara 5, Lana 3, Rado 7, Mojca in Tadej 6, Simon 12) ostane v zvezku; okoli 5 min na teden in tveganje, da komu zaračunam odpovedano uro.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 16:3x, različica c48ae4a

### F-s01-13 — napaka — Po izvozu kopije v datoteko opozorilo »OGROŽENO — NAREDI KOPIJO« ostane, dokler ne osvežim aplikacije

- **Dan in ura (simulirano):** četrtek 15. 10., 20:00, telefon B
- **Koraki:** oblak → »Izvozi JSON« (datoteka librept_backup_2026-10-15.json, 26233 B) → zaprem okno → pogledam vrh zaslona.
- **Pričakovano:** da opozorilo takoj izgine, ker kopija je pravkar v datoteki.
- **Opaženo:** rdeči znak »OGROŽENO — NAREDI KOPIJO« je ostal na zaslonu. Po ponovnem odprtju aplikacije je izginil. Isto okno pa še vedno pravi: »39 sprememb na tej napravi še ni v Google Drive.« Trener ne ve, ali datoteka šteje kot kopija; znak in besedilo si nasprotujeta. Podobno kot F-s01-09 se zaslon po dejanju ne posodobi.
- **Cena:** minuta dvoma vsak večer, ali je kopija res naredena; trener izvozi drugič.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 16:4x, različica c48ae4a
