# CSEaesar

> *Veni, Vidi, Vici.*

A free, static, fully client-side reviewer for the **Philippine Civil Service Examination — Professional Level** (170 items / 3 hours 10 minutes / 80% to pass).

No backend, no login, no account. Everything lives in the browser (`localStorage` + a swappable JSON question bank).

---

## Quick Start

### Run locally

The app is fully static. Any HTTP server will do.

```bash
# Python 3
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000/`.

> Opening `index.html` directly via `file://` will fail for the JSON loader (browser security); use a local server.

### Deploy

Drop the contents of this folder onto any static host:

- **GitHub Pages** — push to a repo, enable Pages on `main` branch / root.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop or connect the repo.
- **Any static web server** — Nginx, Apache, S3 + CloudFront, etc.

No build step. No env vars. No backend required.

---

## Project Layout

```
cseasear/
├── index.html              ← Dashboard (default landing page)
├── test.html               ← Test / Exam Page
├── css/
│   └── style.css           ← All styles + design tokens + dark mode
├── js/
│   ├── app.js              ← Shared: storage, shuffle, theme, formatters, icons
│   ├── dashboard.js        ← Dashboard rendering
│   └── test.js             ← Exam engine: config, timer, tab detection, scoring
├── data/
│   └── questions.js        ← Built-in question bank (~200 items)
└── README.md               ← This file
```

---

## Built-in Question Bank

The app ships with **~200 questions** in `data/questions.js`:

| Category | Count | Notes |
|---|---|---|
| Verbal Ability | ~70 | Synonyms, antonyms, analogies, grammar, reading comp, idioms; ~20 in Filipino |
| Numerical Ability | ~50 | Arithmetic, word problems, series, ratio, geometry |
| Analytical Ability | ~40 | Syllogisms, data interpretation, patterns, logic |
| General Information | ~40 | 1987 Constitution, RA 6713, RA 3019, RA 10173, history, environment |

---

## Custom Question Bank

You can extend the bank by loading your own JSON file. The app **merges** custom questions with the built-in bank; both are used in exams (or you can filter to one source only).

### Loading

1. Open the **Dashboard**.
2. Scroll to **Custom Armory**.
3. Click **Load Custom Questions (.json)** and pick your file.
4. The app validates, shows a count of valid / invalid items, and stores the result in `localStorage` under `cseasar_custom_questions`.

To switch sources for a given exam: on the **Practice Test** config screen, choose **Built-in + Custom / Built-in only / Custom only**.

### JSON Schema

The top-level value may be either a JSON **array** of questions, or an **object** with a `questions` array.

```json
[
  {
    "id": "custom_v001",
    "category": "verbal",
    "subcategory": "synonyms",
    "question": "Choose a synonym for METICULOUS:",
    "choices": ["A. Careless", "B. Thorough", "C. Quick", "D. Loud"],
    "answer": "B",
    "explanation": "Meticulous = showing great attention to detail = thorough."
  }
]
```

#### Required fields

| Field | Type | Constraint |
|---|---|---|
| `id` | string | Unique. Use a prefix (e.g. `custom_v001`) to avoid colliding with built-in IDs. |
| `category` | string | One of: `verbal`, `numerical`, `analytical`, `general` |
| `subcategory` | string | Free-form tag, e.g. `synonyms`, `word_problems`, `ra_6713`, `fibonacci` |
| `question` | string | The question prompt. |
| `choices` | array of **exactly 4** strings | Each must start with `"A. "`, `"B. "`, `"C. "`, `"D. "`. |
| `answer` | string | One of `"A"`, `"B"`, `"C"`, `"D"`. |
| `explanation` | string | Brief reasoning. Shown in the Answer Review on the results screen. |

#### Validation

Invalid items are skipped (not the whole file). The loader shows a count of valid vs invalid items, and a list of issues. Common pitfalls:

- Missing `id` → "missing or empty `id`"
- `category: "Verbal"` (capital V) → "category must be verbal|numerical|analytical|general"
- Choices without `"A. "` prefix → "choice N must start with 'A. '/'B. '/'C. '/'D. '"
- Duplicate `id` → "duplicate id `…` (first seen at item N)"

### LLM Prompt Template

Paste this into Claude / ChatGPT / Gemini to generate questions. Adjust the count and subtopic as needed.

