/* Экраны приложения: обзор, план, предметы, тренажёр, настройки. */
'use strict';

function renderDashboard() {
  const profile = state.profile;
  const today = toISO(new Date());
  const { forecast, trend } = forecastOverview();
  const todaySessions = sessionsForDate(today);
  const doneToday = todaySessions.filter(session => sessionIsDone(session.id)).length;
  const focus = currentFocusSession();
  const focusSubject = focus ? SUBJECTS[focus.subject] : null;
  const focusTopic = focus?.topicId ? TOPIC_BY_ID[focus.topicId] : null;
  const nearest = nearestExam();
  const ringPercent = todaySessions.length ? Math.round(doneToday / todaySessions.length * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const overdue = overdueSessions();
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(new Date()), index));
  const maxActivity = Math.max(30, ...weekDays.map(day => Number(state.progress.activity[toISO(day)] || 0)));
  const subjectProgressItems = profileSubjects().map(id => {
    const subject = SUBJECTS[id];
    const value = subjectProgress(id);
    return '<div class="subject-progress-item">' +
      '<b>' + subject.short + '</b><span>' + value + '%</span>' +
      '<div class="subject-progress-track"><i style="width:' + value + '%;--subj-color:' + subject.color + '"></i></div>' +
    '</div>';
  }).join('');
  const stats = [
    { icon: 'flame', value: currentStreak() + ' ' + pluralize(currentStreak(), ['день', 'дня', 'дней']), label: 'серия без пропусков', bg: '#fff4e5', color: '#f79009' },
    { icon: 'clock', value: formatMinutes(weeklyMinutes()), label: 'занятий за 7 дней', bg: '#eaf4ff', color: '#2e90fa' },
    { icon: 'checkCircle', value: totalTopicsDone() + ' / ' + totalSelectedTopics(), label: 'тем освоено', bg: '#e7f8f0', color: '#12b76a' },
    { icon: 'target', value: overallAccuracy() ? overallAccuracy() + '%' : '—', label: 'точность практики', bg: '#eeecff', color: '#5146e5' }
  ].map(item => '' +
    '<div class="stat-card">' +
      '<div class="stat-icon" style="--icon-bg:' + item.bg + ';--icon-color:' + item.color + '">' + icon(item.icon) + '</div>' +
      '<div><b>' + item.value + '</b><small>' + item.label + '</small></div>' +
    '</div>'
  ).join('');
  return '' +
    renderLastWeekBanner() +
    renderPaceBanner() +
    (overdue.length ? '<div class="alert-banner">' +
      '<div class="alert-ico">' + icon('alert') + '</div>' +
      '<div><b>Вы выбились из плана: ' + overdue.length + ' ' + pluralize(overdue.length, ['занятие', 'занятия', 'занятий']) + '</b><small>Не страшно. Пересоберём оставшийся маршрут с учётом прогресса.</small></div>' +
      '<button class="btn btn-secondary btn-sm" data-action="open-replan">Пересобрать</button>' +
    '</div>' : '') +
    '<section class="hero fade-up">' +
      '<div class="hero-copy">' +
        '<span class="eyebrow">' + formatWeekday(new Date()) + ', ' + formatDate(new Date(), { day: 'numeric', month: 'long' }) + '</span>' +
        '<h1>' + greeting() + ', ' + escapeHTML(profile.name) + '. Держим фокус.</h1>' +
        '<p>' + (nearest
          ? (SUBJECTS[nearest.id].isEssay
            ? 'До итогового сочинения — <b style="color:#fff">' + daysLabel(nearest.days) + '</b>. Сегодня достаточно одного спокойного шага.'
            : 'До ЕГЭ по предмету «' + escapeHTML(SUBJECTS[nearest.id].short) + '» — <b style="color:#fff">' + daysLabel(nearest.days) + '</b>. Сегодня достаточно одного спокойного шага.')
          : 'План уже собран. Начните с ближайшего занятия — без спешки и перегруза.') + '</p>' +
        '<div class="hero-phrase">' + icon('quote') + escapeHTML(encouragementFor('hero-' + today)) + '</div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-primary btn-sm" data-action="nav" data-view="plan">' + icon('calendar') + 'Открыть план</button>' +
          (focus ? '<button class="btn btn-secondary btn-sm" data-action="' + (focus.type === 'theory' ? 'open-theory' : focus.type === 'mock' ? 'start-mock' : 'start-practice') + '" data-topic="' + (focus.topicId || '') + '" data-subject="' + focus.subject + '" data-session="' + focus.id + '">' + icon('play') + 'Продолжить занятие</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="hero-side">' +
        '<div class="hero-focus hero-forecast">' +
          '<div class="hero-focus-top"><span>Прогноз ЕГЭ</span><span>' + (forecast.subjects.length ? forecast.subjects.length + ' ' + pluralize(forecast.subjects.length, ['предмет', 'предмета', 'предметов']) : 'сочинение') + '</span></div>' +
          (forecast.maxTotal
            ? '<div class="forecast-range"><b>' + forecast.lowTotal + '–' + forecast.highTotal + '</b><span>баллов</span></div>' +
              forecastTrendHTML(trend, true) +
              '<div class="forecast-avg">Средний ориентир — ' + forecast.avg + ' из 100. Диапазон сузится после практики.</div>' +
              renderForecastChart(10)
            : '<div class="forecast-avg">Добавьте предмет ЕГЭ, чтобы увидеть прогноз в баллах.</div>') +
          '<div class="forecast-note">Не официальный балл. Расчёт по темам, весам КИМ и точности.</div>' +
        '</div>' +
        '<div class="hero-focus">' +
          '<div class="hero-focus-top"><span>Фокус дня</span><span>' + (todaySessions.length ? doneToday + ' из ' + todaySessions.length : 'свободно') + '</span></div>' +
          (focus ? '' +
            '<div class="hero-focus-row">' +
              '<div class="mini-subj" style="' + sessionSubjectStyle(focus.subject) + '">' + focusSubject.icon + '</div>' +
              '<div style="min-width:0"><b>' + escapeHTML(focusSubject.short) + ': ' + escapeHTML(focusTopic ? focusTopic.title : focus.title) + '</b><small>' + (focus.date > today ? formatDateShort(focus.date) + ' · ' : '') + focus.start + '–' + focus.end + ' · ' + focus.stage + '</small></div>' +
            '</div>' +
            '<div class="hero-focus-bottom">' + icon('checkCircle') + 'Один шаг — и серия продолжится</div>'
          : '<div class="hero-focus-row"><div class="mini-subj">' + icon('check') + '</div><div><b>На сегодня всё выполнено</b><small>Можно отдохнуть</small></div></div>') +
        '</div>' +
        '<div class="hero-focus" style="display:flex;align-items:center;gap:14px;padding:12px 16px">' +
          '<div class="hero-ring">' +
            '<svg viewBox="0 0 88 88"><circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="7"/><circle cx="44" cy="44" r="36" fill="none" stroke="#9ef0c6" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + (circumference * (1 - ringPercent / 100)).toFixed(1) + '"/></svg>' +
            '<div class="hero-ring-label"><b>' + ringPercent + '%</b><small>план дня</small></div>' +
          '</div>' +
          '<div style="flex:1"><div style="font-size:10px;color:rgba(255,255,255,.5);font-weight:750;text-transform:uppercase;letter-spacing:.09em">Серия</div><div style="font-size:20px;font-weight:800;margin-top:4px">' + currentStreak() + ' ' + pluralize(currentStreak(), ['день', 'дня', 'дней']) + '</div><div style="font-size:9.5px;color:rgba(255,255,255,.55);margin-top:3px">занятия подряд</div></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    renderCountdownCards() +
    '<div class="stat-grid" style="margin-top:16px">' + stats + '</div>' +
    renderReviewCard() +
    renderPwaBanner() +
    '<div style="margin-top:16px">' + renderTargetCard() + '</div>' +
    '<div class="dash-grid" style="margin-top:16px">' + renderQuickActions() + renderMicroCard() + '</div>' +
    '<div class="motivation-grid">' + renderDailyQuestionCard() + renderAchievementTeaser() + '</div>' +
    '<div class="dash-grid">' +
      '<section class="card pad today-card">' +
        '<div class="card-head">' +
          '<div><h3>Сегодня</h3><p>' + (todaySessions.length ? todaySessions.length + ' ' + pluralize(todaySessions.length, ['шаг', 'шага', 'шагов']) + ' в плане' : 'занятий нет') + '</p></div>' +
          '<button class="section-link" data-action="nav" data-view="plan">Весь план ' + icon('arrowRight') + '</button>' +
        '</div>' +
        (todaySessions.length
          ? '<div class="today-sessions">' + todaySessions.map(renderSessionRow).join('') + '</div>'
          : '<div class="empty-state"><div class="empty-ico">' + icon('calendar') + '</div><b>' + (Number(profile.bufferDay) === dayNumber(new Date()) ? 'Буферный день' : 'На сегодня занятий нет') + '</b><small>' + (nextSession() ? 'Следующее занятие — ' + formatDateShort(nextSession().date) + ' в ' + nextSession().start + '.' : 'Проверьте план: возможно, стоит добавить удобные слоты.') + '</small><button class="btn btn-soft btn-sm" data-action="nav" data-view="plan">Посмотреть план</button></div>') +
      '</section>' +
      '<section class="card pad advisor-card">' +
        '<div class="card-head"><div><h3>Советник по расписанию</h3><p>Как встроить учёбу в сегодняшний день</p></div><span class="badge brand">Сегодня</span></div>' +
        '<div class="advisor-timeline">' +
          todayTimeline(todaySessions).map(item => '' +
            '<div class="advisor-item">' +
              '<div class="advisor-time">' + item.time + '</div>' +
              '<div class="advisor-line"><span class="advisor-dot" style="--dot:' + item.dot + '"></span></div>' +
              '<div class="advisor-content"><b class="' + (item.study ? 'study-label' : '') + '">' + escapeHTML(item.title) + '</b><small>' + escapeHTML(item.note) + '</small></div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<div class="advisor-foot"><span>25 минут фокуса без телефона</span>' + renderTimerInline() + '</div>' +
      '</section>' +
    '</div>' +
    '<div class="progress-split">' +
      '<section class="card pad">' +
        '<div class="card-head"><div><h3>Ритм недели</h3><p>Минуты практики за последние 7 дней</p></div><button class="section-link" data-action="nav" data-view="progress">Подробнее ' + icon('arrowRight') + '</button></div>' +
        '<div class="week-bars">' + weekDays.map(day => {
          const iso = toISO(day);
          const minutes = Number(state.progress.activity[iso] || 0);
          const isToday = iso === today;
          return '<div class="week-bar' + (isToday ? ' today' : '') + '">' +
            '<div class="week-bar-track"><div class="week-bar-fill" style="height:' + Math.max(3, Math.round(minutes / maxActivity * 100)) + '%"></div></div>' +
            '<small>' + WEEKDAYS_SHORT[day.getDay()] + '</small><b>' + (minutes ? minutes : '—') + '</b>' +
          '</div>';
        }).join('') + '</div>' +
      '</section>' +
      '<section class="card pad">' +
        '<div class="card-head"><div><h3>Продвижение по предметам</h3><p>Доля тем, где есть теория и практика</p></div><button class="section-link" data-action="nav" data-view="subjects">Предметы ' + icon('arrowRight') + '</button></div>' +
        '<div class="subject-progress-list">' + subjectProgressItems + '</div>' +
      '</section>' +
    '</div>' +
    '<div style="margin-top:16px">' + renderPseCard() + '</div>';
}

function planWeekLabel(start) {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return formatDate(start, { day: 'numeric' }) + '–' + formatDate(end, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return formatDate(start, { day: 'numeric', month: 'short' }) + ' — ' + formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderPlanSession(session) {
  const subject = SUBJECTS[session.subject];
  const topic = session.topicId ? TOPIC_BY_ID[session.topicId] : null;
  const done = sessionIsDone(session.id);
  const missed = sessionIsMissed(session);
  return '' +
    '<div class="plan-session' + (done ? ' done' : '') + (missed ? ' missed' : '') + (session.type === 'mock' ? ' mock' : '') + '">' +
      '<div class="session-time-box"><b>' + session.start + '</b><small>' + session.end + '</small><small style="color:var(--muted-2);margin-top:4px">' + session.duration + ' мин</small></div>' +
      '<div style="min-width:0">' +
        '<div class="plan-session-top">' +
          '<span class="tag brand subject-tag" style="--subj-color:' + subject.color + ';--subj-soft:' + subject.soft + '">' + subject.short + '</span>' +
          '<span class="tag">' + session.stage + '</span>' +
          (missed ? '<span class="badge red">пропущено</span>' : '') +
          (done ? '<span class="badge mint">выполнено</span>' : '') +
        '</div>' +
        '<div class="plan-session-title">' + escapeHTML(topic ? topic.title : session.title) + '</div>' +
        '<div class="plan-session-meta">' +
          (topic ? '<span>' + (subject.isEssay ? 'Этап' : 'Часть ' + topic.part) + '</span><span>·</span><span>вес ' + topic.weight + '/5</span><span>·</span>' : '') +
          '<span>' + (session.type === 'cheatsheet' ? 'Шпаргалка и быстрое повторение' : session.type === 'theory' ? 'Разбор теории и алгоритма' : session.type === 'practice' ? 'Закрепление на заданиях' : session.type === 'review' ? 'Интервальное повторение' : 'Проверка темпа') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="plan-session-actions">' + primarySessionAction(session) + sessionCheckAction(session) + '</div>' +
    '</div>';
}

function renderPlanSide() {
  const plan = state.plan;
  const stats = plan?.stats || { covered: 0, total: totalSelectedTopics() };
  const percent = stats.total ? Math.round(stats.covered / stats.total * 100) : 0;
  const legend = profileSubjects().map(id => {
    const count = (plan?.sessions || []).filter(session => session.subject === id && !sessionIsDone(session.id)).length;
    return '<div class="legend-item"><span class="legend-dot" style="background:' + SUBJECTS[id].color + '"></span><span>' + SUBJECTS[id].short + '</span><b>' + count + '</b></div>';
  }).join('');
  const weekRows = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(planWeekStart, index);
    const iso = toISO(day);
    const sessions = sessionsForDate(iso);
    return '<div class="week-mini-row"><span class="week-mini-day">' + WEEKDAYS_SHORT[day.getDay()] + '</span><span>' + formatDateShort(iso) + '</span><b>' + sessions.length + ' ' + pluralize(sessions.length, ['шаг', 'шага', 'шагов']) + '</b></div>';
  }).join('');
  return '' +
    '<aside class="plan-side">' +
      '<div class="card plan-side-card">' +
        '<h3>Покрытие плана</h3>' +
        '<div class="coverage-line"><span>Тем в маршруте</span><b>' + stats.covered + ' / ' + stats.total + '</b></div>' +
        '<div class="coverage-track"><span style="width:' + percent + '%"></span></div>' +
        '<p class="coverage-note">' + (percent >= 100 ? 'Все темы стартового блока попали в план. Дальше — повторение и пробники.' : 'Приоритет отдан темам с большим весом и слабым местам. Если темп ниже нужного, увеличьте дневной лимит или добавьте учебный день.') + '</p>' +
        '<div class="subject-legend">' + legend + '</div>' +
      '</div>' +
      '<div class="card plan-side-card">' +
        '<h3>Буферы и ритм</h3>' +
        '<div class="buffer-note">' + icon('compass') + '<span>' + (capitalize(WEEKDAYS_FULL[Number(state.profile.bufferDay) % 7]) || 'Воскресенье') + ' — буферный день. Школа, репетитор и сон не занимаются учебой.</span></div>' +
        '<div style="margin-top:12px">' + weekRows + '</div>' +
      '</div>' +
      '<div class="card plan-side-card">' +
        '<h3>Почему такой порядок</h3>' +
        '<div class="coverage-note" style="margin-top:0">Сначала — ближайший дедлайн и слабые предметы. Внутри предмета соблюдается порядок тем, а занятия чередуются, чтобы не было перегруза одним предметом.</div>' +
      '</div>' +
    '</aside>';
}

function renderPlan() {
  const profile = state.profile;
  if (planIsStale(state.plan)) {
    state.plan = generatePlan(profile);
    saveState();
  }
  const plan = state.plan;
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(planWeekStart, index));
  const weekISO = weekDays.map(toISO);
  if (!weekISO.includes(selectedPlanDate)) {
    selectedPlanDate = weekISO.includes(toISO(new Date())) ? toISO(new Date()) : weekISO[0];
  }
  const selectedSessions = sessionsForDate(selectedPlanDate);
  const selectedDate = parseISO(selectedPlanDate);
  const overdue = overdueSessions();
  const examToday = profileSubjects().filter(id => examDateFor(id) === selectedPlanDate);
  const strategyId = nearestExam()?.id || profileSubjects()[0];
  return '' +
    '<div class="page-head">' +
      '<div><h1>Маршрут до экзаменов и допуска</h1><p>План на неделю и по дням. Учитываем школу, репетиторов, сон, буферы и вашу нагрузку.</p></div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-secondary btn-sm" data-action="export-ics">' + icon('download') + 'В календарь</button>' +
        '<button class="btn btn-primary btn-sm" data-action="open-replan">' + icon('refresh') + 'Пересобрать</button>' +
      '</div>' +
    '</div>' +
    renderLastWeekBanner() +
    ((plan.warnings || []).length ? '<div class="notice orange" style="margin-bottom:14px">' + icon('info') + '<div><b>Есть ограничение по времени.</b><br>' + escapeHTML(plan.warnings[0]) + (plan.warnings.length > 1 ? ' <button class="section-link" data-action="open-replan" style="display:inline;font-size:10px">Что можно изменить</button>' : '') + '</div></div>' : '') +
    (overdue.length ? '<div class="alert-banner">' +
      '<div class="alert-ico">' + icon('alert') + '</div>' +
      '<div><b>' + overdue.length + ' ' + pluralize(overdue.length, ['занятие', 'занятия', 'занятий']) + ' остались позади</b><small>Пересоберём оставшиеся темы, сохранив прогресс и уже выполненные занятия.</small></div>' +
      '<button class="btn btn-secondary btn-sm" data-action="open-replan">Я выбился из плана</button>' +
    '</div>' : '') +
    '<div class="plan-toolbar">' +
      '<div class="plan-toolbar-left">' +
        '<div class="week-nav">' +
          '<button class="icon-btn" data-action="plan-week" data-offset="-1" aria-label="Предыдущая неделя">' + icon('chevronLeft') + '</button>' +
          '<div class="week-label">' + planWeekLabel(planWeekStart) + '</div>' +
          '<button class="icon-btn" data-action="plan-week" data-offset="1" aria-label="Следующая неделя">' + icon('chevronRight') + '</button>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" data-action="plan-today">Сегодня</button>' +
      '</div>' +
      '<div class="plan-toolbar-right"><span class="tag">' + (plan.sessions.length) + ' ' + pluralize(plan.sessions.length, ['шаг', 'шага', 'шагов']) + ' в плане</span></div>' +
    '</div>' +
    '<div class="week-strip">' + weekDays.map(day => {
      const iso = toISO(day);
      const sessions = sessionsForDate(iso);
      const done = sessions.filter(session => sessionIsDone(session.id)).length;
      const isToday = iso === toISO(new Date());
      const buffer = Number(profile.bufferDay) === dayNumber(day) && !sessions.length;
      const dots = sessions.slice(0, 4).map(session => '<span class="day-dot' + (sessionIsDone(session.id) ? ' done' : '') + '" style="--subj-color:' + SUBJECTS[session.subject].color + '"></span>').join('');
      return '' +
        '<button class="day-tile' + (iso === selectedPlanDate ? ' selected' : '') + (isToday ? ' today' : '') + (buffer ? ' buffer' : '') + '" data-action="plan-select-day" data-date="' + iso + '">' +
          '<div class="day-tile-top"><span class="day-name">' + WEEKDAYS_SHORT[day.getDay()] + '</span>' + (isToday ? '<span class="day-today-label">сегодня</span>' : '') + '</div>' +
          '<span class="day-num">' + day.getDate() + '</span>' +
          '<div class="day-dots">' + dots + '</div>' +
          '<div class="day-summary">' + (sessions.length ? done + '/' + sessions.length + ' выполнено' : buffer ? 'буфер' : 'свободно') + '</div>' +
          (sessions.length ? '<div class="day-progress"><span style="width:' + Math.round(done / sessions.length * 100) + '%"></span></div>' : '') +
        '</button>';
    }).join('') + '</div>' +
    '<div class="plan-main">' +
      '<section class="card plan-day-card">' +
        '<div class="plan-day-head">' +
          '<div><h2>' + formatDate(selectedPlanDate, { weekday: 'long', day: 'numeric', month: 'long' }) + '</h2><p>' +
            (examToday.length ? 'Сегодня ЕГЭ: ' + examToday.map(id => SUBJECTS[id].short).join(', ') + '. Берегите силы.' : selectedSessions.length ? selectedSessions.length + ' ' + pluralize(selectedSessions.length, ['занятие', 'занятия', 'занятий']) + ' · ' + formatMinutes(selectedSessions.reduce((sum, session) => sum + session.duration, 0)) : (Number(profile.bufferDay) === dayNumber(selectedDate) ? 'Буферный день: отдых и восстановление.' : 'Свободный день. Можно отдохнуть или повторить ошибки.')) +
          '</p></div>' +
          '<div class="page-actions">' +
            (selectedSessions.some(session => !sessionIsDone(session.id)) ? '<button class="btn btn-soft btn-sm" data-action="mark-day-done" data-date="' + selectedPlanDate + '">' + icon('check') + 'Отметить день</button>' : '') +
          '</div>' +
        '</div>' +
        (selectedSessions.length
          ? '<div class="plan-sessions">' + selectedSessions.map(renderPlanSession).join('') + '</div>'
          : '<div class="empty-state"><div class="empty-ico">' + icon('calendar') + '</div><b>' + (Number(profile.bufferDay) === dayNumber(selectedDate) ? 'Буферный день' : 'Занятий нет') + '</b><small>' + (Number(profile.bufferDay) === dayNumber(selectedDate) ? 'Этот день специально оставлен свободным, чтобы план не превратился в марафон.' : 'Выберите другой день недели или пересоберите план.') + '</small><button class="btn btn-soft btn-sm" data-action="plan-today">Вернуться к сегодня</button></div>') +
      '</section>' +
      renderPlanSide() +
    '</div>' +
    '<div style="margin-top:16px">' + renderBackwardCard(strategyId) + '</div>' +
    '<div style="margin-top:16px">' + renderStrategicMinimumCard(strategyId) + '</div>';
}

