// src/i18n/consent/sl.js — the Slovenian GDPR consent letter. Structure and rationale: see ./en.js.
//
// Addressed informally ("ti"), like the rest of the Slovenian UI and like a trainer actually speaks
// to a client on the gym floor. Formality is not what makes consent valid — being informed is, and
// the four numbered points carry that in the same order as every other locale, so a trainer can
// compare two versions line by line without reading both languages.
//
// ⚠ Translated by the maintainer, not reviewed by a Slovenian data-protection lawyer. It states the
// same facts as the English original; have it checked before relying on it in a dispute.
//
// Pinned verbatim to docs/templates/sl/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs.
//
// deps: none — pure string building.

export const consentSl = {
  subject: "Osebno treniranje — soglasje za obdelavo in hrambo podatkov",

  body: ({ clientName, noticeUrl, version }) => `Pozdravljen(-a) ${clientName},

Za pripravo vadbenih načrtov, spremljanje tvojega napredka in varno treniranje uporabljam LibrePT, kjer beležim rezultate najinih treningov, uporabljene uteži ter morebitne opombe o gibljivosti in poškodbah.

V skladu s predpisi o varstvu osebnih podatkov (GDPR) želim, da si v celoti seznanjen(-a) s tem, kako ravnam s temi podatki:

1. Hramba in varnost: Tvoji zapisi treningov in opombe so shranjeni na moji napravi in po želji varnostno kopirani v moj osebni oblak, izključno za pripravo in kontinuiteto treningov.
2. Brez sledenja in prodaje tretjim osebam: Tvojih podatkov ne prodajam, ne delim z oglaševalci in jih ne posredujem tretjim osebam.
3. Varna uporaba umetne inteligence: Če si pri načrtovanju ali analizi obsega vadbe pomagam z orodji umetne inteligence, so zapisi pred tem anonimizirani (odstranjena so imena in vsi osebni podatki).
4. Tvoje pravice: Kadar koli lahko zahtevaš izvoz celotne zgodovine treningov, popravek podatkov ali trajen izbris svojih osebnih zapisov.

Celotno obvestilo o zasebnosti je na voljo tukaj: ${noticeUrl}

Prosim, da na to sporočilo odgovoriš s "SOGLAŠAM" (ali podpišeš natisnjen obrazec) in s tem potrdiš, da si seznanjen(-a) s temi praksami in se z njimi strinjaš.

Različica obrazca soglasja: ${version}

Lep pozdrav,
Tvoj osebni trener`,

  share: ({ clientName, noticeUrl }) =>
    `Pozdravljen(-a) ${clientName}, pred beleženjem podatkov o tvojih treningih potrebujem tvoje soglasje po GDPR. Kratko obvestilo o zasebnosti je tukaj: ${noticeUrl} — odgovori s SOGLAŠAM ali podpiši natisnjen obrazec v fitnesu.`,
};
