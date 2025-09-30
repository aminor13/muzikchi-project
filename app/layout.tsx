import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/700.css'
import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/context/userContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import ErrorBoundary from '@/app/components/ErrorBoundary'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'موزیکچی - پلتفرم جستجوی نوازنده، خواننده، گروه و ...',
  description: 'پلتفرم ارتباط موزیسین‌ها و گروه‌های موسیقی',
  icons: {
    icon: '/icons/icon.ico',
    shortcut: '/icons/icon.ico',
    apple: '/icons/icon.ico',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`font-vazir min-h-screen bg-gray-100`}>
        {/* <ErrorBoundary> */}
          <UserProvider>
            <Header />
            {children}
            <Footer />
            <Toaster />
            <BottomNav />
          </UserProvider>
        {/* </ErrorBoundary> */}
      </body>
    </html>
  )
} 