import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../store/slices/matchSlice';
import { MessageCircle, MapPin, Car, Bike, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function Matches() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matches, loading } = useSelector((state) => state.match);

  useEffect(() => {
    dispatch(fetchMatches());
  }, [dispatch]);

  const handleChatClick = (matchId) => {
    navigate(`/chat/${matchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 border-b">
        <h1 className="text-xl font-bold text-primary-500">Matches</h1>
      </div>

      {/* Matches List */}
      <div className="px-4 py-4">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No matches yet</p>
            <p className="text-sm text-gray-400">Keep swiping to find your travel companion!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.match_id}
                onClick={() => handleChatClick(match.match_id)}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Profile Photo */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0">
                    {match.profile_photo ? (
                      <img
                        src={match.profile_photo}
                        alt={match.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                        {match.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{match.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {match.user_type === 'local' ? '📍 Local' : match.user_type === 'tourist' ? '✈️ Tourist' : '🌍 Both'}
                          </span>
                          {match.is_guide && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                              Guide
                            </span>
                          )}
                          <div className="flex gap-1">
                            {match.has_car && <Car size={14} className="text-gray-500" />}
                            {match.has_motorcycle && <Bike size={14} className="text-gray-500" />}
                          </div>
                        </div>
                      </div>
                      <MessageCircle size={20} className="text-gray-400" />
                    </div>

                    {match.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-1">{match.bio}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Matched {formatDistanceToNow(new Date(match.matched_at), { addSuffix: true })}
                      </span>
                      {match.last_active && (
                        <span className="text-xs text-gray-400">
                          Active {formatDistanceToNow(new Date(match.last_active), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;