function completeSessionInternal(sessionId, options) {
  const settings = options || {};
  const session = (state.plan?.sessions || []).find(item => item.id === sessionId);
  if (!session || sessionIsDone(sessionId)) return false;
  state.progress.sessions[sessionId] = { doneAt: new Date().toISOString() };
  if (!settings.noActivity) addActivity(session.duration, session.date);
  if (session.topicId) {
    const progress = topicProgress(session.topicId);
    if (session.type === 'theory') progress.theory = true;
    if (session.type === 'practice') progress.practice = true;
  }
  return true;
}

function markTheoryStudied(topicId, sessionId) {
  const progress = topicProgress(topicId);
  progress.theory = true;
  if (sessionId) completeSessionInternal(sessionId);
  const today = toISO(new Date());
  (state.plan?.sessions || [])
    .filter(session => session.topicId === topicId && session.type === 'theory' && session.date <= today && !sessionIsDone(session.id))
    .forEach(session => completeSessionInternal(session.id, { noActivity: true }));
  saveState();
}

function renderSubjects() {
  if (selectedSubject && SUBJECTS[selectedSubject] && profileSubjects().includes(selectedSubject)) {
    return renderSubjectDetail(selectedSubject);
  }
  const cards = profileSubjects().map(id => {
    const subject = SUBJECTS[id];
    const topics = topicsForSubject(id);
    const done = topics.filter(topic => isTopicDone(topic.id)).length;
    const percent = topics.length ? Math.round(done / topics.length * 100) : 0;
    const practiceCount = topics.reduce((sum, topic) => sum + topic.questions.length, 0);
    const sessions = (state.plan?.sessions || []).filter(session => session.subject === id).length;
    const target = state.profile.targets?.[id] || 80;
    const level = LEVEL_LABEL[state.profile.levels?.[id] || 'basic'];
    const isEssay = Boolean(subject.isEssay);
    return '' +
      '<button class="subject-card" style="' + sessionSubjectStyle(id) + '" data-action="open-subject" data-subject="' + id + '">' +
        '<div class="subject-card-top">' +
          '<div class="subject-card-title">' +
            '<span class="subject-mark">' + subject.icon + '</span>' +
            '<span><b>' + subject.name + '</b><small>' + (isEssay ? 'Допуск к ЕГЭ · уровень: ' + level.toLowerCase() : 'Цель ' + target + ' б. · уровень: ' + level.toLowerCase()) + '</small></span>' +
          '</div>' +
          '<div class="subject-card-count"><b>' + daysToExam(id) + '</b><small>' + pluralize(daysToExam(id), ['день', 'дня', 'дней']) + ' до ' + (isEssay ? 'сочинения' : 'ЕГЭ') + '</small></div>' +
        '</div>' +
        '<div class="subject-card-stats">' +
          '<div class="subject-stat"><b>' + done + ' / ' + topics.length + '</b><small>тем освоено</small></div>' +
          '<div class="subject-stat"><b>' + sessions + '</b><small>занятий в плане</small></div>' +
          '<div class="subject-stat"><b>' + practiceCount + '</b><small>заданий в банке</small></div>' +
        '</div>' +
        '<div class="subject-card-progress"><span style="width:' + percent + '%"></span></div>' +
        '<div class="subject-card-footer"><span>' + (isEssay ? 'Формат, аргументы и практика' : 'Часть 1 + ключевые темы части 2') + ' · ' + formatDateShort(examDateFor(id)) + '</span><span class="arrow">' + icon('arrowRight') + '</span></div>' +
      '</button>';
  }).join('');
  return '' +
    '<div class="page-head">' +
      '<div><h1>Предметы</h1><p>Теория, алгоритмы и практика по темам. Начинайте с тем, которые дают больше баллов.</p></div>' +
      '<div class="page-actions"><button class="btn btn-primary btn-sm" data-action="nav" data-view="trainer">' + icon('target') + 'Открыть тренажёр</button></div>' +
    '</div>' +
    '<div class="notice" style="margin-bottom:16px">' + icon('info') + '<div><b>Авторские карточки + первоисточник.</b> Внутренние задания составлены по темам кодификатора и не являются копиями ФИПИ. Официальные задания с документом и номером собраны в тренажёре, а полный банк доступен на ' + externalLink(FIPI_BANK_ROOT, 'сайте ФИПИ') + '.</div></div>' +
    '<div class="subjects-grid">' + cards + '</div>';
}

function renderSubjectDetail(subjectId) {
  const subject = SUBJECTS[subjectId];
  const topics = topicsForSubject(subjectId);
  const visibleTopics = topics.filter(topicFilterMatches);
  const done = topics.filter(topic => isTopicDone(topic.id)).length;
  const percent = topics.length ? Math.round(done / topics.length * 100) : 0;
  const target = state.profile.targets?.[subjectId] || 80;
  const level = LEVEL_LABEL[state.profile.levels?.[subjectId] || 'basic'];
  const isEssay = Boolean(subject.isEssay);
  const parts = [1, 2].map(part => {
    const partTopics = visibleTopics.filter(topic => topic.part === part);
    if (!partTopics.length) return '';
    return '' +
      '<section class="part-block">' +
        '<div class="part-head">' +
          '<span class="part-number">' + (isEssay ? '✍' : part) + '</span>' +
          '<div><b>' + (isEssay ? 'Этапы подготовки' : 'Часть ' + part) + '</b><small>' + (isEssay ? 'Формат, тезис, аргументы и проверка' : part === 1 ? 'Краткий ответ · база и разогрев' : 'Развёрнутый ответ · алгоритмы и структура') + '</small></div>' +
          '<span class="part-tag">' + (isEssay ? 'допуск к ЕГЭ' : part === 1 ? 'приоритет MVP' : 'ключевые темы') + '</span>' +
        '</div>' +
        '<div class="topics-list">' + partTopics.map(topic => {
          const progress = state.progress.topics[topic.id] || {};
          const topicDone = isTopicDone(topic.id);
          const best = Number(progress.best || 0);
          const scoreClass = best >= 80 ? ' good' : best > 0 ? ' low' : '';
          const due = reviewDueLabel(topic.id);
          const showDue = (progress.practice || Number(progress.attempts || 0) > 0) && due.text !== 'новая';
          const visualCount = visualsForTopic(topic.id).length;
          return '' +
            '<div class="topic-row' + (topicDone ? ' done' : '') + '">' +
              '<span class="topic-num">' + (topicDone ? icon('check') : topic.order) + '</span>' +
              '<div style="min-width:0">' +
                '<div class="topic-title">' + escapeHTML(topic.title) + '</div>' +
                '<div class="topic-meta">' +
                  '<span>' + topic.examTasks + '</span><span>·</span>' +
                  '<span class="weight">вес ' + topic.weight + '/5</span><span>·</span>' +
                  '<span class="status-dot' + (topicDone ? ' done' : '') + '"></span>' +
                  '<span>' + (topicDone ? 'освоено' : progress.theory ? 'теория изучена' : 'не начато') + '</span>' +
                  (showDue ? '<span class="topic-due ' + due.className + '">' + icon('clock') + due.text + '</span>' : '') +
                  (visualCount ? '<button type="button" class="topic-visual-badge" data-action="open-theory" data-topic="' + topic.id + '" title="В теме есть карты и фотографии">' + icon('layers') + visualCount + ' ' + pluralize(visualCount, ['материал', 'материала', 'материалов']) + '</button>' : '') +
                '</div>' +
              '</div>' +
              '<span class="topic-score' + scoreClass + '">' + (Number(progress.attempts || 0) ? best + '%' : '—') + '</span>' +
              '<div class="topic-row-actions">' +
                '<button class="btn btn-secondary" data-action="open-theory" data-topic="' + topic.id + '">' + icon('bookOpen') + 'Теория</button>' +
                '<button class="btn btn-ghost" data-action="open-cheatsheet" data-topic="' + topic.id + '">' + icon('zap') + 'Шпаргалка</button>' +
                '<button class="btn btn-soft" data-action="start-practice" data-topic="' + topic.id + '">' + icon('target') + 'Практика</button>' +
              '</div>' +
            '</div>' +
            renderTopicMistakes(topic.id);
        }).join('') + '</div>' +
      '</section>';
  }).join('');
  return '' +
    '<div class="page-head" style="margin-bottom:12px">' +
      '<div><button class="section-link" data-action="back-subjects" style="margin-bottom:12px">' + icon('arrowLeft') + 'Все предметы</button><h1>' + subject.name + '</h1><p>' + (isEssay ? 'Нужен зачёт' : 'Цель — ' + target + ' баллов') + '. Текущий уровень: ' + level.toLowerCase() + '. До ' + (isEssay ? 'сочинения' : 'экзамена') + ' ' + daysLabel(daysToExam(subjectId)) + '.</p></div>' +
      '<div class="page-actions">' + fipiSubjectLink(subjectId, 'Банк ФИПИ', 'btn btn-ghost btn-sm') + '<button class="btn btn-ghost btn-sm" data-action="open-fipi-journal">' + icon('bank') + 'Журнал ФИПИ</button><button class="btn btn-secondary btn-sm" data-action="open-theory" data-topic="' + topics[0]?.id + '">' + icon('bookOpen') + 'Открыть теорию</button><button class="btn btn-primary btn-sm" data-action="start-subject-practice" data-subject="' + subjectId + '">' + icon('target') + 'Тренировать предмет</button></div>' +
    '</div>' +
    '<section class="subject-header" style="' + sessionSubjectStyle(subjectId) + '">' +
      '<div class="subject-header-inner">' +
        '<div class="subject-header-left">' +
          '<span class="subject-mark">' + subject.icon + '</span>' +
          '<div><h1>' + subject.short + '</h1><p>' + subject.taskLabel + ' · ' + topics.length + ' ' + pluralize(topics.length, ['тема', 'темы', 'тем']) + '</p></div>' +
        '</div>' +
        '<div class="subject-header-stats">' +
          '<div class="subject-header-stat"><b>' + daysToExam(subjectId) + '</b><small>' + pluralize(daysToExam(subjectId), ['день', 'дня', 'дней']) + ' до ' + (isEssay ? 'сочинения' : 'ЕГЭ') + '</small></div>' +
          '<div class="subject-header-stat"><b>' + percent + '%</b><small>маршрута пройдено</small></div>' +
          '<div class="subject-header-stat"><b>' + done + ' / ' + topics.length + '</b><small>тем освоено</small></div>' +
          '<div class="subject-header-stat"><b>' + subjectAccuracy(subjectId) + '%</b><small>точность</small></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    (isEssay ? '<div style="margin-top:16px">' + renderEssayWorkspace() + '</div>' : '') +
    '<div style="margin-top:16px">' + renderStrategicMinimumCard(subjectId) + '</div>' +
    '<div style="margin-top:16px">' + renderPseCard(subjectId) + '</div>' +
    '<div style="margin-top:16px">' + renderDependencyCard(subjectId) + '</div>' +
    '<div class="subject-toolbar"><div><span class="badge brand">' + (subject.part === 2 ? 'Часть 2' : 'Маршрут по темам') + '</span><span class="small muted" style="margin-left:8px">Сначала теория и алгоритм, затем практика</span></div><button class="section-link" data-action="nav" data-view="plan">Ближайшие занятия ' + icon('arrowRight') + '</button></div>' +
    renderTopicFilterChips(topics) +
    (visibleTopics.length ? parts : '<div class="card pad empty-state" style="margin-top:12px"><div class="empty-ico">' + icon('checkCircle') + '</div><b>Под этот фильтр тем нет</b><small>Это хороший знак: возможно, всё уже освоено. Переключите фильтр, чтобы увидеть остальные темы.</small><button class="btn btn-secondary btn-sm" data-action="topic-filter" data-filter="all">Показать все темы</button></div>') +
    '<div class="notice" style="margin-top:6px">' + icon('lightbulb') + '<div><b>Как учиться по этой странице.</b> Откройте тему, разберите алгоритм, затем сразу закрепите короткой практикой. После 2–3 ошибок вернитесь в теорию — это нормальный цикл, а не провал.</div></div>';
}

function renderTheoryBlock(block) {
  if (!block) return '';
  const blockIcon = block.type === 'warn' ? 'alert' : block.type === 'steps' ? 'compass' : block.type === 'formulas' ? 'zap' : 'list';
  let content = '';
  if (block.type === 'formulas') {
    content = '<div class="theory-formulas">' + (block.items || []).map(item => (
      '<div class="theory-formula"><small>' + escapeHTML(item.label) + '</small><b>' + escapeHTML(item.value) + '</b></div>'
    )).join('') + '</div>';
  } else if (block.type === 'steps') {
    content = '<ol class="theory-steps">' + (block.items || []).map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ol>';
  } else if (block.type === 'list' || block.type === 'warn') {
    content = '<ul class="theory-list">' + (block.items || []).map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ul>';
  } else {
    content = '<p class="theory-text">' + escapeHTML(block.text || '') + '</p>';
  }
  return '<div class="theory-block ' + (block.type === 'warn' ? 'warn' : block.type === 'steps' ? 'steps' : '') + '">' +
    '<h3><span class="block-ico">' + icon(blockIcon) + '</span>' + escapeHTML(block.title) + '</h3>' + content +
  '</div>';
}

