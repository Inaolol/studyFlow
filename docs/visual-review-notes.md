# Visual Review Notes

These notes document the page-by-page comparison between the final static website and the original prototype HTML files.

## Today Dashboard

Original Reference
`pages/dashboard.html`

What Was Checked
- desktop layout with sidebar,
- quick-add task row,
- four progress/stat cards,
- task list rows,
- subject tags and delete buttons.

What Was Adjusted
- made the quick-add row full width like the original dashboard,
- removed default browser button styling from task rows,
- aligned the app header actions closer to the original header pattern.

Screenshot
`docs/review-01-today-after-visual-pass.png`

Result
The Today page now feels closer to the original dashboard while staying in the single `index.html` app.

## Subjects Page

Original Reference
`pages/subjects.html`

What Was Checked
- page title and summary,
- subject card grid,
- colored top bars,
- subject stats,
- progress bars,
- next task sections.

What Was Adjusted
- changed the responsive breakpoint so the desktop page keeps three subject columns until `1024px`, matching the original.

Screenshot
`docs/review-02-subjects-after-visual-pass.png`

Result
The Subjects page now matches the original card density better on desktop.

## Calendar Page

Original Reference
`pages/calendar.html`

What Was Checked
- week title and date range,
- previous/today/next controls,
- workload chart,
- subject legend,
- weekly task cards.

What Was Adjusted
- no major layout correction was needed after comparison.
- the Calendar page already followed the original structure closely.

Screenshot
`docs/review-03-calendar-after-visual-pass.png`

Result
The Calendar page keeps the original planning structure and remains usable at desktop width.

## Add Task Modal

Original Reference
`components/add-task.jsx`

What Was Checked
- modal overlay,
- title field,
- subject selector,
- due date field,
- priority buttons,
- estimate and notes fields,
- cancel and submit buttons.

What Was Adjusted
- no major modal correction was needed after comparison.

Screenshot
`docs/review-04-add-task-modal-after-visual-pass.png`

Result
The Add Task modal remains close to the original component and is ready to use as a report screenshot.
