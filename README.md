# This was a simple AI Prompt creation using LLM. Very Basic and simple to do list.

# If you would like to experiment with single prompt upgrades. This may show the evolution of LLM capabilities as a historical coding assistant. 

This repository captures the evolution from an early LLM-generated prototype to the current workflow powered by OpenAI Codex. It shows how iterative prompts and code refinement can steadily improve a simple idea.

# The Journey Log

A simple and stylish to-do list application with a touch of wisdom, quick insights, and customizable themes.

## Overview

The Journey Log is a web-based to-do list designed to help you track your tasks as "steps" in your personal journey. It allows you to:

* **Add new steps:** Easily input and add tasks to your log.

* **View your journey:** See a clear list of your current steps.

* **Mark steps as complete:** Check off completed tasks, which will be visually marked with a strikethrough and optionally reveal an insightful quote.

* **Delete steps:** Remove tasks from your log.

* **Clear completed steps:** Quickly remove all finished tasks to keep your log tidy.

* **See journey insights:** View totals, completed counts, active steps, and a progress indicator that updates automatically as you work.

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

## Recent Improvements

* The wisdom panel now accurately reflects the state of your tasks on page load and after any action, so inspirational quotes stay in sync with completed steps.

* Added a Journey Insights row that surfaces total steps, completed and active counts, plus a live progress bar that updates whenever you change your list.

* Storage is now validated and sanitized on load, so corrupted or malformed tasks are safely reset instead of breaking the app.

## Next Steps

Future iterations can build on these insights by tracking completion timestamps to show daily streaks and celebrating milestones. A lightweight reminders layer (due dates with friendly nudges) and quick filters for active/completed steps would further refine the experience.

## Author

WhatsYourWhy

## License

MIT License

