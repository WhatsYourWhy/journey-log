const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.use({ viewport: { width: 375, height: 700 } });

test.describe('Mobile layout resilience', () => {
  test('wraps controls and avoids horizontal scroll at 375px', async ({ page }) => {
    await page.goto(indexFileUrl);

    const inputSection = page.locator('.input-section');
    await expect(inputSection).toHaveCSS('flex-direction', 'column');

    const addTaskButton = page.locator('#addTaskButton');
    const secondaryAddButton = page.locator('#secondaryAddButton');
    await expect(addTaskButton).toBeVisible();
    await expect(secondaryAddButton).toBeVisible();

    const noHorizontalScroll = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth;
    });
    expect(noHorizontalScroll).toBeTruthy();
  });

  test('add buttons stay reachable after typing with small viewport', async ({ page }) => {
    await page.goto(indexFileUrl);

    await page.setViewportSize({ width: 375, height: 550 });
    const taskInput = page.locator('#taskInput');
    await taskInput.focus();
    await taskInput.fill('Testing mobile keyboard space');

    const buttonsInView = await page.evaluate(() => {
      const withinViewport = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      };

      return {
        primary: withinViewport(document.getElementById('addTaskButton')),
        secondary: withinViewport(document.getElementById('secondaryAddButton'))
      };
    });

    expect(buttonsInView.primary).toBe(true);
    expect(buttonsInView.secondary).toBe(true);
  });
});
