/* Фильтры тем, сессии ФИПИ, повторение и PWA. */
'use strict';

/* === Фильтры тем === */

function topicFilterMatches(topic) {
  if (topicFilter === 'all') return true;
  const progress = state.progress.topics[topic.id] || {};
  if (topicFilter === 'weak') {
    const best = Number(progress.best || 0);
    const hasMistake = Object.values(state.progress.mistakes || {}).some(item => QUESTION_BY_ID[item.questionId]?.topicId === topic.id);
    const due = progress.sm2?.due && progress.sm2.due <= toISO(new Date());
    return Boolean(hasMistake || due || (Number(progress.attempts || 0) > 0 && best < 60));
  }
  if (topicFilter === 'theory') return !progress.theory;
  if (topicFilter === 'no-practice') return !progress.practice;
  return true;
}

function topicFilterCounts(topics) {
  return {
    all: topics.length,
    weak: topics.filter(topic => {
      const progress = state.progress.topics[topic.id] || {};
      const best = Number(progress.best || 0);
      const hasMistake = Object.values(state.progress.mistakes || {}).some(item => QUESTION_BY_ID[item.questionId]?.topicId === topic.id);
      const due = progress.sm2?.due && progress.sm2.due <= toISO(new Date());
      return Boolean(hasMistake || due || (Number(progress.attempts || 0) > 0 && best < 60));
    }).length,
    theory: topics.filter(topic => !state.progress.topics[topic.id]?.theory).length,
    noPractice: topics.filter(topic => !state.progress.topics[topic.id]?.practice).length
  };
}

function renderTopicFilterChips(topics) {
  const counts = topicFilterCounts(topics);
  const items = [
    ['all', 'Все', counts.all],
    ['weak', 'Слабые', counts.weak],
    ['theory', 'Ждут теории', counts.theory],
    ['no-practice', 'Без практики', counts.noPractice]
  ];
  return '<div class="topic-filters">' + items.map(([id, label, count]) => (
    '<button class="topic-filter' + (topicFilter === id ? ' active' : '') + '" data-action="topic-filter" data-filter="' + id + '">' + label + '<b>' + count + '</b></button>'
  )).join('') + '</div>';
}

/* === Официальные задания ФИПИ: выборка, счётчики и изображения === */

function fipiSourceForQuestion(question) {
  if (!question || question.source !== 'fipi' || typeof FIPI_SOURCES === 'undefined') return null;
  return FIPI_SOURCES[question.sourceId] || null;
}

function fipiSourceKindLabel(question) {
  const source = fipiSourceForQuestion(question);
  if (!source) return '';
  return (typeof FIPI_SOURCE_KIND_LABELS !== 'undefined' && FIPI_SOURCE_KIND_LABELS[source.kind]) || source.label || '';
}

function fipiSourcesForSubject(subjectId) {
  if (typeof FIPI_SOURCES === 'undefined') return [];
  return Object.values(FIPI_SOURCES)
    .filter(source => source.subject === subjectId)
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0) || String(a.label).localeCompare(String(b.label)));
}

function fipiYearsForSubject(subjectId) {
  return [...new Set(fipiSourcesForSubject(subjectId).map(source => Number(source.year)).filter(Boolean))]
    .sort((a, b) => b - a);
}

function fipiQuestionMatchesFilters(question) {
  if (!question) return false;
  if (trainerSourceFilter === 'fipi' && question.source !== 'fipi') return false;
  if (trainerSourceFilter === 'authored' && question.source === 'fipi') return false;
  if (trainerDocFilter !== 'all' && question.sourceId !== trainerDocFilter) return false;
  if (trainerYearFilter !== 'all' && String(question.sourceYear || '') !== String(trainerYearFilter)) return false;
  return true;
}

function topicSourceCounts(topic) {
  const questions = topic?.questions || [];
  const fipi = questions.filter(question => question.source === 'fipi').length;
  return { all: questions.length, fipi, authored: questions.length - fipi };
}

function trainerQuestionsForTopic(topicId) {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return [];
  return topic.questions.filter(fipiQuestionMatchesFilters).map(question => question.id);
}

function fipiMediaForQuestion(question) {
  if (!question || typeof FIPI_MEDIA === 'undefined') return [];
  return (question.media || []).map(id => FIPI_MEDIA[id]).filter(Boolean);
}

/* === ФИПИ-сессии: самопроверка по официальному банку === */

function fipiStats() {
  const sessions = state.progress.fipiSessions || [];
  const solved = sessions.reduce((sum, item) => sum + Number(item.solved || 0), 0);
  const correct = sessions.reduce((sum, item) => sum + Number(item.correct || 0), 0);
  return { sessions: sessions.length, solved, correct, accuracy: solved ? Math.round(correct / solved * 100) : 0 };
}

