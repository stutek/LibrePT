// components/clipboardEditor.js
// The inline "edit mode" render of the active-session clipboard. When the trainer taps a card's
// edit (✎) icon, the whole deck flips into this editable list so the plan can be reshaped mid-
// session. It renders as an ALTERNATE view over the same #active-exercise-scroll-deck container;
// the normal deck/focus/logging code is never touched, so leaving edit mode restores the live
// clipboard as-is.
//
// The plan (activeClientState.exercises) is an ordered mix of first-class items: exercises and
// rests ({ type:'rest', rest:<seconds> }). The editor renders each as its own row with the same
// reorder handle (tap top/bottom to nudge, drag to move within its list), and an insert bar in
// every gap injects an exercise, a superset, or a rest at that exact position. Because items are
// first-class, reorder/insert/delete are plain array operations — no rest is derived from an
// exercise. Supersets are bordered blocks with an editable title + round count; members (exercises
// AND their in-circuit rests) stay CONSECUTIVE in the array, which normalizeCircuits() enforces.
//
// deps: {
//   activeClientState, allExerciseNames, t, escapeHTML,
//   save(),        // cache + localStorage, NO re-render (for live field edits)
//   rerender(),    // re-render the board (stays in edit mode) after structural changes
//   openAddExercise(),  // opens the existing #dialog-add-session-exercise (kept for compatibility)
//   exit(),        // leave edit mode
//   genId()        // fresh short id for new exercises/rests/circuits
// }

const DEFAULT_SERIES = 3;
const DEFAULT_REST = 30; // seconds, when injecting a fresh rest

const isRest = (it) => !!it && it.type === "rest";

// The editor's Esc / tap-outside handlers live on `document`, so they must be torn down before a
// fresh render (or an exit) installs new ones. renderActiveGroupBoard can re-render the board more
// than once per interaction, so we don't rely on the controller pairing each render with a cleanup:
// this module-level slot always detaches the previous render's document listeners first, keeping
// exactly one set live. A stale leftover was what made an in-editor tap read as "outside".
let detachDocListeners = null;

