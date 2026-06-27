import type { Session, Speaker, SideEvent, Meta } from "../types";

const BASE = import.meta.env.BASE_URL; // "./" with relative base

async function getJSON(path: string) {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.json();
}

export interface AppData {
  meta: Meta;
  sessions: Session[];
  speakers: Speaker[];
  sideEvents: SideEvent[];
  tracks: string[];
  days: string[];
  embeddings: { dims: number; vectors: number[][] } | null;
}

let cache: AppData | null = null;

export async function loadData(): Promise<AppData> {
  if (cache) return cache;

  const [sessRaw, spkRaw, sideRaw] = await Promise.all([
    getJSON("sessions.json"),
    getJSON("speakers.json"),
    fetch(`${BASE}data/side-events.jsonl`).then((r) => r.text()),
  ]);

  const sessions: Session[] = (sessRaw.sessions || []).map((s: any, i: number) => ({
    id: i,
    title: s.title ?? "",
    description: s.description ?? "",
    day: s.day ?? "",
    time: s.time ?? "",
    room: s.room ?? "",
    type: s.type ?? "",
    track: s.track ?? "",
    status: s.status ?? "",
    speakers: Array.isArray(s.speakers) ? s.speakers : [],
  }));

  const speakers: Speaker[] = (spkRaw.speakers || []).map((s: any) => ({
    name: s.name ?? "",
    role: s.role,
    company: s.company,
    bio: s.bio,
    linkedin: s.linkedin,
    photoUrl: s.photoUrl,
    sessions: s.sessions,
  }));

  const sideEvents: SideEvent[] = sideRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as SideEvent;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as SideEvent[];
  sideEvents.sort((a, b) => (a.sortDate ?? "").localeCompare(b.sortDate ?? ""));

  const tracks = Array.from(new Set(sessions.map((s) => s.track).filter(Boolean))).sort();
  const days = Array.from(new Set(sessions.map((s) => s.day).filter(Boolean)));

  const meta: Meta = {
    conference: sessRaw.conference ?? "AI Engineer World's Fair 2026",
    dates: sessRaw.dates ?? "June 29 – July 2, 2026",
    location: sessRaw.location ?? "San Francisco, CA",
    totalSessions: sessRaw.totalSessions ?? sessions.length,
    totalSpeakers: spkRaw.totalSpeakers ?? speakers.length,
  };

  cache = { meta, sessions, speakers, sideEvents, tracks, days, embeddings: null };
  return cache;
}

/** Loaded lazily — only when the user first uses semantic search. */
export async function loadEmbeddings(): Promise<{ dims: number; vectors: number[][] }> {
  if (cache?.embeddings) return cache.embeddings;
  const raw = await getJSON("session-embeddings.json");
  const emb = { dims: raw.dims, vectors: raw.vectors as number[][] };
  if (cache) cache.embeddings = emb;
  return emb;
}

export const SPEAKER_IMG_BASE = "https://www.ai.engineer";

/** Only allow safe link schemes — blocks javascript:/data: URIs from poisoned data. */
export function safeUrl(u?: string): string | undefined {
  if (!u) return undefined;
  const t = u.trim();
  return /^(https?:|mailto:)/i.test(t) ? t : undefined;
}

/** Resolve a speaker photo URL safely; returns undefined if not a clean path/URL. */
export function safePhoto(photoUrl?: string): string | undefined {
  if (!photoUrl) return undefined;
  if (/^https:\/\//i.test(photoUrl)) return photoUrl;
  if (photoUrl.startsWith("/")) return SPEAKER_IMG_BASE + photoUrl;
  return undefined;
}
