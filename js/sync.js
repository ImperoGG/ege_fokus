/* Шифруемая синхронизация аккаунта через собственный сервер. */
'use strict';

/* === Синхронизация: шифруемая копия аккаунтов на своём сервере === */

function readSyncConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem('fokus_sync_v1') || '{}');
    return {
      code: typeof parsed.code === 'string' ? parsed.code : '',
      server: typeof parsed.server === 'string' ? parsed.server : '',
      lastSyncAt: typeof parsed.lastSyncAt === 'string' ? parsed.lastSyncAt : '',
      lastDirection: parsed.lastDirection === 'download' ? 'download' : parsed.lastDirection === 'upload' ? 'upload' : ''
    };
  } catch (error) {
    return { code: '', server: '', lastSyncAt: '', lastDirection: '' };
  }
}

function saveSyncConfig(next) {
  syncConfig = { ...syncConfig, ...(next || {}) };
  try {
    localStorage.setItem('fokus_sync_v1', JSON.stringify(syncConfig));
  } catch (error) {}
}

function defaultSyncUrl() {
  if (typeof location !== 'undefined' && /^https?:/.test(location.protocol)) {
    return location.origin + '/api/sync';
  }
  return 'http://127.0.0.1:8765/api/sync';
}

function normalizeSyncServer(value) {
  let base = String(value || '').trim().replace(/\/+$/, '');
  if (!base) base = defaultSyncUrl();
  if (!/^https?:\/\//i.test(base)) base = 'http://' + base;
  if (/\/api\/sync$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return base + '/sync';
  return base + '/api/sync';
}

function syncEndpoint(code) {
  return normalizeSyncServer(syncDraft.server || defaultSyncUrl()) + '/' + encodeURIComponent(String(code || '').trim());
}

function syncHealthUrl() {
  return normalizeSyncServer(syncDraft.server || defaultSyncUrl()).replace(/\/api\/sync$/i, '/api/health');
}

function syncEnvironment() {
  const file = location.protocol === 'file:';
  const secure = Boolean(window.isSecureContext);
  const subtle = Boolean(window.crypto?.subtle);
  const localhost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  if (file) {
    return {
      file, secure, subtle, localhost, level: 'warn',
      title: 'Приложение открыто как файл',
      text: subtle
        ? 'Синхронизация возможна, только если сервер уже запущен. Надёжнее открыть http://127.0.0.1:8765/ — тогда работают и офлайн-режим, и установка приложения.'
        : 'В режиме файла браузер может отключить шифрование. Запустите start-fokus.bat и откройте http://127.0.0.1:8765/.'
    };
  }
  if (!secure || !subtle) {
    return {
      file, secure, subtle, localhost, level: 'warn',
      title: 'Адрес не считается защищённым',
      text: 'Браузер отключил WebCrypto, поэтому пароль синхронизации нельзя безопасно зашифровать. На компьютере откройте http://127.0.0.1:8765/. На телефоне нужен HTTPS-адрес из start-site-https.ps1.'
    };
  }
  return {
    file, secure, subtle, localhost, level: 'ok',
    title: localhost ? 'Локальный защищённый адрес' : 'Защищённое соединение',
    text: 'Шифрование в браузере доступно. Сервер должен быть запущен на этом же адресе или на указанном HTTPS-сервере.'
  };
}

function syncCryptoUnavailableMessage() {
  if (!window.isSecureContext) {
    return 'Браузер отключил шифрование на незащищённом адресе. Откройте приложение по http://127.0.0.1:8765/ или по HTTPS. Для телефона используйте start-site-https.ps1.';
  }
  return 'Браузер не поддерживает WebCrypto. Обновите Chrome, Edge, Firefox или Safari.';
}

function syncValidationError(requirePassphrase = true) {
  const code = String(syncDraft.code || '').trim();
  const passphrase = String(syncDraft.passphrase || '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(code)) return 'Код синхронизации: 8–64 символа, латиница, цифры, _ и -.';
  if (requirePassphrase && passphrase.length < 8) return 'Пароль синхронизации должен содержать минимум 8 символов.';
  if (!/^https?:\/\//.test(String(syncDraft.server || '').trim())) return 'Адрес сервера должен начинаться с http:// или https://. Пример: http://127.0.0.1:8765/api/sync';
  return '';
}

async function syncHealthCheck() {
  if (syncBusy) return;
  syncBusy = true;
  syncHealth = null;
  setSyncMessage('info', 'Проверяем сервер синхронизации…');
  render();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(syncHealthUrl(), { method: 'GET', cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Сервер ответил ' + response.status + '.');
    const data = await response.json().catch(() => null);
    if (!data || data.ok !== true || data.service !== 'fokus-sync') {
      throw new Error('По адресу отвечает не сервер «Фокуса». Проверьте, что адрес заканчивается на /api/sync.');
    }
    syncHealth = { status: 'ok', checkedAt: new Date().toISOString() };
    setSyncMessage('ok', 'Сервер синхронизации доступен (версия ' + (data.v || 1) + '). ' + (window.crypto?.subtle ? 'Шифрование в браузере работает — можно выгружать и забирать копию.' : 'Но шифрование в браузере недоступно: откройте localhost или HTTPS.'));
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'Сервер не ответил за 7 секунд.' : (error?.message || 'Не удалось подключиться.');
    syncHealth = { status: 'err', checkedAt: new Date().toISOString() };
    setSyncMessage('err', 'Проверка не прошла: ' + reason + ' Запустите start-fokus.bat и проверьте адрес сервера.');
  } finally {
    clearTimeout(timer);
    syncBusy = false;
    render();
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(String(value || ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveSyncKey(passphrase, saltHex) {
  if (!window.crypto?.subtle) throw new Error(syncCryptoUnavailableMessage());
  const material = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: 210000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSyncPayload(payload, passphrase) {
  const salt = randomHex(16);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveSyncKey(passphrase, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return {
    v: 1,
    salt,
    iv: bytesToHex(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
    updatedAt: new Date().toISOString()
  };
}

async function decryptSyncEnvelope(envelope, passphrase) {
  if (!envelope || envelope.v !== 1 || !envelope.salt || !envelope.iv || !envelope.data) {
    throw new Error('Сервер вернул данные в неизвестном формате.');
  }
  const key = await deriveSyncKey(passphrase, envelope.salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.data)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function buildSyncPayload() {
  const accounts = readAccounts();
  const states = {};
  accounts.users.forEach(user => {
    try {
      const raw = localStorage.getItem(accountStateKey(user.id));
      if (raw) states[user.id] = JSON.parse(raw);
    } catch (error) {}
  });
  if (currentUser && state) states[currentUser.id] = state;
  return {
    v: 1,
    exportedAt: new Date().toISOString(),
    accounts: accounts.users,
    states
  };
}

function mergeSyncPayload(payload) {
  if (!payload || payload.v !== 1 || !Array.isArray(payload.accounts)) {
    throw new Error('В загруженной копии нет данных аккаунтов.');
  }
  const local = readAccounts();
  const byEmail = new Map(local.users.map(user => [normalizeEmail(user.email), user]));
  const remoteToLocalId = {};
  let importedAccounts = 0;
  payload.accounts.forEach(remote => {
    if (!remote || !remote.id || !remote.email || !remote.hash || !remote.salt) return;
    const email = normalizeEmail(remote.email);
    const existing = byEmail.get(email);
    if (existing) {
      existing.name = remote.name || existing.name;
      existing.lastLoginAt = remote.lastLoginAt || existing.lastLoginAt;
      remoteToLocalId[remote.id] = existing.id;
      return;
    }
    const user = {
      id: remote.id,
      name: String(remote.name || 'Ученик'),
      email,
      salt: remote.salt,
      hash: remote.hash,
      algo: remote.algo || 'pbkdf2-sha256',
      iterations: Number(remote.iterations) || 1,
      createdAt: remote.createdAt || new Date().toISOString(),
      lastLoginAt: remote.lastLoginAt || remote.createdAt || new Date().toISOString()
    };
    local.users.push(user);
    byEmail.set(email, user);
    remoteToLocalId[remote.id] = user.id;
    importedAccounts += 1;
  });
  writeAccounts(local);
  let importedStates = 0;
  Object.entries(payload.states || {}).forEach(([remoteId, remoteState]) => {
    const localId = remoteToLocalId[remoteId] || remoteId;
    if (!findAccountById(localId) || !remoteState || typeof remoteState !== 'object') return;
    const key = accountStateKey(localId);
    let localState = null;
    try {
      localState = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {}
    const localTime = Date.parse(localState?.meta?.lastOpen || localState?.plan?.generatedAt || 0) || 0;
    const remoteTime = Date.parse(remoteState?.meta?.lastOpen || remoteState?.plan?.generatedAt || payload.exportedAt || 0) || 0;
    if (!localState || remoteTime > localTime) {
      localStorage.setItem(key, JSON.stringify(normalizeState(remoteState)));
      importedStates += 1;
    }
  });
  return { importedAccounts, importedStates };
}

function setSyncMessage(type, text) {
  syncMessage = { type, text };
}

async function syncUpload() {
  if (syncBusy) return;
  const invalid = syncValidationError();
  if (invalid) {
    setSyncMessage('err', invalid);
    render();
    return;
  }
  syncBusy = true;
  setSyncMessage('info', 'Шифруем и отправляем копию аккаунта…');
  render();
  try {
    const envelope = await encryptSyncPayload(buildSyncPayload(), syncDraft.passphrase);
    const response = await fetch(syncEndpoint(syncDraft.code), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    });
    if (!response.ok) throw new Error('Сервер ответил ' + response.status + '. Проверьте адрес и что сервер синхронизации запущен.');
    saveSyncConfig({
      code: String(syncDraft.code).trim(),
      server: normalizeSyncServer(syncDraft.server),
      lastSyncAt: new Date().toISOString(),
      lastDirection: 'upload'
    });
    syncDraft.server = normalizeSyncServer(syncDraft.server);
    setSyncMessage('ok', 'Копия выгружена. На другом устройстве введите тот же код и пароль и нажмите «Забрать».');
    showToast('Синхронизация готова', 'Аккаунт зашифрован и отправлен на сервер.', 'success');
  } catch (error) {
    setSyncMessage('err', error?.message || 'Не удалось выгрузить данные.');
  } finally {
    syncBusy = false;
    render();
  }
}

async function syncDownload() {
  if (syncBusy) return;
  const invalid = syncValidationError();
  if (invalid) {
    setSyncMessage('err', invalid);
    render();
    return;
  }
  syncBusy = true;
  setSyncMessage('info', 'Скачиваем и расшифровываем копию…');
  render();
  try {
    const response = await fetch(syncEndpoint(syncDraft.code), { method: 'GET', cache: 'no-store' });
    if (response.status === 404) throw new Error('Код не найден. Сначала выгрузите данные с устройства, где уже есть аккаунт.');
    if (!response.ok) throw new Error('Сервер ответил ' + response.status + '. Проверьте адрес сервера.');
    const envelope = await response.json();
    const payload = await decryptSyncEnvelope(envelope, syncDraft.passphrase);
    const result = mergeSyncPayload(payload);
    saveSyncConfig({
      code: String(syncDraft.code).trim(),
      server: normalizeSyncServer(syncDraft.server),
      lastSyncAt: new Date().toISOString(),
      lastDirection: 'download'
    });
    syncDraft.server = normalizeSyncServer(syncDraft.server);
    authMode = readAccounts().users.length ? 'login' : 'register';
    if (currentUser) {
      const reloaded = loadState(activeStorageKey);
      if (reloaded) {
        state = reloaded;
        prepareAuthenticatedView();
      }
    }
    setSyncMessage('ok', 'Загружено: аккаунтов — ' + result.importedAccounts + ', обновлённых профилей — ' + result.importedStates + '. Войдите с прежним email и паролем.');
    showToast('Данные загружены', currentUser ? 'Профиль обновлён.' : 'Теперь войдите с прежним email и паролем.', 'success');
    authSyncOpen = false;
    syncDraft.passphrase = '';
  } catch (error) {
    setSyncMessage('err', error?.message || 'Не удалось загрузить данные.');
  } finally {
    syncBusy = false;
    render();
  }
}

function saveSyncSettings() {
  const invalid = syncValidationError(false);
  if (invalid) {
    setSyncMessage('err', invalid);
    render();
    return;
  }
  syncDraft.server = normalizeSyncServer(syncDraft.server);
  saveSyncConfig({ code: String(syncDraft.code).trim(), server: syncDraft.server });
  setSyncMessage('ok', 'Настройки синхронизации сохранены на этом устройстве.');
  render();
}

function forgetSyncSettings() {
  try {
    localStorage.removeItem('fokus_sync_v1');
  } catch (error) {}
  syncConfig = { code: '', server: '', lastSyncAt: '', lastDirection: '' };
  syncDraft = { code: '', passphrase: '', server: defaultSyncUrl() };
  syncMessage = { type: 'info', text: 'Код синхронизации удалён с этого устройства.' };
  syncHealth = null;
  render();
}
