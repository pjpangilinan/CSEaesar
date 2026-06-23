/* CSEaesar - test.js
 * Phase 1: configuration screen, Q&A flow, scoring, history save.
 * Phase 2 will add: circular timer, tab detection, flag, answer review.
 */

(function () {
  'use strict';
  const A = window.App;

  // -------- State --------
  const MOCK_DURATION = 3 * 3600 + 10 * 60; // 3h 10m
  const MOCK_TOTAL = 170;
  const ITEM_OPTIONS = [15, 30, 45, 70];

  const state = {
    questions: [],
    current: 0,
    answers: {},      // { qIdx: 'A' | 'B' | 'C' | 'D' | null }
    flagged: {},      // { qIdx: true }
    startEpoch: null,
    endEpoch: null,
    mockDuration: 0,
    mode: 'practice',
    timerInterval: null,
    timerRemaining: 0,
    tabSwitches: 0,
    visibilityHandler: null,
  };

  // Cached DOM refs for the active exam. Rebuilt only when the question set
  // changes (new exam / retake). Per-question view changes patch in place.
  const view = {
    built: false,
    questionLen: 0,
    counter: null,
    catTag: null,
    elapsed: null,
    questionText: null,
    choicesBox: null,
    flagBtn: null,
    progressFill: null,
    navStats: null,
    prevBtn: null,
    nextBtn: null,
    navCells: [],
  };

  // -------- Config screen --------
  function renderConfig() {
    const root = document.getElementById('test-root');
    A.clear(root);
    const settings = A.getSettings();

    const wrap = A.el('div', { class: 'flex flex-col items-center', style: 'max-width: 720px; margin: 0 auto;' });
    wrap.appendChild(A.el('div', { class: 'gold-rule' }));
    wrap.appendChild(A.el('h1', { class: 'text-display text-primary', style: 'margin-bottom: var(--space-3); text-align: center;' }, 'Configure Your Trial'));
    wrap.appendChild(A.el('p', { class: 'text-body text-muted text-center mb-8' },
      'Select your parameters before entering the testing environment.'));

    const grid = A.el('div', { class: 'grid', style: 'gap: var(--space-6); grid-template-columns: 1fr;' });

    // Mode card
    const modeCard = A.el('div', { class: 'card' });
    modeCard.appendChild(A.el('h2', { class: 'card-title' }, '1. Mode'));
    const modeGroup = A.el('div', { class: 'form-radio-group' });
    const opts = [
      { v: 'practice', t: 'Practice Mode', d: 'Choose categories and item count. No timer pressure.' },
      { v: 'mock', t: 'Mock Exam', d: MOCK_TOTAL + ' items, 3h 10min, all categories, strict timer.' },
    ];
    opts.forEach(o => {
      const lbl = A.el('label', { class: 'form-radio' + (settings.defaultMode === o.v ? ' selected' : '') });
      lbl.dataset.value = o.v;
      const inp = A.el('input', { type: 'radio', name: 'mode', value: o.v, 'aria-label': o.t });
      if (settings.defaultMode === o.v) inp.checked = true;
      inp.addEventListener('change', () => {
        modeGroup.querySelectorAll('.form-radio').forEach(r => r.classList.remove('selected'));
        lbl.classList.add('selected');
        A.setSettings({ defaultMode: o.v });
        updateConfigUI();
      });
      lbl.appendChild(inp);
      const txt = A.el('div', { class: 'form-radio-text' });
      txt.appendChild(A.el('strong', null, o.t));
      txt.appendChild(A.el('small', null, o.d));
      lbl.appendChild(txt);
      modeGroup.appendChild(lbl);
    });
    modeCard.appendChild(modeGroup);
    grid.appendChild(modeCard);

    // Categories card (practice only)
    const catCard = A.el('div', { class: 'card', id: 'cat-card' });
    catCard.appendChild(A.el('h2', { class: 'card-title' }, '2. Categories'));
    const catGroup = A.el('div', { class: 'form-radio-group' });
    const catOpts = [
      { v: ['verbal', 'numerical', 'analytical', 'general'], t: 'All Categories' },
      { v: ['verbal'], t: 'Verbal Ability' },
      { v: ['numerical'], t: 'Numerical Ability' },
      { v: ['analytical'], t: 'Analytical Ability' },
      { v: ['general'], t: 'General Information' },
    ];
    catOpts.forEach((o, i) => {
      const lbl = A.el('label', { class: 'form-radio' + (i === 0 ? ' selected' : '') });
      lbl.dataset.value = JSON.stringify(o.v);
      const inp = A.el('input', { type: 'radio', name: 'cats', value: i, checked: i === 0 ? '' : null, 'aria-label': o.t });
      inp.addEventListener('change', () => {
        catGroup.querySelectorAll('.form-radio').forEach(r => r.classList.remove('selected'));
        lbl.classList.add('selected');
        A.setSettings({ defaultCats: o.v });
      });
      lbl.appendChild(inp);
      const txt = A.el('div', { class: 'form-radio-text' });
      txt.appendChild(A.el('strong', null, o.t));
      const counts = o.v.map(c => A.getQuestionsByCategory(c).length).reduce((a, b) => a + b, 0);
      txt.appendChild(A.el('small', null, counts + ' items available'));
      lbl.appendChild(txt);
      catGroup.appendChild(lbl);
    });
    catCard.appendChild(catGroup);
    grid.appendChild(catCard);

    // Item count card (practice only)
    const cntCard = A.el('div', { class: 'card', id: 'cnt-card' });
    cntCard.appendChild(A.el('h2', { class: 'card-title' }, '3. Item Count'));
    const chipGroup = A.el('div', { class: 'chip-group' });
    ITEM_OPTIONS.forEach(n => {
      const lbl = A.el('label', { class: 'chip' + (settings.defaultItemCount === n ? ' selected' : '') });
      lbl.dataset.value = String(n);
      const inp = A.el('input', { type: 'radio', name: 'count', value: n, 'aria-label': n + ' items' });
      if (settings.defaultItemCount === n) inp.checked = true;
      inp.addEventListener('change', () => {
        chipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        lbl.classList.add('selected');
        A.setSettings({ defaultItemCount: n });
      });
      lbl.appendChild(inp);
      lbl.appendChild(A.el('span', null, n + ' items'));
      chipGroup.appendChild(lbl);
    });
    cntCard.appendChild(chipGroup);
    cntCard.appendChild(A.el('p', { class: 'text-mono-sm text-muted mt-4', id: 'count-hint' }, ''));
    grid.appendChild(cntCard);

    // Source card (only if custom questions exist)
    const customCount = A.getCustomQuestions().length;
    const srcCard = A.el('div', { class: 'card', id: 'src-card' });
    srcCard.appendChild(A.el('h2', { class: 'card-title' }, '4. Question Source'));
    const srcGroup = A.el('div', { class: 'form-radio-group' });
    const srcOpts = [
      { v: 'both', t: 'Built-in + Custom', d: 'All ' + (A.getBuiltinQuestions().length + customCount) + ' items combined.' },
      { v: 'builtin', t: 'Built-in only', d: A.getBuiltinQuestions().length + ' items from the standard bank.' },
      { v: 'custom', t: 'Custom only', d: customCount + ' items from your loaded file' + (customCount ? '.' : ' (none loaded — load a file on the Dashboard).') },
    ];
    const curSrc = settings.questionSource || 'both';
    srcOpts.forEach((o, i) => {
      const lbl = A.el('label', { class: 'form-radio' + ((curSrc === o.v) || (i === 0 && !['both','builtin','custom'].includes(curSrc)) ? ' selected' : '') });
      lbl.dataset.value = o.v;
      const inp = A.el('input', { type: 'radio', name: 'source', value: o.v, 'aria-label': o.t });
      if (curSrc === o.v) inp.checked = true;
      inp.addEventListener('change', () => {
        srcGroup.querySelectorAll('.form-radio').forEach(r => r.classList.remove('selected'));
        lbl.classList.add('selected');
        A.setSettings({ questionSource: o.v });
        updateConfigUI();
      });
      lbl.appendChild(inp);
      const txt = A.el('div', { class: 'form-radio-text' });
      txt.appendChild(A.el('strong', null, o.t));
      txt.appendChild(A.el('small', null, o.d));
      lbl.appendChild(txt);
      srcGroup.appendChild(lbl);
    });
    srcCard.appendChild(srcGroup);
    if (!customCount) srcCard.style.display = 'none';
    grid.appendChild(srcCard);

    wrap.appendChild(grid);

    // Mock summary (mock mode)
    const mockSummary = A.el('div', { class: 'card gold-top mt-4 hidden', id: 'mock-summary' });
    mockSummary.appendChild(A.el('h2', { class: 'card-title' }, 'Mock Exam Distribution'));
    const tbl = A.el('table', { class: 'table' });
    const tb = A.el('tbody');
    [
      ['Verbal Ability', 63],
      ['Numerical Ability', 40],
      ['Analytical Ability', 27],
      ['General Information', 27],
      ['Buffer / Unscored', 13],
    ].forEach(([n, c]) => {
      const tr = A.el('tr');
      tr.appendChild(A.el('td', null, n));
      tr.appendChild(A.el('td', { class: 'text-right text-primary', style: 'font-weight: 700;' }, String(c)));
      tb.appendChild(tr);
    });
    const totalTr = A.el('tr');
    totalTr.appendChild(A.el('td', { style: 'font-weight: 700; border-top: 2px solid var(--secondary);' }, 'TOTAL'));
    totalTr.appendChild(A.el('td', { class: 'text-right text-primary', style: 'font-weight: 700; border-top: 2px solid var(--secondary);' }, String(MOCK_TOTAL)));
    tb.appendChild(totalTr);
    tbl.appendChild(tb);
    mockSummary.appendChild(tbl);
    wrap.appendChild(mockSummary);

    // Start button
    const startBtn = A.el('button', { class: 'btn btn-primary btn-lg mt-8', id: 'btn-start' }, 'Commence Trial');
    startBtn.style.minWidth = '240px';
    startBtn.addEventListener('click', startExam);
    wrap.appendChild(startBtn);

    root.appendChild(wrap);
    updateConfigUI();
  }

  function updateConfigUI() {
    const mode = A.getSettings().defaultMode;
    const isMock = mode === 'mock';
    const catCard = document.getElementById('cat-card');
    const cntCard = document.getElementById('cnt-card');
    const mockSummary = document.getElementById('mock-summary');
    if (catCard) catCard.style.display = isMock ? 'none' : '';
    if (cntCard) cntCard.style.display = isMock ? 'none' : '';
    if (mockSummary) mockSummary.classList.toggle('hidden', !isMock);
    const hint = document.getElementById('count-hint');
    if (hint && !isMock) {
      const selectedCat = document.querySelector('input[name="cats"]:checked');
      const value = selectedCat ? selectedCat.parentElement.dataset.value : '["verbal","numerical","analytical","general"]';
      const cats = JSON.parse(value);
      const avail = cats.reduce((s, c) => s + A.getQuestionsByCategory(c).length, 0);
      hint.textContent = 'Pool: ' + avail + ' questions across selected categories.';
    }
  }

  // -------- Start exam --------
  function startExam() {
    const settings = A.getSettings();
    const isMock = settings.defaultMode === 'mock';
    state.mode = isMock ? 'mock' : 'practice';

    if (isMock) {
      // Mock distribution: 63/40/27/27 = 157 scored. Buffer 13 = fillers. Pick proportionally.
      // Pool = source-filtered (built-in | custom | both per user setting).
      const distribution = {
        verbal: 63, numerical: 40, analytical: 27, general: 27,
      };
      const picked = [];
      Object.keys(distribution).forEach(cat => {
        const want = distribution[cat];
        const pool = A.shuffle(A.getQuestionsByCategory(cat));
        const take = Math.min(want, pool.length);
        for (let i = 0; i < take; i++) picked.push(pool[i]);
      });
      // Fill the remaining 13 buffer slots with extra picks from source-filtered pool.
      const remaining = MOCK_TOTAL - picked.length;
      if (remaining > 0) {
        const fillerPool = A.shuffle(A.getSourceQuestions().filter(q => picked.indexOf(q) === -1));
        for (let i = 0; i < remaining && i < fillerPool.length; i++) picked.push(fillerPool[i]);
      }
      state.questions = A.shuffle(picked).slice(0, MOCK_TOTAL);
      state.mockDuration = MOCK_DURATION;
      state.timerRemaining = MOCK_DURATION;
    } else {
      const catInput = document.querySelector('input[name="cats"]:checked');
      const countInput = document.querySelector('input[name="count"]:checked');
      const cats = catInput ? JSON.parse(catInput.parentElement.dataset.value) : ['verbal', 'numerical', 'analytical', 'general'];
      const count = countInput ? parseInt(countInput.value, 10) : 30;
      state.questions = A.pickQuestions({ categories: cats, count: count });
      state.mockDuration = 0;
      state.timerRemaining = 0;
    }

    if (!state.questions.length) {
      window.alert('No questions available for this configuration.');
      return;
    }
    state.answers = {};
    state.flagged = {};
    state.current = 0;
    state.startEpoch = Date.now();
    setupVisibilityTracking();
    renderActive();
  }

  // -------- Active exam UI --------
  // Builds the static shell (header, progress, question card skeleton, nav grid).
  // Called once per exam; subsequent renderActive calls just patch the view.
  function buildShell() {
    const root = document.getElementById('test-root');
    A.clear(root);

    // Tab warning banner
    if (state.mode === 'mock') {
      const banner = A.el('div', { class: 'banner hidden', id: 'tab-warning', role: 'status' });
      banner.innerHTML = '<span style="margin-right: 4px;">&#9888;</span> Tab switch detected. This has been recorded. (Total: <span id="tab-count">' + state.tabSwitches + '</span>)';
      root.appendChild(banner);
    }

    // Header
    const header = A.el('div', { class: 'flex justify-between items-center', style: 'margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);' });
    const left = A.el('div', { class: 'flex items-center gap-3' });
    const counter = A.el('span', { class: 'text-mono-sm text-muted' });
    const catTag = A.el('span', { class: 'cat-tag' });
    left.appendChild(counter);
    left.appendChild(catTag);
    header.appendChild(left);

    const right = A.el('div', { class: 'flex items-center gap-3' });
    if (state.mode === 'mock') {
      right.appendChild(buildTimerRing());
    } else {
      const elapsed = A.el('span', { class: 'text-mono-sm text-muted' });
      right.appendChild(elapsed);
      view.elapsed = elapsed;
    }
    header.appendChild(right);
    root.appendChild(header);

    // Progress bar
    const bar = A.el('div', { class: 'progress-bar progress-bar-track-thin mb-8' });
    const progressFill = A.el('div', { class: 'progress-bar-fill' });
    bar.appendChild(progressFill);
    root.appendChild(bar);

    // Main grid: question + (optional) navigator
    const main = A.el('div', { class: 'grid', style: 'gap: var(--space-6);' });
    main.id = 'exam-main';

    // Question card
    const qcard = A.el('div', { class: 'card' });
    const qHead = A.el('div', { class: 'flex justify-between items-center mb-8' });
    const innerCat = A.el('span', { class: 'cat-tag' });
    const flagBtn = A.el('button', { class: 'flag-btn', id: 'btn-flag', type: 'button', 'aria-label': 'Flag for review' });
    flagBtn.addEventListener('click', toggleFlag);
    qHead.appendChild(innerCat);
    qHead.appendChild(flagBtn);
    qcard.appendChild(qHead);

    const questionText = A.el('div', { class: 'text-body-lg mb-8', style: 'white-space: pre-wrap;' });
    qcard.appendChild(questionText);

    const choicesBox = A.el('div', { class: 'space-y-3' });
    qcard.appendChild(choicesBox);

    // Footer nav
    const nav = A.el('div', { class: 'flex justify-center items-center mt-8', style: 'gap: var(--space-2); flex-wrap: wrap;' });
    const prevBtn = A.el('button', { class: 'btn btn-ghost', id: 'btn-prev', type: 'button' });
    prevBtn.innerHTML = A.ICONS.chevronLeft + ' Previous';
    prevBtn.addEventListener('click', prevQuestion);

    const submitBtn = A.el('button', { class: 'btn btn-primary', id: 'btn-submit', type: 'button' }, 'Submit');
    submitBtn.addEventListener('click', confirmSubmit);

    const nextBtn = A.el('button', { class: 'btn btn-secondary', id: 'btn-next', type: 'button' });
    nextBtn.innerHTML = 'Next ' + A.ICONS.chevronRight;
    nextBtn.addEventListener('click', nextQuestion);

    nav.appendChild(prevBtn);
    nav.appendChild(submitBtn);
    nav.appendChild(nextBtn);
    qcard.appendChild(nav);
    main.appendChild(qcard);

    // Navigator
    const navCard = A.el('div', { class: 'card', style: 'align-self: start;' });
    navCard.appendChild(A.el('h3', { class: 'card-title' }, 'Navigator'));
    const navGrid = A.el('div', { class: 'nav-grid' });
    navGrid.id = 'nav-grid';
    // Build cells once; classes updated in place.
    const frag = document.createDocumentFragment();
    const cells = [];
    for (let i = 0; i < state.questions.length; i++) {
      const cell = A.el('div', { class: 'nav-cell', role: 'button', 'aria-label': 'Question ' + (i + 1), tabindex: '0' });
      cell.textContent = String(i + 1);
      cell.addEventListener('click', () => { state.current = i; updateQuestionView(); });
      cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.current = i; updateQuestionView(); } });
      frag.appendChild(cell);
      cells.push(cell);
    }
    navGrid.appendChild(frag);
    navCard.appendChild(navGrid);
    const navStats = A.el('div', { class: 'text-mono-sm text-muted mt-4', id: 'nav-stats' });
    navCard.appendChild(navStats);
    main.appendChild(navCard);

    root.appendChild(main);

    // Cache refs
    view.built = true;
    view.questionLen = state.questions.length;
    view.counter = counter;
    view.catTag = catTag;
    view.innerCat = innerCat;
    view.questionText = questionText;
    view.choicesBox = choicesBox;
    view.flagBtn = flagBtn;
    view.progressFill = progressFill;
    view.navStats = navStats;
    view.prevBtn = prevBtn;
    view.nextBtn = nextBtn;
    view.navCells = cells;
  }

  // Patch in place: question text, choices, flag, current markers, prev/next disabled.
  function updateQuestionView() {
    if (!view.built) return;
    const q = state.questions[state.current];

    // Header
    view.counter.textContent = 'Question ' + (state.current + 1) + ' of ' + state.questions.length;
    const catName = A.CATEGORY_META[q.category].name;
    view.catTag.textContent = catName;
    view.innerCat.textContent = catName;

    // Elapsed (practice)
    if (view.elapsed) {
      const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
      view.elapsed.textContent = 'Elapsed ' + A.fmtMinutes(elapsed);
    }

    // Question text
    view.questionText.textContent = q.question;

    // Choices — rebuild just the 4 options in place
    A.clear(view.choicesBox);
    const userAnswer = state.answers[state.current];
    q.choices.forEach((c) => {
      const parsed = A.splitChoice(c);
      const lbl = A.el('div', { class: 'choice' + (userAnswer === parsed.letter ? ' selected' : ''), 'data-letter': parsed.letter, role: 'button', tabindex: '0' });
      lbl.appendChild(A.el('div', { class: 'choice-letter' }, parsed.letter));
      lbl.appendChild(A.el('div', { class: 'choice-text' }, parsed.text));
      lbl.addEventListener('click', () => selectAnswer(parsed.letter));
      lbl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAnswer(parsed.letter); } });
      view.choicesBox.appendChild(lbl);
    });

    // Flag button
    const isFlagged = !!state.flagged[state.current];
    view.flagBtn.innerHTML = (isFlagged ? A.ICONS.flagFilled : A.ICONS.flag) + '<span>' + (isFlagged ? ' Flagged' : ' Flag') + '</span>';
    view.flagBtn.classList.toggle('active', isFlagged);
    view.flagBtn.setAttribute('aria-pressed', isFlagged ? 'true' : 'false');

    // Progress + nav stats
    const answered = Object.keys(state.answers).length;
    view.progressFill.style.width = ((answered / state.questions.length) * 100) + '%';
    view.navStats.textContent = answered + ' of ' + state.questions.length + ' answered';

    // Prev/Next disabled
    view.prevBtn.disabled = state.current === 0;
    view.nextBtn.disabled = state.current === state.questions.length - 1;

    // Nav cells: update current marker only (answered/flagged handled in their own fns)
    for (let i = 0; i < view.navCells.length; i++) {
      view.navCells[i].classList.toggle('current', i === state.current);
    }
  }

  function renderActive() {
    if (!view.built || view.questionLen !== state.questions.length) {
      buildShell();
    }
    updateQuestionView();
    if (state.mode === 'mock' && !state.timerInterval) {
      state.timerInterval = setInterval(tickTimer, 1000);
    }
  }

  function buildTimerRing() {
    const size = 64, r = 26, c = 2 * Math.PI * r;
    const wrap = A.el('div', { class: 'timer-ring', id: 'timer-ring' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.style.transform = 'rotate(-90deg)';
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', String(size / 2));
    track.setAttribute('cy', String(size / 2));
    track.setAttribute('r', String(r));
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke-width', '4');
    track.setAttribute('class', 'timer-ring-track');
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fill.setAttribute('cx', String(size / 2));
    fill.setAttribute('cy', String(size / 2));
    fill.setAttribute('r', String(r));
    fill.setAttribute('fill', 'none');
    fill.setAttribute('stroke-width', '4');
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('class', 'timer-ring-fill');
    fill.id = 'timer-ring-fill';
    fill.setAttribute('stroke-dasharray', c + ' ' + c);
    svg.appendChild(track);
    svg.appendChild(fill);
    wrap.appendChild(svg);
    const center = A.el('div', { class: 'timer-ring-center' });
    const valSpan = A.el('span', { class: 'text-mono timer-ring-value', id: 'timer-value' }, A.fmtSeconds(state.timerRemaining));
    const lblSpan = A.el('span', { class: 'text-mono-sm timer-ring-label' }, 'left');
    center.appendChild(valSpan);
    center.appendChild(lblSpan);
    wrap.appendChild(center);
    return wrap;
  }

  function tickTimer() {
    state.timerRemaining = Math.max(0, state.timerRemaining - 1);
    const valEl = document.getElementById('timer-value');
    if (valEl) {
      valEl.textContent = A.fmtSeconds(state.timerRemaining);
    }
    const ringFill = document.getElementById('timer-ring-fill');
    if (ringFill) {
      const r = 26;
      const c = 2 * Math.PI * r;
      const ratio = state.mockDuration > 0 ? state.timerRemaining / state.mockDuration : 0;
      ringFill.setAttribute('stroke-dasharray', (c * ratio) + ' ' + c);
    }
    const ring = document.getElementById('timer-ring');
    if (ring) {
      ring.classList.remove('warn', 'danger');
      if (state.timerRemaining <= 600) ring.classList.add('danger');
      else if (state.timerRemaining <= 1800) ring.classList.add('warn');
    }
    if (state.timerRemaining === 0) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      finishExam(true);
    }
  }

  function toggleFlag() {
    if (state.flagged[state.current]) delete state.flagged[state.current];
    else state.flagged[state.current] = true;
    if (view.built) {
      // Patch the current question's flag button + nav cell.
      const isFlagged = !!state.flagged[state.current];
      view.flagBtn.innerHTML = (isFlagged ? A.ICONS.flagFilled : A.ICONS.flag) + '<span>' + (isFlagged ? ' Flagged' : ' Flag') + '</span>';
      view.flagBtn.classList.toggle('active', isFlagged);
      view.flagBtn.setAttribute('aria-pressed', isFlagged ? 'true' : 'false');
      const cell = view.navCells[state.current];
      if (cell) cell.classList.toggle('flagged', isFlagged);
    }
  }

  function setupVisibilityTracking() {
    if (state.visibilityHandler) {
      document.removeEventListener('visibilitychange', state.visibilityHandler);
    }
    state.tabSwitches = 0;
    state.visibilityHandler = () => {
      if (state.mode !== 'mock') return;
      if (!state.startEpoch || state.endEpoch) return;
      if (document.hidden) {
        state.tabSwitches++;
        const banner = document.getElementById('tab-warning');
        const counter = document.getElementById('tab-count');
        if (banner) {
          banner.classList.remove('hidden');
          if (counter) counter.textContent = state.tabSwitches;
          clearTimeout(banner._hideTimer);
          banner._hideTimer = setTimeout(() => banner.classList.add('hidden'), 4000);
        }
      }
    };
    document.addEventListener('visibilitychange', state.visibilityHandler);
  }

  function teardownVisibilityTracking() {
    if (state.visibilityHandler) {
      document.removeEventListener('visibilitychange', state.visibilityHandler);
      state.visibilityHandler = null;
    }
  }

  function selectAnswer(letter) {
    const prev = state.answers[state.current];
    state.answers[state.current] = letter;
    if (view.built) {
      // Patch only the 4 choices (clear previous selected, set new).
      view.choicesBox.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
      const chosen = view.choicesBox.querySelector('.choice[data-letter="' + letter + '"]');
      if (chosen) chosen.classList.add('selected');
      const cell = view.navCells[state.current];
      if (cell) cell.classList.add('answered');
      const answered = Object.keys(state.answers).length;
      view.progressFill.style.width = ((answered / state.questions.length) * 100) + '%';
      view.navStats.textContent = answered + ' of ' + state.questions.length + ' answered';
    }
  }

  function prevQuestion() {
    if (state.current > 0) { state.current--; updateQuestionView(); }
  }
  function nextQuestion() {
    if (state.current < state.questions.length - 1) { state.current++; updateQuestionView(); }
  }

  async function confirmSubmit() {
    const answered = Object.keys(state.answers).length;
    if (answered < state.questions.length) {
      const ok = await A.confirmModal(
        'You have ' + (state.questions.length - answered) + ' unanswered question(s). Submit anyway?',
        { title: 'Unfinished Exam', okLabel: 'Submit' });
      if (!ok) return;
    }
    finishExam(false);
  }

  // -------- Finish / score --------
  function finishExam(autoSubmit) {
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    teardownVisibilityTracking();
    state.endEpoch = Date.now();

    const total = state.questions.length;
    let correct = 0;
    const cats = { verbal: { correct: 0, total: 0 }, numerical: { correct: 0, total: 0 }, analytical: { correct: 0, total: 0 }, general: { correct: 0, total: 0 } };
    state.questions.forEach((q, idx) => {
      const ans = state.answers[idx];
      const isRight = ans && ans === q.answer;
      if (isRight) correct++;
      if (cats[q.category]) {
        cats[q.category].total++;
        if (isRight) cats[q.category].correct++;
      }
    });
    const percent = total ? (correct / total) * 100 : 0;
    const passed = percent >= A.PASS_THRESHOLD;
    const record = {
      id: String(state.startEpoch),
      date: new Date(state.startEpoch).toISOString(),
      mode: state.mode,
      totalItems: total,
      totalCorrect: correct,
      scorePercent: percent,
      timeTakenSeconds: Math.floor((state.endEpoch - state.startEpoch) / 1000),
      passed: passed,
      categories: cats,
      autoSubmit: !!autoSubmit,
      tabSwitches: state.tabSwitches || 0,
      flagged: Object.keys(state.flagged).map(Number),
      perQuestion: state.questions.map((q, idx) => ({
        qid: q.id,
        category: q.category,
        subcategory: q.subcategory,
        question: q.question,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        userAnswer: state.answers[idx] || null,
        flagged: !!state.flagged[idx],
      })),
    };
    A.addHistoryRecord(record);
    renderResults(record);
  }

  // -------- Results screen --------
  function renderResults(record) {
    const root = document.getElementById('test-root');
    A.clear(root);

    const wrap = A.el('div', { class: 'flex flex-col', style: 'max-width: 900px; margin: 0 auto; gap: var(--space-6);' });

    // Top score panel
    const panel = A.el('div', { class: 'card gold-top text-center' });
    panel.appendChild(A.el('h1', { class: 'text-headline text-primary' }, 'Trial Concluded'));
    panel.appendChild(A.el('div', { class: 'text-mono-sm text-muted mb-8', style: 'text-transform: uppercase; letter-spacing: 0.10em;' },
      (record.mode === 'mock' ? 'Mock Exam' : 'Practice Test') + ' Results'));

    const scoreRow = A.el('div', { class: 'flex justify-center items-center mb-8', style: 'gap: var(--space-4); flex-wrap: wrap;' });
    const scoreBig = A.el('div');
    const bigNum = A.el('div', { class: 'score-big' });
    bigNum.appendChild(document.createTextNode(String(record.totalCorrect) + ' '));
    bigNum.appendChild(A.el('span', { class: 'text-headline text-muted', style: 'font-size: 24px;' }, '/ ' + record.totalItems));
    scoreBig.appendChild(bigNum);
    const pct = A.el('div');
    pct.appendChild(A.el('div', { class: 'score-pct' }, A.fmtPercent(record.totalCorrect, record.totalItems, 2)));
    pct.appendChild(A.el('div', { class: 'text-mono-sm text-muted' }, 'Final Rating'));
    scoreRow.appendChild(scoreBig);
    scoreRow.appendChild(pct);
    panel.appendChild(scoreRow);

    const passBadge = record.passed
      ? A.el('span', { class: 'badge badge-pass', style: 'font-size: 14px; padding: 6px 16px;' }, 'PASSED')
      : A.el('span', { class: 'badge badge-fail', style: 'font-size: 14px; padding: 6px 16px;' }, 'BELOW THRESHOLD');
    panel.appendChild(passBadge);
    if (record.timeTakenSeconds) {
      const t = A.el('p', { class: 'text-mono-sm text-muted mt-4' },
        'Time used: ' + A.fmtMinutes(record.timeTakenSeconds) + (record.autoSubmit ? ' (auto-submitted at 0:00)' : ''));
      panel.appendChild(t);
    }
    wrap.appendChild(panel);

    // Tab switch report (mock only)
    if (record.mode === 'mock' && record.tabSwitches != null) {
      const ts = record.tabSwitches;
      let tone, msg;
      if (ts === 0) { tone = 'pass'; msg = 'You maintained full focus throughout this exam.'; }
      else if (ts <= 3) { tone = 'caution'; msg = 'Your tab lost focus ' + ts + ' time' + (ts === 1 ? '' : 's') + ' during this exam. The real CSE requires your full attention.'; }
      else { tone = 'fail'; msg = 'Your tab lost focus ' + ts + ' times. Practice maintaining focus — in the actual exam, this could be grounds for disqualification.'; }
      const tsCard = A.el('div', { class: 'card', style: 'display: flex; align-items: center; gap: var(--space-4);' });
      const iconBox = A.el('div', { class: 'insight-icon' });
      iconBox.innerHTML = A.ICONS.focus;
      tsCard.appendChild(iconBox);
      const content = A.el('div', { class: 'flex-1' });
      content.appendChild(A.el('div', { class: 'text-body', style: 'font-weight: 600;' },
        'Focus Violations: ' + ts));
      content.appendChild(A.el('div', { class: 'text-mono-sm text-muted' }, msg));
      tsCard.appendChild(content);
      wrap.appendChild(tsCard);
    }

    // Category breakdown
    const breakdown = A.el('div', { class: 'card' });
    breakdown.appendChild(A.el('h2', { class: 'card-title' }, 'Category Breakdown'));
    const list = A.el('div', { class: 'space-y-3' });
    Object.keys(record.categories).forEach(k => {
      const cs = record.categories[k];
      if (!cs || !cs.total) return;
      const meta = A.CATEGORY_META[k];
      const pct = (cs.correct / cs.total) * 100;
      const color = pct >= 80 ? 'pass' : pct >= 60 ? 'caution' : 'fail';
      const row = A.el('div');
      const head = A.el('div', { class: 'flex justify-between mb-2' });
      head.appendChild(A.el('span', { class: 'text-body', style: 'font-weight: 600;' }, meta.name));
      head.appendChild(A.el('span', { class: 'text-mono text-primary', style: 'font-weight: 700;' }, A.fmtScoreFraction(cs.correct, cs.total)));
      row.appendChild(head);
      const bar = A.el('div', { class: 'progress-bar' });
      const fillEl = A.el('div', { class: 'progress-bar-fill ' + color });
      fillEl.style.width = pct + '%';
      bar.appendChild(fillEl);
      row.appendChild(bar);
      list.appendChild(row);
    });
    breakdown.appendChild(list);
    wrap.appendChild(breakdown);

    // Answer review
    if (record.perQuestion) {
      const review = A.el('div', { class: 'card' });
      const reviewHead = A.el('div', { class: 'flex justify-between items-center', style: 'margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--gold-line);' });
      reviewHead.appendChild(A.el('h2', { class: 'text-headline text-primary', style: 'border: none; padding: 0; margin: 0;' }, 'Answer Review'));
      const reviewSummary = A.el('div', { class: 'text-mono-sm text-muted' },
        record.totalCorrect + ' correct / ' + (record.totalItems - record.totalCorrect) + ' incorrect / ' + (record.flagged ? record.flagged.length : 0) + ' flagged');
      reviewHead.appendChild(reviewSummary);
      review.appendChild(reviewHead);

      const reviewList = A.el('div', { class: 'space-y-3' });
      const flaggedSet = new Set(record.flagged || []);
      record.perQuestion.forEach((pq, i) => {
        const isRight = pq.userAnswer === pq.answer;
        const item = A.el('div', { class: 'review-item ' + (isRight ? 'right' : 'wrong') + (flaggedSet.has(i) ? ' flagged' : '') });
        const itemHead = A.el('div', { class: 'flex justify-between items-start', style: 'gap: var(--space-2); margin-bottom: var(--space-2); flex-wrap: wrap;' });
        const left2 = A.el('div', { class: 'flex items-center gap-2' });
        const icon = A.el('span', { class: 'review-icon' });
        icon.innerHTML = isRight ? A.ICONS.check : A.ICONS.x;
        left2.appendChild(icon);
        left2.appendChild(A.el('span', { class: 'text-mono-sm text-muted' }, '#' + (i + 1) + ' \u00B7 ' + A.CATEGORY_META[pq.category].name));
        if (flaggedSet.has(i)) {
          const flag = A.el('span', { class: 'badge badge-caution' });
          flag.innerHTML = A.ICONS.flagFilled + ' Flagged';
          left2.appendChild(flag);
        }
        itemHead.appendChild(left2);
        const userTxt = pq.userAnswer ? ('Your answer: ' + pq.userAnswer) : 'Unanswered';
        const userLbl = A.el('span', { class: 'text-mono-sm', style: 'font-weight: 600;' }, userTxt);
        itemHead.appendChild(userLbl);
        item.appendChild(itemHead);
        const qText = A.el('div', { class: 'text-body mb-2' }, pq.question);
        item.appendChild(qText);
        const answerLine = A.el('div', { class: 'text-mono-sm', style: 'margin-bottom: var(--space-2);' });
        if (!isRight) {
          const correct = A.el('span', { class: 'text-pass', style: 'font-weight: 700;' }, 'Correct: ' + pq.answer);
          answerLine.appendChild(correct);
        }
        item.appendChild(answerLine);
        if (pq.explanation) {
          const exp = A.el('div', { class: 'review-explain' }, pq.explanation);
          item.appendChild(exp);
        }
        reviewList.appendChild(item);
      });
      review.appendChild(reviewList);
      wrap.appendChild(review);
    }

    // Action buttons
    const actions = A.el('div', { class: 'flex gap-3', style: 'justify-content: center; flex-wrap: wrap;' });

    // Retake same questions (only if record has perQuestion with resolvable qids)
    const canRetake = record.perQuestion && retakeQuestionsFromRecord(record).length === record.perQuestion.length;
    if (canRetake) {
      const retryBtn = A.el('button', { class: 'btn btn-primary', type: 'button' }, 'Retake Same Questions');
      retryBtn.addEventListener('click', () => retakeExam(record));
      actions.appendChild(retryBtn);
    }

    const printBtn = A.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Print Results');
    printBtn.addEventListener('click', () => window.print());
    actions.appendChild(printBtn);

    const backBtn = A.el('a', { class: 'btn btn-ghost', href: 'index.html' }, 'Return to Dashboard');
    const retakeBtn = A.el('button', { class: 'btn btn-secondary', type: 'button' }, 'New Exam');
    retakeBtn.addEventListener('click', () => { renderConfig(); });
    actions.appendChild(backBtn);
    actions.appendChild(retakeBtn);
    wrap.appendChild(actions);

    root.appendChild(wrap);
  }

  // -------- Retake helpers --------
  function retakeQuestionsFromRecord(record) {
    if (!record || !record.perQuestion) return [];
    const bank = A.getAllQuestions();
    const byId = {};
    bank.forEach(q => { byId[q.id] = q; });
    return record.perQuestion.map(pq => byId[pq.qid] || null).filter(Boolean);
  }
  function retakeExam(record) {
    const questions = retakeQuestionsFromRecord(record);
    if (!questions.length) {
      window.alert('Could not reload those questions. They may have been removed from your banks.');
      return;
    }
    state.questions = questions;
    state.answers = {};
    state.flagged = {};
    state.current = 0;
    state.startEpoch = Date.now();
    state.mode = record.mode || 'practice';
    state.mockDuration = state.mode === 'mock' ? MOCK_DURATION : 0;
    state.timerRemaining = state.mockDuration;
    state.tabSwitches = 0;
    setupVisibilityTracking();
    renderActive();
  }

  // -------- Init --------
  A.onReady(() => {
    A.renderNavbar('test');
    A.renderFooter();
    renderConfig();
  });
})();
