/* Модель прогресса: статистика, SM-2, прогноз, достижения и план. */
'use strict';

function profileSubjects() {
  if (!state.profile) return [];
  return (state.profile.subjects || []).filter(id => SUBJECTS[id]);
}

function examDateFor(subjectId) {
  if (!state.profile) return null;
  return state.profile.examDates?.[subjectId] || null;
}

function addUpcomingEssayTrack() {
  const profile = state.profile;
  if (!profile || !Array.isArray(profile.subjects)) return false;
  const generated = examDatesForYear(profile.examYear || resolveExamYear());
  const essayDate = profile.examDates?.essay || generated.essay;
  if (!essayDate || parseISO(essayDate) < startOfDay(new Date())) return false;
  let changed = false;
  if (!profile.subjects.includes('essay')) {
    profile.subjects.push('essay');
    changed = true;
  }
  if (!profile.examDates) profile.examDates = {};
  if (!profile.examDates.essay) {
    profile.examDates.essay = essayDate;
    changed = true;
  }
  if (!profile.targets) profile.targets = {};
  if (!profile.targets.essay) {
    profile.targets.essay = 5;
    changed = true;
  }
  if (!profile.levels) profile.levels = {};
  if (!profile.levels.essay) {
    profile.levels.essay = 'basic';
    changed = true;
  }
  return changed;
}

function daysToExam(subjectId) {
  const examDate = examDateFor(subjectId);
  if (!examDate) return 0;
  return Math.max(0, daysBetween(parseISO(examDate), new Date()));
}

function nearestExam() {
  const subjects = profileSubjects();
  if (!subjects.length) return null;
  return subjects
    .map(id => ({ id, date: examDateFor(id), days: daysToExam(id) }))
    .filter(item => item.date)
    .sort((a, b) => a.days - b.days)[0] || null;
}

function topicsForSubject(subjectId) {
  return TOPICS.filter(topic => topic.subject === subjectId).sort((a, b) => a.order - b.order);
}

function defaultSm2() {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: '', lastQuality: 0, lastReviewed: '' };
}

function topicProgress(topicId) {
  if (!state.progress.topics[topicId]) {
    state.progress.topics[topicId] = { theory: false, practice: false, attempts: 0, best: 0, sm2: defaultSm2() };
  }
  if (!state.progress.topics[topicId].sm2) state.progress.topics[topicId].sm2 = defaultSm2();
  return state.progress.topics[topicId];
}

function sm2For(topicId) {
  const progress = topicProgress(topicId);
  if (!progress.sm2) progress.sm2 = defaultSm2();
  return progress.sm2;
}

function sm2QualityForAnswer(correct, seconds) {
  if (!correct) return 2;
  const time = Number(seconds);
  if (!Number.isFinite(time) || time <= 0) return 4;
  if (time <= 12) return 5;
  if (time <= 35) return 4;
  return 3;
}

function sm2Review(topicId, quality) {
  if (!TOPIC_BY_ID[topicId]) return null;
  const sm2 = sm2For(topicId);
  const q = clamp(Math.round(Number(quality) || 0), 0, 5);
  let ease = sm2.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = clamp(Math.round(ease * 100) / 100, 1.3, 2.8);
  let reps;
  let interval;
  let lapses = Number(sm2.lapses || 0);
  if (q < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    reps = Number(sm2.reps || 0) + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 4;
    else interval = Math.round(Math.max(1, Number(sm2.interval || 1)) * ease);
    interval = clamp(interval, 1, 180);
  }
  const reviewedAt = new Date();
  sm2.ease = ease;
  sm2.interval = interval;
  sm2.reps = reps;
  sm2.lapses = lapses;
  sm2.due = toISO(addDays(reviewedAt, interval));
  sm2.lastQuality = q;
  sm2.lastReviewed = reviewedAt.toISOString();
  return sm2;
}

function dueReviewTopics(limit) {
  const today = toISO(new Date());
  const list = TOPICS.filter(topic => {
    if (!profileSubjects().includes(topic.subject)) return false;
    const progress = state.progress.topics[topic.id];
    if (!progress || (!progress.practice && !progress.attempts)) return false;
    const due = progress.sm2?.due;
    return Boolean(due && due <= today);
  }).map(topic => {
    const progress = state.progress.topics[topic.id];
    const due = progress.sm2?.due || today;
    return {
      topic,
      due,
      overdueDays: Math.max(0, daysBetween(parseISO(today), parseISO(due))),
      interval: Number(progress.sm2?.interval || 0),
      ease: Number(progress.sm2?.ease || 2.5)
    };
  }).sort((a, b) => a.due.localeCompare(b.due) || b.topic.weight - a.topic.weight || a.topic.order - b.topic.order);
  return Number(limit) > 0 ? list.slice(0, limit) : list;
}

function reviewDueLabel(topicId) {
  const sm2 = state.progress.topics[topicId]?.sm2;
  if (!sm2?.due) return { text: 'новая', className: '' };
  const today = toISO(new Date());
  if (sm2.due < today) {
    const days = Math.max(1, daysBetween(parseISO(today), parseISO(sm2.due)));
    return { text: 'просрочено на ' + days + ' ' + pluralize(days, ['день', 'дня', 'дней']), className: 'overdue' };
  }
  if (sm2.due === today) return { text: 'повторить сегодня', className: '' };
  const days = Math.max(1, daysBetween(parseISO(sm2.due), parseISO(today)));
  return { text: 'через ' + days + ' ' + pluralize(days, ['день', 'дня', 'дней']), className: '' };
}

function isTopicDone(topicId) {
  const progress = state.progress.topics[topicId];
  return Boolean(progress && progress.theory && progress.practice);
}

function subjectProgress(subjectId) {
  const topics = topicsForSubject(subjectId);
  if (!topics.length) return 0;
  return Math.round(topics.filter(t => isTopicDone(t.id)).length / topics.length * 100);
}

function subjectAccuracy(subjectId) {
  const entries = state.progress.quizHistory.filter(item => item.subject === subjectId);
  const total = entries.reduce((sum, item) => sum + item.total, 0);
  const correct = entries.reduce((sum, item) => sum + item.correct, 0);
  return total ? Math.round(correct / total * 100) : 0;
}

