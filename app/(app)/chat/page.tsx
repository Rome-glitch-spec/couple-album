import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatView from '@/components/ChatView';
import type { ChatMessage } from '@/types/database';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(200);

  return <ChatView initialMessages={(messages ?? []) as ChatMessage[]} currentUserId={user.id} />;
}
