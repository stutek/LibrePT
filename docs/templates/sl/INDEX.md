---
type: index
title: Slovenske predloge za stranke
description: Slovenska izdaja obrazca privolitve in obvestila o obdelavi osebnih podatkov, z uradno preslikavo izrazja po GDPR in ZVOP-2.
status: active
terminology_audit: "2026-09-30"
tags:
  - index
  - templates
  - gdpr
  - slovenian
  - terminology
  - okf
---

# Slovenske predloge

Prevod angleške izvorne izdaje ([../en/INDEX.md](../en/INDEX.md)); ob razhajanju velja angleško
besedilo. Opisi in postopek za dodajanje jezika so v [nadrejenem kazalu](../INDEX.md).

| Dokument | Tip |
| :--- | :--- |
| [Client_Consent_Form.md](Client_Consent_Form.md) | `template` |
| [Client_Privacy_Notice.md](Client_Privacy_Notice.md) | `template` |

## Izrazje ni stvar sloga

Besedilo, ki ga bere nadzorni organ, mora uporabljati izrazje predpisa, ne pogovornega jezika. Zato
je spodnja preslikava zavezujoča za oba dokumenta in za
[src/i18n/consent/sl.js](../../../src/i18n/consent/sl.js) — nov prevod ali popravek se preveri po
njej, ne po občutku.

| Angleško (izvirnik)                            | Slovensko (uradno)                                                                | Vir                                        |
| :--------------------------------------------- | :-------------------------------------------------------------------------------- | :----------------------------------------- |
| consent                                        | **privolitev** *(nikoli »soglasje«, nikoli »strinjam se«)*                        | Uredba (EU) 2016/679, člen 4(11)           |
| explicit consent                               | izrecna privolitev                                                                | člen 9(2)(a)                               |
| withdraw consent                               | preklic privolitve                                                                | člen 7(3)                                  |
| data controller                                | upravljavec                                                                       | člen 4(7)                                  |
| processor                                      | obdelovalec                                                                       | člen 4(8)                                  |
| data subject                                   | posameznik, na katerega se nanašajo osebni podatki                                | člen 4(1)                                  |
| processing                                     | obdelava                                                                          | člen 4(2)                                  |
| pseudonymisation                               | psevdonimizacija                                                                  | člen 4(5)                                  |
| special categories of personal data            | posebne vrste osebnih podatkov                                                    | člen 9                                     |
| lawful basis                                   | pravna podlaga *(zakonitost obdelave)*                                            | člen 6                                     |
| transfer to a third country                    | prenos v tretjo državo                                                            | člen 13(1)(f)                              |
| adequacy decision                              | sklep (Komisije) o ustreznosti                                                    | člen 13(1)(f), člen 45                     |
| statutory or contractual requirement           | statutarna ali pogodbena obveznost                                                | člen 13(2)(e)                              |
| automated decision-making, including profiling | avtomatizirano sprejemanje posameznih odločitev, vključno z oblikovanjem profilov | člen 22                                    |
| right of access                                | pravica do dostopa                                                                | člen 15                                    |
| rectification                                  | popravek                                                                          | člen 16                                    |
| erasure / right to be forgotten                | izbris / »pravica do pozabe«                                                      | člen 17                                    |
| restriction of processing                      | omejitev obdelave                                                                 | člen 18                                    |
| data portability                               | prenosljivost podatkov                                                            | člen 20                                    |
| supervisory authority                          | nadzorni organ (v RS: Informacijski pooblaščenec)                                 | člen 51; [ip-rs.si](https://www.ip-rs.si/) |
| European Data Protection Board                 | Evropski odbor za varstvo podatkov                                                | člen 68                                    |
| retention period                               | obdobje hrambe                                                                    | člen 13(2)(a)                              |
| national implementing act                      | Zakon o varstvu osebnih podatkov (ZVOP-2)                                         | ZVOP-2                                     |

**Sklicevanje na člene**: `člen 9(2)(a)`, kot v uradnem prevodu uredbe — ne »9. člen (2)(a)«, ki
meša slovenski in uredbeni slog in ga ni mogoče enolično poiskati.

**Kaj je bilo preverjeno 2026-09-30 in kaj ne.** Preverjeno po uradnem besedilu uredbe (prebrano
na gdpr-text.com/sl, ker EUR-Lex ni bil dosegljiv): izrazi v zgornji preslikavi za člene 4(5),
4(11), 9(2)(a), 13, 18, 22 in 68. Obvestilo je primerjano z uradnim vzorcem Informacijskega
pooblaščenca (VZOREC OBVESTILA POSAMEZNIKOM PO 13. ČLENU, [ip-rs.si/obrazci](https://www.ip-rs.si/obrazci/varstvo-osebnih-podatkov/))
in pokrije vsa njegova polja razen pooblaščene osebe za varstvo podatkov, ki je posamezen trener
praviloma nima. **Nagovor:** kot vzorec, z »vi« (odločitev 2026-10-01: vsa besedila, ki jih bere stranka, sledijo
uradnim vzorcem; zasloni za trenerja ostanejo pri »ti«). **Ni bilo opravljeno:** pregled pri odvetniku ali pooblaščeni osebi za varstvo
osebnih podatkov. Za resnično uporabo pri strankah je ta pregled še vedno pogoj.

## Povezano

- [../INDEX.md](../INDEX.md) — vsi jeziki teh dokumentov
- [../en/INDEX.md](../en/INDEX.md) — angleška izdaja
- [Splošna uredba o varstvu podatkov — uradno besedilo](https://eur-lex.europa.eu/legal-content/SL/TXT/?uri=CELEX%3A32016R0679)
- [Informacijski pooblaščenec RS — smernice](https://www.ip-rs.si/)
