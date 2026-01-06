const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Keyboard shortcuts', () => {
  test('Ctrl/Cmd+Enter adds a task and Ctrl/Cmd+Shift+C clears completed', async ({ page }) => {
    await page.goto(indexFileUrl);

    const taskInput = page.locator('#taskInput');
    const taskListItems = page.locator('#taskList li');
    const taskTextItems = page.locator('#taskList li span');

    await taskInput.click();
    await taskInput.fill('Shortcut add');
    await page.keyboard.press('Control+Enter');

    await expect(taskListItems).toHaveCount(1);
    await expect(taskInput).toHaveValue('');

    await taskInput.fill('Second task');
    await page.keyboard.press('Control+Enter');
    await expect(taskListItems).toHaveCount(2);

    const firstCheckbox = page.locator('li', { hasText: 'Shortcut add' }).getByTestId('complete-checkbox');
    await firstCheckbox.check();

    await page.keyboard.press('Control+Shift+C');
    await expect(taskListItems).toHaveCount(1);
    await expect(taskTextItems).toHaveText(['Second task']);
  });

  test('Ctrl/Cmd+Enter does not add while typing in other text inputs', async ({ page }) => {
    await page.goto(indexFileUrl);

    const taskInput = page.locator('#taskInput');
    const taskListItems = page.locator('#taskList li');

    await taskInput.click();
    await taskInput.fill('Primary step');
    await page.keyboard.press('Control+Enter');
    await expect(taskListItems).toHaveCount(1);

    const firstItem = taskListItems.first();
    await firstItem.getByRole('button', { name: /add note/i }).click();
    const noteInput = firstItem.getByLabel(/add a note for primary step/i);

    await noteInput.click();
    await noteInput.fill('Typing a note should not submit');
    await page.keyboard.press('Control+Enter');

    await expect(taskListItems).toHaveCount(1);
    await expect(taskInput).toHaveValue('');
  });
});
