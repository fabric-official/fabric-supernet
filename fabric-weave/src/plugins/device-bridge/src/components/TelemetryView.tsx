import * as React from 'react';
import { useBridge } from '../state/BridgeContext';

export function TelemetryView() {
  const { telemetry } = useBridge();
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [telemetry.length]);

  return (
    <div ref={listRef} className="p-4 h-[70vh] overflow-y-auto space-y-2">
      {telemetry.map(ev => (
        <div key={ev.id} className="text-xs">
          <span className="inline-block min-w-24 text-muted-foreground">{new Date(ev.at).toLocaleTimeString()}</span>
          <span className={`px-2 py-0.5 rounded-full mr-2 ${ev.level === 'error' ? 'bg-red-600/10 text-red-600' : ev.level === 'warn' ? 'bg-yellow-600/10 text-yellow-700' : 'bg-green-600/10 text-green-700'}`}>{ev.level}</span>
          <span className="font-mono">{ev.deviceId}</span>
          <span className="ml-2">{ev.message}</span>
        </div>
      ))}
      {!telemetry.length && <div className="text-xs text-muted-foreground">Waiting for telemetryâ€¦</div>}
    </div>
  );
}
