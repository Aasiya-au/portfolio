// STEP 1 of the RAG pipeline: turn your content/ files into small, self-contained text chunks.
// Each chunk also remembers where it came from (section + ref) so the chat can cite it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../content');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
const ok = (s) => typeof s === 'string' && s.trim() !== '' && !/TODO/i.test(s); // never index placeholders
const list = (a) => (a || []).filter(ok).join(', ');

export const getProfileName = () => readJson('profile.json').name;

export function buildChunks() {
  const profile = readJson('profile.json');
  const projects = readJson('projects.json');
  const skills = readJson('skills.json');
  const edu = readJson('education.json');
  const name = profile.name;
  const first = name.split(' ')[0];
  const chunks = [];
  const add = (id, section, ref, label, text) => {
    if (ok(text)) chunks.push({ id, section, ref, label, text: text.replace(/\s+/g, ' ').trim() });
  };

  // ----- profile -----
  add('profile', 'about', '', 'About', `${name} is a ${profile.role} at ${profile.university}. In ${first}'s own words (first person): ${profile.summary}`);
  const fav = profile.favourites || {};
  add(
    'interests',
    'about',
    '',
    'Interests',
    `${first}'s interests: ${list(profile.interests)}. Favourite anime: ${list(fav.anime)}. Favourite cartoons: ${list(fav.cartoons)}. Favourite animated movies: ${list(fav.animated_movies)}. Favourite foods: ${list(fav.foods)}.`
  );
  add(
    'contact',
    'contact',
    '',
    'Contact',
    `How to contact ${name}: email ${profile.email}. GitHub: ${profile.links?.github}. LinkedIn: ${profile.links?.linkedin}. Visitors can also use the contact form on this website.`
  );

  // ----- projects -----
  const cat = (c) => ({ game: 'a game', animation: 'an animation project', software: 'a software project' }[c] || `a ${c}`);
  projects.forEach((p) => {
    add(
      `project-${p.id}`,
      p.category === 'animation' ? 'animation' : 'projects',
      p.id,
      p.title,
      `Project "${p.title}" is ${cat(p.category)} by ${first}. ${ok(p.dates) ? `When: ${p.dates}.` : ''} Tools and technologies: ${list(p.tools)}. Description (written by ${first} in first person): ${p.description} ${ok(p.achievement) ? `Achievement: ${p.achievement}.` : ''}`
    );
  });
  // overview chunks help broad questions like "what games has she made?"
  const games = projects.filter((p) => p.category === 'game');
  add('overview-games', 'projects', '', 'Games', `${first} has made ${games.length} games: ${games.map((p) => `${p.title} (${list(p.tools)})`).join('; ')}.`);
  add('overview-projects', 'projects', '', 'Projects', `All of ${first}'s projects: ${projects.map((p) => `${p.title} (${p.category})`).join('; ')}.`);
  const won = projects.filter((p) => ok(p.achievement));
  add('overview-awards', 'credits', '', 'Awards', `Awards and recognition for ${first}: ${won.map((p) => `${p.title}: ${p.achievement}`).join('; ')}.`);

  // ----- skills -----
  const labels = {
    programming_languages: 'programming languages', game_engines: 'game engines', libraries_and_frameworks: 'libraries and frameworks',
    art_and_animation: 'art and animation skills', databases: 'database skills', tools: 'tools', core_strengths: 'core strengths',
  };
  Object.entries(skills).forEach(([k, v]) => add(`skills-${k}`, 'skills', '', 'Skills', `${first}'s ${labels[k] || k}: ${list(v)}.`));
  add('skills-all', 'skills', '', 'Skills', `All of ${first}'s skills: ${Object.values(skills).flat().filter(ok).join(', ')}.`);

  // ----- education, courses, awards, experience -----
  edu.education.forEach((e, i) =>
    add(`edu-${i}`, 'credits', '', 'Education', `${first} studies ${e.degree} at ${e.institution} (${e.dates}).${ok(e.cgpa) ? ` Her CGPA is ${e.cgpa}.` : ''}`)
  );
  (edu.courses || []).forEach((c, i) => add(`course-${i}`, 'credits', '', 'Courses', `${first} took the ${c.title} at ${c.institution}. ${c.notes || ''}`));
  edu.achievements.forEach((a, i) => add(`award-${i}`, 'credits', '', 'Awards', `Award: ${a.title} for the project ${a.project}${ok(a.date) ? `, ${a.date}` : ''}.`));
  (edu.experience || []).forEach((x, i) => add(`exp-${i}`, 'credits', '', 'Experience', `Experience: ${x.role} (${x.org}), ${x.dates}. ${x.notes || ''}`));

  // ----- optional extra notes: content/docs/*.md (files starting with _ are ignored) -----
  const docsDir = path.join(CONTENT, 'docs');
  if (fs.existsSync(docsDir)) {
    fs.readdirSync(docsDir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .forEach((f) => {
        let heading = '';
        let buf = '';
        let n = 0;
        const flush = () => {
          if (buf.trim()) add(`doc-${f}-${n++}`, 'about', '', 'Extra notes', `${heading ? heading + '. ' : ''}${buf}`);
          buf = '';
        };
        fs.readFileSync(path.join(docsDir, f), 'utf8')
          .split(/\n\s*\n/)
          .forEach((para) => {
            const h = para.match(/^#{1,3}\s+(.*)/);
            if (h) {
              flush();
              heading = h[1].trim();
              para = para.replace(/^#{1,3}.*\n?/, '');
            }
            if (buf.length + para.length > 900) flush();
            buf += (buf ? ' ' : '') + para;
          });
        flush();
      });
  }
  return chunks;
}
