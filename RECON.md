# RECON — AI Engineer World's Fair 2026 Expo Companion

**Date:** 2026-06-26 · **Phase 1 of** `core-business/tasks/career/aiewf-companion-build-plan-2026-06-26.md`

## Gap finding (do we build it?)
**YES — build it.** The conference has **no official interactive schedule/expo app**. More: they publish open data endpoints and *explicitly invite* "Build your own schedule app." So this is **sanctioned, not just tolerated** — the etiquette risk is gone, and it's a real gift, not a duplicate.

## Data inventory (all pulled to `data/`)
Source: open endpoints under `https://www.ai.engineer/worldsfair/` (curl, Sentinel-approved 2026-06-26).
- **`sessions.json`** (529 KB) — `totalSessions: 557`. Each: `title, description (rich), day, time, room, track, type, status, speakers[]`. Days: "Day 1 — Workshop Day" + 3 Session Days. **49 tracks.**
- **`speakers.json`** (876 KB) — 524 speakers. Each: `name, role, company, bio, linkedin, photoUrl, sessions[]`.
- **`speakers-embeddings.json`** (2.1 MB) — precomputed speaker embeddings (their model/dims). We embed *sessions* ourselves for the recommender (sessions aren't in their embedding file).
- **`calendar.ics`** (1.2 KB) — small; metadata-level, not the full per-session feed.

## Confirmed facts (use these — supersede earlier conflicting numbers)
- **Dates:** June 29 – July 2, 2026 (from `sessions.json` meta; the `llms.md` "June 28" was wrong).
- **Venue:** Moscone West, San Francisco. Capacity 6,000+. "100+ expo partners."
- **Named sponsors seen:** Sonar, Extend, Oxylabs, Firecrawl, Qodo, Optiver, Stripe, Metronome, Vercel, Merge, Factory.
- **Also:** Startup Battlefield (Jul 2), an MCP server at `/worldsfair/mcp`, `scheduleVersion: 4443` (data is live/updated).

## Site audit (light — Nick pivoted to "build useful," not bug-hunt)
The site is actually solid (clean open APIs, server-rendered schedule) — not the rough AI-built site we expected. No glaring bugs worth leading an email with. **The value is the companion app, not a bug list.** (If a deeper audit is wanted later, the angle would be a11y/mobile polish, not correctness.)

## Build implications
- Real data, no scraping, no fabrication — just consume the JSON.
- "Ask what to see" = embed session `title + description` at build (transformers.js MiniLM) → static vectors; embed query in-browser, cosine match. Fully client-side, no key, GitHub-Pages-safe.
- Label as unofficial companion; the "build your own" invite makes this clean.
