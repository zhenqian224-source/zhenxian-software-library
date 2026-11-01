(function () {
  'use strict';

  var defaults = {
    theme: 'dark',
    accent: 'lime',
    density: 'comfortable',
    motion: 'on'
  };
  var themes = ['dark', 'light', 'system'];
  var accents = ['lime', 'mint', 'coral', 'sky', 'violet', 'amber'];
  var densities = ['comfortable', 'compact'];
  var motions = ['on', 'off'];
  var prefs = Object.assign({}, defaults);

  try {
    var cached = JSON.parse(window.localStorage.getItem('zx:prefs') || 'null');
    if (cached && typeof cached === 'object') {
      if (themes.indexOf(cached.theme) >= 0) prefs.theme = cached.theme;
      if (accents.indexOf(cached.accent) >= 0) prefs.accent = cached.accent;
      if (densities.indexOf(cached.density) >= 0) prefs.density = cached.density;
      if (motions.indexOf(cached.motion) >= 0) prefs.motion = cached.motion;
    }
  } catch (error) {
    /* localStorage 不可用时使用默认值。 */
  }

  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var resolvedTheme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;
  var root = document.documentElement;

  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-theme-pref', prefs.theme);
  root.setAttribute('data-accent', prefs.accent);
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-motion', prefs.motion);
  root.style.colorScheme = resolvedTheme;

  window.__ZX_INITIAL_PREFS__ = prefs;

  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#080a0c' : '#f2f1ea');
  }
})();
