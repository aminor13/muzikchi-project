'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/use-toast';
import { Message } from './types';
import ReplyForm from './ReplyForm';

interface MessagesListProps {
  initialMessages: Message[];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export default function MessagesList({ initialMessages }: MessagesListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_read: true } : msg
      ));
      
      toast({
        title: "پیام به عنوان خوانده شده علامت‌گذاری شد"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطا در بروزرسانی وضعیت پیام",
        variant: "destructive"
      });
    }
  };

  const handleReplySuccess = (messageId: string, newReply: any) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            replies: [...(msg.replies || []), {
              ...newReply,
              formatted_time: formatTime(new Date())
            }]
          };
        }
        return msg;
      })
    );
  };

  return (
    <div className="space-y-8">
      {messages.length === 0 ? (
        <p className="text-center text-gray-400">هیچ پیامی موجود نیست</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-white">{message.subject}</h3>
                <p className="text-sm text-gray-400">
                  از طرف: {message.profiles.name} ({message.profiles.email})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!message.is_read && (
                  <button
                    onClick={() => markAsRead(message.id)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    علامت‌گذاری به عنوان خوانده شده
                  </button>
                )}
                <button
                  onClick={() => setSelectedMessageId(selectedMessageId === message.id ? null : message.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedMessageId === message.id ? 'بستن' : 'پاسخ'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Original Message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-blue-600 text-white p-4 rounded-lg">
                  <p className="text-sm">{message.message}</p>
                  <div className="text-xs mt-2 text-blue-200">
                    {formatTime(new Date(message.created_at))}
                  </div>
                </div>
              </div>

              {/* Admin Replies */}
              {message.replies && message.replies.map((reply) => (
                <div key={reply.id} className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-700 text-white p-4 rounded-lg">
                    <p className="text-sm">{reply.reply_text}</p>
                    <div className="text-xs mt-2 text-gray-400">
                      {formatTime(new Date(reply.created_at))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedMessageId === message.id && (
              <div className="mt-4">
                <ReplyForm messageId={message.id} onReplySuccess={(reply) => handleReplySuccess(message.id, reply)} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 