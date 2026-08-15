"""`python -m agent_tools.demo_recording` — record the scripted demo tour as a video file.

Why this exists: TODO §23.5 needs a video for channels that cannot embed a live app — Instagram and
short-form especially (§23.3 item 5). What it must NOT become is the stale recording that section
rejected: an asset that keeps playing after the app has moved, showing something that no longer
exists to the people being asked to trust it.

So nothing here is authored. The tour is `src/modules/demo/gymFloorTour.js`, the same script
`tests/e2e/test_demo_tour.py` replays on every run, and this tool only points a camera at it.
Re-shooting after a UI change is running this command again; if the tour has genuinely broken, the
e2e suite has already gone red and told you which step, rather than this quietly filming the wreck.

**It fails when the tour fails**, and that is the point. A recorder that saved a video regardless
would reintroduce exactly the problem — an asset that looks fine and shows a broken app.

Not a gate (see agent_tools/INDEX.md): it needs a browser, a running dev server, and produces a
binary artifact. AGENT_RULES §2.A.3 also forbids blanket video capture in the gated run — it once
turned a ~4-minute e2e stage into 12+ — so recording is on demand, here, and never a suite flag.

Usage:
  # with the dev server already up on :8081 (AGENT_RULES §2.C: leave it running)
  .venv/bin/python -m agent_tools.demo_recording
  .venv/bin/python -m agent_tools.demo_recording --viewport 390x844 --out .build-reports/demo.webm
"""

import argparse
import pathlib
import shutil
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_URL = "http://localhost:8081/LibrePT/?init=demo_data_load&demo=gym_floor"
DEFAULT_OUT = REPO_ROOT / ".build-reports" / "demo-tour.webm"

# A phone, because that is where the app is used and what the footage has to look like. iPhone 14 —
# the same preset agent_tools/overflow_scan.py sweeps, so the framing matches what is checked.
DEFAULT_VIEWPORT = "390x844"


def parse_viewport(spec):
    """ "WxH" -> {"width": W, "height": H}. Raises ValueError on a malformed spec."""
    try:
        width, height = spec.lower().split("x")
        return {"width": int(width), "height": int(height)}
    except (ValueError, AttributeError) as err:
        raise ValueError(f"--viewport must look like '390x844', got {spec!r}") from err


def failed_steps(results):
    """The steps the tour reported as failing. Separated from the I/O so the decision this tool
    hinges on — save the file, or refuse — is testable without a browser."""
    if not isinstance(results, list) or not results:
        return [{"id": "tour", "reason": "the tour reported no results at all"}]
    return [step for step in results if not step.get("ok")]


def record(url, out_path, viewport, timeout_ms=60_000):
    from playwright.sync_api import sync_playwright

    out_path.parent.mkdir(parents=True, exist_ok=True)
    scratch = out_path.parent / "_demo_recording_raw"
    if scratch.exists():
        shutil.rmtree(scratch)

    with sync_playwright() as playwright:
        # The window must match the viewport, or the screencast letterboxes: Playwright films the
        # BROWSER WINDOW, so a default 1280x720 window showing a 390x844 page records the page in a
        # corner and pads the rest grey. The first take did exactly that — a third of the frame was
        # dead space, with a clean exit code and a clean screenshot at the same size, which is why
        # this is checked by eye.
        browser = playwright.chromium.launch(
            args=[
                f"--window-size={viewport['width']},{viewport['height']}",
                "--hide-scrollbars",
            ]
        )
        context = browser.new_context(
            viewport=viewport,
            record_video_dir=str(scratch),
            # Matched to the viewport deliberately. A record size that differs letterboxes the
            # footage in grey, which the first take did — the exit code was 0 and the video was
            # two-thirds app and one-third nothing, which is why this tool is checked by eye and
            # not only by its return value.
            record_video_size=viewport,
            has_touch=True,
        )
        # Both of these are what tests/conftest.py does for every browser test, and for the same
        # reason: the first-run Terms modal and the cold-start splash are onboarding, not the
        # product. A demo of the clipboard that opens on a legal disclaimer is showing the wrong
        # thing — and the first take did exactly that, because the recorder skipped the fixtures.
        context.add_init_script(
            "window.localStorage.setItem('librept_terms_accepted', '1');"
        )

        page = context.new_page()
        page.goto(url)
        # The splash holds for ~5s on a cold start; dismissing it is an opportunity, not a wait, so
        # a short budget (see conftest's note on the same tap borrowing the full one).
        try:
            page.click("#splash-dismiss", timeout=2_500)
        except Exception:
            pass
        page.wait_for_function(
            "() => Array.isArray(window.__demoTourResults)", timeout=timeout_ms
        )
        results = page.evaluate("() => window.__demoTourResults")
        # A beat on the finished state, so the last frame is not the instant of the final tap.
        page.wait_for_timeout(1_200)
        video = page.video
        # The file is only flushed when the context closes, and its path can only be read while
        # Playwright is still running — so both happen here, inside the manager, in that order.
        context.close()
        raw = pathlib.Path(video.path()) if video else None
        browser.close()

    problems = failed_steps(results)
    if problems:
        if scratch.exists():
            shutil.rmtree(scratch)
        return None, problems

    out_path.unlink(missing_ok=True)
    shutil.move(str(raw), str(out_path))
    shutil.rmtree(scratch, ignore_errors=True)
    return out_path, []


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--viewport", default=DEFAULT_VIEWPORT)
    args = parser.parse_args(argv)

    try:
        viewport = parse_viewport(args.viewport)
    except ValueError as err:
        print(err, file=sys.stderr)
        return 2

    saved, problems = record(args.url, pathlib.Path(args.out), viewport)
    if problems:
        print(
            "The demo tour did not complete, so no video was written:", file=sys.stderr
        )
        for step in problems:
            print(f"  · {step.get('id')}: {step.get('reason')}", file=sys.stderr)
        print(
            "\nRun tests/e2e/test_demo_tour.py — it asserts the same script and will say the same "
            "thing with a stack trace.",
            file=sys.stderr,
        )
        return 1

    print(f"Wrote {saved} ({viewport['width']}x{viewport['height']}).")
    print(
        "It records the live app, so re-shoot by running this again after a UI change."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
