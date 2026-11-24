import 'dotenv/config';
import { loadIndex } from './store.js';

const idx = await loadIndex({ force: true });
console.log(`Done: ${idx.chunks.length} chunks, ${idx.dims} dimensions, model ${idx.model}.`);
