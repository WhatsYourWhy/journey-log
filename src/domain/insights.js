(function (global) {
    function computeInsights(tasks) {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        return { totalTasks, completedTasks, activeTasks, progress };
    }

    function updateWisdomVisibility(tasks, showWisdom, hideWisdom, options = {}) {
        const { wisdomEnabled = true } = options;
        const hasCompletedTasks = tasks.some(task => task.completed);
        if (hasCompletedTasks && wisdomEnabled) {
            showWisdom();
        } else {
            hideWisdom();
        }
        return hasCompletedTasks;
    }

    const api = { computeInsights, updateWisdomVisibility };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogInsights = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
