import * as React from 'react';
import type { Agent } from '../state/ForgeContext';
import { ExternalLink } from 'lucide-react';

export function AgentCard({ a }: { a: Agent }) {
  return (
    <div className="p-4 rounded-xl border space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{a.name}</div>
        <a href={a.repo} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline">
          repo <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-sm">{a.summary}</p>
      <div className="text-xs text-muted-foreground">Forks: {a.forks} â€¢ Royalties: ${a.royaltiesUsd.toLocaleString()} â€¢ XP Award: {a.xpAward}</div>
    </div>
  );
}
