import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { 
  ArrowLeft, Bell, Shield, MapPin, Eye, Heart, 
  HelpCircle, FileText, LogOut, ChevronRight, 
  ToggleLeft, ToggleRight, Globe, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [settings, setSettings] = useState({
    notifications: {
      matches: true,
      messages: true,
      likes: true,
      nearbyUsers: false
    },
    privacy: {
      showDistance: true,
      showLastActive: true,
      showOnlineStatus: true,
      hideProfile: false
    },
    discovery: {
      maxDistance: 50,
      ageRange: { min: 18, max: 55 },
      showMe: 'everyone', // everyone, tourists, locals
      onlyVerified: false
    }
  });

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
    toast.success('Setting updated');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button onClick={onToggle} className="text-primary-500">
      {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center border-b">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold ml-2">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Account Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Account</h2>
          </div>
          <div className="divide-y">
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  {user?.profile_photo ? (
                    <img src={user.profile_photo} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="text-gray-600" size={20} />
                <span>Verification Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">
                  {user?.is_verified ? 'Verified' : 'Not Verified'}
                </span>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <span>New Matches</span>
              <ToggleSwitch 
                enabled={settings.notifications.matches}
                onToggle={() => handleToggle('notifications', 'matches')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Messages</span>
              <ToggleSwitch 
                enabled={settings.notifications.messages}
                onToggle={() => handleToggle('notifications', 'messages')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>New Likes</span>
              <ToggleSwitch 
                enabled={settings.notifications.likes}
                onToggle={() => handleToggle('notifications', 'likes')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Nearby Travelers</span>
              <ToggleSwitch 
                enabled={settings.notifications.nearbyUsers}
                onToggle={() => handleToggle('notifications', 'nearbyUsers')}
              />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Eye size={20} /> Privacy
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p>Show Distance</p>
                <p className="text-xs text-gray-500">Others can see how far you are</p>
              </div>
              <ToggleSwitch 
                enabled={settings.privacy.showDistance}
                onToggle={() => handleToggle('privacy', 'showDistance')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p>Show Last Active</p>
                <p className="text-xs text-gray-500">Display when you were last online</p>
              </div>
              <ToggleSwitch 
                enabled={settings.privacy.showLastActive}
                onToggle={() => handleToggle('privacy', 'showLastActive')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p>Online Status</p>
                <p className="text-xs text-gray-500">Show when you're online</p>
              </div>
              <ToggleSwitch 
                enabled={settings.privacy.showOnlineStatus}
                onToggle={() => handleToggle('privacy', 'showOnlineStatus')}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-red-600">Hide Profile</p>
                <p className="text-xs text-gray-500">Temporarily hide from discovery</p>
              </div>
              <ToggleSwitch 
                enabled={settings.privacy.hideProfile}
                onToggle={() => handleToggle('privacy', 'hideProfile')}
              />
            </div>
          </div>
        </div>

        {/* Discovery Preferences */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Heart size={20} /> Discovery Preferences
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span>Maximum Distance</span>
                <span className="text-sm text-gray-500">{settings.discovery.maxDistance} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                value={settings.discovery.maxDistance}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  discovery: { ...prev.discovery, maxDistance: e.target.value }
                }))}
                className="w-full"
              />
            </div>
            
            <div className="px-4 py-3">
              <p className="mb-2">Show Me</p>
              <div className="grid grid-cols-3 gap-2">
                {['everyone', 'tourists', 'locals'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      discovery: { ...prev.discovery, showMe: option }
                    }))}
                    className={`py-2 px-3 rounded-lg capitalize ${
                      settings.discovery.showMe === option
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p>Only Verified Users</p>
                <p className="text-xs text-gray-500">Show only verified profiles</p>
              </div>
              <ToggleSwitch 
                enabled={settings.discovery.onlyVerified}
                onToggle={() => handleToggle('discovery', 'onlyVerified')}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm">
          <button className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="text-gray-600" size={20} />
              <div className="text-left">
                <p className="font-medium">Location Settings</p>
                <p className="text-sm text-gray-500">Manage location permissions</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Support & Legal */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Support & Legal</h2>
          </div>
          <div className="divide-y">
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <HelpCircle className="text-gray-600" size={20} />
                <span>Help Center</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="text-gray-600" size={20} />
                <span>Safety Tips</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-600" size={20} />
                <span>Terms of Service</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-600" size={20} />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-3 text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          <span className="font-medium">Log Out</span>
        </button>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">JJ-Meet v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">Made with ❤️ for travelers</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
