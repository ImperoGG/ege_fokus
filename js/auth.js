/* Вход, регистрация и перенос аккаунта. */
'use strict';

function renderAuthSyncPanel() {
  const status = syncMessage || { type: '', text: 'Введите код и пароль, которые задали на первом устройстве. После загрузки войдите с прежним email и паролем.' };
  return '' +
    '<div class="auth-sync-panel">' +
      '<div class="auth-sync-lead"><b>Перенос аккаунта</b><span>Код — имя зашифрованного сейфа, пароль — ключ. Они не связаны с паролем от аккаунта.</span></div>' +
      syncEnvBanner() +
      '<div class="sync-grid">' +
        '<div class="sync-field"><label>Код синхронизации</label><input type="text" data-sync-field="code" value="' + escapeHTML(syncDraft.code) + '" placeholder="focus-2027" autocomplete="off"></div>' +
        '<div class="sync-field"><label>Пароль синхронизации</label><input type="password" data-sync-field="passphrase" value="" placeholder="минимум 8 символов" autocomplete="current-password"></div>' +
        '<div class="sync-field" style="grid-column:1/-1"><label>Адрес сервера</label><div class="sync-server-row"><input type="url" data-sync-field="server" value="' + escapeHTML(syncDraft.server) + '" placeholder="https://example.com/api/sync" autocomplete="off"><button type="button" class="btn btn-ghost btn-sm" data-action="sync-use-default">Адрес этого сайта</button></div><span class="sync-field-hint">На первом устройстве сервер запускается через <code>start-fokus.bat</code>. На телефоне нужен HTTPS-адрес.</span></div>' +
      '</div>' +
      '<div class="sync-status ' + status.type + '">' + icon(status.type === 'ok' ? 'checkCircle' : status.type === 'err' ? 'alert' : 'cloud') + '<div>' + escapeHTML(status.text) + '</div></div>' +
      '<div class="sync-actions"><button class="btn btn-primary btn-sm" data-action="sync-download"' + (syncBusy ? ' disabled' : '') + '>' + icon('download') + (syncBusy ? 'Загружаем…' : 'Забрать аккаунт') + '</button><button class="btn btn-ghost btn-sm" data-action="sync-health"' + (syncBusy ? ' disabled' : '') + '>' + icon('cloud') + 'Проверить сервер</button></div>' +
      syncHealthBadge() +
      '<div class="sync-note">Если сервер не отвечает, проверьте, что <code>start-fokus.bat</code> запущен, и откройте сайт по адресу из его окна. Код и пароль чувствительны к регистру.</div>' +
    '</div>';
}

