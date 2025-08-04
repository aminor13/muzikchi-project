'use client'

export default function EventImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex-shrink-0 w-48">
      <div className="relative aspect-[3/4] w-full">
        <img
          src={src}
          alt={alt}
          className="rounded-lg object-cover w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-poster.jpg';
            target.onerror = null;
          }}
        />
      </div>
    </div>
  )
} 