# fellowshiptrainingg
Read this mini-spec and any files already in this folder. Restate the target user, hypothesis, learning question, and core flow. Propose the smallest plan before editing. If the folder is empty, pick a simple stack and explain why. Use mock data. Do not add features or dependencies without explaining why. After implementation, run the app, test the acceptance criteria and relevant failure states, inspect the diff, and report exactly what passed, failed, or remains untested.
study-plan generator
user: college student with many classes and outside commitments
problem: struggle with creating time/planning for when to complete what assignments for school, clubs, and other commitments. people can guess about how long (in hours) each task will take, but they don’t necessarily know when they can complete it within the week ensuring to meet many deadlines across many tasks.
hypothesis: assignments/tasks can be organized by day (in a week) to create a weekly study plan that can be consistently and sustainably completed
question: will creating a day-by-day study plan help more students stay organized with their tasks?
core flow: open link -> enter weekly tasks -> enter deadline for each task -> estimate of how long task will take -> see recommendation of how tasks should be spaced out throughout week

## Prototype

No dependencies or build step. Open `index.html` in a browser, or serve the folder (`npx http-server .`).
Click **Load sample week** for mock data, then **Generate plan**.

- `scheduler.js`: planning logic. Earliest deadline first; each task's hours go in 0.5h blocks onto the least-loaded day from Mon through its due day (due = end of day), never above the daily max. Hours that don't fit are shown as a warning.
- `app.js`: form, mock data, rendering.
- Tests: `node --test test/scheduler.test.js`
