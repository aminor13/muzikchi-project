'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@supabase/supabase-js';

interface ContactFormProps {
  user: User;
}

export default function ContactForm({ user }: ContactFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: user.id,
            subject,
            message
          }
        ]);

      if (error) throw error;

      toast({
        title: "پیام ارسال شد",
        description: "پیام شما با موفقیت ارسال شد."
      });

      // Reset form
      setSubject('');
      setMessage('');

      // Refresh the page to show the new message
      window.location.reload();

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطا در ارسال پیام",
        description: "متأسفانه در ارسال پیام خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1 text-gray-200">
          موضوع
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-200">
          پیام
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 h-32"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'در حال ارسال...' : 'ارسال پیام'}
      </button>
    </form>
  );
} 