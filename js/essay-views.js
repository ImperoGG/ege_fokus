/* Интерфейс рабочей тетради по итоговому сочинению. */
'use strict';

function essayWorkById(workId) {
  return (typeof ESSAY_WORKS !== 'undefined' ? ESSAY_WORKS : []).find(work => work.id === workId) || null;
}

function essayDirectionLabel(directionId) {
  return ESSAY_DIRECTIONS[directionId]?.label || directionId;
}

function essayWorksFiltered() {
  if (typeof ESSAY_WORKS === 'undefined') return [];
  const query = essayWorksQuery.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е');
  return ESSAY_WORKS.filter(work => {
    const directionMatch = essayWorksDirection === 'all' || (work.directions || []).includes(essayWorksDirection);
    if (!directionMatch) return false;
    if (!query) return true;
    const haystack = [
      work.author, work.authorFull, work.initials, work.title, work.genre, work.year,
      work.oneLine, work.summary, ...(work.characters || []).map(item => item.name + ' ' + item.role),
      ...(work.directions || []).map(essayDirectionLabel)
    ].join(' ').toLocaleLowerCase('ru').replace(/ё/g, 'е');
    return haystack.includes(query);
  });
}

function renderEssayWorkCard(work) {
  const characters = (work.characters || []).slice(0, 3).map(item => item.name).join(', ');
  const directions = (work.directions || []).slice(0, 3);
  const questionCount = typeof essayWorkQuestionCount === 'function' ? essayWorkQuestionCount(work.id) : 0;
  return '' +
    '<article class="essay-work-card">' +
      '<button type="button" class="essay-work-open" data-action="open-essay-work" data-work="' + escapeHTML(work.id) + '" aria-label="Открыть разбор: ' + escapeHTML(work.title) + '">' +
        '<span class="essay-work-top">' +
          '<span class="essay-work-monogram">' + escapeHTML(work.initials) + '</span>' +
          '<span class="essay-work-title"><small>' + escapeHTML(work.author) + '</small><b>«' + escapeHTML(work.title) + '»</b></span>' +
          '<span class="essay-work-year">' + escapeHTML(work.year) + '</span>' +
        '</span>' +
        '<span class="essay-work-genre">' + escapeHTML(work.genre) + '</span>' +
        '<span class="essay-work-line">' + escapeHTML(work.oneLine) + '</span>' +
        '<span class="essay-work-heroes"><b>Герои:</b> ' + escapeHTML(characters) + '</span>' +
        '<span class="essay-work-tags">' + directions.map(id => '<span class="tag">' + escapeHTML(essayDirectionLabel(id)) + '</span>').join('') + '</span>' +
        '<span class="essay-work-more">Разобрать произведение ' + icon('arrowRight') + '</span>' +
      '</button>' +
      '<div class="essay-work-foot">' +
        '<span class="essay-work-qcount">' + icon('target') + questionCount + ' ' + pluralize(questionCount, ['вопрос', 'вопроса', 'вопросов']) + '</span>' +
        '<button type="button" class="essay-work-check" data-action="start-essay-check" data-scope="work" data-work="' + escapeHTML(work.id) + '"' + (questionCount ? '' : ' disabled') + '>' + icon('play') + 'Проверить' + '</button>' +
      '</div>' +
    '</article>';
}

function renderEssayWorksResults() {
  const works = essayWorksFiltered();
  return '' +
    (works.length
      ? '<div class="essay-work-grid">' + works.map(renderEssayWorkCard).join('') + '</div>'
      : '<div class="essay-empty"><div class="empty-ico">' + icon('search') + '</div><b>Ничего не нашлось</b><small>Попробуйте фамилию автора, название произведения или тему. Например, «Пушкин», «честь» или «Гринёв».</small><button class="btn btn-secondary btn-sm" data-action="essay-search-clear" data-scope="all">Сбросить фильтры</button></div>') +
    '<div class="essay-check-card">' +
      '<span class="essay-check-ico">' + icon('target') + '</span>' +
      '<div class="essay-check-copy"><b>Проверить, что вы действительно помните</b><p>10 случайных вопросов об авторах, инициалах, героях и сюжетах. Или нажмите «Проверить» на карточке — 6–7 вопросов по одному произведению.</p></div>' +
      '<button class="btn btn-primary" type="button" data-action="start-essay-check" data-scope="works">' + icon('play') + 'Начать проверку</button>' +
    '</div>' +
    '<p class="essay-workspace-note">' + icon('info') + 'Подборка произведений и формулировки — авторские материалы тренажёра. Это не официальный список тем ФИПИ; проверяйте актуальные направления на сайте ФИПИ.</p>';
}

