'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface NewMessageFormProps {
  user: User;
}

export default function NewMessageForm({ user }: NewMessageFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً موضوع و متن پیام را وارد کنید.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, check if we can insert the message
      const { data, error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          message: message.trim()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw new Error(insertError.message);
      }

      if (!data?.id) {
        throw new Error('پیام ایجاد شد اما شناسه آن دریافت نشد');
      }

      toast({
        title: "پیام ارسال شد",
        description: "پیام شما با موفقیت ثبت شد."
      });

      // Use replace instead of push to prevent going back to the form
      router.replace(`/messages/${data.id}`);
      
    } catch (error: any) {
      console.error('Error details:', error);
      
      let errorMessage = "متأسفانه در ارسال پیام خطایی رخ داد. لطفاً دوباره تلاش کنید.";
      if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      
      toast({
        title: "خطا در ارسال پیام",
        description: errorMessage,
        variant: "destructive"
      });
      
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-200 mb-1">
          موضوع
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
          placeholder="موضوع پیام خود را وارد کنید"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-1">
          متن پیام
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 h-32"
          placeholder="پیام خود را اینجا بنویسید..."
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-300 hover:text-white"
          disabled={isSubmitting}
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          {isSubmitting ? 'در حال ارسال...' : 'ارسال پیام'}
        </button>
      </div>
    </form>
  );
} 