/* permbits — UI wiring. All logic lives in data/engine.js; all facts in data/corpus.js. */
(function () {
  'use strict';
  const E = window.PERMBITS_ENGINE;
  const CORPUS = window.PERMBITS_CORPUS;
  const $ = (id) => document.getElementById(id);

  const LS_STATE = 'permbits:state';
  const LS_RECENT = 'permbits:recent';
  const LS_THEME = 'permbits:theme';

  /* ---------- state ---------- */
  let state = { mode: 0o644, isDir: false };
  try {
    const saved = JSON.parse(localStorage.getItem(LS_STATE) || 'null');
    if (saved && Number.isInteger(saved.mode) && saved.mode >= 0 && saved.mode <= 0o7777) {
      state = { mode: saved.mode, isDir: !!saved.isDir };
    }
  } catch (e) { /* corrupted storage — fall back to defaults */ }

  function persist() {
    try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  /* ---------- theme ---------- */
  const themeBtn = $('theme-toggle');
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeBtn.textContent = dark ? 'Light mode' : 'Dark mode';
    themeBtn.setAttribute('aria-pressed', String(dark));
  }
  let theme = null;
  try { theme = localStorage.getItem(LS_THEME); } catch (e) { /* ignore */ }
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(LS_THEME, theme); } catch (e) { /* ignore */ }
    applyTheme(theme);
  });

  /* ---------- class/bit tables ---------- */
  const GRID_IDS = ['b-ur', 'b-uw', 'b-ux', 'b-gr', 'b-gw', 'b-gx', 'b-or', 'b-ow', 'b-ox'];
  const SPECIAL_IDS = ['b-setuid', 'b-setgid', 'b-sticky'];

  /* ---------- render ---------- */
  function classSentence(cls, bits, isDir) {
    const who = cls === 'u' ? 'The owner' : cls === 'g' ? 'The group' : 'Everyone else';
    const can = [];
    if (bits & 4) can.push(isDir ? 'list the contents' : 'read it');
    if (bits & 2) can.push(isDir ? 'create and delete entries' : 'modify it');
    if (bits & 1) can.push(isDir ? 'enter and traverse it' : 'execute it');
    if (can.length === 0) return `${who} can do nothing with it.`;
    return `${who} can ${can.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
  }

  function specialSentences(mode, isDir) {
    const out = [];
    if (mode & E.SETUID) {
      out.push(isDir
        ? 'setuid on a directory has no portable meaning — only a few systems use it (see the reference).'
        : 'setuid: the program runs with the file owner’s user ID.');
    }
    if (mode & E.SETGID) {
      out.push(isDir
        ? 'setgid: new files inside inherit this directory’s group; subdirectories inherit setgid.'
        : 'setgid: the program runs with the file’s group ID.');
    }
    if (mode & E.STICKY) {
      out.push(isDir
        ? 'sticky (restricted deletion): users may delete or rename only entries they own.'
        : 'sticky on a regular file has no standardized effect (ignored on modern Linux).');
    }
    return out;
  }

  function render() {
    const { mode, isDir } = state;
    // grid
    GRID_IDS.concat(SPECIAL_IDS).forEach((id) => {
      const el = $(id);
      el.checked = (mode & Number(el.dataset.bit)) !== 0;
    });
    // fields (skip the one being typed in)
    const octal = E.formatOctal(mode);
    const sym = E.octalToSymbolic(mode);
    if (document.activeElement !== $('octal-in')) { $('octal-in').value = octal; $('octal-err').textContent = ''; }
    if (document.activeElement !== $('sym-in')) { $('sym-in').value = sym; $('sym-err').textContent = ''; }
    // kind
    $('kind-file').checked = !isDir;
    $('kind-dir').checked = isDir;
    $('x-head').innerHTML = (isDir ? 'search' : 'execute') + ' <span class="mono">x=1</span>';
    // command
    $('cmd-out').textContent = `chmod ${octal} ${isDir ? 'directory/' : 'file'}`;
    // explanation
    const ex = $('explain');
    ex.textContent = '';
    const strip = document.createElement('div');
    const head = document.createElement('p');
    head.className = 'explain__head mono';
    head.textContent = `${octal} · ${sym} · ${isDir ? 'directory' : 'file'}`;
    strip.appendChild(head);
    ['u', 'g', 'o'].forEach((cls, i) => {
      const bits = (mode >> ((2 - i) * 3)) & 7;
      const p = document.createElement('p');
      p.textContent = classSentence(cls, bits, isDir);
      strip.appendChild(p);
    });
    specialSentences(mode, isDir).forEach((s) => {
      const p = document.createElement('p');
      p.className = 'explain__special';
      p.textContent = s;
      strip.appendChild(p);
    });
    ex.appendChild(strip);
    // warnings
    const w = $('warnings');
    w.textContent = '';
    E.riskFlags(mode, isDir).forEach((f) => {
      const div = document.createElement('div');
      div.className = 'warnbadge';
      const b = document.createElement('strong');
      b.textContent = '⚠ Warning: ';
      div.appendChild(b);
      div.appendChild(document.createTextNode(f.label));
      w.appendChild(div);
    });
    persist();
  }

  function setMode(mode, isDir) {
    state.mode = mode & E.MODE_MAX;
    if (typeof isDir === 'boolean') state.isDir = isDir;
    render();
  }

  /* ---------- converter wiring ---------- */
  GRID_IDS.concat(SPECIAL_IDS).forEach((id) => {
    $(id).addEventListener('change', (ev) => {
      const bit = Number(ev.target.dataset.bit);
      setMode(ev.target.checked ? (state.mode | bit) : (state.mode & ~bit));
    });
  });

  $('kind-file').addEventListener('change', () => setMode(state.mode, false));
  $('kind-dir').addEventListener('change', () => setMode(state.mode, true));

  $('octal-in').addEventListener('input', (ev) => {
    const v = ev.target.value.trim();
    const m = E.parseOctal(v);
    if (m === null) { $('octal-err').textContent = v === '' ? '' : 'Octal digits 0–7 only, 3 or 4 of them (e.g. 644, 4755).'; return; }
    $('octal-err').textContent = '';
    setMode(m);
  });

  $('sym-in').addEventListener('input', (ev) => {
    const v = ev.target.value.trim();
    if (v.length !== 9) { $('sym-err').textContent = v === '' ? '' : `${v.length}/9 characters…`; return; }
    try {
      const m = E.symbolicToOctal(v);
      $('sym-err').textContent = '';
      setMode(m);
    } catch (err) {
      $('sym-err').textContent = err.message;
    }
  });

  /* ---------- copy ---------- */
  function copyText(text) {
    const note = $('copy-note');
    const done = () => { note.textContent = `Copied: ${text}`; setTimeout(() => { note.textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { $('copy-note').textContent = 'Copy failed — select the text manually.'; }
    document.body.removeChild(ta);
  }
  $('copy-cmd').addEventListener('click', () => copyText($('cmd-out').textContent));
  $('copy-octal').addEventListener('click', () => copyText(E.formatOctal(state.mode)));
  $('copy-sym').addEventListener('click', () => copyText(E.octalToSymbolic(state.mode)));

  /* ---------- ls -l parser ---------- */
  function renderLsResult(res) {
    const out = $('ls-out');
    out.textContent = '';
    if (res.error) {
      const p = document.createElement('p');
      p.className = 'field-err';
      p.textContent = res.error;
      out.appendChild(p);
      return;
    }
    const box = document.createElement('div');
    box.className = 'ls-result';
    const rows = [
      ['Type', `${res.typeChar} — ${res.typeName}`],
      ['Octal', res.octal],
      ['Symbolic', res.symbolic],
      ['Owner', classSentence('u', (res.mode >> 6) & 7, res.isDir)],
      ['Group', classSentence('g', (res.mode >> 3) & 7, res.isDir)],
      ['Other', classSentence('o', res.mode & 7, res.isDir)]
    ];
    specialSentences(res.mode, res.isDir).forEach((s) => rows.push(['Special', s]));
    if (res.aclChar) {
      rows.push(['Marker', res.hasAclMarker
        ? `trailing “+”: an alternate access method (such as a POSIX ACL) ALSO applies — these nine bits are not the whole story. Reading ACLs is beyond this tool; use getfacl.`
        : `trailing “${res.aclChar}”: an alternate access method marker (e.g. SELinux context for “.”) — beyond this tool.`]);
    }
    const dl = document.createElement('dl');
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      if (k === 'Octal' || k === 'Symbolic') dd.className = 'mono';
      dl.appendChild(dt); dl.appendChild(dd);
    });
    box.appendChild(dl);
    if (res.typeChar === '-' || res.typeChar === 'd') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--primary';
      btn.textContent = 'Load into calculator';
      btn.addEventListener('click', () => {
        setMode(res.mode, res.isDir);
        $('converter').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(btn);
    } else {
      const p = document.createElement('p');
      p.className = 'section-lede';
      p.textContent = 'Special file types keep their bits here for reading; the calculator models files and directories.';
      box.appendChild(p);
    }
    out.appendChild(box);
  }
  function doParse() { renderLsResult(E.parseLsLine($('ls-in').value)); }
  $('ls-parse').addEventListener('click', doParse);
  $('ls-in').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') doParse(); });

  /* ---------- clause applier ---------- */
  function renderDiff(before, after) {
    const frag = document.createDocumentFragment();
    const bs = E.octalToSymbolic(before);
    const as = E.octalToSymbolic(after);
    const mk = (s, other, tag) => {
      const span = document.createElement('span');
      span.className = 'mono diff';
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('span');
        c.textContent = s[i];
        if (s[i] !== other[i]) { c.className = 'chg'; c.setAttribute('title', 'changed'); }
        span.appendChild(c);
      }
      span.setAttribute('aria-label', `${tag}: ${s}`);
      return span;
    };
    frag.appendChild(mk(bs, as, 'before'));
    const arrow = document.createElement('span');
    arrow.textContent = ' → ';
    frag.appendChild(arrow);
    frag.appendChild(mk(as, bs, 'after'));
    return frag;
  }
  function doClauses() {
    const out = $('clause-out');
    out.textContent = '';
    const v = $('clause-in').value.trim();
    if (v === '') return;
    let after;
    try {
      after = E.applyChmod(state.mode, v, { isDir: state.isDir });
    } catch (err) {
      const p = document.createElement('p');
      p.className = 'field-err';
      p.textContent = err.message;
      out.appendChild(p);
      return;
    }
    const box = document.createElement('div');
    box.className = 'ls-result';
    const line = document.createElement('p');
    line.className = 'clause-line';
    line.appendChild(document.createTextNode(`${E.formatOctal(state.mode)} `));
    line.appendChild(renderDiff(state.mode, after));
    line.appendChild(document.createTextNode(` ${E.formatOctal(after)}`));
    box.appendChild(line);
    const note = document.createElement('p');
    note.className = 'section-lede';
    note.textContent = after === state.mode
      ? 'No change — the clause had no effect on this mode (capital X, for instance, is ignored on files with no execute bit).'
      : `Equivalent command: chmod ${v} ${state.isDir ? 'directory/' : 'file'}  (or chmod ${E.formatOctal(after)} …)`;
    box.appendChild(note);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary';
    btn.textContent = 'Apply to calculator';
    btn.addEventListener('click', () => { setMode(after); });
    box.appendChild(btn);
    out.appendChild(box);
  }
  $('clause-apply').addEventListener('click', doClauses);
  $('clause-in').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') doClauses(); });

  /* ---------- umask ---------- */
  function renderUmask() {
    const out = $('umask-out');
    out.textContent = '';
    const v = $('umask-in').value.trim();
    const u = E.parseOctal(v);
    if (u === null || u > 0o777) {
      const p = document.createElement('p');
      p.className = 'field-err';
      p.textContent = v === '' ? '' : 'A umask is up to three octal digits (e.g. 022).';
      out.appendChild(p);
      return;
    }
    const file = E.defaultMode(u, { dir: false });
    const dir = E.defaultMode(u, { dir: true });
    const box = document.createElement('div');
    box.className = 'umask-math';
    [[false, 'New file', 0o666, file], [true, 'New directory', 0o777, dir]].forEach(([isDir, label, base, res]) => {
      const row = document.createElement('div');
      row.className = 'umask-math__row';
      const math = document.createElement('p');
      math.className = 'mono';
      math.textContent = `${label}: ${base.toString(8)} & ~${E.formatOctal(u).padStart(3, '0')} = ${E.formatOctal(res)}  (${E.octalToSymbolic(res)})`;
      row.appendChild(math);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = 'Load';
      btn.addEventListener('click', () => {
        setMode(res, isDir);
        $('converter').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      row.appendChild(btn);
      box.appendChild(row);
    });
    out.appendChild(box);
  }
  $('umask-in').addEventListener('input', renderUmask);
  document.querySelectorAll('[data-umask]').forEach((btn) => {
    btn.addEventListener('click', () => { $('umask-in').value = btn.dataset.umask; renderUmask(); });
  });

  /* ---------- recipes ---------- */
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(LS_RECENT) || '[]').filter((id) => CORPUS.RECIPES.some((r) => r.id === id)); } catch (e) { recent = []; }

  function noteRecent(id) {
    recent = [id].concat(recent.filter((x) => x !== id)).slice(0, 5);
    try { localStorage.setItem(LS_RECENT, JSON.stringify(recent)); } catch (e) { /* ignore */ }
    renderRecent();
  }

  const DIR_RECIPES = new Set(['ssh-dir', 'web-dirs', 'setgid-shared-dir', 'world-writable-tmp',
    'home-dir', 'gnupg-dir', 'read-only-share', 'recursive-arx']);

  function loadRecipe(r) {
    if (r.id.startsWith('umask-')) {
      // umask recipes describe a mask, not a mode — drive the umask panel instead
      $('umask-in').value = r.octal;
      renderUmask();
      $('umask').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setMode(E.parseOctal(r.octal), DIR_RECIPES.has(r.id));
      $('converter').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    noteRecent(r.id);
  }

  function recipeCard(r) {
    const card = document.createElement('article');
    card.className = 'recipe';
    card.dataset.id = r.id;
    const h = document.createElement('h3');
    h.textContent = r.situation;
    card.appendChild(h);
    if (r.beta) {
      const badge = document.createElement('span');
      badge.className = 'beta-badge';
      badge.textContent = 'beta — varies by system';
      card.appendChild(badge);
    }
    const cmd = document.createElement('code');
    cmd.className = 'mono recipe__cmd';
    cmd.textContent = r.command;
    card.appendChild(cmd);
    const why = document.createElement('p');
    why.textContent = r.why;
    card.appendChild(why);
    if (r.caveat) {
      const cav = document.createElement('p');
      cav.className = 'recipe__caveat';
      cav.textContent = r.caveat;
      card.appendChild(cav);
    }
    const cite = document.createElement('p');
    cite.className = 'recipe__cite';
    const a = document.createElement('a');
    a.href = r.source.url;
    a.rel = 'noopener';
    a.textContent = `${r.source.doc} — ${r.source.section}`;
    cite.appendChild(a);
    cite.appendChild(document.createTextNode(` · verified ${r.verified_on}`));
    card.appendChild(cite);
    const row = document.createElement('div');
    row.className = 'copyrow';
    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'btn btn--primary';
    load.textContent = r.beta ? 'Load (then adjust for your system)' : 'Load into calculator';
    load.addEventListener('click', () => loadRecipe(r));
    row.appendChild(load);
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn';
    copy.textContent = 'Copy command';
    copy.addEventListener('click', () => { copyText(r.command); noteRecent(r.id); });
    row.appendChild(copy);
    card.appendChild(row);
    return card;
  }

  function renderRecipes(filter) {
    const list = $('recipe-list');
    list.textContent = '';
    const q = (filter || '').trim().toLowerCase();
    let shown = 0;
    CORPUS.RECIPES.forEach((r) => {
      const hay = `${r.situation} ${r.command} ${r.octal} ${r.why} ${r.source.doc}`.toLowerCase();
      if (q === '' || hay.includes(q)) { list.appendChild(recipeCard(r)); shown++; }
    });
    $('recipe-count').textContent = q === '' ? `${CORPUS.RECIPES.length}` : `${shown}/${CORPUS.RECIPES.length}`;
    if (shown === 0) {
      const p = document.createElement('p');
      p.className = 'section-lede';
      p.textContent = 'No recipe matches — try “ssh”, “web”, “sticky” or an octal like 755.';
      list.appendChild(p);
    }
  }

  function renderRecent() {
    const wrapEl = $('recent-recipes');
    const listEl = $('recent-list');
    listEl.textContent = '';
    if (recent.length === 0) { wrapEl.hidden = true; return; }
    wrapEl.hidden = false;
    recent.forEach((id) => {
      const r = CORPUS.RECIPES.find((x) => x.id === id);
      if (!r) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--chip';
      b.textContent = `${r.situation} (${r.octal})`;
      b.addEventListener('click', () => loadRecipe(r));
      listEl.appendChild(b);
    });
  }

  $('recipe-search').addEventListener('input', (ev) => renderRecipes(ev.target.value));

  /* ---------- concepts ---------- */
  function renderConcepts() {
    const list = $('concept-list');
    CORPUS.CONCEPTS.forEach((c) => {
      const d = document.createElement('details');
      d.className = 'concept';
      const s = document.createElement('summary');
      s.textContent = c.title;
      d.appendChild(s);
      const body = document.createElement('p');
      body.textContent = c.body;
      d.appendChild(body);
      const q = document.createElement('blockquote');
      q.textContent = `“${c.quote}”`;
      d.appendChild(q);
      const cite = document.createElement('p');
      cite.className = 'recipe__cite';
      const a = document.createElement('a');
      a.href = c.source.url;
      a.rel = 'noopener';
      a.textContent = `${c.source.doc} — ${c.source.section}`;
      cite.appendChild(a);
      cite.appendChild(document.createTextNode(` · verified ${c.verified_on}`));
      d.appendChild(cite);
      list.appendChild(d);
    });
  }

  /* ---------- boot ---------- */
  renderRecipes('');
  renderRecent();
  renderConcepts();
  render();
})();
