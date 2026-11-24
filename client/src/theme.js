import { setNight } from './scroll.js';

const KEY = 'portfolio-mode';

// Day/night toggle: flips the page colours (CSS) and darkens the 3D sky + lights.
export function initTheme() {
  let mode = null;
  try { mode = localStorage.getItem(KEY); } catch { /* storage blocked: fine */ }
  if (mode !== 'dark' && mode !== 'light') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const btn = document.createElement('button');
  btn.id = 'mode-toggle';
  btn.type = 'button';
  const apply = (m, instant) => {
    document.documentElement.dataset.mode = m;
    btn.textContent = m === 'dark' ? 'Day mode' : 'Night mode';
    setNight(m === 'dark', instant);
  };
  btn.addEventListener('click', () => {
    mode = mode === 'dark' ? 'light' : 'dark';
    apply(mode, false);
    try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  });
  document.body.appendChild(btn);
  apply(mode, true);
}
