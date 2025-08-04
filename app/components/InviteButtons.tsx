'use client'

import { useState } from 'react'

interface InviteButtonsProps {
  type: 'band' | 'school'
  targetId: string
  currentUserId: string
  teacherInstruments?: { instrument_id: string }[]
}

export default function InviteButtons({ type, targetId, currentUserId, teacherInstruments }: InviteButtonsProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleBandInvite = async () => {
    try {
      const response = await fetch('/api/band-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musician_id: targetId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invite');
      }
      
      alert('دعوت با موفقیت ارسال شد');
      setShowConfirmModal(false);
    } catch (error: any) {
      console.error('Error sending band invite:', error);
      alert(error.message || 'خطا در ارسال دعوت');
    }
  };

  const handleSchoolInvite = async () => {
    try {
      const instruments = teacherInstruments?.map(i => i.instrument_id);

      const response = await fetch('/api/school-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: targetId,
          instruments,
          message: 'مایل به همکاری با شما هستیم'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invite');
      }
      
      alert('دعوت با موفقیت ارسال شد');
    } catch (error: any) {
      console.error('Error sending school invite:', error);
      alert(error.message || 'خطا در ارسال دعوت');
    }
  };

  if (type === 'band') {
    return (
      <>
        <button
          onClick={() => setShowConfirmModal(true)}
          title="دعوت به همکاری در گروه"
          className="bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </button>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">تأیید ارسال دعوت</h3>
              <p className="text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید دعوت به همکاری در گروه را ارسال کنید؟
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleBandInvite}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  ارسال دعوت
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleSchoolInvite}
      title="دعوت به همکاری در آموزشگاه"
      className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    </button>
  );
} 