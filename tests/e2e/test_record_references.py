# tests/e2e/test_record_references.py
# The cross-collection reference graph (TODO §18.5) must be acyclic: migration replay order means
# correct order of foreign-key availability, so a convenience back-reference added later could
# otherwise deadlock migration or silently pick an arbitrary order — caught here instead of by a
# trainer. §17.4 (saving a past session as a routine template) is flagged as the first realistic
# cycle risk.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_the_declared_reference_graph_has_no_cycles(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    cycle = page.evaluate(
        """async () => {
            const m = await import(new URL('data/recordReferences.js', document.baseURI).href);
            return m.findCycle();
        }"""
    )
    assert cycle is None, f"cyclic reference graph: {cycle}"


def test_a_cycle_is_actually_detected_not_just_never_triggered(page, local_server):
    """A graph that always returns "acyclic" because it never runs the walk correctly would pass
    the test above for the wrong reason. Prove the detector actually catches a real cycle."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const m = await import(new URL('data/recordReferences.js', document.baseURI).href);
            const selfLoop = { a: { ownerId: 'a' } };
            const twoCycle = { a: { bId: 'b' }, b: { aId: 'a' } };
            const indirect = { a: { bId: 'b' }, b: { cId: 'c' }, c: { aId: 'a' } };
            const clean = { history: { clientId: 'clients' }, planUpdates: { clientId: 'clients' } };
            return {
                selfLoop: m.findCycle(selfLoop),
                twoCycle: m.findCycle(twoCycle),
                indirect: m.findCycle(indirect),
                cleanIsAcyclic: m.isAcyclic(clean),
            };
        }"""
    )
    assert r["selfLoop"] is not None
    assert r["twoCycle"] is not None
    assert r["indirect"] is not None
    assert r["cleanIsAcyclic"] is True
