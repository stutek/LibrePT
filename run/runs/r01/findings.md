---
type: log
title: Najdbe tedna — Nina Krajnc
description: Napake in vrzeli, zapisane sproti med tednom 12.–18. oktober 2026.
tags: [exploratory, trainer-week]
---

### F-r01-01 — vrzel — Stranka nima polj za paket obiskov, preostale obiske in način plačila

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:30
- **Koraki:** Meni → Imenik strank → Dodaj stranko; pregledala vsa polja obrazca.
- **Pričakovano:** polje za »paket 10, ostalo 5« in za plačilo (nakazilo, gotovina, Flik), da me aplikacija opomni, ko paket poteče.
- **Opaženo:** obrazec ima le Ime, Vzdevek, E-pošta, Telefon, Cilji, Poškodbe, Opombe in privolitev. Paket, preostale obiske in plačilo sem vpisala v »Opombe« kot prosto besedilo.
- **Cena:** 7 strank × ročno štetje v besedilu; vsak teden odštevam obiske v glavi ali v zvezku, ker aplikacija ne šteje. Vsaj 15 min na teden in tveganje napačnega zneska.
- **Prioriteta po tvoje:** P1 (brez tega zvezek ostane)
- **Čas:** 2026-10-10 05:30:00, različica 166d3c8

### F-r01-02 — napaka — Trajanje vaje »Plank 30 s«: pri znani vaji ni izbire merjenja, povzetek pravi »S3 × R30«

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:35
- **Koraki:** Termin Katja → ⋮ → Uredi načrt → Vaja → ime »Plank« → serije 3, ponovitve 30.
- **Pričakovano:** možnost »drža« (sekunde), povzetek »3 × 30 s«.
- **Opaženo:** pri imenu »Plank« polje »MERJENO V« izgine, povzetek vrstice je »S3 × R30« (kot 30 ponovitev). Pri neznanem imenu izbira »pon. / drža« obstaja. Povzetek hrani »S« in »R« brez razlage.
- **Cena:** vsak načrt s planki ali držami moram popravljati ali pa napisati sekunde v ime vaje.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:35:00, različica 166d3c8

### F-r01-03 — napaka — Urejevalnik načrta: vstavljanje na konec in vrstni red vaj sta nejasna

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:38
- **Koraki:** Uredi načrt → Vaja (zgornji gumb) in nato Vaja (drugi gumb) ob dodajanju četrte vaje.
- **Pričakovano:** nova vaja pride na konec seznama.
- **Opaženo:** gumb »Vaja« se ponovi med vsemi vrsticami; prvi vstavi na vrh, drugi za prvo vrstico. Vaje so prišle v vrstni red Počep, Plank, Veslanje, Potisk; popravljala sem s puščicami. Ob razširitvi ene vrstice se druga skrči, polj ne vidim hkrati.
- **Cena:** ~5 min več na načrt s štirimi vajami; 18 načrtov na teden bi pomenilo več kot uro.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 05:38:00, različica 166d3c8

### F-r01-04 — vrzel — Med vadbo ne najdem, kje zabeležim opravljene serije, ponovitve in dejansko težo

- **Dan in ura (simulirano):** ponedeljek 12. 10., 06:46
- **Koraki:** Termin Katja → Začni trening → tapnem vsako kartico vaje (»Počep s kettlebellom« …) → iščem gumb za opravljeno serijo; ⋮ Možnosti treninga; »Odpri podlogo treninga«; nato »Zaključi vadbo«.
- **Pričakovano:** za vsako vajo tapnem »serija opravljena« in po potrebi popravim težo ali ponovitve.
- **Opaženo:** kartica ima samo »Prelahko«, »Pretežko«, »Opombe« in časomer premora. Kartice ostanejo na »Prihodnje«. Ob »Zaključi vadbo« aplikacija pravi: »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Nisem našla nobene kontrole, ki bi serijo zabeležila.
- **Cena:** brez zapisa dejanske teže in ponovitev (npr. potisk 10 kg v petek) ne morem primerjati tednov; to še vedno zapisujem v zvezek, ~10 min na dan.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 05:45:00, različica 166d3c8

### F-r01-05 — (umaknjeno) — filter Stranka/Lokacija je bil le seznam možnosti, ne vklopljen filter; zapis umaknjen

### F-r01-06 — napaka — Večerna kopija podatkov: »Izvozi JSON« zahteva geslo in nato ne odda datoteke (znana napaka §80.136, nov dokaz)