function allQuestionsForSubject(subjectId) {
  return TOPICS.filter(topic => topic.subject === subjectId).flatMap(topic => topic.questions);
}

function currentStreak() {
  const activity = state.progress.activity;
  let cursor = startOfDay(new Date());
  if (!activity[toISO(cursor)]) cursor = addDays(cursor, -1);
  let streak = 0;
  while (activity[toISO(cursor)] && streak < 3650) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function weeklyMinutes() {
  let total = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 7; i += 1) {
    const key = toISO(addDays(today, -i));
    total += Number(state.progress.activity[key] || 0);
  }
  return total;
}

function totalTopicsDone() {
  return TOPICS.filter(topic => profileSubjects().includes(topic.subject) && isTopicDone(topic.id)).length;
}

function totalSelectedTopics() {
  return profileSubjects().reduce((sum, id) => sum + topicsForSubject(id).length, 0);
}

function overallAccuracy() {
  const history = state.progress.quizHistory;
  const total = history.reduce((sum, item) => sum + item.total, 0);
  const correct = history.reduce((sum, item) => sum + item.correct, 0);
  return total ? Math.round(correct / total * 100) : 0;
}

function addActivity(minutes, dateISO) {
  const key = dateISO || toISO(new Date());
  state.progress.activity[key] = Number(state.progress.activity[key] || 0) + Math.max(1, Math.round(minutes));
}

function getMistakeCount() {
  return Object.keys(state.progress.mistakes || {}).length;
}

