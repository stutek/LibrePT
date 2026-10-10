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

### F-r02-07 — napaka — Nova vaja v urejevalniku načrta se vstavi na vrh seznama, prejšnja se zapre, vrstni red je obrnjen

- **Dan in ura (simulirano):** sreda 14. 10., 16:00
- **Koraki:** Možnosti treninga → Uredi načrt → »Vaja« → vpiši ime, ponovitve, kg → ponovno »Vaja« (trikrat).
- **Pričakovano:** vaja pod prejšnjo; po vrsti veslanje, pritisk na nogo, elastika.
- **Opaženo:** gumb »Vaja«, ki ga tapneš (prvi izmed treh vrstic »Vaja / Sklop / Počitek«), doda vrstico na vrh; prejšnja vrstica se skrči. Na treningu je vrstni red elastika (1/3), pritisk na nogo (2/3), veslanje (3/3), torej obratno od načrta. Vrstice ne spreminjam z »Prerazporedi«, ker sem že izgubil čas pri polju, ki ga je skrčena vrstica skrila (`tap` na skrčeno vrstico odpove).
- **Cena:** ~1 min na trening, da vrstni red popravim ali poskrbim, da je vrstni red načrta pravi (3 vaje: toplo, težko, elastika pride prva); ~5 min/teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:38:50, različica 166d3c8

### F-r02-08 — napaka — Prazen »Zapiši opozorilo« pri vaji naredi nerešen signal »Treningi, ki čakajo na pregled«

- **Dan in ura (simulirano):** sreda 14. 10., 16:40
- **Koraki:** Začni trening → tap na »Pritisk na nogo« → »Opombe« → (besedila nisem vpisal) → »Zapiši opozorilo« → »Zaključi vadbo« → »Zaključi zdaj« → »Zaključi zdaj«.
- **Pričakovano:** brez besedila in brez ocene se nič ne zapiše, ali pa me aplikacija opozori.
- **Opaženo:** pod zvončkom sem dobil »Treningi, ki čakajo na pregled: 1 stranka ima nerešene povratne signale iz treninga. Hans Reiter — Ena na ena (1)«, čeprav sem vpisal nič. Tudi imena gumbov izbire v oknu so za bralnik zaslona angleška (»Too Hard - Reduce Load«), znano.
- **Cena:** ~2 min na trening, da signal pregledam in razrešim; lažni signali zmanjšajo zaupanje v prave.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 09:38:50, različica 166d3c8

### F-r02-09 — napaka — Novi dokaz za F-r02-03: tudi sreda 16:00 se konča z »prazno vadbo«

- **Dan in ura (simulirano):** sreda 14. 10., 16:40
- **Koraki:** Začni trening → tap na vajo, na »S3 × R12 × 70 kg«, na »Časomer premora« → »Zaključi vadbo« → »Zaključi zdaj«.
- **Pričakovano:** označim serijo.
- **Opaženo:** nič od teh tapov ne označi serije; aplikacija dvakrat vpraša: »Do konca tega treninga je še približno 00h 54m. Ga želiš vseeno zaključiti zdaj?« in »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«. Dva potrditvena okna za vsak trening.
- **Cena:** ~1 min/trening več, in zgodovina Hansovih treningov je prazna (za tri treninge, ki jih bom zaračunal na sobni račun).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 09:38:50, različica 166d3c8

### F-r02-10 — vrzel — Zagon za 22 udeležencev: vpišem lahko le enega naročnika; za prisotnost ni mesta (novi dokaz za F-r02-01)

- **Dan in ura (simulirano):** četrtek 15. 10., 08:15
- **Koraki:** Ustvari trening → ime »Zagon za konferenco«, lokacija »Dvorana Triglav« → polje za stranko → »Dodaj »Peter Šinkovec« kot novo stranko« → Shrani → Možnosti treninga → Uredi načrt → Sklop (2 kroga) → osem vaj po 30 s.
- **Pričakovano:** »22 prisotnih od 25« ob terminu.
- **Opaženo:** termin kaže eno osebo (»PŠ Peter«). Število 22 nima polja; vpišem ga lahko le v ime ali opombo stranke. Osem vaj sem vpisal vsako posebej (ime, »drža«, 30), ker iz kataloga ne najdem slovenskih imen (znano).
- **Cena:** ~12 min za načrt, ki ga v sredo pripravim znova, ker četrtkov načrt ni več kot enkratna kopija; hotel zahteva število obiskovalcev za tedensko poročilo (~5 min/teden na roke).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:50:57, različica 166d3c8

### F-r02-11 — napaka — Po zaključenem treningu zvonček javi »Nenačrtovani programi: 1 program je pripravljen, a še ni dodeljen treningu«, čeprav sem program sestavil na tem treningu

- **Dan in ura (simulirano):** četrtek 15. 10., 08:15
- **Koraki:** Hans, ob 07:15: Uredi načrt (3 vaje) → Začni trening → Zaključi vadbo → Zaključi zdaj (dvakrat). Nato ob 08:15 drug trening.
- **Pričakovano:** tisti načrt je bil že na treningu; nič ni nenačrtovano.
- **Opaženo:** zvonček: »Nenačrtovani programi 1 program je pripravljen, a še ni dodeljen treningu. Ena na ena · Hans Reiter · 2026-10-15«. Znano je §80.182 le za odstranjeno in spet dodano stranko; tu stranke nisem odstranil.
- **Cena:** ~1 min/dan, da ugotovim, da ni res; nezaupanje do obvestil.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 09:50:57, različica 166d3c8

