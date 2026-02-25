(function (global) {
    function updateInsights(tasks, elements, computeInsights) {
        const insightComputer = computeInsights
            ?? global.JourneyLogInsights?.computeInsights
            ?? ((list) => ({
                totalTasks: list.length,
                completedTasks: list.filter(task => task.completed).length,
                activeTasks: list.filter(task => !task.completed).length,
                progress: list.length === 0 ? 0 : Math.round((list.filter(task => task.completed).length / list.length) * 100)
            }));

        const { totalTasks, completedTasks, activeTasks, progress } = insightComputer(tasks);
        const { totalCount, completedCount, activeCount, progressPercent, progressFill } = elements;

        totalCount.textContent = totalTasks;
        completedCount.textContent = completedTasks;
        activeCount.textContent = activeTasks;
        progressPercent.textContent = `${progress}%`;

        progressFill.style.width = `${progress}%`;
        const progressBar = progressFill.parentElement;
        if (progressBar && progressBar.setAttribute) {
            progressBar.setAttribute('aria-valuenow', progress.toString());
            progressBar.setAttribute('aria-valuetext', `${progress}% complete`);
        }

        return { totalTasks, completedTasks, activeTasks, progress };
    }

    const api = { updateInsights };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
