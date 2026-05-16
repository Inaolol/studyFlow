# StudyFlow

![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=24&pause=1000&color=E34432&center=false&vCenter=true&width=435&lines=Plan+your+tasks.;Track+your+sessions.;Analyze+your+stats.)

A client-side study planner and Pomodoro tracker built with TypeScript.

Data is persisted locally in the browser.

## Features

- **Task Management:** Add, complete, and delete tasks with subjects, due dates, and time estimates.
- **Pomodoro Timer:** Built-in 25/5/15 minute timer linked to tasks. Sessions are securely recorded.
- **Analytics Dashboard:** Visualise your progress with heatmaps, bar charts, and histograms.
- **Keyboard Shortcuts:** Fast, vim-inspired keyboard navigation (`g t/s/c/d` to navigate, `n` for new task, `/` to search).
- **Themes:** Light and dark mode support.
- **Data Portability:** Export/import your data as JSON. Export tasks to Apple/Google Calendar via `.ics`.
- **Offline First:** Operates fully offline as a Progressive Web App (PWA).

## Local Development

```bash
git clone https://github.com/Inaolol/studyFlow.git
cd studyFlow
npm install
npm run dev        # start local dev server at http://localhost:5173/studyFlow/
npm test           # run unit tests
npm run test:e2e   # run playwright E2E tests (requires: npm run build first)
```
