/* Утилиты, нормализация состояния, аккаунты и тема оформления. */
'use strict';

function pad(value) {
  return String(value).padStart(2, '0');
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toISO(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function parseISO(value) {
  if (!value) return startOfDay(new Date());
  const parts = String(value).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMinutes(date, minutes) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

function startOfWeek(date) {
  const copy = startOfDay(date);
  const offset = (copy.getDay() + 6) % 7;
  return addDays(copy, -offset);
}

function dayNumber(date) {
  return date.getDay() === 0 ? 7 : date.getDay();
}

function timeToMinutes(value) {
  const parts = String(value || '00:00').split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function minutesToTime(value) {
  const normalized = ((Number(value) % 1440) + 1440) % 1440;
  return pad(Math.floor(normalized / 60)) + ':' + pad(normalized % 60);
}

function formatDate(value, options) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return new Intl.DateTimeFormat('ru-RU', options || { day: 'numeric', month: 'long' }).format(date);
}

function formatDateShort(value) {
  return formatDate(value, { day: 'numeric', month: 'short' });
}

function formatDateFull(value) {
  return formatDate(value, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWeekday(value) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return WEEKDAYS_FULL[date.getDay()];
}

function pluralize(number, forms) {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function daysLabel(number) {
  return number + ' ' + pluralize(number, ['день', 'дня', 'дней']);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function initials(name) {
  const parts = String(name || 'У').trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || 'У') + (parts[1]?.[0] || '');
}

function resolveExamYear() {
  const today = startOfDay(new Date());
  let year = today.getFullYear();
  const lastExam = new Date(year, 5, 11);
  if (lastExam < today) year += 1;
  return year;
}

function examDatesForYear(year) {
  const dates = {};
  Object.keys(SUBJECTS).forEach(id => {
    const exam = SUBJECTS[id].exam;
    dates[id] = toISO(new Date(year + Number(exam.yearOffset || 0), exam.month - 1, exam.day));
  });
  return dates;
}

function defaultState() {
  return {
    version: 2,
    onboarded: false,
    profile: null,
    plan: null,
    progress: {
      topics: {},
      sessions: {},
      mistakes: {},
      activity: {},
      quizHistory: [],
      remindersSent: {},
      diagnostic: null,
      forecastHistory: {},
      achievements: {},
      dailyQuestion: null,
      dailyQuestions: {},
      rebalance: null,
      reflections: [],
      mood: [],
      anxiety: { completed: {}, lastAt: '', sessions: 0 },
      surprise: { attempts: 0, best: 0, lastAt: '', history: [] },
      schedule: { source: '', importedAt: '', lessons: [] },
      fipiSessions: []
    },
    group: null,
    settings: {
      notify: false,
      emailNotify: false,
      sound: false
    },
    meta: {
      createdAt: new Date().toISOString(),
      lastOpen: new Date().toISOString()
    }
  };
}

function isPlainRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value) {
  return isPlainRecord(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asISODate(value) {
  const text = typeof value === 'string' ? value : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function normalizeProfile(profile) {
  if (!isPlainRecord(profile)) return null;
  const subjects = [...new Set(asArray(profile.subjects).filter(id => typeof id === 'string' && SUBJECTS[id]))];
  const examDates = {};
  Object.entries(asRecord(profile.examDates)).forEach(([id, date]) => {
    if (SUBJECTS[id] && asISODate(date)) examDates[id] = date;
  });
  const targets = {};
  const levels = {};
  subjects.forEach(id => {
    targets[id] = asFiniteNumber(profile.targets?.[id], id === 'essay' ? 5 : 80);
    levels[id] = typeof profile.levels?.[id] === 'string' ? profile.levels[id] : 'basic';
  });
  return {
    ...profile,
    name: typeof profile.name === 'string' ? profile.name : '',
    subjects,
    targets,
    levels,
    examYear: asFiniteNumber(profile.examYear, resolveExamYear()),
    examDates,
    studyDays: asArray(profile.studyDays).map(Number).filter(day => day >= 1 && day <= 7),
    preferredTimes: asArray(profile.preferredTimes).filter(time => /^\d{2}:\d{2}$/.test(String(time))),
    dailyMinutes: Math.max(30, asFiniteNumber(profile.dailyMinutes, 90)),
    sessionMinutes: Math.max(15, asFiniteNumber(profile.sessionMinutes, 45)),
    schoolEnd: typeof profile.schoolEnd === 'string' ? profile.schoolEnd : '15:00',
    tutorDays: asArray(profile.tutorDays).map(Number).filter(day => day >= 1 && day <= 7),
    tutorTime: typeof profile.tutorTime === 'string' ? profile.tutorTime : '17:00',
    sleepStart: typeof profile.sleepStart === 'string' ? profile.sleepStart : '23:00',
    bufferDay: asFiniteNumber(profile.bufferDay, 7),
    miniMocks: Boolean(profile.miniMocks),
    spacedReview: Boolean(profile.spacedReview)
  };
}

function normalizePlan(plan) {
  if (!isPlainRecord(plan) || !Array.isArray(plan.sessions)) return null;
  const sessions = plan.sessions.filter(session => (
    isPlainRecord(session) &&
    typeof session.id === 'string' &&
    asISODate(session.date) &&
    typeof session.start === 'string' &&
    SUBJECTS[session.subject]
  )).map(session => ({
    ...session,
    date: asISODate(session.date),
    start: String(session.start),
    end: typeof session.end === 'string' ? session.end : String(session.start),
    duration: Math.max(1, asFiniteNumber(session.duration, 45)),
    subject: session.subject,
    topicId: TOPIC_BY_ID[session.topicId] ? session.topicId : null,
    title: typeof session.title === 'string' ? session.title : 'Занятие',
    type: typeof session.type === 'string' ? session.type : 'practice',
    stage: typeof session.stage === 'string' ? session.stage : ''
  }));
  const stats = asRecord(plan.stats);
  return {
    ...plan,
    sessions,
    lastWeekSubjects: asArray(plan.lastWeekSubjects).filter(id => SUBJECTS[id]),
    warnings: asArray(plan.warnings).filter(warning => typeof warning === 'string'),
    stats: {
      covered: Math.max(0, asFiniteNumber(stats.covered, 0)),
      total: Math.max(0, asFiniteNumber(stats.total, 0)),
      sessions: Math.max(0, asFiniteNumber(stats.sessions, sessions.length)),
      generatedAt: typeof stats.generatedAt === 'string' ? stats.generatedAt : ''
    },
    generatedAt: typeof plan.generatedAt === 'string' ? plan.generatedAt : ''
  };
}

function normalizeTopicMap(value) {
  const topics = {};
  Object.entries(asRecord(value)).forEach(([id, entry]) => {
    if (!TOPIC_BY_ID[id] || !isPlainRecord(entry)) return;
    const sm2Source = asRecord(entry.sm2);
    topics[id] = {
      ...entry,
      theory: Boolean(entry.theory),
      practice: Boolean(entry.practice),
      attempts: Math.max(0, asFiniteNumber(entry.attempts, 0)),
      best: clamp(asFiniteNumber(entry.best, 0), 0, 100),
      sm2: {
        ease: clamp(asFiniteNumber(sm2Source.ease, 2.5), 1.3, 2.8),
        interval: Math.max(0, asFiniteNumber(sm2Source.interval, 0)),
        reps: Math.max(0, Math.floor(asFiniteNumber(sm2Source.reps, 0))),
        lapses: Math.max(0, Math.floor(asFiniteNumber(sm2Source.lapses, 0))),
        due: asISODate(sm2Source.due),
        lastQuality: clamp(asFiniteNumber(sm2Source.lastQuality, 0), 0, 5),
        lastReviewed: typeof sm2Source.lastReviewed === 'string' ? sm2Source.lastReviewed : ''
      }
    };
  });
  return topics;
}

function normalizeProgress(progress) {
  const source = asRecord(progress);
  const activity = {};
  Object.entries(asRecord(source.activity)).forEach(([date, minutes]) => {
    if (asISODate(date)) activity[date] = Math.max(0, asFiniteNumber(minutes, 0));
  });
  const forecastHistory = {};
  Object.entries(asRecord(source.forecastHistory)).forEach(([date, entry]) => {
    if (!asISODate(date) || !isPlainRecord(entry)) return;
    forecastHistory[date] = {
      score: asFiniteNumber(entry.score, 0),
      low: asFiniteNumber(entry.low, 0),
      high: asFiniteNumber(entry.high, 0),
      avg: asFiniteNumber(entry.avg, asFiniteNumber(entry.score, 0)),
      at: typeof entry.at === 'string' ? entry.at : ''
    };
  });
  const achievements = {};
  Object.entries(asRecord(source.achievements)).forEach(([id, entry]) => {
    if (!ACHIEVEMENT_BY_ID[id]) return;
    achievements[id] = isPlainRecord(entry)
      ? { ...entry, unlockedAt: typeof entry.unlockedAt === 'string' ? entry.unlockedAt : '' }
      : { unlockedAt: '' };
  });
  const diagnosticSource = asRecord(source.diagnostic);
  const diagnosticResult = isPlainRecord(diagnosticSource.result) ? diagnosticSource.result : null;
  const diagnostic = source.diagnostic && isPlainRecord(source.diagnostic)
    ? {
        ...source.diagnostic,
        mode: diagnosticSource.mode === 'self' ? 'self' : 'test',
        ratings: Object.fromEntries(Object.entries(asRecord(diagnosticSource.ratings)).filter(([id]) => TOPIC_BY_ID[id])),
        result: diagnosticResult ? {
          ...diagnosticResult,
          total: Math.max(0, asFiniteNumber(diagnosticResult.total, 0)),
          correct: Math.max(0, asFiniteNumber(diagnosticResult.correct, 0)),
          percent: Math.max(0, asFiniteNumber(diagnosticResult.percent, 0)),
          bySubject: asRecord(diagnosticResult.bySubject),
          answers: asArray(diagnosticResult.answers).filter(answer => isPlainRecord(answer) && QUESTION_BY_ID[answer.qid])
        } : null,
        baseline: isPlainRecord(diagnosticSource.baseline) ? {
          ...diagnosticSource.baseline,
          score: asFiniteNumber(diagnosticSource.baseline.score, 0),
          low: asFiniteNumber(diagnosticSource.baseline.low, 0),
          high: asFiniteNumber(diagnosticSource.baseline.high, 0),
          avg: asFiniteNumber(diagnosticSource.baseline.avg, 0)
        } : null,
        summary: asRecord(diagnosticSource.summary)
      }
    : null;
  const dailyQuestionSource = asRecord(source.dailyQuestion);
  const dailyQuestion = QUESTION_BY_ID[dailyQuestionSource.questionId] && asISODate(dailyQuestionSource.date)
    ? dailyQuestionSource
    : null;
  const dailyQuestions = {};
  Object.entries(asRecord(source.dailyQuestions)).forEach(([date, entry]) => {
    if (asISODate(date) && isPlainRecord(entry)) dailyQuestions[date] = entry;
  });
  const rebalance = source.rebalance && isPlainRecord(source.rebalance)
    ? {
        ...source.rebalance,
        count: Math.max(0, asFiniteNumber(source.rebalance.count, 0)),
        pendingReason: Boolean(source.rebalance.pendingReason)
      }
    : null;
  const sessions = {};
  Object.entries(asRecord(source.sessions)).forEach(([id, entry]) => {
    if (!isPlainRecord(entry)) return;
    sessions[id] = { ...entry, doneAt: typeof entry.doneAt === 'string' ? entry.doneAt : '' };
  });
  const mistakes = {};
  Object.entries(asRecord(source.mistakes)).forEach(([id, entry]) => {
    if (!QUESTION_BY_ID[id] || !isPlainRecord(entry)) return;
    mistakes[id] = {
      ...entry,
      questionId: id,
      count: Math.max(1, asFiniteNumber(entry.count, 1)),
      lastWrong: Array.isArray(entry.lastWrong)
        ? [...new Set(entry.lastWrong.map(value => Math.max(0, asFiniteNumber(value, 0))))].slice(0, 12)
        : Math.max(0, asFiniteNumber(entry.lastWrong, 0)),
      lastAt: typeof entry.lastAt === 'string' ? entry.lastAt : ''
    };
  });
  const reflections = asArray(source.reflections).filter(entry => (
    isPlainRecord(entry) && asISODate(entry.date) && String(entry.text || '').trim()
  )).map((entry, index) => ({
    id: typeof entry.id === 'string' ? entry.id : 'reflection-' + entry.date + '-' + index,
    date: asISODate(entry.date),
    topicId: TOPIC_BY_ID[entry.topicId] ? entry.topicId : null,
    text: String(entry.text || '').trim().slice(0, 900),
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : entry.date + 'T12:00:00.000Z'
  })).slice(-400);
  const mood = asArray(source.mood).filter(entry => (
    isPlainRecord(entry) && asISODate(entry.date)
  )).map(entry => ({
    date: asISODate(entry.date),
    level: clamp(asFiniteNumber(entry.level, 3), 1, 5),
    hour: clamp(asFiniteNumber(entry.hour, 12), 0, 23),
    period: typeof entry.period === 'string' ? entry.period : '',
    note: String(entry.note || '').trim().slice(0, 300),
    at: typeof entry.at === 'string' ? entry.at : entry.date + 'T12:00:00.000Z'
  })).slice(-400);
  const anxietySource = asRecord(source.anxiety);
  const anxietyCompleted = {};
  Object.entries(asRecord(anxietySource.completed)).forEach(([id, date]) => {
    if (ANXIETY_EXERCISE_BY_ID[id] && typeof date === 'string' && date) anxietyCompleted[id] = date;
  });
  const anxiety = {
    completed: anxietyCompleted,
    lastAt: typeof anxietySource.lastAt === 'string' ? anxietySource.lastAt : '',
    sessions: Math.max(0, asFiniteNumber(anxietySource.sessions, 0))
  };
  const surpriseSource = asRecord(source.surprise);
  const surprise = {
    attempts: Math.max(0, asFiniteNumber(surpriseSource.attempts, 0)),
    best: clamp(asFiniteNumber(surpriseSource.best, 0), 0, 100),
    lastAt: typeof surpriseSource.lastAt === 'string' ? surpriseSource.lastAt : '',
    history: asArray(surpriseSource.history).filter(entry => isPlainRecord(entry)).map(entry => ({
      date: typeof entry.date === 'string' ? entry.date : '',
      correct: Math.max(0, asFiniteNumber(entry.correct, 0)),
      total: Math.max(0, asFiniteNumber(entry.total, 0))
    })).slice(-60)
  };
  const scheduleSource = asRecord(source.schedule);
  const schedule = {
    source: typeof scheduleSource.source === 'string' ? scheduleSource.source : '',
    importedAt: typeof scheduleSource.importedAt === 'string' ? scheduleSource.importedAt : '',
    lessons: asArray(scheduleSource.lessons).filter(lesson => (
      isPlainRecord(lesson) &&
      (asISODate(lesson.date) || (Number(lesson.weekday) >= 1 && Number(lesson.weekday) <= 7)) &&
      /^\d{2}:\d{2}$/.test(String(lesson.start)) &&
      /^\d{2}:\d{2}$/.test(String(lesson.end))
    )).map((lesson, index) => ({
      id: typeof lesson.id === 'string' ? lesson.id : 'lesson-' + index,
      date: asISODate(lesson.date),
      weekday: clamp(asFiniteNumber(lesson.weekday, 0), 0, 7),
      start: String(lesson.start),
      end: String(lesson.end),
      title: String(lesson.title || 'Урок').slice(0, 120),
      source: typeof lesson.source === 'string' ? lesson.source : 'manual'
    })).slice(-1000)
  };
  const fipiSessions = asArray(source.fipiSessions).filter(entry => (
    isPlainRecord(entry) && SUBJECTS[entry.subject] && asISODate(entry.date)
  )).map(entry => ({
    id: typeof entry.id === 'string' ? entry.id : 'fipi-' + entry.date + '-' + Math.random().toString(36).slice(2, 8),
    date: asISODate(entry.date),
    subject: entry.subject,
    topicId: TOPIC_BY_ID[entry.topicId] ? entry.topicId : null,
    solved: clamp(Math.floor(asFiniteNumber(entry.solved, 0)), 0, 20),
    correct: clamp(Math.floor(asFiniteNumber(entry.correct, 0)), 0, 20),
    minutes: clamp(Math.floor(asFiniteNumber(entry.minutes, 0)), 0, 240),
    at: typeof entry.at === 'string' ? entry.at : entry.date + 'T12:00:00.000Z'
  })).slice(-400);
  return {
    topics: normalizeTopicMap(source.topics),
    sessions,
    mistakes,
    activity,
    quizHistory: asArray(source.quizHistory).filter(item => (
      isPlainRecord(item) && SUBJECTS[item.subject]
    )).map(item => ({
      ...item,
      date: typeof item.date === 'string' ? item.date : '',
      subject: item.subject,
      mode: typeof item.mode === 'string' ? item.mode : 'practice',
      total: Math.max(0, asFiniteNumber(item.total, 0)),
      correct: Math.max(0, asFiniteNumber(item.correct, 0))
    })),
    remindersSent: asRecord(source.remindersSent),
    diagnostic,
    forecastHistory,
    achievements,
    dailyQuestion,
    dailyQuestions,
    rebalance,
    reflections,
    mood,
    anxiety,
    surprise,
    schedule,
    fipiSessions
  };
}

function normalizeGroup(group, profile) {
  if (!isPlainRecord(group)) return null;
  const members = asArray(group.members).filter(member => isPlainRecord(member) && typeof member.id === 'string').map(member => ({
    ...member,
    name: typeof member.name === 'string' ? member.name : 'Участник',
    isMe: Boolean(member.isMe),
    demo: Boolean(member.demo),
    sessions: Math.max(0, asFiniteNumber(member.sessions, 0))
  }));
  if (!members.some(member => member.isMe) && profile) {
    members.unshift({ id: 'me', name: profile.name || currentUser?.name || 'Вы', isMe: true, demo: false, sessions: 0 });
  }
  return {
    ...group,
    id: typeof group.id === 'string' ? group.id : 'group_local',
    name: typeof group.name === 'string' ? group.name : 'Наша команда',
    code: typeof group.code === 'string' ? group.code : '',
    demo: Boolean(group.demo),
    targetPerMember: Math.max(1, asFiniteNumber(group.targetPerMember, 3)),
    members
  };
}

function normalizeState(loaded) {
  const base = defaultState();
  if (!isPlainRecord(loaded)) return base;
  const profile = normalizeProfile(loaded.profile);
  return {
    ...base,
    ...loaded,
    version: 2,
    onboarded: Boolean(loaded.onboarded),
    profile,
    plan: normalizePlan(loaded.plan),
    progress: normalizeProgress(loaded.progress),
    group: normalizeGroup(loaded.group, profile),
    settings: {
      ...base.settings,
      ...asRecord(loaded.settings),
      notify: Boolean(loaded.settings?.notify),
      emailNotify: Boolean(loaded.settings?.emailNotify),
      sound: Boolean(loaded.settings?.sound),
      email: typeof loaded.settings?.email === 'string' ? loaded.settings.email : ''
    },
    meta: { ...base.meta, ...asRecord(loaded.meta) }
  };
}

function topicTaskNumbers(topic) {
  const text = String(topic?.examTasks || '')
    .replace(/\(часть\s*\d+\)/gi, '')
    .replace(/критерии/gi, '');
  const numbers = new Set();
  text.replace(/(\d+)(?:\s*[–—-]\s*(\d+))?/g, (match, first, second) => {
    const from = Number(first);
    const to = second ? Number(second) : from;
    if (!Number.isFinite(from) || !Number.isFinite(to)) return match;
    for (let value = from; value <= Math.min(to, from + 40); value += 1) numbers.add(value);
    return match;
  });
  return numbers;
}

function kimTaskTopicIds(subjectId, taskNumber) {
  const override = KIM_TASK_TOPIC_OVERRIDES[subjectId + ':' + taskNumber];
  if (override) return override.filter(id => TOPIC_BY_ID[id]);
  const topics = topicsForSubject(subjectId);
  const matching = topics.filter(topic => topicTaskNumbers(topic).has(taskNumber));
  if (matching.length) return matching.map(topic => topic.id);
  let nearest = null;
  let distance = Infinity;
  topics.forEach(topic => {
    topicTaskNumbers(topic).forEach(number => {
      const delta = Math.abs(number - taskNumber);
      if (delta < distance) {
        distance = delta;
        nearest = topic.id;
      }
    });
  });
  if (nearest && distance <= 3) return [nearest];
  const index = topics.length ? (taskNumber - 1) % topics.length : -1;
  return index >= 0 ? [topics[index].id] : [];
}

function kimTaskMeta(subjectId, taskNumber) {
  const topics = kimTaskTopicIds(subjectId, taskNumber).map(id => TOPIC_BY_ID[id]).filter(Boolean);
  const fallback = KIM_TASK_LABELS[subjectId]?.[taskNumber];
  const title = fallback || topics[0]?.title || 'Задание ' + taskNumber;
  const points = Number(KIM_POINTS[subjectId]?.[taskNumber - 1] || 1);
  return { subjectId, number: taskNumber, title, points, topics };
}

function topicPointValue(topic) {
  const topics = topicsForSubject(topic.subject);
  const total = topics.reduce((sum, item) => sum + Math.max(1, Number(item.weight) || 1), 0);
  return total ? 100 * Math.max(1, Number(topic.weight) || 1) / total : 0;
}

function formatPace(value) {
  const number = Math.max(0, Number(value) || 0);
  const rounded = number < 1 ? Math.round(number * 100) / 100 : Math.round(number * 10) / 10;
  return String(rounded).replace('.', ',');
}

const SUBJECT_DATIVE = {
  essay: 'сочинению',
  math: 'математике',
  physics: 'физике',
  russian: 'русскому',
  social: 'обществознанию',
  history: 'истории'
};

function subjectDative(subjectId) {
  return SUBJECT_DATIVE[subjectId] || (SUBJECTS[subjectId]?.short.toLowerCase() || 'предмету');
}

function targetScoreFor(subjectId, override) {
  if (override !== undefined) return clamp(Number(override) || 0, 0, 100);
  return clamp(Number(state.profile?.targets?.[subjectId] || (SUBJECTS[subjectId]?.isEssay ? 5 : 80)), 0, 100);
}

function remainingStudyDays(subjectId) {
  const profile = state.profile;
  const examDate = examDateFor(subjectId);
  if (!profile || !examDate) return 0;
  const end = parseISO(examDate);
  const today = startOfDay(new Date());
  if (end <= today) return 0;
  const days = (profile.studyDays || []).map(Number);
  let count = 0;
  for (let cursor = new Date(today); cursor < end; cursor = addDays(cursor, 1)) {
    if (days.includes(dayNumber(cursor)) && Number(profile.bufferDay) !== dayNumber(cursor)) count += 1;
  }
  return count;
}

function currentSubjectPace(subjectId) {
  const topics = topicsForSubject(subjectId);
  const done = topics.filter(topic => isTopicDone(topic.id)).length;
  const created = state.meta?.createdAt ? new Date(state.meta.createdAt) : new Date();
  const elapsedDays = Math.max(7, daysBetween(new Date(), created));
  return done / elapsedDays * 7;
}

function targetAnalysis(subjectId, overrideTarget) {
  const subject = SUBJECTS[subjectId];
  if (!subject) return null;
  const topics = topicsForSubject(subjectId);
  const doneTopics = topics.filter(topic => isTopicDone(topic.id));
  const target = targetScoreFor(subjectId, overrideTarget);
  const examDate = examDateFor(subjectId);
  const daysLeft = examDate ? Math.max(0, daysBetween(parseISO(examDate), new Date())) : 0;
  if (subject.isEssay) {
    const done = doneTopics.length;
    const ready = done >= Math.max(4, Math.ceil(topics.length * 0.7));
    return {
      subjectId, subject, target, score: null, low: null, high: null, gap: 0,
      isEssay: true, ready, doneTopics: done, totalTopics: topics.length,
      neededTopics: [], remainingTopics: topics.filter(topic => !isTopicDone(topic.id)),
      daysLeft, requiredPerDay: 0, requiredPerWeek: 0, currentPerWeek: 0, deltaPerDay: 0, deltaPerWeek: 0,
      deadline: examDate ? toISO(addDays(parseISO(examDate), -14)) : '',
      criticalTasks: ['Критерий 1–2', 'Один сильный аргумент', 'Проверка работы'],
      sentence: ready
        ? 'Допуск уже в прогнозе: ключевые этапы закрыты. Осталось закрепить аргументы и проверку.'
        : 'До сочинения ' + daysLeft + ' ' + pluralize(daysLeft, ['день', 'дня', 'дней']) + '. Для допуска нужно закрыть ещё ' + (Math.max(4, Math.ceil(topics.length * 0.7)) - done) + ' этапов.'
    };
  }
  const forecast = forecastForSubject(subjectId) || { score: 0, low: 0, high: 0, mastery: 0, coverage: 0, accuracy: null, answers: 0 };
  const gap = Math.max(0, target - forecast.score);
  const sorted = topics.filter(topic => !isTopicDone(topic.id))
    .map(topic => ({ topic, points: topicPointValue(topic) }))
    .sort((a, b) => b.points - a.points || a.topic.difficulty - b.topic.difficulty);
  const needed = [];
  let covered = 0;
  for (const item of sorted) {
    if (covered >= gap) break;
    needed.push(item.topic);
    covered += item.points;
  }
  const studyDays = remainingStudyDays(subjectId);
  const requiredPerDay = studyDays ? needed.length / studyDays : 0;
  const activeDays = Math.max(1, (state.profile?.studyDays || []).filter(day => Number(day) !== Number(state.profile?.bufferDay)).length);
  const weeksLeft = Math.max(0.3, daysLeft / 7);
  const requiredPerWeek = needed.length / weeksLeft;
  const currentPerWeek = currentSubjectPace(subjectId);
  const deltaPerWeek = Math.max(0, requiredPerWeek - currentPerWeek);
  const deltaPerDay = deltaPerWeek / activeDays;
  const criticalTasks = [];
  needed.slice(0, 3).forEach(topic => {
    if (!criticalTasks.includes(topic.examTasks)) criticalTasks.push(topic.examTasks);
  });
  if (!criticalTasks.length && gap > 0) {
    const meta = kimTaskMeta(subjectId, KIM_TASK_COUNTS[subjectId] || 1);
    criticalTasks.push(meta.title);
  }
  let sentence = '';
  if (gap <= 0) {
    sentence = 'При текущем темпе — ' + forecast.score + '. Цель ' + target + ' уже в прогнозе: запас ' + Math.max(0, forecast.score - target) + ' б. Можно снизить темп и заняться точностью.';
  } else {
    const topicCount = needed.length + ' ' + pluralize(needed.length, ['тему', 'темы', 'тем']);
    if (deltaPerDay > 0.02) {
      sentence = 'При текущем темпе — ' + forecast.score + '. Для ' + target + ' нужно +' + formatPace(deltaPerDay) + ' темы в день и закрыть ещё ' + topicCount + '.';
    } else if (studyDays > 0) {
      sentence = 'При текущем темпе — ' + forecast.score + '. Для ' + target + ' нужно закрыть ещё ' + topicCount + ' — это ≈' + formatPace(requiredPerDay) + ' темы за учебный день. Текущего ритма достаточно, если не пропускать занятия.';
    } else {
      sentence = 'При текущем темпе — ' + forecast.score + '. Для ' + target + ' нужно закрыть ещё ' + topicCount + ', но до экзамена не осталось учебных дней. Выберите самые важные темы.';
    }
  }
  return {
    subjectId, subject, target, score: forecast.score, low: forecast.low, high: forecast.high,
    gap, isEssay: false, ready: gap <= 0, doneTopics: doneTopics.length, totalTopics: topics.length,
    neededTopics: needed, remainingTopics: sorted.map(item => item.topic),
    daysLeft, studyDays, requiredPerDay,
    requiredPerWeek, currentPerWeek, deltaPerDay, deltaPerWeek,
    deadline: examDate ? toISO(addDays(parseISO(examDate), -14)) : '',
    criticalTasks, sentence
  };
}

function targetOverview() {
  const analyses = profileSubjects().filter(id => !SUBJECTS[id].isEssay).map(id => targetAnalysis(id)).filter(Boolean);
  const essay = profileSubjects().filter(id => SUBJECTS[id].isEssay).map(id => targetAnalysis(id))[0] || null;
  const targetTotal = analyses.reduce((sum, item) => sum + item.target, 0);
  const scoreTotal = analyses.reduce((sum, item) => sum + (item.score || 0), 0);
  const gap = Math.max(0, targetTotal - scoreTotal);
  const sorted = analyses.slice().sort((a, b) => b.gap - a.gap);
  return {
    analyses,
    essay,
    targetTotal,
    scoreTotal,
    gap,
    averageTarget: analyses.length ? Math.round(targetTotal / analyses.length) : 0,
    averageScore: analyses.length ? Math.round(scoreTotal / analyses.length) : 0,
    priority: sorted[0] || null,
    closest: analyses.slice().sort((a, b) => a.gap - b.gap)[0] || null
  };
}

function strategicMinimum(subjectId, overrideTarget) {
  const subject = SUBJECTS[subjectId];
  const topics = topicsForSubject(subjectId);
  const target = targetScoreFor(subjectId, overrideTarget);
  const totalWeight = topics.reduce((sum, topic) => sum + Math.max(1, Number(topic.weight) || 1), 0);
  const sorted = topics.slice().sort((a, b) => (
    (Number(b.weight) || 1) - (Number(a.weight) || 1) ||
    (Number(a.difficulty) || 3) - (Number(b.difficulty) || 3) ||
    a.order - b.order
  ));
  const threshold = subject?.isEssay ? Math.min(5, target) * 0.8 : target * 0.8;
  const bonusLimit = subject?.isEssay ? target + 0.6 : target * 1.02;
  const mandatory = [];
  const bonus = [];
  const skipped = [];
  let mandatoryPoints = 0;
  let bonusPoints = 0;
  sorted.forEach(topic => {
    const points = subject?.isEssay ? (target / topics.length) : topicPointValue(topic);
    if (mandatoryPoints < threshold) {
      mandatory.push({ topic, points });
      mandatoryPoints += points;
    } else if (mandatoryPoints + bonusPoints < bonusLimit) {
      bonus.push({ topic, points });
      bonusPoints += points;
    } else {
      skipped.push({ topic, points });
    }
  });
  if (!mandatory.length && sorted.length) mandatory.push({ topic: sorted[0], points: topicPointValue(sorted[0]) });
  const mandatoryIds = new Set(mandatory.map(item => item.topic.id));
  const mandatoryDone = mandatory.filter(item => isTopicDone(item.topic.id)).length;
  const completion = mandatory.length ? mandatoryDone / mandatory.length : 0;
  let skipNote = '';
  if (target <= 70) {
    skipNote = subjectId === 'math'
      ? 'Для 70 баллов не нужны № 18 (параметр) и сложные пункты стереометрии. Это стратегия, а не пробел.'
      : subjectId === 'russian'
        ? 'Для 70 не нужно выжимать максимум из сочинения: уверенные 17–19 баллов за № 27 уже достаточны.'
        : subjectId === 'social'
          ? 'Для 70 можно не писать эссе № 25 на максимум: сначала часть 1 и план № 24.'
          : subjectId === 'physics'
            ? 'Для 70 можно не решать № 25–26 развёрнутой части. Сначала гарантируйте часть 1.'
            : 'Для допуска важнее критерии 1–2 и один сильный аргумент, а не идеальная композиция.';
  } else {
    skipNote = 'Цель выше 70 — стратегического минимума уже недостаточно. Бонусные темы дают запас и снижают риск на экзамене.';
  }
  return {
    subjectId, target, mandatory, bonus, skipped,
    mandatoryPoints, bonusPoints, completion, mandatoryDone,
    skipNote
  };
}

function backwardMilestones(subjectId) {
  const subject = SUBJECTS[subjectId];
  const examDate = examDateFor(subjectId);
  if (!subject || !examDate) return [];
  const exam = parseISO(examDate);
  const today = startOfDay(new Date());
  const minimum = strategicMinimum(subjectId);
  const mandatory = minimum.mandatory.map(item => item.topic);
  const completion = minimum.completion;
  const definitions = [
    { key: 'base', days: 60, title: 'Закрыть базу и диагностику', note: 'Разобрать фундамент и убрать главные пробелы.', ratio: 0.35, topics: mandatory.slice(0, Math.max(1, Math.ceil(mandatory.length * 0.35))) },
    { key: 'minimum', days: 30, title: 'Стратегический минимум', note: 'Темы, которые дают ~80% целевых баллов.', ratio: 0.8, topics: mandatory },
    { key: 'two-weeks', days: 14, title: 'За 2 недели: практика', note: 'Пробники, разбор ошибок и закрепление бонусных тем.', ratio: 1, topics: minimum.bonus.map(item => item.topic) },
    { key: 'week', days: 7, title: 'Последняя неделя', note: 'Только повторение, шпаргалки и сон. Новых тем нет.', ratio: 1, topics: mandatory.slice(0, 8), review: true },
    { key: 'day', days: 1, title: 'День перед экзаменом', note: 'Документы, маршрут, отдых. Никакой зубрёжки.', ratio: 1, topics: [], review: true }
  ];
  return definitions.map(definition => {
    const date = addDays(exam, -definition.days);
    const dateISO = toISO(date);
    const topicProgress = definition.topics.length
      ? definition.topics.filter(topic => isTopicDone(topic.id)).length / definition.topics.length
      : completion;
    const progress = definition.key === 'week' || definition.key === 'day' ? completion : topicProgress;
    let status = 'upcoming';
    if (definition.review) {
      if (date <= today && today <= exam) status = 'review';
      else if (date < today) status = 'done';
    } else if (progress >= definition.ratio) status = 'done';
    else if (date < today) status = 'overdue';
    else if (daysBetween(date, today) <= 7) status = 'soon';
    return {
      ...definition,
      date: dateISO,
      status,
      progress: Math.min(100, Math.round(progress * 100)),
      dateLabel: formatDateFull(date)
    };
  });
}

function topicClosure(topicId, seen) {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return [];
  const visited = seen || new Set();
  if (visited.has(topicId)) return [];
  visited.add(topicId);
  const chain = [];
  (topic.prereqs || []).forEach(prereqId => {
    chain.push(...topicClosure(prereqId, visited));
  });
  chain.push(topic);
  return chain;
}

function dependencyInfoForTopic(topicId) {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return null;
  const chain = topicClosure(topicId);
  const lowMastery = chain.filter(item => topicMasteryValue(item) < 0.65);
  const weak = lowMastery.length ? lowMastery : chain.filter(item => !isTopicDone(item.id));
  const root = weak[0] || chain.find(item => topicMasteryValue(item) < 0.8) || null;
  return { topic, chain, weak, root };
}

function weakestTopicForSubject(subjectId) {
  const topics = topicsForSubject(subjectId);
  return topics.slice().sort((a, b) => {
    const doneA = isTopicDone(a.id) ? 1 : 0;
    const doneB = isTopicDone(b.id) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    const masteryA = topicMasteryValue(a);
    const masteryB = topicMasteryValue(b);
    if (masteryA !== masteryB) return masteryA - masteryB;
    const prereqA = dependencyInfoForTopic(a.id)?.weak.length || 0;
    const prereqB = dependencyInfoForTopic(b.id)?.weak.length || 0;
    if (prereqA !== prereqB) return prereqB - prereqA;
    return (Number(b.weight) || 1) - (Number(a.weight) || 1);
  })[0] || null;
}

function dependencyDepth(topic, seen) {
  const visited = seen || new Set();
  if (!topic || visited.has(topic.id)) return 0;
  visited.add(topic.id);
  const prereqs = (topic.prereqs || []).map(id => TOPIC_BY_ID[id]).filter(Boolean);
  if (!prereqs.length) return 0;
  return 1 + Math.max(...prereqs.map(item => dependencyDepth(item, new Set(visited))));
}

function dependencyMapForSubject(subjectId) {
  return topicsForSubject(subjectId)
    .map(topic => ({ topic, depth: dependencyDepth(topic) }))
    .sort((a, b) => a.depth - b.depth || a.topic.order - b.topic.order);
}

function pseForSubject(subjectId) {
  const count = KIM_TASK_COUNTS[subjectId] || 0;
  const tasks = [];
  for (let number = 1; number <= count; number += 1) {
    const meta = kimTaskMeta(subjectId, number);
    const related = meta.topics.length ? meta.topics : topicsForSubject(subjectId).slice(0, 1);
    const weighted = related.reduce((sum, topic) => sum + topicMasteryValue(topic) * Math.max(1, topic.weight), 0);
    const weightSum = related.reduce((sum, topic) => sum + Math.max(1, topic.weight), 0);
    const probability = Math.round(clamp(weightSum ? weighted / weightSum * 100 : 0, 0, 100));
    const tone = probability >= 68 ? 'green' : probability >= 42 ? 'yellow' : 'red';
    tasks.push({
      ...meta,
      probability,
      tone,
      status: tone === 'green' ? 'уверенно' : tone === 'yellow' ? 'нужно закрепить' : 'слабый участок'
    });
  }
  const points = tasks.reduce((sum, task) => sum + task.points, 0);
  const expected = tasks.reduce((sum, task) => sum + task.points * task.probability / 100, 0);
  return {
    subjectId,
    tasks,
    green: tasks.filter(task => task.tone === 'green').length,
    yellow: tasks.filter(task => task.tone === 'yellow').length,
    red: tasks.filter(task => task.tone === 'red').length,
    expected: Math.round(expected),
    points
  };
}

function pseTaskDetail(subjectId, taskNumber) {
  const summary = pseForSubject(subjectId);
  const task = summary.tasks.find(item => item.number === taskNumber);
  if (!task) return null;
  const related = task.topics.map(topic => {
    const progress = state.progress.topics[topic.id] || {};
    return {
      topic,
      mastery: Math.round(topicMasteryValue(topic) * 100),
      done: isTopicDone(topic.id),
      best: Number(progress.best || 0),
      attempts: Number(progress.attempts || 0)
    };
  }).sort((a, b) => a.mastery - b.mastery);
  const weak = related[0]?.topic || task.topics[0];
  return {
    ...task,
    related,
    weakTopic: weak,
    dependency: weak ? dependencyInfoForTopic(weak.id) : null,
    mistakes: weak ? (TOPIC_MISTAKES[weak.id] || []) : [],
    advice: task.probability >= 68
      ? 'Поддерживайте форму: одно короткое задание раз в 2–3 дня.'
      : task.probability >= 42
        ? 'Закрепите алгоритм на 2–3 заданиях и разберите ошибки.'
        : 'Сначала вернитесь к базовой теме, затем решите 3 простых задания.'
  };
}

function moodPeriodForHour(hour) {
  const value = Number(hour);
  if (value >= 5 && value <= 11) return MOOD_PERIODS[0];
  if (value >= 12 && value <= 16) return MOOD_PERIODS[1];
  return MOOD_PERIODS[2];
}

function moodEntryForDate(dateISO) {
  return (state.progress.mood || []).find(entry => entry.date === dateISO) || null;
}

function moodRecent(days) {
  const from = toISO(addDays(new Date(), -(days || 28)));
  return (state.progress.mood || []).filter(entry => entry.date >= from).sort((a, b) => a.date.localeCompare(b.date));
}

function moodStats() {
  const entries = moodRecent(28);
  const byPeriod = {};
  const byWeekday = {};
  MOOD_PERIODS.forEach(period => { byPeriod[period.id] = []; });
  for (let day = 1; day <= 7; day += 1) byWeekday[day] = [];
  entries.forEach(entry => {
    const period = entry.period || moodPeriodForHour(entry.hour).id;
    if (byPeriod[period]) byPeriod[period].push(entry.level);
    const weekday = dayNumber(parseISO(entry.date));
    byWeekday[weekday].push(entry.level);
  });
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  return {
    count: entries.length,
    byPeriod: Object.fromEntries(Object.entries(byPeriod).map(([id, values]) => [id, average(values)])),
    byWeekday: Object.fromEntries(Object.entries(byWeekday).map(([day, values]) => [day, average(values)])),
    overall: average(entries.map(entry => entry.level))
  };
}

function moodInsight() {
  const stats = moodStats();
  if (stats.count < 4) {
    return 'Пока мало записей. Отметьте настроение 4–5 дней — тогда появится связь с днями недели и временем занятий.';
  }
  const periodEntries = MOOD_PERIODS.map(period => ({ ...period, value: stats.byPeriod[period.id] })).filter(item => item.value !== null);
  const weekdayEntries = Object.entries(stats.byWeekday).filter(([, value]) => value !== null).map(([day, value]) => ({ day: Number(day), value }));
  const best = periodEntries.slice().sort((a, b) => b.value - a.value)[0];
  const worst = periodEntries.slice().sort((a, b) => a.value - b.value)[0];
  const bestDay = weekdayEntries.slice().sort((a, b) => b.value - a.value)[0];
  const worstDay = weekdayEntries.slice().sort((a, b) => a.value - b.value)[0];
  let text = '';
  if (best) {
    const bestWord = { morning: 'утром', day: 'днём', evening: 'вечером' }[best.id] || 'в это время';
    text += 'Лучше всего вы себя чувствуете ' + bestWord + ' (' + best.value.toFixed(1) + '/5) — ставьте туда новую теорию. ';
  }
  if (worst && worst.value <= 2.8) {
    const worstWord = { morning: 'Утром', day: 'Днём', evening: 'Вечером' }[worst.id] || 'В это время';
    text += worstWord + ' настроение ниже (' + worst.value.toFixed(1) + '/5): оставьте лёгкое повторение или отдых. ';
  }
  if (bestDay) text += 'Самый ресурсный день — ' + WEEKDAYS_FULL[bestDay.day % 7] + '. ';
  if (worstDay && worstDay.value <= 2.5) text += 'По ' + WEEKDAYS_DATIVE_PLURAL[worstDay.day % 7] + ' лучше не ставить сложное: попробуйте буфер или короткую сессию.';
  if (!text) text = 'Связь пока слабая. Продолжайте отмечать настроение — рекомендации станут точнее.';
  return text;
}

function moodHeatmapValue(weekday, periodId) {
  const from = toISO(addDays(new Date(), -27));
  const values = (state.progress.mood || []).filter(entry => (
    entry.date >= from && dayNumber(parseISO(entry.date)) === weekday && (entry.period || moodPeriodForHour(entry.hour).id) === periodId
  )).map(entry => entry.level);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function todayReflection() {
  const today = toISO(new Date());
  return (state.progress.reflections || []).find(entry => entry.date === today) || null;
}

function latestReflection() {
  return (state.progress.reflections || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function pastSelfCallback() {
  const cutoff = toISO(addDays(new Date(), -28));
  const old = (state.progress.reflections || [])
    .filter(entry => entry.date <= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!old) return null;
  const topic = old.topicId ? TOPIC_BY_ID[old.topicId] : null;
  const progress = topic ? state.progress.topics[topic.id] || {} : {};
  const mastery = topic ? Math.round(topicMasteryValue(topic) * 100) : null;
  const now = topic
    ? isTopicDone(topic.id)
      ? 'Сейчас тема «' + topic.title + '» закрыта: есть теория и практика.'
      : 'Сейчас в теме «' + topic.title + '» уже ' + (mastery || 0) + '% уверенности.'
    : 'Сейчас вы продвинулись дальше: в плане уже ' + totalTopicsDone() + ' закрытых тем.';
  return {
    date: old.date,
    text: old.text,
    topic,
    now,
    daysAgo: Math.max(28, daysBetween(new Date(), parseISO(old.date)))
  };
}

function parseScheduleText(text, source) {
  const weekdayAliases = [
    ['понедельник', 1], ['понед', 1], ['пн', 1],
    ['вторник', 2], ['втор', 2], ['вт', 2],
    ['среда', 3], ['сред', 3], ['ср', 3],
    ['четверг', 4], ['четв', 4], ['чт', 4],
    ['пятница', 5], ['пятн', 5], ['пт', 5],
    ['суббота', 6], ['субб', 6], ['сб', 6],
    ['воскресенье', 7], ['воскр', 7], ['вс', 7]
  ];
  const lessons = [];
  String(text || '').split(/\r?\n/).forEach((line, index) => {
    const raw = line.trim();
    if (!raw) return;
    const timeMatch = raw.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/);
    if (!timeMatch) return;
    const start = pad(Number(timeMatch[1])) + ':' + timeMatch[2];
    const end = pad(Number(timeMatch[3])) + ':' + timeMatch[4];
    if (timeToMinutes(end) <= timeToMinutes(start)) return;
    const dateMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    let date = dateMatch ? dateMatch[1] + '-' + dateMatch[2] + '-' + dateMatch[3] : '';
    let weekday = 0;
    if (date) {
      const parsed = parseISO(date);
      if (!Number.isFinite(parsed.getTime())) date = '';
      else weekday = dayNumber(parsed);
    }
    if (!date) {
      const lower = raw.toLowerCase();
      const found = weekdayAliases.find(([alias]) => new RegExp('(^|[^а-яё])' + alias + '([^а-яё]|$)').test(lower));
      if (found) weekday = found[1];
    }
    if (!date && !weekday) return;
    const title = raw
      .replace(timeMatch[0], ' ')
      .replace(/(\d{4})-(\d{2})-(\d{2})/g, ' ')
      .replace(/^[\s\d.)-]+/, '')
      .replace(/(^|[^а-яё])(понедельник|понед|пн|вторник|втор|вт|среда|сред|ср|четверг|четв|чт|пятница|пятн|пт|суббота|субб|сб|воскресенье|воскр|вс)(?=[^а-яё]|$)/gi, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();
    lessons.push({
      id: 'lesson-' + Date.now().toString(36) + '-' + index,
      date,
      weekday,
      start,
      end,
      title: title.slice(0, 120) || 'Урок',
      source: source || 'manual'
    });
  });
  return lessons.slice(0, 400);
}

function scheduleConflicts(date, start, end) {
  const lessons = state.progress.schedule?.lessons || [];
  if (!lessons.length) return false;
  const iso = toISO(date);
  const weekday = dayNumber(date);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return lessons.some(lesson => {
    if (lesson.date !== iso && Number(lesson.weekday) !== weekday) return false;
    return startMinutes < timeToMinutes(lesson.end) && endMinutes > timeToMinutes(lesson.start);
  });
}

function lastWeekSubjects(profile) {
  const source = profile || state.profile;
  if (!source) return [];
  const today = startOfDay(new Date());
  return (source.subjects || []).filter(subjectId => {
    const examDate = source.examDates?.[subjectId];
    if (!examDate) return false;
    const days = daysBetween(parseISO(examDate), today);
    return days > 0 && days <= 7;
  });
}

function lastWeekExamInfo(profile) {
  const subjects = lastWeekSubjects(profile);
  if (!subjects.length) return null;
  const sorted = subjects.slice().sort((a, b) => daysToExam(a) - daysToExam(b));
  return { subjects: sorted, nearest: sorted[0], days: daysToExam(sorted[0]) };
}

function isLastWeekForSubject(subjectId, date, profile) {
  const source = profile || state.profile;
  const examDate = source?.examDates?.[subjectId];
  if (!examDate) return false;
  const days = daysBetween(parseISO(examDate), date);
  return days > 0 && days <= 7;
}

function subjectCadence(subjectId, date, profile) {
  const examDate = profile?.examDates?.[subjectId];
  if (!examDate) return 7;
  const days = Math.max(1, daysBetween(parseISO(examDate), date));
  let cadence = days <= 21 ? 1.5 : days <= 45 ? 2 : days <= 90 ? 3 : days <= 180 ? 5 : 7;
  if (SUBJECTS[subjectId]?.isEssay) cadence = Math.min(cadence, 3);
  return cadence;
}

function planReviewCadence(subjectId, date, profile) {
  const examDate = profile?.examDates?.[subjectId];
  const days = examDate ? Math.max(1, daysBetween(parseISO(examDate), date)) : 90;
  const base = days <= 14 ? 2 : days <= 30 ? 4 : days <= 90 ? 7 : 14;
  return profile?.spacedReview ? Math.max(1, Math.round(base * 0.75)) : base;
}

function accountStateKey(userId) {
  return STORAGE_KEY + ':user:' + userId;
}

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.users)) return { version: 1, users: [] };
    return { version: 1, users: parsed.users.filter(user => user && user.id && user.email) };
  } catch (error) {
    return { version: 1, users: [] };
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ version: 1, users: accounts.users }));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function findAccountByEmail(email) {
  const normalized = normalizeEmail(email);
  return readAccounts().users.find(user => user.email === normalized) || null;
}

function findAccountById(id) {
  return readAccounts().users.find(user => user.id === id) || null;
}

function readSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.userId ? findAccountById(session.userId) : null;
  } catch (error) {
    return null;
  }
}

function saveSession(userId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, createdAt: new Date().toISOString() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function hasMeaningfulState(loaded) {
  if (!loaded || typeof loaded !== 'object') return false;
  const progress = loaded.progress || {};
  return Boolean(
    loaded.onboarded ||
    loaded.profile ||
    loaded.plan ||
    Object.keys(progress.topics || {}).length ||
    Object.keys(progress.sessions || {}).length ||
    Object.keys(progress.mistakes || {}).length ||
    (progress.quizHistory || []).length
  );
}

function readLegacyState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const loaded = normalizeState(JSON.parse(raw));
    return hasMeaningfulState(loaded) ? loaded : null;
  } catch (error) {
    return null;
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value) {
  const text = String(value || '');
  const bytes = new Uint8Array(Math.floor(text.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(text.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function randomHex(length) {
  const bytes = new Uint8Array(length || 16);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return bytesToHex(bytes);
}

function fallbackPasswordHash(password, salt, iterations) {
  const source = String(salt) + ':' + String(password) + ':fokus-ege';
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  let c = 0x85ebca6b;
  let d = 0xc2b2ae35;
  for (let round = 0; round < iterations; round += 1) {
    for (let index = 0; index < source.length; index += 1) {
      const code = source.charCodeAt(index) + round;
      a = Math.imul(a ^ code, 0x01000193) >>> 0;
      b = Math.imul(b ^ (a >>> 13), 0x85ebca6b) >>> 0;
      c = Math.imul(c ^ (b >>> 11), 0xc2b2ae35) >>> 0;
      d = Math.imul(d ^ (c >>> 7), 0x27d4eb2f) >>> 0;
    }
  }
  return [a, b, c, d, a ^ b ^ c ^ d, Math.imul(a, b) >>> 0, Math.imul(c, d) >>> 0, (a + b + c + d) >>> 0]
    .map(value => value.toString(16).padStart(8, '0')).join('');
}

async function derivePasswordHash(password, salt, iterations, algo) {
  if (algo === 'pbkdf2-sha256') {
    if (!window.crypto?.subtle) throw new Error('В этом браузере недоступен безопасный вход. Откройте файл в современном Chrome.');
    const material = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexToBytes(salt), iterations, hash: 'SHA-256' },
      material,
      256
    );
    return bytesToHex(new Uint8Array(bits));
  }
  return fallbackPasswordHash(password, salt, iterations);
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function createAccount(name, email, password) {
  const accounts = readAccounts();
  const normalizedEmail = normalizeEmail(email);
  if (accounts.users.some(user => user.email === normalizedEmail)) {
    throw new Error('Аккаунт с таким email уже существует.');
  }
  const algo = window.crypto?.subtle ? 'pbkdf2-sha256' : 'fnv-mix';
  const iterations = algo === 'pbkdf2-sha256' ? PASSWORD_ITERATIONS : 30000;
  const salt = randomHex(16);
  const hash = await derivePasswordHash(password, salt, iterations, algo);
  const user = {
    id: 'u_' + Date.now().toString(36) + '_' + randomHex(4),
    name: String(name || '').trim(),
    email: normalizedEmail,
    salt,
    hash,
    algo,
    iterations,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  accounts.users.push(user);
  writeAccounts(accounts);
  return user;
}

async function verifyAccountPassword(user, password) {
  const hash = await derivePasswordHash(password, user.salt, Number(user.iterations) || 1, user.algo);
  return safeEqual(hash, user.hash);
}

function touchAccount(userId) {
  const accounts = readAccounts();
  const user = accounts.users.find(item => item.id === userId);
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  writeAccounts(accounts);
}

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/* Пресеты оформления: classic (текущая тема), paper и nocturne из концептов. */
function currentStyle() {
  try {
    const stored = localStorage.getItem(STYLE_KEY);
    return stored === 'paper' || stored === 'nocturne' ? stored : 'classic';
  } catch (error) {
    return 'classic';
  }
}

function applyStyle(style, persist) {
  const next = style === 'paper' || style === 'nocturne' ? style : 'classic';
  document.documentElement.dataset.style = next;
  if (persist) {
    try {
      localStorage.setItem(STYLE_KEY, next);
    } catch (error) {}
  }
  if (next !== 'classic') applyTheme(next === 'paper' ? 'light' : 'dark', persist);
  return next;
}

function applyTheme(theme, persist) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#090c15' : '#5146e5');
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {}
    document.documentElement.classList.add('theme-fade');
    clearTimeout(applyTheme.fadeTimer);
    applyTheme.fadeTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-fade');
    }, 340);
  }
}

function setTheme(theme) {
  if (currentStyle() !== 'classic') {
    applyStyle('classic', true);
    if (typeof state === 'object' && state?.settings) state.settings.style = 'classic';
  }
  applyTheme(theme, true);
  render();
}

function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}


function loadState(key) {
  try {
    const raw = localStorage.getItem(key || activeStorageKey);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

function saveState() {
  if (!currentUser) return;
  try {
    state.meta.lastOpen = new Date().toISOString();
    localStorage.setItem(activeStorageKey, JSON.stringify(state));
  } catch (error) {
    showToast('Не удалось сохранить', 'Проверьте свободное место в браузере.', 'error');
  }
}
