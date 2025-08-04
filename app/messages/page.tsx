import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Message } from '@/app/admin/messages/types';
import dynamic from "next/dynamic";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
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

  // Fetch user's messages with latest reply information
  const { data: messages, error } = await supabase
    .from('contact_messages')
    .select(`
      *,
      admin_replies(
        id,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
  }

  // Transform the messages to include conversation status
  const transformedMessages = messages?.map(message => {
    const latestAdminReply = message.admin_replies?.[0];
    const messageDate = new Date(message.created_at);
    const latestAdminReplyDate = latestAdminReply ? new Date(latestAdminReply.created_at) : null;
    
    const isWaitingForReply = !latestAdminReplyDate || messageDate > latestAdminReplyDate;

    return {
      ...message,
      status: isWaitingForReply ? 'در انتظار پاسخ' : 'پاسخ داده شده'
    };
  });

  return (
    <MessagesClient>
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">پیام‌های من</h1>
            <Link 
              href="/messages/new"
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              پیام جدید
            </Link>
          </div>

          <div className="space-y-4">
            {transformedMessages && transformedMessages.length > 0 ? (
              transformedMessages.map((message) => (
                <Link 
                  key={message.id} 
                  href={`/messages/${message.id}`}
                  prefetch={false}
                  className="block bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white mb-2">{message.subject}</h3>
                      <p className={`text-sm ${message.status === 'در انتظار پاسخ' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {message.status}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(message.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8 bg-gray-800 rounded-lg border border-gray-700">
                هنوز پیامی ندارید
              </div>
            )}
          </div>
        </div>
      </div>
    </MessagesClient>
  );
} 