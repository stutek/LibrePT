# LibrePT — Privacy & GDPR Statement

*Last Updated: August 2026*

---

## 1. Introduction & Local-First Commitment

**LibrePT** is a free, open-source, local-first personal training dashboard designed to help certified trainers schedule sessions, track client progress on the gym floor, and log workout performance without friction.

We believe that data privacy and data ownership are fundamental rights:
- **Zero Central Backend:** LibrePT by default does not operate a central database, API server, or analytics pipeline. Optional cloud integrations connect directly to your personal cloud storage.
- **Zero Telemetry & Cookies:** We collect no usage statistics, tracking cookies, IP addresses, or personal information when you use the app.
- **Local-First Architecture:** By default, all client profiles, training routines, exercise histories, and session logs reside strictly on your local device (in your web browser's `localStorage` or `IndexedDB`), with support for optional personal cloud storage and database synchronization integrations.

---

## 2. Cloud Synchronization & Data Security (Optional Cloud Storage & Backups)

LibrePT's optional Google integration is split by what the data actually is, not bundled into one generic "cloud sync":
- **Scheduling data (session times, room, client RSVP)** is planned to live in **your own Google Calendar**, read and written directly via your own OAuth-authorized account, as the authoritative record for that data. **Not built yet** (TODO §1.5) — LibrePT currently has no Calendar integration.
- **App data** (clients, routines, session notes, logged sets/reps) can optionally sync across your own devices via **Google Drive's `appDataFolder`** — a storage area private to the LibrePT app inside your own Drive, invisible in your normal Drive file browser and inaccessible to other apps. **Built** (TODO §3.3): this covers every collection today, not only "no Calendar equivalent" data, since there is no Calendar-sourced overlap to exclude yet — that will narrow once Calendar integration exists. Requires the deployment you're using to have its own Google OAuth client id configured; a deployment without one shows "not configured" rather than a broken connect button.
- **Other trainers sharing a gym/room** seeing only busy/free time blocks (via Calendar free/busy), never client names, notes, or session detail, is likewise part of the not-yet-built Calendar integration.

Regarding the Drive sync that IS live:
- Data is transmitted directly from your local device to your own Google account using standard OAuth authentication — LibrePT never proxies it through a server we operate.
- **HTTPS Only Protocol Enforcement:** All remote network communications and Web PWA assets are strictly restricted to TLS-encrypted HTTPS endpoints. Non-localhost HTTP connections are automatically redirected to `https://` before application initialization, guaranteeing that client records, authentication tokens, and backup payloads are never exposed over unencrypted HTTP channels.
- **No Third-Party Interception:** The LibrePT maintainers and developers do not host, access, process, or view any data you sync to your personal cloud storage or remote databases. Because no server we operate ever touches your client data, we are not a data processor for it — your relationship with Google (as your own chosen storage provider) is yours alone.
- **What Google's platform encryption does and doesn't cover:** Google encrypts Drive data in transit (TLS) and at rest (server-side AES-256) as standard platform behavior. This is *not* zero-knowledge encryption — Google's own infrastructure can technically access the underlying content (e.g., automated abuse scanning, legal process), same as any file stored in your Drive. For most coaching data this is a reasonable baseline. **Not built yet**: client-side encryption (`Web Crypto API`) before upload, so synced snapshots would be opaque even to Google — a real hardening option (TODO §3.3), not implemented in the current sync. Its trade-off, worth knowing before it ships: the encryption key would not be recoverable by LibrePT or Google — losing the key or the device that holds it would make that cloud copy permanently unreadable, so it would need to be an additional safeguard alongside local backups, not a replacement for them.

---

## 3. Personal Trainer Guidelines: Your Role as Data Controller under GDPR

If you are a Personal Trainer (`PT`) using LibrePT to coach clients within the European Union, UK, or other GDPR-compliant jurisdictions, **you are the legally designated Data Controller** under GDPR Article 4(7).

Because LibrePT records client names, physical goals, exercise history, and pre-existing injury notes, this information qualifies as **Special Category Data (Health Data)** under GDPR Article 9.

As the Data Controller, you must adhere to the following best practices:

### 3.1 Obtain Explicit Client Consent
Before storing client health and performance records—and specifically before backing up or syncing those records to cloud storage—you must obtain verifiable, explicit consent from each client.
- **What to tell your clients:** Inform them what data you record, that you store it securely on your device and personal cloud storage solely for coaching preparation, and that they have the right to inspect, export, or request the deletion of their records at any time.
- **Consent Audit Trail:** Use the **Data Protection (GDPR)** block on the client profile — the signed checkbox, the date on the signed paper, and the version of the consent letter that was signed. The step-by-step workflow is in the [Trainer Privacy Guide](docs/PRIVACY_FOR_TRAINERS.md).

### 3.2 Safe AI & Large Language Model (LLM) Usage
Many trainers utilize AI assistants (such as ChatGPT, Claude, or DeepSeek) to analyze workout volume, draft periodized cycles, or review rehabilitation notes.
- **The Legal Risk:** Pasting unencrypted, identifiable client health records (`"Jane Doe, 34yo, chronic L4 disc herniation, struggles with overhead squats..."`) into third-party AI prompts transfers Special Category Data to external data processors without a Data Processing Agreement (DPA), which constitutes a GDPR violation.
- **How to stay compliant:**
  1. **Use Anonymization:** Never include client names, email addresses, phone numbers, exact birthdates, or uniquely identifying medical histories in AI prompts.
  2. **Use LibrePT's AI Safe Copy Tool:** Use LibrePT's built-in `AI Safe Copy (Anonymized)` action on client history profiles. This tool automatically strips Personally Identifiable Information (PII) and replaces names with generic identifiers (`Client #UUID`) before copying the workout summary to your clipboard.

### 3.3 Supporting Client Data Rights
Under GDPR, your clients have the right to:
- **Right of Access & Portability (Art. 15 / Art. 20):** You can export any client's complete training history to JSON or clean Markdown directly from LibrePT and provide it to them upon request.
- **Right to Erasure / "Right to be Forgotten" (Art. 17):** If a client terminates their coaching contract and requests data deletion, deleting their client profile within LibrePT instantly purges their records from your local storage and subsequent cloud snapshots.

---

## 4. Client-Facing Documents

Three documents cover onboarding a client, and they are maintained in `docs/` rather than reproduced
here — a policy that carries its own copy of a consent letter is a policy that drifts from the one
the app actually sends:

| Document | Audience | Purpose |
| :--- | :--- | :--- |
| [Client Privacy Notice](docs/templates/Client_Privacy_Notice.md) | The client | The Art. 13 information they must have **before** consenting |
| [Client Consent Form](docs/templates/Client_Consent_Form.md) | The client | The letter and signature block; also the exact text the app's **Email form** button sends |
| [Trainer Privacy Guide](docs/PRIVACY_FOR_TRAINERS.md) | The trainer | The operational workflow — obtain, record, archive, withdraw, answer requests |

**LibrePT records that consent exists; the trainer holds the evidence that it does.** The app stores
a consent flag, the date on the signed paper, and the version of the letter that was signed — never
a photo, scan, or signature image. The signed sheet stays in the trainer's own files.

---

## 5. Official EU Data Protection & GDPR Resources

For personal trainers and data controllers seeking further official legal guidance on European Union data protection laws and processing special category health data, refer to the official regulatory authorities below:

- **Official GDPR Regulation Text (Regulation (EU) 2016/679):**
  [EUR-Lex Official Portal](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- **European Commission — Data Protection Guidelines:**
  [European Commission Data Protection Portal](https://commission.europa.eu/law/law-topic/data-protection_en)
- **European Data Protection Board (EDPB):**
  [EDPB Guidelines on Consent & Data Processing](https://edpb.europa.eu/edpb_en)
- **Slovenian Information Commissioner (Informacijski pooblaščenec RS):**
  [IP RS — Varstvo osebnih podatkov in smernice za upravljavce](https://www.ip-rs.si/)

---

## 6. Contact & Repository Information

LibrePT is an open-source community project developed under the MIT License.
- **Source Code & Contributions:** <https://github.com/stutek/LibrePT>
- **Issue Tracker & Questions:** <https://github.com/stutek/LibrePT/issues>
