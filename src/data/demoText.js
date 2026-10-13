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
// **It is a SNAPSHOT, not a live translation** (ruled 2026-09-12). The demo is written
// into the database in the language selected when it is loaded, and switching language afterwards
// does not rewrite it — those rows are the trainer's to edit by then, and rewriting them would
// throw away whatever they changed. Reloading the demo in the other language is the way to get it
// in the other language.
//
// **Every word a trainer reads is in the demo's language** (ruled 2026-10-13): session, plan and
// circuit names, what each plan is for, how each exercise is done, notes, places. English sample
// data on a Slovenian screen reads as an unfinished translation, and the demo is what a trainer
// judges the app by. Not translated: a place's own name ("Trib" stays, the words around it do not).
// Still English at this point, and open in TODO.md: the clients' names and the exercises' names,
// because the guided story's cards in src/i18n/ name them and must change with them.
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

    // Places. "Trib" is the gym's name and stays; the words around it are translated.
    "Trib gym base": "Fitnes Trib",
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
    "Keep warmups thorough. Enjoys tracking RPE (Rate of Perceived Exertion).":
      "Ogrevanje naj bo temeljito. Spremlja RPE (zaznano težavnost napora).",
    "Keep back squats at moderate load and monitor depth. Avoid high-impact jumping.":
      "Počepi z zmerno težo, pazi na globino. Brez skokov s trdim doskokom.",
    "Prefers high-intensity interval formats. Enjoys kettlebell workouts. Heart rate spikes quickly; monitor recovery times.":
      "Najraje intervalni treningi visoke intenzivnosti in vadba z girjami. Srčni utrip hitro poskoči; spremljaj čas okrevanja.",
    "No current injuries. Very consistent with sleep and nutrition tracking.":
      "Trenutno brez poškodb. Zelo dosledno spremljanje spanja in prehrane.",
    "Prioritize core stability work.": "Prednost ima stabilnost trupa.",
    "No injuries reported. Prefers morning sessions and steady progression.":
      "Brez prijavljenih poškodb. Najraje jutranji termini in postopno napredovanje.",
    "Cleared for training by physician.": "Zdravnik je odobril vadbo.",
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

    // ── What each exercise asks for, the column read during a set (data/routines.js) ─────────
    "10 per arm": "10 na roko",
    "10 reps": "10 ponovitev",
    "10 reps (light)": "10 ponovitev (lahko)",
    "12 reps": "12 ponovitev",
    "20 per side": "20 na stran",
    "30s hold": "30 s drže",
    "45 seconds": "45 s",
    "45s": "45 s",
    "60s hold": "60 s drže",
    Max: "Največ",

    // ── Routines: what each plan is for, shown under its name on the Plans page ───────────────
    "Strength-focused upper body session prioritizing compound presses and rows.":
      "Trening moči za zgornji del telesa s poudarkom na sestavljenih potiskih in veslanjih.",
    "Squat and hinge focus with direct core work.":
      "Poudarek na počepu in kolčnem upogibu, z neposrednim delom za trup.",
    "A comprehensive 5-phase session featuring a dynamic warmup, metabolic strength tri-sets, core work, and a longevity cooldown.":
      "Celovit trening v 5 delih: dinamično ogrevanje, metabolne trojke za moč, delo za trup in umirjanje.",
    "Gentle core activation and mobility exercises focused on deep abdominal breathing, posture, and light functional strength.":
      "Nežna aktivacija trupa in vaje za gibljivost s poudarkom na globokem trebušnem dihanju, drži in lahki funkcionalni moči.",
    "Compound strength lifts paired with posture and core stability work optimized for long-term joint health.":
      "Sestavljeni dvigi za moč skupaj z vajami za držo in stabilnost trupa, prilagojeni dolgoročnemu zdravju sklepov.",

    // ── Exercises: how each one is done (data/exercises.js), in the exercise's form ───────────
    "Lie flat on a bench, grip the barbell slightly wider than shoulder width, lower it to mid-chest, and push up.":
      "Uleži se na klop, drog primi malo širše od ramen, ga spusti do sredine prsi in potisni navzgor.",
    "Lie on a flat bench with a dumbbell in each hand, lower the dumbbells to chest level, then press them up.":
      "Uleži se na ravno klop z ročko v vsaki roki, ročki spusti do višine prsi in ju potisni navzgor.",
    "Set bench to a 30-45 degree incline. Press dumbbells upwards from chest height.":
      "Klop nastavi na naklon 30–45 stopinj. Ročki potisni navzgor z višine prsi.",
    "Position pulleys at shoulder height, grab handles, and bring hands together in a wide hugging motion.":
      "Škripca nastavi v višino ramen, primi ročaja in roki v širokem loku združi pred seboj.",
    "Keep body in a straight plank, lower chest to floor, and push back up.":
      "Telo drži ravno kot desko, prsi spusti do tal in se potisni nazaj gor.",
    "Hang from a bar with palms facing away. Pull chest up to the bar.":
      "Visi na drogu z dlanmi, obrnjenimi stran od sebe. Prsi povleci do droga.",
    "Sit at pulldown station, pull bar down to upper chest, engaging the lats.":
      "Sedi k napravi, drog povleci do zgornjega dela prsi in napni široke hrbtne mišice.",
    "Hinge at hips, pull barbell towards lower abdomen keeping back straight.":
      "Predkloni se v kolkih in drog vleci proti spodnjemu delu trebuha; hrbet ostane raven.",
    "Place one knee/hand on bench, pull dumbbell to hip with other arm.":
      "Eno koleno in roko nasloni na klop, z drugo roko vleci ročko proti kolku.",
    "Pull rope attachment from high pulley towards forehead, pulling elbows wide.":
      "Vrv z zgornjega škripca vleci proti čelu, komolci gredo široko narazen.",
    "Rest bar on upper back, squat down until thighs are parallel to floor, push back up.":
      "Drog nasloni na zgornji del hrbta, počepni, dokler stegna niso vzporedna s tlemi, in se dvigni.",
    "Hinge at hips with micro-bend in knees, lower weight down shins, squeeze glutes to stand.":
      "Predkloni se v kolkih z rahlo pokrčenimi koleni, utež spusti ob golenih in se z napetimi zadnjičnimi mišicami vzravnaj.",
    "Sit in machine, unlock platform, lower knees toward chest, press back up without locking knees.":
      "Sedi v napravo, sprosti ploščo, kolena spusti proti prsim in potisni nazaj, ne da bi kolena povsem iztegnil.",
    "Hold a single dumbbell vertically at chest height, squat deep.":
      "Eno ročko drži navpično pred prsmi in globoko počepni.",
    "Sit in machine, extend legs fully, pause at top, and lower slowly.":
      "Sedi v napravo, noge povsem iztegni, zgoraj počakaj in jih počasi spusti.",
    "Lie face down, curl roller pad towards glutes, control return.":
      "Uleži se na trebuh, blazinico pokrči proti zadnjici in jo nadzorovano vrni.",
    "Raise heels as high as possible on a block, stretch down deep.":
      "Na podstavku dvigni pete čim višje in jih spusti globoko navzdol.",
    "Press barbell from shoulder height overhead to full lockout, head through at top.":
      "Drog potisni z višine ramen nad glavo do iztegnjenih rok; zgoraj glava pride med roki.",
    "Stand tall, raise dumbbells out to sides until arms are parallel to the floor.":
      "Stoj vzravnano in ročki dvigni vstran, dokler roke niso vzporedne s tlemi.",
    "Sit or stand, press dumbbells from ear level overhead.":
      "Sede ali stoje ročki potisni z višine ušes nad glavo.",
    "Rotate palms up as you curl dumbbells towards shoulders, keeping elbows locked at sides.":
      "Med dvigom ročk proti ramenom obrni dlani navzgor; komolci ostanejo ob telesu.",
    "Curl dumbbells with neutral grip (palms facing each other).":
      "Ročki dvigni z nevtralnim prijemom (dlani obrnjeni druga proti drugi).",
    "Push rope or bar attachment down by extending elbows, keeping upper arms still.":
      "Vrv ali drog potisni navzdol z iztegom komolcev; nadlakti mirujeta.",
    "Lie on bench, lower bar to forehead by bending elbows, then extend.":
      "Uleži se na klop, s pokrčenjem komolcev spusti drog do čela, nato roki iztegni.",
    "Hold straight body line resting on forearms and toes. Squeeze core and glutes.":
      "Telo drži v ravni črti, oprto na podlahti in prste nog. Napni trup in zadnjične mišice.",
    "Hang from pull-up bar, raise knees to chest height slowly without swinging.":
      "Visi na drogu in počasi, brez zibanja, dvigni kolena do višine prsi.",
    "Sit with soles of feet together, touch floor behind head, sit up and touch toes.":
      "Sedi s stopali skupaj, z rokami se dotakni tal za glavo, se dvigni in se dotakni prstov na nogah.",
    "Sit, lean back slightly, lift feet, rotate torso tapping hands side-to-side.":
      "Sedi, se rahlo nagni nazaj, dvigni stopala in zasukaj trup; z rokami se izmenično dotikaj tal ob strani.",
    "Step forward lunging down, alternating legs.":
      "Stopi naprej v izpadni korak in menjavaj nogi.",
    "Hold child pose and lateral lat stretches for 30s.":
      "Položaj otroka in stranski razteg hrbta zadrži po 30 s.",
    "Static hamstring stretch and hip flexor stretch, hold 30s per side.":
      "Statično raztezanje zadnje lože in upogibalk kolka, 30 s na vsako stran.",
    "Sustained air-bike intervals; drive with arms and legs to the calorie target.":
      "Daljši intervali na zračnem kolesu; z rokami in nogami poganjaj do ciljnih kalorij.",
    "Air-bike intervals to a fixed duration — steady pace or an all-out sprint clock.":
      "Intervali na zračnem kolesu določene dolžine — enakomeren tempo ali šprint s polno močjo.",
    "Hold the target power output (watts) on the air bike for the prescribed effort.":
      "Na zračnem kolesu drži ciljno moč (vate) za predpisani napor.",
    "Row to the target distance with a strong legs-hips-arms sequence.":
      "Veslaj do ciljne razdalje z močnim zaporedjem noge–kolki–roke.",
    "Double-pole the ski-erg to the calorie target, hinging at the hips.":
      "Na smučarskem ergometru vleci z obema rokama hkrati do ciljnih kalorij, s predklonom v kolkih.",
    "Hold the target power output (watts) for the prescribed effort.":
      "Drži ciljno moč (vate) za predpisani napor.",
    "Steady-state or interval run to the target time.": "Enakomeren ali intervalni tek do ciljnega časa.",
    "Stand on one leg, hips level and core braced; hold for the target time per side.":
      "Stoj na eni nogi, kolki so poravnani in trup napet; zadrži ciljni čas na vsako stran.",
    "Hold a quarter-squat on an unstable BOSU dome, staying centred for the target time.":
      "Na nestabilni kupoli BOSU zadrži četrtinski počep in ostani na sredini do ciljnega časa.",
    "Hold a rigid plank with a plate on the upper back for the target time.":
      "Zadrži trdno desko z utežno ploščo na zgornjem delu hrbta do ciljnega časa.",
    "Sit against the wall at 90° knees, optionally holding a plate, for the target time.":
      "Sedi ob steni s koleni pod kotom 90°, po želji z utežno ploščo, do ciljnega časa.",
    "Hold a loaded barbell locked out overhead for the target time.":
      "Obremenjen drog drži z iztegnjenimi rokami nad glavo do ciljnega časa.",
    "Sprint 5yd, back 10yd, through 5yd, changing direction sharply; log the time.":
      "Šprint 5 jardov, nazaj 10 jardov in naprej 5 jardov z ostrimi obrati; zapiši čas.",
    "Quick-feet ladder pattern for the target time, staying light on the balls of the feet.":
      "Hitri koraki skozi koordinacijsko lestev do ciljnega časa, lahkotno na blazinicah stopal.",
    "Repeated accelerations between cones over the target distance.":
      "Ponavljajoči se pospeški med stožci na ciljni razdalji.",
    "Run holding the target pace (min/km).": "Tek s ciljnim tempom (min/km).",
    "Steady aerobic ride keeping heart rate at the target zone (bpm).":
      "Enakomerna aerobna vožnja s srčnim utripom v ciljni coni (udarci na minuto).",
  },

  // German. Machine translation, not yet reviewed by a German speaker (see src/i18n/de.js). Two of
  // these are named on the story's cards in de.js — "Kraft & Kondition (Gruppe)" and "Kraft
  // dienstags und donnerstags" — so a change here is a change there. The group session's name is
  // kept as short as the Slovenian one: the guide shrinks to keep that session's card visible, and
  // "Gruppentraining Kraft & Kondition" made the card tall enough that the guide had to scroll.
  de: {
    // ── Sessions (data/sessions.js) ───────────────────────────────────────────────────────────
    "1:1 Personal Training": "Einzeltraining",
    "Core & Stability": "Rumpf und Stabilität",
    "Early Bird Strength": "Kraft am frühen Morgen",
    "Express Core HIIT": "Kurzes HIIT für den Rumpf",
    "Group Strength & Conditioning": "Kraft & Kondition (Gruppe)",
    "HIIT Conditioning": "HIIT-Kondition",
    "Lower Body Strength": "Kraft Beine",
    "Lunch Express HIIT": "Kurzes HIIT am Mittag",
    "Mobility Flow": "Beweglichkeit",
    "Mobility & Recovery": "Beweglichkeit und Regeneration",
    "Morning Conditioning": "Morgendliche Kondition",
    "Open Slot (Drop-in)": "Freier Termin (ohne Anmeldung)",
    "Post-Work Cardio": "Ausdauer nach der Arbeit",
    "Return-to-Play Rehab": "Rückkehr nach Verletzung",
    "Strength & Longevity Focus": "Kraft und Langlebigkeit",
    "Upper Body Strength": "Kraft Oberkörper",

    // Places. "Trib" is the gym's name and stays; the words around it are translated.
    "Trib gym base": "Fitnessstudio Trib",
    "city park": "Stadtpark",
    "playground outside": "Spielplatz draußen",

    // ── Routines (data/routines.js) ───────────────────────────────────────────────────────────
    "Upper Body A": "Oberkörper A",
    "Legs & Core B": "Beine und Rumpf B",
    "Tri-Set Metabolic Conditioning": "Metabolische Kondition in Dreiersätzen",
    "Postpartum Core & Mobility": "Rumpf und Beweglichkeit nach der Geburt",

    // A repeating slot's name (data/sessionSeriesSeed.js).
    "Tuesday & Thursday Strength": "Kraft dienstags und donnerstags",

    // ── Circuits, inside routines and history ─────────────────────────────────────────────────
    "Arm Finisher Circuit": "Abschlusszirkel Arme",
    "Chest & Back Strength Complex": "Kraftkomplex Brust und Rücken",
    "Core & Ankle Alignment": "Rumpf und Ausrichtung der Sprunggelenke",
    "Core Finish Burner": "Abschlusszirkel Rumpf",
    "Dynamic Warmup": "Dynamisches Aufwärmen",
    "Hypertrophy & Core Trio": "Dreier für Hypertrophie und Rumpf",
    "Leg & Hinge Circuit": "Zirkel Beine und Hüftbeugung",
    "Longevity Cooldown & Stretching": "Abwärmen und Dehnen",
    "Lower Body Strength Circuit": "Kraftzirkel Beine",
    "Posture & Core Stability Circuit": "Zirkel Haltung und Rumpfstabilität",
    "Posture & Leg Strength Circuit": "Zirkel Haltung und Beinkraft",
    "Press & Hinge Longevity Circuit": "Zirkel Drücken und Hüftbeugung",
    "Shoulder & Lat Density Circuit": "Zirkel Schultern und breiter Rückenmuskel",
    "Tri-Set Metabolic Circuit": "Metabolischer Zirkel in Dreiersätzen",

    // ── Clients: what they are training for (data/clients.js) ─────────────────────────────────
    "Strength gain, building shoulder mobility, and improving squat form.":
      "Kraft aufbauen, Beweglichkeit der Schultern und Technik der Kniebeuge verbessern.",
    "Fat loss, cardiovascular endurance, and recovering functional knee strength.":
      "Fett abbauen, Ausdauer von Herz und Kreislauf verbessern und die Kraft im Knie zurückgewinnen.",
    "General conditioning, consistency, and core activation.":
      "Allgemeine Kondition, Regelmäßigkeit und Aktivierung des Rumpfs.",
    "Hypertrophy, upper body definition, and consistent training frequency.":
      "Hypertrophie, definierter Oberkörper und regelmäßiges Training.",
    "Marathon prep, aerobic base building, and injury-free mileage progression.":
      "Vorbereitung auf einen Marathon, aerobe Grundlage und mehr Kilometer ohne Verletzung.",
    "General strength maintenance and mobility as a masters athlete.":
      "Kraft und Beweglichkeit als Seniorensportler erhalten.",
    "Postpartum strength rebuild and core recovery.":
      "Kraft und Rumpf nach der Geburt wieder aufbauen.",
    "Reduce body fat from 17% to below 15% (but not below 10%), build strength, and optimize for health and longevity.":
      "Körperfett von 17 % auf unter 15 % senken (aber nicht unter 10 %), Kraft aufbauen und auf Gesundheit und Langlebigkeit achten.",

    // ── Clients: the trainer's notes and injuries ─────────────────────────────────────────────
    "Keep warmups thorough. Enjoys tracking RPE (Rate of Perceived Exertion).":
      "Gründlich aufwärmen. Verfolgt gern die RPE (empfundene Anstrengung).",
    "Keep back squats at moderate load and monitor depth. Avoid high-impact jumping.":
      "Kniebeugen mit mäßiger Last, auf die Tiefe achten. Keine Sprünge mit harter Landung.",
    "Prefers high-intensity interval formats. Enjoys kettlebell workouts. Heart rate spikes quickly; monitor recovery times.":
      "Mag am liebsten hochintensive Intervalle und Training mit Kettlebells. Der Puls steigt schnell; auf die Erholungszeit achten.",
    "No current injuries. Very consistent with sleep and nutrition tracking.":
      "Derzeit keine Verletzungen. Zeichnet Schlaf und Ernährung sehr regelmäßig auf.",
    "Prioritize core stability work.": "Rumpfstabilität hat Vorrang.",
    "No injuries reported. Prefers morning sessions and steady progression.":
      "Keine Verletzungen gemeldet. Trainiert am liebsten morgens und steigert sich gleichmäßig.",
    "Cleared for training by physician.": "Ärztlich für das Training freigegeben.",
    "Focus on clean compound movements (squat, hinge, press) and metabolic conditioning to improve body composition. Focus on longevity and joint health; monitor RPE and prioritize recovery.":
      "Schwerpunkt auf sauberen Grundübungen (Kniebeuge, Hüftbeugung, Drücken) und metabolischer Kondition für eine bessere Körperzusammensetzung. Schwerpunkt auf Langlebigkeit und gesunden Gelenken; RPE verfolgen, Regeneration hat Vorrang.",
    "Knee reconstruction surgery in 2024": "Knierekonstruktion 2024",
    "Mild lower back stiffness after long runs":
      "Leichte Steifheit im unteren Rücken nach langen Läufen",
    "Postpartum recovery — avoid heavy overhead loading until week 12":
      "Erholung nach der Geburt — bis Woche 12 keine schweren Lasten über Kopf",
    "Slight left shoulder tightness during overhead movements":
      "Leichte Verspannung in der linken Schulter bei Bewegungen über Kopf",

    // ── What was written down during a set (data/history.js) ──────────────────────────────────
    "Completed all 4 sets with high speed. Recommend adding 2.5kg next session.":
      "Alle 4 Sätze schnell und sauber. Nächstes Mal 2,5 kg mehr.",
    "Failed 6th rep": "6. Wiederholung nicht geschafft",
    "Felt form breaking on last 2 reps. Keep weight at 50kg.":
      "Bei den letzten 2 Wiederholungen ließ die Technik nach. Gewicht bleibt bei 50 kg.",
    "Felt slight pinching in right shoulder. Ceased after 2 sets.":
      "Leichtes Zwicken in der rechten Schulter. Nach 2 Sätzen abgebrochen.",
    "Gassed by 15 cal — drop the target to 15 next session.":
      "Bei 15 kcal war die Kraft weg — nächstes Mal Ziel 15.",
    "Great mind-muscle connection. Strong back activation.":
      "Sehr gute Verbindung zum Muskel. Starke Aktivierung des Rückens.",
    "Grip fatigue": "Griff ermüdet",
    "Left arm weaker on last set": "Linker Arm im letzten Satz schwächer",
    "Left side fatigued": "Linke Seite ermüdet",
    "Moved 24kg easily on the final set. Increase starting weight next session.":
      "24 kg im letzten Satz mühelos. Nächstes Mal höheres Startgewicht.",
    "Pushed the weight easily. Ready for 65kg next week.":
      "Das Gewicht ging mühelos. Nächste Woche 65 kg.",
    "RPE 9, last rep grind": "RPE 9, letzte Wiederholung mühsam",
    "Shoulders shrugging too early. Keep elbows in.":
      "Schultern ziehen zu früh hoch. Ellbogen am Körper lassen.",
    "Sprinted the last 5 cal": "Die letzten 5 kcal im Sprint",
    "Steadier on the left": "Links stabiler",
    "Strict form": "Saubere Technik",
    "Strict, paused": "Sauber, mit Pause",
    "Strong hinge focus": "Schwerpunkt auf der Hüftbeugung",
    "To failure": "Bis zum Muskelversagen",

    // ── What each exercise asks for, the column read during a set (data/routines.js) ─────────
    "10 per arm": "10 pro Arm",
    "10 reps": "10 Wdh.",
    "10 reps (light)": "10 Wdh. (leicht)",
    "12 reps": "12 Wdh.",
    "20 per side": "20 pro Seite",
    "30s hold": "30 s halten",
    "45 seconds": "45 s",
    "45s": "45 s",
    "60s hold": "60 s halten",
    Max: "Max.",

    // ── Routines: what each plan is for, shown under its name on the Plans page ───────────────
    "Strength-focused upper body session prioritizing compound presses and rows.":
      "Krafttraining für den Oberkörper mit Schwerpunkt auf Drück- und Ruderübungen.",
    "Squat and hinge focus with direct core work.":
      "Schwerpunkt auf Kniebeuge und Hüftbeugung, mit gezielter Rumpfarbeit.",
    "A comprehensive 5-phase session featuring a dynamic warmup, metabolic strength tri-sets, core work, and a longevity cooldown.":
      "Umfassendes Training in 5 Phasen: dynamisches Aufwärmen, metabolische Kraft-Dreiersätze, Rumpfarbeit und Abwärmen.",
    "Gentle core activation and mobility exercises focused on deep abdominal breathing, posture, and light functional strength.":
      "Sanfte Aktivierung des Rumpfs und Übungen für die Beweglichkeit mit Schwerpunkt auf tiefer Bauchatmung, Haltung und leichter funktioneller Kraft.",
    "Compound strength lifts paired with posture and core stability work optimized for long-term joint health.":
      "Grundübungen für Kraft, kombiniert mit Übungen für Haltung und Rumpfstabilität, ausgerichtet auf langfristig gesunde Gelenke.",

    // ── Exercises: how each one is done (data/exercises.js), in the exercise's form ───────────
    "Lie flat on a bench, grip the barbell slightly wider than shoulder width, lower it to mid-chest, and push up.":
      "Flach auf die Bank legen, die Langhantel etwas breiter als schulterbreit greifen, zur Brustmitte absenken und hochdrücken.",
    "Lie on a flat bench with a dumbbell in each hand, lower the dumbbells to chest level, then press them up.":
      "Mit einer Kurzhantel in jeder Hand auf eine Flachbank legen, die Hanteln auf Brusthöhe absenken und hochdrücken.",
    "Set bench to a 30-45 degree incline. Press dumbbells upwards from chest height.":
      "Bank auf 30–45 Grad Neigung stellen. Kurzhanteln von Brusthöhe nach oben drücken.",
    "Position pulleys at shoulder height, grab handles, and bring hands together in a wide hugging motion.":
      "Seilzüge auf Schulterhöhe stellen, Griffe fassen und die Hände in einem weiten Bogen vor dem Körper zusammenführen.",
    "Keep body in a straight plank, lower chest to floor, and push back up.":
      "Körper gerade wie ein Brett halten, Brust zum Boden absenken und wieder hochdrücken.",
    "Hang from a bar with palms facing away. Pull chest up to the bar.":
      "Mit nach vorn zeigenden Handflächen an der Stange hängen. Brust zur Stange ziehen.",
    "Sit at pulldown station, pull bar down to upper chest, engaging the lats.":
      "Am Latzug sitzen, die Stange zur oberen Brust ziehen und den breiten Rückenmuskel anspannen.",
    "Hinge at hips, pull barbell towards lower abdomen keeping back straight.":
      "In der Hüfte beugen und die Langhantel mit geradem Rücken zum unteren Bauch ziehen.",
    "Place one knee/hand on bench, pull dumbbell to hip with other arm.":
      "Ein Knie und eine Hand auf die Bank stützen, mit dem anderen Arm die Kurzhantel zur Hüfte ziehen.",
    "Pull rope attachment from high pulley towards forehead, pulling elbows wide.":
      "Das Seil vom oberen Kabelzug zur Stirn ziehen, Ellbogen weit nach außen.",
    "Rest bar on upper back, squat down until thighs are parallel to floor, push back up.":
      "Stange auf dem oberen Rücken ablegen, in die Hocke gehen, bis die Oberschenkel parallel zum Boden sind, und wieder hochdrücken.",
    "Hinge at hips with micro-bend in knees, lower weight down shins, squeeze glutes to stand.":
      "In der Hüfte beugen, Knie leicht gebeugt, das Gewicht an den Schienbeinen absenken und mit angespanntem Gesäß aufrichten.",
    "Sit in machine, unlock platform, lower knees toward chest, press back up without locking knees.":
      "In die Maschine setzen, Plattform entriegeln, Knie zur Brust absenken und wieder hochdrücken, ohne die Knie ganz durchzustrecken.",
    "Hold a single dumbbell vertically at chest height, squat deep.":
      "Eine Kurzhantel senkrecht auf Brusthöhe halten und tief in die Hocke gehen.",
    "Sit in machine, extend legs fully, pause at top, and lower slowly.":
      "In die Maschine setzen, Beine ganz strecken, oben kurz halten und langsam absenken.",
    "Lie face down, curl roller pad towards glutes, control return.":
      "Auf dem Bauch liegen, das Polster zum Gesäß beugen und kontrolliert zurückführen.",
    "Raise heels as high as possible on a block, stretch down deep.":
      "Auf einem Block die Fersen so hoch wie möglich heben und tief absenken.",
    "Press barbell from shoulder height overhead to full lockout, head through at top.":
      "Langhantel von Schulterhöhe über Kopf drücken, bis die Arme gestreckt sind; oben den Kopf zwischen die Arme bringen.",
    "Stand tall, raise dumbbells out to sides until arms are parallel to the floor.":
      "Aufrecht stehen und die Kurzhanteln seitlich heben, bis die Arme parallel zum Boden sind.",
    "Sit or stand, press dumbbells from ear level overhead.":
      "Im Sitzen oder Stehen die Kurzhanteln von Ohrhöhe über Kopf drücken.",
    "Rotate palms up as you curl dumbbells towards shoulders, keeping elbows locked at sides.":
      "Beim Beugen der Kurzhanteln zu den Schultern die Handflächen nach oben drehen; die Ellbogen bleiben am Körper.",
    "Curl dumbbells with neutral grip (palms facing each other).":
      "Kurzhanteln im neutralen Griff beugen (Handflächen zeigen zueinander).",
    "Push rope or bar attachment down by extending elbows, keeping upper arms still.":
      "Seil oder Stange durch Strecken der Ellbogen nach unten drücken; die Oberarme bleiben ruhig.",
    "Lie on bench, lower bar to forehead by bending elbows, then extend.":
      "Auf der Bank liegen, die Stange durch Beugen der Ellbogen zur Stirn absenken, dann strecken.",
    "Hold straight body line resting on forearms and toes. Squeeze core and glutes.":
      "Den Körper in gerader Linie auf Unterarmen und Zehen halten. Rumpf und Gesäß anspannen.",
    "Hang from pull-up bar, raise knees to chest height slowly without swinging.":
      "An der Klimmzugstange hängen und die Knie langsam, ohne Schwung, bis auf Brusthöhe heben.",
    "Sit with soles of feet together, touch floor behind head, sit up and touch toes.":
      "Mit aneinanderliegenden Fußsohlen sitzen, hinter dem Kopf den Boden berühren, aufrichten und die Zehen berühren.",
    "Sit, lean back slightly, lift feet, rotate torso tapping hands side-to-side.":
      "Sitzen, leicht zurücklehnen, Füße anheben und den Oberkörper drehen; mit den Händen abwechselnd seitlich den Boden berühren.",
    "Step forward lunging down, alternating legs.":
      "Mit abwechselnden Beinen im Ausfallschritt nach vorn gehen.",
    "Hold child pose and lateral lat stretches for 30s.":
      "Kindhaltung und seitliche Dehnung des Rückens je 30 s halten.",
    "Static hamstring stretch and hip flexor stretch, hold 30s per side.":
      "Statische Dehnung der Oberschenkelrückseite und des Hüftbeugers, 30 s pro Seite halten.",
    "Sustained air-bike intervals; drive with arms and legs to the calorie target.":
      "Längere Intervalle auf dem Air-Bike; mit Armen und Beinen bis zum Kalorienziel antreiben.",
    "Air-bike intervals to a fixed duration — steady pace or an all-out sprint clock.":
      "Intervalle auf dem Air-Bike mit fester Dauer — gleichmäßiges Tempo oder Sprint mit voller Kraft.",
    "Hold the target power output (watts) on the air bike for the prescribed effort.":
      "Die Zielleistung (Watt) auf dem Air-Bike für die vorgegebene Belastung halten.",
    "Row to the target distance with a strong legs-hips-arms sequence.":
      "Bis zur Zieldistanz rudern, mit kräftiger Abfolge Beine–Hüfte–Arme.",
    "Double-pole the ski-erg to the calorie target, hinging at the hips.":
      "Am Ski-Ergometer mit beiden Armen gleichzeitig bis zum Kalorienziel ziehen, in der Hüfte beugen.",
    "Hold the target power output (watts) for the prescribed effort.":
      "Die Zielleistung (Watt) für die vorgegebene Belastung halten.",
    "Steady-state or interval run to the target time.":
      "Gleichmäßiger Lauf oder Intervalllauf bis zur Zielzeit.",
    "Stand on one leg, hips level and core braced; hold for the target time per side.":
      "Auf einem Bein stehen, Hüfte gerade und Rumpf angespannt; die Zielzeit pro Seite halten.",
    "Hold a quarter-squat on an unstable BOSU dome, staying centred for the target time.":
      "Eine Viertelkniebeuge auf der instabilen BOSU-Kuppel halten und bis zur Zielzeit mittig bleiben.",
    "Hold a rigid plank with a plate on the upper back for the target time.":
      "Einen festen Unterarmstütz mit einer Hantelscheibe auf dem oberen Rücken bis zur Zielzeit halten.",
    "Sit against the wall at 90° knees, optionally holding a plate, for the target time.":
      "Mit 90° in den Knien an der Wand sitzen, wahlweise mit Hantelscheibe, bis zur Zielzeit.",
    "Hold a loaded barbell locked out overhead for the target time.":
      "Eine beladene Langhantel mit gestreckten Armen über Kopf bis zur Zielzeit halten.",
    "Sprint 5yd, back 10yd, through 5yd, changing direction sharply; log the time.":
      "5 Yards sprinten, 10 Yards zurück, 5 Yards wieder vor, mit scharfem Richtungswechsel; die Zeit notieren.",
    "Quick-feet ladder pattern for the target time, staying light on the balls of the feet.":
      "Schnelle Schrittfolge durch die Koordinationsleiter bis zur Zielzeit, leicht auf den Fußballen.",
    "Repeated accelerations between cones over the target distance.":
      "Wiederholte Antritte zwischen Hütchen über die Zieldistanz.",
    "Run holding the target pace (min/km).": "Laufen im Zieltempo (min/km).",
    "Steady aerobic ride keeping heart rate at the target zone (bpm).":
      "Gleichmäßige aerobe Fahrt mit der Herzfrequenz in der Zielzone (Schläge pro Minute).",
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
