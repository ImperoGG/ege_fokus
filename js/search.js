/* Глобальный поиск по темам, вопросам и теории. */
'use strict';

/* === Глобальный поиск === */

function normalizeSearch(value) {
  return String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

let SEARCH_INDEX = null;

function buildSearchIndex() {
  const entries = [];
  TOPICS.forEach(topic => {
    const subject = SUBJECTS[topic.subject];
    const theoryText = [topic.theory?.lead, ...(topic.theory?.blocks || []).map(block => (
      [block.title, block.text, ...(block.items || [])].filter(Boolean).join(' ')
    )), ...(TOPIC_MISTAKES[topic.id] || [])].filter(Boolean).join(' ');
    entries.push({
      type: 'topic',
      topicId: topic.id,
      subject: topic.subject,
      title: topic.title,
      text: (topic.examTasks || '') + ' · ' + (topic.theory?.lead || ''),
      search: normalizeSearch([topic.title, topic.examTasks, theoryText, subject?.name].join(' '))
    });
    entries.push({
      type: 'cheat',
      topicId: topic.id,
      subject: topic.subject,
      title: 'Шпаргалка: ' + topic.title,
      text: theoryText,
      search: normalizeSearch(['шпаргалка', topic.title, theoryText].join(' '))
    });
    topic.questions.forEach(question => {
      const official = question.source === 'fipi';
      const source = official ? fipiSourceForQuestion(question) : null;
      entries.push({
        type: 'question',
        topicId: topic.id,
        questionId: question.id,
        subject: topic.subject,
        official,
        title: question.text,
        text: official
          ? 'Официальное задание ФИПИ · ' + (source?.label || 'документ ФИПИ') + ' · задание ' + (question.sourceItemNumber || '—')
          : question.options.join(' · ') + ' — ' + question.explanation,
        search: normalizeSearch([question.text, question.options.join(' '), question.explanation, topic.title].join(' '))
      });
    });
  });
  SEARCH_INDEX = entries;
  return entries;
}

function searchEntries(query, filter) {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];
  const tokens = normalized.split(' ').filter(token => token.length >= 2);
  if (!tokens.length) return [];
  return (SEARCH_INDEX || buildSearchIndex())
    .filter(entry => filter === 'all' || entry.type === filter)
    .map(entry => {
      if (!tokens.every(token => entry.search.includes(token))) return null;
      const title = normalizeSearch(entry.title);
      let score = 0;
      if (title === normalized) score += 120;
      else if (title.startsWith(normalized)) score += 80;
      else if (title.includes(normalized)) score += 55;
      if (tokens.every(token => title.includes(token))) score += 25;
      if (entry.type === 'topic') score += 6;
      if (entry.type === 'cheat') score += 3;
      return { entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)
    .slice(0, 40)
    .map(item => item.entry);
}

function searchSnippet(text, query) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  const normalized = normalizeSearch(query);
  if (!normalized) return raw.slice(0, 150);
  const lower = normalizeSearch(raw);
  const firstToken = normalized.split(' ').find(token => lower.includes(token)) || '';
  const index = firstToken ? Math.max(0, lower.indexOf(firstToken) - 42) : 0;
  const snippet = raw.slice(index, index + 150);
  return (index > 0 ? '…' : '') + snippet + (raw.length > index + 150 ? '…' : '');
}

function highlightSearch(text, query) {
  const tokens = normalizeSearch(query).split(' ').filter(token => token.length >= 2);
  if (!tokens.length) return escapeHTML(text);
  const pattern = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = String(text || '').split(new RegExp('(' + pattern + ')', 'gi'));
  return parts.map((part, index) => (
    index % 2 ? '<mark class="search-mark">' + escapeHTML(part) + '</mark>' : escapeHTML(part)
  )).join('');
}

function searchTypeLabel(type) {
  return type === 'question' ? 'Задание' : type === 'cheat' ? 'Шпаргалка' : 'Тема';
}

function renderSearchResults() {
  const query = searchState.query.trim();
  if (!query) {
    return '<div class="search-empty"><b>Ищите по всему курсу</b><small>Темы, задания и шпаргалки — всё в одном месте. Начните вводить слово или нажмите на подсказку.</small></div>' +
      '<div class="search-filters" style="padding:0;justify-content:center">' +
        ['функции', 'правописание', 'Конституция', 'вероятность', 'Пётр I'].map(word => '<button class="search-filter" data-action="search-suggest" data-query="' + escapeHTML(word) + '">' + escapeHTML(word) + '</button>').join('') +
      '</div>';
  }
  const results = searchEntries(query, searchState.filter);
  if (!results.length) {
    return '<div class="search-empty"><b>Ничего не нашлось</b><small>Попробуйте другое слово или снимите фильтр. Например, «проценты», «паронимы», «Великая Отечественная».</small></div>';
  }
  return '<div class="search-results">' + results.map(entry => {
    const subject = SUBJECTS[entry.subject];
    const iconText = entry.type === 'question' ? '?' : entry.type === 'cheat' ? 'Z' : (subject?.icon || 'Т');
    return '' +
      '<button class="search-result" data-action="search-open" data-type="' + entry.type + '" data-topic="' + entry.topicId + '" data-question="' + (entry.questionId || '') + '">' +
        '<span class="search-result-ico ' + (entry.type === 'question' ? 'q' : entry.type === 'cheat' ? 'c' : '') + '">' + escapeHTML(iconText) + '</span>' +
        '<span class="search-result-main"><b>' + highlightSearch(entry.title, query) + '</b><small>' + highlightSearch(searchSnippet(entry.text, query), query) + '</small></span>' +
        '<span class="search-result-meta"><span>' + (entry.official ? 'ФИПИ · ' + searchTypeLabel(entry.type) : searchTypeLabel(entry.type)) + '</span><span>' + escapeHTML(subject?.short || '') + '</span></span>' +
      '</button>';
  }).join('') + '</div>';
}

function renderSearchModal() {
  const filters = [
    ['all', 'Всё'],
    ['topic', 'Темы'],
    ['question', 'Задания'],
    ['cheat', 'Шпаргалки']
  ];
  return '' +
    '<div class="modal search-modal" role="dialog" aria-modal="true" aria-label="Поиск по курсу">' +
      '<div class="modal-head"><div class="confirm-icon">' + icon('search') + '</div><div><h2>Поиск</h2><p>Темы, задания и шпаргалки по всем предметам.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button></div>' +
      '<div class="search-box">' + icon('search') + '<input type="search" data-search-input placeholder="Например: логарифмы, паронимы, Конституция…" value="' + escapeHTML(searchState.query) + '" autocomplete="off" autofocus>' + (searchState.query ? '<button class="search-clear" data-action="search-clear" aria-label="Очистить">' + icon('x') + '</button>' : '') + '</div>' +
      '<div class="search-filters">' + filters.map(([id, label]) => '<button class="search-filter' + (searchState.filter === id ? ' active' : '') + '" data-action="search-filter" data-filter="' + id + '">' + label + '</button>').join('') + '</div>' +
      '<div class="modal-body"><div data-search-results>' + renderSearchResults() + '</div><div class="search-hint">Ctrl K — открыть поиск · Esc — закрыть</div></div>' +
    '</div>';
}

function openSearch() {
  if (!currentUser) return;
  searchState = { query: '', filter: 'all' };
  modal = { type: 'search' };
  render();
  requestAnimationFrame(() => {
    const input = document.querySelector('[data-search-input]');
    if (input) input.focus();
  });
}

function updateSearchResults() {
  const root = document.querySelector('[data-search-results]');
  if (root) root.innerHTML = renderSearchResults();
  const box = document.querySelector('.search-box');
  if (box) {
    const clear = box.querySelector('.search-clear');
    if (searchState.query && !clear) {
      const button = document.createElement('button');
      button.className = 'search-clear';
      button.dataset.action = 'search-clear';
      button.setAttribute('aria-label', 'Очистить');
      button.innerHTML = icon('x');
      box.appendChild(button);
    } else if (!searchState.query && clear) {
      clear.remove();
    }
  }
}
