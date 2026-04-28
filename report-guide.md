# StudyFlow Project Report Guide

Use this guide when writing the final Microsoft Word report. The PDF requires at least 1000 words, a public GitHub repository link, screenshots, and a printed signed submission.

Screenshot files are saved in the `docs/` folder. Use `docs/report-assets.md` as the screenshot index.

## Student Information

- Student name:
- Student number:
- GitHub username:
- Public GitHub repository link:
- Course: Internet Programming / Web Programming Fundamentals
- Project name: StudyFlow

## Report Structure

### 1. Project Aim and Target Users

What Is StudyFlow?
StudyFlow is a study-planning website that helps students organize subjects, tasks, deadlines, and weekly workload in one place.

Why This Website Matters
Students often track assignments in many places. StudyFlow gives them one clear dashboard for what needs to be done today and what is coming next.

What Was Implemented
- a home landing page,
- a today dashboard,
- a subjects page,
- a weekly calendar,
- task and subject forms,
- browser-based data saving.

Result
The user can understand the study plan quickly and update it without using several separate tools.

### 2. Planning Before Coding

What Was Planned?
The project was planned before coding by first reviewing the design system, identifying reusable components, and mapping the PDF rubric to website features.

Why Planning Was Needed
Planning helped keep the final website simple, visual, and explainable. It also made sure that every rubric item had a matching feature in the project.

What Was Implemented
- one final HTML file for structure,
- one CSS file for the design system,
- one JavaScript file for dynamic behavior,
- one report guide for documentation.

Result
The website became easier to submit, test, and explain in the printed report.

### 3. HTML Structure

What Is the HTML Structure?
The HTML structure is the semantic skeleton of the website.

Why HTML Structure Matters
It helps browsers, users, and the teacher understand how the page is organized.

What Was Implemented
- `<header>` for the logo and navigation,
- `<nav>` for Home, Today, Subjects, and Calendar links,
- `<main id="app">` as the dynamic content area,
- `<div id="modal-root">` for task and subject forms,
- linked `styles.css` and `script.js`.

Result
The HTML remains short and clear while JavaScript changes the active view.

### 4. CSS Styling and Design Choices

What Is the Design System?
The design system is a reusable set of colors, fonts, spacing, cards, buttons, and layout rules.

Why CSS Styling Matters
Good styling makes the planner readable, calm, and easy to scan.

What Was Implemented
- CSS variables for color and typography,
- Fraunces for display headings,
- Inter for body text,
- charcoal, cream, and coral brand colors,
- reusable buttons, cards, tags, progress bars, and modals,
- responsive media queries for mobile screens.

Result
The website keeps a consistent visual identity across all pages.

### 5. JavaScript Usage and Dynamic Features

What Is JavaScript Used For?
JavaScript controls the interactive behavior of StudyFlow.

Why JavaScript Matters
The website needs to respond when users add tasks, complete tasks, delete tasks, switch views, and move between calendar weeks.

What Was Implemented
- hash navigation between views,
- rendering Home, Today, Subjects, and Calendar screens,
- adding new tasks,
- completing and uncompleting tasks,
- deleting tasks,
- adding new subjects,
- weekly calendar navigation,
- modal open and close behavior.

Result
The static website behaves like a small interactive study planner.

### 6. Data Handling

What Is Data Handling?
Data handling is how the website stores and updates subjects and tasks.

Why Data Handling Matters
Without saved data, every refresh would remove the user's study plan.

What Was Implemented
- seed subject data,
- seed task data,
- `localStorage` saving,
- `localStorage` loading,
- reset demo data button.

Result
Tasks and subjects remain available after the browser refreshes.

### 7. Home Page Screenshot

What Is the Home Page?
The Home page introduces StudyFlow and explains the purpose of the website.

Why This Page Matters
It gives the user a first impression and guides them toward the planner.

What Was Implemented
- hero section,
- call-to-action buttons,
- staged headline and button animations,
- animated scroll cue,
- task completion preview,
- explanation of the three-step workflow.

Figure 1
Home page of StudyFlow.
Screenshot file: `docs/figure-01-home-landing.png`

Result
The user understands that StudyFlow is for planning, studying, and reducing deadline stress.

### 8. Today Dashboard Screenshot

