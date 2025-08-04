import { Suspense } from 'react';
import AdvancedSearch from './AdvancedSearch';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <Suspense 
        fallback={
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
              <div className="mt-2 text-lg text-orange-500">در حال بارگذاری...</div>
            </div>
          </div>
        }
      >
        <AdvancedSearch />
      </Suspense>
    </div>
  );
} 