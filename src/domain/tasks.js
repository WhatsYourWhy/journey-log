(function (global) {
    function getSelectAllState(tasks) {
        if (!Array.isArray(tasks)) {
            return { checked: false, indeterminate: false };
        }
        const totalTasks = tasks.length;
        if (totalTasks === 0) {
            return { checked: false, indeterminate: false };
        }

        const selectedCount = tasks.filter(task => task.selected).length;
        const checked = selectedCount === totalTasks && totalTasks > 0;
        const indeterminate = selectedCount > 0 && selectedCount < totalTasks;
        return { checked, indeterminate };
    }

    function restoreDeletedTasks(currentTasks, deletedTasks) {
        if (!Array.isArray(deletedTasks) || deletedTasks.length === 0) {
            return currentTasks;
        }

        const existingIds = new Set(currentTasks.map(task => task.id));
        const merged = [
            ...currentTasks.map(task => ({ ...task })),
            ...deletedTasks
                .filter(task => !existingIds.has(task.id))
                .map(task => {
                    const restoredTask = { ...task };
                    if ('selected' in task) {
                        restoredTask.selected = !!task.selected;
                    }
                    return restoredTask;
                })
        ];

        return merged.sort((a, b) => Number(a.id) - Number(b.id));
    }

    function deriveMilestoneState(completedCount, thresholds) {
        const unlocked = thresholds.filter(value => completedCount >= value);
        const next = thresholds.find(value => completedCount < value) ?? null;
        const lastUnlocked = unlocked.length ? unlocked[unlocked.length - 1] : null;
        return { unlocked, next, lastUnlocked };
    }

    function getCompletedTaskForMilestone(tasks, milestoneValue) {
        if (!Array.isArray(tasks)) return null;
        const completedTasks = tasks
            .filter(task => task.completed)
            .sort((a, b) => a.id - b.id);
        if (completedTasks.length === 0) return null;
        const milestoneCount = Number(milestoneValue);
        if (!Number.isFinite(milestoneCount) || milestoneCount <= 0) {
            return completedTasks[completedTasks.length - 1];
        }
        const targetIndex = Math.min(milestoneCount, completedTasks.length) - 1;
        return completedTasks[targetIndex];
    }

    function updateTaskNote(tasks, taskId, noteText) {
        return tasks.map(task => task.id === taskId ? { ...task, note: noteText } : task);
    }

    function getNextOpenNoteId(currentOpenId, toggledId) {
        if (currentOpenId === toggledId) {
            return null;
        }
        return toggledId;
    }

    const api = {
        getSelectAllState,
        restoreDeletedTasks,
        deriveMilestoneState,
        getCompletedTaskForMilestone,
        updateTaskNote,
        getNextOpenNoteId
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogTasks = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
