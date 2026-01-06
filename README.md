# The Journey Log

Journey Log is a creative-first checklist that treats tasks as steps in your story. It blends practical task management with artful themes, contextual wisdom, and reflective notes.

## Features

- **Rich step metadata:** Capture the mood, category, and priority of each step. Badges surface these attributes inline so you can scan the story of your day.
- **Inline micro-journaling:** Add quick notes to any step without leaving the list. Notes autosave and reveal a subtle badge when present.
- **Creative prompts and milestones:** An empty-state carousel offers spark-ready prompts, while a milestone strip celebrates progress at 5/10/20 completed steps with gentle flares (respecting reduced-motion preferences).
- **Contextual wisdom:** Completing a step unlocks a tailored quote based on its mood, category, or priority. Refresh the insight without toggling completion.
- **Theme + artful mode:** Comfort, Forest, Ocean, Midnight, and High contrast themes adapt typography, gradients, and cards. Toggle “Artful mode” to layer illustrations (automatically disabled for high contrast for accessibility).
- **Bulk selection and undo:** Select steps independently from completion status, clear selected or completed items, and undo recent deletes within the grace window.
- **Keyboard-friendly:** Press Enter in the input to add a step, or use Ctrl/Cmd + Enter to add when you’re not typing in another text field. Use Ctrl/Cmd + Shift + C to clear completed steps.
- **Persistent insights:** Total, active, completed counts and a live progress bar stay in sync with your actions and retain state via localStorage.

## Technologies

- **HTML** for structure and ARIA-friendly controls.
- **CSS** for theming, artful backdrops, responsive layout, and reduced-motion support.
- **JavaScript** for task state, validation, insights, milestones, contextual wisdom, and persistence (localStorage).

## Getting Started

1. Clone or download the repository.
2. Open `index.html` in your browser.
3. Choose a theme and optionally enable Artful mode.
4. Add a step, then optionally tag its **mood**, **category**, **priority**, and **note**.
5. Mark steps complete to reveal contextual wisdom; refresh insights with the micro-button.
6. Use selection checkboxes to clear chosen steps, or “Clear Completed Steps” to tidy finished work. “Undo delete” appears briefly after removals.
7. Return later—tasks, themes, artful mode, and milestones persist locally.

## Testing

- Run Playwright tests with `npm test`.

## Credits

- Original concept and direction: WhatsYourWhy
- AI-assisted iteration and documentation: GPT-5.1-Codex-Max (OpenAI)

## License

MIT License
