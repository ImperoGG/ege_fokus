/* Точка входа: состояние приложения, обработчики событий и запуск. */
'use strict';

let state = defaultState();
let currentUser = null;
let activeStorageKey = STORAGE_KEY;
let view = 'dashboard';
let obStep = 0;
let obDirection = 'forward';
let obDraft = null;
let editingProfile = false;
let selectedSubject = null;
let planWeekStart = startOfWeek(new Date());
let selectedPlanDate = toISO(new Date());
let trainer = null;
let trainerSubject = null;
let trainerListMode = 'topics';
let trainerSourceFilter = 'all';
let trainerDocFilter = 'all';
let trainerYearFilter = 'all';
let mistakeFilter = 'all';
let settingsDraft = null;
let modal = null;
let modalCloseToken = 0;
let lastRenderedView = '__init__';
let answerReveal = { quiz: false, daily: false };
let timerState = { remaining: 25 * 60, running: false, preset: 25, interval: null };
let lastSubjectInPlan = null;
let authMode = readAccounts().users.length ? 'login' : 'register';
let authDraft = { name: '', email: '', password: '', confirm: '' };
let authError = '';
let authBusy = false;
let authShowPassword = false;
let remindersStarted = false;
let obDiagQuiz = null;
let groupJoinCode = '';
let groupNameDraft = '';
let pendingImport = null;
let pendingImportName = '';
let strategySubject = null;
let pseSubject = null;
let targetDraftSubject = null;
let targetDraftValue = 80;
let reflectionDraft = { text: '', topicId: '' };
let moodDraft = { date: '', level: 0, note: '' };
let scheduleText = '';
let scheduleSource = 'manual';
let breathState = { exercise: 'breath', phase: '', remaining: 0, rounds: 0, timer: null, running: false };
let celebrationQueue = [];
let celebrationCurrent = null;
let celebrationTimer = null;
let freshAchievements = new Set();
let trainerInterval = null;
let surpriseTimeLeft = 0;
let searchState = { query: '', filter: 'all' };
let topicFilter = 'all';
let fipiDraft = null;
let essayWorkspaceTab = 'works';
let essayWorksQuery = '';
let essayWorksDirection = 'all';
let syncConfig = readSyncConfig();
let syncDraft = { code: syncConfig.code || '', passphrase: '', server: syncConfig.server || defaultSyncUrl() };
let syncBusy = false;
let syncMessage = null;
let syncHealth = null;
let authSyncOpen = false;
let pwaInstallPrompt = null;
let pwaInstallAvailable = false;
let pwaRegistration = null;

function render() {
  const app = document.getElementById('app');
  if (!app) return;
  const entering = lastRenderedView !== view;
  lastRenderedView = view;
  if (!currentUser) {
    app.innerHTML = renderAuth();
    app.dataset.enter = entering ? '1' : '0';
    document.body.classList.remove('modal-open');
    document.title = 'Вход — Фокус';
    return;
  }
  if (!state.onboarded || !state.profile || view === 'onboarding') {
    if (!obDraft) obDraft = buildOnboardingDraft();
    app.innerHTML = renderOnboarding();
    app.dataset.enter = entering ? '1' : '0';
    animateAnswerFeedback(app);
    document.title = editingProfile ? 'Профиль — Фокус' : 'Знакомство — Фокус';
    document.body.classList.remove('modal-open');
    return;
  }
  const autoRebalance = maybeAutoRebalance();
  if ((autoRebalance?.pendingReason || state.progress.rebalance?.pendingReason) && !modal) {
    modal = { type: 'rebalance' };
  }
  const newlyUnlocked = evaluateAchievements();
  if (newlyUnlocked.length) {
    newlyUnlocked.forEach(item => freshAchievements.add(item.id));
    queueCelebration(newlyUnlocked.map(item => ({ id: item.id, title: item.title, desc: item.desc, icon: item.icon })));
  }
  recordForecastSnapshot();
  if (view === 'fipi') {
    view = 'trainer';
    trainerListMode = 'tasks';
  }
  let content = '';
  if (view === 'plan') content = renderPlan();
  else if (view === 'subjects') content = renderSubjects();
  else if (view === 'trainer') content = renderTrainer();
  else if (view === 'mistakes') content = renderMistakes();
  else if (view === 'progress') content = renderProgress();
  else if (view === 'achievements') content = renderAchievements();
  else if (view === 'group') content = renderGroup();
  else if (view === 'settings') content = renderSettings();
  else content = renderDashboard();
  app.innerHTML = renderShell(content) + renderModalRoot() + renderCelebrationRoot();
  app.dataset.enter = entering ? '1' : '0';
  animateAnswerFeedback(app);
  document.body.classList.toggle('modal-open', Boolean(modal) || Boolean(celebrationCurrent));
  document.title = 'Фокус ЕГЭ · ' + pageTitle();
  startCelebrationTimer();
}

