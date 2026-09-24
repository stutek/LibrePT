// tests/unit_js/data/appVersions.test.mjs
// The app versions a trainer can choose (TODO §76): the registry's own rules, and the two promises
// the rest of the code relies on — that a behaviour asked for by name exists, and that every schema a
// version writes stays live.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as v from "../../../src/data/appVersions.js";
import { LIVE_SCHEMAS } from "../../../src/data/recordSchemas.js";

const SRC = fileURLToPath(new URL("../../../src/", import.meta.url));

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".js") ? [path] : [];
  });
}

// Every behaviour the code asks for, read from the source the way a reviewer would find it.
function behavioursAskedFor() {
  const names = new Set();
  for (const file of sourceFiles(SRC)) {
    for (const match of readFileSync(file, "utf-8").matchAll(/hasBehaviour\("([A-Za-z]+)"\)/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

function withStorage(initial, body) {
  const store = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  try {
    return body(store);
  } finally {
    globalThis.localStorage = undefined;
  }
}

test("exactly one version is the default, and every id is a distinct year-month", () => {
  assert.equal(v.APP_VERSIONS.filter((version) => version.status === "default").length, 1);
  const ids = v.APP_VERSIONS.map((version) => version.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^\d{4}-\d{2}$/);
});

test("every numbered live schema is written by some version, and every version's schema is live", () => {
  const numbered = Object.keys(LIVE_SCHEMAS).filter((key) => /^\d+$/.test(key));
  const named = new Set(v.APP_VERSIONS.map((version) => String(version.schema)));
  assert.deepEqual(
    numbered.filter((schema) => !named.has(schema)),
    [],
    "a live schema no version writes is a store kept for nothing — retire it by a decision",
  );
  assert.deepEqual(
    [...named].filter((schema) => !(schema in LIVE_SCHEMAS)),
    [],
    "a version writes a schema this build does not keep live",
  );
});

test("every behaviour the code asks for is declared, and every declared one is asked for", () => {
  const asked = behavioursAskedFor();
  const declared = new Set(v.APP_VERSIONS.flatMap((version) => version.behaviours));
  assert.ok(asked.size > 0, "no behaviour is asked for, so this test would pass for free");
  assert.deepEqual(
    [...asked].filter((name) => !declared.has(name)),
    [],
    "asked for, never declared",
  );
  assert.deepEqual(
    [...declared].filter((name) => !asked.has(name)),
    [],
    "declared, never asked for",
  );
});

test("no behaviour is on in every version, or its branch is dead code", () => {
  const onEverywhere = v.APP_VERSIONS[0].behaviours.filter((name) =>
    v.APP_VERSIONS.every((version) => version.behaviours.includes(name)),
  );
  assert.deepEqual(onEverywhere, []);
});

test("a device that never chose, or chose a version since retired, runs the default", () => {
  const fallback = v.defaultAppVersion().id;
  withStorage({}, () => assert.equal(v.activeAppVersion().id, fallback));
  withStorage({ librept_app_version: "1999-01" }, () =>
    assert.equal(v.activeAppVersion().id, fallback),
  );
});

test("a chosen version decides the behaviours, and an unknown one is refused", () => {
  const without = v.APP_VERSIONS.find((version) => !version.behaviours.includes("libraryImport"));
  const withIt = v.APP_VERSIONS.find((version) => version.behaviours.includes("libraryImport"));
  withStorage({}, (store) => {
    v.setAppVersion(without.id);
    assert.equal(v.hasBehaviour("libraryImport"), false);
    v.setAppVersion(withIt.id);
    assert.equal(v.hasBehaviour("libraryImport"), true);
    assert.throws(() => v.setAppVersion("1999-01"));
    assert.equal(store.get("librept_app_version"), withIt.id, "a refused choice changes nothing");
  });
});
