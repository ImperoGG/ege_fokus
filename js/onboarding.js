/* Онбординг, диагностика и предварительный план. */
'use strict';

function emptyDiagnosticState() {
  return { mode: 'test', ratings: {}, confirmed: false, completed: false, result: null, prior: false };
}

function diagnosticFromProgress() {
  const prior = state.progress.diagnostic;
  if (!prior?.completedAt) return emptyDiagnosticState();
  return {
    mode: prior.mode === 'self' ? 'self' : 'test',
    ratings: { ...(prior.ratings || {}) },
    confirmed: true,
    completed: true,
    result: prior.result ? JSON.parse(JSON.stringify(prior.result)) : null,
    prior: true
  };
}

function ensureObDiagnostic() {
  if (!obDraft) obDraft = buildOnboardingDraft();
  if (!obDraft.diagnostic) obDraft.diagnostic = emptyDiagnosticState();
  return obDraft.diagnostic;
}

function diagnosticSubjects() {
  return (obDraft?.subjects || []).filter(id => SUBJECTS[id]);
}

function buildDiagnosticQueue() {
  const subjects = diagnosticSubjects();
  if (!subjects.length) return [];
  const target = 15;
  const base = Math.floor(target / subjects.length);
  const extra = target % subjects.length;
  const perSubject = subjects.map((subjectId, index) => {
    const quota = base + (index < extra ? 1 : 0);
    const topicPools = shuffle(topicsForSubject(subjectId))
      .map(topic => topic.questions.filter(question => question.source !== 'fipi').map(question => question.id))
      .filter(pool => pool.length);
    const picked = [];
    let round = 0;
    while (picked.length < quota && round < 4) {
      topicPools.forEach(pool => {
        if (pool[round] && picked.length < quota) picked.push(pool[round]);
      });
      round += 1;
    }
    return picked;
  });
  const queue = [];
  const maxLen = Math.max(0, ...perSubject.map(list => list.length));
  for (let index = 0; index < maxLen; index += 1) {
    perSubject.forEach(list => {
      if (list[index] && queue.length < target) queue.push(list[index]);
    });
  }
  return [...new Set(queue)];
}

function startObDiagQuiz() {
  const diag = ensureObDiagnostic();
  const queue = buildDiagnosticQueue();
  if (!queue.length) {
    showToast('Нет вопросов', 'Выберите хотя бы один предмет с заданиями.', 'warn');
    return;
  }
  diag.mode = 'test';
  diag.confirmed = false;
  diag.completed = false;
  diag.result = null;
  obDiagQuiz = { queue, index: 0, selected: null, checked: false, answers: [], orders: queue.map(id => shuffledOptionOrder(QUESTION_BY_ID[id])), finished: false };
  render();
  requestAnimationFrame(() => document.querySelector('[data-ob-body]')?.scrollTo(0, 0));
}

function finishObDiagQuiz() {
  if (!obDiagQuiz) return;
  const diag = ensureObDiagnostic();
  const total = obDiagQuiz.queue.length;
  const answers = obDiagQuiz.answers.filter(Boolean);
  const correct = answers.filter(answer => answer.correct).length;
  const bySubject = {};
  const detailedAnswers = answers.map((answer, index) => {
    const question = QUESTION_BY_ID[obDiagQuiz.queue[index]];
    if (!question) return null;
    if (!bySubject[question.subject]) bySubject[question.subject] = { correct: 0, total: 0 };
    bySubject[question.subject].total += 1;
    if (answer.correct) bySubject[question.subject].correct += 1;
    return { qid: question.id, selected: answer.selected, correct: answer.correct };
  }).filter(Boolean);
  diag.result = {
    total,
    correct,
    percent: total ? Math.round(correct / total * 100) : 0,
    bySubject,
    answers: detailedAnswers,
    finishedAt: new Date().toISOString()
  };
  diag.completed = true;
  diag.confirmed = true;
  diag.mode = 'test';
  obDiagQuiz.finished = true;
  render();
  requestAnimationFrame(() => document.querySelector('[data-ob-body]')?.scrollTo(0, 0));
}

function resetObDiagnostic() {
  const current = ensureObDiagnostic();
  obDraft.diagnostic = { ...emptyDiagnosticState(), mode: current.mode };
  obDiagQuiz = null;
}