function topWeakTopics(limit) {
  return TOPICS
    .filter(topic => profileSubjects().includes(topic.subject))
    .map(topic => {
      const progress = state.progress.topics[topic.id] || {};
      const attempts = Number(progress.attempts || 0);
      const best = Number(progress.best || 0);
      const score = attempts ? (100 - best) + (isTopicDone(topic.id) ? 0 : 30) - topic.weight * 3 : 55 - topic.weight * 2;
      return { topic, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 4)
    .map(item => item.topic);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function maybeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nonEssaySubjects() {
  return profileSubjects().filter(id => !SUBJECTS[id]?.isEssay);
}

function totalPracticeMinutes() {
  return Object.values(state.progress.activity || {}).reduce((sum, value) => sum + maybeNumber(value), 0);
}

function answeredQuestionCount() {
  return (state.progress.quizHistory || []).reduce((sum, item) => sum + maybeNumber(item.total), 0);
}

function completedSessionCount() {
  return Object.keys(state.progress.sessions || {}).filter(id => sessionIsDone(id)).length;
}

function completedMockCount() {
  return (state.progress.quizHistory || []).filter(item => item.mode === 'mock').length;
}

function dailyQuestionCount() {
  return Object.keys(state.progress.dailyQuestions || {}).length;
}

function weeklyCompletedSessionCount() {
  const start = startOfWeek(new Date());
  return Object.entries(state.progress.sessions || {}).filter(([, value]) => {
    if (!value?.doneAt) return false;
    return parseISO(String(value.doneAt).slice(0, 10)) >= start;
  }).length;
}

function fipiSubjectUrl(subjectId) {
  return FIPI_BANK[subjectId]?.url || FIPI_BANK_ROOT;
}

function externalLink(url, label, className) {
  return '<a class="' + (className || '') + '" href="' + escapeHTML(url || FIPI_BANK_ROOT) + '" target="_blank" rel="noopener noreferrer">' + label + ' ' + icon('arrowUpRight') + '</a>';
}

function fipiSubjectLink(subjectId, label, className) {
  return externalLink(fipiSubjectUrl(subjectId), label || 'Банк ФИПИ', className);
}

function forecastTrendHTML(trend, compact) {
  const delta = maybeNumber(trend?.delta);
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const sign = delta > 0 ? '+' : '';
  const label = delta === 0 ? 'без изменений' : sign + delta + ' б.';
  return '<span class="forecast-trend ' + tone + '">' + icon(delta === 0 ? 'arrowRight' : 'trendUp') + label + (compact ? '' : ' · ' + escapeHTML(trend?.label || 'точка старта')) + '</span>';
}

function forecastOverview() {
  const forecast = computeForecast();
  const trend = forecastTrend(forecast);
  return { forecast, trend };
}

const ENCOURAGEMENTS = [
  'Один спокойный шаг сегодня важнее идеального плана на месяц.',
  'Вы уже здесь — это и есть начало. Дальше можно маленькими шагами.',
  'Ритм сильнее рывка. Сегодня достаточно одного занятия.',
  'Не идеально — значит живо. Главное, не выпадать надолго.',
  'Трудная тема становится понятной после второго подхода.',
  'Вы не соревнуетесь с другими. Только с вчерашним собой.',
  'Прогресс любит тишину: 25 минут без телефона уже работают.',
  'Ошибка — это подсказка, где стать чуть точнее.',
  'Сегодня можно просто вернуться в ритм. Без догонялок.',
  'Чувствуете усталость? Сделайте короткий шаг и оставьте силы на завтра.',
  'Каждая закрытая тема — это минус одна причина для тревоги.',
  'План не требует героизма. Он требует возвращения.'
];

function encouragementFor(seedKey) {
  const text = String(seedKey || toISO(new Date()));
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) seed = (seed * 31 + text.charCodeAt(index)) >>> 0;
  return ENCOURAGEMENTS[seed % ENCOURAGEMENTS.length];
}

function resultEncouragement(percent) {
  if (percent >= 80) return 'Отличный запас уверенности. Закрепите результат через пару дней.';
  if (percent >= 50) return 'База уже есть. Ошибки покажут, где добавить точности.';
  return 'Это только стартовая точка. Один разбор важнее трёх угадываний.';
}

function topicMasteryValue(topic) {
  const progress = state.progress.topics[topic.id] || {};
  const best = clamp(progress.best, 0, 100) / 100;
  const attempts = maybeNumber(progress.attempts);
  if (attempts > 0) {
    return clamp(best * 0.72 + (progress.theory ? 0.14 : 0) + (progress.practice ? 0.14 : 0), 0, 1);
  }
  if (progress.theory && progress.practice) return 0.82;
  if (progress.theory) return 0.4;
  return 0;
}

function forecastForSubject(subjectId) {
  const subject = SUBJECTS[subjectId];
  const topics = topicsForSubject(subjectId);
  if (!subject || subject.isEssay || !topics.length) return null;
  const weightSum = topics.reduce((sum, topic) => sum + Math.max(1, maybeNumber(topic.weight)), 0);
  let weightedMastery = 0;
  let weightedCoverage = 0;
  topics.forEach(topic => {
    const weight = Math.max(1, maybeNumber(topic.weight));
    const progress = state.progress.topics[topic.id] || {};
    weightedMastery += weight * topicMasteryValue(topic);
    weightedCoverage += weight * (progress.theory && progress.practice ? 1 : progress.theory ? 0.35 : 0);
  });
  const mastery = weightSum ? weightedMastery / weightSum : 0;
  const coverage = weightSum ? weightedCoverage / weightSum : 0;
  const history = (state.progress.quizHistory || []).filter(item => item.subject === subjectId);
  const totalAnswers = history.reduce((sum, item) => sum + maybeNumber(item.total), 0);
  const correctAnswers = history.reduce((sum, item) => sum + maybeNumber(item.correct), 0);
  const accuracy = totalAnswers ? correctAnswers / totalAnswers : 0.5;
  const rawScore = 6 + 94 * (0.12 + mastery * 0.5 + coverage * 0.23 + accuracy * 0.15);
  const score = Math.round(clamp(rawScore, 0, 100));
  const margin = Math.round(3 + (1 - coverage) * 4 + (totalAnswers < 10 ? 2 : 0));
  return {
    subjectId,
    score,
    low: Math.max(0, score - margin),
    high: Math.min(100, score + margin),
    mastery: Math.round(mastery * 100),
    coverage: Math.round(coverage * 100),
    accuracy: totalAnswers ? Math.round(accuracy * 100) : null,
    answers: totalAnswers,
    margin
  };
}

function forecastEssayStatus() {
  const topics = topicsForSubject('essay');
  if (!topics.length) return null;
  const done = topics.filter(topic => isTopicDone(topic.id)).length;
  return { done, total: topics.length, ready: done >= Math.max(4, Math.ceil(topics.length * 0.7)) };
}

function computeForecast() {
  const subjects = nonEssaySubjects().map(forecastForSubject).filter(Boolean);
  const totalScore = subjects.reduce((sum, item) => sum + item.score, 0);
  const lowTotal = subjects.reduce((sum, item) => sum + item.low, 0);
  const highTotal = subjects.reduce((sum, item) => sum + item.high, 0);
  const maxTotal = subjects.length * 100;
  return {
    subjects,
    totalScore,
    lowTotal,
    highTotal,
    maxTotal,
    avg: subjects.length ? Math.round(totalScore / subjects.length) : 0,
    essay: forecastEssayStatus()
  };
}

function recordForecastSnapshot() {
  if (!state.profile) return computeForecast();
  const forecast = computeForecast();
  if (!forecast.maxTotal) return forecast;
  const today = toISO(new Date());
  state.progress.forecastHistory = state.progress.forecastHistory || {};
  if (!state.progress.forecastHistory[today]) {
    state.progress.forecastHistory[today] = {
      score: forecast.totalScore,
      low: forecast.lowTotal,
      high: forecast.highTotal,
      avg: forecast.avg,
      at: new Date().toISOString()
    };
    const keys = Object.keys(state.progress.forecastHistory).sort();
    while (keys.length > 120) delete state.progress.forecastHistory[keys.shift()];
    saveState();
  }
  return forecast;
}

function forecastTrend(currentForecast) {
  const forecast = currentForecast || computeForecast();
  const history = state.progress.forecastHistory || {};
  const today = toISO(new Date());
  const previousKeys = Object.keys(history).filter(key => key < today).sort();
  const weekAgo = toISO(addDays(new Date(), -7));
  const weekKeys = previousKeys.filter(key => key <= weekAgo);
  let baselineKey = weekKeys.length ? weekKeys[weekKeys.length - 1] : previousKeys.length ? previousKeys[previousKeys.length - 1] : null;
  if (baselineKey) {
    const baseline = history[baselineKey];
    const days = Math.max(1, daysBetween(new Date(), parseISO(baselineKey)));
    return {
      delta: forecast.totalScore - maybeNumber(baseline.score),
      days,
      label: days >= 6 ? 'за неделю' : 'за ' + daysLabel(days),
      baselineKey
    };
  }
  const diagnosticStart = maybeNumber(state.progress.diagnostic?.baseline?.score);
  if (state.progress.diagnostic?.baseline && diagnosticStart > 0) {
    return {
      delta: forecast.totalScore - diagnosticStart,
      days: Math.max(1, daysBetween(new Date(), parseISO(String(state.progress.diagnostic.completedAt || '').slice(0, 10)) || new Date())),
      label: 'с диагностики',
      baselineKey: 'diagnostic'
    };
  }
  return { delta: 0, days: 0, label: 'точка старта', baselineKey: null };
}

function forecastSparkBars() {
  const history = state.progress.forecastHistory || {};
  const days = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(new Date()), index - 6));
  const values = days.map(day => {
    const key = toISO(day);
    return { key, day, value: history[key] ? maybeNumber(history[key].avg || history[key].score) : null };
  });
  const max = Math.max(10, ...values.map(item => item.value || 0));
  return values.map(item => {
    const height = item.value === null ? 5 : Math.max(7, Math.round(item.value / max * 100));
    const today = item.key === toISO(new Date());
    return '<span class="forecast-spark-bar' + (item.value !== null ? ' on' : '') + (today ? ' today' : '') + '" style="height:' + height + '%" title="' + (item.value !== null ? item.value + ' б.' : 'нет данных') + '"></span>';
  }).join('');
}

