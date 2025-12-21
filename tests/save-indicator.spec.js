const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Save indicator feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
  });

  test('shows and clears the saved indicator after task changes', async ({ page }) => {
    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add Step/i });
    const saveIndicator = page.locator('#saveStatus');

    await expect(saveIndicator).toHaveAttribute('aria-hidden', 'true');

    await taskInput.fill('Pack snacks');
    await taskInput.press('Enter');

    await expect(saveIndicator).toBeVisible();
    await expect(saveIndicator).toHaveText(/Saved/i);
    await expect(saveIndicator).toHaveAttribute('aria-hidden', 'false');
    await expect(saveIndicator).toBeHidden({ timeout: 3000 });

    const deleteButton = page.getByLabel(/Delete Pack snacks/i);
    await deleteButton.click();

    await expect(saveIndicator).toBeVisible();
    await expect(saveIndicator).toHaveText(/Saved/i);
    await expect(saveIndicator).toBeHidden({ timeout: 3000 });
  });
});
