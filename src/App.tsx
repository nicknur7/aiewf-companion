import { useEffect, useMemo, useState } from "react";
import type { AppData } from "./lib/data";
import { loadData } from "./lib/data";
import type { Session, Speaker, SideEvent } from "./types";
import * as agenda from "./lib/agenda";
import { semanticSearch, keywordSearch, warmModel, type Scored } from "./lib/semantic";
import { Chip, SearchInput, SessionCard, SpeakerCard, Spinner } from "./components";

type Tab = "sessions" | "speakers" | "ask" | "agenda" | "more";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "sessions", label: "Sessions", icon: "M4 6h16M4 12h16M4 18h10" },
  { id: "speakers", label: "Speakers", icon: "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "ask", label: "Ask", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { id: "agenda", label: "Agenda", icon: "M19 4H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8 2v4M16 2v4M3 10h18" },
  { id: "more", label: "More", icon: "M12 5v.01M12 12v.01M12 19v.01" },
];

const DAY_DATE: Record<string, string> = {
  "Day 1": "2026-06-29",
  "Day 2": "2026-06-30",
  "Day 3": "2026-07-01",
  "Day 4": "2026-07-02",
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sessions");
  const [ids, setIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData().then(setData).catch((e) => setErr(String(e)));
    setIds(agenda.getAgenda());
    const unsub = agenda.subscribe(setIds);
    warmModel();
    return unsub;
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  if (err)
    return (
      <Center>
        <p className="text-[var(--color-muted)]">Couldn't load conference data.</p>
        <p className="mt-1 text-[12px] text-[var(--color-faint)]">{err}</p>
      </Center>
    );
  if (!data)
    return (
      <Center>
        <Spinner className="size-6" />
        <p className="mt-3 text-[var(--color-muted)]">Loading the World's Fair…</p>
      </Center>
    );

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col">
      <Header data={data} count={ids.size} tab={tab} setTab={setTab} />
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 md:pb-14">
        {tab === "sessions" && <Sessions data={data} ids={ids} onAsk={() => setTab("ask")} />}
        {tab === "speakers" && <Speakers data={data} />}
        {tab === "ask" && <Ask data={data} ids={ids} />}
        {tab === "agenda" && <AgendaView data={data} ids={ids} onGo={() => setTab("sessions")} />}
        {tab === "more" && <More data={data} />}
      </main>
      <TabBar tab={tab} setTab={setTab} agendaCount={ids.size} />
      <Footer />
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-full place-items-center px-6 text-center">{<div>{children}</div>}</div>;
}

function Header({ data, count, tab, setTab }: { data: AppData; count: number; tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => setTab("sessions")} className="text-left">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-[13px] font-black text-black">
              WF
            </span>
            <h1 className="text-[16px] font-bold tracking-tight">Companion</h1>
            <span className="rounded-full border border-[var(--color-line)] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-[var(--color-faint)]">
              unofficial
            </span>
          </div>
        </button>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors " +
                  (active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]")
                }
              >
                {t.label}
                {t.id === "agenda" && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-black tnum">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="text-right text-[10.5px] text-[var(--color-faint)] tnum md:hidden">
          <div>{data.meta.totalSessions} sessions</div>
          {count > 0 && <div className="text-[var(--color-accent)]">{count} saved</div>}
        </div>
      </div>
    </header>
  );
}

