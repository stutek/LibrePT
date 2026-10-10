#!/bin/bash
# usage: x.sh A|B cmd args...   (A=9381, B=9382)
d=$1; shift
if [ "$d" = A ]; then export EXPLORE_PORT=9381; else export EXPLORE_PORT=9382; fi
cd /home/claude/librept
exec /home/claude/librept/.venv/bin/python /home/claude/librept/.agents/skills/exploratory-test/explore.py "$@"
