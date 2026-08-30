# tests/unit/test_share_target.py
# The app offers itself to the phone as somewhere a file can be sent (TODO §38.22).
#
# Asked 2026-08-30: "a PWA import rabi shranjevanje datoteke iz message-a in nato odpiranje?" It did.
# Three files have to agree for it to stop: the manifest declares the URL and the field name, the
# service worker answers that URL and reads that field, and the app looks for the marker the worker
# redirects with. None of the three can be checked by running the app in a test — the operating
# system is the caller — so what is checked is that they say the same thing.

import json
import re


def _manifest(src_dir):
    return json.loads((src_dir / "manifest.json").read_text(encoding="utf-8"))


def test_the_app_offers_itself_as_a_place_to_share_a_file_to(src_dir):
    share = _manifest(src_dir).get("share_target")
    assert share, (
        "no share_target in the manifest: the trainer has to save the attachment out of their "
        "messaging app and then find it in a file picker"
    )
    # A file cannot travel in a GET, and the browser will not offer the app for one.
    assert share["method"].upper() == "POST"
    assert share["enctype"] == "multipart/form-data"
    assert share["params"]["files"], (
        "a share target that accepts no files accepts only text"
    )


def test_a_tapped_file_opens_the_app(src_dir):
    handlers = _manifest(src_dir).get("file_handlers")
    assert handlers, (
        "no file_handlers: tapping the file the client sent opens something else"
    )


def _declared_pair(src_dir):
    """The media type and the extension as data/signupFile.js declares them — the one home."""
    source = (src_dir / "data" / "signupFile.js").read_text(encoding="utf-8")
    media = re.search(r'SIGNUP_MEDIA_TYPE = "([^"]+)"', source)
    extension = re.search(r'SIGNUP_FILE_EXTENSION = "([^"]+)"', source)
    assert media and extension, (
        "signupFile.js no longer declares the type and the extension"
    )
    return media.group(1), extension.group(1)


def test_the_app_claims_its_own_files_and_no_others(src_dir):
    """LibrePT declares BOTH a media type and a distinctive extension (TODO §1.7): an Android intent
    routes on the type, an OS association on the extension, and an email gateway frequently relabels
    the type on the way. The manifest has to name that pair and nothing wider.

    The first version of §38.22 named `application/json` and `.json`, which would have offered
    LibrePT in the share sheet for every JSON file on the phone and claimed the extension
    system-wide. Asked about directly: "a nisva rekla, da bova imela custom mime in custom končnico
    za uvoz v LibrePT?"
    """
    media, extension = _declared_pair(src_dir)
    manifest = _manifest(src_dir)

    accepted = manifest["share_target"]["params"]["files"][0]["accept"]
    assert media in accepted, f"the share target does not accept {media}"
    assert extension in accepted, f"the share target does not accept {extension}"
    assert "application/json" not in accepted and ".json" not in accepted, (
        "the share target claims every JSON file on the phone, not this app's own"
    )

    handled = manifest["file_handlers"][0]["accept"]
    assert list(handled) == [media], f"file_handlers claims {list(handled)}"
    assert handled[media] == [extension], handled[media]


def test_the_manifest_the_worker_and_the_app_agree_on_the_names(src_dir):
    """Three files, one conversation. The manifest names the URL the OS posts to and the field the
    file arrives in; the worker answers that URL and reads that field; the app looks for the marker
    the worker redirects with. A typo in any of them is a share that lands nowhere — and nothing
    fails until somebody shares a file on a real phone."""
    manifest = _manifest(src_dir)
    worker = (src_dir / "sw" / "sharedInbox.js").read_text(encoding="utf-8")
    app = (src_dir / "modules" / "clients" / "signupInbox.js").read_text(
        encoding="utf-8"
    )

    action = manifest["share_target"]["action"]
    assert action.endswith("share-target"), action
    assert '"/share-target"' in worker or "/share-target" in worker, (
        "the worker does not answer the URL the manifest points the operating system at"
    )

    field = manifest["share_target"]["params"]["files"][0]["name"]
    assert f'FILE_FIELD = "{field}"' in worker, (
        f"the manifest sends the file as {field!r} and the worker reads something else"
    )

    marker = re.search(r'ARRIVED_MARK = "([^"]+)"', worker)
    assert marker, "the worker does not say which marker it redirects with"
    param, value = marker.group(1).split("=")
    assert (
        f'ARRIVED_PARAM = "{param}"' in app and f'ARRIVED_VALUE = "{value}"' in app
    ), (
        f"the worker redirects with {marker.group(1)!r} and the app looks for something else"
    )
    # …and the file handler lands on the same marker, so both arrivals are one code path.
    assert marker.group(1) in manifest["file_handlers"][0]["action"]


def test_the_inbox_survives_a_deploy(src_dir):
    """The shared inbox is not a version of the app shell, so the purge that runs on every activate
    must not treat it as an obsolete one — a deploy while an unread submission sat there would throw
    away a file a client sent."""
    manifest = (src_dir / "sw" / "cacheManifest.js").read_text(encoding="utf-8")
    worker = (src_dir / "sw" / "sharedInbox.js").read_text(encoding="utf-8")

    cache_name = re.search(r'INBOX_CACHE = "([^"]+)"', worker)
    assert cache_name, "the worker does not name its inbox cache"
    assert f'"{cache_name.group(1)}"' in manifest, (
        f"{cache_name.group(1)} is not spared in deleteObsoleteCaches, so every deploy empties the "
        "inbox"
    )
