const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Onboarding cues', () => {
  test('shows helper bubble on first load and hides after first add', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const taskInput = page.locator('#taskInput');
    const addButton = page.getByRole('button', { name: /Add a new journey step/i });
    const helperBubble = page.locator('#addHelperBubble');

    await expect(taskInput).toBeFocused();
    await expect(helperBubble).toBeVisible();

    await taskInput.fill('First guided task');
    await addButton.click();

    await expect(helperBubble).toBeHidden();

    await page.reload();
    await expect(helperBubble).toBeHidden();
  });
});
