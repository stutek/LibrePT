"""Agent tooling: durable, repo-owned checks and utilities for AI agents working on LibrePT.

Single responsibility of this package: hold work an agent would otherwise redo as a throwaway
shell/python one-liner every session. Anything in here must be runnable as
`python -m agent_tools.<name>`, exit non-zero on failure, and be listed in agent_tools/INDEX.md.

See INDEX.md for when to add a tool here rather than improvising a script.
"""