function TabBar({ tab, setTab, agendaCount }: { tab: Tab; setTab: (t: Tab) => void; agendaCount: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors " +
                (active ? "text-[var(--color-accent)]" : "text-[var(--color-faint)]")
              }
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
              {t.label}
              {t.id === "agenda" && agendaCount > 0 && (
                <span className="absolute right-[18%] top-1 grid size-4 place-items-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-black tnum">
                  {agendaCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}

function Footer() {
  return (
    <footer className="hidden border-t border-[var(--color-line)] px-6 py-4 text-center text-[11.5px] text-[var(--color-faint)] md:block">
      Unofficial companion · not affiliated with AI Engineer · built on the conference's open data · by Nicholas Nuraliyev ·{" "}
      <a href="mailto:nicknur7@gmail.com" className="text-[var(--color-accent)]">nicknur7@gmail.com</a>
    </footer>
  );
}

/* ---------------- Hero (the "landing" / advertisement) ---------------- */
function Hero({ data, onAsk }: { data: AppData; onAsk: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)] p-6 sm:p-8">
      <div className="max-w-3xl">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {data.meta.dates} · Moscone West, SF
        </p>
        <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-tight sm:text-[34px]">
          Your companion for the AI Engineer World's Fair
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-muted)] sm:text-[16px]">
          All {data.meta.totalSessions} sessions and {data.meta.totalSpeakers} speakers — searchable, plannable, and
          you can <b className="text-[var(--color-ink)]">ask in plain English what to see</b> and get the right talks
          back, matched right in your browser.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAsk}
            className="rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2.5 text-[14px] font-semibold text-black"
          >
            ✨ Ask what to see
          </button>
          <div className="flex gap-2 text-[12px] text-[var(--color-faint)]">
            <span className="rounded-lg border border-[var(--color-line)] px-2.5 py-2 tnum">{data.meta.totalSessions} sessions</span>
            <span className="rounded-lg border border-[var(--color-line)] px-2.5 py-2 tnum">{data.tracks.length} tracks</span>
            <span className="rounded-lg border border-[var(--color-line)] px-2.5 py-2 tnum">{data.meta.totalSpeakers} speakers</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Sessions ---------------- */