function visualsForTopic(topicId) {
  return (TOPIC_VISUALS[topicId] || [])
    .map(key => VISUAL_LIBRARY[key] ? { key, ...VISUAL_LIBRARY[key] } : null)
    .filter(Boolean);
}

function visualKindLabel(item) {
  return item?.kind === 'map' ? 'Карта' : 'Фото';
}

function renderTopicVisuals(topicId) {
  const items = visualsForTopic(topicId);
  if (!items.length) return '';
  const isCulture = topicId === 'h-culture';
  const isMap = topicId === 'h-map-source';
  const title = isCulture ? 'Культура в образах' : isMap ? 'Карты для тренировки' : 'Карты и образы';
  const hint = isCulture
    ? 'Нажмите на карточку, чтобы рассмотреть объект. Держите в голове связку «эпоха — автор — стиль».'
    : isMap
      ? 'Открывайте карту на весь экран и проговаривайте легенду, ориентиры и событие. Это и есть тренировка задания № 9–12.'
      : 'Ключевые карты и памятники темы. Открывайте на весь экран: подписи и детали становятся крупнее.';
  const footnote = isCulture
    ? 'Фотографии — Wikimedia Commons; ссылка на исходный файл есть в карточке. Изображения не являются официальными иллюстрациями ФИПИ.'
    : isMap
      ? 'Схемы составлены специально для приложения по мотивам школьного курса. Это не официальные карты ФИПИ, а тренажёр по легенде и ориентирам.'
      : 'Карты — авторские схемы приложения, фотографии — Wikimedia Commons. Материалы помогают учить образы и географию, а не заменяют официальные задания.';
  return '' +
    '<section class="topic-visuals">' +
      '<div class="topic-visuals-head">' +
        '<div><span class="visual-eyebrow">' + icon('layers') + 'Наглядный материал</span><h3>' + title + '</h3><p>' + hint + '</p></div>' +
        '<span class="tag brand">' + items.length + ' ' + pluralize(items.length, ['материал', 'материала', 'материалов']) + '</span>' +
      '</div>' +
      '<div class="visual-grid">' + items.map(item => (
        '<button type="button" class="visual-card ' + item.kind + '" data-action="open-visual" data-topic="' + topicId + '" data-visual="' + item.key + '" aria-label="Открыть: ' + escapeHTML(item.title) + '">' +
          '<span class="visual-thumb">' +
            '<img src="' + escapeHTML(item.src) + '" alt="' + escapeHTML(item.title + ' — ' + item.meta) + '" loading="lazy" decoding="async">' +
            '<span class="visual-kind">' + visualKindLabel(item) + '</span>' +
          '</span>' +
          '<span class="visual-info"><b>' + escapeHTML(item.title) + '</b><small>' + escapeHTML(item.meta) + '</small></span>' +
        '</button>'
      )).join('') + '</div>' +
      '<div class="visual-footnote">' + icon('info') + '<span>' + footnote + '</span></div>' +
    '</section>';
}

function renderVisualModal() {
  const items = visualsForTopic(modal?.topicId);
  if (!items.length) return '';
  let index = items.findIndex(item => item.key === modal?.visualKey);
  if (index < 0) index = 0;
  const item = items[index];
  const topic = TOPIC_BY_ID[modal.topicId];
  const previous = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];
  const multi = items.length > 1;
  return '' +
    '<div class="modal visual-modal" role="dialog" aria-modal="true" aria-label="' + escapeHTML(item.title) + '">' +
      '<div class="visual-modal-top">' +
        '<div class="visual-modal-tags"><span class="tag brand">' + visualKindLabel(item) + '</span><span class="tag">' + escapeHTML(topic?.title || 'Тема') + '</span><span class="visual-modal-count">' + (index + 1) + ' / ' + items.length + '</span></div>' +
        '<button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button>' +
      '</div>' +
      '<div class="visual-modal-stage">' +
        (item.kind === 'map'
          ? '<a class="visual-modal-open" href="' + escapeHTML(item.src) + '" target="_blank" rel="noopener" aria-label="Открыть схему «' + escapeHTML(item.title) + '» в полном размере">' +
              '<img src="' + escapeHTML(item.src) + '" alt="' + escapeHTML(item.title + ' — ' + item.meta) + '">' +
              '<span class="visual-modal-open-hint">' + icon('arrowUpRight') + 'Открыть целиком</span>' +
            '</a>'
          : '<img src="' + escapeHTML(item.src) + '" alt="' + escapeHTML(item.title + ' — ' + item.meta) + '">') +
      '</div>' +
      '<div class="visual-modal-body">' +
        '<div><h2>' + escapeHTML(item.title) + '</h2><p class="visual-modal-meta-line">' + escapeHTML(item.meta) + '</p><p class="visual-modal-caption">' + escapeHTML(item.caption) + '</p></div>' +
        (item.source
          ? externalLink(item.source, 'Источник фото · Wikimedia Commons', 'visual-source-link')
          : '<span class="visual-source-note">' + icon('spark') + 'Авторская схема приложения</span>') +
      '</div>' +
      '<div class="visual-modal-foot">' +
        '<div class="visual-modal-tip">' + icon(item.kind === 'map' ? 'compass' : 'lightbulb') + '<span>' + (item.kind === 'map' ? 'Легенда → ориентиры → событие → год. Проговорите это вслух.' : 'Связка для ЕГЭ: эпоха → автор → стиль → объект.') + '</span></div>' +
        (multi ? '<div class="visual-modal-nav">' +
          '<button class="btn btn-ghost btn-sm" data-action="visual-prev" aria-label="Предыдущий материал: ' + escapeHTML(previous.title) + '">' + icon('chevronLeft') + 'Назад</button>' +
          '<button class="btn btn-secondary btn-sm" data-action="visual-next" aria-label="Следующий материал: ' + escapeHTML(next.title) + '">Далее' + icon('chevronRight') + '</button>' +
        '</div>' : '') +
      '</div>' +
    '</div>';
}

function stepVisual(direction) {
  if (modal?.type !== 'visual') return;
  const items = visualsForTopic(modal.topicId);
  if (items.length < 2) return;
  let index = items.findIndex(item => item.key === modal.visualKey);
  if (index < 0) index = 0;
  modal = { ...modal, visualKey: items[(index + direction + items.length) % items.length].key };
  render();
}

function renderTheoryModal(topicId) {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return '';
  const subject = SUBJECTS[topic.subject];
  const progress = state.progress.topics[topic.id] || {};
  return '' +
    '<div class="modal theory-modal" role="dialog" aria-modal="true" aria-label="' + escapeHTML(topic.title) + '">' +
      '<div class="theory-header" style="--theory-color:' + subject.color + ';--theory-color-2:' + subject.color2 + '">' +
        '<div class="theory-header-top">' +
          '<span class="tag">' + subject.short + '</span>' +
          '<span class="tag">' + (subject.isEssay ? 'Этап' : 'Часть ' + topic.part) + '</span>' +
          '<span class="tag">' + topic.examTasks + '</span>' +
          '<button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button>' +
        '</div>' +
        '<h2>' + escapeHTML(topic.title) + '</h2>' +
        '<p>' + escapeHTML(topic.subtitle) + '</p>' +
        '<div class="theory-header-meta">' +
          '<span>' + icon('chart') + (subject.isEssay ? 'Вес для допуска: ' : 'Вес на экзамене: ') + topic.weight + '/5</span>' +
          '<span>' + icon('target') + topic.questions.length + ' ' + pluralize(topic.questions.length, ['задание', 'задания', 'заданий']) + ' для закрепления</span>' +
          '<span>' + icon('checkCircle') + (progress.theory ? 'Теория отмечена' : 'Ещё не изучено') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="modal-body theory-content">' +
        '<p class="theory-text" style="font-size:13px;color:var(--ink)">' + escapeHTML(topic.theory.lead) + '</p>' +
        '<div style="height:18px"></div>' +
        (topic.theory.blocks || []).map(renderTheoryBlock).join('') +
        renderTopicVisuals(topic.id) +
        '<div class="theory-cta">' +
          '<div class="tc-text"><b>Проверьте себя на практике</b><small>Короткие карточки с выбором ответа и разбором. Это закрепит теорию лучше, чем повторное чтение.</small></div>' +
          '<button class="btn btn-primary btn-sm" data-action="theory-start-practice" data-topic="' + topic.id + '" data-session="' + (modal?.sessionId || '') + '">' + icon('play') + 'Начать практику</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<span class="foot-note">Конспект по кодификатору: формулы и алгоритмы для старта, не заменяют учебник. ' + fipiSubjectLink(topic.subject, 'Сверить тему в банке ФИПИ', 'theory-source-link') + '</span>' +
        '<div class="modal-foot-actions">' +
          '<button class="btn btn-secondary btn-sm" data-action="theory-done" data-topic="' + topic.id + '" data-session="' + (modal?.sessionId || '') + '">' + icon('check') + 'Я изучил тему</button>' +
          '<button class="btn btn-soft btn-sm" data-action="close-modal">Закрыть</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function trainerQueueForTopic(topicId) {
  const topic = TOPIC_BY_ID[topicId];
  return topic ? topic.questions.map(question => question.id) : [];
}

function startTrainer(config) {
  const cfg = config || {};
  let queue = cfg.questionIds ? [...cfg.questionIds] : [];
  if (!queue.length) {
    if (cfg.topicId) queue = trainerQueueForTopic(cfg.topicId);
    else if (cfg.subject && cfg.mode === 'mock') queue = mockQueueForSubject(cfg.subject, 12);
    else if (cfg.subject) queue = allQuestionsForSubject(cfg.subject).slice(0, 8);
    else queue = state.profile.subjects.flatMap(id => allQuestionsForSubject(id)).slice(0, 10);
  }
  queue = [...new Set(queue)].filter(id => QUESTION_BY_ID[id]);
  if (!queue.length) {
    showToast('Нет заданий', 'Для этой темы пока нет карточек.', 'warn');
    return;
  }
  clearTrainerTimer();
  stopBreathing(false);
  modal = null;
  trainer = {
    mode: cfg.mode || (cfg.topicId ? 'topic' : 'subject'),
    subject: cfg.subject || (cfg.topicId ? TOPIC_BY_ID[cfg.topicId]?.subject : null),
    topicId: cfg.topicId || null,
    contextLabel: cfg.contextLabel || '',
    originSessionId: cfg.originSessionId || null,
    queue,
    index: 0,
    selected: null,
    checked: false,
    answers: [],
    optionOrders: Object.fromEntries(queue.map(id => [id, shuffledOptionOrder(QUESTION_BY_ID[id])])),
    questionStartedAt: Date.now(),
    finished: false,
    startedAt: new Date().toISOString()
  };
  if (trainer.mode === 'surprise') surpriseTimeLeft = 30;
  view = 'trainer';
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (trainer.mode === 'surprise') beginSurpriseTimer();
}

function optionLetters(count) {
  return ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'].slice(0, Math.max(1, count));
}

function selectedDisplayIndexes(selected) {
  if (selected === null || selected === undefined) return [];
  return Array.isArray(selected) ? selected : [selected];
}

function renderFipiQuestionMedia(question) {
  const media = fipiMediaForQuestion(question);
  if (!media.length) return '';
  return '<div class="fipi-media-grid' + (media.length === 1 ? ' single' : '') + '">' + media.map(item => {
    const embedded = item.status === 'embedded' && item.file;
    return '' +
      '<figure class="fipi-media-item">' +
        (embedded
          ? '<a class="fipi-media-link" href="' + escapeHTML(item.file) + '" target="_blank" rel="noopener noreferrer"><img src="' + escapeHTML(item.file) + '" alt="' + escapeHTML(item.alt || item.caption || 'Официальное изображение ФИПИ') + '" loading="lazy" width="' + Number(item.width || 0) + '" height="' + Number(item.height || 0) + '"></a>'
          : '<div class="fipi-media-missing">' + icon('eye') + '<b>Изображение доступно по ссылке</b>' + externalLink(item.originalUrl, 'Открыть оригинал') + '</div>') +
        '<figcaption><b>' + escapeHTML(item.caption || 'Официальное изображение') + '</b><small>' + escapeHTML(item.originalLocation || '') + '</small><a href="' + escapeHTML(item.originalUrl || '') + '" target="_blank" rel="noopener noreferrer">Оригинал ФИПИ ' + icon('arrowUpRight') + '</a></figcaption>' +
      '</figure>';
  }).join('') + '</div>';
}

function renderFipiQuestionSource(question, revealAnswer) {
  const source = fipiSourceForQuestion(question);
  if (!source) {
    const topic = TOPIC_BY_ID[question.topicId];
    return '<div class="q-source"><span>Авторский аналог · объяснение по теме «' + escapeHTML(topic ? topic.title : '') + '»</span>' + fipiSubjectLink(question.subject, 'Сверить в банке ФИПИ') + '</div>';
  }
  const kind = fipiSourceKindLabel(question);
  const itemNumber = question.sourceItemNumber ? 'Задание ' + question.sourceItemNumber : 'Задание';
  const verified = source.verifiedAt ? formatDateFull(parseISO(source.verifiedAt)) : '';
  const answerNote = revealAnswer
    ? 'Официальный ответ: ' + escapeHTML(question.officialAnswer || '') + '.'
    : (question.optionsAuthored ? 'Варианты ответа добавлены тренажёром для самопроверки. Официальный ответ откроется после проверки.' : 'Официальный ответ откроется после проверки.');
  return '' +
    '<div class="fipi-source-panel">' +
      '<div class="fipi-source-top"><span class="fipi-badge">' + icon('bank') + 'Источник: ФИПИ</span><span class="tag">' + escapeHTML(kind) + '</span><span class="tag">' + escapeHTML(String(source.year)) + '</span><span class="tag">' + escapeHTML(itemNumber) + '</span></div>' +
      '<b class="fipi-source-title">' + escapeHTML(source.title) + '</b>' +
      '<div class="fipi-source-meta">' +
        '<span>Проверено: ' + escapeHTML(verified) + '</span>' +
        '<span>Документ: ' + escapeHTML(source.shortTitle || source.label) + '</span>' +
        '<a href="' + escapeHTML(source.url) + '" target="_blank" rel="noopener noreferrer">Открыть оригинал ' + icon('arrowUpRight') + '</a>' +
        '<a href="' + escapeHTML(source.pageUrl || FIPI_DEMO_PAGE) + '" target="_blank" rel="noopener noreferrer">Страница ФИПИ ' + icon('arrowUpRight') + '</a>' +
      '</div>' +
      '<small class="fipi-source-note">' + answerNote + '</small>' +
      '<small class="fipi-disclaimer">Официальные материалы ФИПИ не гарантируют появление именно этих заданий на экзамене.</small>' +
    '</div>';
}

function renderTrainerFilters(subjectId, topics) {
  const questions = topics.reduce((list, topic) => list.concat(topic.questions), []);
  const total = questions.length;
  const fipi = questions.filter(question => question.source === 'fipi').length;
  const authored = total - fipi;
  const sources = fipiSourcesForSubject(subjectId);
  const years = fipiYearsForSubject(subjectId);
  if (trainerDocFilter !== 'all' && !sources.some(source => source.id === trainerDocFilter)) trainerDocFilter = 'all';
  if (trainerYearFilter !== 'all' && !years.includes(Number(trainerYearFilter))) trainerYearFilter = 'all';
  const hasFilter = trainerSourceFilter !== 'all' || trainerDocFilter !== 'all' || trainerYearFilter !== 'all';
  const sourceItems = [
    ['all', 'Все', total],
    ['fipi', 'ФИПИ', fipi],
    ['authored', 'Авторские', authored]
  ];
  return '' +
    '<div class="trainer-filters">' +
      '<div class="seg-chips trainer-source-chips">' + sourceItems.map(([id, label, count]) => (
        '<button class="seg-chip' + (trainerSourceFilter === id ? ' active' : '') + '" data-action="trainer-source" data-source="' + id + '">' + label + ' · ' + count + '</button>'
      )).join('') + '</div>' +
      '<div class="trainer-selects">' +
        '<label class="trainer-select"><span>Документ</span><select data-trainer-filter="doc"' + (trainerSourceFilter === 'authored' ? ' disabled' : '') + '><option value="all">Все документы</option>' + sources.map(source => '<option value="' + escapeHTML(source.id) + '"' + (trainerDocFilter === source.id ? ' selected' : '') + '>' + escapeHTML(source.shortTitle || source.label) + '</option>').join('') + '</select></label>' +
        '<label class="trainer-select"><span>Год</span><select data-trainer-filter="year"' + (trainerSourceFilter === 'authored' ? ' disabled' : '') + '><option value="all">Все годы</option>' + years.map(year => '<option value="' + year + '"' + (String(trainerYearFilter) === String(year) ? ' selected' : '') + '>' + year + '</option>').join('') + '</select></label>' +
        (hasFilter ? '<button class="btn btn-ghost btn-sm trainer-reset" data-action="trainer-reset-filters">Сбросить</button>' : '') +
      '</div>' +
    '</div>';
}

