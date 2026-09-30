// src/i18n/consent/sl.js — the Slovenian GDPR consent letter. Structure and rationale: see ./en.js.
//
// Addressed informally ("ti"), like the rest of the Slovenian UI and like a trainer actually speaks
// to a client on the gym floor. The Information Commissioner's own template (VZOREC OBVESTILA
// POSAMEZNIKOM, ip-rs.si) says "vi"; formality is not what makes consent valid — being informed is.
// No word carries the reader's or the trainer's gender: "Dober dan" rather than "Pozdravljen(-a)",
// "poznaš vsebino" rather than "si prebral(-a)", the same rule the UI dictionary is held to.
//
// TERMINOLOGY IS REGULATED VOCABULARY HERE, not a style choice. It follows the official Slovenian
// text of Regulation (EU) 2016/679 and ZVOP-2, not everyday usage — the mapping and its sources are
// tabulated in docs/templates/sl/INDEX.md. The one that matters most: consent is **privolitev**
// (člen 4(11)), never "soglasje", which is the colloquial word and the term for an unrelated legal
// act, and never "strinjam se", which is how "soglasje" is given.
//
// ⚠ Terminology-audited against the sources above; NOT reviewed by a Slovenian data-protection
// lawyer. It states the same facts as the English original.
//
// Pinned verbatim to docs/templates/sl/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs.
//
// deps: none — pure string building.

export const consentSl = {
  subject: "Osebno treniranje — privolitev v obdelavo osebnih podatkov",

  body: ({ clientName, noticeUrl, version, signature }) => `Dober dan, ${clientName},

za načrtovanje tvojih treningov, spremljanje napredka in varno vadbo uporabljam LibrePT, aplikacijo na svoji napravi. Preden začnem voditi zapise o tebi, potrebujem tvojo privolitev. To sporočilo pove, kaj beležim, kdo podatke prejme in kakšne pravice imaš. Upravljavec tvojih osebnih podatkov po Splošni uredbi o varstvu podatkov (Uredba (EU) 2016/679 — GDPR) in Zakonu o varstvu osebnih podatkov (ZVOP-2) sem jaz; moje ime in kontakt sta pod tem sporočilom.

Kaj beležim:
1. Tvoje ime ter e-poštni naslov ali telefonsko številko, ki mi jo posreduješ.
2. Tvoje treninge: cilje, datume treningov, vaje, serije, ponovitve, bremena in potek vsakega treninga.
3. Podatke o tvojem zdravju: poškodbe, bolečine, omejitve gibljivosti in telesno maso, kolikor jih potrebujem za varno vadbo. Podatki o zdravju so po GDPR posebne vrste osebnih podatkov, zato zanje potrebujem tvojo izrecno privolitev (člen 9(2)(a)).

Kje so podatki shranjeni in kdo jih prejme:
1. Zapisi so shranjeni na moji napravi. Avtorji aplikacije LibrePT ne prejmejo ničesar.
2. Če vklopim varnostno kopiranje, je kopija shranjena v moji shrambi v oblaku. Moja naprava jo pred pošiljanjem šifrira z mojim geslom, zato je ponudnik shrambe ne more prebrati. Ponudnik jo lahko hrani tudi zunaj EU; obvestilo o obdelavi osebnih podatkov navaja ponudnika in pravno podlago za prenos.
3. Če si pri načrtovanju treningov pomagam z orodjem umetne inteligence, to prejme le kopijo brez tvojega imena, kontaktnih podatkov, ciljev in opomb: številko, datume treningov in opravljene serije. To številko lahko s tabo poveže le moja naprava.
4. Tvojih podatkov nikoli ne prodam in jih ne delim z oglaševalci. Nihče drug jih ne prejme.

Kako dolgo jih hranim: dokler trenirava skupaj in največ dve leti po tvojem zadnjem treningu, da je zgodovina na voljo, če se vrneš. Prej, če tako želiš.

Tvoje pravice: kadar koli in brezplačno lahko od mene zahtevaš dostop do svojih podatkov in njihovo kopijo, popravek, izbris ali omejitev obdelave. Odgovorim v enem mesecu. Če meniš, da tvoji podatki niso obdelani pravilno, se lahko pritožiš pri nadzornem organu v državi, kjer živiš (v Sloveniji: Informacijski pooblaščenec, www.ip-rs.si). Nobene odločitve o tebi ne sprejme računalnik sam.

Privolitve ti ni treba dati. Brez nje o tebi v aplikaciji ne smem voditi zapisov, brez podatkov o zdravju pa vadbe ne morem prilagoditi tvojemu zdravju.

Celotno obvestilo o obdelavi osebnih podatkov je tukaj: ${noticeUrl}

Če privoliš, na to sporočilo odgovori s »PRIVOLIM« ali podpiši natisnjen obrazec. S tem potrdiš, da poznaš vsebino tega sporočila in da izrecno privoliš v obdelavo svojih osebnih podatkov, vključno s podatki o zdravju, za namen svoje vadbe.

Privolitev lahko kadar koli prekličeš brez navedbe razloga: na to sporočilo odgovori s »PREKLICUJEM« ali mi to sporoči na kakršen koli drug način. Preklic je enako preprost kot privolitev. Ustavi nadaljnjo obdelavo in ne vpliva na zakonitost obdelave pred preklicem.

Različica obrazca privolitve: ${version}

Lep pozdrav,
${signature || "tvoj osebni trener"}`,

  share: ({ clientName, noticeUrl, trainerName }) =>
    `Dober dan, ${clientName}.${trainerName ? ` Piše ti ${trainerName}.` : ""} Preden začnem beležiti podatke o tvojih treningih in zdravju, potrebujem tvojo izrecno privolitev po GDPR. Najprej preberi kratko obvestilo: ${noticeUrl} Odgovori s PRIVOLIM ali podpiši natisnjen obrazec v fitnesu. Privolitev lahko kadar koli prekličeš z odgovorom PREKLICUJEM.`,
};
