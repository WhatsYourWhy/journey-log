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

    const firstCheckbox = page.locator('li', { hasText: 'Shortcut add' }).locator('input[type="checkbox"]');
    await firstCheckbox.check();

    await page.keyboard.press('Control+Shift+C');
    await expect(taskListItems).toHaveCount(1);
    await expect(taskTextItems).toHaveText(['Second task']);
  });
});
