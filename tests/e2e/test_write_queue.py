# tests/e2e/test_write_queue.py
# The persistence write queue (TODO §18.6). Moving the store to IndexedDB makes persistence async,
# but the app has ~52 synchronous save call sites against ~47 synchronous state reads — so the read
# model stays synchronous and writes become write-behind. These tests pin the two properties that
# makes safe: writes land in the order they were issued even when they resolve out of order, and a
# failed write is reported rather than vanishing into an unobserved rejection.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_writes_run_in_order_even_when_they_resolve_out_of_order(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/writeQueue.js', document.baseURI).href;
            const m = await import(url);
            m.resetWriteQueue();

            const order = [];
            const delayed = (name, ms) => () => new Promise((resolve) => {
                setTimeout(() => { order.push(name); resolve(); }, ms);
            });

            // Issued slowest-first: unserialised fire-and-forget would finish c, b, a — landing a
            // stale snapshot after a fresh one and silently undoing the trainer's last taps.
            m.enqueueWrite(delayed('a', 40), 'a');
            m.enqueueWrite(delayed('b', 20), 'b');
            m.enqueueWrite(delayed('c', 1), 'c');
            await m.flushWrites();
            return { order, status: m.writeQueueStatus() };
        }"""
    )
    assert r["order"] == ["a", "b", "c"]
    assert r["status"]["pending"] == 0
    assert r["status"]["draining"] is False
    assert r["status"]["failureCount"] == 0


def test_a_failed_write_is_reported_and_does_not_stall_the_queue(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/writeQueue.js', document.baseURI).href;
            const m = await import(url);
            m.resetWriteQueue();

            const seen = [];
            m.onWriteError((failure) => seen.push(failure.label));

            const done = [];
            m.enqueueWrite(async () => { done.push('first'); }, 'first');
            m.enqueueWrite(async () => { throw new Error('quota exceeded'); }, 'state');
            m.enqueueWrite(async () => { done.push('third'); }, 'third');
            await m.flushWrites();

            const status = m.writeQueueStatus();
            return {
                done,
                seen,
                failureCount: status.failureCount,
                lastLabel: status.lastError.label,
                lastMessage: status.lastError.error.message,
            };
        }"""
    )
    # A transient error (quota blip, locked store) must not become a permanent outage — the next
    # write is a fresh snapshot of the same state, so the queue keeps going.
    assert r["done"] == ["first", "third"]
    # For an app holding the only copy of a business's records, a silent failed save is the worst
    # available outcome, so the failure reaches a listener with the label that names which write.
    assert r["seen"] == ["state"]
    assert r["failureCount"] == 1
    assert r["lastLabel"] == "state"
    assert r["lastMessage"] == "quota exceeded"


def test_a_throwing_error_listener_cannot_take_the_queue_down(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/writeQueue.js', document.baseURI).href;
            const m = await import(url);
            m.resetWriteQueue();

            m.onWriteError(() => { throw new Error('the reporting UI is broken'); });
            const done = [];
            m.enqueueWrite(async () => { throw new Error('write failed'); }, 'state');
            m.enqueueWrite(async () => { done.push('after'); }, 'after');
            await m.flushWrites();
            return { done, failureCount: m.writeQueueStatus().failureCount };
        }"""
    )
    # The listener is a reporting surface, not part of the write path.
    assert r["done"] == ["after"]
    assert r["failureCount"] == 1


def test_writes_enqueued_while_draining_are_picked_up(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/writeQueue.js', document.baseURI).href;
            const m = await import(url);
            m.resetWriteQueue();

            const order = [];
            m.enqueueWrite(async () => {
                order.push('first');
                // A tap landing mid-flush is the ordinary gym-floor case, not an edge case.
                m.enqueueWrite(async () => { order.push('nested'); }, 'nested');
            }, 'first');
            await m.flushWrites();
            return { order, pending: m.writeQueueStatus().pending };
        }"""
    )
    assert r["order"] == ["first", "nested"]
    # flushWrites must not resolve while work enqueued during the drain is still outstanding.
    assert r["pending"] == 0


def test_flush_on_an_idle_queue_resolves_immediately(page, local_server):
    # Backup export awaits a flush before reading; an idle queue must not add latency to it.
    # Pinned via microtask ordering, not a wall-clock budget: flushWrites() returns
    # Promise.resolve() when idle, so its .then() callback must already have run by the time a
    # single extra `await Promise.resolve()` in this same async function resumes (that await's own
    # continuation is queued behind the .then() one). A wall-clock threshold here previously flaked
    # on shared CI runners — it was timing a Playwright IPC round-trip for a synchronous return, not
    # anything the app actually does slowly.
    page.goto(local_server)

    # Deterministic, not a wall-clock guess: `resetWriteQueue()` clears the queued task list but
    # deliberately does NOT force `draining` false — a real in-flight `await task()` from the app's
    # own boot-time write (seedMockData's one `saveToLocalStorage()` call, stateStore.js) must be
    # allowed to finish naturally, because forcing it off here would let a second, concurrently-
    # triggered `drain()` start pulling from the same queue array before the first one's current
    # task settles — exactly the out-of-order, concurrent-write bug this module exists to prevent
    # (see writeQueue.js's own module comment). So the test cannot fix the race by hacking the app;
    # it has to actually wait for that write to genuinely finish before asserting anything about
    # "idle" — a fixed `wait_for_timeout` here was itself a hidden wall-clock guess (this is the
    # exact flake class the microtask-ordering pin below already eliminated once, reintroduced one
    # step earlier). `await m.flushWrites()` below waits on the REAL in-flight promise rather than
    # polling a snapshot of `.draining` — a poll-then-act check has its own gap between "observed
    # idle" and "acted on it" that a real await does not, and boot enqueues its one write exactly
    # once (nothing here is periodic), so once this resolves the queue stays idle for the rest of
    # this same synchronous continuation.
    r = page.evaluate(
        """async () => {
            const url = new URL('data/writeQueue.js', document.baseURI).href;
            const m = await import(url);
            await m.flushWrites();

            m.resetWriteQueue();
            let resolved = false;
            m.flushWrites().then(() => { resolved = true; });
            await Promise.resolve();
            return { resolved };
        }"""
    )
    assert r["resolved"] is True
