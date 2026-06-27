# WF Companion — AI Engineer World's Fair 2026

An **unofficial** attendee companion for the [AI Engineer World's Fair 2026](https://ai.engineer/worldsfair) (June 29 – July 2, Moscone West, SF). Browse every session and speaker, build a personal agenda, and **ask in plain English what to see** — with the matching running entirely in your browser.

> Not affiliated with AI Engineer. Built on the conference's open `sessions.json` / `speakers.json`, which they publish and invite people to build on.

## Features

- **Sessions** — all 557, full-text search + filter by day and by 49 tracks, expandable details.
- **Speakers** — all 524, photos + bios + their sessions.
- **Ask what to see** — semantic search over every session, powered by a real embedding model (`all-MiniLM-L6-v2`) running **100% client-side** via [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) (the ONNX wasm runtime is self-hosted). No server, no API key, no tracking. Keyword fallback while the model loads.
- **My Agenda** — save sessions (localStorage), grouped by day, overlap warnings, `.ics` export.
- **More** — side events, venue / floor-plan, roadmap.
- Responsive: phone-first, desktop-class layout.

## How "Ask what to see" works

Session `title + track + description` are embedded at **build time** (`npm run embed`) with `all-MiniLM-L6-v2` → `public/data/session-embeddings.json`. At runtime the browser embeds the user's query with the *same* model and ranks sessions by cosine similarity. Same vector space, fully static, deployable to any static host.

## Stack

Vite · React · TypeScript · Tailwind v4 · `@huggingface/transformers` (client-side, self-hosted wasm). Static build → deployable to GitHub Pages / Netlify / any static host.

## Develop

```bash
npm install
npm run embed     # one-time: precompute session embeddings (downloads the model)
npm run dev       # local dev
npm run build     # → dist/ (static)
npm run preview   # serve the production build
```

## Data

Pulled from the conference's public endpoints under `https://www.ai.engineer/worldsfair/` into `data/` and `public/data/`. Refresh by re-downloading those files and re-running `npm run embed`.

## Roadmap

- Live in-venue booth navigation (AR walking directions + minimap) — pending venue booth-coordinate data.

---

Built by **Nicholas Nuraliyev** · nicknur7@gmail.com
