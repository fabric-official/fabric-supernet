import * as React from 'react';

export function XpBadge({ level, points, nextLevelAt }: { level: number; points: number; nextLevelAt: number }) {
  const pct = Math.min(100, Math.floor((points/nextLevelAt)*100));
  return (
    <div className="p-4 border rounded-xl space-y-2">
      <div className="text-sm">Level <span className="font-semibold">{level}</span></div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: pct + '%' }} />
      </div>
      <div className="text-xs text-muted-foreground">{points} / {nextLevelAt} XP</div>
    </div>
  );
}
