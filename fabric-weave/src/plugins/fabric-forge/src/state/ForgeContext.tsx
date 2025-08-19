import * as React from 'react';
import { z } from 'zod';
import { apiGet, apiPost, openWS, openSSE } from '../api/client';

// ---- Schemas ----
const FeedPost = z.object({
  id: z.string(),
  author: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
  text: z.string().max(4000),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  tags: z.array(z.string()).default([])
});
export type FeedPost = z.infer<typeof FeedPost>;

const ChatMessage = z.object({
  id: z.string(),
  room: z.string(),
  author: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
  text: z.string().max(4000)
});
export type ChatMessage = z.infer<typeof ChatMessage>;

const Course = z.object({
  id: z.string(),
  title: z.string(),
  level: z.enum(['intro','intermediate','advanced']),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    durationMin: z.number().int().positive(),
    lockedUntilLevel: z.number().int().nonnegative().default(0)
  })),
  description: z.string().default('')
});
export type Course = z.infer<typeof Course>;

const Event = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  location: z.string().default('Online'),
  description: z.string().default('')
});
export type Event = z.infer<typeof Event>;

const Agent = z.object({
  id: z.string(),
  name: z.string(),
  repo: z.string(),
  forks: z.number().int().nonnegative(),
  royaltiesUsd: z.number().nonnegative().default(0),
  xpAward: z.number().int().nonnegative().default(0),
  summary: z.string().default('')
});
export type Agent = z.infer<typeof Agent>;

type ForgeState = {
  feed: FeedPost[];
  chat: { [room: string]: ChatMessage[] };
  courses: Course[];
  events: Event[];
  agents: Agent[];
  xp: { userId: string; level: number; points: number; nextLevelAt: number };
  rooms: string[];
  sendChat(room: string, text: string): Promise<void>;
  createPost(text: string, tags?: string[]): Promise<void>;
  reload(): Promise<void>;
};

const ForgeCtx = React.createContext<ForgeState | null>(null);

export function ForgeProvider({ children }: { children: React.ReactNode }) {
  const [feed, setFeed] = React.useState<FeedPost[]>([]);
  const [chat, setChat] = React.useState<Record<string, ChatMessage[]>>({});
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [xp, setXp] = React.useState({ userId: 'me', level: 1, points: 0, nextLevelAt: 100 });
  const rooms = React.useMemo(() => ['general','help','showcase'], []);

  // Initial load
  const reload = React.useCallback(async () => {
    try {
      const [f, c, e, a, x] = await Promise.all([
        apiGet('/forge/feed', z.array(FeedPost)),
        apiGet('/forge/courses', z.array(Course)),
        apiGet('/forge/events', z.array(Event)),
        apiGet('/forge/agents', z.array(Agent)),
        apiGet('/forge/xp', z.object({ userId: z.string(), level: z.number().int(), points: z.number().int(), nextLevelAt: z.number().int() }))
      ]);
      setFeed(f); setCourses(c); setEvents(e); setAgents(a); setXp(x);
    } catch {
      // Keep UI usable with empty state
    }
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  // Live updates via WS or SSE
  React.useEffect(() => {
    let es: EventSource | null = null;
    const unsub = openWS('/api/forge/chat', (data:any) => {
      const parsed = ChatMessage.safeParse(data);
      if (parsed.success) {
        const m = parsed.data;
        setChat(prev => ({ ...prev, [m.room]: [...(prev[m.room]||[]), m].slice(-500) }));
      }
    }, () => {});
    // Fallback SSE for feed updates
    es = openSSE('/forge/feed/stream', (data:any) => {
      const p = FeedPost.safeParse(data);
      if (p.success) setFeed(prev => [p.data, ...prev].slice(0, 500));
    });
    return () => { try { (unsub as any)?.close?.(); } catch {}; try { es?.close(); } catch {} };
  }, []);

  const sendChat = React.useCallback(async (room: string, text: string) => {
    const payload = { room, text };
    await apiPost('/forge/chat', payload, z.object({ ok: z.boolean() }));
  }, []);

  const createPost = React.useCallback(async (text: string, tags: string[] = []) => {
    const payload = { text, tags };
    await apiPost('/forge/feed', payload, z.object({ ok: z.boolean(), post: FeedPost }));
    // Optimistic reload; server will also push via SSE
    await reload();
  }, [reload]);

  const value: ForgeState = { feed, chat, courses, events, agents, xp, rooms, sendChat, createPost, reload };
  return <ForgeCtx.Provider value={value}>{children}</ForgeCtx.Provider>;
}

export function useForge() {
  const ctx = React.useContext(ForgeCtx);
  if (!ctx) throw new Error('ForgeProvider missing');
  return ctx;
}
