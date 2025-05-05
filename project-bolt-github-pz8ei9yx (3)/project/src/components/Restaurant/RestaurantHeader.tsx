import React,{useEffect} from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Star, Heart, Navigation, Users, Loader2 } from 'lucide-react';
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
  const [showUnfollowModal, setShowUnfollowModal] = React.useState(false);
  const { isLiked, likeCount, isLoading, handleLike } = useFavorite({
    id,
    initialLikeCount
  });

  useEffect(()=>{
    if(!isLiked){
      setShowUnfollowModal(false)
    }
  },[isLiked])

  const handleFollowClick = () => {
    if (isLiked) {
      setShowUnfollowModal(true);
    } else {
      handleLike();
    }
  };

  return (
    <>
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
          onClick={handleFollowClick}
          disabled={isLoading}
          className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            isLiked
              ? ' border-secondary text-secondary'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={16} className={isLiked ? 'fill-secondary' : ''} />
          )}
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

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setShowUnfollowModal(false)}
          />
          <div className="fixed top-[40%] left-[5%] -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-xl p-6 z-50 animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unfollow Restaurant
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unfollow <strong>{name}?</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLike();
                }}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-secondary text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Unfollowing...' : 'Unfollow'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RestaurantHeader;