function applyDiagnosticProgress(diag) {
  if (!diag) return;
  const profile = state.profile;
  if (!profile) return;
  const now = new Date().toISOString();
  const allowed = id => Boolean(TOPIC_BY_ID[id]) && profile.subjects.includes(TOPIC_BY_ID[id].subject);
  Object.entries(diag.ratings || {}).forEach(([topicId, rating]) => {
    if (!allowed(topicId) || rating === 'none') return;
    const progress = topicProgress(topicId);
    if (rating === 'know') {
      progress.theory = true;
      progress.practice = true;
      progress.best = Math.max(Number(progress.best || 0), 82);
      progress.attempts = Math.max(Number(progress.attempts || 0), 1);
    } else if (rating === 'tried') {
      progress.theory = true;
      progress.best = Math.max(Number(progress.best || 0), 52);
      progress.attempts = Math.max(Number(progress.attempts || 0), 1);
    }
    progress.diagnostic = rating;
  });
  const answers = diag.result?.answers || [];
  const byTopic = {};
  answers.forEach(answer => {
    const question = QUESTION_BY_ID[answer.qid];
    if (!question || !profile.subjects.includes(question.subject)) return;
    if (!byTopic[question.topicId]) byTopic[question.topicId] = { correct: 0, total: 0 };
    byTopic[question.topicId].total += 1;
    if (answer.correct) byTopic[question.topicId].correct += 1;
  });
  Object.entries(byTopic).forEach(([topicId, stats]) => {
    const progress = topicProgress(topicId);
    const accuracy = (stats.correct + 0.5) / (stats.total + 1);
    progress.practice = true;
    progress.attempts = Math.max(Number(progress.attempts || 0), 1);
    progress.best = Math.max(Number(progress.best || 0), Math.min(90, Math.round(accuracy * 100)));
    if (accuracy >= 0.5) progress.theory = true;
    progress.lastPractice = progress.lastPractice || now;
    progress.diagnostic = 'test';
  });
  const bySubject = diag.result?.bySubject || {};
  Object.entries(bySubject).forEach(([subjectId, stats]) => {
    if (!SUBJECTS[subjectId] || !stats.total) return;
    state.progress.quizHistory.push({
      date: now,
      subject: subjectId,
      topicId: null,
      mode: 'diagnostic',
      total: stats.total,
      correct: stats.correct
    });
  });
  const selectedTopics = profile.subjects.flatMap(subjectId => topicsForSubject(subjectId));
  const summary = diag.mode === 'self'
    ? {
        know: selectedTopics.filter(topic => diag.ratings?.[topic.id] === 'know').length,
        tried: selectedTopics.filter(topic => diag.ratings?.[topic.id] === 'tried').length,
        none: selectedTopics.filter(topic => !diag.ratings?.[topic.id] || diag.ratings[topic.id] === 'none').length,
        total: selectedTopics.length
      }
    : {
        correct: diag.result?.correct || 0,
        total: diag.result?.total || 0,
        percent: diag.result?.percent || 0
      };
  state.progress.diagnostic = {
    completedAt: now,
    mode: diag.mode,
    ratings: { ...(diag.ratings || {}) },
    result: diag.result ? JSON.parse(JSON.stringify(diag.result)) : null,
    summary
  };
}

