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
}

interface AdminReply {
  id: string;
  message_id: string;
  reply_text: string;
  created_at: string;
  formatted_time: string;
  admin_id: string;
}

interface UserReply {
  id: string;
  message_id: string;
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
  const [threadMessages, setThreadMessages] = useState<ThreadItem[]>(() => {
    // Convert initial message to thread format
    const initialMessage: ThreadItem = {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      formatted_time: formatDateTime(message.created_at),
      isAdmin: false
    };

    // Convert all replies to thread format and sort by creation time
    const allReplies: ThreadItem[] = [
      ...(message.admin_replies || []).map(reply => ({
        id: reply.id,
        message: reply.reply_text,
        created_at: reply.created_at,
        formatted_time: formatDateTime(reply.created_at),
        isAdmin: true
      })),
      ...(message.user_replies || []).map(reply => ({
        id: reply.id,
        message: reply.reply_text,
        created_at: reply.created_at,
        formatted_time: formatDateTime(reply.created_at),
        isAdmin: false
      }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return [initialMessage, ...allReplies];
  });

  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data: replyData, error: insertError } = await supabase
        .from('user_replies')
        .insert([
          {
            message_id: message.id,
            user_id: user.id,
            reply_text: newReply.trim()
          }
        ])
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
      const newMessage: ThreadItem = {
        id: replyData.id,
        message: replyData.reply_text,
        created_at: replyData.created_at,
        formatted_time: formatDateTime(replyData.created_at),
        isAdmin: false
      };

      setThreadMessages(prev => [...prev, newMessage]);
      setNewReply('');
      toast({
        title: "پیام ارسال شد",
        description: "پاسخ شما با موفقیت ثبت شد.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error in handleSubmitReply:', error);
      toast({
        title: "خطا",
        description: "متأسفانه در ارسال پیام مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 mb-4">
        {threadMessages.map((item) => (
          <div
            key={item.id}
            className={`flex ${item.isAdmin ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                !item.isAdmin
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-white border border-gray-700'
              }`}
            >
              <p className="text-sm mb-2">{item.message}</p>
              <div className={`text-xs ${!item.isAdmin ? 'text-orange-200' : 'text-gray-400'}`}>
                {item.formatted_time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmitReply} className="mt-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="پاسخ خود را بنویسید..."
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newReply.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
          </button>
        </div>
      </form>
    </div>
  );
} 