function renderEssayWorksPanel() {
  const allWorks = typeof ESSAY_WORKS !== 'undefined' ? ESSAY_WORKS : [];
  const directionCounts = {};
  allWorks.forEach(work => (work.directions || []).forEach(id => { directionCounts[id] = Number(directionCounts[id] || 0) + 1; }));
  return '' +
    '<div class="essay-works-toolbar">' +
      '<label class="essay-search">' +
        icon('search') +
        '<input type="search" value="' + escapeHTML(essayWorksQuery) + '" data-essay-search placeholder="Найти автора, произведение или героя" aria-label="Поиск по произведениям">' +
        '<button type="button" class="essay-search-clear" data-action="essay-search-clear" data-scope="query" aria-label="Очистить поиск"' + (essayWorksQuery ? '' : ' hidden') + '>' + icon('x') + '</button>' +
      '</label>' +
      '<div class="essay-direction-chips">' +
        '<button class="seg-chip' + (essayWorksDirection === 'all' ? ' active' : '') + '" data-action="essay-direction" data-direction="all">Все · ' + allWorks.length + '</button>' +
        ESSAY_DIRECTION_ORDER.filter(id => directionCounts[id]).map(id => (
          '<button class="seg-chip' + (essayWorksDirection === id ? ' active' : '') + '" data-action="essay-direction" data-direction="' + escapeHTML(id) + '">' + escapeHTML(ESSAY_DIRECTIONS[id].short) + ' · ' + directionCounts[id] + '</button>'
        )).join('') +
      '</div>' +
    '</div>' +
    '<div data-essay-results>' + renderEssayWorksResults() + '</div>';
}

function renderEssayClichesPanel() {
  const groups = typeof ESSAY_CLICHE_GROUPS !== 'undefined' ? ESSAY_CLICHE_GROUPS : [];
  const warnings = typeof ESSAY_CLICHE_WARNINGS !== 'undefined' ? ESSAY_CLICHE_WARNINGS : [];
  const frame = typeof ESSAY_WORK_FRAME !== 'undefined' ? ESSAY_WORK_FRAME : [];
  return '' +
    '<div class="essay-cliche-intro">' +
      '<div><span class="essay-kicker">Конструктор текста</span><b>Клише — это каркас, а не готовое сочинение</b><p>Выберите 2–3 фразы на каждую часть работы и обязательно продолжите их своей мыслью. Проверяющий должен видеть анализ, а не набор шаблонов.</p></div>' +
      '<button class="btn btn-secondary" type="button" data-action="start-essay-check" data-scope="cliches">' + icon('zap') + 'Проверить клише</button>' +
    '</div>' +
    '<div class="essay-frame-grid">' + frame.map(item => (
      '<div class="essay-frame-card"><span>' + escapeHTML(item.words) + ' слов</span><b>' + escapeHTML(item.part) + '</b><small>' + escapeHTML(item.task) + '</small><div>' + (item.starters || []).map(text => '<em>' + escapeHTML(text) + '</em>').join('') + '</div></div>'
    )).join('') + '</div>' +
    '<div class="essay-cliche-grid">' + groups.map(group => (
      '<section class="essay-cliche-group">' +
        '<div class="essay-cliche-head"><div><b>' + escapeHTML(group.title) + '</b><p>' + escapeHTML(group.purpose) + '</p></div><span class="tag">' + group.items.length + '</span></div>' +
        '<div class="essay-cliche-list">' + group.items.map(item => (
          '<div class="essay-cliche-item">' +
            '<div><p>«' + escapeHTML(item.text) + '»</p><small>' + escapeHTML(item.note) + '</small></div>' +
            '<button type="button" class="essay-cliche-copy" data-action="copy-essay-text" data-text="' + escapeHTML(item.text) + '" aria-label="Скопировать фразу">' + icon('copy') + '</button>' +
          '</div>'
        )).join('') + '</div>' +
      '</section>'
    )).join('') + '</div>' +
    '<section class="essay-stop-list">' +
      '<div class="essay-stop-head"><span class="essay-kicker">Стоп-лист</span><b>Фразы, которые лучше заменить</b><p>Они не запрещены, но часто скрывают отсутствие мысли.</p></div>' +
      warnings.map(item => (
        '<div class="essay-stop-item"><div><s>' + escapeHTML(item.bad) + '</s><small>' + escapeHTML(item.why) + '</small></div><div><b>Чем заменить</b><p>' + escapeHTML(item.better) + '</p></div></div>'
      )).join('') +
    '</section>' +
    '<p class="essay-workspace-note">' + icon('info') + 'Клише и каркас — авторские учебные материалы тренажёра. Адаптируйте формулировки под тему и произведение; это не официальные критерии ФИПИ.' + '</p>';
}

