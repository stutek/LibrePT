// A structural guard for TODO §14.8: app.js used to sequence ~10 renderXShell()/renderXDialog()
// calls by hand-ordering them in source, which let a module querying another module's element land
// above that element's own render call with no error — silently a no-op. Each shell registers its
// name, its render function, and what it depends on existing first; runShellRenders() computes a
// valid order via topological sort instead of trusting call-site position.

const registrations = new Map();

export function registerShellRender(name, render, dependsOn = []) {
  registrations.set(name, { render, dependsOn });
}

export function runShellRenders() {
  const done = new Set();
  const visiting = new Set();

  function visit(name, requiredBy) {
    if (done.has(name)) return;
    const entry = registrations.get(name);
    if (!entry) {
      const suffix = requiredBy ? ` (required by "${requiredBy}")` : "";
      throw new Error(`renderRegistry: unregistered shell "${name}"${suffix}`);
    }
    if (visiting.has(name)) {
      throw new Error(`renderRegistry: cyclic shell dependency at "${name}"`);
    }
    visiting.add(name);
    for (const dep of entry.dependsOn) visit(dep, name);
    visiting.delete(name);
    entry.render();
    done.add(name);
  }

  for (const name of registrations.keys()) visit(name);
}

export function resetShellRegistry() {
  registrations.clear();
}
