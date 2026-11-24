# Interactive 3D Web Portfolio: Project Report

**Student:** Aasia Asadullah  **Program:** BSCS (Gaming and Animation), NED University
**Course project:** Design and Development of an Interactive 3D Web Portfolio

> Replace every [TO ADD] with your own content. Export to PDF when finished (Word or Google Docs: File > Download > PDF).

## 1. Introduction and objectives
This project is a personal portfolio website that presents my profile, skills, projects and achievements as an explorable 3D world.
It combines web development, 3D graphics, animation, artificial intelligence and backend integration.
Objectives: (1) a responsive, interactive 3D website; (2) a custom avatar; (3) a promotional video; (4) a chatbot that answers questions about me
from my own documents; (5) a working contact system; (6) documentation and deployment.

## 2. Design concept
Because my specialisation is gaming and animation, the portfolio behaves like a small game. Each section is a floating island with its own visual theme
that reflects my interests: cute anime (home), cartoon sketchbook (about), manhwa panels (skills), arcade (projects), glam/makeup (animation),
film end-credits (education) and a cosy cafe (contact). Shared elements (ink outlines, paper grain, one handwritten font) keep the themes consistent.
Opening the *Veil of Secrets* project switches the whole scene into a horror mood, echoing the game's genre.
[TO ADD: mood board or sketches]

## 3. Technology stack
| Layer | Technology | Why |
|---|---|---|
| Build | Vite | fast dev server, simple bundling |
| 3D | Three.js | requirement; cel-shading with MeshToonMaterial + OutlineEffect |
| Animation | GSAP + ScrollTrigger | scroll-driven navigation and gestures |
| Backend | Node.js, Express | chatbot, email and analytics endpoints |
| Email | Nodemailer (SMTP) | simple, credentials via environment variables |
| AI | Google Gemini (embeddings + chat) | one free key covers both; multilingual |

## 4. System architecture
```
Browser (Vite + Three.js)  --/api/chat-->     Express --> RAG: embed query -> search index -> Gemini answer
        |                  --/api/contact-->  Express --> validate -> Nodemailer -> my inbox
        |                  --/api/event-->    Express --> daily counters
        v
content/*.json  (single source of truth for the site AND the chatbot)
```

## 5. Module descriptions
### 5.1 Module 1: 3D portfolio
Seven sections (home, about, skills, projects, animation, education/awards, contact). The camera flies between islands as the page scrolls;
the page text lives in HTML cards over the canvas so it stays accessible and responsive. Project gallery has filters, search, sorting and a popup with screenshots/video.
Responsive: portrait phones get a stacked layout and a "lite" 3D mode (fewer particles, no outline, lower resolution).
[TO ADD: screenshots]

### 5.2 Module 2: Blender avatar
[TO ADD: modelling process, materials, rig (head, body, arms), export settings (GLB), Blender screenshots.]
In the site the avatar is cel-shaded, follows the mouse with her head, waves/hops/nods/twirls on click and on section arrival,
and travels with the camera on her own platform.

### 5.3 Module 3: After Effects video
[TO ADD: concept, duration, software techniques, music licence, final MP4 embedded in the Animation section.]
Related work already in the portfolio: the lipstick commercial made in the After Effects course at CEGA.

### 5.4 Module 4: RAG chatbot
See `docs/RAG.md` for the full pipeline. Summary: content is chunked, embedded with gemini-embedding-001 (768 dimensions), stored in a JSON vector index,
retrieved by cosine similarity, and passed to a Gemini chat model that must answer only from the retrieved passages.
Answers show clickable source chips. The bot replies in the visitor's language and supports voice input and read-aloud.
**Hallucination control:** strict system rules, a similarity threshold that triggers a fixed "I don't have that information" reply, low temperature,
and test questions designed to tempt it into inventing facts.

### 5.5 Module 5: Contact system
Fields: name, email, subject, message. Validation runs in the browser (instant feedback, accessible error messages) and again on the server (never trust the client).
Spam protection: hidden honeypot field, minimum-fill-time check, rate limit (5 messages/hour per visitor), link-count limit.
Security: input length caps and control-character stripping (prevents header injection), HTML-escaped email body, visitor address used only as Reply-To,
SMTP credentials only in `server/.env`. [TO ADD: screenshot of success message and of the received email]

### 5.6 Module 6: Deployment and documentation
README with install steps, `.env.example`, this report, checklist. [TO ADD: live URL, hosting provider, deployment steps]

## 6. Extra-credit features
Mouse-reactive 3D elements; day/night mode; voice interaction; multilingual chatbot; avatar gestures; project filtering, search and sorting;
privacy-friendly analytics (counters only, honours Do Not Track); accessibility (skip link, keyboard-operable dialogs, focus rings,
reduced-motion support, labelled controls); chatbot source citations.

## 7. Testing
| Test | Expected | Result |
|---|---|---|
| Contact: empty form | inline errors, focus on first bad field | [TO ADD] |
| Contact: invalid email | email error shown | [TO ADD] |
| Contact: valid message | success message + email received | [TO ADD] |
| Contact: bot fills hidden field | fake success, no email sent | [TO ADD] |
| Contact: 6 messages in an hour | rate-limit message | [TO ADD] |
| Chat: "What games has she made?" | lists 7 games with sources | [TO ADD] |
| Chat: "What is her phone number?" | says it doesn't have that information | [TO ADD] |
| Chat: prompt-injection attempt | politely declines | [TO ADD] |
| Chat: question in Urdu/Spanish | answers in that language | [TO ADD] |
| Mobile (375 px wide) | no sideways scroll, readable cards | [TO ADD] |
| Keyboard only | every control reachable, dialogs trap focus, Esc closes | [TO ADD] |
| Reduced motion enabled | no jumps/leaning, instant scroll camera | [TO ADD] |
| Lighthouse accessibility | [TO ADD score] | [TO ADD] |

## 8. Challenges and solutions
- *Many themes without chaos:* one shared visual language (outline, grain, font) and a single scroll-state system that blends colours and lights.
- *Avatar with a tiny rig:* gestures are procedural and have fallbacks if a bone isn't found; a `?debug` panel tunes the arm wave live.
- *Chatbot reliability:* retrieval threshold + strict prompt + trick-question tests.
- *Performance on phones:* lite mode, capped pixel ratio, culling of off-screen islands.
[TO ADD: your own challenges]

## 9. Conclusion and future work
[TO ADD] Ideas: more avatar expressions, project videos for every game, a blog section, streaming chatbot answers.

## References
Three.js documentation; GSAP documentation; Google Gemini API documentation; Nodemailer documentation; Express documentation.
[TO ADD: music/asset credits]
