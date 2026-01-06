const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('Undo last delete', () => {
  test('restores the most recently deleted task', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());

    const taskInput = page.locator('#taskInput');
    const addButton = page.getByRole('button', { name: /Add a new journey step/i });
    const undoButton = page.locator('#undoDeleteButton');

    await taskInput.fill('Keep me');
    await addButton.click();

    await taskInput.fill('Remove me');
    await addButton.click();

    const deleteButton = page.locator('li', { hasText: 'Remove me' }).getByRole('button', { name: /Delete/i });
    await deleteButton.click();

    const taskTexts = page.locator('#taskList li span');
    await expect(taskTexts).toHaveText(['Keep me']);

    await expect(undoButton).toBeEnabled();
    await undoButton.click();

    await expect(taskTexts).toHaveText(['Keep me', 'Remove me']);
    await expect(undoButton).toBeDisabled();
  });

  test('Clear selected button reflects selection state and stays quiet when disabled', async ({ page }) => {
    await page.goto(indexFileUrl);
    await page.evaluate(() => localStorage.clear());

    const taskInput = page.locator('#taskInput');
    const addButton = page.getByRole('button', { name: /Add a new journey step/i });
    const clearSelectedButton = page.getByRole('button', { name: /Clear selected/i });
    const selectionCheckbox = page.getByTestId('select-checkbox').first();
    const validationMessage = page.getByTestId('input-validation');

    await expect(clearSelectedButton).toBeDisabled();
    await expect(validationMessage).toBeHidden();

    await taskInput.fill('Selectable task');
    await addButton.click();

    await expect(clearSelectedButton).toBeDisabled();

    await selectionCheckbox.check();
    await expect(clearSelectedButton).toBeEnabled();

    await selectionCheckbox.uncheck();
    await expect(clearSelectedButton).toBeDisabled();

    await clearSelectedButton.click({ force: true });
    await expect(clearSelectedButton).toBeDisabled();
    await expect(validationMessage).toBeHidden();
    await expect(validationMessage).toBeEmpty();
  });
});
