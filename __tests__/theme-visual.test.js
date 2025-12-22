const { test, expect } = require('@playwright/test');
const path = require('path');

const indexPath = `file://${path.join(__dirname, '..', 'index.html')}`;

function parseRgb(colorString) {
    const [r = 0, g = 0, b = 0] = (colorString.match(/[\d.]+/g) || []).map(Number);
    return { r, g, b };
}

function relativeLuminance({ r, g, b }) {
    const toLinear = (value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(foreground, background) {
    const fg = parseRgb(foreground);
    const bg = parseRgb(background);
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

test.describe('theme accessibility', () => {
    test('default theme maintains AA contrast for body text and primary button', async ({ page }) => {
        await page.goto(indexPath);

        const bodyColors = await page.$eval('body', (el) => {
            const styles = getComputedStyle(el);
            return { text: styles.color, background: styles.backgroundColor };
        });
        expect(contrastRatio(bodyColors.text, bodyColors.background)).toBeGreaterThanOrEqual(4.5);

        const addButtonColors = await page.$eval('#addTaskButton', (el) => {
            const styles = getComputedStyle(el);
            return { text: styles.color, background: styles.backgroundColor };
        });
        expect(contrastRatio(addButtonColors.text, addButtonColors.background)).toBeGreaterThanOrEqual(4.5);
    });

    test('theme selection persists through localStorage and reload', async ({ page }) => {
        await page.goto(indexPath);
        await page.selectOption('#theme', 'high-contrast');

        const storedTheme = await page.evaluate(() => localStorage.getItem('journeyTheme'));
        expect(storedTheme).toBe('high-contrast');

        await page.reload({ waitUntil: 'domcontentloaded' });
        const selectedTheme = await page.$eval('#theme', (el) => el.value);
        expect(selectedTheme).toBe('high-contrast');
    });

    test('high contrast theme increases button contrast', async ({ page }) => {
        await page.goto(indexPath);
        await page.selectOption('#theme', 'high-contrast');

        await page.waitForFunction(
            () => {
                const el = document.querySelector('#addTaskButton');
                if (!el) return false;
                const styles = getComputedStyle(el);
                const text = styles.color;
                const background = styles.backgroundColor;
                const parseRgb = (colorString) => {
                    const [r = 0, g = 0, b = 0] = (colorString.match(/[\d.]+/g) || []).map(Number);
                    return { r, g, b };
                };
                const relativeLuminance = ({ r, g, b }) => {
                    const toLinear = (value) => {
                        const channel = value / 255;
                        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
                    };
                    const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
                    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
                };
                const fg = parseRgb(text);
                const bg = parseRgb(background);
                const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
                const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
                const ratio = (lighter + 0.05) / (darker + 0.05);
                return ratio >= 7;
            },
            { timeout: 2000 }
        );
    });
});
