#!/bin/bash
# t.sh A|B [N]: tail N lines of screen text (default 25)
/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/runs/s01/x.sh $1 text 6000 | tail -n ${2:-25}
