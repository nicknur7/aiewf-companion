// Build-time: embed every session's (title + track + description) with the
// SAME model the browser uses for the query (Xenova/all-MiniLM-L6-v2, 384-d),
// so doc + query vectors live in one space. Output → public/data/session-embeddings.json.
// Run: npm run embed   (must run before `npm run build`).
import { pipeline } from "@xenova/transformers";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const raw = JSON.parse(readFileSync(join(ROOT, "data/sessions.json"), "utf8"));
const sessions = raw.sessions || [];
console.log(`[embed] ${sessions.length} sessions`);

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

const round = (n) => Math.round(n * 1e5) / 1e5; // 5 dp keeps file ~half size, no recall loss
const vectors = [];
for (let i = 0; i < sessions.length; i++) {
  const s = sessions[i];
  const text = [s.title, s.track, s.description].filter(Boolean).join(". ").slice(0, 1500);
  const out = await extractor(text, { pooling: "mean", normalize: true });
  vectors.push(Array.from(out.data).map(round));
  if (i % 50 === 0) console.log(`[embed] ${i}/${sessions.length}`);
}

const payload = {
  model: "Xenova/all-MiniLM-L6-v2",
  dims: vectors[0]?.length ?? 384,
  count: vectors.length,
  // index i aligns 1:1 with sessions[i] in sessions.json
  vectors,
};
const outPath = join(ROOT, "public/data/session-embeddings.json");
writeFileSync(outPath, JSON.stringify(payload));
console.log(`[embed] wrote ${outPath} (${vectors.length} vecs, ${payload.dims}-d)`);
