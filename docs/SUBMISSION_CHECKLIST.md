# Submission checklist

## Modules
| Module | Status | Evidence / where |
|---|---|---|
| 1. 3D portfolio | Built | All sections in `client/`; screenshot each island + mobile view |
| 2. Blender avatar | **You do this** | `.blend` + `.glb`; drop the GLB in `client/public/models/avatar.glb` |
| 3. After Effects video | **You do this** | `.aep` + MP4; set `promo_video` in `content/profile.json` |
| 4. RAG chatbot | Built | `docs/RAG.md`; screenshot a chat + `npm run test-questions` output |
| 5. Contact system | Built | Screenshot form success message + the received email; `npm run test-email` output |
| 6. Deployment + docs | Docs done, **deployment later** | README, this checklist, `docs/REPORT.md` |

## Extra credit already in the project
Mouse-reactive 3D (avatar head + drifting props + camera), dark/light mode, voice interaction, multilingual chatbot,
avatar gestures, project filtering + search + sorting, website analytics, accessibility work, chatbot source citations.

## Required materials
- [ ] Complete source code (frontend + backend), no `.env`, no `node_modules`
- [ ] Blender `.blend` + exported avatar
- [ ] After Effects `.aep` + final MP4
- [ ] Working chatbot
- [ ] Working contact form
- [ ] Project report as PDF (start from `docs/REPORT.md`)
- [ ] README with setup instructions (done)
- [ ] Screenshots of the major modules (list in the report)
- [ ] Live deployment URL
- [ ] GitHub repository link or source archive

## Screenshots to take
1. Home island (desktop) and mobile view
2. About, Skills, Projects (with filter/search used), Animation, Education, Contact islands
3. Project popup with gallery; Veil of Secrets horror mode
4. Night mode
5. Chat: a normal answer with citations, a refusal ("I don't have that information"), a voice/other-language example
6. Contact form: validation errors, success message, and the email in your inbox
7. Terminal output of `npm run test-questions` and `npm run test-email`
8. Lighthouse accessibility score (Chrome DevTools > Lighthouse)