function openModal(type, payload) {
  modalCloseToken += 1;
  modal = { type, ...(payload || {}) };
  render();
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/* Анимация ответа запускается ровно один раз — в момент проверки,
   а не при каждом повторном render() с уже проверенным вопросом. */
function animateAnswerFeedback(root) {
  if (!answerReveal.quiz && !answerReveal.daily) return;
  answerReveal = { quiz: false, daily: false };
  animateVerdictIcons(root);
  animateQuizFeedback(root);
}

/* Разбор выплывает сверху вниз: высоту считаем у реального блока,
   чтобы оплата шла ровно до его содержимого, а не «на глазок». */
function animateQuizFeedback(root) {
  const box = root.querySelector('.quiz-explanation, .daily-explanation');
  if (!box || prefersReducedMotion()) return;
  const target = box.offsetHeight;
  if (!target) return;
  box.style.overflow = 'hidden';
  const animation = box.animate(
    [
      { height: '0px', opacity: 0, transform: 'translate3d(0,-8px,0)' },
      { height: target + 'px', opacity: 1, transform: 'translate3d(0,0,0)' }
    ],
    { duration: 460, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }
  );
  animation.finished.then(() => {
    animation.cancel();
    box.style.height = '';
    box.style.overflow = '';
  }).catch(() => {
    box.style.height = '';
    box.style.overflow = '';
  });
}


function animateVerdictIcons(root) {
  const svgs = root.querySelectorAll('.option-letter.verdict .verdict-svg');
  if (!svgs.length || prefersReducedMotion()) return;
  svgs.forEach(svg => {
    svg.querySelectorAll('path').forEach(path => {
      let length = 0;
      try {
        length = path.getTotalLength();
      } catch (error) {
        return;
      }
      if (!length) return;
      path.style.strokeDasharray = length + 'px';
      path.style.strokeDashoffset = length + 'px';
      path.animate(
        [{ strokeDashoffset: length + 'px' }, { strokeDashoffset: '0px' }],
        { duration: 340, delay: 40, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
      );
    });
  });
}

function closeModal() {
  if (!modal || modal.closing) return;
  stopBreathing(false);
  if (modal?.type === 'target') {
    targetDraftSubject = null;
    targetDraftValue = 80;
  }
  if (modal?.type === 'rebalance' && state.progress?.rebalance?.pendingReason) {
    state.progress.rebalance.pendingReason = false;
    state.progress.rebalance.dismissedAt = new Date().toISOString();
    saveState();
  }
  if (modal?.type === 'import') {
    pendingImport = null;
    pendingImportName = '';
  }
  const token = ++modalCloseToken;
  modal = { ...modal, closing: true };
  render();
  const delay = prefersReducedMotion() ? 0 : 170;
  setTimeout(() => {
    if (token !== modalCloseToken || !modal?.closing) return;
    modal = null;
    document.body.classList.remove('modal-open');
    render();
  }, delay);
}

function showToast(title, text, type) {
  let root = document.querySelector('.toast-root');
  if (!root) {
    root = document.createElement('div');
    root.className = 'toast-root';
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);
  }
  const tone = type === 'warn' ? 'warn' : type === 'error' ? 'error' : '';
  const toast = document.createElement('div');
  toast.className = 'toast ' + tone;
  const iconName = type === 'warn' || type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle';
  toast.innerHTML = '<span class="toast-ico">' + icon(iconName) + '</span><div style="flex:1;min-width:0"><b>' + escapeHTML(title) + '</b><small>' + escapeHTML(text || '') + '</small></div><button class="toast-close" data-toast-close aria-label="Закрыть">' + icon('x') + '</button>';
  while (root.children.length >= 3) root.firstElementChild.remove();
  root.appendChild(toast);
  const remove = () => {
    if (toast.classList.contains('leaving')) return;
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 200);
  };
  setTimeout(remove, 5600);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startEssayCheck(scope, workId) {
  if (scope === 'work') {
    const work = typeof essayWorkById === 'function' ? essayWorkById(workId) : null;
    const pool = typeof essayWorkQuestionIds === 'function' ? essayWorkQuestionIds(workId) : [];
    if (!work || !pool.length) {
      showToast('Проверка недоступна', 'Для этого произведения пока нет вопросов.', 'info');
      return;
    }
    startTrainer({
      topicId: 'e-works',
      mode: 'topic',
      contextLabel: '«' + work.title + '»',
      questionIds: shuffle(pool).slice(0, Math.min(8, pool.length))
    });
    return;
  }
  const topicId = scope === 'cliches' ? 'e-cliches' : 'e-works';
  const topic = TOPIC_BY_ID[topicId];
  const pool = topic ? topic.questions.map(question => question.id).filter(id => QUESTION_BY_ID[id]) : [];
  if (!pool.length) {
    showToast('Нет вопросов для проверки', 'Попробуйте открыть тему и пройти практику.', 'info');
    return;
  }
  const limit = topicId === 'e-cliches' ? 8 : 10;
  startTrainer({ topicId, mode: 'topic', questionIds: shuffle(pool).slice(0, Math.min(limit, pool.length)) });
}

function copyEssayText(text) {
  const value = String(text || '').trim();
  if (!value) return;
  const done = () => showToast('Фраза скопирована', 'Вставьте её в сочинение и продолжите своей мыслью.', 'success');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(done).catch(() => {
      showToast('Не удалось скопировать', value, 'info');
    });
    return;
  }
  const area = document.createElement('textarea');
  area.value = value;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
    done();
  } catch (error) {
    showToast('Не удалось скопировать', value, 'info');
  }
  area.remove();
}

function shuffledOptionOrder(question) {
  return shuffle((question?.options || []).map((_, index) => index));
}

function resolveOptionOrder(question, order) {
  const length = question?.options?.length || 0;
  const valid = Array.isArray(order)
    && order.length === length
    && order.every(index => Number.isInteger(index) && index >= 0 && index < length)
    && new Set(order).size === length;
  return valid ? order : Array.from({ length }, (_, index) => index);
}

function dateTimeFromISO(dateISO, time) {
  const date = parseISO(dateISO);
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function updateTimerDisplays() {
  const minutes = Math.floor(timerState.remaining / 60);
  const seconds = timerState.remaining % 60;
  document.querySelectorAll('[data-timer-display]').forEach(element => {
    element.textContent = pad(minutes) + ':' + pad(seconds);
  });
}

function tickTimer() {
  timerState.remaining = Math.max(0, timerState.remaining - 1);
  updateTimerDisplays();
  if (timerState.remaining <= 0) {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.remaining = timerState.preset * 60;
    addActivity(timerState.preset);
    saveState();
    showToast('Фокус-сессия завершена', '25 минут без телефона — это уже шаг. Сделайте короткий перерыв.', 'success');
    render();
  }
}

function toggleTimer() {
  if (timerState.running) {
    clearInterval(timerState.interval);
    timerState.running = false;
    render();
    return;
  }
  if (timerState.remaining <= 0) timerState.remaining = timerState.preset * 60;
  timerState.running = true;
  timerState.interval = setInterval(tickTimer, 1000);
  render();
}

function checkReminders() {
  if (!currentUser) return;
  if (!state.onboarded || !state.settings.notify || !state.plan) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const now = new Date();
  const today = toISO(now);
  (state.plan.sessions || [])
    .filter(session => session.date === today && !sessionIsDone(session.id))
    .forEach(session => {
      if (state.progress.remindersSent[session.id]) return;
      const start = dateTimeFromISO(session.date, session.start);
      const diff = (start - now) / 60000;
      if (diff > 10 || diff < -2) return;
      const title = session.topicId ? TOPIC_BY_ID[session.topicId]?.title || session.title : session.title;
      try {
        new Notification('Скоро занятие · ' + SUBJECTS[session.subject].short, {
          body: session.start + ' — ' + title + '. ' + session.duration + ' минут фокуса.',
          tag: 'fokus-' + session.id
        });
      } catch (error) {
        showToast('Напоминание', session.start + ' — ' + title, 'info');
      }
      state.progress.remindersSent[session.id] = new Date().toISOString();
      saveState();
    });
}

function icsEscape(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function icsDateTime(dateISO, time) {
  const date = parseISO(dateISO);
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  return String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate()) + 'T' + pad(hours) + pad(minutes) + '00';
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportICS() {
  if (!state.plan || !state.plan.sessions) {
    showToast('Нет плана', 'Сначала соберите план подготовки.', 'warn');
    return;
  }
  const today = toISO(new Date());
  const sessions = state.plan.sessions.filter(session => session.date >= today);
  if (!sessions.length) {
    showToast('Нет будущих занятий', 'В плане не осталось занятий для экспорта.', 'warn');
    return;
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fokus EGE//Preparation Plan//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  sessions.forEach(session => {
    const topic = session.topicId ? TOPIC_BY_ID[session.topicId] : null;
    const title = topic ? topic.title : session.title;
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + session.id + '@fokus-ege.local');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + icsDateTime(session.date, session.start));
    lines.push('DTEND:' + icsDateTime(session.date, session.end));
    lines.push('SUMMARY:' + icsEscape('Фокус ЕГЭ · ' + SUBJECTS[session.subject].short + ': ' + title));
    lines.push('DESCRIPTION:' + icsEscape((SESSION_LABELS[session.type] || session.type) + ' · ' + session.duration + ' мин. План подготовки «Фокус».'));
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT10M');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:' + icsEscape('Скоро занятие: ' + title));
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  downloadFile('fokus-ege-plan.ics', lines.join('\r\n') + '\r\n', 'text/calendar;charset=utf-8');
  showToast('Календарь готов', 'Файл .ics можно открыть в Google Календаре, Apple Календаре или Outlook.', 'success');
}

function exportJSON() {
  downloadFile('fokus-ege-backup-' + toISO(new Date()) + '.json', JSON.stringify(state, null, 2), 'application/json;charset=utf-8');
  showToast('Резервная копия сохранена', 'JSON-файл лежит в загрузках.', 'success');
}

