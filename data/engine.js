/* permbits — pure permission-bit engine.
   Classic POSIX mode bits only (rwx × ugo + setuid/setgid/sticky).
   No ACLs, no SELinux contexts, no ownership. Dual-export: browser global + Node tests. */
'use strict';

const SETUID = 0o4000;
const SETGID = 0o2000;
const STICKY = 0o1000;
const MODE_MAX = 0o7777;

/* Entry-type characters per POSIX ls (plus the common 's' socket char). */
const TYPE_CHARS = {
  '-': 'regular file',
  'd': 'directory',
  'l': 'symbolic link',
  'c': 'character special file',
  'b': 'block special file',
  'p': 'FIFO (named pipe)',
  's': 'socket'
};

/** 0..0o7777 -> 9-char symbolic string with s/S/t/T per POSIX ls. */
function octalToSymbolic(mode) {
  if (!Number.isInteger(mode) || mode < 0 || mode > MODE_MAX) {
    throw new RangeError('mode must be an integer 0..0o7777');
  }
  const specialBit = [SETUID, SETGID, STICKY];
  const specialChar = ['s', 's', 't'];
  let out = '';
  for (let i = 0; i < 3; i++) {
    const bits = (mode >> ((2 - i) * 3)) & 7;
    out += (bits & 4) ? 'r' : '-';
    out += (bits & 2) ? 'w' : '-';
    const hasSpecial = (mode & specialBit[i]) !== 0;
    const hasExec = (bits & 1) !== 0;
    if (hasSpecial) out += hasExec ? specialChar[i] : specialChar[i].toUpperCase();
    else out += hasExec ? 'x' : '-';
  }
  return out;
}

/** 9-char symbolic string (rwxsStT-) -> integer mode. Throws on malformed input. */
function symbolicToOctal(sym) {
  if (typeof sym !== 'string' || sym.length !== 9) {
    throw new Error('symbolic mode must be exactly 9 characters, e.g. rwxr-xr-x');
  }
  let mode = 0;
  const specialBit = [SETUID, SETGID, STICKY];
  const specialLower = ['s', 's', 't'];
  for (let i = 0; i < 3; i++) {
    const r = sym[i * 3], w = sym[i * 3 + 1], x = sym[i * 3 + 2];
    const shift = (2 - i) * 3;
    if (r === 'r') mode |= 4 << shift;
    else if (r !== '-') throw new Error(`bad character "${r}" at position ${i * 3 + 1} (want r or -)`);
    if (w === 'w') mode |= 2 << shift;
    else if (w !== '-') throw new Error(`bad character "${w}" at position ${i * 3 + 2} (want w or -)`);
    const lower = specialLower[i], upper = lower.toUpperCase();
    if (x === 'x') mode |= 1 << shift;
    else if (x === lower) { mode |= 1 << shift; mode |= specialBit[i]; }
    else if (x === upper) { mode |= specialBit[i]; }
    else if (x !== '-') throw new Error(`bad character "${x}" at position ${i * 3 + 3} (want x, ${lower}, ${upper} or -)`);
  }
  return mode;
}

/** Format an integer mode as a 3- or 4-digit octal string ('755', '4755'). */
function formatOctal(mode) {
  if (mode > 0o777) return mode.toString(8).padStart(4, '0').replace(/^0(?=[1-7])/, '');
  return (mode & 0o777).toString(8).padStart(3, '0');
}

/** Parse '755', '0755', '4755' etc. -> integer mode. Returns null when not 1-4 octal digits. */
function parseOctal(str) {
  if (typeof str !== 'string' || !/^[0-7]{1,4}$/.test(str.trim())) return null;
  return parseInt(str.trim(), 8);
}

const MODE_FIELD_RE = /^([-dlcbps])([rwxsS-]{2}[rwxsStT-]{7})([+.@])?$/;

/**
 * Parse a full `ls -l` line or a bare 10/11-char mode field (or bare 9-char perms).
 * Returns { typeChar, typeName, isDir, symbolic, mode, octal, hasAclMarker, aclChar, name }
 * or { error } for unrecognisable input.
 */
function parseLsLine(input) {
  if (typeof input !== 'string' || input.trim() === '') return { error: 'empty input' };
  const tokens = input.trim().split(/\s+/);
  let field = tokens[0];
  // bare 9-char permission string: assume a regular file
  if (/^[rwxsStT-]{9}$/.test(field) && !MODE_FIELD_RE.test(field)) field = '-' + field;
  const m = MODE_FIELD_RE.exec(field);
  if (!m) {
    return { error: 'could not read a mode field — paste a full ls -l line or just the 10/11-character mode field (e.g. -rw-r--r-- or drwxr-xr-x+)' };
  }
  const typeChar = m[1];
  let symbolic;
  let mode;
  try {
    // Re-validate triads strictly (s only in owner/group slot, t only in other slot)
    symbolic = m[2];
    const s = symbolic;
    if (/[tT]/.test(s[2]) || /[tT]/.test(s[5]) || /[sS]/.test(s[8])) {
      return { error: 's/S belong in the owner and group execute slots and t/T in the other execute slot — check the pasted mode string' };
    }
    mode = symbolicToOctal(symbolic);
  } catch (e) {
    return { error: e.message };
  }
  const aclChar = m[3] || '';
  // ls -l file name = last token when the line has the usual >= 8 fields
  let name = '';
  if (tokens.length >= 8) name = tokens[tokens.length - 1];
  return {
    typeChar,
    typeName: TYPE_CHARS[typeChar] || 'unknown',
    isDir: typeChar === 'd',
    symbolic,
    mode,
    octal: formatOctal(mode),
    hasAclMarker: aclChar === '+',
    aclChar,
    name
  };
}

