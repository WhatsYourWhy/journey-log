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
    }

    return { totalTasks, completedTasks, activeTasks, progress };
}

function updateWisdomVisibility(tasks, showWisdom, hideWisdom) {
    const hasCompletedTasks = tasks.some(task => task.completed);
    if (hasCompletedTasks) {
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
    const completedTasks = tasks.filter(task => task.completed).length;
    return {
        checked: totalTasks > 0 && completedTasks === totalTasks,
        indeterminate: totalTasks > 0 && completedTasks > 0 && completedTasks < totalTasks
    };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
    const clearCompletedButton = document.getElementById('clearCompletedButton');
    const clearSelectedButton = document.getElementById('clearSelectedButton');
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
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

    let tasks = loadTasks();
    renderTasks();
    updateWisdomVisibility(tasks, showWisdom, hideWisdom);

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
        }
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
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleComplete(task.id));

            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.description;
            if (task.completed) {
                taskSpan.classList.add('completed');
            }

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTask(task.id));

            listItem.appendChild(checkbox);
            listItem.appendChild(taskSpan);
            listItem.appendChild(deleteButton);
            taskList.appendChild(listItem);
        });
        updateInsights(tasks, { totalCount, completedCount, activeCount, progressPercent, progressFill });
        syncSelectAllCheckbox();
    }

    function toggleComplete(taskId) {
        tasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateWisdomVisibility(tasks, showWisdom, hideWisdom);
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateWisdomVisibility(tasks, showWisdom, hideWisdom);
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
    }

    function hideWisdom() {
        wisdomDisplay.classList.add('hidden');
        wisdomText.textContent = '';
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
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
        updateWisdomVisibility(tasks, showWisdom, hideWisdom);
    }

    function isTypingInInput(element) {
        if (!element) return false;
        const tagName = element.tagName;
        const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT'];
        if (interactiveTags.includes(tagName)) {
            return true;
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