function renderTrainerEmptyState(mode) {
  const officialOnly = mode === 'fipi';
  return '' +
    '<div class="card pad empty-state trainer-empty" style="margin-top:12px">' +
      '<div class="empty-ico">' + icon(officialOnly ? 'bank' : 'filter') + '</div>' +
      '<b>' + (officialOnly ? 'Официальные задания ещё не добавлены' : 'Под выбранные фильтры заданий нет') + '</b>' +
      '<small>' + (officialOnly ? 'Для этого предмета пока нет официальных карточек в тренажёре. Откройте первоисточник и решайте задания напрямую — прогресс можно внести в журнале ФИПИ.' : 'Измените источник, документ, год или фильтр тем. Авторские и официальные карточки не смешиваются.') + '</small>' +
      '<div class="trainer-empty-actions">' +
        (officialOnly ? fipiSubjectLink(trainerSubject, 'Открыть открытый банк ФИПИ', 'btn btn-primary btn-sm') : '<button class="btn btn-secondary btn-sm" data-action="trainer-reset-filters">Сбросить фильтры</button>') +
        '<button class="btn btn-ghost btn-sm" data-action="open-fipi-journal">' + icon('bank') + 'Журнал ФИПИ</button>' +
      '</div>' +
    '</div>';
}

function renderTrainerTaskList(subjectId, topics) {
  const tasks = topics
    .filter(topicFilterMatches)
    .flatMap(topic => topic.questions
      .filter(fipiQuestionMatchesFilters)
      .map((question, index) => ({ question, topic, index })));
  if (!tasks.length) {
    const officialInSubject = topics.some(topic => topic.questions.some(question => question.source === 'fipi'));
    return renderTrainerEmptyState(trainerSourceFilter === 'fipi' || (!officialInSubject && trainerDocFilter === 'all') ? 'fipi' : 'filters');
  }
  return '' +
    '<div class="fipi-task-list">' +
      tasks.map(({ question, topic }) => {
        const source = fipiSourceForQuestion(question);
        const mediaCount = fipiMediaForQuestion(question).length;
        return '' +
          '<button class="fipi-task-card" data-action="start-task" data-question="' + escapeHTML(question.id) + '">' +
            '<span class="fipi-task-head">' +
              (source
                ? '<span class="badge brand">' + icon('bank') + 'Источник: ФИПИ</span><span class="tag">' + escapeHTML(fipiSourceKindLabel(question)) + '</span><span class="tag">' + escapeHTML(String(source.year)) + '</span><span class="tag">№ ' + escapeHTML(question.sourceItemNumber || '—') + '</span>'
                : '<span class="badge gray">Авторское</span><span class="tag">Аналог в формате ЕГЭ</span>') +
              (question.answerKind === 'multi' ? '<span class="tag brand">Несколько ответов</span>' : '') +
              (mediaCount ? '<span class="tag">' + icon('eye') + 'Изображение</span>' : '') +
            '</span>' +
            '<span class="fipi-task-text">' + escapeHTML(question.text) + '</span>' +
            '<span class="fipi-task-meta"><span>' + escapeHTML(topic.title) + '</span><span>·</span><span>' + (source ? escapeHTML(source.shortTitle || source.label) : 'авторский банк «Фокуса»') + '</span></span>' +
            '<span class="fipi-task-open">Открыть задание ' + icon('arrowRight') + '</span>' +
          '</button>';
      }).join('') +
    '</div>';
}

