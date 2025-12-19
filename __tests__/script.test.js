const { updateInsights, updateWisdomVisibility } = require('../script.js');

function createDomElements() {
    const totalCount = document.createElement('span');
    const completedCount = document.createElement('span');
    const activeCount = document.createElement('span');
    const progressPercent = document.createElement('span');
    const progressBar = document.createElement('div');
    const progressFill = document.createElement('div');

    progressBar.appendChild(progressFill);

    return {
        totalCount,
        completedCount,
        activeCount,
        progressPercent,
        progressFill
    };
}

describe('updateInsights', () => {
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

describe('updateWisdomVisibility', () => {
    test('shows wisdom when there are completed tasks', () => {
        const showWisdom = jest.fn();
        const hideWisdom = jest.fn();
        const tasks = [
            { id: 1, description: 'Done task', completed: true },
            { id: 2, description: 'Active task', completed: false }
        ];

        const hasCompletedTasks = updateWisdomVisibility(tasks, showWisdom, hideWisdom);

        expect(hasCompletedTasks).toBe(true);
        expect(showWisdom).toHaveBeenCalledTimes(1);
        expect(hideWisdom).not.toHaveBeenCalled();
    });

    test('hides wisdom when there are no completed tasks', () => {
        const showWisdom = jest.fn();
        const hideWisdom = jest.fn();
        const tasks = [
            { id: 1, description: 'Active task', completed: false }
        ];

        const hasCompletedTasks = updateWisdomVisibility(tasks, showWisdom, hideWisdom);

        expect(hasCompletedTasks).toBe(false);
        expect(hideWisdom).toHaveBeenCalledTimes(1);
        expect(showWisdom).not.toHaveBeenCalled();
    });
});
