import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Bell,
  ChevronDown,
  Crown,
  Sparkles
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipBadge = () => {
    // This could be based on user data or subscription status
    return (
      <div className="flex items-center space-x-1 text-xs">
        <Crown className="w-3 h-3 text-yellow-400" />
        <span className="text-yellow-400">Pro</span>
      </div>
    );
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="relative">
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-3 bg-neutral-800/60 backdrop-blur-sm rounded-xl p-3 border border-neutral-700 hover:border-neutral-600 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
            {getInitials(user?.full_name || 'User')}
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-neutral-200">
                {user?.full_name || 'User'}
              </p>
              {getMembershipBadge()}
            </div>
            <p className="text-xs text-neutral-400">@{user?.username}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-neutral-800/90 backdrop-blur-lg rounded-xl border border-neutral-700 shadow-xl overflow-hidden"
          >
            {/* User Info */}
            <div className="p-4 border-b border-neutral-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  {getInitials(user?.full_name || 'User')}
                </div>
                <div>
                  <p className="font-medium text-neutral-200">{user?.full_name}</p>
                  <p className="text-sm text-neutral-400">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Sparkles className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Active since {new Date(user?.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-700/50 transition-colors text-left">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-200">Profile Settings</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-700/50 transition-colors text-left">
                <Settings className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-200">Preferences</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-700/50 transition-colors text-left">
                <Bell className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-200">Notifications</span>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </button>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-700/50 transition-colors text-left"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-neutral-400" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-400" />
                )}
                <span className="text-sm text-neutral-200">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              <div className="border-t border-neutral-700 my-2"></div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-red-400" />
                <span className="text-sm text-neutral-200 group-hover:text-red-400">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};