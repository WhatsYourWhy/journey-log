const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Note input behavior', () => {
  test('updates note UI immediately without replacing the note input element', async ({ page }) => {
    await page.goto(indexFileUrl);

    const taskInput = page.locator('#taskInput');
    const taskListItems = page.locator('#taskList li');

    await taskInput.fill('Primary step');
    await page.keyboard.press('Control+Enter');
    await expect(taskListItems).toHaveCount(1);

    const firstItem = taskListItems.first();
    const noteToggle = firstItem.getByRole('button', { name: /add note for primary step/i });

    await noteToggle.click();

    const noteInput = firstItem.getByLabel(/add a note for primary step/i);
    const noteInputHandle = await noteInput.elementHandle();

    await noteInput.fill('A quick thought');

    await expect(firstItem.getByRole('button', { name: /edit note for primary step/i })).toHaveText('Note added');
    await expect(firstItem.locator('.badge-note')).toHaveCount(1);
    await expect(firstItem.locator('[data-control="note-toggle"]')).toHaveAttribute('aria-expanded', 'true');

    const sameElement = await page.evaluate((element) => {
      return element === document.querySelector('li[data-task-id] [data-control="note-input"]');
    }, noteInputHandle);

    expect(sameElement).toBe(true);

    await noteInput.fill('');

    await expect(firstItem.getByRole('button', { name: /add note for primary step/i })).toHaveText('Add note');
    await expect(firstItem.locator('.badge-note')).toHaveCount(0);
    await expect(firstItem.locator('[data-control="note-toggle"]')).toHaveAttribute('aria-expanded', 'true');
  });

  test('persists note content with debounce and flushes on blur', async ({ page }) => {
    await page.goto(indexFileUrl);

    const taskInput = page.locator('#taskInput');
    const taskListItems = page.locator('#taskList li');

    await taskInput.fill('Debounced note task');
    await page.keyboard.press('Control+Enter');
    await expect(taskListItems).toHaveCount(1);

    const firstItem = taskListItems.first();
    await firstItem.getByRole('button', { name: /add note/i }).click();
    const noteInput = firstItem.getByLabel(/add a note for debounced note task/i);

    await noteInput.fill('draft');

    const immediateNote = await page.evaluate(() => {
      const tasks = JSON.parse(localStorage.getItem('journeyTasks') || '[]');
      return tasks[0]?.note ?? '';
    });
    expect(immediateNote).toBe('');

    await page.waitForTimeout(320);

    const persistedAfterDebounce = await page.evaluate(() => {
      const tasks = JSON.parse(localStorage.getItem('journeyTasks') || '[]');
      return tasks[0]?.note ?? '';
    });
    expect(persistedAfterDebounce).toBe('draft');

    await noteInput.fill('blur-save');
    await noteInput.blur();

    const persistedOnBlur = await page.evaluate(() => {
      const tasks = JSON.parse(localStorage.getItem('journeyTasks') || '[]');
      return tasks[0]?.note ?? '';
    });
    expect(persistedOnBlur).toBe('blur-save');
  });
});
