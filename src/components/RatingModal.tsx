import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  restaurantName: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  restaurantName
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900">
            {t('ratings.howWas')} {restaurantName}?
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  size={32}
                  className={`transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Review Input */}
          <div className="mb-6">
            <label className="block text-[13px] font-medium text-gray-900 mb-2">
              {t('ratings.whatDidYouLike')}
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-32 p-3 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-secondary resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={() => onSubmit(rating, review)}
            disabled={rating === 0}
            className={`w-full py-3 rounded-lg text-[13px] font-medium transition-colors ${
              rating > 0
                ? 'bg-secondary text-black hover:bg-opacity-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('ratings.shareReview')}
          </button>
        </div>
      </div>
    </>
  );
};

export default RatingModal;