/** Default creation mode: (dir ? 777 : 666) & ~umask. Programs request 666/777 by convention. */
function defaultMode(umask, opts) {
  const dir = !!(opts && opts.dir);
  if (!Number.isInteger(umask) || umask < 0 || umask > 0o777) {
    throw new RangeError('umask must be an integer 0..0o777');
  }
  return (dir ? 0o777 : 0o666) & ~umask & 0o777;
}

const CLAUSE_RE = /^([ugoa]*)([+=-])([rwxXst]*)$/;

/**
 * Apply a symbolic chmod clause list (e.g. "u+x,go-w", "a=rX", "u=rw,go=") to a mode.
 * opts.isDir affects capital X. Copy-from-class forms (u=g) are rejected with a clear error.
 * A clause with no who letters is treated as "a" (real chmod also masks those with your umask).
 * On directories, "=" preserves setuid/setgid unless "s" is mentioned — the behaviour the
 * GNU Coreutils manual documents ("a command like chmod does not affect the set-user-ID or
 * set-group-ID bits of a directory unless the user specifically mentions them"); POSIX
 * leaves it implementation-defined, so some systems clear them (use u-s/g-s to clear).
 */
function applyChmod(mode, clauseList, opts) {
  const isDir = !!(opts && opts.isDir);
  if (!Number.isInteger(mode) || mode < 0 || mode > MODE_MAX) {
    throw new RangeError('mode must be an integer 0..0o7777');
  }
  if (typeof clauseList !== 'string' || clauseList.trim() === '') {
    throw new Error('empty clause list — try something like u+x or go-w');
  }
  let result = mode;
  const clauses = clauseList.split(',').map((c) => c.trim());
  for (const clause of clauses) {
    if (clause === '') throw new Error('empty clause in list (double comma?)');
    if (/^[ugoa]*[+=-][ugo]$/.test(clause)) {
      throw new Error(`"${clause}": copy-from-class forms like u=g are not supported in v1 — spell the permissions out (e.g. u=rwx)`);
    }
    const m = CLAUSE_RE.exec(clause);
    if (!m) {
      throw new Error(`"${clause}": expected [ugoa][+-=][rwxXst], e.g. u+x, go-w, a=rX`);
    }
    const who = m[1] === '' ? 'a' : m[1];
    const op = m[2];
    const perms = m[3];
    const classes = [];
    if (who.includes('a')) classes.push('u', 'g', 'o');
    else for (const c of who) if (!classes.includes(c)) classes.push(c);

    // X: execute/search only if directory or some execute bit already set (POSIX chmod)
    const xApplies = perms.includes('x') ||
      (perms.includes('X') && (isDir || (result & 0o111) !== 0));

    let addBits = 0;
    for (const cls of classes) {
      const shift = cls === 'u' ? 6 : cls === 'g' ? 3 : 0;
      if (perms.includes('r')) addBits |= 4 << shift;
      if (perms.includes('w')) addBits |= 2 << shift;
      if (xApplies) addBits |= 1 << shift;
      if (perms.includes('s')) {
        if (cls === 'u') addBits |= SETUID;
        if (cls === 'g') addBits |= SETGID;
        // 's' is ignored for the other class, per POSIX
      }
    }
    if (perms.includes('t')) addBits |= STICKY;

    if (op === '+') {
      result |= addBits;
    } else if (op === '-') {
      result &= ~addBits;
    } else { // '='
      let clearBits = 0;
      // GNU chmod preserves a directory's setuid/setgid on "=" unless s is mentioned.
      const clearSpecial = !isDir || perms.includes('s');
      for (const cls of classes) {
        const shift = cls === 'u' ? 6 : cls === 'g' ? 3 : 0;
        clearBits |= 7 << shift;
        if (cls === 'u' && clearSpecial) clearBits |= SETUID;
        if (cls === 'g' && clearSpecial) clearBits |= SETGID;
        if (cls === 'o') clearBits |= STICKY;
      }
      result = (result & ~clearBits) | addBits;
    }
  }
  return result;
}

/** Risk flags for a mode. State is reported as text, never colour-only. */
function riskFlags(mode, isDir) {
  const flags = [];
  const worldWritable = (mode & 0o002) !== 0;
  if (worldWritable) {
    flags.push({
      id: 'world-writable',
      label: isDir
        ? 'World-writable directory — any local user can create or replace entries' +
          ((mode & STICKY) === 0 ? ' and, without the sticky bit, delete other users’ files' : ' (sticky bit limits deletion to owners)')
        : 'World-writable — any local user can modify this file'
    });
  }
  if ((mode & 0o777) === 0o777) {
    flags.push({ id: 'all-open', label: '777 — full read/write/execute for everyone; almost never what you want' });
  }
  if ((mode & SETUID) !== 0 && worldWritable) {
    flags.push({ id: 'setuid-world-writable', label: 'setuid AND world-writable — anyone can swap in code that runs as the owner' });
  }
  if ((mode & SETGID) !== 0 && worldWritable && !isDir) {
    flags.push({ id: 'setgid-world-writable', label: 'setgid AND world-writable — anyone can swap in code that runs with the group' });
  }
  return flags;
}

const ENGINE = {
  SETUID, SETGID, STICKY, MODE_MAX, TYPE_CHARS,
  octalToSymbolic, symbolicToOctal, formatOctal, parseOctal,
  parseLsLine, defaultMode, applyChmod, riskFlags
};

if (typeof module !== 'undefined') module.exports = ENGINE;
if (typeof window !== 'undefined') window.PERMBITS_ENGINE = ENGINE;
