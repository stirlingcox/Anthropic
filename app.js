// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let taskIdCounter = parseInt(localStorage.getItem('taskIdCounter')) || 0;

// DOM Elements
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskLists = document.querySelectorAll('.task-list');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Setup drag and drop for all task lists
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragleave', handleDragLeave);
    });
}

// Add New Task
function addTask() {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: taskIdCounter++,
        text: taskText,
        category: category
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    taskInput.value = '';
    taskInput.focus();
}

// Render All Tasks
function renderTasks() {
    // Clear all lists
    taskLists.forEach(list => {
        list.innerHTML = '';
    });

    // Render tasks in their categories
    tasks.forEach(task => {
        createTaskElement(task);
    });

    // Update counts
    updateTaskCounts();
}

// Create Task Element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;

    taskElement.innerHTML = `
        <div class="task-content">${task.text}</div>
        <button class="task-delete">Delete</button>
    `;

    // Add drag event listeners
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);

    // Add delete event listener
    const deleteBtn = taskElement.querySelector('.task-delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    // Append to correct category list
    const targetList = document.getElementById(`${task.category}-list`);
    if (targetList) {
        targetList.appendChild(taskElement);
    }
}

// Delete Task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

// Drag and Drop Handlers
let draggedElement = null;
let draggedTaskId = null;

function handleDragStart(e) {
    draggedElement = e.target;
    draggedTaskId = parseInt(e.target.dataset.taskId);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');

    // Remove drag-over class from all lists
    taskLists.forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');

    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    e.preventDefault();

    const targetList = e.currentTarget;
    const newCategory = targetList.dataset.category;

    // Update task category
    const task = tasks.find(t => t.id === draggedTaskId);
    if (task) {
        task.category = newCategory;
        saveTasks();
        renderTasks();
    }

    targetList.classList.remove('drag-over');

    return false;
}

// Update Task Counts
function updateTaskCounts() {
    const categories = ['work', 'personal', 'urgent', 'completed'];

    categories.forEach(category => {
        const count = tasks.filter(task => task.category === category).length;
        const categoryElement = document.querySelector(`.category[data-category="${category}"]`);
        const countElement = categoryElement.querySelector('.task-count');
        countElement.textContent = count;
    });
}

// Save to Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('taskIdCounter', taskIdCounter.toString());
}

// Add some sample tasks on first load
if (tasks.length === 0) {
    const sampleTasks = [
        { id: taskIdCounter++, text: 'Complete project proposal', category: 'work' },
        { id: taskIdCounter++, text: 'Review pull requests', category: 'work' },
        { id: taskIdCounter++, text: 'Buy groceries', category: 'personal' },
        { id: taskIdCounter++, text: 'Call dentist', category: 'personal' },
        { id: taskIdCounter++, text: 'Fix critical bug', category: 'urgent' },
        { id: taskIdCounter++, text: 'Prepare presentation', category: 'urgent' }
    ];

    tasks = sampleTasks;
    saveTasks();
    renderTasks();
}
