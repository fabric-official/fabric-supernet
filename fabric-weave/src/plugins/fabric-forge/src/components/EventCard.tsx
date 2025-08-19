import * as React from 'react';
import type { Event } from '../state/ForgeContext';

export function EventCard({ e }: { e: Event }) {
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  return (
    <div className="p-4 rounded-xl border space-y-2">
      <div className="font-semibold">{e.title}</div>
      <div className="text-xs text-muted-foreground">{start.toLocaleString()} â€” {end.toLocaleTimeString()}</div>
      <div className="text-xs">{e.location}</div>
      <p className="text-sm">{e.description}</p>
    </div>
  );
}