function ensureFipiDraft(subjectId) {
  const subject = SUBJECTS[subjectId] ? subjectId : (fipiDraft?.subject && SUBJECTS[fipiDraft.subject] ? fipiDraft.subject : (profileSubjects()[0] || SUBJECT_ORDER[0]));
  const topics = topicsForSubject(subject);
  if (!fipiDraft) {
    fipiDraft = { subject, topicId: topics[0]?.id || '', solved: 5, correct: 4, minutes: 15, originSessionId: null };
  }
  if (!SUBJECTS[fipiDraft.subject]) fipiDraft.subject = subject;
  if (fipiDraft.subject !== subject) fipiDraft.subject = subject;
  if (!topics.some(topic => topic.id === fipiDraft.topicId)) fipiDraft.topicId = topics[0]?.id || '';
  return fipiDraft;
}

function openFipiSession(subjectId, sessionId) {
  fipiDraft = null;
  ensureFipiDraft(subjectId);
  fipiDraft.originSessionId = sessionId || null;
  openModal('fipi-session');
}

function renderFipiSessionModal() {
  const draft = ensureFipiDraft();
  const topics = topicsForSubject(draft.subject);
  const subject = SUBJECTS[draft.subject];
  const stats = fipiStats();
  return '' +
    '<div class="modal" role="dialog" aria-modal="true" aria-label="Отметить работу с банком ФИПИ">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('bank') + '</div><div><h2>Работа с банком ФИПИ</h2><p>Решите задания на официальном сайте и внесите результат. Это честная самопроверка, а не копия заданий.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="notice">' + icon('info') + '<div><b>Сначала первоисточник.</b> ' + externalLink(fipiSubjectUrl(draft.subject), 'Откройте банк ФИПИ по предмету «' + escapeHTML(subject.short) + '»') + ', решите задания и вернитесь сюда с результатом.</div></div>' +
        '<div class="fipi-session-form">' +
          '<div><label>Предмет</label><select data-fipi-field="subject">' + profileSubjects().map(id => '<option value="' + id + '"' + (id === draft.subject ? ' selected' : '') + '>' + escapeHTML(SUBJECTS[id].short) + '</option>').join('') + '</select></div>' +
          '<div><label>Тема</label><select data-fipi-field="topicId">' + topics.map(topic => '<option value="' + topic.id + '"' + (topic.id === draft.topicId ? ' selected' : '') + '>' + escapeHTML(topic.title) + '</option>').join('') + '</select></div>' +
          '<div><label>Решено заданий</label><input type="number" min="1" max="20" step="1" value="' + draft.solved + '" data-fipi-field="solved"></div>' +
          '<div><label>Верно</label><input type="number" min="0" max="20" step="1" value="' + draft.correct + '" data-fipi-field="correct"></div>' +
          '<div class="full"><label>Потрачено минут</label><input type="number" min="1" max="240" step="1" value="' + draft.minutes + '" data-fipi-field="minutes"></div>' +
        '</div>' +
        '<div class="fipi-session-summary"><div class="fipi-session-stat"><b>' + stats.sessions + '</b><small>сессий всего</small></div><div class="fipi-session-stat"><b>' + stats.solved + '</b><small>заданий решено</small></div><div class="fipi-session-stat"><b>' + stats.accuracy + '%</b><small>точность</small></div></div>' +
        '<div class="sync-note">Результат попадёт в прогресс темы, журнал ошибок не пополнится автоматически, а повторение получит качество по проценту верных ответов.</div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Без перепечатки заданий ФИПИ.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" data-action="save-fipi-session">' + icon('check') + 'Сохранить результат</button></div></div>' +
    '</div>';
}

function saveFipiSession() {
  const draft = ensureFipiDraft();
  const solved = clamp(Math.floor(Number(draft.solved) || 0), 1, 20);
  const correct = clamp(Math.floor(Number(draft.correct) || 0), 0, solved);
  const minutes = clamp(Math.floor(Number(draft.minutes) || 0), 1, 240);
  const topic = TOPIC_BY_ID[draft.topicId];
  const date = toISO(new Date());
  const percent = Math.round(correct / solved * 100);
  state.progress.fipiSessions.push({
    id: 'fipi-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    date,
    subject: draft.subject,
    topicId: topic?.id || null,
    solved,
    correct,
    minutes,
    at: new Date().toISOString()
  });
  state.progress.fipiSessions = state.progress.fipiSessions.slice(-400);
  if (topic) {
    const progress = topicProgress(topic.id);
    progress.practice = true;
    progress.attempts = Number(progress.attempts || 0) + 1;
    progress.best = Math.max(Number(progress.best || 0), percent);
    progress.lastPractice = new Date().toISOString();
    const quality = percent >= 90 ? 5 : percent >= 75 ? 4 : percent >= 55 ? 3 : 2;
    sm2Review(topic.id, quality);
  }
  state.progress.quizHistory.push({
    date: new Date().toISOString(),
    subject: draft.subject,
    topicId: topic?.id || null,
    mode: 'fipi',
    total: solved,
    correct
  });
  if (draft.originSessionId) {
    const session = (state.plan?.sessions || []).find(item => item.id === draft.originSessionId);
    if (session && !sessionIsDone(session.id)) completeSessionInternal(session.id, { noActivity: true });
  }
  addActivity(minutes, date);
  saveState();
  modal = null;
  fipiDraft = null;
  render();
  showToast('Результат сохранён', correct + ' из ' + solved + ' · ' + percent + '%. Тема обновлена, повторение перенесено по SM-2.', 'success');
}