function renderEssayWorkspace() {
  if (typeof ESSAY_WORKS === 'undefined') return '';
  const workCount = ESSAY_WORKS.length;
  const clicheCount = (typeof ESSAY_CLICHE_GROUPS !== 'undefined' ? ESSAY_CLICHE_GROUPS : []).reduce((sum, group) => sum + group.items.length, 0);
  const workQuestionCount = (TOPIC_BY_ID['e-works']?.questions || []).length;
  const perWorkCount = typeof essayWorkQuestionsTotal === 'function' ? essayWorkQuestionsTotal() : 0;
  const tab = essayWorkspaceTab === 'cliches' ? 'cliches' : 'works';
  return '' +
    '<section class="essay-workspace">' +
      '<div class="essay-workspace-head">' +
        '<div>' +
          '<span class="essay-kicker">' + icon('bookOpen') + 'Рабочая тетрадь по сочинению</span>' +
          '<h2>Произведения, герои и клише</h2>' +
          '<p>' + workCount + ' произведений с кратким пересказом, опорными эпизодами и героями. Откройте карточку, чтобы собрать аргумент, или проверьте знание одного произведения — ' + (perWorkCount ? '6–7 вопросов на книгу' : 'вопросы по книге') + '.</p>' +
          '<div class="essay-workspace-stats"><span><b>' + workCount + '</b> произведений</span><span><b>' + (perWorkCount || workQuestionCount) + '</b> ' + pluralize(perWorkCount || workQuestionCount, ['вопрос', 'вопроса', 'вопросов']) + ' по книгам</span><span><b>' + clicheCount + '</b> клише</span></div>' +
        '</div>' +
        '<div class="essay-workspace-actions"><button class="btn btn-primary" type="button" data-action="start-essay-check" data-scope="works">' + icon('target') + 'Проверить знания</button><button class="btn btn-ghost" type="button" data-action="essay-tab" data-tab="cliches">' + icon('quote') + 'Клише</button></div>' +
      '</div>' +
      '<div class="essay-tabs" role="tablist" aria-label="Материалы для сочинения">' +
        '<button class="essay-tab' + (tab === 'works' ? ' active' : '') + '" type="button" role="tab" aria-selected="' + (tab === 'works') + '" data-action="essay-tab" data-tab="works">' + icon('book') + 'Произведения <span>' + workCount + '</span></button>' +
        '<button class="essay-tab' + (tab === 'cliches' ? ' active' : '') + '" type="button" role="tab" aria-selected="' + (tab === 'cliches') + '" data-action="essay-tab" data-tab="cliches">' + icon('quote') + 'Клише и связки <span>' + clicheCount + '</span></button>' +
      '</div>' +
      '<div class="essay-tab-panel">' + (tab === 'cliches' ? renderEssayClichesPanel() : renderEssayWorksPanel()) + '</div>' +
    '</section>';
}

