/* light / dark mode. the inline script in <head> sets the first theme
   before paint (saved choice, else the system setting); this module
   runs the nav toggle, remembers the choice, follows the system while
   no choice is saved, and fires `theme:change` so the canvases re-ink. */

const KEY = 'diya-wiki-theme';
const root = document.documentElement;
const system = window.matchMedia('(prefers-color-scheme: dark)');

function saved() {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch (e) { return null; }
}

export function currentTheme() {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme, button) {
  root.setAttribute('data-theme', theme);
  if (button) {
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
}

export function initTheme() {
  const button = document.getElementById('themeToggle');
  setTheme(currentTheme(), button); // sync the button with what <head> chose

  if (button) {
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* lasts this visit only */ }
      setTheme(next, button);
    });
  }

  // no saved choice yet: keep following the system setting
  system.addEventListener('change', (e) => {
    if (!saved()) setTheme(e.matches ? 'dark' : 'light', button);
  });
}
