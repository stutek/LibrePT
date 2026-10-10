#!/bin/bash
# usage: addex.sh <device a|b> <search> <exact name> <sets> <reps> <kg>
D=./$1.sh
$D click 'Dodaj iz kataloga' >/dev/null
$D click 'Išči vaje' >/dev/null
$D type "$2" >/dev/null
$D click "$3" >/dev/null
$D eval '(()=>{const t=[...document.querySelectorAll(".editor-row-toggle")].pop(); if(t&&t.textContent.trim()==="Razširi"||t&&t.getAttribute("aria-label")==="Razširi") t.click(); return "ok"})()' >/dev/null
$D tap '.editor-f-sets >> nth=-1' >/dev/null; $D type "$4" >/dev/null
$D tap '.editor-f-reps >> nth=-1' >/dev/null; $D type "$5" >/dev/null
$D tap '.editor-f-weight >> nth=-1' >/dev/null; $D type "$6" >/dev/null
$D eval 'JSON.stringify([...document.querySelectorAll(".editor-row-name,.editor-f-sets,.editor-f-reps,.editor-f-weight")].map(e=>e.value))'
