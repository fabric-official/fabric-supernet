import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { XpBadge } from '../components/XpBadge';

export default function XpPage() {
  const { xp } = useForge();
  return (
    <div className="p-4">
      <XpBadge level={xp.level} points={xp.points} nextLevelAt={xp.nextLevelAt} />
      <div className="mt-4 text-sm text-muted-foreground">
        Earn XP by publishing agents, contributing tutorials, answering questions, and merging PRs.
      </div>
    </div>
  );
}