async function handleImportFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.progress || typeof parsed.progress !== 'object') {
      throw new Error('В файле нет данных прогресса.');
    }
    pendingImport = normalizeState(parsed);
    pendingImportName = file.name || 'fokus-backup.json';
    modal = { type: 'import' };
    render();
  } catch (error) {
    pendingImport = null;
    pendingImportName = '';
    showToast('Не удалось прочитать файл', error?.message || 'Проверьте, что это JSON-резервная копия «Фокуса».', 'error');
  }
}

function renderImportModal() {
  if (!pendingImport) return '';
  const stateInfo = pendingImport;
  const topicCount = Object.values(stateInfo.progress.topics || {}).filter(item => item?.theory || item?.practice || Number(item?.attempts || 0) > 0).length;
  const sessionCount = Object.keys(stateInfo.progress.sessions || {}).length;
  const mistakeCount = Object.keys(stateInfo.progress.mistakes || {}).length;
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Импорт резервной копии">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('upload') + '</div><div><h2>Восстановить прогресс?</h2><p>Файл «' + escapeHTML(pendingImportName) + '» заменит данные текущего аккаунта на этом устройстве.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="summary-grid">' +
          '<div class="summary-item"><small>Профиль</small><b>' + escapeHTML(stateInfo.profile?.name || 'не найден') + '</b></div>' +
          '<div class="summary-item"><small>Предметы</small><b>' + (stateInfo.profile?.subjects || []).map(id => SUBJECTS[id]?.short || id).join(', ') + '</b></div>' +
          '<div class="summary-item"><small>Тем с прогрессом</small><b>' + topicCount + '</b></div>' +
          '<div class="summary-item"><small>Занятий отмечено</small><b>' + sessionCount + '</b></div>' +
          '<div class="summary-item"><small>Ошибок в журнале</small><b>' + mistakeCount + '</b></div>' +
          '<div class="summary-item"><small>Резервная копия</small><b>' + (stateInfo.meta?.lastOpen ? formatDateFull(new Date(stateInfo.meta.lastOpen)) : 'дата неизвестна') + '</b></div>' +
        '</div>' +
        '<div class="notice orange" style="margin-top:14px">' + icon('alert') + '<div><b>Текущий прогресс будет заменён.</b> Аккаунт, пароль и настройки темы останутся прежними. Если не уверены, сначала скачайте текущую резервную копию.</div></div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Это и есть перенос между устройствами в MVP.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" data-action="apply-import">' + icon('upload') + 'Восстановить</button></div></div>' +
    '</div>';
}

function applyPendingImport() {
  if (!pendingImport) return;
  state = normalizeState(pendingImport);
  pendingImport = null;
  pendingImportName = '';
  modal = null;
  trainer = null;
  obDiagQuiz = null;
  settingsDraft = null;
  selectedSubject = null;
  mistakeFilter = 'all';
  if (state.onboarded && state.profile) {
    addUpcomingEssayTrack();
    prepareAuthenticatedView();
  } else {
    view = 'onboarding';
    obDraft = null;
    obStep = 0;
  }
  saveState();
  render();
  showToast('Данные восстановлены', 'План, прогресс и достижения загружены из резервной копии.', 'success');
}

function resetAllData() {
  if (timerState.interval) clearInterval(timerState.interval);
  timerState = { remaining: 25 * 60, running: false, preset: 25, interval: null };
  localStorage.removeItem(activeStorageKey);
  state = defaultState();
  view = 'onboarding';
  obDraft = null;
  obStep = 0;
  obDiagQuiz = null;
  groupJoinCode = '';
  groupNameDraft = '';
  pendingImport = null;
  pendingImportName = '';
  editingProfile = false;
  selectedSubject = null;
  trainer = null;
  trainerSubject = null;
  mistakeFilter = 'all';
  settingsDraft = null;
  modal = null;
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  render();
}

