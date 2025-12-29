const { test, expect } = require('@playwright/test');
const path = require('path');

const indexPath = `file://${path.join(__dirname, '..', 'index.html')}`;

test.beforeEach(async ({ page }) => {
    await page.goto(indexPath);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
});

test('progress insights and aria values persist after reload', async ({ page }) => {
    await page.fill('#taskInput', 'First task');
    await page.click('#addTaskButton');
    await page.fill('#taskInput', 'Second task');
    await page.click('#addTaskButton');

    await page.getByTestId('complete-checkbox').first().check();

    await expect(page.getByTestId('total-count')).toHaveText('2');
    await expect(page.getByTestId('completed-count')).toHaveText('1');
    await expect(page.getByTestId('active-count')).toHaveText('1');
    await expect(page.getByTestId('progress-percent')).toHaveText('50%');

    const ariaBefore = await page.getByTestId('progress-bar').getAttribute('aria-valuenow');
    const ariaTextBefore = await page.getByTestId('progress-bar').getAttribute('aria-valuetext');
    expect(ariaBefore).toBe('50');
    expect(ariaTextBefore).toBe('50% complete');

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('total-count')).toHaveText('2');
    await expect(page.getByTestId('completed-count')).toHaveText('1');
    await expect(page.getByTestId('active-count')).toHaveText('1');
    await expect(page.getByTestId('progress-percent')).toHaveText('50%');

    const ariaAfter = await page.getByTestId('progress-bar').getAttribute('aria-valuenow');
    const ariaTextAfter = await page.getByTestId('progress-bar').getAttribute('aria-valuetext');
    expect(ariaAfter).toBe('50');
    expect(ariaTextAfter).toBe('50% complete');

    const progressFillWidth = await page.getByTestId('progress-fill').evaluate(
        (node) => getComputedStyle(node).width
    );
    expect(progressFillWidth).not.toBe('0px');
});

test('theme choice persists alongside insights data', async ({ page }) => {
    await page.fill('#taskInput', 'Persisted task');
    await page.click('#addTaskButton');
    await page.selectOption('#theme', 'forest');

    const storedTheme = await page.evaluate(() => localStorage.getItem('journeyTheme'));
    expect(storedTheme).toBe('forest');

    await page.reload({ waitUntil: 'domcontentloaded' });

    const selectedTheme = await page.$eval('#theme', (el) => el.value);
    expect(selectedTheme).toBe('forest');
    const datasetTheme = await page.$eval('body', (el) => el.dataset.theme);
    expect(datasetTheme).toBe('forest');

    await expect(page.getByTestId('total-count')).toHaveText('1');
    await expect(page.getByTestId('completed-count')).toHaveText('0');
    await expect(page.getByTestId('progress-percent')).toHaveText('0%');
});
