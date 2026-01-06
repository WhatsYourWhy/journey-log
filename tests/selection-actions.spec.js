const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Clear selected button state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
  });

  test('stays disabled until a selection exists and re-disables when cleared', async ({ page }) => {
    const clearSelectedButton = page.locator('#clearSelectedButton');
    await expect(clearSelectedButton).toBeDisabled();

    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add Step/i });

    await taskInput.fill('Selectable task');
    await addTaskButton.click();

    await expect(clearSelectedButton).toBeDisabled();

    const selectCheckbox = page.getByTestId('select-checkbox').first();
    await selectCheckbox.check();
    await expect(clearSelectedButton).toBeEnabled();

    await selectCheckbox.uncheck();
    await expect(clearSelectedButton).toBeDisabled();
  });
});