function applyReplan() {
  if (!state.profile) return;
  state.plan = generatePlan(state.profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  modal = null;
  saveState();
  render();
  const warning = state.plan.warnings?.[0];
  if (warning) showToast('План пересобран с ограничением', warning, 'warn');
  else showToast('План пересобран', 'Выполненные занятия и прогресс сохранены.', 'success');
}

function saveSettings() {
  ensureSettingsDraft();
  const d = settingsDraft;
  if (!d.studyDays.length) {
    showToast('Нужен учебный день', 'Выберите хотя бы один день недели.', 'warn');
    return;
  }
  if (!d.preferredTimes.length) {
    showToast('Нужно удобное время', 'Выберите хотя бы один слот.', 'warn');
    return;
  }
  if (Number(d.dailyMinutes) < Number(d.sessionMinutes)) {
    showToast('Слишком короткий день', 'Дневная нагрузка должна быть не меньше занятия.', 'warn');
    return;
  }
  if (timeToMinutes(d.schoolEnd) >= timeToMinutes(d.sleepStart)) {
    showToast('Проверьте время', 'Сон должен начинаться после школы.', 'warn');
    return;
  }
  if (timeToMinutes(d.tutorTime) + 60 > timeToMinutes(d.sleepStart)) {
    showToast('Репетитор слишком поздно', 'Занятие не успевает закончиться до сна.', 'warn');
    return;
  }
  const freeStudyDays = d.studyDays.filter(day => Number(day) !== Number(d.bufferDay));
  if (!freeStudyDays.length) {
    showToast('Все дни заняты буфером', 'Оставьте хотя бы один учебный день свободным от буфера.', 'warn');
    return;
  }
  const profile = state.profile;
  profile.studyDays = [...d.studyDays].map(Number).sort();
  profile.preferredTimes = [...d.preferredTimes].sort();
  profile.dailyMinutes = Number(d.dailyMinutes);
  profile.sessionMinutes = Number(d.sessionMinutes);
  profile.schoolEnd = d.schoolEnd;
  profile.tutorDays = [...d.tutorDays].map(Number).sort();
  profile.tutorTime = d.tutorTime;
  profile.sleepStart = d.sleepStart;
  profile.bufferDay = Number(d.bufferDay);
  profile.miniMocks = Boolean(d.miniMocks);
  profile.spacedReview = Boolean(d.spacedReview);
  state.plan = generatePlan(profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  settingsDraft = null;
  saveState();
  render();
  if (state.plan.warnings?.length) showToast('План обновлён', state.plan.warnings[0], 'warn');
  else showToast('Настройки сохранены', 'План пересобран под новый ритм.', 'success');
}

function handleOnboardingNext() {
  if (!validateObStep(obStep)) return;
  if (obStep >= 6) {
    completeOnboarding();
    return;
  }
  obStep += 1;
  obDirection = 'forward';
  render();
  requestAnimationFrame(() => {
    document.querySelector('[data-ob-body]')?.scrollTo(0, 0);
  });
}

function handleClick(event) {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-toast-close]')) {
    const toast = event.target.closest('.toast');
    if (toast && !toast.classList.contains('leaving')) {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 200);
    }
    return;
  }
  if (event.target.matches('[data-modal-backdrop]')) {
    closeModal();
    return;
  }
  if (event.target.matches('[data-celebration-root]')) {
    closeCelebration();
    return;
  }
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (!action) return;

  switch (action) {
    case 'auth-mode':
      authMode = actionEl.dataset.mode === 'register' ? 'register' : 'login';
      authError = '';
      authDraft.password = '';
      authDraft.confirm = '';
      authBusy = false;
      render();
      break;
    case 'auth-toggle-password':
      authShowPassword = !authShowPassword;
      render();
      break;
    case 'logout':
      logoutAccount();
      break;
    case 'toggle-theme':
      toggleTheme();
      break;
    case 'set-theme':
      setTheme(actionEl.dataset.theme);
      break;
    case 'open-search':
      openSearch();
      break;
    case 'search-filter':
      searchState.filter = actionEl.dataset.filter || 'all';
      render();
      requestAnimationFrame(() => document.querySelector('[data-search-input]')?.focus());
      break;
    case 'search-clear':
      searchState.query = '';
      {
        const input = document.querySelector('[data-search-input]');
        if (input) {
          input.value = '';
          input.focus();
        }
      }
      updateSearchResults();
      break;
    case 'search-suggest':
      searchState.query = actionEl.dataset.query || '';
      {
        const input = document.querySelector('[data-search-input]');
        if (input) {
          input.value = searchState.query;
          input.focus();
        }
      }
      updateSearchResults();
      break;
    case 'search-open': {
      const type = actionEl.dataset.type;
      const topicId = actionEl.dataset.topic;
      const questionId = actionEl.dataset.question;
      modal = null;
      if (type === 'cheat' && TOPIC_BY_ID[topicId]) {
        openModal('cheatsheet', { topicId });
      } else if (type === 'question' && QUESTION_BY_ID[questionId]) {
        const question = QUESTION_BY_ID[questionId];
        startTrainer({ mode: 'topic', topicId: question.topicId, questionIds: [questionId] });
      } else if (TOPIC_BY_ID[topicId]) {
        selectedSubject = TOPIC_BY_ID[topicId].subject;
        topicFilter = 'all';
        view = 'subjects';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;
    }
    case 'topic-filter':
      topicFilter = actionEl.dataset.filter || 'all';
      render();
      break;
    case 'essay-tab':
      essayWorkspaceTab = actionEl.dataset.tab === 'cliches' ? 'cliches' : 'works';
      render();
      requestAnimationFrame(() => document.querySelector('.essay-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      break;
    case 'essay-direction':
      essayWorksDirection = actionEl.dataset.direction || 'all';
      render();
      break;
    case 'essay-search-clear': {
      essayWorksQuery = '';
      if ((actionEl.dataset.scope || 'all') === 'all') essayWorksDirection = 'all';
      const input = document.querySelector('[data-essay-search]');
      if (input) input.value = '';
      const clear = document.querySelector('.essay-search-clear');
      if (clear) clear.hidden = true;
      const results = document.querySelector('[data-essay-results]');
      if (results) results.innerHTML = renderEssayWorksResults();
      break;
    }
    case 'open-essay-work':
      if (actionEl.dataset.work) openModal('essay-work', { workId: actionEl.dataset.work });
      break;
    case 'start-essay-check':
      startEssayCheck(actionEl.dataset.scope, actionEl.dataset.work);
      break;
    case 'copy-essay-text':
      copyEssayText(actionEl.dataset.text || '');
      break;
    case 'review-due': {
      const due = dueReviewTopics(10);
      const ids = due.flatMap(item => shuffle(item.topic.questions.map(question => question.id)).slice(0, 2));
      if (!ids.length) {
        showToast('Повторять пока нечего', 'Пройдите практику — SM-2 сам поставит тему в очередь.', 'info');
        return;
      }
      startTrainer({ mode: 'review', questionIds: shuffle(ids).slice(0, 12) });
      break;
    }
    case 'open-fipi-session':
      openFipiSession(actionEl.dataset.subject || null, actionEl.dataset.session || null);
      break;
    case 'save-fipi-session':
      saveFipiSession();
      break;
    case 'sync-upload':
      syncUpload();
      break;
    case 'sync-health':
      syncHealthCheck();
      break;
    case 'sync-use-default':
      syncDraft.server = defaultSyncUrl();
      syncHealth = null;
      setSyncMessage('info', 'Подставлен адрес текущего сайта: ' + syncDraft.server + '. Нажмите «Проверить сервер».');
      render();
      break;
    case 'sync-download':
      syncDownload();
      break;
    case 'sync-save':
      saveSyncSettings();
      break;
    case 'sync-forget':
      forgetSyncSettings();
      break;
    case 'auth-sync-toggle':
      authSyncOpen = !authSyncOpen;
      syncMessage = null;
      render();
      break;
    case 'pwa-install':
      promptPWAInstall();
      break;
    case 'pwa-help':
      showToast('Установка и офлайн', 'Chrome/Edge: меню ⋮ → «Установить приложение». Safari: «Поделиться» → «На экран Домой». После первого открытия service worker кэширует интерфейс.', 'info');
      break;
    case 'nav': {
      const nextView = actionEl.dataset.view || 'dashboard';
      clearTrainerTimer();
      stopBreathing(false);
      modal = null;
      view = nextView;
      if (nextView === 'subjects') selectedSubject = null;
      if (nextView === 'settings') settingsDraft = null;
      render();
      if (view === 'trainer' && trainer?.mode === 'surprise' && !trainer.finished) beginSurpriseTimer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'open-subject':
      selectedSubject = actionEl.dataset.subject;
      view = 'subjects';
      modal = null;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'back-subjects':
      selectedSubject = null;
      render();
      break;
    case 'group-create': {
      const name = String(groupNameDraft || '').trim();
      if (name.length < 2) {
        showToast('Название слишком короткое', 'Напишите, как будет называться группа.', 'warn');
        return;
      }
      state.group = makeDemoGroup(name);
      groupNameDraft = '';
      saveState();
      render();
      showToast('Группа создана', 'Код приглашения уже готов. Участники пока демонстрационные.', 'success');
      break;
    }
    case 'group-join': {
      const code = String(groupJoinCode || '').trim().toUpperCase();
      if (code.length < 4) {
        showToast('Проверьте код', 'Код группы обычно содержит минимум 4 символа.', 'warn');
        return;
      }
      state.group = makeDemoGroup('Группа ' + code, code);
      groupJoinCode = '';
      saveState();
      render();
      showToast('Вы в демо-группе', 'Настоящая синхронизация участников появится после подключения сервера.', 'info');
      break;
    }
    case 'group-copy':
      copyGroupCode(actionEl.dataset.code || '');
      break;
    case 'open-leave-group':
      openModal('leave-group');
      break;
    case 'leave-group':
      state.group = null;
      modal = null;
      saveState();
      render();
      showToast('Вы вышли из группы', 'Прогресс и достижения остались с вами.', 'info');
      break;
    case 'open-theory': {
      const topicId = actionEl.dataset.topic;
      if (!TOPIC_BY_ID[topicId]) return;
      openModal('theory', { topicId, sessionId: actionEl.dataset.session || null });
      break;
    }
    case 'open-visual': {
      const topicId = actionEl.dataset.topic;
      const visualKey = actionEl.dataset.visual;
      if (!VISUAL_LIBRARY[visualKey] || !visualsForTopic(topicId).some(item => item.key === visualKey)) return;
      modal = { type: 'visual', topicId, visualKey };
      render();
      break;
    }
    case 'visual-prev':
      stepVisual(-1);
      break;
    case 'visual-next':
      stepVisual(1);
      break;
    case 'theory-start-practice': {
      const topicId = actionEl.dataset.topic;
      const sessionId = actionEl.dataset.session || modal?.sessionId || null;
      if (!TOPIC_BY_ID[topicId]) return;
      modal = null;
      startTrainer({ topicId, mode: 'topic', originSessionId: sessionId });
      break;
    }
    case 'theory-done': {
      const topicId = actionEl.dataset.topic;
      const sessionId = actionEl.dataset.session || modal?.sessionId || null;
      if (!TOPIC_BY_ID[topicId]) return;
      markTheoryStudied(topicId, sessionId);
      modal = null;
      render();
      showToast('Теория отмечена', 'Теперь закрепите её короткой практикой.', 'success');
      break;
    }
    case 'close-modal':
      closeModal();
      break;
    case 'start-practice': {
      const topicId = actionEl.dataset.topic;
      if (!TOPIC_BY_ID[topicId]) return;
      const sessionId = actionEl.dataset.session || null;
      const questionIds = trainerQuestionsForTopic(topicId);
      if (!questionIds.length) {
        showToast('Под фильтры нет заданий', 'Измените источник, документ или год и попробуйте снова.', 'info');
        return;
      }
      startTrainer({ topicId, mode: 'topic', originSessionId: sessionId, questionIds });
      break;
    }
    case 'start-task': {
      const id = actionEl.dataset.question;
      const question = QUESTION_BY_ID[id];
      if (!question) return;
      startTrainer({ questionIds: [id], topicId: question.topicId, subject: question.subject, mode: 'topic' });
      break;
    }
    case 'start-mock': {
      const subjectId = actionEl.dataset.subject || trainerSubject;
      if (!SUBJECTS[subjectId]) return;
      startTrainer({ subject: subjectId, mode: 'mock', originSessionId: actionEl.dataset.session || null });
      break;
    }
    case 'start-subject-practice': {
      const subjectId = actionEl.dataset.subject || trainerSubject;
      if (!SUBJECTS[subjectId]) return;
      const pool = allQuestionsForSubject(subjectId).filter(fipiQuestionMatchesFilters);
      const questions = shuffle(pool.map(question => question.id)).slice(0, 8);
      if (!questions.length) {
        showToast('Под фильтры нет заданий', 'Выберите другой источник, документ или год.', 'info');
        return;
      }
      startTrainer({ subject: subjectId, mode: 'subject', questionIds: questions });
      break;
    }
    case 'start-mixed': {
      const questions = shuffle(profileSubjects().flatMap(id => allQuestionsForSubject(id)).map(question => question.id)).slice(0, 10);
      startTrainer({ mode: 'mixed', questionIds: questions });
      break;
    }
    case 'practice-mistakes': {
      const entries = (mistakeFilter === 'all' ? getMistakeEntries() : mistakesForCurrentFilter());
      if (!entries.length) {
        showToast('Ошибок нет', 'Сначала пройдите практику, чтобы журнал наполнился.', 'info');
        return;
      }
      const ids = shuffle(entries.map(item => item.questionId)).slice(0, 12);
      startTrainer({ mode: 'mistakes', questionIds: ids, subject: mistakeFilter === 'all' ? null : mistakeFilter });
      break;
    }
    case 'practice-mistake': {
      const id = actionEl.dataset.question;
      if (!QUESTION_BY_ID[id]) return;
      startTrainer({ mode: 'mistakes', questionIds: [id], topicId: QUESTION_BY_ID[id].topicId, subject: QUESTION_BY_ID[id].subject });
      break;
    }
    case 'mistake-filter':
      mistakeFilter = actionEl.dataset.filter || 'all';
      render();
      break;
    case 'remove-mistake': {
      const id = actionEl.dataset.question;
      if (state.progress.mistakes[id]) {
        delete state.progress.mistakes[id];
        saveState();
        render();
        showToast('Задание убрано', 'Отметили, что больше не ошибаетесь.', 'success');
      }
      break;
    }
    case 'open-clear-mistakes':
      openModal('clear-mistakes');
      break;
    case 'clear-mistakes':
      state.progress.mistakes = {};
      modal = null;
      saveState();
      render();
      showToast('Журнал очищен', 'Записи об ошибках удалены.', 'success');
      break;
    case 'trainer-subject':
      trainerSubject = actionEl.dataset.subject;
      trainerDocFilter = 'all';
      trainerYearFilter = 'all';
      trainer = null;
      render();
      break;
    case 'trainer-list-mode':
      trainerListMode = actionEl.dataset.mode === 'tasks' ? 'tasks' : 'topics';
      render();
      break;
    case 'trainer-source': {
      const source = actionEl.dataset.source;
      trainerSourceFilter = ['fipi', 'authored'].includes(source) ? source : 'all';
      if (trainerSourceFilter === 'authored') {
        trainerDocFilter = 'all';
        trainerYearFilter = 'all';
      }
      render();
      break;
    }
    case 'trainer-reset-filters':
      trainerSourceFilter = 'all';
      trainerDocFilter = 'all';
      trainerYearFilter = 'all';
      render();
      break;
    case 'open-fipi-journal':
      openModal('fipi-journal');
      break;
    case 'trainer-open-tasks': {
      const subjectId = actionEl.dataset.subject || trainerSubject;
      if (!SUBJECTS[subjectId]) return;
      trainerSubject = subjectId;
      trainerListMode = 'tasks';
      trainerSourceFilter = 'fipi';
      trainerDocFilter = 'all';
      trainerYearFilter = 'all';
      trainer = null;
      modal = null;
      view = 'trainer';
      render();
      break;
    }
    case 'quiz-option': {
      if (!trainer || trainer.checked) return;
      const question = QUESTION_BY_ID[trainer.queue[trainer.index]];
      if (!question) return;
      const index = Number(actionEl.dataset.index);
      if (question.answerKind === 'multi') {
        const current = Array.isArray(trainer.selected) ? trainer.selected : [];
        trainer.selected = current.includes(index)
          ? current.filter(value => value !== index)
          : [...current, index].sort((a, b) => a - b);
      } else {
        trainer.selected = index;
      }
      render();
      break;
    }
    case 'quiz-check': {
      if (!trainer || trainer.checked) return;
      const hasSelection = Array.isArray(trainer.selected) ? trainer.selected.length > 0 : trainer.selected !== null;
      if (!hasSelection) return;
      const question = QUESTION_BY_ID[trainer.queue[trainer.index]];
      if (!question) return;
      const optionOrder = resolveOptionOrder(question, trainer.optionOrders?.[question.id]);
      const isMulti = question.answerKind === 'multi';
      const originalSelected = isMulti
        ? trainer.selected.map(index => optionOrder[index]).sort((a, b) => a - b)
        : optionOrder[trainer.selected];
      const correctSet = (Array.isArray(question.correct) ? question.correct : [question.correct]).slice().sort((a, b) => a - b);
      const isCorrect = isMulti
        ? originalSelected.length === correctSet.length && originalSelected.every((value, index) => value === correctSet[index])
        : originalSelected === question.correct;
      const seconds = trainer.questionStartedAt ? (Date.now() - trainer.questionStartedAt) / 1000 : 0;
      trainer.answers[trainer.index] = { qid: question.id, selected: trainer.selected, originalSelected, correct: isCorrect };
      sm2Review(question.topicId, sm2QualityForAnswer(isCorrect, seconds));
      if (isCorrect) delete state.progress.mistakes[question.id];
      else addMistake(question.id, originalSelected);
      trainer.checked = true;
      if (trainer.mode === 'surprise') clearTrainerTimer();
      saveState();
      answerReveal.quiz = true;
      render();
      break;
    }
    case 'quiz-next': {
      if (!trainer || !trainer.checked) return;
      if (trainer.index >= trainer.queue.length - 1) {
        finishTrainer();
      } else {
        trainer.index += 1;
        trainer.selected = null;
        trainer.checked = false;
        trainer.questionStartedAt = Date.now();
        render();
        window.scrollTo({ top: 0, behavior: 'auto' });
        if (trainer.mode === 'surprise') beginSurpriseTimer();
      }
      break;
    }
    case 'daily-option': {
      const meta = dailyQuestionMeta();
      if (!meta || meta.daily.checked) return;
      meta.daily.selected = Number(actionEl.dataset.index);
      saveState();
      render();
      break;
    }
    case 'daily-check': {
      const meta = dailyQuestionMeta();
      if (!meta || meta.daily.selected === null || meta.daily.checked) return;
      const { daily, question } = meta;
      const optionOrder = resolveOptionOrder(question, daily.order);
      const originalSelected = optionOrder[daily.selected];
      const correct = originalSelected === question.correct;
      const seconds = daily.startedAt ? (Date.now() - new Date(daily.startedAt).getTime()) / 1000 : 0;
      sm2Review(question.topicId, sm2QualityForAnswer(correct, seconds));
      daily.checked = true;
      daily.correct = correct;
      const today = toISO(new Date());
      state.progress.dailyQuestions[today] = {
        questionId: question.id,
        correct,
        at: new Date().toISOString()
      };
      state.progress.quizHistory.push({
        date: new Date().toISOString(),
        subject: question.subject,
        topicId: question.topicId,
        mode: 'daily',
        total: 1,
        correct: correct ? 1 : 0
      });
      if (correct) delete state.progress.mistakes[question.id];
      else addMistake(question.id, originalSelected);
      addActivity(2);
      saveState();
      answerReveal.daily = true;
      render();
      showToast(correct ? 'Верно' : 'Разбор дня', correct ? 'Ещё один короткий шаг в копилку.' : 'Загляните в объяснение — это и есть польза.', correct ? 'success' : 'info');
      break;
    }
    case 'trainer-exit': {
      clearTrainerTimer();
      stopBreathing(false);
      const wasMistakes = trainer?.mode === 'mistakes';
      trainer = null;
      view = actionEl.dataset.view || (wasMistakes ? 'mistakes' : 'trainer');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'trainer-retry':
      if (!trainer) return;
      trainer = {
        ...trainer,
        originSessionId: null,
        index: 0,
        selected: null,
        checked: false,
        answers: [],
        optionOrders: Object.fromEntries(trainer.queue.map(id => [id, shuffledOptionOrder(QUESTION_BY_ID[id])])),
        questionStartedAt: Date.now(),
        finished: false,
        startedAt: new Date().toISOString()
      };
      render();
      if (trainer.mode === 'surprise') beginSurpriseTimer();
      break;
    case 'open-replan':
      openModal('replan');
      break;
    case 'replan-apply':
      applyReplan();
      break;
    case 'apply-rebalance':
      applyRebalance(actionEl.dataset.reason || 'time');
      break;
    case 'dismiss-rebalance':
      dismissRebalance();
      break;
    case 'reset-pace':
      resetPace();
      break;
    case 'plan-week': {
      const offset = Number(actionEl.dataset.offset || 0);
      planWeekStart = addDays(planWeekStart, offset * 7);
      const week = Array.from({ length: 7 }, (_, index) => toISO(addDays(planWeekStart, index)));
      const today = toISO(new Date());
      selectedPlanDate = week.includes(today) ? today : week[0];
      render();
      break;
    }
    case 'plan-today':
      planWeekStart = startOfWeek(new Date());
      selectedPlanDate = toISO(new Date());
      render();
      break;
    case 'plan-select-day':
      selectedPlanDate = actionEl.dataset.date;
      render();
      break;
    case 'mark-session': {
      const sessionId = actionEl.dataset.session;
      const completed = completeSessionInternal(sessionId);
      if (completed) {
        saveState();
        render();
        showToast('Занятие отмечено', 'Ещё один шаг в маршруте закрыт.', 'success');
      }
      break;
    }
    case 'mark-day-done': {
      const date = actionEl.dataset.date;
      const sessions = sessionsForDate(date).filter(session => !sessionIsDone(session.id));
      if (!sessions.length) return;
      sessions.forEach(session => completeSessionInternal(session.id));
      saveState();
      render();
      showToast('День закрыт', sessions.length + ' ' + pluralize(sessions.length, ['шаг', 'шага', 'шагов']) + ' отмечены выполненными.', 'success');
      break;
    }
    case 'export-ics':
      exportICS();
      break;
    case 'export-json':
      exportJSON();
      break;
    case 'import-json':
      document.querySelector('[data-import-json]')?.click();
      break;
    case 'apply-import':
      applyPendingImport();
      break;
    case 'edit-profile':
      obDraft = buildOnboardingDraft();
      obStep = 0;
      editingProfile = true;
      modal = null;
      view = 'onboarding';
      render();
      break;
    case 'settings-day':
      ensureSettingsDraft();
      settingsDraft.studyDays = settingsDraft.studyDays.includes(Number(actionEl.dataset.day))
        ? settingsDraft.studyDays.filter(day => day !== Number(actionEl.dataset.day))
        : [...settingsDraft.studyDays, Number(actionEl.dataset.day)];
      render();
      break;
    case 'settings-time':
      ensureSettingsDraft();
      settingsDraft.preferredTimes = settingsDraft.preferredTimes.includes(actionEl.dataset.time)
        ? settingsDraft.preferredTimes.filter(time => time !== actionEl.dataset.time)
        : [...settingsDraft.preferredTimes, actionEl.dataset.time];
      render();
      break;
    case 'settings-tutor-day':
      ensureSettingsDraft();
      settingsDraft.tutorDays = settingsDraft.tutorDays.includes(Number(actionEl.dataset.day))
        ? settingsDraft.tutorDays.filter(day => day !== Number(actionEl.dataset.day))
        : [...settingsDraft.tutorDays, Number(actionEl.dataset.day)];
      render();
      break;
    case 'settings-toggle':
      ensureSettingsDraft();
      settingsDraft[actionEl.dataset.field] = !settingsDraft[actionEl.dataset.field];
      render();
      break;
    case 'settings-save':
      saveSettings();
      break;
    case 'settings-cancel':
      settingsDraft = null;
      render();
      showToast('Изменения сброшены', 'План остался прежним.', 'info');
      break;
    case 'toggle-notify':
      if (state.settings.notify) {
        state.settings.notify = false;
        saveState();
        render();
      } else if (typeof Notification === 'undefined') {
        showToast('Уведомления недоступны', 'Этот браузер не поддерживает Notification API.', 'warn');
      } else if (Notification.permission === 'denied') {
        showToast('Разрешение запрещено', 'Разрешите уведомления в настройках браузера для этого сайта.', 'warn');
      } else if (Notification.permission === 'granted') {
        state.settings.notify = true;
        saveState();
        render();
      } else {
        Notification.requestPermission().then(permission => {
          state.settings.notify = permission === 'granted';
          saveState();
          render();
          if (permission !== 'granted') showToast('Уведомления не включены', 'Можно разрешить их позже в настройках браузера.', 'info');
        }).catch(() => showToast('Не удалось запросить разрешение', 'Проверьте настройки браузера.', 'warn'));
      }
      break;
    case 'toggle-email':
      state.settings.emailNotify = !state.settings.emailNotify;
      saveState();
      render();
      break;
    case 'open-reset':
      openModal('reset');
      break;
    case 'reset-all':
      resetAllData();
      break;
    case 'ob-subject':
      if (!obDraft) obDraft = buildOnboardingDraft();
      if (actionEl.dataset.subject === 'essay' && obDraft.subjects.includes('essay')) {
        showToast('Итоговое сочинение уже включено', 'Это обязательный допуск к ЕГЭ, поэтому трек нельзя убрать.', 'info');
        break;
      }
      obDraft.subjects = obDraft.subjects.includes(actionEl.dataset.subject)
        ? obDraft.subjects.filter(id => id !== actionEl.dataset.subject)
        : [...obDraft.subjects, actionEl.dataset.subject];
      resetObDiagnostic();
      render();
      break;
    case 'diag-mode': {
      const diag = ensureObDiagnostic();
      const mode = actionEl.dataset.mode === 'self' ? 'self' : 'test';
      diag.mode = mode;
      obDiagQuiz = null;
      if (mode === 'test') {
        diag.completed = Boolean(diag.result);
        diag.confirmed = Boolean(diag.result);
      } else {
        diag.completed = false;
        diag.confirmed = false;
      }
      render();
      break;
    }
    case 'diag-start':
      startObDiagQuiz();
      break;
    case 'diag-option':
      if (!obDiagQuiz || obDiagQuiz.checked) return;
      obDiagQuiz.selected = Number(actionEl.dataset.index);
      render();
      break;
    case 'diag-check': {
      if (!obDiagQuiz || obDiagQuiz.selected === null || obDiagQuiz.checked) return;
      const question = QUESTION_BY_ID[obDiagQuiz.queue[obDiagQuiz.index]];
      if (!question) return;
      const optionOrder = resolveOptionOrder(question, obDiagQuiz.orders?.[obDiagQuiz.index]);
      const originalSelected = optionOrder[obDiagQuiz.selected];
      obDiagQuiz.answers[obDiagQuiz.index] = {
        qid: question.id,
        selected: originalSelected,
        correct: originalSelected === question.correct
      };
      obDiagQuiz.checked = true;
      answerReveal.quiz = true;
      render();
      break;
    }
    case 'diag-next':
      if (!obDiagQuiz || !obDiagQuiz.checked) return;
      if (obDiagQuiz.index >= obDiagQuiz.queue.length - 1) {
        finishObDiagQuiz();
      } else {
        obDiagQuiz.index += 1;
        obDiagQuiz.selected = null;
        obDiagQuiz.checked = false;
        render();
      }
      break;
    case 'diag-exit':
      obDiagQuiz = null;
      render();
      break;
    case 'diag-restart':
      startObDiagQuiz();
      break;
    case 'diag-rate': {
      const diag = ensureObDiagnostic();
      diag.ratings[actionEl.dataset.topic] = actionEl.dataset.value || 'none';
      diag.confirmed = false;
      diag.completed = false;
      render();
      break;
    }
    case 'diag-confirm': {
      const diag = ensureObDiagnostic();
      diag.mode = 'self';
      diag.confirmed = true;
      diag.completed = true;
      render();
      break;
    }
    case 'ob-level':
      if (!obDraft) return;
      obDraft.levels[actionEl.dataset.subject] = actionEl.dataset.level;
      render();
      break;
    case 'ob-study-day':
      if (!obDraft) return;
      obDraft.studyDays = obDraft.studyDays.includes(Number(actionEl.dataset.day))
        ? obDraft.studyDays.filter(day => day !== Number(actionEl.dataset.day))
        : [...obDraft.studyDays, Number(actionEl.dataset.day)];
      render();
      break;
    case 'ob-time':
      if (!obDraft) return;
      obDraft.preferredTimes = obDraft.preferredTimes.includes(actionEl.dataset.time)
        ? obDraft.preferredTimes.filter(time => time !== actionEl.dataset.time)
        : [...obDraft.preferredTimes, actionEl.dataset.time];
      render();
      break;
    case 'ob-session':
      if (!obDraft) return;
      obDraft.sessionMinutes = Number(actionEl.dataset.minutes);
      render();
      break;
    case 'ob-tutor-day':
      if (!obDraft) return;
      obDraft.tutorDays = obDraft.tutorDays.includes(Number(actionEl.dataset.day))
        ? obDraft.tutorDays.filter(day => day !== Number(actionEl.dataset.day))
        : [...obDraft.tutorDays, Number(actionEl.dataset.day)];
      render();
      break;
    case 'ob-toggle':
      if (!obDraft) return;
      obDraft[actionEl.dataset.field] = !obDraft[actionEl.dataset.field];
      render();
      break;
    case 'ob-support': {
      if (!obDraft) return;
      const support = actionEl.dataset.support;
      if (support === 'notify') obDraft.notify = !obDraft.notify;
      else if (support === 'email') obDraft.emailNotify = !obDraft.emailNotify;
      else if (support === 'manual' || support === 'calendar') {
        obDraft.support = obDraft.support.includes(support)
          ? obDraft.support.filter(item => item !== support)
          : [...obDraft.support, support];
      }
      render();
      break;
    }
    case 'ob-back':
      if (obStep > 0) {
        obStep -= 1;
        obDirection = 'back';
        render();
        requestAnimationFrame(() => document.querySelector('[data-ob-body]')?.scrollTo(0, 0));
      }
      break;
    case 'ob-next':
      handleOnboardingNext();
      break;
    case 'ob-cancel':
      if (editingProfile) {
        obDraft = null;
        editingProfile = false;
        view = 'dashboard';
        render();
      }
      break;
    case 'strategy-subject':
      if (SUBJECTS[actionEl.dataset.subject]) {
        strategySubject = actionEl.dataset.subject;
        render();
      }
      break;
    case 'open-target':
      openTargetModal(actionEl.dataset.subject);
      break;
    case 'save-target':
      saveTarget(actionEl.dataset.subject);
      break;
    case 'pse-subject':
      if (SUBJECTS[actionEl.dataset.subject]) {
        pseSubject = actionEl.dataset.subject;
        render();
      }
      break;
    case 'open-pse-task':
      openModal('pse-task', { subject: actionEl.dataset.subject, task: Number(actionEl.dataset.task) });
      break;
    case 'open-cheatsheet':
      if (TOPIC_BY_ID[actionEl.dataset.topic]) openModal('cheatsheet', { topicId: actionEl.dataset.topic });
      break;
    case 'start-micro':
      startMicroSession(Number(actionEl.dataset.minutes));
      break;
    case 'start-surprise':
      startSurpriseExam();
      break;
    case 'open-reflection':
      scrollToReflection();
      break;
    case 'save-reflection':
      saveReflection();
      break;
    case 'mood-select':
      selectMood(Number(actionEl.dataset.level));
      break;
    case 'save-mood':
      saveMood();
      break;
    case 'open-anxiety':
      openAnxietyExercise(actionEl.dataset.exercise);
      break;
    case 'anxiety-complete':
      completeAnxiety(actionEl.dataset.exercise);
      break;
    case 'breathing-toggle':
      toggleBreathing();
      break;
    case 'schedule-file':
      document.querySelector('[data-schedule-file]')?.click();
      break;
    case 'schedule-import':
      importScheduleFromUI();
      break;
    case 'schedule-clear':
      clearSchedule();
      break;
    case 'celebration-close':
      closeCelebration();
      break;
    case 'timer-toggle':
      toggleTimer();
      break;
    default:
      break;
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (target.matches('[data-search-input]')) {
    searchState.query = target.value;
    updateSearchResults();
    return;
  }
  if (target.matches('[data-essay-search]')) {
    essayWorksQuery = target.value;
    const clear = document.querySelector('.essay-search-clear');
    if (clear) clear.hidden = !essayWorksQuery;
    const results = document.querySelector('[data-essay-results]');
    if (results) results.innerHTML = renderEssayWorksResults();
    return;
  }
  if (target.matches('[data-sync-field]')) {
    syncDraft[target.dataset.syncField] = target.value;
    if (syncMessage) syncMessage = null;
    if (target.dataset.syncField === 'server') syncHealth = null;
    return;
  }
  if (target.matches('[data-fipi-field]')) {
    if (!fipiDraft) return;
    const field = target.dataset.fipiField;
    fipiDraft[field] = ['solved', 'correct', 'minutes'].includes(field) ? Number(target.value) : target.value;
    return;
  }
  if (target.matches('[data-auth-field]')) {
    authDraft[target.dataset.authField] = target.value;
    if (authError) {
      authError = '';
      document.querySelector('.auth-error')?.remove();
    }
    return;
  }
  if (target.matches('[data-group-name]')) {
    groupNameDraft = target.value;
    return;
  }
  if (target.matches('[data-group-code]')) {
    groupJoinCode = target.value;
    return;
  }
  if (target.matches('[data-ob-field]')) {
    if (!obDraft) return;
    const field = target.dataset.obField;
    if (field === 'examYear') return;
    if (field === 'bufferDay') obDraft.bufferDay = Number(target.value);
    else obDraft[field] = target.value;
    return;
  }
  if (target.matches('[data-range="target"]')) {
    if (!obDraft) return;
    obDraft.targets[target.dataset.subject] = Number(target.value);
    const bubble = document.getElementById('ob-target-' + target.dataset.subject);
    if (bubble) bubble.textContent = target.value;
    return;
  }
  if (target.matches('[data-range="dailyMinutes"]')) {
    if (!obDraft) return;
    obDraft.dailyMinutes = Number(target.value);
    const bubble = document.getElementById('ob-daily-bubble');
    if (bubble) bubble.textContent = formatMinutes(target.value);
    return;
  }
  if (target.matches('[data-settings-field]')) {
    ensureSettingsDraft();
    if (!settingsDraft) return;
    const field = target.dataset.settingsField;
    if (field === 'dailyMinutes' || field === 'sessionMinutes' || field === 'bufferDay') {
      settingsDraft[field] = Number(target.value);
    } else {
      settingsDraft[field] = target.value;
    }
    if (field === 'dailyMinutes') {
      const bubble = document.getElementById('settings-daily-bubble');
      if (bubble) bubble.textContent = formatMinutes(target.value);
    }
    return;
  }
  if (target.matches('[data-settings-email]')) {
    state.settings.email = target.value;
    return;
  }
  if (target.matches('[data-target-range]')) {
    if (!targetDraftSubject || !SUBJECTS[targetDraftSubject]) return;
    targetDraftValue = Number(target.value);
    updateTargetPreview(targetDraftSubject, targetDraftValue);
    return;
  }
  if (target.matches('[data-reflection-text]')) {
    reflectionDraft.text = target.value;
    return;
  }
  if (target.matches('[data-mood-note]')) {
    ensureMoodDraft();
    moodDraft.note = target.value;
    return;
  }
  if (target.matches('[data-schedule-text]')) {
    scheduleText = target.value;
  }
}

function handleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target instanceof HTMLInputElement && target.matches('[data-import-json]')) {
    const file = target.files?.[0];
    target.value = '';
    if (file) handleImportFile(file);
    return;
  }
  if (target.matches('[data-trainer-filter]')) {
    const field = target.dataset.trainerFilter;
    if (field === 'doc') {
      trainerDocFilter = target.value || 'all';
      if (trainerDocFilter !== 'all' && trainerSourceFilter === 'authored') trainerSourceFilter = 'all';
    } else if (field === 'year') {
      trainerYearFilter = target.value || 'all';
      if (trainerYearFilter !== 'all' && trainerSourceFilter === 'authored') trainerSourceFilter = 'all';
    }
    render();
    return;
  }
  if (target.matches('[data-fipi-field="subject"]')) {
    ensureFipiDraft(target.value);
    fipiDraft.subject = target.value;
    fipiDraft.topicId = '';
    ensureFipiDraft(target.value);
    render();
    return;
  }
  if (target.matches('[data-fipi-field="topicId"]')) {
    if (!fipiDraft) return;
    fipiDraft.topicId = target.value;
    return;
  }
  if (target.matches('[data-ob-field]') && target.dataset.obField === 'examYear') {
    if (!obDraft) return;
    const year = Number(target.value);
    obDraft.examYear = year;
    obDraft.examDates = examDatesForYear(year);
    render();
    showToast('Год обновлён', 'Даты экзаменов пересчитаны. Проверьте их в настройках.', 'info');
    return;
  }
  if (target.matches('[data-ob-field]')) {
    if (!obDraft) return;
    const field = target.dataset.obField;
    obDraft[field] = field === 'bufferDay' ? Number(target.value) : target.value;
    return;
  }
  if (target.matches('[data-settings-field]')) {
    ensureSettingsDraft();
    if (!settingsDraft) return;
    const field = target.dataset.settingsField;
    settingsDraft[field] = ['dailyMinutes', 'sessionMinutes', 'bufferDay'].includes(field) ? Number(target.value) : target.value;
    return;
  }
  if (target.matches('[data-settings-email]')) {
    state.settings.email = target.value;
    saveState();
    return;
  }
  if (target.matches('[data-reflection-topic]')) {
    reflectionDraft.topicId = target.value;
    return;
  }
  if (target.matches('[data-schedule-source]')) {
    scheduleSource = target.value;
    return;
  }
  if (target instanceof HTMLInputElement && target.matches('[data-schedule-file]')) {
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      scheduleText = String(reader.result || '');
      const textarea = document.querySelector('[data-schedule-text]');
      if (textarea) textarea.value = scheduleText;
      applyScheduleImport(scheduleText, scheduleSource);
    };
    reader.onerror = () => showToast('Не удалось прочитать файл', 'Сохраните расписание как .txt в UTF-8 и попробуйте снова.', 'warn');
    reader.readAsText(file, 'utf-8');
  }
}

function init() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('submit', event => {
    if (!event.target.matches('[data-auth-form]')) return;
    event.preventDefault();
    handleAuthSubmit();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') {
      event.preventDefault();
      if (currentUser && state.onboarded) openSearch();
      return;
    }
    if (modal?.type === 'visual' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      stepVisual(event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key !== 'Escape') return;
    if (modal) closeModal();
    else if (celebrationCurrent) closeCelebration();
  });
  setupPWA();
  applyTheme(currentTheme(), false);
  authMode = readAccounts().users.length ? 'login' : 'register';
  const user = readSessionUser();
  if (user) {
    startUserSession(user, { silent: true });
    return;
  }
  render();
}

init();
