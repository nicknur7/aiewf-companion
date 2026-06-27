// Client-side semantic search. Lazy-loads all-MiniLM-L6-v2 in the browser
// (same model used to precompute session embeddings at build), embeds the
// user's query, cosine-matches against the static session vectors.
// Fully client-side — no API key, no server. Falls back to keyword scoring
// if the model can't load.
import { loadEmbeddings } from "./data";
import type { Session } from "../types";

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import("@xenova/transformers");
      // browser: pull the (quantized) model from the HF CDN, cache in-browser
      env.allowLocalModels = false;
      return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return extractorPromise;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  // both are L2-normalized, so dot product == cosine
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export interface Scored {
  session: Session;
  score: number;
}

/** Semantic ranking. Returns top-k sessions by meaning-match to the query. */
export async function semanticSearch(
  query: string,
  sessions: Session[],
  k = 12,
): Promise<Scored[]> {
  const emb = await loadEmbeddings();
  const extractor = await getExtractor();
  const out = await extractor(query, { pooling: "mean", normalize: true });
  const q = Array.from(out.data) as number[];
  const scored = sessions.map((session) => ({
    session,
    score: cosine(q, emb.vectors[session.id] || []),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/** Keyword fallback — used while the model loads or if it fails. */
export function keywordSearch(query: string, sessions: Session[], k = 12): Scored[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return [];
  const scored = sessions.map((session) => {
    const hay = `${session.title} ${session.track} ${session.description} ${session.speakers.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (session.title.toLowerCase().includes(t)) score += 3;
      else if (session.track.toLowerCase().includes(t)) score += 2;
      else if (hay.includes(t)) score += 1;
    }
    return { session, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

/** Warm the model in the background so the first query feels fast. */
export function warmModel() {
  getExtractor().catch(() => {});
}
