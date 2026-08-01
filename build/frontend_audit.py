# build/frontend_audit.py — HAND-WRITTEN, repo-specific static checks. This is NOT a third-party
# security scanner and nothing installs it: ~140 lines of stdlib Python (os + re) living in this
# repo, maintained by whoever changes it. Do not mistake it for a tool with a community behind it.
#
# Single responsibility: find unescaped user text reaching an HTML sink, and prove the production
# CSP is not weaker than the one the dev server serves.
#
# What it is NOT: it does not parse JavaScript and performs no dataflow or taint analysis. It is a
# regex heuristic over template literals, tuned for PRECISION (a maintained list of free-text field
# names) so that its findings are always worth acting on. It will therefore miss things a real
# analyser would catch — Semgrep is the upgrade path if that trade stops being acceptable.
#
# Why these two, specifically:
#   • The OWASP ZAP baseline is a PASSIVE scan of a SPA whose routes are client-side, so its spider
#     effectively sees one page. It never reaches the client directory, the clipboard or the backup
#     dialog — which is where this app's only untrusted input (an imported backup) gets rendered.
#     A real stored-XSS via `client.avatar` shipped under a green ZAP badge (fixed 2026-07-26).
#   • ZAP scans the DEV SERVER, which sends security headers as real HTTP headers. GitHub Pages
#     cannot send custom headers at all, so production's policy is only the <meta> CSP in
#     index.html. A green scan therefore certifies a posture production does not have.

import os
import re

# Fields a trainer (or an imported backup file) controls the text of. Interpolating one of these
# into HTML without escapeHTML is the bug class this audit exists to stop.
# MAINTENANCE: this is a precision-first allowlist, not a complete taint analysis — add a field here
# when the data model gains a new free-text property.
USER_TEXT_FIELDS = (
    "name",
    "names",
    "avatar",
    "notes",
    "goals",
    "injury",
    "title",
    "titles",
    "description",
    "email",
    "phone",
    "location",
    "routineName",
    "clientName",
    "circuitTitle",
)

HTML_SINK = re.compile(r"(innerHTML\s*=|insertAdjacentHTML\()")
INTERPOLATION = re.compile(r"\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}")
FIELD_REFERENCE = re.compile(r"\b(?:%s)\b" % "|".join(USER_TEXT_FIELDS))
# Escaped at the sink, or by a helper whose name promises escaped HTML (getClientDisplayNameHTML
# escapes internally and is covered by its own tests).
ALREADY_SAFE = re.compile(r"escapeHTML\(|DisplayNameHTML\(")
# `const title = escapeHTML(item.title)` then `${title}` is safe. Without this, escaping-at-assignment
# reads as a finding, and an audit that cries wolf gets suppressed rather than fixed.
ESCAPED_ASSIGNMENT = (
    r"(?:const|let|var)\s+%s\s*=[^;]*escapeHTML\(|%s\s*=[^;]*escapeHTML\("
)
BARE_IDENTIFIER = re.compile(r"^[A-Za-z_$][\w$]*$")


# Security-critical: this is the one check standing between a raw `${...}` interpolation and a
# shipped XSS sink (see its own module docstring). Splitting the sink-detection branches across
# functions would make the one property that matters — "did every sink actually get checked" —
# harder to verify by reading, not easier. Pre-existing debt, not part of today's complexity-gate
# work.
def audit_html_sinks(root="src"):  # noqa: C901
    """Every unescaped interpolation of a user-text field into an HTML sink, as
    (path, line_number, expression) — empty when the tree is clean."""
    findings = []
    for directory, _subdirs, names in os.walk(root):
        for name in sorted(names):
            if not name.endswith(".js"):
                continue
            path = os.path.join(directory, name)
            with open(path, encoding="utf-8") as handle:
                source = handle.read()
            lines = source.splitlines()

            def escaped_locally(expression, source=source):
                if not BARE_IDENTIFIER.match(expression):
                    return False
                name = re.escape(expression)
                return re.search(ESCAPED_ASSIGNMENT % (name, name), source) is not None

            for index, line in enumerate(lines):
                if not HTML_SINK.search(line):
                    continue
                # Walk the template literal that follows the sink: from the sink line until its
                # closing backtick (bounded, so a malformed file cannot run away with the scan).
                backticks = 0
                for offset in range(index, min(index + 80, len(lines))):
                    text = lines[offset]
                    backticks += text.count("`")
                    for expression in INTERPOLATION.findall(text):
                        expression = expression.strip()
                        if ALREADY_SAFE.search(expression) or escaped_locally(
                            expression
                        ):
                            continue
                        if FIELD_REFERENCE.search(expression):
                            findings.append((path, offset + 1, expression[:90]))
                    if backticks >= 2 and offset > index:
                        break
    # One report per distinct expression; the same helper repeated is one problem, not five.
    seen = set()
    unique = []
    for finding in findings:
        if finding[2] in seen:
            continue
        seen.add(finding[2])
        unique.append(finding)
    return unique


def parse_csp(policy):
    """A CSP string as {directive: value}."""
    directives = {}
    for part in policy.split(";"):
        part = part.strip()
        if not part:
            continue
        name, _, value = part.partition(" ")
        directives[name.strip()] = value.strip()
    return directives


# A <meta http-equiv> CSP cannot express these; the browser ignores them there. They therefore exist
# ONLY on the dev server, and production (GitHub Pages, which cannot send headers) goes without.
META_UNSUPPORTED = ("frame-ancestors", "report-uri", "report-to", "sandbox")


def compare_csp(header_policy, meta_policy):
    """(weaker, header_only) — directives where the production <meta> policy is weaker than the dev
    header, and directives that a meta tag structurally cannot carry.

    `weaker` is a build failure: it means the scanned posture is better than the shipped one.
    `header_only` is reported, not failed — it is a hosting limitation to accept knowingly.
    """
    header = parse_csp(header_policy)
    meta = parse_csp(meta_policy)
    weaker = []
    header_only = []
    for directive, value in header.items():
        if directive in META_UNSUPPORTED:
            header_only.append(directive)
        elif directive not in meta:
            weaker.append(f"{directive} missing from the <meta> policy")
        elif set(meta[directive].split()) > set(value.split()):
            weaker.append(
                f"{directive} is more permissive in <meta>: {meta[directive]!r}"
            )
    return weaker, header_only
