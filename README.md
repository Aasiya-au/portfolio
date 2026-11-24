# Interactive 3D Web Portfolio

A game-style portfolio: a Three.js world of floating themed islands (one per section), a cel-shaded avatar that reacts to you,
a RAG chatbot that answers from my own content, and a contact form that emails me.

**Stack:** Vite + Three.js + GSAP (frontend), Node.js + Express + Nodemailer (backend), Google Gemini (embeddings + chat).

## Quick start

You need Node.js 18 or newer.

```bash
# 1) frontend
cd client
npm install

# 2) backend (new terminal)
cd server
npm install
copy .env.example .env        # Windows   (Mac/Linux: cp .env.example .env)
# open server/.env and fill in GEMINI_API_KEY, SMTP_USER, SMTP_PASS, CONTACT_TO (see below)
npm run dev

# 3) back in the client terminal
npm run dev                   # open http://localhost:5173
```

Put the avatar model at `client/public/models/avatar.glb`.
Add `?debug` to the URL (`http://localhost:5173/?debug`) to tune the avatar's arm wave.

## Environment variables (`server/.env`)

| Variable | What it is |
|---|---|
| `GEMINI_API_KEY` | Free key from https://aistudio.google.com/apikey (chatbot) |
| `CHAT_MODEL`, `EMBED_MODEL` | Gemini model names; change here if Google renames them |
| `SMTP_USER`, `SMTP_PASS` | Sending account. For Gmail: turn on 2-Step Verification, then create an **App Password** at https://myaccount.google.com/apppasswords |
| `CONTACT_TO` | Where contact messages arrive |
| `ALLOWED_ORIGIN`, `PORT`, `TRUST_PROXY` | Server settings (set `TRUST_PROXY=1` behind a host/proxy) |
| `STATS_TOKEN` | Optional. Lets you view visit counters at `/api/stats?token=...` |

`.env` is git-ignored. Never commit it.

## Editing content

Everything the site and the chatbot know comes from `content/`:

- `profile.json`, `projects.json`, `skills.json`, `education.json`
- `content/docs/*.md` (optional extra facts for the chatbot; see `_example.md`)
- Project screenshots and videos go in `client/public/media/projects/<project-id>/` (see `client/public/media/README.md`)

Restart the server after editing content (the chatbot re-indexes automatically).

## Useful commands

| Command (in `server/`) | Purpose |
|---|---|
| `npm run test-email` | Sends a real test email (evidence that delivery works) |
| `npm run test-questions` | Asks the chatbot good and tricky questions (evidence it doesn't invent facts) |
| `npm run test-validate` | Unit checks for contact-form validation |
| `npm run build-index` | Force-rebuild the chatbot's vector index |

## Project structure

```
client/            Vite + Three.js frontend
  src/themes.js      sections, themes, avatar positions
  src/props.js       3D props for each island
  src/world.js       islands, lights, sky, day/night + horror blending
  src/scroll.js      scroll -> camera / avatar / colours; nav dots
  src/avatar.js      avatar loading, toon shading, gestures
  src/reactions.js   clicks, hover, section reactions, speech bubble
  src/sections.js    renders all sections from /content (+ project popup, filters, contact form)
  src/chat.js        chat UI (+ voice input / read-aloud)
  src/theme.js       day / night toggle
  src/analytics.js   privacy-friendly counters
server/            Express API: /api/chat, /api/contact, /api/event, /api/stats
  rag/               chunk -> embed -> index -> retrieve -> generate
content/           my data (feeds the site and the chatbot)
docs/              RAG explanation, report draft, submission checklist
```

## Features

- 3D scroll world with 7 themed islands, cel-shaded avatar, mouse-following head, gestures, speech bubbles
- Projects gallery with filters, search, sorting, popups with screenshots/video
- RAG chatbot with clickable source citations, multilingual answers, voice input and read-aloud
- Contact form: frontend + backend validation, honeypot, timing trap, rate limiting, escaped HTML email, credentials in `.env`
- Day / night mode, responsive layout, "lite" 3D mode on phones and low-power laptops, WebGL fallback
- Accessibility: skip link, keyboard-friendly dialogs, focus rings, reduced-motion support, labelled controls
- Privacy-friendly analytics (counters only, respects Do Not Track)

See `docs/RAG.md` for the chatbot pipeline and `docs/SUBMISSION_CHECKLIST.md` for the course requirements.
