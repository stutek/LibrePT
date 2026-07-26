// src/modules/common/recordId.js — the identity primitive every stored record is keyed on (TODO §18.2).
// Single responsibility: mint a new record id, and read back the creation time encoded inside one.
//
// Why this exists as its own module rather than another helper in utils.js: record identity is the
// one value the whole persistence design rests on (§18) — the migration mapping, the suppression list
// that makes anonymization irreversible (§18.11), and deep links (§18.10) are all keyed on it. It
// deserves a file whose only job is to be correct about it.
//
// **UUIDv7 (RFC 9562)**, rendered as fixed-width base62. Two properties are load-bearing:
//
//   1. **Collision resistance.** The generator this replaces was `Math.random().toString(36)` sliced
//      to 8 characters — 41.4 bits, from a non-cryptographic source. At the ~280k ids a very busy PT
//      accumulates over five years (§18.6's sizing) that is a **1.4% chance of at least one
//      collision**, i.e. a coin-flip-scale defect over the life of a business's records rather than a
//      theoretical one. UUIDv7 carries 122 random bits from `crypto.getRandomValues`, which puts the
//      same figure at 1e-26.
//   2. **Time ordering.** v7 puts a millisecond timestamp in the high 48 bits, so ids sort
//      chronologically. Migration order is topological, not chronological (§18.5) — this is not a
//      substitute for that — but it gives a stable, clock-free-to-compare tiebreak *within* a
//      topological layer, and it makes stored data legible when debugging without a separate field.
//
// Base62 with an ASCII-ascending alphabet, zero-padded to a fixed 22 characters, so **lexicographic
// order equals numeric order**. Sortability is the whole point of choosing v7; an encoding that
// scrambled it (base64's `+/`, or variable-width output) would throw the property away. 22 chars is
// the exact width of 128 bits in base62, and shortening further would mean discarding entropy —
// which is the one thing that must not be traded for brevity.
//
// Injected dependencies: none — reads `crypto` and `Date.now()` from the platform.

// ASCII-ascending on purpose: '0'-'9' < 'A'-'Z' < 'a'-'z' in code-point order, so a fixed-width
// string in this alphabet compares identically to the integer it encodes.
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = 62n;

// 128 bits needs ceil(128 / log2(62)) = 22 characters. Fixed width is what makes the comparison work.
export const RECORD_ID_LENGTH = 22;

const TIMESTAMP_BITS = 48n;
const COUNTER_MAX = 0xfff; // rand_a is 12 bits (RFC 9562 §6.2, "fixed bit-length dedicated counter")

// The last millisecond an id was issued for, and the counter within it. Module-level because
// monotonicity is a property of the generator, not of any one call.
let lastTimestamp = -1;
let counter = 0;

function randomBigInt(bits) {
  const bytes = new Uint8Array(Math.ceil(Number(bits) / 8));
  // Deliberately no Math.random() fallback. An id that is silently weaker than it claims is worse
  // than a loud failure, and every context this app runs in has WebCrypto: it needs a secure origin
  // for the Service Worker regardless, and localhost counts as one.
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("recordId requires WebCrypto (crypto.getRandomValues)");
  }
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  // Trim to exactly `bits` — the byte count rounds up, so the top bits would otherwise be surplus.
  return value & ((1n << BigInt(bits)) - 1n);
}

/**
 * Advance the (timestamp, counter) pair for one new id, keeping the pair strictly increasing.
 *
 * Within a single millisecond the 12-bit counter supplies the ordering; the seed is random rather
 * than zero so that ids minted in different sessions in the same millisecond do not start from a
 * predictable value. On counter overflow the timestamp borrows a millisecond from the future, which
 * RFC 9562 allows — and `lastTimestamp` is what the next call compares against, never the raw clock,
 * so a borrowed millisecond can never be handed out twice.
 */
function nextSequence(now) {
  // max(): a clock that jumps backwards (NTP correction, hand-set, DST on a device storing local
  // time) must not be able to reissue an id range that was already handed out.
  const timestamp = Math.max(now, lastTimestamp);

  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp;
    // Seeded in the low quarter of the range so a busy millisecond has ~3000 counts of headroom.
    counter = Number(randomBigInt(10));
    return { timestamp, counter };
  }

  counter += 1;
  if (counter > COUNTER_MAX) {
    lastTimestamp = timestamp + 1;
    counter = Number(randomBigInt(10));
  }
  return { timestamp: lastTimestamp, counter };
}

function toBase62(value) {
  let remaining = value;
  let out = "";
  while (remaining > 0n) {
    out = ALPHABET[Number(remaining % BASE)] + out;
    remaining /= BASE;
  }
  return out.padStart(RECORD_ID_LENGTH, ALPHABET[0]);
}

function fromBase62(text) {
  let value = 0n;
  for (const char of text) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    value = value * BASE + BigInt(digit);
  }
  return value;
}

/**
 * Mint a new record id: a UUIDv7 as 22 base62 characters.
 *
 * Successive calls always return strictly increasing strings, so array order, string sort order and
 * creation order agree.
 */
export function newRecordId() {
  const { timestamp, counter: count } = nextSequence(Date.now());

  // RFC 9562 §5.7 layout: 48-bit unix_ts_ms | 4-bit version (7) | 12-bit rand_a
  //                       | 2-bit variant (0b10) | 62-bit rand_b
  let value = BigInt(timestamp) & ((1n << TIMESTAMP_BITS) - 1n);
  value = (value << 4n) | 7n;
  value = (value << 12n) | BigInt(count);
  value = (value << 2n) | 0b10n;
  value = (value << 62n) | randomBigInt(62);

  return toBase62(value);
}

export function isRecordId(id) {
  return (
    typeof id === "string" &&
    id.length === RECORD_ID_LENGTH &&
    [...id].every((char) => ALPHABET.includes(char))
  );
}

/**
 * The creation time encoded in a record id, or null if it is not one of ours.
 *
 * Returns null rather than throwing for ids minted by older builds (8-char base36, no timestamp) —
 * those stay perfectly valid keys, they simply carry no time. Callers must treat the time as a
 * debugging affordance, never as the authoritative record date: that is a stored field, because the
 * device clock at write time is not trustworthy (§18.5).
 */
export function recordIdTime(id) {
  if (!isRecordId(id)) return null;
  const value = fromBase62(id);
  if (value === null) return null;
  // Version sits directly below the 48-bit timestamp: it was shifted left by 12 + 2 + 62 = 76.
  const version = (value >> 76n) & 0xfn;
  if (version !== 7n) return null;
  return new Date(Number(value >> 80n));
}
