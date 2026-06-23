/* CSEaesar - dashboard.js
 * Renders: hero stats, overall mastery ring, category bars, recommendations,
 * exam history, study notes, custom question bank status.
 */

(function () {
  'use strict';
  const A = window.App;

  // -------- Helpers --------
  function passBadge(passed) {
    return passed
      ? A.el('span', { class: 'badge badge-pass' }, 'Pass')
      : A.el('span', { class: 'badge badge-fail' }, 'Fail');
  }
  function colorForPercent(p) {
    if (p == null) return '';
    if (p >= 80) return 'pass';
    if (p >= 60) return 'caution';
    return 'fail';
  }
  function scoreText(c, t) { return c + ' / ' + t + ' (' + A.fmtPercent(c, t, 1) + ')'; }
  function getPriorityTag(avg) {
    if (avg == null) return { label: 'NO DATA', cls: 'badge-secondary' };
    if (avg < 60) return { label: 'HIGH', cls: 'badge-fail' };
    if (avg < 80) return { label: 'NEEDS REVIEW', cls: 'badge-caution' };
    return { label: 'GOOD', cls: 'badge-pass' };
  }

  // -------- Hero --------
  function renderHero(stats) {
    const root = document.getElementById('hero');
    if (!root) return;
    A.clear(root);

    const left = A.el('div', { class: 'flex flex-col justify-center space-y-4' });
    left.appendChild(A.el('div', { class: 'gold-rule' }));
    left.appendChild(A.el('h1', { class: 'text-display tagline' }, 'Veni, Vidi, Vici.'));
    left.appendChild(A.el('p', { class: 'text-body-lg text-muted' },
      'Your preparation for the Civil Service Examination demands discipline. ' +
      'Review your progress and continue your ascension.'));

    const cta = A.el('a', { class: 'btn btn-primary btn-lg', href: 'test.html' },
      'Start Practice Test');
    cta.style.marginTop = 'var(--space-4)';
    cta.style.alignSelf = 'flex-start';
    left.appendChild(cta);

    const right = A.el('div', { class: 'hero-stats' });
    const blocks = [
      ['Exams Taken',   stats.examsTaken,                       'text-primary'],
      ['Avg Score',     stats.totalItems ? (stats.avgPercent).toFixed(2) + '%' : '—', 'text-primary'],
      ['Best Score',    stats.bestPercent ? (stats.bestPercent).toFixed(2) + '%' : '—', 'text-secondary'],
      ['Next Exam',     null,                                   'text-primary'],
    ];

    blocks.forEach((b, i) => {
      const card = A.el('div', { class: 'card' + (i === 1 ? ' gold-left' : (i === 3 ? ' featured' : '')) });
      card.appendChild(A.el('span', { class: 'stat-label' }, b[0]));
      if (b[0] === 'Next Exam') {
        const date = A.el('span', { class: 'text-primary', style: 'font-family: var(--font-mono); font-size: 22px; font-weight: 700; white-space: nowrap; display: block;' }, 'Aug 9, 2026');
        card.appendChild(date);
        card.appendChild(A.el('span', { class: 'text-mono-sm text-muted' }, A.fmtDaysUntil('2026-08-09') + ' days remaining'));
      } else {
        card.appendChild(A.el('span', { class: 'stat-value ' + b[2] }, b[1]));
      }
      right.appendChild(card);
    });

    root.appendChild(left);
    root.appendChild(right);
  }

  // -------- Overall mastery ring --------
  function renderMastery(stats) {
    const root = document.getElementById('mastery');
    if (!root) return;
    A.clear(root);

    const card = A.el('div', { class: 'card flex flex-col items-center' });
    card.appendChild(A.el('h2', { class: 'card-title w-full text-center' }, 'Overall Mastery'));

    const ringWrap = A.el('div', { class: 'progress-ring' });
    const size = 180, r = 78, c = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, stats.avgPercent));
    const dash = (pct / 100) * c;
    const colorCls = colorForPercent(pct);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', String(size / 2));
    track.setAttribute('cy', String(size / 2));
    track.setAttribute('r', String(r));
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke-width', '8');
    track.setAttribute('class', 'progress-ring-track');
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fill.setAttribute('cx', String(size / 2));
    fill.setAttribute('cy', String(size / 2));
    fill.setAttribute('r', String(r));
    fill.setAttribute('fill', 'none');
    fill.setAttribute('stroke-width', '8');
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('class', 'progress-ring-fill ' + colorCls);
    fill.setAttribute('stroke-dasharray', dash + ' ' + c);
    svg.appendChild(track);
    svg.appendChild(fill);
    ringWrap.appendChild(svg);

    const val = A.el('div', { class: 'progress-ring-value' });
    val.appendChild(A.el('span', { class: 'num' }, stats.totalItems ? (stats.avgPercent).toFixed(1) + '%' : '—'));
    val.appendChild(A.el('span', { class: 'lbl' }, 'Average'));
    ringWrap.appendChild(val);

    card.appendChild(ringWrap);
    card.appendChild(A.el('div', { class: 'text-center mt-4' }, [
      A.el('div', { class: 'stat-value text-primary' }, String(stats.totalItems || 0)),
      A.el('div', { class: 'stat-label' }, 'Lifetime Questions'),
    ]));
    root.appendChild(card);
  }

  // -------- Category performance bars --------
  function renderCategoryBars(stats) {
    const root = document.getElementById('category-bars');
    if (!root) return;
    A.clear(root);

    const card = A.el('div', { class: 'card gold-top' });
    card.appendChild(A.el('h2', { class: 'card-title' }, 'Category Performance'));

    const wrap = A.el('div', { class: 'space-y-6' });
    Object.keys(A.CATEGORY_META).forEach(k => {
      const meta = A.CATEGORY_META[k];
      const avg = stats.catAverages[k];
      const cs = stats.catStats[k];
      const tag = getPriorityTag(avg);
      const row = A.el('div', { class: 'space-y-2' });

      const header = A.el('div', { class: 'flex justify-between items-center' });
      const left = A.el('div', { class: 'flex items-center gap-2' }, [
        A.el('span', { class: 'text-body', style: 'font-weight: 600;' }, meta.name),
        A.el('span', { class: 'badge ' + tag.cls }, tag.label),
      ]);
      const right = A.el('span', { class: 'text-mono text-primary', style: 'font-weight: 700;' },
        avg == null ? '—' : (avg).toFixed(2) + '%');
      header.appendChild(left);
      header.appendChild(right);
      row.appendChild(header);

      const bar = A.el('div', { class: 'progress-bar' });
      const fill = A.el('div', { class: 'progress-bar-fill ' + (avg == null ? '' : colorForPercent(avg)) });
      fill.style.width = (avg == null ? 0 : avg) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);

      const meta2 = A.el('div', { class: 'flex justify-between text-mono-sm text-muted' }, [
        A.el('span', null, cs ? (cs.correct + ' of ' + cs.total + ' correct') : 'no attempts yet'),
        A.el('span', null, cs && stats.lastAttemptByCat[k] ? 'last: ' + A.fmtRelative(stats.lastAttemptByCat[k]) : ''),
      ]);
      row.appendChild(meta2);

      wrap.appendChild(row);
    });
    card.appendChild(wrap);
    root.appendChild(card);
  }

  // -------- Recommendations --------
  function renderRecommendations(stats) {
    const root = document.getElementById('recommendations');
    if (!root) return;
    A.clear(root);
    if (!stats.examsTaken) {
      const card = A.el('div', { class: 'card' });
      card.appendChild(A.el('h2', { class: 'card-title' }, 'Strategic Insight'));
      card.appendChild(A.el('p', { class: 'text-body text-muted' },
        'No exams taken yet. Start a practice test to begin tracking your performance.'));
      root.appendChild(card);
      return;
    }

    const tips = [];
    const cats = Object.keys(A.CATEGORY_META);
    cats.forEach(k => {
      const avg = stats.catAverages[k];
      if (avg == null) return;
      const meta = A.CATEGORY_META[k];
      if (avg < 60) tips.push({
        icon: '\u26A0', priority: 'high',
        text: 'Your ' + meta.name + ' average is ' + (avg).toFixed(1) + '%. Focus your next sessions here.',
      });
      else if (avg < 80) tips.push({
        icon: '\u{1F4A1}', priority: 'med',
        text: 'Your ' + meta.name + ' average is ' + (avg).toFixed(1) + '%. A few targeted reviews will push it past 80%.',
      });
      else tips.push({
        icon: '\u2705', priority: 'good',
        text: meta.name + ': ' + (avg).toFixed(1) + '% average. You are consistently passing this section.',
      });
    });

    const lastDate = stats.lastAttemptByCat.verbal || stats.lastAttemptByCat.numerical || stats.lastAttemptByCat.analytical || stats.lastAttemptByCat.general;
    if (lastDate) {
      const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
      if (days >= 7) tips.push({ icon: '\u23F0', priority: 'med', text: 'It has been ' + days + ' days since your last attempt. Daily practice strengthens retention.' });
    }
    if (!tips.length) tips.push({ icon: '\u{1F4AA}', priority: 'good', text: 'Keep your momentum. Aim for at least 3 attempts per week.' });

    tips.sort((a, b) => ({ high: 0, med: 1, good: 2 }[a.priority]) - ({ high: 0, med: 1, good: 2 }[b.priority]));

    const card = A.el('div', { class: 'card' });
    card.appendChild(A.el('h2', { class: 'card-title' }, 'Strategic Insight'));
    tips.slice(0, 3).forEach(t => {
      const row = A.el('div', { class: 'insight mb-2' });
      row.appendChild(A.el('div', { class: 'insight-icon' }, t.icon));
      const c = A.el('div', { class: 'insight-content' });
      c.appendChild(A.el('p', { class: 'text-body' }, t.text));
      row.appendChild(c);
      card.appendChild(row);
    });
    root.appendChild(card);
  }

  // -------- History table --------
  function renderHistory(history) {
    const root = document.getElementById('history');
    if (!root) return;
    A.clear(root);
    const card = A.el('div', { class: 'card' });
    const titleRow = A.el('div', { class: 'flex justify-between items-center' });
    titleRow.appendChild(A.el('h2', { class: 'card-title', style: 'border: none; padding: 0; margin: 0;' }, 'Recent Campaigns'));
    if (history.length > 5) titleRow.appendChild(A.el('span', { class: 'text-mono-sm text-muted' }, history.length + ' total'));
    card.appendChild(titleRow);

    if (!history.length) {
      const empty = A.el('div', { class: 'empty-state' });
      empty.appendChild(A.el('div', { class: 'empty-state-icon' }, '\u{1F4DC}'));
      empty.appendChild(A.el('p', { class: 'text-body' }, 'No exams yet.'));
      empty.appendChild(A.el('p', { class: 'text-mono-sm text-muted mt-2' }, 'Take a practice test to see your campaigns here.'));
      card.appendChild(empty);
    } else {
      const tableWrap = A.el('div', { class: 'table-wrap' });
      const table = A.el('table', { class: 'table' });
      const thead = A.el('thead');
      const trh = A.el('tr');
      ['Date', 'Mode', 'Score', 'Time', 'Result', 'Actions'].forEach(h => {
        trh.appendChild(A.el('th', null, h));
      });
      thead.appendChild(trh);
      table.appendChild(thead);

      const tbody = A.el('tbody');
      history.slice(0, 20).forEach(rec => {
        const tr = A.el('tr');

        tr.appendChild(A.el('td', null, A.fmtRelative(rec.date)));

        const modeCell = A.el('td', null, rec.mode === 'mock' ? 'Full Mock' : (rec.totalItems + '-item Practice'));
        tr.appendChild(modeCell);

        const scoreCell = A.el('td', { class: rec.passed ? 'text-pass' : 'text-fail', style: 'font-weight: 700;' },
          scoreText(rec.totalCorrect, rec.totalItems));
        tr.appendChild(scoreCell);

        tr.appendChild(A.el('td', { class: 'text-muted' }, rec.timeTakenSeconds ? A.fmtMinutes(rec.timeTakenSeconds) : '—'));
        tr.appendChild(A.el('td', null, passBadge(rec.passed)));

        const actionCell = A.el('td', { class: 'text-right' });
        const delBtn = A.el('button', { class: 'icon-btn', 'aria-label': 'Delete record', title: 'Delete' });
        delBtn.innerHTML = '&times;';
        delBtn.style.fontSize = '20px';
        delBtn.addEventListener('click', async () => {
          const ok = await A.confirmModal('Delete this exam record? This cannot be undone.', { danger: true, okLabel: 'Delete' });
          if (!ok) return;
          A.deleteHistoryRecord(rec.id);
          render();
        });
        actionCell.appendChild(delBtn);
        tr.appendChild(actionCell);

        tr.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          tr.classList.toggle('expanded');
          const next = tr.nextElementSibling;
          if (next && next.classList.contains('detail-row')) {
            next.remove();
            return;
          }
          const detail = A.el('tr', { class: 'detail-row' });
          const td = A.el('td', { colspan: '6', style: 'background: var(--surface-low); padding: var(--space-4);' });
          if (rec.categories) {
            Object.keys(rec.categories).forEach(k => {
              const cs = rec.categories[k];
              if (!cs || !cs.total) return;
              const meta = A.CATEGORY_META[k];
              const row = A.el('div', { class: 'flex justify-between text-mono-sm', style: 'padding: 4px 0;' });
              row.appendChild(A.el('span', null, meta.name));
              row.appendChild(A.el('span', null, scoreText(cs.correct, cs.total)));
              td.appendChild(row);
            });
            if (rec.tabSwitches != null) {
              td.appendChild(A.el('div', { class: 'text-mono-sm text-muted mt-4' },
                'Tab switches: ' + rec.tabSwitches + (rec.tabSwitches === 0 ? ' (full focus)' : '')));
            }
          }
          detail.appendChild(td);
          tr.parentNode.insertBefore(detail, tr.nextSibling);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      card.appendChild(tableWrap);
    }
    root.appendChild(card);
  }

  // -------- Study notes --------
  function renderNotes() {
    const root = document.getElementById('notes');
    if (!root) return;
    A.clear(root);
    const card = A.el('div', { class: 'card gold-top' });
    card.appendChild(A.el('h2', { class: 'card-title' }, 'Scrolls of Knowledge'));

    const notes = A.getNotes();
    Object.keys(A.CATEGORY_META).forEach(k => {
      const meta = A.CATEGORY_META[k];
      const grp = A.el('div', { class: 'form-group' });
      const lbl = A.el('label', { class: 'form-label', for: 'note-' + k }, meta.name);
      grp.appendChild(lbl);
      const ta = A.el('textarea', {
        class: 'form-textarea',
        id: 'note-' + k,
        name: 'note-' + k,
        placeholder: 'Mnemonics, formulas, key laws...',
        'data-note-cat': k,
        rows: '3',
      });
      ta.value = notes[k] || '';
      let saveTimer;
      ta.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => A.saveNote(k, ta.value), 400);
      });
      grp.appendChild(ta);
      card.appendChild(grp);
    });
    root.appendChild(card);
  }

  // -------- Custom question bank status --------
  function renderCustomBank() {
    const root = document.getElementById('custom-bank');
    if (!root) return;
    A.clear(root);
    const card = A.el('div', { class: 'card' });
    card.appendChild(A.el('h2', { class: 'card-title' }, 'Custom Armory'));

    const built = A.getBuiltinQuestions().length;
    const custom = A.getCustomQuestions().length;
    const source = A.getSettings().questionSource || 'both';

    // Built-in row
    const row1 = A.el('div', { class: 'flex justify-between items-center muted-block' });
    row1.appendChild(A.el('div', null, [
      A.el('p', { class: 'text-body', style: 'font-weight: 600;' }, 'Built-in Bank'),
      A.el('p', { class: 'text-mono-sm text-muted' }, 'Loaded: ' + built + ' items'),
    ]));
    row1.appendChild(A.el('span', { class: 'badge ' + (source === 'custom' ? 'badge-secondary' : 'badge-primary') },
      source === 'custom' ? 'Off' : 'Active'));
    card.appendChild(row1);

    // Custom row
    const row2 = A.el('div', { class: 'flex justify-between items-center muted-block mt-2' });
    row2.appendChild(A.el('div', null, [
      A.el('p', { class: 'text-body', style: 'font-weight: 600;' }, 'Custom Bank'),
      A.el('p', { class: 'text-mono-sm text-muted' },
        custom ? ('Loaded: ' + custom + ' items') : 'No custom questions loaded yet'),
    ]));
    if (custom) {
      const actions = A.el('div', { class: 'flex items-center gap-2' });
      actions.appendChild(A.el('span', { class: 'badge ' + (source === 'builtin' ? 'badge-secondary' : 'badge-primary') },
        source === 'builtin' ? 'Off' : 'Active'));
      const rmBtn = A.el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove custom bank', title: 'Remove all' });
      rmBtn.innerHTML = A.ICONS.trash;
      rmBtn.addEventListener('click', async () => {
        const ok = await A.confirmModal('Remove all custom questions from this browser?', { danger: true, okLabel: 'Remove' });
        if (!ok) return;
        A.clearCustomQuestions();
        render();
      });
      actions.appendChild(rmBtn);
      row2.appendChild(actions);
    }
    card.appendChild(row2);

    // Loader row
    const loader = A.el('div', { class: 'mt-4' });
    const fileInput = A.el('input', {
      type: 'file', accept: 'application/json,.json',
      'aria-label': 'Choose custom questions JSON file',
      style: 'display: none;',
      id: 'custom-json-input',
    });
    const loadBtn = A.el('button', { class: 'btn btn-secondary btn-block', type: 'button' });
    loadBtn.innerHTML = A.ICONS.upload + 'Load Custom Questions (.json)';
    loadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleCustomFile);
    loader.appendChild(fileInput);
    loader.appendChild(loadBtn);

    // Paste-JSON section
    const pasteWrap = A.el('div', { style: 'margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px dashed var(--gold-line);' });
    const pasteLabel = A.el('label', { class: 'form-label', for: 'custom-json-paste' }, 'Or paste JSON');
    const pasteArea = A.el('textarea', {
      class: 'form-textarea',
      id: 'custom-json-paste',
      name: 'custom-json-paste',
      rows: '5',
      spellcheck: 'false',
      style: 'font-family: var(--font-mono); font-size: 12px; min-height: 120px;',
      placeholder: '[\n  { "id": "custom_v001", "category": "verbal", "subcategory": "synonyms", "question": "…", "choices": ["A. …", "B. …", "C. …", "D. …"], "answer": "B", "explanation": "…" }\n]',
    });
    const pasteActions = A.el('div', { class: 'flex gap-2', style: 'margin-top: var(--space-2); flex-wrap: wrap;' });
    const pasteBtn = A.el('button', { class: 'btn btn-primary', type: 'button' }, 'Load pasted JSON');
    const pasteSampleBtn = A.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Fill with sample');
    pasteBtn.addEventListener('click', () => {
      const text = pasteArea.value.trim();
      if (!text) { pasteArea.focus(); return; }
      loadJsonText(text, { onSuccess: () => { pasteArea.value = ''; } });
    });
    pasteSampleBtn.addEventListener('click', () => {
      pasteArea.value = JSON.stringify([
        { id: 'custom_v001', category: 'verbal', subcategory: 'synonyms',
          question: 'Choose a synonym for METICULOUS:',
          choices: ['A. Careless', 'B. Thorough', 'C. Quick', 'D. Loud'],
          answer: 'B', explanation: 'Meticulous = showing great attention to detail = thorough.' },
        { id: 'custom_n001', category: 'numerical', subcategory: 'arithmetic',
          question: 'A train travels 60 km in 1.5 hours. What is its average speed?',
          choices: ['A. 30 km/h', 'B. 40 km/h', 'C. 45 km/h', 'D. 50 km/h'],
          answer: 'B', explanation: 'Speed = distance / time = 60 / 1.5 = 40 km/h.' },
        { id: 'custom_g001', category: 'general', subcategory: 'ra_6713',
          question: 'RA 6713 requires public officials to file which document annually?',
          choices: ['A. ITR', 'B. SALN', 'C. PASSPORT', 'D. NBI CLEARANCE'],
          answer: 'B', explanation: 'SALN = Statement of Assets, Liabilities, and Net Worth, filed annually under RA 6713.' },
      ], null, 2);
    });
    pasteActions.appendChild(pasteBtn);
    pasteActions.appendChild(pasteSampleBtn);
    pasteWrap.appendChild(pasteLabel);
    pasteWrap.appendChild(pasteArea);
    pasteWrap.appendChild(pasteActions);
    loader.appendChild(pasteWrap);

    const sampleLink = A.el('p', { class: 'text-mono-sm text-muted mt-4' });
    const linkA = A.el('a', { href: '#', 'data-action': 'download-sample' }, 'Download sample JSON');
    linkA.addEventListener('click', (e) => { e.preventDefault(); downloadSampleJson(); });
    sampleLink.appendChild(document.createTextNode('Need a starting point? '));
    sampleLink.appendChild(linkA);
    sampleLink.appendChild(document.createTextNode('. '));
    const aiBtn = A.el('a', { href: '#', 'data-action': 'show-ai-prompt' }, 'Generate more with AI');
    aiBtn.addEventListener('click', (e) => { e.preventDefault(); showAiPromptModal(); });
    sampleLink.appendChild(aiBtn);
    sampleLink.appendChild(document.createTextNode('.'));
    loader.appendChild(sampleLink);

    card.appendChild(loader);
    root.appendChild(card);
  }

  // Shared loader: parse text, validate, save, show result.
  function loadJsonText(text, opts) {
    opts = opts || {};
    const parsed = A.parseCustomJsonText(text);
    if (!parsed.ok) {
      showLoadResult({ ok: false, issues: [parsed.error], totalSeen: 0, totalValid: 0 });
      return;
    }
    const result = A.validateCustomBank(parsed.data);
    if (result.ok) {
      A.saveCustomQuestions(result.valid);
      if (typeof opts.onSuccess === 'function') opts.onSuccess(result);
    }
    showLoadResult(result);
  }

  function handleCustomFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = ''; // allow re-load of same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadJsonText(String(reader.result || ''));
    reader.onerror = () => showLoadResult({ ok: false, issues: ['Could not read file.'], totalSeen: 0, totalValid: 0 });
    reader.readAsText(file);
  }

  function showLoadResult(result) {
    const back = A.el('div', { class: 'modal-backdrop' });
    const modal = A.el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const title = A.el('h3', { class: 'text-title mb-4' }, result.ok ? 'Custom questions loaded' : 'Could not load custom questions');
    modal.appendChild(title);
    const summary = A.el('p', { class: 'text-body mb-2' });
    summary.appendChild(A.el('strong', null,
      result.totalValid + ' valid' + (result.totalSeen ? ' of ' + result.totalSeen : '') + '.'));
    if (result.wrap) {
      const note = A.el('span', { class: 'text-mono-sm text-muted' }, ' Source: object.questions array.');
      summary.appendChild(note);
    }
    modal.appendChild(summary);
    if (result.issues && result.issues.length) {
      const head = A.el('p', { class: 'text-mono-sm text-caution mt-4' },
        result.issues.length + ' issue' + (result.issues.length === 1 ? '' : 's') + ':');
      modal.appendChild(head);
      const list = A.el('ul', { class: 'text-mono-sm', style: 'max-height: 200px; overflow-y: auto; padding-left: 1.2em; margin: 4px 0 0; color: var(--on-surface-variant);' });
      result.issues.slice(0, 50).forEach(msg => list.appendChild(A.el('li', null, msg)));
      modal.appendChild(list);
      if (result.issues.length > 50) {
        modal.appendChild(A.el('p', { class: 'text-mono-sm text-muted' }, '\u2026and ' + (result.issues.length - 50) + ' more.'));
      }
    }
    if (result.ok) {
      const tip = A.el('p', { class: 'text-mono-sm text-muted mt-4' },
        'These questions are now available in Practice and Mock exams. Use the Practice Test page → "Source" option to filter Built-in / Custom / Both.');
      modal.appendChild(tip);
    }
    const actions = A.el('div', { class: 'flex justify-content mt-8' });
    actions.style.justifyContent = 'flex-end';
    const ok = A.el('button', { class: 'btn btn-primary', type: 'button' }, 'Done');
    ok.addEventListener('click', () => { document.body.removeChild(back); render(); });
    actions.appendChild(ok);
    modal.appendChild(actions);
    back.appendChild(modal);
    back.addEventListener('click', (e) => { if (e.target === back) { document.body.removeChild(back); render(); } });
    document.body.appendChild(back);
  }

  function downloadSampleJson() {
    const sample = [
      { id: 'custom_v001', category: 'verbal', subcategory: 'synonyms',
        question: 'Choose a synonym for METICULOUS:',
        choices: ['A. Careless', 'B. Thorough', 'C. Quick', 'D. Loud'],
        answer: 'B', explanation: 'Meticulous = showing great attention to detail = thorough.' },
      { id: 'custom_n001', category: 'numerical', subcategory: 'arithmetic',
        question: 'A train travels 60 km in 1.5 hours. What is its average speed?',
        choices: ['A. 30 km/h', 'B. 40 km/h', 'C. 45 km/h', 'D. 50 km/h'],
        answer: 'B', explanation: 'Speed = distance / time = 60 / 1.5 = 40 km/h.' },
      { id: 'custom_g001', category: 'general', subcategory: 'ra_6713',
        question: 'RA 6713 requires public officials to file which document annually?',
        choices: ['A. ITR', 'B. SALN', 'C. PASSPORT', 'D. NBI CLEARANCE'],
        answer: 'B', explanation: 'SALN = Statement of Assets, Liabilities, and Net Worth, filed annually under RA 6713.' },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cseasar-sample-questions.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  const LLM_PROMPT_SPECIFIC = 'Generate {N} Philippine Civil Service Exam (CSE-PPT Professional level) questions for the {CATEGORY} category, on the subtopic {SUBTOPIC}.\n\nReturn ONLY a valid JSON array. No explanation, no markdown, no preamble. Each object must have these exact fields:\n\n- id: string (e.g. "custom_v001", increment per item)\n- category: one of "verbal" | "numerical" | "analytical" | "general"\n- subcategory: string (e.g. "synonyms", "word_problems", "ra_6713")\n- question: string\n- choices: array of exactly 4 strings, each starting with "A. ", "B. ", "C. ", "D. "\n- answer: one of "A" | "B" | "C" | "D"\n- explanation: string (brief explanation of the correct answer)\n\nMatch the difficulty level of the actual Philippine CSE Professional exam: items should test reasoning, not just recall. Avoid trick questions. For Filipino items, use natural, conversational Filipino — not overly formal or archaic. For general-information items, prefer Republic Acts and the 1987 Constitution over obscure trivia.';

  const LLM_PROMPT_MIXED = 'Generate {N} Philippine Civil Service Exam (CSE-PPT Professional level) questions distributed roughly evenly across all four categories: verbal, numerical, analytical, and general (about a quarter each). If you picked a subtopic above, weight that category slightly higher.\n\nReturn ONLY a valid JSON array. No explanation, no markdown, no preamble. Each object must have these exact fields:\n\n- id: string (e.g. "custom_m001", increment per item)\n- category: one of "verbal" | "numerical" | "analytical" | "general"\n- subcategory: string (e.g. "synonyms", "word_problems", "ra_6713")\n- question: string\n- choices: array of exactly 4 strings, each starting with "A. ", "B. ", "C. ", "D. "\n- answer: one of "A" | "B" | "C" | "D"\n- explanation: string (brief explanation of the correct answer)\n\nMatch the difficulty level of the actual Philippine CSE Professional exam: items should test reasoning, not just recall. Avoid trick questions. For Filipino items, use natural, conversational Filipino — not overly formal or archaic. For general-information items, prefer Republic Acts and the 1987 Constitution over obscure trivia.';

  // Subtopic options per category (key = category value or 'all')
  const SUBTOPIC_OPTIONS = {
    all: [
      { v: 'mixed', l: 'Mixed across all four categories' },
      { v: 'mixed_verbal', l: 'Mixed Verbal' },
      { v: 'mixed_numerical', l: 'Mixed Numerical' },
      { v: 'mixed_analytical', l: 'Mixed Analytical' },
      { v: 'mixed_general', l: 'Mixed General' },
    ],
    verbal: [
      { v: 'synonyms', l: 'Synonyms' },
      { v: 'antonyms', l: 'Antonyms' },
      { v: 'analogies', l: 'Analogies' },
      { v: 'grammar', l: 'Grammar & Correct Usage' },
      { v: 'vocabulary', l: 'Vocabulary' },
      { v: 'reading_comprehension', l: 'Reading Comprehension' },
      { v: 'idioms', l: 'Idioms' },
      { v: 'filipino', l: 'Filipino (Salawikain, Sawikain, Pagbasa)' },
    ],
    numerical: [
      { v: 'arithmetic', l: 'Arithmetic' },
      { v: 'word_problems', l: 'Word Problems' },
      { v: 'number_series', l: 'Number Series & Sequences' },
      { v: 'ratio_proportion', l: 'Ratio & Proportion' },
      { v: 'geometry', l: 'Geometry & Measurement' },
    ],
    analytical: [
      { v: 'syllogism', l: 'Syllogisms & Logical Reasoning' },
      { v: 'data_interpretation', l: 'Data Interpretation' },
      { v: 'pattern', l: 'Pattern Recognition' },
      { v: 'logic_puzzles', l: 'Logic Puzzles' },
    ],
    general: [
      { v: 'constitution', l: '1987 Constitution' },
      { v: 'ra_6713', l: 'RA 6713 — Code of Conduct' },
      { v: 'ra_3019', l: 'RA 3019 — Anti-Graft' },
      { v: 'ra_10173', l: 'RA 10173 — Data Privacy' },
      { v: 'ra_11032', l: 'RA 11032 — Ease of Doing Business' },
      { v: 'history', l: 'Philippine History' },
      { v: 'environment', l: 'Environmental Management' },
      { v: 'government', l: 'Government Structure' },
      { v: 'economics', l: 'Economics' },
      { v: 'international', l: 'International / Current Events' },
    ],
  };

  function buildPrompt(opts) {
    const n = opts.n || 20;
    const cat = opts.category || 'numerical';
    const sub = opts.subtopic || 'word_problems';
    const template = (cat === 'all') ? LLM_PROMPT_MIXED : LLM_PROMPT_SPECIFIC;
    return template
      .replace('{N}', String(n))
      .replace('{CATEGORY}', cat)
      .replace('{SUBTOPIC}', sub);
  }

  function showAiPromptModal() {
    const back = A.el('div', { class: 'modal-backdrop' });
    const modal = A.el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    modal.style.maxWidth = '640px';

    const head = A.el('div', { class: 'flex items-center gap-2 mb-4' });
    const headIcon = A.el('span', { style: 'color: var(--secondary);' });
    headIcon.innerHTML = A.ICONS.sparkle;
    head.appendChild(headIcon);
    head.appendChild(A.el('h3', { class: 'text-title', style: 'margin: 0;' }, 'Generate more questions with AI'));
    modal.appendChild(head);

    modal.appendChild(A.el('p', { class: 'text-body text-muted mb-4' },
      'Paste this prompt into Claude, ChatGPT, Gemini, or your favorite LLM. Adjust the count, category, and subtopic, then paste the JSON output back into the loader.'));

    // Inputs row
    const inputs = A.el('div', { class: 'grid', style: 'grid-template-columns: 1fr 2fr 2fr; gap: var(--space-3); margin-bottom: var(--space-4);' });

    const nGroup = A.el('div', { class: 'form-group', style: 'margin: 0;' });
    nGroup.appendChild(A.el('label', { class: 'form-label', for: 'ai-n' }, 'Count'));
    const nInput = A.el('input', { type: 'number', min: '1', max: '200', value: '20', id: 'ai-n', class: 'form-input' });
    nGroup.appendChild(nInput);
    inputs.appendChild(nGroup);

    const catGroup = A.el('div', { class: 'form-group', style: 'margin: 0;' });
    catGroup.appendChild(A.el('label', { class: 'form-label', for: 'ai-cat' }, 'Category'));
    const catSel = A.el('select', { id: 'ai-cat', class: 'form-select' });
    [
      { v: 'verbal', l: 'Verbal Ability' },
      { v: 'numerical', l: 'Numerical Ability' },
      { v: 'analytical', l: 'Analytical Ability' },
      { v: 'general', l: 'General Information' },
      { v: 'all', l: 'All Categories' },
    ].forEach(o => catSel.appendChild(A.el('option', { value: o.v }, o.l)));
    catGroup.appendChild(catSel);
    inputs.appendChild(catGroup);

    const subGroup = A.el('div', { class: 'form-group', style: 'margin: 0;' });
    subGroup.appendChild(A.el('label', { class: 'form-label', for: 'ai-sub' }, 'Subtopic'));
    const subSel = A.el('select', { id: 'ai-sub', class: 'form-select' });
    subGroup.appendChild(subSel);
    inputs.appendChild(subGroup);

    modal.appendChild(inputs);

    function refreshSubtopics() {
      const cat = catSel.value;
      const opts = SUBTOPIC_OPTIONS[cat] || SUBTOPIC_OPTIONS.all;
      A.clear(subSel);
      opts.forEach(o => subSel.appendChild(A.el('option', { value: o.v }, o.l)));
      // Preserve selection if it exists in the new options
      if (!opts.find(o => o.v === subSel.value)) {
        subSel.value = opts[0].v;
      }
    }
    catSel.addEventListener('change', () => { refreshSubtopics(); refresh(); });
    refreshSubtopics();

    const promptBox = A.el('pre', {
      class: 'text-mono-sm',
      style: 'background: var(--surface-high); padding: var(--space-3); border-radius: var(--r-md); max-height: 240px; overflow: auto; white-space: pre-wrap; word-break: break-word; border: 1px solid var(--gold-line);',
      id: 'ai-prompt-text',
    });
    modal.appendChild(promptBox);

    function refresh() {
      promptBox.textContent = buildPrompt({
        n: parseInt(nInput.value, 10) || 20,
        category: catSel.value,
        subtopic: subSel.value,
      });
    }
    nInput.addEventListener('input', refresh);
    subSel.addEventListener('change', refresh);
    refresh();

    const actions = A.el('div', { class: 'flex', style: 'justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4);' });
    const closeBtn = A.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Close');
    closeBtn.addEventListener('click', () => { document.body.removeChild(back); });
    const copyBtn = A.el('button', { class: 'btn btn-primary', type: 'button' }, 'Copy prompt');
    copyBtn.addEventListener('click', async () => {
      const text = promptBox.textContent;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy prompt'; }, 1500);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); copyBtn.textContent = 'Copied!'; }
        catch (e2) { copyBtn.textContent = 'Copy failed'; }
        setTimeout(() => { copyBtn.textContent = 'Copy prompt'; }, 1500);
        document.body.removeChild(ta);
      }
    });
    actions.appendChild(closeBtn);
    actions.appendChild(copyBtn);
    modal.appendChild(actions);

    back.appendChild(modal);
    back.addEventListener('click', (e) => { if (e.target === back) document.body.removeChild(back); });
    document.body.appendChild(back);
  }

  // -------- Master render --------
  function render() {
    const stats = A.computeStats();
    renderHero(stats);
    renderMastery(stats);
    renderCategoryBars(stats);
    renderRecommendations(stats);
    renderHistory(A.getHistory());
    renderNotes();
    renderCustomBank();
  }

  A.onReady(() => {
    A.renderNavbar('dashboard');
    A.renderFooter();
    render();
  });
})();
