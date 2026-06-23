# Workflow State

## Status
- Phase 5 (scoped) complete. Printable exam summary added (button on results). Paste-JSON option added to custom armory loader. LLM prompt modal already had All Categories + subtopic dropdown from prior round.
- All PLAN §12 phases 1-5 effectively shipped (per the user's scoped Phase 5: print + paste-JSON).
- Next: release (git init + push to GH Pages).

## Decisions
- **File layout:** Split per PLAN §3 — `index.html`, `test.html`, `css/style.css`, `js/app.js|dashboard.js|test.js`, `data/questions.js`, `README.md` + `README.html`.
- **Entrypoint:** `index.html`.
- **Colors:** DESIGN.md "Imperial Clarity" tokens, extended with PASS_GREEN / FAIL_RED / CAUTION_AMBER.
- **Question bank:** 200 built-in (verbal 70 [20 Filipino], numerical 50, analytical 40, general 40).
- **Filipino:** 20 real Filipino items in built-in.
- **Deploy:** Local-only first. No git init. No GH Pages push.
- **Cadence:** Strict phase order. Phase 1 → 2 → 3 → 4 → 5 done.
- **Tailwind:** Dropped. Vanilla CSS.
- **Icons:** Inline SVG via `App.ICONS` (sun, moon, flag, check, x, focus, grid, scroll, db, trash, alert, bulb, upload, sparkle).
- **Timer:** SVG ring (64px, r=26), color shifts gold → amber (≤30min) → red pulsing (≤10min), auto-submit at 0.
- **Tab detection:** Page Visibility API, banner 4s, count in record.
- **Custom JSON validation:** Strict per PLAN §7. `hasOwnProperty` for dup check.
- **Question source toggle:** On Practice Test config. Hidden when no custom bank.
- **README rendering:** `README.html` fetches `README.md` + `marked@12.0.2` CDN.
- **Favicon:** Inline SVG data URI.
- **Print:** `@media print` block: hide chrome, force light, page-break avoidance. "Print Results" button on results page calls `window.print()`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables animations.
- **Retake:** "Retake Same Questions" button on results.
- **A11y:** All radio inputs have `aria-label`. Notes textareas have `for`/`id`/`name`. `white-space: nowrap` on `.stat-label`. History table "Actions" header.
- **Performance (Phase 4 round 2):** Refactored test page to incremental DOM updates. `buildShell()` + `updateQuestionView()`. Click latency <1ms.
- **Dark mode (Phase 4 round 2):** Removed body `transition: background-color 0.3s`. Toggle now atomic.
- **Dashboard spacing (Phase 4 round 2):** Card padding 2rem → 3rem (space-8). Section gaps 2.5rem (space-10).
- **LLM prompt modal (Phase 4 round 2 + round 3):** "Generate more with AI" link in Custom Armory. Modal with sparkle icon, 3 inputs (count, category, subtopic dropdowns), live prompt preview, "Copy prompt" button. Per-category subtopic lists. "All Categories" option triggers LLM_PROMPT_MIXED template.
- **Hero stat cards (Phase 4 round 3):** stat-label + stat-value now `display: block`, value 32px, stack vertically.
- **Printable exam summary (Phase 5):** "Print Results" ghost button on results page. Uses existing `@media print` CSS.
- **Paste-JSON loader (Phase 5):** Below the file upload button, dashed divider, "Or paste JSON" label, 5-row textarea (mono font), "Load pasted JSON" + "Fill with sample" buttons. Shared `loadJsonText(text)` helper for both file + paste flows.
- **Performance pass (post-Phase 5):** Removed expensive SVG `feTurbulence` noise filter from `.marble-bg::before` (replaced with 2 CSS radial-gradients). Replaced all `transition: all` and `transition: background/color/background-color` with `border-color 0.1s ease` (only fires on hover, not on theme toggle). Dark mode now flips atomically across the whole page. Hover effects still feel snappy because bg changes are instant.

## Decisions
- **File layout:** Split per PLAN §3 — `index.html`, `test.html`, `css/style.css`, `js/app.js|dashboard.js|test.js`, `data/questions.js`, `README.md` + `README.html`.
- **Entrypoint:** `index.html`.
- **Colors:** DESIGN.md "Imperial Clarity" tokens, extended with PASS_GREEN / FAIL_RED / CAUTION_AMBER.
- **Question bank:** 200 built-in (verbal 70 [20 Filipino], numerical 50, analytical 40, general 40).
- **Filipino:** 20 real Filipino items in built-in.
- **Deploy:** Local-only first. No git init. No GH Pages push.
- **Cadence:** Strict phase order. Phase 1 → 2 → 3 → 4 done.
- **Tailwind:** Dropped. Vanilla CSS.
- **Icons:** Inline SVG via `App.ICONS` (sun, moon, flag, check, x, focus, grid, scroll, db, trash, alert, bulb, upload, sparkle).
- **Timer:** SVG ring (64px, r=26), color shifts gold → amber (≤30min) → red pulsing (≤10min), auto-submit at 0.
- **Tab detection:** Page Visibility API, banner 4s, count in record.
- **Custom JSON validation:** Strict per PLAN §7. `hasOwnProperty` for dup check.
- **Question source toggle:** On Practice Test config. Hidden when no custom bank.
- **README rendering:** `README.html` fetches `README.md` + `marked@12.0.2` CDN.
- **Favicon:** Inline SVG data URI.
- **Print:** `@media print` block: hide chrome, force light, page-break avoidance.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables animations.
- **Retake:** "Retake Same Questions" button on results.
- **A11y:** All radio inputs have `aria-label`. Notes textareas have `for`/`id`/`name`. `white-space: nowrap` on `.stat-label` to prevent wrap.
- **Performance (Phase 4 round 2):** Refactored test page to incremental DOM updates. `buildShell()` runs once per exam; `updateQuestionView()` patches in place. Click latency 0.4ms (was ~10ms full re-render). DocumentFragment for 170 nav cells.
- **Dark mode (Phase 4 round 2):** Removed body `transition: background-color 0.3s`. Toggle now atomic across the whole page.
- **Dashboard spacing (Phase 4 round 2):** Card padding bumped 2rem → 3rem (space-8). Section gaps 2.5rem (space-10). Footer padding bumped. Container top padding bumped.
- **LLM prompt modal (Phase 4 round 2 + round 3):** "Generate more with AI" link in Custom Armory. Modal with sparkle icon, 3 inputs (count, category, subtopic), live prompt preview, "Copy prompt" button using `navigator.clipboard` with execCommand fallback. Round 3: Category dropdown now includes "All Categories" (triggers LLM_PROMPT_MIXED variant). Subtopic is now a dynamic dropdown that updates based on category. Per-category subtopic lists: verbal (8 opts), numerical (5), analytical (4), general (10), all (5 mixed variants).
- **Hero stat cards (Phase 4 round 3):** stat-label + stat-value were inline spans, making the value (e.g. "77.33%") render next to the label ("AVG SCORE"). Now both are `display: block`, value bumped to 32px, label gets gap-3 below. Stack vertically with breathing room.
- **History table header (Phase 4 round 3):** Added "Actions" header to the delete-button column (was empty string, failed a11y audit).
- **Footer (Phase 4 round 2):** Removed Privacy/Terms/Support. Now: brand | copyright | single README link.

## Assumptions
- Mock distribution uses target counts per PLAN §2c (63/40/27/27 + 13 buffer). Source-filtered.
- Score stored as 0-100 scale.
- `localStorage` keys: `cseasar_history`, `cseasar_notes`, `cseasar_custom_questions`, `cseasar_settings`.
- "Retake" discards prior answers (fresh attempt). Original record preserved.
- Sample JSON is downloaded via Blob URL (no network).

## Blockers
- None.

## Open Questions
- Phase 5: grow bank to 500+, more Filipino types, printable exam summary.
- Should "Retake" preserve prior answers as a "continue" option? Current: always fresh.
- Tab-switch detection runs only in mock. Should it run in practice too? Current: only mock (per PLAN §6c).

## File Map
- `AGENTS.md`, `PLAN.md`, `DESIGN.md`, `WORKFLOW_STATE.md` — planning.
- `index.html` (70L) — entrypoint, dashboard shell.
- `test.html` (42L) — test page shell.
- `README.html` (101L) — renders README.md via marked.js CDN.
- `README.md` (227L) — full docs.
- `css/style.css` (1102L, ~33KB) — design system + components + dark + print + reduced-motion.
- `js/app.js` (442L, ~15KB) — shared + ICONS + storage + shuffle + formatters + validator + navbar/footer/modal.
- `js/dashboard.js` (638L, ~22KB) — hero, mastery, category bars, recommendations, history, notes, custom bank loader, AI prompt modal.
- `js/test.js` (840L, ~33KB) — config + active exam + ring timer + tab detection + flag + scoring + results + review + retake.
- `data/questions.js` (273L, ~58KB) — 200 built-in questions.

## Test Commands
- `node --check js/app.js && node --check js/dashboard.js && node --check js/test.js` → OK
- Browser: `python3 -m http.server 8770 --directory /home/rantiche/cseaesar`
- Lighthouse: `index.html` 100/100/100/100, `test.html` 100/100/100/100
- Click latency: 0.4ms (answer), 1.0ms (next). Dark toggle: 0.7ms.
- No console errors on any page.

## Handoff Notes
- 2026-06-22 (1) — Phase 1 done. 200 questions, end-to-end flow, dark mode.
- 2026-06-22 (2) — Phase 2 done. Circular timer, tab detection, flag, answer review, inline SVG icons, mobile responsive.
- 2026-06-22 (3) — Phase 3 done. Custom JSON loader, strict validator, question source toggle, README with LLM prompt template.
- 2026-06-22 (4) — Phase 4 polish done. Entrypoint, favicon, README.html, print, reduced-motion, retake, a11y, Lighthouse 100s.
- 2026-06-22 (5) — Phase 4 polish round 2 done. Lag fix (incremental DOM, DocumentFragment for nav, <1ms click), dark mode atomic (removed 0.3s body transition), dashboard breathing room (space-8 cards, space-10 sections), LLM prompt modal in Custom Armory (count/category/subtopic inputs + copy button), footer slimmed (Privacy/Terms/Support → README).
- 2026-06-22 (6) — Phase 4 round 3 nitpicks. Hero stat cards: label + value now block + 32px value (was inline, jammed). History table: 6th header changed "" to "Actions" (a11y). LLM prompt: "All Categories" + subtopic dropdown (per-category lists).
- 2026-06-22 (7) — Phase 5 scoped done. Printable exam summary (Print Results button on results page → `window.print()`). Paste-JSON loader (textarea below file upload, "Fill with sample" helper, shared `loadJsonText` for both flows). Both verified end-to-end in browser. Lighthouse 100/100/100/100.
- 2026-06-22 (8) — Performance pass. Removed `feTurbulence` SVG filter (replaced with 2 CSS radial-gradients). Stripped `transition: all` and `transition: background/color` from all elements. Hover feedback now instant; theme toggle flips atomically. No chrome-devtools available in this session, so perf verification is static (CSS audit) — please reload live site to confirm.
- 2026-06-23 (9) — Mobile responsive overhaul. Fixed 12+ issues:
  - Card padding 48px→20px mobile; section margins 96px→32px mobile via `.main-padding` / `.section-gap` CSS classes
  - Stat value font 32px→24px mobile
  - Hero stats gap reduced (var(--space-4)→var(--space-3))
  - Navbar height 80px→60px; shows compact nav links on mobile (10px font)
  - Touch targets: icon-btn 44px, chip/flag-btn 44px min-height
  - Exam footer nav: flex-wrap:wrap + justify-center → buttons wrap on 320px screens
  - AI prompt modal inputs: grid 1fr→1fr mobile via CSS attribute selector
  - Results score sizes: 56px→36px, 40px→28px via `.score-big`/`.score-pct` classes
  - Answer review item head: flex-wrap + items-start prevents overflow
  - Banner: top→70px, font→12px, full-width on mobile
  - Footer: padding 64px→32px
  - All inline `var(--space-*)` styles replaced with CSS classes for media query override
- Release: ready for GitHub Pages push when user gives the go-ahead.
