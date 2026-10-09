#!/usr/bin/env python3
"""One long-lived headless Chromium, driven one command per shell call.

Exploratory testing decides the next step from what the previous step showed, so
the browser has to outlive a single command. It is started once with a remote
debugging port; every command reconnects over CDP, acts, prints, and detaches,
leaving the page, its IndexedDB and its service worker exactly as they were.
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

PORT = 9333
STATE = Path(__file__).resolve().parent / ".session"
ENDPOINT = f"http://127.0.0.1:{PORT}"

# A browser nobody drives is closed. Every command touches HEARTBEAT; a watchdog started with the
# browser stops it once no command has come for IDLE_SECONDS. A session that ends without `stop`
# left a headless Chromium using most of a core for hours, and the gate refused to start beside it.
HEARTBEAT = STATE / "last-command"
IDLE_SECONDS = 15 * 60
WATCH_EVERY_SECONDS = 30

# Every console error, warning and uncaught throw the page produced lands here.
# Re-injected on each `goto`, because a reload wipes it.
HOOK = """
(() => {
  if (window.__explore_errs) return 'already';
  window.__explore_errs = [];
  const keep = (kind) => (...a) => {
    window.__explore_errs.push(kind + ': ' + a.map(String).join(' '));
    return native[kind].apply(console, a);
  };
  const native = { error: console.error, warn: console.warn };
  console.error = keep('error');
  console.warn = keep('warn');
  addEventListener('error', (e) => window.__explore_errs.push('uncaught: ' + e.message));
  addEventListener('unhandledrejection', (e) => window.__explore_errs.push('rejected: ' + e.reason));
  return 'installed';
})()
"""


def alive():
    try:
        with urllib.request.urlopen(f"{ENDPOINT}/json/version", timeout=2) as r:
            return json.load(r)
    except Exception:
        return None


# Where a live browser says who holds it. Other agents read `.private/AGENT_SYNC/` to see who holds
# the working tree; a browser is machine-wide state in exactly the same way — it takes a core, and a
# `build check` shares the machine with it — so it is claimed the same way rather than left for
# somebody to work out from `/proc`. On 2026-09-30 an abandoned browser ran for three and a half
# hours because nothing said whose it was, and deciding whether it could be closed took a person.
NOTE = (
    Path(__file__).resolve().parents[3]
    / ".private"
    / "AGENT_SYNC"
    / "exploratory-browser.md"
)


def claim(watchdog_pid=None):
    """Write down what is running, for whoever arrives next.

    Refreshed on every command rather than only at `start`, so a browser already running when this
    ships gets its note on the next command instead of needing a restart — and so the deadline in it
    is the real one rather than the one the session began with.
    """
    version = alive()
    if not version:
        return
    try:
        idle_until = time.strftime(
            "%H:%M", time.localtime(HEARTBEAT.stat().st_mtime + IDLE_SECONDS)
        )
    except FileNotFoundError:
        idle_until = "unknown"
    keeper = watchdog_pid or _watchdog_pid()
    NOTE.parent.mkdir(parents=True, exist_ok=True)
    NOTE.write_text(
        "---\n"
        "type: note\n"
        "title: Exploratory browser running\n"
        "description: A headless Chromium held open by the exploratory-test skill, with the time it "
        "closes itself and the process that will do it.\n"
        "tags: [agent-sync, exploratory]\n"
        "---\n\n"
        f"- Port **{PORT}**, profile `{STATE}`.\n"
        f"- Browser: {version.get('Browser', 'unknown')}\n"
        f"- Watchdog process: {keeper if keeper else 'NONE — nothing will close this browser'}\n"
        f"- Closes itself at **{idle_until}** unless another command arrives "
        f"({IDLE_SECONDS // 60} minutes after the last one).\n\n"
        "Another session may close this browser when the watchdog process above is gone while the\n"
        "browser is still answering, or when the time above has passed: then it has no keeper, and\n"
        "an idle browser costs every `build check` on this machine a core. Stop it with\n"
        f"`.agents/skills/exploratory-test/explore.py stop`, never with a bare `pkill chrome`.\n"
    )


def _watchdog_pid():
    """The detached watchdog for THIS port, if it is still running."""
    found = subprocess.run(
        ["pgrep", "-f", f"{Path(__file__).name} _watchdog"],
        capture_output=True,
        text=True,
    )
    pids = [line for line in found.stdout.split() if line.strip()]
    return pids[0] if pids else None


def release():
    NOTE.unlink(missing_ok=True)


def start(width=390, height=844):
    if alive():
        print("already running on", PORT)
        return
    from playwright.sync_api import sync_playwright

    p = sync_playwright().start()
    exe = p.chromium.executable_path
    p.stop()
    # A THROWAWAY PROFILE, EMPTIED AT EVERY START, AND INCOGNITO ON TOP.
    #
    # This is the Chromium Playwright ships, never the one the maintainer reads mail in: it has its
    # own `--user-data-dir`, so it has never held his Google account. Two things are added for the
    # case where a run signs into something anyway — an OAuth screen answered by mistake, a form
    # remembered: the directory is deleted before each start, so nothing survives a session, and
    # `--incognito` keeps cookies and history in memory, so nothing is written down inside the
    # session either. The app's own data lives in IndexedDB and dies with the window, which is what
    # a first-visit test wants.
    shutil.rmtree(STATE, ignore_errors=True)
    STATE.mkdir(parents=True, exist_ok=True)
    (STATE / "viewport.json").write_text(json.dumps([width, height]))
    # A cloud session (claude.ai/code) runs as root, and Chromium refuses to start as root with its
    # sandbox on; it printed nothing to say so, and `start` reported only a missing debugging port
    # (2026-10-09). Playwright passes --no-sandbox to the browsers it launches itself; this one is
    # launched by hand, so it is passed here, and only as root.
    sandbox = ["--no-sandbox"] if os.geteuid() == 0 else []
    subprocess.Popen(
        [
            exe,
            *sandbox,
            "--headless=new",
            "--incognito",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={STATE}",
            f"--window-size={width},{height}",
            "--no-first-run",
            "--no-default-browser-check",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        time.sleep(0.5)
        if alive():
            HEARTBEAT.touch()
            # One watchdog per browser: a watchdog from an earlier start would otherwise go on
            # watching this new browser too, one more for every restart.
            subprocess.run(["pkill", "-f", "explore.py _watchdog"], check=False)
            # Detached, so it outlives this command and the shell that ran it.
            watchdog = subprocess.Popen(
                [sys.executable, str(Path(__file__).resolve()), "_watchdog"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            claim(watchdog_pid=watchdog.pid)
            print(
                "started on",
                PORT,
                "viewport",
                f"{width}x{height}",
                f"(closes itself after {IDLE_SECONDS // 60} min without a command)",
            )
            return
    sys.exit("browser did not open a debugging port")


def stop():
    subprocess.run(["pkill", "-f", f"remote-debugging-port={PORT}"], check=False)
    release()
    print("stopped")


def watchdog():
    """Stop the browser once no command has touched HEARTBEAT for IDLE_SECONDS; exit when it is gone."""
    while alive():
        try:
            idle = time.time() - HEARTBEAT.stat().st_mtime
        except FileNotFoundError:
            idle = IDLE_SECONDS + 1
        if idle > IDLE_SECONDS:
            stop()
            return
        time.sleep(WATCH_EVERY_SECONDS)


def page(pw):
    if not alive():
        sys.exit("no browser: run `start` first")
    browser = pw.chromium.connect_over_cdp(ENDPOINT)
    # `contexts[0]` is the ordinary profile, which is empty under --incognito: the window lives in a
    # context of its own. Take the context that actually has a page on an http(s) URL.
    contexts = browser.contexts
    ctx = next(
        (c for c in contexts if any(pg.url.startswith("http") for pg in c.pages)),
        contexts[-1] if contexts else browser.new_context(),
    )
    # EXPLORE_TAB picks which open tab to drive (0 is the first). A trainer with the app open
    # twice is a real case — two phones, or a tab left behind — and it needs both sides drivable.
    import os

    idx = os.environ.get("EXPLORE_TAB")
    pages = [p for p in ctx.pages if p.url.startswith("http")] or ctx.pages
    if idx is not None and pages:
        pg = pages[int(idx) % len(pages)]
    else:
        pg = pages[-1] if pages else ctx.new_page()
    pg.set_default_timeout(8000)
    # A native alert/confirm is auto-dismissed when nothing listens, which makes an app that DID
    # answer look like one that did nothing — an hour was lost to that on 2026-09-27. Say so.
    pg.on("dialog", lambda d: (print(f"NATIVE {d.type}: {d.message}"), d.accept()))
    # Attaching over CDP inherits the window's size, NOT the one `start` asked for, so the phone
    # width has to be re-stated on every command or a claim about a phone is a claim about 500px.
    try:
        w, h = json.loads((STATE / "viewport.json").read_text())
        if (pg.viewport_size or {}).get("width") != w:
            pg.set_viewport_size({"width": w, "height": h})
    except Exception:
        pass
    return pg


def main(argv):  # noqa: C901 — see below
    """The command dispatcher: one branch per command the skill offers.

    SUPPRESSED, and here is why it is not a defect being deferred. C901 counts branches, and a flat
    `elif` chain over twenty commands has twenty of them however simple each one is; the bodies here
    are one or two calls each, with no nesting and no shared state between them. Nothing about this
    function is hard to follow — it is long, not tangled, and the limit is a proxy for tangled.

    RE-CHECK when a command arrives that is more than a couple of calls, or when two commands start
    sharing state through a variable declared up here. Either means the branches have stopped being
    independent, which is the thing the limit is really about, and then this becomes a table of
    handlers keyed by command name.
    """
    cmd, args = argv[0], argv[1:]
    if cmd == "start":
        return start(*(int(a) for a in args))
    if cmd == "stop":
        return stop()
    if cmd == "_watchdog":
        return watchdog()
    if HEARTBEAT.parent.exists():
        HEARTBEAT.touch()
        # The note's deadline moves with the heartbeat, so it says when the browser will actually
        # close rather than when it would have.
        claim()
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        pg = page(pw)
        if cmd == "goto":
            pg.goto(args[0], wait_until="networkidle", timeout=60000)
            pg.wait_for_timeout(1500)
            pg.evaluate(HOOK)
        elif cmd == "reload":
            pg.reload(wait_until="networkidle", timeout=60000)
            pg.wait_for_timeout(1500)
            pg.evaluate(HOOK)
        elif cmd == "click":
            # The FIRST VISIBLE match, not the first match: "Prekliči" and "Shrani" sit in several
            # closed dialogs at once, and clicking a hidden one waits until it times out, which
            # two trainer-day runs reported as buttons that do not work.
            def first_visible(locator):
                for i in range(min(locator.count(), 50)):
                    if locator.nth(i).is_visible():
                        return locator.nth(i)
                return None

            target = first_visible(pg.get_by_text(args[0], exact=False))
            if target is None:
                # Glyph-only controls say what they are in aria-label or title, and that is what
                # the label under the thumb amounts to.
                target = first_visible(
                    pg.locator(f'[aria-label*="{args[0]}"], [title*="{args[0]}"]')
                )
            if target is None:
                sys.exit(f"nothing visible says {args[0]!r}")
            target.click()
            pg.wait_for_timeout(600)
        elif cmd == "tap":  # by CSS selector, when text is ambiguous
            pg.locator(args[0]).first.click()
            pg.wait_for_timeout(600)
        elif cmd == "fill":
            pg.locator(args[0]).first.fill(args[1])
        elif cmd == "type":
            # Types into whatever has focus, replacing what it holds — a trainer taps a field, then
            # types. `fill` with a class selector writes into the FIRST match, which in a plan with
            # several exercises is the first exercise; a trainer-day run reported that as the app
            # writing one exercise's load onto another.
            pg.keyboard.press("Control+A")
            pg.keyboard.type(args[0])
            pg.wait_for_timeout(300)
        elif cmd == "press":
            pg.locator(args[0]).first.press(args[1])
            pg.wait_for_timeout(600)
        elif cmd == "select":
            pg.locator(args[0]).first.select_option(args[1])
            pg.wait_for_timeout(400)
        elif cmd == "eval":
            print(
                json.dumps(
                    pg.evaluate(args[0]), ensure_ascii=False, indent=1, default=str
                )
            )
            return
        elif cmd == "shot":
            pg.screenshot(path=args[0], full_page=len(args) > 1)
            print("wrote", args[0])
            return
        elif (
            cmd == "inject"
        ):  # run JS before the page's own scripts, then reload with it in place
            cdp = pg.context.new_cdp_session(pg)
            cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": args[0]})
            pg.reload(wait_until="networkidle", timeout=60000)
            pg.wait_for_timeout(2000)
            pg.evaluate(HOOK)
            print("injected and reloaded |", pg.url)
            print(pg.inner_text("body")[:600].replace("\n", " | "))
            return
        elif (
            cmd == "upload"
        ):  # hand the app a file the way a trainer picks one from their phone
            pg.locator(args[0]).first.set_input_files(args[1])
            pg.wait_for_timeout(1200)
            print("uploaded", args[1])
            return
        elif (
            cmd == "download"
        ):  # a control that hands the trainer a file: save it and say what came
            with pg.expect_download(timeout=20000) as info:
                pg.locator(args[0]).first.click()
            dl = info.value
            dest = args[1] if len(args) > 1 else f"/tmp/{dl.suggested_filename}"
            dl.save_as(dest)
            print("downloaded:", dl.suggested_filename, "->", dest)
            return
        elif (
            cmd == "offline"
        ):  # the gym basement with no signal, which the app promises to survive
            # Through CDP, not context.set_offline: a context ATTACHED over CDP ignores that call
            # and the page keeps fetching, so a test of the promise would have proved nothing.
            off = args[0] == "on"
            cdp = pg.context.new_cdp_session(pg)
            cdp.send("Network.enable", {})
            cdp.send(
                "Network.emulateNetworkConditions",
                {
                    "offline": off,
                    "latency": 0,
                    "downloadThroughput": -1,
                    "uploadThroughput": -1,
                },
            )
            # The emulation lives on THIS cdp session and dies with the command, so a reload asked
            # for in a later call would run online. `offline on reload` does both while it holds.
            if len(args) > 1 and args[1] == "reload":
                try:
                    pg.reload(wait_until="domcontentloaded", timeout=30000)
                    pg.wait_for_timeout(2500)
                    pg.evaluate(HOOK)
                except Exception as exc:
                    print("reload while offline FAILED:", str(exc).splitlines()[0])
            print(
                "offline:", off, "| navigator.onLine:", pg.evaluate("navigator.onLine")
            )
            if len(args) > 1:
                print("body:", pg.inner_text("body")[:400].replace("\n", " | "))
            return
        elif cmd == "errors":
            errs = pg.evaluate("window.__explore_errs || null")
            print(
                "hook not installed — run `goto` first"
                if errs is None
                else "\n".join(errs) or "(none)"
            )
            return
        elif cmd == "controls":  # what a trainer can actually tap, and its label
            print(
                json.dumps(
                    pg.evaluate("""
              [...document.querySelectorAll('button,a,[role=button],input,select,textarea')]
                .filter(e => e.getClientRects().length)
                .map(e => ({t: e.tagName.toLowerCase(), label: (e.innerText || e.value ||
                    e.getAttribute('aria-label') || e.placeholder || '').trim().slice(0, 60),
                    id: e.id || null, cls: e.className || null}))
            """),
                    ensure_ascii=False,
                    indent=1,
                )
            )
            return
        elif (
            cmd == "measure"
        ):  # a form's geometry, measured the same way every time (mode 3)
            print(
                json.dumps(
                    pg.evaluate("""
              (() => {
                const vw = innerWidth, vh = innerHeight;
                const scope = [...document.querySelectorAll('dialog[open],[role=dialog]')]
                    .filter(e => e.getClientRects().length).pop()
                  || document.querySelector('.app-view.active') || document.body;
                // A checkbox's value is "on"; what a trainer reads is its label.
                const label = (e) => (e.labels?.[0]?.innerText || e.innerText || e.getAttribute('aria-label') ||
                    e.placeholder || e.value || e.id || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
                const shown = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
                const box = (e) => e.getBoundingClientRect();
                const onScreen = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
                const controls = [...scope.querySelectorAll(
                    'button,a,[role=button],input:not([type=hidden]),select,textarea,label:has(input[type=checkbox]),label:has(input[type=radio])')]
                  .filter(shown)
                  // A box with a label is tapped through its label, which is measured on its own.
                  .filter(e => !(/^(checkbox|radio)$/.test(e.type) && e.labels?.length));
                const small = controls.map(e => [e, box(e)])
                  .filter(([, r]) => r.width < 44 || r.height < 44)
                  .map(([e, r]) => `${label(e)} — ${Math.round(r.width)}×${Math.round(r.height)}${onScreen(r) ? '' : ' (off screen)'}`);
                const submits = [...scope.querySelectorAll('button[type=submit],.primary-btn,.success-btn')]
                  .filter(shown).map(e => {
                    const r = box(e);
                    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    return { label: label(e), onScreenAtOpen: onScreen(r),
                             pixelsBelowScreen: Math.max(0, Math.round(r.bottom - vh)),
                             covered: onScreen(r) && !(hit && e.contains(hit)) };
                  });
                const scroller = [scope, ...scope.querySelectorAll('*')]
                  .find(e => e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY));
                return { viewport: `${vw}×${vh}`, scope: scope.id || scope.className,
                         controls: controls.length, smallerThanAThumb: small, submits,
                         scrolls: !!scroller };
              })()
            """),
                    ensure_ascii=False,
                    indent=1,
                )
            )
            return
        elif cmd == "dialog":  # only what an open dialog or overlay says
            print(
                json.dumps(
                    pg.evaluate("""
              [...document.querySelectorAll('dialog[open],.modal,[role=dialog],.drawer.open')]
                .filter(e => e.getClientRects().length)
                .map(e => ({id: e.id || e.className, text: e.innerText.trim().slice(0, 1200)}))
            """),
                    ensure_ascii=False,
                    indent=1,
                )
            )
            return
        elif cmd != "text":
            sys.exit(f"unknown command: {cmd}")
        print("URL:", pg.url, "| lang:", pg.get_attribute("html", "lang"))
        # A board with fifty sessions on it costs more to print than it is worth; cap it.
        cap = int(args[0]) if (cmd == "text" and args) else 3000
        body = pg.inner_text("body")
        print(body[:cap])
        if len(body) > cap:
            print(f"… [{len(body) - cap} more characters; pass a bigger cap to `text`]")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(
            __doc__ + "\ncommands: start stop goto reload text controls click tap type "
            "fill press select eval shot errors"
        )
    try:
        main(sys.argv[1:])
    except (
        Exception
    ) as exc:  # a step that cannot be taken IS a result; print it in one line
        first = str(exc).strip().splitlines()[0]
        blocker = [
            ln.strip() for ln in str(exc).splitlines() if "intercepts pointer" in ln
        ]
        sys.exit(
            f"STEP FAILED: {first}"
            + (f"\nblocked by: {blocker[-1]}" if blocker else "")
        )
