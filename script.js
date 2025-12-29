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

function deriveMilestoneState(completedCount, thresholds) {
    const unlocked = thresholds.filter(value => completedCount >= value);
    const next = thresholds.find(value => completedCount < value) ?? null;
    const lastUnlocked = unlocked.length ? unlocked[unlocked.length - 1] : null;
    return { unlocked, next, lastUnlocked };
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

function pickQuoteForTask(task, wisdomSet) {
    if (!task || !wisdomSet) return null;
    const pools = [];
    if (task.mood && Array.isArray(wisdomSet.mood?.[task.mood])) {
        pools.push(...wisdomSet.mood[task.mood]);
    }
    if (task.category && Array.isArray(wisdomSet.category?.[task.category])) {
        pools.push(...wisdomSet.category[task.category]);
    }
    if (task.priority && Array.isArray(wisdomSet.priority?.[task.priority])) {
        pools.push(...wisdomSet.priority[task.priority]);
    }
    if (pools.length === 0) {
        pools.push(...(wisdomSet.fallback ?? []));
    }
    if (pools.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pools.length);
    return pools[randomIndex];
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
        const wisdomAttribution = document.getElementById('wisdomAttribution');
        const refreshWisdomButton = document.getElementById('refreshWisdom');
        const starterHint = document.getElementById('starterHint');
        const themeSelect = document.getElementById('theme');
        const artfulModeToggle = document.getElementById('artfulMode');
        const bodyElement = document.body;
        const totalCount = document.getElementById('totalCount');
        const completedCount = document.getElementById('completedCount');
        const activeCount = document.getElementById('activeCount');
        const progressPercent = document.getElementById('progressPercent');
        const progressFill = document.getElementById('progressFill');
        const emptyState = document.getElementById('emptyState');
        const carouselPrompt = document.getElementById('carouselPrompt');
        const shufflePrompt = document.getElementById('shufflePrompt');
        const milestoneStrip = document.getElementById('milestoneStrip');
        const moodSelect = document.getElementById('moodSelect');
        const categorySelect = document.getElementById('categorySelect');
        const priorityButtons = document.querySelectorAll('.priority');

        const helperBubbleKey = 'journeySeenAddHelper';
        const wisdomToggleKey = 'journeyWisdomEnabled';
        const milestoneKey = 'journeyMilestone';
        const artfulModeKey = 'journeyArtfulMode';
        const supportedThemes = ['comfort', 'forest', 'ocean', 'dark', 'high-contrast'];
        const themeClasses = supportedThemes.map(theme => `${theme}-theme`);
        const defaultTheme = 'comfort';
        const milestoneThresholds = [5, 10, 20];
        const promptCarousel = [
            'Sketch a mini ritual that makes today feel special.',
            'Plan a 5-minute adventure that sparks curiosity.',
            'Write a one-line story for a step you want to take.',
            'Find a small act of kindness you can do right now.',
            'Turn a routine into a tiny celebration today.'
        ];
        const wisdomQuotes = {
            mood: {
                bright: [
                    { text: 'Your spark lights the path ahead.', author: 'Journey Log' },
                    { text: 'Joy is a compass—follow where it points.', author: 'Journey Log' }
                ],
                calm: [
                    { text: 'Steady breaths make steady steps.', author: 'Journey Log' },
                    { text: 'Quiet focus is still forward motion.', author: 'Journey Log' }
                ],
                focused: [
                    { text: 'Precision today, momentum tomorrow.', author: 'Journey Log' },
                    { text: 'Aim true; the path shortens.', author: 'Journey Log' }
                ],
                reflective: [
                    { text: 'Looking back helps the next stride land.', author: 'Journey Log' },
                    { text: 'Pause, notice, and carry the insight forward.', author: 'Journey Log' }
                ]
            },
            category: {
                wellness: [
                    { text: 'Care for your energy and the journey cares for you.', author: 'Journey Log' }
                ],
                creative: [
                    { text: 'Tiny experiments build big worlds.', author: 'Journey Log' }
                ],
                planning: [
                    { text: 'A map drawn today shortens tomorrow.', author: 'Journey Log' }
                ],
                connection: [
                    { text: 'Bridges grow stronger one hello at a time.', author: 'Journey Log' }
                ]
            },
            priority: {
                low: [
                    { text: 'Soft steps still leave footprints.', author: 'Journey Log' }
                ],
                medium: [
                    { text: 'Balanced effort keeps you moving.', author: 'Journey Log' }
                ],
                high: [
                    { text: 'When it matters most, every move counts.', author: 'Journey Log' }
                ]
            },
            fallback: [
                { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
                { text: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
                { text: 'Our greatest glory is not in never failing, but in rising up every time we fail.', author: 'Ralph Waldo Emerson' },
                { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' }
            ]
        };

        let tasks = loadTasks();
        let lastDeletedTasks = [];
        let undoTimeoutId = null;
        let activeWisdomTaskId = null;
        let openNoteId = null;
        let carouselIndex = 0;
        let carouselTimer = null;
        let pendingPriority = '';
        const saveFeedback = createSaveFeedbackController(saveStatus);
        updateUndoButtonState(false);

        initializeHelperBubble();
        renderTasks();
        const wisdomEnabled = syncWisdomPreference();
        updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled });
        taskInput?.focus();
        revealInputSection();
        applyTheme(localStorage.getItem('journeyTheme'));
        syncArtfulMode();
        startPromptCarousel();

        themeSelect?.addEventListener('change', (event) => applyTheme(event.target.value));
        artfulModeToggle?.addEventListener('change', handleArtfulToggle);
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

            const mood = moodSelect?.value ?? '';
            const category = categorySelect?.value ?? '';
            const priority = pendingPriority;

            addTask(taskDescription, { mood, category, priority });
            if (taskInput) {
                taskInput.value = '';
                taskInput.focus();
            }
            if (moodSelect) moodSelect.value = '';
            if (categorySelect) categorySelect.value = '';
            setPrioritySelection('');
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

        shufflePrompt?.addEventListener('click', shuffleCarouselPrompt);

        priorityButtons.forEach(button => {
            button.addEventListener('click', () => setPrioritySelection(button.dataset.priority));
        });

        refreshWisdomButton?.addEventListener('click', () => {
            if (!activeWisdomTaskId) return;
            const task = tasks.find(t => t.id === activeWisdomTaskId);
            if (!task) return;
            displayWisdomForTask(task, { forceRefresh: true });
        });

        function addTask(description, meta = {}) {
            const task = {
                id: Date.now(),
                description: description,
                completed: false,
                selected: false,
                mood: meta.mood || '',
                category: meta.category || '',
                priority: meta.priority || '',
                note: ''
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
            setPromptForEmptyState();

            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.dataset.taskId = task.id;
                listItem.classList.toggle('completed', task.completed);

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

                const taskContent = document.createElement('div');
                taskContent.classList.add('task-content');

                const taskSpan = document.createElement('span');
                taskSpan.textContent = task.description;
                taskSpan.dataset.taskId = task.id;
                taskSpan.dataset.control = 'description';
                if (task.completed) {
                    taskSpan.classList.add('completed');
                }

                const badgeRow = document.createElement('div');
                badgeRow.classList.add('badge-row');
                appendBadgeIfValue(badgeRow, task.mood, 'mood');
                appendBadgeIfValue(badgeRow, task.category, 'category');
                appendBadgeIfValue(badgeRow, task.priority, 'priority');
                if (task.note && task.note.trim().length > 0) {
                    appendBadgeIfValue(badgeRow, 'note', 'note');
                }

                const noteToggle = document.createElement('button');
                noteToggle.type = 'button';
                noteToggle.classList.add('note-toggle');
                noteToggle.dataset.taskId = task.id;
                noteToggle.dataset.control = 'note-toggle';
                noteToggle.setAttribute('aria-expanded', openNoteId === task.id ? 'true' : 'false');
                noteToggle.setAttribute('aria-label', task.note ? `Edit note for ${task.description}` : `Add note for ${task.description}`);
                noteToggle.textContent = task.note ? 'Note added' : 'Add note';
                noteToggle.addEventListener('click', () => toggleNote(task.id));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.dataset.taskId = task.id;
                deleteButton.dataset.control = 'delete';
                deleteButton.setAttribute('aria-label', `Delete ${task.description}`);
                deleteButton.addEventListener('click', () => deleteTask(task.id));

                const noteContainer = document.createElement('div');
                noteContainer.classList.add('note-container');
                if (openNoteId !== task.id) {
                    noteContainer.classList.add('hidden');
                }

                const noteLabel = document.createElement('label');
                noteLabel.classList.add('sr-only');
                noteLabel.setAttribute('for', `note-${task.id}`);
                noteLabel.textContent = `Note for ${task.description}`;

                const noteInput = document.createElement('textarea');
                noteInput.id = `note-${task.id}`;
                noteInput.value = task.note ?? '';
                noteInput.dataset.taskId = task.id;
                noteInput.dataset.control = 'note-input';
                noteInput.setAttribute('aria-label', `Add a note for ${task.description}`);
                noteInput.addEventListener('input', (event) => handleNoteInput(task.id, event.target.value));

                noteContainer.appendChild(noteLabel);
                noteContainer.appendChild(noteInput);

                taskContent.appendChild(taskSpan);
                if (badgeRow.children.length > 0) {
                    taskContent.appendChild(badgeRow);
                }
                taskContent.appendChild(noteToggle);
                taskContent.appendChild(noteContainer);

                listItem.appendChild(selectionWrapper);
                listItem.appendChild(completionCheckbox);
                listItem.appendChild(taskContent);
                listItem.appendChild(deleteButton);

                listItem.addEventListener('focusin', () => handleTaskFocus(task.id));

                taskList.appendChild(listItem);
            });
            const insightData = updateInsights(tasks, { totalCount, completedCount, activeCount, progressPercent, progressFill });
            updateMilestones(insightData.completedTasks);
            syncSelectAllCheckbox();
            updateSelectionActions();
            if (focusTarget) {
                restoreFocus(focusTarget);
            }
            updateWisdomVisibility(tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function toggleComplete(taskId) {
            const focusTarget = captureFocusDetails();
            tasks = tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
            saveTasks();
            renderTasks(focusTarget);
            const target = tasks.find(task => task.id === taskId);
            if (target?.completed) {
                displayWisdomForTask(target);
            } else if (activeWisdomTaskId === taskId) {
                activeWisdomTaskId = null;
                hideWisdom();
            }
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
                selected: !!task.selected,
                mood: task.mood || '',
                category: task.category || '',
                priority: task.priority || '',
                note: task.note ?? ''
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
            wisdomDisplay.classList.remove('hidden');
            wisdomDisplay.setAttribute('aria-expanded', 'true');
            if (activeWisdomTaskId) {
                const task = tasks.find(t => t.id === activeWisdomTaskId);
                if (task) {
                    displayWisdomForTask(task, { forceRefresh: true });
                    return;
                }
            }
            const fallbackQuote = pickQuoteForTask({ mood: '', category: '', priority: '' }, wisdomQuotes);
            if (fallbackQuote) {
                renderWisdomText(fallbackQuote);
            }
        }

        function hideWisdom() {
            if (!wisdomDisplay || !wisdomText) return;
            wisdomDisplay.classList.add('hidden');
            wisdomText.textContent = '';
            wisdomAttribution.textContent = '';
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
                if (artfulModeToggle) {
                    artfulModeToggle.checked = false;
                    artfulModeToggle.disabled = true;
                    localStorage.setItem(artfulModeKey, 'false');
                    updateArtfulState();
                }
            } else {
                if (addTaskButton) {
                    addTaskButton.style.cssText = '';
                }
                bodyElement.style.removeProperty('background-color');
                bodyElement.style.removeProperty('color');
                if (artfulModeToggle) {
                    artfulModeToggle.disabled = false;
                }
                syncArtfulMode();
            }
            if (themeSelect && themeSelect.value !== normalizedTheme) {
                themeSelect.value = normalizedTheme;
            }
            localStorage.setItem('journeyTheme', normalizedTheme);
        }

        function syncArtfulMode() {
            if (!artfulModeToggle) return;
            const stored = localStorage.getItem(artfulModeKey);
            const normalizedTheme = bodyElement.dataset.theme || defaultTheme;
            const defaultEnabled = normalizedTheme === 'high-contrast' ? false : (stored === 'true');
            artfulModeToggle.checked = normalizedTheme === 'high-contrast' ? false : defaultEnabled;
            updateArtfulState();
        }

        function handleArtfulToggle() {
            if (!artfulModeToggle) return;
            localStorage.setItem(artfulModeKey, artfulModeToggle.checked ? 'true' : 'false');
            updateArtfulState();
        }

        function updateArtfulState() {
            const isArtful = artfulModeToggle?.checked ?? false;
            if (isArtful) {
                bodyElement.classList.add('artful-mode');
                bodyElement.dataset.artful = 'on';
            } else {
                bodyElement.classList.remove('artful-mode');
                bodyElement.dataset.artful = 'off';
            }
        }

        function appendBadgeIfValue(container, value, type) {
            if (!value) return;
            const badge = document.createElement('span');
            badge.classList.add('meta-badge', `badge-${type}`);
            badge.textContent = getBadgeLabel(type, value);
            container.appendChild(badge);
        }

        function getBadgeLabel(type, value) {
            const map = {
                mood: {
                    bright: '😊 Bright',
                    calm: '🧘 Calm',
                    focused: '🎯 Focused',
                    reflective: '🌙 Reflective'
                },
                category: {
                    wellness: 'Wellness',
                    creative: 'Creative',
                    planning: 'Planning',
                    connection: 'Connection'
                },
                priority: {
                    low: 'Low priority',
                    medium: 'Medium priority',
                    high: 'High priority'
                }
            };
            if (type === 'note') return 'Note';
            return map[type]?.[value] ?? value;
        }

        function setPrioritySelection(priority) {
            pendingPriority = priority || '';
            priorityButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.priority === pendingPriority);
            });
        }

        function revealInputSection() {
            if (!inputSection) return;
            inputSection.scrollIntoView({ behavior: 'auto', block: 'start' });
            const overflow = inputSection.getBoundingClientRect().bottom - window.innerHeight + 12;
            if (overflow > 0) {
                window.scrollBy({ top: overflow, behavior: 'auto' });
            }
        }

        function updateMilestones(completedCount) {
            if (!milestoneStrip) return;
            const state = deriveMilestoneState(completedCount, milestoneThresholds);
            const lastStored = Number(localStorage.getItem(milestoneKey)) || 0;
            milestoneStrip.innerHTML = '';
            milestoneThresholds.forEach(value => {
                const marker = document.createElement('div');
                marker.classList.add('milestone-marker');
                const isUnlocked = state.unlocked.includes(value);
                marker.dataset.value = value;
                marker.setAttribute('role', 'button');
                marker.setAttribute('tabindex', '0');
                marker.setAttribute('aria-label', `Milestone at ${value} completed steps`);
                const label = document.createElement('span');
                label.textContent = `${value}`;
                marker.appendChild(label);
                if (isUnlocked) {
                    marker.classList.add('unlocked');
                }
                if (isUnlocked) {
                    marker.title = `Unlocked milestone ${value}`;
                } else if (state.next === value) {
                    marker.title = `Unlocks at ${value} completed steps`;
                } else {
                    marker.title = `Milestone at ${value} completed steps`;
                }
                milestoneStrip.appendChild(marker);
                marker.addEventListener('click', () => handleTaskFocusFromMilestone(value));
                marker.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleTaskFocusFromMilestone(value);
                    }
                });
                if (state.lastUnlocked === value && value > lastStored) {
                    marker.classList.add('milestone-flare');
                    setTimeout(() => marker.classList.remove('milestone-flare'), 2400);
                    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        milestoneStrip.classList.add('confetti');
                        setTimeout(() => milestoneStrip.classList.remove('confetti'), 1200);
                    }
                    localStorage.setItem(milestoneKey, String(value));
                }
            });
        }

        function handleTaskFocusFromMilestone(value) {
            const task = tasks.find(t => t.completed);
            if (task) {
                displayWisdomForTask(task);
            }
        }

        function handleTaskFocus(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            if (task.completed) {
                activeWisdomTaskId = taskId;
                displayWisdomForTask(task);
            } else if (activeWisdomTaskId === taskId) {
                activeWisdomTaskId = null;
                hideWisdom();
            }
        }

        function displayWisdomForTask(task, options = {}) {
            const wisdomEnabled = isWisdomEnabled();
            if (!wisdomEnabled || !task.completed) {
                hideWisdom();
                return;
            }
            activeWisdomTaskId = task.id;
            const quote = pickQuoteForTask(task, wisdomQuotes) || pickQuoteForTask({}, wisdomQuotes);
            if (!quote) return;
            renderWisdomText(quote, options.forceRefresh);
            showWisdom();
        }

        function renderWisdomText(quote, force) {
            if (!wisdomText || !wisdomAttribution) return;
            if (!force && wisdomText.textContent === quote.text) return;
            wisdomText.textContent = quote.text;
            wisdomAttribution.textContent = quote.author ? `— ${quote.author}` : '';
        }

        function toggleNote(taskId) {
            openNoteId = getNextOpenNoteId(openNoteId, taskId);
            renderTasks();
        }

        function handleNoteInput(taskId, value) {
            tasks = updateTaskNote(tasks, taskId, value);
            saveTasks();
            renderTasks({ taskId, control: 'note-input' });
        }

        function startPromptCarousel() {
            if (!carouselPrompt) return;
            carouselPrompt.textContent = promptCarousel[carouselIndex];
            if (carouselTimer) {
                clearInterval(carouselTimer);
            }
            carouselTimer = setInterval(() => {
                if (tasks.length === 0) {
                    shuffleCarouselPrompt();
                }
            }, 8000);
        }

        function shuffleCarouselPrompt() {
            if (!carouselPrompt) return;
            carouselIndex = (carouselIndex + 1) % promptCarousel.length;
            carouselPrompt.textContent = promptCarousel[carouselIndex];
        }

        function handleTaskListEmpty() {
            if (tasks.length === 0) {
                emptyState?.setAttribute('aria-live', 'polite');
            } else {
                emptyState?.setAttribute('aria-live', 'off');
            }
        }

        function setPromptForEmptyState() {
            if (!emptyState) return;
            handleTaskListEmpty();
            if (tasks.length === 0 && carouselPrompt) {
                carouselPrompt.textContent = promptCarousel[carouselIndex];
            }
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
            if (!newValue) {
                hideWisdom();
            }
        });

        setPromptForEmptyState();
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
        restoreDeletedTasks,
        deriveMilestoneState,
        updateTaskNote,
        getNextOpenNoteId,
        pickQuoteForTask
    };
}
