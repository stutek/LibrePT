---
type: log
title: Ugotovitve tedna r09
description: Napake in vrzeli, ki jih je Luka našel v LibrePT.
tags: [exploratory, trainer-week]
---

### F-r09-01 — napaka — Termin, ki se je šele začel, na seznamu piše »Zamuja 00h 00m«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 17:00:11 (ura telefona premaknjena)
- **Koraki:** na telefonu nastavim 17:00, odprem začetni zaslon, kjer je termin Jan 17:00 - 18:00.
- **Pričakovano:** termin se je pravkar začel; »Zamuja« ne bi smel pisati, dokler ni minila vsaj ena minuta.
- **Opaženo:** kartica termina kaže »Zamuja 00h 00m«.
- **Cena:** trenerja takoj opozori, da je v zamudi, čeprav ni. Majhna, a zmede.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:22:27, različica 166d3c8

### F-r09-02 — vrzel — Stranka nima polj za ceno, paket in plačila

- **Dan in ura (simulirano):** ponedeljek 12. 10., 14:00
- **Koraki:** Meni → Imenik strank → Dodaj stranko. Polja: ime, vzdevek, e-pošta, telefon, cilji, poškodbe, opombe, GDPR, jezik.
- **Pričakovano:** mesto za »28 € na uro«, »paket 10 ur«, število preostalih ur in »plačano / neplačano«.
- **Opaženo:** nič od tega. Ceno in paket sem vpisal v prosto polje »Opombe«. To besedilo se potem na zaslonu treninga kaže pod naslovom »PREDHODNE POŠKODBE IN OPOMBE«, skupaj s podatki o poškodbah.
- **Cena:** moram še naprej voditi tabelo plačil in preostalih ur zunaj aplikacije. Ocena 30–40 minut na teden (tudi nedeljski prepis v Excel).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 12:22:27, različica 166d3c8

### F-r09-03 — napaka — Povzetek vaje piše »S4 × R8 × 70 kg«: črki S in R nista slovenski okrajšavi

- **Dan in ura (simulirano):** ponedeljek 12. 10., 14:10
- **Koraki:** Možnosti treninga → Uredi načrt → Vaja; vpišem »Počep s palico«, 4 serije, 8 ponovitev, 70 kg; pritisnem »+ Vaja«.
- **Pričakovano:** zloženi vrstici piše »4 × 8 × 70 kg« ali s slovenskimi besedami (serije, ponovitve).
- **Opaženo:** »S4 × R8 × 70 kg«. Polji sta v obrazcu označeni »SERIJE« in »PON.«, zato S in R ne povesta ničesar. Isti zapis je tudi na podlogi treninga.
- **Cena:** bere se težko; stranki ne morem pokazati zaslona brez razlage.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:23:00, različica 166d3c8

### F-r09-04 — napaka — Okno za varnostno kopijo pravi, da kopija ne vsebuje tega, kar vpišem v predogledu

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:30
- **Koraki:** glava, gumb s številko in »?« → okno »Središče za sinhronizacijo in varnostne kopije«.
- **Pričakovano:** kopija vsebuje moje stranke in treninge.
- **Opaženo:** »Varnostne kopije in sinhronizacija se zapišejo v zadnji stabilni obliki, zato vsebina, ki jo je dodal ta predogled, ni vključena. Shrani si svojo kopijo vsega, česar ne smeš izgubiti.« Kopije ne morem narediti nikjer drugje. Poleg tega: »9 sprememb na tej napravi še ni v Google Drive« in »?«.
- **Cena:** vsi podatki prvega tedna so samo v telefonu; če telefon pade v vodo, je teden izgubljen. Zaupanje v aplikacijo je nižje, ker ne vem, kaj bi izgubil.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 12:33:00, različica 166d3c8

### F-r09-05 — napaka — Geslo za šifrirano kopijo je v angleških besedah, pokaže se pred izvozom

- **Dan in ura (simulirano):** ponedeljek 12. 10., 18:35
- **Koraki:** okno za kopijo → Izvozi JSON → okno »Geslo za varnostne kopije«.
- **Pričakovano:** geslo v mojem jeziku ali vsaj navodilo, kako ga prepišem.
- **Opaženo:** predlagano geslo je »flywheel-jumprope-hinge-cadence-sprint-mobility«; gumbi so »Drugo geslo«, »Kopiraj«, »Zapisal sem si ga, shrani«. Datoteka po izvozu v tem brskalniku ni nastala (znano, §80.136).
- **Cena:** šest angleških besed, ki jih moram prepisati na papir; verjetno napačno prepisano in kopija je neuporabna.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 12:34:00, različica 166d3c8

