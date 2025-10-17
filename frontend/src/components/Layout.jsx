import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Heart, MessageCircle, User, MapPin } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="md:flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 bg-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-500">JJ-Meet</h1>
            <p className="text-sm text-gray-600 mt-1">Travel & Connect</p>
          </div>
          <nav className="flex-1 px-4">
            <NavLink
              to="/swipe"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
                }`
              }
            >
              <MapPin size={20} />
              <span>Discover</span>
            </NavLink>
            <NavLink
              to="/matches"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
                }`
              }
            >
              <Heart size={20} />
              <span>Matches</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
                }`
              }
            >
              <User size={20} />
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/swipe"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 ${
                isActive ? 'text-primary-500' : 'text-gray-500'
              }`
            }
          >
            <MapPin size={20} />
            <span className="text-xs">Discover</span>
          </NavLink>
          <NavLink
            to="/matches"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 ${
                isActive ? 'text-primary-500' : 'text-gray-500'
              }`
            }
          >
            <Heart size={20} />
            <span className="text-xs">Matches</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 ${
                isActive ? 'text-primary-500' : 'text-gray-500'
              }`
            }
          >
            <User size={20} />
            <span className="text-xs">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default Layout;
