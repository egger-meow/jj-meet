import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TinderCard from 'react-tinder-card';
import { fetchNearbyUsers, removeUser, updateLocation } from '../store/slices/userSlice';
import { swipeUser, clearMatch } from '../store/slices/swipeSlice';
import { X, Heart, Star, MapPin, Car, Bike, Info, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

function Swipe() {
  const dispatch = useDispatch();
  const { nearbyUsers, loading } = useSelector((state) => state.user);
  const { isMatch, matchedUser } = useSelector((state) => state.swipe);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    user_type: '',
    is_guide: '',
    has_car: '',
    has_motorcycle: ''
  });

  useEffect(() => {
    // Request location permission and fetch nearby users
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          dispatch(fetchNearbyUsers(filters));
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Please enable location to find nearby users');
          // Fetch without location
          dispatch(fetchNearbyUsers(filters));
        }
      );
    } else {
      dispatch(fetchNearbyUsers(filters));
    }
  }, [dispatch]);

  const handleSwipe = async (direction, userId) => {
    let swipeDirection = 'pass';
    if (direction === 'right') swipeDirection = 'like';
    if (direction === 'up') swipeDirection = 'super_like';

    const result = await dispatch(swipeUser({ userId, direction: swipeDirection }));
    
    if (swipeUser.fulfilled.match(result)) {
      dispatch(removeUser(userId));
      setCurrentIndex(currentIndex + 1);
      
      if (result.payload.isMatch) {
        // Show match modal
        toast.success('It\'s a match! 🎉');
      }
    }
  };

  const handleCardLeftScreen = (userId) => {
    // Card has left the screen
  };

  const handleRefresh = () => {
    dispatch(fetchNearbyUsers(filters));
    setCurrentIndex(0);
  };

  const applyFilters = () => {
    dispatch(fetchNearbyUsers(filters));
    setShowFilters(false);
    setCurrentIndex(0);
  };

  const currentUser = nearbyUsers[currentIndex];

  if (loading && nearbyUsers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-500">Discover</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Info size={20} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-3">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Max Distance: {filters.maxDistance}km</label>
              <input
                type="range"
                min="5"
                max="100"
                value={filters.maxDistance}
                onChange={(e) => setFilters({...filters, maxDistance: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">User Type</label>
              <select
                value={filters.user_type}
                onChange={(e) => setFilters({...filters, user_type: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="tourist">Tourists</option>
                <option value="local">Locals</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.is_guide === 'true'}
                  onChange={(e) => setFilters({...filters, is_guide: e.target.checked ? 'true' : ''})}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="ml-2 text-sm">Guides only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.has_car === 'true'}
                  onChange={(e) => setFilters({...filters, has_car: e.target.checked ? 'true' : ''})}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="ml-2 text-sm">Has car</span>
              </label>
            </div>
            <button onClick={applyFilters} className="w-full btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Swipe Cards */}
      <div className="flex justify-center items-center px-4 py-8">
        {nearbyUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No more users nearby</p>
            <button onClick={handleRefresh} className="btn-primary">
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            {nearbyUsers.slice(currentIndex, currentIndex + 3).reverse().map((user, index) => (
              <TinderCard
                key={user.id}
                className="absolute w-full"
                onSwipe={(dir) => handleSwipe(dir, user.id)}
                onCardLeftScreen={() => handleCardLeftScreen(user.id)}
                preventSwipe={['down']}
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '600px' }}>
                  {/* User Photo */}
                  <div className="h-2/3 bg-gradient-to-br from-primary-100 to-secondary-100 relative">
                    {user.profile_photo ? (
                      <img 
                        src={user.profile_photo} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-6xl font-bold text-white">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    
                    {/* User Type Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                        {user.user_type === 'local' ? '📍 Local' : user.user_type === 'tourist' ? '✈️ Tourist' : '🌍 Both'}
                      </span>
                      {user.is_guide && (
                        <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Guide
                        </span>
                      )}
                    </div>

                    {/* Distance */}
                    {user.distance && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {Math.round(user.distance)}km
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold">{user.name}, {calculateAge(user.birth_date)}</h2>
                      <div className="flex gap-2">
                        {user.has_car && (
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Car size={16} className="text-gray-600" />
                          </div>
                        )}
                        {user.has_motorcycle && (
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Bike size={16} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {user.bio && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{user.bio}</p>
                    )}

                    {user.languages && user.languages.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {user.languages.map((lang, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}

                    {user.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">{user.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({user.rating_count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </TinderCard>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-8" style={{ marginTop: '620px' }}>
              <button
                onClick={() => currentUser && handleSwipe('left', currentUser.id)}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X size={28} className="text-red-500" />
              </button>
              <button
                onClick={() => currentUser && handleSwipe('up', currentUser.id)}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Star size={28} className="text-blue-500" />
              </button>
              <button
                onClick={() => currentUser && handleSwipe('right', currentUser.id)}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Heart size={28} className="text-green-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Match Modal */}
      {isMatch && matchedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full animate-match">
            <h2 className="text-3xl font-bold text-center mb-4">It's a Match! 🎉</h2>
            <p className="text-center text-gray-600 mb-6">
              You and {matchedUser.user2_id} liked each other!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => dispatch(clearMatch())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Keep Swiping
              </button>
              <button
                onClick={() => {
                  dispatch(clearMatch());
                  // Navigate to chat
                }}
                className="flex-1 btn-primary"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default Swipe;
