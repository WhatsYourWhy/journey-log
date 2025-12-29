const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Wisdom toggle', () => {
  test('hides wisdom when toggle is off while insights continue updating', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const taskInput = page.locator('#taskInput');
    const addTaskButton = page.getByRole('button', { name: /Add a new journey step/i });
    const wisdomToggle = page.getByLabel('Show wisdom');
    const wisdomDisplay = page.locator('#wisdomDisplay');
    const progressBar = page.locator('.progress-bar');
    const progressPercent = page.locator('#progressPercent');

    await expect(wisdomToggle).toBeChecked();

    await wisdomToggle.click();
    await expect(wisdomToggle).not.toBeChecked();
    await expect(wisdomDisplay).toBeHidden();
    await expect(wisdomDisplay).toHaveAttribute('aria-expanded', 'false');

    const addTask = async (text) => {
      await taskInput.fill(text);
      await addTaskButton.click();
    };

    await addTask('Draft the itinerary');
    await addTask('Confirm bookings');

    const firstCheckbox = page.locator('li', { hasText: 'Draft the itinerary' }).getByTestId('complete-checkbox');
    await firstCheckbox.check();

    await expect(page.locator('#totalCount')).toHaveText('2');
    await expect(page.locator('#completedCount')).toHaveText('1');
    await expect(page.locator('#activeCount')).toHaveText('1');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    await expect(progressPercent).toHaveText('50%');

    await expect(wisdomDisplay).toBeHidden();
    await expect(wisdomDisplay).toHaveAttribute('aria-expanded', 'false');

    const secondCheckbox = page.locator('li', { hasText: 'Confirm bookings' }).getByTestId('complete-checkbox');
    await secondCheckbox.check();

    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    await expect(progressPercent).toHaveText('100%');
    await expect(wisdomDisplay).toBeHidden();
  });
});
