'use client'

import ProfileWizardStep1 from '@/components/ProfileWizardStep1'

export default function CreateProfilePage() {
  return (
    <div className="min-h-screen bg-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-10">
        {/* <h1 className="text-gray-50 text-center text-2xl font-bold mb-1">ثبت‌نام در سایت</h1> */}
        <ProfileWizardStep1 />
      </div>
    </div>
  )
}