'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../data/engine.js');

test('octalToSymbolic — basic and setuid/setgid letters', () => {
  assert.equal(E.octalToSymbolic(0o755), 'rwxr-xr-x');
  assert.equal(E.octalToSymbolic(0o4755), 'rwsr-xr-x');
  assert.equal(E.octalToSymbolic(0o4644), 'rwSr--r--');
});

test('octalToSymbolic — sticky t/T and setgid s', () => {
  assert.equal(E.octalToSymbolic(0o1777), 'rwxrwxrwt');
  assert.equal(E.octalToSymbolic(0o1776), 'rwxrwxrwT');
  assert.equal(E.octalToSymbolic(0o2775), 'rwxrwsr-x');
});

test('symbolicToOctal — exact fixture', () => {
  assert.equal(E.symbolicToOctal('rw-r-----'), 0o640);
});

test('round-trip all 4096 modes', () => {
  for (let m = 0; m <= 0o7777; m++) {
    assert.equal(E.symbolicToOctal(E.octalToSymbolic(m)), m, `mode ${m.toString(8)}`);
  }
});

test('symbolicToOctal rejects malformed strings', () => {
  assert.throws(() => E.symbolicToOctal('rwxrwxrw'));       // 8 chars
  assert.throws(() => E.symbolicToOctal('rwtr-xr-x'));      // t in owner slot
  assert.throws(() => E.symbolicToOctal('qwxr-xr-x'));      // bad letter
  assert.throws(() => E.symbolicToOctal('rwxr-xr-s'));      // s in other slot
});

test('parseLsLine — /usr/bin/passwd fixture', () => {
  const p = E.parseLsLine('-rwsr-xr-x 1 root root 59976 Mar 23 2025 /usr/bin/passwd');
  assert.equal(p.octal, '4755');
  assert.equal(p.isDir, false);
  assert.equal(p.hasAclMarker, false);
  assert.equal(p.typeChar, '-');
  assert.equal(p.symbolic, 'rwsr-xr-x');
  assert.equal(p.name, '/usr/bin/passwd');
});

test('parseLsLine — setgid dir with ACL marker fixture', () => {
  const p = E.parseLsLine('drwxrwsr-x+ 2 alice devs 4096 Jul 1 09:00 shared');
  assert.equal(p.octal, '2775');
  assert.equal(p.isDir, true);
  assert.equal(p.hasAclMarker, true);
});

test('parseLsLine — bare mode fields and other types', () => {
  assert.equal(E.parseLsLine('drwxr-xr-x').octal, '755');
  assert.equal(E.parseLsLine('rw-r--r--').octal, '644');       // bare 9-char perms
  assert.equal(E.parseLsLine('lrwxrwxrwx').typeName, 'symbolic link');
  assert.equal(E.parseLsLine('crw-rw-rw-').typeName, 'character special file');
  assert.equal(E.parseLsLine('drwxr-xr-x.').hasAclMarker, false); // SELinux dot recognised, not '+'
  assert.equal(E.parseLsLine('drwxr-xr-x.').aclChar, '.');
  assert.ok(E.parseLsLine('total 24').error);
  assert.ok(E.parseLsLine('').error);
});

test('defaultMode — umask arithmetic fixtures', () => {
  assert.equal(E.defaultMode(0o022, { dir: false }), 0o644);
  assert.equal(E.defaultMode(0o077, { dir: true }), 0o700);
  assert.equal(E.defaultMode(0o002, { dir: true }), 0o775);
  assert.equal(E.defaultMode(0o022, { dir: true }), 0o755);
  assert.equal(E.defaultMode(0o002, { dir: false }), 0o664);
  assert.equal(E.defaultMode(0o077, { dir: false }), 0o600);
});

test('applyChmod — add/remove fixtures', () => {
  assert.equal(E.applyChmod(0o644, 'g+w,o-r'), 0o660);
  assert.equal(E.applyChmod(0o777, 'go-w'), 0o755);
  assert.equal(E.applyChmod(0o600, 'u+x'), 0o700);
});

