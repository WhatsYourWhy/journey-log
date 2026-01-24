const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Storage recovery', () => {
  test('clears corrupted task data and renders empty state', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => {
      localStorage.setItem('journeyTasks', '{this is not valid json');
    });

    await page.reload();

    await expect(page.locator('#taskList li')).toHaveCount(0);
    await expect(page.locator('#emptyState')).toBeVisible();

    const storedTasks = await page.evaluate(() => localStorage.getItem('journeyTasks'));
    expect(storedTasks).toBeNull();
  });
});
