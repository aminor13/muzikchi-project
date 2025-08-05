import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MessageThread from './MessageThread';
import { formatDateTime } from '@/lib/utils';

interface MessagePageProps {
  params: Promise<{
    id: string;
  }>;
}

interface AdminReply {
  id: string;
  reply_text: string;
  created_at: string;
}

interface UserReply {
  id: string;
  reply_text: string;
  created_at: string;
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  // Convert to Tehran timezone
  const tehranTime = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tehran'
  }).format(date);
  return tehranTime;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const resolvedParams = await params;
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

  try {
    // Fetch the message and admin replies
    const { data: message, error } = await supabase
      .from('contact_messages')
      .select(`
        *,
        admin_replies(id, reply_text, created_at, admin_id)
      `)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single();

    if (error || !message) {
      console.error('Error fetching message:', error);
      redirect('/messages');
    }

    // Fetch user replies separately
    const { data: userReplies, error: userRepliesError } = await supabase
      .from('user_replies')
      .select('*')
      .eq('message_id', resolvedParams.id);

    if (userRepliesError) {
      console.error('Error fetching user replies:', userRepliesError);
      // Continue without user replies rather than redirecting
    }

    // Format the message with all replies
    const formattedMessage = {
      ...message,
      formatted_time: formatDateTime(message.created_at),
      admin_replies: (message.admin_replies || []).map((reply: AdminReply) => ({
        ...reply,
        formatted_time: formatDateTime(reply.created_at)
      })),
      user_replies: (userReplies || []).map((reply: UserReply) => ({
        ...reply,
        formatted_time: formatDateTime(reply.created_at)
      }))
    };

    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link 
                href="/messages"
                className="text-orange-400 hover:text-orange-300 mb-2 inline-block"
              >
                ← بازگشت به لیست پیام‌ها
              </Link>
              <h1 className="text-2xl font-bold text-white">موضوع: {formattedMessage.subject}</h1>
            </div>
            <div className="text-sm text-gray-400">
              {new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Tehran'
              }).format(new Date(formattedMessage.created_at))}
            </div>
          </div>

          <MessageThread message={formattedMessage} user={user} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in MessagePage:', error);
    redirect('/messages');
  }
} 