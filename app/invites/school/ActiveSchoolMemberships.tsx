'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface School {
  id: string
  display_name: string
  avatar_url?: string
  description?: string
  name?: string
  category?: string
}

interface Membership {
  id: string
  school_id: string
  teacher_id: string
  status: string
  role: string
  created_at: string
  school: School
}

interface ActiveMembershipsProps {
  memberships: Membership[]
  userId: string
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveSchoolMemberships({ memberships, userId }: ActiveMembershipsProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    membershipId: string;
    schoolName: string;
  }>({
    isOpen: false,
    membershipId: '',
    schoolName: ''
  });

  const handleLeave = async (membershipId: string) => {
    try {
      setLoading(prev => ({ ...prev, [membershipId]: true }))
      
      const response = await fetch('/api/school-teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در خروج از آموزشگاه');
      }

      // رفرش صفحه
      window.location.reload();
    } catch (error: any) {
      console.error('Error leaving school:', error);
      alert(error.message || 'خطا در خروج از آموزشگاه');
    } finally {
      setLoading(prev => ({ ...prev, [membershipId]: false }));
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    }
  }

  if (memberships.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-100 rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-300">در حال حاضر عضو هیچ آموزشگاهی نیستید</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title="تایید خروج از آموزشگاه"
        message={`آیا از خروج از آموزشگاه "${modalConfig.schoolName}" اطمینان دارید؟`}
        onConfirm={() => handleLeave(modalConfig.membershipId)}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
      {memberships.map((membership) => (
        <div key={membership.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {membership.school.avatar_url && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={membership.school.avatar_url}
                    alt={membership.school.name || membership.school.display_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <Link 
                  href={`/profile/${membership.school.display_name}`}
                  className="text-xl font-semibold text-white hover:text-orange-500 transition-colors"
                >
                  {membership.school.name || membership.school.display_name}
                </Link>
                {membership.school.description && (
                  <p className="text-white mt-1 line-clamp-2">{membership.school.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  تاریخ عضویت: {new Date(membership.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setModalConfig({
                isOpen: true,
                membershipId: membership.id,
                schoolName: membership.school.name || membership.school.display_name
              })}
              disabled={loading[membership.id]}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading[membership.id] ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>خروج از آموزشگاه</span>
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 