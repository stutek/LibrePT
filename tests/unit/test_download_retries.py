# tests/unit/test_download_retries.py
# Every vendored tool the pipeline needs — Biome, Node, the ZAP add-ons — is fetched from a third
# party's CDN, and a CI runner starts cold every time, so it downloads all of them on every run.
# On 2026-08-13 GitHub Releases dropped a connection mid-transfer (`RemoteDisconnected`) and failed
# the deploy on a push that touched none of it: one attempt made the pipeline's reliability a
# function of someone else's worst minute.
#
# What is pinned here is the CONTRACT the retry offers its callers, not the delays it happens to
# use. A transient failure must disappear; a permanent one must still surface, with the real error
# rather than a wrapper, because each caller distinguishes CI (fail loudly) from local (warn and
# degrade) off that exception.

import pytest

from build import _DOWNLOAD_RETRY_DELAYS, _with_download_retries


@pytest.fixture(autouse=True)
def _no_real_sleeping(monkeypatch):
    """The retry sleeps between attempts; a unit test must not. Recorded so the test below can
    assert the backoff actually happened without spending it."""
    slept = []
    monkeypatch.setattr("build.time.sleep", slept.append)
    return slept


def test_a_working_download_is_not_retried_or_delayed(_no_real_sleeping):
    attempts = []

    def attempt():
        attempts.append(1)
        return "/path/to/binary"

    assert _with_download_retries("thing", attempt) == "/path/to/binary"
    assert len(attempts) == 1, "a healthy download must not pay for the retry machinery"
    assert _no_real_sleeping == [], "nothing failed, so nothing should have waited"


def test_a_dropped_connection_disappears(_no_real_sleeping):
    """The whole point: the failure that broke the deploy is one a second attempt fixes."""
    attempts = []

    def attempt():
        attempts.append(1)
        if len(attempts) == 1:
            raise ConnectionError("Remote end closed connection without response")
        return "/path/to/binary"

    assert _with_download_retries("thing", attempt) == "/path/to/binary"
    assert len(attempts) == 2
    assert _no_real_sleeping, "a retry must back off rather than hammer the host"


def test_a_host_that_is_genuinely_down_still_fails_the_build(_no_real_sleeping):
    """Retrying must not turn an outage into a silent pass — and the caller must receive the
    ORIGINAL exception, since ensure_biome_binary and ensure_node_binary decide from it whether to
    raise (CI) or degrade to a warning (local)."""
    attempts = []

    def attempt():
        attempts.append(1)
        raise ConnectionError("Remote end closed connection without response")

    with pytest.raises(ConnectionError, match="Remote end closed"):
        _with_download_retries("thing", attempt)

    assert len(attempts) == len(_DOWNLOAD_RETRY_DELAYS) + 1, (
        "every configured delay should have bought one more attempt, plus the first"
    )


def test_verification_is_retried_with_the_download_not_separately(_no_real_sleeping):
    """A truncated transfer leaves bytes on disk that fail their checksum, so re-verifying the same
    file would fail forever. Each attempt has to re-fetch, which is why the retry unit is the whole
    fetch-and-verify closure rather than the HTTP call alone."""
    attempts = []

    def attempt():
        attempts.append(1)
        if len(attempts) == 1:
            raise ValueError("Integrity check failed after download (SHA256 mismatch).")
        return "/path/to/binary"

    assert _with_download_retries("thing", attempt) == "/path/to/binary"
    assert len(attempts) == 2


def test_the_backoff_is_bounded_enough_to_fail_inside_the_stage_budget():
    """Stage 1 is budgeted at ~60s before it wants investigating. A retry policy
    generous enough to blow that would turn a dead host into a run nobody can read."""
    assert sum(_DOWNLOAD_RETRY_DELAYS) <= 10, (
        f"retry backoff totals {sum(_DOWNLOAD_RETRY_DELAYS)}s, which crowds Stage 1's budget"
    )
