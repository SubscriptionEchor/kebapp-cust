import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Star, Heart, Navigation, Users } from 'lucide-react';
import { useFavorite } from '../../hooks/useFavorite';

interface RestaurantHeaderProps {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  distance: number;
  address: string;
  initialLikeCount: number;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  id,
  name,
  rating,
  reviews,
  distance,
  address,
  initialLikeCount
}) => {
  const navigate = useNavigate();
  const { isLiked, likeCount, handleLike } = useFavorite({
    id,
    initialLikeCount
  });

  return (
    <div className="bg-white p-4 mx-4 my-3 rounded-xl shadow-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{name}</h1>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center ">
          <Star size={16} className="text-emerald-600 fill-emerald-600" />
          <span className="font-semibold ml-1">{rating.toFixed(1)}</span>
          <span className="text-gray-900 ml-1">({reviews})</span>
        </div>
       
        <div className="flex items-center gap-1">
          <span className="text-gray-900">{(distance / 1000).toFixed(1)} Km</span>
        </div>
      </div>
        <div className="flex items-center gap-1 mb-2">
          <Users size={16} className="text-gray-600" />
          <span className="text-gray-600">{likeCount} Followers</span>
        </div>
      <p className="text-gray-600 text-sm mb-4">{address}</p>

      <div className="flex gap-2">
        <button
          onClick={handleLike}
          className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            isLiked
              ? 'bg-red-50 border-red-500 text-red-500'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          <Heart size={16} className={isLiked ? 'fill-red-500' : ''} />
          {isLiked ? 'Following' : 'Follow'}
        </button>
        
        <button
          onClick={() => navigate(`/restaurant/${id}/map`)}
          className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Map view
        </button>
        
        <button
          onClick={() => navigate(`/restaurant/${id}/directions`)}
          className="py-2.5 px-4 rounded-lg bg-secondary text-black hover:bg-opacity-90 transition-colors"
        >
          <Navigation className="" size={16} />
        </button>
      </div>
    </div>
  );
};

export default RestaurantHeader;