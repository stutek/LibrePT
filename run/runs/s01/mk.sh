#!/bin/bash
# mk.sh A|B "ime" "lokacija" HHMM "client search" [dateISO]  -> opens setup, fills, picks client, presses Odpri v beležki, closes invite dialog
D=$1; N=$2; L=$3; T=$4; C=$5; DT=$6
X=/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/runs/s01/x.sh
$X $D tap '#btn-create-session' >/dev/null 2>&1
$X $D fill '#setup-session-name' "$N" >/dev/null 2>&1
$X $D fill '#setup-location' "$L" >/dev/null 2>&1
if [ -n "$DT" ]; then $X $D tap '#setup-session-date' >/dev/null 2>&1; $X $D press 'Control+a' >/dev/null 2>&1; $X $D type "$(echo $DT | tr -d -)" >/dev/null 2>&1; fi
$X $D tap '#setup-start-time' >/dev/null 2>&1; $X $D press 'Control+a' >/dev/null 2>&1; $X $D type "$T" >/dev/null 2>&1
$X $D tap '#setup-participant-search' >/dev/null 2>&1; $X $D type "$C" >/dev/null 2>&1
$X $D tap '.participant-match >> nth=0' >/dev/null 2>&1
$X $D eval '[document.querySelector("#setup-session-date").value,document.querySelector("#setup-start-time").value,document.querySelector("#setup-end-time").value,document.querySelector("#setup-session-name").value].join(" ")'
