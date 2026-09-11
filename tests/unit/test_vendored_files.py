# tests/unit/test_vendored_files.py
# Third-party code that ships inside src/ (TODO §26.3, THIRD_PARTY_NOTICES.md).
#
# **Why a checksum and not a glance.** A vendored file looks exactly like ours: it sits in src/, it
# is imported like ours, and the day a formatter or a well-meant fix touches it, the next upgrade
# from upstream stops being a copy and becomes a merge — and nothing would have said so. Biome is
# configured to leave `src/vendor/` alone, and this is what notices if that ever stops being true.
#
# The rule: these bytes are upstream's, except for one documented line that makes the file an ES
# module. Anything else is a change to somebody else's code, which is a decision and not an edit.

import hashlib
import pathlib

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

# qrcode-generator 1.5.2, MIT, Kazuhiko Arase — fetched 2026-09-11 from
# https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.5.2/qrcode.js
UPSTREAM_SHA256 = "18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780"
OUR_MARKER = "\n// ── LibrePT's only change to this file"
OUR_ADDITION = "export default qrcode;"


def test_the_vendored_encoder_is_upstreams_bytes_plus_one_export():
    """Everything above the marker is upstream's file, byte for byte. Below it, one export and the
    comment saying why it is there — because an app with no bundler cannot reach a UMD global."""
    vendored = (REPO_ROOT / "src" / "vendor" / "qrcode.js").read_text(encoding="utf-8")

    assert OUR_MARKER in vendored, "the marker naming our one change is gone"
    upstream, ours = vendored.split(OUR_MARKER, 1)

    digest = hashlib.sha256(upstream.encode("utf-8")).hexdigest()
    assert digest == UPSTREAM_SHA256, (
        "src/vendor/qrcode.js no longer matches upstream 1.5.2. If this was a deliberate "
        "upgrade, refresh UPSTREAM_SHA256 and THIRD_PARTY_NOTICES.md together; if it was a "
        "formatter, put the file back."
    )

    # The first line is the remainder of the marker line itself, hence [1:].
    added = [
        line for line in ours.splitlines()[1:] if line and not line.startswith("//")
    ]
    assert added == [OUR_ADDITION], added


def test_the_notices_name_what_is_redistributed():
    """CC BY and MIT both require the notice to travel with the bytes, and a vendored file nobody
    declared is the failure this file exists to make loud."""
    notices = (REPO_ROOT / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")

    for vendored in sorted((REPO_ROOT / "src" / "vendor").glob("*.js")):
        assert vendored.name in notices, (
            f"{vendored.name} is redistributed but not declared"
        )
