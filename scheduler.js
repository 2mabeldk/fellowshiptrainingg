// Pure scheduling logic. Works in the browser (window.Scheduler) and in Node (require).
(function (root) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const BLOCK = 0.5; // hours per scheduling block

  // Returns an error message string, or null if the task is valid.
  function validateTask(task) {
    if (!task.name || !task.name.trim()) return "Task name is required.";
    if (!Number.isInteger(task.deadline) || task.deadline < 0 || task.deadline > 6) {
      return "Pick a deadline day (Mon–Sun).";
    }
    const h = task.hours;
    if (typeof h !== "number" || !Number.isFinite(h) || h <= 0) return "Hours must be a number greater than 0.";
    if (h > 40) return "Hours must be 40 or less.";
    if (Math.round(h / BLOCK) * BLOCK !== h) return "Hours must be in 0.5 hour steps (e.g. 1.5).";
    return null;
  }

  // tasks: [{ name, deadline (0=Mon..6=Sun, due end of day), hours }]
  // capacity: max study hours per day
  // Returns { days: [{ day, total, items: [{ name, hours }] }], unscheduled: [{ name, hours, deadline }] }
  function buildPlan(tasks, capacity) {
    const load = DAYS.map(() => 0);
    const perDay = DAYS.map(() => new Map()); // task index -> hours
    const unscheduled = [];

    // Earliest deadline first; ties keep entry order.
    const order = tasks.map((t, i) => i).sort((a, b) => tasks[a].deadline - tasks[b].deadline || a - b);

    for (const i of order) {
      const task = tasks[i];
      let remaining = Math.round(task.hours / BLOCK);
      while (remaining > 0) {
        // Least-loaded day with room, from Monday through the deadline day (ties -> earlier day).
        let best = -1;
        for (let d = 0; d <= task.deadline; d++) {
          if (load[d] + BLOCK > capacity) continue;
          if (best === -1 || load[d] < load[best]) best = d;
        }
        if (best === -1) break;
        load[best] += BLOCK;
        perDay[best].set(i, (perDay[best].get(i) || 0) + BLOCK);
        remaining--;
      }
      if (remaining > 0) unscheduled.push({ name: task.name, hours: remaining * BLOCK, deadline: task.deadline });
    }

    const days = DAYS.map((day, d) => ({
      day,
      total: load[d],
      items: [...perDay[d].entries()]
        .sort((a, b) => tasks[a[0]].deadline - tasks[b[0]].deadline || a[0] - b[0])
        .map(([i, hours]) => ({ name: tasks[i].name, hours, deadline: tasks[i].deadline })),
    }));
    return { days, unscheduled };
  }

  const api = { DAYS, validateTask, buildPlan };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Scheduler = api;
})(this);
