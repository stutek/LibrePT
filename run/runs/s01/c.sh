#!/bin/bash
# compact controls list
/home/claude/librept/.private/exploratory-test/weeks/2026-10-10/runs/s01/x.sh $1 controls | python3 -c "import json,sys; [print(c['t'],'|',c['label'].replace('\n',' '),'|',c['id'],'|',c['cls']) for c in json.load(sys.stdin)]" | grep -v -e notification -e logo-area -e preview-badge -e app-version