### F-r09-06 — napaka — Seznam terminov ne pokaže stranke; zaključen termin ima še vedno gumb »Začni trening« in ob zagonu izgubi načrt

- **Dan in ura (simulirano):** torek 13. 10., 17:00
- **Koraki:** začetni zaslon → pritisnem kartico »Ena na ena« (mislil sem, da je Majin termin ob 17:00; seznam je kazal tudi včerajšnjega) → Začni trening.
- **Pričakovano:** na kartici piše, katera stranka je na terminu; zaključenega termina ne morem zagnati še enkrat.
- **Opaženo:** obe kartici piše samo »Ena na ena«, »1/1 mest zasedenih«. Imena stranke ni, ker pravilo ne dovoli imena stranke v imenu termina (»Ime termina ne sme vsebovati imena stranke«). Odprl sem Janov včerajšnji termin in pritisnil Začni trening. Pokazalo se je »Trening se je začel izven urnika … začeto 24h 00m prepozno« z gumbi »Ni se zgodil«, »Ohrani urnik«, »Prilagodi čas«. Tipka Esc okna ne zapre, zapre ga samo ✕. Zaslon treninga je potem pisal »Ni vstavljenih vaj« in Uredi načrt je bil prazen, čeprav je imel ponedeljkov termin tri vaje. Ko sem zaključil, je zgodovina ostala pravilna.
- **Cena:** zmešan termin, okoli 12 ukazov za popravilo; trener s 6 strankami v istem tednu ne ve, katera kartica je čigava, in lahko zažene napačnega.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-07 — napaka — Vaje ni mogoče označiti kot opravljene, če ne pritisnem »Prelahko« ali »Pretežko«

- **Dan in ura (simulirano):** torek 13. 10., 17:05
- **Koraki:** Maja, termin ob 17:00: Začni trening → pritisnem »Počep na škatlo« → (poskusim: pritisk na povzetek »S3 × R12 × 10 kg«, ikona štoparice »Časomer premora«, »Opombe« → »Samo opomba, brez ocene«, »Opombe« → »Dober napredek«) → pritisnem naslednjo vajo → Zaključi vadbo → Zaključi zdaj.
- **Pričakovano:** gumb ali poteza »opravljeno« za vajo ali serijo. Maja je naredila vse, kar je bilo v načrtu.
- **Opaženo:** vsa pot z zgornjimi pritiski se konča z oknom »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«. Vaja postane »Zaključeno« šele, ko pritisnem »Prelahko« ali »Pretežko« in nato odprem naslednjo vajo. Ponedeljkov Jan je bil v zgodovini zabeležen samo zato, ker sem pri počepu pritisnil »Prelahko«; potisk in veslanje sta pisala »PRESKOČENO«, čeprav ju je opravil.
- **Cena:** vsaka vadba ima ali lažen signal (»Prelahko«) ali prazen zapis. Dnevnik vadb za stranko, ki je trenirala po načrtu, ne obstaja. Po moji oceni 1 minuta na stranko na dan. V nedeljo 18. 10. je v »Čakajoče na pregled« 15 signalov, od tega 8 lažnih »Prelahko – povečaj težo«, ki sem jih pritisnil samo zato, da se je vadba zapisala; vsakega je treba ločeno razrešiti (15 tapov).
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-08 — napaka — Nušina prva ura: vse tri vaje v zgodovini piše »PRESKOČENO«, opomba iz treninga se ne vidi

- **Dan in ura (simulirano):** sreda 14. 10., 11:00
- **Koraki:** termin 10:00 → Začni trening → pritisnem vse tri vaje po vrsti → »Opombe« → »Samo opomba, brez ocene« → vpišem »20 minut pogovora in vprašalnik …« → Zapiši opozorilo → Zaključi vadbo → Zaključi zdaj → Meni → Imenik strank → Nuša Rener.
- **Pričakovano:** v zgodovini so vaje in moja opomba o prvi uri.
- **Opaženo:** »Prazen načrt, brez rutine • 1 min vadba … Počep na škatlo PRESKOČENO, Mrtvi dvig s kettlebellom PRESKOČENO, Deska PRESKOČENO«. Besedila opombe ni nikjer. Ime treninga (»Prvi obisk«) tudi ni.
- **Cena:** zapis prve ure, ki ga želim imeti za stranko, ne obstaja; vse ostane v Beležkah. Približno 5 minut na novo stranko.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-09 — vrzel — Predplačilo 4 ur (112 €) in števec preostalih ur nimata mesta; vnesem ju v prosto besedilo

