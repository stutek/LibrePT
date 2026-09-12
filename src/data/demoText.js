// src/data/demoText.js — the demo data's own words, in each language the app speaks.
//
// **It lives with the seed, not with the languages.** `src/i18n/` is the locale directory and
// every `.js` in it is read as a language: the parity check registers each one and diffs its keys
// against the others (tests/unit/test_i18n_parity.py), so a helper dropped in there is a locale
// missing six hundred keys. This is the seed's own copy, so it sits beside the seed.
//
// **Why the seed's English is the key.** The interface dictionaries are keyed by a name
// (`label_start_time`); this one is keyed by the exact string the seed modules carry
// (`data/sessions.js` and its neighbours). A seed record is not a control with a name — it is a
// sample session called "Morning Conditioning" — and inventing a key per record would mean two
// places to edit whenever a demo session is added, with nothing to catch it when only one is.
// Keyed by the text, a missing translation simply leaves the English standing, which is what a
// demo should do rather than show a raw key on a card.
//
// **It is a SNAPSHOT, not a live translation** (TODO §46.4, ruled 2026-09-12). The demo is written
// into the database in the language selected when it is loaded, and switching language afterwards
// does not rewrite it — those rows are the trainer's to edit by then, and rewriting them would
// throw away whatever they changed. Reloading the demo in the other language is the way to get it
// in the other language.
//
// **What is deliberately NOT translated.** Exercise names are the movement catalog's own
// vocabulary and are used in English on a Slovenian gym floor ("Barbell Bench Press"); people's
// names are names; and "Trib gym base" is a place's name, not a description of one.
//
// deps: none — a plain lookup table.

/** Seed text → its translation, per language. Languages absent here fall back to the seed's own
 * English, and so does any string not listed. */
