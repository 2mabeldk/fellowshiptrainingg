const test = require("node:test");
const assert = require("node:assert");
const { validateTask, validateCapacity, buildPlan } = require("../scheduler.js");

const hoursFor = (plan, name, upToDay = 6) =>
  plan.days.slice(0, upToDay + 1).flatMap((d) => d.items).filter((i) => i.name === name).reduce((s, i) => s + i.hours, 0);

test("all hours are scheduled on or before each deadline", () => {
  const tasks = [
    { name: "A", deadline: 1, hours: 3 },
    { name: "B", deadline: 3, hours: 6 },
    { name: "C", deadline: 6, hours: 5 },
  ];
  const plan = buildPlan(tasks, 4);
  assert.deepStrictEqual(plan.unscheduled, []);
  for (const t of tasks) {
    assert.strictEqual(hoursFor(plan, t.name, t.deadline), t.hours, `${t.name} fully done by deadline`);
    assert.strictEqual(hoursFor(plan, t.name), t.hours, `${t.name} not scheduled after deadline`);
  }
});

test("no day exceeds capacity", () => {
  const tasks = [{ name: "Big", deadline: 6, hours: 20 }, { name: "Small", deadline: 2, hours: 5 }];
  const plan = buildPlan(tasks, 4);
  for (const d of plan.days) assert.ok(d.total <= 4, `${d.day} is ${d.total}h`);
});

test("work is spread out rather than crammed on one day", () => {
  const plan = buildPlan([{ name: "Essay", deadline: 3, hours: 4 }], 8);
  assert.deepStrictEqual(plan.days.slice(0, 4).map((d) => d.total), [1, 1, 1, 1]);
});

test("earlier deadlines get priority when time is tight", () => {
  const tasks = [{ name: "Later", deadline: 1, hours: 2 }, { name: "Sooner", deadline: 0, hours: 2 }];
  const plan = buildPlan(tasks, 2);
  assert.deepStrictEqual(plan.unscheduled, []);
  assert.strictEqual(hoursFor(plan, "Sooner", 0), 2);
});

test("overload reports unscheduled hours instead of dropping them", () => {
  const plan = buildPlan([{ name: "Cram", deadline: 0, hours: 6 }], 4);
  assert.deepStrictEqual(plan.unscheduled, [{ name: "Cram", hours: 2, deadline: 0 }]);
  assert.strictEqual(plan.days[0].total, 4);
});

test("validation rejects bad input", () => {
  assert.match(validateTask({ name: " ", deadline: 0, hours: 1 }), /name/);
  assert.match(validateTask({ name: "x", deadline: NaN, hours: 1 }), /deadline/);
  assert.match(validateTask({ name: "x", deadline: 7, hours: 1 }), /deadline/);
  assert.match(validateTask({ name: "x", deadline: 0, hours: NaN }), /greater than 0/);
  assert.match(validateTask({ name: "x", deadline: 0, hours: 0 }), /greater than 0/);
  assert.match(validateTask({ name: "x", deadline: 0, hours: -2 }), /greater than 0/);
  assert.match(validateTask({ name: "x", deadline: 0, hours: 1.3 }), /0.5/);
  assert.match(validateTask({ name: "x", deadline: 0, hours: 41 }), /40/);
  assert.strictEqual(validateTask({ name: "x", deadline: 6, hours: 2.5 }), null);
});

test("each day respects its own limit, and days off get nothing", () => {
  const caps = [2, 0, 6, 1, 4, 0, 3];
  const plan = buildPlan([{ name: "Big", deadline: 6, hours: 16 }], caps);
  assert.deepStrictEqual(plan.unscheduled, []);
  plan.days.forEach((d, i) => assert.ok(d.total <= caps[i], `${d.day} ${d.total}h > ${caps[i]}h`));
  assert.strictEqual(plan.days[1].total, 0);
  assert.strictEqual(plan.days[5].total, 0);
});

test("days with more hours take proportionally more work", () => {
  const plan = buildPlan([{ name: "Essay", deadline: 1, hours: 3.5 }], [1, 6]);
  assert.deepStrictEqual(plan.days.slice(0, 2).map((d) => d.total), [0.5, 3]);
});

test("a day off before a deadline can make a task not fit", () => {
  const plan = buildPlan([{ name: "Lab", deadline: 1, hours: 3 }], [2, 0, 4, 4, 4, 4, 4]);
  assert.deepStrictEqual(plan.unscheduled, [{ name: "Lab", hours: 1, deadline: 1 }]);
});

test("validateCapacity", () => {
  assert.strictEqual(validateCapacity([4, 4, 4, 4, 4, 0, 0]), null);
  assert.match(validateCapacity([4, 4, 4, 4, 4, 4]), /all 7/);
  assert.match(validateCapacity([4, NaN, 4, 4, 4, 4, 4]), /^Tue/);
  assert.match(validateCapacity([4, 4, -1, 4, 4, 4, 4]), /^Wed/);
  assert.match(validateCapacity([4, 4, 4, 25, 4, 4, 4]), /^Thu/);
  assert.match(validateCapacity([4, 4, 4, 4, 1.2, 4, 4]), /^Fri/);
  assert.match(validateCapacity([0, 0, 0, 0, 0, 0, 0]), /above 0/);
});
