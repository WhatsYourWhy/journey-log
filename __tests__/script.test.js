const { test, expect } = require('@playwright/test');
const {
    computeInsights,
    updateInsights,
    updateWisdomVisibility,
    createSaveFeedbackController,
    restoreDeletedTasks,
    getSelectAllState
} = require('../script.js');

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

function createStatusElement() {
    const classes = new Set();
    return {
        textContent: '',
        attributes: {},
        classList: {
            add: (...tokens) => tokens.forEach(token => classes.add(token)),
            remove: (...tokens) => tokens.forEach(token => classes.delete(token)),
            has: (token) => classes.has(token)
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        getAttribute(name) {
            return this.attributes[name] ?? null;
        }
    };
}

function createFakeScheduler() {
    let tasks = [];
    let lastId = 0;

    const scheduler = (callback) => {
        const id = ++lastId;
        tasks.push({ id, callback });
        return id;
    };

    const clearer = (id) => {
        tasks = tasks.filter(task => task.id !== id);
    };

    const runNext = () => {
        const nextTask = tasks.shift();
        nextTask?.callback();
    };

    const pendingCount = () => tasks.length;

    return { scheduler, clearer, runNext, pendingCount };
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
        expect(elements.progressFill.parentElement.getAttribute('aria-valuetext')).toBe('0% complete');
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
        expect(elements.progressFill.parentElement.getAttribute('aria-valuetext')).toBe('67% complete');
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

    test('respects disabled wisdom option even with completed tasks', () => {
        const showWisdom = createSpy();
        const hideWisdom = createSpy();
        const tasks = [
            { id: 1, description: 'Done task', completed: true }
        ];

        const hasCompletedTasks = updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: false });

        expect(hasCompletedTasks).toBe(true);
        expect(hideWisdom.callCount()).toBe(1);
        expect(showWisdom.callCount()).toBe(0);
    });
});

test.describe('restoreDeletedTasks', () => {
    test('restores deleted tasks and keeps order by id', () => {
        const currentTasks = [
            { id: 2, description: 'Existing', completed: false }
        ];
        const deletedTasks = [
            { id: 1, description: 'Deleted first', completed: true }
        ];

        const result = restoreDeletedTasks(currentTasks, deletedTasks);

        expect(result).toEqual([
            { id: 1, description: 'Deleted first', completed: true },
            { id: 2, description: 'Existing', completed: false }
        ]);
    });

    test('returns existing tasks when there is nothing to restore', () => {
        const currentTasks = [{ id: 3, description: 'Only task', completed: false }];
        const result = restoreDeletedTasks(currentTasks, []);

        expect(result).toEqual(currentTasks);
    });

    test('ignores duplicates and normalizes restored selection flag', () => {
        const currentTasks = [
            { id: 1, description: 'Existing', completed: false, selected: true }
        ];
        const deletedTasks = [
            { id: 1, description: 'Existing duplicate', completed: true, selected: true },
            { id: 2, description: 'Newly deleted', completed: false, selected: 'truthy' }
        ];

        const result = restoreDeletedTasks(currentTasks, deletedTasks);

        expect(result).toEqual([
            { id: 1, description: 'Existing', completed: false, selected: true },
            { id: 2, description: 'Newly deleted', completed: false, selected: true }
        ]);
    });
});

test.describe('createSaveFeedbackController', () => {
    test('debounces and hides the saved indicator after the display duration', () => {
        const statusElement = createStatusElement();
        const timers = createFakeScheduler();
        const controller = createSaveFeedbackController(statusElement, {
            scheduler: timers.scheduler,
            clearer: timers.clearer,
            displayDuration: 50,
            showDelay: 5
        });

        controller.trigger();
        controller.trigger();
        expect(timers.pendingCount()).toBe(1);

        timers.runNext(); // show
        expect(statusElement.textContent).toBe('Saved');
        expect(statusElement.classList.has('visible')).toBe(true);
        expect(statusElement.getAttribute('aria-hidden')).toBe('false');

        controller.trigger();
        expect(timers.pendingCount()).toBe(1);

        timers.runNext(); // show again, schedules hide
        timers.runNext(); // hide
        expect(statusElement.textContent).toBe('');
        expect(statusElement.classList.has('visible')).toBe(false);
        expect(statusElement.getAttribute('aria-hidden')).toBe('true');
    });
});

test.describe('computeInsights and getSelectAllState', () => {
    test('summarizes task progress', () => {
        const tasks = [
            { id: 1, completed: true },
            { id: 2, completed: false }
        ];

        const result = computeInsights(tasks);

        expect(result).toEqual({
            totalTasks: 2,
            completedTasks: 1,
            activeTasks: 1,
            progress: 50
        });
    });

    test('derives select-all state', () => {
        const unselected = getSelectAllState([
            { id: 1, selected: false },
            { id: 2, selected: false }
        ]);
        expect(unselected).toEqual({ checked: false, indeterminate: false });

        const partial = getSelectAllState([
            { id: 1, selected: true },
            { id: 2, selected: false },
            { id: 3, selected: false }
        ]);
        expect(partial).toEqual({ checked: false, indeterminate: true });

        const all = getSelectAllState([
            { id: 1, selected: true },
            { id: 2, selected: true }
        ]);
        expect(all).toEqual({ checked: true, indeterminate: false });
    });
});
