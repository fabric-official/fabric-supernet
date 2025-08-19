import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { FeedComposer } from '../components/FeedComposer';
import { FeedItem } from '../components/FeedItem';

export default function CommunityPage() {
  const { feed } = useForge();
  return (
    <div className="divide-y">
      <FeedComposer />
      <div className="max-h-[70vh] overflow-y-auto">
        {feed.map(p => <FeedItem key={p.id} post={p} />)}
        {!feed.length && <div className="p-6 text-sm text-muted-foreground">No posts yet. Start the conversation.</div>}
      </div>
    </div>
  );
}