function pickDailyQuestion(dateISO) {
  const weak = topWeakTopics(12).filter(topic => topic.questions.some(question => question.source !== 'fipi'));
  const pools = weak.length ? weak : topicsForSubject(profileSubjects()[0] || '');
  const pool = pools.flatMap(topic => topic.questions
    .filter(question => question.source !== 'fipi')
    .map(question => ({ question, topic })));
  if (!pool.length) return null;
  const seed = Number(String(dateISO || toISO(new Date())).replace(/-/g, '')) || 1;
  let index = Math.abs(seed) % pool.length;
  const previous = state.progress.dailyQuestion?.questionId;
  if (pool.length > 1 && pool[index].question.id === previous) index = (index + 1) % pool.length;
  return pool[index];
}

function ensureDailyQuestion() {
  if (!state.profile) return null;
  const today = toISO(new Date());
  const current = state.progress.dailyQuestion;
  if (current?.date === today && QUESTION_BY_ID[current.questionId]) {
    if (!Array.isArray(current.order) && current.selected === null && !current.checked) {
      current.order = shuffledOptionOrder(QUESTION_BY_ID[current.questionId]);
      saveState();
    }
    return current;
  }
  const picked = pickDailyQuestion(today);
  if (!picked) return null;
  state.progress.dailyQuestion = {
    date: today,
    questionId: picked.question.id,
    order: shuffledOptionOrder(picked.question),
    selected: null,
    checked: false,
    correct: false,
    startedAt: new Date().toISOString()
  };
  saveState();
  return state.progress.dailyQuestion;
}

function dailyQuestionMeta() {
  const daily = ensureDailyQuestion();
  if (!daily) return null;
  const question = QUESTION_BY_ID[daily.questionId];
  const topic = question ? TOPIC_BY_ID[question.topicId] : null;
  return { daily, question, topic };
}

function missedStreakInfo() {
  if (!state.plan || !Array.isArray(state.plan.sessions)) return { count: 0, sessions: [] };
  const today = toISO(new Date());
  const past = state.plan.sessions
    .filter(session => session.date < today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  let count = 0;
  const missed = [];
  for (let index = past.length - 1; index >= 0; index -= 1) {
    if (sessionIsDone(past[index].id)) break;
    count += 1;
    missed.unshift(past[index]);
  }
  return { count, sessions: missed };
}

function maybeAutoRebalance() {
  if (!state.profile || !state.plan) return null;
  const info = missedStreakInfo();
  if (info.count < 3) return null;
  const signature = info.sessions.map(session => session.id).join('|');
  if (state.progress.rebalance?.lastSignature === signature) return null;
  const lastMissed = info.sessions[info.sessions.length - 1] || null;
  state.plan = generatePlan(state.profile);
  state.progress.rebalance = {
    lastSignature: signature,
    pendingReason: true,
    count: info.count,
    detectedAt: new Date().toISOString(),
    lastMissedId: lastMissed?.id || null,
    lastMissedTopicId: lastMissed?.topicId || null,
    lastMissedSubject: lastMissed?.subject || null
  };
  saveState();
  return state.progress.rebalance;
}

function groupWeekSessionCount() {
  return weeklyCompletedSessionCount();
}

function makeDemoGroup(name, code) {
  const cleanName = String(name || '').trim() || 'Наша команда';
  return {
    id: 'group_' + Date.now().toString(36),
    name: cleanName,
    code: String(code || '').trim().toUpperCase() || 'FOKUS-' + randomHex(2).toUpperCase(),
    createdAt: new Date().toISOString(),
    demo: true,
    targetPerMember: 3,
    members: [
      { id: 'me', name: state.profile?.name || currentUser?.name || 'Вы', isMe: true, demo: false },
      { id: 'demo-1', name: 'Аня', isMe: false, demo: true, sessions: 3 },
      { id: 'demo-2', name: 'Марк', isMe: false, demo: true, sessions: 2 },
      { id: 'demo-3', name: 'Соня', isMe: false, demo: true, sessions: 1 }
    ]
  };
}

function groupMembersWithProgress(group) {
  if (!group) return [];
  const myWeekly = groupWeekSessionCount();
  return (group.members || []).map(member => {
    const sessions = member.isMe ? myWeekly : maybeNumber(member.sessions);
    const status = sessions >= 3 ? 'rhythm' : sessions >= 1 ? 'steady' : 'support';
    const statusLabel = status === 'rhythm' ? 'в ритме' : status === 'steady' ? 'держится' : 'нужна поддержка';
    return { ...member, sessions, status, statusLabel };
  }).sort((a, b) => b.sessions - a.sessions || (a.isMe ? -1 : 1));
}

function groupProgress(group) {
  if (!group) return { done: 0, target: 0, percent: 0 };
  const members = groupMembersWithProgress(group);
  const target = Math.max(1, members.length * maybeNumber(group.targetPerMember || 3));
  const done = members.reduce((sum, member) => sum + member.sessions, 0);
  return { done, target, percent: Math.min(100, Math.round(done / target * 100)) };
}

function copyGroupCode(code) {
  const text = String(code || '');
  if (!text) return;
  const done = () => showToast('Код скопирован', 'Отправьте его друзьям или преподавателю.', 'success');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {
      showToast('Не удалось скопировать', 'Код: ' + text, 'info');
    });
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
    done();
  } catch (error) {
    showToast('Не удалось скопировать', 'Код: ' + text, 'info');
  }
  area.remove();
}

const API_BRIDGE = {
  baseUrl: '',
  routes: {
    sync: 'POST /api/v1/sync',
    groups: 'POST /api/v1/groups',
    joinGroup: 'POST /api/v1/groups/join',
    groupProgress: 'GET /api/v1/groups/:id/progress'
  },
  configured() {
    return Boolean(this.baseUrl);
  },
  async request(path, options) {
    if (!this.baseUrl) throw new Error('Серверная часть ещё не подключена.');
    const response = await fetch(this.baseUrl + path, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options
    });
    if (!response.ok) throw new Error('Ошибка сервера: ' + response.status);
    return response.json();
  }
};

