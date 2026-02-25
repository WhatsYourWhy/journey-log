# The Journey Log

A browser-based checklist that stores steps in localStorage, adds optional mood/category/priority metadata, and surfaces quotes and milestones as you complete work.

## What it does

- **Step metadata:** Optional mood, category, and priority badges per step.
- **Notes:** Add a note per step; edits save automatically and show a note badge.
- **Prompts + milestones:** Empty-state prompt carousel and milestone markers at 5/10/20 completed steps (animations respect reduced-motion settings).
- **Wisdom panel:** Completing a step shows a quote tied to its mood/category/priority, with a refresh button and a toggle to disable wisdom entirely.
- **Themes:** Comfort, Forest, Ocean, Midnight, and High contrast themes. Artful mode layers illustrations, but is disabled in high contrast.
- **Bulk actions + undo:** Select steps independently from completion, clear selected or completed steps, and undo recent deletes within an 8-second window.
- **Keyboard shortcuts:** Enter adds a step from the input. Ctrl/Cmd + Enter adds a step from elsewhere (except other text inputs). Ctrl/Cmd + Shift + C clears completed steps.
- **Insights:** Total/active/completed counts and progress bar update from stored steps.


## Privacy-first analytics (opt-in)

Journey Log analytics are **disabled by default**. If you opt in via Settings, the app records only a minimal event schema as local aggregate counters in `localStorage`:

- `task_added`
- `task_completed`
- `note_used`
- `theme_changed`
- `undo_used`

### Data boundaries

- No task description text is collected in analytics.
- No note body text is collected in analytics.
- No personally identifying data is added by default.
- In local-only mode, analytics stay on-device as aggregate counts for self-insight.

### Usage insights panel (dev/optional)

A lightweight **Usage insights (dev)** panel can display local aggregate event counts for feature adoption checks.

- It is intended for local development / inspection.
- It does not require external analytics services.

### External analytics guardrails (future)

If external analytics is enabled later, only the same sanitized and aggregated metadata should be sent (event type + safe metadata fields). Raw user content (task descriptions, note text) is excluded by design.

## Technologies

- **HTML** for structure and ARIA-friendly controls.
- **CSS** for theming, artful backdrops, responsive layout, and reduced-motion support.
- **JavaScript** for task state, validation, insights, milestones, contextual wisdom, and persistence (localStorage).

## Getting Started

1. Clone or download the repository.
2. Open `index.html` in your browser.
3. Choose a theme and optionally enable Artful mode.
4. Add a step, optionally tag mood/category/priority, and add a note when needed.
5. Mark steps complete to see the wisdom panel and milestone updates.
6. Use selection checkboxes to clear selected steps or use “Clear Completed Steps.” Use “Undo delete” shortly after removals.

## Usage examples

- **Add a step with metadata:** Type “Plan a 10-minute walk,” set mood to Calm and category to Wellness, choose Low priority, then click **Add Step**.
- **Add a note:** Click **Add note** on a step and type a quick reflection; the note saves immediately.
- **Keyboard shortcut:** Press Ctrl/Cmd + Enter to add a step when focus isn’t in another text field.

## Backup and restore

Use **Export Journey** and **Import Journey** in the bulk actions row to keep your data portable.

1. Click **Export Journey** to download a `.json` backup file of your steps and settings.
2. Save the file somewhere safe (cloud drive, external drive, email to yourself, etc.).
3. On the same or another device, open Journey Log and click **Import Journey**.
4. Pick your backup file.
5. If you already have steps, you can choose to **replace** everything with the backup, or **merge** imported steps with current ones.

What gets backed up:
- Steps (including completion, mood/category/priority, selection state, and notes)
- Theme selection
- Wisdom toggle preference
- Artful mode preference

If the selected file is malformed or not valid Journey Log JSON, the app blocks the import and shows a validation message.

## Optional future sync (integration note)

After local backup/restore is stable, a next step is optional remote sync (for example Supabase or Firebase). A practical phased rollout is:

- Keep local JSON export/import as the source-of-truth fallback.
- Add authenticated cloud profile storage per user.
- Sync a normalized task/settings schema identical to local portability format.
- Resolve conflicts with clear rules (last-write-wins or per-task merge) while preserving manual local import/export.

## Install on iOS/Android

You can add The Journey Log to your home screen so it opens like an app:

- **Android (Chrome/Edge):** Open the site, tap the browser menu (`⋮`), then choose **Install app** or **Add to Home screen**.
- **iPhone/iPad (Safari):** Open the site, tap **Share** (`⬆`), then choose **Add to Home Screen**.
- After installing, launch it from your home screen/app drawer for a full-screen app experience.

## Testing

- Run all automated tests with `npm test`.

## Credits

- Original concept and direction: WhatsYourWhy
- AI-assisted iteration and documentation: GPT-5.1-Codex-Max (OpenAI)

## License

MIT License
