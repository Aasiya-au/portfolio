import { CONFIG } from './config.js';

const API = import.meta.env.VITE_API_URL || '';
const FIRST = CONFIG.name.split(' ')[0];
const SUGGESTIONS = ['What games has she made?', 'Tell me about Veil of Secrets', 'What are her skills?', 'How can I contact her?'];
const LANGS = [['en-US', 'English'], ['ur-PK', 'اردو'], ['es-ES', 'Español'], ['fr-FR', 'Français']];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

export function initChat() {
  const fab = document.createElement('button');
  fab.id = 'chat-fab';
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'chat');
  fab.textContent = `Ask about ${FIRST}`;

  const panel = document.createElement('section');
  panel.id = 'chat';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', `Chat with ${FIRST}'s portfolio assistant`);
  panel.innerHTML = `
    <header><span class="who">${FIRST}'s assistant</span><button type="button" class="chat-close">Close</button></header>
    <div class="chat-tools">
      <label>Voice language <select class="lang" aria-label="Voice language">${LANGS.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></label>
      ${synth ? '<button type="button" class="speak" aria-pressed="false">Read answers aloud</button>' : ''}
    </div>
    <div class="chat-log" role="log" aria-live="polite"></div>
    <div class="chat-suggest"></div>
    <form class="chat-form" autocomplete="off">
      ${SR ? '<button type="button" class="mic" aria-pressed="false" aria-label="Speak your question">Mic</button>' : ''}
      <input type="text" maxlength="500" placeholder="Ask about her projects, skills..." aria-label="Your question">
      <button type="submit" class="send">Send</button>
    </form>
    <p class="chat-note">AI answers from her portfolio only. It can still make mistakes. You can ask in any language.</p>`;
  document.body.append(fab, panel);

  const log = panel.querySelector('.chat-log');
  const input = panel.querySelector('input');
  const sendBtn = panel.querySelector('.send');
  const suggest = panel.querySelector('.chat-suggest');
  const langSel = panel.querySelector('.lang');
  const speakBtn = panel.querySelector('.speak');
  const micBtn = panel.querySelector('.mic');
  const history = [];
  let busy = false, greeted = false, speaking = false, rec = null;

  const gesture = (name) => window.dispatchEvent(new CustomEvent('portfolio:gesture', { detail: name }));
  const track = (name) => window.dispatchEvent(new CustomEvent('portfolio:track', { detail: name }));

  function speak(text) {
    if (!synth || !speaking) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langSel.value;
    synth.speak(u);
  }
  speakBtn?.addEventListener('click', () => {
    speaking = !speaking;
    speakBtn.setAttribute('aria-pressed', String(speaking));
    if (!speaking) synth.cancel();
  });

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (rec) return rec.stop();
      rec = new SR();
      rec.lang = langSel.value;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      micBtn.setAttribute('aria-pressed', 'true');
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        input.value = '';
        ask(text);
      };
      rec.onend = rec.onerror = () => {
        micBtn.setAttribute('aria-pressed', 'false');
        rec = null;
      };
      rec.start();
    });
  }

  function add(role, text, sources = []) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const p = document.createElement('p');
    p.textContent = text; // textContent: model output can never inject HTML
    msg.appendChild(p);
    if (sources.length) {
      const row = document.createElement('div');
      row.className = 'cites';
      sources.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.label;
        b.addEventListener('click', () => {
          close(false);
          window.dispatchEvent(new CustomEvent('portfolio:goto', { detail: { section: s.section, ref: s.ref } }));
        });
        row.appendChild(b);
      });
      msg.appendChild(row);
    }
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
    return msg;
  }

  async function ask(question) {
    question = question.trim();
    if (!question || busy) return;
    busy = true;
    sendBtn.disabled = true;
    suggest.hidden = true;
    add('you', question);
    track('chat_question');
    const typing = add('bot typing', '...');
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history: history.slice(-6) }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok) {
        add('bot', data.error || 'Something went wrong. Please try again.');
      } else {
        add('bot', data.answer, data.sources || []);
        history.push({ role: 'user', text: question }, { role: 'bot', text: data.answer });
        speak(data.answer);
        gesture('nod');
      }
    } catch {
      typing.remove();
      add('bot', "I can't reach my brain right now. Please try again soon, or use the contact form.");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    track('chat_open');
    if (!greeted) {
      greeted = true;
      add('bot', `Hi! I'm ${FIRST}'s portfolio assistant. Ask me about her games, skills, awards, or how to reach her.`);
      SUGGESTIONS.forEach((q) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = q;
        b.addEventListener('click', () => ask(q));
        suggest.appendChild(b);
      });
      gesture('wave');
    }
    input.focus();
  }
  function close(returnFocus = true) {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    synth?.cancel();
    rec?.stop();
    if (returnFocus) fab.focus();
  }

  fab.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.querySelector('.chat-close').addEventListener('click', () => close());
  panel.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  panel.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    ask(q);
  });
}
