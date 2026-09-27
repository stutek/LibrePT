// src/data/connectedAccounts.js — every outside service this app can hold a credential for, and how
// to clear or revoke each one.
//
// Single responsibility: the list. Each entry says what the service is called, whether this device is
// connected to it, how to forget it here (`clear` — nothing is asked of the service, other devices
// keep their access), how to end the app's access at the service (`revoke` — every device), and the
// service's own page where a trainer can remove the access by hand when the app cannot reach it.
//
// The rule it serves: whatever credential the app holds for a service can be cleared or revoked. One
// list, so a service added later — iCloud is the one named, not built — is one entry, and the
// Settings dialog that shows these needs no change.
//
// Only services this deployment is configured for are listed: a build with no Google client id has
// nothing to connect to and nothing to revoke.

import { isDriveSyncConfigured } from "./driveSyncConfig.js";
import { disconnectDriveSync, forgetDriveSyncOnThisDevice } from "./driveSyncService.js";
import { hasStoredConsent } from "./googleAuth.js";

const SERVICES = [
  {
    id: "google-drive",
    nameKey: "account_google_drive",
    available: isDriveSyncConfigured,
    isConnected: hasStoredConsent,
    clear: forgetDriveSyncOnThisDevice,
    // Resolves to `revoked`, `not_connected` or `unreachable` (data/googleAuth.js).
    revoke: disconnectDriveSync,
    // Google's page for removing a linked app's access, as its help names it.
    manageUrl: "https://myaccount.google.com/linkedapps",
  },
];

/** The services this deployment can connect to, in the order they are shown. */
export function connectedAccounts() {
  return SERVICES.filter((service) => service.available());
}
