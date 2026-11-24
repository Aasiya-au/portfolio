// Privacy-friendly analytics: just counters per day. No cookies, no IP addresses, no message text.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const FILE = path.join(DIR, 'analytics.json');
const ALLOWED = /^(pageview|chat_open|chat_question|contact_sent|section_[a-z]{2,20}|project_[a-z0-9-]{2,60})$/;

let data = {};
try {
  data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch {
  data = {};
}
let timer;
const save = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data));
  }, 2000);
};

export function record(name) {
  if (!ALLOWED.test(name)) return false;
  const day = new Date().toISOString().slice(0, 10);
  data[day] ??= {};
  data[day][name] = (data[day][name] || 0) + 1;
  save();
  return true;
}

export function summary() {
  const totals = {};
  Object.values(data).forEach((day) => Object.entries(day).forEach(([k, v]) => (totals[k] = (totals[k] || 0) + v)));
  return { totals, days: data };
}
