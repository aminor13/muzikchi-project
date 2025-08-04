'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  type: 'band_invite' | 'join_request'
  content: {
    role?: string
    message?: string
  }
  sender: {
    name: string
    avatar_url: string
  }
  created_at: string
  read: boolean
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>

    const setupSubscription = async () => {
    // دریافت نوتیفیکیشن‌های اولیه
      await fetchNotifications()

      // دریافت اطلاعات کاربر
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

    // تنظیم real-time subscription
      channel = supabase
        .channel('custom-all-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
      supabase.removeChannel(channel)
      }
    }
  }, [])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!sender_id (
          name,
          avatar_url
        )
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data && !error) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'band_invite':
        return (
          <div className="flex items-start p-4 hover:bg-gray-50">
            <img
              src={notification.sender.avatar_url || '/default-avatar.png'}
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {notification.sender.name} شما را به گروه دعوت کرده است
              </p>
              {notification.content.role && (
                <p className="text-sm text-gray-500">
                  نقش پیشنهادی: {notification.content.role}
                </p>
              )}
              <div className="mt-2 flex space-x-2">
                <button className="text-sm text-green-600 hover:text-green-500">
                  قبول
                </button>
                <button className="text-sm text-red-600 hover:text-red-500">
                  رد
                </button>
              </div>
            </div>
          </div>
        )

      case 'join_request':
        return (
          <div className="flex items-start p-4 hover:bg-gray-50">
            <img
              src={notification.sender.avatar_url || '/default-avatar.png'}
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {notification.sender.name} درخواست عضویت در گروه داده است
              </p>
              {notification.content.role && (
                <p className="text-sm text-gray-500">
                  نقش درخواستی: {notification.content.role}
                </p>
              )}
              <div className="mt-2 flex space-x-2">
                <button className="text-sm text-green-600 hover:text-green-500">
                  تایید
                </button>
                <button className="text-sm text-red-600 hover:text-red-500">
                  رد
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                نوتیفیکیشنی وجود ندارد
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {renderNotificationContent(notification)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
