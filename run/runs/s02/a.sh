#!/bin/bash
cd /home/claude/librept
EXPLORE_PORT=9383 .venv/bin/python .agents/skills/exploratory-test/explore.py "$@"
