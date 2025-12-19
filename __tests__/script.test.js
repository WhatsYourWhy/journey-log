const { test, expect } = require('@playwright/test');
const path = require('path');
const { updateInsights, updateWisdomVisibility } = require('../script.js');

function createSpy() {
    const spy = (...args) => {
        spy.calls.push(args);
    };
    spy.calls = [];
    spy.callCount = () => spy.calls.length;
    return spy;
}

function createDomElements() {
    const createElement = () => {
        let textContent = '';
        return {
            get textContent() {
                return textContent;
            },
            set textContent(value) {
                textContent = String(value);
            },
            style: {},
            attributes: {},
            parentElement: null,
            appendChild(child) {
                child.parentElement = this;
            },
            setAttribute(name, value) {
                this.attributes[name] = value;
            },
            getAttribute(name) {
                return this.attributes[name] ?? null;
            }
        };
    };

    const totalCount = createElement();
    const completedCount = createElement();
    const activeCount = createElement();
    const progressPercent = createElement();
    const progressBar = createElement();
    const progressFill = createElement();

    progressBar.appendChild(progressFill);

    return {
        totalCount,
        completedCount,
        activeCount,
        progressPercent,
        progressFill
    };
}

test.describe('updateInsights', () => {
    test('handles zero tasks gracefully', () => {
        const elements = createDomElements();
        const tasks = [];

        updateInsights(tasks, elements);

        expect(elements.totalCount.textContent).toBe('0');
        expect(elements.completedCount.textContent).toBe('0');
        expect(elements.activeCount.textContent).toBe('0');
        expect(elements.progressPercent.textContent).toBe('0%');
        expect(elements.progressFill.style.width).toBe('0%');
        expect(elements.progressFill.parentElement.getAttribute('aria-valuenow')).toBe('0');
    });

    test('reflects mixed active and completed tasks', () => {
        const elements = createDomElements();
        const tasks = [
            { id: 1, description: 'First', completed: true },
            { id: 2, description: 'Second', completed: false },
            { id: 3, description: 'Third', completed: true }
        ];

        updateInsights(tasks, elements);

        expect(elements.totalCount.textContent).toBe('3');
        expect(elements.completedCount.textContent).toBe('2');
        expect(elements.activeCount.textContent).toBe('1');
        expect(elements.progressPercent.textContent).toBe('67%');
        expect(elements.progressFill.style.width).toBe('67%');
        expect(elements.progressFill.parentElement.getAttribute('aria-valuenow')).toBe('67');
    });
});

test.describe('updateWisdomVisibility', () => {
    test('shows wisdom when there are completed tasks', () => {
        const showWisdom = createSpy();
        const hideWisdom = createSpy();
        const tasks = [
            { id: 1, description: 'Done task', completed: true },
            { id: 2, description: 'Active task', completed: false }
        ];

        const hasCompletedTasks = updateWisdomVisibility(tasks, showWisdom, hideWisdom);

        expect(hasCompletedTasks).toBe(true);
        expect(showWisdom.callCount()).toBe(1);
        expect(hideWisdom.callCount()).toBe(0);
    });

    test('hides wisdom when there are no completed tasks', () => {
        const showWisdom = createSpy();
        const hideWisdom = createSpy();
        const tasks = [
            { id: 1, description: 'Active task', completed: false }
        ];

        const hasCompletedTasks = updateWisdomVisibility(tasks, showWisdom, hideWisdom);

        expect(hasCompletedTasks).toBe(false);
        expect(hideWisdom.callCount()).toBe(1);
        expect(showWisdom.callCount()).toBe(0);
    });
});

test.describe('mobile layout', () => {
    test('stays readable without horizontal scrolling at 375px width', async ({ page }) => {
        const fileUrl = 'file://' + path.join(__dirname, '..', 'index.html');
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(fileUrl);

        await page.fill('#taskInput', 'A lengthy task description to make sure wrapping works well on mobile screens.');
        await page.click('#addTaskButton');
        await page.fill('#taskInput', 'Another detailed task that should stay visible without pushing controls off-screen.');
        await page.click('#addTaskButton');

        const hasHorizontalScroll = await page.evaluate(() => {
            const root = document.scrollingElement || document.documentElement;
            return root.scrollWidth > root.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);

        const anyOverflowing = await page.evaluate(() => {
            const viewportWidth = window.innerWidth;
            const elements = [
                ...document.querySelectorAll('.insight-card'),
                ...document.querySelectorAll('#taskList li')
            ];
            return elements.some((el) => {
                const rect = el.getBoundingClientRect();
                return rect.right - 0.5 > viewportWidth;
            });
        });
        expect(anyOverflowing).toBe(false);
    });
});
