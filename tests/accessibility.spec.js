const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Accessibility and focus management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(indexFileUrl);
  });

  test('keeps focus stable when adding, toggling, and clearing tasks', async ({ page }) => {
    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add a new journey step/i });
    const clearButton = page.getByRole('button', { name: /Clear all completed journey steps/i });

    await taskInput.fill('First step');
    await addTaskButton.click();
    await expect(taskInput).toBeFocused();

    await taskInput.fill('Second step');
    await addTaskButton.click();

    const firstCheckbox = page.locator('li').first().locator('input[type="checkbox"]');
    await firstCheckbox.focus();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeFocused();

    await clearButton.focus();
    await clearButton.click();
    await expect(clearButton).toBeFocused();
  });

  test('updates ARIA attributes when state changes', async ({ page }) => {
    const totalCount = page.locator('#totalCount');
    const completedCount = page.locator('#completedCount');
    const activeCount = page.locator('#activeCount');
    const progressBar = page.locator('.progress-bar');
    const progressPercent = page.locator('#progressPercent');
    const wisdomRegion = page.locator('#wisdomDisplay');
    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add a new journey step/i });

    await expect(totalCount).toHaveAttribute('aria-live', 'polite');
    await expect(completedCount).toHaveAttribute('aria-live', 'polite');
    await expect(activeCount).toHaveAttribute('aria-live', 'polite');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    await expect(progressPercent).toHaveText('0%');
    await expect(wisdomRegion).toHaveAttribute('role', 'region');
    await expect(wisdomRegion).toHaveAttribute('aria-expanded', 'false');

    const addTask = async (text) => {
      await taskInput.fill(text);
      await addTaskButton.click();
    };

    await addTask('Pack the map');
    await addTask('Lock the door');

    const firstCheckbox = page.locator('li', { hasText: 'Pack the map' }).locator('input[type="checkbox"]');
    const secondCheckbox = page.locator('li', { hasText: 'Lock the door' }).locator('input[type="checkbox"]');

    await firstCheckbox.check();
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    await expect(progressPercent).toHaveText('50%');
    await expect(wisdomRegion).toHaveAttribute('aria-expanded', 'true');

    await secondCheckbox.check();
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    await expect(progressPercent).toHaveText('100%');
  });
});