- **Dan in ura (simulirano):** sreda 14. 10., 19:15
- **Koraki:** Imenik strank → Sara Pahor → Uredi profil → v »Opombe« vpišem »plačano vnaprej 4 ure (112 €), po tej uri ostanejo 3«.
- **Pričakovano:** paket ur pri stranki: kupljeno 4, porabljeno 1, ostalo 3, znesek in kdo je plačal; ob vsakem zaključenem terminu se števec zmanjša.
- **Opaženo:** samo polje »Opombe«. Števca ni, zato ostanek ur vsak teden preštevam sam, tudi pri Janovem paketu 10 ur (250 €), ki se začne z uro iz ponedeljka.
- **Cena:** 4 stranke s predplačilom ali paketom po 3 minute po vsaki uri in pred vsakim računom. Ocena 15 minut na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-10 — napaka — »Pretežko« ne označi vaje kot opravljene, »Prelahko« jo

- **Dan in ura (simulirano):** sreda 14. 10., 18:10
- **Koraki:** Sara, termin 18:00 → Začni trening → »Počep s palico« → »Pretežko« → pritisnem »Potisk z ramen« → vrnem se na počep → Zaključi vadbo.
- **Pričakovano:** vaja, ki je bila pretežka, je bila vseeno opravljena (vsaj nekaj serij) in se zapiše.
- **Opaženo:** počep piše spet »Prihodnje«; na koncu »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«; zgodovina: tri vaje »PRESKOČENO«. Pri Maji je isto zaporedje s »Prelahko« zapisalo serije in obremenitev. Pri vaji z bolečino v sklepu (Rado, torek) isto: »Prihodnje«.
- **Cena:** trener nima poti, kako zapisati, kaj je stranka naredila; glej tudi F-r09-07.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-11 — vrzel — Računa za stranko ni mogoče izdati ali spremljati; ni zapisa, kaj je plačano in kaj ne

- **Dan in ura (simulirano):** četrtek 15. 10., 11:00
- **Koraki:** Meni → Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve. V Nastavitvah: Jezik, Tema, Moji podatki, Povezani računi, Pomoč in pravno. Pri stranki: samo cilji, poškodbe, opombe, GDPR.
- **Pričakovano:** vsaj seznam »odigrane ure, ki jih še nisem zaračunal« in »plačano / neplačano« za vsako stranko, da lahko račun v programu banke napišem brez štetja.
- **Opaženo:** nič. Seznam odigranih ur po stranki ni, zneska ni, računa ni. Terminska kartica ne pove, ali je ura plačana.
- **Cena:** v petek 15:00 sem tabelo za teden (7 ur, 4 × 28 €, 112 €, Janov paket 250 €, najem 70 €) sestavil ročno; ocena 30 minut na teden, vsak teden. Pri 10 strankah dvakrat toliko.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-12 — napaka — Isto zmešnjavo sem v četrtek naredil še enkrat: kartica »17:00 - 18:00« je bila ponedeljkova, ne današnja; po tem se je ponedeljkov čas na kartici spremenil

- **Dan in ura (simulirano):** četrtek 15. 10., 17:00
- **Koraki:** začetni zaslon → pritisnem »17:00 - 18:00« (hotel sem današnjo uro z Janom) → pritisnem »Začni trening« → ✕ → »Zaključi vadbo« → »Zaključi zdaj«.
- **Pričakovano:** današnji termin je na vrhu ali jasno označen; zaključenega termina ne morem še enkrat zagnati.
- **Opaženo:** seznam je urejen od najstarejšega: prvi so zaključeni termini iz ponedeljka, današnji je na koncu seznama in ga pri 5 dnevih ne vidim brez drsenja. Okno pravi »začeto 03d 00h prepozno«. Po tem je ponedeljkov termin na kartici pisal »Zaključeno 00:01« namesto prejšnjih »00:03«. Zgodovina stranke je ostala nespremenjena.
- **Cena:** vsak dan 2 minuti za iskanje pravega termina in popravilo. Zaupanje v zapise: čas treninga se je spremenil brez mojega namena.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:27:00, različica 166d3c8

### F-r09-13 — vrzel — Ob prestavitvi termina stranka ni obveščena, za sporočilo ni mesta

- **Dan in ura (simulirano):** četrtek 15. 10., 19:00
- **Koraki:** začetni zaslon → ✎ »Uredi« na kartici Radovega petkovega termina → v polje datuma vpišem 2026-10-20, začetni čas 18:30, končni 19:30 → Shrani.
- **Pričakovano:** ponudba »Obvesti stranko o novem terminu« (SMS ali sporočilo), saj Rado piše ob 19:00 in mora vedeti, da je nov termin torek.
- **Opaženo:** termin se prestavi brez vprašanja, brez okna za sporočilo. Okno z vabilom »Pošlji vabila v koledar« se pokaže samo pri novo dodani stranki. Prestavitev je sicer hitra: 5 ukazov, brez napak.
- **Cena:** SMS Radu napišem v telefonu zunaj aplikacije; 2 minuti na prestavitev.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:30:00, različica 166d3c8

