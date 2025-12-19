console.log("JavaScript file loaded!");

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

    const completedCount = tasks.filter(task => task.completed).length;
    const checked = completedCount === totalTasks;
    const indeterminate = completedCount > 0 && completedCount < totalTasks;
    return { checked, indeterminate };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
    const clearCompletedButton = document.getElementById('clearCompletedButton');
    const clearSelectedButton = document.getElementById('clearSelectedButton');
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const addHelperBubble = document.getElementById('addHelperBubble');
    const startCueButton = document.getElementById('startCueButton');
    const taskList = document.getElementById('taskList');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const wisdomDisplay = document.getElementById('wisdomDisplay');
    const wisdomText = document.getElementById('wisdomText');
    const themeSelect = document.getElementById('theme');
    const bodyElement = document.body;
    const totalCount = document.getElementById('totalCount');
    const completedCount = document.getElementById('completedCount');
    const activeCount = document.getElementById('activeCount');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const emptyState = document.getElementById('emptyState');
    const helperBubbleKey = 'journeySeenAddHelper';
    const wisdomToggle = document.getElementById('wisdomToggle');
    const wisdomToggleKey = 'journeyShowWisdom';

    let tasks = loadTasks();
    initializeHelperBubble();
    renderTasks();
    syncWisdomPreference();
    updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
    if (taskInput && taskInput.focus) {
        taskInput.focus();
    }

    const savedTheme = localStorage.getItem('journeyTheme');
    if (savedTheme) {
        themeSelect.value = savedTheme;
        bodyElement.className = savedTheme === 'default' ? '' : `${savedTheme}-theme`;
    }

    const wisdomQuotes = [
        "The journey of a thousand miles begins with a single step. - Lao Tzu",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "Our greatest glory is not in never failing, but in rising up every time we fail. - Ralph Waldo Emerson",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
    ];

    taskInput?.focus();

    themeSelect.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;
        bodyElement.className = selectedTheme === 'default' ? '' : `${selectedTheme}-theme`;
        localStorage.setItem('journeyTheme', selectedTheme); // Save the selected theme
    });

    addTaskButton.addEventListener('click', () => {
        const taskDescription = taskInput.value.trim();
        if (taskDescription) {
            addTask(taskDescription);
            taskInput.value = '';
            taskInput.focus();
        }
    });

    startCueButton?.addEventListener('click', () => {
        taskInput?.focus();
        taskInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTaskButton.click();
        }
    });

    function addTask(description) {
        const task = {
            id: Date.now(),
            description: description,
            completed: false
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
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.dataset.taskId = task.id;
            checkbox.dataset.control = 'checkbox';
            checkbox.addEventListener('change', () => toggleComplete(task.id));

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

            listItem.appendChild(checkbox);
            listItem.appendChild(taskSpan);
            listItem.appendChild(deleteButton);
            taskList.appendChild(listItem);
        });
        updateInsights(tasks, { totalCount, completedCount, activeCount, progressPercent, progressFill });
        syncSelectAllCheckbox();
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

    function deleteTask(taskId) {
        const focusTarget = captureFocusDetails({ fallback: taskInput });
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks(focusTarget);
        updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
    }

    function saveTasks() {
        localStorage.setItem('journeyTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('journeyTasks');
        if (!storedTasks) {
            return [];
        }

        try {
            return JSON.parse(storedTasks);
        } catch (error) {
            console.warn('Failed to parse stored tasks, clearing corrupted data.', error);
            localStorage.removeItem('journeyTasks');
            return [];
        }
    }

    function showWisdom() {
        const randomIndex = Math.floor(Math.random() * wisdomQuotes.length);
        wisdomText.textContent = wisdomQuotes[randomIndex];
        wisdomDisplay.classList.remove('hidden');
        wisdomDisplay.setAttribute('aria-expanded', 'true');
    }

    function hideWisdom() {
        wisdomDisplay.classList.add('hidden');
        wisdomText.textContent = '';
        wisdomDisplay.setAttribute('aria-expanded', 'false');
    }

    function clearCompletedTasks() {
        const focusTarget = captureFocusDetails({ fallback: clearCompletedButton });
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks(focusTarget);
        updateWisdomVisibility(tasks, showWisdom, hideWisdom);
    }

    function clearSelectedTasks() {
        clearCompletedTasks();
    }

    function syncSelectAllCheckbox() {
        const { checked, indeterminate } = getSelectAllState(tasks);
        selectAllCheckbox.checked = checked;
        selectAllCheckbox.indeterminate = indeterminate;
        selectAllCheckbox.disabled = tasks.length === 0;
    }

    function handleSelectAllChange(event) {
        const shouldComplete = event.target.checked;
        tasks = toggleAllTasks(tasks, shouldComplete);
        saveTasks();
        renderTasks();
        updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
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
                addTaskButton.click();
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

    clearCompletedButton.addEventListener('click', clearCompletedTasks);
    clearSelectedButton.addEventListener('click', clearSelectedTasks);
    selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    wisdomToggle?.addEventListener('change', () => {
        const newValue = wisdomToggle.checked;
        localStorage.setItem(wisdomToggleKey, newValue ? 'true' : 'false');
        updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: newValue });
    });

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

    function syncWisdomPreference() {
        const storedPreference = localStorage.getItem(wisdomToggleKey);
        if (!wisdomToggle) return;
        if (storedPreference === 'false') {
            wisdomToggle.checked = false;
        } else {
            wisdomToggle.checked = true;
        }
    }

    function isWisdomEnabled() {
        if (!wisdomToggle) return true;
        return wisdomToggle.checked;
    }
});
}

if (typeof module !== 'undefined') {
    module.exports = {
        computeInsights,
        updateInsights,
        updateWisdomVisibility,
        toggleAllTasks,
        getSelectAllState
    };
}