const ACHIEVEMENT_BRANCHES = {
  roots: { title: 'Корни', subtitle: 'Старт и первые действия' },
  trunk: { title: 'Ствол', subtitle: 'Темы и закрытые занятия' },
  rhythm: { title: 'Ритм', subtitle: 'Регулярность и время в практике' },
  crown: { title: 'Крона', subtitle: 'Точность, пробники и прогноз' }
};

function achievementCurrent(id) {
  if (id === 'diagnostic') return state.progress.diagnostic?.completedAt ? 1 : 0;
  if (id === 'first-theory') return TOPICS.filter(topic => profileSubjects().includes(topic.subject) && state.progress.topics[topic.id]?.theory).length;
  if (id === 'first-practice') return TOPICS.filter(topic => profileSubjects().includes(topic.subject) && maybeNumber(state.progress.topics[topic.id]?.attempts) > 0).length;
  if (id === 'first-session') return completedSessionCount();
  if (id === 'topics-1') return totalTopicsDone();
  if (id === 'topics-5') return totalTopicsDone();
  if (id === 'topics-10') return totalTopicsDone();
  if (id === 'topics-20') return totalTopicsDone();
  if (id === 'topics-40') return totalTopicsDone();
  if (id === 'sessions-10') return completedSessionCount();
  if (id === 'sessions-30') return completedSessionCount();
  if (id === 'streak-3') return currentStreak();
  if (id === 'streak-7') return currentStreak();
  if (id === 'streak-14') return currentStreak();
  if (id === 'time-60') return totalPracticeMinutes();
  if (id === 'time-300') return totalPracticeMinutes();
  if (id === 'time-900') return totalPracticeMinutes();
  if (id === 'daily-1') return dailyQuestionCount();
  if (id === 'daily-7') return dailyQuestionCount();
  if (id === 'accuracy-75') return answeredQuestionCount() >= 10 ? overallAccuracy() : 0;
  if (id === 'mock-1') return completedMockCount();
  if (id === 'mock-3') return completedMockCount();
  if (id === 'forecast-60') return answeredQuestionCount() >= 5 || totalTopicsDone() > 0 ? computeForecast().avg : 0;
  return 0;
}

const ACHIEVEMENTS = [
  { id: 'diagnostic', branch: 'roots', title: 'Карта уровня', desc: 'Пройти стартовую диагностику', icon: 'compass', target: 1, unit: 'диагностика' },
  { id: 'first-theory', branch: 'roots', title: 'Первый разбор', desc: 'Открыть теорию и отметить её изученной', icon: 'bookOpen', target: 1, unit: 'тема' },
  { id: 'first-practice', branch: 'roots', title: 'Первая практика', desc: 'Ответить хотя бы на одну карточку', icon: 'target', target: 1, unit: 'тема' },
  { id: 'first-session', branch: 'roots', title: 'Шаг в маршруте', desc: 'Закрыть первое занятие в плане', icon: 'checkCircle', target: 1, unit: 'занятие' },
  { id: 'topics-1', branch: 'trunk', title: 'Одна тема закрыта', desc: 'Теория и практика по теме', icon: 'check', target: 1, unit: 'тем' },
  { id: 'topics-5', branch: 'trunk', title: 'Пять тем', desc: 'Первая устойчивая база', icon: 'layers', target: 5, unit: 'тем' },
  { id: 'topics-10', branch: 'trunk', title: 'Десять тем', desc: 'Маршрут набирает силу', icon: 'trendUp', target: 10, unit: 'тем' },
  { id: 'topics-20', branch: 'trunk', title: 'Двадцать тем', desc: 'Половина пути уже за спиной', icon: 'spark', target: 20, unit: 'тем' },
  { id: 'topics-40', branch: 'trunk', title: 'Сорок тем', desc: 'Почти весь банк тем освоен', icon: 'trophy', target: 40, unit: 'тем' },
  { id: 'sessions-10', branch: 'trunk', title: 'Десять занятий', desc: 'Регулярность становится привычкой', icon: 'calendar', target: 10, unit: 'занятий' },
  { id: 'sessions-30', branch: 'trunk', title: 'Тридцать занятий', desc: 'Серьёзная работа, а не случайный рывок', icon: 'award', target: 30, unit: 'занятий' },
  { id: 'streak-3', branch: 'rhythm', title: 'Три дня подряд', desc: 'Серия без пропусков', icon: 'flame', target: 3, unit: 'дней' },
  { id: 'streak-7', branch: 'rhythm', title: 'Неделя в ритме', desc: 'Семь дней активности подряд', icon: 'flame', target: 7, unit: 'дней' },
  { id: 'streak-14', branch: 'rhythm', title: 'Две недели', desc: 'Привычка уже работает на вас', icon: 'flame', target: 14, unit: 'дней' },
  { id: 'time-60', branch: 'rhythm', title: 'Первый час', desc: '60 минут практики', icon: 'clock', target: 60, unit: 'мин' },
  { id: 'time-300', branch: 'rhythm', title: 'Пять часов', desc: '300 минут практики', icon: 'clock', target: 300, unit: 'мин' },
  { id: 'time-900', branch: 'rhythm', title: 'Пятнадцать часов', desc: '900 минут практики', icon: 'zap', target: 900, unit: 'мин' },
  { id: 'daily-1', branch: 'rhythm', title: 'Вопрос дня', desc: 'Ответить на ежедневную задачу', icon: 'lightbulb', target: 1, unit: 'день' },
  { id: 'daily-7', branch: 'rhythm', title: 'Семь вопросов дня', desc: 'Неделя микроусилий', icon: 'calendar', target: 7, unit: 'дней' },
  { id: 'accuracy-75', branch: 'crown', title: 'Точность 75%', desc: 'Минимум 10 ответов в практике', icon: 'target', target: 75, unit: '%' },
  { id: 'mock-1', branch: 'crown', title: 'Первый пробник', desc: 'Пройти мини-экзамен', icon: 'compass', target: 1, unit: 'пробник' },
  { id: 'mock-3', branch: 'crown', title: 'Три пробника', desc: 'Проверить темп трижды', icon: 'award', target: 3, unit: 'пробника' },
  { id: 'forecast-60', branch: 'crown', title: 'Прогноз 60+', desc: 'Средний прогноз по предметам', icon: 'trendUp', target: 60, unit: 'баллов' }
];

