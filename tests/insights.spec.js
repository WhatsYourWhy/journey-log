const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Journey insights', () => {
  test('reflect task state driven by updateInsights', async ({ page }) => {
    await page.goto(indexFileUrl);

    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add a new journey step/i });
    const progressFill = page.locator('#progressFill');
    const progressBar = progressFill.locator('..');
    const emptyState = page.locator('#emptyState');
    const starterHint = page.locator('#starterHint');

    const expectCounts = async (total, completed, active, progress) => {
      await expect(page.locator('#totalCount')).toHaveText(String(total));
      await expect(page.locator('#completedCount')).toHaveText(String(completed));
      await expect(page.locator('#activeCount')).toHaveText(String(active));
      await expect(page.locator('#progressPercent')).toHaveText(`${progress}%`);
      await expect(progressBar).toHaveAttribute('aria-valuenow', String(progress));
      const width = await progressFill.evaluate((node) => node.style.width);
      expect(width).toBe(`${progress}%`);
    };

    const addTask = async (text) => {
      await taskInput.fill(text);
      await addTaskButton.click();
    };

    await expect(emptyState).toBeVisible();
    await expect(starterHint).toBeVisible();
    const activeElementId = await page.evaluate(() => document.activeElement?.id || '');
    expect(activeElementId).toBe('taskInput');
    await expectCounts(0, 0, 0, 0);

    await addTask('Plan the route');
    await addTask('Pack the bag');

    await expect(emptyState).toBeHidden();
    await expect(starterHint).toBeHidden();
    await expectCounts(2, 0, 2, 0);

    const firstCheckbox = page.locator('li', { hasText: 'Plan the route' }).locator('input[type="checkbox"]');
    const secondCheckbox = page.locator('li', { hasText: 'Pack the bag' }).locator('input[type="checkbox"]');

    await firstCheckbox.check();
    await expectCounts(2, 1, 1, 50);

    await secondCheckbox.check();
    await expectCounts(2, 2, 0, 100);
  });

  test('empty state visibility tracks task count', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add a new journey step/i });
    const emptyState = page.locator('#emptyState');

    await expect(emptyState).toBeVisible();

    await taskInput.fill('Map the journey');
    await addTaskButton.click();

    await expect(emptyState).toBeHidden();

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(emptyState).toBeVisible();
  });
});
