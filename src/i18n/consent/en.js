// src/i18n/consent/en.js — the English GDPR consent letter, as sent by the app's Email form and
// Send link by SMS buttons.
//
// It lives beside the UI dictionaries rather than inside the consent module because it is
// translated copy, not logic: a new language is a new file here plus a row in ./index.js, and
// nothing in modules/ changes. What it is NOT is a flat key→string dictionary like en.js — a
// consent letter is one continuous document whose paragraphs cannot be reordered or partially
// translated, so it is a template function taking the values that vary.
//
// **The letter carries the whole Art. 13 core itself, not only a link to the notice.** A client who
// signs it on paper, or reads it in a mail client offline, may never open the link, and the German
// supervisory authorities say a person handed a paper form must not be sent to the internet for the
// information (DSK Kurzpapier Nr. 10). So it names the controller (the signature), the data, the
// recipients, the retention, the rights, the complaint route and what refusing costs. The notice
// adds the storage vendor, the transfer safeguard and the detail of an erasure.
//
// `signature` is the trainer's name, phone and email, one per line, from Settings → My details; an
// install that has none signs with the generic line instead.
//
// Pinned verbatim to docs/templates/en/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs — a client must never be handed one wording
// and asked to consent to another.
//
// deps: none — pure string building.

export const consentEn = {
  subject: "Personal training — consent to process your personal data",

  body: ({ clientName, noticeUrl, version, signature }) => `Hi ${clientName},

I use LibrePT, an app on my own device, to plan your training, follow your progress and train you safely. Before I keep records about you, I need your consent. This message says what I keep, who receives it and what your rights are. I, the trainer who signs this message, am responsible for your data: under the GDPR (Regulation (EU) 2016/679) I am the controller.

What I record:
1. Your name, and the email address or phone number you give me.
2. Your training: goals, session dates, exercises, sets, repetitions, loads, and how each session went.
3. Information about your health: injuries, pain, limits on movement and body weight, where I need it to train you safely. The GDPR treats health data as a special category, so I need your explicit consent for it (Art. 9(2)(a)).

Where it is kept and who receives it:
1. The records are kept on my own device. The makers of LibrePT receive nothing.
2. If I turn on backup, a copy is kept in my own cloud storage. My device encrypts it with my password before it leaves, so the storage provider cannot read it. The provider may keep it outside the EU; the privacy notice names the provider and the safeguard.
3. If I use an AI assistant to help plan your training, it receives only a copy without your name, contact details, goals or notes: a number, session dates and the sets you did. Only my device can link that number to you.
4. I never sell your data and never share it with advertisers. Nobody else receives it.

How long I keep it: while we train together, and at most two years after your last session, so your history is there if you come back. Earlier if you ask.

Your rights: at any time and free of charge, you can ask me for a copy of your data, a correction, its deletion, or a restriction of its processing. I answer within one month. If you think I handled your data wrongly, you can complain to the data protection authority where you live (in Slovenia: the Information Commissioner, www.ip-rs.si). No decision about you is made by a machine alone.

You do not have to consent. Without your consent I cannot keep records about you in the app, and without information about your health I cannot adapt your training to it.

The full privacy notice is here: ${noticeUrl}

To consent, reply "I CONSENT" to this email, or sign the printed form. With that you confirm that you have read this message and that you explicitly consent to me processing your personal data, including the information about your health, for your training.

You can withdraw your consent at any time, without giving a reason: reply "WITHDRAW" to this message, or tell me in any other way. Withdrawing is as easy as consenting. It stops further processing and does not make the processing before it unlawful.

Consent form version: ${version}

Best regards,
${signature || "Your personal trainer"}`,

  share: ({ clientName, noticeUrl, trainerName }) =>
    `Hi ${clientName}.${trainerName ? ` This is ${trainerName}, your trainer.` : ""} Before I keep records about your training and your health, I need your explicit consent under the GDPR. Please read the short notice first: ${noticeUrl} Reply CONSENT to agree, or sign the printed form at the gym. Reply WITHDRAW at any time to take it back.`,
};
