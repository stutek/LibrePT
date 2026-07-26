# tests/e2e/test_record_id.py
# The record identity primitive (TODO §18.2): UUIDv7 rendered as fixed-width base62. These tests pin
# the two properties the persistence design in §18 actually depends on — collision resistance from a
# cryptographic source, and lexicographic order matching creation order — plus the back-compatibility
# rule that ids minted by older builds stay valid keys.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_id_is_fixed_width_base62_and_recognised(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/recordId.js', document.baseURI).href;
            const m = await import(url);
            const ids = Array.from({ length: 200 }, () => m.newRecordId());
            const alphabet = /^[0-9A-Za-z]{22}$/;
            return {
                length: m.RECORD_ID_LENGTH,
                allFixedWidth: ids.every((id) => id.length === 22),
                allBase62: ids.every((id) => alphabet.test(id)),
                allRecognised: ids.every((id) => m.isRecordId(id)),
            };
        }"""
    )
    # 22 characters is exactly 128 bits in base62 — a shorter id would mean discarding entropy.
    assert r["length"] == 22
    assert r["allFixedWidth"] is True
    assert r["allBase62"] is True
    assert r["allRecognised"] is True


def test_ids_are_unique_across_a_large_burst(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/recordId.js', document.baseURI).href;
            const m = await import(url);
            const ids = Array.from({ length: 20000 }, () => m.newRecordId());
            return { total: ids.length, distinct: new Set(ids).size };
        }"""
    )
    # The generator this replaced had 41.4 bits from Math.random(); a 20k burst inside one
    # millisecond is exactly where a 12-bit counter would wrap if the overflow were not handled.
    assert r["distinct"] == r["total"] == 20000


def test_lexicographic_order_equals_creation_order(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/recordId.js', document.baseURI).href;
            const m = await import(url);
            const ids = Array.from({ length: 5000 }, () => m.newRecordId());
            const sorted = [...ids].sort();
            return {
                sortStable: sorted.every((id, i) => id === ids[i]),
                strictlyIncreasing: ids.every((id, i) => i === 0 || id > ids[i - 1]),
            };
        }"""
    )
    # Sortability is the reason for choosing v7 over v4: string sort, array order and creation order
    # must agree, so an encoding that scrambled it would throw the property away.
    assert r["sortStable"] is True
    assert r["strictlyIncreasing"] is True


def test_ids_stay_ordered_when_the_clock_jumps_backwards(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/recordId.js', document.baseURI).href;
            const m = await import(url);
            const realNow = Date.now;
            const before = m.newRecordId();
            try {
                // A device clock going backwards is ordinary: NTP correction after an offline
                // stretch, a hand-set clock, DST on a device storing local time (§18.5).
                Date.now = () => realNow() - 60000;
                const after = Array.from({ length: 50 }, () => m.newRecordId());
                return {
                    stillIncreasing: after.every((id, i) => id > (i === 0 ? before : after[i - 1])),
                    distinct: new Set([before, ...after]).size === 51,
                };
            } finally {
                Date.now = realNow;
            }
        }"""
    )
    # A backwards clock must never reissue an id range that was already handed out.
    assert r["stillIncreasing"] is True
    assert r["distinct"] is True


def test_creation_time_round_trips_and_legacy_ids_report_none(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/recordId.js', document.baseURI).href;
            const m = await import(url);
            const before = Date.now();
            const id = m.newRecordId();
            const after = Date.now();
            const decoded = m.recordIdTime(id);
            return {
                withinWindow: decoded.getTime() >= before && decoded.getTime() <= after + 1,
                legacyShortId: m.recordIdTime('c1a9f0e2'),
                legacyIsNotRecordId: m.isRecordId('c1a9f0e2'),
                garbage: m.recordIdTime('!'.repeat(22)),
            };
        }"""
    )
    assert r["withinWindow"] is True
    # Ids minted by older builds stay perfectly valid keys — they simply carry no encoded time, so
    # the decoder reports null rather than guessing or throwing.
    assert r["legacyShortId"] is None
    assert r["legacyIsNotRecordId"] is False
    assert r["garbage"] is None
