import { Suspense } from 'react'
import VerifyEmailContent from './VerifyEmailContent'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Suspense 
          fallback={
            <div className="text-center text-white">
              در حال بارگذاری...
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
