import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-amber-500 mb-4">صفحه مورد نظر پیدا نشد</h2>
        <p className="text-gray-300 mb-6">متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.</p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
} 