### F-r09-14 — vrzel — Domače naloge ne morem poslati stranki; »termin« brez ure in brez sporočila je edina pot

- **Dan in ura (simulirano):** petek 16. 10., 13:00
- **Koraki:** Ustvari trening → ime »Domača naloga«, lokacija »Doma«, sobota 09:00 → Marjan Škof → Odpri v beležki → okno »Pošlji vabila v koledar« (»Pošlji vabilo«, »Pošlji SMS«) → Možnosti treninga → Uredi načrt → »Dvig na stopalo« 3 × 10, »Sedenje do stola« 3 × 10.
- **Pričakovano:** gumb »Pošlji stranki načrt« (besedilo z vajami, serijami, ponovitvami), ki ga pošljem kot SMS ali kopiram v WhatsApp.
- **Opaženo:** ustvaril sem lažni termin. Okno ob shranjevanju govori o vabilu v koledar, ne o vajah. Marjan nima e-pošte, zato »Pošlji vabilo« ne pomaga. V Možnostih treninga so le »Uredi načrt«, »Vsi na ta načrt«, »Odpovej trening«, »Izbriši trening«. Domača naloga bo na seznamu terminov kot da bi bil v soboto ob 09:00 trening (kartica »Domača naloga«, »1/1 mest zasedenih«).
- **Cena:** vaje še enkrat prepišem v SMS (3 minute na stranko). Med termini imam namišljen termin, ki ga je treba nato zaključiti ali izbrisati.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:40:00, različica 166d3c8

### F-r09-15 — vrzel — Meritve (pulz 105–118, kot v kolenu 60°) nimajo polja; pišem jih v ime vaje ali opombo

- **Dan in ura (simulirano):** torek 13. 10., 18:30 in petek 16. 10., 09:45
- **Koraki:** pri Radu v načrt dodam vajo »Hoja na prostem, pulz 105–118«; pri Marjanu vajo »Počep do 60° (ocena gibljivosti)« in bolečino vpišem v »Opombe« → »Bolečina ali nelagodje v sklepu«.
- **Pričakovano:** polje za izmerjeno vrednost (pulz, kot, datum), da vidim spremembo po štirih tednih.
- **Opaženo:** vaje imajo samo serije, ponovitve ali držo v sekundah ter kg. Trajanje v minutah ne obstaja, zato sem hojo 10 in 15 minut vpisal kot držo 600 in 900 sekund. V zgodovini sta se zapisala kot »10:00« in »15:00«. Izmerjena vrednost ni nikjer; bolečina v kolenu v zgodovini ni vidna (»Počep do 60° … PRESKOČENO«).
- **Cena:** meritve kolen in pulza ostanejo v Beležkah; primerjava po mesecu ni mogoča. 10 minut na teden, ko iščem stare zapise.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:40:00, različica 166d3c8

### F-r09-16 — vrzel — Seznama strank z urami in plačili ni mogoče izvoziti za preglednico

- **Dan in ura (simulirano):** nedelja 18. 10., 10:00
- **Koraki:** Meni → Imenik strank → Jan Zupančič → Izvozi podatke (GDPR); glava, gumb »?« → okno za varnostno kopijo.
- **Pričakovano:** ena datoteka CSV ali tabela, ki jo odprem v Excelu: ime, telefon, paket, ure, plačila.
- **Opaženo:** »Izvozi podatke te stranke« je šifrirana datoteka z geslom za posamezno stranko (opravljeni treningi 2, termini 2, spremembe plana 4); varnostna kopija je ena šifrirana datoteka JSON. Nobena ni namenjena preglednici.
- **Cena:** v nedeljo 10:00 prepišem 6 strank na roke v Excel, ocena 25 minut; ker paketa in plačil aplikacija ne hrani (F-r09-09), bi bil prepis tudi nepopoln.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 13:50:00, različica 166d3c8

### F-r09-17 — napaka — Namišljen termin »Domača naloga« je v nedeljo »Zamuja 25h 01m« in ne gre z seznama brez brisanja

- **Dan in ura (simulirano):** nedelja 18. 10., 10:00
- **Koraki:** začetni zaslon → kartica »Domača naloga« za soboto 09:00 (ustvarjena v petek, F-r09-14).
- **Pričakovano:** domača naloga ni termin; ne sme biti »v zamudi«.
- **Opaženo:** oranžna kartica »Zamuja 25h 01m« z opozorilnim trikotnikom, dokler je ne izbrišem ali zaključim.
- **Cena:** seznam terminov kaže neopravljeno delo, ki ga ni; zmedeno pri nadaljnjem pregledu tedna.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 13:50:00, različica 166d3c8
