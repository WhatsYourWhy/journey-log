const { test, expect } = require('@playwright/test');
const path = require('path');

const indexPath = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('task input validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(indexPath);
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });
    });

    test('rejects empty and duplicate task descriptions with inline feedback', async ({ page }) => {
        const taskInput = page.locator('#taskInput');
        const addButton = page.locator('#addTaskButton');
        const validation = page.getByTestId('input-validation');

        await taskInput.fill('   ');
        await addButton.click();

        await expect(page.locator('#taskList li')).toHaveCount(0);
        await expect(validation).toContainText('Please enter a step before adding.');
        const activeId = await page.evaluate(() => document.activeElement.id);
        expect(activeId).toBe('taskInput');

        await taskInput.fill('Read a book');
        await addButton.click();
        await expect(page.locator('#taskList li')).toHaveCount(1);
        await expect(validation).toBeHidden();

        await taskInput.fill('Read a book');
        await addButton.click();

        await expect(page.locator('#taskList li')).toHaveCount(1);
        await expect(validation).toContainText('That step already exists');
        const activeAfterDuplicate = await page.evaluate(() => document.activeElement.id);
        expect(activeAfterDuplicate).toBe('taskInput');
    });
});
