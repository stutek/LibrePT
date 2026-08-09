---
type: template
title: Obrazec soglasja stranke (informativno pismo)
description: Standardiziran obrazec soglasja po GDPR za osebne trenerje, ki obdelujejo zdravstvene podatke strank (posebna vrsta osebnih podatkov po 9. členu).
status: active
consent_form_version: "2026-08"
tags:
  - gdpr
  - consent
  - privacy
  - template
  - slovenian
  - okf
---

# Obrazec soglasja stranke

Spodnje besedilo je natanko tisto, ki ga pošlje aplikacija. Gumb **Pošlji obrazec po e-pošti**
(Stranka → *Varstvo osebnih podatkov (GDPR)*, ko je za jezik obrazca izbrana slovenščina) odpre
poštnega odjemalca s tem besedilom, gumb **Pošlji povezavo po SMS** pa pošlje eno vrstico s povezavo
na [Obvestilo o zasebnosti za stranke](Client_Privacy_Notice.md).

Izvorna kopija v aplikaciji je [src/i18n/consent/sl.js](../../../src/i18n/consent/sl.js); test
[consentForm.test.mjs](../../../tests/unit_js/modules/common/consentForm.test.mjs) prepreči, da bi se
dokument in poslano besedilo razšla.

> ⚠ **Prevod ni pravno pregledan.** Vsebinsko je enak angleški izvirniku
> ([Client_Consent_Form.md](../en/Client_Consent_Form.md)); pred uporabo v sporu ga naj pregleda
> pravnik za varstvo osebnih podatkov.

## Pismo

```markdown
Zadeva: Osebno treniranje — soglasje za obdelavo in hrambo podatkov

Pozdravljen(-a) [Ime stranke],

Za pripravo vadbenih načrtov, spremljanje tvojega napredka in varno treniranje uporabljam LibrePT, kjer beležim rezultate najinih treningov, uporabljene uteži ter morebitne opombe o gibljivosti in poškodbah.

V skladu s predpisi o varstvu osebnih podatkov (GDPR) želim, da si v celoti seznanjen(-a) s tem, kako ravnam s temi podatki:

1. Hramba in varnost: Tvoji zapisi treningov in opombe so shranjeni na moji napravi in po želji varnostno kopirani v moj osebni oblak, izključno za pripravo in kontinuiteto treningov.
2. Brez sledenja in prodaje tretjim osebam: Tvojih podatkov ne prodajam, ne delim z oglaševalci in jih ne posredujem tretjim osebam.
3. Varna uporaba umetne inteligence: Če si pri načrtovanju ali analizi obsega vadbe pomagam z orodji umetne inteligence, so zapisi pred tem anonimizirani (odstranjena so imena in vsi osebni podatki).
4. Tvoje pravice: Kadar koli lahko zahtevaš izvoz celotne zgodovine treningov, popravek podatkov ali trajen izbris svojih osebnih zapisov.

Celotno obvestilo o zasebnosti je na voljo tukaj: https://github.com/stutek/LibrePT/blob/main/docs/templates/sl/Client_Privacy_Notice.md

Prosim, da na to sporočilo odgovoriš s "SOGLAŠAM" (ali podpišeš natisnjen obrazec) in s tem potrdiš, da si seznanjen(-a) s temi praksami in se z njimi strinjaš.

Različica obrazca soglasja: 2026-08

Lep pozdrav,
Tvoj osebni trener
```

## Natisnjen obrazec — podpisni del

Dodaj spodnje vrstice natisnjeni različici. **Podpisan izvod hraniš ti.** LibrePT nikoli ne shrani
fotografije, skena ali podpisa — le podatek, da je bilo soglasje dano, datum s tega lista in zgoraj
navedeno različico obrazca.

```markdown
Podpis stranke: ___________________________   Datum: _______________

Podpis trenerja: __________________________   Datum: _______________
```

## Različice

Soglasje je soglasje *določenemu besedilu*, zato LibrePT ob datumu podpisa shrani tudi različico, ki
jo je stranka podpisala (`gdprConsent.formVersion`, glej [DATA_MODEL §1](../../DATA_MODEL.md)). Le
tako je po spremembi besedila mogoče odgovoriti na vprašanje, katere stranke so še pokrite.

Pravila za dvig različice so enaka v vseh jezikih in so zapisana v angleški izdaji —
[Versioning](../en/Client_Consent_Form.md). Na kratko: dvigni ob **vsebinski** spremembi (nov namen,
nov prejemnik, druga hramba ali pravice), ne pa ob tipkarski napaki ali popravku prevoda. Ena
različica velja za vse jezike hkrati.

## Povezano

- [Obvestilo o zasebnosti za stranke](Client_Privacy_Notice.md) — obvestilo, na katero se pismo sklicuje
- [English edition](../en/Client_Consent_Form.md) — izvirnik
- [Kazalo predlog](../INDEX.md) — vsi jeziki teh dokumentov
- [Trainer Privacy Guide](../../PRIVACY_FOR_TRAINERS.md) — obveznosti trenerja kot upravljavca