const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(achievement => [achievement.id, achievement]));

function achievementValueLabel(achievement, value) {
  if (achievement.unit === 'мин') return formatMinutes(value);
  return String(Math.round(value));
}

function achievementState(achievement) {
  const actual = Math.max(0, achievementCurrent(achievement.id));
  const target = Math.max(1, achievement.target);
  const current = Math.min(actual, target);
  const unlocked = Boolean(state.progress.achievements?.[achievement.id]);
  return {
    ...achievement,
    current,
    actual,
    target,
    unlocked,
    percent: Math.min(100, Math.round(current / target * 100))
  };
}

function unlockedAchievementCount() {
  return ACHIEVEMENTS.filter(achievement => state.progress.achievements?.[achievement.id]).length;
}

function evaluateAchievements() {
  if (!currentUser || !state.onboarded) return [];
  state.progress.achievements = state.progress.achievements || {};
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(achievement => {
    if (state.progress.achievements[achievement.id]) return;
    const stateInfo = achievementState(achievement);
    if (stateInfo.current >= stateInfo.target) {
      state.progress.achievements[achievement.id] = { unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(stateInfo);
    }
  });
  if (newlyUnlocked.length) saveState();
  return newlyUnlocked;
}

function getSlots(profile, date) {
  const iso = toISO(date);
  const today = toISO(new Date());
  const day = dayNumber(date);
  if (!Number.isFinite(day)) return [];
  if (!(profile.studyDays || []).map(Number).includes(day)) return [];
  if (Number(profile.bufferDay) === day) return [];
  const examDates = profile.examDates || {};
  const active = (profile.subjects || []).some(id => examDates[id] && parseISO(examDates[id]) > date);
  if (!active) return [];
  const now = new Date();
  const preferred = [...(profile.preferredTimes?.length ? profile.preferredTimes : DEFAULT_PREFERRED_TIMES)].sort();
  const schoolEnd = timeToMinutes(profile.schoolEnd || '15:00');
  const sleepStart = timeToMinutes(profile.sleepStart || '23:00');
  const tutorDays = (profile.tutorDays || []).map(Number);
  const tutorStart = timeToMinutes(profile.tutorTime || '17:00');
  const tutorEnd = tutorStart + 60;
  const sessionMinutes = Number(profile.sessionMinutes) || 45;
  const slots = [];
  let previousEnd = null;
  for (const time of preferred) {
    const start = timeToMinutes(time);
    const end = start + sessionMinutes;
    if (day <= 5 && start < schoolEnd + 15) continue;
    if (tutorDays.includes(day) && start < tutorEnd + 10 && end > tutorStart - 10) continue;
    if (scheduleConflicts(date, minutesToTime(start), minutesToTime(end))) continue;
    if (end > sleepStart) continue;
    if (end > 23 * 60 + 59) continue;
    if (previousEnd !== null && start < previousEnd + 10) continue;
    if (iso === today && start <= now.getHours() * 60 + now.getMinutes() + 10) continue;
    slots.push({ start: minutesToTime(start), end: minutesToTime(end), minutes: sessionMinutes });
    previousEnd = end;
  }
  return slots;
}

function planSubjectOrder(profile, date) {
  return [...(profile.subjects || [])]
    .filter(id => SUBJECTS[id] && profile.examDates[id] && parseISO(profile.examDates[id]) > date)
    .sort((a, b) => {
      const levelA = LEVEL_VALUE[profile.levels?.[a] || 'basic'] ?? 1;
      const levelB = LEVEL_VALUE[profile.levels?.[b] || 'basic'] ?? 1;
      if (levelA !== levelB) return levelA - levelB;
      const daysA = daysBetween(parseISO(profile.examDates[a]), date);
      const daysB = daysBetween(parseISO(profile.examDates[b]), date);
      if (daysA !== daysB) return daysA - daysB;
      return SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b);
    });
}

function planStateFor(profile) {
  const result = {};
  const today = toISO(new Date());
  (profile.subjects || []).forEach(subjectId => {
    const topics = topicsForSubject(subjectId);
    result[subjectId] = {
      index: 0,
      plannedTheory: new Set(),
      plannedPractice: new Set(),
      reviews: [],
      lastFallback: null,
      lastDate: null,
      plannedCount: 0,
      lastWeekCursor: 0,
      topics
    };
    topics.forEach(topic => {
      const due = state.progress.topics[topic.id]?.sm2?.due;
      if (due) result[subjectId].reviews.push({ topicId: topic.id, due: due < today ? today : due });
    });
  });
  return result;
}

function nextPlanItem(subjectId, planState, date, profile) {
  const subjectState = planState[subjectId];
  if (!subjectState) return null;
  const iso = toISO(date);
  if (isLastWeekForSubject(subjectId, date, profile)) {
    const reviewedIds = new Set(subjectState.topics.filter(topic => isTopicDone(topic.id)).map(topic => topic.id));
    const minimum = strategicMinimum(subjectId);
    minimum.mandatory.forEach(item => reviewedIds.add(item.topic.id));
    const pool = subjectState.topics.filter(topic => reviewedIds.has(topic.id));
    const fallbackPool = pool.length ? pool : subjectState.topics;
    if (!fallbackPool.length) return null;
    const index = subjectState.lastWeekCursor % fallbackPool.length;
    subjectState.lastWeekCursor += 1;
    const topic = fallbackPool[index];
    const type = index % 3 === 2 ? 'review' : 'cheatsheet';
    return { type, topic };
  }
  const dueIndex = subjectState.reviews.findIndex(review => review.due <= iso);
  if (dueIndex >= 0) {
    const review = subjectState.reviews.splice(dueIndex, 1)[0];
    return { type: 'review', topic: TOPIC_BY_ID[review.topicId] };
  }
  while (subjectState.index < subjectState.topics.length) {
    const topic = subjectState.topics[subjectState.index];
    const progress = state.progress.topics[topic.id] || {};
    const theoryKnown = Boolean(progress.theory) || subjectState.plannedTheory.has(topic.id);
    const practiceKnown = Boolean(progress.practice) || subjectState.plannedPractice.has(topic.id);
    if (!theoryKnown) {
      subjectState.plannedTheory.add(topic.id);
      return { type: 'theory', topic };
    }
    if (!practiceKnown) {
      subjectState.plannedPractice.add(topic.id);
      return { type: 'practice', topic };
    }
    subjectState.index += 1;
  }
  if (subjectState.topics.length) {
    const cadence = planReviewCadence(subjectId, date, profile);
    const lastFallback = subjectState.lastFallback ? daysBetween(date, parseISO(subjectState.lastFallback)) : 99;
    if (lastFallback >= cadence) {
      subjectState.lastFallback = iso;
      const weakest = subjectState.topics
        .slice()
        .sort((a, b) => {
          const scoreA = topicMasteryValue(a);
          const scoreB = topicMasteryValue(b);
          return scoreA - scoreB || b.weight - a.weight;
        })[0];
      return { type: 'review', topic: weakest };
    }
  }
  return null;
}