- **Dan in ura (simulirano):** ponedeljek 12. 10., 17:20
- **Koraki:** Meni → Upravljanje podatkov → Izvozi JSON → okno »Geslo za varnostne kopije« → »Zapisal sem si ga, shrani« → Izvozi JSON.
- **Pričakovano:** datoteka s kopijo.
- **Opaženo:** prvi tap sam odpre okno z geslom (»mobility-sprint-overhead-warmup-kettle-barbell«); po potrditvi in drugem tapu se prenos prekliče (»Download.save_as: canceled«). Okno s kopijo kaže tudi: »vsebina, ki jo je dodal ta predogled, ni vključena«.
- **Cena:** v orodju ne dobim kopije; ob izgubi telefona bi izgubila ves teden. Vsak večer ~3 min brez rezultata.
- **Prioriteta po tvoje:** P1
- **Čas:** 2026-10-10 05:55:00, različica 166d3c8

### F-r01-07 — napaka — »Shrani kot rutino« zavrne vaje, ki sem jih vpisala v načrt; ponovnega načrta ne morem prevzeti

- **Dan in ura (simulirano):** torek 13. 10., 17:05
- **Koraki:** Imenik strank → Lana Jelen → Zgodovina zabeleženih vadb → Shrani kot rutino.
- **Pričakovano:** rutina s štirimi vajami, ki jo sobota uporabi znova.
- **Opaženo:** okno: »4 vaje niso v tvoji knjižnici, zato jih ni v rutini.« Vaje, vpisane z imenom v urejevalniku načrta, torej niso v knjižnici in rutina je prazna.
- **Cena:** isti načrt (Lana torek in sobota, Katja pon in pet, Barbara pon in pet) vpisujem vsakič znova: ~5 min × 5 ponovitev = 25 min na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:05:00, različica 166d3c8

### F-r01-08 — napaka — Opomba iz treninga se prilepi v polje »Opombe« stranke brez presledka

- **Dan in ura (simulirano):** torek 13. 10., 17:00
- **Koraki:** Termin Lana → Začni trening → Počep s širokim stojem → Opombe → »Tehnika popušča« + besedilo + »Shrani to v kartoteko stranke« → Zapiši opozorilo → Imenik strank → Lana Jelen.
- **Pričakovano:** nova vrstica z datumom pod mojim besedilom.
- **Opaženo:** »paket 10, ostalo 3; mladoletna, plačajo starši 2026-10-13 — Počep s širokim stojem: Tehnika popušča – pazi na položaj - desno koleno zdrsne navznoter pri počepu« — vse v eni vrstici, brez ločila.
- **Cena:** polje s podatki o paketu in kolenom postane neberljivo že po tednu; ročno popravljanje ~2 min na stranko.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 06:06:00, različica 166d3c8

### F-r01-09 — napaka — Knjižnica vaj in obrazec »Ustvari vajo po meri« sta angleška; za slovensko vajo je treba izbrati štiri angleške vrednosti

- **Dan in ura (simulirano):** torek 13. 10., 17:10
- **Koraki:** Meni → Vaje in rutine → Vaje → Dodaj vajo; Rutina → Dodaj vajo.
- **Pričakovano:** slovenske vaje (počep, mostiček, veslanje) in slovenske izbire.
- **Opaženo:** 48 vaj v katalogu z imeni kot »Barbell Back Squat«, »Assault Bike«, »5-10-5 Pro Agility Shuttle«. Obrazec za lastno vajo zahteva Ime, Ciljno mišično skupino (»Chest«, »Back«, »Legs«), Opremo (»Barbell«, »Bodyweight«) in Vzorec giba (»Horizontal Push«, »Hinge«), nato še »Kako se beleži«.
- **Cena:** vsaka od ~25 vaj tega tedna bi stala ~1 min in štiri izbire v angleščini; zato sem vaje tipkala neposredno v načrt (kjer jih rutina ne sprejme, F-r01-07).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:10:00, različica 166d3c8

### F-r01-10 — vrzel — Opomnik stranki za jutrišnji termin: aplikacija pošlje le vabilo v koledar po e-pošti, gumb je brez e-pošte neaktiven

- **Dan in ura (simulirano):** torek 13. 10., 19:00
- **Koraki:** Ustvari trening → Par, sreda 2026-10-14, 18:00–19:00, Mojca in Tadej Cvikl → Shrani → okno »Pošlji vabila v koledar«.
- **Pričakovano:** kratek opomnik (»jutri ob 18:00 v parku«) prek SMS ali WhatsAppa, ki ga pošljem z enim tapom.
- **Opaženo:** v oknu je le »Pošlji vabilo«, siv gumb (neaktiven), ker pri stranki ni e-pošte; vzroka okno ne pove. Besedila opomnika ni nikjer.
- **Cena:** opomnike (Mojca in Tadej, Lana, Ivan, Barbara) še vedno pišem v WhatsApp: ~15 min na teden.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:15:00, različica 166d3c8

