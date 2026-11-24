// Privacy-friendly counters: sends only an event NAME (e.g. "section_skills"). No cookies, no personal data.
const API = import.meta.env.VITE_API_URL || '';
const OK = /^(pageview|chat_open|chat_question|contact_sent|section_[a-z]+|project_[a-z0-9-]+)$/;
const sent = new Set();

export function initAnalytics() {
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return; // respect Do Not Track
  const send = (name, once) => {
    if (!OK.test(name) || (once && sent.has(name))) return;
    if (once) sent.add(name);
    try {
      navigator.sendBeacon(`${API}/api/event`, new Blob([JSON.stringify({ name })], { type: 'application/json' }));
    } catch { /* analytics must never break the site */ }
  };
  send('pageview', true);
  window.addEventListener('portfolio:section', (e) => send(`section_${e.detail.id}`, true));
  window.addEventListener('portfolio:track', (e) => send(String(e.detail), /^(section_|project_)/.test(e.detail)));
}