function renderTrainerLobby() {
  if (!trainerSubject || !profileSubjects().includes(trainerSubject)) trainerSubject = profileSubjects()[0] || null;
  const subjectId = trainerSubject;
  const subject = subjectId ? SUBJECTS[subjectId] : null;
  const topics = subjectId ? topicsForSubject(subjectId) : [];
  const visibleTopics = topics.filter(topicFilterMatches);
  const mistakes = getMistakeEntries().length;
  const counts = topics.reduce((total, topic) => {
    const sourceCounts = topicSourceCounts(topic);
    total.all += sourceCounts.all;
    total.fipi += sourceCounts.fipi;
    total.authored += sourceCounts.authored;
    return total;
  }, { all: 0, fipi: 0, authored: 0 });
  return '' +
    '<div class="trainer-head">' +
      '<div><h1>Тренажёр</h1><p>Официальные задания ФИПИ из демоверсий и авторские аналоги по темам кодификатора. У официальных карточек всегда указан документ, номер и ссылка на первоисточник.</p></div>' +
      '<div class="page-actions">' +
        (mistakes ? '<button class="btn btn-secondary btn-sm" data-action="practice-mistakes">' + icon('rotate') + 'Ошибки · ' + mistakes + '</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-action="open-fipi-journal">' + icon('bank') + 'Журнал ФИПИ</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="start-micro" data-minutes="3">' + icon('zap') + '3 минуты</button>' +
        '<button class="btn btn-primary btn-sm" data-action="start-mixed">' + icon('zap') + 'Смешанная тренировка</button>' +
      '</div>' +
    '</div>' +
    '<div class="notice" style="margin-bottom:14px">' + icon('info') + '<div><b>Официальные материалы ФИПИ.</b> Карточки с бейджем «Источник: ФИПИ» взяты из демонстрационных вариантов 2026 года. Авторские аналоги не получают бейдж ФИПИ. <a href="' + escapeHTML(FIPI_DEMO_PAGE) + '" target="_blank" rel="noopener noreferrer">Первоисточники на fipi.ru ' + icon('arrowUpRight') + '</a></div></div>' +
    '<div class="subject-tabs">' + profileSubjects().map(id => (
      '<button class="subject-tab' + (id === subjectId ? ' active' : '') + '" data-action="trainer-subject" data-subject="' + id + '" style="' + sessionSubjectStyle(id) + '"><span class="dot"></span>' + SUBJECTS[id].short + '</button>'
    )).join('') + '</div>' +
    (subject ? '' +
      '<div class="practice-banner">' +
        '<div class="pb-ico">' + icon('target') + '</div>' +
        '<div><b>' + subject.name + '</b><small>' + counts.all + ' ' + pluralize(counts.all, ['задание', 'задания', 'заданий']) + ' · ФИПИ: ' + counts.fipi + ' · авторских: ' + counts.authored + ' · точность ' + subjectAccuracy(subject.id) + '%</small></div>' +
        '<button class="btn btn-secondary btn-sm" data-action="start-subject-practice" data-subject="' + subject.id + '">' + icon('play') + 'Случайные 8</button>' +
      '</div>' +
      '<div class="trainer-mode-row">' +
        '<div class="trainer-mode-switch" role="group" aria-label="Режим тренажёра">' +
          '<button class="' + (trainerListMode === 'topics' ? 'active' : '') + '" data-action="trainer-list-mode" data-mode="topics">Темы</button>' +
          '<button class="' + (trainerListMode === 'tasks' ? 'active' : '') + '" data-action="trainer-list-mode" data-mode="tasks">Задания</button>' +
        '</div>' +
        '<span class="small muted">' + (trainerListMode === 'topics' ? 'Выберите тему — тренировка пойдёт по текущим фильтрам.' : 'Откройте одно задание или начните подборку по фильтрам.') + '</span>' +
      '</div>' +
      renderTrainerFilters(subject.id, topics) +
      (trainerListMode === 'tasks'
        ? '<div class="practice-toolbar"><p>Задания по выбранному предмету. Клик открывает одну карточку.</p><span class="tag">' + topics.length + ' ' + pluralize(topics.length, ['тема', 'темы', 'тем']) + '</span></div>' + renderTrainerTaskList(subject.id, topics)
        : '<div class="practice-toolbar"><p>Выберите тему или начните тренировку по всему предмету.</p><div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">' + fipiSubjectLink(subject.id, 'Открытый банк ФИПИ', 'btn btn-ghost btn-sm') + '<span class="tag">' + topics.length + ' ' + pluralize(topics.length, ['тема', 'темы', 'тем']) + '</span></div></div>' +
          renderTopicFilterChips(topics) +
          (visibleTopics.length ? '<div class="practice-topics">' + visibleTopics.map(topic => {
            const progress = state.progress.topics[topic.id] || {};
            const due = reviewDueLabel(topic.id);
            const showDue = (progress.practice || Number(progress.attempts || 0) > 0) && due.text !== 'новая';
            const sourceCounts = topicSourceCounts(topic);
            const available = topic.questions.filter(fipiQuestionMatchesFilters).length;
            const meta = (subject.isEssay ? 'Этап' : 'Часть ' + topic.part) + ' · ФИПИ: ' + sourceCounts.fipi + ' · авторских: ' + sourceCounts.authored + ' · всего ' + sourceCounts.all + (showDue ? ' · ' + due.text : '');
            if (!available) {
              const officialEmpty = trainerSourceFilter === 'fipi' && sourceCounts.fipi === 0;
              return '' +
                '<div class="practice-topic is-empty">' +
                  '<span class="subject-mark">' + icon(officialEmpty ? 'bank' : 'filter') + '</span>' +
                  '<span class="practice-topic-info"><b>' + escapeHTML(topic.title) + '</b><small>' + meta + '</small>' +
                    '<span class="topic-empty-note">' + (officialEmpty ? 'Официальные задания ещё не добавлены. ' : 'Под выбранные фильтры заданий нет. ') + (officialEmpty ? fipiSubjectLink(subject.id, 'Открыть банк ФИПИ') : '<button class="section-link" data-action="trainer-reset-filters">Сбросить фильтры</button>') + '</span>' +
                  '</span>' +
                '</div>';
            }
            return '' +
              '<button class="practice-topic" data-action="start-practice" data-topic="' + topic.id + '">' +
                '<span class="subject-mark">' + (Number(progress.attempts || 0) ? Math.round(Number(progress.best || 0)) + '%' : icon('play')) + '</span>' +
                '<span class="practice-topic-info"><b>' + escapeHTML(topic.title) + '</b><small>' + meta + '</small></span>' +
                '<span class="arrow">' + icon('arrowRight') + '</span>' +
              '</button>';
          }).join('') + '</div>' : '<div class="card pad empty-state" style="margin-top:12px"><div class="empty-ico">' + icon('checkCircle') + '</div><b>Под этот фильтр тем нет</b><small>Переключите фильтр или начните смешанную тренировку.</small><button class="btn btn-secondary btn-sm" data-action="topic-filter" data-filter="all">Показать все темы</button></div>'))
    : '<div class="empty-state"><b>Нет выбранных предметов</b><small>Измените профиль, чтобы выбрать предметы.</small></div>');
}

function renderQuiz() {
  if (!trainer) return renderTrainerLobby();
  if (trainer.finished) return renderTrainerResult();
  const question = QUESTION_BY_ID[trainer.queue[trainer.index]];
  if (!question) return renderTrainerLobby();
  const topic = TOPIC_BY_ID[question.topicId];
  const subject = SUBJECTS[question.subject];
  const answer = trainer.answers[trainer.index];
  const isLast = trainer.index >= trainer.queue.length - 1;
  const progress = Math.round((trainer.index) / trainer.queue.length * 100);
  const optionOrder = resolveOptionOrder(question, trainer.optionOrders?.[question.id]);
  const letters = optionLetters(optionOrder.length);
  const isMulti = question.answerKind === 'multi';
  const selected = selectedDisplayIndexes(trainer.selected);
  const correctOriginal = Array.isArray(question.correct) ? question.correct : [question.correct];
  const correctDisplayIndexes = correctOriginal.map(original => optionOrder.indexOf(original)).filter(index => index >= 0);
  const correctLetters = correctDisplayIndexes.map(index => letters[index]).join(', ');
  const source = fipiSourceForQuestion(question);
  return '' +
    '<div class="quiz-shell">' +
      '<div class="quiz-top">' +
        '<div class="quiz-top-left"><button class="btn btn-ghost btn-sm" data-action="trainer-exit">' + icon('arrowLeft') + 'Выйти</button><span class="tag">' + subject.short + '</span><span class="tag">' + (trainer.mode === 'surprise' ? 'Внезапный экзамен' : trainer.mode === 'micro' ? 'Микро-сессия' : trainer.mode === 'mock' ? 'Пробник' : trainer.mode === 'mistakes' ? 'Работа над ошибками' : trainer.mode === 'review' ? 'Повторение' : topic ? 'Тема: ' + topic.title : 'Смешанная') + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (trainer.mode === 'surprise' ? '<span class="tag brand" data-surprise-timer>' + icon('clock') + '<b>' + surpriseTimeLeft + '</b>&nbsp;с</span>' : '') +
          '<span class="quiz-progress-text">' + (trainer.index + 1) + ' / ' + trainer.queue.length + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="quiz-progress"><span style="width:' + progress + '%"></span></div>' +
      (trainer.mode === 'surprise' ? '<div class="quiz-progress" style="height:3px;margin-top:4px"><span data-surprise-bar style="width:' + clamp(surpriseTimeLeft / 30 * 100, 0, 100) + '%;background:var(--orange);transition:width 1s linear"></span></div>' : '') +
      '<div class="quiz-card">' +
        '<div class="quiz-meta">' +
          '<span class="quiz-qnum">' + (trainer.index + 1) + '</span>' +
          '<span class="tag brand">' + (subject.isEssay ? 'Этап' : 'Часть ' + question.part) + '</span>' +
          (trainer.contextLabel ? '<span class="tag brand">' + escapeHTML(trainer.contextLabel) + '</span>' : '') +
          '<span class="tag">' + (topic ? topic.title : 'Смешанная тренировка') + '</span>' +
          (source ? '<span class="tag">ФИПИ · ' + escapeHTML(fipiSourceKindLabel(question)) + '</span>' : '<span class="tag">Авторский аналог</span>') +
          (isMulti ? '<span class="tag brand">Выберите все верные ответы</span>' : '') +
          '<span class="tag" style="margin-left:auto">' + (subject.isEssay ? 'Формат допуска' : 'Формат ЕГЭ') + '</span>' +
        '</div>' +
        '<div class="quiz-question">' + escapeHTML(question.text) + '</div>' +
        renderFipiQuestionMedia(question) +
        (source ? renderFipiQuestionSource(question, trainer.checked) : '') +
        '<div class="quiz-options">' + optionOrder.map((originalIndex, index) => {
          let className = 'quiz-option';
          const selectedNow = selected.includes(index);
          if (trainer.checked) {
            className += ' disabled';
            if (correctDisplayIndexes.includes(index)) className += ' correct';
            else if (selectedNow) className += ' wrong';
          } else if (selectedNow) {
            className += ' selected';
          }
          const verdict = trainer.checked
            ? (correctDisplayIndexes.includes(index) ? 'correct' : (selectedNow ? 'wrong' : ''))
            : '';
          return '<button class="' + className + '" data-action="quiz-option" data-index="' + index + '">' + verdictBadge(letters[index], verdict) + '<span>' + escapeHTML(question.options[originalIndex]) + '</span>' + (isMulti ? '<span class="option-mark">' + (selectedNow ? icon('check') : '') + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        (trainer.checked && answer ? '' +
          '<div class="quiz-explanation ' + (answer.correct ? 'good' : 'bad') + '">' +
            '<div class="quiz-explanation-top">' + icon(answer.correct ? 'checkCircle' : 'alert') + (answer.correct ? 'Верно' : 'Неверно. Правильные ответы — ' + correctLetters) + '</div>' +
            '<p>' + escapeHTML(question.explanation) + '</p>' +
            (source
              ? '<div class="q-source"><span>Источник: ФИПИ · ' + escapeHTML(source.label) + ' · задание ' + escapeHTML(question.sourceItemNumber || '—') + ' · проверено ' + escapeHTML(source.verifiedAt ? formatDateFull(parseISO(source.verifiedAt)) : '') + '</span>' + externalLink(source.url, 'Открыть оригинал') + '</div>'
              : '<div class="q-source"><span>Авторский аналог · объяснение по теме «' + escapeHTML(topic ? topic.title : '') + '»</span>' + fipiSubjectLink(question.subject, 'Сверить в банке ФИПИ') + '</div>') +
          '</div>'
        : '') +
        '<div class="quiz-footer">' +
          '<span class="hint">' + icon('info') + (trainer.mode === 'surprise' && !trainer.checked ? '30 секунд на ответ. Время вышло — задание уходит в ошибки, без штрафа.' : trainer.checked ? (answer?.correct ? 'Отличный шаг. Дальше — закрепление.' : 'Ошибка — это материал для журнала ошибок.') : isMulti ? 'Отметьте все верные варианты, затем проверьте.' : 'Один ответ. Без подсказок.') + '</span>' +
          '<div class="quiz-footer-actions">' +
            (question.topicId && TOPIC_BY_ID[question.topicId]
              ? '<button class="btn btn-ghost btn-sm" data-action="open-theory" data-topic="' + question.topicId + '">' + icon('bookOpen') + 'К теории</button>'
              : '') +
            (trainer.checked
              ? '<button class="btn btn-primary btn-sm" data-action="quiz-next">' + (isLast ? 'Завершить' : 'Следующий вопрос') + icon('arrowRight') + '</button>'
              : '<button class="btn btn-primary btn-sm" data-action="quiz-check"' + (!selected.length ? ' disabled' : '') + '>' + icon('check') + 'Проверить</button>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderTrainerResult() {
  if (!trainer) return renderTrainerLobby();
  const total = trainer.queue.length;
  const correct = trainer.answers.filter(answer => answer?.correct).length;
  const percent = total ? Math.round(correct / total * 100) : 0;
  const topic = trainer.topicId ? TOPIC_BY_ID[trainer.topicId] : null;
  return '' +
    '<div class="result-card card">' +
      '<div class="result-orb" style="--score:' + percent + '%"><div class="result-orb-inner"><b>' + percent + '%</b><small>результат</small></div></div>' +
      '<h2>' + (percent >= 80 ? 'Тема держится уверенно' : percent >= 50 ? 'База есть, закрепим' : 'Нормальный старт') + '</h2>' +
      '<p>' + (percent >= 80 ? 'Можно переходить к следующей теме, но вернитесь к ошибкам через пару дней.' : percent >= 50 ? 'Разберите объяснения к ошибкам и пройдите тренировку ещё раз через день.' : 'Не спешите. Откройте теорию, разберите алгоритм и вернитесь к карточкам — так будет спокойнее.') + '</p>' +
      '<div class="result-stats">' +
        '<div class="result-stat"><b>' + correct + ' / ' + total + '</b><small>верно</small></div>' +
        '<div class="result-stat"><b>' + (total - correct) + '</b><small>в журнал ошибок</small></div>' +
        '<div class="result-stat"><b>' + (trainer.contextLabel ? escapeHTML(trainer.contextLabel) : topic ? topic.title : trainer.mode === 'surprise' ? 'Внезапный экзамен' : trainer.mode === 'micro' ? 'Микро-сессия' : trainer.mode === 'mock' ? 'Пробник' : trainer.mode === 'review' ? 'Повторение' : trainer.mode === 'mistakes' ? 'Работа над ошибками' : trainer.mode === 'fipi' ? 'ФИПИ' : 'Смешанная') + '</b><small>тренировка</small></div>' +
      '</div>' +
      '<div class="encourage-line" style="justify-content:center;text-align:left;max-width:430px;margin:12px auto 0">' + icon('lightbulb') + '<span>' + escapeHTML(resultEncouragement(percent)) + '</span></div>' +
      '<div class="result-actions">' +
        (trainer.mode === 'mistakes'
          ? '<button class="btn btn-primary btn-sm" data-action="trainer-exit">' + icon('alert') + 'К ошибкам</button>' +
            '<button class="btn btn-secondary btn-sm" data-action="trainer-retry">' + icon('rotate') + 'Ещё раз</button>'
          : '<button class="btn btn-primary btn-sm" data-action="trainer-retry">' + icon('rotate') + 'Ещё раз</button>') +
        (topic ? '<button class="btn btn-secondary btn-sm" data-action="open-theory" data-topic="' + topic.id + '">' + icon('bookOpen') + 'К теории</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-action="trainer-exit" data-view="trainer">К тренажёру</button>' +
      '</div>' +
    '</div>';
}

function renderTrainer() {
  if (trainer) return renderQuiz();
  return renderTrainerLobby();
}

function addMistake(questionId, selectedIndex) {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return;
  const existing = state.progress.mistakes[questionId];
  state.progress.mistakes[questionId] = {
    questionId,
    count: (existing?.count || 0) + 1,
    lastAt: new Date().toISOString(),
    lastWrong: selectedIndex
  };
}

function finishTrainer() {
  if (!trainer || trainer.finished) return;
  clearTrainerTimer();
  const total = trainer.queue.length;
  const correct = trainer.answers.filter(answer => answer?.correct).length;
  const percent = total ? Math.round(correct / total * 100) : 0;
  if (trainer.mode === 'surprise') {
    const surprise = state.progress.surprise;
    surprise.attempts += 1;
    surprise.best = Math.max(Number(surprise.best || 0), percent);
    surprise.lastAt = new Date().toISOString();
    surprise.history.push({ date: toISO(new Date()), correct, total });
    surprise.history = surprise.history.slice(-60);
  }
  const byTopic = {};
  trainer.answers.forEach((answer, index) => {
    if (!answer) return;
    const question = QUESTION_BY_ID[trainer.queue[index]];
    if (!question) return;
    if (!byTopic[question.topicId]) byTopic[question.topicId] = { correct: 0, total: 0 };
    byTopic[question.topicId].total += 1;
    if (answer.correct) byTopic[question.topicId].correct += 1;
  });
  Object.entries(byTopic).forEach(([topicId, value]) => {
    const progress = topicProgress(topicId);
    progress.practice = true;
    progress.attempts = Number(progress.attempts || 0) + 1;
    progress.best = Math.max(Number(progress.best || 0), Math.round(value.correct / value.total * 100));
    progress.lastPractice = new Date().toISOString();
  });
  state.progress.quizHistory.push({
    date: new Date().toISOString(),
    subject: trainer.subject,
    topicId: trainer.topicId,
    mode: trainer.mode,
    total,
    correct
  });
  if (trainer.originSessionId) {
    const session = (state.plan?.sessions || []).find(item => item.id === trainer.originSessionId);
    if (session && !sessionIsDone(session.id)) {
      completeSessionInternal(trainer.originSessionId, { noActivity: true });
      addActivity(session.duration, session.date);
    }
  } else {
    addActivity(Math.max(5, Math.round(total * 1.5)));
  }
  trainer.finished = true;
  saveState();
  render();
}

function getMistakeEntries() {
  return Object.values(state.progress.mistakes || {})
    .map(item => ({ ...item, question: QUESTION_BY_ID[item.questionId] }))
    .filter(item => item.question && profileSubjects().includes(item.question.subject))
    .sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)));
}

function mistakesForCurrentFilter() {
  const entries = getMistakeEntries();
  if (mistakeFilter === 'all') return entries;
  return entries.filter(item => item.question.subject === mistakeFilter);
}

function renderMistakes() {
  const entries = mistakesForCurrentFilter();
  const allEntries = getMistakeEntries();
  const subjectCounts = {};
  allEntries.forEach(item => {
    subjectCounts[item.question.subject] = (subjectCounts[item.question.subject] || 0) + 1;
  });
  return '' +
    '<div class="page-head">' +
      '<div><h1>Журнал ошибок</h1><p>Ошибки — не приговор, а карта слабых мест. Разберите их и вернитесь в тему через 2–3 дня.</p></div>' +
      '<div class="page-actions">' +
        (allEntries.length ? '<button class="btn btn-secondary btn-sm" data-action="practice-mistakes">' + icon('rotate') + 'Тренировать все</button><button class="btn btn-ghost btn-sm" data-action="open-clear-mistakes">Очистить</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="mistakes-toolbar">' +
      '<div class="seg-chips">' +
        '<button class="seg-chip' + (mistakeFilter === 'all' ? ' active' : '') + '" data-action="mistake-filter" data-filter="all">Все · ' + allEntries.length + '</button>' +
        profileSubjects().map(id => '<button class="seg-chip' + (mistakeFilter === id ? ' active' : '') + '" data-action="mistake-filter" data-filter="' + id + '">' + SUBJECTS[id].short + ' · ' + (subjectCounts[id] || 0) + '</button>').join('') +
      '</div>' +
      '<span class="small muted">' + (entries.length ? 'Сначала свежие ошибки' : 'Пока пусто') + '</span>' +
    '</div>' +
    (entries.length ? '<div class="mistakes-list">' + entries.map(item => {
      const question = item.question;
      const topic = TOPIC_BY_ID[question.topicId];
      const subject = SUBJECTS[question.subject];
      const wrongList = Array.isArray(item.lastWrong) ? item.lastWrong : [item.lastWrong];
      const rightList = Array.isArray(question.correct) ? question.correct : [question.correct];
      const wrongAnswer = wrongList.map(index => question.options[index]).filter(Boolean).join('; ') || '—';
      const rightAnswer = rightList.map(index => question.options[index]).filter(Boolean).join('; ');
      const source = question.source === 'fipi' ? fipiSourceForQuestion(question) : null;
      return '' +
        '<article class="mistake-card">' +
          '<div class="mistake-top">' +
            '<span class="tag brand subject-tag" style="--subj-color:' + subject.color + ';--subj-soft:' + subject.soft + '">' + subject.short + '</span>' +
            (source
              ? '<span class="badge brand">' + icon('bank') + 'Источник: ФИПИ</span><span class="tag">' + escapeHTML(fipiSourceKindLabel(question)) + '</span><span class="tag">№ ' + escapeHTML(question.sourceItemNumber || '—') + '</span>'
              : '') +
            '<span class="tag">' + escapeHTML(topic?.title || 'Тема') + '</span>' +
            '<span class="tag">' + (subject.isEssay ? 'Этап' : 'Часть ' + question.part) + '</span>' +
            '<span class="mistake-count">' + item.count + ' ' + pluralize(item.count, ['ошибка', 'ошибки', 'ошибок']) + '</span>' +
          '</div>' +
          '<div class="mistake-q">' + escapeHTML(question.text) + '</div>' +
          (source
            ? '<div class="fipi-source-meta mistake-source"><span>Документ: ' + escapeHTML(source.shortTitle || source.label) + '</span><span>' + escapeHTML(String(source.year)) + ' · задание ' + escapeHTML(question.sourceItemNumber || '—') + '</span><span>Проверено: ' + escapeHTML(source.verifiedAt ? formatDateFull(parseISO(source.verifiedAt)) : '') + '</span><a href="' + escapeHTML(source.url) + '" target="_blank" rel="noopener noreferrer">Открыть оригинал ' + icon('arrowUpRight') + '</a></div>'
            : '') +
          '<div class="mistake-answers"><span class="wrong">Вы ответили: ' + escapeHTML(wrongAnswer) + '</span><span class="right">Верно: ' + escapeHTML(rightAnswer) + '</span></div>' +
          '<div class="mistake-actions">' +
            '<button class="btn btn-soft" data-action="practice-mistake" data-question="' + question.id + '">' + icon('rotate') + 'Решить снова</button>' +
            '<button class="btn btn-secondary" data-action="open-theory" data-topic="' + question.topicId + '">' + icon('bookOpen') + 'К теории</button>' +
            '<button class="btn btn-ghost" data-action="remove-mistake" data-question="' + question.id + '">' + icon('check') + 'Уже не ошибаюсь</button>' +
          '</div>' +
          '<details class="mistake-details"><summary>Показать объяснение</summary><p>' + escapeHTML(question.explanation) + '</p></details>' +
        '</article>';
    }).join('') + '</div>' : '' +
      '<div class="card pad empty-state" style="padding:54px 24px"><div class="empty-ico">' + icon('checkCircle') + '</div><b>Журнал ошибок пуст</b><small>Это не значит, что ошибок не будет. Пройдите практику — сюда попадут задания, где нужен разбор.</small><button class="btn btn-primary btn-sm" data-action="nav" data-view="trainer">' + icon('target') + 'Начать тренировку</button></div>') +
    '<div class="notice" style="margin-top:16px">' + icon('lightbulb') + '<div>Ошибка исчезает из журнала автоматически после правильного решения. Если задание даётся тяжело, вернитесь к теории и объяснению, а не просто перещёлкивайте ответы.</div></div>';
}

function renderProgress() {
  const totalMinutes = Object.values(state.progress.activity || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const days = Array.from({ length: 14 }, (_, index) => addDays(startOfDay(new Date()), index - 13));
  const maxMinutes = Math.max(30, ...days.map(day => Number(state.progress.activity[toISO(day)] || 0)));
  const doneEntries = Object.entries(state.progress.sessions || {})
    .filter(([, value]) => value?.doneAt)
    .sort((a, b) => String(b[1].doneAt).localeCompare(String(a[1].doneAt)))
    .map(([id, value]) => {
      const session = (state.plan?.sessions || []).find(item => item.id === id);
      return session ? { session, doneAt: value.doneAt } : null;
    })
    .filter(Boolean)
    .slice(0, 6);
  const overdue = overdueSessions().slice(0, 3);
  const weak = topWeakTopics(3).filter(topic => !isTopicDone(topic.id)).slice(0, 3);
  const lagItems = overdue.map(session => ({
    icon: 'calendar',
    title: (TOPIC_BY_ID[session.topicId]?.title || session.title),
    note: 'Пропущено ' + formatDateShort(session.date) + ' · ' + SUBJECTS[session.subject].short,
    action: session.type === 'theory' ? 'open-theory' : session.type === 'mock' ? 'start-mock' : 'start-practice',
    topicId: session.topicId,
    subject: session.subject,
    sessionId: session.id,
    label: 'Вернуться'
  })).concat(weak.map(topic => ({
    icon: 'target',
    title: topic.title,
    note: SUBJECTS[topic.subject].short + ' · вес ' + topic.weight + '/5 · ' + (state.progress.topics[topic.id]?.attempts ? 'лучший результат ' + (state.progress.topics[topic.id]?.best || 0) + '%' : 'ещё не практиковались'),
    action: 'start-practice',
    topicId: topic.id,
    subject: topic.subject,
    label: 'Практика'
  }))).slice(0, 5);
  const statCards = [
    ['checkCircle', totalTopicsDone() + ' / ' + totalSelectedTopics(), 'тем освоено', '#e7f8f0', '#12b76a'],
    ['clock', formatMinutes(totalMinutes), 'всего практики', '#eaf4ff', '#2e90fa'],
    ['target', overallAccuracy() ? overallAccuracy() + '%' : '—', 'точность ответов', '#eeecff', '#5146e5'],
    ['flame', currentStreak() + ' ' + pluralize(currentStreak(), ['день', 'дня', 'дней']), 'текущая серия', '#fff4e5', '#f79009']
  ].map(item => '<div class="stat-card"><div class="stat-icon" style="--icon-bg:' + item[3] + ';--icon-color:' + item[4] + '">' + icon(item[0]) + '</div><div><b>' + item[1] + '</b><small>' + item[2] + '</small></div></div>').join('');
  return '' +
    '<div class="page-head">' +
      '<div><h1>Прогресс</h1><p>Не только проценты: важно, что вы уже сделали и где нужен следующий шаг.</p></div>' +
      '<div class="page-actions"><button class="btn btn-secondary btn-sm" data-action="nav" data-view="mistakes">' + icon('alert') + 'Журнал ошибок</button><button class="btn btn-primary btn-sm" data-action="nav" data-view="plan">' + icon('calendar') + 'К плану</button></div>' +
    '</div>' +
    '<div class="stat-grid" style="margin-bottom:16px">' + statCards + '</div>' +
    '<div style="margin-bottom:16px">' + renderForecastDetail() + '</div>' +
    '<div style="margin-bottom:16px">' + renderPseCard() + '</div>' +
    '<div class="mind-grid">' + renderReflectionCard() + renderMoodCard() + '</div>' +
    '<div style="margin-top:16px;margin-bottom:16px">' + renderAnxietyCard() + '</div>' +
    '<div class="progress-page-grid">' +
      '<div>' +
        '<section class="card activity-card" style="margin-bottom:16px">' +
          '<div class="activity-head"><div><h2>Ритм занятий</h2><p>Минуты учебной активности за 14 дней</p></div><div class="activity-total"><b>' + formatMinutes(weeklyMinutes()) + '</b><small>за 7 дней</small></div></div>' +
          '<div class="activity-bars">' + days.map(day => {
            const iso = toISO(day);
            const minutes = Number(state.progress.activity[iso] || 0);
            const height = Math.max(2, Math.round(minutes / maxMinutes * 100));
            return '<div class="activity-day' + (minutes > maxMinutes * .65 ? ' high' : '') + (iso === toISO(new Date()) ? ' today' : '') + '"><div class="activity-bar-wrap"><div class="activity-bar" style="height:' + height + '%"></div></div><small>' + day.getDate() + '</small><span class="mins">' + (minutes ? minutes : '') + '</span></div>';
          }).join('') + '</div>' +
          '<div class="notice" style="margin-top:16px">' + icon('info') + '<div>Серия считается по дням с завершёнными занятиями или практикой. Пропуск одного дня не обнуляет прогресс — просто возвращайтесь в ритм.</div></div>' +
        '</section>' +
        '<section class="card pad">' +
          '<div class="card-head"><div><h3>Предметы</h3><p>Темы, где есть и теория, и практика</p></div><span class="badge brand">' + profileSubjects().length + ' ' + pluralize(profileSubjects().length, ['предмет', 'предмета', 'предметов']) + '</span></div>' +
          '<div style="margin-top:12px">' + profileSubjects().map(id => {
            const subject = SUBJECTS[id];
            const topics = topicsForSubject(id);
            const done = topics.filter(topic => isTopicDone(topic.id)).length;
            const percent = topics.length ? Math.round(done / topics.length * 100) : 0;
            return '<div style="padding:13px 0;border-bottom:1px solid var(--line-2)">' +
              '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px"><span class="legend-dot" style="background:' + subject.color + '"></span><b style="font-size:11.5px">' + subject.short + '</b><span class="small muted" style="margin-left:auto;font-size:9.5px">' + done + ' / ' + topics.length + ' тем · ' + subjectAccuracy(id) + '%</span></div>' +
              '<div class="coverage-track"><span style="width:' + percent + '%;background:' + subject.color + '"></span></div>' +
            '</div>';
          }).join('') + '</div>' +
        '</section>' +
      '</div>' +
      '<div>' +
        '<section class="card pad" style="margin-bottom:16px">' +
          '<div class="card-head"><div><h3>Что отстаёт</h3><p>Следующие шаги, а не приговор</p></div></div>' +
          (lagItems.length ? '<div class="lag-list" style="margin-top:12px">' + lagItems.map(item => '' +
            '<div class="lag-item"><span class="lag-ico">' + icon(item.icon) + '</span><div style="min-width:0"><b>' + escapeHTML(item.title) + '</b><small>' + escapeHTML(item.note) + '</small></div><button class="btn btn-soft" data-action="' + item.action + '" data-topic="' + (item.topicId || '') + '" data-subject="' + (item.subject || '') + '" data-session="' + (item.sessionId || '') + '">' + item.label + '</button></div>'
          ).join('') + '</div>' : '<div class="empty-state" style="padding:24px 10px"><b>Всё под контролем</b><small>Нет просроченных занятий. Можно двигаться по плану.</small></div>') +
        '</section>' +
        '<section class="card pad">' +
          '<div class="card-head"><div><h3>Что сделано</h3><p>Последние завершённые шаги</p></div><span class="badge mint">' + Object.keys(state.progress.sessions || {}).filter(id => sessionIsDone(id)).length + '</span></div>' +
          (doneEntries.length ? '<div class="done-list" style="margin-top:8px">' + doneEntries.map(item => '' +
            '<div class="done-item"><span class="done-check">' + icon('check') + '</span><b>' + escapeHTML(TOPIC_BY_ID[item.session.topicId]?.title || item.session.title) + '</b><small>' + formatDate(new Date(item.doneAt), { day: 'numeric', month: 'short' }) + '</small></div>'
          ).join('') + '</div>' : '<div class="empty-state" style="padding:24px 10px"><b>Пока нет отметок</b><small>Отметьте занятие выполненным или пройдите практику.</small></div>') +
        '</section>' +
      '</div>' +
    '</div>';
}

function renderForecastDetail() {
  const { forecast, trend } = forecastOverview();
  const sparkDays = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(new Date()), index - 6));
  const subjectRows = forecast.subjects.map(item => {
    const subject = SUBJECTS[item.subjectId];
    return '' +
      '<div class="subject-forecast-row" style="--subj-color:' + subject.color + '">' +
        '<div class="subject-forecast-name"><span class="legend-dot" style="background:' + subject.color + '"></span><span>' + escapeHTML(subject.short) + '</span></div>' +
        '<div class="subject-forecast-score">' + item.low + '–' + item.high + ' <small>· ' + item.score + ' б.</small></div>' +
        '<div class="subject-forecast-track"><span style="width:' + item.score + '%"></span></div>' +
      '</div>';
  }).join('');
  return '' +
    '<section class="card forecast-detail">' +
      '<div class="card-head">' +
        '<div><h3>Прогноз баллов</h3><p>Живая оценка по закрытым темам, весам КИМ и точности практики</p></div>' +
        '<span class="badge brand">' + icon('trendUp') + 'обновляется сразу</span>' +
      '</div>' +
      (forecast.maxTotal ? '' +
        '<div class="forecast-detail-top">' +
          '<div class="forecast-big">' +
            '<b>' + forecast.lowTotal + '–' + forecast.highTotal + '</b>' +
            '<small>сумма по ' + forecast.subjects.length + ' ' + pluralize(forecast.subjects.length, ['предмету', 'предметам', 'предметам']) + ' · средний ' + forecast.avg + ' из 100</small>' +
            forecastTrendHTML(trend) +
          '</div>' +
          '<div style="flex:1;min-width:160px">' +
            '<div class="forecast-spark">' + forecastSparkBars() + '</div>' +
            '<div class="forecast-spark-labels">' + sparkDays.map(day => '<span>' + WEEKDAYS_SHORT[day.getDay()] + '</span>').join('') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="subject-forecast-list">' + subjectRows +
          (forecast.essay ? '<div class="subject-forecast-row" style="--subj-color:' + SUBJECTS.essay.color + '">' +
            '<div class="subject-forecast-name"><span class="legend-dot" style="background:' + SUBJECTS.essay.color + '"></span><span>Сочинение</span></div>' +
            '<div class="subject-forecast-score">' + (forecast.essay.ready ? 'допуск' : forecast.essay.done + ' / ' + forecast.essay.total) + ' <small>· ' + (forecast.essay.ready ? 'готово' : 'этапов') + '</small></div>' +
            '<div class="subject-forecast-track"><span style="width:' + Math.round(forecast.essay.done / forecast.essay.total * 100) + '%;background:' + SUBJECTS.essay.color + '"></span></div>' +
          '</div>' : '') +
        '</div>' +
        '<div class="forecast-foot-note">Это ориентир, а не официальный балл: прогноз пересчитывается после каждой практики и учитывает покрытие тем. Чем больше реальных ответов, тем уже диапазон.</div>'
      : '<div class="empty-state" style="padding:30px 16px"><div class="empty-ico">' + icon('chart') + '</div><b>Пока нечего прогнозировать</b><small>Добавьте хотя бы один предмет ЕГЭ, кроме сочинения.</small></div>') +
    '</section>';
}

function renderDailyQuestionCard() {
  const meta = dailyQuestionMeta();
  if (!meta || !meta.question) return '';
  const { daily, question, topic } = meta;
  const subject = SUBJECTS[question.subject];
  const answeredDays = dailyQuestionCount();
  const explanationClass = daily.correct ? 'good' : 'bad';
  const optionOrder = resolveOptionOrder(question, daily.order);
  const correctDisplayIndex = optionOrder.indexOf(question.correct);
  return '' +
    '<section class="card pad daily-card">' +
      '<div class="card-head">' +
        '<div><div class="daily-top"><span class="badge brand">' + icon('quote') + 'Вопрос дня</span><span class="tag">' + escapeHTML(subject.short) + '</span><span class="tag">' + escapeHTML(topic ? topic.title : 'Слабая тема') + '</span></div><p style="margin-top:8px">Одна короткая карточка из темы, которая сейчас просит внимания.</p></div>' +
        '<span class="badge mint">' + answeredDays + ' ' + pluralize(answeredDays, ['день', 'дня', 'дней']) + ' с вопросом</span>' +
      '</div>' +
      '<div class="daily-question">' + escapeHTML(question.text) + '</div>' +
      '<div class="daily-options">' + optionOrder.map((originalIndex, index) => {        let className = 'daily-option';
        if (daily.checked) {
          className += ' disabled';
          if (index === correctDisplayIndex) className += ' correct';
          else if (index === daily.selected) className += ' wrong';
        } else if (index === daily.selected) className += ' selected';
        return '<button class="' + className + '" data-action="daily-option" data-index="' + index + '">' + verdictBadge(['А', 'Б', 'В', 'Г'][index], daily.checked ? (index === correctDisplayIndex ? 'correct' : (index === daily.selected ? 'wrong' : '')) : '') + '<span>' + escapeHTML(question.options[originalIndex]) + '</span></button>';
      }).join('') + '</div>' +
      (daily.checked ? '<div class="daily-explanation ' + explanationClass + '">' +
        '<b>' + icon(daily.correct ? 'checkCircle' : 'alert') + (daily.correct ? 'Верно' : 'Неверно. Правильный ответ — ' + ['А', 'Б', 'В', 'Г'][correctDisplayIndex]) + '</b>' +
        '<span>' + escapeHTML(question.explanation) + '</span>' +
      '</div>' : '') +
      '<div class="daily-foot">' +
        '<div class="daily-source">Авторский аналог в формате ЕГЭ. Оригинальные задания и ответы — в ' + fipiSubjectLink(question.subject, 'открытом банке ФИПИ') + '.</div>' +
        (daily.checked
          ? '<span class="badge mint">' + icon('check') + 'ответ сохранён</span>'
          : '<button class="btn btn-primary btn-sm" data-action="daily-check"' + (daily.selected === null ? ' disabled' : '') + '>' + icon('check') + 'Проверить</button>') +
      '</div>' +
    '</section>';
}

function renderAchievementTeaser() {
  const states = ACHIEVEMENTS.map(achievementState);
  const unlocked = states.filter(item => item.unlocked).length;
  const locked = states.filter(item => !item.unlocked).sort((a, b) => b.percent - a.percent).slice(0, 3);
  return '' +
    '<section class="card pad ach-teaser">' +
      '<div class="card-head"><div><h3>Дерево достижений</h3><p>Маленькие подтверждения того, что вы не стоите на месте</p></div><span class="badge brand">' + unlocked + ' / ' + states.length + '</span></div>' +
      (locked.length
        ? '<div class="ach-teaser-list">' + locked.map(item => (
          '<div class="ach-teaser-item">' +
            '<span class="ach-teaser-ico">' + icon(item.icon) + '</span>' +
            '<span style="flex:1;min-width:0"><b>' + escapeHTML(item.title) + '</b><small>' + escapeHTML(item.desc) + '</small><div class="ach-teaser-progress"><span style="width:' + item.percent + '%"></span></div></span>' +
            '<span class="ach-teaser-meta">' + achievementValueLabel(item, item.current) + ' / ' + achievementValueLabel(item, item.target) + '</span>' +
          '</div>'
        )).join('') + '</div>'
        : '<div class="empty-state" style="padding:24px 12px"><div class="empty-ico">' + icon('trophy') + '</div><b>Все достижения открыты</b><small>Дерево выросло полностью. Теперь — только повторение и уверенность.</small></div>') +
      '<button class="section-link" data-action="nav" data-view="achievements">Смотреть всё дерево ' + icon('arrowRight') + '</button>' +
    '</section>';
}

function renderAchievements() {
  const states = ACHIEVEMENTS.map(achievementState);
  const unlocked = states.filter(item => item.unlocked).length;
  const percent = states.length ? Math.round(unlocked / states.length * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const branches = Object.entries(ACHIEVEMENT_BRANCHES).map(([id, branch], index) => {
    const branchStates = states.filter(item => item.branch === id);
    const branchUnlocked = branchStates.filter(item => item.unlocked).length;
    const nodes = branchStates.map(item => '' +
      '<div class="ach-node ' + (item.unlocked ? 'unlocked' : 'locked') + (freshAchievements.has(item.id) ? ' fresh' : '') + '">' +
        '<span class="ach-node-icon">' + icon(item.icon) + '</span>' +
        '<span class="ach-node-body">' +
          '<b>' + escapeHTML(item.title) + '</b>' +
          '<small>' + escapeHTML(item.desc) + '</small>' +
          '<div class="ach-node-progress"><span style="width:' + item.percent + '%"></span></div>' +
          '<span class="ach-node-meta"><span>' + achievementValueLabel(item, item.current) + ' / ' + achievementValueLabel(item, item.target) + '</span><span class="' + (item.unlocked ? 'ok' : '') + '">' + (item.unlocked ? 'получено' : item.percent + '%') + '</span></span>' +
        '</span>' +
      '</div>'
    ).join('');
    return '' +
      '<div class="ach-branch">' +
        '<div class="ach-branch-head"><span class="ach-branch-dot">' + (index + 1) + '</span><b>' + escapeHTML(branch.title) + '</b><small>' + escapeHTML(branch.subtitle) + '</small><span class="ach-branch-count">' + branchUnlocked + ' / ' + branchStates.length + '</span></div>' +
        '<div class="ach-nodes">' + nodes + '</div>' +
      '</div>';
  }).join('');
  const topicsGrid = profileSubjects().map(subjectId => {
    const subject = SUBJECTS[subjectId];
    const topics = topicsForSubject(subjectId);
    const done = topics.filter(topic => isTopicDone(topic.id));
    return '' +
      '<div class="ach-subject-topics" style="--subj-color:' + subject.color + '">' +
        '<div class="ach-subject-topics-head"><span class="legend-dot" style="background:' + subject.color + '"></span><b>' + escapeHTML(subject.short) + '</b><span>' + done.length + ' / ' + topics.length + '</span></div>' +
        (done.length
          ? done.slice(0, 8).map(topic => '<div class="topic-pill">' + icon('check') + '<span>' + escapeHTML(topic.title) + '</span></div>').join('') +
            (done.length > 8 ? '<div class="topic-pill empty">и ещё ' + (done.length - 8) + ' ' + pluralize(done.length - 8, ['тема', 'темы', 'тем']) + '</div>' : '')
          : '<div class="topic-pill empty">Пока нет закрытых тем — всё впереди.</div>') +
      '</div>';
  }).join('');
  return '' +
    '<div class="page-head">' +
      '<div><h1>Дерево достижений</h1><p>Не рейтинг и не гонка. Здесь растут подтверждения вашей регулярности, закрытых тем и времени в практике.</p></div>' +
      '<div class="page-actions"><button class="btn btn-secondary btn-sm" data-action="nav" data-view="progress">' + icon('chart') + 'К прогрессу</button><button class="btn btn-primary btn-sm" data-action="nav" data-view="plan">' + icon('calendar') + 'Продолжить план</button></div>' +
    '</div>' +
    '<section class="card ach-hero">' +
      '<div class="ach-hero-main">' +
        '<div class="ach-hero-ring"><svg viewBox="0 0 86 86"><circle cx="43" cy="43" r="36" fill="none" stroke="#e8e6fa" stroke-width="7"/><circle cx="43" cy="43" r="36" fill="none" stroke="#5146e5" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + (circumference * (1 - percent / 100)).toFixed(1) + '"/></svg><span>' + percent + '%<small>дерева</small></span></div>' +
        '<div><h2>' + (percent >= 100 ? 'Дерево выросло' : percent >= 50 ? 'Крона уже видна' : 'Корни уже есть') + '</h2><p>Открыто ' + unlocked + ' из ' + states.length + ' достижений. Каждое — след реального действия, а не случайного клика.</p></div>' +
      '</div>' +
      '<div class="ach-hero-stats">' +
        '<div class="ach-hero-stat"><b>' + totalTopicsDone() + ' / ' + totalSelectedTopics() + '</b><small>тем закрыто</small></div>' +
        '<div class="ach-hero-stat"><b>' + formatMinutes(totalPracticeMinutes()) + '</b><small>в практике</small></div>' +
        '<div class="ach-hero-stat"><b>' + currentStreak() + '</b><small>дней в серии</small></div>' +
      '</div>' +
    '</section>' +
    '<div class="ach-tree">' + branches + '</div>' +
    '<section class="card pad ach-topics-card">' +
      '<div class="card-head"><div><h3>Закрытые темы по предметам</h3><p>Тема считается закрытой, когда есть и теория, и практика</p></div><span class="badge mint">' + totalTopicsDone() + ' ' + pluralize(totalTopicsDone(), ['тема', 'темы', 'тем']) + '</span></div>' +
      '<div class="ach-topics-grid">' + topicsGrid + '</div>' +
    '</section>' +
    '<div class="notice" style="margin-top:16px">' + icon('lightbulb') + '<div><b>Достижения не сгорают.</b> Даже если серия прервалась, открытые ветки остаются. Начните с одного короткого действия — дерево продолжит расти.</div></div>';
}

function renderGroupApiCard() {
  return '' +
    '<section class="card pad group-api-card">' +
      '<div class="card-head"><div><h3>Основа для синхронизации</h3><p>Группы и прогресс уже отделены от интерфейса</p></div><span class="badge">API scaffold</span></div>' +
      '<div class="group-api-list">' +
        '<div class="group-api-row">' + icon('layers') + '<span>Полная синхронизация состояния</span><code>' + escapeHTML(API_BRIDGE.routes.sync) + '</code></div>' +
        '<div class="group-api-row">' + icon('users') + '<span>Создание группы</span><code>' + escapeHTML(API_BRIDGE.routes.groups) + '</code></div>' +
        '<div class="group-api-row">' + icon('plus') + '<span>Вход по коду</span><code>' + escapeHTML(API_BRIDGE.routes.joinGroup) + '</code></div>' +
        '<div class="group-api-row">' + icon('chart') + '<span>Общий прогресс</span><code>' + escapeHTML(API_BRIDGE.routes.groupProgress) + '</code></div>' +
      '</div>' +
      '<div class="mvp-note">Серверная часть ещё не подключена. Сейчас группа работает в демо-режиме на этом устройстве, а перенос прогресса между устройствами делается через JSON-резервную копию в настройках.</div>' +
    '</section>';
}

function renderGroup() {
  const group = state.group;
  if (!group) {
    return '' +
      '<div class="page-head"><div><h1>Учиться вместе</h1><p>Небольшая группа на 3–5 человек помогает не выпадать из ритма. Без публичных рейтингов и давления.</p></div></div>' +
      '<section class="group-hero"><div><h1>Тише, но вместе</h1><p>Общий прогресс недели, мягкая поддержка и никаких соревнований на скорость. Каждый идёт в своём темпе.</p></div><div class="group-hero-stats"><div class="group-hero-stat"><b>3–5</b><small>человек</small></div><div class="group-hero-stat"><b>3</b><small>занятия в неделю</small></div><div class="group-hero-stat"><b>0</b><small>штрафов</small></div></div></section>' +
      '<div class="group-grid">' +
        '<section class="card pad group-card">' +
          '<h2>Создать группу</h2><p>Придумайте название — код приглашения сгенерируется сам. Участники появятся после подключения синхронизации; сейчас это демо-состав.</p>' +
          '<div class="group-join-row"><input class="text-input" data-group-name placeholder="Например, «Физики»" value="' + escapeHTML(groupNameDraft) + '" maxlength="40"><button class="btn btn-primary btn-sm" data-action="group-create">' + icon('users') + 'Создать</button></div>' +
          '<div class="mvp-note">В демо-группе уже будут Аня, Марк и Соня — чтобы показать общий прогресс. Это пример, а не реальные люди.</div>' +
        '</section>' +
        '<section class="card pad group-card">' +
          '<h2>Войти по коду</h2><p>Если преподаватель или друг прислал код, введите его. Пока код открывает демо-группу на этом устройстве.</p>' +
          '<div class="group-join-row"><input class="text-input" data-group-code placeholder="FOKUS-AB" value="' + escapeHTML(groupJoinCode) + '" maxlength="24" autocomplete="off"><button class="btn btn-secondary btn-sm" data-action="group-join">' + icon('arrowRight') + 'Войти</button></div>' +
          '<div class="mvp-note">Настоящий вход по коду станет доступен после подключения бэкенда. Интерфейс и маршруты API уже подготовлены.</div>' +
        '</section>' +
      '</div>' + renderGroupApiCard();
  }
  const members = groupMembersWithProgress(group);
  const progress = groupProgress(group);
  return '' +
    '<div class="page-head"><div><h1>Группа</h1><p>Общий прогресс — это сумма маленьких шагов, а не гонка. Поддержите друг друга.</p></div><div class="page-actions"><button class="btn btn-secondary btn-sm" data-action="open-leave-group">' + icon('logout') + 'Выйти из группы</button></div></div>' +
    '<section class="group-hero">' +
      '<div><h1>' + escapeHTML(group.name) + '</h1><p>На этой неделе группа закрыла ' + progress.done + ' ' + pluralize(progress.done, ['занятие', 'занятия', 'занятий']) + ' из ' + progress.target + '. Цель мягкая: по 3 шага на человека.</p></div>' +
      '<div class="group-hero-stats">' +
        '<div class="group-hero-stat"><b>' + progress.percent + '%</b><small>общий прогресс</small></div>' +
        '<div class="group-hero-stat"><b>' + members.length + '</b><small>участников</small></div>' +
        '<div class="group-hero-stat"><b>' + progress.done + '</b><small>занятий за неделю</small></div>' +
      '</div>' +
    '</section>' +
    '<div class="group-grid">' +
      '<section class="card pad group-card">' +
        '<div class="card-head"><div><h2>Прогресс недели</h2><p>Мягкий ориентир, а не таблица победителей</p></div><span class="badge mint">' + groupWeekSessionCount() + ' моих</span></div>' +
        '<div class="group-progress-head"><span>Вместе собрали</span><b>' + progress.done + ' / ' + progress.target + '</b></div>' +
        '<div class="group-progress"><span style="width:' + progress.percent + '%"></span></div>' +
        '<div class="group-progress-note">Цель — 3 занятия на человека. Если кто-то отстал, это повод написать ему, а не повод для стыда.</div>' +
        '<div class="group-members">' + members.map(member => '' +
          '<div class="group-member' + (member.isMe ? ' me' : '') + '">' +
            '<span class="group-member-avatar">' + escapeHTML(initials(member.name).toUpperCase()) + '</span>' +
            '<span style="min-width:0"><b>' + escapeHTML(member.name) + (member.isMe ? ' · вы' : '') + '</b><small>' + (member.demo ? 'демо-участник' : 'ваш прогресс') + ' · ' + member.statusLabel + '</small><span class="group-status ' + member.status + '">' + member.statusLabel + '</span></span>' +
            '<span class="group-member-count"><b>' + member.sessions + '</b><small>занятий</small></span>' +
          '</div>'
        ).join('') + '</div>' +
      '</section>' +
      '<div>' +
        '<section class="card pad group-card">' +
          '<h2>Код приглашения</h2><p>Отправьте код друзьям. После подключения сервера по нему можно будет войти в группу.</p>' +
          '<div class="group-code"><span><b>' + escapeHTML(group.code) + '</b><small>код группы</small></span><button class="btn btn-soft btn-sm" data-action="group-copy" data-code="' + escapeHTML(group.code) + '">' + icon('copy') + 'Копировать</button></div>' +
          '<div class="group-progress-note">Демо-режим: приглашённые участники не синхронизируются автоматически. Настоящая группа появится после подключения API.</div>' +
        '</section>' +
        '<section class="card pad group-card">' +
          '<h2>Правила группы</h2><p>Простые договорённости, чтобы вместе было спокойнее.</p>' +
          '<div class="group-progress-note" style="font-size:10px;line-height:1.65">1. Делимся прогрессом, а не соревнуемся.<br>2. Поддерживаем того, кто выпал, без упрёков.<br>3. Можно пропустить неделю — место остаётся.<br>4. Чужие ошибки не обсуждаем публично.</div>' +
        '</section>' +
      '</div>' +
    '</div>' + renderGroupApiCard();
}

function renderFipiJournalModal() {
  const subjects = profileSubjects().length ? profileSubjects() : SUBJECT_ORDER;
  const stats = fipiStats();
  const sessions = (state.progress.fipiSessions || []).slice().reverse().slice(0, 8);
  const officialTotal = TOPICS.reduce((sum, topic) => sum + topic.questions.filter(question => question.source === 'fipi').length, 0);
  return '' +
    '<div class="modal journal-modal" role="dialog" aria-modal="true" aria-label="Журнал работы с ФИПИ">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('bank') + '</div><div><h2>Журнал ФИПИ</h2><p>Официальные задания живут в тренажёре, а банк ФИПИ остаётся первоисточником. Здесь — результаты самостоятельной работы с банком.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="fipi-journal-stats">' +
          '<div class="fipi-session-stat"><b>' + officialTotal + '</b><small>официальных заданий в тренажёре</small></div>' +
          '<div class="fipi-session-stat"><b>' + stats.sessions + '</b><small>сессий с банком</small></div>' +
          '<div class="fipi-session-stat"><b>' + (stats.solved ? stats.accuracy + '%' : '—') + '</b><small>точность</small></div>' +
        '</div>' +
        '<div class="notice" style="margin-top:12px">' + icon('info') + '<div><b>Официальные материалы ФИПИ.</b> В тренажёре есть задания из демоверсий 2026 года с указанием документа, номера и ссылки. Банк ФИПИ — отдельный первоисточник для дополнительной практики.</div></div>' +
        '<div class="fipi-journal-subjects">' + subjects.map(subjectId => {
          const subject = SUBJECTS[subjectId];
          const official = topicsForSubject(subjectId).reduce((sum, topic) => sum + topic.questions.filter(question => question.source === 'fipi').length, 0);
          return '' +
            '<div class="fipi-journal-subject" style="--subj-color:' + subject.color + ';--subj-soft:' + subject.soft + '">' +
              '<span class="subject-mark">' + subject.icon + '</span>' +
              '<span class="fipi-journal-subject-info"><b>' + escapeHTML(subject.short) + '</b><small>В тренажёре: ' + official + ' официальных ' + pluralize(official, ['задание', 'задания', 'заданий']) + '</small></span>' +
              '<button class="btn btn-soft btn-sm" data-action="trainer-open-tasks" data-subject="' + subjectId + '"' + (official ? '' : ' disabled') + '>Задания</button>' +
              fipiSubjectLink(subjectId, 'Банк ФИПИ', 'btn btn-ghost btn-sm') +
              '<button class="btn btn-ghost btn-sm" data-action="open-fipi-session" data-subject="' + subjectId + '">' + icon('check') + 'Отметить</button>' +
            '</div>';
        }).join('') + '</div>' +
        '<section class="fipi-journal-sessions">' +
          '<div class="fipi-journal-sessions-head"><b>Последние сессии</b><button class="btn btn-soft btn-sm" data-action="open-fipi-session">' + icon('layersPlus') + 'Добавить</button></div>' +
          (sessions.length
            ? '<div class="fipi-session-list">' + sessions.map(entry => {
              const topic = entry.topicId ? TOPIC_BY_ID[entry.topicId] : null;
              const percent = entry.solved ? Math.round(entry.correct / entry.solved * 100) : 0;
              return '<div class="fipi-session-row"><b>' + escapeHTML(topic?.title || SUBJECTS[entry.subject].name) + '</b><span>' + escapeHTML(SUBJECTS[entry.subject].short) + ' · ' + formatDateShort(entry.date) + '</span><span class="' + (percent >= 75 ? 'ok' : '') + '">' + entry.correct + ' / ' + entry.solved + ' · ' + percent + '%</span></div>';
            }).join('') + '</div>'
            : '<div class="notice" style="margin-top:10px">' + icon('info') + '<div>Пока нет отмеченных сессий. Решите 3–5 заданий в банке ФИПИ и внесите результат — прогресс темы обновится.</div></div>') +
        '</section>' +
        '<div class="fipi-disclaimer" style="margin-top:12px">Официальные материалы ФИПИ не гарантируют появление именно этих заданий на экзамене.</div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Официальные карточки не смешиваются с авторскими.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Закрыть</button>' + externalLink(FIPI_BANK_ROOT, 'Открыть банк ФИПИ', 'btn btn-primary btn-sm') + '</div></div>' +
    '</div>';
}

function settingsDayChips() {
  return WEEKDAYS.map(day => '<button class="day-chip' + (settingsDraft.studyDays.includes(day.n) ? ' active' : '') + '" data-action="settings-day" data-day="' + day.n + '" title="' + day.full + '">' + day.short + '</button>').join('');
}

function syncEnvBanner() {
  const env = syncEnvironment();
  return '<div class="sync-env ' + env.level + '">' + icon(env.level === 'ok' ? 'checkCircle' : 'alert') + '<div><b>' + escapeHTML(env.title) + '</b><span>' + escapeHTML(env.text) + '</span></div></div>';
}

function syncHealthBadge() {
  if (!syncHealth) return '';
  return '<span class="sync-health ' + syncHealth.status + '">' + icon(syncHealth.status === 'ok' ? 'checkCircle' : 'alert') + (syncHealth.status === 'ok' ? 'Сервер проверен' : 'Проверка не прошла') + '</span>';
}

function renderSyncSettingsCard() {
  const status = syncMessage || (syncConfig.lastSyncAt
    ? { type: 'ok', text: 'Последняя синхронизация: ' + (Number.isFinite(new Date(syncConfig.lastSyncAt).getTime()) ? formatDateFull(new Date(syncConfig.lastSyncAt)) : syncConfig.lastSyncAt) + (syncConfig.lastDirection === 'upload' ? ' · выгрузка' : syncConfig.lastDirection === 'download' ? ' · загрузка' : '') + '.' }
    : { type: '', text: 'Синхронизация ещё не настроена. Придумайте код и пароль — они понадобятся на втором устройстве.' });
  return '' +
    '<section class="card settings-section">' +
      '<h2>Синхронизация между устройствами</h2><p>Зашифрованная копия аккаунта и прогресса на вашем сервере. Код и пароль — единственный ключ к данным.</p>' +
      syncEnvBanner() +
      '<div class="sync-grid">' +
        '<div class="sync-field"><label>Код синхронизации</label><input type="text" data-sync-field="code" value="' + escapeHTML(syncDraft.code) + '" placeholder="например, focus-2027" autocomplete="off"></div>' +
        '<div class="sync-field"><label>Пароль синхронизации</label><input type="password" data-sync-field="passphrase" value="" placeholder="минимум 8 символов" autocomplete="new-password"></div>' +
        '<div class="sync-field" style="grid-column:1/-1"><label>Адрес сервера</label><div class="sync-server-row"><input type="url" data-sync-field="server" value="' + escapeHTML(syncDraft.server) + '" placeholder="https://example.com/api/sync" autocomplete="off"><button type="button" class="btn btn-ghost btn-sm" data-action="sync-use-default">Адрес этого сайта</button></div><span class="sync-field-hint">Обычно это <code>http://127.0.0.1:8765/api/sync</code> или тот же домен с <code>/api/sync</code>. Для телефона нужен HTTPS.</span></div>' +
      '</div>' +
      '<div class="sync-status ' + status.type + '">' + icon(status.type === 'ok' ? 'checkCircle' : status.type === 'err' ? 'alert' : status.type === 'warn' ? 'alert' : 'cloud') + '<div>' + escapeHTML(status.text) + '</div></div>' +
      '<div class="sync-actions">' +
        '<button class="btn btn-primary btn-sm" data-action="sync-upload"' + (syncBusy ? ' disabled' : '') + '>' + icon('upload') + (syncBusy ? 'Работаем…' : 'Выгрузить') + '</button>' +
        '<button class="btn btn-secondary btn-sm" data-action="sync-download"' + (syncBusy ? ' disabled' : '') + '>' + icon('download') + 'Забрать' + '</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="sync-health"' + (syncBusy ? ' disabled' : '') + '>' + icon('cloud') + 'Проверить сервер</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="sync-save">' + icon('check') + 'Сохранить код</button>' +
        (syncConfig.code ? '<button class="btn btn-ghost btn-sm" data-action="sync-forget">Забыть код</button>' : '') +
      '</div>' +
      syncHealthBadge() +
      '<div class="sync-steps"><b>Как включить синхронизацию</b><ol>' +
        '<li>Запустите <code>start-fokus.bat</code> — он поднимает сайт и API на <code>127.0.0.1:8765</code>.</li>' +
        '<li>Откройте <code>http://127.0.0.1:8765/</code>, войдите и заполните код с паролем. Код — это имя сейфа, пароль — ключ шифрования.</li>' +
        '<li>Нажмите «Выгрузить». На втором устройстве откройте тот же сервер, введите те же код и пароль и нажмите «Забрать».</li>' +
        '<li>Для телефона в той же Wi-Fi сети запустите <code>start-site-https.ps1</code> и откройте HTTPS-адрес: по обычному <code>http://192.168...</code> браузер блокирует WebCrypto.</li>' +
      '</ol></div>' +
      '<div class="sync-note">Сервер хранит только зашифрованный файл. Если компьютер-сервер выключен, синхронизация недоступна — локальный аккаунт продолжает работать. Код и пароль нельзя восстановить: без них копия не расшифруется.</div>' +
    '</section>';
}

function renderPwaSettingsCard() {
  const standalone = isStandaloneApp();
  const supported = 'serviceWorker' in navigator && location.protocol !== 'file:';
  const status = standalone
    ? 'Приложение открыто в отдельном окне.'
    : pwaInstallAvailable
      ? 'Браузер готов установить приложение.'
      : supported
        ? 'Откройте меню браузера и выберите «Установить приложение» (в Safari — «На экран Домой»).'
        : 'Установка доступна только по HTTP(S), не из файла.';
  return '' +
    '<section class="card settings-section">' +
      '<h2>Приложение и офлайн-режим</h2><p>«Фокус» можно установить на компьютер или телефон. Интерфейс и данные откроются даже без сети.</p>' +
      '<div class="sync-status ' + (standalone ? 'ok' : '') + '">' + icon(standalone ? 'checkCircle' : 'install') + '<div><b>' + (standalone ? 'Установлено' : 'Установка') + '</b><br>' + escapeHTML(status) + '</div></div>' +
      '<div class="sync-actions">' + (standalone ? '' : '<button class="btn btn-primary btn-sm" data-action="pwa-install">' + icon('install') + 'Установить приложение</button>') + '<button class="btn btn-ghost btn-sm" data-action="pwa-help">Как это работает</button></div>' +
      '<div class="sync-note">Service worker кэширует оболочку приложения. Учебные данные хранятся в localStorage и не отправляются в сеть без вашей команды синхронизации.</div>' +
    '</section>';
}

function renderSettings() {
  ensureSettingsDraft();
  const profile = state.profile;
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const permissionText = permission === 'granted' ? 'Разрешение получено' : permission === 'denied' ? 'Запрещено в браузере' : permission === 'unsupported' ? 'Браузер не поддерживает' : 'Нужно разрешение браузера';
  return '' +
    '<div class="page-head">' +
      '<div><h1>Настройки</h1><p>Профиль, ритм подготовки и напоминания. Всё можно изменить — план пересоберётся.</p></div>' +
      '<div class="page-actions"><button class="btn btn-secondary btn-sm" data-action="edit-profile">' + icon('user') + 'Изменить профиль</button><button class="btn btn-primary btn-sm" data-action="nav" data-view="plan">' + icon('calendar') + 'Открыть план</button></div>' +
    '</div>' +
    '<div class="settings-grid">' +
      '<div>' +
        '<section class="card settings-section">' +
          '<h2>Ритм подготовки</h2><p>Эти параметры напрямую влияют на расписание. После сохранения план пересоберётся.</p>' +
          '<div class="settings-form">' +
            '<div class="full"><label class="form-label">Учебные дни</label><div class="day-chips">' + settingsDayChips() + '</div><div class="form-hint">Буферный день останется свободным, даже если выбран здесь.</div></div>' +
            '<div class="full"><label class="form-label">Удобное время занятий</label><div class="time-chips">' + ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(time => '<button class="time-chip' + (settingsDraft.preferredTimes.includes(time) ? ' active' : '') + '" data-action="settings-time" data-time="' + time + '">' + time + '</button>').join('') + '</div></div>' +
            '<div><label class="form-label">Нагрузка в день</label><div class="range-wrap"><input type="range" min="30" max="240" step="15" value="' + settingsDraft.dailyMinutes + '" data-settings-field="dailyMinutes"><span class="range-bubble" id="settings-daily-bubble">' + settingsDraft.dailyMinutes + ' мин</span></div></div>' +
            '<div><label class="form-label">Длина одного занятия</label><select class="select-input" data-settings-field="sessionMinutes">' + [25, 30, 45, 60].map(value => '<option value="' + value + '"' + (Number(settingsDraft.sessionMinutes) === value ? ' selected' : '') + '>' + value + ' минут</option>').join('') + '</select></div>' +
            '<div><label class="form-label">Школа заканчивается</label><input class="text-input" type="time" value="' + settingsDraft.schoolEnd + '" data-settings-field="schoolEnd"></div>' +
            '<div><label class="form-label">Отход ко сну</label><input class="text-input" type="time" value="' + settingsDraft.sleepStart + '" data-settings-field="sleepStart"></div>' +
            '<div class="full"><label class="form-label">Дни репетитора</label><div class="day-chips">' + WEEKDAYS.map(day => '<button class="day-chip' + (settingsDraft.tutorDays.includes(day.n) ? ' active' : '') + '" data-action="settings-tutor-day" data-day="' + day.n + '" title="' + day.full + '">' + day.short + '</button>').join('') + '</div></div>' +
            '<div><label class="form-label">Время репетитора</label><input class="text-input" type="time" value="' + settingsDraft.tutorTime + '" data-settings-field="tutorTime"></div>' +
            '<div><label class="form-label">Буферный день</label><select class="select-input" data-settings-field="bufferDay">' + WEEKDAYS.map(day => '<option value="' + day.n + '"' + (Number(settingsDraft.bufferDay) === day.n ? ' selected' : '') + '>' + day.full + '</option>').join('') + '</select></div>' +
            '<div class="full"><div class="settings-row"><div><b>Пробники по субботам</b><small>Каждую субботу — пробник на 12 заданий с ротацией предметов.</small></div><button class="toggle' + (settingsDraft.miniMocks ? ' on' : '') + '" data-action="settings-toggle" data-field="miniMocks" aria-label="Пробники по субботам"></button></div></div>' +
            '<div class="full"><div class="settings-row"><div><b>Адаптивное повторение SM-2</b><small>Легко ответили — интервал растёт, тяжело — тема вернётся быстрее.</small></div><button class="toggle' + (settingsDraft.spacedReview ? ' on' : '') + '" data-action="settings-toggle" data-field="spacedReview" aria-label="Адаптивное повторение"></button></div></div>' +
          '</div>' +
          '<div class="settings-actions"><button class="btn btn-primary btn-sm" data-action="settings-save">' + icon('check') + 'Сохранить и пересобрать</button><button class="btn btn-ghost btn-sm" data-action="settings-cancel">Сбросить изменения</button></div>' +
        '</section>' +
        renderScheduleSettingsCard() +
        '<section class="card settings-section">' +
          '<h2>Напоминания</h2><p>MVP работает без сервера: браузерные напоминания приходят, пока открыта вкладка. Email требует подключения бэкенда.</p>' +
          '<div class="settings-row"><div><b>Браузерные напоминания</b><small>' + permissionText + '. Напомним за 10 минут до занятия.</small></div><button class="toggle' + (state.settings.notify ? ' on' : '') + '" data-action="toggle-notify" aria-label="Браузерные напоминания"></button></div>' +
          '<div class="settings-row"><div><b>Email-напоминания</b><small>Поле для будущей интеграции. Сейчас письма не отправляются.</small></div><button class="toggle' + (state.settings.emailNotify ? ' on' : '') + '" data-action="toggle-email" aria-label="Email-напоминания"></button></div>' +
          (state.settings.emailNotify ? '<div style="margin-top:12px"><label class="form-label">Email</label><input class="text-input" type="email" placeholder="you@example.com" value="' + escapeHTML(state.settings.email || '') + '" data-settings-email></div>' : '') +
          '<div class="mvp-note">Фоновые push-уведомления при закрытой вкладке в MVP не поддерживаются. Для надёжных напоминаний используйте экспорт плана в календарь.</div>' +
        '</section>' +
      '</div>' +
      '<div>' +
        '<section class="card settings-section">' +
          '<h2>Аккаунт</h2><p>Личный профиль и прогресс подготовки.</p>' +
          '<div class="account-card-head"><span class="avatar">' + escapeHTML(initials(currentUser?.name || profile.name).toUpperCase()) + '</span><span class="account-identity"><b>' + escapeHTML(currentUser?.name || profile.name || 'Ученик') + '</b><small>' + escapeHTML(currentUser?.email || '') + '</small></span><span class="badge mint">Вход выполнен</span></div>' +
          '<div class="profile-line"><span>Аккаунт создан</span><b>' + (currentUser?.createdAt ? formatDateFull(new Date(currentUser.createdAt)) : '—') + '</b></div>' +
          '<div class="profile-line"><span>Последний вход</span><b>' + (currentUser?.lastLoginAt ? formatDateFull(new Date(currentUser.lastLoginAt)) : 'Сейчас') + '</b></div>' +
          '<div class="settings-actions"><button class="btn btn-secondary btn-sm" data-action="logout">' + icon('logout') + 'Выйти из аккаунта</button></div>' +
          '<div class="mvp-note">Пароль хранится в виде соль+PBKDF2-хеша. Для переноса аккаунта на другое устройство используйте синхронизацию ниже.</div>' +
        '</section>' +
        renderSyncSettingsCard() +
        renderPwaSettingsCard() +
        '<section class="card settings-section">' +
          '<h2>Внешний вид</h2><p>Тема применяется сразу и запоминается на этом устройстве. «Классика» остаётся основной.</p>' +
          '<div class="style-options">' +
            '<button class="style-option' + (currentStyle() === 'classic' && currentTheme() === 'light' ? ' active' : '') + '" data-action="set-theme" data-theme="light" data-style-reset="1"><span class="style-swatch"><i style="background:#5146e5"></i><i style="background:#f4f6fb"></i><i style="background:#ffffff"></i></span><span><b>Классика</b><small>Светлая · текущая</small></span></button>' +
            '<button class="style-option' + (currentStyle() === 'classic' && currentTheme() === 'dark' ? ' active' : '') + '" data-action="set-theme" data-theme="dark" data-style-reset="1"><span class="style-swatch"><i style="background:#8d83ff"></i><i style="background:#090c15"></i><i style="background:#111624"></i></span><span><b>Классика</b><small>Тёмная · текущая</small></span></button>' +
            '<button class="style-option' + (currentStyle() === 'paper' ? ' active' : '') + '" data-action="set-style" data-style="paper"><span class="style-swatch"><i style="background:#1b4dff"></i><i style="background:#d8ff3e"></i><i style="background:#f4f3ee"></i></span><span><b>Бумага</b><small>Тёплая, лаймовый акцент</small></span></button>' +
            '<button class="style-option' + (currentStyle() === 'nocturne' ? ' active' : '') + '" data-action="set-style" data-style="nocturne"><span class="style-swatch"><i style="background:#c6ff3d"></i><i style="background:#08090b"></i><i style="background:#101216"></i></span><span><b>Ноктюрн</b><small>Тёмная, лайм и моно-цифры</small></span></button>' +
          '</div>' +
          '<div class="mvp-note">«Бумага» и «Ноктюрн» — экспериментальные темы из концептов. Вернуться к привычному виду можно в один клик.</div>' +
        '</section>' +
        '<section class="card settings-section">' +
          '<h2>Профиль</h2><p>Имя, предметы и цели.</p>' +
          '<div class="profile-summary">' +
            '<div class="profile-line"><span>Имя</span><b>' + escapeHTML(profile.name || 'Ученик') + '</b></div>' +
            '<div class="profile-line"><span>Класс / год</span><b>11 класс · ЕГЭ ' + profile.examYear + '</b></div>' +
            '<div class="profile-line"><span>Предметы и допуск</span><b>' + profileSubjects().map(id => SUBJECTS[id].short).join(', ') + '</b></div>' +
            '<div class="profile-line"><span>Сумма целей</span><b>' + profileSubjects().filter(id => !SUBJECTS[id].isEssay).reduce((sum, id) => sum + Number(profile.targets?.[id] || 0), 0) + ' баллов</b></div>' +
          '</div>' +
          '<div class="settings-actions"><button class="btn btn-secondary btn-sm" data-action="edit-profile">' + icon('settings') + 'Изменить ответы</button></div>' +
        '</section>' +
        '<section class="card settings-section">' +
          '<h2>Даты экзаменов и допуска</h2><p>Официальные даты основного периода и итогового сочинения. Проверьте их перед экзаменом.</p>' +
          profileSubjects().map(id => '<div class="profile-line"><span>' + SUBJECTS[id].short + '</span><b>' + formatDateFull(examDateFor(id)) + '</b></div>').join('') +
          '<div class="mvp-note">Расписание указано для ориентира. Всегда сверяйтесь с приказом Минпросвещения и официальным сайтом ЕГЭ.</div>' +
        '</section>' +
        '<section class="card settings-section">' +
          '<h2>Данные и перенос</h2><p>Прогресс хранится в этом браузере. Резервная копия помогает пережить очистку данных и перейти на другое устройство.</p>' +
          '<div class="settings-actions"><button class="btn btn-secondary btn-sm" data-action="export-json">' + icon('download') + 'Скачать резервную копию</button><button class="btn btn-secondary btn-sm" data-action="import-json">' + icon('upload') + 'Загрузить JSON</button><button class="btn btn-ghost btn-sm" data-action="export-ics">' + icon('calendar') + 'Экспорт в календарь</button></div>' +
          '<input type="file" accept="application/json,.json" data-import-json style="display:none">' +
          '<div class="mvp-note">JSON-копия — резервный способ. Основной перенос между устройствами — «Синхронизация» выше: она шифрует аккаунт и прогресс и передаёт их через ваш сервер.</div>' +
        '</section>' +
        '<section class="card settings-section danger-zone">' +
          '<h2>Сбросить всё</h2><p>Удалить профиль, план, прогресс и ошибки. Это действие нельзя отменить.</p>' +
          '<button class="btn btn-secondary btn-sm" data-action="open-reset">Сбросить данные</button>' +
        '</section>' +
      '</div>' +
    '</div>';
}

function renderReplanModal() {
  const overdue = overdueSessions().length;
  const warnings = state.plan?.warnings || [];
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Пересобрать план">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('refresh') + '</div><div><h2>Пересобрать план</h2><p>Сохраню выполненные занятия и прогресс, а оставшиеся темы распределю заново.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="notice">' + icon('info') + '<div>Прошлые отметки о занятиях не удаляются. В маршрут попадут только темы, где ещё нет теории и практики.</div></div>' +
        (overdue ? '<p class="small" style="margin-top:14px">Просрочено занятий: <b>' + overdue + '</b>. Они не будут перенесены буквально — вместо этого план учтёт текущий прогресс.</p>' : '<p class="small" style="margin-top:14px">Просроченных занятий нет. Пересборка пригодится, если изменилось расписание или вы хотите другой темп.</p>') +
        (warnings.length ? '<div class="notice orange" style="margin-top:12px">' + icon('alert') + '<div>' + escapeHTML(warnings[0]) + '</div></div>' : '') +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Текущий план будет заменён новым.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" data-action="replan-apply">' + icon('refresh') + 'Пересобрать</button></div></div>' +
    '</div>';
}

function renderResetModal() {
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Сбросить данные">' +
      '<div class="modal-head"><div class="confirm-icon red">' + icon('alert') + '</div><div><h2>Удалить все данные?</h2><p>Профиль, план, прогресс и журнал ошибок будут стёрты из этого браузера.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body"><p class="small">Сначала можно скачать резервную копию в настройках. После сброса приложение вернётся к знакомству и сборке нового плана.</p></div>' +
      '<div class="modal-foot"><span class="foot-note">Действие необратимо.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" style="background:var(--red)" data-action="reset-all">Удалить</button></div></div>' +
    '</div>';
}

function renderRebalanceModal() {
  const rebalance = state.progress.rebalance || {};
  const missed = Math.max(3, maybeNumber(rebalance.count) || 3);
  return '' +
    '<div class="modal" role="dialog" aria-modal="true" aria-label="Пересобрать подход">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('compass') + '</div><div><h2>Маршрут уже пересобран</h2><p>' + missed + ' ' + pluralize(missed, ['занятие', 'занятия', 'занятий']) + ' подряд остались позади. Это не провал — просто сигнал, что подход стоит подстроить.</p></div><button class="icon-btn" data-action="dismiss-rebalance" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="notice">' + icon('refresh') + '<div><b>Прогресс сохранён.</b> План уже обновлён под сегодняшний день. Осталось выбрать причину, чтобы следующий шаг был реалистичнее.</div></div>' +
        '<div class="reason-list">' +
          '<button class="reason-card" data-action="apply-rebalance" data-reason="time"><span class="reason-ico">' + icon('clock') + '</span><span><b>Нехватка времени</b><small>Снизим дневную нагрузку на 15 минут и оставим только главное.</small></span><span class="reason-arrow">' + icon('arrowRight') + '</span></button>' +
          '<button class="reason-card" data-action="apply-rebalance" data-reason="tired"><span class="reason-ico">' + icon('moon') + '</span><span><b>Усталость</b><small>Сделаем темп легче, включим повторение и больше воздуха между занятиями.</small></span><span class="reason-arrow">' + icon('arrowRight') + '</span></button>' +
          '<button class="reason-card" data-action="apply-rebalance" data-reason="topic"><span class="reason-ico">' + icon('bookOpen') + '</span><span><b>Не понял тему</b><small>Поставим тему в фокус: сначала короткая теория, потом практика.</small></span><span class="reason-arrow">' + icon('arrowRight') + '</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">Можно выбрать «Позже» — план останется пересобранным.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="dismiss-rebalance">Позже</button></div></div>' +
    '</div>';
}

function applyRebalance(reason) {
  const profile = state.profile;
  if (!profile) return;
  const rebalance = state.progress.rebalance || {};
  let title = 'Подход обновлён';
  let text = 'План пересобран.';
  if (reason === 'time' || reason === 'tired') {
    rebalance.prevDailyMinutes = rebalance.prevDailyMinutes || Number(profile.dailyMinutes || 90);
    profile.dailyMinutes = Math.max(30, Number(profile.dailyMinutes || 90) - 15);
    title = reason === 'time' ? 'Темп стал бережнее' : 'Разрешили себе отдых';
    text = 'Дневная нагрузка — ' + formatMinutes(profile.dailyMinutes) + '. Это не отставание, а способ не бросить.';
    if (reason === 'tired') {
      if (rebalance.prevSpacedReview === undefined) rebalance.prevSpacedReview = Boolean(profile.spacedReview);
      profile.spacedReview = true;
      text += ' Повторение включено, чтобы темы не забывались.';
    }
  } else if (reason === 'topic') {
    const topicId = TOPIC_BY_ID[rebalance.lastMissedTopicId] ? rebalance.lastMissedTopicId : topWeakTopics(1)[0]?.id;
    rebalance.focusTopicId = topicId || null;
    title = 'Тема взята в фокус';
    text = topicId ? 'Начнём с темы «' + TOPIC_BY_ID[topicId].title + '»: сначала теория, потом практика.' : 'План пересобран с приоритетом слабых тем.';
  }
  rebalance.pendingReason = false;
  rebalance.reason = reason;
  rebalance.appliedAt = new Date().toISOString();
  state.plan = generatePlan(profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  modal = null;
  saveState();
  render();
  showToast(title, text, 'success');
}

function dismissRebalance() {
  if (state.progress.rebalance) {
    state.progress.rebalance.pendingReason = false;
    state.progress.rebalance.dismissedAt = new Date().toISOString();
  }
  modal = null;
  saveState();
  render();
}

function resetPace() {
  const profile = state.profile;
  const rebalance = state.progress.rebalance;
  if (!profile || !rebalance) return;
  const restoredPace = rebalance.reason === 'time' || rebalance.reason === 'tired';
  if (restoredPace && rebalance.prevDailyMinutes) profile.dailyMinutes = Math.max(30, Number(rebalance.prevDailyMinutes));
  if (restoredPace && rebalance.prevSpacedReview !== undefined) profile.spacedReview = Boolean(rebalance.prevSpacedReview);
  state.progress.rebalance = rebalance.lastSignature ? { lastSignature: rebalance.lastSignature } : null;
  state.plan = generatePlan(profile);
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
  saveState();
  render();
  if (restoredPace) {
    showToast('Темп возвращён', 'План пересобран под прежнюю нагрузку. При необходимости можно изменить её в настройках.', 'success');
  } else {
    showToast('Фокус снят', 'План пересобран без специального приоритета темы. Прогресс и достижения сохранены.', 'success');
  }
}

function renderLeaveGroupModal() {
  const group = state.group;
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Выйти из группы">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('users') + '</div><div><h2>Выйти из группы?</h2><p>' + escapeHTML(group?.name || 'Группа') + ' останется на этом устройстве только в памяти участников.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body"><p class="small">Общий прогресс и демо-участники будут убраны. Личный прогресс, план и достижения не пострадают.</p></div>' +
      '<div class="modal-foot"><span class="foot-note">Вернуться можно по коду.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Остаться</button><button class="btn btn-primary btn-sm" style="background:var(--red)" data-action="leave-group">Выйти</button></div></div>' +
    '</div>';
}

function renderClearMistakesModal() {
  return '' +
    '<div class="modal small" role="dialog" aria-modal="true" aria-label="Очистить журнал ошибок">' +
      '<div class="modal-head"><div class="confirm-icon red">' + icon('trash') + '</div><div><h2>Очистить журнал?</h2><p>Все записи об ошибках будут удалены. Прогресс по темам останется.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="modal-body"><p class="small">Если хотите сохранить историю, лучше сначала пройти тренировку по ошибкам, а не удалять её.</p></div>' +
      '<div class="modal-foot"><span class="foot-note">Это не удалит выполненные занятия.</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Отмена</button><button class="btn btn-primary btn-sm" style="background:var(--red)" data-action="clear-mistakes">Очистить</button></div></div>' +
    '</div>';
}

function renderModalRoot() {
  if (!modal) return '';
  let content = '';
  if (modal.type === 'theory') content = renderTheoryModal(modal.topicId);
  else if (modal.type === 'essay-work') content = renderEssayWorkModal(modal.workId);
  else if (modal.type === 'visual') content = renderVisualModal();
  else if (modal.type === 'search') content = renderSearchModal();
  else if (modal.type === 'fipi-journal') content = renderFipiJournalModal();
  else if (modal.type === 'fipi-session') content = renderFipiSessionModal();
  else if (modal.type === 'replan') content = renderReplanModal();
  else if (modal.type === 'reset') content = renderResetModal();
  else if (modal.type === 'clear-mistakes') content = renderClearMistakesModal();
  else if (modal.type === 'leave-group') content = renderLeaveGroupModal();
  else if (modal.type === 'rebalance') content = renderRebalanceModal();
  else if (modal.type === 'import') content = renderImportModal();
  else if (modal.type === 'target') content = renderTargetModal();
  else if (modal.type === 'pse-task') content = renderPseTaskModal();
  else if (modal.type === 'cheatsheet') content = renderCheatsheetModal(modal.topicId);
  else if (modal.type === 'anxiety') content = renderAnxietyModal();
  if (!content) return '';
  return '<div class="modal-backdrop' + (modal.closing ? ' is-closing' : '') + '" data-modal-backdrop>' + content + '</div>';
}
