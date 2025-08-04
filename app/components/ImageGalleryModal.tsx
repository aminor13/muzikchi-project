'use client';

import { useState, useEffect } from 'react';

interface Image {
  url: string;
  title: string;
}

export default function ImageGalleryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOpenGallery = (event: CustomEvent<{ images: Image[]; startIndex: number }>) => {
      setImages(event.detail.images);
      setCurrentIndex(event.detail.startIndex);
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('openGallery', handleOpenGallery as EventListener);
    return () => {
      window.removeEventListener('openGallery', handleOpenGallery as EventListener);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  const handleNext = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') handleClose();
    if (event.key === 'ArrowRight') handlePrev();
    if (event.key === 'ArrowLeft') handleNext();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]); // Re-add event listener when images change

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 text-white hover:text-gray-300 z-50 bg-black bg-opacity-50 p-2 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 text-white hover:text-gray-300 z-50 bg-black bg-opacity-50 p-2 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Main image */}
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <img
          src={images[currentIndex]?.url}
          alt={images[currentIndex]?.title || `تصویر ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        )}
        {images[currentIndex]?.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center">
            {images[currentIndex].title}
          </div>
        )}
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Thumbnail strip */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2">
        {images.map((image, idx) => (
          <div
            key={idx}
            onClick={() => {
              setIsLoading(true);
              setCurrentIndex(idx);
            }}
            className={`w-16 h-16 flex-shrink-0 cursor-pointer transition-all duration-200 ${
              idx === currentIndex ? 'ring-2 ring-orange-500 scale-110' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <img
              src={image.url}
              alt={image.title || `تصویر ${idx + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 