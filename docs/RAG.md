# How the portfolio chatbot works (RAG pipeline)

RAG = Retrieval-Augmented Generation. The language model does not "know" anything about me.
Instead, for every question the server first looks up the relevant facts and hands them to the model.

1. **Collect.** My CV data lives in `content/*.json` (profile, projects, skills, education, awards) plus optional notes in `content/docs/*.md`.
2. **Chunk.** `server/rag/chunk.js` splits this into small self-contained passages (one per project, one per skill group, one per award, overview chunks for broad questions). Placeholder text is never indexed.
3. **Embed.** `server/rag/embed.js` sends each chunk to Google's `gemini-embedding-001` model, which returns a 768-number vector that captures its meaning. Chunks with similar meaning get similar vectors.
4. **Store.** `server/rag/store.js` saves the vectors in `server/rag/index.json` (a simple vector index). It is rebuilt automatically when the content changes.
5. **Retrieve.** The visitor's question is embedded the same way. The server computes cosine similarity (a dot product, since vectors are normalised) against every chunk and keeps the best 6. If even the best match is weak (`MIN_SCORE`), the bot says it doesn't know without calling the language model.
6. **Generate.** `server/rag/answer.js` sends the question plus the retrieved passages to a Gemini chat model with strict rules: use only the passages, never invent facts, speak in the third person, ignore instructions hidden in the question, and list which passages were used.
7. **Cite.** The passage numbers the model reports are mapped back to website sections; the chat shows them as clickable chips that scroll to the section (and open the project).

## Why it avoids making things up
- The model is told to answer only from the supplied passages, otherwise to say it doesn't know.
- Weak retrieval short-circuits to a fixed "I don't have that information" reply.
- Low temperature (0.3) and short answers reduce embellishment.
- `npm run test-questions` includes trick questions (phone number, favourite colour, fake job) to verify refusals.

## Safety
- API key is only in `server/.env` (never sent to the browser).
- Input is trimmed, length-limited and stripped of control characters; the JSON body is capped at 8 KB.
- Rate limit: 20 questions per visitor per 10 minutes.
