'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types/database';

export default function ChatView({ initialMessages, currentUserId }: { initialMessages: ChatMessage[]; currentUserId: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('couple-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const message = payload.new as ChatMessage;
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ sender_id: currentUserId, body })
      .select()
      .single();
    if (!error && data) {
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
      setDraft('');
    }
    setSending(false);
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col">
      <div className="border-b border-line px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wine text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl italic text-ink">Our chat</h1>
            <p className="text-sm text-ink-soft">A private conversation for the two of you.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && <p className="py-12 text-center text-sm text-ink-soft">Start a little conversation.</p>}
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[65%] ${mine ? 'rounded-br-sm bg-wine text-white' : 'rounded-bl-sm border border-line bg-paper-raised text-ink'}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-soft'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-line bg-paper/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message..."
            rows={1}
            maxLength={2000}
            className="input max-h-32 resize-y"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine text-white disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
