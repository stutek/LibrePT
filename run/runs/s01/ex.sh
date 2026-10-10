#!/bin/bash
# ex.sh A|B index "ime" reps weight [hold]   (index = 0-based position of the new row)
D=$1; I=$2; N=$3; R=$4; W=$5; H=$6
X=/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/runs/s01/x.sh
if [ "$I" = 0 ]; then $X $D tap '.ins-ex >> nth=0' >/dev/null 2>&1; else $X $D tap '.ins-ex >> nth=-1' >/dev/null 2>&1; fi
$X $D tap ".editor-row-name >> nth=$I" >/dev/null 2>&1; $X $D type "$N" >/dev/null 2>&1
if [ -n "$H" ]; then $X $D select '.editor-f-measure' hold >/dev/null 2>&1; fi
$X $D tap '.editor-f-reps' >/dev/null 2>&1; $X $D press 'Control+a' >/dev/null 2>&1; $X $D type "$R" >/dev/null 2>&1
if [ -n "$W" ] && [ "$W" != 0 ]; then $X $D tap '.editor-f-weight' >/dev/null 2>&1; $X $D press 'Control+a' >/dev/null 2>&1; $X $D type "$W" >/dev/null 2>&1; fi
$X $D eval '[...document.querySelectorAll(".editor-row-name")].map(e=>e.value).join(" ; ")'
