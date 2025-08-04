'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/utils';

interface Message {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  formatted_time: string;
  user_id: string;
  admin_replies?: AdminReply[];
  user_replies?: UserReply[];
  profiles?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AdminReply {
  id: string;
  reply_text: string;
  created_at: string;
  formatted_time: string;
  admin_id: string;
}

interface UserReply {
  id: string;
  reply_text: string;
  created_at: string;
  formatted_time: string;
  user_id: string;
}

interface ThreadItem {
  id: string;
  message: string;
  created_at: string;
  formatted_time: string;
  isAdmin: boolean;
}

interface MessageThreadProps {
  message: Message;
  user: User;
}

export default function MessageThread({ message, user }: MessageThreadProps) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ThreadItem[]>(() => {
      // console.log('MessageThread received:', {
      //   message: message.message,
      //   admin_replies: message.admin_replies,
      //   user_replies: message.user_replies
      // });

    // Convert initial message to thread format
    const initialMessage: ThreadItem = {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      formatted_time: formatDateTime(message.created_at),
      isAdmin: false
    };

    // Convert all replies to thread format
    const adminReplies = (message.admin_replies || []).map(reply => ({
      id: reply.id,
      message: reply.reply_text,
      created_at: reply.created_at,
      formatted_time: formatDateTime(reply.created_at),
      isAdmin: true
    }));

    const userReplies = (message.user_replies || []).map(reply => ({
      id: reply.id,
      message: reply.reply_text,
      created_at: reply.created_at,
      formatted_time: formatDateTime(reply.created_at),
      isAdmin: false
    }));

    // Combine all messages and sort by creation time
    const allMessages = [initialMessage, ...adminReplies, ...userReplies]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // console.log('Processed thread messages:', allMessages);

    return allMessages;
  });

  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);

    try {
      // First, insert the reply
      const { data: replyData, error: insertError } = await supabase
        .from('admin_replies')
        .insert([{
          message_id: message.id,
          admin_id: user.id,
          reply_text: replyText.trim()
        }])
        .select('*, created_at')
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw insertError;
      }

      if (!replyData) {
        throw new Error('No data returned from insert');
      }

      // Add the new reply to the thread
      const newReply: ThreadItem = {
        id: replyData.id,
        message: replyData.reply_text,
        created_at: replyData.created_at,
        formatted_time: formatDateTime(replyData.created_at),
        isAdmin: true
      };

      setThreadMessages(prev => [...prev, newReply]);
      setReplyText('');
      
      toast({
        title: "پاسخ ارسال شد",
        description: "پاسخ شما با موفقیت ثبت شد.",
        variant: "default",
      });

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "خطا",
        description: "متأسفانه در ارسال پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {threadMessages.map((item) => (
          <div
            key={item.id}
            className={`flex ${item.isAdmin ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                item.isAdmin
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <p className="text-sm mb-2">{item.message}</p>
              <div className={`text-xs ${item.isAdmin ? 'text-orange-200' : 'text-gray-400'}`}>
                {item.formatted_time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
            placeholder="پاسخ خود را اینجا بنویسید..."
            rows={1}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !replyText.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {isSubmitting ? '...' : 'ارسال'}
          </button>
        </div>
      </form>
    </div>
  );
} 