export const DEMO_TEXT = {
  sl: {
    // ── Sessions (data/sessions.js) ───────────────────────────────────────────────────────────
    "1:1 Personal Training": "Individualni trening",
    "Core & Stability": "Trup in stabilnost",
    "Early Bird Strength": "Zgodnja moč",
    "Express Core HIIT": "Hitri HIIT za trup",
    "Group Strength & Conditioning": "Skupinska moč in kondicija",
    "HIIT Conditioning": "HIIT kondicija",
    "Lower Body Strength": "Moč nog",
    "Lunch Express HIIT": "Opoldanski hitri HIIT",
    "Mobility Flow": "Gibljivost",
    "Mobility & Recovery": "Gibljivost in regeneracija",
    "Morning Conditioning": "Jutranja kondicija",
    "Open Slot (Drop-in)": "Prost termin (brez najave)",
    "Post-Work Cardio": "Kardio po službi",
    "Return-to-Play Rehab": "Vrnitev po poškodbi",
    "Strength & Longevity Focus": "Moč in dolgoživost",
    "Upper Body Strength": "Moč zgornjega dela telesa",

    // Places. The gym's own name stays as it is; the two outdoor ones are descriptions.
    "city park": "mestni park",
    "playground outside": "zunanje igrišče",

    // ── Routines (data/routines.js) ───────────────────────────────────────────────────────────
    "Upper Body A": "Zgornji del A",
    "Legs & Core B": "Noge in trup B",
    "Tri-Set Metabolic Conditioning": "Metabolna kondicija v trojkah",
    "Postpartum Core & Mobility": "Trup in gibljivost po porodu",

    // A repeating slot's name (data/sessionSeriesSeed.js) — days of the week, so it must not stay
    // English on a Slovenian board.
    "Tuesday & Thursday Strength": "Moč ob torkih in četrtkih",

    // ── Circuits, inside routines and history ─────────────────────────────────────────────────
    "Arm Finisher Circuit": "Zaključni krog za roke",
    "Chest & Back Strength Complex": "Sklop za moč prsi in hrbta",
    "Core & Ankle Alignment": "Trup in poravnava gležnjev",
    "Core Finish Burner": "Zaključni krog za trup",
    "Dynamic Warmup": "Dinamično ogrevanje",
    "Hypertrophy & Core Trio": "Trojka za hipertrofijo in trup",
    "Leg & Hinge Circuit": "Krog za noge in kolčni upogib",
    "Longevity Cooldown & Stretching": "Umirjanje in raztezanje",
    "Lower Body Strength Circuit": "Krog za moč nog",
    "Posture & Core Stability Circuit": "Krog za držo in stabilnost trupa",
    "Posture & Leg Strength Circuit": "Krog za držo in moč nog",
    "Press & Hinge Longevity Circuit": "Krog za potisk in kolčni upogib",
    "Shoulder & Lat Density Circuit": "Krog za ramena in široke hrbtne mišice",
    "Tri-Set Metabolic Circuit": "Metabolni krog v trojkah",

    // ── Clients: what they are training for (data/clients.js) ─────────────────────────────────
    "Strength gain, building shoulder mobility, and improving squat form.":
      "Pridobiti moč, izboljšati gibljivost ramen in tehniko počepa.",
    "Fat loss, cardiovascular endurance, and recovering functional knee strength.":
      "Zmanjšati maščobo, izboljšati vzdržljivost srca in povrniti moč kolena.",
    "General conditioning, consistency, and core activation.":
      "Splošna kondicija, rednost in aktivacija trupa.",
    "Hypertrophy, upper body definition, and consistent training frequency.":
      "Hipertrofija, izrazitejši zgornji del telesa in redni treningi.",
    "Marathon prep, aerobic base building, and injury-free mileage progression.":
      "Priprava na maraton, aerobna osnova in več kilometrov brez poškodb.",
    "General strength maintenance and mobility as a masters athlete.":
      "Ohranjanje moči in gibljivosti v kategoriji veteranov.",
    "Postpartum strength rebuild and core recovery.": "Ponovna izgradnja moči in trupa po porodu.",
    "Reduce body fat from 17% to below 15% (but not below 10%), build strength, and optimize for health and longevity.":
      "Znižati telesno maščobo s 17 % pod 15 % (a ne pod 10 %), pridobiti moč ter poskrbeti za zdravje in dolgoživost.",

    // ── Clients: the trainer's notes and injuries ─────────────────────────────────────────────
    "Slight left shoulder tightness during overhead movements. Keep warmups thorough. Enjoys tracking RPE (Rate of Perceived Exertion).":
      "Rahla napetost v levi rami pri dvigih nad glavo. Ogrevanje naj bo temeljito. Spremlja RPE (zaznano težavnost napora).",
    "Knee reconstruction surgery in 2024. Keep back squats at moderate load and monitor depth. Avoid high-impact jumping.":
      "Rekonstrukcija kolena leta 2024. Počepi z zmerno težo, pazi na globino. Brez skokov s trdim doskokom.",
    "Prefers high-intensity interval formats. Enjoys kettlebell workouts. Heart rate spikes quickly; monitor recovery times.":
      "Najraje intervalni treningi visoke intenzivnosti in vadba z girjami. Srčni utrip hitro poskoči; spremljaj čas okrevanja.",
    "No current injuries. Very consistent with sleep and nutrition tracking.":
      "Trenutno brez poškodb. Zelo dosledno spremljanje spanja in prehrane.",
    "Mild lower back stiffness after long runs. Prioritize core stability work.":
      "Blaga okorelost v križu po dolgih tekih. Prednost ima stabilnost trupa.",
    "No injuries reported. Prefers morning sessions and steady progression.":
      "Brez prijavljenih poškodb. Najraje jutranji termini in postopno napredovanje.",
    "Cleared for training by physician. Avoid heavy overhead loading until week 12.":
      "Zdravnik je odobril vadbo. Do 12. tedna brez težkih bremen nad glavo.",
    "Focus on clean compound movements (squat, hinge, press) and metabolic conditioning to improve body composition. Focus on longevity and joint health; monitor RPE and prioritize recovery.":
      "Poudarek na čistih sestavljenih gibih (počep, kolčni upogib, potisk) in metabolni kondiciji za boljšo telesno sestavo. Poudarek na dolgoživosti in zdravju sklepov; spremljaj RPE in daj prednost regeneraciji.",
    "Knee reconstruction surgery in 2024": "Rekonstrukcija kolena leta 2024",
    "Mild lower back stiffness after long runs": "Blaga okorelost v križu po dolgih tekih",
    "Postpartum recovery — avoid heavy overhead loading until week 12":
      "Okrevanje po porodu — do 12. tedna brez težkih bremen nad glavo",
    "Slight left shoulder tightness during overhead movements":
      "Rahla napetost v levi rami pri dvigih nad glavo",

    // ── What was written down during a set (data/history.js) ──────────────────────────────────
    "Completed all 4 sets with high speed. Recommend adding 2.5kg next session.":
      "Vse 4 serije hitro in čisto. Naslednjič dodaj 2,5 kg.",
    "Failed 6th rep": "6. ponovitev ni uspela",
    "Felt form breaking on last 2 reps. Keep weight at 50kg.":
      "Pri zadnjih 2 ponovitvah je tehnika popustila. Teža ostane 50 kg.",
    "Felt slight pinching in right shoulder. Ceased after 2 sets.":
      "Rahlo ščipanje v desni rami. Po 2 serijah smo prekinili.",
    "Gassed by 15 cal — drop the target to 15 next session.":
      "Pri 15 kalorijah je zmanjkalo moči — naslednjič cilj 15.",
    "Great mind-muscle connection. Strong back activation.":
      "Odlična povezava z mišico. Močna aktivacija hrbta.",
    "Grip fatigue": "Utrujen prijem",
    "Left arm weaker on last set": "Leva roka šibkejša v zadnji seriji",
    "Left side fatigued": "Leva stran utrujena",
    "Moved 24kg easily on the final set. Increase starting weight next session.":
      "24 kg je v zadnji seriji šlo zlahka. Naslednjič večja začetna teža.",
    "Pushed the weight easily. Ready for 65kg next week.":
      "Teža je šla zlahka. Naslednji teden 65 kg.",
    "RPE 9, last rep grind": "RPE 9, zadnja ponovitev s težavo",
    "Shoulders shrugging too early. Keep elbows in.":
      "Ramena se prezgodaj dvigajo. Komolci naj ostanejo ob telesu.",
    "Sprinted the last 5 cal": "Zadnjih 5 kalorij v sprintu",
    "Steadier on the left": "Levo bolj stabilno",
    "Strict form": "Stroga tehnika",
    "Strict, paused": "Strogo, s premorom",
    "Strong hinge focus": "Poudarek na kolčnem upogibu",
    "To failure": "Do odpovedi",

    // ── Plan adjustments the demo already carries (data/planUpdates.js) ───────────────────────
    "Too Easy - Increase Load": "Prelahko – povečaj težo",
    "Form Break - Depth Alert": "Tehnika popušča – pozor na globino",
  },
};

