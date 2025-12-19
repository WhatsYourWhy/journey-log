# This was a simple AI prompt creation using LLM. Very basic and simple to-do list.

# If you would like to experiment with single prompt upgrades, this may show the evolution of LLM capabilities as a historical coding assistant. 

This repository captures the evolution from an early LLM-generated prototype to the current workflow powered by OpenAI Codex. It shows how iterative prompts and code refinement can steadily improve a simple idea.

# The Journey Log

A simple and stylish to-do list application with a touch of wisdom and customizable themes.

## Overview

The Journey Log is a web-based to-do list designed to help you track your tasks as "steps" in your personal journey. It allows you to:

* **Add new steps:** Easily input and add tasks to your log.
* **View your journey:** See a clear list of your current steps.
* **Mark steps as complete:** Check off completed tasks, which will be visually marked with a strikethrough and optionally reveal an insightful quote.
* **Delete steps:** Remove tasks from your log.
* **Clear completed steps:** Quickly remove all finished tasks to keep your log tidy.
* **Customize the look:** Choose from different visual themes to personalize your Journey Log.

## Technologies Used

* **HTML:** Provides the structural foundation of the application.
* **CSS:** Handles the styling and visual presentation, including different themes.
* **JavaScript:** Implements the interactive functionality, data management (using local storage), and theme switching.

## How to Use

1. Clone this repository to your local machine.
2. Open the `index.html` file in your web browser.
3. Start adding your journey steps in the input field and click "Add Step" or press Enter.
4. Check the checkbox next to a task to mark it as complete and potentially see a piece of wisdom.
5. Click the "Delete" button next to a task to remove it.
6. Use the "Clear Completed Steps" button to remove all finished tasks.
7. Select a theme from the "Choose a theme" dropdown to change the appearance of the application. Your theme preference will be saved.

## Recent Fixes

* The wisdom panel now accurately reflects the state of your tasks on page load and after any action, so inspirational quotes stay in sync with completed steps.

## Planned Enhancement: Journey Insights Dashboard

To further motivate users, the next iteration will focus on a lightweight "Journey Insights" dashboard that surfaces progress at a glance.

**Implementation plan:**

1. **Data model updates:** Track completion timestamps and derive streaks and daily totals in `script.js`.
2. **UI layout:** Add a summary section beneath the header in `index.html` that shows total steps, completed steps, and a progress bar.
3. **Styling:** Extend `style.css` with cards and accent colors that adapt to existing themes without breaking readability.
4. **Persistence & recalculation:** Ensure insights update whenever tasks are added, toggled, or cleared while persisting necessary metadata in local storage.
5. **Accessibility:** Provide ARIA labels for new widgets and keep color contrast acceptable across all themes.

## Author

WhatsYourWhy

## License

MIT License
