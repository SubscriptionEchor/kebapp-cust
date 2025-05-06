import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react';
import successAnimation from '../assets/animations/review-success.json';

const Review: React.FC = () => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    // Handle review submission
    console.log({ rating, review });
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 flex items-center justify-center">
      <div className="flex flex-col items-center w-full max-w-md">
        {!isSubmitted ? (
          <>
        {/* Restaurant Icon */}
        <div className="w-12 h-12 bg-[#FFCD38] rounded-full flex items-center justify-center mb-6">
          <span className="text-black text-xl">🍽️</span>
        </div>

        {/* Question */}
        <h2 className="text-xl font-medium text-gray-900 mb-6">
          How was Gasthaus kater Alex?
        </h2>

        {/* Star Rating */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
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

        {/* Review Text */}
        <div className="w-full mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Thanks! Would you like to write a review too?
          </p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you like or dislike?"
            className="w-full h-32 p-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary resize-none bg-gray-50"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-[#00B37A] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          Share review
        </button>
          </>
        ) : (
          <div className="text-center">
            {/* Success Animation */}
            <div className="w-20 h-20 mx-auto mb-6">
              <Lottie animationData={successAnimation} loop={false} />
            </div>
            
            {/* Restaurant Icon */}
            <div className="w-12 h-12 bg-[#FFCD38] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-black text-xl">🍽️</span>
            </div>
            
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Gasthaus says
            </h2>
            
            <p className="text-gray-600 mb-4">
              Thank you for sharing your feedback and rating!
            </p>
            
            <p className="text-gray-600 mb-8">
              We appreciate your support and look forward to serving you again soon. Your feedback helps us keep the flavor experience top-notch!
            </p>
            
            <button
              onClick={() => window.history.back()}
              className="w-full py-3.5 bg-[#00B37A] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Review;