test('applyChmod — capital X semantics', () => {
  assert.equal(E.applyChmod(0o644, 'a+X', { isDir: false }), 0o644);
  assert.equal(E.applyChmod(0o644, 'a+X', { isDir: true }), 0o755);
  assert.equal(E.applyChmod(0o744, 'a+X', { isDir: false }), 0o755);
});

test('applyChmod — assignment resets the class', () => {
  assert.equal(E.applyChmod(0o777, 'u=rw,go='), 0o600);
  assert.equal(E.applyChmod(0o4777, 'u=rw'), 0o077 | 0o600); // u= clears setuid too
  assert.equal(E.applyChmod(0o644, 'a=rX', { isDir: true }), 0o555);
});

test('applyChmod — special bits via s and t', () => {
  assert.equal(E.applyChmod(0o755, 'u+s'), 0o4755);
  assert.equal(E.applyChmod(0o775, 'g+s'), 0o2775);
  assert.equal(E.applyChmod(0o777, '+t'), 0o1777);
  assert.equal(E.applyChmod(0o4755, 'u-s'), 0o755);
  assert.equal(E.applyChmod(0o1777, 'o-t'), 0o777);
});

test('applyChmod — rejects copy-from-class and garbage with clear errors', () => {
  assert.throws(() => E.applyChmod(0o644, 'u=g'), /copy-from-class/);
  assert.throws(() => E.applyChmod(0o644, 'u+q'), /expected/);
  assert.throws(() => E.applyChmod(0o644, ''), /empty/);
  assert.throws(() => E.applyChmod(0o644, 'u+x,,g+w'), /empty clause/);
});

test('formatOctal / parseOctal round-trip', () => {
  assert.equal(E.formatOctal(0o755), '755');
  assert.equal(E.formatOctal(0o4755), '4755');
  assert.equal(E.formatOctal(0o007), '007');
  assert.equal(E.parseOctal('0755'), 0o755);
  assert.equal(E.parseOctal('4755'), 0o4755);
  assert.equal(E.parseOctal('9'), null);
  assert.equal(E.parseOctal('77777'), null);
});

test('riskFlags — never silent on dangerous modes', () => {
  const ids = (m, d) => E.riskFlags(m, d).map((f) => f.id);
  assert.ok(ids(0o777, false).includes('world-writable'));
  assert.ok(ids(0o777, false).includes('all-open'));
  assert.ok(ids(0o4777, false).includes('setuid-world-writable'));
  assert.equal(ids(0o755, false).length, 0);
  assert.equal(ids(0o1777, true).filter((i) => i === 'world-writable').length, 1);
});

test('property: 4096 modes × umask — defaultMode never grants a masked bit', () => {
  for (let u = 0; u <= 0o777; u++) {
    const f = E.defaultMode(u, { dir: false });
    const d = E.defaultMode(u, { dir: true });
    assert.equal(f & u, 0, `file umask ${u.toString(8)}`);
    assert.equal(d & u, 0, `dir umask ${u.toString(8)}`);
    assert.equal(f & ~0o666, 0);           // a file default never gains execute or special bits
    assert.equal(d & ~0o777, 0);
    assert.equal((f | u) & 0o666, 0o666);  // every denied file bit is denied by the umask
  }
});

test('property: applyChmod + never removes, - never adds, both idempotent (all 512 × 6 clauses)', () => {
  const clauses = ['u+w', 'g+r', 'o+x', 'a+r', 'ug+w', 'go+x'];
  for (let m = 0; m <= 0o777; m++) {
    for (const c of clauses) {
      const added = E.applyChmod(m, c);
      assert.equal(added & m, m, `${c} removed a bit from ${m.toString(8)}`);
      assert.equal(E.applyChmod(added, c), added, `${c} not idempotent`);
      const minus = c.replace('+', '-');
      const removed = E.applyChmod(m, minus);
      assert.equal(removed & ~m, 0, `${minus} added a bit to ${m.toString(8)}`);
      assert.equal(E.applyChmod(removed, minus), removed, `${minus} not idempotent`);
      // add-then-remove strips exactly the clause's bits: equals remove applied directly
      assert.equal(E.applyChmod(added, minus), removed, `${c}/${minus} disagree at ${m.toString(8)}`);
    }
  }
});
