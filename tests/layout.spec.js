const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Mobile layout and control visibility', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('wraps controls without horizontal scroll and keeps add buttons visible after keyboard opens', async ({ page }) => {
    await page.goto(indexFileUrl);

    const hasHorizontalOverflow = await page.evaluate(() => {
      const availableWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      return (
        document.documentElement.scrollWidth > availableWidth + 1 ||
        document.body.scrollWidth > availableWidth + 1
      );
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    const bulkActions = page.locator('.bulk-actions');
    const bulkWraps = await bulkActions.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(bulkWraps).toBe(true);

    const primaryAdd = page.getByRole('button', { name: /Add a new journey step/i });
    const mobileAdd = page.getByRole('button', { name: /Add a journey step near the keyboard/i });

    await expect(primaryAdd).toBeVisible();
    await expect(mobileAdd).toBeVisible();

    const taskInput = page.locator('#taskInput');
    await taskInput.click();
    await page.setViewportSize({ width: 375, height: 520 });

    await primaryAdd.scrollIntoViewIfNeeded();
    await mobileAdd.scrollIntoViewIfNeeded();

    const viewportHeight = 520;
    const primaryBox = await primaryAdd.boundingBox();
    const mobileBox = await mobileAdd.boundingBox();

    expect(primaryBox).not.toBeNull();
    expect(mobileBox).not.toBeNull();
    expect(primaryBox.y + primaryBox.height).toBeLessThanOrEqual(viewportHeight + 1);
    expect(mobileBox.y + mobileBox.height).toBeLessThanOrEqual(viewportHeight + 1);
  });
});

