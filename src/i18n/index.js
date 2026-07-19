// Translation registry — every locale the app ships. Adding a language means adding its file
// here and importing it; the i18n parity test iterates this map so all locales stay in sync.
import { en } from "./en.js";
import { sl } from "./sl.js";

export const TRANSLATIONS = { en, sl };
