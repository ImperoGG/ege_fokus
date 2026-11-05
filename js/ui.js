/* Иконки, оболочка и переиспользуемые UI-блоки. */
'use strict';

const ICONS = {
  spark: '<path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
  home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M16 2v5M8 2v5M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  book: '<path d="M4 19.2A2.8 2.8 0 0 1 6.8 16.4H20"/><path d="M6.8 2H20v20H6.8A2.8 2.8 0 0 1 4 19.2V4.8A2.8 2.8 0 0 1 6.8 2z"/><path d="M8 6h8M8 10h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.2M12 16.5h.01"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  flame: '<path d="M12 22c4.4 0 7-2.8 7-6.5 0-3.2-2.1-5.2-3.7-7.1C13.8 6.5 13 4.7 13 2c-2.8 1.7-4 4.4-4 7 0 1.5.6 2.7 1.2 3.5-1.6-.3-2.7-1.6-3.2-3C6 11 5 13.1 5 15.5 5 19.2 7.6 22 12 22z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.5 2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.3 2.3 4.8-5"/>',
  play: '<path d="m8 5 11 7-11 7V5z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  lightbulb: '<path d="M9 18h6M10 22h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.8-1.5 1.7-1.5 2.5H10c0-.8-.6-1.7-1.5-2.5z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  bookOpen: '<path d="M2 5.5A3.5 3.5 0 0 1 5.5 2H11v18H5.5A3.5 3.5 0 0 0 2 23.5v-18z"/><path d="M22 5.5A3.5 3.5 0 0 0 18.5 2H13v18h5.5a3.5 3.5 0 0 1 3.5 3.5v-18z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  rotate: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.42-1.42"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
  eyeOff: '<path d="m3 3 18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.4 0 10 6 10 6a17.8 17.8 0 0 1-3.1 3.5M6.1 6.7C3.6 8.5 2 12 2 12s3.6 6 10 6a10.8 10.8 0 0 0 4.4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  bank: '<path d="m3 10 9-7 9 7"/><path d="M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18"/>',
  trendUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  quote: '<path d="M7 11H4a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2h3v6c0 3-1.5 5-4 6M18 11h-3a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2h3v6c0 3-1.5 5-4 6"/>',
  award: '<circle cx="12" cy="8.5" r="5.5"/><path d="m8.6 13.4-1.1 8 4.5-2.7 4.5 2.7-1.1-8"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 5h16"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.2 16.2 4.3 4.3"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 11.2 3.9 3.9 0 0 0 7 18z"/>',
  install: '<path d="M12 3v11M8 10l4 4 4-4"/><path d="M5 17v3h14v-3"/>',
  layersPlus: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/><path d="M19 3v6M16 6h6"/>'
};

