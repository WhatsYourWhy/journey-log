function computeInsights(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return { totalTasks, completedTasks, activeTasks, progress };
}

function updateInsights(tasks, elements) {
    const { totalTasks, completedTasks, activeTasks, progress } = computeInsights(tasks);
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

function toggleAllTasks(tasks, shouldComplete) {
    return tasks.map(task => ({ ...task, completed: shouldComplete }));
}

function getSelectAllState(tasks) {
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

function createSaveFeedbackController(statusElement, options = {}) {
    const scheduler = options.scheduler ?? setTimeout;
    const clearer = options.clearer ?? clearTimeout;
    const showDelay = options.showDelay ?? 120;
    const displayDuration = options.displayDuration ?? 1500;

    let showTimer = null;
    let hideTimer = null;

    const show = () => {
        if (!statusElement) return;
        statusElement.textContent = 'Saved';
        statusElement.classList.add('visible');
        statusElement.setAttribute('aria-hidden', 'false');
    };

    const hide = () => {
        if (!statusElement) return;
        statusElement.classList.remove('visible');
        statusElement.setAttribute('aria-hidden', 'true');
        statusElement.textContent = '';
    };

    function trigger() {
        if (!statusElement) return;
        if (showTimer) {
            clearer(showTimer);
        }
        if (hideTimer) {
            clearer(hideTimer);
        }

        showTimer = scheduler(() => {
            show();
            hideTimer = scheduler(hide, displayDuration);
        }, showDelay);
    }

    return { trigger };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const clearCompletedButton = document.getElementById('clearCompletedButton');
        const clearSelectedButton = document.getElementById('clearSelectedButton');
        const undoDeleteButton = document.getElementById('undoDeleteButton');
        const taskInput = document.getElementById('taskInput');
        const addTaskButton = document.getElementById('addTaskButton');
        const secondaryAddButton = document.getElementById('secondaryAddButton');
        const addTaskButtonSecondary = document.getElementById('addTaskButtonSecondary');
        const addHelperBubble = document.getElementById('addHelperBubble');
        const inputValidation = document.getElementById('inputValidation');
        const saveStatus = document.getElementById('saveStatus');
        const startCueButton = document.getElementById('startCueButton');
        const taskList = document.getElementById('taskList');
        const inputSection = document.querySelector('.input-section');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const wisdomToggle = document.getElementById('wisdomToggle');
        const wisdomDisplay = document.getElementById('wisdomDisplay');
        const wisdomText = document.getElementById('wisdomText');
        const starterHint = document.getElementById('starterHint');
        const themeSelect = document.getElementById('theme');
        const bodyElement = document.body;
        const totalCount = document.getElementById('totalCount');
        const completedCount = document.getElementById('completedCount');
        const activeCount = document.getElementById('activeCount');
        const progressPercent = document.getElementById('progressPercent');
        const progressFill = document.getElementById('progressFill');
        const emptyState = document.getElementById('emptyState');
        const helperBubbleKey = 'journeySeenAddHelper';
        const wisdomToggleKey = 'journeyWisdomEnabled';
        const supportedThemes = ['comfort', 'forest', 'ocean', 'dark', 'high-contrast'];
        const themeClasses = supportedThemes.map(theme => `${theme}-theme`);
        const defaultTheme = 'comfort';

        let tasks = loadTasks();
        let lastDeletedTasks = [];
        let undoTimeoutId = null;
        const saveFeedback = createSaveFeedbackController(saveStatus);
        updateUndoButtonState(false);

        initializeHelperBubble();
        renderTasks();
        const wisdomEnabled = syncWisdomPreference();
        updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled });
        if (taskInput && taskInput.focus) {
            taskInput.focus();
        }

        applyTheme(localStorage.getItem('journeyTheme'));

        const wisdomQuotes = [
            "The journey of a thousand miles begins with a single step. - Lao Tzu",
            "The only way to do great work is to love what you do. - Steve Jobs",
            "Believe you can and you're halfway there. - Theodore Roosevelt",
            "Our greatest glory is not in never failing, but in rising up every time we fail. - Ralph Waldo Emerson",
            "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
        ];

        function revealInputSection() {
            if (!inputSection) return;
            inputSection.scrollIntoView({ behavior: 'auto', block: 'start' });
            const overflow = inputSection.getBoundingClientRect().bottom - window.innerHeight + 12;
            if (overflow > 0) {
                window.scrollBy({ top: overflow, behavior: 'auto' });
            }
        }

        taskInput?.focus();
        revealInputSection();

        themeSelect?.addEventListener('change', (event) => applyTheme(event.target.value));

        taskInput?.addEventListener('focus', revealInputSection);

        function handleAddFromInput() {
            const rawValue = taskInput?.value ?? '';
            const taskDescription = rawValue.trim();
            if (!taskDescription) {
                showValidationMessage('Please enter a step before adding.');
                taskInput?.focus();
                return;
            }

            const duplicate = tasks.some(
                task => task.description.trim().toLowerCase() === taskDescription.toLowerCase()
            );

            if (duplicate) {
                showValidationMessage('That step already exists. Try a different description.');
                taskInput?.focus();
                return;
            }

            addTask(taskDescription);
            if (taskInput) {
                taskInput.value = '';
                taskInput.focus();
            }
            clearValidationMessage();
        }

        addTaskButton?.addEventListener('click', handleAddFromInput);
        secondaryAddButton?.addEventListener('click', handleAddFromInput);
        addTaskButtonSecondary?.addEventListener('click', handleAddFromInput);

        startCueButton?.addEventListener('click', () => {
            taskInput?.focus();
            taskInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        taskInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleAddFromInput();
            }
        });

        function addTask(description) {
            const task = {
                id: Date.now(),
                description: description,
                completed: false,
                selected: false
            };
            tasks.push(task);
            saveTasks();
            renderTasks();
            dismissHelperBubble();
        }

        function captureFocusDetails(options = {}) {
            const activeElement = document.activeElement;
            const taskId = activeElement?.getAttribute?.('data-task-id') ?? null;
            const control = activeElement?.getAttribute?.('data-control') ?? null;
            const fallback = options.fallback ?? (typeof activeElement?.focus === 'function' ? activeElement : null);
            return { taskId, control, fallback };
        }

        function restoreFocus(focusTarget) {
            if (!focusTarget) {
                return;
            }

            const { taskId, control, fallback } = focusTarget;
            if (taskId && control) {
                const selector = `[data-task-id="${taskId}"][data-control="${control}"]`;
                const elementToFocus = taskList.querySelector(selector);
                if (elementToFocus && typeof elementToFocus.focus === 'function') {
                    elementToFocus.focus();
                    return;
                }
            }

            if (fallback && typeof fallback.focus === 'function') {
                fallback.focus();
            }
        }

        function renderTasks(focusTarget) {
            taskList.innerHTML = '';
            if (tasks.length === 0) {
                emptyState.classList.remove('hidden');
                starterHint.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                starterHint.classList.add('hidden');
            }

            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.dataset.taskId = task.id;

                const selectionWrapper = document.createElement('div');
                selectionWrapper.classList.add('selection-toggle');

                const selectionCheckbox = document.createElement('input');
                selectionCheckbox.type = 'checkbox';
                selectionCheckbox.checked = !!task.selected;
                selectionCheckbox.setAttribute('aria-label', `Select ${task.description}`);
                selectionCheckbox.dataset.taskId = task.id;
                selectionCheckbox.dataset.control = 'selection';
                selectionCheckbox.setAttribute('data-testid', 'select-checkbox');
                selectionCheckbox.addEventListener('change', (event) => toggleSelection(task.id, event.target.checked));

                selectionWrapper.appendChild(selectionCheckbox);

                const completionCheckbox = document.createElement('input');
                completionCheckbox.type = 'checkbox';
                completionCheckbox.checked = task.completed;
                completionCheckbox.dataset.taskId = task.id;
                completionCheckbox.dataset.control = 'complete';
                completionCheckbox.setAttribute('data-testid', 'complete-checkbox');
                completionCheckbox.setAttribute('aria-label', `Mark ${task.description} as completed`);
                completionCheckbox.addEventListener('change', () => toggleComplete(task.id));

                const taskSpan = document.createElement('span');
                taskSpan.textContent = task.description;
                if (task.completed) {
                    taskSpan.classList.add('completed');
                }

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.dataset.taskId = task.id;
                deleteButton.dataset.control = 'delete';
                deleteButton.setAttribute('aria-label', `Delete ${task.description}`);
                deleteButton.addEventListener('click', () => deleteTask(task.id));

                listItem.appendChild(selectionWrapper);
                listItem.appendChild(completionCheckbox);
                listItem.appendChild(taskSpan);
                listItem.appendChild(deleteButton);
                taskList.appendChild(listItem);
            });
            updateInsights(tasks, { totalCount, completedCount, activeCount, progressPercent, progressFill });
            syncSelectAllCheckbox();
            updateSelectionActions();
            if (focusTarget) {
                restoreFocus(focusTarget);
            }
        }

        function toggleComplete(taskId) {
            const focusTarget = captureFocusDetails();
            tasks = tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function toggleSelection(taskId, isSelected) {
            tasks = tasks.map(task =>
                task.id === taskId ? { ...task, selected: isSelected } : task
            );
            saveTasks();
            syncSelectAllCheckbox();
            updateSelectionActions();
        }

        function deleteTask(taskId) {
            const focusTarget = captureFocusDetails({ fallback: taskInput });
            const removedTasks = tasks.filter(task => task.id === taskId);
            if (removedTasks.length === 0) {
                return;
            }
            rememberDeletedTasks(removedTasks);
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function saveTasks() {
            localStorage.setItem('journeyTasks', JSON.stringify(tasks));
            saveFeedback.trigger();
        }

        function normalizeTask(task) {
            if (!task || typeof task !== 'object') return null;
            return {
                id: task.id,
                description: task.description,
                completed: !!task.completed,
                selected: !!task.selected
            };
        }

        function loadTasks() {
            const storedTasks = localStorage.getItem('journeyTasks');
            if (!storedTasks) {
                return [];
            }

            try {
                const parsed = JSON.parse(storedTasks);
                return Array.isArray(parsed)
                    ? parsed.map(normalizeTask).filter(Boolean)
                    : [];
            } catch (error) {
                console.warn('Failed to parse stored tasks, clearing corrupted data.', error);
                localStorage.removeItem('journeyTasks');
                return [];
            }
        }

        function showWisdom() {
            if (!wisdomDisplay || !wisdomText) return;
            const randomIndex = Math.floor(Math.random() * wisdomQuotes.length);
            wisdomText.textContent = wisdomQuotes[randomIndex];
            wisdomDisplay.classList.remove('hidden');
            wisdomDisplay.setAttribute('aria-expanded', 'true');
        }

        function hideWisdom() {
            if (!wisdomDisplay || !wisdomText) return;
            wisdomDisplay.classList.add('hidden');
            wisdomText.textContent = '';
            wisdomDisplay.setAttribute('aria-expanded', 'false');
        }

        function clearCompletedTasks() {
            const focusTarget = captureFocusDetails({ fallback: clearCompletedButton });
            const completedTasks = tasks.filter(task => task.completed);
            if (completedTasks.length === 0) {
                return;
            }
            rememberDeletedTasks(completedTasks);
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function clearSelectedTasks() {
            const focusTarget = captureFocusDetails({ fallback: clearSelectedButton });
            const selectedTasks = tasks.filter(task => task.selected);
            if (selectedTasks.length === 0) {
                showValidationMessage('Select one or more steps to clear.');
                return;
            }
            rememberDeletedTasks(selectedTasks);
            tasks = tasks.filter(task => !task.selected);
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function syncSelectAllCheckbox() {
            if (!selectAllCheckbox) return;
            const { checked, indeterminate } = getSelectAllState(tasks);
            selectAllCheckbox.checked = checked;
            selectAllCheckbox.indeterminate = indeterminate;
            selectAllCheckbox.disabled = tasks.length === 0;
        }

        function handleSelectAllChange(event) {
            const shouldSelect = event.target.checked;
            tasks = tasks.map(task => ({ ...task, selected: shouldSelect }));
            saveTasks();
            renderTasks();
            updateSelectionActions();
        }

        function isTypingInInput(element) {
            if (!element) return false;
            const tagName = element.tagName;
            if (tagName === 'TEXTAREA' || tagName === 'SELECT') {
                return true;
            }

            if (tagName === 'INPUT') {
                const textInputTypes = ['text', 'search', 'email', 'url', 'password', 'tel', 'number'];
                return textInputTypes.includes((element.type || '').toLowerCase());
            }
            return element.isContentEditable === true;
        }

        function handleKeyboardShortcuts(event) {
            const isModifier = event.ctrlKey || event.metaKey;
            if (!isModifier) return;

            const activeElement = document.activeElement;
            const typingInInput = isTypingInInput(activeElement);

            if (event.key === 'Enter' && !event.shiftKey) {
                if (activeElement === taskInput) {
                    event.preventDefault();
                    addTaskButton?.click();
                }
                return;
            }

            if (event.key.toLowerCase() === 'c' && event.shiftKey) {
                if (typingInInput && activeElement !== taskInput) {
                    return;
                }
                event.preventDefault();
                clearCompletedTasks();
            }
        }

        function updateSelectionActions() {
            if (clearSelectedButton) {
                const selectedCount = tasks.filter(task => task.selected).length;
                clearSelectedButton.disabled = selectedCount === 0;
            }
        }

        function rememberDeletedTasks(removedTasks) {
            if (undoTimeoutId) {
                clearTimeout(undoTimeoutId);
            }
            lastDeletedTasks = removedTasks.map(task => ({ ...task, selected: false }));
            updateUndoButtonState(true);
            undoTimeoutId = setTimeout(() => {
                lastDeletedTasks = [];
                updateUndoButtonState(false);
            }, 8000);
        }

        function updateUndoButtonState(hasUndo) {
            if (!undoDeleteButton) return;
            undoDeleteButton.disabled = !hasUndo;
            undoDeleteButton.classList.toggle('hidden', !hasUndo);
        }

        function undoLastDelete() {
            if (lastDeletedTasks.length === 0) {
                return;
            }
            const focusTarget = captureFocusDetails({ fallback: taskInput });
            tasks = restoreDeletedTasks(tasks, lastDeletedTasks);
            lastDeletedTasks = [];
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
            updateUndoButtonState(false);
            if (undoTimeoutId) {
                clearTimeout(undoTimeoutId);
                undoTimeoutId = null;
            }
        }

        function showValidationMessage(message) {
            if (inputValidation) {
                inputValidation.textContent = message;
                inputValidation.classList.remove('hidden');
                inputValidation.setAttribute('aria-hidden', 'false');
            } else if (addHelperBubble) {
                addHelperBubble.textContent = message;
                addHelperBubble.classList.remove('hidden');
                addHelperBubble.setAttribute('aria-hidden', 'false');
            }
        }

        function clearValidationMessage() {
            if (inputValidation) {
                inputValidation.textContent = '';
                inputValidation.classList.add('hidden');
                inputValidation.setAttribute('aria-hidden', 'true');
            }
        }

        function isWisdomEnabled() {
            const stored = localStorage.getItem(wisdomToggleKey);
            if (stored === null) {
                localStorage.setItem(wisdomToggleKey, 'true');
                return true;
            }
            return stored === 'true';
        }

        function syncWisdomPreference() {
            const enabled = isWisdomEnabled();
            if (wisdomToggle) {
                wisdomToggle.checked = enabled;
            }
            return enabled;
        }

        function showHelperBubble() {
            if (!addHelperBubble) return;
            addHelperBubble.classList.remove('hidden');
            addHelperBubble.setAttribute('aria-hidden', 'false');
        }

        function hideHelperBubble(markSeen = false) {
            if (!addHelperBubble) return;
            addHelperBubble.classList.add('hidden');
            addHelperBubble.setAttribute('aria-hidden', 'true');
            if (markSeen) {
                localStorage.setItem(helperBubbleKey, 'true');
            }
        }

        function initializeHelperBubble() {
            const helperSeen = localStorage.getItem(helperBubbleKey) === 'true';
            if (tasks.length > 0) {
                hideHelperBubble(true);
                return;
            }

            if (!helperSeen) {
                showHelperBubble();
            } else {
                hideHelperBubble();
            }
        }

        function dismissHelperBubble() {
            hideHelperBubble(true);
        }

        function normalizeTheme(theme) {
            if (theme === 'default') {
                return defaultTheme;
            }
            return supportedThemes.includes(theme) ? theme : defaultTheme;
        }

        function applyTheme(themeValue) {
            const normalizedTheme = normalizeTheme(themeValue);
            document.documentElement.classList.remove(...themeClasses);
            document.documentElement.classList.add(`${normalizedTheme}-theme`);
            bodyElement.classList.remove(...themeClasses);
            bodyElement.classList.add(`${normalizedTheme}-theme`);
            document.documentElement.dataset.theme = normalizedTheme;
            bodyElement.dataset.theme = normalizedTheme;
            if (normalizedTheme === 'high-contrast') {
                if (addTaskButton) {
                    addTaskButton.style.cssText = [
                        'background: #ffd60a !important',
                        'background-color: #ffd60a !important',
                        'color: #0d0d0d !important',
                        'border-color: #ffb700 !important'
                    ].join('; ');
                }
                bodyElement.style.setProperty('background-color', '#000000', 'important');
                bodyElement.style.setProperty('color', '#ffffff', 'important');
            } else {
                if (addTaskButton) {
                    addTaskButton.style.cssText = '';
                }
                bodyElement.style.removeProperty('background-color');
                bodyElement.style.removeProperty('color');
            }
            if (themeSelect && themeSelect.value !== normalizedTheme) {
                themeSelect.value = normalizedTheme;
            }
            localStorage.setItem('journeyTheme', normalizedTheme);
        }

        clearCompletedButton?.addEventListener('click', clearCompletedTasks);
        clearSelectedButton?.addEventListener('click', clearSelectedTasks);
        undoDeleteButton?.addEventListener('click', undoLastDelete);
        selectAllCheckbox?.addEventListener('change', handleSelectAllChange);
        document.addEventListener('keydown', handleKeyboardShortcuts);
        wisdomToggle?.addEventListener('change', () => {
            const newValue = wisdomToggle.checked;
            localStorage.setItem(wisdomToggleKey, newValue ? 'true' : 'false');
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: newValue });
        });
    });
}

if (typeof module !== 'undefined') {
    module.exports = {
        computeInsights,
        updateInsights,
        updateWisdomVisibility,
        toggleAllTasks,
        getSelectAllState,
        createSaveFeedbackController,
        restoreDeletedTasks
    };
}
