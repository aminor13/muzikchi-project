'use client';

import { useState } from 'react';
import { Message } from '@/app/admin/messages/types';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/use-toast';

interface MessagesListProps {
  initialMessages: Message[];
}

export default function MessagesList({ initialMessages }: MessagesListProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: messages.find(m => m.id === messageId)?.user_id,
            subject: `پاسخ به پیام #${messageId}`,
            message: `در پاسخ به پیام ${messageId}:\n\n${replyText}`
          }
        ]);

      if (error) throw error;

      toast({
        title: "پاسخ ارسال شد",
        description: "پاسخ شما با موفقیت ثبت شد."
      });

      // Refresh messages
      window.location.reload();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "خطا در ارسال پاسخ",
        description: "متأسفانه در ارسال پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setReplyingTo(null);
      setReplyText('');
    }
  };

  if (messages.length === 0) {
    return (
      <p className="text-center text-gray-400">شما هنوز پیامی ارسال نکرده‌اید</p>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">پیام</span>
              <span className="text-gray-400 text-sm">{message.id.split('-').pop()}</span>
            </div>
            <p className="text-sm text-gray-400">
              {new Date(message.created_at).toLocaleDateString('fa-IR')}
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-white mb-2">{message.subject}</h3>
            <p className="text-gray-300">{message.message}</p>
          </div>

          {message.replies && message.replies.length > 0 && (
            <div className="space-y-3">
              {message.replies.map((reply) => (
                <div key={reply.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300">پاسخ ادمین</span>
                    <span className="text-sm text-gray-400">
                      {new Date(reply.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mb-2">
                    <p className="text-sm text-gray-300">{reply.reply_text}</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setReplyingTo(message.id)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      پاسخ به این پیام
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyingTo === message.id && (
            <div className="mt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 h-24"
                placeholder="پاسخ خود را اینجا بنویسید..."
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-sm text-gray-300 hover:text-white"
                  disabled={isSubmitting}
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleReply(message.id)}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ارسال...' : 'ارسال پاسخ'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 