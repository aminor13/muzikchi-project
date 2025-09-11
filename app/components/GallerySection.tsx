'use client';

interface GallerySectionProps {
  gallery: Array<{
    id?: string;
    type: string;
    url: string;
    title?: string;
  }>;
}

export default function GallerySection({ gallery }: GallerySectionProps) {
  const images = gallery.filter(item => item?.type === 'image' && item?.url);
  const videos = gallery.filter(item => item?.type === 'video' && item?.url);

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4 text-orange-500">گالری</h2>
      
      {/* Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((img, idx) => (
            <div 
              key={img.id || idx} 
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => {
                const galleryImages = images.map(img => ({
                  url: img.url,
                  title: img.title || ''
                }));
                window.dispatchEvent(new CustomEvent('openGallery', { 
                  detail: { images: galleryImages, startIndex: idx }
                }));
              }}
            >
              <img 
                src={img.url} 
                alt={img.title || `تصویر ${idx + 1}`} 
                className="w-32 h-32 object-cover rounded-lg border border-gray-700 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="mt-4 space-y-4">
          {videos.map((vid, idx) => {
            const youtubeMatch = vid.url.match(/(?:youtu\.be\/|youtube\.com.*v=)([^&]+)/);
            const youtubeId = youtubeMatch ? youtubeMatch[1] : null;
            const aparatMatch = vid.url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
            const aparatId = aparatMatch ? aparatMatch[1] : null;
            let thumbnail = null;

            if (youtubeId) {
              thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            } else if (aparatId) {
              thumbnail = `https://www.aparat.com/video/video/embed/videohash/${aparatId}/vt/frame.jpg`;
            }

            return (
              <a
                key={vid.id || idx}
                href={vid.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {thumbnail && (
                  <div className="relative w-32 h-20 flex-shrink-0">
                    <img src={thumbnail} alt="" className="w-full h-full object-cover rounded" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white hover:text-orange-500 transition-colors block truncate">
                    {vid.title || 'ویدئو بدون عنوان'}
                  </div>
                  <div className="text-sm text-gray-400 truncate mt-1">
                    {youtubeId ? 'YouTube' : aparatId ? 'آپارات' : 'ویدئو'}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
} 