function icon(name, className) {
  return '<svg' + (className ? ' class="' + className + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* Бейдж варианта ответа: буква до проверки, галочка/крестик после.
   Анимацию поворота и рисования линии включает animateVerdictIcons(). */
function verdictBadge(letter, verdict) {
  if (verdict !== 'correct' && verdict !== 'wrong') return '<span class="option-letter">' + letter + '</span>';
  const paths = verdict === 'correct'
    ? '<path pathLength="1" d="M19.4 6.4 9.6 17.6 4.6 12.6"/>'
    : '<path pathLength="1" d="M17.6 6.4 6.4 17.6"/><path pathLength="1" d="M6.4 6.4 17.6 17.6"/>';
  return '<span class="option-letter verdict is-' + verdict + '">' +
    '<svg class="verdict-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>' +
    '</span>';
}

function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value < 60) return value + ' мин';
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return hours + ' ч' + (rest ? ' ' + rest + ' мин' : '');
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function pageTitle() {
  const titles = {
    dashboard: 'Обзор',
    plan: 'План подготовки',
    subjects: 'Предметы',
    trainer: 'Тренажёр',
    mistakes: 'Журнал ошибок',
    progress: 'Прогресс',
    achievements: 'Достижения',
    group: 'Группа',
    settings: 'Настройки'
  };
  return titles[view] || 'Фокус';
}

function activeNav() {
  return view === 'subject' ? 'subjects' : view;
}

function renderShell(content) {
  const nearest = nearestExam();
  const streak = currentStreak();
  const subjects = profileSubjects();
  const mistakes = getMistakeEntries().length;
  const targetSum = subjects.filter(id => !SUBJECTS[id].isEssay).reduce((sum, id) => sum + Number(state.profile?.targets?.[id] || 0), 0);
  const navItems = [
    ['dashboard', 'Обзор', 'home'],
    ['plan', 'План', 'calendar'],
    ['subjects', 'Предметы', 'book'],
    ['trainer', 'Тренажёр', 'target'],
    ['mistakes', 'Ошибки', 'alert', mistakes || null],
    ['progress', 'Прогресс', 'chart'],
    ['achievements', 'Награды', 'trophy'],
    ['group', 'Группа', 'users']
  ];
  const nav = navItems.map(([id, label, iconName, badge]) => (
    '<button class="nav-item' + (activeNav() === id ? ' active' : '') + '" data-action="nav" data-view="' + id + '">' +
      icon(iconName) + '<span>' + label + '</span>' +
      (badge ? '<span class="nav-badge">' + badge + '</span>' : '') +
    '</button>'
  )).join('');
  return '' +
    '<div class="shell">' +
      '<aside class="sidebar">' +
        '<div class="brand">' +
          '<span class="brand-mark"><img src="icons/icon-192.png" alt="" width="40" height="40"></span>' +
          '<span class="brand-name">Фокус<small>ЕГЭ ' + (state.profile?.examYear || resolveExamYear()) + '</small></span>' +
        '</div>' +
        '<div class="nav-label">Учёба</div>' +
        '<nav class="nav">' + nav + '</nav>' +
        '<div class="nav-label">Система</div>' +
        '<nav class="nav">' +
          '<button class="nav-item' + (activeNav() === 'settings' ? ' active' : '') + '" data-action="nav" data-view="settings">' + icon('settings') + '<span>Настройки</span></button>' +
        '</nav>' +
        '<div class="sidebar-bottom">' +
          '<div class="mini-profile">' +
            '<span class="avatar">' + escapeHTML(initials(state.profile?.name).toUpperCase()) + '</span>' +
            '<span><b>' + escapeHTML(state.profile?.name || 'Ученик') + '</b><small>' + subjects.length + ' ' + pluralize(subjects.length, ['трек', 'трека', 'треков']) + ' · ' + targetSum + ' б.</small></span>' +
          '</div>' +
          '<div class="sidebar-note">План, теория и практика. Данные можно перенести на другое устройство.</div>' +
        '</div>' +
      '</aside>' +
      '<div class="main-wrap">' +
        '<header class="topbar">' +
          '<div class="topbar-left"><h1>' + pageTitle() + '</h1><span class="topbar-date">' + formatDate(new Date(), { weekday: 'short', day: 'numeric', month: 'long' }) + '</span></div>' +
          '<div class="topbar-right">' +
            '<button class="search-trigger" data-action="open-search" aria-label="Поиск по курсу" title="Поиск по темам, заданиям и шпаргалкам"><span>' + icon('search') + 'Поиск</span><kbd>Ctrl K</kbd></button>' +
            (nearest ? '<button class="countdown-pill" data-action="nav" data-view="plan"><span class="pulse-dot"></span>До ' + escapeHTML(SUBJECTS[nearest.id].genitive || SUBJECTS[nearest.id].short) + ' <b>' + daysLabel(nearest.days) + '</b></button>' : '') +
            '<div class="streak-pill" title="Серия занятий">' + icon('flame') + '<span>' + streak + ' ' + pluralize(streak, ['день', 'дня', 'дней']) + '</span></div>' +
            '<button class="icon-btn" data-action="toggle-theme" aria-label="' + (currentTheme() === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему') + '" title="' + (currentTheme() === 'dark' ? 'Светлая тема' : 'Тёмная тема') + '">' + icon(currentTheme() === 'dark' ? 'sun' : 'moon') + '</button>' +
            '<button class="icon-btn" data-action="nav" data-view="settings" aria-label="Напоминания">' + icon('bell') + '</button>' +
            '<button class="avatar" data-action="nav" data-view="settings" aria-label="Профиль и аккаунт" title="' + escapeHTML(currentUser?.email || '') + '" style="width:40px;height:40px;border-radius:12px">' + escapeHTML(initials(state.profile?.name).toUpperCase()) + '</button>' +
          '</div>' +
        '</header>' +
        '<main class="content">' + content + '</main>' +
      '</div>' +
    '</div>';
}

function planIsStale(plan) {
  if (!plan || !Array.isArray(plan.sessions)) return true;
  if (Number(plan.version) !== PLAN_VERSION) return true;
  if (Number(plan.stats?.total) !== totalSelectedTopics()) return true;
  if (plan.sessions.some(session => session.topicId && !TOPIC_BY_ID[session.topicId])) return true;
  const lastWeek = lastWeekSubjects(state.profile).slice().sort().join(',');
  const plannedLastWeek = asArray(plan.lastWeekSubjects).filter(id => SUBJECTS[id]).slice().sort().join(',');
  if (lastWeek !== plannedLastWeek) return true;
  const today = toISO(new Date());
  const futureSubjects = new Set(plan.sessions.filter(session => session.date >= today).map(session => session.subject));
  if (profileSubjects().some(subjectId => examDateFor(subjectId) > today && !futureSubjects.has(subjectId))) return true;
  const blocked = lastWeekSubjects(state.profile);
  const horizon = toISO(addDays(new Date(), 7));
  if (plan.sessions.some(session => (
    session.date >= today && session.date <= horizon &&
    blocked.includes(session.subject) && session.type === 'theory'
  ))) return true;
  return false;
}

function sessionIsDone(sessionId) {
  return Boolean(state.progress.sessions?.[sessionId]?.doneAt);
}

function sessionIsMissed(session) {
  return session.date < toISO(new Date()) && !sessionIsDone(session.id);
}

function sessionsForDate(dateISO) {
  if (!state.plan) return [];
  return state.plan.sessions.filter(session => session.date === dateISO).sort((a, b) => a.start.localeCompare(b.start));
}

function nextSession() {
  if (!state.plan) return null;
  const today = toISO(new Date());
  return state.plan.sessions.find(session => session.date >= today && !sessionIsDone(session.id)) || null;
}

function overdueSessions() {
  if (!state.plan) return [];
  const today = toISO(new Date());
  return state.plan.sessions.filter(session => session.date < today && !sessionIsDone(session.id));
}

function currentFocusSession() {
  const today = toISO(new Date());
  const todaySessions = sessionsForDate(today);
  return todaySessions.find(session => !sessionIsDone(session.id)) || nextSession();
}

function sessionSubjectStyle(subjectId) {
  const subject = SUBJECTS[subjectId] || SUBJECTS.math;
  return '--subj-color:' + subject.color + ';--subj-soft:' + subject.soft + ';';
}

function primarySessionAction(session) {
  if (sessionIsDone(session.id)) return '<span class="badge mint">' + icon('check', '') + 'Выполнено</span>';
  if (session.type === 'theory') {
    return '<button class="btn btn-soft btn-sm" data-action="open-theory" data-topic="' + session.topicId + '" data-session="' + session.id + '">' + icon('bookOpen') + 'Изучить</button>';
  }
  if (session.type === 'cheatsheet') {
    return '<button class="btn btn-soft btn-sm" data-action="open-cheatsheet" data-topic="' + session.topicId + '">' + icon('bookOpen') + 'Шпаргалка</button>';
  }
  if (session.type === 'mock') {
    return '<button class="btn btn-soft btn-sm" data-action="start-mock" data-subject="' + session.subject + '" data-session="' + session.id + '">' + icon('play') + 'Пробник</button>';
  }
  return '<button class="btn btn-soft btn-sm" data-action="start-practice" data-topic="' + session.topicId + '" data-session="' + session.id + '">' + icon('target') + (session.type === 'review' ? 'Повторить' : 'Практика') + '</button>';
}

function sessionCheckAction(session) {
  if (sessionIsDone(session.id)) return '';
  return '<button class="icon-btn tooltip" data-action="mark-session" data-session="' + session.id + '" data-tip="Отметить выполненным" aria-label="Отметить выполненным">' + icon('check') + '</button>';
}

function renderSessionRow(session) {
  const subject = SUBJECTS[session.subject];
  const topic = session.topicId ? TOPIC_BY_ID[session.topicId] : null;
  const done = sessionIsDone(session.id);
  return '' +
    '<div class="session-row' + (done ? ' done' : '') + '">' +
      '<div class="session-subj" style="' + sessionSubjectStyle(session.subject) + '">' + subject.icon + '</div>' +
      '<div style="min-width:0">' +
        '<div class="session-row-title">' + escapeHTML(topic ? topic.title : session.title) + '</div>' +
        '<div class="session-row-meta">' +
          '<span>' + subject.short + '</span><span class="dot"></span><span>' + session.stage + '</span><span class="dot"></span><span>' + session.duration + ' мин</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px">' +
        '<div class="session-row-time">' + session.start + '<br>' + session.end + '</div>' +
        '<div class="session-row-actions">' + primarySessionAction(session) + sessionCheckAction(session) + '</div>' +
      '</div>' +
    '</div>';
}

function renderCountdownCards() {
  return '<div class="countdown-grid">' + profileSubjects().map(id => {
    const subject = SUBJECTS[id];
    const date = examDateFor(id);
    const days = daysToExam(id);
    const progress = subjectProgress(id);
    const isEssay = Boolean(subject.isEssay);
    return '' +
      '<button class="countdown-card" style="' + sessionSubjectStyle(id) + '" data-action="open-subject" data-subject="' + id + '">' +
        '<div class="countdown-top">' +
          '<div class="countdown-subject"><span class="dot"></span><b>' + subject.short + '</b></div>' +
          '<small>' + (isEssay ? 'Допуск' : 'ЕГЭ') + ' · ' + formatDate(date, { year: 'numeric' }) + '</small>' +
        '</div>' +
        '<div class="countdown-days"><b>' + days + '</b><span>' + pluralize(days, ['день', 'дня', 'дней']) + ' до ' + (isEssay ? 'сочинения' : 'экзамена') + '</span></div>' +
        '<div class="countdown-date">' + formatDate(date) + ' · темы ' + progress + '%</div>' +
        '<div class="countdown-bar"><span style="width:' + progress + '%"></span></div>' +
      '</button>';
  }).join('') + '</div>';
}

function todayTimeline(sessions) {
  const profile = state.profile;
  const day = dayNumber(new Date());
  const items = [];
  if (day <= 5) {
    items.push({ time: '08:30', title: 'Школа', note: 'до ' + (profile.schoolEnd || '15:00'), dot: '#c6cada' });
  }
  if ((profile.tutorDays || []).map(Number).includes(day)) {
    const start = profile.tutorTime || '17:00';
    items.push({ time: start, title: 'Репетитор', note: '60 минут', dot: '#f79009' });
  }
  sessions.forEach(session => {
    const subject = SUBJECTS[session.subject];
    items.push({
      time: session.start,
      title: session.topicId ? subject.short + ': ' + (TOPIC_BY_ID[session.topicId]?.title || '') : session.title,
      note: session.stage + ' · ' + session.duration + ' мин',
      dot: subject.color,
      study: true
    });
  });
  if (!items.length) {
    items.push({ time: '—', title: Number(profile.bufferDay) === day ? 'Буферный день' : 'Свободный день', note: 'Отдых тоже часть плана', dot: '#12b76a' });
  }
  return items;
}

function renderTimerInline() {
  const remaining = timerState.remaining;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return '' +
    '<div class="timer-inline" title="Таймер фокуса">' + icon('clock') +
      '<b data-timer-display>' + pad(minutes) + ':' + pad(seconds) + '</b>' +
      '<button data-action="timer-toggle" aria-label="Запустить таймер">' + icon(timerState.running ? 'pause' : 'play') + '</button>' +
    '</div>';
}

function renderPaceBanner() {
  const rebalance = state.progress.rebalance;
  if (!rebalance?.reason || !rebalance.appliedAt) return '';
  const age = Math.max(0, daysBetween(new Date(), parseISO(String(rebalance.appliedAt).slice(0, 10))));
  if (age > 21) return '';
  if (rebalance.reason === 'time' || rebalance.reason === 'tired') {
    const text = rebalance.reason === 'time'
      ? 'После пропусков выбран более бережный темп: ' + formatMinutes(state.profile?.dailyMinutes || 90) + ' в день. Регулярность сейчас важнее объёма.'
      : 'После усталости темп снижен до ' + formatMinutes(state.profile?.dailyMinutes || 90) + ' в день, а повторение включено. Это забота, а не отставание.';
    return '<div class="pace-banner">' + icon('compass') + '<span>' + escapeHTML(text) + '</span><button class="btn btn-ghost btn-sm" data-action="reset-pace">Вернуть прежний темп</button></div>';
  }
  if (rebalance.reason === 'topic') {
    const topic = TOPIC_BY_ID[rebalance.focusTopicId];
    if (!topic) return '';
    const theoryFirst = !state.progress.topics[topic.id]?.theory;
    return '<div class="pace-banner">' + icon('bookOpen') + '<span>Фокус на теме «' + escapeHTML(topic.title) + '»: ' + (theoryFirst ? 'сначала короткая теория' : 'закрепим практикой') + ', без спешки.</span><button class="btn btn-soft btn-sm" data-action="' + (theoryFirst ? 'open-theory' : 'start-practice') + '" data-topic="' + topic.id + '">' + (theoryFirst ? 'Открыть теорию' : 'К практике') + '</button><button class="btn btn-ghost btn-sm" data-action="reset-pace">Снять фокус</button></div>';
  }
  return '';
}

function renderLastWeekBanner() {
  const info = lastWeekExamInfo();
  if (!info) return '';
  const subject = SUBJECTS[info.nearest];
  return '' +
    '<div class="lastweek-banner">' +
      '<div class="lw-ico">' + icon('alert') + '</div>' +
      '<div><b>Режим последней недели: ' + escapeHTML(subject.short) + ', ' + daysLabel(info.days) + '</b><small>Новые темы больше не добавляем. Только шпаргалки, повторение и сон. Это не отставание, а стратегия.</small></div>' +
      '<button class="btn btn-secondary btn-sm" data-action="nav" data-view="plan">' + icon('calendar') + 'Открыть повторение</button>' +
    '</div>';
}

function renderQuickActions() {
  return '' +
    '<section class="card pad strategy-card" style="margin-top:16px">' +
      '<div class="strategy-head" style="margin-bottom:10px"><div><h3>Быстрый шаг</h3><p>Когда нет сил на большое занятие, начните с малого.</p></div><span class="badge brand">без давления</span></div>' +
      '<div class="quick-actions">' +
        '<button class="quick-action" data-action="start-micro" data-minutes="3"><span class="qa-ico">' + icon('zap') + '</span>3 минуты · 3 задания</button>' +
        '<button class="quick-action" data-action="start-surprise"><span class="qa-ico">' + icon('shuffle') + '</span>Внезапный экзамен</button>' +
        '<button class="quick-action" data-action="open-reflection"><span class="qa-ico">' + icon('quote') + '</span>Записать мысль</button>' +
        '<button class="quick-action" data-action="open-anxiety" data-exercise="breath"><span class="qa-ico">' + icon('compass') + '</span>Подышать 2 минуты</button>' +
      '</div>' +
    '</section>';
}

function renderMicroCard() {
  const weak = topWeakTopics(3).filter(topic => !isTopicDone(topic.id)).slice(0, 3);
  return '' +
    '<section class="card pad strategy-card">' +
      '<div class="strategy-head"><div><h3>Микро-сессия</h3><p>3 задания за 3 минуты. Достаточно, чтобы не выпасть из ритма.</p></div><span class="badge mint">' + icon('zap') + 'быстро</span></div>' +
      (weak.length
        ? '<div class="micro-strip">' + weak.map(topic => '<span class="micro-chip"><b>' + escapeHTML(SUBJECTS[topic.subject].short) + '</b>' + escapeHTML(topic.title) + '</span>').join('') + '</div>'
        : '<div class="mood-today">Слабых тем не осталось — микро-сессия соберёт случайные задания для поддержания формы.</div>') +
      '<div class="micro-strip" style="margin-top:9px">' +
        [3, 10, 25].map(minutes => '<button class="micro-chip" data-action="start-micro" data-minutes="' + minutes + '"><b>' + minutes + ' мин</b> · ' + (minutes === 3 ? '3 задания' : minutes === 10 ? '5 заданий' : '8 заданий') + ' ' + icon('arrowRight') + '</button>').join('') +
      '</div>' +
    '</section>';
}

function renderTargetCard() {
  const subjects = profileSubjects();
  if (!subjects.length) return '';
  if (!strategySubject || !subjects.includes(strategySubject)) strategySubject = subjects.find(id => !SUBJECTS[id].isEssay) || subjects[0];
  const analysis = targetAnalysis(strategySubject);
  if (!analysis) return '';
  const overview = targetOverview();
  const tabs = subjects.map(id => {
    const target = Number(state.profile?.targets?.[id] || (SUBJECTS[id].isEssay ? 5 : 80));
    return '<button class="strategy-tab' + (id === strategySubject ? ' active' : '') + '" data-action="strategy-subject" data-subject="' + id + '"><span class="dot" style="background:' + SUBJECTS[id].color + '"></span>' + SUBJECTS[id].short + ' · ' + (SUBJECTS[id].isEssay ? 'допуск' : target) + '</button>';
  }).join('');
  const scoreLabel = analysis.isEssay ? (analysis.ready ? 'зачёт' : analysis.doneTopics + '/' + analysis.totalTopics) : analysis.score;
  const targetLabel = analysis.isEssay ? 'допуск' : analysis.target;
  const trackPercent = analysis.isEssay ? Math.round(analysis.doneTopics / Math.max(1, analysis.totalTopics) * 100) : analysis.score;
  const critical = analysis.criticalTasks.slice(0, 3).map(task => '<span class="critical-chip">' + icon('zap') + escapeHTML(task) + '</span>').join('');
  return '' +
    '<section class="card pad strategy-card">' +
      '<div class="strategy-head"><div><h3>Цель и обратный отсчёт</h3><p>Введите желаемый балл — покажем, какие темы закрыть и с каким темпом.</p></div><button class="btn btn-secondary btn-sm" data-action="open-target" data-subject="' + strategySubject + '">' + icon('target') + 'Изменить цель</button></div>' +
      '<div class="strategy-tabs">' + tabs + '</div>' +
      '<div class="target-main">' +
        '<div class="target-main-copy">' +
          '<small>Цель по ' + escapeHTML(subjectDative(strategySubject)) + '</small>' +
          '<div class="target-score-line"><b>' + targetLabel + '</b><span>' + (analysis.isEssay ? 'допуск' : 'баллов') + '</span><i class="target-arrow">→</i><b style="color:#9ef0c6">' + scoreLabel + '</b><span>прогноз</span></div>' +
          '<div style="font-size:9.5px;color:rgba(255,255,255,.55);margin-top:5px">' + (analysis.isEssay ? 'Осталось этапов: ' + analysis.remainingTopics.length : 'До экзамена: ' + daysLabel(analysis.daysLeft)) + (overview.gap ? ' · общий разрыв по целям: ' + overview.gap + ' б.' : '') + '</div>' +
        '</div>' +
        '<button class="btn btn-sm" data-action="open-target" data-subject="' + strategySubject + '">' + icon('settings') + 'Настроить</button>' +
      '</div>' +
      '<div class="target-sentence' + (analysis.ready ? ' calm' : '') + '"><b>' + (analysis.ready ? 'Цель в прогнозе.' : 'План под цель.') + '</b> ' + escapeHTML(analysis.sentence) + '</div>' +
      '<div class="target-stat-row">' +
        '<div class="target-stat"><small>Осталось тем</small><b>' + analysis.remainingTopics.length + '</b></div>' +
        '<div class="target-stat"><small>Критичных тем</small><b>' + (analysis.neededTopics.length || '—') + '</b></div>' +
        '<div class="target-stat"><small>Темп к цели</small><b>' + (analysis.ready ? 'в графике' : '+' + formatPace(analysis.deltaPerWeek) + '/нед') + '</b></div>' +
      '</div>' +
      '<div class="target-track"><span style="width:' + clamp(trackPercent, 0, 100) + '%"></span></div>' +
      '<div class="target-goal-mark"><span>сейчас ' + (analysis.isEssay ? analysis.doneTopics + ' этапов' : analysis.score + ' б.') + '</span><span>цель ' + targetLabel + (analysis.isEssay ? '' : ' б.') + '</span></div>' +
      (critical ? '<div class="target-critical"><div class="target-critical-label">Критичные задания</div><div class="critical-chips">' + critical + '</div></div>' : '') +
      '<div class="strategy-note">' + icon('info') + '<span>' + (analysis.isEssay ? 'Допуск важнее идеального текста. Сначала критерии 1–2 и аргумент.' : 'Дедлайн цели — ' + formatDateShort(analysis.deadline) + ', за 2 недели до экзамена. Это оставляет время на повторение.') + '</span></div>' +
    '</section>';
}

function renderStrategicMinimumCard(subjectId) {
  const minimum = strategicMinimum(subjectId);
  const subject = SUBJECTS[subjectId];
  if (!minimum || !subject) return '';
  const mandatory = minimum.mandatory.slice(0, 9).map(item => '<span class="root-node' + (isTopicDone(item.topic.id) ? ' done' : ' weak') + '">' + icon(isTopicDone(item.topic.id) ? 'check' : 'target') + escapeHTML(item.topic.title) + '</span>').join('');
  const bonus = minimum.bonus.slice(0, 6).map(item => '<span class="root-node">' + escapeHTML(item.topic.title) + '</span>').join('');
  const skipped = minimum.skipped.slice(0, 5).map(item => escapeHTML(item.topic.examTasks)).join(', ');
  return '' +
    '<section class="card pad strategy-card" style="margin-bottom:16px">' +
      '<div class="strategy-head"><div><h3>Стратегический минимум для ' + minimum.target + ' ' + (subject.isEssay ? 'этапов' : 'баллов') + '</h3><p>Эти темы дают около 80% цели. Их достаточно, чтобы не распыляться.</p></div><span class="badge ' + (minimum.completion >= 0.8 ? 'mint' : 'brand') + '">' + Math.round(minimum.completion * 100) + '% минимума</span></div>' +
      '<div class="target-track" style="margin-top:0;margin-bottom:12px"><span style="width:' + Math.round(minimum.completion * 100) + '%"></span></div>' +
      '<div class="target-critical-label">Обязательные темы · ~' + Math.round(minimum.mandatoryPoints) + ' из ' + minimum.target + (subject.isEssay ? ' этапов' : ' б.') + '</div>' +
      '<div class="critical-chips" style="gap:6px">' + mandatory + '</div>' +
      (bonus ? '<div class="target-critical"><div class="target-critical-label">Бонусные темы для запаса</div><div class="critical-chips">' + bonus + '</div></div>' : '') +
      '<div class="target-sentence calm" style="margin-top:12px"><b>Можно не брать всё.</b> ' + escapeHTML(minimum.skipNote) + (skipped ? ' Например: ' + skipped + '.' : '') + '</div>' +
      '<div class="strategy-note">' + icon('lightbulb') + '<span>Баллы по темам — ориентир по весам КИМ, а не официальная шкала. Стратегия снижает тревогу: у цели есть конечный список.</span></div>' +
    '</section>';
}

function renderBackwardCard(subjectId) {
  const targetId = subjectId || nearestExam()?.id || profileSubjects()[0];
  if (!targetId || !SUBJECTS[targetId]) return '';
  const milestones = backwardMilestones(targetId);
  if (!milestones.length) return '';
  const labels = { done: 'готово', overdue: 'просрочено', soon: 'скоро', review: 'режим недели', upcoming: 'впереди' };
  return '' +
    '<section class="card pad strategy-card">' +
      '<div class="strategy-head"><div><h3>Обратный план от экзамена</h3><p>Конкретные дедлайны для «' + escapeHTML(SUBJECTS[targetId].short) + '». Не «когда-нибудь», а к дате.</p></div><span class="badge brand">' + daysLabel(daysToExam(targetId)) + '</span></div>' +
      '<div class="milestone-list">' + milestones.map(milestone => {
        const date = parseISO(milestone.date);
        const topicChips = milestone.topics.slice(0, 6).map(topic => '<span class="' + (isTopicDone(topic.id) ? 'done' : '') + '">' + escapeHTML(topic.title) + '</span>').join('');
        return '' +
          '<div class="milestone ' + milestone.status + '">' +
            '<div class="milestone-date"><b>' + date.getDate() + '</b><small>' + formatDate(milestone.date, { month: 'short' }) + '</small></div>' +
            '<div class="milestone-body"><b>' + escapeHTML(milestone.title) + '</b><small>' + escapeHTML(milestone.note) + ' · ' + milestone.dateLabel + '</small>' +
              (milestone.progress < 100 ? '<div class="milestone-progress"><span style="width:' + milestone.progress + '%"></span></div>' : '') +
              (topicChips ? '<details class="milestone-details"><summary>Темы к этому сроку</summary><div class="milestone-topics">' + topicChips + '</div></details>' : '') +
            '</div>' +
            '<span class="milestone-status">' + labels[milestone.status] + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      '<div class="strategy-note">' + icon('compass') + '<span>Если дедлайн уже прошёл, план не рушится: он пересчитает оставшиеся шаги от сегодняшнего прогресса.</span></div>' +
    '</section>';
}

function renderDependencyCard(subjectId) {
  const targetTopic = weakestTopicForSubject(subjectId);
  if (!targetTopic) return '';
  const info = dependencyInfoForTopic(targetTopic.id);
  if (!info) return '';
  const root = info.root;
  const chain = info.chain.map((topic, index) => {
    const className = isTopicDone(topic.id) ? 'done' : root?.id === topic.id ? 'root' : 'weak';
    return (index ? '<span class="root-arrow">→</span>' : '') + '<span class="root-node ' + className + '">' + escapeHTML(topic.title) + '</span>';
  }).join('');
  const map = dependencyMapForSubject(subjectId).map(item => {
    const master = Math.round(topicMasteryValue(item.topic) * 100);
    const weak = !isTopicDone(item.topic.id) && master < 50;
    return '<div class="dep-node' + (isTopicDone(item.topic.id) ? ' done' : weak ? ' weak' : '') + '">' +
      '<span class="dep-indent">' + (item.depth ? '↳' : '•') + '</span><span class="dep-dot"></span><span class="dep-title">' + escapeHTML(item.topic.title) + '</span><span class="dep-meta">' + master + '% · вес ' + item.topic.weight + '</span>' +
    '</div>';
  }).join('');
  const rootText = root
    ? root.id === targetTopic.id
      ? 'Корень пробела — сама тема «' + root.title + '». Начните с теории и 2–3 простых заданий, не с пробника.'
      : 'Корень пробела — «' + root.title + '». Без неё тема «' + targetTopic.title + '» будет даваться тяжелее: сначала закройте базу.'
    : 'Все ключевые темы цепочки закрыты. Можно переходить к точности и скорости.';
  return '' +
    '<section class="card pad strategy-card" style="margin-bottom:16px">' +
      '<div class="strategy-head"><div><h3>Диагностика корневой причины</h3><p>Почему слабая тема проседает — с учётом зависимостей.</p></div><span class="badge ' + (root ? 'brand' : 'mint') + '">' + (root ? 'есть пробел' : 'база закрыта') + '</span></div>' +
      '<div class="root-cause' + (root ? '' : ' ok') + '">' +
        '<div class="root-cause-head">' + icon(root ? 'alert' : 'checkCircle') + (root ? 'Слабое звено: ' + escapeHTML(targetTopic.title) : 'Корневых пробелов нет') + '</div>' +
        '<p>' + escapeHTML(rootText) + '</p>' +
        '<div class="root-chain">' + chain + '</div>' +
      '</div>' +
      '<div class="dependency-map">' + map + '</div>' +
      '<div class="strategy-note">' + icon('layers') + '<span>Карта показывает порядок зависимостей: темы с отступом опираются на темы выше. Это не жёсткий запрет, а подсказка, где искать причину.</span></div>' +
    '</section>';
}

function renderTopicMistakes(topicId) {
  const mistakes = TOPIC_MISTAKES[topicId] || [];
  if (!mistakes.length) return '';
  return '<details class="topic-mistakes"><summary>5 типичных ошибок ЕГЭ</summary><ol>' + mistakes.slice(0, 5).map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ol></details>';
}

function renderPseCard(subjectId) {
  const available = profileSubjects();
  if (!available.length) return '';
  if (subjectId && SUBJECTS[subjectId]) pseSubject = subjectId;
  if (!pseSubject || !available.includes(pseSubject)) pseSubject = available.find(id => !SUBJECTS[id].isEssay) || available[0];
  const summary = pseForSubject(pseSubject);
  const subject = SUBJECTS[pseSubject];
  const tabs = !subjectId ? '<div class="strategy-tabs">' + available.map(id => '<button class="strategy-tab' + (id === pseSubject ? ' active' : '') + '" data-action="pse-subject" data-subject="' + id + '"><span class="dot" style="background:' + SUBJECTS[id].color + '"></span>' + SUBJECTS[id].short + '</button>').join('') + '</div>' : '';
  const weakest = summary.tasks.slice().filter(task => task.tone === 'red').concat(summary.tasks.filter(task => task.tone === 'yellow'))[0] || summary.tasks[0];
  const currentNumber = weakest?.number;
  const strip = summary.tasks.map(task => '<button class="pse-task ' + task.tone + (task.number === currentNumber ? ' current' : '') + '" data-action="open-pse-task" data-subject="' + pseSubject + '" data-task="' + task.number + '" title="' + escapeHTML('№ ' + task.number + ' · ' + task.title + ' · ~' + task.points + ' б.') + '"><b>' + task.number + '</b><small>' + task.probability + '%</small></button>').join('');
  return '' +
    '<section class="card pad strategy-card pse-card" style="margin-bottom:16px">' +
      '<div class="pse-top"><div><h3>Прогноз по каждому заданию КИМ</h3><p>Цвет — вероятность справиться. Нажмите на задание, чтобы увидеть темы, ошибки и шпаргалку.</p></div><span class="badge brand">' + icon('chart') + 'PSE · ' + escapeHTML(subject.short) + '</span></div>' +
      tabs +
      '<div class="pse-summary"><span class="g">' + summary.green + ' уверенно</span><span class="y">' + summary.yellow + ' закрепить</span><span class="r">' + summary.red + ' слабо</span><span>~' + summary.expected + ' из ' + summary.points + ' первичных б.</span></div>' +
      '<div class="pse-strip">' + strip + '</div>' +
      '<div class="pse-legend"><span><i class="g"></i>68–100%</span><span><i class="y"></i>42–67%</span><span><i class="r"></i>0–41%</span><span>цвет обновляется после практики</span></div>' +
      '<div class="pse-foot"><small>Баллы заданий и вероятность — ориентир по весам тем и вашей практике, не официальный прогноз. Для предмета «' + escapeHTML(subject.short) + '» в КИМ ' + summary.tasks.length + ' ' + pluralize(summary.tasks.length, ['задание', 'задания', 'заданий']) + '.</small>' +
        (weakest ? '<button class="btn btn-soft btn-sm" data-action="open-pse-task" data-subject="' + pseSubject + '" data-task="' + weakest.number + '">' + icon('target') + 'Разобрать № ' + weakest.number + '</button>' : '') + '</div>' +
    '</section>';
}

function renderPseTaskModal() {
  const detail = pseTaskDetail(modal?.subject, Number(modal?.task));
  if (!detail) return '';
  const subject = SUBJECTS[detail.subjectId];
  return '' +
    '<div class="modal" role="dialog" aria-modal="true" aria-label="Задание ' + detail.number + '">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('chart') + '</div><div><h2>Задание № ' + detail.number + ' · ' + escapeHTML(subject.short) + '</h2><p>Прогноз и темы, которые влияют на результат.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="pse-task-hero ' + detail.tone + '">' +
          '<div class="pse-big-num">' + detail.number + '</div>' +
          '<div style="flex:1;min-width:0"><b>' + escapeHTML(detail.title) + '</b><small>' + escapeHTML(detail.status) + ' · ~' + detail.points + ' ' + pluralize(detail.points, ['балл', 'балла', 'баллов']) + ' · вероятность ' + detail.probability + '%</small><div class="target-track" style="margin-top:8px;max-width:240px"><span style="width:' + detail.probability + '%"></span></div></div>' +
        '</div>' +
        '<div class="notice" style="margin-top:14px">' + icon('lightbulb') + '<div><b>Что улучшить.</b> ' + escapeHTML(detail.advice) + '</div></div>' +
        '<div class="pse-detail-grid">' +
          '<div class="pse-detail-box"><h4>Связанные темы</h4>' + (detail.related.length ? detail.related.map(item => '<div class="pse-topic-row"><span class="pse-topic-name"><b>' + escapeHTML(item.topic.title) + '</b><small>' + (item.done ? 'закрыта' : item.attempts ? 'лучший результат ' + item.best + '%' : 'ещё не начата') + ' · вес ' + item.topic.weight + '</small></span><span class="pse-mini-track"><span style="width:' + item.mastery + '%"></span></span><b style="font-size:10px;min-width:32px;text-align:right">' + item.mastery + '%</b></div>').join('') : '<div class="schedule-empty">Нет привязанных тем.</div>') + '</div>' +
          '<div class="pse-detail-box"><h4>Типичные ошибки</h4>' + (detail.mistakes.length ? '<ol class="mistake-five" style="counter-reset:mistake">' + detail.mistakes.slice(0, 5).map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ol>' : '<div class="schedule-empty">Нет данных.</div>') + '</div>' +
        '</div>' +
        (detail.dependency?.root ? '<div class="root-cause" style="margin-top:14px"><div class="root-cause-head">' + icon('alert') + 'Корень: ' + escapeHTML(detail.dependency.root.title) + '</div><p>Сначала закройте «' + escapeHTML(detail.dependency.root.title) + '», затем вернитесь к этому заданию. Так прогресс будет устойчивее.</p></div>' : '') +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Шпаргалка и разбор — в приложении. Официальные задания: ' + fipiSubjectLink(detail.subjectId, 'банк ФИПИ') + '</span><div class="modal-foot-actions">' +
        (detail.weakTopic ? '<button class="btn btn-secondary btn-sm" data-action="open-cheatsheet" data-topic="' + detail.weakTopic.id + '">' + icon('bookOpen') + 'Шпаргалка</button><button class="btn btn-primary btn-sm" data-action="start-practice" data-topic="' + detail.weakTopic.id + '">' + icon('target') + 'К практике</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-action="close-modal">Закрыть</button>' +
      '</div></div>' +
    '</div>';
}

function renderCheatsheetModal(topicId) {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return '';
  const subject = SUBJECTS[topic.subject];
  const mistakes = TOPIC_MISTAKES[topic.id] || [];
  return '' +
    '<div class="modal" role="dialog" aria-modal="true" aria-label="Шпаргалка: ' + escapeHTML(topic.title) + '">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('bookOpen') + '</div><div><h2>Шпаргалка · ' + escapeHTML(topic.title) + '</h2><p>' + escapeHTML(subject.short) + ' · ' + escapeHTML(topic.examTasks) + ' · вес ' + topic.weight + '/5</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body theory-content">' +
        '<p class="theory-text" style="font-size:12.5px;color:var(--ink)">' + escapeHTML(topic.theory.lead) + '</p>' +
        '<div style="height:14px"></div>' +
        (topic.theory.blocks || []).map(renderTheoryBlock).join('') +
        (mistakes.length ? '<div class="theory-block warn"><h3><span class="block-ico">' + icon('alert') + '</span>5 типичных ошибок</h3><ol class="mistake-five" style="counter-reset:mistake">' + mistakes.map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ol></div>' : '') +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Короткая выжимка для повторения. ' + fipiSubjectLink(topic.subject, 'Сверить с ФИПИ', 'theory-source-link') + '</span><div class="modal-foot-actions"><button class="btn btn-secondary btn-sm" data-action="open-theory" data-topic="' + topic.id + '">' + icon('bookOpen') + 'Полная теория</button><button class="btn btn-primary btn-sm" data-action="theory-start-practice" data-topic="' + topic.id + '">' + icon('target') + 'Проверить себя</button></div></div>' +
    '</div>';
}

function renderReflectionCard() {
  const today = toISO(new Date());
  const saved = todayReflection();
  if (reflectionDraft.date !== today) {
    reflectionDraft = { date: today, text: saved?.text || '', topicId: saved?.topicId || '' };
  }
  const weak = topWeakTopics(6);
  const options = weak.map(topic => '<option value="' + topic.id + '"' + (reflectionDraft.topicId === topic.id ? ' selected' : '') + '>' + escapeHTML(SUBJECTS[topic.subject].short + ' · ' + topic.title) + '</option>').join('');
  const latest = latestReflection();
  const past = pastSelfCallback();
  return '' +
    '<section class="card pad mind-card" data-reflection-card>' +
      '<div class="strategy-head"><div><h3>Что я понял сегодня</h3><p>Одна фраза своими словами закрепляет материал лучше перечитывания.</p></div><span class="badge ' + (saved ? 'mint' : 'brand') + '">' + (saved ? 'записано' : '1 минута') + '</span></div>' +
      '<textarea class="reflection-input" data-reflection-text placeholder="Например: «Понял, что в параметре нельзя делить на выражение с x, не проверив ноль».">' + escapeHTML(reflectionDraft.text || '') + '</textarea>' +
      '<div class="reflection-row"><select class="select-input" data-reflection-topic><option value="">Без темы</option>' + options + '</select><div class="reflection-actions"><button class="btn btn-primary btn-sm" data-action="save-reflection">' + icon('check') + 'Сохранить</button></div></div>' +
      (latest && latest.date !== today ? '<div class="reflection-quote"><b>' + formatDateShort(latest.date) + '</b>' + escapeHTML(latest.text) + '</div>' : '') +
      (past ? '<div class="past-self"><small>Месяц назад вы этого не знали</small><b>«' + escapeHTML(past.text) + '»</b><p>' + escapeHTML(past.now) + '</p></div>' : '<div class="mood-today">Через месяц здесь появится напоминание: «Месяц назад ты этого не знал». Это работает, если писать хотя бы по одной фразе в день.</div>') +
    '</section>';
}

function renderMoodCard() {
  const today = toISO(new Date());
  const entry = moodEntryForDate(today);
  const draftActive = moodDraft.date === today;
  const currentLevel = (draftActive && moodDraft.level) ? moodDraft.level : entry?.level || 0;
  const noteValue = draftActive ? moodDraft.note : entry?.note || '';
  const options = MOOD_LEVELS.map(level => '<button class="mood-option' + (currentLevel === level.value ? ' active' : '') + '" data-action="mood-select" data-level="' + level.value + '" title="' + level.label + '"><span>' + level.emoji + '</span><small>' + level.label + '</small></button>').join('');
  const stats = moodStats();
  const heat = [];
  for (let day = 1; day <= 7; day += 1) {
    heat.push('<div class="mh-day">' + WEEKDAYS_SHORT[day % 7] + '</div>');
    MOOD_PERIODS.forEach(period => {
      const value = moodHeatmapValue(day, period.id);
      const level = value === null ? 0 : Math.round(value);
      heat.push('<div class="mood-heat-cell' + (value === null ? ' empty' : '') + '" data-level="' + level + '" title="' + escapeHTML(WEEKDAYS_FULL[day % 7] + ' · ' + period.label + (value === null ? ' · нет данных' : ' · ' + value.toFixed(1) + '/5')) + '">' + (value === null ? '' : value.toFixed(1)) + '</div>');
    });
  }
  return '' +
    '<section class="card pad mind-card">' +
      '<div class="strategy-head"><div><h3>Дневник настроения</h3><p>Как самочувствие связано с днями и временем занятий.</p></div><span class="badge brand">' + stats.count + ' ' + pluralize(stats.count, ['запись', 'записи', 'записей']) + '</span></div>' +
      '<div class="mood-options">' + options + '</div>' +
      '<div class="mood-today" style="display:flex;gap:8px;align-items:center"><input class="text-input" data-mood-note placeholder="Коротко: что повлияло на настроение?" value="' + escapeHTML(noteValue) + '" maxlength="160" style="height:34px;font-size:10px"><button class="btn btn-secondary btn-sm" data-action="save-mood">' + icon('check') + 'Сохранить</button></div>' +
      '<div class="mood-heatmap"><div></div><div class="mh-head">Утро</div><div class="mh-head">День</div><div class="mh-head">Вечер</div>' + heat.join('') + '</div>' +
      '<div class="mood-insight"><b>Что делать дальше.</b> ' + escapeHTML(moodInsight()) + '</div>' +
    '</section>';
}

function renderAnxietyCard() {
  const completed = state.progress.anxiety?.completed || {};
  const doneCount = Object.keys(completed).length;
  return '' +
    '<section class="card pad mind-card">' +
      '<div class="strategy-head"><div><h3>Тревога и экзамен</h3><p>Короткие техники, которые работают до и во время экзамена.</p></div><span class="badge ' + (doneCount ? 'mint' : 'brand') + '">' + doneCount + ' / ' + ANXIETY_EXERCISES.length + '</span></div>' +
      '<div class="psych-grid">' + ANXIETY_EXERCISES.map(exercise => '<button class="anxiety-card" data-action="open-anxiety" data-exercise="' + exercise.id + '"><span class="anxiety-ico">' + icon(exercise.icon) + '</span><b>' + escapeHTML(exercise.title) + '</b><small>' + escapeHTML(exercise.subtitle) + '</small>' + (completed[exercise.id] ? '<span class="anxiety-done">' + icon('check') + 'выполнено</span>' : '') + '</button>').join('') + '</div>' +
      '<div class="strategy-note">' + icon('info') + '<span>Это не терапия и не замена помощи специалиста. Если тревога мешает жить, поговорите со взрослым или психологом.</span></div>' +
    '</section>';
}

function renderAnxietyModal() {
  const exercise = ANXIETY_EXERCISE_BY_ID[modal?.exercise] || ANXIETY_EXERCISES[0];
  const completed = Boolean(state.progress.anxiety?.completed?.[exercise.id]);
  const breathing = exercise.kind === 'breath';
  return '' +
    '<div class="modal' + (breathing ? '' : ' small') + '" role="dialog" aria-modal="true" aria-label="' + escapeHTML(exercise.title) + '">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon(exercise.icon) + '</div><div><h2>' + escapeHTML(exercise.title) + '</h2><p>' + escapeHTML(exercise.subtitle) + '</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        (breathing
          ? '<div class="breath-stage"><div class="breath-orb" data-breath-orb data-phase="rest"><b data-breath-phase>Готовы?</b><small data-breath-seconds>нажмите «Начать»</small></div><div class="breath-caption" data-breath-caption>' + escapeHTML(exercise.description) + '</div><div class="breath-meta"><span>цикл <b>4–7–8</b></span><span>кругов <b data-breath-rounds>0</b> / 4</span></div></div><div style="height:12px"></div>'
          : '<div class="notice">' + icon('compass') + '<div>' + escapeHTML(exercise.description) + '</div></div>') +
        '<div class="anxiety-steps">' + exercise.steps.map((step, index) => '<div class="anxiety-step"><span class="step-num">' + (index + 1) + '</span><span>' + escapeHTML(step) + '</span></div>').join('') + '</div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">' + (completed ? 'Вы уже выполняли это упражнение. Повторение помогает.' : 'Достаточно одного честного цикла.') + '</span><div class="modal-foot-actions">' +
        (breathing ? '<button class="btn btn-secondary btn-sm" data-action="breathing-toggle">' + icon('play') + 'Начать дыхание</button>' : '') +
        '<button class="btn btn-primary btn-sm" data-action="anxiety-complete" data-exercise="' + exercise.id + '">' + icon('check') + 'Я выполнил</button>' +
      '</div></div>' +
    '</div>';
}

function renderTargetModal() {
  const subjectId = targetDraftSubject && SUBJECTS[targetDraftSubject] ? targetDraftSubject : strategySubject;
  const subject = SUBJECTS[subjectId];
  if (!subject) return '';
  const analysis = targetAnalysis(subjectId, targetDraftValue);
  const minimum = strategicMinimum(subjectId, targetDraftValue);
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Цель по предмету">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('target') + '</div><div><h2>Цель по ' + escapeHTML(subjectDative(subjectId)) + '</h2><p>Выберите балл. План и стратегический минимум пересчитаются.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="target-modal-hero"><small>Желаемый результат</small><b data-target-bubble>' + targetDraftValue + '</b><p>' + escapeHTML(subject.isEssay ? 'Для допуска достаточно зачёта. Цель ниже — просто ориентир.' : 'Ориентир по 100-балльной шкале. Не официальный балл.') + '</p></div>' +
        (subject.isEssay
          ? '<div class="notice">' + icon('info') + '<div>Итоговое сочинение оценивается как зачёт/незачёт. Здесь важнее закрыть критерии 1–2 и аргументацию.</div></div>'
          : '<div class="target-range-wrap"><input type="range" min="40" max="100" step="1" value="' + targetDraftValue + '" data-target-range><span class="target-range-bubble" data-target-bubble>' + targetDraftValue + '</span></div>') +
        '<div class="target-modal-grid">' +
          '<div class="target-modal-cell"><small>Сейчас прогноз</small><b data-target-cell="now">' + (analysis.isEssay ? analysis.doneTopics + ' / ' + analysis.totalTopics + ' этапов' : analysis.score + ' б.') + '</b></div>' +
          '<div class="target-modal-cell"><small>Разрыв до цели</small><b data-target-cell="gap">' + (analysis.isEssay ? (analysis.ready ? 'зачёт' : 'нужно ' + analysis.remainingTopics.length) : Math.max(0, analysis.gap) + ' б.') + '</b></div>' +
          '<div class="target-modal-cell"><small>Обязательных тем</small><b data-target-cell="mandatory">' + minimum.mandatory.length + '</b></div>' +
          '<div class="target-modal-cell"><small>Темп к дедлайну</small><b data-target-cell="pace">' + (analysis.isEssay ? 'этапами' : '+' + formatPace(analysis.deltaPerWeek) + ' / нед') + '</b></div>' +
        '</div>' +
        '<div class="target-sentence' + (analysis.ready ? ' calm' : '') + '" data-target-preview>' + escapeHTML(analysis.sentence) + '</div>' +
        '<div class="strategy-note">' + icon('lightbulb') + '<span data-target-note>' + escapeHTML(minimum.skipNote) + '</span></div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Цель можно менять в любой момент.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" data-action="save-target" data-subject="' + subjectId + '">' + icon('check') + 'Сохранить цель</button></div></div>' +
    '</div>';
}

function renderScheduleSettingsCard() {
  const schedule = state.progress.schedule || { lessons: [], source: '', importedAt: '' };
  const sourceLabels = { manual: 'Вручную', mesh: 'МЭШ', diary: 'Дневник.ру' };
  const preview = (schedule.lessons || []).slice().sort((a, b) => (a.weekday || 0) - (b.weekday || 0) || a.start.localeCompare(b.start)).slice(0, 8);
  return '' +
    '<section class="card settings-section" style="margin-top:16px">' +
      '<h2>Расписание из МЭШ или Дневника.ру</h2><p>Публичного API для прямого подключения нет, поэтому импорт работает через вставку текста или файла. Честный офлайн-сценарий без обещаний лишнего.</p>' +
      (schedule.lessons?.length
        ? '<div class="schedule-status">' + icon('checkCircle') + 'Импортировано ' + schedule.lessons.length + ' ' + pluralize(schedule.lessons.length, ['урок', 'урока', 'уроков']) + (schedule.importedAt ? ' · ' + formatDateShort(schedule.importedAt.slice(0, 10)).replace(/\.$/, '') : '') + '. План занятий обходит эти пересечения.</div>'
        : '<div class="schedule-status warn">' + icon('info') + 'API не подключён. Вставьте расписание текстом — уроки будут учитываться при сборке плана.</div>') +
      '<div class="schedule-form">' +
        '<select class="select-input" data-schedule-source>' + Object.entries(sourceLabels).map(([id, label]) => '<option value="' + id + '"' + (scheduleSource === id ? ' selected' : '') + '>' + label + '</option>').join('') + '</select>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-action="schedule-file">' + icon('upload') + 'Загрузить .txt</button><button class="btn btn-primary btn-sm" data-action="schedule-import">' + icon('refresh') + 'Разобрать и сохранить</button></div>' +
        '<div class="full"><textarea class="schedule-textarea" data-schedule-text placeholder="Пример:\nПн 14:30-16:00 Алгебра\nСр 15:00–16:30 Физика\n2026-11-05 10:00-11:30 Пробный экзамен">' + escapeHTML(scheduleText) + '</textarea></div>' +
      '</div>' +
      '<div class="schedule-preview">' + (preview.length
        ? preview.map(lesson => '<div class="schedule-row"><b>' + (lesson.date ? formatDateShort(lesson.date) : WEEKDAYS_SHORT[Number(lesson.weekday) % 7]) + '</b><span>' + lesson.start + '–' + lesson.end + '</span><span>' + escapeHTML(lesson.title) + '</span><small>' + (sourceLabels[lesson.source] || lesson.source) + '</small></div>').join('')
        : '<div class="schedule-empty">Пока нет импортированных уроков.</div>') + '</div>' +
      '<div class="settings-actions">' + (schedule.lessons?.length ? '<button class="btn btn-ghost btn-sm" data-action="schedule-clear">Очистить расписание</button>' : '') + '</div>' +
      '<div class="mvp-note">Поддерживаются строки вида «Пн 14:30–16:00 Алгебра» и даты «2026-11-05 10:00–11:30». Для МЭШ и Дневника.ру это ручной экспорт: скопируйте расписание из дневника и вставьте сюда.</div>' +
      '<input type="file" accept=".txt,.csv,text/plain" data-schedule-file style="display:none">' +
    '</section>';
}

function renderCelebrationRoot() {
  if (!celebrationCurrent || modal) return '';
  const item = celebrationCurrent;
  const confetti = Array.from({ length: 54 }, (_, index) => {
    const left = (index * 37 + 13) % 100;
    const duration = 2.4 + (index % 7) * 0.22;
    const delay = (index % 9) * 0.08;
    const drift = ((index % 11) - 5) * 18;
    const colors = ['#ffd38a', '#9ef0c6', '#b8b1ff', '#ff9db5', '#8fd4ff', '#ffffff'];
    const size = 6 + (index % 4) * 2;
    return '<span class="celebration-confetti" style="left:' + left + '%;width:' + size + 'px;height:' + (size + 5) + 'px;background:' + colors[index % colors.length] + ';animation-duration:' + duration.toFixed(2) + 's;animation-delay:' + delay.toFixed(2) + 's;--drift:' + drift + 'px"></span>';
  }).join('');
  return '' +
    '<div class="celebration-root" data-celebration-root>' + confetti +
      '<div class="celebration-card" role="dialog" aria-modal="true" aria-label="Новое достижение">' +
        '<div class="celebration-badge">' + icon(item.icon || 'trophy') + '</div>' +
        '<div class="cel-eyebrow">Новое достижение</div>' +
        '<h2>' + escapeHTML(item.title) + '</h2>' +
        '<p>' + escapeHTML(item.desc) + '</p>' +
        '<button class="btn btn-sm" data-action="celebration-close">' + icon('spark') + 'Забрать</button>' +
      '</div>' +
    '</div>';
}

const BREATH_PHASES = [
  { id: 'inhale', label: 'Вдох', seconds: 4, caption: 'Вдох через нос на 4 счёта. Плечи свободны.' },
  { id: 'hold', label: 'Задержка', seconds: 7, caption: 'Задержите дыхание на 7 счетов. Без напряжения.' },
  { id: 'exhale', label: 'Выдох', seconds: 8, caption: 'Медленный выдох через рот на 8 счетов.' }
];

function openTargetModal(subjectId) {
  const id = SUBJECTS[subjectId] ? subjectId : strategySubject;
  if (!SUBJECTS[id]) return;
  strategySubject = id;
  targetDraftSubject = id;
  targetDraftValue = Number(state.profile?.targets?.[id] || (SUBJECTS[id].isEssay ? 5 : 80));
  openModal('target');
}

function updateTargetPreview(subjectId, value) {
  const subject = SUBJECTS[subjectId];
  if (!subject || subject.isEssay) return;
  const analysis = targetAnalysis(subjectId, value);
  const minimum = strategicMinimum(subjectId, value);
  if (!analysis || !minimum) return;
  document.querySelectorAll('[data-target-bubble]').forEach(node => { node.textContent = String(value); });
  const preview = document.querySelector('[data-target-preview]');
  if (preview) {
    preview.textContent = analysis.sentence;
    preview.classList.toggle('calm', analysis.ready);
  }
  const cells = {
    now: analysis.score + ' б.',
    gap: Math.max(0, analysis.gap) + ' б.',
    mandatory: String(minimum.mandatory.length),
    pace: '+' + formatPace(analysis.deltaPerWeek) + ' / нед'
  };
  Object.entries(cells).forEach(([key, text]) => {
    const node = document.querySelector('[data-target-cell="' + key + '"]');
    if (node) node.textContent = text;
  });
  const note = document.querySelector('[data-target-note]');
  if (note) note.textContent = minimum.skipNote;
}

function saveTarget(subjectId) {
  const subject = SUBJECTS[subjectId];
  if (!subject || !state.profile) return;
  const value = subject.isEssay
    ? 5
    : clamp(Math.round(Number(targetDraftValue) || 80), 40, 100);
  state.profile.targets = state.profile.targets || {};
  state.profile.targets[subjectId] = value;
  strategySubject = subjectId;
  state.plan = generatePlan(state.profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  targetDraftSubject = null;
  targetDraftValue = 80;
  modal = null;
  saveState();
  render();
  const analysis = targetAnalysis(subjectId);
  showToast(
    'Цель сохранена',
    subject.isEssay
      ? 'Допуск остаётся главным ориентиром. План пересобран.'
      : analysis?.sentence || 'План пересобран под новую цель.'
    ,
    'success'
  );
}

function startMicroSession(minutes) {
  const limit = Number(minutes) || 3;
  const size = limit <= 3 ? 3 : limit <= 10 ? 5 : 8;
  const weak = topWeakTopics(10).filter(topic => !isTopicDone(topic.id)).map(topic => topic.id);
  const pool = weak.length
    ? weak.flatMap(topicId => trainerQueueForTopic(topicId))
    : profileSubjects().flatMap(subjectId => allQuestionsForSubject(subjectId).map(question => question.id));
  const ids = shuffle([...new Set(pool)]).slice(0, size);
  if (!ids.length) {
    showToast('Нет заданий', 'Добавьте предметы в профиль, чтобы собрать микро-сессию.', 'warn');
    return;
  }
  startTrainer({ mode: 'micro', questionIds: ids });
  showToast('Микро-сессия', size + ' ' + pluralize(size, ['задание', 'задания', 'заданий']) + ' · примерно ' + limit + ' мин. Начните, даже если нет сил на большее.', 'info');
}

function startSurpriseExam() {
  const pool = profileSubjects().flatMap(subjectId => allQuestionsForSubject(subjectId).map(question => question.id));
  const ids = shuffle([...new Set(pool)]).slice(0, 5);
  if (!ids.length) {
    showToast('Нет заданий', 'Выберите предметы с карточками, чтобы провести внезапный экзамен.', 'warn');
    return;
  }
  startTrainer({ mode: 'surprise', questionIds: ids });
  showToast('Внезапный экзамен', '5 заданий · 30 секунд на каждое. Это тренировка устойчивости, а не оценка.', 'info');
}

function clearTrainerTimer() {
  if (trainerInterval) {
    clearInterval(trainerInterval);
    trainerInterval = null;
  }
}

function updateSurpriseTimerDOM() {
  document.querySelectorAll('[data-surprise-timer] b').forEach(node => { node.textContent = String(surpriseTimeLeft); });
  const bar = document.querySelector('[data-surprise-bar]');
  if (bar) bar.style.width = clamp(surpriseTimeLeft / 30 * 100, 0, 100) + '%';
}

function beginSurpriseTimer() {
  clearTrainerTimer();
  if (!trainer || trainer.mode !== 'surprise' || trainer.finished) return;
  surpriseTimeLeft = 30;
  updateSurpriseTimerDOM();
  trainerInterval = setInterval(() => {
    if (!trainer || trainer.finished || trainer.checked) return;
    surpriseTimeLeft = Math.max(0, surpriseTimeLeft - 1);
    updateSurpriseTimerDOM();
    if (surpriseTimeLeft <= 0) autoCheckSurprise();
  }, 1000);
}

function autoCheckSurprise() {
  if (!trainer || trainer.checked || trainer.finished) return;
  const question = QUESTION_BY_ID[trainer.queue[trainer.index]];
  if (!question) return;
  clearTrainerTimer();
  surpriseTimeLeft = 0;
  trainer.answers[trainer.index] = { qid: question.id, selected: -1, correct: false };
  trainer.selected = -1;
  trainer.checked = true;
  sm2Review(question.topicId, 2);
  addMistake(question.id, -1);
  saveState();
  render();
  showToast('Время вышло', 'Задание ушло в журнал ошибок. Это просто материал для разбора, без штрафа.', 'info');
}

function openAnxietyExercise(exerciseId) {
  const exercise = ANXIETY_EXERCISE_BY_ID[exerciseId] ? exerciseId : 'breath';
  stopBreathing(false);
  breathState = { exercise, phase: '', phaseIndex: 0, remaining: 0, rounds: 0, timer: null, running: false };
  openModal('anxiety', { exercise });
}

function updateBreathingDOM() {
  const exercise = ANXIETY_EXERCISE_BY_ID[breathState.exercise] || ANXIETY_EXERCISE_BY_ID.breath;
  const phase = BREATH_PHASES[breathState.phaseIndex] || BREATH_PHASES[0];
  const orb = document.querySelector('[data-breath-orb]');
  const phaseNode = document.querySelector('[data-breath-phase]');
  const secondsNode = document.querySelector('[data-breath-seconds]');
  const roundsNode = document.querySelector('[data-breath-rounds]');
  const caption = document.querySelector('[data-breath-caption]');
  const button = document.querySelector('[data-action="breathing-toggle"]');
  if (orb) orb.dataset.phase = breathState.running ? phase.id : 'rest';
  if (phaseNode) {
    phaseNode.textContent = breathState.running ? phase.label : breathState.rounds >= 4 ? 'Готово' : 'Готовы?';
  }
  if (secondsNode) {
    secondsNode.textContent = breathState.running ? String(breathState.remaining) : breathState.rounds >= 4 ? '4 круга' : 'нажмите «Начать»';
  }
  if (roundsNode) roundsNode.textContent = String(breathState.rounds);
  if (caption) {
    caption.textContent = breathState.running
      ? phase.caption
      : breathState.rounds >= 4
        ? 'Четыре круга сделаны. Дыхание должно стать ровнее. Можно завершить упражнение.'
        : exercise.description;
  }
  if (button) {
    button.innerHTML = icon(breathState.running ? 'pause' : 'play') + (breathState.running ? 'Пауза' : breathState.rounds >= 4 ? 'Начать снова' : 'Начать дыхание');
  }
}

function beginBreathing() {
  if (breathState.timer) clearInterval(breathState.timer);
  breathState.running = true;
  breathState.phaseIndex = 0;
  breathState.remaining = BREATH_PHASES[0].seconds;
  breathState.rounds = 0;
  breatheTick();
  breathState.timer = setInterval(breatheTick, 1000);
  updateBreathingDOM();
}

function breatheTick() {
  if (!breathState.running) return;
  breathState.remaining -= 1;
  if (breathState.remaining > 0) {
    updateBreathingDOM();
    return;
  }
  if (breathState.phaseIndex < BREATH_PHASES.length - 1) {
    breathState.phaseIndex += 1;
    breathState.remaining = BREATH_PHASES[breathState.phaseIndex].seconds;
    updateBreathingDOM();
    return;
  }
  breathState.rounds += 1;
  if (breathState.rounds >= 4) {
    stopBreathing(false);
    updateBreathingDOM();
    return;
  }
  breathState.phaseIndex = 0;
  breathState.remaining = BREATH_PHASES[0].seconds;
  updateBreathingDOM();
}

function stopBreathing(renderAfter) {
  if (breathState.timer) clearInterval(breathState.timer);
  breathState.timer = null;
  breathState.running = false;
  if (renderAfter) updateBreathingDOM();
}

function toggleBreathing() {
  if (breathState.running) {
    stopBreathing(true);
    return;
  }
  beginBreathing();
}

function completeAnxiety(exerciseId) {
  const exercise = ANXIETY_EXERCISE_BY_ID[exerciseId];
  if (!exercise) return;
  stopBreathing(false);
  const anxiety = state.progress.anxiety;
  anxiety.completed[exercise.id] = toISO(new Date());
  anxiety.sessions = Number(anxiety.sessions || 0) + 1;
  anxiety.lastAt = new Date().toISOString();
  modal = null;
  saveState();
  render();
  showToast('Техника выполнена', exercise.title + ' — это забота о себе, а не потраченное время.', 'success');
}

function saveReflection() {
  const textarea = document.querySelector('[data-reflection-text]');
  const select = document.querySelector('[data-reflection-topic]');
  const text = String(textarea ? textarea.value : reflectionDraft.text || '').trim();
  const topicId = select ? select.value : reflectionDraft.topicId || '';
  if (!text) {
    if (textarea) textarea.focus();
    showToast('Пока пусто', 'Напишите одну фразу своими словами — этого достаточно.', 'info');
    return;
  }
  const today = toISO(new Date());
  const existing = todayReflection();
  const entry = {
    id: existing?.id || 'reflection-' + today,
    date: today,
    topicId: TOPIC_BY_ID[topicId] ? topicId : null,
    text: text.slice(0, 900),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  state.progress.reflections = (state.progress.reflections || [])
    .filter(item => item.date !== today)
    .concat(entry)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-400);
  reflectionDraft = { date: today, text: entry.text, topicId: entry.topicId || '' };
  saveState();
  render();
  showToast('Записано', 'Через месяц покажем эту мысль и то, как вы выросли.', 'success');
}

function ensureMoodDraft() {
  const today = toISO(new Date());
  if (moodDraft.date !== today) {
    const entry = moodEntryForDate(today);
    moodDraft = { date: today, level: entry?.level || 0, note: entry?.note || '' };
  }
  return moodDraft;
}

function upsertMoodEntry(level, note) {
  const today = toISO(new Date());
  const hour = new Date().getHours();
  const entry = {
    date: today,
    level: clamp(Number(level), 1, 5),
    hour,
    period: moodPeriodForHour(hour).id,
    note: String(note || '').trim().slice(0, 160),
    at: new Date().toISOString()
  };
  state.progress.mood = (state.progress.mood || [])
    .filter(item => item.date !== today)
    .concat(entry)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-400);
  return entry;
}

function selectMood(level) {
  const today = toISO(new Date());
  ensureMoodDraft();
  const noteInput = document.querySelector('[data-mood-note]');
  const note = noteInput ? noteInput.value : moodDraft.note;
  const existed = Boolean(moodEntryForDate(today));
  const entry = upsertMoodEntry(level, note);
  moodDraft = { date: today, level: entry.level, note: entry.note };
  saveState();
  render();
  if (!existed) showToast('Настроение отмечено', 'Дневник поможет найти ресурсные дни и время для сложных тем.', 'success');
}

function saveMood() {
  const today = toISO(new Date());
  ensureMoodDraft();
  const noteInput = document.querySelector('[data-mood-note]');
  const note = noteInput ? noteInput.value : moodDraft.note;
  if (!moodDraft.level) {
    showToast('Сначала выберите настроение', 'Нажмите на один из пяти смайликов — это займёт секунду.', 'info');
    return;
  }
  const entry = upsertMoodEntry(moodDraft.level, note);
  moodDraft = { date: today, level: entry.level, note: entry.note };
  saveState();
  render();
  showToast('Запись сохранена', 'Настроение и заметка добавлены в дневник.', 'success');
}

function applyScheduleImport(text, source) {
  const sourceId = source || scheduleSource || 'manual';
  const lessons = parseScheduleText(text, sourceId);
  if (!lessons.length) {
    showToast('Не удалось разобрать', 'Нужны строки вида «Пн 14:30–16:00 Алгебра» или «2026-11-05 10:00–11:30 Пробный».', 'warn');
    return false;
  }
  state.progress.schedule = {
    source: sourceId,
    importedAt: new Date().toISOString(),
    lessons
  };
  scheduleSource = sourceId;
  scheduleText = '';
  state.plan = generatePlan(state.profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  saveState();
  render();
  showToast('Расписание импортировано', lessons.length + ' ' + pluralize(lessons.length, ['урок', 'урока', 'уроков']) + '. План обойдёт эти пересечения.', 'success');
  return true;
}

function importScheduleFromUI() {
  const textarea = document.querySelector('[data-schedule-text]');
  if (textarea) scheduleText = textarea.value;
  applyScheduleImport(scheduleText, scheduleSource);
}

function clearSchedule() {
  state.progress.schedule = { source: '', importedAt: '', lessons: [] };
  scheduleText = '';
  state.plan = generatePlan(state.profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  saveState();
  render();
  showToast('Расписание очищено', 'План снова использует только ваши учебные часы.', 'info');
}

function queueCelebration(items) {
  if (!Array.isArray(items) || !items.length) return;
  items.forEach(item => {
    if (!item || !item.id) return;
    if (celebrationCurrent?.id === item.id) return;
    if (celebrationQueue.some(entry => entry.id === item.id)) return;
    celebrationQueue.push(item);
  });
  if (!celebrationCurrent && celebrationQueue.length) celebrationCurrent = celebrationQueue.shift();
}

function startCelebrationTimer() {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
    celebrationTimer = null;
  }
  if (!celebrationCurrent || modal) return;
  celebrationTimer = setTimeout(() => {
    celebrationTimer = null;
    advanceCelebration(true);
  }, 12000);
}

function advanceCelebration(renderAfter) {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
    celebrationTimer = null;
  }
  celebrationCurrent = celebrationQueue.shift() || null;
  if (renderAfter) render();
}

function closeCelebration() {
  advanceCelebration(true);
}

function scrollToReflection() {
  if (view !== 'progress') {
    view = 'progress';
    selectedSubject = null;
    modal = null;
    render();
  }
  requestAnimationFrame(() => {
    const card = document.querySelector('[data-reflection-card]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => card.querySelector('textarea')?.focus({ preventScroll: true }));
  });
}
