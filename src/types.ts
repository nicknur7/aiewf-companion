export interface Session {
  id: number; // index into the sessions array — aligns with embeddings
  title: string;
  description: string;
  day: string; // "Day 1 — Workshop Day" ...
  time: string; // "9:00am-11:00am"
  room: string;
  type: string; // "sponsor" | "talk" | ...
  track: string;
  status: string;
  speakers: string[];
}

export interface Speaker {
  name: string;
  role?: string;
  company?: string;
  bio?: string;
  linkedin?: string;
  photoUrl?: string;
  sessions?: { title: string; day?: string; time?: string; track?: string; room?: string }[];
}

export interface SideEvent {
  name: string;
  presenter?: string;
  date?: string;
  time?: string;
  location?: string;
  sortDate?: string;
  day?: string;
  description?: string;
  href?: string;
  cta?: string;
  image?: string;
}

export interface Meta {
  conference: string;
  dates: string;
  location: string;
  totalSessions?: number;
  totalSpeakers?: number;
}