### F-r02-12 — napaka — Ime sklopa (»Zagon«) se ne pokaže: kartica ostane »Sklop vaj«

- **Dan in ura (simulirano):** četrtek 15. 10., 08:15
- **Koraki:** Uredi načrt → Sklop → polje »Naslov sklopa« → vpisal »Zagon« → Končano z urejanjem načrta.
- **Pričakovano:** kartica »Zagon«.
- **Opaženo:** kartica pravi »Sklop vaj«, krog pa »KROG 1 / 2«. Ne vem, ali je ime shranjeno ali ne.
- **Cena:** <1 min, kozmetika; pri večih sklopih (ogrevanje, moč) jih ne ločim.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 09:50:57, različica 166d3c8

### F-r02-13 — napaka — F-r02-11 se ponavlja za vsak zaključen trening: »Nenačrtovani programi« našteje vse že opravljene treninge

- **Dan in ura (simulirano):** petek 16. 10., 07:20
- **Koraki:** po četrtkovih štirih treningih (Hans, Vesna, Slavka, Jaka) odprem zvonček.
- **Pričakovano:** nič; vsi štirje načrti so bili na treningih, ki sem jih zaključil.
- **Opaženo:** »4 programi so pripravljeni, a še niso dodeljeni treningu. Ena na ena · Hans Reiter · 2026-10-15; Vadba v vodi · Vesna Oblak · 2026-10-15; Vadba v vodi · Slavka Jerman · 2026-10-15; Ena na ena · Jaka Kos · 2026-10-15«. Seznam raste z vsakim treningom.
- **Cena:** ~2 min/dan; po tednu dni zvonček laže o 15+ programih in prave opomnike prekrije.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:59:39, različica 166d3c8

### F-r02-14 — vrzel — Termin brez stranke se ne da shraniti: »Izbrati moraš vsaj eno stranko.«

- **Dan in ura (simulirano):** petek 16. 10., 07:20
- **Koraki:** Ustvari trening → »Jutranja vadba za goste«, Studio, 07:30–08:15 → Shrani.
- **Pričakovano:** termin skupine, ki ni vezan na stranko, saj pride 3 anonimnih gostov.
- **Opaženo:** okno »Izbrati moraš vsaj eno stranko.« Termin za jutranjo vadbo brez imen ne obstaja (dodatno k F-r02-01).
- **Cena:** vadbe za goste v aplikaciji ne vodim; ~3 vadbe/teden brez zapisa.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:59:39, različica 166d3c8

### F-r02-15 — napaka — Teža 27,5 kg je prikazana s piko (»27.5 kg«), čas vaje »S3 × 20:00« ne pove, da je to 3 × 20 minut

- **Dan in ura (simulirano):** petek 16. 10., 10:30
- **Koraki:** Uredi načrt → Veslanje na škripcu, kg 27.5; Kolo, »drža« 1200.
- **Pričakovano:** »27,5 kg« (slovenska decimalna vejica); za kolo en sam krog 20 min, brez privzetih treh serij.
- **Opaženo:** kartica pravi »S3 × R12 × 27.5 kg« in »S3 × 20:00«; serije so privzeto 3, tudi pri kolesu, in jih moram ročno spremeniti.
- **Cena:** <1 min, a pri 2,5 kg koraku uteži je pika v slovenščini zavajajoča; privzete 3 serije kolesa ~0,5 min na trening.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 10:03:38, različica 166d3c8

### F-r02-16 — napaka — Seznam treningov pri zaključenih treningih z mojim načrtom piše »Program ni določen« (novi dokaz za §80.6)

- **Dan in ura (simulirano):** nedelja 18. 10., 10:00
- **Koraki:** začetni seznam »Treningi«, pomik po sredi–soboti.
- **Pričakovano:** pri vsakem terminu, kjer sem ob njem vpisal tri vaje, ni opombe »Program ni določen«.
- **Opaženo:** četrtek 07:15 »Ena na ena … Program ni določen … Zaključeno«, četrtek 10:00 »Vadba v vodi … Program ni določen«, četrtek 14:30, petek 10:30 enako. Vsak od teh je imel tri vaje.
- **Cena:** za tedensko poročilo Katji ne morem iz seznama razbrati, kaj sem delal (~10 min/teden); stranki ne morem pokazati, kaj sva naredila.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:08:08, različica 166d3c8

### F-r02-17 — vrzel — Prijateljico, ki pride enkrat, moram vpisati kot polno stranko z imenom in priimkom (novi dokaz za §88.2)

- **Dan in ura (simulirano):** nedelja 18. 10., 10:05
- **Koraki:** Ustvari trening → vadba v vodi, torek 2026-10-20, 10:00 → polje za stranko → »Vesna Oblak« → »Prijateljica Vesne« → »Dodaj »Prijateljica Vesne« kot novo stranko« → Shrani → Shrani → okno »Pošlji vabila v koledar« → Končano.
- **Pričakovano:** »+1 gost« ob Vesni, brez kartoteke.
- **Opaženo:** imena prijateljice ne vem, zato sem vpisal »Prijateljica Vesne«; v imeniku zdaj nastane nova stranka, ki jo moram kasneje popraviti ali izbrisati. Po shranjevanju se odpre še okno za vabila v koledar (znano §88.6).
- **Cena:** ~3 min na gosta; imenik se polni s polovičnimi zapisi (v tednu 5 takšnih gostov).
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 10:10:02, različica 166d3c8
