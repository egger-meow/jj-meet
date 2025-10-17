import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, logout } from '../store/slices/authSlice';
import { Camera, Edit, MapPin, Car, Bike, Star, Languages, Heart, LogOut, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: user?.bio || '',
    languages: user?.languages || [],
    interests: user?.interests || [],
    has_car: user?.has_car || false,
    has_motorcycle: user?.has_motorcycle || false,
    is_guide: user?.is_guide || false,
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch(updateUser(data.user));
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 pb-20">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Profile Photo */}
          <div className="flex justify-center -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 border-4 border-white shadow-lg">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full shadow-lg">
                <Camera size={16} />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{user?.name}, {user?.birth_date && calculateAge(user.birth_date)}</h2>
            <p className="text-gray-600">{user?.email}</p>
            
            <div className="flex justify-center gap-3 mt-3">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {user?.user_type === 'local' ? '📍 Local' : user?.user_type === 'tourist' ? '✈️ Tourist' : '🌍 Both'}
              </span>
              {user?.is_guide && (
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                  Guide
                </span>
              )}
              {user?.is_verified && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Shield size={14} /> Verified
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">0</p>
                <p className="text-sm text-gray-600">Trips</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">{user?.rating || 0}</p>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">{user?.rating_count || 0}</p>
                <p className="text-sm text-gray-600">Reviews</p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full btn-primary mb-6 flex items-center justify-center gap-2"
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Bio */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Heart size={16} className="text-primary-500" /> About Me
              </h3>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Tell others about yourself..."
                />
              ) : (
                <p className="text-gray-600">{user?.bio || 'No bio yet'}</p>
              )}
            </div>

            {/* Transportation */}
            <div>
              <h3 className="font-semibold mb-2">Transportation</h3>
              {isEditing ? (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.has_car}
                      onChange={(e) => setEditData({...editData, has_car: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 mr-2"
                    />
                    <Car size={16} className="mr-2" /> I have a car
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.has_motorcycle}
                      onChange={(e) => setEditData({...editData, has_motorcycle: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 mr-2"
                    />
                    <Bike size={16} className="mr-2" /> I have a motorcycle
                  </label>
                </div>
              ) : (
                <div className="flex gap-3">
                  {user?.has_car && (
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                      <Car size={14} /> Car
                    </span>
                  )}
                  {user?.has_motorcycle && (
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                      <Bike size={14} /> Motorcycle
                    </span>
                  )}
                  {!user?.has_car && !user?.has_motorcycle && (
                    <span className="text-gray-500">No vehicles</span>
                  )}
                </div>
              )}
            </div>

            {/* Guide Option */}
            {(user?.user_type === 'local' || user?.user_type === 'both') && (
              <div>
                <h3 className="font-semibold mb-2">Guide Services</h3>
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.is_guide}
                      onChange={(e) => setEditData({...editData, is_guide: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 mr-2"
                    />
                    I'm available as a local guide
                  </label>
                ) : (
                  <p className="text-gray-600">
                    {user?.is_guide ? '✅ Available as a guide' : '❌ Not available as a guide'}
                  </p>
                )}
              </div>
            )}

            {/* Languages */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Languages size={16} className="text-primary-500" /> Languages
              </h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.languages.join(', ')}
                  onChange={(e) => setEditData({...editData, languages: e.target.value.split(', ')})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="English, Spanish, Mandarin..."
                />
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {user?.languages?.length > 0 ? (
                    user.languages.map((lang, i) => (
                      <span key={i} className="bg-gray-100 px-3 py-1 rounded-lg text-sm">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No languages specified</span>
                  )}
                </div>
              )}
            </div>

            {/* Interests */}
            <div>
              <h3 className="font-semibold mb-2">Interests</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.interests.join(', ')}
                  onChange={(e) => setEditData({...editData, interests: e.target.value.split(', ')})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Hiking, Food, Photography..."
                />
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {user?.interests?.length > 0 ? (
                    user.interests.map((interest, i) => (
                      <span key={i} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No interests specified</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 btn-primary"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
