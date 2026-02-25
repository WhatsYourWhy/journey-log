const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.use({ viewport: { width: 375, height: 700 } });

test.describe('Mobile layout resilience', () => {
  test('keeps simple-mode layout stable and no horizontal scroll at 375px', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const inputSection = page.locator('.input-section');
    await expect(inputSection).toHaveCSS('flex-direction', 'column');

    await expect(page.locator('#addTaskButton')).toBeVisible();
    await expect(page.locator('#advancedToolsPanel')).toBeHidden();

    const noHorizontalScroll = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth;
    });
    expect(noHorizontalScroll).toBeTruthy();
  });

  test('no horizontal overflow after progressive reveal on first completion', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('#taskInput').fill('Mobile reveal task');
    await page.locator('#addTaskButton').click();
    await page.locator('[data-testid="complete-checkbox"]').first().check();

    await expect(page.locator('#advancedToolsToggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#advancedToolsPanel')).toBeVisible();

    const noHorizontalScroll = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth;
    });
    expect(noHorizontalScroll).toBeTruthy();
  });
});
