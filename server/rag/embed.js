// STEP 2: turn text into vectors (embeddings) with Gemini.
import { geminiPost } from './gemini.js';

export const EMBED_MODEL = () => process.env.EMBED_MODEL || 'gemini-embedding-001';
export const DIMS = 768; // smaller vectors = smaller index, still very accurate for a portfolio

// Vectors that aren't full-size must be normalised; then "similarity" is just a dot product.
function normalize(v) {
  const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / len);
}

export async function embedDocuments(texts) {
  const model = EMBED_MODEL();
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const data = await geminiPost(`/models/${model}:batchEmbedContents`, {
      requests: batch.map((t) => ({
        model: `models/${model}`,
        content: { parts: [{ text: t }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: DIMS,
      })),
    });
    out.push(...data.embeddings.map((e) => normalize(e.values)));
  }
  return out;
}

export async function embedQuery(text) {
  const model = EMBED_MODEL();
  const data = await geminiPost(`/models/${model}:embedContent`, {
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: DIMS,
  });
  return normalize(data.embedding.values);
}