function Sessions({ data, ids, onAsk }: { data: AppData; ids: Set<number>; onAsk: () => void }) {
  const [q, setQ] = useState("");
  const [day, setDay] = useState<string>("");
  const [track, setTrack] = useState<string>("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return data.sessions.filter((s) => {
      if (day && s.day !== day) return false;
      if (track && s.track !== track) return false;
      if (ql) {
        const hay = `${s.title} ${s.track} ${s.description} ${s.speakers.join(" ")}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [data.sessions, q, day, track]);

  return (
    <div className="space-y-4">
      <Hero data={data} onAsk={onAsk} />
      <SearchInput value={q} onChange={setQ} placeholder={`Search ${data.meta.totalSessions} sessions, speakers, topics…`} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={!day} onClick={() => setDay("")}>All days</Chip>
        {data.days.map((d) => (
          <Chip key={d} active={day === d} onClick={() => setDay(d)}>
            {d.match(/Day \d+/)?.[0] ?? d}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={!track} onClick={() => setTrack("")}>All tracks</Chip>
        {data.tracks.map((t) => (
          <Chip key={t} active={track === t} onClick={() => setTrack(track === t ? "" : t)}>
            {t}
          </Chip>
        ))}
      </div>
      <p className="px-1 text-[12px] text-[var(--color-faint)] tnum">{filtered.length} sessions</p>
      <div className="grid gap-2.5 lg:grid-cols-2">
        {filtered.map((s) => (
          <SessionCard key={s.id} session={s} inAgenda={ids.has(s.id)} onToggle={agenda.toggle} />
        ))}
      </div>
      {filtered.length === 0 && <Empty>No sessions match those filters.</Empty>}
    </div>
  );
}

/* ---------------- Speakers ---------------- */
function Speakers({ data }: { data: AppData }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Speaker | null>(null);
  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    if (!ql) return data.speakers;
    return data.speakers.filter((s) =>
      `${s.name} ${s.company ?? ""} ${s.role ?? ""}`.toLowerCase().includes(ql),
    );
  }, [data.speakers, q]);

  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder={`Search ${data.meta.totalSpeakers} speakers & companies…`} />
      <p className="px-1 text-[12px] text-[var(--color-faint)] tnum">{filtered.length} speakers</p>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 300).map((s) => (
          <SpeakerCard key={s.name} speaker={s} onOpen={setOpen} />
        ))}
      </div>
      {filtered.length > 300 && (
        <p className="text-center text-[12px] text-[var(--color-faint)]">Showing first 300 — search to narrow.</p>
      )}
      {open && <SpeakerModal speaker={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SpeakerModal({ speaker, onClose }: { speaker: Speaker; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-bold">{speaker.name}</h2>
            <p className="text-[13px] text-[var(--color-muted)]">{[speaker.role, speaker.company].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-[var(--color-faint)] hover:text-[var(--color-ink)]">✕</button>
        </div>
        {speaker.bio && <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{speaker.bio}</p>}
        {speaker.linkedin && (
          <a href={speaker.linkedin} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] font-medium text-[var(--color-accent)]">
            LinkedIn ↗
          </a>
        )}
        {speaker.sessions && speaker.sessions.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-[var(--color-faint)]">Sessions</div>
            <div className="space-y-2">
              {speaker.sessions.map((s, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
                  <div className="text-[13.5px] font-semibold">{s.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--color-muted)] tnum">
                    {[s.day?.match(/Day \d+/)?.[0], s.time, s.track].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Ask ---------------- */
const PRESETS = [
  "agent memory and long-term context",
  "RAG and retrieval quality",
  "evals and testing AI agents",
  "voice and realtime AI",
  "computer use and autonomous agents",
  "shipping AI to production / reliability",
];

function Ask({ data, ids }: { data: AppData; ids: Set<number> }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Scored[] | null>(null);
  const [mode, setMode] = useState<"semantic" | "keyword" | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(query: string) {
    const text = query.trim();
    if (!text) return;
    setQ(text);
    setLoading(true);
    setResults(keywordSearch(text, data.sessions));
    setMode("keyword");
    try {
      const sem = await semanticSearch(text, data.sessions);
      setResults(sem);
      setMode("semantic");
    } catch {
      /* keep keyword fallback */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-[18px] font-bold">Ask what to see</h2>
        <p className="mb-2 mt-1 text-[13px] text-[var(--color-muted)]">
          Describe what you care about — this matches it semantically against all {data.meta.totalSessions} sessions, right in your browser.
        </p>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(q);
          }}
          rows={2}
          placeholder="e.g. I'm a founder selling AI to enterprises — what should I see?"
          className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 text-[14px] outline-none focus:border-[var(--color-accent)]"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--color-faint)]">⌘/Ctrl + Enter</span>
          <button
            onClick={() => run(q)}
            disabled={loading || !q.trim()}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-50"
          >
            {loading && <Spinner className="border-black/30 border-t-black" />}
            Ask
          </button>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {PRESETS.map((p) => (
          <Chip key={p} onClick={() => run(p)}>{p}</Chip>
        ))}
      </div>

      {mode && (
        <p className="px-1 text-[12px] text-[var(--color-faint)]">
          {mode === "semantic" ? "Semantic matches" : loading ? "Loading AI model… showing keyword matches" : "Keyword matches"}
        </p>
      )}
      <div className="space-y-2.5">
        {results?.map(({ session, score }) => (
          <SessionCard key={session.id} session={session} inAgenda={ids.has(session.id)} onToggle={agenda.toggle} score={mode === "semantic" ? score : undefined} />
        ))}
        {results && results.length === 0 && <Empty>No matches — try describing it differently.</Empty>}
        {!results && <Empty>Ask a question or tap a topic to get tailored picks.</Empty>}
      </div>
    </div>
  );
}

/* ---------------- Agenda ---------------- */
function parseTime(time: string, dateISO: string): { start?: string; end?: string } {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return {};
  const to24 = (h: number, ap: string) => (ap.toLowerCase() === "pm" ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h);
  const d = dateISO.replace(/-/g, "");
  const s = `${d}T${String(to24(+m[1], m[3])).padStart(2, "0")}${m[2]}00`;
  const e = `${d}T${String(to24(+m[4], m[6])).padStart(2, "0")}${m[5]}00`;
  return { start: s, end: e };
}

function AgendaView({ data, ids, onGo }: { data: AppData; ids: Set<number>; onGo: () => void }) {
  const mine = data.sessions.filter((s) => ids.has(s.id));
  const byDay = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    for (const s of mine) (groups[s.day] ||= []).push(s);
    for (const d of Object.keys(groups)) groups[d].sort((a, b) => a.time.localeCompare(b.time));
    return groups;
  }, [mine]);

  function exportICS() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WF Companion//EN"];
    for (const s of mine) {
      const dayKey = s.day.match(/Day \d+/)?.[0] ?? "";
      const { start, end } = parseTime(s.time, DAY_DATE[dayKey] ?? "2026-06-29");
      lines.push("BEGIN:VEVENT");
      lines.push(`SUMMARY:${s.title.replace(/[\n,;]/g, " ")}`);
      if (start) lines.push(`DTSTART;TZID=America/Los_Angeles:${start}`);
      if (end) lines.push(`DTEND;TZID=America/Los_Angeles:${end}`);
      lines.push(`LOCATION:${(s.room || "Moscone West").replace(/[\n,;]/g, " ")}`);
      lines.push(`DESCRIPTION:${[s.track, s.speakers.join(", ")].filter(Boolean).join(" — ").replace(/[\n,;]/g, " ")}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wf2026-agenda.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (mine.length === 0)
    return (
      <Empty>
        <p>Your agenda is empty.</p>
        <p className="mt-1 text-[var(--color-faint)]">Tap the ☆ on any session to save it here.</p>
        <button onClick={onGo} className="mt-3 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-black">
          Browse sessions
        </button>
      </Empty>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--color-faint)] tnum">{mine.length} saved</p>
        <div className="flex gap-2">
          <button onClick={exportICS} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-muted)]">
            Export .ics
          </button>
          <button
            onClick={() => confirm("Clear your whole agenda?") && agenda.clearAgenda()}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-faint)]"
          >
            Clear
          </button>
        </div>
      </div>
      {data.days
        .filter((d) => byDay[d]?.length)
        .map((d) => {
          const items = byDay[d];
          const seen: Record<string, number> = {};
          items.forEach((s) => (seen[s.time] = (seen[s.time] || 0) + 1));
          return (
            <div key={d}>
              <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-muted)]">{d}</h2>
              <div className="space-y-2.5">
                {items.map((s) => (
                  <div key={s.id}>
                    {seen[s.time] > 1 && (
                      <div className="mb-1 ml-1 text-[10.5px] font-medium text-[var(--color-accent-2)]">⚠ overlaps another saved session</div>
                    )}
                    <SessionCard session={s} inAgenda onToggle={agenda.toggle} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

/* ---------------- More ---------------- */
function More({ data }: { data: AppData }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-muted)]">Get around the venue</h2>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="text-[13px] text-[var(--color-muted)]">
            Everything's in <b className="text-[var(--color-ink)]">Moscone West</b> — Level 1 expo & registration, Level 2 breakouts, Level 3 keynotes.
          </p>
          <a href="https://www.ai.engineer/worldsfair/2026/map" target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-medium text-[var(--color-accent)]">
            Official floor plan ↗
          </a>
          <div className="mt-3 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 text-[12px] text-[var(--color-faint)]">
            <b className="text-[var(--color-muted)]">Coming soon:</b> live in-venue booth navigation (AR walking directions + minimap). Needs the venue's booth coordinates — on the roadmap.
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-muted)]">Side events ({data.sideEvents.length})</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.sideEvents.map((e: SideEvent, i: number) => (
            <a
              key={i}
              href={e.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[14px] font-semibold">{e.name}</div>
                <div className="shrink-0 text-[11px] text-[var(--color-faint)] tnum">{e.day}</div>
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                {[e.time, e.location, e.presenter].filter(Boolean).join(" · ")}
              </div>
              {e.description && <p className="mt-1.5 line-clamp-2 text-[12.5px] text-[var(--color-faint)]">{e.description}</p>}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-muted)]">About</h2>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
          <p>
            An <b className="text-[var(--color-ink)]">unofficial</b> companion for the AI Engineer World's Fair 2026 — not affiliated with AI Engineer.
            Built on the conference's open <code className="text-[var(--color-faint)]">sessions.json</code> / <code className="text-[var(--color-faint)]">speakers.json</code>.
            "Ask what to see" runs a real embedding model entirely in your browser — no server, no tracking.
          </p>
          <p className="mt-3 text-[var(--color-faint)]">
            Built by Nicholas Nuraliyev · <a href="mailto:nicknur7@gmail.com" className="text-[var(--color-accent)]">nicknur7@gmail.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center text-[13px] text-[var(--color-faint)]">
      {children}
    </div>
  );
}
