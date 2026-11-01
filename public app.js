'use strict';

(function () {
  /* ----------------------------- 基础配置 ----------------------------- */

  const STORAGE_KEY = 'zx:prefs';
  const BASE_TITLE = document.title;
  const DEFAULT_PREFS = {
    theme: 'dark',
    accent: 'lime',
    density: 'comfortable',
    motion: 'on'
  };
  const VALID = {
    theme: ['dark', 'light', 'system'],
    accent: ['lime', 'mint', 'coral', 'sky', 'violet', 'amber'],
    density: ['comfortable', 'compact'],
    motion: ['on', 'off']
  };
  const ACCENT_COLORS = {
    lime: '#C7F464',
    mint: '#70E3C3',
    coral: '#FF7A66',
    sky: '#6EB6FF',
    violet: '#B69CFF',
    amber: '#F5C65B'
  };
  const RATING_LABELS = {
    1: '不太行',
    2: '有待改进',
    3: '还不错',
    4: '很推荐',
    5: '年度级'
  };

  const ICONS = {
    gem: `<path d="M6.2 3.5h11.6L21 8.7 12 20.8 3 8.7l3.2-5.2Z"/><path d="M3 8.7h18M8.4 3.5 12 8.7l3.6-5.2M12 20.8V8.7"/>`,
    bolt: `<path d="m13.2 2.5-8 11h6l-1.3 8 8.8-12.2h-6.4l.9-6.8Z"/>`,
    arc: `<path d="M3 20a9 9 0 0 1 18 0"/><path d="M3 20h18"/><path d="M7.5 16a4.5 4.5 0 0 1 9 0"/>`,
    shapes: `<circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><path d="M16 4h4v4M4 16v4h4"/>`,
    cube: `<path d="m12 2.8 8.2 4.7v9L12 21.2l-8.2-4.7v-9L12 2.8Z"/><path d="M3.8 7.5 12 12.2l8.2-4.7M12 12.2v9"/>`,
    broadcast: `<circle cx="12" cy="12" r="2.3"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>`,
    code: `<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4l-3 16"/>`,
    send: `<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z"/>`,
    zed: `<path d="M6 4.5h12L6 19.5h12"/><path d="M6 4.5 18 19.5"/>`,
    search: `<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.4 15.4 4.1 4.1"/>`,
    play: `<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>`,
    crop: `<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M9 9h6v6H9z"/>`,
    notion: `<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 16.5v-9l8 9v-9"/>`,
    fallback: `<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>`
  };

  const STAR_PATH =
    'm12 2.8 2.7 5.7 6.2.8-4.6 4.3 1.2 6.1-5.5-3-5.5 3 1.2-6.1L3.1 9.3l6.2-.8L12 2.8Z';
  const HEART_PATH =
    'M20.8 5.7c-2-2-5.2-2-7.2 0L12 7.3l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.1a5.1 5.1 0 0 0 0-7.2Z';
  const MESSAGE_PATH =
    'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.3-.7L4 19l1.1-3.7A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z';

  const state = {
    home: null,
    me: null,
    prefs: normalizePrefs(window.__ZX_INITIAL_PREFS__ || DEFAULT_PREFS),
    favoriteIds: new Set(),
    favoriteBusy: new Set(),
    filters: {
      query: '',
      category: '',
      platform: '',
      sort: 'curated'
    },
    detail: null,
    detailSlug: null,
    detailRequest: 0,
    detailOpener: null,
    reviewSort: 'helpful',
    composerRating: 5,
    authMode: 'login',
    authSucceeded: false,
    authSubmitting: false,
    pendingFavoriteId: null,
    accountTab: 'profile',
    profileAvatarColor: '#C7F464',
    confirmResolver: null,
    prefsTimer: null,
    prefsDirty: false,
    homeError: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const detailLayer = $('#detailLayer');
  const detailContent = $('#detailContent');
  const detailScroll = $('#detailScroll');
  const detailClose = $('#detailClose');
  const authDialog = $('#authDialog');
  const accountDialog = $('#accountDialog');
  const prefsDialog = $('#prefsDialog');
  const confirmDialog = $('#confirmDialog');
  const accountMenu = $('#accountMenu');
  const toastRegion = $('#toastRegion');
  const searchInput = $('#searchInput');
  const themeColorMeta = $('#themeColorMeta');

  /* ------------------------------- 工具 ------------------------------- */

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  async function api(path, options = {}) {
    const { method = 'GET', body, keepalive = false } = options;
    const headers = { Accept: 'application/json' };
    const init = {
      method,
      headers,
      credentials: 'same-origin',
      keepalive
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    let response;
    try {
      response = await fetch(path, init);
    } catch {
      throw new ApiError('无法连接服务器，请确认服务正在运行。', 0);
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      throw new ApiError((payload && payload.error) || '请求失败，请稍后再试。', response.status);
    }
    return payload || {};
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => {
      switch (character) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return character;
      }
    });
  }

  function safeAccent(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : '#C7F464';
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value));
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch {
      /* 忽略无效地址。 */
    }
    return '#';
  }

  function iconSvg(name) {
    const content = ICONS[name] || ICONS.fallback;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  }

  function starIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  }

  function heartIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="${HEART_PATH}"/></svg>`;
  }

  function messageIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="${MESSAGE_PATH}"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>`;
  }

  function initials(name) {
    const chars = Array.from(String(name || '?').trim());
    return (chars[0] || '?').toUpperCase();
  }

  function setAvatar(element, user) {
    if (!element || !user) return;
    element.textContent = initials(user.displayName);
    element.style.setProperty('--avatar-color', safeAccent(user.avatarColor));
  }

  function relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return '刚刚';
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
    if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
    return formatDate(value);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未知';
    return date
      .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '.');
  }

  function formatMetric(value) {
    return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
  }

  function debounce(callback, delay) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => callback.apply(this, args), delay);
    };
  }

  function normalizePrefs(value) {
    const next = { ...DEFAULT_PREFS };
    if (!value || typeof value !== 'object') return next;
    for (const key of Object.keys(DEFAULT_PREFS)) {
      if (VALID[key].includes(value[key])) next[key] = value[key];
    }
    return next;
  }

  function showToast(message, type = 'success') {
    if (!toastRegion) return;
    while (toastRegion.children.length >= 3) {
      toastRegion.firstElementChild.remove();
    }
    const toast = document.createElement('div');
    toast.className = `toast${type === 'error' ? ' toast--error' : ''}`;
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'error' ? '!' : '✓';
    const text = document.createElement('p');
    text.textContent = message;
    toast.append(icon, text);
    toastRegion.append(toast);
    setTimeout(() => {
      toast.classList.add('is-out');
      setTimeout(() => toast.remove(), 260);
    }, 4200);
  }

  function updateBodyLock() {
    const hasDialog = Boolean(document.querySelector('dialog[open]'));
    const hasDetail = detailLayer && !detailLayer.hidden;
    document.body.classList.toggle('no-scroll', hasDialog || hasDetail);
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    $$('dialog[open]').forEach((item) => {
      if (item !== dialog) item.close();
    });
    dialog.showModal();
    updateBodyLock();
  }

  function closeAccountMenu() {
    if (!accountMenu || accountMenu.hidden) return;
    accountMenu.hidden = true;
    const button = $('#accountButton');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function toggleAccountMenu() {
    if (!accountMenu) return;
    const willOpen = accountMenu.hidden;
    accountMenu.hidden = !willOpen;
    const button = $('#accountButton');
    if (button) button.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) closeAccountMenuOutsideSoon();
  }

  function closeAccountMenuOutsideSoon() {
    // 点击事件在下一帧仍会冒泡到 document，这里用标记避免刚打开就被关闭。
    accountMenu.dataset.justOpened = 'true';
    requestAnimationFrame(() => {
      delete accountMenu.dataset.justOpened;
    });
  }

  /* ---------------------------- 主题与偏好 ---------------------------- */

  function applyVisualPrefs(options = {}) {
    const { store = true } = options;
    const root = document.documentElement;
    const systemDark = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;
    const resolvedTheme =
      state.prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.prefs.theme;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-theme-pref', state.prefs.theme);
    root.setAttribute('data-accent', state.prefs.accent);
    root.setAttribute('data-density', state.prefs.density);
    root.setAttribute('data-motion', state.prefs.motion);
    root.style.colorScheme = resolvedTheme;
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', resolvedTheme === 'dark' ? '#080a0c' : '#f1f0e9');
    }
    const themeButton = $('#themeButton');
    if (themeButton) {
      const label = resolvedTheme === 'dark' ? '切换到纸白主题' : '切换到深夜主题';
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('title', label);
    }
    if (store) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prefs));
      } catch {
        /* localStorage 不可用时忽略。 */
      }
    }
  }

  function updatePrefControls() {
    $$('[data-pref-theme]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.prefTheme === state.prefs.theme));
    });
    $$('[data-pref-accent]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.prefAccent === state.prefs.accent));
    });
    $$('[data-pref-density]').forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.prefDensity === state.prefs.density)
      );
    });
    $$('[data-pref-motion]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.prefMotion === state.prefs.motion));
    });
  }

  function setPrefsSync(text) {
    const node = $('#prefsSync');
    if (node) node.textContent = text;
  }

  function setPreference(key, value, options = {}) {
    if (!VALID[key] || !VALID[key].includes(value)) return;
    state.prefs = { ...state.prefs, [key]: value };
    applyVisualPrefs();
    updatePrefControls();
    if (options.sync !== false) queuePrefsSync();
  }

  function queuePrefsSync() {
    if (!state.me) {
      setPrefsSync('偏好保存在本机');
      state.prefsDirty = false;
      return;
    }
    state.prefsDirty = true;
    setPrefsSync('正在保存…');
    clearTimeout(state.prefsTimer);
    state.prefsTimer = setTimeout(() => {
      state.prefsTimer = null;
      syncPrefsNow();
    }, 650);
  }

  async function syncPrefsNow() {
    if (!state.me || !state.prefsDirty) return;
    state.prefsDirty = false;
    try {
      await api('/api/me/preferences', { method: 'PATCH', body: state.prefs });
      setPrefsSync('已同步到你的账户');
    } catch (error) {
      state.prefsDirty = true;
      setPrefsSync('已保存在本机');
      if (prefsDialog.open) showToast(error.message, 'error');
    }
  }

  function flushPrefsSync() {
    if (state.prefsTimer) {
      clearTimeout(state.prefsTimer);
      state.prefsTimer = null;
    }
    if (state.prefsDirty) syncPrefsNow();
  }

  function adoptServerPrefs(prefs) {
    state.prefs = normalizePrefs(prefs);
    state.prefsDirty = false;
    clearTimeout(state.prefsTimer);
    state.prefsTimer = null;
    applyVisualPrefs();
    updatePrefControls();
    setPrefsSync('已同步到你的账户');
  }

  /* ---------------------------- 用户与头像 ---------------------------- */

  function renderHeaderUser() {
    const me = state.me;
    const loginButton = $('#loginButton');
    const userArea = $('#userArea');
    if (loginButton) loginButton.hidden = Boolean(me);
    if (userArea) userArea.hidden = !me;
    if (me) {
      setAvatar($('#headerAvatar'), me);
      setAvatar($('#menuAvatar'), me);
      setAvatar($('#accountAvatar'), me);
      const menuName = $('#menuName');
      const menuUsername = $('#menuUsername');
      if (menuName) menuName.textContent = me.displayName;
      if (menuUsername) menuUsername.textContent = `@${me.username}`;
    }
    const footerLogin = $('#footerLogin');
    if (footerLogin) footerLogin.textContent = me ? '个人中心' : '登录 / 注册';
    updateFavoriteCounts();

    if (!me) {
      closeAccountMenu();
    }
  }

  function updateFavoriteCounts() {
    const count = state.me ? state.favoriteIds.size : 0;
    const navCount = $('#navFavoriteCount');
    if (navCount) {
      navCount.textContent = String(count);
      navCount.hidden = count === 0;
    }
    const menuCount = $('#menuFavoriteCount');
    if (menuCount) menuCount.textContent = String(count);
    const accountTabCount = $('#accountFavTabCount');
    if (accountTabCount) accountTabCount.textContent = String(count);
    const accountFavStat = $('#accountFavStat');
    if (accountFavStat) accountFavStat.textContent = String(count);
    const commentStat = $('#accountCommentStat');
    if (commentStat && state.me) commentStat.textContent = String(state.me.stats.comments || 0);
    if (state.me) state.me.stats.favorites = count;
  }

  function syncFavoriteDom() {
    updateFavoriteCounts();
    $$('[data-favorite-id]').forEach((button) => {
      const id = Number(button.dataset.favoriteId);
      const active = state.favoriteIds.has(id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      if (button.classList.contains('detail-fav')) {
        const label = button.querySelector('span');
        if (label) label.textContent = active ? '已收藏' : '收藏';
      }
    });
    if (accountDialog.open && state.accountTab === 'favorites') {
      renderAccountFavorites();
    }
  }

  function isFavorite(id) {
    return state.favoriteIds.has(Number(id));
  }

  function setFavoriteState(favoriteIds) {
    state.favoriteIds = new Set((favoriteIds || []).map(Number));
    updateFavoriteCounts();
  }

  async function toggleFavorite(id) {
    const softwareId = Number(id);
    if (!Number.isFinite(softwareId)) return;
    if (!state.me) {
      state.pendingFavoriteId = softwareId;
      openAuth('login');
      return;
    }
    if (state.favoriteBusy.has(softwareId)) return;
    state.favoriteBusy.add(softwareId);
    const item =
      (state.home && state.home.software.find((software) => software.id === softwareId)) ||
      (state.detail && state.detail.software.id === softwareId ? state.detail.software : null);
    try {
      const payload = await api(`/api/software/${softwareId}/favorite`, { method: 'POST' });
      setFavoriteState(payload.favoriteIds);
      if (state.detail && state.detail.software.id === softwareId) {
        state.detail.favorite = Boolean(payload.favorited);
      }
      syncFavoriteDom();
      if (payload.favorited) {
        showToast(`已收藏${item ? `「${item.name}」` : '这款软件'}`);
      } else {
        showToast('已从收藏中移除');
      }
    } catch (error) {
      if (error.status === 401) {
        state.me = null;
        renderHeaderUser();
        openAuth('login');
      } else {
        showToast(error.message, 'error');
      }
    } finally {
      state.favoriteBusy.delete(softwareId);
    }
  }

  /* --------------------------- 首页与筛选 --------------------------- */

  async function loadHome(options = {}) {
    const { applyServerPrefs = false } = options;
    try {
      const data = await api('/api/home');
      state.home = data;
      state.me = data.me;
      state.homeError = false;
      setFavoriteState(data.favoriteIds || []);
      if (applyServerPrefs && data.me && data.prefs) {
        adoptServerPrefs(data.prefs);
      } else if (data.me) {
        setPrefsSync('已同步到你的账户');
      } else {
        setPrefsSync('偏好保存在本机');
      }
      renderHeaderUser();
      renderHero();
      renderCurated();
      renderAuthStack();
      renderLibrary();
      if (accountDialog.open) {
        renderAccount({ syncForm: false });
      }
      updatePrefsSyncForGuest();
    } catch (error) {
      state.homeError = true;
      showToast(error.message, 'error');
      renderHomeError(error);
    }
  }

  function updatePrefsSyncForGuest() {
    if (!state.me) setPrefsSync('偏好保存在本机');
  }

  function renderHomeError(error) {
    const appGrid = $('#appGrid');
    const empty = $('#emptyResults');
    const summary = $('#resultSummary');
    if (appGrid) {
      appGrid.hidden = true;
      appGrid.innerHTML = '';
    }
    if (empty) {
      empty.hidden = false;
      const kicker = $('.section-kicker', empty);
      const title = $('h3', empty);
      const copy = $('p:not(.section-kicker)', empty);
      const button = $('#emptyReset');
      if (kicker) kicker.textContent = 'CONNECTION LOST';
      if (title) title.textContent = '软件库暂时无法加载。';
      if (copy) copy.textContent = '请确认本地服务正在运行，然后重新载入页面。';
      if (button) button.textContent = '重新加载';
    }
    if (summary) summary.textContent = error.message;
  }

  function renderHero() {
    if (!state.home) return;
    const featured = state.home.featured.length
      ? state.home.featured
      : state.home.software.slice(0, 3);
    if (!featured.length) return;
    const pick = featured[0];
    const heroPick = $('#heroPick');
    if (heroPick) {
      heroPick.dataset.slug = pick.slug;
      heroPick.setAttribute('aria-label', `查看编辑精选：${pick.name}`);
    }
    const pickIcon = $('#heroPickIcon');
    if (pickIcon) pickIcon.innerHTML = iconSvg(pick.icon);
    const category = $('#heroPickCategory');
    if (category) category.textContent = `${pick.category} · ${pick.platforms[0] || '全平台'}`;
    const name = $('#heroPickName');
    if (name) name.textContent = pick.name;
    const tagline = $('#heroPickTagline');
    if (tagline) tagline.textContent = pick.tagline;
    const rating = $('#heroPickRating');
    if (rating) rating.textContent = Number(pick.rating).toFixed(1);
    const comments = $('#heroPickComments');
    if (comments) comments.textContent = String(pick.commentCount);
    const ghost = $('#heroPickGhost');
    if (ghost) ghost.textContent = initials(pick.name);
    const no = $('#heroPickNo');
    if (no) no.textContent = '#001';

    const floatOne = $('#floatPickOne');
    const floatTwo = $('#floatPickTwo');
    const secondary = featured.slice(1, 3);
    [[floatOne, 0], [floatTwo, 1]].forEach(([button, index]) => {
      if (!button) return;
      const item = secondary[index];
      if (!item) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.dataset.slug = item.slug;
      button.style.setProperty('--app', safeAccent(item.accent));
      const iconNode = $('.float-pick-icon', button);
      if (iconNode) iconNode.innerHTML = iconSvg(item.icon);
      const nameNode = $('strong', button);
      if (nameNode) nameNode.textContent = item.name;
    });

    animateNumber($('#metricSoftware'), state.home.stats.software);
    animateNumber($('#metricComments'), state.home.stats.comments);
  }

  function animateNumber(element, value) {
    if (!element) return;
    const target = Number(value) || 0;
    const reduce =
      state.prefs.motion === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.hidden;
    if (reduce || target === 0) {
      element.textContent = formatMetric(target);
      return;
    }
    const duration = 700;
    const started = performance.now();
    const start = Number(element.textContent.replace(/[^\d]/g, '')) || 0;
    function frame(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatMetric(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderCurated() {
    if (!state.home) return;
    const grid = $('#curatedGrid');
    if (!grid) return;
    const seen = new Set();
    const picks = [];
    for (const item of state.home.featured) {
      if (!seen.has(item.slug) && item.slug !== (state.home.featured[0] || {}).slug) {
        seen.add(item.slug);
        picks.push(item);
      }
    }
    for (const item of state.home.software) {
      if (picks.length >= 3) break;
      if (!seen.has(item.slug) && item.slug !== (state.home.featured[0] || {}).slug) {
        seen.add(item.slug);
        picks.push(item);
      }
    }
    if (!picks.length) {
      grid.innerHTML = '';
      return;
    }
    const spotlight = picks[0];
    const sidePicks = picks.slice(1, 3);
    const spotlightHTML = `
      <article class="spotlight-card" style="--app:${safeAccent(spotlight.accent)}" data-slug="${escapeHTML(spotlight.slug)}" tabindex="0" role="button" aria-label="查看 ${escapeHTML(spotlight.name)} 详情">
        <div class="spotlight-art">
          <div class="spotlight-top">
            <span class="spotlight-tag">编辑精选</span>
            <span class="spotlight-no">PICK ${String(spotlight.featured || 2).padStart(2, '0')} / 04</span>
          </div>
          <div class="spotlight-icon">${iconSvg(spotlight.icon)}</div>
          <span class="spotlight-ghost" aria-hidden="true">${escapeHTML(initials(spotlight.name))}</span>
        </div>
        <div class="spotlight-body">
          <div class="spotlight-meta">
            <span>${escapeHTML(spotlight.category)}</span>
            <span class="dot"></span>
            <span>${escapeHTML(spotlight.platforms.slice(0, 2).join(' / '))}</span>
            <span class="dot"></span>
            <span>${escapeHTML(spotlight.version)}</span>
          </div>
          <h3>${escapeHTML(spotlight.name)}</h3>
          <p class="spotlight-tagline">${escapeHTML(spotlight.tagline)}</p>
          <div class="spotlight-footer">
            <span class="rating-inline">${starIcon()}<strong>${Number(spotlight.rating).toFixed(1)}</strong><em>${spotlight.commentCount} 条评价</em></span>
            <span class="spotlight-open" aria-hidden="true">↗</span>
          </div>
        </div>
      </article>`;

    const miniHTML = sidePicks
      .map(
        (item) => `
        <article class="mini-pick" style="--app:${safeAccent(item.accent)}" data-slug="${escapeHTML(item.slug)}" tabindex="0" role="button" aria-label="查看 ${escapeHTML(item.name)} 详情">
          <span class="mini-pick-icon">${iconSvg(item.icon)}</span>
          <div class="mini-pick-copy">
            <span>${escapeHTML(item.category)} / ${escapeHTML(item.platforms[0] || '全平台')}</span>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.tagline)}</p>
          </div>
          <span class="mini-pick-side">
            <span class="rating-inline">${starIcon()}<strong>${Number(item.rating).toFixed(1)}</strong></span>
            <span class="mini-pick-arrow" aria-hidden="true">↗</span>
          </span>
        </article>`
      )
      .join('');

    grid.innerHTML = spotlightHTML + miniHTML;
  }

  function renderAuthStack() {
    const stack = $('#authIconStack');
    if (!stack || !state.home) return;
    const picks = state.home.featured.length
      ? state.home.featured.slice(0, 3)
      : state.home.software.slice(0, 3);
    stack.innerHTML = picks
      .map(
        (item) =>
          `<span class="auth-stack-icon" style="--app:${safeAccent(item.accent)}">${iconSvg(item.icon)}</span>`
      )
      .join('');
  }

  function filteredSoftware() {
    if (!state.home) return [];
    const query = state.filters.query.toLocaleLowerCase('zh-CN');
    const list = state.home.software.filter((item) => {
      if (state.filters.category && item.category !== state.filters.category) return false;
      if (state.filters.platform && !item.platforms.includes(state.filters.platform)) return false;
      if (!query) return true;
      const haystack = [
        item.name,
        item.tagline,
        item.description,
        item.category,
        item.developer,
        item.platforms.join(' '),
        item.tags.join(' ')
      ]
        .join(' ')
        .toLocaleLowerCase('zh-CN');
      return haystack.includes(query);
    });

    if (state.filters.sort === 'popular') {
      list.sort((a, b) => b.downloads + b.views - (a.downloads + a.views));
    } else if (state.filters.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating || b.commentCount - a.commentCount);
    } else if (state.filters.sort === 'newest') {
      list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }
    return list;
  }

  function renderLibrary() {
    if (!state.home) return;
    renderCategoryTabs();
    updatePlatformTabs();
    const sortSelect = $('#sortSelect');
    if (sortSelect) sortSelect.value = state.filters.sort;

    const results = filteredSoftware();
    const grid = $('#appGrid');
    const empty = $('#emptyResults');
    if (grid) {
      grid.innerHTML = results
        .map((software, index) => renderSoftwareCard(software, index))
        .join('');
      grid.hidden = results.length === 0;
    }
    if (empty) empty.hidden = results.length > 0;

    const clear = $('#clearFilters');
    const hasFilters =
      Boolean(state.filters.query) ||
      Boolean(state.filters.category) ||
      Boolean(state.filters.platform) ||
      state.filters.sort !== 'curated';
    if (clear) clear.hidden = !hasFilters;

    const summary = $('#resultSummary');
    if (summary) {
      const scopes = [];
      if (state.filters.query) scopes.push(`「${escapeHTML(state.filters.query)}」`);
      if (state.filters.category) scopes.push(escapeHTML(state.filters.category));
      if (state.filters.platform) scopes.push(escapeHTML(state.filters.platform));
      if (scopes.length) {
        summary.innerHTML = `在 ${scopes.join(' · ')} 中找到 <strong>${results.length}</strong> 款工具`;
      } else {
        summary.innerHTML = `收录 <strong>${results.length}</strong> 款工具 · 每一款都经过真实使用`;
      }
    }

    if (empty) {
      const kicker = $('.section-kicker', empty);
      const title = $('h3', empty);
      const copy = $('p:not(.section-kicker)', empty);
      const button = $('#emptyReset');
      if (kicker) kicker.textContent = 'NOTHING FOUND';
      if (title) title.textContent = '没有找到匹配的软件。';
      if (copy) copy.textContent = '换个关键词，或清除当前筛选条件再看看。';
      if (button) button.textContent = '重置搜索';
    }
  }

  function renderSoftwareCard(software, index) {
    const active = isFavorite(software.id);
    return `
      <article class="app-card" style="--app:${safeAccent(software.accent)};--i:${index}" data-slug="${escapeHTML(software.slug)}" tabindex="0" role="button" aria-label="查看 ${escapeHTML(software.name)} 详情">
        <div class="card-art">
          <div class="card-art-top">
            <span class="card-category">${escapeHTML(software.category)}</span>
            <button class="card-fav${active ? ' is-active' : ''}" type="button" data-favorite-id="${software.id}" data-favorite-name="${escapeHTML(software.name)}" aria-label="${active ? '取消收藏' : '收藏'} ${escapeHTML(software.name)}" aria-pressed="${active}" title="${active ? '取消收藏' : '加入收藏'}">
              ${heartIcon()}
            </button>
          </div>
          <span class="card-app-icon">${iconSvg(software.icon)}</span>
          <span class="card-ghost" aria-hidden="true">${escapeHTML(initials(software.name))}</span>
          <span class="card-index">ZX / ${String(index + 1).padStart(2, '0')}</span>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3>${escapeHTML(software.name)}</h3>
            <span class="card-version">${escapeHTML(software.version)}</span>
          </div>
          <p class="card-tagline">${escapeHTML(software.tagline)}</p>
          <div class="card-tags">
            ${software.tags
              .slice(0, 2)
              .map((tag) => `<span>${escapeHTML(tag)}</span>`)
              .join('')}
          </div>
          <div class="card-footer">
            <span class="card-platforms">${escapeHTML(software.platforms.slice(0, 3).join(' / '))}</span>
            <span class="card-footer-right">
              <span class="rating-inline">${starIcon()}<strong>${Number(software.rating).toFixed(1)}</strong></span>
              <span class="card-comments">${software.commentCount} 评</span>
              <span class="card-arrow" aria-hidden="true">↗</span>
            </span>
          </div>
        </div>
      </article>`;
  }

  function renderCategoryTabs() {
    const tabs = $('#categoryTabs');
    if (!tabs || !state.home) return;
    const categories = [
      { name: '全部', value: '', count: state.home.software.length },
      ...state.home.categories.map((item) => ({
        name: item.name,
        value: item.name,
        count: item.count
      }))
    ];
    tabs.innerHTML = categories
      .map(
        (item) => `
        <button class="filter-chip${state.filters.category === item.value ? ' is-active' : ''}" type="button" data-category="${escapeHTML(item.value)}" aria-pressed="${state.filters.category === item.value}">
          ${escapeHTML(item.name)}<sup>${item.count}</sup>
        </button>`
      )
      .join('');
  }

  function updatePlatformTabs() {
    $$('#platformTabs .platform-chip').forEach((button) => {
      const active = button.dataset.platform === state.filters.platform;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function resetFilters() {
    state.filters = { query: '', category: '', platform: '', sort: 'curated' };
    if (searchInput) searchInput.value = '';
    const sortSelect = $('#sortSelect');
    if (sortSelect) sortSelect.value = 'curated';
    if (state.homeError) {
      window.location.reload();
      return;
    }
    renderLibrary();
  }

  /* ----------------------------- 登录与账号 ----------------------------- */

  function setAuthMode(mode) {
    const nextMode = mode === 'register' ? 'register' : 'login';
    state.authMode = nextMode;
    const isRegister = nextMode === 'register';
    $$('[data-auth-mode]').forEach((button) => {
      const active = button.dataset.authMode === nextMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const title = $('#authTitle');
    const subtitle = $('#authSubtitle');
    const kicker = $('#authKicker');
    const submit = $('#authSubmit');
    const displayField = $('#displayNameField');
    const password = $('#authPassword');
    const username = $('#authUsername');
    if (title) title.textContent = isRegister ? '第一次来？' : '欢迎回来。';
    if (subtitle) {
      subtitle.textContent = isRegister
        ? '创建一个账号，收藏喜欢的工具，留下真实评价。'
        : '登录后同步你的收藏、评论与个性化设置。';
    }
    if (kicker) kicker.textContent = isRegister ? 'JOIN THE LIBRARY' : 'WELCOME BACK';
    if (submit) submit.textContent = isRegister ? '创建账号' : '登录';
    if (displayField) displayField.hidden = !isRegister;
    if (password) password.autocomplete = isRegister ? 'new-password' : 'current-password';
    if (username) {
      username.placeholder = isRegister ? '给自己取一个用户名' : '3–20 个字符';
    }
    hideAuthMessage();
  }

  function showAuthMessage(message) {
    const node = $('#authMessage');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('is-success');
    node.hidden = false;
  }

  function hideAuthMessage() {
    const node = $('#authMessage');
    if (!node) return;
    node.textContent = '';
    node.hidden = true;
  }

  function openAuth(mode = 'login') {
    if (state.me) {
      openAccount();
      return;
    }
    closeAccountMenu();
    const form = $('#authForm');
    if (form) form.reset();
    const password = $('#authPassword');
    if (password) password.type = 'password';
    const passwordToggle = $('#passwordToggle');
    if (passwordToggle) passwordToggle.textContent = '显示';
    setAuthMode(mode);
    openDialog(authDialog);
    setTimeout(() => {
      const username = $('#authUsername');
      if (username) username.focus({ preventScroll: true });
    }, 80);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (state.authSubmitting) return;
    const mode = state.authMode;
    const username = ($('#authUsername')?.value || '').trim();
    const password = $('#authPassword')?.value || '';
    const displayName = ($('#authDisplayName')?.value || '').trim();

    if (!username) {
      showAuthMessage('请输入用户名。');
      return;
    }
    if (mode === 'register' && !/^[\p{L}\p{N}_-]{3,20}$/u.test(username)) {
      showAuthMessage('用户名需为 3–20 个字符，只能包含文字、数字、下划线或短横线。');
      return;
    }
    if (password.length < 8) {
      showAuthMessage('密码至少需要 8 个字符。');
      return;
    }
    if (mode === 'register' && displayName && Array.from(displayName).length > 24) {
      showAuthMessage('昵称最多 24 个字符。');
      return;
    }

    hideAuthMessage();
    state.authSubmitting = true;
    const submit = $('#authSubmit');
    if (submit) {
      submit.disabled = true;
      submit.textContent = mode === 'register' ? '创建中…' : '登录中…';
    }
    try {
      const payload =
        mode === 'login'
          ? await api('/api/auth/login', { method: 'POST', body: { username, password } })
          : await api('/api/auth/register', {
              method: 'POST',
              body: { username, password, displayName: displayName || username }
            });

      const pendingFavorite = state.pendingFavoriteId;
      state.authSucceeded = true;
      state.me = payload.me;
      setFavoriteState(payload.favoriteIds || []);
      adoptServerPrefs(payload.prefs || DEFAULT_PREFS);
      authDialog.close();
      $('#authForm')?.reset();
      renderHeaderUser();
      await loadHome();
      if (pendingFavorite && !state.favoriteIds.has(pendingFavorite)) {
        await toggleFavorite(pendingFavorite);
      }
      state.pendingFavoriteId = null;
      if (state.detailSlug) {
        await refreshDetail({ preserveScroll: true });
      }
      showToast(`欢迎回来，${state.me ? state.me.displayName : username}`);
    } catch (error) {
      showAuthMessage(error.message);
    } finally {
      state.authSubmitting = false;
      if (submit) {
        submit.disabled = false;
        submit.textContent = state.authMode === 'register' ? '创建账号' : '登录';
      }
    }
  }

  function openAccount(tab = 'profile') {
    if (!state.me) {
      openAuth('login');
      return;
    }
    state.accountTab = tab;
    renderAccount();
    openDialog(accountDialog);
  }

  function renderAccount(options = {}) {
    const { syncForm = true } = options;
    if (!state.me) return;
    const me = state.me;
    setAvatar($('#accountAvatar'), me);
    setAvatar($('#headerAvatar'), me);
    setAvatar($('#menuAvatar'), me);
    const name = $('#accountName');
    if (name) name.textContent = me.displayName;
    const handle = $('#accountHandle');
    if (handle) handle.textContent = `@${me.username}`;
    const bio = $('#accountBio');
    if (bio) bio.textContent = me.bio || '还没有写下个人简介。';
    const username = $('#accountUsername');
    if (username) username.textContent = `@${me.username}`;
    const join = $('#accountJoinStat');
    if (join) join.textContent = String(new Date(me.createdAt).getFullYear());
    updateFavoriteCounts();
    if (syncForm) {
      const profileName = $('#profileName');
      const profileBio = $('#profileBio');
      if (profileName) profileName.value = me.displayName;
      if (profileBio) profileBio.value = me.bio || '';
      updateBioCounter();
      state.profileAvatarColor = safeAccent(me.avatarColor);
      updateAvatarColorSelection();
    }
    setAccountTab(state.accountTab, { render: false });
    if (state.accountTab === 'favorites') renderAccountFavorites();
  }

  function setAccountTab(tab, options = {}) {
    const { render = true } = options;
    state.accountTab = tab === 'favorites' ? 'favorites' : 'profile';
    $$('[data-account-tab]').forEach((button) => {
      const active = button.dataset.accountTab === state.accountTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('[data-account-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.accountPanel !== state.accountTab;
    });
    if (render && state.accountTab === 'favorites') renderAccountFavorites();
  }

  function renderAccountFavorites() {
    const container = $('#accountFavorites');
    const empty = $('#accountFavoritesEmpty');
    if (!container) return;
    if (!state.home) {
      container.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    const byId = new Map(state.home.software.map((item) => [item.id, item]));
    const favorites = Array.from(state.favoriteIds)
      .map((id) => byId.get(Number(id)))
      .filter(Boolean);
    if (!favorites.length) {
      container.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    container.innerHTML = favorites
      .map(
        (item) => `
        <button class="favorite-item" type="button" data-slug="${escapeHTML(item.slug)}" style="--app:${safeAccent(item.accent)}">
          <span class="favorite-icon">${iconSvg(item.icon)}</span>
          <span class="favorite-copy">
            <strong>${escapeHTML(item.name)}</strong>
            <small>${escapeHTML(item.tagline)}</small>
            <em>${escapeHTML(item.category)} · ${Number(item.rating).toFixed(1)} 分</em>
          </span>
          <span class="favorite-arrow" aria-hidden="true">↗</span>
        </button>`
      )
      .join('');
  }

  function updateBioCounter() {
    const bio = $('#profileBio');
    const counter = $('#bioCounter');
    if (bio && counter) counter.textContent = `${bio.value.length} / 120`;
  }

  function updateAvatarColorSelection() {
    $$('#avatarColorOptions button').forEach((button) => {
      const active =
        String(button.dataset.avatarColor).toUpperCase() ===
        String(state.profileAvatarColor).toUpperCase();
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const avatar = $('#accountAvatar');
    if (avatar) avatar.style.setProperty('--avatar-color', state.profileAvatarColor);
  }

  function showProfileMessage(message, success = false) {
    const node = $('#profileMessage');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    node.classList.toggle('is-success', success);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (!state.me) return;
    const name = ($('#profileName')?.value || '').trim();
    const bio = ($('#profileBio')?.value || '').trim();
    if (!name) {
      showProfileMessage('昵称不能为空。');
      return;
    }
    if (Array.from(name).length > 24) {
      showProfileMessage('昵称最多 24 个字符。');
      return;
    }
    if (Array.from(bio).length > 120) {
      showProfileMessage('个人简介最多 120 个字符。');
      return;
    }
    const button = $('#profileSubmit');
    if (button) {
      button.disabled = true;
      button.textContent = '保存中…';
    }
    try {
      const payload = await api('/api/me', {
        method: 'PATCH',
        body: {
          displayName: name,
          bio,
          avatarColor: state.profileAvatarColor
        }
      });
      state.me = payload.me;
      renderHeaderUser();
      renderAccount({ syncForm: true });
      showProfileMessage('已保存。', true);
      showToast('个人资料已更新');
    } catch (error) {
      showProfileMessage(error.message);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = '保存修改';
      }
    }
  }

  async function handleLogout() {
    if (!state.me) return;
    closeAccountMenu();
    const confirmed = await askConfirm({
      title: '要退出登录吗？',
      message: '收藏和评价会保留在你的账号中，下次登录仍可继续。',
      confirmText: '退出登录'
    });
    if (!confirmed) return;
    flushPrefsSync();
    try {
      await api('/api/auth/logout', { method: 'POST' });
      state.me = null;
      state.favoriteIds = new Set();
      state.pendingFavoriteId = null;
      if (accountDialog.open) accountDialog.close();
      renderHeaderUser();
      syncFavoriteDom();
      await loadHome();
      if (state.detailSlug) await refreshDetail({ preserveScroll: true });
      showToast('已退出登录');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  /* ------------------------------- 详情 ------------------------------- */

  function navigateToDetail(slug) {
    if (!slug) return;
    closeAccountMenu();
    if (accountDialog.open) accountDialog.close();
    const target = `#/app/${encodeURIComponent(slug)}`;
    if (location.hash === target) {
      if (detailLayer.hidden) openDetail(slug);
      return;
    }
    location.hash = target;
  }

  async function openDetail(slug, options = {}) {
    const { force = false } = options;
    if (!slug) return;
    const alreadyVisible = !detailLayer.hidden;
    if (!force && alreadyVisible && state.detailSlug === slug && state.detail) return;
    if (!alreadyVisible) {
      state.detailOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    detailLayer.hidden = false;
    updateBodyLock();
    state.detailSlug = slug;
    state.detail = null;
    state.reviewSort = 'helpful';
    state.composerRating = 5;
    detailScroll.scrollTop = 0;
    detailContent.innerHTML = `
      <div class="detail-loading">
        <span class="loading-orbit" aria-hidden="true"></span>
        <p>正在打开软件档案…</p>
      </div>`;
    document.title = '正在打开 · 震纤软件库';
    const requestId = ++state.detailRequest;
    try {
      const data = await api(`/api/software/${encodeURIComponent(slug)}`);
      if (requestId !== state.detailRequest || state.detailSlug !== slug) return;
      state.detail = data;
      state.composerRating = data.myComment ? data.myComment.rating : 5;
      renderDetail(data);
      document.title = `${data.software.name} · 震纤软件库`;
      detailClose.focus({ preventScroll: true });
    } catch (error) {
      if (requestId !== state.detailRequest) return;
      renderDetailError(error, slug);
      document.title = '暂时无法打开 · 震纤软件库';
    }
  }

  async function refreshDetail(options = {}) {
    const { preserveScroll = true } = options;
    const slug = state.detailSlug;
    if (!slug) return;
    const previousScroll = detailScroll.scrollTop;
    try {
      const data = await api(`/api/software/${encodeURIComponent(slug)}`);
      if (state.detailSlug !== slug) return;
      state.detail = data;
      state.composerRating = data.myComment ? data.myComment.rating : 5;
      renderDetail(data);
      if (preserveScroll) {
        requestAnimationFrame(() => {
          detailScroll.scrollTop = previousScroll;
        });
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function hideDetail() {
    if (detailLayer.hidden) return;
    detailLayer.hidden = true;
    state.detail = null;
    state.detailSlug = null;
    state.detailRequest += 1;
    document.title = BASE_TITLE;
    detailScroll.scrollTop = 0;
    if (location.hash.startsWith('#/app/')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    updateBodyLock();
    if (state.detailOpener && document.contains(state.detailOpener)) {
      try {
        state.detailOpener.focus({ preventScroll: true });
      } catch {
        /* 忽略无法聚焦的元素。 */
      }
    }
    state.detailOpener = null;
  }

  function renderDetail(data) {
    const software = data.software;
    const accent = safeAccent(software.accent);
    const comments = data.comments || [];
    const related = data.related || [];
    const favorite = Boolean(data.favorite);
    const myComment = data.myComment;
    const paragraphs = String(software.description || '')
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
      .join('');

    const facts = [
      ['开发者', software.developer],
      ['当前版本', software.version],
      ['安装大小', software.size],
      ['授权方式', software.license],
      ['支持平台', software.platforms.join(' / ')],
      ['收录时间', formatDate(software.addedAt)]
    ];

    detailContent.innerHTML = `
      <article class="detail-article">
        <header class="detail-hero" style="--app:${accent}">
          <div class="detail-breadcrumb">
            <button type="button" data-close-detail>软件库</button>
            <span>/</span>
            <span>${escapeHTML(software.category)}</span>
            <span>/</span>
            <strong>${escapeHTML(software.name)}</strong>
          </div>
          <div class="detail-head">
            <div class="detail-app-icon">${iconSvg(software.icon)}</div>
            <div class="detail-identity">
              <div class="detail-title-line">
                <h1 id="detailTitle">${escapeHTML(software.name)}</h1>
                ${software.featured ? '<span class="detail-badge">编辑精选</span>' : ''}
              </div>
              <p class="detail-tagline">${escapeHTML(software.tagline)}</p>
              <div class="detail-meta">
                <span class="rating-inline">${starIcon()}<strong>${Number(software.rating).toFixed(1)}</strong><em>${software.commentCount} 条评价</em></span>
                <span class="detail-sep"></span>
                <span>${escapeHTML(software.version)}</span>
                <span class="detail-sep"></span>
                <span>${escapeHTML(software.platforms.join(' · '))}</span>
              </div>
            </div>
            <div class="detail-score">
              <span class="detail-score-label">用户评分</span>
              <strong>${Number(software.rating).toFixed(1)}</strong>
              <span class="star-row">${starRow(software.rating)}</span>
            </div>
          </div>
          <div class="detail-actions">
            <a class="button button--primary" href="${escapeHTML(safeUrl(software.website))}" target="_blank" rel="noopener noreferrer" data-acquire="${software.id}">
              获取软件 <span>↗</span>
            </a>
            <button class="button button--ghost detail-fav${favorite ? ' is-active' : ''}" type="button" data-favorite-id="${software.id}" data-favorite-name="${escapeHTML(software.name)}" aria-pressed="${favorite}">
              ${heartIcon()}<span>${favorite ? '已收藏' : '收藏'}</span>
            </button>
            <p class="detail-safety">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3 5 6v5c0 4.7 3 8.1 7 10 4-1.9 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
              前往开发者官网 · 安全外链
            </p>
          </div>
          <span class="detail-hero-index" aria-hidden="true">ZX / ${String(software.id).padStart(2, '0')}</span>
        </header>

        <div class="detail-body">
          <div class="detail-main">
            <section class="detail-section">
              <p class="section-kicker">ABOUT</p>
              <h2>关于这款软件</h2>
              <div class="detail-description">${paragraphs}</div>
            </section>

            <section class="detail-section">
              <p class="section-kicker">WHY IT STAYS</p>
              <h2>为什么值得留在桌面</h2>
              <ol class="highlights-list">
                ${software.highlights
                  .map(
                    (highlight, index) => `
                  <li>
                    <span>${String(index + 1).padStart(2, '0')}</span>
                    <p>${escapeHTML(highlight)}</p>
                  </li>`
                  )
                  .join('')}
              </ol>
            </section>

            <section class="detail-section review-section">
              <div class="review-heading">
                <div>
                  <p class="section-kicker">REVIEWS</p>
                  <h2>真实评价 <span class="review-count">${comments.length}</span></h2>
                </div>
                <label class="review-sort">
                  <span>排序</span>
                  <select id="reviewSort" aria-label="评价排序">
                    <option value="helpful"${state.reviewSort === 'helpful' ? ' selected' : ''}>最有帮助</option>
                    <option value="newest"${state.reviewSort === 'newest' ? ' selected' : ''}>最新发布</option>
                  </select>
                </label>
              </div>
              <div id="composerMount">${renderComposer(myComment)}</div>
              <div class="comments-list" id="commentsList">${commentsMarkup(getSortedComments(comments))}</div>
            </section>

            ${
              related.length
                ? `<section class="related-section">
                    <p class="section-kicker">KEEP EXPLORING</p>
                    <h2>同类工具</h2>
                    <div class="related-grid">
                      ${related
                        .map(
                          (item) => `
                        <button class="related-card" type="button" data-slug="${escapeHTML(item.slug)}" style="--app:${safeAccent(item.accent)}">
                          <span class="related-icon">${iconSvg(item.icon)}</span>
                          <strong>${escapeHTML(item.name)}</strong>
                          <small>${escapeHTML(item.category)} · ${Number(item.rating).toFixed(1)} 分</small>
                        </button>`
                        )
                        .join('')}
                    </div>
                  </section>`
                : ''
            }
          </div>

          <aside class="detail-side">
            <div class="side-card">
              <div class="side-card-head">
                <span>应用信息</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>
              </div>
              <dl class="app-facts">
                ${facts
                  .map(
                    ([term, value]) => `
                  <div><dt>${escapeHTML(term)}</dt><dd>${escapeHTML(value)}</dd></div>`
                  )
                  .join('')}
              </dl>
            </div>
            <div class="side-note" style="--app:${accent}">
              <p>编辑手记</p>
              <blockquote>“${escapeHTML(software.editorNote)}”</blockquote>
              <span>— 震纤编辑部</span>
            </div>
            <div class="side-tags">
              ${software.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}
            </div>
          </aside>
        </div>
      </article>`;
  }

  function renderDetailError(error, slug) {
    detailContent.innerHTML = `
      <div class="detail-loading">
        <span class="detail-error-mark" aria-hidden="true">!</span>
        <p>${escapeHTML(error.message || '暂时无法打开这个软件档案。')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">
          <button class="button button--primary" type="button" data-detail-retry="${escapeHTML(slug)}">再试一次</button>
          <button class="button button--ghost" type="button" data-close-detail>返回软件库</button>
        </div>
      </div>`;
  }

  function renderComposer(myComment) {
    if (!state.me) {
      return `
        <div class="review-guest">
          <span class="review-guest-icon">${messageIcon()}</span>
          <div class="review-guest-copy">
            <strong>登录后，留下你的真实体验</strong>
            <p>一人一评，可以随时修改，也可以删除自己的评价。</p>
          </div>
          <button class="button button--primary" type="button" data-open-auth>登录评价</button>
        </div>`;
    }
    const rating = myComment ? myComment.rating : state.composerRating;
    const content = myComment ? myComment.content : '';
    const length = Array.from(content).length;
    return `
      <form class="review-composer" id="reviewForm" novalidate>
        <div class="composer-top">
          <span class="composer-user">
            <span class="avatar" style="--avatar-color:${safeAccent(state.me.avatarColor)}">${escapeHTML(initials(state.me.displayName))}</span>
            以 ${escapeHTML(state.me.displayName)} 的身份评价
          </span>
          <div class="star-picker" role="group" aria-label="选择评分">
            ${[1, 2, 3, 4, 5]
              .map(
                (value) => `
              <button class="${rating >= value ? 'is-on' : ''}" type="button" data-rating="${value}" aria-label="${value} 星" aria-pressed="${rating === value}">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${STAR_PATH}"/></svg>
              </button>`
              )
              .join('')}
            <span class="star-picker-label" id="ratingLabel">${rating} 星 · ${RATING_LABELS[rating]}</span>
          </div>
        </div>
        <textarea class="composer-textarea" id="reviewContent" maxlength="500" placeholder="它哪里打动了你？有哪些需要注意的短板？写点对后来者真正有用的东西。" required>${escapeHTML(content)}</textarea>
        <p class="composer-error" id="composerError" hidden></p>
        <div class="composer-footer">
          <span class="composer-hint"><span id="reviewCount">${length}</span> / 500 · ${myComment ? '提交会更新你已有的评价' : '一人一评，可随时修改'}</span>
          <button class="composer-submit" type="submit">${myComment ? '更新评价' : '发布评价'}</button>
        </div>
      </form>`;
  }

  function starRow(rating) {
    const rounded = Math.round(Number(rating) || 0);
    return [1, 2, 3, 4, 5]
      .map(
        (index) =>
          `<svg class="${index <= rounded ? 'is-on' : ''}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`
      )
      .join('');
  }

  function getSortedComments(commentsArg) {
    const comments = [...(commentsArg || (state.detail ? state.detail.comments : []) || [])];
    if (state.reviewSort === 'newest') {
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      comments.sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return comments;
  }

  function commentsMarkup(comments) {
    if (!comments.length) {
      return '<div class="comments-empty">还没有人评价。成为第一个分享体验的人吧。</div>';
    }
    return comments
      .map(
        (comment) => `
      <article class="comment" data-comment="${comment.id}">
        <span class="avatar" style="--avatar-color:${safeAccent(comment.user.avatarColor)}">${escapeHTML(initials(comment.user.displayName))}</span>
        <div class="comment-main">
          <div class="comment-head">
            <div class="comment-user">
              <strong>${escapeHTML(comment.user.displayName)}</strong>
              ${comment.isMine ? '<span class="comment-me">我</span>' : ''}
              <span class="comment-time" title="${escapeHTML(new Date(comment.createdAt).toLocaleString('zh-CN'))}">${escapeHTML(relativeTime(comment.createdAt))}${comment.isEdited ? ' · 已编辑' : ''}</span>
            </div>
            <span class="comment-stars" aria-label="${comment.rating} 星">${starRow(comment.rating)}</span>
          </div>
          <p class="comment-content">${escapeHTML(comment.content)}</p>
          <div class="comment-actions">
            <button class="comment-like${comment.liked ? ' is-liked' : ''}" type="button" data-like-id="${comment.id}" aria-pressed="${comment.liked}" aria-label="${comment.liked ? '取消标记有用' : '标记为有用'}">
              ${heartIcon()}<span>${comment.likeCount > 0 ? comment.likeCount : '有用'}</span>
            </button>
            ${
              comment.isMine
                ? `<button class="comment-delete" type="button" data-delete-comment="${comment.id}" aria-label="删除这条评价">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 13h10l1-13"/></svg>
                    删除
                  </button>`
                : ''
            }
          </div>
        </div>
      </article>`
      )
      .join('');
  }

  function updateStarPicker(rating) {
    state.composerRating = rating;
    $$('.star-picker [data-rating]', detailContent).forEach((button) => {
      const active = Number(button.dataset.rating) <= rating;
      button.classList.toggle('is-on', active);
      button.setAttribute('aria-pressed', String(Number(button.dataset.rating) === rating));
    });
    const label = $('#ratingLabel');
    if (label) label.textContent = `${rating} 星 · ${RATING_LABELS[rating]}`;
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    if (!state.me) {
      openAuth('login');
      return;
    }
    if (!state.detail) return;
    const textarea = $('#reviewContent');
    const errorNode = $('#composerError');
    const content = (textarea ? textarea.value : '').trim();
    const length = Array.from(content).length;
    if (length < 2) {
      if (errorNode) {
        errorNode.textContent = '至少写 2 个字符，让评价对别人有帮助。';
        errorNode.hidden = false;
      }
      return;
    }
    if (length > 500) {
      if (errorNode) {
        errorNode.textContent = '评价最多 500 个字符。';
        errorNode.hidden = false;
      }
      return;
    }
    if (errorNode) errorNode.hidden = true;
    const submit = $('.composer-submit', $('#reviewForm'));
    if (submit) {
      submit.disabled = true;
      submit.textContent = '提交中…';
    }
    try {
      const payload = await api(`/api/software/${state.detail.software.id}/comments`, {
        method: 'POST',
        body: { content, rating: state.composerRating }
      });
      showToast(payload.updated ? '评价已更新' : '评价已发布');
      await refreshDetail({ preserveScroll: true });
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error.message;
        errorNode.hidden = false;
      }
      if (submit) {
        submit.disabled = false;
        submit.textContent = state.detail && state.detail.myComment ? '更新评价' : '发布评价';
      }
    }
  }

  async function toggleCommentLike(commentId) {
    if (!state.me) {
      openAuth('login');
      return;
    }
    if (!state.detail) return;
    const comment = state.detail.comments.find((item) => item.id === commentId);
    if (!comment) return;
    try {
      const payload = await api(`/api/comments/${commentId}/like`, { method: 'POST' });
      comment.liked = Boolean(payload.liked);
      comment.likeCount = Number(payload.likeCount) || 0;
      const list = $('#commentsList');
      if (list) list.innerHTML = commentsMarkup(getSortedComments(state.detail.comments));
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteOwnComment(commentId) {
    if (!state.detail) return;
    const confirmed = await askConfirm({
      title: '删除这条评价？',
      message: '删除后无法恢复，你的评分也会从这款软件的总分中移除。',
      confirmText: '删除评价'
    });
    if (!confirmed) return;
    try {
      await api(`/api/comments/${commentId}`, { method: 'DELETE' });
      showToast('评价已删除');
      await refreshDetail({ preserveScroll: true });
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function recordAcquire(id) {
    if (!id) return;
    fetch(`/api/software/${Number(id)}/acquire`, {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true
    }).catch(() => {
      /* 访问计数失败不应影响用户前往官网。 */
    });
  }

  /* ------------------------------ 确认框 ------------------------------ */

  function askConfirm(options = {}) {
    const {
      title = '确定要继续吗？',
      message = '这个操作无法撤销。',
      confirmText = '确认'
    } = options;
    if (state.confirmResolver) {
      const previous = state.confirmResolver;
      state.confirmResolver = null;
      previous(false);
    }
    const titleNode = $('#confirmTitle');
    const messageNode = $('#confirmMessage');
    const okNode = $('#confirmOk');
    if (titleNode) titleNode.textContent = title;
    if (messageNode) messageNode.textContent = message;
    if (okNode) okNode.textContent = confirmText;
    if (!confirmDialog.open) confirmDialog.showModal();
    updateBodyLock();
    const cancel = $('#confirmCancel');
    if (cancel) setTimeout(() => cancel.focus({ preventScroll: true }), 50);
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function settleConfirm(value) {
    const resolve = state.confirmResolver;
    state.confirmResolver = null;
    if (confirmDialog.open) confirmDialog.close();
    if (resolve) resolve(value);
  }

  /* ------------------------------ 滚动交互 ------------------------------ */

  function setActiveNav(target) {
    $$('.nav-link[data-scroll-target]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.scrollTarget === target);
    });
  }

  function scrollToTarget(target) {
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: state.prefs.motion === 'off' ? 'auto' : 'smooth' });
      setActiveNav('top');
      return;
    }
    const element = document.getElementById(target);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: state.prefs.motion === 'off' ? 'auto' : 'smooth' });
    setActiveNav(target);
  }

  function updateScrollUI() {
    const header = $('#siteHeader');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    const library = $('#library');
    if (!library) return;
    if (window.scrollY + 180 >= library.offsetTop) {
      setActiveNav('library');
    } else {
      setActiveNav('top');
    }
  }

  /* ------------------------------- 路由 ------------------------------- */

  function handleRoute() {
    const match = location.hash.match(/^#\/app\/([^/?#]+)/);
    if (!match) {
      if (!detailLayer.hidden) hideDetail();
      return;
    }
    let slug;
    try {
      slug = decodeURIComponent(match[1]);
    } catch {
      showToast('软件地址格式不正确。', 'error');
      return;
    }
    openDetail(slug);
  }

  /* ---------------------------- 事件绑定 ---------------------------- */

  function bindEvents() {
    // 搜索
    const debouncedSearch = debounce(() => {
      state.filters.query = (searchInput?.value || '').trim();
      if (state.home) renderLibrary();
    }, 160);

    if (searchInput) {
      searchInput.addEventListener('input', debouncedSearch);
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          searchInput.value = '';
          state.filters.query = '';
          if (state.home) renderLibrary();
        }
      });
    }

    $('#searchForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      state.filters.query = (searchInput?.value || '').trim();
      if (state.home) renderLibrary();
      scrollToTarget('library');
    });

    $$('[data-query]').forEach((button) => {
      button.addEventListener('click', () => {
        const query = button.dataset.query || '';
        if (searchInput) searchInput.value = query;
        state.filters.query = query;
        if (state.home) renderLibrary();
        scrollToTarget('library');
      });
    });

    // 筛选
    $('#categoryTabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.filters.category = button.dataset.category;
      if (state.home) renderLibrary();
    });

    $('#platformTabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-platform]');
      if (!button) return;
      state.filters.platform = button.dataset.platform;
      if (state.home) renderLibrary();
    });

    $('#sortSelect')?.addEventListener('change', (event) => {
      state.filters.sort = event.target.value;
      if (state.home) renderLibrary();
    });

    $('#clearFilters')?.addEventListener('click', resetFilters);
    $('#emptyReset')?.addEventListener('click', resetFilters);

    // 页面锚点
    $$('[data-scroll-target]').forEach((button) => {
      button.addEventListener('click', () => {
        scrollToTarget(button.dataset.scrollTarget);
      });
    });

    // 主题与偏好
    $('#themeButton')?.addEventListener('click', () => {
      const resolved = document.documentElement.getAttribute('data-theme');
      setPreference('theme', resolved === 'dark' ? 'light' : 'dark');
    });

    $('#prefsButton')?.addEventListener('click', openPreferences);
    $('#footerPrefs')?.addEventListener('click', openPreferences);
    $$('[data-open-prefs]').forEach((button) => {
      button.addEventListener('click', openPreferences);
    });

    $$('[data-pref-theme]').forEach((button) => {
      button.addEventListener('click', () => setPreference('theme', button.dataset.prefTheme));
    });
    $$('[data-pref-accent]').forEach((button) => {
      button.addEventListener('click', () => setPreference('accent', button.dataset.prefAccent));
    });
    $$('[data-pref-density]').forEach((button) => {
      button.addEventListener('click', () => setPreference('density', button.dataset.prefDensity));
    });
    $$('[data-pref-motion]').forEach((button) => {
      button.addEventListener('click', () => setPreference('motion', button.dataset.prefMotion));
    });

    $('#resetPrefs')?.addEventListener('click', () => {
      state.prefs = { ...DEFAULT_PREFS };
      applyVisualPrefs();
      updatePrefControls();
      queuePrefsSync();
      showToast('已恢复默认外观');
    });

    $('#prefsDone')?.addEventListener('click', () => prefsDialog.close());

    // 登录与账号
    $('#loginButton')?.addEventListener('click', () => openAuth('login'));
    $('#navFavorites')?.addEventListener('click', openFavorites);
    $('#footerFavorites')?.addEventListener('click', openFavorites);
    $('#footerLogin')?.addEventListener('click', () => {
      if (state.me) openAccount('profile');
      else openAuth('login');
    });

    $$('[data-auth-mode]').forEach((button) => {
      button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
    });
    $('#authForm')?.addEventListener('submit', handleAuthSubmit);
    $('#passwordToggle')?.addEventListener('click', () => {
      const password = $('#authPassword');
      const toggle = $('#passwordToggle');
      if (!password || !toggle) return;
      const reveal = password.type === 'password';
      password.type = reveal ? 'text' : 'password';
      toggle.textContent = reveal ? '隐藏' : '显示';
    });
    $('#demoButton')?.addEventListener('click', () => {
      setAuthMode('login');
      const username = $('#authUsername');
      const password = $('#authPassword');
      if (username) username.value = 'demo';
      if (password) password.value = 'demo1234';
      const form = $('#authForm');
      if (form) form.requestSubmit();
    });

    $('#accountButton')?.addEventListener('click', toggleAccountMenu);
    $('#menuProfile')?.addEventListener('click', () => {
      closeAccountMenu();
      openAccount('profile');
    });
    $('#menuFavorites')?.addEventListener('click', () => {
      closeAccountMenu();
      openAccount('favorites');
    });
    $('#menuPrefs')?.addEventListener('click', () => {
      closeAccountMenu();
      openPreferences();
    });
    $('#logoutButton')?.addEventListener('click', handleLogout);
    $('#accountLogoutButton')?.addEventListener('click', handleLogout);
    $('#accountPrefsButton')?.addEventListener('click', openPreferences);

    $$('[data-account-tab]').forEach((button) => {
      button.addEventListener('click', () => setAccountTab(button.dataset.accountTab));
    });
    $('#profileForm')?.addEventListener('submit', handleProfileSubmit);
    $('#profileBio')?.addEventListener('input', updateBioCounter);
    $('#avatarColorOptions')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar-color]');
      if (!button) return;
      state.profileAvatarColor = safeAccent(button.dataset.avatarColor);
      updateAvatarColorSelection();
    });
    $('#favoritesBrowse')?.addEventListener('click', () => {
      accountDialog.close();
      scrollToTarget('library');
    });

    // 详情
    $('#detailClose')?.addEventListener('click', hideDetail);
    $('#detailLayer')?.addEventListener('click', (event) => {
      if (event.target === $('#detailLayer') || event.target.closest('[data-close-detail]')) {
        hideDetail();
      }
    });

    detailContent?.addEventListener('submit', (event) => {
      if (event.target.id === 'reviewForm') handleReviewSubmit(event);
    });

    detailContent?.addEventListener('input', (event) => {
      if (event.target.id === 'reviewContent') {
        const counter = $('#reviewCount');
        if (counter) counter.textContent = String(Array.from(event.target.value).length);
      }
    });

    detailContent?.addEventListener('change', (event) => {
      if (event.target.id === 'reviewSort') {
        state.reviewSort = event.target.value === 'newest' ? 'newest' : 'helpful';
        const list = $('#commentsList');
        if (list) list.innerHTML = commentsMarkup(getSortedComments());
      }
    });

    detailContent?.addEventListener('click', (event) => {
      const star = event.target.closest('[data-rating]');
      if (star) {
        updateStarPicker(Number(star.dataset.rating));
        return;
      }
      const like = event.target.closest('[data-like-id]');
      if (like) {
        toggleCommentLike(Number(like.dataset.likeId));
        return;
      }
      const remove = event.target.closest('[data-delete-comment]');
      if (remove) {
        deleteOwnComment(Number(remove.dataset.deleteComment));
        return;
      }
      const acquire = event.target.closest('[data-acquire]');
      if (acquire) recordAcquire(Number(acquire.dataset.acquire));
    });

    // 全局点击代理：收藏、详情入口、登录提示、重试
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest('[data-close-detail]')) {
        event.preventDefault();
        hideDetail();
        return;
      }

      const retry = target.closest('[data-detail-retry]');
      if (retry) {
        event.preventDefault();
        openDetail(retry.dataset.detailRetry, { force: true });
        return;
      }

      if (target.closest('[data-open-auth]')) {
        event.preventDefault();
        openAuth('login');
        return;
      }

      if (target.closest('[data-open-prefs]')) {
        event.preventDefault();
        openPreferences();
        return;
      }

      const favorite = target.closest('[data-favorite-id]');
      if (favorite) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(Number(favorite.dataset.favoriteId));
        return;
      }

      const slugTrigger = target.closest('[data-slug]');
      if (slugTrigger) {
        event.preventDefault();
        navigateToDetail(slugTrigger.dataset.slug);
        if (accountMenu && !accountMenu.hidden) closeAccountMenu();
        return;
      }

      if (accountMenu && !accountMenu.hidden && !target.closest('#userArea')) {
        closeAccountMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      const typing =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;

      if (event.key === 'Escape') {
        if (!detailLayer.hidden && !document.querySelector('dialog[open]')) {
          hideDetail();
        }
        if (accountMenu && !accountMenu.hidden) closeAccountMenu();
        return;
      }

      if (
        event.key === '/' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !typing &&
        detailLayer.hidden &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        searchInput?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: state.prefs.motion === 'off' ? 'auto' : 'smooth' });
        setActiveNav('top');
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && !typing) {
        const interactive = target?.closest('button, a, input, textarea, select');
        if (interactive) return;
        const trigger = target?.closest('[data-slug][role="button"]');
        if (trigger) {
          event.preventDefault();
          navigateToDetail(trigger.dataset.slug);
        }
      }
    });

    // 原生 dialog 的关闭与遮罩点击
    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', () => {
        updateBodyLock();
        if (dialog === confirmDialog && state.confirmResolver) {
          const resolve = state.confirmResolver;
          state.confirmResolver = null;
          resolve(false);
        }
      });
    });

    authDialog?.addEventListener('close', () => {
      if (!state.authSucceeded) {
        state.pendingFavoriteId = null;
      }
      state.authSucceeded = false;
      const password = $('#authPassword');
      if (password) password.type = 'password';
      const toggle = $('#passwordToggle');
      if (toggle) toggle.textContent = '显示';
      hideAuthMessage();
      updateBodyLock();
    });

    prefsDialog?.addEventListener('close', () => {
      flushPrefsSync();
      updateBodyLock();
    });

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = document.getElementById(button.dataset.closeDialog);
        if (dialog && dialog.open) dialog.close();
      });
    });

    $('#confirmCancel')?.addEventListener('click', () => settleConfirm(false));
    $('#confirmOk')?.addEventListener('click', () => settleConfirm(true));

    // 滚动与路由
    let rafScheduled = false;
    window.addEventListener(
      'scroll',
      () => {
        if (rafScheduled) return;
        rafScheduled = true;
        requestAnimationFrame(() => {
          updateScrollUI();
          rafScheduled = false;
        });
      },
      { passive: true }
    );

    window.addEventListener('hashchange', handleRoute);

    const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
    systemMedia.addEventListener?.('change', () => {
      if (state.prefs.theme === 'system') applyVisualPrefs({ store: false });
    });
  }

  async function openPreferences() {
    closeAccountMenu();
    updatePrefControls();
    setPrefsSync(state.me ? '已同步到你的账户' : '偏好保存在本机');
    openDialog(prefsDialog);
  }

  function openFavorites() {
    if (state.me) openAccount('favorites');
    else openAuth('login');
  }

  /* ------------------------------- 启动 ------------------------------- */

  async function init() {
    state.prefs = normalizePrefs(window.__ZX_INITIAL_PREFS__ || DEFAULT_PREFS);
    applyVisualPrefs({ store: false });
    updatePrefControls();
    setAuthMode('login');
    bindEvents();
    setActiveNav('top');
    updateScrollUI();
    await loadHome({ applyServerPrefs: true });
    handleRoute();
    if (state.detailSlug && document.querySelector('dialog[open]')) updateBodyLock();
  }

  init();
})();