function activeFocusTopic(profile) {
  const rebalance = state.progress?.rebalance;
  if (!rebalance || rebalance.reason !== 'topic' || !rebalance.focusTopicId || !rebalance.appliedAt) return null;
  const topic = TOPIC_BY_ID[rebalance.focusTopicId];
  if (!topic || !(profile.subjects || []).includes(topic.subject)) return null;
  const age = Math.max(0, daysBetween(new Date(), parseISO(String(rebalance.appliedAt).slice(0, 10))));
  if (age > 21) return null;
  return topic;
}

function takeFocusPlanItem(focusTopic, planState, date, profile) {
  if (!focusTopic) return null;
  const subjectState = planState[focusTopic.subject];
  const examDate = profile.examDates?.[focusTopic.subject];
  if (!subjectState || subjectState.focusScheduled || !examDate || parseISO(examDate) <= date) return null;
  const progress = state.progress.topics[focusTopic.id] || {};
  const theoryKnown = Boolean(progress.theory) || subjectState.plannedTheory.has(focusTopic.id);
  const type = isLastWeekForSubject(focusTopic.subject, date, profile)
    ? (theoryKnown ? 'review' : 'cheatsheet')
    : theoryKnown ? 'practice' : 'theory';
  subjectState.focusScheduled = true;
  if (type === 'theory') subjectState.plannedTheory.add(focusTopic.id);
  else if (type === 'practice') subjectState.plannedPractice.add(focusTopic.id);
  return { subjectId: focusTopic.subject, type, topic: focusTopic };
}

function pickPlanItem(order, planState, lastSubject, date, profile, focusTopic) {
  const focusItem = takeFocusPlanItem(focusTopic, planState, date, profile);
  if (focusItem) {
    planState[focusItem.subjectId].lastDate = toISO(date);
    planState[focusItem.subjectId].plannedCount += 1;
    return focusItem;
  }
  const available = order.filter(subjectId => {
    const examDate = profile.examDates?.[subjectId];
    return examDate && parseISO(examDate) > date;
  });
  const ranked = available.map(subjectId => {
    const subjectState = planState[subjectId];
    const daysToExamValue = Math.max(1, daysBetween(parseISO(profile.examDates[subjectId]), date));
    const gapDays = subjectState.lastDate ? Math.max(0, daysBetween(date, parseISO(subjectState.lastDate))) : 21;
    const cadence = subjectCadence(subjectId, date, profile);
    const overdue = Math.max(0, gapDays - cadence);
    const urgency = daysToExamValue <= 14 ? 55 : daysToExamValue <= 30 ? 30 : daysToExamValue <= 60 ? 16 : daysToExamValue <= 120 ? 7 : 0;
    const levelBoost = (2 - (LEVEL_VALUE[profile.levels?.[subjectId] || 'basic'] ?? 1)) * 5;
    const progress = subjectProgress(subjectId);
    const targetGap = Math.max(0, Number(profile.targets?.[subjectId] || 80) - progress);
    const lastWeekBoost = isLastWeekForSubject(subjectId, date, profile) ? 1000 : 0;
    let score = lastWeekBoost + overdue * 24 + gapDays * 2 + urgency + levelBoost + Math.min(24, targetGap * 0.25);
    if (subjectId === lastSubject) score -= 13;
    if (subjectId === 'essay') score += 9;
    return { subjectId, score };
  }).sort((a, b) => b.score - a.score || SUBJECT_ORDER.indexOf(a.subjectId) - SUBJECT_ORDER.indexOf(b.subjectId));
  for (const candidate of ranked) {
    const item = nextPlanItem(candidate.subjectId, planState, date, profile);
    if (item) {
      planState[candidate.subjectId].lastDate = toISO(date);
      planState[candidate.subjectId].plannedCount += 1;
      return { subjectId: candidate.subjectId, ...item };
    }
  }
  return null;
}

