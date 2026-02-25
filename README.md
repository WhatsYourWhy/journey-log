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
