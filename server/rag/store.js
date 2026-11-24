// STEP 3: the vector index. A JSON file + cosine similarity is plenty for ~50 chunks.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildChunks } from './chunk.js';
import { embedDocuments, EMBED_MODEL, DIMS } from './embed.js';

const INDEX_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.json');
let index = null;
export const getIndex = () => index;

// Rebuilds only when content changed (hash of all chunk text), so restarts are free.
export async function loadIndex({ force = false } = {}) {
  const chunks = buildChunks();
  const hash = crypto
    .createHash('sha256')
    .update(chunks.map((c) => `${c.id}|${c.section}|${c.ref}|${c.text}`).join('\n') + EMBED_MODEL() + DIMS)
    .digest('hex');

  if (!force && fs.existsSync(INDEX_PATH)) {
    const saved = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    if (saved.hash === hash) return (index = saved);
  }
  console.log(`Embedding ${chunks.length} chunks...`);
  const vectors = await embedDocuments(chunks.map((c) => c.text));
  index = {
    hash,
    model: EMBED_MODEL(),
    dims: DIMS,
    createdAt: new Date().toISOString(),
    chunks: chunks.map((c, i) => ({ ...c, embedding: vectors[i].map((x) => Number(x.toFixed(6))) })),
  };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
  return index;
}

// STEP 4: retrieval. Score every chunk against the question vector, keep the best few.
export function search(queryVec, k = 6) {
  if (!index) return [];
  return index.chunks
    .map((c) => {
      let s = 0;
      for (let i = 0; i < queryVec.length; i++) s += queryVec[i] * c.embedding[i];
      return { chunk: c, score: s };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
