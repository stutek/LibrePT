# LibrePT — Privacy & GDPR Statement

*Last Updated: July 2026*

---

## 1. Introduction & Local-First Commitment

**LibrePT** is a free, open-source, local-first personal training dashboard designed to help certified trainers schedule sessions, track client progress on the gym floor, and log workout performance without friction.

We believe that data privacy and data ownership are fundamental rights:
- **Zero Central Backend:** LibrePT by default does not operate a central database, API server, or analytics pipeline. Optional cloud integrations connect directly to your personal cloud storage.
- **Zero Telemetry & Cookies:** We collect no usage statistics, tracking cookies, IP addresses, or personal information when you use the app.
- **Local-First Architecture:** By default, all client profiles, training routines, exercise histories, and session logs reside strictly on your local device (in your web browser's `localStorage` or `IndexedDB`), with support for optional personal cloud storage and database synchronization integrations.

---

## 2. Cloud Synchronization & Data Security (Optional Cloud Storage & Backups)

When using cloud synchronization, remote database hosting, or backup features (`Sync & Backup Center`):
- Data is transmitted directly from your local device to your personal cloud storage provider (e.g., Google Drive AppData folder, iCloud, or WebDAV) or integrated remote databases using standard client-side authentication.
- **No Third-Party Interception:** The LibrePT maintainers and developers do not host, access, process, or view any data you sync to your personal cloud storage or remote databases.
- **End-to-End Security:** We strongly recommend securing your device with a passcode/biometrics and utilizing client-side encryption (`Web Crypto API`) where applicable so that synced cloud snapshots and backups remain opaque and secure at rest.

---

## 3. Personal Trainer Guidelines: Your Role as Data Controller under GDPR

If you are a Personal Trainer (`PT`) using LibrePT to coach clients within the European Union, UK, or other GDPR-compliant jurisdictions, **you are the legally designated Data Controller** under GDPR Article 4(7).

Because LibrePT records client names, physical goals, exercise history, and pre-existing injury notes, this information qualifies as **Special Category Data (Health Data)** under GDPR Article 9.

As the Data Controller, you must adhere to the following best practices:

### 3.1 Obtain Explicit Client Consent
Before storing client health and performance records—and specifically before backing up or syncing those records to cloud storage—you must obtain verifiable, explicit consent from each client.
- **What to tell your clients:** Inform them what data you record, that you store it securely on your device and personal cloud storage solely for coaching preparation, and that they have the right to inspect, export, or request the deletion of their records at any time.
- **Consent Audit Trail:** Use LibrePT's built-in client profile consent toggles (`[✓] Client consented to cloud storage`) to keep a clear audit trail.

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

## 4. Informative Client Consent Letter Template

To help you maintain GDPR compliance during onboarding, you can copy, adapt, or email the standardized consent template below to your clients before storing their coaching data:

```markdown
Subject: Personal Training — Data Privacy & Cloud Storage Consent

Hi [Client Name],

To prepare our workout schedules, track your strength progression, and ensure safe training, I use LibrePT to log our session results, exercise weights, and any relevant mobility or injury notes.

In accordance with data protection regulations (GDPR), I want to make sure you are fully informed about how your coaching data is managed:

1. Storage & Security: Your workout logs and training notes are stored securely on my device and backed up in encrypted form to my personal cloud storage (Google Drive/iCloud) strictly for coaching continuity and preparation.
2. No Third-Party Tracking or Selling: Your data is never sold, shared with advertisers, or transferred to third parties.
3. Artificial Intelligence Safety: If I utilize AI tools to assist in periodizing or analyzing workout volume, your records are strictly anonymized (all names and identifying personal information are stripped) prior to analysis.
4. Your Rights: You have the right at any time to request a complete export of your workout history, request corrections, or ask for your personal records to be permanently deleted.

Please reply "I CONSENT" to this email (or sign below) to confirm that you understand and agree to these privacy practices for our personal training sessions.

Client Signature: ___________________________   Date: _______________
```

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
