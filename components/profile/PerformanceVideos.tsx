import ProfileSection from './ProfileSection'
import { Database } from '@/types/supabase'

type Video = Database['public']['Tables']['videos']['Row']

function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

interface PerformanceVideosProps {
  videos: Video[] | null
}

export default function PerformanceVideos({ videos }: PerformanceVideosProps) {
  if (!videos?.length) return null;

  return (
    <ProfileSection title="ویدئوهای اجرا">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => {
          const videoId = getYouTubeVideoId(video.url);
          if (!videoId) return null;

          return (
            <div key={video.id} className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{video.title}</h3>
                {video.description && (
                  <p className="text-gray-600 text-sm">{video.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ProfileSection>
  );
} 