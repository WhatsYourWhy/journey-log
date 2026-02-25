const insightsModule = typeof module !== 'undefined' && module.exports
    ? require('./src/domain/insights')
    : globalThis.JourneyLogInsights;
const tasksModule = typeof module !== 'undefined' && module.exports
    ? require('./src/domain/tasks')
    : globalThis.JourneyLogTasks;
const renderModule = typeof module !== 'undefined' && module.exports
    ? require('./src/ui/render')
    : globalThis.JourneyLogRender;
const appModule = typeof module !== 'undefined' && module.exports
    ? require('./src/app/init')
    : globalThis.JourneyLogApp;

const { computeInsights, updateWisdomVisibility } = insightsModule;
const {
    getSelectAllState,
    restoreDeletedTasks,
    deriveMilestoneState,
    getCompletedTaskForMilestone,
    updateTaskNote,
    getNextOpenNoteId
} = tasksModule;
const { updateInsights } = renderModule;
const {
    createSaveFeedbackController,
    createPerTaskDebouncer,
    pickQuoteForTask,
    resolveWisdomExcludeText,
    initJourneyLogApp
} = appModule;

if (typeof document !== 'undefined' && typeof initJourneyLogApp === 'function') {
    document.addEventListener('DOMContentLoaded', initJourneyLogApp);
}

if (typeof module !== 'undefined') {
    module.exports = {
        computeInsights,
        updateInsights: (tasks, elements) => updateInsights(tasks, elements, computeInsights),
        updateWisdomVisibility,
        getSelectAllState,
        createSaveFeedbackController,
        restoreDeletedTasks,
        deriveMilestoneState,
        getCompletedTaskForMilestone,
        updateTaskNote,
        getNextOpenNoteId,
        createPerTaskDebouncer,
        pickQuoteForTask,
        resolveWisdomExcludeText
    };
}
