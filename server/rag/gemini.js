// Tiny wrapper around the Gemini REST API (no SDK needed).
// The key travels in a header, never in the URL, so it can't leak into logs.
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function geminiPost(path, body, { retries = 2, timeoutMs = 30000 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError(500, 'GEMINI_API_KEY is not set (copy server/.env.example to server/.env)');

  for (let attempt = 0; ; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
    } catch {
      clearTimeout(timer);
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new GeminiError(504, 'The request to Gemini failed or timed out');
    }
    clearTimeout(timer);
    if (res.ok) return res.json();

    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(1500 * 2 ** attempt);
      continue;
    }
    throw new GeminiError(res.status, text.slice(0, 300));
  }
}
