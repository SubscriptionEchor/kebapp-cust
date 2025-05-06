import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerElement {
  key: string;
  text: string;
  color: string;
  image: string | null;
  gradient: string | null;
}

interface Banner {
  _id: string;
  templateId: string;
  elements: BannerElement[];
  priority: number;
  isActive: boolean;
}

interface BannerProps {
  banners?: Banner[];
}

const Banner: React.FC<BannerProps> = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (!banners.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  if (!banners.length) return null;

  const getElementByKey = (banner: Banner, key: string) => {
    return banner.elements.find(element => element.key === key);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-sm">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => {
          const titleElement = getElementByKey(banner, 'title');
          const highlightElement = getElementByKey(banner, 'highlight');
          const contentElement = getElementByKey(banner, 'content');
          const imageElement = getElementByKey(banner, 'image');
          const backgroundElement = getElementByKey(banner, 'background');

          return (
            <div
              key={banner._id}
              className="relative min-w-full h-40 flex items-center"
              style={{
                background: backgroundElement?.gradient || backgroundElement?.color || '#f8f9fa'
              }}
            >
              {/* Content Area */}
              <div className="flex-1 p-6 z-10">
                {titleElement && (
                  <h3
                    className="text-sm font-medium mb-1 animate-slide-in-right"
                    style={{ 
                      color: titleElement.color,
                      animationDelay: '100ms'
                    }}
                  >
                    {titleElement.text}
                  </h3>
                )}
                
                {highlightElement && (
                  <p
                    className="text-xl font-bold leading-tight mb-2 animate-slide-in-right"
                    style={{ 
                      color: highlightElement.color,
                      animationDelay: '200ms'
                    }}
                  >
                    {highlightElement.text}
                  </p>
                )}
                
                {contentElement && (
                  <p
                    className="text-sm animate-slide-in-right"
                    style={{ 
                      color: contentElement.color,
                      animationDelay: '300ms'
                    }}
                  >
                    {contentElement.text}
                  </p>
                )}
              </div>

              {/* Image Area */}
              {imageElement?.image && (
                <div className="w-1/3 h-full relative overflow-hidden">
                  <img
                    src={imageElement.image}
                    alt="Banner"
                    className="w-full h-full object-cover animate-scale-in"
                    style={{ animationDelay: '400ms' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-secondary w-4'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      
    </div>
  );
};

export default Banner;