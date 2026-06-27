// Personal agenda persisted in localStorage. No accounts, no backend.
const KEY = "aiewf-agenda-v1";

type Listener = (ids: Set<number>) => void;
const listeners = new Set<Listener>();

function read(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function write(ids: Set<number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((l) => l(new Set(ids)));
}

export function getAgenda(): Set<number> {
  return read();
}

export function toggle(id: number) {
  const ids = read();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  write(ids);
}

export function has(id: number): boolean {
  return read().has(id);
}

export function clearAgenda() {
  write(new Set());
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
