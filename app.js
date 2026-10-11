const { DAYS, validateTask, buildPlan } = window.Scheduler;

// Mock data for a typical student week.
const SAMPLE_TASKS = [
  { name: "Math 54 problem set", deadline: 1, hours: 3 },
  { name: "CS 61A project", deadline: 3, hours: 6 },
  { name: "History reading + response", deadline: 2, hours: 2.5 },
  { name: "Club meeting prep", deadline: 3, hours: 1 },
  { name: "Chem lab report", deadline: 4, hours: 4 },
  { name: "Study for econ midterm", deadline: 6, hours: 5 },
];

let tasks = [];

const $ = (id) => document.getElementById(id);
const errorEl = $("error");
const planEl = $("plan");

DAYS.forEach((d, i) => $("deadline").insertAdjacentHTML("beforeend", `<option value="${i}">${d}</option>`));

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function renderTasks() {
  const table = $("task-table");
  table.hidden = tasks.length === 0;
  table.querySelector("tbody").innerHTML = tasks
    .map(
      (t, i) =>
        `<tr><td>${escapeHtml(t.name)}</td><td>${DAYS[t.deadline]}</td><td>${t.hours}</td>` +
        `<td><button type="button" data-remove="${i}">Remove</button></td></tr>`
    )
    .join("");
  planEl.innerHTML = ""; // plan is stale once the task list changes
}

$("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const deadlineRaw = $("deadline").value;
  const hoursRaw = $("hours").value;
  const task = {
    name: $("name").value.trim(),
    deadline: deadlineRaw === "" ? NaN : Number(deadlineRaw),
    hours: hoursRaw === "" ? NaN : Number(hoursRaw),
  };
  const err = validateTask(task);
  errorEl.textContent = err || "";
  if (err) return;
  tasks.push(task);
  $("task-form").reset();
  $("name").focus();
  renderTasks();
});

$("task-table").addEventListener("click", (e) => {
  const i = e.target.dataset.remove;
  if (i === undefined) return;
  tasks.splice(Number(i), 1);
  renderTasks();
});

$("generate").addEventListener("click", () => {
  if (tasks.length === 0) {
    errorEl.textContent = "Add at least one task first.";
    planEl.innerHTML = "";
    return;
  }
  const capacity = Number($("capacity").value);
  if (!Number.isFinite(capacity) || capacity < 0.5 || capacity > 24) {
    errorEl.textContent = "Max study hours per day must be between 0.5 and 24.";
    planEl.innerHTML = "";
    return;
  }
  errorEl.textContent = "";
  renderPlan(buildPlan(tasks, capacity), capacity);
});

$("sample").addEventListener("click", () => {
  tasks = SAMPLE_TASKS.map((t) => ({ ...t }));
  errorEl.textContent = "";
  renderTasks();
});

$("clear").addEventListener("click", () => {
  tasks = [];
  errorEl.textContent = "";
  renderTasks();
});

function renderPlan(plan, capacity) {
  let html = "";
  if (plan.unscheduled.length) {
    html +=
      `<div class="warn" id="overload"><strong>Not everything fits at ${capacity}h/day.</strong><ul>` +
      plan.unscheduled
        .map((u) => `<li>${escapeHtml(u.name)}: ${u.hours}h left unscheduled before ${DAYS[u.deadline]}</li>`)
        .join("") +
      `</ul>Try raising your daily hours, starting earlier, or trimming estimates.</div>`;
  }
  html += `<h2>Your week</h2><div class="week">`;
  for (const d of plan.days) {
    html += `<div class="day" data-day="${d.day}"><h3><span>${d.day}</span><span>${d.total}h</span></h3>`;
    html += d.items.length
      ? `<ul>${d.items
          .map(
            (it) =>
              `<li>${escapeHtml(it.name)}: ${it.hours}h` +
              (DAYS[it.deadline] === d.day ? ` <span class="due">due today</span>` : "") +
              `</li>`
          )
          .join("")}</ul>`
      : `<div class="empty">Free</div>`;
    html += `</div>`;
  }
  planEl.innerHTML = html + `</div>`;
}
