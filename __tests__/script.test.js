const { test, expect } = require('@playwright/test');
const {
    computeInsights,
    updateInsights,
    updateWisdomVisibility,
    createSaveFeedbackController,
    restoreDeletedTasks,
    getSelectAllState,
    deriveMilestoneState,
    updateTaskNote,
    getNextOpenNoteId,
    pickQuoteForTask
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
        const initial = getSelectAllState();
        expect(initial).toEqual({ checked: false, indeterminate: false });

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

    test('ignores note metadata when summarizing progress', () => {
        const tasks = [
            { id: 1, completed: true, note: 'Thoughts' },
            { id: 2, completed: false, note: 'More notes' }
        ];

        const result = computeInsights(tasks);

        expect(result).toEqual({
            totalTasks: 2,
            completedTasks: 1,
            activeTasks: 1,
            progress: 50
        });
    });
});

test.describe('note handling helpers', () => {
    test('persists note content on the correct task', () => {
        const tasks = [
            { id: 1, note: '', completed: false },
            { id: 2, note: 'Keep', completed: true }
        ];

        const updated = updateTaskNote(tasks, 1, 'New note');

        expect(updated).toEqual([
            { id: 1, note: 'New note', completed: false },
            { id: 2, note: 'Keep', completed: true }
        ]);
    });

    test('toggles open note id', () => {
        expect(getNextOpenNoteId(null, 5)).toBe(5);
        expect(getNextOpenNoteId(5, 5)).toBeNull();
        expect(getNextOpenNoteId(5, 6)).toBe(6);
    });

    test('keeps completion state and metadata when updating notes', () => {
        const tasks = [
            { id: 1, note: '', completed: true, mood: 'bright', selected: true }
        ];

        const updated = updateTaskNote(tasks, 1, 'Reflection');

        expect(updated[0]).toEqual({
            id: 1,
            note: 'Reflection',
            completed: true,
            mood: 'bright',
            selected: true
        });
    });
});

test.describe('milestones and wisdom', () => {
    test('derives milestone state based on thresholds', () => {
        const state = deriveMilestoneState(12, [5, 10, 20]);

        expect(state).toEqual({
            unlocked: [5, 10],
            next: 20,
            lastUnlocked: 10
        });
    });

    test('picks contextual wisdom for metadata', () => {
        const task = { mood: 'bright', category: '', priority: 'high' };
        const wisdomSet = {
            mood: { bright: [{ text: 'Hello', author: 'Test' }] },
            category: {},
            priority: { high: [{ text: 'High', author: 'Test' }] },
            fallback: []
        };

        const quote = pickQuoteForTask(task, wisdomSet);

        expect(['Hello', 'High']).toContain(quote.text);
    });

    test('avoids repeating the same quote when alternative exists', () => {
        const task = { mood: 'bright', category: '', priority: '' };
        const wisdomSet = {
            mood: { bright: [{ text: 'First', author: 'Test' }, { text: 'Second', author: 'Test' }] },
            category: {},
            priority: {},
            fallback: []
        };

        const first = pickQuoteForTask(task, wisdomSet);
        const second = pickQuoteForTask(task, wisdomSet, { excludeText: first.text });

        expect(second.text).not.toBe(first.text);
    });
});
