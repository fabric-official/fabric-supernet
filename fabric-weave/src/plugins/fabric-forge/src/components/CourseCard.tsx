import * as React from 'react';
import type { Course } from '../state/ForgeContext';

export function CourseCard({ c }: { c: Course }) {
  return (
    <div className="p-4 rounded-xl border space-y-2">
      <div className="font-semibold">{c.title}</div>
      <div className="text-xs text-muted-foreground capitalize">{c.level}</div>
      <p className="text-sm">{c.description}</p>
      <div className="text-xs text-muted-foreground">{c.lessons.length} lessons</div>
    </div>
  );
}
