const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Onboarding cues', () => {
  test('shows helper bubble on first load and keeps advanced controls collapsed', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const addButton = page.getByRole('button', { name: /Add a new journey step/i });
    const helperBubble = page.locator('#addHelperBubble');
    const advancedToolsToggle = page.locator('#advancedToolsToggle');
    const advancedToolsPanel = page.locator('#advancedToolsPanel');

    await expect(addButton).toBeVisible();
    await expect(helperBubble).toBeVisible();

    await expect(advancedToolsToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(advancedToolsPanel).toBeHidden();
    await expect(page.locator('.theme-selector')).toBeHidden();
    await expect(page.locator('.bulk-actions')).toHaveAttribute('hidden', '');
  });

  test('reveals advanced tools after first successful task completion', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('#taskInput').fill('First guided task');
    await page.getByRole('button', { name: /Add a new journey step/i }).click();

    await expect(page.locator('#addHelperBubble')).toBeHidden();

    const completionCheckbox = page.locator('[data-testid="complete-checkbox"]').first();
    await completionCheckbox.check();

    const advancedToolsToggle = page.locator('#advancedToolsToggle');
    const advancedToolsPanel = page.locator('#advancedToolsPanel');
    await expect(advancedToolsToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(advancedToolsPanel).toBeVisible();
    await expect(advancedToolsPanel).toHaveAttribute('aria-hidden', 'false');

    await page.reload();
    await expect(advancedToolsToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(advancedToolsPanel).toBeVisible();
  });
});
