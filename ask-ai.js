/* Ask AI (13 Nov 2026): "Copy for ChatGPT ▾" on every page, the verifiedcall.app pattern.
   One short prompt points an assistant at a public brief (ai.md, written from the site's own facts; keep it in step).
   - Copy: the prompt, a line, then the whole brief (for assistants that can't open links).
   - ▾: choose ChatGPT, Claude, Gemini, Perplexity or Grok (remembered), "Copy text" for any AI, or "Open in" the chosen
     one with the prompt filled in (Gemini takes no prompt in its link, so it copies the prompt first).
   Mount: <div data-ask-ai data-focus="the Verified Call case study"></div>. Styles: ask-ai.css.
   Safari: the copy hands the clipboard a pending ClipboardItem inside the click, so it keeps the gesture while the
   brief is still loading; then writeText, then execCommand, then a select-it-yourself box. */
(function () {
  'use strict';
  var BRIEF_URL = '/ai.md', PUBLIC_BRIEF = 'https://bhanu.build/ai.md';
  var LEAD = "If you can't open the link, here is the page:";
  var AIS = [
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q=' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/new?q=' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', paste: true },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' },
    { id: 'grok', name: 'Grok', url: 'https://grok.com/?q=' }
  ];
  var KEY = 'askAI', DONE_MS = 2400;
  var mounts = [].slice.call(document.querySelectorAll('[data-ask-ai]')); if (!mounts.length) return;

  var current = AIS[0];
  try { var saved = localStorage.getItem(KEY); AIS.forEach(function (a) { if (a.id === saved) current = a; }); } catch (e) {}
  var brief = null, inflight = null, timer = 0, uid = 0;
  var status = document.createElement('span'); status.className = 'aai-sr'; status.setAttribute('role', 'status'); document.body.appendChild(status);

  function prompt(focus) {
    return 'Read ' + PUBLIC_BRIEF + ' and tell me who Bhanu Kowshik is, what he has designed and built' +
      (focus ? ' (starting with ' + focus + ')' : '') + ", and whether he'd be a good fit for the role I'm hiring for.";
  }
  function getBrief() {
    if (brief) return Promise.resolve(brief);
    if (!inflight) inflight = fetch(BRIEF_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (t) { brief = t; return t; }, function () { inflight = null; return null; });
    return inflight;
  }
  function fullText(focus, t) { return t ? prompt(focus) + '\n\n' + LEAD + '\n\n' + t : prompt(focus); }   // offline: the prompt alone still works
  function legacy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
  }
  function byHand(text, opener) {
    var d = document.createElement('div'); d.className = 'aai-fallback'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Copy the text by hand');
    d.innerHTML = '<p>Your browser blocked copying. The text is selected: press Cmd+C (Ctrl+C on Windows), then paste it into your AI.</p><textarea readonly aria-label="Text for AI assistants"></textarea><button type="button">Close</button>';
    d.querySelector('textarea').value = text; document.body.appendChild(d);
    d.querySelector('button').addEventListener('click', function () { d.remove(); if (opener) opener.focus(); });
    var ta = d.querySelector('textarea'); ta.focus(); ta.select();
  }
  function copied(where) {
    status.textContent = 'Copied. Paste it into ' + (where || 'your AI') + '.';
    mounts.forEach(function (m) { m.dataset.state = 'done'; });
    clearTimeout(timer); timer = setTimeout(function () { mounts.forEach(function (m) { m.dataset.state = 'idle'; }); }, DONE_MS);
  }
  function copy(focus, opener, where) {
    var c = navigator.clipboard;
    if (c && c.write && window.ClipboardItem && window.isSecureContext) {
      try {
        var item = new ClipboardItem({ 'text/plain': getBrief().then(function (t) { return new Blob([fullText(focus, t)], { type: 'text/plain' }); }) });
        return c.write([item]).then(function () { copied(where); }, function () { return slow(focus, opener, where); });
      } catch (e) {}
    }
    return slow(focus, opener, where);
  }
  function slow(focus, opener, where) {
    return getBrief().then(function (t) {
      var text = fullText(focus, t), c = navigator.clipboard;
      var p = c && c.writeText && window.isSecureContext ? c.writeText(text) : Promise.reject();
      return p.then(function () { copied(where); }, function () { if (legacy(text)) copied(where); else byHand(text, opener); });
    });
  }
  function copyPromptOnly(focus) {               // Gemini: the link can't carry the prompt, so it goes on the clipboard in the click
    var t = prompt(focus);
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).catch(function () { legacy(t); }); else legacy(t); } catch (e) { legacy(t); }
    status.textContent = 'Prompt copied. Paste it into Gemini.';
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  mounts.forEach(function (m) {
    var focus = m.getAttribute('data-focus') || '', id = 'aaiMenu' + (++uid);
    m.classList.add('aai'); m.dataset.state = 'idle';
    m.innerHTML =
      '<button class="aai-copy" type="button">' + ICON +
        '<span class="aai-idle">Copy for <span class="aai-name"></span></span><span class="aai-done" aria-hidden="true">' + CHECK + 'Copied</span></button>' +
      '<button class="aai-pick" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '" aria-label="Copy for AI: choose your AI assistant">' +
        ICON.replace('<svg', '<svg class="aai-ico"') + CHEV.replace('<svg', '<svg class="aai-chev"') + '</button>' +
      '<div class="aai-menu" id="' + id + '" hidden>' +
        '<button class="aai-row aai-main" type="button"><span>Copy for <span class="aai-name"></span></span><small>Prompt + brief</small></button>' +
        '<p class="aai-sub">Copy for</p>' +
        AIS.map(function (a) { return '<button class="aai-row aai-ai" type="button" role="menuitemradio" aria-checked="false" data-ai="' + a.id + '"><span>' + a.name + '</span>' + CHECK + '</button>'; }).join('') +
        '<hr class="aai-hr">' +
        '<button class="aai-row aai-any" type="button"><span>Copy text</span><small>Works in any AI</small></button>' +
        '<a class="aai-row aai-open" target="_blank" rel="noopener"><span>Open in <span class="aai-name"></span></span>' + EXT + '<span class="aai-sr"> (opens in a new tab)</span></a>' +
      '</div>';
    var main = m.querySelector('.aai-copy'), pick = m.querySelector('.aai-pick'), menu = m.querySelector('.aai-menu'), open = m.querySelector('.aai-open');
    function render() {
      m.querySelectorAll('.aai-name').forEach(function (n) { n.textContent = current.name; });
      main.setAttribute('aria-label', 'Copy for ' + current.name + ': copies a prompt and a brief about Bhanu to paste into ' + current.name + ' or any AI assistant');
      m.querySelectorAll('.aai-ai').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.ai === current.id)); });
      open.href = current.paste ? current.url : current.url + encodeURIComponent(prompt(focus));
    }
    m.__render = render; render();
    function setOpen(v, focusFirst) {
      pick.setAttribute('aria-expanded', String(v)); menu.hidden = !v;
      if (v) { getBrief(); if (focusFirst) (menu.querySelector('[aria-checked="true"]') || menu.querySelector('.aai-row')).focus(); }
    }
    main.addEventListener('click', function () { copy(focus, main, current.name); });
    ['pointerenter', 'focus', 'touchstart'].forEach(function (ev) { main.addEventListener(ev, getBrief, { once: true, passive: true }); });
    pick.addEventListener('click', function () { setOpen(menu.hidden, true); });
    menu.addEventListener('click', function (e) {
      var ai = e.target.closest('.aai-ai');
      if (ai) {
        AIS.forEach(function (a) { if (a.id === ai.dataset.ai) current = a; });
        try { localStorage.setItem(KEY, current.id); } catch (err) {}
        mounts.forEach(function (x) { if (x.__render) x.__render(); });
        setOpen(false); pick.focus(); return;
      }
      if (e.target.closest('.aai-main')) { copy(focus, pick, current.name); setOpen(false); pick.focus(); return; }
      if (e.target.closest('.aai-any')) { copy(focus, pick, 'any AI'); setOpen(false); pick.focus(); return; }
      if (e.target.closest('.aai-open')) { if (current.paste) copyPromptOnly(focus); setOpen(false); }
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var r = [].slice.call(menu.querySelectorAll('.aai-row')), i = r.indexOf(document.activeElement);
      e.preventDefault(); r[(i + (e.key === 'ArrowDown' ? 1 : r.length - 1) + r.length) % r.length].focus();
    });
    // page-level: Safari doesn't focus a button on a mouse click, so focus may be outside the menu
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); setOpen(false); pick.focus(); } });
    document.addEventListener('click', function (e) { if (!menu.hidden && !m.contains(e.target)) setOpen(false); });
  });
  window.__askAI = { prompt: prompt, getBrief: getBrief };   // for checks
})();
