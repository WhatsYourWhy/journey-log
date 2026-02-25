(function (global) {
    const insightsModule = typeof module !== 'undefined' && module.exports
        ? require('../domain/insights')
        : global.JourneyLogInsights;
    const tasksModule = typeof module !== 'undefined' && module.exports
        ? require('../domain/tasks')
        : global.JourneyLogTasks;
    const storageModule = typeof module !== 'undefined' && module.exports
        ? require('../services/storage')
        : global.JourneyLogStorage;
    const renderModule = typeof module !== 'undefined' && module.exports
        ? require('../ui/render')
        : global.JourneyLogRender;

    const { computeInsights, updateWisdomVisibility } = insightsModule;
    const {
        getSelectAllState,
        restoreDeletedTasks,
        deriveMilestoneState,
        getCompletedTaskForMilestone,
        updateTaskNote,
        getNextOpenNoteId
    } = tasksModule;
    const { createSafeStorage } = storageModule;
    const { updateInsights } = renderModule;

    function createSaveFeedbackController(statusElement, options = {}) {
        const scheduler = options.scheduler ?? setTimeout;
        const clearer = options.clearer ?? clearTimeout;
        const showDelay = options.showDelay ?? 120;
        const displayDuration = options.displayDuration ?? 1500;

        let showTimer = null;
        let hideTimer = null;

        const show = (message = 'Saved') => {
            if (!statusElement) return;
            statusElement.textContent = message;
            statusElement.classList.add('visible');
            statusElement.setAttribute('aria-hidden', 'false');
        };

        const hide = () => {
            if (!statusElement) return;
            statusElement.classList.remove('visible');
            statusElement.setAttribute('aria-hidden', 'true');
            statusElement.textContent = '';
        };

        function triggerMessage(message = 'Saved') {
            if (!statusElement) return;
            if (showTimer) {
                clearer(showTimer);
            }
            if (hideTimer) {
                clearer(hideTimer);
            }

            showTimer = scheduler(() => {
                show(message);
                hideTimer = scheduler(hide, displayDuration);
            }, showDelay);
        }

        function trigger() {
            triggerMessage('Saved');
        }

        return { trigger, triggerMessage };
    }

    function createPerTaskDebouncer(action, options = {}) {
        const delay = options.delay ?? 250;
        const scheduler = options.scheduler ?? setTimeout;
        const clearer = options.clearer ?? clearTimeout;
        const timers = new Map();

        function cancel(taskId) {
            const timerId = timers.get(taskId);
            if (!timerId) return;
            clearer(timerId);
            timers.delete(taskId);
        }

        function schedule(taskId, ...args) {
            cancel(taskId);
            const timerId = scheduler(() => {
                timers.delete(taskId);
                action(taskId, ...args);
            }, delay);
            timers.set(taskId, timerId);
        }

        function flush(taskId, ...args) {
            if (!timers.has(taskId)) return;
            cancel(taskId);
            action(taskId, ...args);
        }

        function has(taskId) {
            return timers.has(taskId);
        }

        return { schedule, flush, cancel, has };
    }

    function pickQuoteForTask(task, wisdomSet, options = {}) {
        if (!task || !wisdomSet) return null;
        const excludeText = options.excludeText;
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
        const candidates = excludeText ? pools.filter(quote => quote?.text !== excludeText) : pools;
        const available = candidates.length > 0 ? candidates : pools;
        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
    }

    function resolveWisdomExcludeText(lastQuoteText, forceRefresh) {
        if (!forceRefresh) {
            return undefined;
        }
        return lastQuoteText || undefined;
    }

    let lastTaskIdTimestamp = 0;
    let taskIdSequence = 0;

    function createTaskId() {
        const now = Date.now();
        if (now === lastTaskIdTimestamp) {
            taskIdSequence += 1;
        } else {
            lastTaskIdTimestamp = now;
            taskIdSequence = 0;
        }
        return (now * 1000) + taskIdSequence;
    }

    function initJourneyLogApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => {
                    document.documentElement.setAttribute('data-sw-status', 'registered');
                })
                .catch(() => {
                    document.documentElement.setAttribute('data-sw-status', 'failed');
                });
        } else {
            document.documentElement.setAttribute('data-sw-status', 'unsupported');
        }

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
        const carouselIcon = document.querySelector('.carousel-icon');
        const moodSelect = document.getElementById('moodSelect');
        const categorySelect = document.getElementById('categorySelect');
        const priorityButtons = document.querySelectorAll('.priority');
        const prefersReducedMotionQuery = typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)')
            : { matches: false };

        const helperBubbleKey = 'journeySeenAddHelper';
        const wisdomToggleKey = 'journeyWisdomEnabled';
        const milestoneKey = 'journeyMilestone';
        const artfulModeKey = 'journeyArtfulMode';
        const supportedThemes = ['comfort', 'forest', 'ocean', 'dark', 'high-contrast'];
        const themeClasses = supportedThemes.map(theme => `${theme}-theme`);
        const defaultTheme = 'comfort';
        const milestoneThresholds = [5, 10, 20];
        const milestoneMessages = {
            5: 'You found your rhythm!',
            10: 'Momentum unlocked—keep moving.',
            20: 'Your story is unfolding fast!'
        };
        const promptCarousel = [
            { text: 'Sketch a mini ritual that makes today feel special.', icon: '🕯️' },
            { text: 'Plan a 5-minute adventure that sparks curiosity.', icon: '🧭' },
            { text: 'Write a one-line story for a step you want to take.', icon: '📜' },
            { text: 'Find a small act of kindness you can do right now.', icon: '🤝' },
            { text: 'Turn a routine into a tiny celebration today.', icon: '🎉' }
        ];
        const wisdomQuotes = {
            mood: {
                bright: [
                    { text: 'Your spark lights the path ahead.', author: 'Journey Log' },
                    { text: 'Joy is a compass—follow where it points.', author: 'Journey Log' },
                    { text: 'Let this glow guide your next move.', author: 'Journey Log' }
                ],
                calm: [
                    { text: 'Steady breaths make steady steps.', author: 'Journey Log' },
                    { text: 'Quiet focus is still forward motion.', author: 'Journey Log' },
                    { text: 'Gentle pace, steady progress.', author: 'Journey Log' }
                ],
                focused: [
                    { text: 'Precision today, momentum tomorrow.', author: 'Journey Log' },
                    { text: 'Aim true; the path shortens.', author: 'Journey Log' },
                    { text: 'Each laser-fine step moves mountains.', author: 'Journey Log' }
                ],
                reflective: [
                    { text: 'Looking back helps the next stride land.', author: 'Journey Log' },
                    { text: 'Pause, notice, and carry the insight forward.', author: 'Journey Log' },
                    { text: 'Your reflection is a compass in disguise.', author: 'Journey Log' }
                ]
            },
            category: {
                wellness: [
                    { text: 'Care for your energy and the journey cares for you.', author: 'Journey Log' },
                    { text: 'Rest and action are teammates, not rivals.', author: 'Journey Log' }
                ],
                creative: [
                    { text: 'Tiny experiments build big worlds.', author: 'Journey Log' },
                    { text: 'Curiosity is your co-pilot today.', author: 'Journey Log' }
                ],
                planning: [
                    { text: 'A map drawn today shortens tomorrow.', author: 'Journey Log' },
                    { text: 'Every outline frees up future you.', author: 'Journey Log' }
                ],
                connection: [
                    { text: 'Bridges grow stronger one hello at a time.', author: 'Journey Log' },
                    { text: 'A sincere note can turn into a landmark moment.', author: 'Journey Log' }
                ]
            },
            priority: {
                low: [
                    { text: 'Soft steps still leave footprints.', author: 'Journey Log' },
                    { text: 'Gentle pacing keeps the journey light.', author: 'Journey Log' }
                ],
                medium: [
                    { text: 'Balanced effort keeps you moving.', author: 'Journey Log' },
                    { text: 'You’re tuning the tempo just right.', author: 'Journey Log' }
                ],
                high: [
                    { text: 'When it matters most, every move counts.', author: 'Journey Log' },
                    { text: 'This is a keystone—place it with care.', author: 'Journey Log' }
                ]
            },
            fallback: [
                { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
                { text: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
                { text: 'Our greatest glory is not in never failing, but in rising up every time we fail.', author: 'Ralph Waldo Emerson' },
                { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
                { text: 'Keep going—your story is unfolding one line at a time.', author: 'Journey Log' }
            ]
        };

        const state = {
            tasks: loadTasks(),
            lastDeletedTasks: [],
            undoTimeoutId: null,
            activeWisdomTaskId: null,
            openNoteId: null,
            carouselIndex: 0,
            carouselTimer: null,
            pendingPriority: '',
            lastWisdomQuoteText: ''
        };

        const actions = {
            setTasks(nextTasksOrUpdater) {
                state.tasks = typeof nextTasksOrUpdater === 'function'
                    ? nextTasksOrUpdater(state.tasks)
                    : nextTasksOrUpdater;
                return state.tasks;
            },
            setLastDeletedTasks(tasksToRestore) {
                state.lastDeletedTasks = tasksToRestore;
            },
            clearLastDeletedTasks() {
                state.lastDeletedTasks = [];
            },
            setUndoTimeout(timeoutId) {
                state.undoTimeoutId = timeoutId;
            },
            setActiveWisdomTaskId(taskId) {
                state.activeWisdomTaskId = taskId;
            },
            setOpenNoteId(taskId) {
                state.openNoteId = taskId;
            },
            setPendingPriority(priority) {
                state.pendingPriority = priority;
            },
            setCarouselIndex(index) {
                state.carouselIndex = index;
            },
            setCarouselTimer(timerId) {
                state.carouselTimer = timerId;
            },
            clearCarouselTimer() {
                state.carouselTimer = null;
            }
        };
        const noteSaveDebouncer = createPerTaskDebouncer(() => saveTasks(), { delay: 250 });
        const prefersReducedMotion = prefersReducedMotionQuery.matches;
        const saveFeedback = createSaveFeedbackController(saveStatus);

        function showPersistenceStatus(message) {
            if (saveFeedback?.triggerMessage) {
                saveFeedback.triggerMessage(message);
                return;
            }
            showValidationMessage(message);
        }

        const safeStorage = createSafeStorage(localStorage, { showPersistenceStatus });

        let lastEarnedMilestone = Number(safeStorage.get(milestoneKey, '0')) || 0;
        updateUndoButtonState(false);
        updateSelectionActions();

        initializeHelperBubble();
        renderTasks();
        updateSelectionActions();
        const wisdomEnabled = syncWisdomPreference();
        updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled });
        taskInput?.focus();
        revealInputSection();
        applyTheme(safeStorage.get('journeyTheme', defaultTheme));
        syncArtfulMode();

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

            const duplicate = state.tasks.some(
                task => task.description.trim().toLowerCase() === taskDescription.toLowerCase()
            );

            if (duplicate) {
                showValidationMessage('That step already exists. Try a different description.');
                taskInput?.focus();
                return;
            }

            const mood = moodSelect?.value ?? '';
            const category = categorySelect?.value ?? '';
            const priority = state.pendingPriority;

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

        taskInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.isComposing) {
                return;
            }

            event.preventDefault();
            handleAddFromInput();
        });

        shufflePrompt?.addEventListener('click', shuffleCarouselPrompt);

        priorityButtons.forEach(button => {
            button.addEventListener('click', () => setPrioritySelection(button.dataset.priority));
        });
        setPrioritySelection('');

        refreshWisdomButton?.addEventListener('click', () => {
            if (!state.activeWisdomTaskId) return;
            const task = state.tasks.find(t => t.id === state.activeWisdomTaskId);
            if (!task) return;
            displayWisdomForTask(task, { forceRefresh: true });
        });

        function addTask(description, meta = {}) {
            const task = {
                id: createTaskId(),
                description: description,
                completed: false,
                selected: false,
                mood: meta.mood || '',
                category: meta.category || '',
                priority: meta.priority || '',
                note: ''
            };
            actions.setTasks(tasks => [...tasks, task]);
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
            if (state.tasks.length === 0) {
                emptyState.classList.remove('hidden');
                starterHint.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                starterHint.classList.add('hidden');
            }
            setPromptForEmptyState();
            startPromptCarousel();

            state.tasks.forEach(task => {
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
                noteToggle.setAttribute('aria-expanded', state.openNoteId === task.id ? 'true' : 'false');
                noteToggle.setAttribute('aria-label', task.note ? `Edit note for ${task.description}` : `Add note for ${task.description}`);
                noteToggle.textContent = task.note ? 'Note added' : 'Add note';
                noteToggle.classList.toggle('note-has-text', !!task.note);
                noteToggle.addEventListener('click', () => toggleNote(task.id));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.dataset.taskId = task.id;
                deleteButton.dataset.control = 'delete';
                deleteButton.setAttribute('aria-label', `Delete ${task.description}`);
                deleteButton.addEventListener('click', () => deleteTask(task.id));

                const noteContainer = document.createElement('div');
                noteContainer.classList.add('note-container');
                if (state.openNoteId !== task.id) {
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
                noteInput.addEventListener('blur', () => flushTaskNoteSave(task.id));

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
            const insightData = updateInsights(state.tasks, { totalCount, completedCount, activeCount, progressPercent, progressFill });
            updateMilestones(insightData);
            syncSelectAllCheckbox();
            updateSelectionActions();
            if (focusTarget) {
                restoreFocus(focusTarget);
            }
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function toggleComplete(taskId) {
            const focusTarget = captureFocusDetails();
            actions.setTasks(tasks => tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            ));
            saveTasks();
            renderTasks(focusTarget);
            const target = state.tasks.find(task => task.id === taskId);
            if (target?.completed) {
                displayWisdomForTask(target);
            } else if (state.activeWisdomTaskId === taskId) {
                actions.setActiveWisdomTaskId(null);
                hideWisdom();
            }
        }

        function toggleSelection(taskId, isSelected) {
            actions.setTasks(tasks => tasks.map(task =>
                task.id === taskId ? { ...task, selected: isSelected } : task
            ));
            saveTasks();
            syncSelectAllCheckbox();
            updateSelectionActions();
        }

        function deleteTask(taskId) {
            const focusTarget = captureFocusDetails({ fallback: taskInput });
            const removedTasks = state.tasks.filter(task => task.id === taskId);
            if (removedTasks.length === 0) {
                return;
            }
            clearTaskNoteSaveTimer(taskId);
            rememberDeletedTasks(removedTasks);
            actions.setTasks(tasks => tasks.filter(task => task.id !== taskId));
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function saveTasks() {
            const saved = safeStorage.set('journeyTasks', JSON.stringify(state.tasks));
            if (saved) {
                saveFeedback.trigger();
            }
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
            const storedTasks = safeStorage.get('journeyTasks', '');
            if (!storedTasks) {
                return [];
            }

            try {
                const parsed = JSON.parse(storedTasks);
                return Array.isArray(parsed)
                    ? parsed.map(normalizeTask).filter(Boolean)
                    : [];
            } catch (error) {
                console.warn('Failed to parse stored state.tasks, clearing corrupted data.', error);
                safeStorage.remove('journeyTasks');
                return [];
            }
        }

        function showWisdom() {
            if (!wisdomDisplay || !wisdomText) return;
            wisdomDisplay.classList.remove('hidden');
            wisdomDisplay.setAttribute('aria-expanded', 'true');
            if (state.activeWisdomTaskId) {
                const task = state.tasks.find(t => t.id === state.activeWisdomTaskId);
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
            state.lastWisdomQuoteText = '';
        }

        function clearCompletedTasks() {
            const focusTarget = captureFocusDetails({ fallback: clearCompletedButton });
            const completedTasks = state.tasks.filter(task => task.completed);
            if (completedTasks.length === 0) {
                return;
            }
            completedTasks.forEach(task => clearTaskNoteSaveTimer(task.id));
            rememberDeletedTasks(completedTasks);
            actions.setTasks(tasks => tasks.filter(task => !task.completed));
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function clearSelectedTasks() {
            const focusTarget = captureFocusDetails({ fallback: clearSelectedButton });
            const selectedTasks = state.tasks.filter(task => task.selected);
            if (selectedTasks.length === 0) {
                showValidationMessage('Select one or more steps to clear.');
                return;
            }
            selectedTasks.forEach(task => clearTaskNoteSaveTimer(task.id));
            rememberDeletedTasks(selectedTasks);
            actions.setTasks(tasks => tasks.filter(task => !task.selected));
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
        }

        function syncSelectAllCheckbox() {
            if (!selectAllCheckbox) return;
            const { checked, indeterminate } = getSelectAllState(state.tasks);
            selectAllCheckbox.checked = checked;
            selectAllCheckbox.indeterminate = indeterminate;
            selectAllCheckbox.disabled = state.tasks.length === 0;
        }

        function handleSelectAllChange(event) {
            const shouldSelect = event.target.checked;
            actions.setTasks(tasks => tasks.map(task => ({ ...task, selected: shouldSelect })));
            saveTasks();
            renderTasks();
            updateSelectionActions();
        }

        function isTypingInInput(element) {
            if (!element) return false;
            const tagName = element.tagName;
            if (tagName === 'TEXTAREA') {
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
                if (typingInInput && activeElement !== taskInput) {
                    return;
                }
                event.preventDefault();
                addTaskButton?.click();
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
            if (!clearSelectedButton) return;
            const selectedCount = state.tasks.filter(task => task.selected).length;
            const disableActions = selectedCount === 0;
            clearSelectedButton.disabled = disableActions;
            clearSelectedButton.setAttribute('aria-disabled', disableActions ? 'true' : 'false');
        }

        function rememberDeletedTasks(removedTasks) {
            if (state.undoTimeoutId) {
                clearTimeout(state.undoTimeoutId);
            }
            actions.setLastDeletedTasks(removedTasks.map(task => ({ ...task, selected: false })));
            updateUndoButtonState(true);
            state.undoTimeoutId = setTimeout(() => {
                actions.clearLastDeletedTasks();
                updateUndoButtonState(false);
            }, 8000);
        }

        function updateUndoButtonState(hasUndo) {
            if (!undoDeleteButton) return;
            undoDeleteButton.disabled = !hasUndo;
            undoDeleteButton.classList.toggle('hidden', !hasUndo);
        }

        function undoLastDelete() {
            if (state.lastDeletedTasks.length === 0) {
                return;
            }
            const focusTarget = captureFocusDetails({ fallback: taskInput });
            actions.setTasks(tasks => restoreDeletedTasks(tasks, state.lastDeletedTasks));
            actions.clearLastDeletedTasks();
            saveTasks();
            renderTasks(focusTarget);
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: isWisdomEnabled() });
            updateUndoButtonState(false);
            if (state.undoTimeoutId) {
                clearTimeout(state.undoTimeoutId);
                state.undoTimeoutId = null;
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
            const stored = safeStorage.get(wisdomToggleKey, null);
            if (stored === null) {
                safeStorage.set(wisdomToggleKey, 'true');
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
                safeStorage.set(helperBubbleKey, 'true');
            }
        }

        function initializeHelperBubble() {
            const helperSeen = safeStorage.get(helperBubbleKey, 'false') === 'true';
            if (state.tasks.length > 0) {
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
                    safeStorage.set(artfulModeKey, 'false');
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
            safeStorage.set('journeyTheme', normalizedTheme);
        }

        function syncArtfulMode() {
            if (!artfulModeToggle) return;
            const stored = safeStorage.get(artfulModeKey, null);
            const normalizedTheme = bodyElement.dataset.theme || defaultTheme;
            const defaultEnabled = normalizedTheme === 'high-contrast' ? false : (stored === 'true');
            artfulModeToggle.checked = normalizedTheme === 'high-contrast' ? false : defaultEnabled;
            updateArtfulState();
        }

        function handleArtfulToggle() {
            if (!artfulModeToggle) return;
            safeStorage.set(artfulModeKey, artfulModeToggle.checked ? 'true' : 'false');
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
            badge.dataset.badgeType = type;
            badge.textContent = `${getBadgeIcon(type, value)} ${getBadgeLabel(type, value)}`.trim();
            badge.setAttribute('aria-label', getBadgeLabel(type, value));
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

        function getBadgeIcon(type, value) {
            const icons = {
                mood: {
                    bright: '😊',
                    calm: '🧘',
                    focused: '🎯',
                    reflective: '🌙'
                },
                category: {
                    wellness: '💚',
                    creative: '🎨',
                    planning: '🗺️',
                    connection: '🤝'
                },
                priority: {
                    low: '⬇️',
                    medium: '⏳',
                    high: '🚀'
                },
                note: {
                    note: '📝'
                }
            };
            return icons[type]?.[value] ?? (type === 'note' ? '📝' : '');
        }

        function setPrioritySelection(priority) {
            actions.setPendingPriority(priority || '');
            priorityButtons.forEach(button => {
                const isActive = button.dataset.priority === state.pendingPriority;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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

        function updateMilestones(insights) {
            if (!milestoneStrip) return;
            const completedCount = insights?.completedTasks ?? 0;
            const state = deriveMilestoneState(completedCount, milestoneThresholds);
            milestoneStrip.innerHTML = '';
            milestoneStrip.dataset.nextMilestone = state.next ?? '';
            milestoneThresholds.forEach(value => {
                const marker = document.createElement('div');
                marker.classList.add('milestone-marker');
                const isUnlocked = state.unlocked.includes(value);
                const messageText = milestoneMessages[value] ?? 'Milestone unlocked';
                marker.dataset.value = value;
                marker.setAttribute('role', 'button');
                marker.setAttribute('tabindex', '0');
                marker.setAttribute('aria-label', isUnlocked ? `Milestone ${value} reached. ${messageText}` : `Milestone at ${value} completed steps`);
                const label = document.createElement('span');
                label.classList.add('milestone-count');
                label.textContent = `${value}`;
                const message = document.createElement('p');
                message.classList.add('milestone-message');
                message.textContent = messageText;
                marker.appendChild(label);
                marker.appendChild(message);
                if (isUnlocked) {
                    marker.classList.add('unlocked');
                    marker.title = milestoneMessages[value] ?? `Unlocked milestone ${value}`;
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
                if (state.lastUnlocked === value && value > lastEarnedMilestone) {
                    marker.classList.add('milestone-flare');
                    setTimeout(() => marker.classList.remove('milestone-flare'), 2400);
                    if (!prefersReducedMotion) {
                        milestoneStrip.classList.add('confetti');
                        setTimeout(() => milestoneStrip.classList.remove('confetti'), 1200);
                    }
                    lastEarnedMilestone = value;
                    safeStorage.set(milestoneKey, String(value));
                }
            });
            if (state.lastUnlocked) {
                lastEarnedMilestone = Math.max(lastEarnedMilestone, state.lastUnlocked);
            }
        }

        function handleTaskFocusFromMilestone(value) {
            const task = getCompletedTaskForMilestone(state.tasks, value);
            if (task) {
                displayWisdomForTask(task);
            }
        }

        function handleTaskFocus(taskId) {
            const task = state.tasks.find(t => t.id === taskId);
            if (!task) return;
            if (task.completed) {
                actions.setActiveWisdomTaskId(taskId);
                displayWisdomForTask(task);
            } else if (state.activeWisdomTaskId === taskId) {
                actions.setActiveWisdomTaskId(null);
                hideWisdom();
            }
        }

        function displayWisdomForTask(task, options = {}) {
            const wisdomEnabled = isWisdomEnabled();
            if (!wisdomEnabled || !task.completed) {
                hideWisdom();
                return;
            }
            actions.setActiveWisdomTaskId(task.id);
            const excludeText = resolveWisdomExcludeText(state.lastWisdomQuoteText, options.forceRefresh);
            const quote = pickQuoteForTask(task, wisdomQuotes, { excludeText }) || pickQuoteForTask({}, wisdomQuotes, { excludeText });
            if (!quote) return;
            renderWisdomText(quote, options.forceRefresh);
            showWisdom();
        }

        function renderWisdomText(quote, force) {
            if (!wisdomText || !wisdomAttribution) return;
            if (!force && wisdomText.textContent === quote.text) return;
            wisdomText.textContent = quote.text;
            wisdomAttribution.textContent = quote.author ? `— ${quote.author}` : '';
            state.lastWisdomQuoteText = quote.text;
            if (!prefersReducedMotion && typeof requestAnimationFrame === 'function') {
                wisdomText.classList.remove('wisdom-transition');
                wisdomAttribution.classList.remove('wisdom-transition');
                requestAnimationFrame(() => {
                    wisdomText.classList.add('wisdom-transition');
                    wisdomAttribution.classList.add('wisdom-transition');
                });
            }
        }

        function toggleNote(taskId) {
            actions.setOpenNoteId(getNextOpenNoteId(state.openNoteId, taskId));
            renderTasks();
        }

        function updateTaskNoteUI(taskId) {
            const task = state.tasks.find(candidate => candidate.id === taskId);
            if (!task) return;
            const taskItem = taskList?.querySelector(`li[data-task-id="${taskId}"]`);
            if (!taskItem) return;

            const hasNote = (task.note ?? '').trim().length > 0;
            const noteToggle = taskItem.querySelector('[data-control="note-toggle"]');
            if (noteToggle) {
                noteToggle.setAttribute('aria-label', hasNote ? `Edit note for ${task.description}` : `Add note for ${task.description}`);
                noteToggle.setAttribute('aria-expanded', state.openNoteId === taskId ? 'true' : 'false');
                noteToggle.textContent = hasNote ? 'Note added' : 'Add note';
                noteToggle.classList.toggle('note-has-text', hasNote);
            }

            const taskContent = taskItem.querySelector('.task-content');
            if (!taskContent) return;
            const existingBadgeRow = taskContent.querySelector('.badge-row');
            const existingNoteBadge = existingBadgeRow?.querySelector('.badge-note');

            if (hasNote && !existingNoteBadge) {
                const badgeRow = existingBadgeRow ?? document.createElement('div');
                if (!existingBadgeRow) {
                    badgeRow.classList.add('badge-row');
                    taskContent.insertBefore(badgeRow, noteToggle ?? taskContent.firstChild);
                }
                appendBadgeIfValue(badgeRow, 'note', 'note');
                return;
            }

            if (!hasNote && existingNoteBadge) {
                existingNoteBadge.remove();
                if (existingBadgeRow.children.length === 0) {
                    existingBadgeRow.remove();
                }
            }
        }

        function clearTaskNoteSaveTimer(taskId) {
            noteSaveDebouncer.cancel(taskId);
        }

        function scheduleTaskNoteSave(taskId) {
            noteSaveDebouncer.schedule(taskId);
        }

        function flushTaskNoteSave(taskId) {
            noteSaveDebouncer.flush(taskId);
        }

        function handleNoteInput(taskId, value) {
            actions.setTasks(tasks => updateTaskNote(tasks, taskId, value));
            updateTaskNoteUI(taskId);
            scheduleTaskNoteSave(taskId);
        }

        function startPromptCarousel() {
            if (!carouselPrompt) return;
            if (state.carouselTimer) {
                clearInterval(state.carouselTimer);
                actions.clearCarouselTimer();
            }
            if (state.tasks.length !== 0) {
                return;
            }
            renderCarouselPrompt();
            actions.setCarouselTimer(setInterval(() => {
                if (state.tasks.length === 0) {
                    shuffleCarouselPrompt();
                }
            }, 8000));
        }

        function renderCarouselPrompt() {
            if (!carouselPrompt) return;
            const prompt = promptCarousel[state.carouselIndex] ?? promptCarousel[0];
            carouselPrompt.textContent = prompt?.text ?? '';
            if (carouselIcon) {
                carouselIcon.textContent = prompt?.icon ?? '✨';
            }
        }

        function shuffleCarouselPrompt() {
            if (!carouselPrompt) return;
            const previousIndex = state.carouselIndex;
            if (promptCarousel.length > 1) {
                do {
                    actions.setCarouselIndex((state.carouselIndex + 1) % promptCarousel.length);
                } while (state.carouselIndex === previousIndex);
            }
            renderCarouselPrompt();
        }

        function handleTaskListEmpty() {
            if (state.tasks.length === 0) {
                emptyState?.setAttribute('aria-live', 'polite');
            } else {
                emptyState?.setAttribute('aria-live', 'off');
            }
        }

        function setPromptForEmptyState() {
            if (!emptyState) return;
            handleTaskListEmpty();
            if (state.tasks.length === 0 && carouselPrompt) {
                renderCarouselPrompt();
            }
        }

        clearCompletedButton?.addEventListener('click', clearCompletedTasks);
        clearSelectedButton?.addEventListener('click', clearSelectedTasks);
        undoDeleteButton?.addEventListener('click', undoLastDelete);
        selectAllCheckbox?.addEventListener('change', handleSelectAllChange);
        document.addEventListener('keydown', handleKeyboardShortcuts);
        wisdomToggle?.addEventListener('change', () => {
            const newValue = wisdomToggle.checked;
            safeStorage.set(wisdomToggleKey, newValue ? 'true' : 'false');
            updateWisdomVisibility(state.tasks, showWisdom, hideWisdom, { wisdomEnabled: newValue });
            if (!newValue) {
                hideWisdom();
            }
        });

        setPromptForEmptyState();
    }

    const api = {
        initJourneyLogApp,
        createSaveFeedbackController,
        createPerTaskDebouncer,
        pickQuoteForTask,
        resolveWisdomExcludeText
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogApp = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
