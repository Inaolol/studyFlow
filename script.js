(function () {
  const STORAGE_KEY = "studyflow_static_v1";
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const COLOR_OPTIONS = ["#E34432", "#497D7E", "#0F66AE", "#B05A8E", "#4C7A45", "#C77A2C", "#6B5BA8", "#D14F70"];

  const seedSubjects = [
    { id: "s1", name: "Calculus II", color: "var(--subj-1)", code: "MATH 221" },
    { id: "s2", name: "Cell Biology", color: "var(--subj-2)", code: "BIO 305" },
    { id: "s3", name: "World History", color: "var(--subj-3)", code: "HIST 110" },
    { id: "s4", name: "English Literature", color: "var(--subj-4)", code: "ENGL 240" },
    { id: "s5", name: "Spanish III", color: "var(--subj-5)", code: "SPAN 301" },
    { id: "s6", name: "Studio Art", color: "var(--subj-6)", code: "ART 150" }
  ];

  function todayISO(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return toISO(d);
  }

  const seedTasks = [
    { id: "t1", title: "Problem set 7 - integration by parts", subjectId: "s1", due: todayISO(0), priority: "high", est: 60, done: false, notes: "Skim chapter 7.4 first." },
    { id: "t2", title: "Read Ch. 12: Mitochondrial DNA", subjectId: "s2", due: todayISO(0), priority: "medium", est: 45, done: false, notes: "" },
    { id: "t3", title: "Outline essay on Treaty of Versailles", subjectId: "s3", due: todayISO(0), priority: "medium", est: 30, done: true, notes: "" },
    { id: "t4", title: "Vocabulary: 20 new verbs", subjectId: "s5", due: todayISO(0), priority: "low", est: 20, done: false, notes: "" },
    { id: "t5", title: "Sketchbook: 3 gesture drawings", subjectId: "s6", due: todayISO(1), priority: "low", est: 30, done: false, notes: "" },
    { id: "t6", title: "Lab writeup - enzyme kinetics", subjectId: "s2", due: todayISO(1), priority: "high", est: 90, done: false, notes: "" },
    { id: "t7", title: "Reread Hamlet Act II", subjectId: "s4", due: todayISO(2), priority: "medium", est: 60, done: false, notes: "" },
    { id: "t8", title: "Practice quiz: derivatives", subjectId: "s1", due: todayISO(2), priority: "medium", est: 40, done: false, notes: "" },
    { id: "t9", title: "Conversation partner - 30 min", subjectId: "s5", due: todayISO(3), priority: "low", est: 30, done: false, notes: "" },
    { id: "t10", title: "Essay draft: Industrial Revolution", subjectId: "s3", due: todayISO(4), priority: "high", est: 120, done: false, notes: "" },
    { id: "t11", title: "Annotate poems for seminar", subjectId: "s4", due: todayISO(5), priority: "medium", est: 45, done: false, notes: "" },
    { id: "t12", title: "Midterm review - chapters 1-6", subjectId: "s1", due: todayISO(6), priority: "high", est: 180, done: false, notes: "" },
    { id: "t13", title: "Final portfolio piece", subjectId: "s6", due: todayISO(8), priority: "medium", est: 240, done: false, notes: "" },
    { id: "t14", title: "Quiz: Cold War timeline", subjectId: "s3", due: todayISO(-1), priority: "medium", est: 30, done: true, notes: "" },
    { id: "t15", title: "Flashcards: organelles", subjectId: "s2", due: todayISO(-2), priority: "low", est: 20, done: true, notes: "" }
  ];

  let state = loadState();
  let route = normalizeRoute(location.hash);
  let dashboardFilter = { type: "today" };
  let weekStart = startOfWeek(new Date());
  let modal = null;

  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");

  document.getElementById("landing-start").addEventListener("click", () => navigate("today"));
  document.getElementById("quick-add-task").addEventListener("click", () => openTaskModal());
  const resetButton = document.getElementById("reset-data");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      dashboardFilter = { type: "today" };
      render();
    });
  }
  window.addEventListener("hashchange", () => {
    route = normalizeRoute(location.hash);
    render();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal) closeModal();
  });

  render();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.warn("Could not read saved StudyFlow data.", error);
    }
    const initial = {
      subjects: structuredClone(seedSubjects),
      tasks: structuredClone(seedTasks)
    };
    saveState(initial);
    return initial;
  }

  function saveState(nextState = state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function setState(updater) {
    state = typeof updater === "function" ? updater(state) : updater;
    saveState();
    render();
  }

  function normalizeRoute(hash) {
    const clean = (hash || "#home").replace("#", "");
    return ["home", "today", "subjects", "calendar"].includes(clean) ? clean : "home";
  }

  function navigate(nextRoute) {
    location.hash = nextRoute;
  }

  function render() {
    document.body.classList.toggle("home-active", route === "home");
    updateNav();

    if (route === "home") app.innerHTML = renderHome();
    if (route === "today") app.innerHTML = renderDashboard();
    if (route === "subjects") app.innerHTML = renderSubjects();
    if (route === "calendar") app.innerHTML = renderCalendar();

    bindViewEvents();
    renderModal();
  }

  function updateNav() {
    document.querySelectorAll("[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === route);
    });
  }

  function renderHome() {
    return `
      <section class="home-view">
        <section class="hero">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
          <div class="hero-inner">
            <div class="hero-eyebrow"><span class="live-dot"></span>Built for students</div>
            <h1><span class="hero-line">Plan. Study.</span><span class="hero-line accent-word">Breathe.</span></h1>
            <p>One simple place for every assignment, deadline, and quiet win.</p>
            <div class="hero-ctas">
              <button class="btn btn-primary btn-lg" data-action="go-today" type="button">Start planning</button>
              <button class="btn btn-secondary btn-lg" data-scroll-target="how" type="button">See how</button>
            </div>
          </div>
          <button class="scroll-cue" data-scroll-target="task-preview" type="button" aria-label="Scroll to task preview">
            <span>Scroll</span>
            <span class="line"></span>
          </button>
        </section>

        <section class="check-section" id="task-preview" aria-label="Task completion preview">
          <div class="check-card">
            <div class="ck-head">
              <div>
                <div class="ck-day">${fmtDate(todayISO(0))}</div>
                <h3>Today</h3>
              </div>
              <div class="ck-pct">75% done</div>
            </div>
            ${["Read Ch. 12 - Mitochondrial DNA", "Outline essay - Treaty of Versailles", "Vocabulary - 20 new verbs"].map((title, i) => `
              <div class="ck-row done">
                <span class="ck-box checked"></span>
                <span class="ck-title">${title}</span>
                <span class="tag ${["tag-teal", "tag-blue", "tag-green"][i]}">${["Biology", "History", "Spanish"][i]}</span>
              </div>
            `).join("")}
            <div class="ck-row">
              <span class="ck-box"></span>
              <span class="ck-title">Problem set 7 - integration by parts</span>
              <span class="tag tag-coral">Calculus</span>
            </div>
          </div>
        </section>

        <section class="rotator-section">
          <h2><span class="static">A planner that feels</span><span class="rotator-word">simple, calm, and ready.</span></h2>
        </section>

        <section class="how" id="how">
          <div class="how-inner">
            <h2>From <em>scattered</em> to sorted.</h2>
            ${renderStep("01", "Add your subjects.", "Each course gets a color. Your week becomes scannable at a glance.", renderSubjectPills())}
            ${renderStep("02", "Drop in a task.", "Title, subject, due date, priority, and estimate. Done in seconds.", `<div class="v-input">+ <span>Read Chapter 4 for History, due Friday</span></div>`)}
            ${renderStep("03", "Check things off.", "Progress updates across the dashboard, subjects, and calendar views.", renderMiniProgress())}
          </div>
        </section>

        <section class="cta">
          <h2>Your <em>calmer</em><br>semester starts now.</h2>
          <p>Free. No setup. Open and go.</p>
          <button class="btn btn-primary btn-lg" data-action="go-today" type="button">Start planning</button>
        </section>

        <footer class="footer">
          <div class="row gap-3"><span class="logo-mark" style="width:20px;height:20px"></span><span>StudyFlow - 2026</span></div>
        </footer>
      </section>
    `;
  }

  function renderStep(num, title, text, visual) {
    return `
      <div class="step-row">
        <div class="step-num">${num}</div>
        <div class="step-text">
          <h3>${title}</h3>
          <p>${text}</p>
        </div>
        <div class="step-visual">${visual}</div>
      </div>
    `;
  }

  function renderSubjectPills() {
    return `
      <div class="v-pills">
        <span class="tag tag-coral">Calculus</span>
        <span class="tag tag-teal">Biology</span>
        <span class="tag tag-blue">History</span>
        <span class="tag" style="color:var(--mauve);background:rgba(176,90,142,.08)">Literature</span>
        <span class="tag tag-green">Spanish</span>
      </div>
    `;
  }

  function renderMiniProgress() {
    return `
      <div class="v-progress">
        <div class="row completed"><span class="check checked"></span><span>Lab writeup - enzymes</span></div>
        <div class="row completed"><span class="check checked"></span><span>Read Hamlet, Act II</span></div>
        <div class="row completed"><span class="check checked"></span><span>Practice quiz - derivatives</span></div>
      </div>
    `;
  }

  function renderDashboard() {
    const subjectsById = byId(state.subjects);
    const filteredTasks = getDashboardTasks();
    const today = todayISO(0);
    const todayTasks = state.tasks.filter((task) => task.due === today);
    const todayDone = todayTasks.filter((task) => task.done).length;
    const todayPct = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;
    const totalEstToday = todayTasks.filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0);
    const weekTasks = state.tasks.filter((task) => {
      const diff = daysFromToday(task.due);
      return diff >= 0 && diff <= 6;
    });
    const weekDone = weekTasks.filter((task) => task.done).length;
    const heading = getDashboardHeading();

    return `
      <section class="app-layout">
        ${renderSidebar(todayPct)}
        <section class="app-main">
          <div class="page-head">
            <div>
              <h1>${heading.title}</h1>
              <div class="date">${heading.subtitle}</div>
            </div>
          </div>

          ${dashboardFilter.type === "today" ? `
            <button class="quick-add" data-action="open-task" type="button">
              <span>+</span>
              <input readonly placeholder="Add a task - try 'Read Chapter 4 for History, due tomorrow'" />
              <span class="small muted">new</span>
            </button>

            <div class="stat-row">
              ${renderStat("Today's plan", `${todayDone} / ${todayTasks.length}`, "tasks done", true, todayPct)}
              ${renderStat("Time on tap", formatMinutes(totalEstToday), "remaining today")}
              ${renderStat("This week", `${weekDone} / ${weekTasks.length}`, "tasks completed")}
              ${renderStat("Data saved", "Local", "browser storage")}
            </div>
          ` : ""}

          <div class="section-h">
            <h3>Tasks <span class="count">${filteredTasks.length}</span></h3>
            <button class="btn btn-ghost btn-sm" data-action="open-task" type="button">+ Add</button>
          </div>

          ${renderTaskList(filteredTasks, subjectsById, dashboardFilter.type !== "today")}
        </section>
      </section>
    `;
  }

  function renderSidebar(todayPct) {
    const todayCount = state.tasks.filter((task) => task.due === todayISO(0) && !task.done).length;
    const upcomingCount = state.tasks.filter((task) => {
      const diff = daysFromToday(task.due);
      return diff > 0 && diff <= 7 && !task.done;
    }).length;
    const overdueCount = state.tasks.filter((task) => daysFromToday(task.due) < 0 && !task.done).length;

    return `
      <aside class="sidebar">
        <div class="sb-progress">
          <div class="label">Today progress</div>
          <div class="pct">${todayPct}%</div>
          <div class="bar"><div style="width:${todayPct}%"></div></div>
        </div>
        <div class="sb-section-title">Views</div>
        ${sidebarButton("today", "Today", todayCount)}
        ${sidebarButton("upcoming", "Next 7 days", upcomingCount)}
        ${sidebarButton("overdue", "Overdue", overdueCount)}
        ${sidebarButton("all", "All tasks", state.tasks.filter((task) => !task.done).length)}
        <div class="sb-section-title">Subjects</div>
        ${state.subjects.map((subject) => sidebarSubject(subject)).join("")}
      </aside>
    `;
  }

  function sidebarButton(type, label, count) {
    return `<button class="sb-link ${dashboardFilter.type === type ? "active" : ""}" data-filter="${type}" type="button">${label}<span class="count">${count}</span></button>`;
  }

  function sidebarSubject(subject) {
    const count = state.tasks.filter((task) => task.subjectId === subject.id && !task.done).length;
    const active = dashboardFilter.type === "subject" && dashboardFilter.subjectId === subject.id;
    return `
      <button class="sb-link ${active ? "active" : ""}" data-subject-filter="${subject.id}" type="button">
        <span class="subj-dot" style="background:${subject.color}"></span>
        ${escapeHTML(subject.name)}
        <span class="count">${count}</span>
      </button>
    `;
  }

  function renderStat(label, value, sub, highlight = false, pct = 0) {
    return `
      <div class="stat-card ${highlight ? "highlight" : ""}">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-sub">${highlight ? `${pct}% complete - ` : ""}${sub}</div>
      </div>
    `;
  }

  function getDashboardHeading() {
    if (dashboardFilter.type === "upcoming") return { title: "Next 7 days", subtitle: "Heads up - what is coming." };
    if (dashboardFilter.type === "overdue") return { title: "Overdue", subtitle: "Past due tasks to bring back under control." };
    if (dashboardFilter.type === "all") return { title: "All tasks", subtitle: "Everything in your study plan." };
    if (dashboardFilter.type === "subject") {
      const subject = state.subjects.find((item) => item.id === dashboardFilter.subjectId);
      return { title: subject ? subject.name : "Subject", subtitle: subject ? subject.code : "" };
    }
    return { title: "Today", subtitle: fmtDate(todayISO(0)) };
  }

  function getDashboardTasks() {
    let list = [...state.tasks];
    if (dashboardFilter.type === "today") list = list.filter((task) => task.due === todayISO(0));
    if (dashboardFilter.type === "upcoming") list = list.filter((task) => {
      const diff = daysFromToday(task.due);
      return diff > 0 && diff <= 7;
    });
    if (dashboardFilter.type === "overdue") list = list.filter((task) => daysFromToday(task.due) < 0 && !task.done);
    if (dashboardFilter.type === "subject") list = list.filter((task) => task.subjectId === dashboardFilter.subjectId);
    return sortTasks(list);
  }

  function renderTaskList(tasks, subjectsById, groupByDate = false) {
    if (!tasks.length) {
      return `
        <div class="task-list">
          <div class="empty">
            <strong style="color:var(--charcoal)">Nothing here.</strong>
            <div>Add a task to start planning, or pick a different view.</div>
          </div>
        </div>
      `;
    }

    if (!groupByDate) {
      return `<div class="task-list">${tasks.map((task) => renderTaskRow(task, subjectsById[task.subjectId])).join("")}</div>`;
    }

    const groups = {};
    tasks.forEach((task) => {
      groups[task.due] = groups[task.due] || [];
      groups[task.due].push(task);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([date, items]) => `
      <div style="margin-bottom:24px">
        <div class="sb-section-title" style="padding:0 4px 8px;margin:0">${fmtDate(date)}${dateLabel(date)}</div>
        <div class="task-list">${items.map((task) => renderTaskRow(task, subjectsById[task.subjectId])).join("")}</div>
      </div>
    `).join("");
  }

  function renderTaskRow(task, subject) {
    const safeSubject = subject || state.subjects[0];
    return `
      <article class="task ${task.done ? "done" : ""}">
        <div class="priority-flag ${task.priority}"></div>
        <button class="task-main" data-toggle-task="${task.id}" type="button">
          <span class="check ${task.done ? "checked" : ""}"></span>
          <span>
            <span class="task-title">${escapeHTML(task.title)}</span>
            <span class="task-meta">
              <span>${task.est}m</span>
              <span>Due ${shortDate(task.due)}</span>
              ${task.notes ? "<span>has notes</span>" : ""}
            </span>
          </span>
        </button>
        <span class="task-subj-tag" style="color:${safeSubject.color};background:${transparentSubjectBg(safeSubject.color)}">
          <span class="subj-dot" style="background:${safeSubject.color}"></span>${escapeHTML(safeSubject.name)}
        </span>
        <button class="icon-btn" data-delete-task="${task.id}" type="button" aria-label="Delete ${escapeHTML(task.title)}">x</button>
      </article>
    `;
  }

  function renderSubjects() {
    const tasksBySubject = {};
    state.subjects.forEach((subject) => {
      tasksBySubject[subject.id] = [];
    });
    state.tasks.forEach((task) => {
      tasksBySubject[task.subjectId] = tasksBySubject[task.subjectId] || [];
      tasksBySubject[task.subjectId].push(task);
    });
    const totalOpen = state.tasks.filter((task) => !task.done).length;
    const totalHours = Math.floor(state.tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0) / 60);

    return `
      <section class="app-main">
        <div class="page-head">
          <div>
            <h1>Subjects</h1>
            <div class="sub">${state.subjects.length} courses - ${totalOpen} open - ${totalHours}h of work ahead</div>
          </div>
          <button class="btn btn-primary" data-action="open-subject" type="button">+ New subject</button>
        </div>
        <div class="subj-grid">
          ${state.subjects.map((subject) => renderSubjectCard(subject, tasksBySubject[subject.id] || [])).join("")}
          <button class="add-subj-card" data-action="open-subject" type="button">
            <span class="plus">+</span>
            <strong>Add a subject</strong>
            <span>Group tasks by class</span>
          </button>
        </div>
      </section>
    `;
  }

  function renderSubjectCard(subject, tasks) {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const upcoming = tasks.filter((task) => !task.done).sort((a, b) => a.due.localeCompare(b.due))[0];
    const totalTime = tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0);

    return `
      <article class="subj-card" style="--subject-color:${subject.color}">
        <div class="top-bar"></div>
        <div class="code">${escapeHTML(subject.code)}</div>
        <h3>${escapeHTML(subject.name)}</h3>
        <div class="subj-stats">
          <div class="subj-stat"><div class="v">${total - done}</div><div class="l">Open</div></div>
          <div class="subj-stat"><div class="v">${done}</div><div class="l">Done</div></div>
          <div class="subj-stat"><div class="v">${Math.floor(totalTime / 60)}h</div><div class="l">Left</div></div>
        </div>
        <div class="progress-bar"><div style="width:${pct}%"></div></div>
        <div class="progress-text"><span>${pct}% complete</span><span>${done} / ${total}</span></div>
        <div class="next-task">
          <div class="lab">Next up</div>
          ${upcoming ? `
            <div class="nt-title">${escapeHTML(upcoming.title)}</div>
            <div class="nt-due">Due ${shortDate(upcoming.due)} - ${upcoming.est}m</div>
          ` : `<div class="nt-title muted">All caught up.</div>`}
        </div>
      </article>
    `;
  }

  function renderCalendar() {
    const subjectsById = byId(state.subjects);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, iso: toISO(date) };
    });
    const tasksByDate = {};
    state.tasks.forEach((task) => {
      tasksByDate[task.due] = tasksByDate[task.due] || [];
      tasksByDate[task.due].push(task);
    });
    const maxLoad = Math.max(...days.map((day) => (tasksByDate[day.iso] || []).filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0)), 60);

    return `
      <section class="app-main" style="max-width:1440px">
        <div class="page-head">
          <div>
            <h1>This week</h1>
            <div class="range">${weekRange(days)}</div>
          </div>
          <div class="week-nav">
            <button class="nav-btn" data-week="-7" type="button" aria-label="Previous week">&lt;</button>
            <button class="btn btn-secondary btn-sm" data-week="0" type="button">Today</button>
            <button class="nav-btn" data-week="7" type="button" aria-label="Next week">&gt;</button>
          </div>
        </div>

        <div class="workload-section">
          <h3>Workload across the week</h3>
          <div class="workload-sub">Estimated time per day. Spot the heavy days early.</div>
          <div class="wl-bars">
            ${days.map((day) => renderWorkloadBar(day, tasksByDate[day.iso] || [], maxLoad)).join("")}
          </div>
        </div>

        <div class="legend">
          ${state.subjects.map((subject) => `
            <div class="legend-item"><span class="subj-dot" style="background:${subject.color};width:12px;height:12px"></span>${escapeHTML(subject.name)}</div>
          `).join("")}
        </div>

        <div class="week-grid">
          ${days.map((day) => renderDay(day, tasksByDate[day.iso] || [], subjectsById)).join("")}
        </div>
      </section>
    `;
  }

  function renderWorkloadBar(day, tasks, maxLoad) {
    const total = tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0);
    const pct = total ? Math.max((total / maxLoad) * 100, 4) : 0;
    const cls = total > 120 ? "heavy" : total > 60 ? "medium" : "light";
    return `
      <div class="wl-bar">
        <div class="bar-value">${total ? `${Math.round((total / 60) * 10) / 10}h` : "-"}</div>
        <div class="bar-track"><div class="bar-fill ${cls}" style="height:${pct}%"></div></div>
        <div class="bar-label">${day.date.toLocaleDateString("en-US", { weekday: "short" })}</div>
      </div>
    `;
  }

  function renderDay(day, tasks, subjectsById) {
    const today = todayISO(0);
    const isToday = day.iso === today;
    const isPast = day.iso < today;
    const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
    const totalMin = sorted.filter((task) => !task.done).reduce((sum, task) => sum + task.est, 0);
    return `
      <article class="day ${isToday ? "today" : ""} ${isPast && !isToday ? "past" : ""}">
        <div class="day-head">
          <div>
            <div class="dow">${day.date.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div class="dom">${day.date.getDate()}</div>
          </div>
          <div class="load">${totalMin ? `${Math.round((totalMin / 60) * 10) / 10}h` : "-"}</div>
        </div>
        <div style="flex:1">
          ${sorted.map((task) => {
            const subject = subjectsById[task.subjectId] || state.subjects[0];
            return `
              <div class="day-task ${task.done ? "done" : ""}" data-toggle-task="${task.id}" style="--task-color:${subject.color}">
                <div class="dt-subj">${escapeHTML(subject.name)}</div>
                <div class="dt-title">${escapeHTML(task.title)}</div>
                <div class="dt-meta"><span>${task.est}m</span>${task.priority === "high" ? `<span>high</span>` : ""}</div>
              </div>
            `;
          }).join("")}
        </div>
        <button class="add-day" data-add-date="${day.iso}" type="button">+ Add task</button>
      </article>
    `;
  }

  function bindViewEvents() {
    document.querySelectorAll("[data-action='go-today']").forEach((button) => button.addEventListener("click", () => navigate("today")));
    document.querySelectorAll("[data-action='open-task']").forEach((button) => button.addEventListener("click", () => openTaskModal()));
    document.querySelectorAll("[data-action='open-subject']").forEach((button) => button.addEventListener("click", () => openSubjectModal()));
    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        dashboardFilter = { type: button.dataset.filter };
        render();
      });
    });
    document.querySelectorAll("[data-subject-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        dashboardFilter = { type: "subject", subjectId: button.dataset.subjectFilter };
        render();
      });
    });
    document.querySelectorAll("[data-toggle-task]").forEach((el) => el.addEventListener("click", () => toggleTask(el.dataset.toggleTask)));
    document.querySelectorAll("[data-delete-task]").forEach((button) => button.addEventListener("click", () => deleteTask(button.dataset.deleteTask)));
    document.querySelectorAll("[data-week]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = Number(button.dataset.week);
        weekStart = delta === 0 ? startOfWeek(new Date()) : addDays(weekStart, delta);
        render();
      });
    });
    document.querySelectorAll("[data-add-date]").forEach((button) => button.addEventListener("click", () => openTaskModal(button.dataset.addDate)));
  }

  function openTaskModal(defaultDate = todayISO(0)) {
    modal = { type: "task", defaultDate };
    renderModal();
  }

  function openSubjectModal() {
    modal = { type: "subject" };
    renderModal();
  }

  function closeModal() {
    modal = null;
    renderModal();
  }

  function renderModal() {
    if (!modal) {
      modalRoot.innerHTML = "";
      return;
    }
    modalRoot.innerHTML = modal.type === "task" ? renderTaskModal(modal.defaultDate) : renderSubjectModal();
    bindModalEvents();
  }

  function renderTaskModal(defaultDate) {
    return `
      <div class="modal-overlay" data-close-modal>
        <form class="modal-card" id="task-form">
          <div class="modal-head">
            <h3>New study task</h3>
            <button class="icon-btn" data-close-button type="button" aria-label="Close">x</button>
          </div>
          <div class="form-field">
            <label for="task-title">What needs doing?</label>
            <input id="task-title" name="title" type="text" placeholder="Review chapter 5 problems" required autofocus />
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label for="task-subject">Subject</label>
              <select id="task-subject" name="subjectId">${state.subjects.map((subject) => `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`).join("")}</select>
            </div>
            <div class="form-field">
              <label for="task-due">Due date</label>
              <input id="task-due" name="due" type="date" value="${defaultDate}" />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>Priority</label>
              <div class="priority-options">
                ${["low", "medium", "high"].map((priority) => `<button type="button" class="${priority === "medium" ? "selected" : ""}" data-priority="${priority}">${priority}</button>`).join("")}
              </div>
              <input type="hidden" name="priority" value="medium" />
            </div>
            <div class="form-field">
              <label for="task-est">Estimate (minutes)</label>
              <input id="task-est" name="est" type="number" min="5" max="480" step="5" value="30" />
            </div>
          </div>
          <div class="form-field">
            <label for="task-notes">Notes (optional)</label>
            <textarea id="task-notes" name="notes" rows="3" placeholder="Anything useful to remember"></textarea>
          </div>
          <div class="row gap-3" style="justify-content:flex-end">
            <button class="btn btn-secondary" data-close-button type="button">Cancel</button>
            <button class="btn btn-primary" type="submit">Add task</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderSubjectModal() {
    return `
      <div class="modal-overlay" data-close-modal>
        <form class="modal-card" id="subject-form">
          <div class="modal-head">
            <h3>New subject</h3>
            <button class="icon-btn" data-close-button type="button" aria-label="Close">x</button>
          </div>
          <div class="form-field">
            <label for="subject-name">Subject name</label>
            <input id="subject-name" name="name" type="text" placeholder="Organic Chemistry" required autofocus />
          </div>
          <div class="form-field">
            <label for="subject-code">Course code</label>
            <input id="subject-code" name="code" type="text" placeholder="CHEM 220" />
          </div>
          <div class="form-field">
            <label>Color</label>
            <div class="color-pick">
              ${COLOR_OPTIONS.map((color, index) => `<button type="button" class="${index === 0 ? "selected" : ""}" data-color="${color}" style="background:${color}" aria-label="Use ${color}"></button>`).join("")}
            </div>
            <input type="hidden" name="color" value="${COLOR_OPTIONS[0]}" />
          </div>
          <div class="row gap-3" style="justify-content:flex-end">
            <button class="btn btn-secondary" data-close-button type="button">Cancel</button>
            <button class="btn btn-primary" type="submit">Add subject</button>
          </div>
        </form>
      </div>
    `;
  }

  function bindModalEvents() {
    modalRoot.querySelectorAll("[data-close-button]").forEach((button) => button.addEventListener("click", closeModal));
    modalRoot.querySelector("[data-close-modal]")?.addEventListener("click", (event) => {
      if (event.target.matches("[data-close-modal]")) closeModal();
    });

    const taskForm = document.getElementById("task-form");
    if (taskForm) {
      taskForm.querySelectorAll("[data-priority]").forEach((button) => {
        button.addEventListener("click", () => {
          taskForm.querySelectorAll("[data-priority]").forEach((item) => item.classList.remove("selected"));
          button.classList.add("selected");
          taskForm.elements.priority.value = button.dataset.priority;
        });
      });
      taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(taskForm);
        const title = String(form.get("title") || "").trim();
        if (!title) return;
        setState((prev) => ({
          ...prev,
          tasks: [{
            id: `t${Date.now()}`,
            title,
            subjectId: String(form.get("subjectId")),
            due: String(form.get("due") || todayISO(0)),
            priority: String(form.get("priority") || "medium"),
            est: Number(form.get("est")) || 30,
            done: false,
            notes: String(form.get("notes") || "").trim()
          }, ...prev.tasks]
        }));
        closeModal();
      });
    }

    const subjectForm = document.getElementById("subject-form");
    if (subjectForm) {
      subjectForm.querySelectorAll("[data-color]").forEach((button) => {
        button.addEventListener("click", () => {
          subjectForm.querySelectorAll("[data-color]").forEach((item) => item.classList.remove("selected"));
          button.classList.add("selected");
          subjectForm.elements.color.value = button.dataset.color;
        });
      });
      subjectForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(subjectForm);
        const name = String(form.get("name") || "").trim();
        if (!name) return;
        setState((prev) => ({
          ...prev,
          subjects: [...prev.subjects, {
            id: `s${Date.now()}`,
            name,
            code: String(form.get("code") || "").trim() || "COURSE",
            color: String(form.get("color") || COLOR_OPTIONS[0])
          }]
        }));
        closeModal();
      });
    }
  }

  function toggleTask(id) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task)
    }));
  }

  function deleteTask(id) {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) }));
  }

  function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.due !== b.due) return a.due.localeCompare(b.due);
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  }

  function byId(items) {
    return Object.fromEntries(items.map((item) => [item.id, item]));
  }

  function startOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return d;
  }

  function addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  }

  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function daysFromToday(iso) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${iso}T00:00:00`);
    return Math.round((date - today) / 86400000);
  }

  function fmtDate(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function shortDate(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function dateLabel(iso) {
    const diff = daysFromToday(iso);
    if (diff === 0) return " - today";
    if (diff === 1) return " - tomorrow";
    if (diff < 0) return ` - ${Math.abs(diff)}d overdue`;
    return "";
  }

  function weekRange(days) {
    const first = days[0].date;
    const last = days[6].date;
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()}-${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${last.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${first.getFullYear()}`;
  }

  function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!minutes) return "0h";
    return `${hours}h${rest ? ` ${rest}m` : ""}`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function transparentSubjectBg(color) {
    if (color.startsWith("var(")) return "rgba(37,34,30,0.03)";
    return `${color}14`;
  }
})();