function generatePlan(profile) {
  const result = {
    version: PLAN_VERSION,
    sessions: [],
    warnings: [],
    lastWeekSubjects: [],
    stats: { covered: 0, total: 0, sessions: 0, generatedAt: new Date().toISOString() },
    generatedAt: new Date().toISOString()
  };
  if (!profile || !(profile.subjects || []).length) {
    result.warnings.push('Не выбрано ни одного предмета.');
    return result;
  }
  const dates = profile.examDates || {};
  const selected = profile.subjects.filter(id => SUBJECTS[id]);
  const examDates = selected.map(id => dates[id]).filter(Boolean).map(parseISO);
  if (!examDates.length) {
    result.warnings.push('Не заданы даты экзаменов.');
    return result;
  }
  const lastExam = examDates.reduce((max, date) => date > max ? date : max, examDates[0]);
  const start = startOfDay(new Date());
  if (lastExam < start) {
    result.warnings.push('Дата экзамена уже прошла. Обновите год экзамена в настройках.');
    return result;
  }
  const planState = planStateFor(profile);
  const focusTopic = activeFocusTopic(profile);
  const sessionMinutes = Number(profile.sessionMinutes) || 45;
  const dailyMinutes = Number(profile.dailyMinutes) || 90;
  const maxSessions = Math.max(1, Math.min(3, Math.floor(dailyMinutes / sessionMinutes)));
  let coverage = 0;
  let lastSubject = null;
  let noSlotDays = 0;
  let studyDaysCount = 0;
  const plannedTopics = new Set();
  const seenIds = new Set();
  const startISO = toISO(start);
  for (let cursor = new Date(start); cursor <= lastExam; cursor = addDays(cursor, 1)) {
    const day = dayNumber(cursor);
    const dateISO = toISO(cursor);
    if ((profile.studyDays || []).map(Number).includes(day) && Number(profile.bufferDay) !== day) studyDaysCount += 1;
    const order = planSubjectOrder(profile, cursor);
    if (!order.length) continue;
    const slots = getSlots(profile, cursor);
    const weekIndex = Math.floor(daysBetween(cursor, start) / 7);
    const lastWeekActive = order.some(subjectId => isLastWeekForSubject(subjectId, cursor, profile));
    if (profile.miniMocks && !lastWeekActive && cursor.getDay() === 6) {
      const mockPool = order.filter(subjectId => {
        const examDate = profile.examDates?.[subjectId];
        return examDate && parseISO(examDate) > cursor;
      });
      const subjectId = mockPool.length ? mockPool[weekIndex % mockPool.length] : null;
      if (subjectId) {
        const mockDuration = Math.min(90, Math.max(sessionMinutes, dailyMinutes));
        const preferred = (profile.preferredTimes || [])[0];
        const mockStart = slots[0]?.start || (/^\d{2}:\d{2}$/.test(String(preferred)) ? preferred : '10:00');
        const mockEnd = minutesToTime(timeToMinutes(mockStart) + mockDuration);
        const id = dateISO + '-' + subjectId + '-mock';
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.sessions.push({
            id, date: dateISO, start: mockStart, end: mockEnd, duration: mockDuration,
            subject: subjectId, topicId: null, title: 'Пробник · ' + SUBJECTS[subjectId].short,
            type: 'mock', stage: SESSION_LABELS.mock
          });
        }
        continue;
      }
    }
    if (!slots.length) {
      if ((profile.studyDays || []).map(Number).includes(day) && Number(profile.bufferDay) !== day) noSlotDays += 1;
      continue;
    }
    const slotsToUse = slots.slice(0, maxSessions);
    for (const slot of slotsToUse) {
      const picked = pickPlanItem(order, planState, lastSubject, cursor, profile, focusTopic);
      if (!picked) break;
      const topic = picked.topic;
      const type = picked.type;
      const id = dateISO + '-' + picked.subjectId + '-' + topic.id + '-' + type;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.sessions.push({
        id,
        date: dateISO,
        start: slot.start,
        end: slot.end,
        duration: sessionMinutes,
        subject: picked.subjectId,
        topicId: topic.id,
        title: topic.title,
        type,
        stage: SESSION_LABELS[type]
      });
      if (type === 'theory') plannedTopics.add(topic.id);
      if (type === 'practice' && profile.spacedReview) {
        const sm2 = state.progress.topics[topic.id]?.sm2;
        const ease = Math.max(1.3, Number(sm2?.ease || 2.5));
        let gap = sm2?.interval ? clamp(Math.round(sm2.interval * 0.6), 1, 21) : 1;
        for (let reviewIndex = 0; reviewIndex < 3; reviewIndex += 1) {
          planState[picked.subjectId].reviews.push({ topicId: topic.id, due: toISO(addDays(cursor, gap)) });
          gap = clamp(Math.max(gap + 2, Math.round(gap * ease)), 2, 120);
        }
      }
      lastSubject = picked.subjectId;
    }
    if (dateISO === startISO && !result.sessions.some(s => s.date === startISO)) {
      continue;
    }
  }
  const allTopics = TOPICS.filter(topic => selected.includes(topic.subject));
  const covered = allTopics.filter(topic => plannedTopics.has(topic.id) || state.progress.topics[topic.id]?.theory).length;
  result.stats = {
    covered,
    total: allTopics.length,
    sessions: result.sessions.length,
    generatedAt: new Date().toISOString()
  };
  result.sessions.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  if (!result.sessions.length) {
    result.warnings.push('Не удалось поставить занятия: проверьте учебные дни, свободные часы и ограничения.');
  }
  if (covered < allTopics.length) {
    const missing = allTopics.length - covered;
    result.warnings.push('В текущем ритме успеваем охватить ' + covered + ' из ' + allTopics.length + ' тем. Не хватает времени ещё на ' + missing + ' тем.');
  }
  if (noSlotDays > Math.max(3, studyDaysCount * 0.35)) {
    result.warnings.push('Много учебных дней остались без занятий: удобные часы пересекаются со школой, репетитором или сном.');
  }
  if (profile.bufferDay && (profile.studyDays || []).map(Number).includes(Number(profile.bufferDay))) {
    result.warnings.push('Буферный день совпадает с учебным днём — он оставлен свободным от занятий.');
  }
  result.lastWeekSubjects = lastWeekSubjects(profile);
  return result;
}

function ensureSettingsDraft() {
  if (settingsDraft) return;
  const profile = state.profile;
  if (!profile) return;
  settingsDraft = {
    studyDays: [...(profile.studyDays || [])].map(Number),
    preferredTimes: [...(profile.preferredTimes || DEFAULT_PREFERRED_TIMES)],
    dailyMinutes: Number(profile.dailyMinutes) || 90,
    sessionMinutes: Number(profile.sessionMinutes) || 45,
    schoolEnd: profile.schoolEnd || '15:00',
    tutorDays: [...(profile.tutorDays || [])].map(Number),
    tutorTime: profile.tutorTime || '17:00',
    sleepStart: profile.sleepStart || '23:00',
    bufferDay: Number(profile.bufferDay) || 7,
    miniMocks: Boolean(profile.miniMocks),
    spacedReview: Boolean(profile.spacedReview)
  };
}
