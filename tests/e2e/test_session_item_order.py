# tests/e2e/test_session_item_order.py
# Explicit session-item ordering (TODO §17.5): `position` is dense 0..n-1 across one session's item
# list, readers sort by it, and circuit members occupy a contiguous run.
#
# Why this is gated rather than reviewed: the failure it prevents is a program in the wrong order
# with every id present, which passes §18.3's completeness check and every other integrity test we
# have. Positions must be written and authoritative BEFORE the store stops preserving list order
# (§18.6 part 4), because after that there is no array index left to derive them from.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_positions_are_dense_and_unique(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
            m.assignPositions(items);
            return {
                positions: items.map((i) => i.position),
                issues: m.positionIssues(items),
            };
        }"""
    )
    assert r["positions"] == [0, 1, 2, 3]
    assert r["issues"] == []


def test_a_hole_and_a_duplicate_are_both_named(page, local_server):
    """The whole point of density: 'is this list whole?' has an answer, and it names the gap."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const hole = [{ position: 0 }, { position: 1 }, { position: 3 }];
            const dupe = [{ position: 0 }, { position: 1 }, { position: 1 }];
            const absent = [{ position: 0 }, {}];
            return {
                hole: m.positionIssues(hole),
                dupe: m.positionIssues(dupe),
                absent: m.positionIssues(absent),
            };
        }"""
    )
    assert any("missing position 2" in issue for issue in r["hole"])
    assert any("duplicate" in issue and "1" in issue for issue in r["dupe"])
    assert any("no position" in issue for issue in r["absent"])


def test_circuit_members_must_be_contiguous(page, local_server):
    """A circuit renders by folding a RUN of consecutive members, so a split one silently
    becomes two units. Contiguity as a query is what makes that detectable at rest."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const intact = [
                { position: 0, circuitId: 'c1' },
                { position: 1, circuitId: 'c1' },
                { position: 2, circuitId: null },
            ];
            const split = [
                { position: 0, circuitId: 'c1' },
                { position: 1, circuitId: null },
                { position: 2, circuitId: 'c1' },
            ];
            return { intact: m.positionIssues(intact), split: m.positionIssues(split) };
        }"""
    )
    assert r["intact"] == []
    assert any("not contiguous" in issue for issue in r["split"])


def test_readers_sort_by_position_not_by_array_order(page, local_server):
    """The assertion the store swap depends on: a list that arrives keyed rather than sequenced
    still reads back in program order."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const scrambled = [
                { id: 'c', position: 2 },
                { id: 'a', position: 0 },
                { id: 'b', position: 1 },
            ];
            return m.orderedItems(scrambled).map((i) => i.id);
        }"""
    )
    assert r == ["a", "b", "c"]


def test_legacy_items_without_positions_keep_arrival_order(page, local_server):
    """Old history rows, old backups and the seed data predate the field — they must still read
    correctly, which is what makes this change additive rather than a migration."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const legacy = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
            const read = m.orderedItems(legacy).map((i) => i.id);
            m.repairPositions(legacy);
            return { read, repaired: legacy.map((i) => [i.id, i.position]) };
        }"""
    )
    assert r["read"] == ["x", "y", "z"]
    assert r["repaired"] == [["x", 0], ["y", 1], ["z", 2]]


def test_repair_renumbers_from_program_order(page, local_server):
    """A hole or a duplicate repairs mechanically — the property a linked list cannot offer,
    because deciding which branch of a forked chain is real is guesswork."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const broken = [
                { id: 'b', position: 5 },
                { id: 'a', position: 0 },
                { id: 'c', position: 5 },
            ];
            m.repairPositions(broken);
            return { order: broken.map((i) => i.id), issues: m.positionIssues(broken) };
        }"""
    )
    assert r["order"][0] == "a"
    assert r["issues"] == []


def test_a_finished_session_snapshot_carries_positions(page, local_server):
    """buildProgramSnapshot is the one write whose output outlives every array it was held in,
    so the record has to carry its own order."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemRecord.js', document.baseURI).href;
            const orderUrl = new URL('modules/common/sessionItemOrder.js', document.baseURI).href;
            const m = await import(url);
            const order = await import(orderUrl);
            const clientState = {
                exercises: [
                    { id: 'e1', name: 'Squat', setsTargetCount: 2, repsTarget: 5 },
                    { type: 'rest', rest: 60 },
                    { id: 'e2', name: 'Row', setsTargetCount: 2, repsTarget: 8 },
                ],
                logs: {},
            };
            const snapshot = m.buildProgramSnapshot(clientState, { isPlanning: true });
            return {
                positions: snapshot.map((i) => i.position),
                issues: order.positionIssues(snapshot),
                types: snapshot.map((i) => i.type),
            };
        }"""
    )
    assert r["positions"] == [0, 1, 2]
    assert r["issues"] == []
    assert r["types"] == ["exercise", "rest", "exercise"]
