import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { CourseCard } from '../components/CourseCard';

export default function CoursesPage() {
  const { courses } = useForge();
  return (
    <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map(c => <CourseCard key={c.id} c={c} />)}
      {!courses.length && <div className="p-6 text-sm text-muted-foreground">No courses yet.</div>}
    </div>
  );
}
