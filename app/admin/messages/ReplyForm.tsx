'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/use-toast';
import { MessageReply } from './types';

interface ReplyFormProps {
  messageId: string;
  onReplySuccess: (reply: MessageReply) => void;
}

export default function ReplyForm({ messageId, onReplySuccess }: ReplyFormProps) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('admin_replies')
        .insert({
          message_id: messageId,
          admin_id: session.user.id,
          reply_text: replyText
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "پاسخ با موفقیت ارسال شد",
        description: "پاسخ شما به پیام کاربر با موفقیت ثبت شد.",
      });

      setReplyText('');
      onReplySuccess(data as MessageReply);

    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "خطا در ارسال پاسخ",
        description: "متأسفانه در ارسال پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="پاسخ خود را اینجا بنویسید..."
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md min-h-[100px] mb-2 text-white placeholder-gray-400"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !replyText.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600"
      >
        {isSubmitting ? 'در حال ارسال...' : 'ارسال پاسخ'}
      </button>
    </form>
  );
} 