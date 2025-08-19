import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag } from 'lucide-react';

export function FeedComposer() {
  const { createPost } = useForge();
  const [text, setText] = React.useState('');
  const [tags, setTags] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const tagArr = tags.split(',').map(s => s.trim()).filter(Boolean);
      await createPost(text.trim(), tagArr);
      setText(''); setTags('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 flex flex-col gap-2 border-b">
      <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Share an update, ask a questionâ€¦" maxLength={4000} />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Tag className="w-4 h-4" /><span>Comma-separated tags (optional)</span>
        </div>
        <Input value={tags} onChange={e=>setTags(e.target.value)} placeholder="agents, audit, XP" />
        <Button type="submit" disabled={loading}>{loading ? 'Postingâ€¦' : 'Post'}</Button>
      </div>
    </form>
  );
}
