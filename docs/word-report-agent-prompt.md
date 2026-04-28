# Prompt for Writing the StudyFlow Microsoft Word Report

Copy this prompt into a new chat when you want an agent to write the final Microsoft Word report.

## Agent Prompt

You are helping write a Microsoft Word project report for an Internet Programming / Web Programming Fundamentals course project.

Use the relevant document-writing skills:
- `doc` or `documents:documents` for creating and formatting the `.docx` file.
- `pdf` only if you need to re-check the original assignment PDF.
- `browser-use:browser` or `playwright` only if you need to verify screenshots or reload the local website.
- `frontend-design` only for explaining visual design decisions, not for changing the website.

Project context:
- Project name: StudyFlow.
- Course context: CS193X-style Web Programming Fundamentals.
- Final website type: static single-page website.
- Runtime files: `index.html`, `styles.css`, `script.js`.
- Documentation files: `report-guide.md`, `docs/report-assets.md`, `docs/animation-notes.md`, `docs/visual-review-notes.md`.
- Website URL for local checking: `file:///C:/Users/Said%20Mohamud/Desktop/studyflow/index.html#home`.

Assignment requirements to satisfy:
- At least 1000 words.
- Include project aim and target users.
- Explain HTML structure.
- Explain CSS styling and design choices.
- Explain JavaScript dynamic features.
- Explain data handling.
- Include screenshots with figure numbers and captions.
- Explain pages, navigation, and user experience.
- Explain challenges and solutions.
- Include GitHub username and public repository link placeholders.
- End with final result and signature reminder.
- Keep the writing concise, technical, and step-by-step.

Writing style:
- Use simple section headings.
- For each main feature, use this pattern:

```text
What Is the Feature?
Short definition.

Why This Feature Matters
Short reason.

What Was Implemented
- feature,
- feature,
- feature.

Figure X
Screenshot caption.

Result
Short result.
```

Do not write like marketing copy. Write like a clear student project report. The teacher prefers simple definitions, short reasons, bullet points, screenshots, and result statements.

Use these source files:
- `report-guide.md` - main report outline and required talking points.
- `docs/report-assets.md` - screenshot index.
- `docs/animation-notes.md` - landing animation explanation.
- `docs/visual-review-notes.md` - page-by-page visual review notes.
- `index.html` - semantic structure.
- `styles.css` - design system, layout, animation, responsive CSS.
- `script.js` - routing, rendering, localStorage, forms, task features, subject features, calendar features.

Use these screenshots in the Word report:
- `docs/figure-01-home-landing.png`
- `docs/figure-02-today-dashboard.png`
- `docs/figure-03-add-task-modal.png`
- `docs/figure-04-subjects.png`
- `docs/figure-05-calendar.png`

Optional evidence screenshots:
- `docs/animation-landing-entrance.png`
- `docs/animation-landing-settled.png`
- `docs/animation-task-preview.png`
- `docs/fix-home-header-754.png`
- `docs/fix-home-footer-754.png`
- `docs/review-01-today-after-visual-pass.png`
- `docs/review-02-subjects-after-visual-pass.png`
- `docs/review-03-calendar-after-visual-pass.png`
- `docs/review-04-add-task-modal-after-visual-pass.png`

Create a polished `.docx` report with:
- title page,
- table of contents,
- numbered sections,
- figure captions,
- screenshot placements,
- concise technical explanations,
- placeholders for student name, student number, GitHub username, and public repository link,
- signature line at the end.

Do not invent a GitHub username or repository link. Leave placeholders if they are not provided.

## Recommended Word Report Table of Contents

1. Cover Page
2. Project Aim and Target Users
3. Planning Before Coding
4. Project File Structure
5. HTML Structure
6. CSS Styling and Design System
7. JavaScript Dynamic Features
8. Data Handling with `localStorage`
9. Home Page
10. Today Dashboard
11. Add Task Modal
12. Subjects Page
13. Calendar Page
14. Navigation and User Experience
15. Animation and Visual Polish
16. Visual Review and Improvements
17. Challenges and Solutions
18. GitHub Repository Information
19. Final Result
20. Signature

## Suggested Figure List

Figure 1: Home page of StudyFlow.
File: `docs/figure-01-home-landing.png`

Figure 2: Today Dashboard screen.
File: `docs/figure-02-today-dashboard.png`

Figure 3: Add Task modal form.
File: `docs/figure-03-add-task-modal.png`

Figure 4: Subjects page.
File: `docs/figure-04-subjects.png`

Figure 5: Weekly Calendar page.
File: `docs/figure-05-calendar.png`

Figure 6: Landing page animation after visual polish.
File: `docs/animation-landing-settled.png`

Figure 7: Page visual review evidence.
File: `docs/review-01-today-after-visual-pass.png`

## Report Writing Notes

- Mention that the final project was converted from a prototype into plain HTML, CSS, and JavaScript.
- Mention that `pages/index-v1-textheavy.html` was excluded from the final implementation.
- Mention that the final runtime files are only `index.html`, `styles.css`, and `script.js`.
- Mention that `localStorage` is the data-handling method because no backend database was required.
- Mention that the visual design keeps the original StudyFlow design system: Fraunces display font, Inter body font, charcoal/cream/coral palette, subject colors, cards, progress bars, modals, and responsive layouts.
- Mention that animation was added using CSS keyframes and includes reduced-motion support.
- Mention that visual review was performed page by page against the original prototype files.

## Student Placeholders

- Student name: `[Add name]`
- Student number: `[Add student number]`
- GitHub username: `[Add GitHub username]`
- Public repository link: `[Add public GitHub repository link]`
- Submission date: `[Add submission date]`
- Signature: `________________________`
