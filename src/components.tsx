import { useState } from "react";
import type { Session, Speaker } from "./types";
import { SPEAKER_IMG_BASE } from "./lib/data";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={"inline-block size-4 rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-accent)] spin " + className}
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
        (active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-ink)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)]")
      }
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-faint)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] py-2.5 pl-9 pr-9 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-faint)] outline-none focus:border-[var(--color-accent)]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[var(--color-faint)] hover:text-[var(--color-ink)]"
          aria-label="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function shortDay(day: string): string {
  const m = day.match(/Day\s*\d+/i);
  return m ? m[0] : day;
}

export function Star({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Remove from agenda" : "Add to agenda"}
      aria-pressed={active}
      className={
        "shrink-0 rounded-lg border p-2 transition-colors " +
        (active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
          : "border-[var(--color-line)] text-[var(--color-faint)] hover:text-[var(--color-ink)]")
      }
    >
      <svg className="size-4" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

export function SessionCard({
  session,
  inAgenda,
  onToggle,
  score,
}: {
  session: Session;
  inAgenda: boolean;
  onToggle: (id: number) => void;
  score?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 font-medium text-[var(--color-muted)] tnum">{shortDay(session.day)}</span>
            <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[var(--color-muted)] tnum">{session.time}</span>
            {session.track && (
              <span className="rounded-md bg-[var(--color-accent)]/12 px-1.5 py-0.5 font-medium text-[var(--color-accent)]">{session.track}</span>
            )}
            {session.room && session.room !== session.track && (
              <span className="text-[var(--color-faint)]">· {session.room}</span>
            )}
            {typeof score === "number" && (
              <span className="ml-auto rounded-md bg-[var(--color-accent-2)]/15 px-1.5 py-0.5 font-medium text-[var(--color-accent-2)] tnum">
                {Math.round(score * 100)}% match
              </span>
            )}
          </div>
          <button onClick={() => setOpen((o) => !o)} className="text-left">
            <h3 className="text-[15px] font-semibold leading-snug text-[var(--color-ink)]">{session.title}</h3>
          </button>
          {session.speakers.length > 0 && (
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">{session.speakers.join(", ")}</p>
          )}
          {open && session.description && (
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-muted)]">{session.description}</p>
          )}
          {session.description && (
            <button onClick={() => setOpen((o) => !o)} className="mt-1.5 text-[12px] font-medium text-[var(--color-accent)]">
              {open ? "Show less" : "Details"}
            </button>
          )}
        </div>
        <Star active={inAgenda} onClick={() => onToggle(session.id)} />
      </div>
    </div>
  );
}

export function SpeakerCard({ speaker, onOpen }: { speaker: Speaker; onOpen: (s: Speaker) => void }) {
  const [imgOk, setImgOk] = useState(true);
  const initials = speaker.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <button
      onClick={() => onOpen(speaker)}
      className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-[var(--color-accent)]"
    >
      {speaker.photoUrl && imgOk ? (
        <img
          src={SPEAKER_IMG_BASE + speaker.photoUrl}
          alt={speaker.name}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--color-surface-2)] text-[13px] font-semibold text-[var(--color-muted)]">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold text-[var(--color-ink)]">{speaker.name}</div>
        <div className="truncate text-[12px] text-[var(--color-muted)]">
          {[speaker.role, speaker.company].filter(Boolean).join(" · ")}
        </div>
      </div>
    </button>
  );
}
