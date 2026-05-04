# CLAUDE.md — Orientation for Claude sessions

## What this repo is becoming

**The Mage's Rituals** — a private, offline-first ADHD companion PWA built around
the Dragons & Distractions bestiary. See [BRIEF.md](BRIEF.md) for the product
brief; that document is the north star. If a request seems to conflict with the
brief, ask before deviating.

## What this repo *was*

This repo started life as **The Journey Log** — a generic localStorage to-do
app. The pivot to The Mage's Rituals is in progress. Most of the legacy
Journey Log code is still present at the root of the repo and is being phased
out. See [Legacy code](#legacy-code) below.

## Where the live code lives

```
app/index.html              — the working demo. Single self-contained file.
                              CSS, content data, and JS are all inlined.
                              Reason: the preview environment blocks external
                              file loads (CSS, modules, fetch). Inlining is the
                              path that works there.

scripts/build-content.js    — pipeline: reads the Dragons & Distractions
                              Jekyll site, parses monsters + spellbook + chooser,
                              emits JSON, and injects everything into
                              app/index.html. Run with: npm run build:content

app/data/*.json             — build artifacts (chooser, monsters, spellbook,
                              manifest). Generated; do not edit by hand.

BRIEF.md                    — product brief.
```

## Where the content comes from

The site at `C:/Users/Justin/dragons-and-distractions-site` (Jekyll) is the
**source of truth** for monster lore, ritual content, and the chooser tree.
Content lives in:
- `_monsters/*.md` — bestiary entries (frontmatter is structured)
- `spellbook/*.md` — ritual pages (HTML body with `field-guide` cards)
- `_data/chooser_paths.yml` — the "Today" decision tree

To rebuild app content from the site, set `DD_SITE_PATH` and run the build:

```sh
DD_SITE_PATH="C:/Users/Justin/dragons-and-distractions-site" npm run build:content
```

The build script is also wired to inject JSON into the static HTML so the
preview demo stays in sync.

## Constraints worth knowing

1. **Privacy is the product.** All user data stays in `localStorage` on the
   device. No accounts, no cloud sync, no analytics in v1. Don't add network
   calls without explicit approval.
2. **Preview environment limitations.** The preview tool used in this project
   blocks external CSS, JS modules, and `fetch()` from sibling files. The
   single-file `app/index.html` was specifically built to work there. Don't
   "modernize" it back to external modules without checking that the preview
   still renders.
3. **The product brief filter.** Before adding a feature, check it against
   "v1 — three screens" and "Explicitly not in v1" sections of BRIEF.md.
4. **The user is severely ADHD and is the first user.** Voice, copy, and
   pacing matter a lot. "Warm, not clinical. Grounded, not magical thinking."
   Don't add streaks, shame mechanics, or "you missed a day" patterns.

## Legacy code

These files are from the old Journey Log app and will be removed or moved to
`legacy/` in a future cleanup pass. They are **not part of The Mage's Rituals**
and should be ignored unless explicitly asked about:

- `index.html` (root)
- `script.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `icons/`
- `src/` (old modular code: `app/`, `domain/`, `services/`, `ui/`)
- `tests/` (Playwright tests for Journey Log)
- `__tests__/` (unit tests for Journey Log)
- `playwright.config.cjs`

Do not write new tests against this legacy code. Do not use it as a reference
for how the new app should be structured.

## Orphaned attempts

Earlier in the pivot, an ESM-modular version of the app was built under
`app/main.js`, `app/router.js`, `app/content.js`, `app/dom.js`, `app/store.js`,
`app/timer.js`, `app/views/*.js`, and `app/styles.css`. The preview couldn't
load these as external files, so the working version inlines everything into
`app/index.html`. The modular files are currently dead code. They may be
revived for real deployment (a real PWA on a real server can load modules
fine), but until then they should not be referenced.

## How to start a productive session

1. Read [BRIEF.md](BRIEF.md).
2. Open `app/index.html` to see the current demo state.
3. If working on content, edit the source on the Dragons & Distractions site,
   then rebuild via `npm run build:content`.
4. If working on layout/styling/JS, edit `app/index.html` directly. The build
   script will preserve your changes when re-injecting JSON (it only rewrites
   the data script tags and the static Today section).
5. Keep changes scoped. Auto mode is OK for low-risk work; pause and ask
   before file moves, deletions, or rebrands.

## Things to ask the user before doing

- Renaming the repo or `package.json` name field
- Deleting any legacy file
- Changing the brief or product scope
- Adding network calls, analytics, or accounts
- Restructuring `app/index.html` to use external files
- Modifying anything in the Dragons & Distractions site repo

## Pending decisions (not yet done)

These were identified during the pivot audit and intentionally left for the
user to approve. Don't act on these without explicit confirmation.

1. **Rename `package.json` `name` field** from `"journey-log"` to the final
   project name (e.g. `"mages-rituals"`). Trivial one-line change.
2. **Move legacy files to `legacy/`** — see [Legacy code](#legacy-code) above.
   Big move (15+ paths) but fully reversible via git. After moving, also
   update `playwright.config.cjs` references and the `npm test` script.
3. **Delete or revive the orphaned modular files** under `app/` — see
   [Orphaned attempts](#orphaned-attempts). Recommendation: delete now and
   rebuild cleanly when deploying to a real server.
4. **GitHub repo rename** — `journey-log` → `mages-rituals` (or chosen final
   name). User action via GitHub UI; git itself doesn't care.
5. **Final product name** — `The Mage's Rituals` is the working name in
   BRIEF.md. Confirm or replace before the rename steps above.

## Useful commands

```sh
# Rebuild content from the D&D site
DD_SITE_PATH="C:/Users/Justin/dragons-and-distractions-site" npm run build:content

# (Legacy — do not run unless reviving Journey Log)
npm test
```