function renderEssayWorkModal(workId) {
  const work = essayWorkById(workId);
  if (!work) return '';
  return '' +
    '<div class="modal essay-work-modal" role="dialog" aria-modal="true" aria-label="Разбор произведения">' +
      '<div class="modal-head essay-work-modal-head">' +
        '<div class="essay-work-monogram large">' + escapeHTML(work.initials) + '</div>' +
        '<div><span class="essay-kicker">' + escapeHTML(work.genre) + ' · ' + escapeHTML(work.year) + '</span><h2>' + escapeHTML(work.author) + '.<br>«' + escapeHTML(work.title) + '»</h2><p>' + escapeHTML(work.oneLine) + '</p></div>' +
        '<button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + icon('x') + '</button>' +
      '</div>' +
      '<div class="modal-body essay-work-modal-body">' +
        '<div class="essay-work-directions">' + (work.directions || []).map(id => '<span class="tag brand">' + escapeHTML(essayDirectionLabel(id)) + '</span>').join('') + '</div>' +
        '<section class="essay-work-section"><h3>' + icon('bookOpen') + 'Коротко о сюжете</h3><p>' + escapeHTML(work.summary) + '</p></section>' +
        '<section class="essay-work-section"><h3>' + icon('users') + 'Главные герои</h3><div class="essay-character-grid">' + (work.characters || []).map(item => (
          '<div class="essay-character"><b>' + escapeHTML(item.name) + '</b><small>' + escapeHTML(item.role) + '</small></div>'
        )).join('') + '</div></section>' +
        '<section class="essay-work-section"><h3>' + icon('layers') + 'Опорные эпизоды</h3><div class="essay-episode-list">' + (work.episodes || []).map((item, index) => (
          '<div class="essay-episode"><span class="essay-episode-num">' + (index + 1) + '</span><div><b>' + escapeHTML(item.title) + '</b><p>' + escapeHTML(item.detail) + '</p><small>Что доказывает: ' + escapeHTML(item.proves) + '</small></div></div>'
        )).join('') + '</div></section>' +
        '<section class="essay-work-section"><h3>' + icon('target') + 'Как использовать в сочинении</h3><div class="essay-use-block"><span>Пример тезиса</span><p>«' + escapeHTML(work.essayUse?.thesis || '') + '»</p></div><ul class="essay-angle-list">' + (work.essayUse?.angles || []).map(text => '<li>' + escapeHTML(text) + '</li>').join('') + '</ul></section>' +
        (work.quote ? '<blockquote class="essay-quote">' + icon('quote') + '<p>«' + escapeHTML(work.quote.text) + '»</p><small>' + escapeHTML(work.quote.note) + '</small></blockquote>' : '') +
        '<p class="essay-workspace-note">' + icon('info') + 'Краткий пересказ и трактовка — авторские материалы тренажёра. Для точных цитат сверяйтесь с текстом произведения.</p>' +
      '</div>' +
      '<div class="modal-foot"><span class="foot-note">' + escapeHTML(work.authorFull) + ' · ' + escapeHTML(work.year) + ' · ' + (typeof essayWorkQuestionCount === 'function' ? essayWorkQuestionCount(work.id) : 0) + ' ' + pluralize(typeof essayWorkQuestionCount === 'function' ? essayWorkQuestionCount(work.id) : 0, ['вопрос', 'вопроса', 'вопросов']) + '</span><div class="modal-foot-actions"><button class="btn btn-ghost btn-sm" data-action="close-modal">Закрыть</button><button class="btn btn-primary btn-sm" data-action="start-essay-check" data-scope="work" data-work="' + escapeHTML(work.id) + '">' + icon('play') + 'Проверить по книге</button></div></div>' +
    '</div>';
}