### F-r01-11 — vrzel — Vrednost, izmerjena pred uro (sladkor 7,1), nima mesta; možna je le prosta opomba

- **Dan in ura (simulirano):** torek 13. 10., 17:35
- **Koraki:** Rado Mastnak → Začni trening → Potisk nog → Opombe → »Samo opomba, brez ocene« → »sladkor pred uro 7,1« → Zapiši opozorilo.
- **Pričakovano:** polje za meritev pred uro (sladkor, tlak), ki jo ob naslednji uri vidim ob prejšnji vrednosti.
- **Opaženo:** opomba pri vaji »Potisk nog«, ne pri stranki ali pri uri; naslednji teden jo bom našla le s prelistavanjem.
- **Cena:** za Rada in za mladoletne ~3 min na uro za iskanje prejšnje vrednosti.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 06:16:00, različica 166d3c8


### F-r01-12 — vrzel — SMS ob spremembi kraja nima ure, dneva ne kraja v besedilu: samo »Trening: Par — povezava«

- **Dan in ura (simulirano):** sreda 14. 10., 07:35 (ura telefona premaknjena)
- **Koraki:** Termin Par (sreda 18:00) → Uredi → Lokacija »Mestni park Celje« → Shrani → okno »Ta trening se je spremenil — želiš poslati nove podatke strankam, ki si jih že povabil?« → Pošlji nove podatke → okno »Pošlji vabila v koledar« → Pošlji SMS.
- **Pričakovano:** sporočilo »Sreda 14. 10. ob 18:00 se dobimo v Mestnem parku Celje«, ki ga stranka prebere takoj.
- **Opaženo:** povezava »Pošlji SMS« odpre sporočilo z besedilom »Trening: Par — http://…/LibrePT/?lang=sl&evt=eyJ2Ijox…« (dolga koda). Datuma, ure in kraja ni v besedilu; stranka bi morala odpreti povezavo. Okno ima naslov »Na novo dodeljenim udeležencem«, čeprav gre za spremembo kraja. Gumb »Pošlji vabilo« je neaktiven, ker Mojca nima e-pošte; vzroka okno ne pove.
- **Cena:** vsako spremembo (reka cev, termin v parku) še vedno napišem na roke v WhatsApp: 3 stranke × 3 min = ~10 min, in stranka mora zaupati nerazumljivi povezavi.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:55:00, različica 166d3c8

### F-r01-13 — napaka — Okno »Pošlji vabila v koledar«: po tapu na »Pošlji SMS« se »Končano«, ✕ in Esc ne zaprejo; pot nazaj je osvežitev strani

- **Dan in ura (simulirano):** sreda 14. 10., 07:30
- **Koraki:** Shrani termin → okno »Pošlji vabila v koledar« → Pošlji SMS → Končano (nato ✕, nato Esc).
- **Pričakovano:** okno se zapre.
- **Opaženo:** okno ostane odprto po vseh treh; zaprlo se je šele po ponovnem odprtju naslova aplikacije. Po tem tapi z orodjem (»Ustvari trening«, izbira stranke) niso več delovali; tapi prek skripte so. Možno, da je napaka orodja in ne aplikacije — nisem je ločila.
- **Cena:** brez osvežitve ostanem v oknu; 5 min izgubljenih.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 09:56:00, različica 166d3c8

### F-r01-14 — vrzel — Odpoved termina strank ne obvesti in ne razlikuje pravočasne odpovedi od pozne

- **Dan in ura (simulirano):** četrtek 15. 10., 07:55
- **Koraki:** Termin Simon Žnidar 08:00 → Možnosti treninga → Odpovej trening → okno »Odpovej ta trening? Ostane na urniku, označen kot odpovedan …« → Odpovej trening.
- **Pričakovano:** zapis, da je Simon odpovedal pravočasno (obisk se ne odšteje), in gumb, ki mu pošlje potrdilo.
- **Opaženo:** termin dobi oznako »Odpovedano«. Ni vprašanja, kdo je odpovedal in kdaj, ni polja za razlog, strank ne obvesti, in obiska stranki ne šteje ali odšteva (paketov aplikacija sploh ne pozna, F-r01-01).
- **Cena:** pravila »pozna odpoved se računa« še vedno vodim v zvezku: 1–2 odpovedi na teden × 2 min, in napake pri zaračunavanju ob koncu meseca.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:10:00, različica 166d3c8

### F-r01-15 — vrzel — Načrt vaj za doma (domača naloga) ne pride do stranke; video ali besedilo ne moreta biti del načrta

