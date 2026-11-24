import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ensureIndex, getIndex, lastIndexError } from './rag/store.js';
import { answer } from './rag/answer.js';
import { validateContact } from './validate.js';
import { sendContact } from './mailer.js';
import { record, summary } from './analytics.js';

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(','), methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '8kb' }));

const limiter = (limit, windowMs, error) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error } });
const chatLimiter = limiter(20, 10 * 60 * 1000, "You're asking very fast! Please wait a few minutes and try again.");
const contactLimiter = limiter(5, 60 * 60 * 1000, 'You have sent several messages already. Please try again in an hour, or email me directly.');
const eventLimiter = limiter(60, 60 * 1000, 'Too many events.');

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const safeEqual = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------- health ----------
app.get('/api/health', (_req, res) => {
  const idx = getIndex();
  res.json({ ok: !!idx, error: idx ? undefined : lastIndexError, chunks: idx?.chunks.length ?? 0, model: process.env.CHAT_MODEL || 'gemini-3.8-flash' });
});

// ---------- chatbot ----------
app.post('/api/chat', chatLimiter, async (req, res) => {
  const message = clean(req.body?.message, 500);
  if (!message) return res.status(400).json({ error: 'Please type a question.' });
  const history = (Array.isArray(req.body?.history) ? req.body.history : [])
    .slice(-8)
    .filter((h) => h && (h.role === 'user' || h.role === 'bot'))
    .map((h) => ({ role: h.role, text: clean(h.text, 800) }));
  try {
    res.json(await answer({ message, history }));
  } catch (err) {
    console.error('chat error:', err.status || '', err.message);
    if (err.status === 429) return res.status(503).json({ error: "I'm a little busy right now. Please try again in a minute." });
    if (err.status === 503) return res.status(503).json({ error: "I'm still waking up. Try again in a moment." });
    res.status(500).json({ error: 'Something went wrong on my side. Please try again, or use the contact form.' });
  }
});

// ---------- contact form ----------
app.post('/api/contact', contactLimiter, async (req, res) => {
  const body = req.body || {};
  // spam traps: a hidden field real people never fill, and a form that was "submitted" in under 3 seconds.
  // Bots get a fake success so they don't learn anything.
  if (typeof body.website === 'string' && body.website.trim()) return res.json({ ok: true });
  const elapsed = Number(body.t);
  if (!Number.isFinite(elapsed) || elapsed < 3000) return res.json({ ok: true });

  const { ok, errors, values } = validateContact(body);
  if (!ok) return res.status(400).json({ errors });
  try {
    await sendContact(values);
    record('contact_sent');
    res.json({ ok: true });
  } catch (err) {
    console.error('contact error:', err.code || err.status || '', err.message); // never log message text or passwords
    res.status(err.status === 503 ? 503 : 500).json({ error: "I couldn't send your message right now. Please email me directly instead." });
  }
});

// ---------- analytics (counters only) ----------
app.post('/api/event', eventLimiter, (req, res) => {
  record(String(req.body?.name || ''));
  res.sendStatus(204);
});
app.get('/api/stats', (req, res) => {
  const token = process.env.STATS_TOKEN;
  const got = String(req.get('x-stats-token') || req.query.token || '');
  if (!token || !safeEqual(got, token)) return res.sendStatus(404);
  res.json(summary());
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

ensureIndex()
  .then((idx) => console.log(`Chatbot ready: ${idx.chunks.length} chunks indexed.`))
  .catch((err) => console.error('Chatbot index NOT ready:', err.message));
