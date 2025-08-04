import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Message } from './types';

export default async function AdminMessages() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Fetch messages with user profiles and replies
  const { data, error } = await supabase
    .from('contact_messages')
    .select(`
      *,
      user:profiles(id, name, email),
      replies:admin_replies(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error details:', error);
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">گفتگوها</h1>
          <p className="text-center text-red-500">خطا در دریافت پیام‌ها</p>
          <p className="text-center text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">گفتگوها</h1>
          <p className="text-center text-gray-500">هیچ گفتگویی موجود نیست</p>
        </div>
      </div>
    );
  }

  // Transform the data to match the Message type and group by subject
  const messages = data.map(item => ({
    ...item,
    profiles: {
      id: item.user?.id,
      name: item.user?.name,
      email: item.user?.email
    },
    replies: item.replies || []
  })) as Message[];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">گفتگوها</h1>
        <div className="space-y-4">
          {messages.map((message) => {
            const totalMessages = 1 + (message.replies?.length || 0);
            const lastMessage = message.replies?.length ? 
              message.replies[message.replies.length - 1].reply_text : 
              message.message;
            const lastMessageTime = message.replies?.length ? 
              message.replies[message.replies.length - 1].created_at : 
              message.created_at;

            return (
              <Link 
                key={message.id}
                href={`/admin/messages/${message.id}`}
                className="block bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{message.subject}</h3>
                      <span className="text-sm text-gray-400">({message.profiles.name})</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{lastMessage}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {new Date(lastMessageTime).toLocaleDateString('fa-IR')}
                    </div>
                    <div className="text-xs text-orange-400 mt-1">
                      {totalMessages} پیام
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 