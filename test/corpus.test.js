'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CONCEPTS, RECIPES } = require('../data/corpus.js');
const E = require('../data/engine.js');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test('corpus sizes — 12 concept facts + 24 recipes', () => {
  assert.equal(CONCEPTS.length, 12);
  assert.equal(RECIPES.length, 24);
});

test('every corpus item has a non-empty source.url and an ISO verified_on', () => {
  for (const item of [...CONCEPTS, ...RECIPES]) {
    assert.ok(item.id && typeof item.id === 'string', 'id present');
    assert.ok(item.source && typeof item.source.url === 'string' && item.source.url.startsWith('https://'), `${item.id}: source.url`);
    assert.ok(item.source.doc && item.source.doc.length > 0, `${item.id}: source.doc`);
    assert.match(item.verified_on, ISO_DATE, `${item.id}: verified_on`);
  }
});

test('ids are unique across the whole corpus', () => {
  const ids = [...CONCEPTS, ...RECIPES].map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every recipe octal matches /^[0-7]{3,4}$/ and parses', () => {
  for (const r of RECIPES) {
    assert.match(r.octal, /^[0-7]{3,4}$/, `${r.id}: octal "${r.octal}"`);
    assert.notEqual(E.parseOctal(r.octal), null, `${r.id}: parseOctal`);
  }
});

test('every recipe has situation, command and why; beta recipes carry a caveat', () => {
  for (const r of RECIPES) {
    assert.ok(r.situation.length > 0, `${r.id}: situation`);
    assert.ok(r.command.length > 0, `${r.id}: command`);
    assert.ok(r.why.length > 0, `${r.id}: why`);
    if (r.beta) assert.ok(r.caveat && r.caveat.length > 0, `${r.id}: beta needs caveat`);
  }
});

test('non-beta recipes carry a verbatim source quote', () => {
  for (const r of RECIPES) {
    if (!r.beta) assert.ok(r.quote && r.quote.length > 10, `${r.id}: quote`);
  }
});

test('every concept has title, body and (all verified) a verbatim quote', () => {
  for (const c of CONCEPTS) {
    assert.ok(c.title.length > 0 && c.body.length > 0, c.id);
    assert.ok(c.quote && c.quote.length > 10, `${c.id}: quote`);
  }
});

test('key recipe modes round-trip through the engine', () => {
  const expect = {
    'ssh-private-key': 'rw-------',
    'ssh-dir': 'rwx------',
    'aws-pem': 'r--------',
    'setgid-shared-dir': 'rwxrwsr-x',
    'world-writable-tmp': 'rwxrwxrwt',
    'sudoers': 'r--r-----',
    'passwd-setuid': 'rwsr-xr-x',
    'read-only-share': 'r-xr-xr-x'
  };
  for (const [id, sym] of Object.entries(expect)) {
    const r = RECIPES.find((x) => x.id === id);
    assert.ok(r, id);
    assert.equal(E.octalToSymbolic(E.parseOctal(r.octal)), sym, id);
  }
});

test('umask recipes agree with defaultMode arithmetic', () => {
  const u022 = RECIPES.find((r) => r.id === 'umask-022');
  const u077 = RECIPES.find((r) => r.id === 'umask-077');
  assert.equal(E.defaultMode(E.parseOctal(u022.octal), { dir: false }), 0o644);
  assert.equal(E.defaultMode(E.parseOctal(u022.octal), { dir: true }), 0o755);
  assert.equal(E.defaultMode(E.parseOctal(u077.octal), { dir: false }), 0o600);
  assert.equal(E.defaultMode(E.parseOctal(u077.octal), { dir: true }), 0o700);
});

test('exactly the two documented beta items, no more', () => {
  const betas = RECIPES.filter((r) => r.beta).map((r) => r.id).sort();
  assert.deepEqual(betas, ['etc-shadow', 'gnupg-dir']);
});