What Is the Today Dashboard?
The Today Dashboard is the main working screen of StudyFlow.

Why This Page Matters
It shows the user's current tasks, progress, estimated work time, and filters.

What Was Implemented
- progress cards,
- quick add area,
- task list,
- sidebar filters,
- subject filters,
- task completion buttons.

Figure 2
Today Dashboard screen.
Screenshot file: `docs/figure-02-today-dashboard.png`

Result
The user can quickly decide what to study next.

### 9. Add Task Modal Screenshot

What Is the Add Task Modal?
The Add Task modal is a form for creating a new study task.

Why This Feature Matters
Students need a fast way to enter assignments and deadlines.

What Was Implemented
- task title input,
- subject selector,
- due date input,
- priority buttons,
- time estimate input,
- notes field.

Figure 3
Add Task modal.
Screenshot file: `docs/figure-03-add-task-modal.png`

Result
The user can add a complete task without leaving the current page.

### 10. Subjects Page Screenshot

What Is the Subjects Page?
The Subjects page groups study work by course.

Why This Page Matters
Students can see which course has the most open work and what task is next.

What Was Implemented
- subject cards,
- open task count,
- completed task count,
- estimated work left,
- progress bars,
- add subject form.

Figure 4
Subjects page.
Screenshot file: `docs/figure-04-subjects.png`

Result
The user can compare courses and balance study time.

### 11. Calendar Page Screenshot

What Is the Calendar Page?
The Calendar page shows tasks across one week.

Why This Page Matters
It helps the student notice heavy workload days before they arrive.

What Was Implemented
- weekly grid,
- previous week button,
- next week button,
- today button,
- workload chart,
- subject legend,
- add task by selected day.

Figure 5
Calendar page.
Screenshot file: `docs/figure-05-calendar.png`

Result
The user can plan ahead and avoid surprise deadlines.

### 12. Navigation and User Experience

What Is the Navigation System?
The navigation system uses links in the header and hash routes in the browser URL.

Why Navigation Matters
The user must move between major features without confusion.

What Was Implemented
- Home link,
- Today link,
- Subjects link,
- Calendar link,
- active navigation state,
- clear buttons for main actions.

Result
The user always knows which section is open and what action to take next.

### 13. Challenges and Solutions

Challenge 1: Converting React Components
The original prototype used React and JSX. The final version needed only HTML, CSS, and JavaScript.

Solution
The React components were converted into JavaScript render functions that create the same screens with template strings.

Challenge 2: Keeping the Visual Design
The design already had strong colors, typography, and cards.

Solution
The reusable CSS variables and component styles were moved into one organized stylesheet.

Challenge 3: Saving Data Without a Backend
The project did not require a server database.

Solution
The website uses browser `localStorage` to save tasks and subjects.

Challenge 4: Final Visual Cleanup
The home page header and footer needed final browser review before screenshots were saved.

Solution
The `Sign in` link was removed, the landing header was made full width, the footer technology sentence was removed, and the StudyFlow footer brand was centered.

Evidence
- Header fix screenshot: `docs/fix-home-header-754.png`
- Footer fix screenshot: `docs/fix-home-footer-754.png`

Challenge 5: Adding Motion Without Making the Code Complicated
The original landing page used animation, but the final project still needed to be simple HTML, CSS, and JavaScript.

Solution
The final version uses CSS keyframe animations for the badge, headline, paragraph, buttons, background blobs, scroll cue, and task preview card. A `prefers-reduced-motion` rule was added for accessibility.

Evidence
- Animation notes: `docs/animation-notes.md`
- Landing entrance screenshot: `docs/animation-landing-entrance.png`
- Landing settled screenshot: `docs/animation-landing-settled.png`
- Task preview animation screenshot: `docs/animation-task-preview.png`

Result
The final project meets the course requirements while staying simple enough to explain.

### 14. Final Result

Final Result
StudyFlow is a complete static study-planning website built with HTML, CSS, and JavaScript. It has clear navigation, reusable design components, dynamic task features, and browser-based data handling.

### 15. Submission Checklist

- Report is at least 1000 words.
- Screenshots are added and labeled as figures.
- GitHub username is included.
- Public GitHub repository link is included.
- Student name and number are included.
- Report is signed before manual submission.
- Printed report is submitted by 30 April 2026.