export function renderClipboardEditor(container, deps) {
  const {
    activeClientState,
    clientName,
    allExerciseNames,
    t,
    escapeHTML,
    save,
    rerender,
    openAddExercise,
    exit,
    genId,
  } = deps;
  const items = activeClientState.exercises;
  const tr = (key, fallback) => t(key) || fallback;
  const newId = () =>
    genId ? genId() : `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  // Regroup so each circuit's members are contiguous before we render straight from the array.
  normalizeCircuits();

  const datalistId = "clipboard-editor-ex-names";
  const options = (allExerciseNames || [])
    .map((n) => `<option value="${escapeHTML(n)}"></option>`)
    .join("");

  // First-appearance order + metadata for the existing circuits, used to build the move <select>.
  const circuits = [];
  for (const it of items) {
    if (it.circuitId && !circuits.some((c) => c.id === it.circuitId)) {
      circuits.push({
        id: it.circuitId,
        title: it.circuitTitle || "",
        series: it.circuitSeries || 1,
      });
    }
  }
  const circuitMetaOf = (cid) => {
    const m =
      items.find((e) => e.circuitId === cid && !isRest(e)) ||
      items.find((e) => e.circuitId === cid);
    return m
      ? { title: m.circuitTitle || "", series: m.circuitSeries || 1 }
      : { title: "", series: DEFAULT_SERIES };
  };

  // ---------- row builders ----------
  const reorderHandle = () => `
    <button type="button" class="editor-reorder" aria-label="${tr("reorder", "Reorder")}" title="${tr("reorder_hint", "Tap top/bottom to move, drag to reorder")}">
      <span class="editor-reorder-up"><i class="fa-solid fa-chevron-up"></i></span>
      <span class="editor-reorder-down"><i class="fa-solid fa-chevron-down"></i></span>
    </button>`;

  const supersetSelect = (ex) => {
    const opts = [`<option value="">${tr("superset_none", "No superset")}</option>`];
    {
      let i = 0;
      for (const c of circuits) {
        const label = c.title || `${tr("superset", "Superset")} ${i + 1}`;
        opts.push(
          `<option value="${escapeHTML(c.id)}"${c.id === ex.circuitId ? " selected" : ""}>${escapeHTML(label)}</option>`,
        );
        i++;
      }
    }
    opts.push(`<option value="__new__">＋ ${tr("superset_new", "New superset")}</option>`);
    return `<select class="editor-row-superset" aria-label="${tr("superset", "Superset")}">${opts.join("")}</select>`;
  };

  const exerciseRow = (ex, idx) => {
    const name = escapeHTML(ex.name || "");
    const sets = escapeHTML(String(ex.setsTargetCount ?? ex.sets ?? 3));
    const reps = escapeHTML(String(ex.repsTarget ?? ex.reps ?? 10));
    const weight = escapeHTML(String(ex.weightTarget ?? ex.weight ?? 0));
    return `
      <li class="editor-row" data-rowkey="${idx}">
        ${reorderHandle()}
        <div class="editor-row-main">
          <div class="editor-row-name-wrap">
            <input class="editor-row-name" type="text" list="${datalistId}" value="${name}" aria-label="${tr("exercise", "Exercise")}" placeholder="${tr("exercise", "Exercise")}">
          </div>
          <div class="editor-row-fields">
            <label class="editor-field"><span>${tr("sets", "Sets")}</span><input type="number" min="0" class="editor-f-sets" value="${sets}"></label>
            <label class="editor-field"><span>${tr("reps_label", "Reps")}</span><input type="number" min="0" class="editor-f-reps" value="${reps}"></label>
            <label class="editor-field"><span>${tr("kg", "kg")}</span><input type="number" min="0" step="0.5" class="editor-f-weight" value="${weight}"></label>
            <label class="editor-field editor-field-superset"><span><i class="fa-solid fa-layer-group"></i></span>${supersetSelect(ex)}</label>
          </div>
        </div>
        <button type="button" class="editor-remove" aria-label="${tr("remove", "Remove")}"><i class="fa-solid fa-trash-can"></i></button>
      </li>`;
  };

  const restRow = (rest, idx) => `
    <li class="editor-rest-row" data-rowkey="${idx}">
      ${reorderHandle()}
      <span class="editor-rest-label"><i class="fa-solid fa-hourglass-half"></i> ${tr("rest_label", "Rest")}</span>
      <input type="number" min="0" step="5" class="editor-rest-secs" value="${escapeHTML(String(rest.rest ?? 0))}" aria-label="${tr("rest_label", "Rest")}">
      <span class="editor-rest-unit">s</span>
      <button type="button" class="editor-rest-remove" aria-label="${tr("remove", "Remove")}"><i class="fa-solid fa-trash-can"></i></button>
    </li>`;

  const anyRow = (it, idx) => (isRest(it) ? restRow(it, idx) : exerciseRow(it, idx));

  // An insert bar sits in a gap and injects at items[] index `at`. `allowSuperset` is true only at
  // the top level; `cid` (when inside a circuit) is stamped onto whatever is injected there.
  const insertBar = (at, { allowSuperset = false, cid } = {}) => {
    const cidAttr = cid ? ` data-cid="${escapeHTML(cid)}"` : "";
    return `
      <li class="editor-insert" data-at="${at}"${cidAttr}>
        <span class="editor-insert-line"></span>
        <button type="button" class="ins-btn ins-ex"><i class="fa-solid fa-plus"></i> ${tr("exercise", "Exercise")}</button>
        ${allowSuperset ? `<button type="button" class="ins-btn ins-ss"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-layer-group"></i> ${tr("superset", "Superset")}</button>` : ""}
        <button type="button" class="ins-btn ins-rest"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-hourglass-half"></i> ${tr("rest_label", "Rest")}</button>
        <span class="editor-insert-line"></span>
      </li>`;
  };

  const circuitBlock = (cid, members) => {
    const meta = circuitMetaOf(cid);
    const title = escapeHTML(meta.title);
    const series = escapeHTML(String(meta.series));
    let inner = insertBar(members[0].idx, { cid });
    for (const m of members) {
      inner += anyRow(m.it, m.idx);
      inner += insertBar(m.idx + 1, { cid });
    }
    return `
      <li class="editor-circuit" data-circuit="${escapeHTML(cid)}">
        <div class="editor-circuit-head">
          ${reorderHandle()}
          <span class="editor-circuit-icon"><i class="fa-solid fa-layer-group"></i></span>
          <input class="editor-circuit-title" type="text" value="${title}" placeholder="${tr("superset", "Superset")}" aria-label="${tr("superset_title", "Superset title")}">
          <label class="editor-circuit-rounds"><span>${tr("rounds", "Rounds")}</span><input type="number" min="1" class="editor-circuit-series" value="${series}"></label>
          <button type="button" class="editor-circuit-ungroup" title="${tr("ungroup", "Break up superset")}"><i class="fa-solid fa-link-slash"></i></button>
        </div>
        <ul class="editor-circuit-list">${inner}</ul>
      </li>`;
  };

  // Walk the (contiguous) array into top-level units, with an insert bar in every gap.
  let unitsHtml = insertBar(0, { allowSuperset: true });
  for (let i = 0; i < items.length; ) {
    const it = items[i];
    if (it.circuitId) {
      const cid = it.circuitId;
      const members = [];
      while (i < items.length && items[i].circuitId === cid) {
        members.push({ it: items[i], idx: i });
        i++;
      }
      unitsHtml += circuitBlock(cid, members);
    } else {
      unitsHtml += anyRow(it, i);
      i++;
    }
    unitsHtml += insertBar(i, { allowSuperset: true });
  }

  container.innerHTML = `
    <div class="clipboard-editor" role="region" aria-label="${tr("edit_plan", "Edit plan")}">
      <div class="clipboard-editor-head">
        <span class="clipboard-editor-title"><i class="fa-solid fa-pen-to-square"></i> ${
          clientName
            ? `${tr("editing_plan_for", "Editing plan for")} <strong>${escapeHTML(clientName)}</strong>`
            : tr("editing_plan_session", "Editing session plan")
        }</span>
        <button type="button" class="btn primary-btn btn-sm editor-done"><i class="fa-solid fa-check"></i> ${tr("done", "Done")}</button>
      </div>
      <ul class="editor-list">${items.length ? unitsHtml : `<li class="editor-empty">${tr("no_exercises_injected", "No exercises yet.")}</li>${insertBar(0, { allowSuperset: true })}`}</ul>
      <p class="clipboard-editor-hint">${tr("edit_exit_hint", "Tap Done, press Esc, or tap outside to finish.")}</p>
      <datalist id="${datalistId}">${options}</datalist>
    </div>`;

  const editorEl = container.querySelector(".clipboard-editor");
  const listEl = container.querySelector(".editor-list");
  const rowKeyOf = (rowEl) => parseInt(rowEl.dataset.rowkey, 10);

  // ---------- circuit invariant: members contiguous, shared title/series, clean round counters ----------
  function normalizeCircuits() {
    const emitted = new Set();
    const result = [];
    for (const it of items) {
      if (!it.circuitId) {
        result.push(it);
        continue;
      }
      if (emitted.has(it.circuitId)) continue; // members are pulled together on first sight
      emitted.add(it.circuitId);
      const members = items.filter((e) => e.circuitId === it.circuitId);
      const firstEx = members.find((m) => !isRest(m)) || members[0];
      const title = firstEx.circuitTitle || "";
      const series = firstEx.circuitSeries || 1;
      for (const m of members) {
        m.circuitTitle = title;
        m.circuitSeries = series;
      }
      result.push(...members);
    }
    items.length = 0;
    items.push(...result);

    if (!activeClientState.circuitRounds) activeClientState.circuitRounds = {};
    const rounds = activeClientState.circuitRounds;
    for (const cid of Object.keys(rounds)) {
      if (!items.some((e) => e.circuitId === cid)) delete rounds[cid];
    }
    for (const it of items) {
      if (!it.circuitId) continue;
      const series = it.circuitSeries || 1;
      rounds[it.circuitId] = Math.min(Math.max(1, rounds[it.circuitId] || 1), series);
    }
    if (activeClientState.activeExerciseIndex >= items.length) {
      activeClientState.activeExerciseIndex = Math.max(0, items.length - 1);
    }
  }
  const commit = () => {
    normalizeCircuits();
    save();
    rerender();
  };

  // ---------- exercise field edits: mutate live session without a re-render (keeps focus/caret) ----------
  const bindField = (selector, apply) => {
    for (const input of listEl.querySelectorAll(selector)) {
      input.addEventListener("change", () => {
        const ex = items[rowKeyOf(input.closest(".editor-row"))];
        if (!ex) return;
        apply(ex, input.value);
        save();
      });
      input.addEventListener("click", (e) => e.stopPropagation());
    }
  };
  bindField(".editor-f-sets", (ex, v) => {
    const n = Math.max(0, parseInt(v, 10) || 0);
    ex.setsTargetCount = n;
    if (!activeClientState.logs[ex.id]) {
      activeClientState.logs[ex.id] = [];
    }
    const logs = activeClientState.logs[ex.id];
    while (logs.length < n)
      logs.push({
        reps: ex.repsTarget || 0,
        weight: ex.weightTarget || 0,
        completed: false,
        note: "",
      });
    logs.length = n;
  });
  bindField(".editor-f-reps", (ex, v) => {
    ex.repsTarget = v === "" ? ex.repsTarget : parseInt(v, 10) || 0;
  });
  bindField(".editor-f-weight", (ex, v) => {
    ex.weightTarget = parseFloat(v) || 0;
  });

  // --- swap the movement in place via the name field (autocompletes from the catalog) ---
  for (const input of listEl.querySelectorAll(".editor-row-name")) {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => {
      const ex = items[rowKeyOf(input.closest(".editor-row"))];
      if (!ex) return;
      const newName = input.value.trim();
      if (!newName || newName === ex.name) return;
      ex.name = newName; // keep the same slot/id/logs — a swap retargets the movement, not the sets
      save();
    });
  }

  // ---------- rest rows: edit seconds (live) / remove ----------
  for (const input of listEl.querySelectorAll(".editor-rest-secs")) {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => {
      const it = items[rowKeyOf(input.closest(".editor-rest-row"))];
      if (!it) return;
      it.rest = Math.max(0, parseInt(input.value, 10) || 0);
      save();
    });
  }
  for (const btn of listEl.querySelectorAll(".editor-rest-remove")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      items.splice(rowKeyOf(btn.closest(".editor-rest-row")), 1);
      commit();
    });
  }

  // ---------- superset membership: None / an existing circuit / a fresh one. Regroup on change. ----------
  for (const sel of listEl.querySelectorAll(".editor-row-superset")) {
    sel.addEventListener("click", (e) => e.stopPropagation());
    sel.addEventListener("change", () => {
      const ex = items[rowKeyOf(sel.closest(".editor-row"))];
      if (!ex) return;
      const val = sel.value;
      if (val === "") {
        ex.circuitId = null;
        ex.circuitTitle = "";
        ex.circuitSeries = 1;
      } else if (val === "__new__") {
        ex.circuitId = newId();
        ex.circuitTitle = "";
        ex.circuitSeries = DEFAULT_SERIES;
      } else {
        const meta = circuitMetaOf(val);
        ex.circuitId = val;
        ex.circuitTitle = meta.title;
        ex.circuitSeries = meta.series;
      }
      commit();
    });
  }

  // ---------- superset header: title + round count apply to every member; ungroup clears them ----------
  for (const block of listEl.querySelectorAll(".editor-circuit")) {
    const cid = block.dataset.circuit;
    const membersOf = () => items.filter((e) => e.circuitId === cid);
    const titleInput = block.querySelector(".editor-circuit-title");
    const seriesInput = block.querySelector(".editor-circuit-series");
    titleInput.addEventListener("click", (e) => e.stopPropagation());
    seriesInput.addEventListener("click", (e) => e.stopPropagation());
    titleInput.addEventListener("change", () => {
      for (const m of membersOf()) {
        m.circuitTitle = titleInput.value.trim();
      }
      save();
    });
    seriesInput.addEventListener("change", () => {
      const n = Math.max(1, parseInt(seriesInput.value, 10) || 1);
      for (const m of membersOf()) {
        m.circuitSeries = n;
      }
      normalizeCircuits(); // clamps the live round counter to the new series
      save();
      rerender();
    });
    block.querySelector(".editor-circuit-ungroup").addEventListener("click", (e) => {
      e.stopPropagation();
      for (const m of membersOf()) {
        m.circuitId = null;
        m.circuitTitle = "";
        m.circuitSeries = 1;
      }
      commit();
    });
  }

  // ---------- remove an exercise entirely ----------
  for (const btn of listEl.querySelectorAll(".editor-remove")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = rowKeyOf(btn.closest(".editor-row"));
      const [removed] = items.splice(idx, 1);
      if (removed) delete activeClientState.logs[removed.id];
      commit();
    });
  }

  // ---------- insert bars: inject an exercise / superset / rest at a gap ----------
  const makeExercise = (cid) => {
    const id = newId();
    const meta = cid ? circuitMetaOf(cid) : null;
    activeClientState.logs[id] = Array.from({ length: 3 }, () => ({
      reps: 10,
      weight: 0,
      completed: false,
      note: "",
    }));
    return {
      id,
      name: "",
      setsTargetCount: 3,
      repsTarget: 10,
      weightTarget: 0,
      circuitId: cid || null,
      circuitTitle: meta ? meta.title : "",
      circuitSeries: meta ? meta.series : 1,
    };
  };
  const makeRest = (cid) => {
    const meta = cid ? circuitMetaOf(cid) : null;
    return {
      id: newId(),
      type: "rest",
      rest: DEFAULT_REST,
      circuitId: cid || null,
      circuitTitle: meta ? meta.title : "",
      circuitSeries: meta ? meta.series : 1,
    };
  };
  for (const bar of listEl.querySelectorAll(".editor-insert")) {
    const at = parseInt(bar.dataset.at, 10);
    const cid = bar.dataset.cid || null;
    const exBtn = bar.querySelector(".ins-ex");
    const ssBtn = bar.querySelector(".ins-ss");
    const restBtn = bar.querySelector(".ins-rest");
    if (exBtn)
      exBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        items.splice(at, 0, makeExercise(cid));
        commit();
      });
    if (ssBtn)
      ssBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        items.splice(at, 0, makeExercise(newId()));
        commit();
      });
    if (restBtn)
      restBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        items.splice(at, 0, makeRest(cid));
        commit();
      });
  }

  // ---------- reorder: nudge (tap) + drag, within the row's own list. Rebuilds items[] from DOM. ----------
  const MOVABLE = "editor-row editor-rest-row editor-circuit".split(" ");
  const isMovable = (el) => el && MOVABLE.some((c) => el.classList.contains(c));

  const rebuildFromDom = () => {
    const result = [];
    const pushRow = (el) => {
      const it = items[rowKeyOf(el)];
      if (it) result.push(it);
    };
    for (const li of listEl.querySelectorAll(":scope > li")) {
      if (li.classList.contains("editor-circuit")) {
        for (const r of li.querySelectorAll(".editor-circuit-list > li")) {
          if (r.classList.contains("editor-row") || r.classList.contains("editor-rest-row"))
            pushRow(r);
        }
      } else if (li.classList.contains("editor-row") || li.classList.contains("editor-rest-row")) {
        pushRow(li);
      }
    }
    items.length = 0;
    items.push(...result);
  };

  for (const handle of listEl.querySelectorAll(".editor-reorder")) {
    const moveEl =
      handle.closest(".editor-row") ||
      handle.closest(".editor-rest-row") ||
      handle.closest(".editor-circuit");
    const parentList = moveEl.parentElement;
    let dragging = false;
    let startY = 0;
    let moved = false;

    // The drag reorders moveEl within its list live (insertBefore). Relocating the element in the
    // DOM makes the browser drop any pointer capture on the handle, so we must NOT rely on capture:
    // the move/up/cancel listeners live on `document` for the drag's duration instead, guaranteeing
    // the drag is always finalized (rebuildFromDom + commit) even after the element has moved.
    const onMove = (e) => {
      if (Math.abs(e.clientY - startY) > 6) moved = true;
      if (!moved) return;
      const sibs = [...parentList.children].filter((c) => c !== moveEl && isMovable(c));
      const after = sibs.find(
        (r) => e.clientY < r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2,
      );
      if (after) parentList.insertBefore(moveEl, after);
      else parentList.appendChild(moveEl);
    };
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
      moveEl.classList.remove("editor-row-dragging");
      if (moved) {
        rebuildFromDom();
        commit();
      } else {
        // A tap (no drag): top half nudges up, bottom half down, among same-list movable siblings.
        const sibs = [...parentList.children].filter(isMovable);
        const pos = sibs.indexOf(moveEl);
        const r = handle.getBoundingClientRect();
        const target = e.clientY - r.top < r.height / 2 ? pos - 1 : pos + 1;
        if (target < 0 || target >= sibs.length) return;
        parentList.insertBefore(moveEl, target > pos ? sibs[target].nextSibling : sibs[target]);
        rebuildFromDom();
        commit();
      }
    };

    handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = false;
      startY = e.clientY;
      moveEl.classList.add("editor-row-dragging");
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", endDrag);
      e.preventDefault();
    });
  }

  // ---------- exits (zero friction): Done button, Esc, tap outside the editor ----------
  container.querySelector(".editor-done").addEventListener("click", (e) => {
    e.stopPropagation();
    doExit();
  });

  // Drop any exercise left with a blank name (e.g. an injected row never filled in). Rests are kept.
  const pruneBlanks = () => {
    let changed = false;
    for (let i = items.length - 1; i >= 0; i--) {
      if (!isRest(items[i]) && !(items[i].name || "").trim()) {
        const [rm] = items.splice(i, 1);
        if (rm) delete activeClientState.logs[rm.id];
        changed = true;
      }
    }
    if (changed) {
      normalizeCircuits();
      save();
    }
  };
  const doExit = () => {
    cleanup();
    pruneBlanks();
    exit();
  };

  const onKey = (e) => {
    if (e.key === "Escape") doExit();
  };
  const onOutside = (e) => {
    // Ignore taps inside the editor itself or inside any open modal dialog (e.g. Add exercise)
    if (editorEl.contains(e.target) || e.target.closest?.("dialog")) return;
    doExit();
  };
  function cleanup() {
    clearTimeout(outsideTimer); // if we're torn down before the deferred add fires, never add it
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onOutside, true);
    if (detachDocListeners === cleanup) detachDocListeners = null;
  }

  // Tear down any prior render's document listeners before installing ours, so only one set is live.
  if (detachDocListeners) detachDocListeners();
  detachDocListeners = cleanup;
  document.addEventListener("keydown", onKey);
  // Capture phase so a tap anywhere outside the editor (but inside the overlay) exits first. Deferred
  // one tick so the ✎ click that opened us doesn't immediately count as an outside tap — cleanup()
  // clears this timer, so a re-render that tears us down first can't leak a stale outside listener.
  const outsideTimer = setTimeout(
    () => document.addEventListener("pointerdown", onOutside, true),
    0,
  );

  // Hand cleanup back so the controller can detach listeners if it re-renders us away
  return cleanup;
}
