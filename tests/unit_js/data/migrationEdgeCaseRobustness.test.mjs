// tests/unit_js/data/migrationEdgeCaseRobustness.test.mjs
// The "migration fuzzing" item TODO §18.13 asks for: synthetic edge-case databases through the
// migration runner, checking it refuses rather than corrupts. This is a hand-authored table, not
// true property-based fuzzing — this stack is deliberately dependency-light (no fuzzing library),
// so the substitute is a growing, committed battery of hostile inputs asserted never to throw and
// never to silently produce a malformed result. Expand the table as new edge cases are found; do
// not remove a case once it has caught something real.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../../../src/data/schemaMigrations.js';

const EDGE_CASES = {
  null_input: 'null',
  array_instead_of_object: '[]',
  empty_object: '{}',
  string_instead_of_object: '"not a database"',
  number_instead_of_object: '42',
  clients_is_a_string: '{ "schemaVersion": 2, "sessions": [], "clients": "nope" }',
  sessions_is_an_object_not_array: '{ "schemaVersion": 2, "sessions": {} }',
  schema_version_is_a_string: '{ "schemaVersion": "two", "sessions": [] }',
  schema_version_is_negative: '{ "schemaVersion": -1, "sessions": [] }',
  schema_version_is_far_future: '{ "schemaVersion": 999999, "sessions": [] }',
  deeply_nested_garbage_in_history:
    '{ "schemaVersion": 2, "sessions": [], ' +
    '"history": [{ "id": "h1", "clientId": "c1", "exercises": [{ "sets": { "a": { "b": { "c": [1,2,3] } } } }] }] }',
  huge_sessions_array:
    '{ "schemaVersion": 2, "sessions": ' +
    JSON.stringify(
      Array.from({ length: 500 }, (_, i) => ({ id: `s${i}`, day: 'today', time: '09:00 - 10:00' }))
    ) +
    ' }',
  circular_looking_but_json_safe_self_reference_field:
    '{ "schemaVersion": 2, "sessions": [{ "id": "s1", "routineId": "s1" }] }',
  unicode_and_control_characters_in_names:
    '{ "schemaVersion": 2, "sessions": [], ' +
    '"clients": [{ "id": "c1", "name": "\\u0000\\ud83d\\ude00 <script>\\t\\n" }] }',
};

test('migration never throws and always returns a well formed result', () => {
  const results = {};
  for (const [name, raw] of Object.entries(EDGE_CASES)) {
    try {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        results[name] = { threw: false, unparsable: true };
        continue;
      }
      const result = m.migrateState(parsed);
      results[name] = {
        threw: false,
        ok: result.ok,
        hasSummary: Array.isArray(result.summary?.problems),
        // On refusal the contract is "hand back the original input, byte-for-byte" —
        // never fabricate a state, so a hostile `null`/array/string input refusing
        // WITH that same value as `state` is correct, not a gap.
        stateIsOriginalOnRefusal: result.ok || result.state === parsed,
        stateIsWellFormedOnSuccess:
          !result.ok ||
          (result.state !== null && typeof result.state === 'object' && !Array.isArray(result.state)),
      };
    } catch (err) {
      results[name] = { threw: true, message: String(err) };
    }
  }

  for (const [name, outcome] of Object.entries(results)) {
    assert.equal(Boolean(outcome.threw), false, `${name} threw: ${outcome.message}`);
    if (outcome.unparsable) continue;
    assert.equal(outcome.hasSummary, true, `${name} returned a summary with no problems array`);
    assert.equal(outcome.stateIsOriginalOnRefusal, true, `${name}: refusal fabricated a different state`);
    assert.equal(outcome.stateIsWellFormedOnSuccess, true, `${name}: success produced a malformed state`);
    // A refusal (ok: False) is an acceptable outcome for hostile input; silently succeeding
    // with a state that was never validated would not be.
  }
});
