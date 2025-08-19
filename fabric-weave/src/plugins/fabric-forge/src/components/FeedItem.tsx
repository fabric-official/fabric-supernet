import * as React from 'react';
import type { FeedPost } from '../state/ForgeContext';
import { escapeHtml } from '../utils/sanitize';

export function FeedItem({ post }: { post: FeedPost }) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="font-medium">{post.author.name}</div>
        <div className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {escapeHtml(post.text)}
      </p>
      {post.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {post.tags.map(t => <span key={t} className="px-2 py-0.5 bg-muted rounded-full">#{t}</span>)}
        </div>
      ) : null}
      <div className="mt-2 text-xs text-muted-foreground">
        {post.likes} likes â€¢ {post.comments} comments
      </div>
    </div>
  );
}
