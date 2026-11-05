/* Проверка по отдельному произведению: вопросы собираются из выверенных карточек
   ESSAY_WORKS (автор, жанр, герои, эпизоды, цитата). Новые факты не выдумываются:
   любой вопрос — это перестановка уже проверенных полей карточки.
   Задания авторские, не ФИПИ. */
'use strict';

const ESSAY_WORK_QUESTION_TYPES = ['author', 'hero', 'genre', 'episode', 'proves', 'quote'];
const ESSAY_WORK_QUESTIONS = [];
const ESSAY_WORK_QUESTION_INDEX = {};

function essayWorkSeed(text) {
  let hash = 2166136261;
  const source = String(text || '');
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function essayWorkRandom(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function essayWorkShuffle(items, seed) {
  const copy = [...items];
  const random = essayWorkRandom(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function essayWorkUnique(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function essayWorkDistractors(pool, correct, count, seed) {
  const options = essayWorkUnique(pool).filter(value => value !== correct);
  return essayWorkShuffle(options, seed).slice(0, Math.max(0, count));
}

function essayWorkAuthorLabel(work) {
  return (work.initials ? work.initials + ' ' : '') + work.author;
}

function essayWorkFirstCharacter(work) {
  const character = (work.characters || [])[0];
  if (!character) return '';
  return String(character.name || '').split(' и ')[0].trim();
}

function essayWorkGenrePool() {
  const fallback = ['роман', 'повесть', 'рассказ', 'пьеса', 'поэма'];
  return essayWorkUnique([...(typeof ESSAY_WORKS !== 'undefined' ? ESSAY_WORKS.map(work => work.genre) : []), ...fallback]);
}

function essayWorkBuildQuestions(work, works, index) {
  const questions = [];
  const others = works.filter(item => item.id !== work.id);
  const episodes = (work.episodes || []).slice(0, 2);
  const otherEpisodes = works
    .filter(item => item.id !== work.id)
    .flatMap(item => (item.episodes || []).map(episode => episode.title));
  const allProves = works.flatMap(item => (item.episodes || []).map(episode => episode.proves));
  const allQuotes = works.filter(item => item.quote?.text).map(item => item.quote.text);

  const push = (type, suffix, text, correct, distractors, explanation) => {
    const seed = essayWorkSeed(work.id + ':' + suffix + ':' + text);
    const options = essayWorkShuffle([correct, ...distractors], seed);
    const correctIndex = options.indexOf(correct);
    if (options.length < 4 || correctIndex < 0) return;
    const question = {
      id: 'essay-work-' + work.id + '-' + suffix,
      text: text,
      options: options,
      correct: correctIndex,
      explanation: explanation,
      workId: work.id,
      topicId: 'e-works',
      subject: 'essay',
      part: 1,
      source: 'authored',
      answerKind: 'single',
      stage: 'проверка по произведению'
    };
    questions.push(question);
    return question;
  };

  /* 1. Автор */
  const authorLabel = essayWorkAuthorLabel(work);
  const authorPool = others.map(essayWorkAuthorLabel);
  push(
    'author', 'author',
    'Кто автор произведения «' + work.title + '»?',
    authorLabel,
    essayWorkDistractors(authorPool, authorLabel, 3, essayWorkSeed(work.id + ':author')),
    '«' + work.title + '» написал ' + work.authorFull + ' (' + authorLabel + '), ' + work.year + ' год. Жанр — ' + work.genre + '.'
  );

  /* 2. Герой */
  const hero = essayWorkFirstCharacter(work);
  if (hero) {
    const heroPool = others.map(essayWorkFirstCharacter);
    push(
      'hero', 'hero',
      'Кто из перечисленных — герой произведения «' + work.title + '»?',
      hero,
      essayWorkDistractors(heroPool, hero, 3, essayWorkSeed(work.id + ':hero')),
      hero + ' — ' + ((work.characters || [])[0]?.role || 'один из героев произведения') + '. Остальные имена — из других книг подборки.'
    );
  }

  /* 3. Жанр */
  push(
    'genre', 'genre',
    'Определите жанр произведения «' + work.title + '».',
    work.genre,
    essayWorkDistractors(essayWorkGenrePool(), work.genre, 3, essayWorkSeed(work.id + ':genre')),
    '«' + work.title + '» — это ' + work.genre + '. Жанр важно называть точно: он подсказывает, как строить аргумент.'
  );

  /* 5. Эпизод → произведение. Спрашиваем не «из какой книги эпизод» (при проверке
     одной книги ответ очевиден), а «какой эпизод относится к книге»: варианты —
     эпизоды разных произведений, верный только один. Один такой вопрос на книгу,
     чтобы тексты не повторялись. */
  if (episodes[0]) {
    push(
      'episode', 'episode-0',
      'Какой эпизод относится к «' + work.title + '»?',
      episodes[0].title,
      essayWorkDistractors(otherEpisodes, episodes[0].title, 3, essayWorkSeed(work.id + ':episode')),
      '«' + episodes[0].title + '» — эпизод из «' + work.title + '» (' + authorLabel + '). Он доказывает: ' + episodes[0].proves
    );
  }

  episodes.forEach((episode, episodeIndex) => {
    push(
      'proves', 'proves-' + episodeIndex,
      'Что доказывает эпизод «' + episode.title + '» в «' + work.title + '»?',
      episode.proves,
      essayWorkDistractors(allProves, episode.proves, 3, essayWorkSeed(work.id + ':proves:' + episodeIndex)),
      'Эпизод «' + episode.title + '»: ' + episode.detail + ' Вывод для сочинения: ' + episode.proves
    );
  });

  /* 6. Цитата → произведение: та же логика, варианты — цитаты других книг. */
  if (work.quote?.text) {
    push(
      'quote', 'quote',
      'Какая цитата относится к «' + work.title + '»?',
      work.quote.text,
      essayWorkDistractors(allQuotes, work.quote.text, 3, essayWorkSeed(work.id + ':quote')),
      '«' + work.quote.text + '» — ' + (work.quote.note || 'цитата') + ' из «' + work.title + '» (' + authorLabel + ').'
    );
  }

  return questions;
}

function buildEssayWorkQuestions() {
  if (typeof ESSAY_WORKS === 'undefined' || !Array.isArray(ESSAY_WORKS)) return ESSAY_WORK_QUESTIONS;
  if (ESSAY_WORK_QUESTIONS.length) return ESSAY_WORK_QUESTIONS;
  ESSAY_WORKS.forEach((work, index) => {
    const questions = essayWorkBuildQuestions(work, ESSAY_WORKS, index);
    ESSAY_WORK_QUESTION_INDEX[work.id] = questions.map(question => question.id);
    questions.forEach(question => {
      ESSAY_WORK_QUESTIONS.push(question);
      if (typeof QUESTION_BY_ID !== 'undefined') QUESTION_BY_ID[question.id] = question;
    });
  });
  return ESSAY_WORK_QUESTIONS;
}

function essayWorkQuestionIds(workId) {
  buildEssayWorkQuestions();
  return [...(ESSAY_WORK_QUESTION_INDEX[workId] || [])];
}

function essayWorkQuestionCount(workId) {
  return essayWorkQuestionIds(workId).length;
}

function essayWorkQuestionsTotal() {
  buildEssayWorkQuestions();
  return ESSAY_WORK_QUESTIONS.length;
}

buildEssayWorkQuestions();
