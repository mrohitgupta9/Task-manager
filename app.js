const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDeadline = document.getElementById("taskDeadline");
const taskAssignee = document.getElementById("taskAssignee");
const taskStatus = document.getElementById("taskStatus");
const addTaskBtn = document.getElementById("addTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const undoDeleteBtn = document.getElementById("undoDeleteBtn");
const taskList = document.getElementById("taskList");
const activityLog = document.getElementById("activityLog");

const filterCategory = document.getElementById("filterCategory");
const filterPriority = document.getElementById("filterPriority");
const filterStatus = document.getElementById("filterStatus");
const sortDeadlineBtn = document.getElementById("sortDeadlineBtn");
const sortPriorityBtn = document.getElementById("sortPriorityBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
let editIndex = null;
let lastDeletedTask = null;

function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("activityLogs", JSON.stringify(logs));
}

function logActivity(message) {
  const timestamp = new Date().toLocaleTimeString();
  let type = "added";
  if (message.toLowerCase().includes("updated")) type = "updated";
  else if (message.toLowerCase().includes("deleted")) type = "deleted";
  else if (message.toLowerCase().includes("completed")) type = "completed";
  logs.push({ msg: `[${timestamp}] ${message}`, type });
  saveData();
  renderLogs();
}

function renderLogs() {
  activityLog.innerHTML = "";
  logs
    .slice()
    .reverse()
    .forEach((log) => {
      const li = document.createElement("li");
      li.textContent = log.msg;
      li.classList.add(log.type);
      activityLog.appendChild(li);
    });
  activityLog.scrollTop = 0;
}

function renderTasks() {
  taskList.innerHTML = "";
  let filtered = tasks.filter((task) => {
    return (
      (filterCategory.value === "all" ||
        task.category === filterCategory.value) &&
      (filterPriority.value === "all" ||
        task.priority === filterPriority.value) &&
      (filterStatus.value === "all" || task.status === filterStatus.value)
    );
  });
  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.classList.add("task-item", task.category);
    if (task.completed) li.classList.add("completed");
    li.draggable = true;

    li.innerHTML = `
      <div class="details">
        <span ${task.completed ? 'class="completed"' : ""}><strong>${
      task.title
    }</strong> (${task.priority.toUpperCase()} Priority)</span>
        <span class="task-meta">📅 ${task.deadline} | 👤 ${
      task.assignee
    } | 📌 ${task.status}</span>
      </div>
      <div class="task-actions">
        <button class="complete-btn">${
          task.completed ? "↩ Undo" : "✔ Done"
        }</button>
        <button class="edit-btn">✏ Edit</button>
        <button class="delete-btn">🗑 Delete</button>
      </div>
    `;

    li.querySelector(".complete-btn").addEventListener("click", () => {
      task.completed = !task.completed;
      logActivity(
        `Task "${task.title}" marked as ${
          task.completed ? "Completed" : "Pending"
        }`
      );
      saveData();
      renderTasks();
    });

    li.querySelector(".edit-btn").addEventListener("click", () => {
      taskInput.value = task.title;
      taskCategory.value = task.category;
      taskPriority.value = task.priority;
      taskDeadline.value = task.deadline === "No deadline" ? "" : task.deadline;
      taskAssignee.value = task.assignee;
      taskStatus.value = task.status;
      editIndex = tasks.indexOf(task);
      addTaskBtn.textContent = "💾 Update Task";
      cancelEditBtn.style.display = "block";
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      lastDeletedTask = tasks.splice(tasks.indexOf(task), 1)[0];
      logActivity(`Task "${task.title}" deleted`);
      saveData();
      renderTasks();
      undoDeleteBtn.style.display = "inline-block";
    });

    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", tasks.indexOf(task));
    });
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", (e) => {
      const fromIndex = e.dataTransfer.getData("text/plain");
      const toIndex = tasks.indexOf(task);
      tasks.splice(toIndex, 0, tasks.splice(fromIndex, 1)[0]);
      saveData();
      renderTasks();
    });

    taskList.appendChild(li);
  });
}

// Add / Update
addTaskBtn.addEventListener("click", () => {
  const title = taskInput.value.trim();
  if (!title) return;
  const newTaskData = {
    title,
    category: taskCategory.value,
    priority: taskPriority.value,
    deadline: taskDeadline.value || "No deadline",
    assignee: taskAssignee.value.trim() || "Unassigned",
    status: taskStatus.value,
    completed: editIndex !== null ? tasks[editIndex].completed : false,
  };
  if (editIndex !== null) {
    tasks[editIndex] = newTaskData;
    logActivity(`Task "${title}" updated`);
    editIndex = null;
    addTaskBtn.textContent = "➕ Add Task";
    cancelEditBtn.style.display = "none";
  } else {
    tasks.push(newTaskData);
    logActivity(`Task "${title}" added`);
  }
  saveData();
  renderTasks();
  renderLogs();
  taskInput.value = "";
  taskDeadline.value = "";
  taskAssignee.value = "";
  taskPriority.value = "medium";
  taskCategory.value = "work";
  taskStatus.value = "pending";
});

cancelEditBtn.addEventListener("click", () => {
  editIndex = null;
  addTaskBtn.textContent = "➕ Add Task";
  cancelEditBtn.style.display = "none";
  taskInput.value = "";
  taskDeadline.value = "";
  taskAssignee.value = "";
  taskPriority.value = "medium";
  taskCategory.value = "work";
  taskStatus.value = "pending";
});

undoDeleteBtn.addEventListener("click", () => {
  if (lastDeletedTask) {
    tasks.push(lastDeletedTask);
    logActivity(`Task "${lastDeletedTask.title}" restored`);
    lastDeletedTask = null;
    saveData();
    renderTasks();
    renderLogs();
    undoDeleteBtn.style.display = "none";
  }
});

[filterCategory, filterPriority, filterStatus].forEach((f) =>
  f.addEventListener("change", renderTasks)
);
sortDeadlineBtn.addEventListener("click", () => {
  tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  saveData();
  renderTasks();
});
sortPriorityBtn.addEventListener("click", () => {
  const prioMap = { high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => prioMap[a.priority] - prioMap[b.priority]);
  saveData();
  renderTasks();
});

renderTasks();
renderLogs();