function renderAuth() {
  const login = authMode === 'login';
  const accounts = readAccounts();
  const legacy = !accounts.users.length && Boolean(readLegacyState());
  const passwordType = authShowPassword ? 'text' : 'password';
  const submitLabel = authBusy ? (login ? 'Проверяем...' : 'Создаём...') : (login ? 'Войти' : 'Создать аккаунт');
  return '' +
    '<div class="auth-page">' +
      '<aside class="auth-aside">' +
        '<div class="brand"><span class="brand-mark"><img src="icons/icon-192.png" alt="" width="40" height="40"></span><span class="brand-name">Фокус<small>ЕГЭ 2027</small></span></div>' +
        '<div class="auth-aside-inner">' +
          '<span class="eyebrow">Личный кабинет</span>' +
          '<h1>Твой план.<br><span>Твой прогресс.</span></h1>' +
          '<p>Возвращайся к своему маршруту с любого экрана: темы, практика, ошибки и серия занятий сохраняются в аккаунте. При желании перенесите его на другое устройство.</p>' +
          '<div class="auth-bullets">' +
            '<div class="auth-bullet"><span class="auth-bullet-ico">' + icon('target') + '</span><span><b>Персональный маршрут</b><small>План под предметы, даты и твой ритм</small></span></div>' +
            '<div class="auth-bullet"><span class="auth-bullet-ico">' + icon('chart') + '</span><span><b>Прогресс не теряется</b><small>Теория, практика и ошибки привязаны к аккаунту</small></span></div>' +
            '<div class="auth-bullet"><span class="auth-bullet-ico">' + icon('cloud') + '</span><span><b>Перенос по желанию</b><small>Локально или через зашифрованную синхронизацию</small></span></div>' +
          '</div>' +
        '</div>' +
        '<div class="auth-aside-foot">' + icon('lock') + 'Аккаунт · локально или зашифрованная синхронизация</div>' +
      '</aside>' +
      '<main class="auth-main">' +
        '<div class="auth-top">' +
          '<div class="auth-mobile-brand"><div class="brand"><span class="brand-mark">' + icon('spark') + '</span><span class="brand-name">Фокус<small>ЕГЭ 2027</small></span></div></div>' +
          '<button class="icon-btn" data-action="toggle-theme" aria-label="' + (currentTheme() === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему') + '" title="' + (currentTheme() === 'dark' ? 'Светлая тема' : 'Тёмная тема') + '">' + icon(currentTheme() === 'dark' ? 'sun' : 'moon') + '</button>' +
        '</div>' +
        '<section class="auth-card">' +
          '<div class="auth-tabs"><button class="auth-tab' + (login ? ' active' : '') + '" data-action="auth-mode" data-mode="login">Вход</button><button class="auth-tab' + (!login ? ' active' : '') + '" data-action="auth-mode" data-mode="register">Регистрация</button></div>' +
          (legacy ? '<div class="auth-legacy">' + icon('info') + '<span>На этом устройстве найден прогресс без аккаунта. Он автоматически перенесётся в новый профиль.</span></div>' : '') +
          '<h2>' + (login ? 'С возвращением' : 'Новый аккаунт') + '</h2>' +
          '<p class="auth-sub">' + (login ? 'Войди, чтобы продолжить подготовку с сохранённого места.' : 'Создай профиль, чтобы держать план и прогресс в одном месте.') + '</p>' +
          '<form class="auth-form" data-auth-form novalidate>' +
            (!login ? '<div class="auth-field"><label for="auth-name">Имя</label><div class="auth-input-wrap">' + icon('user', 'auth-field-ico') + '<input class="text-input" id="auth-name" type="text" data-auth-field="name" autocomplete="name" placeholder="Как тебя зовут" value="' + escapeHTML(authDraft.name) + '"></div></div>' : '') +
            '<div class="auth-field"><label for="auth-email">Email</label><div class="auth-input-wrap">' + icon('mail', 'auth-field-ico') + '<input class="text-input" id="auth-email" type="email" data-auth-field="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="' + escapeHTML(authDraft.email) + '"></div></div>' +
            '<div class="auth-field"><label for="auth-password">Пароль</label><div class="auth-input-wrap">' + icon('lock', 'auth-field-ico') + '<input class="text-input" id="auth-password" type="' + passwordType + '" data-auth-field="password" autocomplete="' + (login ? 'current-password' : 'new-password') + '" placeholder="' + (login ? 'Твой пароль' : 'Минимум 8 символов') + '" value="' + escapeHTML(authDraft.password) + '">' +
              '<button class="auth-eye" type="button" data-action="auth-toggle-password" aria-label="' + (authShowPassword ? 'Скрыть пароль' : 'Показать пароль') + '">' + icon(authShowPassword ? 'eyeOff' : 'eye') + '</button></div></div>' +
            (!login ? '<div class="auth-field"><label for="auth-confirm">Повтори пароль</label><div class="auth-input-wrap">' + icon('lock', 'auth-field-ico') + '<input class="text-input" id="auth-confirm" type="' + passwordType + '" data-auth-field="confirm" autocomplete="new-password" placeholder="Ещё раз" value="' + escapeHTML(authDraft.confirm) + '"></div></div>' : '') +
            (authError ? '<div class="auth-error" role="alert">' + icon('alert') + '<span>' + escapeHTML(authError) + '</span></div>' : '') +
            '<button class="btn btn-primary btn-lg btn-block auth-submit" type="submit"' + (authBusy ? ' disabled' : '') + '>' + icon(login ? 'arrowRight' : 'spark') + submitLabel + '</button>' +
          '</form>' +
          '<div class="auth-switch">' + (login ? 'Нет аккаунта?' : 'Уже есть аккаунт?') + ' <button data-action="auth-mode" data-mode="' + (login ? 'register' : 'login') + '">' + (login ? 'Создать' : 'Войти') + '</button></div>' +
          '<div class="auth-sync-callout">' +
            '<div class="auth-sync-callout-top">' + icon('cloud') + '<div><b>Уже есть аккаунт на другом устройстве?</b><small>Заберите зашифрованную копию по коду и паролю — без облака и лишних сервисов.</small></div></div>' +
            '<button class="btn btn-secondary btn-sm btn-block auth-sync-toggle" data-action="auth-sync-toggle">' + (authSyncOpen ? 'Скрыть перенос' : 'Перенести аккаунт') + '</button>' +
          '</div>' +
          (authSyncOpen ? renderAuthSyncPanel() : '') +
          '<div class="auth-local-note">' + icon('lock') + '<span>Пароль хранится в виде хеша и не отправляется на сервер. Синхронизация передаёт только зашифрованную копию по вашей команде.</span></div>' +
        '</section>' +
      '</main>' +
    '</div>';
}

function prepareAuthenticatedView() {
  if (!state.onboarded || !state.profile || !(state.profile.subjects || []).length) {
    view = 'onboarding';
    obStep = 0;
    obDraft = buildOnboardingDraft();
    editingProfile = false;
    return;
  }
  view = 'dashboard';
  trainerSubject = profileSubjects()[0] || null;
  if (planIsStale(state.plan)) {
    state.plan = generatePlan(state.profile);
    saveState();
  }
  maybeAutoRebalance();
  if (state.progress.rebalance?.pendingReason) modal = { type: 'rebalance' };
  recordForecastSnapshot();
  planWeekStart = startOfWeek(new Date());
  selectedPlanDate = toISO(new Date());
}

function applyLaunchIntent() {
  let requested = '';
  try {
    requested = new URLSearchParams(location.search).get('open') || '';
  } catch (error) {
    return;
  }
  if (!requested || !state.onboarded) return;
  if (requested === 'search') {
    openSearch();
  } else if (['trainer', 'plan', 'fipi', 'mistakes', 'progress'].includes(requested)) {
    view = requested;
    if (requested === 'trainer') trainer = null;
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  } else {
    return;
  }
  try {
    history.replaceState(null, '', location.pathname + location.hash);
  } catch (error) {}
}

function startUserSession(user, options) {
  currentUser = user;
  activeStorageKey = accountStateKey(user.id);
  state = options?.importedState || loadState(activeStorageKey) || defaultState();
  if (options?.importedState) saveState();
  if (state.onboarded && addUpcomingEssayTrack()) saveState();
  selectedSubject = null;
  trainer = null;
  trainerSubject = null;
  mistakeFilter = 'all';
  settingsDraft = null;
  modal = null;
  obDraft = null;
  obStep = 0;
  obDiagQuiz = null;
  groupJoinCode = '';
  groupNameDraft = '';
  pendingImport = null;
  pendingImportName = '';
  editingProfile = false;
  authBusy = false;
  authError = '';
  syncMessage = null;
  authDraft = { name: '', email: user.email, password: '', confirm: '' };
  prepareAuthenticatedView();
  render();
  applyLaunchIntent();
  startReminders();
  if (options?.toast) showToast(options.toast.title, options.toast.text, options.toast.type || 'success');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function logoutAccount() {
  if (!currentUser) return;
  const email = currentUser.email;
  saveState();
  clearSession();
  currentUser = null;
  activeStorageKey = STORAGE_KEY;
  state = defaultState();
  view = 'dashboard';
  obDraft = null;
  obStep = 0;
  obDiagQuiz = null;
  groupJoinCode = '';
  groupNameDraft = '';
  pendingImport = null;
  pendingImportName = '';
  selectedSubject = null;
  trainer = null;
  trainerSubject = null;
  mistakeFilter = 'all';
  settingsDraft = null;
  modal = null;
  authMode = 'login';
  authDraft = { name: '', email, password: '', confirm: '' };
  authError = '';
  authBusy = false;
  render();
  showToast('Вы вышли из аккаунта', 'Весь прогресс сохранён и будет доступен при следующем входе.', 'info');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function startReminders() {
  if (remindersStarted) return;
  remindersStarted = true;
  setTimeout(() => {
    if (currentUser) checkReminders();
  }, 1200);
  setInterval(() => {
    if (currentUser) checkReminders();
  }, 60000);
}

function syncAuthDraftFromForm() {
  document.querySelectorAll('[data-auth-field]').forEach(field => {
    authDraft[field.dataset.authField] = field.value;
  });
}

async function handleAuthSubmit() {
  if (authBusy) return;
  syncAuthDraftFromForm();
  authError = '';
  const email = normalizeEmail(authDraft.email);
  const password = String(authDraft.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    authError = 'Введите корректный email.';
    render();
    return;
  }
  if (authMode === 'register') {
    const name = String(authDraft.name || '').trim();
    if (name.length < 2) {
      authError = 'Имя должно содержать хотя бы 2 символа.';
      render();
      return;
    }
    if (password.length < 8) {
      authError = 'Пароль должен содержать минимум 8 символов.';
      render();
      return;
    }
    if (password !== String(authDraft.confirm || '')) {
      authError = 'Пароли не совпадают.';
      render();
      return;
    }
  }
  authBusy = true;
  render();
  try {
    if (authMode === 'login') {
      const user = findAccountByEmail(email);
      if (!user) throw new Error('Неверный email или пароль.');
      const valid = await verifyAccountPassword(user, password);
      if (!valid) throw new Error('Неверный email или пароль.');
      touchAccount(user.id);
      saveSession(user.id);
      startUserSession(user, {
        toast: { title: 'С возвращением', text: 'План и прогресс восстановлены.', type: 'success' }
      });
      return;
    }
    const accountsBefore = readAccounts().users.length;
    const legacy = accountsBefore === 0 ? readLegacyState() : null;
    const user = await createAccount(authDraft.name, email, password);
    saveSession(user.id);
    startUserSession(user, {
      importedState: legacy,
      toast: legacy
        ? { title: 'Аккаунт создан', text: 'Текущий прогресс перенесён в новый профиль.', type: 'success' }
        : { title: 'Аккаунт создан', text: 'Соберём первый план подготовки.', type: 'success' }
    });
    if (legacy) localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    authBusy = false;
    authError = error?.message || 'Не удалось выполнить вход. Попробуйте ещё раз.';
    render();
  }
}
