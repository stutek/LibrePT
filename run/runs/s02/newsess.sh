#!/bin/bash
# usage: newsess.sh <dev> <name> <loc> <date> <start> <end> <client search> <client label>
D=./$1.sh
$D goto 'http://localhost:8081/LibrePT/session/new?lang=sl' >/dev/null
$D fill '#setup-session-name' "$2" >/dev/null
$D fill '#setup-location' "$3" >/dev/null
$D tap '#setup-session-date' >/dev/null; $D type "$4" >/dev/null
$D tap '#setup-start-time' >/dev/null; $D type "$5" >/dev/null
$D tap '#setup-end-time' >/dev/null; $D type "$6" >/dev/null
$D tap '#setup-participant-search' >/dev/null; $D type "$7" >/dev/null
$D click "$8" >/dev/null
$D tap '#btn-setup-open' >/dev/null
$D click 'Končano' >/dev/null
$D click 'Možnosti treninga' >/dev/null
$D click 'Uredi načrt' >/dev/null
$D text 700 | sed -n 1,3p