```
Generate {N} Philippine Civil Service Exam (CSE-PPT Professional level) questions
for the {CATEGORY} category, specifically on the subtopic of {SUBTOPIC}.

Return ONLY a valid JSON array. No explanation, no markdown, no preamble.
Each object must have these exact fields:

- id: string (e.g. "custom_v001", increment per item)
- category: one of "verbal" | "numerical" | "analytical" | "general"
- subcategory: string (e.g. "synonyms", "word_problems", "ra_6713")
- question: string
- choices: array of exactly 4 strings, each starting with "A. ", "B. ", "C. ", "D. "
- answer: one of "A" | "B" | "C" | "D"
- explanation: string (brief explanation of the correct answer)

Match the difficulty level of the actual Philippine CSE Professional exam:
items should test reasoning, not just recall. Avoid trick questions.
For Filipino items, use natural, conversational Filipino — not overly
formal or archaic. For general-information items, prefer
Republic Acts and the 1987 Constitution over obscure trivia.
```

#### Examples by subtopic

```
{ "category": "verbal",     "subcategory": "reading_comprehension" }
{ "category": "numerical",  "subcategory": "work_problems" }
{ "category": "analytical", "subcategory": "syllogism" }
{ "category": "general",    "subcategory": "ra_11032" }   // Ease of Doing Business
{ "category": "general",    "subcategory": "constitution_1987" }
```

---

## Features

### Dashboard (`index.html`)
- **Hero strip** — tagline, at-a-glance stats, countdown to next CSE-PPT (Aug 9, 2026), "Start Practice Test" CTA.
- **Overall Mastery** — large progress ring showing lifetime average.
- **Category Performance** — one bar per category with priority tag (HIGH / NEEDS REVIEW / GOOD).
- **Strategic Insights** — auto-generated recommendations from score history.
- **Recent Campaigns** — exam history table with per-row category breakdown, delete with confirmation.
- **Scrolls of Knowledge** — per-category study notes, autosaved to `localStorage`.
- **Custom Armory** — load / remove custom JSON question banks.
- **Dark mode** — toggle in the navbar; persisted in `localStorage`.

### Test Page (`test.html`)
- **Two modes** — Practice (configurable categories + item count) and Mock Exam (170 items, 3h 10m timer, all categories).
- **Three question sources** — Built-in only / Custom only / Both.
- **Circular timer** — gold ring drains clockwise; shifts to amber (≤30 min) and pulsing red (≤10 min); auto-submit at 0.
- **Tab focus detection** — banner on every tab switch; report on results screen (0 / 1–3 / >3 with tailored messages).
- **Flag for review** — gold flag on the question + indicator dot on the navigator.
- **Navigator sidebar** — 170 cells with status colors (current = gold border, answered = purple, flagged = gold dot); click to jump.
- **Answer Review** — every question listed after submit with your answer, correct answer, ✓ / ✗, and explanation; flagged items highlighted.

---

## localStorage Architecture

| Key | Contents |
|---|---|
| `cseasar_history` | Array of exam records. Each has `id, date, mode, totalItems, totalCorrect, scorePercent, timeTakenSeconds, passed, categories{verbal|numerical|analytical|general:{correct,total}}, tabSwitches, flagged[], perQuestion[]` |
| `cseasar_notes` | `{ verbal: "…", numerical: "…", analytical: "…", general: "…" }` |
| `cseasar_custom_questions` | Array of validated custom question objects. |
| `cseasar_settings` | `{ darkMode, defaultMode, defaultItemCount, questionSource }` |

Clearing your browser's site data resets the app.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Hosting | GitHub Pages (or any static host) | Free, static, no backend |
| HTML/CSS/JS | Vanilla — no framework | Zero build step, instant deploy |
| Fonts | Google Fonts CDN | Cinzel + Inter + JetBrains Mono |
| Icons | Inline SVG | No external dependency |
| Storage | `localStorage` | No accounts needed |
| Question shuffle | Fisher-Yates (in `app.js`) | Different order every session |
| Tab detection | Page Visibility API | Native browser API |
| Dark mode | CSS custom properties + class toggle | No flash, easy to maintain |
| File loading | FileReader API | Reads user JSON client-side |

---

## License

Free to use. No warranty. Questions are for practice only — verify against the official CSC materials before exam day.
