/* CSEaesar - app.js
 * Shared utilities: storage, shuffle, theme, formatters, data access.
 * Exposed as window.App.* for use by page scripts.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    HISTORY: 'cseasar_history',
    NOTES: 'cseasar_notes',
    CUSTOM_Q: 'cseasar_custom_questions',
    SETTINGS: 'cseasar_settings',
  };

  const PASS_THRESHOLD = 80.0;

  const CATEGORY_META = {
    verbal:     { name: 'Verbal Ability',     color: 'var(--primary)',   short: 'VER' },
    numerical:  { name: 'Numerical Ability',  color: 'var(--pass)',      short: 'NUM' },
    analytical: { name: 'Analytical Ability', color: 'var(--caution)',   short: 'ANL' },
    general:    { name: 'General Information',color: 'var(--secondary)', short: 'GEN' },
  };

  const SETTINGS_DEFAULTS = {
    darkMode: false,
    defaultMode: 'practice',
    defaultItemCount: 30,
    questionSource: 'both',
  };

  // -------- Storage helpers --------
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('readJSON failed for', key, e);
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('writeJSON failed for', key, e);
      return false;
    }
  }

  function getSettings() {
    return Object.assign({}, SETTINGS_DEFAULTS, readJSON(STORAGE_KEYS.SETTINGS, {}));
  }
  function setSettings(patch) {
    const next = Object.assign({}, getSettings(), patch);
    return writeJSON(STORAGE_KEYS.SETTINGS, next);
  }

  function getHistory() {
    return readJSON(STORAGE_KEYS.HISTORY, []);
  }
  function addHistoryRecord(record) {
    const list = getHistory();
    list.unshift(record);
    writeJSON(STORAGE_KEYS.HISTORY, list);
  }
  function deleteHistoryRecord(id) {
    const list = getHistory().filter(r => r.id !== id);
    writeJSON(STORAGE_KEYS.HISTORY, list);
  }
  function clearHistory() { writeJSON(STORAGE_KEYS.HISTORY, []); }

  function getNotes() { return readJSON(STORAGE_KEYS.NOTES, {}); }
  function saveNote(category, value) {
    const notes = getNotes();
    notes[category] = value;
    writeJSON(STORAGE_KEYS.NOTES, notes);
  }

  // -------- Icons (inline SVG) --------
  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    flagFilled: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    alert: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
    scroll: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 3H8a2 2 0 0 0-2 2v14"/></svg>',
    database: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></svg>',
    focus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7z"/><path d="M19 16l.8 2.5L22 19l-2.2.5L19 22l-.8-2.5L16 19l2.2-.5z"/></svg>',
  };

  // -------- Theme --------
  function applyTheme(dark) {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    setSettings({ darkMode: !!dark });
    const icon = document.querySelector('[data-theme-icon]');
    if (icon) icon.innerHTML = dark ? ICONS.sun : ICONS.moon;
    const lbl = document.querySelector('[data-theme-label]');
    if (lbl) lbl.textContent = dark ? 'Light' : 'Dark';
  }
  function initTheme() {
    const settings = getSettings();
    applyTheme(settings.darkMode);
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-theme-toggle]');
      if (!t) return;
      e.preventDefault();
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(!isDark);
    });
  }

  // -------- Fisher-Yates shuffle --------
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // -------- Formatters --------
  function fmtPercent(num, denom, digits) {
    if (!denom) return '0.00%';
    const d = digits == null ? 2 : digits;
    return ((num / denom) * 100).toFixed(d) + '%';
  }
  function fmtScoreFraction(correct, total) {
    return correct + ' / ' + total + ' (' + fmtPercent(correct, total, 2) + ')';
  }
  function fmtSeconds(s) {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
  }
  function fmtMinutes(s) {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + 'm ' + sec + 's';
  }
  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return iso; }
  }
  function fmtRelative(iso) {
    try {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      const days = Math.floor(diff / 86400);
      if (days < 30) return days + 'd ago';
      return fmtDate(iso);
    } catch (e) { return iso; }
  }
  function fmtDaysUntil(targetIso) {
    const t = new Date(targetIso).getTime();
    const d = Math.max(0, Math.ceil((t - Date.now()) / 86400000));
    return d;
  }

  // -------- Question bank access --------
  function getBuiltinQuestions() {
    return (window.CSEAESAR_QUESTIONS || []).slice();
  }
  function getCustomQuestions() {
    return readJSON(STORAGE_KEYS.CUSTOM_Q, []);
  }
  function getSourceQuestions() {
    const source = (getSettings().questionSource || 'both');
    if (source === 'builtin') return getBuiltinQuestions();
    if (source === 'custom') return getCustomQuestions();
    return getBuiltinQuestions().concat(getCustomQuestions());
  }
  function getAllQuestions() {
    // Always return full bank (used by stats). Source-filtered queries use getSourceQuestions().
    return getBuiltinQuestions().concat(getCustomQuestions());
  }
  function getQuestionsByCategory(categories) {
    const cats = Array.isArray(categories) ? categories : [categories];
    return getSourceQuestions().filter(q => cats.indexOf(q.category) !== -1);
  }
  function pickQuestions(opts) {
    const cats = opts.categories && opts.categories.length ? opts.categories : ['verbal', 'numerical', 'analytical', 'general'];
    const pool = getQuestionsByCategory(cats);
    const shuffled = shuffle(pool);
    const count = Math.max(1, Math.min(opts.count || shuffled.length, shuffled.length));
    return shuffled.slice(0, count);
  }

  // -------- Custom JSON validation (PLAN §7 schema) --------
  const VALID_CATEGORIES = ['verbal', 'numerical', 'analytical', 'general'];
  const VALID_ANSWERS = ['A', 'B', 'C', 'D'];
  function validateCustomQuestion(raw, index) {
    const issues = [];
    if (!raw || typeof raw !== 'object') { issues.push('item ' + (index + 1) + ': not an object'); return null; }
    if (typeof raw.id !== 'string' || !raw.id.trim()) issues.push('item ' + (index + 1) + ': missing or empty `id`');
    if (VALID_CATEGORIES.indexOf(raw.category) === -1) issues.push('item ' + (index + 1) + ': `category` must be verbal|numerical|analytical|general (got ' + JSON.stringify(raw.category) + ')');
    if (typeof raw.subcategory !== 'string' || !raw.subcategory.trim()) issues.push('item ' + (index + 1) + ': missing `subcategory`');
    if (typeof raw.question !== 'string' || !raw.question.trim()) issues.push('item ' + (index + 1) + ': missing `question`');
    if (!Array.isArray(raw.choices) || raw.choices.length !== 4) {
      issues.push('item ' + (index + 1) + ': `choices` must be an array of exactly 4 strings');
    } else {
      raw.choices.forEach((c, i) => {
        if (typeof c !== 'string') issues.push('item ' + (index + 1) + ': choice ' + (i + 1) + ' is not a string');
        else if (!/^[A-D]\.\s/.test(c)) issues.push('item ' + (index + 1) + ': choice ' + (i + 1) + ' must start with "A. "/"B. "/"C. "/"D. " (got: ' + JSON.stringify(c.slice(0, 12)) + ')');
      });
    }
    if (VALID_ANSWERS.indexOf(raw.answer) === -1) issues.push('item ' + (index + 1) + ': `answer` must be A|B|C|D (got ' + JSON.stringify(raw.answer) + ')');
    if (issues.length) return { issues, raw };
    return { issues: null, raw: raw };
  }
  function validateCustomBank(parsed) {
    let arr = null;
    let wrap = null;
    if (Array.isArray(parsed)) arr = parsed;
    else if (parsed && Array.isArray(parsed.questions)) { arr = parsed.questions; wrap = 'object.questions'; }
    if (!arr) return { ok: false, valid: [], issues: ['Top-level must be a JSON array, or an object with a `questions` array.'], totalSeen: 0, totalValid: 0 };
    const issues = [];
    const valid = [];
    const seenIds = {};
    arr.forEach((raw, i) => {
      const r = validateCustomQuestion(raw, i);
      if (!r) return;
      if (r.issues) { issues.push.apply(issues, r.issues); return; }
      if (Object.prototype.hasOwnProperty.call(seenIds, raw.id)) { issues.push('item ' + (i + 1) + ': duplicate id `' + raw.id + '` (first seen at item ' + (seenIds[raw.id] + 1) + ')'); return; }
      seenIds[raw.id] = i;
      valid.push(raw);
    });
    if (arr.length && valid.length === 0 && issues.length === 0) {
      issues.push('No valid questions found.');
    }
    return { ok: valid.length > 0, valid, issues, totalSeen: arr.length, totalValid: valid.length, wrap };
  }
  function saveCustomQuestions(arr) {
    return writeJSON(STORAGE_KEYS.CUSTOM_Q, arr);
  }
  function clearCustomQuestions() {
    return writeJSON(STORAGE_KEYS.CUSTOM_Q, []);
  }
  function parseCustomJsonText(text) {
    try { return { ok: true, data: JSON.parse(text) }; }
    catch (e) { return { ok: false, error: 'Invalid JSON: ' + e.message }; }
  }

  // -------- Stats / history analysis --------
  function computeStats() {
    const history = getHistory();
    const examsTaken = history.length;
    let totalCorrect = 0;
    let totalItems = 0;
    let bestPercent = 0;
    const catStats = { verbal: { correct: 0, total: 0 }, numerical: { correct: 0, total: 0 }, analytical: { correct: 0, total: 0 }, general: { correct: 0, total: 0 } };
    let lastAttemptByCat = { verbal: null, numerical: null, analytical: null, general: null };

    history.forEach((rec, idx) => {
      totalCorrect += rec.totalCorrect;
      totalItems += rec.totalItems;
      if (rec.scorePercent > bestPercent) bestPercent = rec.scorePercent;
      Object.keys(catStats).forEach(k => {
        if (rec.categories && rec.categories[k]) {
          catStats[k].correct += rec.categories[k].correct;
          catStats[k].total += rec.categories[k].total;
          if (idx === 0) lastAttemptByCat[k] = rec.date;
        }
      });
    });

    const avgPercent = totalItems ? (totalCorrect / totalItems) * 100 : 0;
    const catAverages = {};
    Object.keys(catStats).forEach(k => {
      const cs = catStats[k];
      catAverages[k] = cs.total ? (cs.correct / cs.total) * 100 : null;
    });

    return {
      examsTaken,
      totalCorrect,
      totalItems,
      avgPercent,
      bestPercent,
      catStats,
      catAverages,
      lastAttemptByCat,
    };
  }

  // -------- Choice parsing --------
  function splitChoice(c) {
    const m = /^([A-D])\.\s*(.*)$/.exec(c || '');
    if (m) return { letter: m[1], text: m[2] };
    return { letter: '', text: c || '' };
  }

  // -------- Small DOM helpers --------
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(k => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        if (typeof c === 'string' || typeof c === 'number') {
          node.appendChild(document.createTextNode(String(c)));
        } else {
          node.appendChild(c);
        }
      });
    }
    return node;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // -------- Confirm modal --------
  function confirmModal(message, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const back = el('div', { class: 'modal-backdrop' });
      const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
      modal.appendChild(el('h3', { class: 'text-title mb-4' }, opts.title || 'Confirm'));
      modal.appendChild(el('p', { class: 'text-body mb-8', text: message }));
      const actions = el('div', { class: 'flex gap-3 justify-content' });
      const cancel = el('button', { class: 'btn btn-ghost' }, 'Cancel');
      const ok = el('button', { class: 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') }, opts.okLabel || 'Confirm');
      actions.style.justifyContent = 'flex-end';
      actions.appendChild(cancel);
      actions.appendChild(ok);
      modal.appendChild(actions);
      back.appendChild(modal);
      document.body.appendChild(back);
      function close(result) { document.body.removeChild(back); resolve(result); }
      cancel.addEventListener('click', () => close(false));
      ok.addEventListener('click', () => close(true));
      back.addEventListener('click', (e) => { if (e.target === back) close(false); });
    });
  }

  // -------- Build navbar (shared between pages) --------
  function renderNavbar(active) {
    const existing = document.querySelector('[data-navbar]');
    if (existing) return; // don't double-render
    const header = el('header', { class: 'navbar' });
    header.setAttribute('data-navbar', '');
    const inner = el('div', { class: 'container navbar-inner' });
    const logo = el('a', { class: 'navbar-logo', href: 'index.html' }, 'CSEaesar');
    const links = el('nav', { class: 'navbar-links', 'aria-label': 'Main' });
    const linkDashboard = el('a', { class: 'nav-link' + (active === 'dashboard' ? ' active' : ''), href: 'index.html' }, 'Dashboard');
    const linkTest = el('a', { class: 'nav-link' + (active === 'test' ? ' active' : ''), href: 'test.html' }, 'Practice Test');
    links.appendChild(linkDashboard);
    links.appendChild(linkTest);
    const actions = el('div', { class: 'navbar-actions' });
    const themeBtn = el('button', { class: 'icon-btn', type: 'button', 'data-theme-toggle': '', 'aria-label': 'Toggle dark mode', title: 'Toggle dark mode' });
    const themeIcon = el('span', { 'data-theme-icon': '', 'aria-hidden': 'true' });
    themeIcon.innerHTML = ICONS.moon;
    themeBtn.appendChild(themeIcon);
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(!isDark);
    });
    actions.appendChild(themeBtn);
    inner.appendChild(logo);
    inner.appendChild(links);
    inner.appendChild(actions);
    header.appendChild(inner);
    document.body.insertBefore(header, document.body.firstChild);
  }

  function renderFooter() {
    const existing = document.querySelector('[data-footer]');
    if (existing) return;
    const footer = el('footer', { class: 'footer' });
    footer.setAttribute('data-footer', '');
    const inner = el('div', { class: 'container footer-inner' });
    const brand = el('span', { class: 'navbar-logo' }, 'CSEaesar');
    const copy = el('span', null, '\u00A9 ' + new Date().getFullYear() + ' CSEaesar. Ascension through Discipline.');
    const readme = el('a', { href: 'README.html', 'aria-label': 'View README and LLM prompt template' }, 'README');
    inner.appendChild(brand);
    inner.appendChild(copy);
    inner.appendChild(readme);
    footer.appendChild(inner);
    document.body.appendChild(footer);
  }

  // -------- Export --------
  window.App = {
    STORAGE_KEYS,
    PASS_THRESHOLD,
    CATEGORY_META,
    SETTINGS_DEFAULTS,
    ICONS,
    readJSON, writeJSON,
    getSettings, setSettings,
    getHistory, addHistoryRecord, deleteHistoryRecord, clearHistory,
    getNotes, saveNote,
    applyTheme, initTheme,
    shuffle,
    fmtPercent, fmtScoreFraction, fmtSeconds, fmtMinutes, fmtDate, fmtRelative, fmtDaysUntil,
    getBuiltinQuestions, getCustomQuestions, getSourceQuestions, getAllQuestions, getQuestionsByCategory, pickQuestions,
    saveCustomQuestions, clearCustomQuestions, parseCustomJsonText, validateCustomBank, validateCustomQuestion,
    VALID_CATEGORIES, VALID_ANSWERS,
    computeStats,
    splitChoice,
    el, clear, onReady, confirmModal,
    renderNavbar, renderFooter,
  };
})();
