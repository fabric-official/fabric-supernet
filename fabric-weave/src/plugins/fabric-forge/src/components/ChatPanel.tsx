import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export function ChatPanel() {
  const { rooms, chat, sendChat } = useForge();
  const [room, setRoom] = React.useState<string>(rooms[0] || 'general');
  const [text, setText] = React.useState('');
  const listRef = React.useRef<HTMLDivElement>(null);

  const msgs = chat[room] || [];

  React.useEffect(() => {
    // scroll to bottom on new messages
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, room]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const v = text.trim();
    setText('');
    try { await sendChat(room, v); } catch {}
  };

  return (
    <div className="grid grid-rows-[auto,1fr,auto] h-[65vh]">
      <div className="p-3 border-b flex gap-2">
        <select value={room} onChange={e=>setRoom(e.target.value)} className="px-2 py-1 rounded-md border">
          {rooms.map(r => <option key={r} value={r}>#{r}</option>)}
        </select>
        <div className="text-sm text-muted-foreground self-center">Live developer chat</div>
      </div>
      <div ref={listRef} className="p-3 overflow-y-auto space-y-2">
        {msgs.map(m => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.author.name}</span>
            <span className="text-muted-foreground text-xs"> â€” {new Date(m.createdAt).toLocaleTimeString()}</span>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {!msgs.length && <div className="text-xs text-muted-foreground">No messages yet. Be the first to say hi ðŸ‘‹</div>}
      </div>
      <form onSubmit={onSend} className="p-3 border-t flex gap-2">
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a messageâ€¦" maxLength={4000} />
        <Button type="submit" title="Send"><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}
