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
  // capacity: max study hours per day, either one number for every day or an array of 7 (Mon..Sun)
  // Returns { days: [{ day, total, items: [{ name, hours }] }], unscheduled: [{ name, hours, deadline }] }
  function buildPlan(tasks, capacity) {
    const caps = Array.isArray(capacity) ? capacity : DAYS.map(() => capacity);
    const load = DAYS.map(() => 0);
    const perDay = DAYS.map(() => new Map()); // task index -> hours
    const unscheduled = [];

    // Earliest deadline first; ties keep entry order.
    const order = tasks.map((t, i) => i).sort((a, b) => tasks[a].deadline - tasks[b].deadline || a - b);

    for (const i of order) {
      const task = tasks[i];
      let remaining = Math.round(task.hours / BLOCK);
      while (remaining > 0) {
        // Day with room that is least full relative to its own limit, from Monday through the
        // deadline day (ties -> earlier day), so days with more study hours take more of the work.
        let best = -1;
        for (let d = 0; d <= task.deadline; d++) {
          if (load[d] + BLOCK > caps[d]) continue;
          if (best === -1 || load[d] / caps[d] < load[best] / caps[best]) best = d;
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

  // Returns an error message string, or null if every day's limit is valid.
  function validateCapacity(caps) {
    if (!Array.isArray(caps) || caps.length !== 7) return "Set study hours for all 7 days.";
    for (let d = 0; d < 7; d++) {
      const c = caps[d];
      if (typeof c !== "number" || !Number.isFinite(c) || c < 0 || c > 24 || Math.round(c / BLOCK) * BLOCK !== c) {
        return `${DAYS[d]}: study hours must be 0–24 in 0.5 hour steps.`;
      }
    }
    if (caps.every((c) => c === 0)) return "At least one day needs study hours above 0.";
    return null;
  }

  const api = { DAYS, validateTask, validateCapacity, buildPlan };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Scheduler = api;
})(this);
