// src/i18n/consent/sl.js — the Slovenian GDPR consent letter. Structure and rationale: see ./en.js.
//
// Addressed formally ("vi"), as the Information Commissioner's own template (VZOREC OBVESTILA
// POSAMEZNIKOM, ip-rs.si) addresses the reader — ruled 2026-10-01: every text the CLIENT reads follows
// the official templates, while the trainer's own screens keep "ti". No word carries the reader's or
// the trainer's gender: "Dober dan", "poznate vsebino", the same rule the UI dictionary is held to.
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

za načrtovanje vaših treningov, spremljanje napredka in varno vadbo uporabljam LibrePT, aplikacijo na svoji napravi. Preden začnem voditi zapise o vas, potrebujem vašo privolitev. To sporočilo pove, kaj beležim, kdo podatke prejme in kakšne pravice imate. Upravljavec vaših osebnih podatkov po Splošni uredbi o varstvu podatkov (Uredba (EU) 2016/679 — GDPR) in Zakonu o varstvu osebnih podatkov (ZVOP-2) sem jaz; moje ime in kontakt sta pod tem sporočilom.

Kaj beležim:
1. Vaše ime ter e-poštni naslov ali telefonsko številko, ki mi jo posredujete.
2. Vaše treninge: cilje, datume treningov, vaje, serije, ponovitve, bremena in potek vsakega treninga.
3. Podatke o vašem zdravju: poškodbe, bolečine, omejitve gibljivosti in telesno maso, kolikor jih potrebujem za varno vadbo. Podatki o zdravju so po GDPR posebne vrste osebnih podatkov, zato zanje potrebujem vašo izrecno privolitev (člen 9(2)(a)).

Kje so podatki shranjeni in kdo jih prejme:
1. Zapisi so shranjeni na moji napravi. Avtorji aplikacije LibrePT ne prejmejo ničesar.
2. Če vklopim varnostno kopiranje, je kopija shranjena v moji shrambi v oblaku. Moja naprava jo pred pošiljanjem šifrira z mojim geslom, zato je ponudnik shrambe ne more prebrati. Ponudnik jo lahko hrani tudi zunaj EU; obvestilo o obdelavi osebnih podatkov navaja ponudnika in pravno podlago za prenos.
3. Če si pri načrtovanju treningov pomagam z orodjem umetne inteligence, to prejme le kopijo brez vašega imena, kontaktnih podatkov, ciljev in opomb: številko, datume treningov in opravljene serije. To številko lahko z vami poveže le moja naprava.
4. Vaših podatkov nikoli ne prodam in jih ne delim z oglaševalci. Nihče drug jih ne prejme.

Kako dolgo jih hranim: dokler trenirate pri meni, in največ dve leti po vašem zadnjem treningu, da je zgodovina na voljo, če se vrnete. Prej, če tako želite.

Vaše pravice: kadar koli in brezplačno lahko od mene zahtevate dostop do svojih podatkov in njihovo kopijo, popravek, izbris ali omejitev obdelave. Odgovorim v enem mesecu. Če menite, da vaši podatki niso obdelani pravilno, se lahko pritožite pri nadzornem organu v državi, kjer živite (v Sloveniji: Informacijski pooblaščenec, www.ip-rs.si). Nobene odločitve o vas ne sprejme računalnik sam.

Privolitve vam ni treba dati. Brez nje o vas v aplikaciji ne smem voditi zapisov, brez podatkov o zdravju pa vadbe ne morem prilagoditi vašemu zdravju.

Celotno obvestilo o obdelavi osebnih podatkov je tukaj: ${noticeUrl}

Če privolite, na to sporočilo odgovorite s »PRIVOLIM« ali podpišite natisnjen obrazec. S tem potrdite, da poznate vsebino tega sporočila in da izrecno privolite v obdelavo svojih osebnih podatkov, vključno s podatki o zdravju, za namen svoje vadbe.

Privolitev lahko kadar koli prekličete brez navedbe razloga: na to sporočilo odgovorite s »PREKLICUJEM« ali mi to sporočite na kakršen koli drug način. Preklic je enako preprost kot privolitev. Ustavi nadaljnjo obdelavo in ne vpliva na zakonitost obdelave pred preklicem.

Različica obrazca privolitve: ${version}

Lep pozdrav,
${signature || "vaš osebni trener"}`,

  share: ({ clientName, noticeUrl, trainerName }) =>
    `Dober dan, ${clientName}.${trainerName ? ` Piše vam ${trainerName}.` : ""} Preden začnem beležiti podatke o vaših treningih in zdravju, potrebujem vašo izrecno privolitev po GDPR. Najprej preberite kratko obvestilo: ${noticeUrl} Odgovorite s PRIVOLIM ali podpišite natisnjen obrazec v fitnesu. Privolitev lahko kadar koli prekličete z odgovorom PREKLICUJEM.`,
};
