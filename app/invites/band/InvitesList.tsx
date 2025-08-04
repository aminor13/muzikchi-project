'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Band {
  id: string
  display_name: string
  avatar_url?: string
  description?: string
  name?: string
  category?: string
}

interface Invite {
  id: string
  band_id: string
  member_id: string
  status: string
  role: string
  rejected_by?: string
  created_at: string
  band: Band
}

type InviteType = "received" | "sent" | "rejected" | "self_rejected"

interface InvitesListProps {
  invites: Invite[]
  userId: string
  type: InviteType
}

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvitesList({ invites, userId, type }: InvitesListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const supabase = createClient()
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    async function getUserProfile() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      if (profile?.display_name) {
        setUserDisplayName(profile.display_name)
      }
    }

    getUserProfile()
  }, [userId])

  const handleAccept = async (inviteId: string) => {
    setLoading(prev => ({ ...prev, [inviteId]: true }));
    
    try {
      const { error } = await supabase
        .from('band_members')
        .update({ 
          status: 'accepted',
          rejected_by: null // Clear rejected_by when accepting
        })
        .eq('id', inviteId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('خطا در پذیرش دعوت. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleReject = async (inviteId: string) => {
    setLoading(prev => ({ ...prev, [inviteId]: true }));
    
    try {
      const { error } = await supabase
        .from('band_members')
        .update({ 
          status: 'rejected',
          rejected_by: userId 
        })
        .eq('id', inviteId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error rejecting invite:', error);
      alert('خطا در رد دعوت. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleDelete = async (inviteId: string) => {
    if (!confirm('آیا از حذف این درخواست اطمینان دارید؟')) return;
    
    setLoading(prev => ({ ...prev, [inviteId]: true }));
    
    try {
      const { error } = await supabase
        .from('band_members')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error deleting invite:', error);
      alert('خطا در حذف درخواست. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  if (invites.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-100 rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-300">
          {type === 'received' ? 'در حال حاضر دعوت فعالی ندارید' : 
           type === 'sent' ? 'در حال حاضر درخواست فعالی ندارید' :
           'در حال حاضر درخواست رد شده‌ای ندارید'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
      {invites.map((invite) => (
        <div key={invite.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {invite.band.avatar_url && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={invite.band.avatar_url}
                    alt={invite.band.name || invite.band.display_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-white">{invite.band.name || invite.band.display_name}</h3>
                {invite.band.description && (
                  <p className="text-white mt-1 line-clamp-2">{invite.band.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {type === 'received' ? 'تاریخ دعوت: ' : 'تاریخ درخواست: '}
                  {new Date(invite.created_at).toLocaleDateString('fa-IR')}
                </p>
                {invite.status === 'rejected' && (
                  <p className="text-sm text-red-400 mt-1">
                    {invite.rejected_by === userId ? 'شما این دعوت را رد کردید' : 'گروه این درخواست را رد کرد'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {type === 'received' ? (
                <>
                  {invite.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAccept(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-green-500 text-white w-10 h-10 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                        title="قبول دعوت"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-red-500 text-white w-10 h-10 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                        title="رد دعوت"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                  {invite.status === 'rejected' && invite.rejected_by === userId && (
                    <>
                      <button
                        onClick={() => handleAccept(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="پذیرش مجدد"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>پذیرش مجدد</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="حذف کامل"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>حذف کامل</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              ) : type === 'sent' ? (
                <>
                  {invite.status === 'requested' && (
                    <button
                      onClick={() => handleDelete(invite.id)}
                      disabled={loading[invite.id]}
                      className="bg-gray-800 border border-amber-500 text-white w-10 h-10 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                      title="لغو درخواست"
                    >
                      {loading[invite.id] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  )}
                  {invite.status === 'rejected' && invite.rejected_by !== userId && (
                    <button
                      onClick={() => handleDelete(invite.id)}
                      disabled={loading[invite.id]}
                      className="bg-gray-800 border border-amber-500 text-white w-10 h-10 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                      title="حذف درخواست"
                    >
                      {loading[invite.id] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {invite.rejected_by === userId && (
                    <>
                      <button
                        onClick={() => handleAccept(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="پذیرش مجدد"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>پذیرش مجدد</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(invite.id)}
                        disabled={loading[invite.id]}
                        className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="حذف کامل"
                      >
                        {loading[invite.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>حذف کامل</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 