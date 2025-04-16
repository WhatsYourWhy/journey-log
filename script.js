console.log("JavaScript file loaded!");

document.addEventListener('DOMContentLoaded', () => {
    const clearCompletedButton = document.getElementById('clearCompletedButton');
    clearCompletedButton.addEventListener('click', clearCompletedTasks);
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const wisdomDisplay = document.getElementById('wisdomDisplay');
    const wisdomText = document.getElementById('wisdomText');
    const themeSelect = document.getElementById('theme');
    const bodyElement = document.body;

    let tasks = loadTasks();
    renderTasks();

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
    }

    function toggleComplete(taskId) {
        tasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        if (tasks.find(task => task.id === taskId && task.completed)) {
            showWisdom();
        } else {
            hideWisdom();
        }
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        hideWisdom(); // Hide wisdom if a completed task is deleted
    }

    function saveTasks() {
        localStorage.setItem('journeyTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('journeyTasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
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
        hideWisdom(); // Hide wisdom if any was showing
    }
});