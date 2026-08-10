// src/i18n/consent/sl.js — the Slovenian GDPR consent letter. Structure and rationale: see ./en.js.
//
// Addressed informally ("ti"), like the rest of the Slovenian UI and like a trainer actually speaks
// to a client on the gym floor. Formality is not what makes consent valid — being informed is, and
// the four numbered points carry that in the same order as every other locale, so a trainer can
// compare two versions line by line without reading both languages.
//
// TERMINOLOGY IS REGULATED VOCABULARY HERE, not a style choice. It follows the official Slovenian
// text of Regulation (EU) 2016/679 and ZVOP-2, not everyday usage — the mapping and its sources are
// tabulated in docs/templates/sl/INDEX.md. The one that matters most: consent is **privolitev**
// (člen 4(11)), never "soglasje", which is the colloquial word and the term for an unrelated legal
// act. A client asked to give "soglasje" has still consented, but the paper trail stops matching the
// vocabulary a supervisory authority reads it in.
//
// ⚠ Terminology-audited 2026-08-10 against the sources above; NOT reviewed by a Slovenian
// data-protection lawyer. It states the same facts as the English original.
//
// Pinned verbatim to docs/templates/sl/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs.
//
// deps: none — pure string building.

export const consentSl = {
  subject: "Osebno treniranje — privolitev v obdelavo osebnih podatkov",

  body: ({ clientName, noticeUrl, version }) => `Pozdravljen(-a) ${clientName},

Za pripravo vadbenih načrtov, spremljanje tvojega napredka in varno treniranje uporabljam LibrePT, kjer beležim rezultate najinih treningov, uporabljene uteži ter morebitne opombe o gibljivosti in poškodbah.

V skladu s Splošno uredbo o varstvu podatkov (Uredba (EU) 2016/679 — GDPR) in Zakonom o varstvu osebnih podatkov (ZVOP-2) te pred privolitvijo seznanjam s tem, kako obdelujem tvoje osebne podatke:

1. Hramba in varnost: Tvoji zapisi treningov in opombe so shranjeni na moji napravi in po želji varnostno kopirani v mojo osebno shrambo v oblaku (ponudnik shrambe pri tem nastopa kot obdelovalec), izključno za pripravo in kontinuiteto treningov.
2. Brez sledenja in posredovanja tretjim osebam: Tvojih osebnih podatkov ne prodajam, ne delim z oglaševalci in jih ne posredujem tretjim osebam.
3. Varna uporaba umetne inteligence: Če si pri načrtovanju ali analizi obsega vadbe pomagam z orodji umetne inteligence, so zapisi pred tem anonimizirani (odstranjeni so ime in vsi podatki, po katerih bi te bilo mogoče prepoznati).
4. Tvoje pravice: Kadar koli lahko zahtevaš dostop do svojih podatkov in njihovo kopijo, popravek ali trajen izbris svojih osebnih zapisov. Privolitev lahko kadar koli in na kakršen koli način prekličeš — preklic ustavi nadaljnjo obdelavo in ne vpliva na zakonitost obdelave, ki je potekala pred njim.

Celotno obvestilo o obdelavi osebnih podatkov je na voljo tukaj: ${noticeUrl}

Prosim, da na to sporočilo odgovoriš s "PRIVOLIM" (ali podpišeš natisnjen obrazec) in s tem potrdiš, da si s temi informacijami seznanjen(-a) in privoliš v opisano obdelavo svojih osebnih podatkov.

Različica obrazca privolitve: ${version}

Lep pozdrav,
Tvoj osebni trener`,

  share: ({ clientName, noticeUrl }) =>
    `Pozdravljen(-a) ${clientName}, pred beleženjem podatkov o tvojih treningih potrebujem tvojo privolitev po GDPR. Kratko obvestilo o obdelavi osebnih podatkov je tukaj: ${noticeUrl} — odgovori s PRIVOLIM ali podpiši natisnjen obrazec v fitnesu.`,
};
