import { ScrollTrigger } from 'gsap/ScrollTrigger';
import profile from '../../content/profile.json';
import projects from '../../content/projects.json';
import skills from '../../content/skills.json';
import education from '../../content/education.json';

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const chips = (arr) => arr.map((t) => `<span class="chip">${esc(t)}</span>`).join('');
const projectMedia = (id, file) => `/media/projects/${id}/${file}`;
const $ = (sel) => document.querySelector(sel);
let refreshTimer;
const relayout = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
};

function ytId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function videoHtml({ src, url, poster }) {
  if (src) return `<video controls preload="metadata"${poster ? ` poster="${esc(poster)}"` : ''}><source src="${esc(src)}"></video>`;
  const id = ytId(url);
  if (id)
    return `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video player" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  if (url) return `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Watch the video</a>`;
  return '';
}

// ---------- About ----------
function renderAbout() {
  const f = profile.favourites || {};
  const line = (label, arr) =>
    arr && arr.length ? `<p class="fav"><strong>${label}</strong> ${esc(arr.join(', '))}</p>` : '';
  $('#about-mount').innerHTML = `
    <p class="about-text">${esc(profile.summary)}</p>
    <p class="doodle-label">Things I love</p>
    <div>${chips(profile.interests.map(cap))}</div>`;
}

// ---------- Skills ----------
const SKILL_LABELS = {
  programming_languages: 'Languages',
  game_engines: 'Game engines',
  libraries_and_frameworks: 'Libraries and frameworks',
  art_and_animation: 'Art and animation',
  databases: 'Databases',
  tools: 'Tools',
  core_strengths: 'Core strengths',
};
function renderSkills() {
  $('#skills-mount').innerHTML = Object.entries(skills)
    .map(([key, list]) => `<div class="skill-group"><h3>${esc(SKILL_LABELS[key] || cap(key.replace(/_/g, ' ')))}</h3><div>${chips(list)}</div></div>`)
    .join('');
}

// ---------- Projects ----------
const CATS = [['all', 'All'], ['game', 'Games'], ['animation', 'Animation'], ['software', 'Software']];
const state = { cat: 'all', q: '', sort: 'newest' };
const startTs = (p) => {
  const m = String(p.dates || '').match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  return m ? Date.parse(`${m[1]} 1, ${m[2]}`) : NaN;
};
const SORTS = {
  newest: (a, b) => (startTs(b) || -Infinity) - (startTs(a) || -Infinity),
  oldest: (a, b) => (startTs(a) || Infinity) - (startTs(b) || Infinity),
  az: (a, b) => a.title.localeCompare(b.title),
  awards: (a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0) || SORTS.newest(a, b),
};
let hoverHorror = false;
let modalHorror = false;
const syncHorror = () => window.dispatchEvent(new CustomEvent('portfolio:horror', { detail: hoverHorror || modalHorror }));

function projectCard(p) {
  const cover = p.media?.cover;
  return `<button class="proj" data-id="${esc(p.id)}"${p.mood === 'horror' ? ' data-horror' : ''}>
    <span class="thumb cat-${esc(p.category)}${cover ? '' : ' ph'}" data-letter="${esc(p.title[0])}">${
      cover ? `<img src="${projectMedia(p.id, cover)}" alt="" loading="lazy">` : ''
    }${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</span>
    <span class="body">
      <span class="ptitle">${esc(p.title)}</span>
      <span class="meta">${esc([p.dates, p.tools.join(', ')].filter(Boolean).join(' | '))}</span>
    </span></button>`;
}

function renderProjects() {
  const mount = $('#projects-mount');
  mount.innerHTML = `
    <div class="toolbar" role="group" aria-label="Filter projects">
      ${CATS.map(([k, label]) => `<button class="filter" data-cat="${k}" aria-pressed="${k === 'all'}">${label}</button>`).join('')}
      <select class="sort" aria-label="Sort projects">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="az">A to Z</option>
        <option value="awards">Awards first</option>
      </select>
      <input class="search" type="search" placeholder="Search projects or tools" aria-label="Search projects">
    </div>
    <p class="count" aria-live="polite"></p>
    <div class="grid"></div>`;
  const grid = mount.querySelector('.grid');
  const count = mount.querySelector('.count');

  function draw() {
    const q = state.q.trim().toLowerCase();
    const list = projects.filter(
      (p) =>
        (state.cat === 'all' || p.category === state.cat) &&
        (!q || [p.title, p.description, p.tools.join(' '), p.category].join(' ').toLowerCase().includes(q))
    );
    list.sort(SORTS[state.sort]);
    grid.innerHTML = list.length ? list.map(projectCard).join('') : '<p class="empty">No match. Try another word or clear the filter.</p>';
    count.textContent = `Showing ${list.length} of ${projects.length} projects`;
    grid.querySelectorAll('.proj[data-horror]').forEach((el) => {
      const on = () => ((hoverHorror = true), syncHorror());
      const off = () => ((hoverHorror = false), syncHorror());
      el.addEventListener('pointerenter', on);
      el.addEventListener('pointerleave', off);
      el.addEventListener('focus', on);
      el.addEventListener('blur', off);
    });
    hoverHorror = false;
    syncHorror();
    relayout();
  }

  mount.querySelector('.toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('.filter');
    if (!b) return;
    state.cat = b.dataset.cat;
    mount.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draw();
  });
  mount.querySelector('.sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    draw();
  });
  mount.querySelector('.search').addEventListener('input', (e) => {
    state.q = e.target.value;
    draw();
  });
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.proj');
    if (card) openProject(projects.find((p) => p.id === card.dataset.id), card);
  });
  // broken/missing screenshot -> fall back to the placeholder
  mount.addEventListener(
    'error',
    (e) => {
      if (e.target.tagName !== 'IMG') return;
      const t = e.target.closest('.thumb');
      if (t) t.classList.add('ph');
      e.target.remove();
    },
    true
  );
  draw();
}

// ---------- project popup ----------
let modal, lastOpener;
function buildModal() {
  modal = document.createElement('div');
  modal.id = 'modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title"></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => e.target === modal && closeProject());
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') return closeProject();
    if (e.key === 'Tab') {
      const f = [...modal.querySelectorAll('button, a[href], video[controls]')].filter((x) => !x.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    }
  });
}

function openProject(p, opener) {
  lastOpener = opener;
  window.dispatchEvent(new CustomEvent('portfolio:track', { detail: `project_${p.id}` }));
  const box = modal.querySelector('.modal-box');
  const items = [];
  if (p.media?.video || p.media?.video_url) items.push({ type: 'video' });
  const imgs = [...(p.media?.images || [])];
  if (p.media?.cover && !imgs.includes(p.media.cover)) imgs.unshift(p.media.cover);
  imgs.forEach((f) => items.push({ type: 'img', src: projectMedia(p.id, f) }));

  const links = (p.links || []).filter((l) => l.url).map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  box.classList.toggle('horror', p.mood === 'horror');
  box.innerHTML = `
    <button class="close" aria-label="Close project">Close</button>
    <h2 id="modal-title">${esc(p.title)}</h2>
    <p class="meta">${esc([p.dates, p.category].filter(Boolean).join(' | '))}</p>
    ${p.achievement ? `<p class="win">${esc(p.achievement)}</p>` : ''}
    <div class="stage"></div>
    <div class="thumbs"></div>
    <p class="desc">${esc(p.description)}</p>
    <div>${chips(p.tools)}</div>
    ${links ? `<p class="links">${links}</p>` : ''}`;

  const stage = box.querySelector('.stage');
  if (p.media?.aspect) stage.style.aspectRatio = p.media.aspect.replace(':', '/');
  const thumbs = box.querySelector('.thumbs');
  const show = (i) => {
    const it = items[i];
    stage.innerHTML =
      it.type === 'video'
        ? videoHtml({ src: p.media.video ? projectMedia(p.id, p.media.video) : '', url: p.media.video_url, poster: p.media.cover ? projectMedia(p.id, p.media.cover) : '' })
        : `<img src="${esc(it.src)}" alt="${esc(p.title)} screenshot ${i + 1}">`;
    thumbs.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  };
  if (items.length) {
    thumbs.innerHTML = items
      .map((it, i) => `<button aria-label="Show item ${i + 1}">${it.type === 'video' ? '<span>Video</span>' : `<img src="${esc(it.src)}" alt="">`}</button>`)
      .join('');
    thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) show([...thumbs.children].indexOf(b));
    });
    show(0);
  } else {
    stage.classList.add('ph');
    stage.dataset.letter = p.title[0];
    stage.innerHTML = '<span class="soon">Screenshots coming soon</span>';
  }
  stage.addEventListener(
    'error',
    (e) => e.target.tagName === 'IMG' && (e.target.alt = 'Image not found'),
    true
  );
  box.querySelector('.close').addEventListener('click', closeProject);

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  modalHorror = p.mood === 'horror';
  syncHorror();
  box.querySelector('.close').focus();
}

function closeProject() {
  modal.hidden = true;
  modal.querySelector('.modal-box').innerHTML = '';
  document.documentElement.style.overflow = '';
  modalHorror = false;
  syncHorror();
  lastOpener?.focus();
}

// ---------- Animation (lipstick commercial + optional intro reel) ----------
function renderAnimation() {
  const p = projects.find((x) => x.category === 'animation');
  const m = profile.media || {};
  let html = '';
  if (p) {
    const vid = videoHtml({
      src: p.media?.video ? projectMedia(p.id, p.media.video) : '',
      url: p.media?.video_url,
      poster: p.media?.cover ? projectMedia(p.id, p.media.cover) : '',
    });
    html += `<p>${esc(p.description)}</p>
      <div class="vid">${vid || '<div class="vid-ph">Video coming soon</div>'}</div>
      <div>${chips(p.tools)}</div>`;
  }
  const reel = videoHtml({
    src: m.promo_video ? `/media/${m.promo_video}` : '',
    url: m.promo_video_url,
    poster: m.promo_poster ? `/media/${m.promo_poster}` : '',
  });
  if (reel) html += `<p class="doodle-label">Intro reel</p><div class="vid">${reel}</div>`;
  $('#animation-mount').innerHTML = html;
}

// ---------- Education and awards (credits) ----------
function renderCredits() {
  const rows = (arr) => `<dl>${arr.map(([a, b]) => `<div class="credit"><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
  const edu = education.education.map((e) => [
    esc(e.dates),
    `<strong>${esc(e.degree)}</strong><br>${esc(e.institution)}`,
  ]);
  const courses = (education.courses || []).map((c) => [esc(c.institution), `<strong>${esc(c.title)}</strong><br>${esc(c.notes || '')}`]);
  const exp = (education.experience || []).filter((x) => !String(x.role).startsWith('TODO')).map((x) => [esc(x.dates), `<strong>${esc(x.role)}</strong><br>${esc(x.org)}`]);
  const awards = education.achievements.map((a) => [esc(a.date), `<strong>${esc(a.title)}</strong><br>${esc(a.project)}`]);
  const block = (title, list) => (list.length ? `<div class="credits-block"><h3>${title}</h3>${rows(list)}</div>` : '');
  $('#credits-mount').innerHTML = block('Education', edu) + block('Awards', awards) + block('Experience', exp) + block('Courses', courses);
}


// ---------- Contact form ----------
function renderContact() {
  const links = profile.links || {};
  $('#contact-mount').innerHTML = `
    <p>Want to work together, ask about a project, or just say hi? Send me a message.</p>
    <form id="contact-form" novalidate>
      <div class="field"><label for="c-name">Name</label>
        <input id="c-name" name="name" maxlength="80" autocomplete="name" required aria-describedby="e-name">
        <span class="err" id="e-name"></span></div>
      <div class="field"><label for="c-email">Email</label>
        <input id="c-email" name="email" type="email" maxlength="254" autocomplete="email" required aria-describedby="e-email">
        <span class="err" id="e-email"></span></div>
      <div class="field"><label for="c-subject">Subject</label>
        <input id="c-subject" name="subject" maxlength="120" required aria-describedby="e-subject">
        <span class="err" id="e-subject"></span></div>
      <div class="field"><label for="c-message">Message</label>
        <textarea id="c-message" name="message" rows="5" maxlength="2000" required aria-describedby="e-message"></textarea>
        <span class="err" id="e-message"></span></div>
      <div class="hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <button type="submit" class="send-btn">Send message</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
    <p class="reach">Or reach me directly: <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
      ${links.github ? ` | <a href="${esc(links.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
      ${links.linkedin ? ` | <a href="${esc(links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}</p>`;

  const form = $('#contact-form');
  const status = form.querySelector('.form-status');
  const btn = form.querySelector('.send-btn');
  const shownAt = Date.now();
  const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

  // same rules as the server (validate.js); the server re-checks everything
  const check = (v) => {
    const e = {};
    if (v.name.trim().length < 2) e.name = 'Please enter your name (at least 2 characters).';
    if (!EMAIL.test(v.email.trim())) e.email = 'Please enter a valid email address.';
    if (v.subject.trim().length < 3) e.subject = 'Please add a short subject (at least 3 characters).';
    if (v.message.trim().length < 10) e.message = 'Your message is a bit short (at least 10 characters).';
    return e;
  };
  const showErrors = (errs) => {
    ['name', 'email', 'subject', 'message'].forEach((k) => {
      const input = form.elements[k];
      form.querySelector(`#e-${k}`).textContent = errs[k] || '';
      input.setAttribute('aria-invalid', errs[k] ? 'true' : 'false');
    });
    const firstBad = ['name', 'email', 'subject', 'message'].find((k) => errs[k]);
    if (firstBad) form.elements[firstBad].focus();
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(form));
    const errs = check(v);
    showErrors(errs);
    if (Object.keys(errs).length) {
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'form-status bad';
      return;
    }
    btn.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending...';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, t: Date.now() - shownAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        showErrors({});
        status.textContent = "Thank you! Your message is on its way. I'll get back to you soon.";
        status.className = 'form-status good';
        window.dispatchEvent(new CustomEvent('portfolio:gesture', { detail: 'jump' }));
      } else if (data.errors) {
        showErrors(data.errors);
        status.textContent = 'Please fix the highlighted fields.';
        status.className = 'form-status bad';
      } else {
        status.textContent = data.error || "Sorry, that didn't work. Please try again or email me directly.";
        status.className = 'form-status bad';
      }
    } catch {
      status.textContent = "I couldn't reach the server. Please try again, or email me directly.";
      status.className = 'form-status bad';
    } finally {
      btn.disabled = false;
    }
  });
}

window.addEventListener('portfolio:goto', (e) => {
  const { section, ref } = e.detail || {};
  if (section !== 'projects' || !ref) return;
  const p = projects.find((x) => x.id === ref);
  if (p) setTimeout(() => openProject(p, null), 1500); // after the camera has arrived
});

export function renderSections() {
  renderAbout();
  renderSkills();
  buildModal();
  renderProjects();
  renderAnimation();
  renderCredits();
  renderContact();
}
