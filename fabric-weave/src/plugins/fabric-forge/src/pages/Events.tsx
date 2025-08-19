import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { EventCard } from '../components/EventCard';

export default function EventsPage() {
  const { events } = useForge();
  return (
    <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map(e => <EventCard key={e.id} e={e} />)}
      {!events.length && <div className="p-6 text-sm text-muted-foreground">No events scheduled.</div>}
    </div>
  );
}