- **Dan in ura (simulirano):** četrtek 15. 10., 16:30
- **Koraki:** Termin Barbara 17:00 → Možnosti treninga → Uredi načrt → tri vaje (mostiček 3 × 15, ptičji pes 3 × 10, raztezanje 2 × 30 s) → Končano z urejanjem načrta → Možnosti treninga → pregled menija → zavihek »Barbara«.
- **Pričakovano:** gumb, ki Barbari pošlje načrt (ali povezavo na video) po SMS ali WhatsAppu, da vadi doma; termin označim kot »doma«.
- **Opaženo:** meni ima le »Uredi načrt«, »Vsi na ta načrt«, »Odpovej trening«, »Izbriši trening«. Pošiljanja načrta ni, polja za povezavo na video ni, termina »doma« ni. Termin lahko le odpovem.
- **Cena:** video in seznam vaj pošljem ročno v WhatsApp (~5 min), načrt pa vpišem v aplikacijo dvakrat ali pa sploh ne.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 10:15:00, različica 166d3c8

### F-r01-16 — vrzel — Trajanje vaje v minutah (hoja 10 min) ne obstaja: načrt zna le »pon.« in »drža« v sekundah

- **Dan in ura (simulirano):** sobota 17. 10., 08:55
- **Koraki:** Termin Ivan Pečnik → Možnosti treninga → Uredi načrt → Vaja → ime »Hoja po stopnicah« → serije 1, ponovitve 10 → Končano z urejanjem načrta.
- **Pričakovano:** izbira »min« (ali »m«) za hojo 10 minut in skakanje 10 m.
- **Opaženo:** pri neznanem imenu izbira »MERJENO V« pozna samo »pon.« in »drža«; pri znanem imenu je izbire sploh ni. Povzetek vrstice je »S1 × R10«, kar se bere kot 10 ponovitev.
- **Cena:** hojo 10 min (Ivan), hojo na traku 12 min (Rado) in skakanje 10 m (Lana) pišem v ime vaje; ~1 min na vajo, 3 vaje na teden. Povzetek pa je zavajajoč.
- **Prioriteta po tvoje:** P3
- **Čas:** 2026-10-10 10:45:00, različica 166d3c8

### F-r01-17 — napaka — Zaključen termin brez zapisanih serij ne pride v zgodovino stranke, načrt iz njega pa obvisi med »Nenačrtovanimi programi«

- **Dan in ura (simulirano):** nedelja 18. 10., 19:00
- **Koraki:** petek 16:00 Katja → Začni trening → Zaključi vadbo (»Res želiš zaključiti in shraniti prazno vadbo?« → Zaključi zdaj); nedelja: Meni → Imenik strank → Katja Starc.
- **Pričakovano:** v »Zgodovini zabeleženih vadb« ena vadba 2026-10-16 s štirimi vajami.
- **Opaženo:** »Ni še zabeleženih vadb.« Na začetnem zaslonu pa obvestilo »6 programov je pripravljenih, a še niso dodeljeni treningu«, med njimi »Ena na ena · Katja Starc · 2026-10-16« — načrt, ki sem ga naredila in izvedla. Termin na seznamu pravi »Program ni določen« in »Zaključeno«.
- **Cena:** nedeljskega pregleda (»sem Katji zaračunala vse štiri ure?«) ne morem narediti iz zgodovine stranke; štejem zaključene termine po seznamu ročno, ~10 min na mesec na stranko, in 6 obvestil mi govori, da nekaj ni opravljeno.
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:05:00, različica 166d3c8

### F-r01-18 — vrzel — Mesečni pregled (ure, število obiskov, kdo je plačal) ne obstaja

- **Dan in ura (simulirano):** nedelja 18. 10., 19:00
- **Koraki:** Začetni zaslon → filter »Stranka« → Katja Starc; Imenik strank → Katja Starc; Meni (Termini treningov, Imenik strank, Vaje in rutine, Upravljanje podatkov, Nastavitve).
- **Pričakovano:** za mesec in stranko: število ur, število obiskov, ostanek paketa, plačano / neplačano.
- **Opaženo:** filter po stranki pokaže seznam terminov in nič več: brez vsote, brez zneska, brez meseca. V profilu stranke so Cilji, Poškodbe, Opombe, E-pošta, Telefon, GDPR in zgodovina vadb. Zgoraj piše »OGROŽENO — NAREDI KOPIJO«, a kopije ne morem narediti (F-r01-06).
- **Cena:** obračun za mesec in sedem strank še vedno delam v zvezku: ~45 min na mesec; napake pri zneskih (38 € × 4 ure Katja, 460 € paket Cvikl).
- **Prioriteta po tvoje:** P2
- **Čas:** 2026-10-10 11:06:00, različica 166d3c8