function renderObDiagQuiz() {
  const quiz = obDiagQuiz;
  const question = QUESTION_BY_ID[quiz.queue[quiz.index]];
  if (!question) return '';
  const topic = TOPIC_BY_ID[question.topicId];
  const subject = SUBJECTS[question.subject];
  const answer = quiz.answers[quiz.index];
  const isLast = quiz.index >= quiz.queue.length - 1;
  const progress = Math.round(quiz.index / quiz.queue.length * 100);
  const optionOrder = resolveOptionOrder(question, quiz.orders?.[quiz.index]);
  const correctDisplayIndex = optionOrder.indexOf(question.correct);
  return '' +
    '<div class="diag-quiz-wrap">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="ob-label" style="margin:0">Вопрос ' + (quiz.index + 1) + ' из ' + quiz.queue.length + '</span><button class="section-link" data-action="diag-exit">' + icon('x') + 'Прервать</button></div>' +
      '<div class="quiz-progress" style="margin-top:9px"><span style="width:' + progress + '%"></span></div>' +
      '<div class="quiz-card" style="box-shadow:none;padding:22px;margin-top:14px">' +
        '<div class="quiz-meta"><span class="quiz-qnum">' + (quiz.index + 1) + '</span><span class="tag brand">' + escapeHTML(subject.short) + '</span><span class="tag">' + escapeHTML(topic ? topic.title : 'Диагностика') + '</span></div>' +
        '<div class="quiz-question" style="font-size:17px">' + escapeHTML(question.text) + '</div>' +
        '<div class="quiz-options">' + optionOrder.map((originalIndex, index) => {
          let className = 'quiz-option';
          if (quiz.checked) {
            className += ' disabled';
            if (index === correctDisplayIndex) className += ' correct';
            else if (index === quiz.selected) className += ' wrong';
          } else if (index === quiz.selected) className += ' selected';
          return '<button class="' + className + '" data-action="diag-option" data-index="' + index + '"><span class="option-letter">' + ['А', 'Б', 'В', 'Г'][index] + '</span><span>' + escapeHTML(question.options[originalIndex]) + '</span></button>';
        }).join('') + '</div>' +
        (quiz.checked && answer ? '<div class="quiz-explanation ' + (answer.correct ? 'good' : 'bad') + '"><div class="quiz-explanation-top">' + icon(answer.correct ? 'checkCircle' : 'alert') + (answer.correct ? 'Верно' : 'Неверно. Правильный ответ — ' + ['А', 'Б', 'В', 'Г'][correctDisplayIndex]) + '</div><p>' + escapeHTML(question.explanation) + '</p></div>' : '') +
        '<div class="quiz-footer"><span class="hint">' + icon('info') + (quiz.checked ? 'Диагностика не влияет на оценку — только на стартовый маршрут.' : 'Отвечайте честно: это настройка плана, а не экзамен.') + '</span>' +
          (quiz.checked
            ? '<button class="btn btn-primary btn-sm" data-action="diag-next">' + (isLast ? 'Показать результат' : 'Следующий вопрос') + icon('arrowRight') + '</button>'
            : '<button class="btn btn-primary btn-sm" data-action="diag-check"' + (quiz.selected === null ? ' disabled' : '') + '>' + icon('check') + 'Ответить</button>') +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderObDiagResult(diag) {
  const result = diag.result;
  if (!result) return '';
  const subjectRows = Object.entries(result.bySubject || {}).map(([subjectId, stats]) => (
    '<div class="summary-item"><small>' + escapeHTML(SUBJECTS[subjectId]?.short || subjectId) + '</small><b>' + stats.correct + ' / ' + stats.total + ' · ' + Math.round(stats.correct / Math.max(1, stats.total) * 100) + '%</b></div>'
  )).join('');
  return '' +
    '<div class="diag-result"><div class="diag-result-score">' + result.percent + '%</div><div><b>' + (result.percent >= 70 ? 'Уверенная стартовая точка' : result.percent >= 40 ? 'База есть, есть что укрепить' : 'Честная точка старта — уже хорошо') + '</b><small>' + result.correct + ' верных из ' + result.total + '. Результат уже учтён в стартовом прогрессе и плане.</small></div><button class="btn btn-secondary btn-sm" data-action="diag-restart">' + icon('rotate') + 'Пройти заново</button></div>' +
    (subjectRows ? '<div class="summary-grid" style="margin-top:14px">' + subjectRows + '</div>' : '') +
    '<div class="notice" style="margin-top:14px">' + icon('chart') + '<div>Темы, которые не попали в тест, останутся в плане как новые. Если хотите уточнить их сразу — переключитесь на самооценку.</div></div>' +
    '<div style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-action="diag-mode" data-mode="self">' + icon('list') + 'Уточнить темы самооценкой</button></div>';
}

function renderObDiagSelf(diag) {
  const subjects = diagnosticSubjects();
  return '' +
    '<div class="notice" style="margin-bottom:14px">' + icon('info') + '<div>Отметьте темы, которые уже пробовали. Всё без отметки считается «не решал» — это нормально и не влияет на отношение к вам.</div></div>' +
    subjects.map((subjectId, subjectIndex) => {
      const subject = SUBJECTS[subjectId];
      const topics = topicsForSubject(subjectId);
      const marked = topics.filter(topic => diag.ratings?.[topic.id] === 'know' || diag.ratings?.[topic.id] === 'tried').length;
      return '' +
        '<details class="diag-subject"' + (subjectIndex === 0 ? ' open' : '') + '>' +
          '<summary><span class="subject-mark">' + subject.icon + '</span><b>' + escapeHTML(subject.name) + '</b><small>' + (marked ? marked + ' отмечено' : 'по умолчанию «не решал»') + '</small>' + icon('chevronDown') + '</summary>' +
          '<div class="diag-topic-list">' + topics.map(topic => {
            const rating = diag.ratings?.[topic.id] || 'none';
            return '' +
              '<div class="diag-topic-row"><div style="min-width:0"><b>' + escapeHTML(topic.title) + '</b><small>' + escapeHTML(topic.examTasks) + '</small></div>' +
                '<div class="diag-seg">' +
                  '<button class="' + (rating === 'know' ? 'active' : '') + '" data-rating="know" data-action="diag-rate" data-topic="' + topic.id + '" data-value="know">уверенно</button>' +
                  '<button class="' + (rating === 'tried' ? 'active' : '') + '" data-rating="tried" data-action="diag-rate" data-topic="' + topic.id + '" data-value="tried">пробовал</button>' +
                  '<button class="' + (rating === 'none' ? 'active' : '') + '" data-rating="none" data-action="diag-rate" data-topic="' + topic.id + '" data-value="none">не решал</button>' +
                '</div>' +
              '</div>';
          }).join('') + '</div>' +
        '</details>';
    }).join('') +
    '<div class="diag-confirm' + (diag.confirmed ? ' confirmed' : '') + '"><span class="diag-mode-ico" style="margin:0">' + icon(diag.confirmed ? 'checkCircle' : 'check') + '</span><div><b>' + (diag.confirmed ? 'Самооценка подтверждена' : 'Подтвердите стартовую картину') + '</b><small>' + (diag.confirmed ? 'Можно переходить к целям. Оценки можно изменить позже в профиле.' : 'Темы без отметки будут считаться «не решал». Уже пройденный прогресс не обнулится.') + '</small></div>' + (diag.confirmed ? '<span class="badge mint">готово</span>' : '<button class="btn btn-primary btn-sm" data-action="diag-confirm">' + icon('check') + 'Подтвердить</button>') + '</div>';
}

function renderObStepDiagnostic() {
  const diag = ensureObDiagnostic();
  const subjects = diagnosticSubjects();
  const queueLength = buildDiagnosticQueue().length;
  return '' +
    '<span class="eyebrow">Шаг 2 · Диагностика</span>' +
    '<h2>С чего вы стартуете?</h2>' +
    '<p class="ob-sub">Это обязательный, но короткий шаг: 15 вопросов или спокойная самооценка по темам. Нужен не для оценки, а чтобы план не начинался с нуля и не заставлял учить уже знакомое.</p>' +
    '<div class="ob-diag-modes">' +
      '<button class="diag-mode' + (diag.mode === 'test' ? ' active' : '') + '" data-action="diag-mode" data-mode="test"><span class="diag-mode-ico">' + icon('target') + '</span><span class="diag-badge">рекомендуем</span><b>Быстрый тест</b><small>' + (queueLength || 15) + ' вопросов по выбранным предметам · примерно 6–8 минут. Результат настроит темы и прогноз.</small></button>' +
      '<button class="diag-mode' + (diag.mode === 'self' ? ' active' : '') + '" data-action="diag-mode" data-mode="self"><span class="diag-mode-ico">' + icon('list') + '</span><b>Самооценка по темам</b><small>Без теста: отметьте, что уже решали. По умолчанию — «не решал». Нужно явно подтвердить.</small></button>' +
    '</div>' +
    (diag.mode === 'test'
      ? (obDiagQuiz && !obDiagQuiz.finished
        ? renderObDiagQuiz()
        : diag.result && diag.completed
          ? renderObDiagResult(diag)
          : '<div class="card pad" style="margin-top:16px;box-shadow:none"><div class="card-head"><div><h3>Короткая проверка уровня</h3><p>Вопросы идут по темам выбранных предметов. После каждого — короткое объяснение.</p></div><span class="badge brand">' + (queueLength || 15) + ' вопросов</span></div><div class="settings-row"><div><b>Что будет дальше</b><small>Верные ответы поднимут стартовый прогресс тем, ошибки — оставят их в приоритете. План пересоберётся автоматически.</small></div></div><div class="settings-row"><div><b>Можно прервать</b><small>Ответы до завершения не применятся — вернётесь к тесту позже.</small></div></div><div class="settings-actions" style="margin-top:14px"><button class="btn btn-primary btn-sm" data-action="diag-start">' + icon('play') + 'Начать тест · ' + (queueLength || 15) + ' вопросов</button></div></div>')
      : renderObDiagSelf(diag)) +
    '<div class="level-hint">' + icon('lock') + '<span>Диагностика не отправляется на сервер и не сравнивается с другими. Она нужна только для вашего маршрута.</span></div>';
}

function buildOnboardingDraft() {
  const profile = state.profile;
  const examYear = profile?.examYear || resolveExamYear();
  const generatedDates = examDatesForYear(examYear);
  const selected = profile?.subjects?.filter(id => SUBJECTS[id]) || ['essay'];
  const targets = {};
  const levels = {};
  SUBJECT_ORDER.forEach(id => {
    targets[id] = Number(profile?.targets?.[id] || (id === 'essay' ? 5 : 80));
    levels[id] = profile?.levels?.[id] || 'basic';
  });
  return {
    name: profile?.name || currentUser?.name || '',
    subjects: [...selected],
    targets,
    levels,
    examYear,
    examDates: { ...generatedDates, ...(profile?.examDates || {}) },
    studyDays: [...(profile?.studyDays || [1, 2, 3, 4, 5, 6])].map(Number),
    dailyMinutes: Number(profile?.dailyMinutes || 90),
    sessionMinutes: Number(profile?.sessionMinutes || 45),
    preferredTimes: [...(profile?.preferredTimes || DEFAULT_PREFERRED_TIMES)],
    schoolEnd: profile?.schoolEnd || '15:00',
    tutorDays: [...(profile?.tutorDays || [])].map(Number),
    tutorTime: profile?.tutorTime || '17:00',
    sleepStart: profile?.sleepStart || '23:00',
    bufferDay: Number(profile?.bufferDay || 7),
    miniMocks: profile?.miniMocks !== undefined ? Boolean(profile.miniMocks) : true,
    spacedReview: profile?.spacedReview !== undefined ? Boolean(profile.spacedReview) : true,
    notify: Boolean(state.settings.notify),
    emailNotify: Boolean(state.settings.emailNotify),
    email: state.settings.email || '',
    support: ['manual', 'calendar'],
    diagnostic: diagnosticFromProgress()
  };
}

function draftProfile(draft) {
  const examDates = {};
  draft.subjects.forEach(id => {
    examDates[id] = draft.examDates[id] || examDatesForYear(draft.examYear)[id];
  });
  const targets = {};
  const levels = {};
  draft.subjects.forEach(id => {
    targets[id] = Number(draft.targets[id] || (id === 'essay' ? 5 : 80));
    levels[id] = draft.levels[id] || 'basic';
  });
  return {
    name: String(draft.name || '').trim() || 'Ученик',
    subjects: [...draft.subjects],
    targets,
    levels,
    examYear: draft.examYear,
    examDates,
    studyDays: [...draft.studyDays].map(Number).sort(),
    dailyMinutes: Number(draft.dailyMinutes),
    sessionMinutes: Number(draft.sessionMinutes),
    preferredTimes: [...draft.preferredTimes].sort(),
    schoolEnd: draft.schoolEnd,
    tutorDays: [...draft.tutorDays].map(Number),
    tutorTime: draft.tutorTime,
    sleepStart: draft.sleepStart,
    bufferDay: Number(draft.bufferDay),
    miniMocks: Boolean(draft.miniMocks),
    spacedReview: Boolean(draft.spacedReview)
  };
}

function renderObAside() {
  const draft = obDraft;
  const selected = draft.subjects.map(id => SUBJECTS[id]);
  const previewTopic = topWeakTopics(1)[0];
  const previewSubject = previewTopic && draft.subjects.includes(previewTopic.subject) ? previewTopic.subject : draft.subjects[0];
  const firstDate = draft.subjects
    .map(id => draft.examDates[id])
    .filter(Boolean)
    .sort()[0];
  return '' +
    '<aside class="ob-aside">' +
      '<div class="brand"><span class="brand-mark"><img src="icons/icon-192.png" alt="" width="40" height="40"></span><span class="brand-name">Фокус<small>ЕГЭ ' + draft.examYear + '</small></span></div>' +
      '<div class="ob-aside-inner">' +
        '<h1>Меньше хаоса.<br><span>Больше фокуса.</span></h1>' +
        '<p>Соберём реалистичный маршрут до экзаменов и итогового сочинения: по темам, с учётом школы, репетиторов и сна. Короткая диагностика покажет, что уже знакомо, чтобы не начинать с нуля.</p>' +
        '<div class="ob-preview">' +
          '<div class="ob-preview-head"><span>Ваш маршрут</span><span>' + (selected.length ? selected.length + ' ' + pluralize(selected.length, ['предмет', 'предмета', 'предметов']) : 'ещё не выбран') + '</span></div>' +
          (previewSubject ? '' +
            '<div class="ob-mini-session"><span class="mini-ico" style="' + sessionSubjectStyle(previewSubject) + '">' + SUBJECTS[previewSubject].icon + '</span><span><b>' + escapeHTML(previewTopic && previewTopic.subject === previewSubject ? previewTopic.title : (topicsForSubject(previewSubject)[0]?.title || 'Стартовая тема')) + '</b><small>Первый шаг · теория и практика</small></span><span class="mini-time">' + (draft.preferredTimes[0] || '16:00') + '</span></div>' +
            '<div class="ob-mini-session"><span class="mini-ico">' + icon('clock') + '</span><span><b>' + formatMinutes(draft.dailyMinutes) + ' в день</b><small>' + draft.studyDays.length + ' ' + pluralize(draft.studyDays.length, ['учебный день', 'учебных дня', 'учебных дней']) + ' в неделю</small></span><span class="mini-time">' + (firstDate ? daysLabel(daysBetween(parseISO(firstDate), new Date())) : '') + '</span></div>'
          : '<div class="ob-mini-session"><span class="mini-ico">' + icon('target') + '</span><span><b>Выберите предметы</b><small>И маршрут появится здесь</small></span></div>') +
        '</div>' +
        '<div class="ob-points">' +
          '<span class="ob-point">' + icon('check') + 'без перегруза</span>' +
          '<span class="ob-point">' + icon('check') + 'слабые темы первыми</span>' +
          '<span class="ob-point">' + icon('check') + 'прогресс сохраняется</span>' +
        '</div>' +
      '</div>' +
    '</aside>';
}

function renderObStepSubjects() {
  const d = obDraft;
  return '' +
    '<span class="eyebrow">Шаг 1 · Знакомство</span>' +
    '<h2>Что готовим и к какому году?</h2>' +
    '<p class="ob-sub">Выберите предметы ЕГЭ. Итоговое сочинение уже включено как обязательный допуск, прогресс сохранится в этом браузере.</p>' +
    '<div class="ob-field">' +
      '<div class="ob-label">Как вас зовут? <span>необязательно</span></div>' +
      '<div class="ob-name-row">' +
        '<input class="text-input" id="ob-name" data-ob-field="name" placeholder="Например, Алина" value="' + escapeHTML(d.name) + '" autocomplete="name">' +
        '<select class="select-input" data-ob-field="examYear">' + [resolveExamYear(), resolveExamYear() + 1].map(year => '<option value="' + year + '"' + (Number(d.examYear) === year ? ' selected' : '') + '>ЕГЭ ' + year + '</option>').join('') + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="ob-field">' +
      '<div class="ob-label">Предметы <span>можно выбрать несколько</span></div>' +
      '<div class="choice-grid">' + SUBJECT_ORDER.map(id => {
        const subject = SUBJECTS[id];
        const active = d.subjects.includes(id);
        return '<button class="choice-card' + (active ? ' selected' : '') + '" data-action="ob-subject" data-subject="' + id + '" style="' + sessionSubjectStyle(id) + '"><span class="subject-mark">' + subject.icon + '</span><span style="min-width:0"><b>' + subject.name + '</b><small>' + subject.taskLabel + '</small></span><span class="check-dot">' + icon('check') + '</span></button>';
      }).join('') + '</div>' +
    '</div>' +
    '<div class="notice" style="margin-top:18px">' + icon('info') + '<div>Итоговое сочинение уже включено: это допуск к ЕГЭ. Даты экзаменов подставятся автоматически, их можно уточнить позже в настройках.</div></div>';
}

function renderObStepGoals() {
  const d = obDraft;
  return '' +
    '<span class="eyebrow">Шаг 3 · Цели</span>' +
    '<h2>Куда целимся?</h2>' +
    '<p class="ob-sub">Честная цель и текущий уровень помогают расставить приоритеты. Это не оценка способностей.</p>' +
    (d.subjects.length ? '<div class="goal-list">' + d.subjects.map(id => {
      const subject = SUBJECTS[id];
      const level = d.levels[id] || 'basic';
      const goalControl = subject.isEssay
        ? '<div class="goal-range" style="justify-content:flex-start"><span class="small muted">Нужен зачёт: критерии 1 и 2</span></div>'
        : '<div class="goal-range"><input type="range" min="40" max="100" step="1" value="' + d.targets[id] + '" data-range="target" data-subject="' + id + '"><span class="goal-value" id="ob-target-' + id + '">' + d.targets[id] + '</span></div>';
      return '<div class="goal-row" style="' + sessionSubjectStyle(id) + '">' +
        '<div class="goal-subject"><span class="subject-mark">' + subject.icon + '</span><span style="min-width:0"><b>' + subject.short + '</b><small>' + LEVEL_LABEL[level] + '</small></span></div>' +
        goalControl +
        '<div class="level-seg">' + Object.entries(LEVEL_LABEL).map(([key, label]) => '<button class="' + (level === key ? 'active' : '') + '" data-action="ob-level" data-subject="' + id + '" data-level="' + key + '">' + label + '</button>').join('') + '</div>' +
      '</div>';
    }).join('') + '</div>' : '<div class="empty-state"><b>Сначала выберите предметы</b><small>Вернитесь на шаг назад.</small></div>') +
    '<div class="level-hint">' + icon('lightbulb') + '<span>«База» — знаете формат, но темы разрознены. «Уверенно» — решаете большинство заданий первой части. «Высокий» — нужны сложные задания и скорость.</span></div>';
}

function renderObStepRhythm() {
  const d = obDraft;
  const weekly = d.studyDays.length * Number(d.dailyMinutes);
  const maxWeekly = 7 * 240;
  const loadPercent = Math.min(100, Math.round(weekly / maxWeekly * 100));
  return '' +
    '<span class="eyebrow">Шаг 4 · Ритм</span>' +
    '<h2>Сколько реально заниматься?</h2>' +
    '<p class="ob-sub">Лучше 4 спокойных дня, чем 7 сорванных. План подстроится под выбранный ритм.</p>' +
    '<div class="ob-field">' +
      '<div class="ob-label">Учебные дни <span>минимум один</span></div>' +
      '<div class="day-chips">' + WEEKDAYS.map(day => '<button class="day-chip' + (d.studyDays.includes(day.n) ? ' active' : '') + '" data-action="ob-study-day" data-day="' + day.n + '" title="' + day.full + '">' + day.short + '</button>').join('') + '</div>' +
    '</div>' +
    '<div class="ob-field">' +
      '<div class="ob-label">Удобное время <span>можно несколько</span></div>' +
      '<div class="time-chips">' + ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(time => '<button class="time-chip' + (d.preferredTimes.includes(time) ? ' active' : '') + '" data-action="ob-time" data-time="' + time + '">' + time + '</button>').join('') + '</div>' +
    '</div>' +
    '<div class="form-grid" style="margin-top:24px">' +
      '<div class="full"><label class="form-label">Нагрузка в учебный день</label><div class="range-wrap"><input type="range" min="30" max="210" step="15" value="' + d.dailyMinutes + '" data-range="dailyMinutes"><span class="range-bubble" id="ob-daily-bubble">' + formatMinutes(d.dailyMinutes) + '</span></div></div>' +
      '<div class="full"><label class="form-label">Длина одного занятия</label><div class="seg-chips">' + [25, 30, 45, 60].map(value => '<button class="seg-chip' + (Number(d.sessionMinutes) === value ? ' active' : '') + '" data-action="ob-session" data-minutes="' + value + '">' + value + ' мин</button>').join('') + '</div></div>' +
    '</div>' +
    '<div class="week-load-preview"><div><b>Примерно ' + formatMinutes(weekly) + ' в неделю</b><small class="form-hint" style="margin-top:2px;display:block">' + Math.max(1, Math.floor(d.dailyMinutes / d.sessionMinutes)) + ' ' + pluralize(Math.max(1, Math.floor(d.dailyMinutes / d.sessionMinutes)), ['занятие', 'занятия', 'занятий']) + ' в учебный день</small></div><div class="week-load-dots">' + Array.from({ length: 7 }, (_, index) => '<span class="week-load-dot' + (d.studyDays.includes(index + 1) ? ' on' : '') + '" title="' + WEEKDAYS[index].full + '"></span>').join('') + '</div></div>' +
    '<div class="settings-row" style="margin-top:18px"><div><b>Пробники по субботам</b><small>Каждую субботу — 12 заданий с ротацией предметов и проверкой темпа.</small></div><button class="toggle' + (d.miniMocks ? ' on' : '') + '" data-action="ob-toggle" data-field="miniMocks" aria-label="Пробники по субботам"></button></div>' +
    '<div class="settings-row"><div><b>Адаптивное повторение</b><small>SM-2 сам выбирает интервал: легко — дальше, тяжело — быстрее.</small></div><button class="toggle' + (d.spacedReview ? ' on' : '') + '" data-action="ob-toggle" data-field="spacedReview" aria-label="Повторение"></button></div>';
}

function renderObStepConstraints() {
  const d = obDraft;
  return '' +
    '<span class="eyebrow">Шаг 5 · Ограничения</span>' +
    '<h2>Встроим учёбу в реальный день</h2>' +
    '<p class="ob-sub">Школа, репетитор и сон — не конкуренты плану, а его рамки. Мы не ставим занятия в неудобные часы.</p>' +
    '<div class="form-grid" style="margin-top:26px">' +
      '<div><label class="form-label">Школа заканчивается</label><input class="text-input" type="time" value="' + d.schoolEnd + '" data-ob-field="schoolEnd"><div class="form-hint">По будням занятия начнутся не раньше, чем через 15 минут.</div></div>' +
      '<div><label class="form-label">Отход ко сну</label><input class="text-input" type="time" value="' + d.sleepStart + '" data-ob-field="sleepStart"><div class="form-hint">Последнее занятие должно закончиться до сна.</div></div>' +
      '<div class="full"><label class="form-label">Дни репетитора</label><div class="day-chips">' + WEEKDAYS.map(day => '<button class="day-chip' + (d.tutorDays.includes(day.n) ? ' active' : '') + '" data-action="ob-tutor-day" data-day="' + day.n + '" title="' + day.full + '">' + day.short + '</button>').join('') + '</div></div>' +
      '<div><label class="form-label">Время репетитора</label><input class="text-input" type="time" value="' + d.tutorTime + '" data-ob-field="tutorTime"><div class="form-hint">Считаем занятие длиной 60 минут.</div></div>' +
      '<div><label class="form-label">Буферный день</label><select class="select-input" data-ob-field="bufferDay">' + WEEKDAYS.map(day => '<option value="' + day.n + '"' + (Number(d.bufferDay) === day.n ? ' selected' : '') + '>' + day.full + '</option>').join('') + '</select><div class="form-hint">Свободный день без занятий. Нужен, чтобы не выгореть.</div></div>' +
    '</div>' +
    '<div class="notice" style="margin-top:20px">' + icon('compass') + '<div>Если удобные часы пересекаются со школой или репетитором, план честно предупредит об этом. Можно изменить время или добавить выходной.</div></div>';
}

function renderObStepSupport() {
  const d = obDraft;
  const items = [
    { id: 'manual', icon: 'checkCircle', title: 'Ручной режим', text: 'Вы сами отмечаете занятия и следите за прогрессом.' },
    { id: 'notify', icon: 'bell', title: 'Напоминания в браузере', text: 'За 10 минут до занятия, пока вкладка открыта.' },
    { id: 'email', icon: 'mail', title: 'Email-напоминания', text: 'Задел на будущее: нужен сервер для отправки писем.' },
    { id: 'calendar', icon: 'calendar', title: 'Экспорт в календарь', text: 'Скачать .ics и добавить занятия в свой календарь.' }
  ];
  const activeFor = id => id === 'notify' ? d.notify : id === 'email' ? d.emailNotify : d.support.includes(id);
  return '' +
    '<span class="eyebrow">Шаг 6 · Поддержка</span>' +
    '<h2>Как помочь себе не бросить?</h2>' +
    '<p class="ob-sub">Выберите то, что реально поможет. Всё можно поменять в настройках.</p>' +
    '<div class="support-grid">' + items.map(item => '<button class="support-card' + (activeFor(item.id) ? ' selected' : '') + '" data-action="ob-support" data-support="' + item.id + '"><span class="support-check">' + icon('check') + '</span><span><b>' + item.title + '</b><small>' + item.text + '</small></span></button>').join('') + '</div>' +
    (d.emailNotify ? '<div class="ob-field"><div class="ob-label">Email для будущих писем <span>не отправляется в MVP</span></div><input class="text-input" type="email" data-ob-field="email" placeholder="you@example.com" value="' + escapeHTML(d.email) + '"></div>' : '') +
    '<div class="notice orange" style="margin-top:20px">' + icon('info') + '<div>Браузерные напоминания работают, пока открыта вкладка «Фокус». Для фоновых push-уведомлений нужен сервер — в MVP его нет. Календарный экспорт надёжнее.</div></div>';
}

function previewDiagnosticPlan(draft) {
  if (!draft) return null;
  const profile = draftProfile(draft);
  const savedProfile = state.profile;
  const savedProgress = state.progress;
  try {
    state.profile = profile;
    state.progress = normalizeProgress(state.progress);
    if (draft.diagnostic) applyDiagnosticProgress(draft.diagnostic);
    return { profile, plan: generatePlan(profile) };
  } catch (error) {
    return null;
  } finally {
    state.profile = savedProfile;
    state.progress = savedProgress;
  }
}

function renderObStepSummary() {
  const d = obDraft;
  const previewData = previewDiagnosticPlan(d);
  const preview = previewData?.profile || draftProfile(d);
  const plan = previewData?.plan || generatePlan(preview);
  const coverage = plan.stats?.total ? Math.round(plan.stats.covered / plan.stats.total * 100) : 0;
  const circumference = 2 * Math.PI * 31;
  const firstDate = Object.values(preview.examDates).sort()[0];
  const weekly = preview.studyDays.length * preview.dailyMinutes;
  const diag = d.diagnostic;
  const diagText = diag?.mode === 'self'
    ? 'самооценка · ' + (diag.summary?.know || Object.values(diag.ratings || {}).filter(value => value === 'know').length) + ' уверенно'
    : diag?.result
      ? diag.result.percent + '% теста · ' + diag.result.correct + ' / ' + diag.result.total
      : 'не пройдена';
  return '' +
    '<span class="eyebrow">Шаг 7 · Готово</span>' +
    '<h2>Ваш маршрут собран</h2>' +
    '<p class="ob-sub">Проверьте детали. После сборки откроется обзор с ближайшим занятием и таймером фокуса.</p>' +
    '<div class="summary-card">' +
      '<div class="summary-top"><div><b>' + escapeHTML(preview.name) + ', до первого дедлайна есть время</b><small>' + (firstDate ? 'Ближайший дедлайн — ' + formatDateFull(firstDate) + ' · ' + daysLabel(daysBetween(parseISO(firstDate), new Date())) : 'Даты экзаменов не заданы') + '</small></div><div class="summary-ring"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="31" fill="none" stroke="#e8e6fa" stroke-width="6"/><circle cx="38" cy="38" r="31" fill="none" stroke="#5146e5" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + (circumference * (1 - coverage / 100)).toFixed(1) + '"/></svg><span>' + coverage + '%</span></div></div>' +
      '<div class="summary-grid">' +
        '<div class="summary-item"><small>Предметы</small><b>' + preview.subjects.map(id => SUBJECTS[id].short).join(', ') + '</b></div>' +
        '<div class="summary-item"><small>Ритм</small><b>' + preview.studyDays.length + ' дн. · ' + formatMinutes(preview.dailyMinutes) + ' в день</b></div>' +
        '<div class="summary-item"><small>Нагрузка</small><b>' + formatMinutes(weekly) + ' в неделю</b></div>' +
        '<div class="summary-item"><small>Буфер</small><b>' + capitalize(WEEKDAYS_FULL[preview.bufferDay % 7]) + '</b></div>' +
        '<div class="summary-item"><small>Тем в маршруте</small><b>' + plan.stats.covered + ' из ' + plan.stats.total + '</b></div>' +
        '<div class="summary-item"><small>Занятий в плане</small><b>' + plan.sessions.length + '</b></div>' +
        '<div class="summary-item" style="grid-column:1/-1"><small>Стартовая диагностика</small><b>' + escapeHTML(diagText) + '</b></div>' +
      '</div>' +
      '<div class="summary-subjects">' + preview.subjects.map(id => '<span class="mini-subject">' + SUBJECTS[id].icon + ' ' + SUBJECTS[id].short + ' · ' + (SUBJECTS[id].isEssay ? 'зачёт' : preview.targets[id] + ' б.') + '</span>').join('') + '</div>' +
    '</div>' +
    ((plan.warnings || []).length ? '<div class="notice orange" style="margin-top:14px">' + icon('alert') + '<div><b>Ограничение по времени.</b> ' + escapeHTML(plan.warnings[0]) + '</div></div>' : '<div class="notice" style="margin-top:14px">' + icon('checkCircle') + '<div>Тем в плане достаточно для старта. Дальше — регулярность и работа с ошибками.</div></div>') +
    '<div class="level-hint">' + icon('lock') + '<span>Данные хранятся в localStorage этого браузера. Резервную копию можно скачать в настройках.</span></div>';
}

function renderOnboarding() {
  if (!obDraft) obDraft = buildOnboardingDraft();
  const steps = [
    renderObStepSubjects,
    renderObStepDiagnostic,
    renderObStepGoals,
    renderObStepRhythm,
    renderObStepConstraints,
    renderObStepSupport,
    renderObStepSummary
  ];
  const content = steps[Math.max(0, Math.min(obStep, steps.length - 1))]();
  const percent = Math.round((obStep + 1) / steps.length * 100);
  return '' +
    '<div class="onboarding">' +
      renderObAside() +
      '<section class="ob-card">' +
        '<div class="ob-head">' +
          '<div class="ob-progress"><div class="ob-progress-track"><div class="ob-progress-bar" style="width:' + percent + '%"></div></div><span class="ob-step-count">Шаг ' + (obStep + 1) + ' из ' + steps.length + '</span></div>' +
          (editingProfile ? '<button class="ob-close" data-action="ob-cancel">' + icon('x') + ' Отмена</button>' : '<div class="ob-head-actions"><span class="ob-step-count">≈ 5 минут</span><button class="icon-btn" data-action="logout" aria-label="Выйти из аккаунта" title="Выйти из аккаунта">' + icon('logout') + '</button></div>') +
        '</div>' +
        '<div class="ob-body" data-ob-body>' + content + '</div>' +
        '<div class="ob-footer"><span class="ob-footer-meta">' + (obStep === steps.length - 1 ? 'План можно пересобрать в любой момент — прогресс сохранится.' : 'Аккаунт хранится в этом браузере. Прогресс сохраняется автоматически.') + '</span><div class="ob-footer-actions">' +
          (obStep > 0 ? '<button class="btn btn-ghost btn-sm" data-action="ob-back">' + icon('arrowLeft') + 'Назад</button>' : '') +
          '<button class="btn btn-primary btn-sm" data-action="ob-next">' + (obStep === steps.length - 1 ? icon('spark') + 'Собрать план' : 'Далее' + icon('arrowRight')) + '</button>' +
        '</div></div>' +
      '</section>' +
    '</div>';
}

function validateObStep(step) {
  const d = obDraft;
  if (step === 0 && !d.subjects.length) {
    showToast('Выберите хотя бы один предмет', 'Без предметов маршрут не собрать.', 'warn');
    return false;
  }
  if (step === 1) {
    const diag = d.diagnostic || emptyDiagnosticState();
    if (diag.mode === 'test' && !diag.completed) {
      showToast('Диагностика не завершена', 'Пройдите короткий тест или переключитесь на самооценку.', 'warn');
      return false;
    }
    if (diag.mode === 'self' && !diag.confirmed) {
      showToast('Подтвердите самооценку', 'Так мы поймём, что можно пропустить в стартовом плане.', 'warn');
      return false;
    }
  }
  if (step === 3) {
    if (!d.studyDays.length) {
      showToast('Нужен хотя бы один учебный день', 'Иначе занятиям негде появиться.', 'warn');
      return false;
    }
    if (!d.preferredTimes.length) {
      showToast('Выберите удобное время', 'Плану нужен хотя бы один слот.', 'warn');
      return false;
    }
    if (Number(d.dailyMinutes) < Number(d.sessionMinutes)) {
      showToast('Дневная нагрузка меньше занятия', 'Увеличьте нагрузку или сократите занятие.', 'warn');
      return false;
    }
  }
  if (step === 4) {
    if (timeToMinutes(d.schoolEnd) >= timeToMinutes(d.sleepStart)) {
      showToast('Проверьте время', 'Школа не может заканчиваться после отхода ко сну.', 'warn');
      return false;
    }
    if (timeToMinutes(d.tutorTime) + 60 > timeToMinutes(d.sleepStart)) {
      showToast('Репетитор слишком поздно', 'Занятие должно успеть закончиться до сна.', 'warn');
      return false;
    }
  }
  if (step === 5 && d.emailNotify) {
    const email = String(d.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Проверьте email', 'Для email-напоминаний нужен корректный адрес.', 'warn');
      return false;
    }
  }
  return true;
}

function saveEmailSetting(value) {
  state.settings.email = String(value || '').trim();
}

function completeOnboarding() {
  if (!validateObStep(6)) return;
  const profile = draftProfile(obDraft);
  const previousPlan = state.plan;
  const diagnostic = obDraft.diagnostic;
  state.profile = profile;
  state.onboarded = true;
  state.settings.notify = Boolean(obDraft.notify);
  state.settings.emailNotify = Boolean(obDraft.emailNotify);
  state.settings.email = String(obDraft.email || '').trim();
  applyDiagnosticProgress(diagnostic);
  state.plan = generatePlan(profile);
  state.meta.profileUpdatedAt = new Date().toISOString();
  state.progress.activity[toISO(new Date())] = Number(state.progress.activity[toISO(new Date())] || 0);
  if (state.progress.diagnostic) {
    const baseline = computeForecast();
    state.progress.diagnostic.baseline = {
      score: baseline.totalScore,
      low: baseline.lowTotal,
      high: baseline.highTotal,
      avg: baseline.avg,
      at: new Date().toISOString()
    };
  }
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  selectedSubject = null;
  trainer = null;
  modal = null;
  obDiagQuiz = null;
  obDraft = null;
  obStep = 0;
  editingProfile = false;
  view = 'dashboard';
  recordForecastSnapshot();
  saveState();
  if (state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  const forecast = computeForecast();
  showToast('План готов', forecast.maxTotal
    ? 'Стартовый ориентир — ' + forecast.lowTotal + '–' + forecast.highTotal + ' баллов. Первый шаг уже на обзоре.'
    : 'Ближайшее занятие уже на обзоре. Первый шаг — самый важный.', 'success');
  if (previousPlan && previousPlan.sessions?.length) {
    showToast('Профиль обновлён', 'Старые отметки сохранены, новые темы добавлены в маршрут.', 'info');
  }
  render();
}