/* === Повторение и пробники === */

function renderReviewCard() {
  const due = dueReviewTopics(6);
  if (!due.length) return '';
  const total = dueReviewTopics().length;
  return '' +
    '<section class="review-card">' +
      '<div class="review-head"><div><b>Пора повторить · ' + total + '</b><small>Адаптивное повторение само решает, когда вернуть тему. Сначала — самые просроченные.</small></div><button class="btn btn-primary btn-sm" data-action="review-due">' + icon('rotate') + 'Повторить всё</button></div>' +
      '<div class="review-list">' + due.map(item => (
        '<div class="review-row"><b>' + escapeHTML(item.topic.title) + '</b><small>' + escapeHTML(SUBJECTS[item.topic.subject].short) + ' · ' + (item.overdueDays ? 'просрочено на ' + item.overdueDays + ' ' + pluralize(item.overdueDays, ['день', 'дня', 'дней']) : 'сегодня') + '</small><button data-action="start-practice" data-topic="' + item.topic.id + '">' + icon('play') + ' Повторить</button></div>'
      )).join('') + '</div>' +
    '</section>';
}

function mockQueueForSubject(subjectId, count) {
  const target = Math.max(1, Number(count) || 12);
  const questions = allQuestionsForSubject(subjectId);
  if (!questions.length) return [];
  const byTopic = {};
  questions.forEach(question => {
    if (!byTopic[question.topicId]) byTopic[question.topicId] = [];
    byTopic[question.topicId].push(question.id);
  });
  const topicIds = shuffle(Object.keys(byTopic)).sort((a, b) => {
    const bestA = Number(state.progress.topics[a]?.best || 0);
    const bestB = Number(state.progress.topics[b]?.best || 0);
    return bestA - bestB;
  });
  Object.keys(byTopic).forEach(id => { byTopic[id] = shuffle(byTopic[id]); });
  const queue = [];
  let round = 0;
  while (queue.length < Math.min(target, questions.length) && round < 30) {
    topicIds.forEach(id => {
      if (queue.length >= Math.min(target, questions.length)) return;
      const next = byTopic[id][round];
      if (next && !queue.includes(next)) queue.push(next);
    });
    round += 1;
  }
  return queue;
}

/* === PWA === */

function isStandaloneApp() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone
  );
}

function setupPWA() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js', { scope: './' }).then(registration => {
    pwaRegistration = registration;
    registration.update?.();
  }).catch(() => {});
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pwaInstallPrompt = event;
    pwaInstallAvailable = true;
    if (currentUser && view !== 'trainer' && !modal) render();
  });
  window.addEventListener('appinstalled', () => {
    pwaInstallPrompt = null;
    pwaInstallAvailable = false;
    showToast('Приложение установлено', '«Фокус ЕГЭ» теперь открывается с рабочего стола.', 'success');
    render();
  });
}

async function promptPWAInstall() {
  if (pwaInstallPrompt) {
    const prompt = pwaInstallPrompt;
    pwaInstallPrompt = null;
    pwaInstallAvailable = false;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } catch (error) {}
    render();
    return;
  }
  showToast('Как установить приложение', 'Chrome и Edge: меню ⋮ → «Установить приложение». Safari на iPhone: «Поделиться» → «На экран Домой».', 'info');
}

function renderPwaBanner() {
  if (isStandaloneApp() || !pwaInstallAvailable) return '';
  return '' +
    '<div class="pwa-banner">' +
      '<span class="pwa-ico">' + icon('install') + '</span>' +
      '<div><b>Установите «Фокус» как приложение</b><small>Открывается с рабочего стола, работает офлайн и выглядит как отдельное приложение.</small></div>' +
      '<button class="btn btn-primary btn-sm" data-action="pwa-install">' + icon('install') + 'Установить</button>' +
    '</div>';
}
