---
type: template
title: Obrazec privolitve stranke (informativno pismo)
description: Standardiziran obrazec privolitve po GDPR za osebne trenerje, ki obdelujejo zdravstvene podatke strank (posebne vrste osebnih podatkov po členu 9).
status: active
consent_form_version: "2026-08-09"
terminology_audit: "2026-08-10"
tags:
  - gdpr
  - consent
  - privacy
  - template
  - slovenian
  - okf
---

# Obrazec privolitve stranke

Spodnje besedilo je natanko tisto, ki ga pošlje aplikacija. Gumb **Pošlji obrazec po e-pošti**
(Stranka → *Varstvo osebnih podatkov (GDPR)*, ko je za jezik obrazca izbrana slovenščina) odpre
poštnega odjemalca s tem besedilom, gumb **Pošlji povezavo po SMS** pa pošlje eno vrstico s povezavo
na [Obvestilo o obdelavi osebnih podatkov](Client_Privacy_Notice.md).

Izvorna kopija v aplikaciji je [src/i18n/consent/sl.js](../../../src/i18n/consent/sl.js); test
[consentForm.test.mjs](../../../tests/unit_js/modules/common/consentForm.test.mjs) prepreči, da bi se
dokument in poslano besedilo razšla.

> ⚠ **Izrazje je usklajeno, pravni pregled pa ni opravljen.** Izrazje je 2026-08-10 preverjeno po
> uradnem slovenskem besedilu Uredbe (EU) 2016/679 in ZVOP-2 — preslikava izrazov in viri so v
> [kazalu slovenskih predlog](INDEX.md). Vsebinsko je dokument enak angleškemu izvirniku
> ([Client_Consent_Form.md](../en/Client_Consent_Form.md)); pred uporabo v sporu naj ga pregleda
> pravnik za varstvo osebnih podatkov.

## Pismo

```markdown
Zadeva: Osebno treniranje — privolitev v obdelavo osebnih podatkov

Pozdravljen(-a) [Ime stranke],

Za pripravo vadbenih načrtov, spremljanje tvojega napredka in varno treniranje uporabljam LibrePT, kjer beležim rezultate najinih treningov, uporabljene uteži ter morebitne opombe o gibljivosti in poškodbah.

V skladu s Splošno uredbo o varstvu podatkov (Uredba (EU) 2016/679 — GDPR) in Zakonom o varstvu osebnih podatkov (ZVOP-2) te pred privolitvijo seznanjam s tem, kako obdelujem tvoje osebne podatke:

1. Hramba in varnost: Tvoji zapisi treningov in opombe so shranjeni na moji napravi in po želji varnostno kopirani v mojo osebno shrambo v oblaku (ponudnik shrambe pri tem nastopa kot obdelovalec), izključno za pripravo in kontinuiteto treningov.
2. Brez sledenja in posredovanja tretjim osebam: Tvojih osebnih podatkov ne prodajam, ne delim z oglaševalci in jih ne posredujem tretjim osebam.
3. Varna uporaba umetne inteligence: Če si pri načrtovanju ali analizi obsega vadbe pomagam z orodji umetne inteligence, so zapisi pred tem anonimizirani (odstranjeni so ime in vsi podatki, po katerih bi te bilo mogoče prepoznati).
4. Tvoje pravice: Kadar koli lahko zahtevaš dostop do svojih podatkov in njihovo kopijo, popravek ali trajen izbris svojih osebnih zapisov. Privolitev lahko kadar koli in na kakršen koli način prekličeš — preklic ustavi nadaljnjo obdelavo in ne vpliva na zakonitost obdelave, ki je potekala pred njim.

Celotno obvestilo o obdelavi osebnih podatkov je na voljo tukaj: https://stutek.github.io/LibrePT/privacy-notice-sl.html

Prosim, da na to sporočilo odgovoriš s "PRIVOLIM" (ali podpišeš natisnjen obrazec) in s tem potrdiš, da si s temi informacijami seznanjen(-a) in privoliš v opisano obdelavo svojih osebnih podatkov.

Privolitev lahko kadar koli prekličeš tako, da na to sporočilo odgovoriš s "PREKLICUJEM". Preklic je natanko tako preprost kot privolitev — enak odgovor, brez obrazca in brez računa — in zanj ti ni treba navesti razloga.

Različica obrazca privolitve: 2026-08-09

Lep pozdrav,
Tvoj osebni trener
```

## Natisnjen obrazec — podpisni del

Dodaj spodnje vrstice natisnjeni različici. **Podpisan izvod hraniš ti.** LibrePT nikoli ne shrani
fotografije, skena ali podpisa — le podatek, da je bila privolitev dana, datum s tega lista in zgoraj
navedeno različico obrazca.

```markdown
Podpis stranke: ___________________________   Datum: _______________

Podpis trenerja: __________________________   Datum: _______________
```

## Različice

Privolitev je privolitev *določenemu besedilu*, zato LibrePT ob datumu podpisa shrani tudi različico,
ki jo je stranka podpisala (`gdprConsent.formVersion`, glej [DATA_MODEL §1](../../DATA_MODEL.md)). Le
tako je po spremembi besedila mogoče odgovoriti na vprašanje, katere stranke so še pokrite.

Pravila za dvig različice so enaka v vseh jezikih in so zapisana v angleški izdaji —
[Versioning](../en/Client_Consent_Form.md). Na kratko: dvigni ob **vsebinski** spremembi (nov namen,
nov prejemnik, druga hramba ali pravice), ne pa ob tipkarski napaki ali popravku prevoda. Ena
različica velja za vse jezike hkrati in je zapisana kot polni datum ISO (`LLLL-MM-DD`) — dan, ko je
bilo sprejeto veljavno besedilo, ne dan zadnjega urejanja datoteke.

## Povezano

- [Obvestilo o obdelavi osebnih podatkov](Client_Privacy_Notice.md) — obvestilo, na katero se pismo sklicuje
- [English edition](../en/Client_Consent_Form.md) — izvirnik
- [Kazalo predlog](../INDEX.md) — vsi jeziki teh dokumentov
- [Trainer Privacy Guide](../../PRIVACY_FOR_TRAINERS.md) — obveznosti trenerja kot upravljavca
