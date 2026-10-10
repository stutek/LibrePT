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