/** `text` in `lang`, or `text` itself when there is nothing better. Never returns empty for a
 * non-empty input: an untranslated demo string is readable, a missing one is a blank card. */
export function localiseDemoText(text, lang) {
  if (typeof text !== "string" || !text) return text;
  return DEMO_TEXT[lang]?.[text] ?? text;
}

/** Seed records with every word in them put into `lang`, as a copy.
 *
 * **Every string, at any depth, rather than a list of fields.** The words a trainer reads are not
 * only on the record: a routine's circuits carry their own titles, and a history entry's sets carry
 * the note written during the set. A field list would have to name each of those and would go
 * silently out of date the day a seed grows a new one — which is exactly what the dictionary's own
 * test caught twice while it was being written. Walking every string is safe because only strings
 * the dictionary LISTS can change; anything else is returned as it was.
 *
 * A copy, because `DEFAULT_SESSIONS` and its neighbours are module constants that other code — the
 * seed id set in `data/seedProvenance.js` among it — reads afterwards. */
export function localiseDemoRecords(records, lang) {
  if (!DEMO_TEXT[lang]) return structuredClone(records ?? []);
  const walk = (value) => {
    if (typeof value === "string") return localiseDemoText(value, lang);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object" && !(value instanceof Date)) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
    }
    return value;
  };
  return (records ?? []).map(walk);
}
